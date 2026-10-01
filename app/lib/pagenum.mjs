// 页码规整：有些版式带页码字段，模型按计划页数写，去页之后序号与总数都对不上。
// check 在 goal 副本里按实际页序与实际页数重写，不改原文件。
// 只处理明确是页码的字段（PAGE_NUMBER_FIELDS）；同形的别的字段（如 theme04_page051 的评分 "5 / 5"）不碰。
//   fraction：整段 "NN / MM"（theme02 的 index）
//   position：只有当前页序号 "NN"（theme12 的 page）
//   total：只有总页数 "MM"（theme12 的 total）

export const PAGE_NUMBER_FIELDS = [
  { layoutPrefix: 'theme02_', key: 'index', kind: 'fraction' },
  { layoutPrefix: 'theme12_', key: 'page', kind: 'position' },
  { layoutPrefix: 'theme12_', key: 'total', kind: 'total' },
];

const FRACTION_RE = /^(\s*)(\d{1,3})(\s*\/\s*)(\d{1,3})(\s*)$/;
const NUMBER_RE = /^(\s*)(\d{1,3})(\s*)$/;

const pad = (value, width) => String(value).padStart(width, '0');

/** 按字段种类把页码字符串改成实际值，保留原有的补零宽度与分隔写法。不是页码格式或已经正确返回 null。 */
export function renumber(text, kind, position, total) {
  let next = null;
  if (kind === 'fraction') {
    const match = FRACTION_RE.exec(text);
    if (match) next = `${match[1]}${pad(position, match[2].length)}${match[3]}${pad(total, match[4].length)}${match[5]}`;
  } else {
    const match = NUMBER_RE.exec(text);
    if (match) next = `${match[1]}${pad(kind === 'position' ? position : total, match[2].length)}${match[3]}`;
  }
  return next === null || next === text ? null : next;
}

/** 直接改 goal.slides[].props。返回改动清单 [{index, layout, field, from, to}]。 */
export function normalizePageNumbers(goal) {
  const changes = [];
  const total = goal.slides.length;
  goal.slides.forEach((slide, index) => {
    const props = slide.props;
    if (!props) return;
    for (const field of PAGE_NUMBER_FIELDS) {
      if (!String(slide.layout).startsWith(field.layoutPrefix)) continue;
      const value = props[field.key];
      if (typeof value !== 'string') continue;
      const next = renumber(value, field.kind, index + 1, total);
      if (next === null) continue;
      props[field.key] = next;
      changes.push({ index, layout: slide.layout, field: field.key, from: value, to: next });
    }
  });
  return changes;
}
