// 版式资料：读大师运行时的版式契约，按版式清单（curation）与全局规则筛候选，生成 catalog 摘要与 contracts 填写契约。不调模型。
// 摘要/契约的格式沿用 P0 原型第二轮（lib/layouts.mjs）。
import crypto from 'node:crypto';
import { importFromRuntime, CURATION_DIR } from './paths.mjs';
import { PluginError } from './errors.mjs';
import { isThemeEnabled } from './curation.mjs';
import { getByPath } from './residue.mjs';

// 页眉页脚类装饰文案：摘要里不需要看，契约里仍然保留。
const CHROME_KEYS = new Set([
  'wordmarkLabel', 'wordmarkSub', 'ghostMark', 'railText', 'navItems', 'navCurrent', 'ixNo', 'ixLabel',
  'metaLeft', 'metaMid', 'eyebrowNo', 'eyebrowEn', 'kickerEn', 'kickerNo', 'kickerZh', 'deckLabel', 'deckYear',
  'statusText', 'pageLabel', 'markGlyph', 'arrowGlyph', 'imagePlaceholder',
]);
// 控制面板里通用的装饰开关，不能说明版式能放什么，摘要里略去。
const GENERIC_CONTROL_LABEL = /背景基调|重点序号|重点突出|装饰|背景大字符|边框骨架|底部信息条|说明文案|右上注释|页脚|页眉|柔光|光斑|脚注/;
const SKIP_TEXT_KEYS = new Set(['imagePlaceholder']);
const EXAMPLE_NOTE_KEYS = new Set(['wordmarkLabel', 'wordmarkSub', 'ghostMark', 'railText', 'navItems', 'navCurrent', 'ixNo', 'ixLabel', 'metaLeft', 'metaMid']);
export const CONTRACT_CHAR_LIMIT = 1500;
export const NO_ROLE_GROUP = '_none';

let engineCache = null;

export async function loadEngine() {
  if (!engineCache) {
    const engine = await importFromRuntime('scripts/skill-workflow-utils.mjs');
    if (typeof engine.inspectLayout !== 'function' || !Array.isArray(engine.THEME_PAGES) || !Array.isArray(engine.THEME_PACKS)) {
      throw new PluginError('INTERNAL', '大师运行时缺少 inspectLayout / THEME_PAGES / THEME_PACKS 导出，接口可能已变化');
    }
    engineCache = engine;
  }
  return engineCache;
}

/** 主题列表：id、名称、场景、受众、预览图（插件内暂无预览图，恒为 null）。 */
export function listThemes(engine, curationDir = CURATION_DIR) {
  return engine.THEME_PACKS.map(pack => ({
    id: pack.key,
    name: pack.displayName || pack.name || pack.label || pack.key,
    scenario: pack.scenario || '',
    audience: pack.audience || '',
    preview: null,
    enabled: isThemeEnabled(pack.key, curationDir),
  }));
}

export function themeLayoutKeys(engine, theme) {
  return engine.THEME_PAGES.filter(page => page.themeKey === theme).map(page => page.key);
}

/** 主题不存在（或 id 格式不对）报 BAD_REQUEST。 */
export function assertTheme(engine, theme) {
  const keys = themeLayoutKeys(engine, theme);
  if (!keys.length) {
    throw new PluginError('BAD_REQUEST', `主题不存在：${theme}`, { themes: engine.THEME_PACKS.map(pack => pack.key) });
  }
  return keys;
}

/** 判定版式能否在「无图、无视频」条件下使用。返回 null 表示可用，否则返回原因。规则沿用 P0 第二轮：媒体槽必须能靠数量控件隐藏到 0。 */
export function mediaBlocker(info) {
  for (const slot of info.mediaSlots || []) {
    if (slot.emptySlotBehavior !== 'hiddenByCount') return `媒体槽 ${slot.field} 留空会显示占位框`;
    if (!slot.countKey) return `媒体槽 ${slot.field} 没有数量控件，不能隐藏`;
    const binding = (info.countBindings || []).find(item => item.key === slot.countKey);
    if (!binding) return `媒体槽 ${slot.field} 找不到数量绑定 ${slot.countKey}`;
    if (!(Number(binding.min) <= 0)) return `媒体槽 ${slot.field} 数量下限为 ${binding.min}，不能隐藏为 0`;
  }
  return null;
}

/**
 * 按清单与全局规则筛版式。
 * 返回 { keys, candidates: Map(layout→info), excluded: [{layout, category, reason}] }。
 * category：curation | contentLocked | media | inspectFailed。
 */
export function prepareLayouts(engine, theme, curation) {
  const keys = assertTheme(engine, theme);
  const excludeReason = new Map((curation.exclude || []).map(item => [item.layout, item.reason]));
  const candidates = new Map();
  const excluded = [];
  for (const key of keys) {
    if (excludeReason.has(key)) {
      excluded.push({ layout: key, category: 'curation', reason: excludeReason.get(key) });
      continue;
    }
    let info;
    try {
      info = engine.inspectLayout(key, { compact: true });
    } catch (error) {
      excluded.push({ layout: key, category: 'inspectFailed', reason: `inspectLayout 抛错：${error.message}` });
      continue;
    }
    if (!info) {
      excluded.push({ layout: key, category: 'inspectFailed', reason: 'inspectLayout 返回空' });
      continue;
    }
    if (info.contentLocked) {
      excluded.push({ layout: key, category: 'contentLocked', reason: `contentLocked：${info.contentLockedReason || ''}` });
      continue;
    }
    const blocker = mediaBlocker(info);
    if (blocker) {
      excluded.push({ layout: key, category: 'media', reason: blocker });
      continue;
    }
    candidates.set(key, info);
  }
  return { keys, candidates, excluded };
}

export function isCover(info) {
  return Number(info.pageNumber) >= 1 && Number(info.pageNumber) <= 5;
}

// ---------- 摘要 ----------

function numDesc(field) {
  const bounds = field.numericBounds;
  if (!bounds) return '数';
  return bounds.enforced ? `数0-${bounds.max}(硬)` : `数≤${bounds.max}`;
}

function fieldDesc(field, mode) {
  if (field.type === 'number') {
    if (mode === 'summary') return numDesc(field);
    const bounds = field.numericBounds;
    if (!bounds) return '数';
    const kind = bounds.enforced ? `硬限制${bounds.semantics ? `,${bounds.semantics}` : ''}` : '参考值,真实数据可超过';
    return `数 ${bounds.min}-${bounds.max} (${kind})`;
  }
  if (field.type === 'boolean') return '布尔';
  return mode === 'summary' ? `串≤${field.maxChars}` : `串≤${field.maxChars}字`;
}

function topArrays(info) {
  return (info.fillPlan.arrays || []).filter(array => !String(array.key).includes('[]'));
}

function countRange(info, array) {
  if (!array.countKey) return null;
  const binding = (info.countBindings || []).find(item => item.key === array.countKey);
  return binding ? [binding.min, binding.max] : null;
}

function arrayItemDesc(array, mode) {
  if (array.itemFields) {
    const parts = Object.entries(array.itemFields).map(([name, field]) => `${name}:${fieldDesc(field, mode)}`);
    for (const [name, nested] of Object.entries(array.nestedArrays || {})) {
      const fixed = nested.fixedLength ? `固定${nested.fixedLength}个` : `${nested.visibleCount}个`;
      const range = nested.numericRange ? `${nested.numericRange.observedMin}-${nested.numericRange.observedMax}` : '';
      parts.push(`${name}:[${fixed}数${range ? ` 参考${range}` : ''}]`);
    }
    return `{${parts.join(',')}}`;
  }
  if (array.itemShape === 'string') return `串≤${array.item?.maxChars ?? '?'}`;
  if (array.itemShape === 'number') return '数';
  return JSON.stringify(array.itemShape);
}

/** 单个版式的摘要（不含 id/名称/角色，那些是 catalog 的独立字段）。 */
export function buildLayoutSummary(info, note = '') {
  const mainText = info.fillPlan.text
    .filter(field => !CHROME_KEYS.has(field.key))
    .map(field => (field.type === 'number' ? `${field.key}:数` : `${field.key}≤${field.maxChars}`));
  const arrays = topArrays(info)
    .filter(array => array.key !== 'navItems')
    .map(array => {
      const max = array.maxCount ?? array.visibleCount;
      const count = array.visibleCount === max ? `×${array.visibleCount}` : `×${array.visibleCount}(可至${max})`;
      return `${array.key}${count}${arrayItemDesc(array, 'summary')}`;
    });
  const visual = (info.controls || [])
    .map(control => String(control.label || ''))
    .filter(label => label && !GENERIC_CONTROL_LABEL.test(label));
  const parts = [
    mainText.length ? `文本 ${mainText.join(' ')}` : '无主文本',
    arrays.length ? `数组 ${arrays.join('；')}` : '无数组',
  ];
  if (visual.length) parts.push(`视觉 ${visual.join('/')}`);
  if (note) parts.push(`说明 ${note}`);
  return parts.join('｜');
}

// ---------- 确定性打乱 + 抽样 ----------

/** seed（字符串或数字）→ 32 位整数种子。用 sha256 保证跨平台跨版本稳定。 */
function seedToInt(seed) {
  const digest = crypto.createHash('sha256').update(`imago-ppt:${String(seed)}`).digest();
  return digest.readUInt32BE(0);
}

/** mulberry32：小而稳定的确定性伪随机数。 */
function makeRng(seedInt) {
  let a = seedInt >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 对已排序的数组做 Fisher–Yates 打乱（不改原数组）。 */
export function seededShuffle(items, seed) {
  const rng = makeRng(seedToInt(seed));
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function roleGroup(info) {
  return (info.roles && info.roles[0]) || NO_ROLE_GROUP;
}

/** 每组保留 ⌈ratio×n⌉ 个且至少 2 个（组不足 2 个全留）。减 1e-9 避免 0.7×10 这类浮点误差多进一位。 */
export function keepCount(size, ratio) {
  if (size <= 2) return size;
  return Math.min(size, Math.max(2, Math.ceil(ratio * size - 1e-9)));
}

export function buildCatalog(candidates, { seed, sampleRatio, notes = {} }) {
  const ids = [...candidates.keys()].sort();
  const shuffled = seededShuffle(ids, seed);
  const groups = new Map();
  for (const id of shuffled) {
    const group = roleGroup(candidates.get(id));
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(id);
  }
  const kept = new Set();
  const groupStats = {};
  for (const [group, members] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const keep = keepCount(members.length, sampleRatio);
    members.slice(0, keep).forEach(id => kept.add(id));
    groupStats[group] = { size: members.length, kept: keep };
  }
  const entry = id => {
    const info = candidates.get(id);
    return {
      layout: id,
      label: info.label,
      roles: info.roles || [],
      cover: isCover(info),
      summary: buildLayoutSummary(info, notes[id] || ''),
    };
  };
  const layouts = shuffled.filter(id => kept.has(id)).map(entry);
  const coverCandidates = ids.filter(id => isCover(candidates.get(id))).map(entry);
  return { layouts, coverCandidates, groupStats };
}

// ---------- 契约 ----------

/** 把 'hero.label' 这样的路径写进嵌套对象：{hero:{label:value}}。 */
function setNested(target, pathKey, value) {
  const parts = pathKey.split('.');
  let node = target;
  parts.slice(0, -1).forEach(part => {
    if (typeof node[part] !== 'object' || node[part] === null) node[part] = {};
    node = node[part];
  });
  node[parts[parts.length - 1]] = value;
}

function cut(text, max) {
  const chars = [...String(text)];
  return chars.length > max ? `${chars.slice(0, max).join('')}…` : String(text);
}

/** 从默认 props 取数组与数值字段的示例：数值原样，文字截短；不在契约里的结构字段（如 type）单独列出，标不可写。 */
function buildExamples(info, defaultProps, textMax, itemCap) {
  const examples = {};
  const structural = {};
  for (const array of topArrays(info)) {
    if (array.key === 'navItems') continue;
    const items = getByPath(defaultProps, array.key);
    if (!Array.isArray(items) || !items.length) continue;
    const shape = array.itemFields ? Object.keys(array.itemFields) : null;
    const take = items.slice(0, Math.min(array.maxCount ?? items.length, itemCap));
    examples[array.key] = take.map(item => {
      if (!shape) return typeof item === 'string' ? cut(item, textMax) : item;
      const out = {};
      for (const name of shape) if (name in (item || {})) out[name] = typeof item[name] === 'string' ? cut(item[name], textMax) : item[name];
      for (const [name, nested] of Object.entries(array.nestedArrays || {})) if (Array.isArray(item?.[name])) out[name] = item[name].slice(0, nested.fixedLength || item[name].length);
      return out;
    });
    if (items.length > take.length) examples[`${array.key}_共`] = items.length;
    if (shape) {
      for (const name of new Set(take.flatMap(item => Object.keys(item || {})))) {
        if (shape.includes(name) || name in (array.nestedArrays || {})) continue;
        structural[`${array.key}[].${name}`] = take.map(item => item?.[name]);
      }
    }
  }
  const numericText = {};
  for (const field of info.fillPlan.text) {
    const value = getByPath(defaultProps, field.key);
    if (EXAMPLE_NOTE_KEYS.has(field.key) || value === undefined) continue;
    if (typeof value === 'number' || (typeof value === 'string' && /\d/.test(value) && value.length <= 10)) numericText[field.key] = value;
  }
  return { examples, structural, numericText };
}

/**
 * 单个版式的填写契约。返回 { contract, forcedProps, mediaFields, chars, oversize }。
 * contract：{ label, fields, arrays, forcedProps, examples, notes, styleControls, nestedHint?, mediaFields? }（forcedProps 是必须强制写入的数量字段，如媒体数量=0），JSON 长度 ≤ CONTRACT_CHAR_LIMIT（示例逐级缩短；缩到底仍超限则 oversize:true）。
 */
export function buildFillContract(info, { defaultProps = {}, note = '', styleControls = [] } = {}) {
  const fields = {};
  for (const field of info.fillPlan.text) {
    if (SKIP_TEXT_KEYS.has(field.key)) continue;
    const isHtml = /Html$/.test(field.key);
    setNested(fields, field.key, `${fieldDesc(field, 'contract')}${isHtml ? '，可用<br><b><em>' : ''}`);
  }
  const arrays = {};
  for (const array of topArrays(info)) {
    const range = countRange(info, array);
    const entry = {
      默认可见数: array.visibleCount,
      最大数: array.maxCount ?? array.visibleCount,
      数量字段: array.countKey || '无(长度固定为默认可见数)',
    };
    if (range) entry.数量范围 = range;
    if (array.itemFields) {
      entry.每项字段 = Object.fromEntries(Object.entries(array.itemFields).map(([name, field]) => [name, fieldDesc(field, 'contract')]));
      for (const [name, nested] of Object.entries(array.nestedArrays || {})) {
        entry.每项字段[name] = `数组，${nested.fixedLength ? `定长 ${nested.fixedLength}（按下标填）` : `${nested.visibleCount} 个`}，元素为数${nested.numericRange ? `，参考 ${nested.numericRange.observedMin}-${nested.numericRange.observedMax}` : ''}`;
      }
    } else {
      entry.每项 = array.itemShape === 'string' ? `串≤${array.item?.maxChars ?? '?'}字` : array.itemShape === 'number' ? '数' : array.itemShape;
    }
    arrays[array.key] = entry;
  }
  const forcedProps = {};
  const mediaFields = [];
  for (const slot of info.mediaSlots || []) {
    mediaFields.push(slot.field);
    if (slot.countKey) forcedProps[slot.countKey] = 0;
  }
  const base = { label: info.label, fields, arrays, forcedProps };
  const nestedPaths = [...info.fillPlan.text.map(field => field.key), ...topArrays(info).map(array => array.key)].filter(key => key.includes('.'));
  if (nestedPaths.length) {
    base.nestedHint = `字段名里的「.」表示嵌套对象，必须写成嵌套，例如 ${nestedPaths[0]} 写成 ${JSON.stringify(Object.fromEntries([[nestedPaths[0].split('.')[0], { [nestedPaths[0].split('.').slice(1).join('.')]: '…' }]]))}，不要写成带点的扁平键`;
  }
  if (mediaFields.length) base.mediaFields = mediaFields;
  const withTail = examples => ({ ...base, examples, notes: note || null, styleControls });

  let contract = null;
  let last = 0;
  for (const [level, [textMax, itemCap]] of [[8, 8], [5, 8], [3, 6], [2, 5], [2, 3], [1, 2]].entries()) {
    const { examples, structural, numericText } = buildExamples(info, defaultProps, textMax, itemCap);
    const shown = {};
    if (Object.keys(examples).length) shown.数组 = examples;
    if (Object.keys(numericText).length) shown.数值文本 = numericText;
    if (Object.keys(structural).length) shown.不可写的结构字段 = structural;
    contract = withTail(shown);
    last = level;
    if (JSON.stringify(contract).length <= CONTRACT_CHAR_LIMIT) break;
  }
  const chars = JSON.stringify(contract).length;
  return { contract, forcedProps, mediaFields, chars, oversize: chars > CONTRACT_CHAR_LIMIT, exampleLevel: last };
}

export function buildContracts(engine, candidates, layoutIds, curation) {
  const out = {};
  const oversize = [];
  for (const id of layoutIds) {
    const info = candidates.get(id);
    const record = engine.getLayoutRecord?.(id);
    const built = buildFillContract(info, {
      defaultProps: record?.defaultProps || {},
      note: curation.notes?.[id] || '',
      styleControls: curation.styleControls?.[id] || [],
    });
    out[id] = built.contract;
    if (built.oversize) oversize.push({ layout: id, chars: built.chars });
  }
  return { contracts: out, oversize };
}
