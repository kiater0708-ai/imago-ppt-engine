// 通用版面检测（纯函数）：拿页面端取到的元素几何（layout-probe.mjs）+ 我们写的 props，判出
//   TEXT_OVERFLOW  文字超出画布 / 被自己的 overflow 裁掉
//   TEXT_OVERLAP   两段可见文字互相压住
//   DUP_TEXT       可见文字里紧挨着重复同一个片段（「万元万元」）
// 都按页给 issue（{index, layout, field, code, message, fixable}），能把文字对到 props 字段就 fixable:true，由模型缩短 / 改写；找不到字段 fixable:false。
// 阈值取自 40 份真实产物的校准（见 README「版面检测」一节），宁可漏报。
import { CANVAS_W, CANVAS_H } from './layout-probe.mjs';

export const LAYOUT_CODES = ['TEXT_OVERFLOW', 'TEXT_OVERLAP', 'DUP_TEXT'];
export const MAX_PER_CODE = 3; // 同一页同一 code 最多报几条，避免刷屏
export const OVERFLOW_PX = 8; // 超出画布多少像素才算
export const OVERLAP_RATIO = 0.3; // 相交面积 ≥ 较小者面积的这个比例才算重叠
export const OVERLAP_MIN_AREA = 200; // 相交面积的绝对下限（px²），过滤指甲盖大的擦边
export const COVER_RATIO = 0.3; // 文字取样点被不透明元素盖住的比例 ≥ 它才算被盖住
export const DUP_SIZE_RATIO = 1.25;
export const MIN_OPACITY = 0.3; // 有效透明度低于它的文字当装饰
export const INK_RATIO_CJK = 0.75; // 文字的行框（字体的 ascent+descent，含上下留白）按这个比例收窄到墨迹范围：大字与小字上下紧挨时行框会重叠，字并不碰。汉字约占行框的 0.75
export const INK_RATIO_LATIN = 0.6; // 数字与拉丁字母只有大写字母高度，约占行框的 0.6
export const FAINT_OPACITY = 0.1; // 淡于它的文字是几乎看不见的水印，连「超出所在卡片」也不查
export const DECOR_FONT_PX = 160; // 重叠检测里字号大于它的文字当装饰巨字（水印 / 背景大字），不参与重叠

const stripTags = value => String(value).replace(/<[^>]+>/g, ' ');
/** 比对用的紧凑形式：去标签、去所有空白、小写（页面 text-transform 会改大小写）。 */
export const compact = value => stripTags(value).replace(/\s+/g, '').toLowerCase();

/** props 里所有文字叶子（字符串与数字），数字转成字符串：[{path, plain}]。 */
export function propLeaves(value, path = '') {
  if (typeof value === 'string') return [{ path, plain: compact(value), raw: value }];
  if (typeof value === 'number' && Number.isFinite(value)) return [{ path, plain: String(value), raw: String(value) }];
  if (Array.isArray(value)) return value.flatMap((item, i) => propLeaves(item, `${path}[${i}]`));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([key, item]) => propLeaves(item, path ? `${path}.${key}` : key));
  return [];
}

/**
 * 元素文字对应哪些 props 字段：
 * ① 字段值与元素文字相同；② 字段值（≥2 字）是元素文字的一部分（元素由多个字段拼成）；③ 元素文字（≥2 字）是字段值的一部分（字段是长文本，分到多个元素显示）。
 * 返回按字段值长度从长到短排的 [{path, plain}]；找不到返回 []。
 */
export function locateFields(text, leaves) {
  const t = compact(text);
  if (!t) return [];
  const exact = leaves.filter(leaf => leaf.plain === t);
  if (exact.length) return exact.slice(0, 1);
  const parts = leaves.filter(leaf => leaf.plain.length >= 2 && t.includes(leaf.plain));
  if (parts.length) return parts.sort((a, b) => b.plain.length - a.plain.length);
  if (t.length >= 2) return leaves.filter(leaf => leaf.plain.length > t.length && leaf.plain.includes(t)).sort((a, b) => a.plain.length - b.plain.length).slice(0, 1);
  return [];
}

/** 行框 → 墨迹范围：竖直方向按字号收窄、居中。 */
export function inkRects(item) {
  return item.lineRects.map(([x, y, w, h]) => {
    const ink = h * (/\p{Script=Han}/u.test(item.text) ? INK_RATIO_CJK : INK_RATIO_LATIN);
    return [x, y + (h - ink) / 2, w, ink];
  });
}

/** 文字里有字母或数字才算内容文字（引号、箭头、分隔线这类单个符号是装饰，被裁 / 压住不管）。 */
export const hasContent = text => /[\p{L}\p{N}]/u.test(text);

const area = rects => rects.reduce((sum, r) => sum + r[2] * r[3], 0);
function interArea(a, b) {
  let total = 0;
  for (const ra of a) {
    for (const rb of b) {
      const w = Math.min(ra[0] + ra[2], rb[0] + rb[2]) - Math.max(ra[0], rb[0]);
      const h = Math.min(ra[1] + ra[3], rb[1] + rb[3]) - Math.max(ra[1], rb[1]);
      if (w > 0 && h > 0) total += w * h;
    }
  }
  return total;
}
const boxesTouch = (a, b) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];

/**
 * 装饰判定（超出画布 / 被盖住 / 重叠都不报）：有效透明度 < 0.3（含文字填充色 alpha）、aria-hidden，
 * 或字号 > 160px 且页面把它设成不接收鼠标（pointer-events:none，水印 / 背景大字的惯用写法）。
 * 注意：字号大不单独算装饰——超大号的正文（议程被放成满屏巨字、大数字盖住小标签）正是要报的问题。
 */
export function isDecor(item) {
  return item.ariaHidden || item.opacity < MIN_OPACITY || (item.fontSize > DECOR_FONT_PX && item.pointerNone);
}

/** 文字范围超出裁切容器可见范围的量：{ox, oy, ratio}，没超出 ≥ OVERFLOW_PX 返回 null。 */
export function clipOverflow(rect, box) {
  if (!box) return null;
  const [x, y, w, h] = rect;
  const ox = Math.max(0, box[0] - x, x + w - (box[0] + box[2]));
  const oy = Math.max(0, box[1] - y, y + h - (box[1] + box[3]));
  if (ox < OVERFLOW_PX && oy < OVERFLOW_PX) return null;
  const rx = ox >= OVERFLOW_PX && w > 0 ? Math.max(0, (w - ox) / w) : 1;
  const ry = oy >= OVERFLOW_PX && h > 0 ? Math.max(0, (h - oy) / h) : 1;
  return { ox, oy, ratio: Math.min(rx, ry) };
}

/** 溢出量（1920 画布）：{ox, oy, ratio}，ratio = 还留在画布内的比例（用来估要缩短到多少字）。没溢出返回 null。 */
export function canvasOverflow(rect) {
  const [x, y, w, h] = rect;
  const left = Math.max(0, -x);
  const right = Math.max(0, x + w - CANVAS_W);
  const top = Math.max(0, -y);
  const bottom = Math.max(0, y + h - CANVAS_H);
  const ox = Math.max(left, right);
  const oy = Math.max(top, bottom);
  if (ox < OVERFLOW_PX && oy < OVERFLOW_PX) return null;
  const rx = ox >= OVERFLOW_PX && w > 0 ? Math.max(0, (w - ox) / w) : 1;
  const ry = oy >= OVERFLOW_PX && h > 0 ? Math.max(0, (h - oy) / h) : 1;
  return { ox, oy, ratio: Math.min(rx, ry) };
}

function targetLength(leaf, ratio) {
  const clamped = Math.min(0.9, Math.max(0.3, ratio));
  return Math.max(2, Math.round(leaf.plain.length * clamped));
}

/** 一页的版面问题。probe：readLayoutProbe 的结果；props：该页 props。返回 issue 数组（已按严重度排序、按 code 封顶）。 */
export function analyzeSlideLayout({ index, layout, probe, props }) {
  const where = `第 ${index + 1} 页（${layout}）`;
  const leaves = propLeaves(props || {});
  const found = { TEXT_OVERFLOW: [], TEXT_OVERLAP: [], DUP_TEXT: [] }; // 每项 {severity, issue}
  const items = probe.items || [];

  // ① 文字溢出：超出画布 / 被自己的 overflow 裁掉 / 超出所在容器（card）被容器裁掉 / 被画在上面的不透明元素盖住
  const shortText = (text, n) => (text.length > n ? `${text.slice(0, n)}…` : text);
  for (const item of items) {
    if (item.ariaHidden || !hasContent(item.text)) continue;
    const decor = isDecor(item); // 装饰文字（淡到看不清的背景字）只查「超出所在容器」，不查画布出血与被盖住
    const causes = []; // {how, ratio, severity}
    if (!decor) {
      const over = canvasOverflow(item.rect);
      if (over) causes.push({ how: '超出版面', ratio: over.ratio, severity: Math.max(over.ox, over.oy) });
      if (item.clipX || item.clipY) {
        const ratio = Math.min(item.clipRatioX ?? 1, item.clipRatioY ?? 1);
        causes.push({ how: '被裁掉一截', ratio, severity: (1 - ratio) * 1000 });
      }
      if ((item.covered ?? 0) >= COVER_RATIO) causes.push({ how: '被页面上其他元素盖住', ratio: 1 - item.covered, severity: item.covered * 1000 });
    }
    // 淡到几乎看不见的（< 0.1）是水印；0.1–0.3 的淡字只在它是个词（≥3 个字母 / 汉字）时才查，「02」这类序号水印出血本来就是设计
    const faintWord = item.opacity >= MIN_OPACITY || (item.opacity >= FAINT_OPACITY && (item.text.match(/\p{L}/gu) || []).length >= 3);
    const inClip = faintWord ? clipOverflow(item.rect, item.clipBox) : null;
    if (inClip) causes.push({ how: '超出所在卡片被裁掉', ratio: inClip.ratio, severity: Math.max(inClip.ox, inClip.oy) });
    if (!causes.length) continue;
    const worst = causes.reduce((best, cause) => (cause.severity > best.severity ? cause : best));
    const ratio = Math.min(...causes.map(cause => cause.ratio));
    const main = locateFields(item.text, leaves)[0] || null;
    const shown = shortText(item.text, 16);
    const message = main
      ? `${where}：字段 ${main.path} 的文字太长，${worst.how}（页面上显示为『${shown}』），请缩短到约 ${targetLength(main, ratio)} 字`
      : `${where}：页面上的文字『${shown}』${worst.how}，找不到对应的字段，props 修不了`;
    found.TEXT_OVERFLOW.push({ severity: worst.severity, issue: { index, layout, field: main ? main.path : null, code: 'TEXT_OVERFLOW', fixable: Boolean(main), message } });
  }

  // ② 两段文字互相压住
  const live = items.filter(item => !isDecor(item) && hasContent(item.text)).map(item => ({ ...item, ink: inkRects(item) }));
  for (let i = 0; i < live.length; i += 1) {
    for (let j = i + 1; j < live.length; j += 1) {
      const a = live[i];
      const b = live[j];
      if (a.anc.includes(b.id) || b.anc.includes(a.id)) continue; // 父子关系
      if (compact(a.text) === compact(b.text)) continue; // 同样的字叠两层是描边 / 投影一类的做法
      if (!boxesTouch(a.rect, b.rect)) continue;
      const inter = interArea(a.ink, b.ink);
      const smaller = Math.min(area(a.ink), area(b.ink));
      if (inter < OVERLAP_MIN_AREA || smaller <= 0 || inter / smaller < OVERLAP_RATIO) continue;
      const fa = locateFields(a.text, leaves)[0] || null;
      const fb = locateFields(b.text, leaves)[0] || null;
      const longer = fa && fb ? (fb.plain.length > fa.plain.length ? fb : fa) : (fa || fb);
      const shownA = a.text.length > 12 ? `${a.text.slice(0, 12)}…` : a.text;
      const shownB = b.text.length > 12 ? `${b.text.slice(0, 12)}…` : b.text;
      const message = fa && fb
        ? `${where}：字段 ${fa.path} 与 ${fb.path} 的文字互相压住（『${shownA}』与『${shownB}』），请缩短其中较长的`
        : longer
          ? `${where}：字段 ${longer.path} 的文字压住了页面上的『${fa ? shownB : shownA}』（找不到它对应的字段），请缩短 ${longer.path}`
          : `${where}：页面上的『${shownA}』与『${shownB}』互相压住，找不到对应的字段，props 修不了`;
      found.TEXT_OVERLAP.push({
        severity: inter / smaller,
        issue: { index, layout, field: longer ? longer.path : null, code: 'TEXT_OVERLAP', fixable: Boolean(longer), message },
      });
    }
  }

  // ③ 紧挨着重复
  const seenFragments = new Set();
  const ownText = leaves.map(leaf => leaf.plain);
  for (const line of probe.lines || []) {
    const re = /(\S{2,}?)\1/gu;
    for (let match = re.exec(line); match; match = re.exec(line)) {
      const fragment = match[1];
      if (!/\p{L}/u.test(fragment)) continue; // 纯数字 / 符号（1010、2020）不算
      if ([...fragment].every(ch => ch === fragment[0])) continue; // 同一个字重复（哈哈哈哈、元元）不算
      if (!/\p{Script=Han}/u.test(fragment) && [...fragment].length < 4) continue; // 纯英文短词（中文名 + 同样的英文缩写，如 OTC）常是设计，≥4 个字符才算
      const key = compact(fragment);
      if (seenFragments.has(key)) continue;
      if (ownText.some(text => text.includes(key + key))) continue; // 我们自己写的文字里就有这个重复
      // 重复的两处字号差得多（大标题 + 小号副标题写同一个词）是版式设计，不是拼接错误
      const sizes = items.filter(item => compact(item.text).includes(key) && compact(item.text).length <= key.length * 3).map(item => item.fontSize); // 只比文字基本就是这个片段的元素（长句里顺带提到它的不算）
      if (sizes.length >= 2 && Math.max(...sizes) / Math.min(...sizes) >= DUP_SIZE_RATIO) continue;
      seenFragments.add(key);
      const holders = leaves.filter(leaf => leaf.plain.includes(key));
      const main = holders[0] || null;
      const other = holders.find(leaf => leaf !== main) || null;
      const message = main && other
        ? `${where}：字段 ${main.path} 与 ${other.path} 拼接后出现重复『${fragment}』，请改写其中一个`
        : main
          ? `${where}：字段 ${main.path} 的文字『${fragment}』与页面自带的文字重复（显示成『${fragment}${fragment}』），请去掉字段里的重复`
          : `${where}：页面上出现重复文字『${fragment}${fragment}』，找不到对应的字段，props 修不了`;
      found.DUP_TEXT.push({ severity: fragment.length, issue: { index, layout, field: main ? main.path : null, code: 'DUP_TEXT', fixable: Boolean(main), message } });
    }
  }

  const issues = [];
  for (const code of LAYOUT_CODES) {
    const seenKey = new Set();
    const ranked = found[code].sort((a, b) => b.severity - a.severity);
    for (const { issue } of ranked) {
      const key = `${issue.field}|${issue.message}`;
      if (seenKey.has(key)) continue;
      seenKey.add(key);
      issues.push(issue);
      if (issues.filter(item => item.code === code).length >= MAX_PER_CODE) break;
    }
  }
  return issues;
}
