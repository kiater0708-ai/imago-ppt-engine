// 主题组件「求和结果取整」补丁（NOTICE.md 里的 3 处 imago 改）：6 个文件都带补丁，且取整函数行为正确
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { RUNTIME_DIR } from '../app/lib/paths.mjs';

const DIR = path.join(RUNTIME_DIR, 'dist', 'theme-runtime');
const FILES = ['06', '08', '11'].flatMap(n => [`theme${n}.module.mjs`, `imported-theme-runtime.theme${n}.js`]);
const MARK = '// imago 改：求和结果取整，防浮点尾差';

test('6 个主题运行时文件各带 1 处取整补丁与注释，且补丁函数被调用', () => {
  for (const file of FILES) {
    const text = fs.readFileSync(path.join(DIR, file), 'utf8');
    assert.equal(text.split(MARK).length - 1, 1, `${file} 的注释标记数量`);
    assert.equal(text.split('function imagoRoundSum(').length - 1, 1, `${file} 的函数定义数量`);
    assert.ok(text.split('imagoRoundSum(').length - 1 >= 2, `${file} 里取整函数没有被调用`);
  }
});

function loadHelper() {
  const text = fs.readFileSync(path.join(DIR, FILES[0]), 'utf8');
  const start = text.indexOf('function imagoRoundSum(');
  const end = text.indexOf('\n', start);
  // eslint-disable-next-line no-new-func
  return new Function(`${text.slice(start, end)}; return imagoRoundSum;`)();
}

test('imagoRoundSum：按输入数据的最大小数位取整，去掉末尾 0；整数仍是整数', () => {
  const round = loadHelper();
  assert.equal(round(5.199999999999999, [1.8, 0.6, 0.7, 0.8, 1.3]), 5.2);
  assert.equal(round(10.899999999999999, [2.6, 1.5, 2.2, 2.4, 2.2]), 10.9);
  assert.equal(round(3.9000000000000004, [1.8, 2.1]), 3.9);
  assert.equal(round(0.1 + 0.2, [0.1, 0.2]), 0.3);
  assert.equal(round(970, [420, 245, 158, 97, 50]), 970);
  assert.equal(round(3.5, [1.25, 2.25]), 3.5, '多保留的位数不会补 0');
  assert.equal(round(3.14, [1.07, 2.07]), 3.14, '两位小数的输入保留两位');
  assert.equal(round(NaN, [1, 2]), NaN);
  assert.equal(round(7, []), 7);
});
