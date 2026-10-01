// 审计判定规则（纯函数）：标记 props 渲染后，页面上剩下的文字里哪些是组件写死的、哪些是图片占位、哪些是平台图标。
import { FORBIDDEN_TEXT, findMediaPlaceholder } from '../../app/lib/residue.mjs';

/** 纯装饰的常见 UI 文字白名单：命中的不算写死。写进报告供人复核。全部小写比较。 */
export const DECOR_WHITELIST_LATIN = [
  'top', 'no', 'nos', 'vol', 'page', 'pages', 'fig', 'figure', 'est', 'rev', 'ver', 'tel', 'fax', 'www', 'com',
  'am', 'pm', 'vs', 'and', 'the', 'for', 'of',
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec',
  'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
  'january', 'february', 'march', 'april', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'next', 'prev', 'previous', 'back', 'scroll', 'start', 'end', 'fin',
];
/** 中文的常见装饰词（月份、星期、序数、季度）。 */
export const DECOR_WHITELIST_CJK = [
  '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月',
  '周一', '周二', '周三', '周四', '周五', '周六', '周日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日',
  '第一季度', '第二季度', '第三季度', '第四季度', '季度', '上半年', '下半年',
];

/** 平台图标：资源路径或文件名里出现这些词。 */
export const BRAND_ICON_RE = /social-icons\/|(?:^|[\/_.\-])(?:douyin|bilibili|redbook|xiaohongshu|github|weibo|wechat|tiktok|youtube|twitter)(?:[\/_.\-]|$)/i;

/** 图片占位类文字（spec：图片数量、图片、image、media；另加上传提示：上传、拖拽、upload）。 */
export const MEDIA_WORD_RE = /图片|image|media|上传|拖拽|upload/i;

/** 数值的各种形态：千分位、小数、带正负号、百分号 / 千分号。前面紧挨字母的数字（如 Q3、FY2026）不当数值处理。 */
export const NUMERIC_FORM_RE = /(?<![A-Za-z])[+\-−–]?\d[\d,，.]*\s*[%％‰]?/g;
/** 纯标点 / 符号 / 箭头 / 序号分隔（统一按 Unicode 的标点 P、符号 S 类处理，如 → · / | — •）。 */
export const PUNCT_RE = /[\p{P}\p{S}]+/gu;
const CJK_RUN_RE = /[㐀-䶿一-鿿]{2,}/g;
const LATIN_WORD_RE = /[A-Za-z]{3,}/g;

function escapeRe(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 去掉我们填的标记。长的先去（M1 不会误伤 M10）。
 * 标准标记（M + 两位 36 进制，共 3 位）紧挨着别的标记 / 汉字 / 符号也照样去掉（页面把几块文字拼在一起时会连成 M0GM0H）；
 * 被字数上限截短的短标记只在两侧不是字母数字时才去，避免伤到别的文字。
 */
export function removeMarkers(text, markers) {
  const list = [...new Set(markers || [])].filter(Boolean).sort((a, b) => b.length - a.length);
  if (!list.length) return String(text);
  const full = list.filter(item => /^M[0-9A-Z]{2,}$/.test(item));
  const short = list.filter(item => !/^M[0-9A-Z]{2,}$/.test(item));
  let out = String(text);
  if (full.length) out = out.replace(new RegExp(full.map(escapeRe).join('|'), 'g'), ' ');
  if (short.length) out = out.replace(new RegExp(`(?<![A-Za-z0-9])(?:${short.map(escapeRe).join('|')})(?![A-Za-z0-9])`, 'g'), ' ');
  return out;
}

/**
 * 一行可见文字 → 剩下的候选写死文字（空串表示这一行都是我们的标记 / 数值 / 标点）。
 * 步骤：去标记 → 去数值 → 去标点符号箭头 → 去单个字符。
 */
export function residualText(line, markers) {
  let text = removeMarkers(line, markers);
  text = text.replace(NUMERIC_FORM_RE, ' ').replace(PUNCT_RE, ' ');
  const tokens = text.split(/\s+/).filter(token => [...token].length > 1);
  return tokens.join(' ');
}

/** 页面可见文字（innerText，按换行分块）→ 候选写死文字列表。 */
export function candidatesFromLines(lines, markers) {
  const out = [];
  for (const line of lines || []) {
    const rest = residualText(line, markers);
    if (rest) out.push({ line: String(line).trim(), text: rest });
  }
  return out;
}

/** 去掉白名单词。 */
export function stripWhitelist(text) {
  let rest = String(text);
  for (const word of [...DECOR_WHITELIST_CJK].sort((a, b) => b.length - a.length)) rest = rest.split(word).join(' ');
  const latin = new Set(DECOR_WHITELIST_LATIN);
  rest = rest.replace(/[A-Za-z]+/g, word => (latin.has(word.toLowerCase()) ? ' ' : word));
  return rest;
}

/**
 * 判定一个候选：
 *   whitelisted：去掉白名单词后已经没有 ≥3 字母词、没有连续 ≥2 汉字；
 *   hardcoded：含连续 ≥2 汉字，或 ≥2 个 ≥3 字母词，或含禁用词（IGNIS、燃点…）；
 *   uncertain：只剩 1 个 ≥3 字母词（spec：只有一个英文单词不自动排除，交给人工）。
 */
export function classifyCandidate(candidate) {
  const text = typeof candidate === 'string' ? candidate : candidate.text;
  const lower = text.toLowerCase();
  const forbidden = FORBIDDEN_TEXT.find(word => lower.includes(word.toLowerCase()));
  if (forbidden) return { kind: 'hardcoded', text, why: `禁用词 ${forbidden}` };
  const rest = stripWhitelist(text);
  const cjk = rest.match(CJK_RUN_RE) || [];
  const latin = rest.match(LATIN_WORD_RE) || [];
  if (!cjk.length && !latin.length) return { kind: 'whitelisted', text };
  if (cjk.length) return { kind: 'hardcoded', text, why: `连续汉字 ${cjk[0]}` };
  if (latin.length >= 2) return { kind: 'hardcoded', text, why: `多个英文词 ${latin.slice(0, 3).join(' ')}` };
  return { kind: 'uncertain', text, why: `单个英文词 ${latin[0]}` };
}

/** 资源路径里有没有平台图标。返回命中的路径列表。 */
export function findBrandIcons(resources) {
  return [...new Set((resources || []).filter(item => BRAND_ICON_RE.test(String(item))))];
}

/** 是不是图片占位类文字。 */
export function isMediaText(text) {
  return Boolean(findMediaPlaceholder(text)) || MEDIA_WORD_RE.test(String(text));
}

/**
 * 综合判定一个版式。输入：{lines, markers, resources}。
 * 返回 { categories:[], evidence:{hardcoded:[], media:[], brandIcon:[]}, uncertain:[], whitelisted:[] }。
 * 优先级不互斥：一个版式可以同时是几类，但 exclude 的 reason 按 media > hardcoded > brandIcon 取第一条证据。
 */
export function judgeLayout({ lines, markers, resources }) {
  const evidence = { hardcoded: [], media: [], brandIcon: [] };
  const uncertain = [];
  const whitelisted = [];
  for (const candidate of candidatesFromLines(lines, markers)) {
    if (isMediaText(candidate.text) || isMediaText(candidate.line)) {
      evidence.media.push(candidate.text);
      continue;
    }
    const verdict = classifyCandidate(candidate);
    if (verdict.kind === 'hardcoded') evidence.hardcoded.push(candidate.text);
    else if (verdict.kind === 'uncertain') uncertain.push(candidate.text);
    else whitelisted.push(candidate.text);
  }
  evidence.brandIcon = findBrandIcons(resources);
  const categories = Object.keys(evidence).filter(key => evidence[key].length);
  const uniq = list => [...new Set(list)];
  return {
    categories,
    evidence: { hardcoded: uniq(evidence.hardcoded), media: uniq(evidence.media), brandIcon: uniq(evidence.brandIcon) },
    uncertain: uniq(uncertain),
    whitelisted: uniq(whitelisted),
  };
}
