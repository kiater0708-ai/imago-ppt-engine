// 第一轮审查修复：多主题 goal、校验输出解析、命令查找（审查 6、13、15、16）
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCli, tmpDir, fixture, readJsonFile } from './helpers.mjs';

const root = tmpDir('imago-goal-');
after(() => fs.rmSync(root, { recursive: true, force: true }));

test('审查6：goal 混用 theme11 与 theme08 → BAD_REQUEST（中文说明），不进入渲染', async () => {
  const goal = readJsonFile(fixture('gala-deck2'));
  const other = readJsonFile(fixture('flow-gala-t08'));
  goal.slides[1] = other.slides[1]; // theme08 的一页混进 theme11 的 goal
  const file = path.join(root, 'mixed.goal.json');
  fs.writeFileSync(file, JSON.stringify(goal));
  const res = await runCli('check', { request: { protocol: 1, goal: file, workDir: path.join(root, 'w-mixed') } });
  assert.equal(res.status, 2, `退出码应为 2，实际 ${res.status}；${JSON.stringify(res.last).slice(0, 300)}`);
  assert.equal(res.last.code, 'BAD_REQUEST');
  assert.match(res.last.message, /[\u4e00-\u9fa5]/);
  assert.match(res.last.message, /theme11/);
  assert.match(res.last.message, /theme08/);
  assert.equal(fs.existsSync(path.join(root, 'w-mixed', 'ppt')), false, '不应已渲染');
});

test('审查6：layout 与 themePack 不一致 → BAD_REQUEST', async () => {
  const goal = readJsonFile(fixture('gala-deck2'));
  goal.themePack = 'theme08';
  const file = path.join(root, 'packmismatch.goal.json');
  fs.writeFileSync(file, JSON.stringify(goal));
  const res = await runCli('check', { request: { protocol: 1, goal: file, workDir: path.join(root, 'w-pack') } });
  assert.equal(res.status, 2);
  assert.equal(res.last.code, 'BAD_REQUEST');
  assert.match(res.last.message, /themePack/);
});

test('审查6：assertSingleTheme：单主题通过；没有 themePack 时以 layout 前缀为准；无法识别的 layout 交给 goal-spec', async () => {
  const { assertSingleTheme } = await import('../app/lib/check.mjs');
  assert.doesNotThrow(() => assertSingleTheme({ themePack: 'theme11', slides: [{ layout: 'theme11_page001' }, { layout: 'theme11_page007' }] }));
  assert.doesNotThrow(() => assertSingleTheme({ slides: [{ layout: 'theme05_page001' }] }));
  assert.doesNotThrow(() => assertSingleTheme({ themePack: 'theme11', slides: [{ layout: 'page001' }, { layout: 'theme11_page002' }] }));
  assert.throws(() => assertSingleTheme({ slides: [{ layout: 'theme01_page001' }, { layout: 'theme02_page001' }] }), error => error.code === 'BAD_REQUEST');
});

test('审查13：deck 级「同一版式用于多页」→ 逐页展开（第 2、4 页），不再归到首个使用该版式的页；fixable:true', async () => {
  const { issuesFromValidatorLine } = await import('../app/lib/issues.mjs');
  const layouts = ['theme11_page001', 'theme11_page007', 'theme11_page045', 'theme11_page007'];
  const line = 'deck field slides: duplicate layout theme11_page007 used on slides 2, 4; choose a unique layout for each slide';
  const issues = issuesFromValidatorLine(line, layouts);
  assert.deepEqual(issues.map(item => item.index), [1, 3]);
  for (const item of issues) {
    assert.equal(item.layout, 'theme11_page007');
    assert.equal(item.fixable, true);
    assert.match(item.message, /大师原文/);
  }
});

test('审查13：deck 级问题没有页号 → index:null；「重复核心文案」按出现页展开且可修复；页级问题不受影响', async () => {
  const { issuesFromValidatorLine } = await import('../app/lib/issues.mjs');
  const layouts = ['a', 'b', 'c', 'd', 'e'];
  const none = issuesFromValidatorLine('deck field slides: final delivery goal must include non-empty slides', layouts);
  assert.equal(none.length, 1);
  assert.equal(none[0].index, null);
  const repeated = issuesFromValidatorLine('deck field slides: repeated core copy "年度回顾" appears on 4 slides (slide 1 a headline, slide 3 c headline, slide 4 d headline, slide 5 e headline); vary page titles/core copy', layouts);
  assert.deepEqual(repeated.map(item => item.index), [0, 2, 3, 4]);
  assert.ok(repeated.every(item => item.fixable === true));
  const page = issuesFromValidatorLine('slide 2 theme theme11 layout theme11_page007 field ghostMark: unknown prop for this layout', ['x', 'theme11_page007']);
  assert.deepEqual(page.map(item => [item.index, item.field, item.code, item.fixable]), [[1, 'ghostMark', 'UNKNOWN_PROP', true]]);
});

test('审查15：write-safe-props 退出码 0 但输出不是合法 JSON / 被截断 / 结构不对 → RENDER_FAILED', async () => {
  const { safePropsErrors } = await import('../app/lib/issues.mjs');
  const bad = ['', '{"ok":true,"layoutChanges":[', 'not json', '[]', '{"layoutChanges":"x","ok":true}', '{"ok":true,"layoutChanges":[],"slides":"x"}'];
  for (const stdout of bad) {
    assert.throws(() => safePropsErrors(stdout, { exitOk: true }), error => error.code === 'RENDER_FAILED', `输出 ${JSON.stringify(stdout)} 应报 RENDER_FAILED`);
  }
  assert.throws(() => safePropsErrors('{"ok":true,"layoutChanges":[]}', { exitOk: true, truncated: true }), error => error.code === 'RENDER_FAILED');
  const good = safePropsErrors('{"ok":true,"layoutChanges":[{"slide":1}],"slides":[]}', { exitOk: true });
  assert.deepEqual(good.data.layoutChanges, [{ slide: 1 }]);
  // 退出码非 0：JSON 里要有错误行，否则同样是流程失败
  assert.throws(() => safePropsErrors('{"ok":false,"layoutChanges":[],"slides":[]}', { exitOk: false }), error => error.code === 'RENDER_FAILED');
  const withErrors = safePropsErrors('{"ok":false,"layoutChanges":[],"goalSpecErrors":["slide 1 layout x field a: unknown prop for this layout"],"slides":[]}', { exitOk: false });
  assert.equal(withErrors.lines.length, 1);
});

test('审查16：constructor / toString / __proto__ 等继承属性名 → BAD_REQUEST（退出码 2），不是 INTERNAL', async () => {
  for (const name of ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf']) {
    const res = await runCli(name, {});
    assert.equal(res.status, 2, `${name}：退出码应为 2，实际 ${res.status}`);
    assert.equal(res.last.code, 'BAD_REQUEST', name);
  }
});
