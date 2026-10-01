import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectValues, selectControls, compareGeometry, judgeControl } from '../scripts/audit/controls.mjs';
import { makeBatches, isCoverLayout } from '../scripts/audit/batches.mjs';
import { mergeCuration, autoReason, trimStyleControlsForContractLimit } from '../scripts/audit/curation-write.mjs';
import { loadEngine } from '../app/lib/layouts.mjs';
import { emptyCuration, validateCuration } from '../app/lib/curation.mjs';
import { mapPool } from '../scripts/audit/theme-audit.mjs';
import { runWithBisect } from '../scripts/audit/runner.mjs';

test('selectValues / selectControls：只收 select，取值去重，不足 2 个的不收', () => {
  assert.deepEqual(selectValues({ options: [{ value: 'a' }, { value: 'b' }, { value: 'a' }, { value: 3 }, {}] }), ['a', 'b', 3]);
  assert.deepEqual(selectValues({}), []);
  const record = { controls: [
    { key: 'surface', type: 'select', default: 'a', options: [{ value: 'a' }, { value: 'b' }] },
    { key: 'one', type: 'select', default: 'a', options: [{ value: 'a' }] },
    { key: 'show', type: 'toggle', default: true },
    { key: 'n', type: 'range', default: 1, min: 0, max: 3 },
  ] };
  assert.deepEqual(selectControls(record).map(item => item.key), ['surface']);
  assert.deepEqual(selectControls(null), []);
});

test('compareGeometry：容差 2 像素；数量不同、任一分量超差都算不同', () => {
  const base = [[0, 0, 100, 50], [10, 20, 30, 40]];
  assert.equal(compareGeometry(base, base).same, true);
  assert.equal(compareGeometry(base, [[1.9, -1.9, 101.9, 50], [10, 20, 30, 40]]).same, true);
  const far = compareGeometry(base, [[0, 0, 100, 50], [10, 22.1, 30, 40]]);
  assert.equal(far.same, false);
  assert.match(far.reason, /y 相差 2\.1px/);
  assert.equal(compareGeometry(base, [[0, 0, 100, 50]]).same, false);
  assert.match(compareGeometry(base, [[0, 0, 100, 50]]).reason, /元素数量 2 → 1/);
  assert.equal(compareGeometry(null, base).same, false);
  assert.equal(compareGeometry([[0, 0, NaN, 0]], [[0, 0, 1, 0]]).same, false);
  assert.equal(compareGeometry([], []).same, true);
});

test('judgeControl：全部取值与各自基线一致才算只改外观；渲染失败不收', () => {
  const g = [[0, 0, 10, 10]];
  assert.equal(judgeControl(null, [{ value: 'x', geometry: g, base: g }, { value: 'y', geometry: [[1, 1, 10, 10]], base: g }]).safe, true);
  assert.equal(judgeControl(null, [{ value: 'x', geometry: [[50, 0, 10, 10]], base: g }]).safe, false);
  const failed = judgeControl(null, [{ value: 'x', geometry: null, error: '渲染失败' }]);
  assert.equal(failed.safe, false);
  assert.match(failed.reason, /渲染失败/);
  assert.equal(judgeControl(g, [{ value: 'x', geometry: g }]).safe, true, '没有逐项基线时用总基线');
  assert.equal(judgeControl(null, [{ value: 'x', geometry: g }]).safe, false, '两种基线都没有不能判安全');
  assert.equal(judgeControl(g, []).safe, false);
});

test('makeBatches：每批 ≤size、每批最多一个封面候选、版式不丢不重', () => {
  const items = [];
  for (let i = 1; i <= 47; i += 1) items.push({ layout: `theme01_page${String(i).padStart(3, '0')}` });
  const batches = makeBatches(items, 20);
  assert.ok(batches.length >= 5, '5 个封面要 5 批');
  const flat = batches.flat().map(item => item.layout).sort();
  assert.deepEqual(flat, items.map(item => item.layout).sort());
  for (const batch of batches) {
    assert.ok(batch.length <= 20);
    assert.ok(batch.filter(item => isCoverLayout(item.layout)).length <= 1);
  }
  assert.deepEqual(makeBatches([], 20), []);
  assert.throws(() => makeBatches([{ layout: 'a' }, { layout: 'a' }], 20), /重复/);
  assert.throws(() => makeBatches([{ layout: 'a' }], 1), /≥2/);
  assert.equal(makeBatches([{ layout: 'theme01_page001' }, { layout: 'theme01_page002' }], 20).length, 2, '两个封面不能同批');
});

test('mergeCuration：保留手工条目，重写 auto 条目，styleControls 只改审计拥有的键', () => {
  const existing = {
    theme: 'theme11',
    exclude: [
      { layout: 'theme11_page008', reason: '组件写死 IGNIS 燃点' },
      { layout: 'theme11_page011', reason: 'auto:hardcoded「旧证据」' },
      { layout: 'theme11_page099', reason: 'auto:hardcoded「旧版式」' },
    ],
    notes: { theme11_page040: '备注' },
    styleControls: { theme11_page001: [{ key: 'handmade', values: ['x', 'y'] }, { key: 'surface', values: ['旧'] }] },
  };
  const result = {
    layouts: {
      theme11_page008: { status: 'ok', categories: ['hardcoded'], evidence: { hardcoded: ['IGNIS 燃点'], media: [], brandIcon: [] }, controls: [] },
      theme11_page011: { status: 'ok', categories: ['hardcoded'], evidence: { hardcoded: ['IGNIS 燃点'], media: [], brandIcon: [] }, controls: [{ key: 'surface', values: ['a', 'b'], safe: true }] },
      theme11_page012: { status: 'ok', categories: ['media', 'brandIcon'], evidence: { hardcoded: [], media: ['点击 拖拽上传'], brandIcon: ['/assets/social-icons/douyin.svg'] }, controls: [] },
      theme11_page001: { status: 'ok', categories: [], evidence: { hardcoded: [], media: [], brandIcon: [] }, controls: [{ key: 'surface', values: ['ink', 'paper'], safe: true }, { key: 'align', values: ['l', 'r'], safe: false }] },
      theme11_page002: { status: 'renderFailed', categories: [], evidence: {}, controls: [] },
    },
  };
  const merged = mergeCuration(existing, result);
  const reasons = Object.fromEntries(merged.curation.exclude.map(item => [item.layout, item.reason]));
  assert.equal(reasons.theme11_page008, '组件写死 IGNIS 燃点', '手工条目原样保留');
  assert.equal(reasons.theme11_page011, 'auto:hardcoded「IGNIS 燃点」', '旧的 auto 条目按新证据重写');
  assert.equal(reasons.theme11_page099, undefined, '这次没命中的旧 auto 条目清掉');
  assert.match(reasons.theme11_page012, /^auto:media「点击 拖拽上传」；brandIcon「douyin\.svg」$/);
  assert.equal(merged.curation.exclude.length, 3);
  assert.deepEqual(merged.curation.styleControls.theme11_page001, [{ key: 'handmade', values: ['x', 'y'] }, { key: 'surface', values: ['ink', 'paper'] }]);
  assert.equal(merged.curation.styleControls.theme11_page011, undefined, '被排除的版式不写 styleControls');
  assert.deepEqual(merged.curation.notes, existing.notes);
  assert.equal(merged.styleControlCount, 1);
  assert.deepEqual(validateCuration(merged.curation, 'theme11'), []);
  assert.equal(existing.exclude.length, 3, '不改传入对象');
  const again = mergeCuration(merged.curation, result);
  assert.deepEqual(again.curation, merged.curation, '重复跑结果不变（幂等）');
  assert.equal(autoReason({ categories: ['hardcoded'], evidence: { hardcoded: ['IGNIS 燃点'], media: [], brandIcon: [] } }), 'auto:hardcoded「IGNIS 燃点」');
  assert.deepEqual(emptyCuration('theme01').exclude, []);
});

test('mapPool：并发上限、顺序保持、单个失败不影响其他', async () => {
  let running = 0;
  let peak = 0;
  const out = await mapPool([1, 2, 3, 4, 5, 6], 2, async n => {
    running += 1;
    peak = Math.max(peak, running);
    await new Promise(resolve => setTimeout(resolve, 5));
    running -= 1;
    if (n === 3) throw new Error('坏了');
    return n * 2;
  });
  assert.equal(peak, 2);
  assert.deepEqual(out.map(item => item.value), [2, 4, undefined, 8, 10, 12]);
  assert.equal(out[2].error, '坏了');
});

test('runWithBisect：整批失败对半拆开，隔离出坏版式；其余照常拿到结果', async () => {
  const slides = ['a', 'b', 'c', 'd', 'e'].map(layout => ({ layout }));
  const calls = [];
  const run = async batch => {
    calls.push(batch.map(item => item.layout).join(''));
    if (batch.some(item => item.layout === 'c')) throw new Error('c 渲染失败');
    return batch.map(item => ({ shot: item.layout }));
  };
  const results = await runWithBisect(slides, run);
  assert.equal(results.get('c').error, 'c 渲染失败');
  for (const layout of ['a', 'b', 'd', 'e']) assert.equal(results.get(layout).page.shot, layout);
  assert.equal(results.size, 5);
});

test('trimStyleControlsForContractLimit：写入 styleControls 后契约超 1500 字符，就从最长的控件开始去掉', async () => {
  const engine = await loadEngine();
  const curation = emptyCuration('theme07');
  const big = { key: 'big', values: Array.from({ length: 60 }, (_, i) => `取值${i}`) };
  const small = { key: 'small', values: ['a', 'b'] };
  curation.styleControls.theme07_page054 = [small, big];
  const dropped = trimStyleControlsForContractLimit(engine, 'theme07', curation);
  assert.deepEqual(dropped[0], { layout: 'theme07_page054', key: 'big' }, '先去最长的');
  assert.ok(dropped.length <= 2);
  assert.ok(!dropped.some(item => item.layout !== 'theme07_page054'));
  const { prepareLayouts, buildContracts } = await import('../app/lib/layouts.mjs');
  const { candidates } = prepareLayouts(engine, 'theme07', curation);
  const { oversize } = buildContracts(engine, candidates, [...candidates.keys()], curation);
  assert.ok(!oversize.some(item => (curation.styleControls[item.layout] || []).length), '去完之后不会再有因 styleControls 超长的版式');
  const untouched = emptyCuration('theme07');
  assert.deepEqual(trimStyleControlsForContractLimit(engine, 'theme07', untouched), []);
});
