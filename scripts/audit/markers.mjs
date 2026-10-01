// 审计用的「标记 props」：按版式契约给每个文本字段填唯一标记，页面上其余的可见文字就是组件自己写死的。
// 纯函数，不碰文件和浏览器，方便单测。
import { getByPath } from '../../app/lib/residue.mjs';

const SKIP_TEXT_KEYS = new Set(['imagePlaceholder']); // 契约里给了但我们本次不放图，不填
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // 全大写：页面 text-transform 变大写后仍然能原样认出来

/** 第 n 个标记（n 从 0 起）：'M' + 36 进制，至少 2 位；超出长度上限就截短（保持前缀 M 不变，只保证上限内尽量唯一）。 */
export function markerText(n, maxChars) {
  const digits = [];
  let rest = n;
  do {
    digits.unshift(ALPHABET[rest % 36]);
    rest = Math.floor(rest / 36);
  } while (rest > 0);
  const body = digits.join('').padStart(2, '0');
  const full = `M${body}`;
  const limit = Number.isFinite(maxChars) && maxChars > 0 ? Math.floor(maxChars) : full.length;
  if (full.length <= limit) return full;
  // 上限太小：去掉前缀 M，取低位字符；limit=1 时只剩 36 个可区分取值
  const raw = digits.join('');
  return raw.slice(-limit);
}

/** 标记发生器：同一页里发出的标记互不相同；上限太小导致无法唯一时记进 collisions。 */
export function createMarkerPool() {
  let counter = 0;
  const used = new Set();
  const kept = new Set(); // 默认值里保留原样的枚举 / 样式 token（页面上可能显示出来，判定时当作「我们写的」）
  const collisions = [];
  return {
    markers: used,
    kept,
    collisions,
    next(maxChars, label = '') {
      for (let tries = 0; tries < 2000; tries += 1) {
        const text = markerText(counter, maxChars);
        counter += 1;
        if (!used.has(text)) {
          used.add(text);
          return text;
        }
      }
      collisions.push(label);
      return markerText(counter, maxChars);
    },
  };
}

/** 把 'hero.label' 这样的路径写进嵌套对象。 */
export function setNested(target, pathKey, value) {
  const parts = pathKey.split('.');
  let node = target;
  for (const part of parts.slice(0, -1)) {
    if (typeof node[part] !== 'object' || node[part] === null) node[part] = {};
    node = node[part];
  }
  node[parts[parts.length - 1]] = value;
}

/** 数值字段的取值：有上下界取中值（整数边界取整），没有界取默认值里的示例，再没有取 0。 */
export function numberValue(field, sample) {
  const bounds = field?.numericBounds;
  if (bounds && Number.isFinite(Number(bounds.min)) && Number.isFinite(Number(bounds.max))) {
    const mid = (Number(bounds.min) + Number(bounds.max)) / 2;
    const span = Number(bounds.max) - Number(bounds.min);
    return Number.isInteger(Number(bounds.min)) && Number.isInteger(Number(bounds.max)) && span >= 2 ? Math.round(mid) : mid; // 0–1 这种比例区间不取整
  }
  if (typeof sample === 'number' && Number.isFinite(sample)) return sample;
  if (typeof sample === 'string' && sample.trim() !== '' && Number.isFinite(Number(sample))) return Number(sample);
  return 0;
}

function topArrays(info) {
  return (info.fillPlan?.arrays || []).filter(array => !String(array.key).includes('[]'));
}

function itemSample(defaults, index) {
  if (!Array.isArray(defaults) || !defaults.length) return undefined;
  return defaults[Math.min(index, defaults.length - 1)];
}

/** 默认值里像「枚举 / 样式 token」的字符串（小写英文单词、纯标点）保持原样，不换成标记（如 state:'partial'、'soft'、'.'）。 */
export function isKeepToken(value) {
  if (typeof value !== 'string') return false;
  return /^[a-z][a-z-]{1,11}$/.test(value) || /^[^\p{L}\p{N}]*$/u.test(value);
}

/**
 * 按形状递归生成值。优先级：契约 itemShape（校验器认的结构）> 默认值里的实际类型 > 字符串。
 * shape：'string' | 'number' | 'boolean' | [元素形状…] | {键: 形状}；sample：默认值里对应位置的值；
 * fieldInfo：契约 itemFields[name]（有 maxChars / numericBounds）；hint：没有 fieldInfo 时的字数上限；
 * fixedLength：定长数组的长度（nestedArrays 给的）。
 * 对象只写 shape 里列出的键：校验器不认其他键（如 kind、tone、x/y/r 这类「不可写的结构字段」）。
 */
export function fillByShape(shape, sample, pool, tag, { fieldInfo = null, hint = 18, fixedLength = null } = {}) {
  const sampleKind = Array.isArray(sample) ? 'array' : sample !== null && typeof sample === 'object' ? 'object'
    : typeof sample === 'string' ? 'string' : typeof sample === 'number' ? 'number' : typeof sample === 'boolean' ? 'boolean' : null;
  const shapeKind = Array.isArray(shape) ? 'array' : shape && typeof shape === 'object' ? 'object' : typeof shape === 'string' ? shape : null;
  const kind = shapeKind || sampleKind || 'string';
  if (kind === 'array') {
    const items = Array.isArray(sample) ? sample : [];
    const shapeList = Array.isArray(shape) ? shape : [];
    const length = fixedLength || (shapeList.length > 1 ? shapeList.length : items.length || 1); // 形状有多个元素 = 定长元组
    return Array.from({ length }, (_, i) => fillByShape(shapeList.length ? shapeList[Math.min(i, shapeList.length - 1)] : undefined, items[i], pool, `${tag}[${i}]`, { hint }));
  }
  if (kind === 'object') {
    const shapeMap = shape && typeof shape === 'object' && !Array.isArray(shape) ? shape : null;
    const sampleMap = sample && typeof sample === 'object' && !Array.isArray(sample) ? sample : {};
    const out = {};
    for (const key of shapeMap ? Object.keys(shapeMap) : Object.keys(sampleMap)) out[key] = fillByShape(shapeMap?.[key], sampleMap[key], pool, `${tag}.${key}`, { hint });
    return out;
  }
  if (kind === 'number') return numberValue(fieldInfo, sample);
  if (kind === 'boolean') return typeof sample === 'boolean' ? sample : true;
  if (isKeepToken(sample)) {
    pool.kept.add(sample);
    return sample;
  }
  return pool.next(fieldInfo?.maxChars ?? hint, tag);
}

function buildItem(array, index, pool, defaultItem, tag) {
  const objectShape = array.itemShape && typeof array.itemShape === 'object' && !Array.isArray(array.itemShape);
  if (array.itemFields || objectShape) {
    const nestedInfo = array.nestedArrays || {};
    const shape = objectShape ? array.itemShape : Object.fromEntries(Object.keys(array.itemFields).map(name => [name, array.itemFields[name].type || 'string']));
    const item = {};
    for (const name of Object.keys(shape)) {
      const nested = nestedInfo[name];
      const hint = nested?.item?.maxChars ?? nested?.itemFields?.[Object.keys(nested?.itemFields || {})[0]]?.maxChars ?? 18;
      item[name] = fillByShape(shape[name], defaultItem?.[name], pool, `${tag}.${name}`, { fieldInfo: array.itemFields?.[name] || null, hint, fixedLength: nested?.fixedLength || null });
    }
    return item;
  }
  if (Array.isArray(array.itemShape)) return fillByShape(array.itemShape, defaultItem, pool, tag);
  if (array.itemShape === 'number') return numberValue(null, defaultItem);
  if (array.itemShape === 'boolean') return typeof defaultItem === 'boolean' ? defaultItem : true;
  return pool.next(array.item?.maxChars, tag);
}

/**
 * 按契约生成该版式的标记 props。
 * info：inspectLayout 的结果；defaultProps：版式默认 props（只用来取数值示例）。
 * 返回 { props, markers:[…], keptTokens:[…], collisions:[…] }。媒体数量一律设 0，媒体字段不写；控件保持默认（不写）。
 */
export function buildMarkerProps(info, defaultProps = {}) {
  const pool = createMarkerPool();
  const props = {};
  const mediaFields = new Set((info.mediaSlots || []).map(slot => slot.field));
  for (const field of info.fillPlan?.text || []) {
    if (SKIP_TEXT_KEYS.has(field.key) || mediaFields.has(field.key)) continue;
    const sample = getByPath(defaultProps, field.key);
    if (field.type === 'number') setNested(props, field.key, numberValue(field, sample));
    else if (field.type === 'boolean') setNested(props, field.key, typeof sample === 'boolean' ? sample : true);
    else setNested(props, field.key, pool.next(field.maxChars, field.key));
  }
  for (const array of topArrays(info)) {
    if (mediaFields.has(array.key)) continue;
    const count = array.visibleCount;
    const defaults = getByPath(defaultProps, array.key);
    const items = [];
    for (let i = 0; i < count; i += 1) items.push(buildItem(array, i, pool, itemSample(defaults, i), `${array.key}[${i}]`));
    setNested(props, array.key, items);
    if (array.countKey) props[array.countKey] = count;
  }
  for (const slot of info.mediaSlots || []) {
    if (slot.countKey) props[slot.countKey] = 0;
  }
  return { props, markers: [...pool.markers], keptTokens: [...pool.kept], collisions: pool.collisions };
}
