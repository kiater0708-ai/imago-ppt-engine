#!/usr/bin/env node
// 截图等待策略对比：同一份 deck 用「固定等 1.5 秒」与「自适应等待」各截一遍，逐像素比较。
// 用法：node scripts/compare-shots.mjs --deck <含 ppt/index.html 的目录> --out <输出目录>
// 输出每页差异像素占比（任一通道差 >0 计为不同；另给差 >16/255 的占比），以及两种策略的总耗时。
import fs from 'node:fs';
import path from 'node:path';
import { detectBrowser } from '../app/lib/browser-detect.mjs';
import { withDeckBrowser, openDeckPageForShots, captureShots } from '../app/lib/browser-session.mjs';
import { requireFromRuntime } from '../app/lib/paths.mjs';

const arg = name => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const deck = arg('--deck');
const out = arg('--out');
if (!deck || !out || !path.isAbsolute(deck) || !path.isAbsolute(out)) {
  console.error('用法：node scripts/compare-shots.mjs --deck <绝对路径> --out <绝对路径>');
  process.exit(2);
}

export function diffImages(pngjs, fileA, fileB) {
  const a = pngjs.PNG.sync.read(fs.readFileSync(fileA));
  const b = pngjs.PNG.sync.read(fs.readFileSync(fileB));
  if (a.width !== b.width || a.height !== b.height) return { sizeMismatch: true };
  let any = 0;
  let big = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const m = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]));
    if (m > 0) any += 1;
    if (m > 16) big += 1;
  }
  const px = a.width * a.height;
  return { anyPct: (100 * any) / px, bigPct: (100 * big) / px };
}

const browser = await detectBrowser();
if (!browser.found) {
  console.error('没有找到浏览器');
  process.exit(3);
}
const pptDir = fs.existsSync(path.join(deck, 'ppt', 'index.html')) ? path.join(deck, 'ppt') : deck;
const pngjs = requireFromRuntime('pngjs');
const timing = {};
await withDeckBrowser({ deckPptDir: pptDir, browserPath: browser.path, tmpBase: out }, async ({ browser: b, url }) => {
  for (const strategy of ['fixed1500', 'adaptive']) {
    const { page, context, total } = await openDeckPageForShots(b, url);
    const started = Date.now();
    const { waits } = await captureShots(page, total, path.join(out, strategy), { waitStrategy: strategy, expectFullSize: true });
    timing[strategy] = { totalMs: Date.now() - started, pages: total, avgWaitMs: Math.round(waits.reduce((s, v) => s + v, 0) / waits.length), maxWaitMs: Math.max(...waits) };
    await context.close();
  }
});
const rows = [];
for (const name of fs.readdirSync(path.join(out, 'fixed1500')).filter(n => /^p\d+\.png$/.test(n)).sort()) {
  rows.push({ page: name, ...diffImages(pngjs, path.join(out, 'fixed1500', name), path.join(out, 'adaptive', name)) });
}
const worst = rows.reduce((m, r) => Math.max(m, r.anyPct ?? 100), 0);
console.log(JSON.stringify({ timing, worstAnyPct: worst, allBelow0_5: rows.every(r => !r.sizeMismatch && r.anyPct < 0.5), rows }, null, 1));
