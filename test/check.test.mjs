import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { runCli, tmpDir, fixture, readJsonFile } from './helpers.mjs';

const root = tmpDir('imago-check-');
after(() => fs.rmSync(root, { recursive: true, force: true }));
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

async function check(goal, name) {
  const workDir = path.join(root, name);
  const res = await runCli('check', { request: { protocol: 1, goal, workDir } });
  return { res, workDir, result: res.last };
}

test('check：gala-deck2（16 页）→ ok:true、issues 为空，原文件不变', async () => {
  const goal = fixture('gala-deck2');
  const before = sha(goal);
  const { res, workDir, result } = await check(goal, 'gala');
  assert.equal(res.status, 0, res.stderr.slice(0, 500));
  assert.equal(result.event, 'result');
  assert.equal(result.ok, true);
  assert.deepEqual(result.issues, []);
  assert.equal(result.slideCount, 16);
  assert.deepEqual(result.normalized, [], '没有页码字段时 normalized 为空数组');
  assert.equal(result.deckDir, workDir);
  assert.equal(result.goal, path.join(workDir, 'goal.json'));
  assert.ok(fs.existsSync(path.join(workDir, 'ppt', 'index.html')));
  assert.equal(sha(goal), before, '原 goal 文件不能被改');
  for (const step of ['completeness', 'safeProps', 'goalSpec', 'render', 'swiss', 'goalCopy', 'residue']) assert.equal(typeof result.timings[step], 'number', step);
  assert.deepEqual(res.nonJsonLines, []);
  const stages = res.events.filter(item => item.event === 'progress').map(item => item.stage);
  assert.ok(stages.includes('render') && stages.includes('residue'));
});

test('check：flow-gala-1 → 第 4 页 HARDCODED_TEXT（IGNIS / 燃点），fixable:false', async () => {
  const { res, result } = await check(fixture('flow-gala-1'), 'flow1');
  assert.equal(res.status, 0, res.stderr.slice(0, 500));
  assert.equal(result.ok, false);
  const hits = result.issues.filter(item => item.code === 'HARDCODED_TEXT');
  assert.ok(hits.length >= 2);
  for (const item of hits) {
    assert.equal(item.index, 3);
    assert.equal(item.layout, 'theme11_page008');
    assert.equal(item.fixable, false);
  }
  const text = hits.map(item => item.message).join(' ');
  assert.match(text, /IGNIS/);
  assert.match(text, /燃点/);
  assert.equal(result.issues.every(item => item.index === 3), true, '其他页不应有问题');
});

test('check：flow-gala-t08 → 只有 theme08_page082 的 MEDIA_PLACEHOLDER', async () => {
  const { result } = await check(fixture('flow-gala-t08'), 't08');
  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map(item => [item.layout, item.code, item.fixable]), [['theme08_page082', 'MEDIA_PLACEHOLDER', false]]);
});

test('check：手工构造缺字段的 goal → MISSING_FIELD 带字段名；同时 UNKNOWN_PROP / BAD_ARRAY_COUNT', async () => {
  const goal = readJsonFile(fixture('gala-deck2'));
  delete goal.slides[1].props.ghostMark;              // theme11_page007 缺文本字段
  goal.slides[4].props.navItems = Array(5).fill('x'); // theme11_page045 数组项数不合法
  goal.slides[0].props.bogusKey = 'x';                // 版式没有的属性
  const file = path.join(root, 'broken.goal.json');
  fs.writeFileSync(file, JSON.stringify(goal));
  const { res, result } = await check(file, 'broken');
  assert.equal(res.status, 0, res.stderr.slice(0, 500));
  assert.equal(result.ok, false);
  assert.equal(result.rendered, false);
  const missing = result.issues.find(item => item.code === 'MISSING_FIELD');
  assert.ok(missing);
  assert.equal(missing.field, 'ghostMark');
  assert.equal(missing.index, 1);
  assert.equal(missing.layout, 'theme11_page007');
  assert.equal(missing.fixable, true);
  assert.ok(result.issues.some(item => item.code === 'UNKNOWN_PROP' && item.field === 'bogusKey' && item.index === 0));
  assert.ok(result.issues.some(item => item.code === 'BAD_ARRAY_COUNT' && item.index === 4));
  for (const item of result.issues) assert.match(item.message, /[一-龥]/, 'message 用中文');
});

test('check：props 里的浮点尾差被规整，写进 workDir 副本，原文件不变', async () => {
  const goal = readJsonFile(fixture('gala-deck2'));
  const stat = goal.slides[8].props.cats; // theme11_page079 占比数据，含数值
  assert.ok(Array.isArray(stat));
  stat[0].share = 20.000000000000004;
  const file = path.join(root, 'float.goal.json');
  fs.writeFileSync(file, JSON.stringify(goal));
  const { result, workDir } = await check(file, 'float');
  assert.ok(result.numberChanges >= 1);
  assert.equal(readJsonFile(path.join(workDir, 'goal.json')).slides[8].props.cats[0].share, 20);
  assert.equal(readJsonFile(file).slides[8].props.cats[0].share, 20.000000000000004);
});

test('check：goal 结构不对 / 文件不存在 / workDir 里就是原文件 → BAD_REQUEST', async () => {
  const bad = path.join(root, 'noslides.json');
  fs.writeFileSync(bad, JSON.stringify({ title: 'x' }));
  let out = await runCli('check', { request: { protocol: 1, goal: bad, workDir: path.join(root, 'w-bad') } });
  assert.equal(out.status, 2);
  out = await runCli('check', { request: { protocol: 1, goal: path.join(root, 'missing.json'), workDir: path.join(root, 'w-missing') } });
  assert.equal(out.status, 2);
  assert.equal(out.last.code, 'BAD_REQUEST');
  const inplace = path.join(root, 'inplace');
  fs.mkdirSync(inplace);
  fs.copyFileSync(fixture('gala-deck2'), path.join(inplace, 'goal.json'));
  const before = sha(path.join(inplace, 'goal.json'));
  out = await runCli('check', { request: { protocol: 1, goal: path.join(inplace, 'goal.json'), workDir: inplace } });
  assert.equal(out.status, 2);
  assert.equal(sha(path.join(inplace, 'goal.json')), before);
});

test('check：workDir 不可写 → 退出码 6（IO / DISK_FULL）', async (t) => {
  if (process.platform === 'win32' || process.getuid?.() === 0) return t.skip('需要非 root 的 POSIX 环境');
  const ro = path.join(root, 'readonly');
  fs.mkdirSync(ro);
  fs.chmodSync(ro, 0o555);
  try {
    const out = await runCli('check', { request: { protocol: 1, goal: fixture('gala-deck2'), workDir: path.join(ro, 'sub') } });
    assert.equal(out.status, 6, out.stderr.slice(0, 300));
    assert.ok(['IO', 'DISK_FULL'].includes(out.last.code));
  } finally {
    fs.chmodSync(ro, 0o755);
  }
});


