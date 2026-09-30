import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runCli, tmpDir, fixture, PLUG } from './helpers.mjs';
import { requireFromRuntime } from '../app/lib/paths.mjs';

const root = tmpDir('imago-export-');
after(() => fs.rmSync(root, { recursive: true, force: true }));
const workDir = path.join(root, 'deck');
let checked = false;

async function ensureChecked() {
  if (checked) return;
  const res = await runCli('check', { request: { protocol: 1, goal: fixture('gala-deck2'), workDir } });
  assert.equal(res.last.ok, true, res.stderr.slice(0, 400));
  checked = true;
}

test('export：gala-deck2 → 16 页 PPTX + 16 张 1920×1080 PNG', { timeout: 300000 }, async () => {
  await ensureChecked();
  const pptx = path.join(root, 'out', 'gala.pptx');
  const res = await runCli('export', { request: { protocol: 1, deckDir: workDir, pptx, title: '年会' } });
  assert.equal(res.status, 0, res.stderr.slice(0, 600));
  assert.equal(res.last.event, 'result');
  assert.deepEqual(res.nonJsonLines, []);
  assert.equal(res.last.slideCount, 16);
  assert.equal(res.last.pages.length, 16);
  assert.equal(typeof res.last.warnings, 'number');
  assert.equal(typeof res.last.durationMs, 'number');
  assert.equal(res.last.pptx, pptx);
  // PPTX 是合法 zip，含 16 张幻灯片
  const JSZip = requireFromRuntime('jszip');
  const zip = await JSZip.loadAsync(fs.readFileSync(pptx));
  const slides = Object.keys(zip.files).filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name));
  assert.equal(slides.length, 16);
  // 截图：p01.png…p16.png，每张必须正好 1920×1080 像素
  const { PNG } = requireFromRuntime('pngjs');
  res.last.pages.forEach((file, i) => {
    assert.equal(path.basename(file), `p${String(i + 1).padStart(2, '0')}.png`);
    assert.equal(path.dirname(file), path.join(workDir, 'shots'));
    const png = PNG.sync.read(fs.readFileSync(file));
    assert.deepEqual([png.width, png.height], [1920, 1080], `${file} 尺寸`);
  });
  // 没有留下临时文件
  assert.deepEqual(fs.readdirSync(path.dirname(pptx)).filter(name => name.includes('.part-')), []);
});

test('export：自定义 shotsDir；重复导出会清掉旧截图', { timeout: 300000 }, async () => {
  await ensureChecked();
  const shotsDir = path.join(root, 'myshots');
  fs.mkdirSync(shotsDir, { recursive: true });
  fs.writeFileSync(path.join(shotsDir, 'p99.png'), 'stale');
  fs.writeFileSync(path.join(shotsDir, 'keep.txt'), 'x');
  const res = await runCli('export', { request: { protocol: 1, deckDir: workDir, pptx: path.join(root, 'b.pptx'), shotsDir } });
  assert.equal(res.status, 0, res.stderr.slice(0, 400));
  assert.equal(fs.existsSync(path.join(shotsDir, 'p99.png')), false);
  assert.equal(fs.existsSync(path.join(shotsDir, 'keep.txt')), true);
});

test('export：请求错误 → BAD_REQUEST（没有 ppt/index.html、pptx 扩展名不对）', async () => {
  const empty = path.join(root, 'empty');
  fs.mkdirSync(empty);
  let res = await runCli('export', { request: { protocol: 1, deckDir: empty, pptx: path.join(root, 'x.pptx') } });
  assert.equal(res.status, 2);
  assert.equal(res.last.code, 'BAD_REQUEST');
  await ensureChecked();
  res = await runCli('export', { request: { protocol: 1, deckDir: workDir, pptx: path.join(root, 'x.txt') } });
  assert.equal(res.status, 2);
});

test('没有浏览器 → NO_BROWSER（退出码 3）：export 与 check', async () => {
  await ensureChecked();
  const env = { IMAGO_TEST_NO_BROWSER: '1' };
  let res = await runCli('export', { request: { protocol: 1, deckDir: workDir, pptx: path.join(root, 'nb.pptx') }, env });
  assert.equal(res.status, 3, res.stderr.slice(0, 300));
  assert.equal(res.last.code, 'NO_BROWSER');
  assert.equal(fs.existsSync(path.join(root, 'nb.pptx')), false);
  res = await runCli('check', { request: { protocol: 1, goal: fixture('gala-deck2'), workDir: path.join(root, 'nb-check') }, env });
  assert.equal(res.status, 3, res.stderr.slice(0, 300));
  assert.equal(res.last.code, 'NO_BROWSER');
  res = await runCli('info', { env });
  assert.equal(res.last.browser.found, false);
  assert.equal(res.last.browser.path, null);
});

test('截图等待策略：自适应 vs 固定 1.5 秒，gala-deck2 16 页逐像素差异占比 < 0.5%', { timeout: 400000 }, async () => {
  await ensureChecked();
  const out = path.join(root, 'compare');
  const res = spawnSync(process.execPath, [path.join(PLUG, 'scripts', 'compare-shots.mjs'), '--deck', workDir, '--out', out], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 380000 });
  assert.equal(res.status, 0, res.stderr.slice(-500));
  const report = JSON.parse(res.stdout);
  console.error(`截图对比：最差一页差异 ${report.worstAnyPct.toFixed(4)}%；固定等待 ${report.timing.fixed1500.totalMs}ms，自适应 ${report.timing.adaptive.totalMs}ms（平均等待 ${report.timing.adaptive.avgWaitMs}ms）`);
  assert.equal(report.rows.length, 16);
  assert.ok(report.allBelow0_5, `有页面差异 ≥0.5%：${JSON.stringify(report.rows.filter(row => !(row.anyPct < 0.5)))}`);
});
