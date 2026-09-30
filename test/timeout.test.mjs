import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { runProcess } from '../app/lib/proc.mjs';
import { runCli, tmpDir, fixture } from './helpers.mjs';

const alive = pid => {
  try { process.kill(pid, 0); return true; } catch { return false; }
};
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

test('runProcess：超时会结束整棵进程树（含孙进程）', async (t) => {
  if (process.platform === 'win32') return t.skip('Windows 用 taskkill /T，需在 Windows 上另测');
  const script = `
    const { spawn } = require('node:child_process');
    const child = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { stdio: 'ignore' });
    console.log('GRANDCHILD ' + child.pid);
    setInterval(()=>{},1000);
  `;
  let grandchild = null;
  const res = await runProcess(process.execPath, ['-e', script], {
    timeoutMs: 1500,
    onStdoutLine: line => { const m = /GRANDCHILD (\d+)/.exec(line); if (m) grandchild = Number(m[1]); },
  });
  assert.equal(res.timedOut, true);
  assert.equal(res.ok, false);
  assert.ok(grandchild, '应拿到孙进程 pid');
  await sleep(300);
  assert.equal(alive(grandchild), false, '孙进程应已被结束');
});

test('runProcess：命令不存在 → ok:false + spawnError，不抛异常', async () => {
  const res = await runProcess('/no/such/binary-xyz', []);
  assert.equal(res.ok, false);
  assert.ok(res.spawnError);
});

test('runProcess：非零退出码读到 stderr', async () => {
  const res = await runProcess(process.execPath, ['-e', 'console.error("boom"); process.exit(7)']);
  assert.equal(res.ok, false);
  assert.equal(res.code, 7);
  assert.match(res.stderr, /boom/);
});

function browserProcesses(marker) {
  try {
    const out = execFileSync('ps', ['-Ao', 'pid,command'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    return out.split('\n').filter(line => line.includes(marker)).map(line => Number(line.trim().split(/\s+/)[0]));
  } catch {
    return [];
  }
}

for (const scenario of ['check', 'export']) {
  test(`浏览器阶段超时（${scenario}）：报对应错误码，并结束浏览器进程`, { timeout: 120000 }, async (t) => {
    if (process.platform === 'win32') return t.skip('用 ps 统计浏览器进程，Windows 另测');
    const root = tmpDir('imago-timeout-');
    const tmpMarkerDir = path.join(root, 'tmpbase'); // 浏览器的 --user-data-dir 会落在 TMPDIR 下，用它当进程标记
    fs.mkdirSync(tmpMarkerDir);
    const env = { IMAGO_TEST_HANG: scenario === 'check' ? 'residue' : 'export', IMAGO_TEST_TIMEOUT_MS: '12000', TMPDIR: tmpMarkerDir };
    const workDir = path.join(root, 'w');
    // export 需要先有渲染好的 deck
    if (scenario === 'export') {
      const prep = await runCli('check', { request: { protocol: 1, goal: fixture('gala-deck2'), workDir } });
      assert.equal(prep.last.ok, true, prep.stderr.slice(0, 300));
    }
    const request = scenario === 'check'
      ? { protocol: 1, goal: fixture('gala-deck2'), workDir }
      : { protocol: 1, deckDir: workDir, pptx: path.join(root, 'a.pptx') };
    const pending = runCli(scenario, { request, env });
    // 挂起期间浏览器应该已经在跑
    let seen = 0;
    for (let i = 0; i < 40 && !seen; i += 1) {
      await sleep(250);
      seen = browserProcesses(tmpMarkerDir).length;
    }
    const res = await pending;
    assert.ok(seen > 0, '挂起期间没有观察到浏览器进程，用例无效');
    assert.equal(res.last.event, 'error');
    assert.equal(res.last.code, scenario === 'check' ? 'RENDER_FAILED' : 'EXPORT_FAILED');
    assert.equal(res.status, scenario === 'check' ? 4 : 5);
    assert.equal(res.last.detail.timeout, true);
    await sleep(500);
    assert.deepEqual(browserProcesses(tmpMarkerDir), [], '超时后不应残留浏览器进程');
    assert.equal(fs.existsSync(path.join(root, 'a.pptx')), false);
    fs.rmSync(root, { recursive: true, force: true });
  });
}
