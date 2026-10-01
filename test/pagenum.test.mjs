// 页码规整（去页后页码与总数按实际页数重写）与长尾小数检测
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { renumber, normalizePageNumbers } from '../app/lib/pagenum.mjs';
import { findFloatArtifacts } from '../app/lib/residue.mjs';
import { runCli, tmpDir, PLUG } from './helpers.mjs';

const root = tmpDir('imago-pagenum-');
after(() => fs.rmSync(root, { recursive: true, force: true }));

test('renumber：fraction 保留补零宽度与分隔写法', () => {
  assert.equal(renumber('05 / 15', 'fraction', 5, 14), '05 / 14');
  assert.equal(renumber('12 / 15', 'fraction', 11, 14), '11 / 14');
  assert.equal(renumber('5/15', 'fraction', 5, 14), '5/14');
  assert.equal(renumber('01 / 5', 'fraction', 1, 14), '01 / 14');
  assert.equal(renumber(' 03 / 15 ', 'fraction', 3, 14), ' 03 / 14 ');
});

test('renumber：已经正确、不是页码格式 → null', () => {
  assert.equal(renumber('05 / 14', 'fraction', 5, 14), null);
  assert.equal(renumber('第 5 页', 'fraction', 5, 14), null);
  assert.equal(renumber('5 / 5 分', 'fraction', 5, 14), null);
  assert.equal(renumber('', 'fraction', 5, 14), null);
  assert.equal(renumber('abc', 'position', 5, 14), null);
});

test('renumber：position / total 只改各自的数字', () => {
  assert.equal(renumber('06', 'position', 5, 12), '05');
  assert.equal(renumber('15', 'total', 5, 12), '12');
  assert.equal(renumber('05', 'position', 5, 12), null);
  assert.equal(renumber('12', 'total', 5, 12), null);
  assert.equal(renumber('1', 'total', 5, 12), '12');
});

function slide(layout, props) { return { layout, props }; }

test('normalizePageNumbers：theme02 的 index 与 theme12 的 page/total 按实际位置重写，其他字段与其他主题不动', () => {
  const goal = {
    slides: [
      slide('theme02_page003', { index: '01 / 15', title: 'a' }),
      slide('theme02_page007', { index: '03 / 15' }), // 去页后序号也要顺
      slide('theme02_page047', { index: '05 / 15', quote: '5 / 15' }),
      slide('theme12_page005', { page: '01', total: '15' }),
      slide('theme12_page006', { page: '07', total: '15' }),
      slide('theme04_page051', { copy: { text011: '04 / 15' } }),
      slide('theme11_page039', { index: '9 / 15' }),
      slide('theme02_page011', {}),
      slide('theme02_page012', { index: 7 }), // 非字符串不碰
    ],
  };
  const changes = normalizePageNumbers(goal);
  assert.deepEqual(goal.slides.map(item => item.props.index), ['01 / 09', '02 / 09', '03 / 09', undefined, undefined, undefined, '9 / 15', undefined, 7]);
  assert.equal(goal.slides[2].props.quote, '5 / 15', '同形的别的字段不改');
  assert.deepEqual([goal.slides[3].props.page, goal.slides[3].props.total], ['04', '09']);
  assert.deepEqual([goal.slides[4].props.page, goal.slides[4].props.total], ['05', '09']);
  assert.equal(goal.slides[5].props.copy.text011, '04 / 15', 'theme04 的评分字段不改');
  assert.deepEqual(changes.map(item => `${item.index}:${item.field}`), ['0:index', '1:index', '2:index', '3:page', '3:total', '4:page', '4:total']);
  assert.deepEqual(changes[1], { index: 1, layout: 'theme02_page007', field: 'index', from: '03 / 15', to: '02 / 09' });
  assert.deepEqual(normalizePageNumbers(goal), [], '第二次不再有改动');
});

test('normalizePageNumbers：slide 没有 props 不报错', () => {
  const goal = { slides: [{ layout: 'theme02_page003' }, slide('theme02_page003', { index: '02 / 3' })] };
  assert.deepEqual(normalizePageNumbers(goal).map(item => item.to), ['02 / 2']);
});

test('findFloatArtifacts：长尾小数命中，正常小数、整数、短小数不命中', () => {
  assert.deepEqual(findFloatArtifacts('合计 5.199999999999999亿元 / TOTAL 5.199999999999999 + 3.9000000000000004'), ['5.199999999999999', '3.9000000000000004']);
  assert.deepEqual(findFloatArtifacts('+1.7999999999999998亿'), ['1.7999999999999998']);
  assert.deepEqual(findFloatArtifacts('5.2 亿，同比 +33.3%，0.65 亿，3.14159 万，12345'), []);
  assert.deepEqual(findFloatArtifacts('1.234567'), ['1.234567'], '恰好 6 位算');
  assert.deepEqual(findFloatArtifacts('1.23456'), [], '5 位不算');
  assert.deepEqual(findFloatArtifacts(''), []);
});

test('check：页面可见文字里的长尾小数 → FLOAT_ARTIFACT（按页定位、fixable:false）', { timeout: 120000 }, async () => {
  const goal = JSON.parse(fs.readFileSync(path.join(PLUG, 'app', 'selftest', 'goal.json'), 'utf8'));
  goal.slides[0].props.headlineHtml = '合计 5.199999999999999 亿元，<br>同比 +33.3%。';
  const file = path.join(root, 'float.goal.json');
  fs.writeFileSync(file, JSON.stringify(goal));
  const res = await runCli('check', { request: { protocol: 1, goal: file, workDir: path.join(root, 'w-float') } });
  assert.equal(res.status, 0, res.stderr.slice(0, 400));
  const hits = res.last.issues.filter(item => item.code === 'FLOAT_ARTIFACT');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].index, 0);
  assert.equal(hits[0].layout, goal.slides[0].layout);
  assert.equal(hits[0].fixable, false);
  assert.match(hits[0].message, /5\.199999999999999/);
  assert.equal(res.last.ok, false);
  assert.deepEqual(res.last.normalized, []);
});
