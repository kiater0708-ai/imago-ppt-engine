// 通用版面检测的判定逻辑（纯函数，不开浏览器）：造页面端取数的假数据，验证 TEXT_OVERFLOW / TEXT_OVERLAP / DUP_TEXT 的判定、
// 装饰巨字 / 水印不误报、字段定位与 message、每页每 code 封顶 3 条。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSlideLayout, canvasOverflow, clipOverflow, compact, inkRects, locateFields, propLeaves, MAX_PER_CODE } from '../app/lib/layout-check.mjs';

let nextId = 0;
/** 造一个文字元素：默认 40px 黑字、不透明、不是装饰。rect 是整体范围，lineRects 默认单行铺满 rect。 */
function item(text, rect, extra = {}) {
  const id = nextId++;
  return {
    id, text, tag: 'span', rect, lineRects: [rect], fontSize: 40, opacity: 1, ariaHidden: false, pointerNone: false, anc: [],
    clipX: false, clipY: false, clipRatioX: 1, clipRatioY: 1, ellipsis: false, clipBox: null, covered: 0, ...extra,
  };
}
const probe = (items, lines = []) => ({ scale: 1, designScale: 1, lines, items, truncated: false });
const run = (items, props = {}, lines = []) => analyzeSlideLayout({ index: 2, layout: 'theme03_page022', probe: probe(items, lines), props });
const codes = issues => issues.map(issue => issue.code);

test('canvasOverflow：右侧超出 10px → 命中；左侧 -7px、右侧 7px 不算；底部整行在画布外也算', () => {
  assert.equal(canvasOverflow([1527, 100, 400, 50]), null);
  const right = canvasOverflow([1530, 100, 400, 50]);
  assert.ok(right && right.ox === 10);
  assert.equal(canvasOverflow([-7, 100, 400, 50]), null);
  const below = canvasOverflow([100, 1156, 257, 32]);
  assert.ok(below && below.oy > 100 && below.ratio === 0);
});

test('TEXT_OVERFLOW：文字超出画布，定位到字段 → fixable:true，message 给字段路径与建议字数', () => {
  const issues = run([item('这是一个特别特别长的议程名称文字', [1500, 200, 600, 60])], { agenda: { title: '这是一个特别特别长的议程名称文字' } });
  assert.equal(issues.length, 1);
  assert.equal(issues[0].code, 'TEXT_OVERFLOW');
  assert.equal(issues[0].index, 2);
  assert.equal(issues[0].field, 'agenda.title');
  assert.equal(issues[0].fixable, true);
  assert.match(issues[0].message, /第 3 页/);
  assert.match(issues[0].message, /agenda\.title/);
  assert.match(issues[0].message, /请缩短到约 \d+ 字/);
});

test('TEXT_OVERFLOW：找不到对应字段 → field:null、fixable:false', () => {
  const issues = run([item('组件写死的文字', [1800, 200, 400, 60])], { title: '别的内容' });
  assert.equal(issues.length, 1);
  assert.equal(issues[0].field, null);
  assert.equal(issues[0].fixable, false);
  assert.match(issues[0].message, /找不到对应的字段/);
});

test('TEXT_OVERFLOW：元素自己 overflow 裁掉（clipX）→ 命中；跑马灯已在页面端排除（clipX 不会置位）', () => {
  const clipped = item('很长很长很长的一行文字', [100, 100, 200, 40], { clipX: true, clipRatioX: 0.5 });
  const issues = run([clipped], { line: '很长很长很长的一行文字' });
  assert.deepEqual(codes(issues), ['TEXT_OVERFLOW']);
  assert.match(issues[0].message, /被裁掉一截/);
  assert.deepEqual(codes(run([item('跑马灯文字', [100, 100, 200, 40])], { line: '跑马灯文字' })), []);
});

test('TEXT_OVERFLOW：被画在上面的不透明元素盖住 ≥30% → 命中；装饰文字不查', () => {
  const covered = item('卡片下面的第二行字', [300, 500, 400, 40], { covered: 0.5 });
  const issues = run([covered], { text: '卡片下面的第二行字' });
  assert.deepEqual(codes(issues), ['TEXT_OVERFLOW']);
  assert.match(issues[0].message, /盖住/);
  assert.deepEqual(codes(run([item('装饰文字内容', [300, 500, 400, 40], { covered: 1, opacity: 0.1 })], { t: '装饰文字内容' })), []);
  assert.deepEqual(codes(run([item('只盖住一点点', [300, 500, 400, 40], { covered: 0.2 })], { t: '只盖住一点点' })), []);
});

test('TEXT_OVERFLOW：超出所在卡片（clipBox）→ 命中；水印（opacity<0.1 / aria-hidden）与序号水印出血不报', () => {
  const box = [100, 100, 300, 400];
  const word = item('智能宠物烘干舱', [100, 80, 300, 500], { opacity: 0.15, clipBox: box, fontSize: 228 });
  assert.deepEqual(codes(run([word], { name: '智能宠物烘干舱' })), ['TEXT_OVERFLOW'], '0.1–0.3 的淡字、是个词：要查');
  assert.deepEqual(codes(run([{ ...word, opacity: 0.05 }], { name: '智能宠物烘干舱' })), [], '几乎看不见的水印不查');
  assert.deepEqual(codes(run([{ ...word, ariaHidden: true }], { name: '智能宠物烘干舱' })), [], 'aria-hidden 是装饰');
  const numeral = item('02', [100, 80, 300, 500], { opacity: 0.16, clipBox: box });
  assert.deepEqual(codes(run([numeral], { no: '02' })), [], '序号水印（不是词）出血是设计');
});

test('装饰巨字不误报：低透明度 / aria-hidden 的大字出血画布，不报 TEXT_OVERFLOW，也不参与 TEXT_OVERLAP', () => {
  const watermark = item('2026', [-300, 700, 1500, 800], { fontSize: 800, opacity: 0.05, pointerNone: true });
  const hidden = item('荣光', [1500, 100, 900, 900], { fontSize: 600, opacity: 0.92, ariaHidden: true });
  const body = item('今年的一句话', [200, 800, 600, 60]);
  assert.deepEqual(run([watermark, hidden, body], { t: '今年的一句话' }), []);
});

test('装饰巨字不误报：字号 > 160 且 pointer-events:none 的背景大字压着正文，不报 TEXT_OVERLAP', () => {
  const ghost = item('MONTHLY', [0, 200, 1900, 700], { fontSize: 852, opacity: 0.5, pointerNone: true });
  const body = item('月度营收走势', [200, 400, 500, 60]);
  assert.deepEqual(codes(run([ghost, body], { t: '月度营收走势' })), []);
  const realBig = item('营收同比', [120, 49, 719, 742], { fontSize: 578 });
  const label = item('2026 年度答卷', [132, 300, 181, 28], { fontSize: 37 });
  assert.deepEqual(codes(run([realBig, label], { a: '营收同比', b: '2026 年度答卷' })), ['TEXT_OVERLAP'], '不透明的大号正文盖住小标签：要报');
});

test('TEXT_OVERLAP：两段文字相交面积 ≥ 较小者 30% → 命中，field 指向较长的那个字段', () => {
  const a = item('第四步 · 10–12 月的交付', [100, 100, 300, 40]);
  const b = item('品质层', [120, 100, 100, 40]);
  const issues = run([a, b], { steps: [{ label: '第四步 · 10–12 月的交付' }], layers: [{ zh: '品质层' }] });
  assert.deepEqual(codes(issues), ['TEXT_OVERLAP']);
  assert.equal(issues[0].field, 'steps[0].label');
  assert.equal(issues[0].fixable, true);
  assert.match(issues[0].message, /互相压住/);
});

test('TEXT_OVERLAP：相交不足 30%、父子关系、同样的字叠两层、大小字上下紧挨（行框重叠但字不碰）→ 不报', () => {
  const props = { a: '标题文字', b: '副标题文字' };
  assert.deepEqual(codes(run([item('标题文字', [100, 100, 300, 40]), item('副标题文字', [380, 100, 300, 40])], props)), [], '只擦边');
  const parent = item('标题文字', [100, 100, 300, 40]);
  const child = item('副标题文字', [100, 100, 300, 40], { anc: [parent.id] });
  assert.deepEqual(codes(run([parent, child], props)), [], '父子');
  assert.deepEqual(codes(run([item('描边文字', [100, 100, 300, 40]), item('描边文字', [102, 102, 300, 40])], { t: '描边文字' })), [], '同字叠层');
  // 小标签紧贴在大数字上方：两个行框相交约 40%，但按墨迹收窄后不相交
  const big = item('1286', [100, 140, 300, 200], { fontSize: 160, lineRects: [[100, 140, 300, 200]] });
  const label = item('门店数', [100, 110, 100, 50], { fontSize: 30, lineRects: [[100, 110, 100, 50]] });
  assert.deepEqual(codes(run([big, label], { n: '1286', l: '门店数' })), []);
});

test('inkRects：汉字按 0.75、数字 / 拉丁按 0.6 收窄并居中', () => {
  const [han] = inkRects({ text: '门店', lineRects: [[0, 0, 100, 100]] });
  const [num] = inkRects({ text: '1286', lineRects: [[0, 0, 100, 100]] });
  assert.deepEqual(han, [0, 12.5, 100, 75]);
  assert.deepEqual(num, [0, 20, 100, 60]);
});

test('DUP_TEXT：「万元万元」+ 我们的 props 里没有这个重复 → 命中，message 给两个字段', () => {
  const props = { unit: '万元', steps: [{ display: '7860 万元' }] };
  const issues = run([item('7860 万元', [100, 100, 200, 40]), item('万元', [300, 100, 60, 40])], props, ['7860 万元万元']);
  const dup = issues.filter(issue => issue.code === 'DUP_TEXT');
  assert.equal(dup.length, 1);
  assert.equal(dup[0].fixable, true);
  assert.match(dup[0].message, /拼接后出现重复『万元』/);
  assert.match(dup[0].message, /unit/);
  assert.match(dup[0].message, /steps\[0\]\.display/);
});

test('DUP_TEXT：我们写的文字里就有这个重复 / 纯数字 / 同一个字重复 / 英文短词 / 大小字号悬殊的标题 + 副标题 → 不报', () => {
  const none = (lines, props = {}, items = []) => codes(run(items, props, lines)).includes('DUP_TEXT');
  assert.equal(none(['天天向上天天向上'], { t: '天天向上天天向上' }), false, '作者自己写的');
  assert.equal(none(['营收 1010 增长 2020'], {}), false, '纯数字');
  assert.equal(none(['哈哈哈哈'], {}), false, '同一个字');
  assert.equal(none(['OTCOTC'], {}), false, '英文短词');
  const big = item('击鼓迎', [100, 100, 150, 40], { fontSize: 40 });
  const small = item('击鼓迎新', [260, 110, 100, 24], { fontSize: 20 });
  assert.equal(none(['击鼓迎击鼓迎新'], { title: '击鼓迎新', acts: ['击鼓迎新'] }, [big, small]), false, '大小悬殊');
  assert.equal(none(['陈知远陈知远'], { name: '陈知远', nameEm: '陈知远' }, [item('陈知远', [0, 0, 100, 40]), item('陈知远', [100, 0, 100, 40])]), true, '同号字拼接：要报');
});

test('DUP_TEXT：只有一个字段含该片段（页面自带同样的字）→ 去掉字段里的重复；找不到字段 → fixable:false', () => {
  const one = run([], { unit: '亿元' }, ['2.6 亿元亿元']);
  assert.equal(one[0].code, 'DUP_TEXT');
  assert.equal(one[0].field, 'unit');
  assert.match(one[0].message, /与页面自带的文字重复/);
  const none = run([], { other: 'x' }, ['湖滨店夺冠湖滨店夺冠']);
  assert.equal(none[0].fixable, false);
  assert.equal(none[0].field, null);
});

test('同一页同一 code 最多 3 条，按严重程度排序', () => {
  const many = [];
  for (let i = 0; i < 6; i += 1) many.push(item(`第${i}项很长的文字`, [1500, 100 + i * 100, 300 + i * 50, 40]));
  const props = { rows: many.map(entry => entry.text) };
  const issues = run(many, props);
  assert.equal(issues.length, MAX_PER_CODE);
  assert.equal(issues[0].field, 'rows[5]', '超出最多的排最前');
});

test('locateFields：整段相同 > 拼接（字段是元素文字的一部分）> 长文本分到多个元素；找不到返回空', () => {
  const leaves = propLeaves({ a: '全年营收', b: '12864', c: '月度趋势走势说明文字', d: '无关内容', n: 42 });
  assert.equal(locateFields('全年营收', leaves)[0].path, 'a');
  assert.deepEqual(locateFields('全年营收12864', leaves).map(leaf => leaf.path).slice(0, 2).sort(), ['a', 'b']);
  assert.equal(locateFields('趋势走势说明', leaves)[0].path, 'c');
  assert.deepEqual(locateFields('不存在的文字', leaves), []);
  assert.equal(locateFields('42', leaves)[0].path, 'n', '数字字段也能对上');
});

test('compact / clipOverflow 小工具', () => {
  assert.equal(compact('<em>A b</em>\n C'), 'abc');
  assert.equal(clipOverflow([0, 0, 10, 10], null), null);
  assert.equal(clipOverflow([100, 100, 100, 100], [90, 90, 300, 300]), null);
  const out = clipOverflow([100, 100, 100, 100], [100, 100, 50, 300]);
  assert.ok(out && out.ox === 50 && out.ratio === 0.5);
});
