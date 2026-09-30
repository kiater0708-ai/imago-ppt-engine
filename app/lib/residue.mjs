// 运行时残留检查：拿浏览器里每页的实际可见文字，对照 ① 禁用词表 ② 该版式默认 props 里的文字。
// 命中后尽量定位到字段；定位不到（或字段不在契约里）的，判为组件硬编码，props 修不了。

export const FORBIDDEN_TEXT = ['IGNIS', '燃点', 'SoundWave', 'AI Capital', 'Key Metrics', 'Roadmap', 'End of Report'];

// 媒体槽占位文字：页面上出现「图片数量 = 0」这类占位（P0 实测 theme08 page082），版式以图片为主体，内容修不了。
export const MEDIA_PLACEHOLDER_RE = /(?:\/\/\s*)?(?:图片|照片|视频|媒体)\s*数量(?:\s*[=:：]\s*\d+)?/;

export function findMediaPlaceholder(text) {
  const match = MEDIA_PLACEHOLDER_RE.exec(String(text));
  return match ? match[0].trim() : null;
}

const NUMERIC_ONLY = /^[\d\s.,%+\-–—:/·×÷→↑↓]+$/;
const COLOR = /^(#[0-9a-f]{3,8}|rgba?\(.*\)|hsla?\(.*\))$/i;
const PATHLIKE = /(^|\s)(\/|\.\/|\.\.\/|https?:\/\/|file:\/\/)|\.(png|jpe?g|gif|svg|webp|mp4|woff2?|ttf)(\?|$)/i;

export function norm(text) {
  return String(text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

function topKey(path) {
  return path.split(/[.[]/)[0];
}

/** 字符串叶子：[{path, value}]，数组用 [i]，对象用 .key。 */
export function stringLeaves(value, path = '') {
  if (typeof value === 'string') return [{ path, value }];
  if (Array.isArray(value)) return value.flatMap((item, i) => stringLeaves(item, `${path}[${i}]`));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([key, item]) => stringLeaves(item, path ? `${path}.${key}` : key));
  return [];
}

export function getByPath(root, path) {
  let current = root;
  for (const token of path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean)) {
    if (current === undefined || current === null) return undefined;
    current = current[token];
  }
  return current;
}

function isBlank(value) {
  return value === undefined || value === null || (typeof value === 'string' && !value.trim());
}

/** 默认 props 里可作为「模板默认文字」的片段：[{path, segment}]。控件值、数字、颜色、路径不算。 */
export function defaultTextSegments(defaultProps, controlKeys) {
  const out = [];
  for (const { path, value } of stringLeaves(defaultProps)) {
    if (controlKeys.has(topKey(path))) continue;
    for (const piece of value.split(/<br\s*\/?>/i)) {
      const segment = piece.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (segment.length < 2 || NUMERIC_ONLY.test(segment) || COLOR.test(segment) || PATHLIKE.test(segment)) continue;
      out.push({ path, segment });
    }
  }
  return out;
}

function contractKeys(info) {
  const keys = new Set();
  for (const field of info.fillPlan.text) {
    keys.add(field.key);
    keys.add(topKey(field.key));
  }
  for (const array of info.fillPlan.arrays) keys.add(topKey(array.key));
  return keys;
}

/**
 * 检查一页。返回命中列表 [{kind:'forbidden'|'default', text, path|null, fixable, message}]。
 * text 为浏览器里的可见文字；props 为我们写的 props；defaultProps 为版式默认 props。
 */
export function checkSlideResidue({ text, props, defaultProps, info }) {
  const visible = norm(text);
  const ours = norm(stringLeaves(props).map(item => item.value).join(' '));
  const controlKeys = new Set([...(info.controls || []).map(control => control.key), ...(info.controls || []).map(control => control.publicKey)].filter(Boolean));
  const allowed = contractKeys(info);
  const segments = defaultTextSegments(defaultProps, controlKeys);
  const hits = [];
  const seen = new Set();

  const locate = needle => {
    // 候选字段：默认值里含该文字、且我们没给这个字段写值（写了就说明不是它在显示）
    const candidates = segments.filter(item => norm(item.segment).includes(needle) && isBlank(getByPath(props, item.path)));
    return [...new Set(candidates.map(item => item.path))];
  };
  const describe = (shown, paths, fixable, origin = []) => {
    if (fixable) return `页面还显示模板默认文字『${shown}』，对应字段 ${paths.join('、')}（请写入本次内容）`;
    if (paths.length) return `页面还显示模板默认文字『${shown}』，默认值在字段 ${paths.join('、')}，但该字段不在填写契约里，无法通过 props 修复`;
    if (origin.length) return `页面还显示模板默认文字『${shown}』，其默认字段 ${origin.join('、')} 已写入别的内容，这段文字来自组件硬编码，props 修不了`;
    return `页面可见文字含模板词『${shown}』，找不到任何可写字段会显示它（疑似组件硬编码，props 修不了）`;
  };
  const missingBrand = ['wordmarkLabel', 'wordmarkSub'].filter(key => !allowed.has(key));
  const brandNote = missingBrand.length ? `；该版式填写契约里没有 ${missingBrand.join('/')}（写入会被 validate-goal-spec 拒绝），品牌字标由组件写死` : '';

  for (const word of FORBIDDEN_TEXT) {
    const needle = word.toLowerCase();
    if (!visible.includes(needle)) continue;
    const paths = locate(needle);
    const fixable = paths.length > 0 && paths.every(path => allowed.has(topKey(path)));
    seen.add(needle);
    const origin = segments.filter(entry => norm(entry.segment).includes(needle)).map(entry => entry.path);
    hits.push({ kind: 'forbidden', text: word, path: paths[0] || null, paths, fixable, message: describe(word, paths, fixable, origin) + (fixable ? '' : brandNote) });
  }
  for (const item of segments) {
    const needle = norm(item.segment);
    if (seen.has(needle) || !visible.includes(needle)) continue;
    if (ours.includes(needle)) continue; // 我们的 props 里本来就有这段文字
    if (FORBIDDEN_TEXT.some(word => needle.includes(word.toLowerCase()) && seen.has(word.toLowerCase()))) continue; // 已按禁用词报过
    seen.add(needle);
    const paths = locate(needle);
    const fixable = paths.length > 0 && paths.every(path => allowed.has(topKey(path)));
    const origin = segments.filter(entry => norm(entry.segment) === needle).map(entry => entry.path);
    hits.push({ kind: 'default', text: item.segment, path: paths[0] || item.path, paths: paths.length ? paths : origin, fixable, message: describe(item.segment, paths, fixable, origin) });
  }
  return hits;
}
