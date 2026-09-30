import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCli, tmpDir } from './helpers.mjs';

const workDir = tmpDir();

async function expectBadRequest(command, request, label) {
  const res = await runCli(command, { request });
  assert.equal(res.status, 2, `${command} ${label}：退出码应为 2，实际 ${res.status}；stderr=${res.stderr.slice(0, 300)}`);
  assert.equal(res.last.event, 'error', `${command} ${label}`);
  assert.equal(res.last.code, 'BAD_REQUEST', `${command} ${label}`);
  assert.deepEqual(res.nonJsonLines, [], 'stdout 只能有 JSON 行');
  return res;
}

for (const command of ['selftest', 'catalog', 'contracts', 'check', 'export']) {
  test(`${command}：缺 protocol → BAD_REQUEST（退出码 2）`, async () => {
    await expectBadRequest(command, { theme: 'theme11', seed: 'a', layouts: ['theme11_page001'], goal: '/x/goal.json', workDir, deckDir: '/x', pptx: '/x/a.pptx' }, '缺 protocol');
  });
  test(`${command}：protocol 不是 1 → BAD_REQUEST`, async () => {
    await expectBadRequest(command, { protocol: 2, theme: 'theme11', seed: 'a', layouts: ['theme11_page001'], goal: '/x/goal.json', workDir, deckDir: '/x', pptx: '/x/a.pptx' }, 'protocol=2');
  });
}

test('相对路径 → BAD_REQUEST（selftest / check / export）', async () => {
  await expectBadRequest('selftest', { protocol: 1, workDir: 'relative/dir' }, 'workDir 相对');
  await expectBadRequest('check', { protocol: 1, goal: 'goal.json', workDir }, 'goal 相对');
  await expectBadRequest('check', { protocol: 1, goal: '/abs/goal.json', workDir: 'w' }, 'workDir 相对');
  await expectBadRequest('export', { protocol: 1, deckDir: 'deck', pptx: '/abs/a.pptx' }, 'deckDir 相对');
  await expectBadRequest('export', { protocol: 1, deckDir: '/abs/deck', pptx: 'a.pptx' }, 'pptx 相对');
});

test('主题不存在 → BAD_REQUEST（catalog / contracts）', async () => {
  await expectBadRequest('catalog', { protocol: 1, theme: 'theme99', seed: 'a' }, '主题不存在');
  await expectBadRequest('catalog', { protocol: 1, theme: 'nope', seed: 'a' }, '主题格式不对');
  await expectBadRequest('contracts', { protocol: 1, theme: 'theme99', layouts: ['theme99_page001'] }, '主题不存在');
});

test('catalog / contracts 其他参数错误 → BAD_REQUEST', async () => {
  await expectBadRequest('catalog', { protocol: 1, theme: 'theme11' }, '缺 seed');
  await expectBadRequest('catalog', { protocol: 1, theme: 'theme11', seed: 'a', sampleRatio: 2 }, 'sampleRatio 越界');
  await expectBadRequest('contracts', { protocol: 1, theme: 'theme11', layouts: [] }, 'layouts 空');
  await expectBadRequest('contracts', { protocol: 1, theme: 'theme11', layouts: ['theme08_page001'] }, '版式不属于该主题');
  await expectBadRequest('contracts', { protocol: 1, theme: 'theme11', layouts: ['theme11_page008'] }, '被排除的版式');
});

test('未知命令、缺命令、--request 缺失或不是绝对路径、JSON 损坏 → BAD_REQUEST', async () => {
  const unknown = await runCli('nope', {});
  assert.equal(unknown.status, 2);
  assert.equal(unknown.last.code, 'BAD_REQUEST');
  const none = await runCli(undefined, {});
  assert.equal(none.status, 2);
  const noRequest = await runCli('catalog', {});
  assert.equal(noRequest.status, 2);
  assert.equal(noRequest.last.code, 'BAD_REQUEST');
  const relative = await runCli('catalog', { requestFile: 'req.json' });
  assert.equal(relative.status, 2);
  const missing = await runCli('catalog', { requestFile: '/definitely/not/here.json' });
  assert.equal(missing.status, 2);
  const fs = await import('node:fs');
  const path = await import('node:path');
  const broken = path.join(workDir, 'broken.json');
  fs.writeFileSync(broken, '{oops');
  const bad = await runCli('catalog', { requestFile: broken });
  assert.equal(bad.status, 2);
  assert.equal(bad.last.code, 'BAD_REQUEST');
});

test('info 不需要 request，stdout 只有 JSON 行，最后一行是 result', async () => {
  const res = await runCli('info');
  assert.equal(res.status, 0);
  assert.deepEqual(res.nonJsonLines, []);
  assert.equal(res.last.event, 'result');
  assert.equal(res.last.protocol, 1);
  assert.equal(res.last.engine, 'html-deck-to-pptx 0.2.7+imago');
  assert.equal(res.last.themes.length, 12);
  assert.ok('found' in res.last.browser);
});

test('info：IMAGO_PPT_BROWSER 指向存在的文件时优先使用', async () => {
  const res = await runCli('info', { env: { IMAGO_PPT_BROWSER: process.execPath } });
  assert.equal(res.last.browser.found, true);
  assert.equal(res.last.browser.path, process.execPath);
});

test('info：IMAGO_PPT_BROWSER 指向不存在的文件时跳过，不崩溃', async () => {
  const res = await runCli('info', { env: { IMAGO_PPT_BROWSER: '/no/such/browser' } });
  assert.equal(res.status, 0);
  assert.notEqual(res.last.browser.path, '/no/such/browser');
});

