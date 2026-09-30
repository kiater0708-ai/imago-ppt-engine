// 各命令的实现。每个命令返回 result 事件里除 event/ok 外的字段。
import fs from 'node:fs';
import path from 'node:path';
import { PluginError } from './errors.mjs';
import { PROTOCOL_VERSION, progress } from './protocol.mjs';
import { pluginVersion, APP_DIR } from './paths.mjs';
import { requireAbsolute, requireString } from './request.mjs';
import { detectBrowser } from './browser-detect.mjs';
import { loadCuration } from './curation.mjs';
import { loadEngine, listThemes, assertTheme, prepareLayouts, buildCatalog, buildContracts } from './layouts.mjs';
import { runCheck } from './check.mjs';
import { runWorker } from './worker-client.mjs';
import { ensureDir, copyFile, samePath } from './fsutil.mjs';

export const ENGINE_NAME = 'html-deck-to-pptx 0.2.7+imago';
export const EXPORT_TIMEOUT_MS = Number(process.env.IMAGO_TEST_TIMEOUT_MS) || 300000; // IMAGO_TEST_TIMEOUT_MS 仅测试用

export async function cmdInfo() {
  const { version, protocol } = pluginVersion();
  const engine = await loadEngine();
  const browser = await detectBrowser();
  return {
    pluginVersion: version,
    protocol,
    engine: ENGINE_NAME,
    themes: listThemes(engine),
    browser: { found: browser.found, path: browser.path, kind: browser.kind },
  };
}

function themeFromRequest(engine, request) {
  const theme = requireString(request, 'theme', /^theme\d{2}$/);
  assertTheme(engine, theme);
  return theme;
}

export async function cmdCatalog(request) {
  const engine = await loadEngine();
  const theme = themeFromRequest(engine, request);
  if (request.seed === undefined || (typeof request.seed !== 'string' && typeof request.seed !== 'number') || request.seed === '') {
    throw new PluginError('BAD_REQUEST', '请求字段 seed 必须是非空字符串或数字');
  }
  const sampleRatio = request.sampleRatio === undefined ? 0.7 : request.sampleRatio;
  if (typeof sampleRatio !== 'number' || !(sampleRatio > 0 && sampleRatio <= 1)) {
    throw new PluginError('BAD_REQUEST', '请求字段 sampleRatio 必须是 (0, 1] 之间的数字');
  }
  const curation = loadCuration(theme);
  const { keys, candidates, excluded } = prepareLayouts(engine, theme, curation);
  if (!candidates.size) throw new PluginError('INTERNAL', `主题 ${theme} 筛选后没有可用版式`);
  const { layouts, coverCandidates, groupStats } = buildCatalog(candidates, { seed: request.seed, sampleRatio, notes: curation.notes });
  const excludedByReason = {};
  for (const item of excluded) excludedByReason[item.category] = (excludedByReason[item.category] || 0) + 1;
  return {
    theme,
    seed: request.seed,
    layouts,
    coverCandidates,
    stats: {
      total: keys.length,
      excluded: excluded.length,
      excludedByReason,
      excludedLayouts: excluded,
      candidates: candidates.size,
      sampled: layouts.length,
      sampleRatio,
      coverCandidates: coverCandidates.length,
      roleGroups: groupStats,
    },
  };
}

export async function cmdContracts(request) {
  const engine = await loadEngine();
  const theme = themeFromRequest(engine, request);
  if (!Array.isArray(request.layouts) || !request.layouts.length || request.layouts.some(item => typeof item !== 'string')) {
    throw new PluginError('BAD_REQUEST', '请求字段 layouts 必须是非空的版式 id 字符串数组');
  }
  const curation = loadCuration(theme);
  const { candidates, excluded } = prepareLayouts(engine, theme, curation);
  const excludedMap = new Map(excluded.map(item => [item.layout, item]));
  const unknown = [];
  const unusable = [];
  for (const id of request.layouts) {
    if (candidates.has(id)) continue;
    if (excludedMap.has(id)) unusable.push({ layout: id, reason: excludedMap.get(id).reason });
    else unknown.push(id);
  }
  if (unknown.length) throw new PluginError('BAD_REQUEST', `这些版式不属于主题 ${theme}：${unknown.join(', ')}`, { unknown });
  if (unusable.length) throw new PluginError('BAD_REQUEST', `这些版式已被排除，不能出契约：${unusable.map(item => item.layout).join(', ')}`, { unusable });
  const { contracts, oversize } = buildContracts(engine, candidates, [...new Set(request.layouts)], curation);
  return { theme, contracts, oversize };
}

export async function cmdCheck(request) {
  const goalSrc = requireAbsolute(request.goal, 'goal');
  const workDir = requireAbsolute(request.workDir, 'workDir');
  return runCheck({ goalSrc, workDir });
}

/** deckDir 下要有 ppt/index.html（check 的输出结构）；也接受直接给 ppt 目录（含 index.html）。 */
export function resolveDeckPptDir(deckDir) {
  const nested = path.join(deckDir, 'ppt');
  if (fs.existsSync(path.join(nested, 'index.html'))) return nested;
  if (fs.existsSync(path.join(deckDir, 'index.html'))) return deckDir;
  throw new PluginError('BAD_REQUEST', `deckDir 下找不到 ppt/index.html：${deckDir}（先跑 check）`, { deckDir });
}

export async function cmdExport(request, { browserDetector = detectBrowser } = {}) {
  const deckDir = requireAbsolute(request.deckDir, 'deckDir');
  const pptx = requireAbsolute(request.pptx, 'pptx');
  if (path.extname(pptx).toLowerCase() !== '.pptx') throw new PluginError('BAD_REQUEST', `请求字段 pptx 必须以 .pptx 结尾：${pptx}`);
  if (fs.existsSync(pptx) && fs.statSync(pptx).isDirectory()) throw new PluginError('BAD_REQUEST', `pptx 指向的是目录：${pptx}`);
  const shotsDir = request.shotsDir === undefined ? path.join(deckDir, 'shots') : requireAbsolute(request.shotsDir, 'shotsDir');
  for (const key of ['title', 'author', 'application']) {
    if (request[key] !== undefined && typeof request[key] !== 'string') throw new PluginError('BAD_REQUEST', `请求字段 ${key} 必须是字符串`);
  }
  const deckPptDir = resolveDeckPptDir(deckDir);
  const browser = await browserDetector();
  if (!browser.found) throw new PluginError('NO_BROWSER', '没有找到 Edge 或 Chrome，无法导出', { tried: browser.tried });
  const started = Date.now();
  progress('export', 0, 100);
  const result = await runWorker('export', {
    deckPptDir, pptx, shotsDir, title: request.title, author: request.author, application: request.application,
    browserPath: browser.path, tmpBase: deckDir, waitStrategy: request.waitStrategy === 'fixed1500' ? 'fixed1500' : 'adaptive',
  }, { timeoutMs: EXPORT_TIMEOUT_MS, failCode: 'EXPORT_FAILED', label: '导出', browserPath: browser.path });
  return {
    pptx: result.pptx,
    pages: result.pages,
    slideCount: result.slideCount,
    warnings: result.warnings,
    durationMs: Date.now() - started,
    browser: { path: browser.path, kind: browser.kind },
  };
}

export async function cmdSelftest(request) {
  const workDir = requireAbsolute(request.workDir, 'workDir');
  const goalSrc = path.join(APP_DIR, 'selftest', 'goal.json');
  if (!fs.existsSync(goalSrc)) throw new PluginError('INTERNAL', `缺少内置自检 goal：${goalSrc}`);
  ensureDir(workDir);
  const started = Date.now();
  const steps = {};
  const checkDir = path.join(workDir, 'check');
  const t1 = Date.now();
  const check = await runCheck({ goalSrc, workDir: checkDir });
  steps.check = Date.now() - t1;
  if (!check.ok) {
    return { ok: false, stage: 'check', steps, issues: check.issues, durationMs: Date.now() - started };
  }
  const t2 = Date.now();
  const exported = await cmdExport({ protocol: PROTOCOL_VERSION, deckDir: check.deckDir, pptx: path.join(workDir, 'selftest.pptx'), shotsDir: path.join(workDir, 'shots'), title: '插件自检' });
  steps.export = Date.now() - t2;
  return { ok: true, steps, checkTimings: check.timings, pptx: exported.pptx, pages: exported.pages, slideCount: exported.slideCount, durationMs: Date.now() - started };
}

export { copyFile, samePath };
