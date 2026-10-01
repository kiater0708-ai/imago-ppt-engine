// 大师校验脚本的输出 → 结构化问题 issues[{index, layout, field, code, message, fixable}]。
// index 从 0 起（第 index+1 页）；解析不出页号时为 null。message 用中文，附大师原文。
import { PluginError } from './errors.mjs';

export const ISSUE_CODES = [
  'MISSING_FIELD', 'BAD_ARRAY_COUNT', 'OUT_OF_RANGE', 'UNKNOWN_PROP', 'OVER_BUDGET',
  'TEMPLATE_RESIDUE', 'HARDCODED_TEXT', 'MEDIA_PLACEHOLDER', 'EMPTY_PAGE', 'FLOAT_ARTIFACT', 'VALIDATOR',
];

const LAYOUT_RE = /theme\d+_page\d+/g;

function parseField(line) {
  const match = /\bfield\s+([^\s:]+?):/i.exec(line);
  return match ? match[1].replace(/^props\./, '') : null;
}

/** 按大师原文里的关键句归类。fixable：改 goal 的内容（换文案、改数量、换版式、去页）有机会修好。 */
export function classifyValidatorLine(line) {
  if (/unknown prop/i.test(line)) return { code: 'UNKNOWN_PROP', text: '该版式没有这个属性，不能写入', fixable: true };
  if (/copy is too long|too long \(/i.test(line)) return { code: 'OVER_BUDGET', text: '文字超出该字段的字数预算', fixable: true };
  if (/too many items|fixed length mismatch|countBinding mismatch|lengthBinding mismatch|too many media items/i.test(line)) {
    return { code: 'BAD_ARRAY_COUNT', text: '数组项数不符合版式要求', fixable: true };
  }
  if (/media asset .* is used \d+ times/i.test(line)) return { code: 'VALIDATOR', text: '同一个媒体素材被多页重复使用', fixable: true };
  if (/duplicate layout/i.test(line)) return { code: 'VALIDATOR', text: '同一个版式被多页使用，需要换版式或去页', fixable: true };
  if (/repeated (core|visible) copy|重复/i.test(line)) return { code: 'VALIDATOR', text: '多处出现重复的文案，需要改写', fixable: true };
  if (/only one cover candidate|cover-like layouts must/i.test(line)) return { code: 'VALIDATOR', text: '封面版式使用不合规', fixable: true };
  if (/残留|未在 goal\.json 中声明|中性占位|没有命中用户目标关键词|缺失或不是有效数字|小于最小值|大于最大值|只有 \d+ 条/.test(line)) {
    return { code: 'VALIDATOR', text: '内容校验未通过', fixable: true };
  }
  return { code: 'VALIDATOR', text: '大师校验未通过', fixable: false };
}

/** 一行里提到的所有页号（1 起）。识别 `slide 3`、`slides 2, 4`、`slides[5]`（0 起）。 */
function mentionedSlideNumbers(line) {
  const numbers = new Set();
  for (const match of line.matchAll(/\bslides?\s+(\d+(?:\s*,\s*\d+)*)/gi)) {
    for (const n of match[1].split(/\s*,\s*/)) numbers.add(Number(n));
  }
  for (const match of line.matchAll(/\bslides\[(\d+)\]/gi)) numbers.add(Number(match[1]) + 1);
  return [...numbers].filter(Number.isFinite);
}

/**
 * 一行校验原文 → issue 数组。
 * - 页级问题（slide N …）：一条，index = N-1；
 * - deck 级问题（deck field …）：原文点名了多页就逐页展开（同一条原文，每页一个 issue）；没点名页号则 index:null；
 * - 只有 layout id 时，该 layout 在 goal 里只出现一次才按位置定位，多次出现不猜（index:null）。
 */
export function issuesFromValidatorLine(line, slideLayouts, { fixable } = {}) {
  const kind = classifyValidatorLine(line);
  const field = parseField(line);
  const layoutInLine = (line.match(LAYOUT_RE) || [])[0] || null;
  const isDeckLevel = /^\s*deck\b/i.test(line);
  const numbers = mentionedSlideNumbers(line).filter(n => n >= 1 && n <= slideLayouts.length);
  // 点名了多页（含没有 deck 前缀的 `(slide 2 …, slide 4 …)`）一律按页展开；点名一页就是那一页；没点名页号则 index:null
  let indexes;
  if (numbers.length > 1) indexes = numbers.map(n => n - 1);
  else if (numbers.length === 1) indexes = [numbers[0] - 1];
  else if (!isDeckLevel && layoutInLine && slideLayouts.filter(item => item === layoutInLine).length === 1) indexes = [slideLayouts.indexOf(layoutInLine)];
  else indexes = [null];
  return indexes.map(index => {
    const layout = index !== null ? slideLayouts[index] : (isDeckLevel ? null : layoutInLine);
    const where = index !== null ? `第 ${index + 1} 页` : '整份 deck';
    return {
      index,
      layout: layout || null,
      field,
      code: kind.code,
      message: `${where}${layout ? `（${layout}）` : ''}${field ? ` 字段 ${field}` : ''}：${kind.text}。大师原文：${line}`,
      fixable: fixable ?? kind.fixable,
    };
  });
}

/** 从 stdout/stderr 文本里取 "- xxx" 形式的错误行。 */
export function bulletLines(...texts) {
  const out = [];
  for (const text of texts) {
    for (const raw of String(text || '').split(/\r?\n/)) {
      const line = raw.trim();
      if (line.startsWith('- ')) out.push(line.slice(2).trim());
    }
  }
  return out;
}

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isInt = value => Number.isInteger(value) && value >= 0;
const isStringArray = value => Array.isArray(value) && value.every(item => typeof item === 'string');

/** 严格结构校验：写出第一个不符的位置，全部符合返回 null。字段与类型对照 write-safe-props.mjs 的实际输出。 */
function safePropsShapeProblem(data) {
  if (!isObject(data)) return '顶层不是对象';
  if (typeof data.ok !== 'boolean') return 'ok 不是布尔';
  if (typeof data.goal !== 'string') return 'goal 不是字符串';
  for (const key of ['slideCount', 'goalSpecErrorCount', 'propErrorCount', 'warningCount']) {
    if (!isInt(data[key])) return `${key} 不是非负整数`;
  }
  if (data.written !== undefined && typeof data.written !== 'string') return 'written 不是字符串';
  if (!Array.isArray(data.layoutChanges)) return 'layoutChanges 不是数组';
  for (const [i, change] of data.layoutChanges.entries()) {
    if (!isObject(change)) return `layoutChanges[${i}] 不是对象`;
    if (!isInt(change.slide) || typeof change.from !== 'string' || typeof change.to !== 'string' || typeof change.reason !== 'string') {
      return `layoutChanges[${i}] 缺 slide(整数) / from / to / reason(字符串)`;
    }
  }
  for (const key of ['goalSpecErrors', 'propErrors']) {
    if (data[key] !== undefined && !isStringArray(data[key])) return `${key} 不是字符串数组`;
  }
  if (!Array.isArray(data.slides)) return 'slides 不是数组';
  for (const [i, slide] of data.slides.entries()) {
    if (!isObject(slide)) return `slides[${i}] 不是对象`;
    if (!isInt(slide.slide) || slide.slide < 1) return `slides[${i}].slide 不是正整数`;
    if (slide.layout !== null && typeof slide.layout !== 'string') return `slides[${i}].layout 不是字符串或 null`;
    if (!isInt(slide.warningCount) || !isInt(slide.errorCount)) return `slides[${i}] 的 warningCount / errorCount 不是非负整数`;
    for (const key of ['warnings', 'errors']) {
      if (slide[key] !== undefined && !isStringArray(slide[key])) return `slides[${i}].${key} 不是字符串数组`;
    }
  }
  return null;
}

/**
 * write-safe-props 的 JSON 输出：必须是合法 JSON、结构严格符合（必需字段与类型逐个检查）、没被截断，
 * 否则是流程失败（RENDER_FAILED）。退出码 0：要求 ok:true；退出码非 0：要求带错误行。
 */
export function safePropsErrors(stdout, { exitOk = true, truncated = false } = {}) {
  const fail = reason => new PluginError('RENDER_FAILED', `write-safe-props 的输出不可用：${reason}`, { stdoutTail: String(stdout || '').slice(-600) });
  if (truncated) throw fail('输出超过捕获上限，被截断');
  let data;
  try {
    data = JSON.parse(stdout);
  } catch (error) {
    throw fail(`不是合法 JSON（${error.message}）`);
  }
  const problem = safePropsShapeProblem(data);
  if (problem) throw fail(problem);
  const lines = [];
  for (const item of data.goalSpecErrors || []) lines.push(item);
  for (const item of data.propErrors || []) lines.push(item);
  for (const slide of data.slides) {
    for (const item of slide.errors || []) lines.push(`slide ${slide.slide} layout ${slide.layout}: ${item}`);
  }
  if (exitOk && data.ok !== true) throw fail('退出码为 0 但 ok 不是 true');
  if (!exitOk && !lines.length) throw fail('退出码非 0，但输出里没有任何错误行');
  return { data, lines };
}
