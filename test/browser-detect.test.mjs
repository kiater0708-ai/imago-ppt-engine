import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectBrowser, parseRegDefault, browserKind } from '../app/lib/browser-detect.mjs';

test('parseRegDefault：解析 reg query 输出（英文 / 中文系统 / 带引号），失败返回空', () => {
  assert.equal(parseRegDefault('\r\nHKEY_LOCAL_MACHINE\\SOFTWARE\\...\\msedge.exe\r\n    (Default)    REG_SZ    C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe\r\n'), 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe');
  assert.equal(parseRegDefault('    (默认)    REG_SZ    "D:\\Edge\\msedge.exe"'), 'D:\\Edge\\msedge.exe');
  assert.equal(parseRegDefault(''), '');
  assert.equal(parseRegDefault('错误: 系统找不到指定的注册表项或值'), '');
});

test('browserKind：edge / chrome / chromium', () => {
  assert.equal(browserKind('C:\\x\\msedge.exe'), 'edge');
  assert.equal(browserKind('C:\\x\\chrome.exe'), 'chrome');
  assert.equal(browserKind('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), 'chrome');
  assert.equal(browserKind('/x/chrome-headless-shell'), 'chromium');
});

test('detectBrowser：顺序为 IMAGO_PPT_BROWSER → 注册表（HKLM → HKCU）；注册表命令失败即跳过', async () => {
  const exists = file => ['/env/b', 'C:\\edge\\msedge.exe', 'C:\\edge-user\\msedge.exe'].includes(file);
  let r = await detectBrowser({ env: { IMAGO_PPT_BROWSER: '/env/b' }, platform: 'win32', regQuery: () => 'C:\\edge\\msedge.exe', exists });
  assert.equal(r.path, '/env/b');
  assert.equal(r.source, 'IMAGO_PPT_BROWSER');
  r = await detectBrowser({ env: {}, platform: 'win32', regQuery: hive => (hive === 'HKLM' ? 'C:\\edge\\msedge.exe' : 'C:\\edge-user\\msedge.exe'), exists });
  assert.equal(r.path, 'C:\\edge\\msedge.exe');
  assert.equal(r.kind, 'edge');
  r = await detectBrowser({ env: {}, platform: 'win32', regQuery: hive => (hive === 'HKCU' ? 'C:\\edge-user\\msedge.exe' : ''), exists });
  assert.equal(r.path, 'C:\\edge-user\\msedge.exe');
  // 环境变量指向不存在的文件 → 跳过并记录，落到注册表
  r = await detectBrowser({ env: { IMAGO_PPT_BROWSER: '/gone' }, platform: 'win32', regQuery: () => 'C:\\edge\\msedge.exe', exists });
  assert.equal(r.path, 'C:\\edge\\msedge.exe');
  assert.equal(r.tried[0].exists, false);
});

test('detectBrowser：注册表里的路径文件不存在时跳过', async () => {
  const r = await detectBrowser({ env: { IMAGO_TEST_NO_BROWSER: '1' }, platform: 'win32', regQuery: () => 'C:\\gone.exe', exists: () => false });
  assert.equal(r.found, false);
});
