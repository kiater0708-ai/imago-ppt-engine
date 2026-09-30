// 大师校验脚本的输出 → 结构化问题 issues[{index, layout, field, code, message, fixable}]。
// index 从 0 起（第 index+1 页）；解析不出页号时为 null。message 用中文，附大师原文。
export const ISSUE_CODES = [
  'MISSING_FIELD', 'BAD_ARRAY_COUNT', 'OUT_OF_RANGE', 'UNKNOWN_PROP', 'OVER_BUDGET',
  'TEMPLATE_RESIDUE', 'HARDCODED_TEXT', 'MEDIA_PLACEHOLDER', 'EMPTY_PAGE', 'VALIDATOR',
];

const LAYOUT_RE = /theme\d+_page\d+/g;

/** 从一行错误里解析页号（0 起）；解析不出返回 null。 */
export function attributeIndex(line, slideLayouts) {
  const slideMatch = /slide\s+(\d+)/i.exec(line) || /slides?\[(\d+)\]/i.exec(line);
  let index = null;
  if (slideMatch) {
    const n = Number(slideMatch[1]);
    index = /slides?\[/.test(slideMatch[0]) ? n : n - 1;
  }
  if (index === null) {
    const layouts = line.match(LAYOUT_RE) || [];
    if (layouts.length === 1) {
      const found = slideLayouts.indexOf(layouts[0]);
      if (found >= 0) index = found;
    }
  }
  if (index !== null && (index < 0 || index >= slideLayouts.length)) index = null;
  return index;
}

function parseField(line) {
  const match = /\bfield\s+([^\s:]+?):/i.exec(line);
  return match ? match[1].replace(/^props\./, '') : null;
}

/** 按大师原文里的关键句归类。 */
export function classifyValidatorLine(line) {
  if (/unknown prop/i.test(line)) return { code: 'UNKNOWN_PROP', text: '该版式没有这个属性，不能写入', fixable: true };
  if (/copy is too long|too long \(/i.test(line)) return { code: 'OVER_BUDGET', text: '文字超出该字段的字数预算', fixable: true };
  if (/too many items|fixed length mismatch|countBinding mismatch|lengthBinding mismatch|too many media items/i.test(line)) {
    return { code: 'BAD_ARRAY_COUNT', text: '数组项数不符合版式要求', fixable: true };
  }
  return { code: 'VALIDATOR', text: '大师校验未通过', fixable: false };
}

/** 一行校验原文 → issue。fixable 表示改 goal 内容有机会修好。 */
export function issueFromValidatorLine(line, slideLayouts, { fixable } = {}) {
  const index = attributeIndex(line, slideLayouts);
  const layoutInLine = (line.match(LAYOUT_RE) || [])[0] || null;
  const layout = index !== null ? slideLayouts[index] : layoutInLine;
  const field = parseField(line);
  const kind = classifyValidatorLine(line);
  const where = index !== null ? `第 ${index + 1} 页` : '整份 deck';
  return {
    index,
    layout: layout || null,
    field,
    code: kind.code,
    message: `${where}${layout ? `（${layout}）` : ''}${field ? ` 字段 ${field}` : ''}：${kind.text}。大师原文：${line}`,
    fixable: fixable ?? kind.fixable,
  };
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

/** write-safe-props 的 JSON 输出里的错误行（goalSpecErrors、propErrors、slides[].errors）。 */
export function safePropsErrors(stdout) {
  let data;
  try {
    data = JSON.parse(stdout);
  } catch {
    return { data: null, lines: [] };
  }
  const lines = [];
  for (const item of data.goalSpecErrors || []) lines.push(String(item));
  for (const item of data.propErrors || []) lines.push(typeof item === 'string' ? item : JSON.stringify(item));
  for (const slide of data.slides || []) {
    for (const item of slide.errors || []) lines.push(`slide ${slide.slide} layout ${slide.layout}: ${item}`);
  }
  for (const item of data.errors || []) lines.push(String(item));
  return { data, lines };
}
