#!/usr/bin/env node
// 版式自动审计：把主题里的版式用「标记 props」渲染一遍，找出写死文字、图片主体、品牌图标，
// 并找出只改外观的 select 控件；结论写进 app/curation/themeNN.json，另出总览图与报告。
// 用法：node scripts/audit-layouts.mjs --theme theme11 | --all   [--out <目录>] [--concurrency 2] [--no-controls] [--dry-run] [--only a,b] [--limit N] [--keep-shots]
// 独立脚本，不改插件协议与现有命令行为；不联网、不调模型。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine } from '../app/lib/layouts.mjs';
import { loadCuration } from '../app/lib/curation.mjs';
import { detectBrowser } from '../app/lib/browser-detect.mjs';
import { ensureDir, writeFileAtomic, writeJsonAtomic } from '../app/lib/fsutil.mjs';
import { killAllActive } from '../app/lib/proc.mjs';
import { runCleanups } from '../app/lib/cleanup.mjs';
import { auditTheme } from './audit/theme-audit.mjs';
import { writeCuration } from './audit/curation-write.mjs';
import { buildSheetsHtml } from './audit/sheet.mjs';
import { renderSheetImages } from './audit/runner.mjs';
import { buildReportJson, buildReportMd, buildReadme, formatDuration, summarize } from './audit/report.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const THEME_RE = /^theme\d{2}$/;
const MAX_RENDER_FAIL_RATIO = 0.5; // 渲染失败超过一半多半是环境问题，不动清单

export function parseArgs(argv) {
  const args = { themes: [], all: false, out: path.join(ROOT, 'audit'), concurrency: 2, controls: true, dryRun: false, only: null, limit: null, keepShots: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = () => {
      if (i + 1 >= argv.length) throw new Error(`参数 ${arg} 缺少取值`);
      i += 1;
      return argv[i];
    };
    if (arg === '--theme') args.themes.push(...value().split(',').map(item => item.trim()).filter(Boolean));
    else if (arg === '--all') args.all = true;
    else if (arg === '--out') args.out = path.resolve(value());
    else if (arg === '--concurrency') args.concurrency = Number(value());
    else if (arg === '--no-controls') args.controls = false;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--only') args.only = value().split(',').map(item => item.trim()).filter(Boolean);
    else if (arg === '--limit') args.limit = Number(value());
    else if (arg === '--keep-shots') args.keepShots = true;
    else throw new Error(`不认识的参数：${arg}`);
  }
  if (!args.all && !args.themes.length) throw new Error('要指定 --theme themeNN（可逗号分隔多个）或 --all');
  if (args.all && args.themes.length) throw new Error('--all 与 --theme 不能同时用');
  for (const theme of args.themes) if (!THEME_RE.test(theme)) throw new Error(`主题 id 格式不对：${theme}`);
  if (!Number.isInteger(args.concurrency) || args.concurrency < 1 || args.concurrency > 4) throw new Error('--concurrency 必须是 1–4 的整数');
  if (args.limit !== null && (!Number.isInteger(args.limit) || args.limit < 1)) throw new Error('--limit 必须是正整数');
  return args;
}

function log(message) {
  process.stderr.write(`${message}\n`);
}

function cleanSheets(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (/^sheet-\d+\.jpg$/.test(name)) fs.rmSync(path.join(dir, name), { force: true });
  }
}

/** 总览图：写页面 → 截图。失败只记日志（报告与清单不受影响）。返回生成的张数。 */
async function makeSheets(result, themeDir, shotsRoot, { browserPath, workRoot }) {
  const cells = Object.values(result.layouts).sort((a, b) => a.layout.localeCompare(b.layout)).map(entry => ({
    layout: entry.layout,
    shot: result.shots[entry.layout] ? path.basename(result.shots[entry.layout]) : null,
    categories: entry.categories,
    manual: Boolean(entry.manual),
    uncertain: !entry.categories.length && entry.uncertain.length > 0,
    error: entry.status === 'renderFailed' ? entry.error : undefined,
  }));
  if (!cells.length) return 0;
  const { html, sheetCount } = buildSheetsHtml(cells);
  writeFileAtomic(path.join(shotsRoot, 'index.html'), html);
  const outFiles = Array.from({ length: sheetCount }, (_, i) => path.join(themeDir, `sheet-${String(i + 1).padStart(2, '0')}.jpg`));
  cleanSheets(themeDir);
  await renderSheetImages({ dir: shotsRoot, outFiles, browserPath, workRoot });
  return sheetCount;
}

async function runTheme(theme, engine, args, browserPath) {
  const themeDir = path.join(args.out, theme);
  const shotsRoot = path.join(themeDir, '.shots');
  const workRoot = path.join(args.out, '.work');
  ensureDir(themeDir);
  fs.rmSync(shotsRoot, { recursive: true, force: true });
  ensureDir(workRoot);
  const curation = loadCuration(theme);
  const result = await auditTheme({ engine, theme, curation, browserPath, workRoot, shotsRoot, concurrency: args.concurrency, controls: args.controls, limit: args.limit, only: args.only, log });

  const counts = summarize(result);
  let curationChange = null;
  const partial = Boolean(args.limit || args.only);
  if (args.dryRun || partial) {
    log(`${theme}：${partial ? '带了 --limit/--only，只审计了一部分，' : ''}不写版式清单${args.dryRun ? '（--dry-run）' : ''}`);
  } else if (counts.audited && counts.renderFailed / counts.audited > MAX_RENDER_FAIL_RATIO) {
    log(`${theme}：渲染失败 ${counts.renderFailed}/${counts.audited}，超过一半，疑似环境问题，不写版式清单`);
  } else {
    const merged = writeCuration(theme, result, { engine });
    curationChange = { added: merged.addedExclude.length, removed: merged.removedAuto.length, styleControls: merged.styleControlCount, droppedForContract: merged.droppedForContract };
    if (merged.droppedForContract.length) log(`${theme}：${merged.droppedForContract.length} 个 styleControls 因契约超 1500 字符没有写入：${merged.droppedForContract.map(item => `${item.layout}.${item.key}`).join('、')}`);
    log(`${theme}：清单写入：新增自动排除 ${curationChange.added}、清掉旧自动排除 ${curationChange.removed}、styleControls ${curationChange.styleControls}`);
  }

  let sheets = 0;
  try {
    sheets = await makeSheets(result, themeDir, shotsRoot, { browserPath, workRoot });
  } catch (error) {
    log(`${theme}：总览图生成失败（不影响报告与清单）：${error.message}`);
  }
  writeJsonAtomic(path.join(themeDir, 'report.json'), buildReportJson(result, { curationChange }));
  writeFileAtomic(path.join(themeDir, 'report.md'), buildReportMd(result, { curationChange }));
  if (!args.keepShots) fs.rmSync(shotsRoot, { recursive: true, force: true });
  return { counts, timings: result.timings, sheets, curationChange, batchFailures: result.batchFailures.length };
}

/** 读各主题目录下的 report.json，重写汇总 README。读不了的主题跳过并记日志。 */
function writeReadme(outDir) {
  const reports = [];
  for (const name of fs.readdirSync(outDir).sort()) {
    if (!THEME_RE.test(name)) continue;
    const file = path.join(outDir, name, 'report.json');
    if (!fs.existsSync(file)) continue;
    try {
      reports.push(JSON.parse(fs.readFileSync(file, 'utf8')));
    } catch (error) {
      log(`汇总：读不了 ${file}（${error.message}），已跳过`);
    }
  }
  writeFileAtomic(path.join(outDir, 'README.md'), buildReadme(reports));
  return reports.length;
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    log(`参数错误：${error.message}`);
    process.exit(2);
  }
  const onSignal = signal => {
    log(`收到 ${signal}，结束子进程并清理临时目录`);
    try { killAllActive(); } catch { /* 尽力而为 */ }
    try { runCleanups(); } catch { /* 尽力而为 */ }
    process.exit(130);
  };
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, () => onSignal(signal));

  const browser = await detectBrowser();
  if (!browser.found) {
    log('没有找到 Edge / Chrome（可用环境变量 IMAGO_PPT_BROWSER 指定），无法审计');
    process.exit(3);
  }
  let engine;
  try {
    engine = await loadEngine();
  } catch (error) {
    log(`加载版式引擎失败：${error.message}`);
    process.exit(1);
  }
  const known = engine.THEME_PACKS.map(pack => pack.key).sort();
  const themes = args.all ? known : args.themes;
  const unknown = themes.filter(theme => !known.includes(theme));
  if (unknown.length) {
    log(`主题不存在：${unknown.join('、')}（可用：${known.join('、')}）`);
    process.exit(2);
  }
  if (args.only) {
    const allKeys = new Set(engine.THEME_PAGES.filter(page => themes.includes(page.themeKey)).map(page => page.key));
    const missing = args.only.filter(key => !allKeys.has(key));
    if (missing.length) {
      log(`--only 里的版式不属于所选主题：${missing.join('、')}`);
      process.exit(2);
    }
  }
  ensureDir(args.out);
  const started = Date.now();
  const summary = [];
  let failed = 0;
  for (const theme of themes) {
    const t0 = Date.now();
    try {
      const done = await runTheme(theme, engine, args, browser.path);
      summary.push({ theme, ...done, ms: Date.now() - t0 });
      const c = done.counts;
      log(`${theme} 完成：版式 ${c.total}，审计 ${c.audited}，写死文字 ${c.hardcoded}，图片主体 ${c.media}，品牌图标 ${c.brandIcon}，待确认 ${c.uncertain}，渲染失败 ${c.renderFailed}，可随机控件 ${c.styleControls}，耗时 ${formatDuration(Date.now() - t0)}`);
    } catch (error) {
      failed += 1;
      log(`${theme} 审计失败：${error?.message || error}`);
    }
  }
  try {
    log(`汇总 README 已更新（${writeReadme(args.out)} 套主题）`);
  } catch (error) {
    failed += 1;
    log(`汇总 README 写失败：${error.message}`);
  }
  fs.rmSync(path.join(args.out, '.work'), { recursive: true, force: true });
  log(`全部结束：${themes.length} 套，失败 ${failed} 套，总耗时 ${formatDuration(Date.now() - started)}`);
  process.stdout.write(`${JSON.stringify({ themes: summary, failed, totalMs: Date.now() - started })}\n`);
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    log(`审计异常退出：${error?.stack || error}`);
    process.exit(1);
  });
}
