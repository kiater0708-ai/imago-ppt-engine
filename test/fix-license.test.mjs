// 第一轮审查修复：许可材料、依赖 lock（审查 9、10）
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { tmpDir, PLUG } from './helpers.mjs';
import { requireFromRuntime } from '../app/lib/paths.mjs';

const root = tmpDir('imago-license-');
after(() => fs.rmSync(root, { recursive: true, force: true }));
const FONTS = path.join(PLUG, 'app', 'runtime', 'assets', 'vendor', 'fonts');

test('审查9：从 Node 官方 zip 同时取出 node.exe 与 LICENSE（放 node/LICENSE）', async () => {
  const { extractNodeFiles } = await import('../scripts/build-win.mjs');
  const JSZip = requireFromRuntime('jszip');
  const zip = new JSZip();
  const exe = Buffer.alloc(2048, 1);
  exe.write('MZ', 0, 'latin1');
  zip.file('node-v24.21.0-win-x64/node.exe', exe);
  const licenseText = 'Node.js is licensed for use as follows: MIT license text. '.repeat(10);
  zip.file('node-v24.21.0-win-x64/LICENSE', licenseText);
  zip.file('node-v24.21.0-win-x64/npm.cmd', 'x');
  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  const target = path.join(root, 'node');
  const info = await extractNodeFiles(JSZip, buffer, 'node-v24.21.0-win-x64.zip', target, { minExeBytes: 1024 });
  assert.equal(fs.readFileSync(path.join(target, 'LICENSE'), 'utf8'), licenseText);
  assert.equal(fs.statSync(path.join(target, 'node.exe')).size, 2048);
  assert.equal(fs.existsSync(path.join(target, 'npm.cmd')), false, '只取 node.exe 与 LICENSE');
  assert.equal(info.licenseSize > 0, true);
  // 压缩包里没有 LICENSE → 报错，不静默继续
  const noLicense = new JSZip();
  noLicense.file('node-v24.21.0-win-x64/node.exe', exe);
  const nl = await noLicense.generateAsync({ type: 'nodebuffer' });
  await assert.rejects(() => extractNodeFiles(JSZip, nl, 'node-v24.21.0-win-x64.zip', path.join(root, 'n3'), { minExeBytes: 1024 }), /LICENSE/);
});

test('审查9：THIRD-PARTY 列出 Node 版本与许可路径', async () => {
  const { generateThirdParty } = await import('../scripts/gen-third-party.mjs');
  const { text } = generateThirdParty(path.join(PLUG, 'app', 'runtime'), { node: { version: 'v24.21.0', licensePath: 'node/LICENSE' } });
  assert.match(text, /Node\.js/);
  assert.match(text, /v24\.21\.0/);
  assert.match(text, /node\/LICENSE/);
});

test('审查9：readFontInfo 读 WOFF2 / TTF 的 name 表（版权 0、许可描述 13、许可 URL 14）', async () => {
  const { readFontInfo, classifyLicense } = await import('../scripts/font-info.mjs');
  const inter = readFontInfo(path.join(FONTS, fs.readdirSync(FONTS).find(name => /^inter-.*\.woff2$/.test(name))));
  assert.match(inter.copyright, /Inter Project Authors/);
  assert.equal(classifyLicense(inter), 'OFL-1.1');
  const plex = readFontInfo(path.join(FONTS, fs.readdirSync(FONTS).find(name => /^ibm-plex-sans-.*\.woff2$/.test(name))));
  assert.match(plex.copyright, /IBM Corp/);
  assert.match(plex.licenseUrl, /sil\.org\/OFL/);
  const oppo = readFontInfo(path.join(FONTS, 'oppo-sans-4.0.ttf'));
  assert.match(oppo.copyright, /OPPO/);
  assert.equal(classifyLicense(oppo), null, 'OPPO 字体 name 表里没有许可描述，靠同目录的许可文件');
  const junk = path.join(root, 'junk.woff2');
  fs.writeFileSync(junk, 'not a font at all, just text');
  assert.throws(() => readFontInfo(junk));
});

test('审查9：逐字体生成版权与许可条目；OFL-1.1 全文随包（licenses/OFL-1.1.txt）', async () => {
  const { generateThirdParty } = await import('../scripts/gen-third-party.mjs');
  const result = generateThirdParty(path.join(PLUG, 'app', 'runtime'), { node: { version: 'v24.21.0', licensePath: 'node/LICENSE' } });
  assert.deepEqual(result.fontProblems, [], `读不到许可信息的字体：${JSON.stringify(result.fontProblems)}`);
  assert.match(result.text, /Copyright 2016 The Inter Project Authors/);
  assert.match(result.text, /Copyright 2017 IBM Corp/);
  assert.match(result.text, /licenses\/OFL-1\.1\.txt/);
  assert.match(result.text, /oppo-sans-4\.0\.ttf/);
  const ofl = fs.readFileSync(path.join(PLUG, 'licenses', 'OFL-1.1.txt'), 'utf8');
  assert.match(ofl, /SIL OPEN FONT LICENSE Version 1\.1 - 26 February 2007/);
  assert.match(ofl, /DISCLAIMER/);
  assert.ok(result.fontCount >= 180);
});

test('审查9：某个字体读不到许可信息 → 生成器返回名单（打包据此失败）', async () => {
  const { generateThirdParty } = await import('../scripts/gen-third-party.mjs');
  // 临时 runtime：只带一个坏字体 + 最小依赖目录
  const rt = path.join(root, 'fake-runtime');
  fs.mkdirSync(path.join(rt, 'assets', 'vendor', 'fonts'), { recursive: true });
  fs.writeFileSync(path.join(rt, 'assets', 'vendor', 'fonts', 'broken-400-1.woff2'), 'garbage-garbage-garbage');
  fs.mkdirSync(path.join(rt, 'src', 'components', 'themes'), { recursive: true });
  const real = path.join(PLUG, 'app', 'runtime', 'node_modules');
  fs.symlinkSync(real, path.join(rt, 'node_modules'));
  const result = generateThirdParty(rt, { node: { version: 'v1', licensePath: 'node/LICENSE' } });
  assert.equal(result.fontProblems.length, 1);
  assert.match(result.fontProblems[0].file, /broken-400-1\.woff2/);
});

test('审查10：发布用的完整生产依赖 lock 存在、无 dev 包、有 integrity，且与开发 lock 的版本一致', () => {
  const dir = path.join(PLUG, 'scripts', 'prod-deps');
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  const lock = JSON.parse(fs.readFileSync(path.join(dir, 'package-lock.json'), 'utf8'));
  const devLock = JSON.parse(fs.readFileSync(path.join(PLUG, 'app', 'runtime', 'package-lock.json'), 'utf8'));
  const names = Object.keys(pkg.dependencies).sort();
  assert.deepEqual(names, ['gsap', 'html-to-image', 'jszip', 'pdf-lib', 'playwright-core', 'pngjs', 'pptxgenjs', 'react', 'react-dom']);
  for (const name of names) {
    assert.equal(pkg.dependencies[name], devLock.packages[`node_modules/${name}`].version, `${name} 版本要与开发验证过的一致`);
  }
  const entries = Object.entries(lock.packages).filter(([key]) => key);
  assert.ok(entries.length >= 25);
  for (const [key, entry] of entries) {
    assert.ok(entry.integrity, `${key} 缺 integrity`);
    assert.ok(!entry.dev, `${key} 不应是 dev 包`);
    assert.ok(!entry.os && !entry.cpu, `${key} 不应是平台相关包`);
  }
});

test('审查10：打包脚本用 npm ci --omit=dev --omit=optional 装依赖（不再 npm install --no-package-lock）', () => {
  const source = fs.readFileSync(path.join(PLUG, 'scripts', 'build-win.mjs'), 'utf8');
  assert.match(source, /'ci'/);
  assert.match(source, /--omit=dev/);
  assert.match(source, /--omit=optional/);
  assert.doesNotMatch(source, /--no-package-lock/);
});
