// 版面检测的页面端取数：在浏览器里量当前激活页每个「有直接文字的元素」的真实文字范围、字号、有效透明度、
// 是否被自己的 overflow 裁掉。只量不判，判定在 layout-check.mjs（纯函数，方便单测与离线校准）。
// 注意：readLayoutProbe 会被序列化后送进页面执行，必须自包含（不能引用本文件里的其他变量）。

export const CANVAS_W = 1920;
export const CANVAS_H = 1080;
export const PROBE_MAX_ITEMS = 800;

/**
 * 页面里执行。返回：
 * { scale, designScale, lines:[innerText 按换行切开的行], items:[{id, text, tag, rect:[x,y,w,h], lineRects:[[x,y,w,h]…],
 *   fontSize, opacity, ariaHidden, pointerNone, anc:[祖先 item id], clipX, clipY, clipRatioX, clipRatioY, ellipsis,
 *   clipBox:[x,y,w,h]|null（最近的、设了 overflow:hidden/clip 的祖先的可见范围，不含幻灯片本身）,
 *   covered（0–1，文字取样点里被「画在它上面的不透明元素」盖住的比例）}], truncated }
 * 坐标一律换算到 1920×1080 画布（slide 左上角为原点）。
 */
export function readLayoutProbe({ selector, maxItems }) {
  const slide = document.querySelector(`${selector}.active`) || document.querySelectorAll(selector)[0];
  if (!slide) throw new Error('页面里没有幻灯片');
  const slideBox = slide.getBoundingClientRect();
  if (!(slideBox.width > 0)) throw new Error('幻灯片宽度为 0，无法换算坐标');
  const scale = 1920 / slideBox.width;
  const designScale = 1920 / (slide.offsetWidth || slideBox.width); // 页面内部按设计宽度排版时，字号要按这个比例换成 1920 基准
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'META']);
  const visible = el => {
    if (typeof el.checkVisibility === 'function') {
      try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { /* 退回手工判断 */ }
    }
    const style = getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0;
  };
  const alphaOf = value => {
    const match = /^rgba?\(([^)]*)\)$/.exec(String(value || '').trim());
    if (!match) return value === 'transparent' ? 0 : 1;
    const parts = match[1].split(/[\s,\/]+/).filter(Boolean);
    return parts.length >= 4 ? Number(parts[3]) : 1;
  };
  const infinite = el => {
    try {
      return el.getAnimations({ subtree: true }).some(animation => {
        const timing = animation.effect?.getComputedTiming?.();
        return timing && (timing.iterations === Infinity || timing.endTime === Infinity);
      });
    } catch { return false; }
  };
  const toCanvas = box => [(box.left - slideBox.left) * scale, (box.top - slideBox.top) * scale, box.width * scale, box.height * scale];
  const clips = style => ['hidden', 'clip'].includes(style.overflowX) || ['hidden', 'clip'].includes(style.overflowY);
  const clipperCache = new Map();
  /** 最近的裁切祖先：{box(去掉边框的可见范围), el}，没有（或只有幻灯片自己 / 无限滚动的跑马灯）返回 null。 */
  const clipperOf = start => {
    for (let node = start.parentElement; node && node !== slide && node !== document.body; node = node.parentElement) {
      if (clipperCache.has(node)) {
        const hit = clipperCache.get(node);
        if (hit !== undefined) return hit;
        continue;
      }
      const nodeStyle = getComputedStyle(node);
      if (!clips(nodeStyle) || node instanceof SVGElement) { clipperCache.set(node, undefined); continue; }
      const box = node.getBoundingClientRect();
      const result = infinite(node) || !(box.width > 0 && box.height > 0) ? null
        : { el: node, box: toCanvas({ left: box.left + node.clientLeft * (box.width / (node.offsetWidth || box.width)), top: box.top + node.clientTop * (box.height / (node.offsetHeight || box.height)), width: node.clientWidth * (box.width / (node.offsetWidth || box.width)), height: node.clientHeight * (box.height / (node.offsetHeight || box.height)) }) };
      clipperCache.set(node, result);
      return result;
    }
    return null;
  };
  const opaqueBox = node => {
    if (node instanceof SVGElement) return false; // 图表里的图形不算「盖住文字」
    if (['IMG', 'VIDEO', 'CANVAS'].includes(node.tagName)) return true;
    const st = getComputedStyle(node);
    // 半透明的深色块也会把下面的字盖得看不清；渐变背景看所有色标的 alpha（淡入淡出的渐变遮罩有透明色标，不算）
    let solid = alphaOf(st.backgroundColor) >= 0.6;
    if (!solid && /gradient\(/.test(st.backgroundImage)) {
      const stops = [...st.backgroundImage.matchAll(/rgba?\([^)]*\)/g)].map(match => alphaOf(match[0]));
      solid = stops.length > 0 && Math.min(...stops) >= 0.6;
    }
    if (!solid) return false;
    let o = 1;
    for (let n = node; n && n !== slide.parentElement; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
    return o >= 0.6;
  };
  const related = (a, b) => a === b || a.contains(b) || b.contains(a);
  /** 取样点（每行左 / 中 / 右三点）上，画在文字之上的不透明元素占比。点落在视口外的不计。 */
  const coveredRatio = (el, lineRects) => {
    let total = 0;
    let hidden = 0;
    for (const [x, y, w, h] of lineRects.slice(0, 4)) {
      for (const fx of [0.2, 0.5, 0.8]) {
        const px = slideBox.left + (x + w * fx) / scale;
        const py = slideBox.top + (y + h / 2) / scale;
        if (px < 0 || py < 0 || px >= window.innerWidth || py >= window.innerHeight) continue;
        const stack = document.elementsFromPoint(px, py);
        // 文字自己（或它的子元素）不在命中栈里（pointer-events:none 之类）就没法判断谁在上面，这个点不计
        const self = stack.findIndex(e => e === el || el.contains(e));
        if (self < 0) continue;
        total += 1;
        if (stack.slice(0, self).some(top => !related(top, el) && opaqueBox(top))) hidden += 1;
      }
    }
    return total ? hidden / total : 0;
  };
  const ids = new WeakMap();
  const items = [];
  let truncated = false;
  const walker = document.createTreeWalker(slide, NodeFilter.SHOW_ELEMENT);
  for (let el = slide; el; el = walker.nextNode()) {
    if (SKIP.has(el.tagName)) continue;
    const own = [...el.childNodes].filter(node => node.nodeType === 3 && node.nodeValue.trim());
    if (!own.length) continue;
    if (!visible(el)) continue;
    if (items.length >= maxItems) { truncated = true; break; }
    const style = getComputedStyle(el);
    // 有效透明度 = 自己与所有祖先 opacity 的乘积 × 文字填充色的 alpha（渐变字：fill 透明但 background-clip:text，当作不透明）
    let opacity = 1;
    for (let node = el; node && node !== slide.parentElement; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
    const fill = style.webkitTextFillColor && style.webkitTextFillColor !== '' ? style.webkitTextFillColor : style.color;
    const clipText = style.webkitBackgroundClip === 'text' || style.backgroundClip === 'text';
    opacity *= alphaOf(fill) === 0 && clipText ? 1 : alphaOf(fill);
    const lineRects = [];
    let text = '';
    for (const node of own) {
      text += node.nodeValue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) {
        if (r.width > 0.5 && r.height > 0.5) lineRects.push([(r.left - slideBox.left) * scale, (r.top - slideBox.top) * scale, r.width * scale, r.height * scale]);
      }
    }
    text = text.replace(/\s+/g, ' ').trim();
    if (!lineRects.length || !text) continue;
    const x0 = Math.min(...lineRects.map(r => r[0]));
    const y0 = Math.min(...lineRects.map(r => r[1]));
    const x1 = Math.max(...lineRects.map(r => r[0] + r[2]));
    const y1 = Math.max(...lineRects.map(r => r[1] + r[3]));
    const clipsX = ['hidden', 'clip'].includes(style.overflowX);
    const clipsY = ['hidden', 'clip'].includes(style.overflowY);
    const noAnim = (clipsX || clipsY) ? !infinite(el) : true; // 跑马灯这类无限滚动的容器，被裁是设计
    const clipX = noAnim && clipsX && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 2;
    const clipY = noAnim && clipsY && el.clientHeight > 0 && el.scrollHeight > el.clientHeight + 2;
    const id = items.length;
    ids.set(el, id);
    const anc = [];
    for (let node = el.parentElement; node; node = node.parentElement) if (ids.has(node)) anc.push(ids.get(node));
    items.push({
      id,
      text,
      tag: el.tagName.toLowerCase(),
      rect: [x0, y0, x1 - x0, y1 - y0],
      lineRects: lineRects.slice(0, 60),
      fontSize: parseFloat(style.fontSize) * designScale,
      opacity,
      ariaHidden: Boolean(el.closest('[aria-hidden="true"]')),
      pointerNone: style.pointerEvents === 'none',
      anc,
      clipX,
      clipY,
      clipRatioX: clipX ? el.clientWidth / el.scrollWidth : 1,
      clipRatioY: clipY ? el.clientHeight / el.scrollHeight : 1,
      ellipsis: style.textOverflow === 'ellipsis',
      clipBox: clipperOf(el)?.box ?? null,
      covered: opacity >= 0.3 && !el.closest('[aria-hidden="true"]') ? coveredRatio(el, lineRects) : 0, // 装饰文字被盖住不算问题，不测
    });
  }
  const lines = slide.innerText.split('\n').map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
  return { scale, designScale, lines, items, truncated };
}
