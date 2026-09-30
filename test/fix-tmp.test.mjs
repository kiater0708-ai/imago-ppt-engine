// 第一轮审查修复：任务临时目录由父进程创建并清理（审查 4）
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { runCli, tmpDir, fixture } from './helpers.mjs';

const root = tmpDir('imago-tmp-');
after(() => fs.rmSync(root, { recursive: true, force: true }));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const posix = process.platform !== 'win32';
const leftovers = dir => (fs.existsSync(dir) ? fs.readdirSync(dir).filter(name => /^playwright/.test(name)) : []);
const psLines = marker => { try { return execFileSync('ps', ['-Ao', 'pid,command'], { encoding: 'utf8', maxBuffer: 1 << 26 }).split('\n').filter(l => l.includes(marker)); } catch { return []; } };

test('审查4：check 的浏览器阶段超时被强杀后，不残留 Playwright 的 profile / artifacts 目录；.tmp 被清理', { timeout: 120000 }, async (t) => {
  if (!posix) return t.skip('用 ps 与 TMPDIR 观察，Windows 另测');
  const osTmp = path.join(root, 'os-tmp');
  fs.mkdirSync(osTmp);
  const workDir = path.join(root, 'w-check');
  const res = await runCli('check', {
    request: { protocol: 1, goal: fixture('gala-deck2'), workDir },
    env: { IMAGO_TEST_HANG: 'residue', IMAGO_TEST_TIMEOUT_MS: '10000', TMPDIR: osTmp },
  });
  assert.equal(res.last.code, 'RENDER_FAILED');
  assert.equal(res.last.detail.timeout, true);
  await sleep(500);
  assert.deepEqual(leftovers(osTmp), [], 'TMPDIR 里不应残留 playwright 目录');
  assert.deepEqual(leftovers(path.join(workDir, '.tmp')), [], 'workDir/.tmp 里不应残留');
  assert.equal(fs.existsSync(path.join(workDir, '.tmp')), false, '空的 .tmp 应被删除');
});

test('审查4：任务运行期间，浏览器的临时文件在 workDir/.tmp/<随机> 下（而不是系统临时目录）', { timeout: 120000 }, async (t) => {
  if (!posix) return t.skip('用 ps 与 TMPDIR 观察，Windows 另测');
  const osTmp = path.join(root, 'os-tmp2');
  fs.mkdirSync(osTmp);
  const workDir = path.join(root, 'w-where');
  const pending = runCli('check', {
    request: { protocol: 1, goal: fixture('gala-deck2'), workDir },
    env: { IMAGO_TEST_HANG: 'residue', IMAGO_TEST_TIMEOUT_MS: '14000', TMPDIR: osTmp },
  });
  let inTask = false;
  for (let i = 0; i < 50 && !inTask; i += 1) {
    await sleep(250);
    const base = path.join(workDir, '.tmp');
    if (fs.existsSync(base)) {
      for (const task of fs.readdirSync(base)) {
        if (leftovers(path.join(base, task)).length) inTask = true;
      }
    }
  }
  const res = await pending;
  assert.ok(inTask, '运行期间应能在 workDir/.tmp/<随机>/ 下看到 playwright 目录');
  assert.deepEqual(leftovers(osTmp), [], '系统临时目录里不应出现 playwright 目录');
  assert.equal(res.last.code, 'RENDER_FAILED');
});

test('审查4：export 在写 PPTX 中途超时被强杀 → 父进程清掉 .part 临时文件和 .tmp', { timeout: 180000 }, async (t) => {
  if (!posix) return t.skip('用 ps 与 TMPDIR 观察，Windows 另测');
  const workDir = path.join(root, 'w-export');
  const prep = await runCli('check', { request: { protocol: 1, goal: fixture('gala-deck2'), workDir } });
  assert.equal(prep.last.ok, true);
  const outDir = path.join(root, 'out');
  fs.mkdirSync(outDir);
  const osTmp = path.join(root, 'os-tmp3');
  fs.mkdirSync(osTmp);
  const res = await runCli('export', {
    request: { protocol: 1, deckDir: workDir, pptx: path.join(outDir, 'a.pptx') },
    env: { IMAGO_TEST_HANG: 'export-part', IMAGO_TEST_TIMEOUT_MS: '12000', TMPDIR: osTmp },
  });
  assert.equal(res.last.code, 'EXPORT_FAILED');
  assert.equal(res.last.detail.timeout, true);
  await sleep(500);
  assert.deepEqual(fs.readdirSync(outDir), [], `不应残留 .part 文件：${fs.readdirSync(outDir)}`);
  assert.deepEqual(leftovers(osTmp), []);
  assert.equal(fs.existsSync(path.join(workDir, '.tmp')), false);
  assert.deepEqual(psLines(workDir).filter(l => l.includes('worker.mjs')), []);
});

test('审查4：createTaskTmp / 清理：在 base/.tmp/<随机> 下建目录；清理失败只记日志不抛；拒绝 .tmp 是符号链接', async (t) => {
  const { createTaskTmp } = await import('../app/lib/tasktmp.mjs');
  const base = path.join(root, 'tt-base');
  fs.mkdirSync(base);
  const task = createTaskTmp(base);
  assert.equal(path.dirname(path.dirname(task.dir)), base);
  assert.ok(path.basename(path.dirname(task.dir)) === '.tmp');
  fs.writeFileSync(path.join(task.dir, 'x'), '1');
  task.cleanup();
  assert.equal(fs.existsSync(task.dir), false);
  assert.equal(fs.existsSync(path.join(base, '.tmp')), false, '空 .tmp 一并删除');
  // 清理失败（注入 rmSync 抛错）：记日志，不抛
  const logs = [];
  const t2 = createTaskTmp(base, { rmSync: () => { throw new Error('busy'); }, log: m => logs.push(m) });
  assert.doesNotThrow(() => t2.cleanup());
  assert.ok(logs.some(m => m.includes('busy')));
  fs.rmSync(path.join(base, '.tmp'), { recursive: true, force: true });
  if (posix) {
    const outside = path.join(root, 'tt-outside');
    fs.mkdirSync(outside);
    fs.symlinkSync(outside, path.join(base, '.tmp'));
    assert.throws(() => createTaskTmp(base), error => error.code === 'BAD_REQUEST');
    assert.deepEqual(fs.readdirSync(outside), []);
  } else t.skip('符号链接部分仅 POSIX');
});
