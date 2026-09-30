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

test('审查8：文字一直在变（超过总上限 3 秒）→ 到点取最后一次读数，不无限等待；空页 3 秒内判空', { timeout: 120000 }, async () => {
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
  assert.ok(churn.elapsed < 4500, `每页总上限约 3 秒，实际 ${churn.elapsed}ms`);
  assert.ok(churn.texts[0].text.length > 0);
  const empty = await run(emptyDir);
  assert.ok(empty.elapsed < 4500, `空页应在约 3 秒内判空，实际 ${empty.elapsed}ms`);
  assert.equal(empty.texts[0].text, '');
});

void fileURLToPath;
