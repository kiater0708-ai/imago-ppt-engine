// 第二轮复审修复（review-r2）：6 项部分修好 + 新增 5 项 P1、4 项 P2
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { runCli, tmpDir, fixture, readJsonFile, PLUG } from './helpers.mjs';
import { runProcess } from '../app/lib/proc.mjs';
import { snapshotProcesses } from '../app/lib/procs.mjs';
import { detectBrowser } from '../app/lib/browser-detect.mjs';

const root = tmpDir('imago-r2-');
after(() => fs.rmSync(root, { recursive: true, force: true }));
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const alive = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const killQuiet = pid => { try { process.kill(pid, 'SIGKILL'); } catch { /* 已不在 */ } };
const posix = process.platform !== 'win32';
const sentinelScript = 'setInterval(()=>{},1000)';

// ---------- 进程执行器 ----------

/** 根进程起一个脱离进程组的哨兵，打印 SENTINEL <pid>，exitAfterMs 后退出（打印 ROOTDONE）。 */
function rootWithSentinel(exitAfterMs) {
  return `
    const { spawn } = require('node:child_process');
    const child = spawn(process.execPath, ['-e', ${JSON.stringify(sentinelScript)}], { detached: true, stdio: 'ignore' });
    child.unref();
    console.log('SENTINEL ' + child.pid);
    setTimeout(() => { console.log('ROOTDONE'); process.exit(0); }, ${exitAfterMs});
  `;
}

async function runWithSentinel({ exitAfterMs = 600, snapshotAfterRoot, trackIntervalMs = 50, extra = {} }) {
  const trackOpt = trackIntervalMs ? { trackIntervalMs } : {};
  let sentinel = null;
  let rootDone = false;
  const real = opts => snapshotProcesses(opts);
  const res = await runProcess(process.execPath, ['-e', rootWithSentinel(exitAfterMs)], {
    timeoutMs: 20000, graceMs: 2000, trackTree: true, ...trackOpt,
    snapshot: opts => (rootDone && snapshotAfterRoot ? snapshotAfterRoot(real(opts), sentinel) : real(opts)),
    onStdoutLine: line => {
      const m = /SENTINEL (\d+)/.exec(line);
      if (m) sentinel = Number(m[1]);
      if (line.includes('ROOTDONE')) rootDone = true;
    },
    ...extra,
  });
  return { res, sentinel };
}

test('A3（R2）：根进程在首次轮询前不久退出（约 250ms）、后代脱离进程组 → 仍被记录并结束', { timeout: 60000 }, async (t) => {
  if (!posix) return t.skip('POSIX 专用');
  const { res, sentinel } = await runWithSentinel({ exitAfterMs: 250, trackIntervalMs: null }); // 不指定间隔：用默认（开头几次更密）
  try {
    assert.ok(sentinel);
    await sleep(300);
    assert.equal(alive(sentinel), false, '后代应被结束（前几次轮询要更密）');
    assert.equal(res.ok, true);
  } finally { if (sentinel) killQuiet(sentinel); }
});

test('N1：杀记录的 PID 前核对 PID+启动时间+命令行；快照失败（返回空）时不杀', { timeout: 60000 }, async (t) => {
  if (!posix) return t.skip('POSIX 专用');
  const { sentinel } = await runWithSentinel({ snapshotAfterRoot: () => [] });
  try {
    assert.ok(sentinel);
    await sleep(300);
    assert.equal(alive(sentinel), true, '快照失败时不应杀记录的 PID');
  } finally { if (sentinel) killQuiet(sentinel); }
});

test('N1：同一个 PID 但启动时间变了（PID 被别的进程复用）→ 不杀', { timeout: 60000 }, async (t) => {
  if (!posix) return t.skip('POSIX 专用');
  const { sentinel } = await runWithSentinel({
    snapshotAfterRoot: (rows, pid) => rows.map(row => (row.pid === pid ? { ...row, start: 'Mon Jan  1 00:00:00 2001' } : row)),
  });
  try {
    assert.ok(sentinel);
    await sleep(300);
    assert.equal(alive(sentinel), true, '启动时间对不上不应杀');
  } finally { if (sentinel) killQuiet(sentinel); }
});

test('N1：PID + 启动时间 + 命令行三者一致 → 杀掉；快照里带启动时间', { timeout: 60000 }, async (t) => {
  if (!posix) return t.skip('POSIX 专用');
  const rows = snapshotProcesses();
  assert.ok(rows.length > 0 && rows.every(row => typeof row.start === 'string'), '快照每行应有 start 字段');
  assert.ok(rows.find(row => row.pid === process.pid)?.start, '当前进程的启动时间不应为空');
  const { res, sentinel } = await runWithSentinel({});
  try {
    assert.ok(sentinel);
    await sleep(300);
    assert.equal(alive(sentinel), false);
    assert.ok(res.killedPids.includes(sentinel));
  } finally { if (sentinel) killQuiet(sentinel); }
});

test('N2：kill(-pid) 返回 ESRCH 时改用 kill(pid)（killProcessTree 注入 killFn）', async () => {
  const { killProcessTree } = await import('../app/lib/proc.mjs');
  const calls = [];
  const killFn = (pid, signal) => {
    calls.push([pid, signal]);
    if (pid < 0) throw Object.assign(new Error('ESRCH'), { code: 'ESRCH' });
  };
  const result = killProcessTree(777, { platform: 'linux', killFn, log: () => {} });
  assert.deepEqual(calls, [[-777, 'SIGKILL'], [777, 'SIGKILL']]);
  assert.equal(result.ok, true);
  // 单 PID 也是 ESRCH：进程确实已经不在，算成功
  const gone = killProcessTree(778, { platform: 'linux', killFn: () => { throw Object.assign(new Error('ESRCH'), { code: 'ESRCH' }); }, log: () => {} });
  assert.equal(gone.ok, true);
});

test('N2：记录的叶子进程不是进程组组长、组长已退出 → 组信号 ESRCH 后仍按 PID 杀掉叶子', { timeout: 60000 }, async (t) => {
  if (!posix) return t.skip('POSIX 专用');
  // root 起 A（新进程组组长）；A 起 B（同组、非组长）；A 退出后 B 留着；root 再过一会儿退出
  const script = `
    const { spawn } = require('node:child_process');
    const a = spawn(process.execPath, ['-e', ${JSON.stringify(`
      const { spawn } = require('node:child_process');
      const b = spawn(process.execPath, ['-e', ${JSON.stringify(sentinelScript)}], { stdio: 'ignore' });
      console.log('LEAF ' + b.pid);
      setTimeout(() => process.exit(0), 400);
    `)}], { detached: true, stdio: ['ignore', 'inherit', 'inherit'] });
    a.unref();
    setTimeout(() => process.exit(0), 1000);
  `;
  let leaf = null;
  const res = await runProcess(process.execPath, ['-e', script], {
    timeoutMs: 20000, graceMs: 2000, trackTree: true, trackIntervalMs: 50,
    onStdoutLine: line => { const m = /LEAF (\d+)/.exec(line); if (m) leaf = Number(m[1]); },
  });
  try {
    assert.ok(leaf);
    await sleep(300);
    assert.equal(alive(leaf), false, '叶子进程应被结束');
    assert.ok(res.killedPids.includes(leaf));
  } finally { if (leaf) killQuiet(leaf); }
});

test('P2-3：快照很慢时，终止与扫描的总耗时受 graceMs 约束（不会每次同步调用都吃满）', { timeout: 60000 }, async (t) => {
  if (!posix) return t.skip('POSIX 专用');
  const busy = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  let snapshots = 0;
  const started = Date.now();
  const res = await runProcess(process.execPath, ['-e', 'setInterval(()=>{},1000)'], {
    timeoutMs: 300, graceMs: 1000, trackTree: true, trackIntervalMs: 100000,
    snapshot: () => { snapshots += 1; busy(1500); return []; },
  });
  const elapsed = Date.now() - started;
  assert.equal(res.timedOut, true);
  assert.ok(elapsed < 2800, `终止与扫描应在 graceMs 内收尾（第一次快照就超期后不再做第二次），实际 ${elapsed}ms，快照 ${snapshots} 次`);
});

test('R3：临时目录清理——确认进程已结束才删；删除失败重试几次（带间隔），仍失败记日志', async () => {
  const { createTaskTmp } = await import('../app/lib/tasktmp.mjs');
  const { cleanupAfterRun } = await import('../app/lib/worker-client.mjs');
  const base = path.join(root, 'r3');
  fs.mkdirSync(base);
  // 重试：前两次 EBUSY，第三次成功
  let attempts = 0;
  const sleeps = [];
  const rm = (target, opts) => {
    attempts += 1;
    if (attempts <= 2) throw Object.assign(new Error('EBUSY: resource busy'), { code: 'EBUSY' });
    fs.rmSync(target, opts);
  };
  const logs = [];
  const t1 = createTaskTmp(base, { rmSync: rm, log: m => logs.push(m), sleep: ms => sleeps.push(ms), retries: 5 });
  t1.cleanup();
  assert.equal(attempts, 3);
  assert.equal(fs.existsSync(t1.dir), false);
  assert.equal(sleeps.length, 2);
  assert.deepEqual(logs, []);
  // 一直失败：重试用尽后记一条日志，不抛
  const logs2 = [];
  const t2 = createTaskTmp(base, { rmSync: () => { throw Object.assign(new Error('EBUSY'), { code: 'EBUSY' }); }, log: m => logs2.push(m), sleep: () => {}, retries: 3 });
  assert.doesNotThrow(() => t2.cleanup());
  assert.equal(logs2.length, 1);
  fs.rmSync(path.join(base, '.tmp'), { recursive: true, force: true });
  // 进程没结束（survivors 非空）：不删目录，写日志
  const t3 = createTaskTmp(base);
  const logs3 = [];
  cleanupAfterRun(t3, [], { survivors: [4242] }, m => logs3.push(m));
  assert.equal(fs.existsSync(t3.dir), true, '有存活进程时不应删临时目录');
  assert.ok(logs3.some(line => line.includes('4242')));
  cleanupAfterRun(t3, [], { survivors: [] }, () => {});
  assert.equal(fs.existsSync(t3.dir), false);
});

test('R3：runProcess 返回 survivors（终止后仍存活的记录进程）', { timeout: 60000 }, async (t) => {
  if (!posix) return t.skip('POSIX 专用');
  const { res, sentinel } = await runWithSentinel({ extra: { kill: () => ({ ok: false }) } });
  try {
    
    assert.ok(Array.isArray(res.survivors));
    assert.ok(res.survivors.includes(sentinel), '杀不掉的记录进程要出现在 survivors 里');
  } finally { if (sentinel) killQuiet(sentinel); }
});

// ---------- 输出目录硬链接 ----------

test('A1（R1）：workDir/ppt/index.html 硬链接到原 goal → 渲染前整体重建 ppt/，原 goal 不被覆盖，check 仍成功', { timeout: 120000 }, async (t) => {
  if (!posix) return t.skip('POSIX 专用');
  const src = path.join(root, 'orig-for-hardlink.goal.json');
  fs.copyFileSync(path.join(PLUG, 'app', 'selftest', 'goal.json'), src);
  const before = sha(src);
  const workDir = path.join(root, 'w-ppt-hardlink');
  fs.mkdirSync(path.join(workDir, 'ppt'), { recursive: true });
  fs.linkSync(src, path.join(workDir, 'ppt', 'index.html'));
  const res = await runCli('check', { request: { protocol: 1, goal: src, workDir } });
  assert.equal(res.status, 0, res.stderr.slice(0, 300));
  assert.equal(res.last.ok, true);
  assert.equal(sha(src), before, '原 goal 不能被覆盖成 HTML');
  assert.ok(fs.statSync(path.join(workDir, 'ppt', 'index.html')).nlink === 1, 'ppt/index.html 应是新文件');
});

// ---------- issues / 校验器 JSON ----------

test('A13（R5）：没有 deck 前缀、但点名多页的消息也按页展开（media asset … (slide 2 …, slide 4 …)）', async () => {
  const { issuesFromValidatorLine } = await import('../app/lib/issues.mjs');
  const layouts = ['a', 'b', 'c', 'd'];
  const line = 'media asset "assets/user-media/x.png" is used 2 times (slide 2 b props.images, slide 4 d props.images); use each user media asset once or set deck allowMediaReuse=true';
  const issues = issuesFromValidatorLine(line, layouts);
  assert.deepEqual(issues.map(item => item.index), [1, 3]);
  assert.ok(issues.every(item => item.fixable === true));
  // 页级单页消息不受影响
  assert.deepEqual(issuesFromValidatorLine('slide 3 layout c field x: unknown prop for this layout', layouts).map(item => item.index), [2]);
});

test('A15 / P2-4（R6）：校验器 JSON 严格结构校验，逐字段逐类型；结构错一律 RENDER_FAILED（不抛 TypeError）', async () => {
  const { safePropsErrors } = await import('../app/lib/issues.mjs');
  const HEAD = '"goal":"/x/goal.json","slideCount":1,"goalSpecErrorCount":0,"propErrorCount":0,"warningCount":0,';
  const bad = [
    '{"ok":true}',
    `{${HEAD}"ok":true,"layoutChanges":[null],"slides":[]}`,
    `{${HEAD}"ok":true,"layoutChanges":["x"],"slides":[]}`,
    `{${HEAD}"ok":true,"layoutChanges":[{"slide":1}],"slides":[]}`,
    `{${HEAD}"ok":true,"layoutChanges":[],"propErrors":{},"slides":[]}`,
    `{${HEAD}"ok":true,"layoutChanges":[],"goalSpecErrors":"x","slides":[]}`,
    `{${HEAD}"ok":true,"layoutChanges":[],"slides":[null]}`,
    `{${HEAD}"ok":true,"layoutChanges":[],"slides":[{"slide":"1","layout":"x","warningCount":0,"errorCount":0}]}`,
    `{${HEAD}"ok":true,"layoutChanges":[],"slides":[{"slide":1,"layout":"x","warningCount":0,"errorCount":0,"errors":"no"}]}`,
    `{${HEAD}"ok":true,"layoutChanges":[],"slides":[{"slide":1,"layout":"x","warningCount":0,"errorCount":0,"errors":[1]}]}`,
    `{${HEAD}"ok":true,"layoutChanges":[],"slides":[{"slide":1,"layout":5,"warningCount":0,"errorCount":0}]}`,
    '{"goal":"/x","slideCount":0,"goalSpecErrorCount":0,"propErrorCount":0,"warningCount":0,"ok":"yes","layoutChanges":[],"slides":[]}',
    '{"goal":"/x","slideCount":"3","goalSpecErrorCount":0,"propErrorCount":0,"warningCount":0,"ok":true,"layoutChanges":[],"slides":[]}',
    '{"goal":"/x","slideCount":0,"goalSpecErrorCount":0,"propErrorCount":0,"ok":true,"layoutChanges":[],"slides":[]}',
  ];
  for (const stdout of bad) {
    assert.throws(() => safePropsErrors(stdout, { exitOk: true }), error => error.code === 'RENDER_FAILED', `应报 RENDER_FAILED：${stdout}`);
  }
  const good = safePropsErrors(`{${HEAD}"ok":true,"layoutChanges":[{"slide":1,"from":"a","to":"b","reason":"r"}],"slides":[{"slide":1,"layout":"a","warningCount":0,"errorCount":0}]}`, { exitOk: true });
  assert.equal(good.data.layoutChanges.length, 1);
});

// ---------- 残留：禁词按出现次数 ----------

test('N5：禁用词按出现次数核对——可见次数 > 我们写入 props 的次数才算残留', async () => {
  const { checkSlideResidue } = await import('../app/lib/residue.mjs');
  const info = { fillPlan: { text: [{ key: 'note' }], arrays: [] }, controls: [] };
  const base = { defaultProps: { note: 'x', wordmark: 'IGNIS 燃点' }, info };
  // 作者写了 1 次，页面显示 1 次 → 不报
  assert.deepEqual(checkSlideResidue({ ...base, text: '备注 IGNIS 燃点用户备注', props: { note: 'IGNIS 燃点用户备注' } }).filter(h => h.kind === 'forbidden'), []);
  // 作者写了 1 次，页面显示 2 次（另一处是组件写死的）→ 报
  const hits = checkSlideResidue({ ...base, text: 'IGNIS 燃点 备注 IGNIS 燃点用户备注', props: { note: 'IGNIS 燃点用户备注' } }).filter(h => h.kind === 'forbidden');
  assert.ok(hits.some(h => h.text === 'IGNIS'));
  assert.ok(hits.some(h => h.text === '燃点'));
  // 大小写不敏感，作者写 2 次页面 2 次 → 不报
  assert.deepEqual(checkSlideResidue({ ...base, text: 'roadmap ROADMAP', props: { a: 'Roadmap', b: 'roadmap' } }).filter(h => h.kind === 'forbidden'), []);
});

test('N5：flow-gala-1 第 4 页在 noteText 里写 IGNIS 燃点，组件写死的品牌字标仍要报（CLI 端到端）', { timeout: 120000 }, async () => {
  const goal = readJsonFile(fixture('flow-gala-1'));
  goal.slides[3].props.noteText = 'IGNIS 燃点用户备注';
  const file = path.join(root, 'note.goal.json');
  fs.writeFileSync(file, JSON.stringify(goal));
  const res = await runCli('check', { request: { protocol: 1, goal: file, workDir: path.join(root, 'w-note') } });
  assert.equal(res.status, 0, res.stderr.slice(0, 300));
  assert.equal(res.last.ok, false, '硬编码问题不能被备注里的同词盖住');
  assert.ok(res.last.issues.some(item => item.code === 'HARDCODED_TEXT' && item.index === 3));
});

// ---------- 文字提取：翻页、延迟挂载、倍速 ----------

async function readDeck(dirName, html, { extraFiles = {}, opts = {}, beforeRead = null } = {}) {
  const { withDeckBrowser, openDeckPage, extractSlideTexts, RESIDUE_TEXT_OPTIONS } = await import('../app/lib/browser-session.mjs');
  const browser = await detectBrowser();
  if (!browser.found) return null;
  const dir = path.join(root, dirName);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  for (const [name, content] of Object.entries(extraFiles)) fs.writeFileSync(path.join(dir, name), content);
  return withDeckBrowser({ deckPptDir: dir, browserPath: browser.path, tmpBase: root }, async ({ browser: b, url }) => {
    const { page, context, total } = await openDeckPage(b, url);
    try {
      if (beforeRead) await beforeRead(page);
      const started = Date.now();
      const texts = await extractSlideTexts(page, total, null, { ...RESIDUE_TEXT_OPTIONS, ...opts }); // 和残留检查同一套参数
      const probe = await page.evaluate(() => ({ finishCalls: window.__finishCalls || 0, progressOne: window.__progressOne || 0 }));
      return { texts, elapsed: Date.now() - started, probe, page };
    } finally {
      await context.close();
    }
  });
}

const THREE_SLIDES = `<!doctype html><meta charset="utf-8">
<div id="deck"><section class="slide active" data-vm-layout="a"><p>第一页</p></section><section class="slide" data-vm-layout="b"><p>第二页</p></section><section class="slide" data-vm-layout="c"><p>第三页</p></section></div>`;

test('A8：开始读取后 700ms 才出现的文字（setTimeout 延迟挂载）→ 读到，不因两次标题读数一致就结束', { timeout: 120000 }, async () => {
  const out = await readDeck('late700', `<!doctype html><meta charset="utf-8">
<div id="deck"><section class="slide active" data-vm-layout="x"><h1>标题</h1><p id="late"></p></section></div>
<script>window.__arm = () => setTimeout(() => { document.getElementById('late').textContent = 'IGNIS 燃点'; }, 700);</script>`, { beforeRead: page => page.evaluate(() => window.__arm()) });
  if (!out) return;
  assert.match(out.texts[0].text, /IGNIS 燃点/);
});

test('N3：每次激活页面都会重启延迟挂载（350ms）——每一页（含翻回来的页）都必须等到自己的挂载', { timeout: 120000 }, async () => {
  const out = await readDeck('remount', `<!doctype html><meta charset="utf-8">
<div id="deck"><section class="slide active" data-vm-layout="a"><p>第一页</p></section><section class="slide" data-vm-layout="b"><p>第二页</p></section><section class="slide" data-vm-layout="c"><p>第三页</p></section></div>
<script>
const slides = () => [...document.querySelectorAll('#deck > .slide')];
let current = 0;
function mountLater(i) {
  setTimeout(() => { const s = slides()[i]; if (!s.querySelector('b')) { const b = document.createElement('b'); b.textContent = '延迟' + i; s.appendChild(b); } }, 350);
}
window.go = (i) => { current = i; slides().forEach((s, k) => s.classList.toggle('active', k === i)); slides()[i].querySelectorAll('b').forEach(b => b.remove()); mountLater(i); };
mountLater(0);
</script>`);
  if (!out) return;
  assert.deepEqual(out.texts.map(item => item.text), ['第一页 延迟0', '第二页 延迟1', '第三页 延迟2']);
});

test('N4：不再强行快进——整个提取过程没有调用 Animation.finish()，也没有对 gsap 补间 progress(1)；动画靠 10 倍速自然跑完', { timeout: 120000 }, async () => {
  const gsapFile = path.join(PLUG, 'app', 'runtime', 'node_modules', 'gsap', 'dist', 'gsap.min.js');
  const out = await readDeck('nofinish', `<!doctype html><meta charset="utf-8">
<script src="gsap.min.js"></script>
<script>
window.__finishCalls = 0; window.__progressOne = 0;
const of = Animation.prototype.finish; Animation.prototype.finish = function () { window.__finishCalls += 1; return of.apply(this, arguments); };
const op = gsap.core.Animation.prototype.progress; gsap.core.Animation.prototype.progress = function (v) { if (v === 1) window.__progressOne += 1; return op.apply(this, arguments); };
</script>
<div id="deck"><section class="slide active" data-vm-layout="x"><h1>标题</h1><p id="a"></p><p id="b"></p></section></div>
<script>
const anim = document.getElementById('a').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 2500 });
anim.onfinish = () => { document.getElementById('a').textContent = 'WAAPI 完成'; };
gsap.to({ v: 0 }, { v: 1, duration: 3, onComplete: () => { document.getElementById('b').textContent = 'GSAP 完成'; } });
</script>`, { extraFiles: { 'gsap.min.js': fs.readFileSync(gsapFile) } });
  if (!out) return;
  assert.equal(out.probe.finishCalls, 0, '不应调用 finish()');
  assert.equal(out.probe.progressOne, 0, '不应对补间 progress(1)');
  assert.match(out.texts[0].text, /WAAPI 完成/);
  assert.match(out.texts[0].text, /GSAP 完成/);
  assert.ok(out.elapsed < 2200, `10 倍速下应很快跑完，实际 ${out.elapsed}ms`);
});

test('P2-1：无限循环的 gsap 父时间线里的有限子补间——不被当作要等待的补间，也不被强行快进', { timeout: 120000 }, async () => {
  const gsapFile = path.join(PLUG, 'app', 'runtime', 'node_modules', 'gsap', 'dist', 'gsap.min.js');
  const out = await readDeck('gsap-infinite-parent', `<!doctype html><meta charset="utf-8">
<script src="gsap.min.js"></script>
<script>
window.__progressOne = 0;
const op = gsap.core.Animation.prototype.progress; gsap.core.Animation.prototype.progress = function (v) { if (v === 1) window.__progressOne += 1; return op.apply(this, arguments); };
</script>
<div id="deck"><section class="slide active" data-vm-layout="x"><h1>标题</h1></section></div>
<script>
const tl = gsap.timeline({ repeat: -1 });
tl.to({ a: 0 }, { a: 1, duration: 60, onComplete: () => { document.querySelector('h1').textContent = '被改了'; } });
</script>`, { extraFiles: { 'gsap.min.js': fs.readFileSync(gsapFile) } });
  if (!out) return;
  assert.equal(out.probe.progressOne, 0);
  assert.equal(out.texts[0].text, '标题');
  assert.ok(out.elapsed < 2000, `不应等待无限父时间线里的子补间，实际 ${out.elapsed}ms`);
});

test('P2-2：没有 window.go 的 deck（只有键盘翻页）——walkSlides instant 往前走再翻回首页', { timeout: 120000 }, async () => {
  const { withDeckBrowser, openDeckPage, walkSlides } = await import('../app/lib/browser-session.mjs');
  const browser = await detectBrowser();
  if (!browser.found) return;
  const dir = path.join(root, 'keyboard-only');
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'index.html'), `${THREE_SLIDES}
<script>
let cur = 0;
const show = i => { cur = Math.max(0, Math.min(2, i)); document.querySelectorAll('#deck > .slide').forEach((s, k) => s.classList.toggle('active', k === cur)); };
addEventListener('keydown', e => { if (e.key === 'ArrowRight') show(cur + 1); else if (e.key === 'ArrowLeft') show(cur - 1); else if (e.key === 'Home') show(0); });
</script>`);
  const order = await withDeckBrowser({ deckPptDir: dir, browserPath: browser.path, tmpBase: root }, async ({ browser: b, url }) => {
    const { page, context, total } = await openDeckPage(b, url);
    try {
      const forward = await walkSlides(page, total, async i => i, { instant: true });
      const back = await walkSlides(page, total, async i => i, { instant: true }); // 第一遍停在末页，第二遍要能翻回首页
      return [forward, back];
    } finally { await context.close(); }
  });
  assert.deepEqual(order, [[0, 1, 2], [0, 1, 2]]);
});

test('并行取文字：多个标签页各管一部分页号，结果按页号排好、数量对得上；每页都等完自己的挂载', { timeout: 120000 }, async () => {
  const { withDeckBrowser, extractSlideTextsParallel, RESIDUE_TEXT_OPTIONS } = await import('../app/lib/browser-session.mjs');
  const browser = await detectBrowser();
  if (!browser.found) return;
  const dir = path.join(root, 'parallel');
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><meta charset="utf-8">
<div id="deck">${[0, 1, 2, 3, 4].map(i => `<section class="slide${i === 0 ? ' active' : ''}" data-vm-layout="l${i}"><p>页${i}</p></section>`).join('')}</div>
<script>
const slides = () => [...document.querySelectorAll('#deck > .slide')];
window.go = (i) => { slides().forEach((s, k) => s.classList.toggle('active', k === i)); setTimeout(() => { const s = slides()[i]; if (!s.querySelector('b')) { const b = document.createElement('b'); b.textContent = '延迟' + i; s.appendChild(b); } }, 400); };
window.go(0);
</script>`);
  const out = await withDeckBrowser({ deckPptDir: dir, browserPath: browser.path, tmpBase: root }, ({ browser: b, url }) => extractSlideTextsParallel(b, url, { expectedTotal: 5, options: RESIDUE_TEXT_OPTIONS, tabs: 2 }));
  assert.equal(out.total, 5);
  assert.deepEqual(out.texts.map(item => item.index), [0, 1, 2, 3, 4]);
  assert.deepEqual(out.texts.map(item => item.text), ['页0 延迟0', '页1 延迟1', '页2 延迟2', '页3 延迟3', '页4 延迟4']);
  assert.deepEqual(out.texts.map(item => item.layout), ['l0', 'l1', 'l2', 'l3', 'l4']);
});

test('速度：gala-deck2 的 check 各步合计 ≤ 6 秒（修前 4.7 秒，不能变慢），结果不变', { timeout: 120000 }, async () => {
  // 机器负载会让单次抖动：最多跑 3 次，取最快的一次判定（每次都要求结果正确）
  const totals = [];
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const res = await runCli('check', { request: { protocol: 1, goal: fixture('gala-deck2'), workDir: path.join(root, `w-speed2-${attempt}`) } });
    assert.equal(res.status, 0, res.stderr.slice(0, 300));
    assert.equal(res.last.ok, true);
    assert.deepEqual(res.last.issues, []);
    totals.push(Object.values(res.last.timings).reduce((sum, value) => sum + value, 0));
    if (totals[totals.length - 1] <= 6000) break;
  }
  console.error(`R2 check 各步合计 ${totals.join('/')}ms`);
  assert.ok(Math.min(...totals) <= 6000, `check 合计 ${totals.join('/')}ms`);
});

void spawn;
