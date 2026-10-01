// 版面检测的页面端取数 + 判定，在真实浏览器里跑一个手写的小 deck：
// 文字超出画布、两段文字互相压住、文字被不透明卡片盖住、文字被自己的 overflow 裁掉、「万元万元」紧挨重复，都要命中；
// 水印（低透明度 / aria-hidden / 大号 pointer-events:none）、跑马灯、序号水印出血都不能误报。
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { tmpDir } from './helpers.mjs';
import { detectBrowser } from '../app/lib/browser-detect.mjs';
import { withDeckBrowser, openDeckPage, SLIDE_SELECTOR } from '../app/lib/browser-session.mjs';
import { readLayoutProbe, PROBE_MAX_ITEMS } from '../app/lib/layout-probe.mjs';
import { analyzeSlideLayout } from '../app/lib/layout-check.mjs';

const root = tmpDir('imago-layout-');
after(() => fs.rmSync(root, { recursive: true, force: true }));

/** 把 body 放进一个 1920×1080 的 slide（scale 为 2 时放进 960×540 的 slide，内部坐标按 960 设计），在浏览器里取数并判定。 */
async function probeSlide(name, body, props, { slideSize = [1920, 1080] } = {}) {
  const browser = await detectBrowser();
  if (!browser.found) return null;
  const dir = path.join(root, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><meta charset="utf-8">
<style>
  html, body { margin: 0; background: #fff; font-family: sans-serif; }
  .slide { position: relative; width: ${slideSize[0]}px; height: ${slideSize[1]}px; overflow: hidden; display: none; }
  .slide.active { display: block; }
  .slide * { box-sizing: border-box; }
  .t { position: absolute; margin: 0; white-space: nowrap; }
  @keyframes run { from { transform: translateX(0); } to { transform: translateX(-400px); } }
</style>
<div id="deck"><section class="slide active" data-vm-layout="theme03_page022">${body}</section></div>`);
  return withDeckBrowser({ deckPptDir: dir, browserPath: browser.path, tmpBase: root }, async ({ browser: b, url }) => {
    const { page, context } = await openDeckPage(b, url);
    try {
      await page.waitForTimeout(200);
      const data = await page.evaluate(readLayoutProbe, { selector: SLIDE_SELECTOR, maxItems: PROBE_MAX_ITEMS });
      return { probe: data, issues: analyzeSlideLayout({ index: 0, layout: 'theme03_page022', probe: data, props }) };
    } finally {
      await context.close();
    }
  });
}

const timeout = { timeout: 120000 };

test('浏览器：文字超出画布右缘 → TEXT_OVERFLOW，定位到字段', timeout, async () => {
  const out = await probeSlide('overflow', '<p class="t" style="left:1700px;top:200px;font-size:60px">十六点签到入场仪式</p>', { agenda: { first: '十六点签到入场仪式' } });
  if (!out) return;
  assert.deepEqual(out.issues.map(item => [item.code, item.field, item.fixable]), [['TEXT_OVERFLOW', 'agenda.first', true]]);
});

test('浏览器：两段文字互相压住 → TEXT_OVERLAP；正常排版不报', timeout, async () => {
  const bad = await probeSlide('overlap', '<p class="t" style="left:200px;top:300px;font-size:60px">年度营收增长故事</p><p class="t" style="left:260px;top:310px;font-size:48px">同比增长百分之三十</p>', { a: '年度营收增长故事', b: '同比增长百分之三十' });
  if (!bad) return;
  assert.deepEqual(bad.issues.map(item => item.code), ['TEXT_OVERLAP']);
  const good = await probeSlide('no-overlap', '<p class="t" style="left:200px;top:300px;font-size:60px">年度营收增长故事</p><p class="t" style="left:200px;top:420px;font-size:48px">同比增长百分之三十</p>', { a: '年度营收增长故事', b: '同比增长百分之三十' });
  assert.deepEqual(good.issues, []);
});

test('浏览器：文字被后面画上来的不透明卡片盖住 → TEXT_OVERFLOW（被盖住）；卡片在文字下面不报', timeout, async () => {
  const card = '<div class="t" style="left:100px;top:500px;width:800px;height:400px;background:#222"></div>';
  const text = '<p class="t" style="left:150px;top:460px;font-size:60px;line-height:150px;white-space:normal;width:300px">被卡片盖住一半的两行字</p>';
  const covered = await probeSlide('covered', text + card, { t: '被卡片盖住一半的两行字' });
  if (!covered) return;
  assert.deepEqual(covered.issues.map(item => item.code), ['TEXT_OVERFLOW']);
  assert.match(covered.issues[0].message, /盖住/);
  const under = await probeSlide('under', card + text.replace('<p class="t"', '<p class="t" style="z-index:5"').replace('style="left:150px;top:460px', 'style="left:150px;top:560px'), { t: '被卡片盖住一半的两行字' });
  assert.deepEqual(under.issues, [], '文字在卡片之上、在卡片里面');
});

test('浏览器：文字自己 overflow:hidden 被裁 → TEXT_OVERFLOW；无限滚动的跑马灯不报', timeout, async () => {
  const clipped = await probeSlide('clip', '<div class="t" style="left:200px;top:300px;width:150px;overflow:hidden;font-size:40px">这一行文字比盒子宽得多得多</div>', { line: '这一行文字比盒子宽得多得多' });
  if (!clipped) return;
  assert.deepEqual(clipped.issues.map(item => item.code), ['TEXT_OVERFLOW']);
  assert.match(clipped.issues[0].message, /被裁掉/);
  const marquee = await probeSlide('marquee', '<div class="t" style="left:200px;top:300px;width:150px;overflow:hidden;font-size:40px"><span style="display:inline-block;animation:run 3s linear infinite">滚动的字幕滚动的字幕滚动的字幕</span></div>', { line: '滚动的字幕滚动的字幕滚动的字幕' });
  assert.deepEqual(marquee.issues, []);
});

test('浏览器：装饰巨字不误报——低透明度出血水印、aria-hidden 大字、pointer-events:none 的大号背景字、序号水印出血', timeout, async () => {
  const body = [
    '<p class="t" style="left:-200px;top:700px;font-size:700px;opacity:0.04;pointer-events:none">2026</p>',
    '<p class="t" aria-hidden="true" style="left:1400px;top:-100px;font-size:500px;opacity:0.9">荣光</p>',
    '<p class="t" style="left:100px;top:100px;font-size:400px;opacity:0.5;pointer-events:none;color:#ddd">MONTHLY</p>',
    '<div class="t" style="left:900px;top:200px;width:300px;height:300px;overflow:hidden;background:#eee"><p class="t" style="left:-20px;top:-30px;font-size:260px;opacity:0.16">02</p></div>',
    '<p class="t" style="left:300px;top:400px;font-size:60px">今年最想说的一句话</p>',
  ].join('');
  const out = await probeSlide('decor', body, { a: '今年最想说的一句话' });
  if (!out) return;
  assert.deepEqual(out.issues, []);
});

test('浏览器：相邻两个 span 把「万元」写了两遍 → DUP_TEXT；坐标与字号按 1920 基准换算（slide 只有 960 宽也一样）', timeout, async () => {
  const body = '<p class="t" style="left:200px;top:300px;font-size:30px"><span>7860 万元</span><span>万元</span></p>';
  const out = await probeSlide('dup', body, { value: '7860 万元', unit: '万元' });
  if (!out) return;
  assert.deepEqual(out.issues.map(item => [item.code, item.fixable]), [['DUP_TEXT', true]]);
  const small = await probeSlide('scaled', '<p class="t" style="left:850px;top:100px;font-size:30px">超出画布右缘的一行字</p>', { x: '超出画布右缘的一行字' }, { slideSize: [960, 540] });
  assert.ok(Math.abs(small.probe.scale - 2) < 0.01, `960 宽的 slide 放到 1920 基准是 2 倍，实际 ${small.probe.scale}`);
  assert.ok(Math.abs(small.probe.items[0].fontSize - 60) < 0.5, '字号也按 2 倍换算');
  assert.ok(Math.abs(small.probe.items[0].rect[0] - 1700) < 2);
  assert.deepEqual(small.issues.map(item => item.code), ['TEXT_OVERFLOW']);
});

test('浏览器：探测数据的形状——每个元素带 1920 基准的矩形、字号、有效透明度、祖先关系', timeout, async () => {
  const out = await probeSlide('shape', '<div class="t" style="left:100px;top:100px;opacity:0.5"><span style="font-size:50px">外层</span> 里面的字</div>', { a: '里面的字' });
  if (!out) return;
  const [outer, inner] = out.probe.items;
  assert.equal(outer.text, '里面的字');
  assert.equal(inner.text, '外层');
  assert.deepEqual(inner.anc, [outer.id]);
  assert.ok(Math.abs(outer.opacity - 0.5) < 0.01 && Math.abs(inner.opacity - 0.5) < 0.01, '有效透明度含祖先');
  assert.ok(Math.abs(inner.fontSize - 50) < 0.5);
  assert.equal(out.probe.truncated, false);
  assert.ok(Array.isArray(out.probe.lines) && out.probe.lines.length >= 1);
});
