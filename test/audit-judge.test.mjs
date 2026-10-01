import { test } from 'node:test';
import assert from 'node:assert/strict';
import { removeMarkers, residualText, candidatesFromLines, classifyCandidate, stripWhitelist, findBrandIcons, isMediaText, judgeLayout } from '../scripts/audit/judge.mjs';

const MK = ['M00', 'M01', 'M0A', 'M10'];

test('removeMarkers：长的先去，M1 不伤 M10；紧挨着的标记也去掉；短标记要有边界', () => {
  assert.equal(removeMarkers('M10 M01', MK).trim(), '');
  assert.equal(removeMarkers('M0AM0B', ['M0A', 'M0B']).trim(), '', '连在一起也去');
  assert.equal(removeMarkers('IGNIS M00 燃点', MK).replace(/\s+/g, ' ').trim(), 'IGNIS 燃点');
  assert.equal(removeMarkers('AB7', ['7']).trim(), 'AB7', '短标记两侧是字母数字时不动');
  assert.equal(removeMarkers('A 7 B', ['7']).replace(/\s+/g, ' ').trim(), 'A B');
});

test('residualText：数值各种形态、纯标点箭头序号、单个字符都被去掉', () => {
  const cases = ['1,250', '12.5%', '+182%', '−3.4', '2,400+', '01', '02 / 16', '→', '·', '/', '— ', '12 月', 'M00 — M01', '★', '①'];
  for (const text of cases) assert.equal(residualText(text, MK), '', `应该去干净：${text}`);
  assert.equal(residualText('IGNIS 燃点', MK), 'IGNIS 燃点');
  assert.equal(residualText('01 → Brands served', MK), 'Brands served');
  assert.equal(residualText('A B 季度', MK), '季度', '单个字符被去掉');
  assert.equal(residualText('Q3 回顾', MK), 'Q3 回顾', '紧挨字母的数字不当数值处理（Q3 保留，但它不满足写死条件）');
});

test('candidatesFromLines：按行返回非空候选', () => {
  const out = candidatesFromLines(['M00', '1 / 5', 'IGNIS 燃点', '  ', '→ M01'], MK);
  assert.deepEqual(out.map(item => item.text), ['IGNIS 燃点']);
});

test('classifyCandidate：汉字、多个英文词、禁用词 → hardcoded；单个英文词 → uncertain；白名单 → whitelisted', () => {
  assert.equal(classifyCandidate('门店开业').kind, 'hardcoded');
  assert.equal(classifyCandidate('Brands served').kind, 'hardcoded');
  assert.equal(classifyCandidate('IGNIS').kind, 'hardcoded', '禁用词直接判');
  assert.equal(classifyCandidate('燃点').kind, 'hardcoded');
  assert.equal(classifyCandidate('faster').kind, 'uncertain');
  assert.equal(classifyCandidate('TOP').kind, 'whitelisted');
  assert.equal(classifyCandidate('JAN FEB').kind, 'whitelisted');
  assert.equal(classifyCandidate('一月 二月').kind, 'whitelisted');
  assert.equal(classifyCandidate('No').kind, 'whitelisted');
  assert.equal(classifyCandidate('TOP 门店').kind, 'hardcoded', '白名单词旁边还有汉字');
  assert.equal(classifyCandidate('AB').kind, 'whitelisted', '2 个字母不满足 3 字母词');
  assert.equal(classifyCandidate('汉').kind, 'whitelisted', '单个汉字不满足 2 汉字');
});

test('stripWhitelist：大小写不敏感、整词匹配', () => {
  assert.equal(stripWhitelist('Top Jan').trim(), '');
  assert.match(stripWhitelist('Topic'), /Topic/, 'Topic 不是 Top');
  assert.equal(stripWhitelist('第一季度').trim(), '');
});

test('findBrandIcons / isMediaText', () => {
  assert.deepEqual(findBrandIcons(['/assets/social-icons/douyin.svg', 'data:image/svg+xml,xx', '/a/b.png']), ['/assets/social-icons/douyin.svg']);
  assert.deepEqual(findBrandIcons(['https://x/github.svg']), ['https://x/github.svg']);
  assert.deepEqual(findBrandIcons(['/a/bilibili-tv.png']), ['/a/bilibili-tv.png'], '连字符算词边界');
  assert.deepEqual(findBrandIcons(['/a/githubber.png', '/a/xwechatx.png']), [], '词的一部分不算');
  assert.equal(isMediaText('// 图片数量 = 0'), true);
  assert.equal(isMediaText('点击 拖拽上传'), true);
  assert.equal(isMediaText('Image'), true);
  assert.equal(isMediaText('media'), true);
  assert.equal(isMediaText('门店开业'), false);
});

test('judgeLayout：综合判定与证据', () => {
  const hard = judgeLayout({ lines: ['M00', 'IGNIS 燃点', '2 / 16'], markers: MK, resources: [] });
  assert.deepEqual(hard.categories, ['hardcoded']);
  assert.deepEqual(hard.evidence.hardcoded, ['IGNIS 燃点']);
  const media = judgeLayout({ lines: ['// 图片数量 = 0', 'M00'], markers: MK, resources: [] });
  assert.deepEqual(media.categories, ['media']);
  assert.deepEqual(media.evidence.hardcoded, [], '媒体占位不重复算写死文字');
  const brand = judgeLayout({ lines: ['M00'], markers: MK, resources: ['/assets/social-icons/redbook.svg'] });
  assert.deepEqual(brand.categories, ['brandIcon']);
  const clean = judgeLayout({ lines: ['M00', '01', '→', 'TOP'], markers: MK, resources: [] });
  assert.deepEqual(clean.categories, []);
  assert.deepEqual(clean.whitelisted, ['TOP']);
  const unsure = judgeLayout({ lines: ['M00', 'faster'], markers: MK, resources: [] });
  assert.deepEqual(unsure.categories, []);
  assert.deepEqual(unsure.uncertain, ['faster']);
});
