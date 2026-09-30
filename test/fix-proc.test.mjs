// 第一轮审查修复：进程执行器（审查 3、12）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runProcess } from '../app/lib/proc.mjs';
import { tmpDir, PLUG } from './helpers.mjs';

const alive = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const killQuiet = pid => { try { process.kill(pid, 'SIGKILL'); } catch { /* 已不在 */ } };
const posixOnly = t => { if (process.platform === 'win32') { t.skip('POSIX 专用（Windows 走 taskkill，见注入测试）'); return true; } return false; };

test('审查3：根进程先退出、孙进程占着 stdout → 超时后必须在期限内返回，并结束孙进程', { timeout: 30000 }, async (t) => {
  if (posixOnly(t)) return;
  const script = `
    const { spawn } = require('node:child_process');
    const child = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { stdio: ['ignore', 'inherit', 'inherit'] });
    console.log('GRANDCHILD ' + child.pid);
    process.exit(0);
  `;
  let grandchild = null;
  const started = Date.now();
  const res = await runProcess(process.execPath, ['-e', script], {
    timeoutMs: 1000, graceMs: 1000,
    onStdoutLine: line => { const m = /GRANDCHILD (\d+)/.exec(line); if (m) grandchild = Number(m[1]); },
  });
  const elapsed = Date.now() - started;
  try {
    assert.ok(grandchild, '应拿到孙进程 pid');
    assert.ok(elapsed < 8000, `runProcess 应在期限内返回，实际 ${elapsed}ms`);
    await sleep(300);
    assert.equal(alive(grandchild), false, '孙进程应已被结束');
    assert.ok(res.code === 0 || res.timedOut, '返回值要带出根进程状态');
  } finally {
    if (grandchild) killQuiet(grandchild);
  }
});

test('审查3：孙进程脱离进程组（setsid）且根进程已退出 → 靠记录的后代 PID 结束它', { timeout: 30000 }, async (t) => {
  if (posixOnly(t)) return;
  const script = `
    const { spawn } = require('node:child_process');
    const child = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { detached: true, stdio: 'ignore' });
    child.unref();
    console.log('GRANDCHILD ' + child.pid);
    setTimeout(() => process.exit(0), 1200); // 等父进程的跟踪轮询记下孙进程，再退出
  `;
  let grandchild = null;
  const res = await runProcess(process.execPath, ['-e', script], {
    timeoutMs: 15000, graceMs: 1000, trackTree: true, trackIntervalMs: 100,
    onStdoutLine: line => { const m = /GRANDCHILD (\d+)/.exec(line); if (m) grandchild = Number(m[1]); },
  });
  try {
    assert.equal(res.code, 0);
    assert.ok(grandchild);
    await sleep(500);
    assert.equal(alive(grandchild), false, '脱离进程组的孙进程应被记录的 PID 结束');
    assert.ok(Array.isArray(res.killedPids) && res.killedPids.includes(grandchild), 'killedPids 里应有该孙进程');
  } finally {
    if (grandchild) killQuiet(grandchild);
  }
});

test('审查3：killProcessTree 在 Windows 用 taskkill /T /F 并检查退出码，失败写日志', async () => {
  const { killProcessTree } = await import('../app/lib/proc.mjs');
  assert.equal(typeof killProcessTree, 'function');
  const calls = [];
  const logs = [];
  const okResult = killProcessTree(4321, { platform: 'win32', spawnSyncFn: (cmd, args) => { calls.push([cmd, ...args]); return { status: 0, stderr: '' }; }, log: m => logs.push(m) });
  assert.deepEqual(calls[0], ['taskkill', '/PID', '4321', '/T', '/F']);
  assert.equal(okResult.ok, true);
  // 退出码 128 = 进程已不存在，不算失败
  assert.equal(killProcessTree(4321, { platform: 'win32', spawnSyncFn: () => ({ status: 128, stderr: 'not found' }), log: m => logs.push(m) }).ok, true);
  // 其他非零退出码：失败并写日志
  const bad = killProcessTree(4321, { platform: 'win32', spawnSyncFn: () => ({ status: 1, stderr: '拒绝访问' }), log: m => logs.push(m) });
  assert.equal(bad.ok, false);
  assert.ok(logs.some(line => line.includes('taskkill') && line.includes('拒绝访问')), `应记录 taskkill 失败：${JSON.stringify(logs)}`);
  // 启动失败（error）也算失败
  assert.equal(killProcessTree(1, { platform: 'win32', spawnSyncFn: () => ({ error: new Error('ENOENT'), status: null }), log: () => {} }).ok, false);
});

test('审查3：runProcess 一定返回——根进程退出后管道被孙进程占住，也在 graceMs 后返回（不依赖 timeout）', { timeout: 30000 }, async (t) => {
  if (posixOnly(t)) return;
  const script = `
    const { spawn } = require('node:child_process');
    const child = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { detached: true, stdio: ['ignore', 'inherit', 'inherit'] });
    console.log('GRANDCHILD ' + child.pid);
    process.exit(0);
  `;
  let grandchild = null;
  const started = Date.now();
  const res = await runProcess(process.execPath, ['-e', script], {
    timeoutMs: 600000, graceMs: 1000,
    onStdoutLine: line => { const m = /GRANDCHILD (\d+)/.exec(line); if (m) grandchild = Number(m[1]); },
  });
  try {
    assert.ok(Date.now() - started < 8000, '不应等到 timeout');
    assert.equal(res.code, 0);
  } finally {
    if (grandchild) killQuiet(grandchild);
  }
});

test('审查12：UTF-8 字符跨管道数据块不损坏（stdout、stderr、onStdoutLine）', { timeout: 30000 }, async () => {
  const script = `
    const bytes = Buffer.from('中文事件\\n', 'utf8');
    process.stdout.write(bytes.subarray(0, 4)); // 「中」+「文」的前一个字节：切在字符中间
    setTimeout(() => { process.stdout.write(bytes.subarray(4)); }, 150);
    const err = Buffer.from('错误信息', 'utf8');
    process.stderr.write(err.subarray(0, 2));
    setTimeout(() => process.stderr.write(err.subarray(2)), 150);
  `;
  const lines = [];
  const res = await runProcess(process.execPath, ['-e', script], { timeoutMs: 10000, onStdoutLine: line => lines.push(line) });
  assert.equal(res.stdout, '中文事件\n');
  assert.equal(res.stderr, '错误信息');
  assert.deepEqual(lines, ['中文事件']);
});

test('审查4：打包脚本的冒烟用同一个执行器（不再 spawnSync 直接跑 CLI）', () => {
  const source = fs.readFileSync(path.join(PLUG, 'scripts', 'build-win.mjs'), 'utf8');
  assert.match(source, /from '\.\.\/app\/lib\/proc\.mjs'/, '应从 app/lib/proc.mjs 引入 runProcess');
  assert.doesNotMatch(source, /spawnSync\(process\.execPath/, '冒烟不应再用 spawnSync(process.execPath, …)');
});

test('审查3：宿主取消（SIGTERM）时，CLI 结束自己启动的 worker 和浏览器', { timeout: 90000 }, async (t) => {
  if (posixOnly(t)) return;
  const { spawn, execFileSync } = await import('node:child_process');
  const { runCli, fixture, tmpDir: mk } = await import('./helpers.mjs');
  const root = mk('imago-cancel-');
  const workDir = path.join(root, 'w');
  const prep = await runCli('check', { request: { protocol: 1, goal: fixture('gala-deck2'), workDir } });
  assert.equal(prep.last.ok, true);
  const marker = path.join(root, 'tmp-marker');
  fs.mkdirSync(marker);
  const reqFile = path.join(root, 'req.json');
  fs.writeFileSync(reqFile, JSON.stringify({ protocol: 1, deckDir: workDir, pptx: path.join(root, 'a.pptx') }));
  const child = spawn(process.execPath, [path.join(PLUG, 'app', 'cli.mjs'), 'export', '--request', reqFile], {
    env: { ...process.env, IMAGO_TEST_HANG: 'export', TMPDIR: marker }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const ps = () => execFileSync('ps', ['-Ao', 'pid,command'], { encoding: 'utf8', maxBuffer: 1 << 26 }).split('\n').filter(l => l.includes('worker.mjs') || l.includes(workDir));
  const pidOf = line => Number(line.trim().split(/\s+/)[0]);
  const stale = new Set(ps().filter(l => l.includes('worker.mjs')).map(pidOf)); // 与本用例无关的旧进程不计
  const mine = () => ps().filter(l => l.includes('worker.mjs')).filter(l => !stale.has(pidOf(l)));
  let seen = 0;
  for (let i = 0; i < 60 && !seen; i += 1) { await sleep(250); seen = mine().length; }
  assert.ok(seen > 0, '应先看到 worker 进程');
  child.kill('SIGTERM');
  await new Promise(resolve => child.on('close', resolve));
  await sleep(1500);
  assert.deepEqual(mine(), [], '取消后不应残留 worker');
  fs.rmSync(root, { recursive: true, force: true });
});

void tmpDir;
