// 第一轮审查修复：Windows 路径、注册表中文路径（审查 11、14）
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('审查11：Windows 只接受带盘符或 UNC 的完整路径；\\work、/work 拒绝', async () => {
  const { isFullyQualifiedPath } = await import('../app/lib/request.mjs');
  for (const ok of ['C:\\work\\x', 'd:/work/x', 'C:\\', '\\\\server\\share\\dir', '\\\\server\\share']) assert.equal(isFullyQualifiedPath(ok, 'win32'), true, ok);
  for (const bad of ['\\work\\x', '/work/x', 'work\\x', 'C:work', 'C:', '\\\\server', '\\\\?\\', '', 'relative']) assert.equal(isFullyQualifiedPath(bad, 'win32'), false, bad);
  assert.equal(isFullyQualifiedPath('/abs/x', 'linux'), true);
  assert.equal(isFullyQualifiedPath('rel/x', 'linux'), false);
  assert.equal(isFullyQualifiedPath('C:\\x', 'linux'), false, 'POSIX 上盘符路径不是绝对路径');
});

test('审查11：requireAbsolute 在 win32 上拒绝盘符相对路径并说明原因（注入平台）', async () => {
  const { requireAbsolute } = await import('../app/lib/request.mjs');
  assert.throws(() => requireAbsolute('\\work\\x', 'workDir', 'win32'), error => error.code === 'BAD_REQUEST' && /盘符|UNC/.test(error.message));
  assert.doesNotThrow(() => requireAbsolute('C:\\work\\x', 'workDir', 'win32'));
});

test('审查14：注册表用 PowerShell 读取（UTF-8 输出、展开环境变量），中文安装路径可用', async () => {
  const { detectBrowser, buildRegPowerShellArgs } = await import('../app/lib/browser-detect.mjs');
  const args = buildRegPowerShellArgs('HKLM');
  assert.deepEqual(args.slice(0, 3), ['-NoProfile', '-NonInteractive', '-Command']);
  const script = args[3];
  assert.match(script, /\[Console\]::OutputEncoding\s*=\s*\[Text\.Encoding\]::UTF8/);
  assert.match(script, /Get-ItemProperty/);
  assert.match(script, /'\(default\)'/);
  assert.match(script, /ExpandEnvironmentVariables/);
  const chinese = 'D:\\应用\\Edge\\msedge.exe';
  const r = await detectBrowser({
    env: {}, platform: 'win32', exists: file => file === chinese,
    psRegQuery: hive => (hive === 'HKLM' ? chinese : ''),
    regQuery: () => { throw new Error('PowerShell 成功时不应再走 reg'); },
  });
  assert.equal(r.path, chinese);
  assert.equal(r.kind, 'edge');
});

test('审查14：PowerShell 失败或没读到 → 回落 reg；reg 输出按 UTF-8，不是合法 UTF-8 时按 GBK 解码', async () => {
  const { detectBrowser, decodeRegOutput } = await import('../app/lib/browser-detect.mjs');
  const r = await detectBrowser({
    env: {}, platform: 'win32', exists: file => file === 'C:\\edge\\msedge.exe',
    psRegQuery: () => { throw new Error('powershell 不可用'); },
    regQuery: hive => (hive === 'HKLM' ? 'C:\\edge\\msedge.exe' : ''),
  });
  assert.equal(r.path, 'C:\\edge\\msedge.exe');
  // GBK 字节：「(默认)    REG_SZ    D:\应用\Edge\msedge.exe」
  const gbk = Buffer.concat([
    Buffer.from('    ('), Buffer.from([0xc4, 0xac, 0xc8, 0xcf]), Buffer.from(')    REG_SZ    D:\\'),
    Buffer.from([0xd3, 0xa6, 0xd3, 0xc3]), Buffer.from('\\Edge\\msedge.exe\r\n'),
  ]);
  assert.match(decodeRegOutput(gbk), /D:\\应用\\Edge\\msedge\.exe/);
  const utf8 = Buffer.from('    (Default)    REG_SZ    D:\\应用\\Edge\\msedge.exe\r\n', 'utf8');
  assert.match(decodeRegOutput(utf8), /D:\\应用\\Edge\\msedge\.exe/);
});

test('审查14：注册表值里的环境变量（REG_EXPAND_SZ）展开', async () => {
  const { expandEnvVars } = await import('../app/lib/browser-detect.mjs');
  assert.equal(expandEnvVars('%ProgramFiles(x86)%\\Microsoft\\Edge\\msedge.exe', { 'ProgramFiles(x86)': 'C:\\Program Files (x86)' }), 'C:\\Program Files (x86)\\Microsoft\\Edge\\msedge.exe');
  assert.equal(expandEnvVars('%NOPE%\\x', {}), '%NOPE%\\x');
});
