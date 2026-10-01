// 第一轮审查修复：残留检查（审查 7、8）
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCli, tmpDir, PLUG } from './helpers.mjs';
import { detectBrowser } from '../app/lib/browser-detect.mjs';

const root = tmpDir('imago-residue-');
after(() => fs.rmSync(root, { recursive: true, force: true }));

test('审查7：用户自己写进 props 的 Roadmap / Key Metrics → 不报残留（CLI 端到端）', { timeout: 120000 }, async () => {
  const goal = JSON.parse(fs.readFileSync(path.join(PLUG, 'app', 'selftest', 'goal.json'), 'utf8'));
  goal.slides[0].props.headlineHtml = 'Roadmap，<br>Key Metrics。';
  const file = path.join(root, 'roadmap.goal.json');
  fs.writeFileSync(file, JSON.stringify(goal));
  const res = await runCli('check', { request: { protocol: 1, goal: file, workDir: path.join(root, 'w-roadmap') } });
  assert.equal(res.status, 0, res.stderr.slice(0, 400));
  assert.deepEqual(res.last.issues.filter(item => item.code === 'HARDCODED_TEXT' || item.code === 'TEMPLATE_RESIDUE'), []);
  assert.equal(res.last.ok, true);
});

test('审查7：checkSlideResidue：禁用词出现在我们写入的任意字段里 → 不报；不在 props 里 → 仍报', async () => {
  const { checkSlideResidue } = await import('../app/lib/residue.mjs');
  const info = { fillPlan: { text: [{ key: 'headline' }], arrays: [] }, controls: [] };
  const base = { defaultProps: { headline: 'default', wordmark: 'IGNIS 燃点' }, info };
  const written = checkSlideResidue({ ...base, text: '产品 Roadmap 计划', props: { headline: '产品 Roadmap 计划' } });
  assert.deepEqual(written.filter(hit => hit.kind === 'forbidden'), []);
  const other = checkSlideResidue({ ...base, text: '产品 Roadmap 计划', props: { other: { deep: ['x', 'Roadmap'] } } });
  assert.deepEqual(other.filter(hit => hit.kind === 'forbidden'), [], '任意字段都算');
  const hardcoded = checkSlideResidue({ ...base, text: 'IGNIS 燃点 标题', props: { headline: '标题' } });
  assert.ok(hardcoded.some(hit => hit.kind === 'forbidden' && hit.text === 'IGNIS'));
});

test('审查8：页面先出现标题、其余文字在开始读取后 350ms 才出现 → 文字检查必须等到稳定后再读', { timeout: 120000 }, async () => {
  const { withDeckBrowser, openDeckPage, extractSlideTexts } = await import('../app/lib/browser-session.mjs');
  const browser = await detectBrowser();
  if (!browser.found) return;
  const deckDir = path.join(root, 'delayed');
  fs.mkdirSync(deckDir);
  // window.__arm() 被调用后 350ms，才把残留文字挂上去：模拟「标题先出来、其他内容稍后挂载」
  fs.writeFileSync(path.join(deckDir, 'index.html'), `<!doctype html><meta charset="utf-8">
<div id="deck"><section class="slide active" data-vm-layout="theme11_page001"><h1>标题</h1><p id="late"></p></section></div>
<script>window.__arm = () => setTimeout(() => { document.getElementById('late').textContent = 'IGNIS 燃点'; }, 350);</script>`);
  const texts = await withDeckBrowser({ deckPptDir: deckDir, browserPath: browser.path, tmpBase: root }, async ({ browser: b, url }) => {
    const { page, context, total } = await openDeckPage(b, url);
    try {
      await page.evaluate(() => window.__arm());
      return await extractSlideTexts(page, total);
    } finally {
      await context.close();
    }
  });
  assert.match(texts[0].text, /IGNIS 燃点/, `读到的文字：${texts[0].text}`);
});

test('审查8：文字一直在变（超过单页上限 1.5 秒）→ 到点取最后一次读数，不无限等待；空页 1.5 秒内判空', { timeout: 120000 }, async () => {
  const { withDeckBrowser, openDeckPage, extractSlideTexts } = await import('../app/lib/browser-session.mjs');
  const browser = await detectBrowser();
  if (!browser.found) return;
  const deckDir = path.join(root, 'churn');
  fs.mkdirSync(deckDir);
  fs.writeFileSync(path.join(deckDir, 'index.html'), `<!doctype html><meta charset="utf-8">
<div id="deck"><section class="slide active" data-vm-layout="x"><p id="t">0</p></section></div>
<script>let n = 0; setInterval(() => { n += 1; document.getElementById('t').textContent = String(n); }, 50);</script>`);
  const emptyDir = path.join(root, 'empty-page');
  fs.mkdirSync(emptyDir);
  fs.writeFileSync(path.join(emptyDir, 'index.html'), '<!doctype html><meta charset="utf-8"><div id="deck"><section class="slide active" data-vm-layout="x"></section></div>');
  const run = async dir => withDeckBrowser({ deckPptDir: dir, browserPath: browser.path, tmpBase: root }, async ({ browser: b, url }) => {
    const { page, context, total } = await openDeckPage(b, url);
    try {
      const started = Date.now();
      const texts = await extractSlideTexts(page, total);
      return { texts, elapsed: Date.now() - started };
    } finally {
      await context.close();
    }
  });
  const churn = await run(deckDir);
  assert.ok(churn.elapsed < 2800, `单页上限 1.5 秒，实际 ${churn.elapsed}ms`);
  assert.ok(churn.texts[0].text.length > 0);
  const empty = await run(emptyDir);
  assert.ok(empty.elapsed < 2800, `空页应在 1.5 秒内判空，实际 ${empty.elapsed}ms`);
  assert.equal(empty.texts[0].text, '');
});

async function readDeck(dirName, html, { extraFiles = {} } = {}) {
  const { withDeckBrowser, openDeckPage, extractSlideTexts } = await import('../app/lib/browser-session.mjs');
  const browser = await detectBrowser();
  if (!browser.found) return null;
  const dir = path.join(root, dirName);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  for (const [name, content] of Object.entries(extraFiles)) fs.writeFileSync(path.join(dir, name), content);
  return withDeckBrowser({ deckPptDir: dir, browserPath: browser.path, tmpBase: root }, async ({ browser: b, url }) => {
    const { page, context, total } = await openDeckPage(b, url);
    try {
      const started = Date.now();
      const texts = await extractSlideTexts(page, total);
      return { texts, elapsed: Date.now() - started };
    } finally {
      await context.close();
    }
  });
}

test('提速：WAAPI 动画结束时才挂上的文字——getAnimations() 逐个 finish() 快进，不用等动画跑完', { timeout: 120000 }, async () => {
  const out = await readDeck('waapi', `<!doctype html><meta charset="utf-8">
<div id="deck"><section class="slide active" data-vm-layout="x"><h1>标题</h1><p id="late"></p></section></div>
<script>
const anim = document.getElementById('late').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 2500 });
anim.onfinish = () => { document.getElementById('late').textContent = 'IGNIS 燃点'; };
</script>`);
  if (!out) return;
  assert.match(out.texts[0].text, /IGNIS 燃点/);
  assert.ok(out.elapsed < 1500, `finish() 快进后应很快读到，实际 ${out.elapsed}ms`);
});

test('提速：gsap 补间结束时才挂上的文字——快进补间，不用等补间跑完', { timeout: 120000 }, async () => {
  const gsapFile = path.join(PLUG, 'app', 'runtime', 'node_modules', 'gsap', 'dist', 'gsap.min.js');
  const out = await readDeck('gsap', `<!doctype html><meta charset="utf-8">
<script src="gsap.min.js"></script>
<div id="deck"><section class="slide active" data-vm-layout="x"><h1>标题</h1><p id="late"></p></section></div>
<script>gsap.to({ v: 0 }, { v: 1, duration: 3, onComplete: () => { document.getElementById('late').textContent = 'IGNIS 燃点'; } });</script>`,
  { extraFiles: { 'gsap.min.js': fs.readFileSync(gsapFile) } });
  if (!out) return;
  assert.match(out.texts[0].text, /IGNIS 燃点/);
  assert.ok(out.elapsed < 1500, `快进补间后应很快读到，实际 ${out.elapsed}ms`);
});

test('提速：无限循环动画不拖慢读取，也不被快进成死循环', { timeout: 120000 }, async () => {
  const out = await readDeck('infinite', `<!doctype html><meta charset="utf-8">
<style>@keyframes spin { to { transform: rotate(360deg); } } #spin { animation: spin 1s linear infinite; }</style>
<div id="deck"><section class="slide active" data-vm-layout="x"><h1 id="spin">标题</h1></section></div>`);
  if (!out) return;
  assert.equal(out.texts[0].text, '标题');
  assert.ok(out.elapsed < 1500, `实际 ${out.elapsed}ms`);
});

test('翻页重试：go() 偶尔被上一次未提交的切换覆盖（从末页翻回首页，真机复现过约 20%）→ 重发，不报「翻页失败」', { timeout: 120000 }, async () => {
  const out = await readDeck('golock', `<!doctype html><meta charset="utf-8">
<div id="deck"><section class="slide active" data-vm-layout="a"><p>第一页</p></section><section class="slide" data-vm-layout="b"><p>第二页</p></section><section class="slide" data-vm-layout="c"><p>第三页</p></section></div>
<script>
// 模拟：切换要 300ms 才提交；提交前再来的 go() 被丢弃（和真机上被覆盖的现象一致）
let busyUntil = 0;
window.go = (index) => {
  if (Date.now() < busyUntil) return;
  busyUntil = Date.now() + 300;
  setTimeout(() => {
    document.querySelectorAll('#deck > .slide').forEach((el, i) => el.classList.toggle('active', i === index));
  }, 250);
};
</script>`);
  if (!out) return;
  assert.deepEqual(out.texts.map(item => item.text), ['第一页', '第二页', '第三页']);
});

test('提速：多页 deck 的文字检查并行等待——16 页用时 ≤ 5 秒（修前约 22 秒），结果不变', { timeout: 120000 }, async () => {
  const { runCli, fixture } = await import('./helpers.mjs');
  const res = await runCli('check', { request: { protocol: 1, goal: fixture('gala-deck2'), workDir: path.join(root, 'w-speed') } });
  assert.equal(res.status, 0, res.stderr.slice(0, 300));
  assert.equal(res.last.ok, true);
  assert.deepEqual(res.last.issues, []);
  assert.ok(res.last.timings.residue <= 5000, `residue 用时 ${res.last.timings.residue}ms`);
  const total = Object.values(res.last.timings).reduce((sum, value) => sum + value, 0);
  console.error(`check 各步合计 ${total}ms（residue ${res.last.timings.residue}ms）`);
  assert.ok(total <= 6000, `check 合计 ${total}ms`);
});

void fileURLToPath;
