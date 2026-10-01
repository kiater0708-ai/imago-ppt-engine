// 审计的渲染批处理：一批版式（同一主题、layout 不重复）→ goal → 渲染 → 浏览器取数。
// 任何一步失败都不抛给上层整套中断：整批失败就对半拆开重试，拆到单个版式仍失败才记为该版式「渲染失败」。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RUNTIME_DIR } from '../../app/lib/paths.mjs';
import { renderCommand, RENDER_TIMEOUT_MS } from '../../app/lib/check.mjs';
import { runProcess } from '../../app/lib/proc.mjs';
import { createTaskTmp } from '../../app/lib/tasktmp.mjs';
import { registerCleanup } from '../../app/lib/cleanup.mjs';
import { readJson, writeJsonAtomic, ensureDir, tail } from '../../app/lib/fsutil.mjs';

export const BATCH_SIZE = 20;
export const AUDIT_BROWSER_TIMEOUT_MS = 240000;
const WORKER = path.join(path.dirname(fileURLToPath(import.meta.url)), 'worker.mjs');

let batchCounter = 0;

function oneLine(text, max = 300) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, max);
}


/** 启动审计 worker 子进程（超时杀整棵进程树含浏览器），读回它写的结果文件。失败抛 Error（中文原因）。 */
async function invokeWorker(workerArgs, { batchDir, env, browserPath }) {
  const resultFile = path.join(batchDir, 'result.json');
  let handle = null;
  let errorEvent = null;
  const res = await runProcess(process.execPath, [WORKER], {
    cwd: RUNTIME_DIR, timeoutMs: AUDIT_BROWSER_TIMEOUT_MS, trackTree: true,
    env: { ...env, IMAGO_WORKER_ARGS: JSON.stringify({ ...workerArgs, resultFile }), CHROME_PATH: browserPath },
    onHandle: h => { handle = h; },
    onStdoutLine: line => {
      let event;
      try { event = JSON.parse(line); } catch { return; }
      if (event.event === 'pids') for (const item of event.pids || []) handle?.track(item.pid, item.command);
      else if (event.event === 'error') errorEvent = event;
    },
  });
  if (res.timedOut) throw new Error(`浏览器取数超时（${AUDIT_BROWSER_TIMEOUT_MS / 1000} 秒），已终止浏览器`);
  if (res.spawnError) throw new Error(`无法启动浏览器任务：${res.spawnError}`);
  if (errorEvent) throw new Error(`浏览器任务失败：${oneLine(errorEvent.message)}`);
  if (!res.ok) throw new Error(`浏览器任务异常退出（退出码 ${res.code}）：${oneLine(tail(res.stderr, 600))}`);
  try {
    return readJson(resultFile, 'INTERNAL');
  } catch (error) {
    throw new Error(`读不到浏览器任务结果：${oneLine(error.message)}`);
  }
}

/** 把 sheet.mjs 生成的页面截成总览图。dir 里要有 index.html；outFiles 是各张总览图的目标路径。 */
export async function renderSheetImages({ dir, outFiles, browserPath, workRoot }) {
  const batchDir = path.join(workRoot, `sheets-${process.pid}-${(batchCounter += 1)}`);
  ensureDir(batchDir);
  const taskTmp = createTaskTmp(batchDir);
  const unregister = registerCleanup(() => { taskTmp.cleanup(); fs.rmSync(batchDir, { recursive: true, force: true }); });
  try {
    const env = { ...process.env, ...taskTmp.env() };
    return await invokeWorker({ task: 'sheets', dir, deckPptDir: dir, browserPath, tmpBase: taskTmp.dir, outFiles }, { batchDir, env, browserPath });
  } finally {
    unregister();
    taskTmp.cleanup();
    try { fs.rmSync(batchDir, { recursive: true, force: true }); } catch { /* 临时目录删不掉不影响结果 */ }
  }
}

/**
 * 渲染一批并取数。slides：[{layout, props}]。成功返回 pages 数组（与 slides 一一对应），失败抛 Error（message 为中文原因）。
 * opts：{ workRoot, theme, browserPath, geometry, shotsDir }。
 */
export async function renderBatch(slides, { workRoot, theme, browserPath, geometry = false, shotsDir = null, seq = null }) {
  const id = seq ?? (batchCounter += 1);
  const batchDir = path.join(workRoot, `b${process.pid}-${id}`);
  ensureDir(batchDir);
  const taskTmp = createTaskTmp(batchDir);
  const unregister = registerCleanup(() => { taskTmp.cleanup(); fs.rmSync(batchDir, { recursive: true, force: true }); });
  try {
    const goalFile = path.join(batchDir, 'goal.json');
    const pptDir = path.join(batchDir, 'ppt');
    const htmlFile = path.join(pptDir, 'index.html');
    writeJsonAtomic(goalFile, {
      title: '版式审计', goal: '版式审计', audience: '审计', owner: '审计', randomSeed: 'audit',
      pageCount: slides.length, themePack: theme,
      slides: slides.map(slide => ({ layout: slide.layout, props: slide.props })),
    });
    const env = { ...process.env, ...taskTmp.env(), DASHI_PPT_THEME_RUNTIME: 'prebuilt' };
    const cmd = renderCommand(goalFile, htmlFile);
    const render = await runProcess(cmd.command, cmd.args, { cwd: RUNTIME_DIR, timeoutMs: RENDER_TIMEOUT_MS, env });
    if (render.timedOut) throw new Error(`渲染超时（${RENDER_TIMEOUT_MS / 1000} 秒）`);
    if (render.spawnError) throw new Error(`无法启动渲染：${render.spawnError}`);
    if (!render.ok) throw new Error(`渲染失败（退出码 ${render.code}）：${oneLine(tail(render.stderr || render.stdout, 800))}`);
    if (!fs.existsSync(htmlFile)) throw new Error('渲染退出码为 0，但没有生成 index.html');

    const data = await invokeWorker({ deckPptDir: pptDir, browserPath, tmpBase: taskTmp.dir, geometry, shotsDir }, { batchDir, env, browserPath });
    if (!Array.isArray(data.pages) || data.pages.length !== slides.length) {
      throw new Error(`浏览器里有 ${data.pages?.length ?? 0} 页，应为 ${slides.length} 页`);
    }
    data.pages.forEach((page, index) => {
      if (page.layout && page.layout !== slides[index].layout) throw new Error(`第 ${index + 1} 页的版式是 ${page.layout}，应为 ${slides[index].layout}`);
    });
    return data.pages;
  } finally {
    unregister();
    taskTmp.cleanup();
    try { fs.rmSync(batchDir, { recursive: true, force: true }); } catch { /* 临时目录删不掉不影响结果 */ }
  }
}

/**
 * 整批失败就对半拆开重试，隔离出真正渲染失败的版式。
 * run(slides) → pages，失败抛 Error。返回 Map(layout → {page}|{error})。
 */
export async function runWithBisect(slides, run, results = new Map(), onSplit = () => {}) {
  if (!slides.length) return results;
  try {
    const pages = await run(slides);
    slides.forEach((slide, index) => results.set(slide.layout, { page: pages[index] }));
    return results;
  } catch (error) {
    const message = String(error?.message || error);
    if (slides.length === 1) {
      results.set(slides[0].layout, { error: message });
      return results;
    }
    onSplit(slides.length, message);
    const mid = Math.ceil(slides.length / 2);
    await runWithBisect(slides.slice(0, mid), run, results, onSplit);
    await runWithBisect(slides.slice(mid), run, results, onSplit);
    return results;
  }
}

export function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}
