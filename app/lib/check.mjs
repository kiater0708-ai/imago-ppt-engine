// check 命令：把 goal 复制进 workDir 再处理（不改原文件），顺序：
// 数值规整 → 完整性 → write-safe-props → validate-goal-spec → 渲染 → swiss → goal-copy → 浏览器可见文字残留。
// 校验发现的内容问题不算失败（按 issues 返回）；校验流程自身失败（脚本崩溃、超时、没输出）才抛 RENDER_FAILED。
import fs from 'node:fs';
import path from 'node:path';
import { RUNTIME_DIR, SCRIPTS_DIR, RENDER_BUNDLE, RENDER_SOURCE } from './paths.mjs';
import { PluginError, classifyErrnoText, errnoFromText } from './errors.mjs';
import { createTaskTmp } from './tasktmp.mjs';
import { registerCleanup } from './cleanup.mjs';
import { runProcess } from './proc.mjs';
import { progress, log } from './protocol.mjs';
import { readJson, sameFile, tail, ensureRealDir, assertNoLinksInside, assertPlainFileOrMissing, writeJsonAtomic, removeOutputDir } from './fsutil.mjs';
import { loadEngine } from './layouts.mjs';
import { checkGoalCompleteness } from './completeness.mjs';
import { normalizeNumbers } from './rounding.mjs';
import { bulletLines, issuesFromValidatorLine, safePropsErrors } from './issues.mjs';
import { detectBrowser } from './browser-detect.mjs';
import { runWorker } from './worker-client.mjs';

export const RENDER_TIMEOUT_MS = 120000;
export const BROWSER_CHECK_TIMEOUT_MS = Number(process.env.IMAGO_TEST_TIMEOUT_MS) || 180000; // IMAGO_TEST_TIMEOUT_MS 仅测试用
const VALIDATOR_TIMEOUT_MS = 120000;
const TOTAL_STEPS = 7;

/** 读 goal 并做结构检查（顶层是对象、slides 非空、每页有 layout 字符串与 props 对象）。 */
export function loadGoal(file) {
  const goal = readJson(file);
  if (!goal || typeof goal !== 'object' || Array.isArray(goal)) throw new PluginError('BAD_REQUEST', 'goal 必须是 JSON 对象', { goal: file });
  if (!Array.isArray(goal.slides) || !goal.slides.length) throw new PluginError('BAD_REQUEST', 'goal.slides 必须是非空数组', { goal: file });
  goal.slides.forEach((slide, i) => {
    if (!slide || typeof slide.layout !== 'string') throw new PluginError('BAD_REQUEST', `goal.slides[${i}].layout 必须是字符串`, { goal: file });
    if (slide.props !== undefined && (typeof slide.props !== 'object' || slide.props === null || Array.isArray(slide.props))) {
      throw new PluginError('BAD_REQUEST', `goal.slides[${i}].props 必须是对象`, { goal: file });
    }
  });
  return goal;
}

const THEME_OF_LAYOUT = /^(theme\d{2})_page\d+$/;

/**
 * 协议 v1 只支持单主题：goal 里所有 layout 必须属于同一主题，且与 themePack（如果写了）一致。
 * 认不出主题前缀的 layout 不在这里报（交给 validate-goal-spec 报 unknown layout）。
 */
export function assertSingleTheme(goal) {
  const themes = new Set();
  for (const slide of goal.slides) {
    const match = THEME_OF_LAYOUT.exec(String(slide.layout));
    if (match) themes.add(match[1]);
  }
  if (goal.themePack !== undefined && typeof goal.themePack === 'string' && goal.themePack) themes.add(goal.themePack);
  if (themes.size > 1) {
    throw new PluginError('BAD_REQUEST', `协议 v1 只支持单主题：goal 里同时出现了 ${[...themes].sort().join('、')}（版式前缀与 themePack 必须一致）。请让每份 goal 只用一个主题`, { themes: [...themes].sort() });
  }
}

export function renderCommand(goalFile, htmlFile) {
  if (fs.existsSync(RENDER_BUNDLE)) return { command: process.execPath, args: [RENDER_BUNDLE, goalFile, htmlFile], mode: 'bundle' };
  const tsxCli = path.join(RUNTIME_DIR, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  if (!fs.existsSync(tsxCli)) {
    throw new PluginError('RENDER_FAILED', '找不到预打包的渲染脚本，也没有 tsx 可回落（开发环境先运行 npm run setup；发布包应自带 render-goal-deck.bundle.mjs）', { bundle: RENDER_BUNDLE });
  }
  return { command: process.execPath, args: [tsxCli, RENDER_SOURCE, goalFile, htmlFile], mode: 'tsx' };
}

/** 跑一个大师校验脚本。超时 / 无法启动直接抛 RENDER_FAILED。 */
async function runScript(name, args, { timeoutMs = VALIDATOR_TIMEOUT_MS, env } = {}) {
  const res = await runProcess(process.execPath, [path.join(SCRIPTS_DIR, name), ...args], { cwd: RUNTIME_DIR, timeoutMs, env });
  if (res.timedOut) throw new PluginError('RENDER_FAILED', `${name} 超过 ${Math.round(timeoutMs / 1000)} 秒未完成，已终止`, { step: name, timeout: true, stderrTail: tail(res.stderr) });
  if (res.spawnError) throw new PluginError('RENDER_FAILED', `无法启动 ${name}：${res.spawnError}`, { step: name });
  return res;
}

/** 子进程失败的错误类别：stderr 里认得出磁盘 errno 就归 6，否则是流程失败。 */
function stepError(step, message, res, extra = {}) {
  const errnoClass = classifyErrnoText(`${res.stderr}\n${res.stdout}`);
  const detail = { step, code: res.code, stderrTail: tail(res.stderr), ...extra };
  if (errnoClass) return new PluginError(errnoClass, `${message}（磁盘错误 ${errnoFromText(`${res.stderr}\n${res.stdout}`)}）`, { ...detail, errno: errnoFromText(`${res.stderr}\n${res.stdout}`) });
  return new PluginError('RENDER_FAILED', message, detail);
}

function failedStep(name, res) {
  return stepError(name, `${name} 异常退出（退出码 ${res.code}${res.signal ? `，信号 ${res.signal}` : ''}），没有可解析的校验结果`, res, { stdoutTail: tail(res.stdout, 600) });
}

export async function runCheck({ goalSrc, workDir: requestedWorkDir, browserDetector = detectBrowser }) {
  const goal = loadGoal(goalSrc);
  assertSingleTheme(goal); // 先于任何写入：多主题的 goal 直接拒绝
  const workDir = ensureRealDir(requestedWorkDir);
  const goalFile = path.join(workDir, 'goal.json');
  if (sameFile(goalSrc, goalFile)) {
    throw new PluginError('BAD_REQUEST', 'workDir 里的 goal.json 就是原文件（同一个文件或硬链接）；check 不改原文件，请换一个 workDir', { goal: goalSrc, workDir });
  }
  assertNoLinksInside(workDir, 'workDir');
  assertPlainFileOrMissing(goalFile, 'workDir/goal.json');
  const taskTmp = createTaskTmp(workDir);
  const unregister = registerCleanup(() => taskTmp.cleanup());
  try {
    return await runCheckInner({ goal, goalSrc, workDir, goalFile, taskTmp, browserDetector, requestedWorkDir });
  } finally {
    unregister();
    taskTmp.cleanup();
  }
}

async function runCheckInner({ goal, goalSrc, workDir, goalFile, taskTmp, browserDetector, requestedWorkDir }) {
  const timings = {};
  const timed = async (name, fn) => {
    const started = Date.now();
    try {
      return await fn();
    } finally {
      timings[name] = Date.now() - started;
    }
  };
  let stepNo = 0;
  const step = name => progress(name, ++stepNo, TOTAL_STEPS);

  const taskEnv = { ...process.env, ...taskTmp.env() }; // 渲染与校验的临时文件、缓存都落在 workDir/.tmp/<随机>
  const pptDir = path.join(workDir, 'ppt');
  const htmlFile = path.join(pptDir, 'index.html');
  const slideLayouts = goal.slides.map(slide => slide.layout);
  const issues = [];
  const seen = new Set();
  const addIssue = issue => {
    const key = issue.field ? `${issue.index}|${issue.code}|${issue.field}` : `${issue.index}|${issue.code}|${issue.message}`;
    if (seen.has(key)) return;
    seen.add(key);
    issues.push(issue);
  };
  const addValidatorLines = (lines, opts) => lines.forEach(line => issuesFromValidatorLine(line, slideLayouts, opts).forEach(addIssue));

  // 0. 数值规整 + 复制进 workDir
  const numberChanges = [];
  goal.slides.forEach((slide, index) => {
    if (slide.props) for (const change of normalizeNumbers(slide.props, '', [])) numberChanges.push({ index, ...change });
  });
  writeJsonAtomic(goalFile, goal);
  if (numberChanges.length) log(`规整了 ${numberChanges.length} 个浮点尾差数值`);

  // 1. 完整性（程序判定）
  step('completeness');
  const engine = await loadEngine();
  const infos = new Map();
  for (const layout of new Set(slideLayouts)) {
    try { infos.set(layout, engine.inspectLayout(layout, { compact: true }) || null); } catch { infos.set(layout, null); }
  }
  const completeness = await timed('completeness', async () => {
    const result = checkGoalCompleteness(goal, infos);
    if (result.filled.length) writeJsonAtomic(goalFile, goal); // 补写了数量字段，落盘
    return result;
  });
  for (const item of completeness.errors) {
    addIssue({ index: item.index, layout: item.layout, field: item.field ?? null, code: item.code, fixable: true, message: `第 ${item.index + 1} 页（${item.layout}）：${item.message}` });
  }

  // 2. write-safe-props（会改写 goal：属性规整、版式微调）
  step('write-safe-props');
  const safe = await timed('safeProps', () => runScript('write-safe-props.mjs', ['--goal', goalFile, '--write'], { env: taskEnv }));
  // 输出必须是合法 JSON 且结构正确（无论退出码），否则是流程失败
  let safeParsed;
  try {
    safeParsed = safePropsErrors(safe.stdout, { exitOk: safe.ok, truncated: safe.truncated });
  } catch (error) {
    if (error instanceof PluginError && !safe.ok) throw failedStep('write-safe-props', safe);
    throw error;
  }
  const layoutChanges = safeParsed.data.layoutChanges || [];
  if (!safe.ok) addValidatorLines(safeParsed.lines);

  // 3. validate-goal-spec
  step('validate-goal-spec');
  const spec = await timed('goalSpec', () => runScript('validate-goal-spec.mjs', [goalFile], { env: taskEnv }));
  if (!spec.ok) {
    const lines = bulletLines(spec.stdout, spec.stderr);
    if (!lines.length) throw failedStep('validate-goal-spec', spec);
    addValidatorLines(lines);
  }

  // 返回给调用方的路径沿用请求里的写法（内部操作用的是解析过符号链接的真实路径）
  const base = { goal: path.join(requestedWorkDir, 'goal.json'), deckDir: requestedWorkDir, layoutChanges, numberChanges: numberChanges.length, filledCountKeys: completeness.filled, timings };
  if (issues.length) {
    // 内容有问题时不渲染（渲染会用同一份规则再报一遍，且可能崩溃）
    return { ok: false, ...base, rendered: false, issues };
  }

  // 4. 渲染。DASHI_PPT_THEME_RUNTIME=prebuilt：只拷贝预构建的主题 bundle，不依赖 esbuild
  step('render');
  removeOutputDir(pptDir, 'workDir/ppt'); // 整体重建：里面的硬链接只是被摘掉目录项，不会被原地改写
  const renderEnv = { ...taskEnv, DASHI_PPT_THEME_RUNTIME: 'prebuilt' };
  const cmd = renderCommand(goalFile, htmlFile);
  const render = await timed('render', () => runProcess(cmd.command, cmd.args, { cwd: RUNTIME_DIR, timeoutMs: RENDER_TIMEOUT_MS, env: renderEnv }));
  if (render.timedOut) throw new PluginError('RENDER_FAILED', `渲染超过 ${RENDER_TIMEOUT_MS / 1000} 秒未完成，已终止`, { step: 'render', timeout: true, stderrTail: tail(render.stderr) });
  if (!render.ok) throw stepError('render', `渲染失败（退出码 ${render.code}）：${tail(render.stderr || render.stdout, 600)}`, render, { mode: cmd.mode });
  if (!fs.existsSync(htmlFile)) throw new PluginError('RENDER_FAILED', `渲染退出码为 0，但没有生成 ${htmlFile}`, { step: 'render' });

  // 5. swiss（模板级检查，内容修不了）与 6. goal-copy（内容）
  step('validate-swiss');
  const swiss = await timed('swiss', () => runScript('validate-swiss-deck.mjs', [htmlFile], { env: taskEnv }));
  if (!swiss.ok) {
    const lines = bulletLines(swiss.stdout, swiss.stderr);
    if (!lines.length) throw failedStep('validate-swiss-deck', swiss);
    addValidatorLines(lines, { fixable: false });
  }
  step('validate-goal-copy');
  const copy = await timed('goalCopy', () => runScript('validate-goal-copy.mjs', [goalFile, htmlFile], { env: taskEnv }));
  if (!copy.ok) {
    const lines = bulletLines(copy.stdout, copy.stderr);
    if (!lines.length) throw failedStep('validate-goal-copy', copy);
    addValidatorLines(lines);
  }

  // 7. 浏览器里的可见文字（页面文字是浏览器运行时画的，静态 HTML 里没有）
  step('residue');
  const browser = await browserDetector();
  if (!browser.found) throw new PluginError('NO_BROWSER', '没有找到 Edge 或 Chrome，无法做浏览器可见文字检查', { tried: browser.tried });
  const residue = await timed('residue', () => runWorker('residue', { goalFile, deckPptDir: pptDir, browserPath: browser.path }, {
    tmpBase: workDir,
    timeoutMs: BROWSER_CHECK_TIMEOUT_MS, failCode: 'RENDER_FAILED', label: '浏览器检查', browserPath: browser.path,
  }));
  residue.issues.forEach(addIssue);

  return { ok: issues.length === 0, ...base, rendered: true, browser: { path: browser.path, kind: browser.kind }, slideCount: residue.slideCount, issues };
}
