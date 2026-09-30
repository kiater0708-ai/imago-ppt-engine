// 大师校验脚本的输出 → 结构化问题 issues[{index, layout, field, code, message, fixable}]。
// index 从 0 起（第 index+1 页）；解析不出页号时为 null。message 用中文，附大师原文。
import { PluginError } from './errors.mjs';

export const ISSUE_CODES = [
  'MISSING_FIELD', 'BAD_ARRAY_COUNT', 'OUT_OF_RANGE', 'UNKNOWN_PROP', 'OVER_BUDGET',
  'TEMPLATE_RESIDUE', 'HARDCODED_TEXT', 'MEDIA_PLACEHOLDER', 'EMPTY_PAGE', 'VALIDATOR',
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
  let indexes;
  if (isDeckLevel) indexes = numbers.length ? numbers.map(n => n - 1) : [null];
  else if (numbers.length) indexes = [numbers[0] - 1];
  else if (layoutInLine && slideLayouts.filter(item => item === layoutInLine).length === 1) indexes = [slideLayouts.indexOf(layoutInLine)];
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

/**
 * write-safe-props 的 JSON 输出：必须是合法 JSON、结构正确，且没被截断，否则是流程失败（RENDER_FAILED）。
 * 退出码 0：要求 { ok:true, layoutChanges:数组 }；退出码非 0：要求带错误行。
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
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw fail('顶层不是对象');
  if (data.layoutChanges !== undefined && !Array.isArray(data.layoutChanges)) throw fail('layoutChanges 不是数组');
  if (data.slides !== undefined && !Array.isArray(data.slides)) throw fail('slides 不是数组');
  if (typeof data.ok !== 'boolean') throw fail('缺少布尔字段 ok');
  const lines = [];
  for (const item of data.goalSpecErrors || []) lines.push(String(item));
  for (const item of data.propErrors || []) lines.push(typeof item === 'string' ? item : JSON.stringify(item));
  for (const slide of data.slides || []) {
    for (const item of slide.errors || []) lines.push(`slide ${slide.slide} layout ${slide.layout}: ${item}`);
  }
  for (const item of data.errors || []) lines.push(String(item));
  if (exitOk && data.ok !== true) throw fail('退出码为 0 但 ok 不是 true');
  if (!exitOk && !lines.length) throw fail('退出码非 0，但输出里没有任何错误行');
  return { data, lines };
}
