// 审计的浏览器部分：复用 app/lib 的静态服务、浏览器启动、翻页、动画快进与稳定读取，
// 每页取可见文字行、可见元素引用的资源路径、元素几何快照，并截一张缩略图。
import fs from 'node:fs';
import path from 'node:path';
import { withDeckBrowser, openDeckPage, walkSlides, fastForwardAnimations, extractSlideTexts, SLIDE_SELECTOR } from '../../app/lib/browser-session.mjs';
import { ensureDir } from '../../app/lib/fsutil.mjs';

/** 页面里执行：取当前激活页的可见文字行、资源路径、元素几何（1920 宽基准）。geometry=false 时不取几何。 */
function readActiveSlide({ selector, geometry }) {
  const slide = document.querySelector(`${selector}.active`) || document.querySelectorAll(selector)[0];
  const visible = el => {
    if (typeof el.checkVisibility === 'function') {
      try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { /* 退回手工判断 */ }
    }
    const style = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && box.width > 0 && box.height > 0;
  };
  if (geometry) {
    // 无限循环的环境动画（跑马灯、光斑漂移）每次读到的位置都不同：定格在起始姿态，保证两次渲染的几何可比
    for (const animation of document.getAnimations()) {
      try {
        const timing = animation.effect?.getComputedTiming?.();
        if (timing && (timing.iterations === Infinity || timing.endTime === Infinity)) {
          animation.pause();
          animation.currentTime = 0;
        }
      } catch { /* 个别动画不能定格，跳过 */ }
    }
    const g = window.gsap;
    if (g?.globalTimeline?.getChildren) {
      for (const child of g.globalTimeline.getChildren(true, true, true)) {
        try {
          if (child.repeat?.() === -1) child.pause(0);
        } catch { /* 个别补间不能定格，跳过 */ }
      }
    }
  }
  const text = slide.innerText.replace(/\s+/g, ' ').trim();
  const lines = slide.innerText.split('\n').map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const resources = new Set();
  const urlsIn = value => {
    if (!value || value === 'none') return;
    for (const match of String(value).matchAll(/url\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/g)) resources.add(match[1] || match[2] || match[3]);
  };
  const rects = [];
  const slideBox = slide.getBoundingClientRect();
  const scale = slideBox.width > 0 ? 1920 / slideBox.width : 1;
  const transparent = value => !value || value === 'transparent' || /^rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0\s*\)$/.test(value);
  for (const el of [slide, ...slide.querySelectorAll('*')]) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'script' || tag === 'style' || tag === 'link' || tag === 'meta') continue;
    if (!visible(el)) continue;
    const style = getComputedStyle(el);
    for (const attr of ['src', 'poster', 'href', 'xlink:href', 'data']) {
      const value = el.getAttribute?.(attr);
      if (value && tag !== 'a') resources.add(value);
    }
    urlsIn(style.backgroundImage);
    urlsIn(style.maskImage || style.webkitMaskImage);
    urlsIn(style.listStyleImage);
    if (!geometry) continue;
    const ownText = [...el.childNodes].some(node => node.nodeType === 3 && node.nodeValue.trim());
    const hasBox = !transparent(style.backgroundColor)
      || (style.backgroundImage && style.backgroundImage !== 'none')
      || ['Top', 'Right', 'Bottom', 'Left'].some(side => parseFloat(style[`border${side}Width`]) > 0 && style[`border${side}Style`] !== 'none' && !transparent(style[`border${side}Color`]));
    if (!ownText && !hasBox) continue;
    const box = el.getBoundingClientRect();
    rects.push([(box.left - slideBox.left) * scale, (box.top - slideBox.top) * scale, box.width * scale, box.height * scale]);
  }
  return { text, layout: slide.dataset.vmLayout || '', lines, resources: [...resources], rects: geometry ? rects : null };
}

/** 对整套 deck 做一次取数：每页 {index, layout, text, lines, resources, rects|null, waitedMs}；shotsDir 给了就每页截一张 jpg。 */
export async function auditDeck({ deckPptDir, browserPath, tmpBase, geometry = false, shotsDir = null, log = () => {} }) {
  return withDeckBrowser({ deckPptDir, browserPath, tmpBase }, async ({ browser, url }) => {
    const { page, context, total } = await openDeckPage(browser, url);
    try {
      const pages = await extractSlideTexts(page, total, null, {
        reader: p => p.evaluate(readActiveSlide, { selector: SLIDE_SELECTOR, geometry }),
      });
      const shots = [];
      if (shotsDir) {
        ensureDir(shotsDir);
        await walkSlides(page, total, async index => {
          const file = path.join(shotsDir, `s${String(index).padStart(3, '0')}.jpg`);
          try {
            await fastForwardAnimations(page);
            await page.locator(SLIDE_SELECTOR).nth(index).screenshot({ path: file, type: 'jpeg', quality: 70 });
            if (!fs.existsSync(file) || fs.statSync(file).size <= 0) throw new Error('截图文件为空');
            shots[index] = file;
          } catch (error) {
            log(`第 ${index + 1} 页截图失败：${String(error.message || error).split('\n')[0]}`);
            shots[index] = null;
          }
        }, { instant: true });
      }
      return pages.map((item, index) => ({ ...item, shot: shots[index] || null }));
    } finally {
      await context.close().catch(() => {});
    }
  });
}

/** 总览图：打开 dir/index.html（sheet.mjs 生成的页面），把每个 section.sheet 截成 outFiles[i]（jpg）。 */
export async function renderSheets({ dir, browserPath, tmpBase, outFiles }) {
  return withDeckBrowser({ deckPptDir: dir, browserPath, tmpBase }, async ({ browser, url }) => {
    const context = await browser.newContext({ viewport: { width: 2000, height: 1600 }, deviceScaleFactor: 1 });
    try {
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.evaluate(() => document.fonts.ready);
      const count = await page.locator('section.sheet').count();
      if (count !== outFiles.length) throw new Error(`页面里有 ${count} 张总览，应为 ${outFiles.length} 张`);
      for (let i = 0; i < count; i += 1) {
        ensureDir(path.dirname(outFiles[i]));
        await page.locator('section.sheet').nth(i).screenshot({ path: outFiles[i], type: 'jpeg', quality: 82 });
        if (!fs.existsSync(outFiles[i]) || fs.statSync(outFiles[i]).size <= 0) throw new Error(`总览图没有生成：${outFiles[i]}`);
      }
      return { sheets: count };
    } finally {
      await context.close().catch(() => {});
    }
  });
}
