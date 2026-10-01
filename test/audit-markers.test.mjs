import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../app/lib/layouts.mjs';
import { getByPath } from '../app/lib/residue.mjs';
import { markerText, createMarkerPool, buildMarkerProps, numberValue, setNested, fillByShape, isKeepToken } from '../scripts/audit/markers.mjs';

test('markerText：不超过字数上限，上限够用时是 M + 36 进制', () => {
  assert.equal(markerText(0, 18), 'M00');
  assert.equal(markerText(35, 18), 'M0Z');
  assert.equal(markerText(36, 18), 'M10');
  for (const max of [1, 2, 3, 4, 6, 18]) {
    for (let n = 0; n < 200; n += 1) assert.ok([...markerText(n, max)].length <= max, `n=${n} max=${max}`);
  }
});

test('createMarkerPool：同一页发出的标记互不相同；上限太小放不下时记进 collisions', () => {
  const pool = createMarkerPool();
  const out = Array.from({ length: 300 }, () => pool.next(18));
  assert.equal(new Set(out).size, 300);
  assert.deepEqual(pool.collisions, []);
  const tiny = createMarkerPool();
  const small = Array.from({ length: 36 }, () => tiny.next(1));
  assert.equal(new Set(small).size, 36, '1 个字符有 36 种取值，前 36 个不重复');
  tiny.next(1);
  assert.equal(tiny.collisions.length, 1, '第 37 个放不下，要记录');
});

test('numberValue：有界取中值，无界取示例值，再没有取 0', () => {
  assert.equal(numberValue({ numericBounds: { min: 0, max: 100 } }, 7), 50);
  assert.equal(numberValue({ numericBounds: { min: 1, max: 4 } }, 7), 3);
  assert.equal(numberValue({ numericBounds: { min: 0, max: 1 } }, 7), 0.5);
  assert.equal(numberValue(null, 7), 7);
  assert.equal(numberValue(null, '12'), 12);
  assert.equal(numberValue(null, 'abc'), 0);
  assert.equal(numberValue(null, undefined), 0);
});

test('setNested：点路径写成嵌套对象', () => {
  const target = {};
  setNested(target, 'hero.label', 'x');
  setNested(target, 'hero.sub', 'y');
  setNested(target, 'flat', 'z');
  assert.deepEqual(target, { hero: { label: 'x', sub: 'y' }, flat: 'z' });
});

test('fillByShape：形状优先、元组定长、只写形状里列出的键、枚举 token 保留', () => {
  const pool = createMarkerPool();
  assert.deepEqual(fillByShape(['string', 'string'], ['A'], pool, 't'), ['M00', 'M01'], '多元素形状是定长元组');
  assert.deepEqual(fillByShape(['boolean'], [true, '文字'], pool, 't', { fixedLength: 2 }), [true, true], '形状说 boolean 就全写 boolean');
  const obj = fillByShape({ nm: 'string', v: 'number' }, { nm: '甲', v: 9, kind: 'lead' }, pool, 't');
  assert.deepEqual(Object.keys(obj), ['nm', 'v'], '不写形状外的结构键 kind');
  assert.equal(obj.v, 9);
  assert.equal(fillByShape('string', 'partial', pool, 't'), 'partial');
  assert.equal(isKeepToken('partial'), true);
  assert.equal(isKeepToken('.'), true);
  assert.equal(isKeepToken('季度结算'), false);
  assert.equal(isKeepToken('Brands served'), false);
});

test('buildMarkerProps：合成契约——文本、数组、数量字段、媒体数量 0、点路径', () => {
  const info = {
    fillPlan: {
      text: [
        { key: 'title', type: 'string', maxChars: 6 },
        { key: 'hero.label', type: 'string', maxChars: 2 },
        { key: 'count', type: 'number', maxChars: 4 },
        { key: 'imagePlaceholder', type: 'string', maxChars: 10 },
      ],
      arrays: [
        { key: 'items', visibleCount: 3, maxCount: 5, countKey: 'itemCount', itemShape: { a: 'string', n: 'number' }, itemFields: { a: { type: 'string', maxChars: 3 }, n: { type: 'number', numericBounds: { min: 0, max: 10, enforced: true } } } },
        { key: 'tags', visibleCount: 2, maxCount: 2, countKey: null, itemShape: 'string', item: { maxChars: 4 } },
        { key: 'rows[].cells', visibleCount: 4, itemShape: 'string' },
      ],
    },
    mediaSlots: [{ field: 'media', countKey: 'imageCount' }],
  };
  const { props, markers, collisions } = buildMarkerProps(info, { count: 42 });
  assert.equal(props.imagePlaceholder, undefined);
  assert.equal(props.count, 42);
  assert.equal(props.itemCount, 3);
  assert.equal(props.imageCount, 0, '媒体数量设 0');
  assert.equal(props.media, undefined, '媒体字段不写');
  assert.equal(props.items.length, 3);
  assert.equal(props.items[0].n, 5);
  assert.equal(props.tags.length, 2);
  assert.equal(props['rows[].cells'], undefined, '带 [] 的嵌套数组键不当顶层数组写');
  assert.ok([...props.hero.label].length <= 2, 'maxChars=2 要截短');
  assert.ok([...props.title].length <= 6);
  for (const item of props.items) assert.ok([...item.a].length <= 3);
  for (const tag of props.tags) assert.ok([...tag].length <= 4);
  assert.equal(new Set(markers).size, markers.length, '标记互不相同');
  assert.deepEqual(collisions, []);
});

test('buildMarkerProps：全部真实版式（12 套）——字符串不超上限、标记唯一、不抛错', async () => {
  const engine = await loadEngine();
  let layouts = 0;
  for (const page of engine.THEME_PAGES) {
    let info;
    try { info = engine.inspectLayout(page.key, { compact: true }); } catch { continue; }
    if (!info) continue;
    const record = engine.getLayoutRecord(page.key);
    const built = buildMarkerProps(info, record?.defaultProps || {});
    layouts += 1;
    const strings = [];
    const walk = value => {
      if (typeof value === 'string') strings.push(value);
      else if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === 'object') Object.values(value).forEach(walk);
    };
    walk(built.props);
    for (const field of info.fillPlan.text) {
      const value = getByPath(built.props, field.key);
      if (typeof value === 'string' && field.maxChars) assert.ok([...value].length <= field.maxChars, `${page.key} ${field.key}`);
    }
    for (const array of info.fillPlan.arrays) {
      if (String(array.key).includes('[]')) continue;
      const items = getByPath(built.props, array.key);
      if (!Array.isArray(items)) continue;
      assert.equal(items.length, array.visibleCount, `${page.key} ${array.key} 数量`);
      for (const [name, field] of Object.entries(array.itemFields || {})) {
        for (const item of items) if (typeof item?.[name] === 'string' && field.maxChars && !built.keptTokens.includes(item[name])) assert.ok([...item[name]].length <= field.maxChars, `${page.key} ${array.key}.${name}`);
      }
    }
    const markerSet = new Set(built.markers);
    assert.equal(markerSet.size, built.markers.length, `${page.key} 标记重复`);
    const used = strings.filter(text => markerSet.has(text));
    assert.equal(new Set(used).size, used.length, `${page.key} 同一个标记被用了两次`);
    for (const slot of info.mediaSlots || []) if (slot.countKey) assert.equal(built.props[slot.countKey], 0, `${page.key} 媒体数量`);
  }
  assert.ok(layouts > 900, `只检查了 ${layouts} 个版式`);
});
