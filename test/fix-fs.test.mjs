// 第一轮审查修复：输出路径与链接、静态服务、磁盘错误分类、安装目录只读（审查 1、2、5，及决定 1 的后半）
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { runCli, tmpDir, fixture, PLUG } from './helpers.mjs';

const root = tmpDir('imago-fs-');
after(() => fs.rmSync(root, { recursive: true, force: true }));
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const posix = process.platform !== 'win32' && process.getuid?.() !== 0;

test('审查1：workDir/goal.json 是指向目录外文件的符号链接 → 拒绝（BAD_REQUEST），外部文件不被改写', async (t) => {
  if (!posix) return t.skip('需要非 root 的 POSIX 环境');
  const outside = path.join(root, 'outside-victim.json');
  fs.writeFileSync(outside, '{"victim":true}\n');
  const workDir = path.join(root, 'w-symlink');
  fs.mkdirSync(workDir);
  fs.symlinkSync(outside, path.join(workDir, 'goal.json'));
  const res = await runCli('check', { request: { protocol: 1, goal: fixture('gala-deck2'), workDir } });
  assert.equal(fs.readFileSync(outside, 'utf8'), '{"victim":true}\n', '外部文件不能被覆盖');
  assert.equal(res.status, 2, res.stderr.slice(0, 300));
  assert.equal(res.last.code, 'BAD_REQUEST');
});

test('审查1：workDir/goal.json 是原 goal 的硬链接 → 拒绝（dev+ino 同一性），原 goal 不变', async (t) => {
  if (!posix) return t.skip('需要非 root 的 POSIX 环境');
  const src = path.join(root, 'orig.goal.json');
  fs.copyFileSync(fixture('gala-deck2'), src);
  const before = sha(src);
  const workDir = path.join(root, 'w-hardlink');
  fs.mkdirSync(workDir);
  fs.linkSync(src, path.join(workDir, 'goal.json'));
  const res = await runCli('check', { request: { protocol: 1, goal: src, workDir } });
  assert.equal(sha(src), before, '原 goal 不能被改');
  assert.equal(res.status, 2, res.stderr.slice(0, 300));
  assert.equal(res.last.code, 'BAD_REQUEST');
});

test('审查1：workDir 里的 ppt 目录是符号链接 → 拒绝，链接目标不被写入', async (t) => {
  if (!posix) return t.skip('需要非 root 的 POSIX 环境');
  const victimDir = path.join(root, 'victim-dir');
  fs.mkdirSync(victimDir);
  const workDir = path.join(root, 'w-pptlink');
  fs.mkdirSync(workDir);
  fs.symlinkSync(victimDir, path.join(workDir, 'ppt'));
  const res = await runCli('check', { request: { protocol: 1, goal: fixture('gala-deck2'), workDir } });
  assert.deepEqual(fs.readdirSync(victimDir), [], '链接目标目录里不能被写入任何东西');
  assert.equal(res.status, 2, res.stderr.slice(0, 300));
});

test('审查1：export 的 pptx 路径已是符号链接 → 拒绝，目标不被改写；shotsDir 里有符号链接也拒绝', async (t) => {
  if (!posix) return t.skip('需要非 root 的 POSIX 环境');
  const workDir = path.join(root, 'w-exp');
  const prep = await runCli('check', { request: { protocol: 1, goal: fixture('gala-deck2'), workDir } });
  assert.equal(prep.last.ok, true);
  const victim = path.join(root, 'victim.pptx');
  fs.writeFileSync(victim, 'keep');
  const link = path.join(root, 'link.pptx');
  fs.symlinkSync(victim, link);
  let res = await runCli('export', { request: { protocol: 1, deckDir: workDir, pptx: link } });
  assert.equal(fs.readFileSync(victim, 'utf8'), 'keep');
  assert.equal(res.status, 2, res.stderr.slice(0, 300));
  const shots = path.join(root, 'shots-with-link');
  fs.mkdirSync(shots);
  const victimPng = path.join(root, 'victim.png');
  fs.writeFileSync(victimPng, 'keep');
  fs.symlinkSync(victimPng, path.join(shots, 'p01.png'));
  res = await runCli('export', { request: { protocol: 1, deckDir: workDir, pptx: path.join(root, 'ok.pptx'), shotsDir: shots } });
  assert.equal(fs.readFileSync(victimPng, 'utf8'), 'keep');
  assert.equal(res.status, 2, res.stderr.slice(0, 300));
});

test('审查2：静态服务不能通过符号链接读到服务目录外的文件', async (t) => {
  if (!posix) return t.skip('需要非 root 的 POSIX 环境');
  const { startStaticServer } = await import('../app/lib/browser-session.mjs');
  const site = path.join(root, 'site');
  fs.mkdirSync(site);
  fs.writeFileSync(path.join(site, 'index.html'), '<p>ok</p>');
  const secret = path.join(root, 'secret.txt');
  fs.writeFileSync(secret, 'TOP-SECRET');
  fs.symlinkSync(secret, path.join(site, 'leak.txt'));
  fs.symlinkSync(root, path.join(site, 'up'));
  const { server, url } = await startStaticServer(site);
  try {
    const ok = await fetch(`${url}index.html`);
    assert.equal(ok.status, 200);
    const leak = await fetch(`${url}leak.txt`);
    assert.notEqual(leak.status, 200, `符号链接文件不应被服务，状态 ${leak.status}`);
    assert.notEqual(await leak.text(), 'TOP-SECRET');
    const viaDir = await fetch(`${url}up/secret.txt`);
    assert.notEqual(viaDir.status, 200);
    const traversal = await fetch(`${url}..%2Fsecret.txt`);
    assert.notEqual(traversal.status, 200);
  } finally {
    server.close();
  }
});

test('审查2：静态服务对目录前缀相似的兄弟目录、目录内正常子目录的处理', async () => {
  const { startStaticServer } = await import('../app/lib/browser-session.mjs');
  const site = path.join(root, 'site2');
  const sibling = path.join(root, 'site2-evil');
  fs.mkdirSync(path.join(site, 'sub'), { recursive: true });
  fs.mkdirSync(sibling);
  fs.writeFileSync(path.join(site, 'sub', 'a.txt'), 'A');
  fs.writeFileSync(path.join(sibling, 'b.txt'), 'B');
  const { server, url } = await startStaticServer(site);
  try {
    assert.equal(await (await fetch(`${url}sub/a.txt`)).text(), 'A');
    assert.notEqual((await fetch(`${url}..%2Fsite2-evil%2Fb.txt`)).status, 200);
  } finally {
    server.close();
  }
});

test('审查5：export 输出目录不可写（EACCES）→ 退出码 6（IO），不是 5', { timeout: 300000 }, async (t) => {
  if (!posix) return t.skip('需要非 root 的 POSIX 环境');
  const workDir = path.join(root, 'w-disk');
  const prep = await runCli('check', { request: { protocol: 1, goal: fixture('gala-deck2'), workDir } });
  assert.equal(prep.last.ok, true, `prep check：${JSON.stringify(prep.last).slice(0, 400)}；stderr=${prep.stderr.slice(-300)}`);
  const ro = path.join(root, 'readonly-out');
  fs.mkdirSync(ro);
  fs.chmodSync(ro, 0o555);
  try {
    const res = await runCli('export', { request: { protocol: 1, deckDir: workDir, pptx: path.join(ro, 'a.pptx') } });
    assert.equal(res.status, 6, `退出码应为 6，实际 ${res.status}；${JSON.stringify(res.last).slice(0, 300)}`);
    assert.ok(['IO', 'DISK_FULL'].includes(res.last.code), res.last.code);
  } finally {
    fs.chmodSync(ro, 0o755);
  }
});

test('审查5：错误分类保留 errno（ENOSPC→DISK_FULL；EACCES/EPERM/EROFS→IO；子进程 stderr 里的 errno 也识别）', async () => {
  const { classifyFsError, classifyErrnoText, toPluginError } = await import('../app/lib/errors.mjs');
  assert.equal(classifyFsError({ code: 'ENOSPC' }), 'DISK_FULL');
  assert.equal(classifyFsError({ code: 'EDQUOT' }), 'DISK_FULL');
  for (const code of ['EACCES', 'EPERM', 'EROFS', 'EIO']) assert.equal(classifyFsError({ code }), 'IO', code);
  assert.equal(typeof classifyErrnoText, 'function');
  assert.equal(classifyErrnoText("Could not render goal deck: ENOSPC: no space left on device, write"), 'DISK_FULL');
  assert.equal(classifyErrnoText("Error: EACCES: permission denied, open '/x/ppt/index.html'"), 'IO');
  assert.equal(classifyErrnoText('普通的渲染失败'), null);
  const wrapped = toPluginError(Object.assign(new Error('boom'), { code: 'ENOSPC', path: '/x' }));
  assert.equal(wrapped.code, 'DISK_FULL');
  assert.equal(wrapped.detail.errno, 'ENOSPC');
});

test('审查5：finalizePptx 重命名遇到 ENOSPC → DISK_FULL（注入 fs）', async () => {
  const { finalizePptx } = await import('../app/lib/browser-tasks.mjs');
  const fakeFs = {
    existsSync: () => true,
    statSync: () => ({ size: 10 }),
    renameSync: () => { throw Object.assign(new Error('ENOSPC: no space left on device, rename'), { code: 'ENOSPC' }); },
    rmSync: () => {},
  };
  assert.throws(() => finalizePptx('/x/.a.part.pptx', '/x/a.pptx', fakeFs), error => error.code === 'DISK_FULL' && error.exitCode === 6);
  const noFile = { ...fakeFs, existsSync: () => false };
  assert.throws(() => finalizePptx('/x/.a.part.pptx', '/x/a.pptx', noFile), error => error.code === 'EXPORT_FAILED');
});

test('审查5：worker 通过结构化错误通道回传 errno（error 事件 detail.errno 与 code 原样透传）', async () => {
  const { pluginErrorFromWorkerEvent } = await import('../app/lib/worker-client.mjs');
  const error = pluginErrorFromWorkerEvent({ event: 'error', code: 'DISK_FULL', message: '磁盘空间不足', detail: { errno: 'ENOSPC' } }, 'EXPORT_FAILED', '导出', '');
  assert.equal(error.code, 'DISK_FULL');
  assert.equal(error.detail.errno, 'ENOSPC');
  assert.equal(error.exitCode, 6);
  const other = pluginErrorFromWorkerEvent({ event: 'error', code: 'INTERNAL', message: 'x' }, 'EXPORT_FAILED', '导出', '');
  assert.equal(other.code, 'EXPORT_FAILED');
});

test('决定1：插件安装目录设为只读后，selftest（check + export）仍成功', { timeout: 300000 }, async (t) => {
  if (!posix) return t.skip('需要非 root 的 POSIX 环境');
  const workDir = path.join(root, 'w-readonly-install');
  const appDir = path.join(PLUG, 'app');
  execFileSync('chmod', ['-R', 'a-w', appDir]);
  try {
    const res = await runCli('selftest', { request: { protocol: 1, workDir } });
    assert.equal(res.status, 0, res.stderr.slice(0, 600));
    assert.equal(res.last.ok, true);
    assert.equal(res.last.pages.length, 2);
  } finally {
    execFileSync('chmod', ['-R', 'u+w', appDir]);
  }
});
