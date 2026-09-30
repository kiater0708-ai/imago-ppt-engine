#!/usr/bin/env node
// 打 win-x64 发布包：node scripts/build-win.mjs --version <x.y.z> [--out dist] [--node-version v24.21.0] [--keep-staging] [--no-smoke]
// 步骤：清 staging → 复制 app/ 与许可文件 → 生成只含运行时依赖的 package.json 并 npm install --omit=dev
// → 检查没有原生模块 → 生成渲染 bundle → 下载 Node（校验 sha256，只取 node.exe）→ THIRD-PARTY.md → manifest.json → zip。
// 任何一步失败都报错退出；zip 先写临时名，全部成功后才改名，不留半成品。
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { bundleRender } from './bundle-render.mjs';
import { generateThirdParty, RUNTIME_DEPS } from './gen-third-party.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUG = path.resolve(HERE, '..');
const PROTOCOL = 1;
const DEFAULT_NODE = 'v24.21.0';
const NATIVE_EXT = /\.(node|dll|so|dylib|exe|pyd)$/i;

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const args = { out: path.join(PLUG, 'dist'), nodeVersion: DEFAULT_NODE, keepStaging: false, smoke: true };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--version') args.version = argv[++i];
    else if (item === '--out') args.out = path.resolve(argv[++i] || '');
    else if (item === '--node-version') args.nodeVersion = argv[++i];
    else if (item === '--keep-staging') args.keepStaging = true;
    else if (item === '--no-smoke') args.smoke = false;
    else fail(`不认识的参数：${item}`);
  }
  if (!args.version || !/^\d+\.\d+\.\d+$/.test(args.version)) fail('必须给 --version <x.y.z>（例如 0.1.0）');
  if (!/^v\d+\.\d+\.\d+$/.test(args.nodeVersion || '')) fail(`--node-version 格式不对：${args.nodeVersion}`);
  return args;
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile()) out.push(full);
    else fail(`发布包里不允许符号链接或特殊文件：${full}`);
  }
  return out;
}

function runNpm(args, cwd) {
  const isWin = process.platform === 'win32';
  const res = spawnSync(isWin ? 'cmd' : 'npm', isWin ? ['/c', 'npm', ...args] : args, {
    cwd, encoding: 'utf8', timeout: 600000, env: { ...process.env, PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1' }, maxBuffer: 64 * 1024 * 1024,
  });
  if (res.error) fail(`npm 无法运行：${res.error.message}`);
  if (res.status !== 0) fail(`npm ${args.join(' ')} 失败（退出码 ${res.status}）：\n${String(res.stderr || res.stdout).slice(-1500)}`);
  return res;
}

async function download(url, timeoutMs = 300000) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), redirect: 'follow' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
      console.error(`下载失败（第 ${attempt}/3 次）：${url}：${error.message}`);
    }
  }
  fail(`下载失败：${url}：${lastError?.message}`);
}

/** 下载 Node win-x64 zip 与 SHASUMS256.txt，校验后返回 zip 的 Buffer 与 sha256。缓存在 <out>/cache/，命中时仍重新校验。 */
async function fetchNode(nodeVersion, cacheDir) {
  const zipName = `node-${nodeVersion}-win-x64.zip`;
  const base = `https://nodejs.org/dist/${nodeVersion}`;
  fs.mkdirSync(cacheDir, { recursive: true });
  const sumsText = (await download(`${base}/SHASUMS256.txt`, 60000)).toString('utf8');
  const line = sumsText.split(/\r?\n/).find(item => item.trim().endsWith(` ${zipName}`) || item.trim().endsWith(`  ${zipName}`));
  if (!line) fail(`SHASUMS256.txt 里没有 ${zipName}`);
  const expected = line.trim().split(/\s+/)[0].toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(expected)) fail(`SHASUMS256.txt 里 ${zipName} 的校验值格式不对：${expected}`);
  const cached = path.join(cacheDir, zipName);
  let buffer = null;
  if (fs.existsSync(cached)) {
    const data = fs.readFileSync(cached);
    if (crypto.createHash('sha256').update(data).digest('hex') === expected) buffer = data;
    else console.error(`缓存的 ${zipName} 校验不符，重新下载`);
  }
  if (!buffer) {
    buffer = await download(`${base}/${zipName}`);
    const actual = crypto.createHash('sha256').update(buffer).digest('hex');
    if (actual !== expected) fail(`${zipName} sha256 校验失败：期望 ${expected}，实际 ${actual}`);
    const part = `${cached}.part`;
    fs.writeFileSync(part, buffer);
    fs.renameSync(part, cached);
  }
  return { buffer, sha256: expected, zipName };
}

async function extractNodeExe(JSZip, nodeZip, zipName, target) {
  const zip = await JSZip.loadAsync(nodeZip);
  const entryName = `${zipName.replace(/\.zip$/, '')}/node.exe`;
  const entry = zip.file(entryName);
  if (!entry) fail(`Node 压缩包里没有 ${entryName}`);
  const data = await entry.async('nodebuffer');
  if (data.length < 10 * 1024 * 1024 || data.subarray(0, 2).toString('latin1') !== 'MZ') fail(`node.exe 内容异常（${data.length} 字节）`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, data);
  return { size: data.length, sha256: crypto.createHash('sha256').update(data).digest('hex') };
}

function copyApp(staging) {
  const skip = new Set(['node_modules', 'output', '.DS_Store', 'render-goal-deck.bundle.mjs']);
  fs.cpSync(path.join(PLUG, 'app'), path.join(staging, 'app'), {
    recursive: true,
    filter: source => !skip.has(path.basename(source)) && !path.basename(source).startsWith('.deckshot') && path.basename(source) !== '.svgshot.mjs',
  });
  for (const name of ['LICENSE', 'NOTICE.md', 'README.md']) {
    const from = path.join(PLUG, name);
    if (!fs.existsSync(from)) fail(`缺少 ${name}`);
    fs.copyFileSync(from, path.join(staging, name));
  }
}

function runtimePackageJson(version) {
  const lock = JSON.parse(fs.readFileSync(path.join(PLUG, 'app', 'runtime', 'package-lock.json'), 'utf8'));
  const dependencies = {};
  for (const name of RUNTIME_DEPS) {
    const entry = lock.packages?.[`node_modules/${name}`];
    if (!entry?.version) fail(`runtime/package-lock.json 里找不到依赖 ${name}`);
    dependencies[name] = entry.version; // 精确版本：与开发时验证过的版本一致
  }
  return { name: 'imago-ppt-plugin-runtime', version, private: true, type: 'module', license: 'AGPL-3.0-only', dependencies };
}

function assertNoNative(nodeModules) {
  const problems = [];
  for (const file of walk(nodeModules)) {
    if (NATIVE_EXT.test(file) || path.basename(file) === 'binding.gyp') problems.push(path.relative(nodeModules, file));
  }
  for (const entry of fs.readdirSync(nodeModules)) {
    const dirs = entry.startsWith('@') ? fs.readdirSync(path.join(nodeModules, entry)).map(name => path.join(entry, name)) : [entry];
    for (const dir of dirs) {
      const pkgFile = path.join(nodeModules, dir, 'package.json');
      if (!fs.existsSync(pkgFile)) continue;
      const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
      if (pkg.gypfile || pkg.os || pkg.cpu) problems.push(`${dir}/package.json（gypfile/os/cpu：平台相关包）`);
    }
  }
  if (problems.length) fail(`运行时依赖里出现原生/平台相关文件，插件要求全是纯 JS：\n  ${problems.slice(0, 20).join('\n  ')}`);
}

function dirSizes(root, files) {
  const sizes = new Map();
  for (const file of files) {
    const size = fs.statSync(file).size;
    let dir = path.dirname(file);
    while (dir.length >= root.length) {
      sizes.set(dir, (sizes.get(dir) || 0) + size);
      if (dir === root) break;
      dir = path.dirname(dir);
    }
  }
  return sizes;
}

function topDirs(root, files, count = 10) {
  const sizes = dirSizes(root, files);
  const hasChildDir = new Set([...sizes.keys()].map(dir => path.dirname(dir)));
  const rows = [];
  for (const [dir, size] of sizes) {
    if (dir === root) continue;
    const depth = path.relative(root, dir).split(path.sep).length;
    if (depth === 3 || (depth < 3 && !hasChildDir.has(dir))) rows.push({ dir: path.relative(root, dir).split(path.sep).join('/'), bytes: size });
  }
  return rows.sort((a, b) => b.bytes - a.bytes).slice(0, count);
}

const mb = bytes => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const staging = path.join(args.out, 'staging-win-x64');
  const zipFinal = path.join(args.out, `imago-ppt-plugin-${args.version}-win-x64.zip`);
  const zipPart = `${zipFinal}.part-${process.pid}`;
  let JSZip;
  try {
    JSZip = createRequire(path.join(PLUG, 'app', 'runtime', 'package.json'))('jszip');
  } catch (error) {
    fail(`加载 jszip 失败：${error.message}（先运行 npm run setup）`);
  }
  try {
    console.log(`[1/9] 清理并创建 staging：${staging}`);
    fs.rmSync(staging, { recursive: true, force: true });
    fs.mkdirSync(staging, { recursive: true });

    console.log('[2/9] 复制 app/ 与许可文件');
    copyApp(staging);
    fs.writeFileSync(path.join(staging, 'app', 'version.json'), `${JSON.stringify({ version: args.version, protocol: PROTOCOL }, null, 2)}\n`);

    console.log('[3/9] 安装运行时依赖（npm install --omit=dev --omit=optional）');
    const stagingRuntime = path.join(staging, 'app', 'runtime');
    fs.rmSync(path.join(stagingRuntime, 'package-lock.json'), { force: true });
    fs.writeFileSync(path.join(stagingRuntime, 'package.json'), `${JSON.stringify(runtimePackageJson(args.version), null, 2)}\n`);
    runNpm(['install', '--omit=dev', '--omit=optional', '--no-package-lock', '--no-audit', '--no-fund', '--ignore-scripts'], stagingRuntime);
    if (!fs.existsSync(path.join(stagingRuntime, 'node_modules'))) fail('npm install 结束但没有生成 node_modules');
    fs.rmSync(path.join(stagingRuntime, 'node_modules', '.package-lock.json'), { force: true });
    fs.rmSync(path.join(stagingRuntime, 'node_modules', '.bin'), { recursive: true, force: true }); // .bin 是符号链接，运行时用不到

    console.log('[4/9] 检查没有原生模块');
    assertNoNative(path.join(stagingRuntime, 'node_modules'));

    console.log('[5/9] 预打包渲染脚本');
    const bundle = await bundleRender({ out: path.join(stagingRuntime, 'scripts', 'render-goal-deck.bundle.mjs') });
    console.log(`      ${(bundle.bytes / 1024).toFixed(0)} KB`);

    console.log(`[6/9] 下载 Node ${args.nodeVersion} win-x64 并校验 sha256`);
    const nodeInfo = await fetchNode(args.nodeVersion, path.join(args.out, 'cache'));
    const exe = await extractNodeExe(JSZip, nodeInfo.buffer, nodeInfo.zipName, path.join(staging, 'node', 'node.exe'));

    console.log('[7/9] 生成 THIRD-PARTY.md');
    fs.writeFileSync(path.join(staging, 'THIRD-PARTY.md'), generateThirdParty(stagingRuntime).text);

    if (args.smoke) {
      console.log('[8/9] 冒烟：用本机 node 跑 staging 里的 info 与 selftest');
      smoke(staging, args.out);
    } else console.log('[8/9] 跳过冒烟（--no-smoke）');

    console.log('[9/9] 生成 manifest.json 并打 zip');
    const files = walk(staging);
    const entries = files.map(file => ({ path: path.relative(staging, file).split(path.sep).join('/'), sha256: sha256File(file), size: fs.statSync(file).size }));
    const manifest = {
      name: 'imago-ppt-plugin',
      version: args.version,
      protocol: PROTOCOL,
      platform: 'win-x64',
      node: { version: args.nodeVersion, archive: nodeInfo.zipName, archiveSha256: nodeInfo.sha256, exeSha256: exe.sha256, exeSize: exe.size },
      engine: 'html-deck-to-pptx 0.2.7+imago',
      files: entries,
    };
    fs.writeFileSync(path.join(staging, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

    const allFiles = walk(staging);
    const zip = new JSZip();
    for (const file of allFiles) {
      const rel = path.relative(staging, file).split(path.sep).join('/');
      zip.file(rel, fs.readFileSync(file), { date: new Date(2026, 0, 1), createFolders: false });
    }
    fs.mkdirSync(args.out, { recursive: true });
    await new Promise((resolve, reject) => {
      const out = fs.createWriteStream(zipPart);
      out.on('error', reject).on('finish', resolve);
      zip.generateNodeStream({ streamFiles: true, compression: 'DEFLATE', compressionOptions: { level: 6 } }).on('error', reject).pipe(out);
    });
    // 校验 zip：能重新打开、条目数一致、含 node.exe 与 manifest.json
    const verify = await JSZip.loadAsync(fs.readFileSync(zipPart));
    const names = Object.keys(verify.files).filter(name => !verify.files[name].dir);
    if (names.length !== allFiles.length) fail(`zip 条目数 ${names.length} 与文件数 ${allFiles.length} 不一致`);
    for (const need of ['node/node.exe', 'manifest.json', 'app/cli.mjs', 'app/runtime/scripts/render-goal-deck.bundle.mjs']) {
      if (!verify.file(need)) fail(`zip 里缺少 ${need}`);
    }
    fs.renameSync(zipPart, zipFinal);

    const zipBytes = fs.statSync(zipFinal).size;
    const unpacked = allFiles.reduce((sum, file) => sum + fs.statSync(file).size, 0);
    const summary = {
      zip: zipFinal, zipBytes, zipSha256: sha256File(zipFinal), unpackedBytes: unpacked, fileCount: allFiles.length,
      topDirs: topDirs(staging, allFiles),
    };
    console.log(`\nzip：${summary.zip}\n大小：${mb(zipBytes)}（${zipBytes} 字节）\nsha256：${summary.zipSha256}\n解压后：${mb(unpacked)}，${summary.fileCount} 个文件\n体积前 10 的目录：`);
    for (const row of summary.topDirs) console.log(`  ${mb(row.bytes).padStart(10)}  ${row.dir}`);
    console.log(`\n${JSON.stringify(summary)}`);
  } catch (error) {
    try { fs.rmSync(zipPart, { force: true }); } catch { /* 临时 zip 删不掉也不影响报错 */ }
    throw error;
  } finally {
    if (!args.keepStaging) {
      try { fs.rmSync(staging, { recursive: true, force: true }); } catch (error) { console.error(`清理 staging 失败：${error.message}`); }
    }
  }
}

function smoke(staging, out) {
  const cli = path.join(staging, 'app', 'cli.mjs');
  const run = (command, request) => {
    const args = [cli, command];
    if (request) {
      const file = path.join(out, `smoke-${command}.json`);
      fs.writeFileSync(file, JSON.stringify(request));
      args.push('--request', file);
    }
    const res = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 240000, maxBuffer: 64 * 1024 * 1024 });
    if (res.error) fail(`冒烟 ${command} 无法运行：${res.error.message}`);
    const last = String(res.stdout).trim().split('\n').filter(Boolean).pop() || '';
    let event;
    try { event = JSON.parse(last); } catch { fail(`冒烟 ${command} 的最后一行不是 JSON：${last.slice(0, 200)}\n${String(res.stderr).slice(-600)}`); }
    return { event, status: res.status };
  };
  const info = run('info');
  if (info.status !== 0 || info.event.event !== 'result') fail(`冒烟 info 失败：${JSON.stringify(info.event).slice(0, 300)}`);
  const workDir = path.join(out, 'smoke-work');
  fs.rmSync(workDir, { recursive: true, force: true });
  const self = run('selftest', { protocol: PROTOCOL, workDir });
  if (self.event.event === 'error' && self.event.code === 'NO_BROWSER') console.warn('      本机没有浏览器，跳过 selftest 冒烟');
  else if (self.status !== 0 || self.event.ok !== true) fail(`冒烟 selftest 失败：${JSON.stringify(self.event).slice(0, 500)}`);
  else console.log(`      selftest 通过，用时 ${self.event.durationMs} ms`);
  fs.rmSync(workDir, { recursive: true, force: true });
  for (const name of ['smoke-selftest.json', 'smoke-info.json']) fs.rmSync(path.join(out, name), { force: true });
}

main().catch(error => {
  console.error(`\n打包失败：${error.message}`);
  process.exit(1);
});
