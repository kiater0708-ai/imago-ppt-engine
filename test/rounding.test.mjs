import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roundFloatTail, normalizeNumbers } from '../app/lib/rounding.mjs';

test('浮点规整：5.199999999999999 → 5.2', () => {
  assert.equal(roundFloatTail(5.199999999999999), 5.2);
  assert.equal(roundFloatTail(0.1 + 0.2), 0.3);
  assert.equal(roundFloatTail(-2.7999999999999998), -2.8);
});

test('浮点规整：不改真实数值和整数', () => {
  for (const v of [3.14159265, 5.1999999, 123456.7, 7, 0, -12, 1e-9, 99.95, 0.125]) assert.equal(roundFloatTail(v), v, String(v));
  assert.ok(Number.isNaN(roundFloatTail(NaN)));
  assert.equal(roundFloatTail('5.199999999999999'), '5.199999999999999');
});

test('normalizeNumbers：递归处理对象与数组，返回改动清单，字符串不动', () => {
  const props = { a: 5.199999999999999, s: '5.199999999999999', list: [1, 0.30000000000000004, { v: 2.0000000000000004 }], nested: { deep: [[4.699999999999999]] } };
  const changes = normalizeNumbers(props);
  assert.equal(props.a, 5.2);
  assert.equal(props.s, '5.199999999999999');
  assert.deepEqual(props.list, [1, 0.3, { v: 2 }]);
  assert.deepEqual(props.nested.deep, [[4.7]]);
  assert.deepEqual(changes.map(item => item.path).sort(), ['a', 'list[1]', 'list[2].v', 'nested.deep[0][0]'].sort());
});
