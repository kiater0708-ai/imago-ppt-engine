#!/usr/bin/env node
// 生成 THIRD-PARTY.md：npm 运行时依赖（含传递依赖）及其许可、OPPO Sans 字体、主题内图片与社交图标清单。
// 用法：node scripts/gen-third-party.mjs [--runtime <runtime 目录>] [--out <THIRD-PARTY.md>]
// 依赖清单从 <runtime>/node_modules 里的 package.json 读出（只取运行时依赖的传递闭包，不含 devDependencies）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUG = path.resolve(HERE, '..');
export const RUNTIME_DEPS = ['gsap', 'html-to-image', 'jszip', 'pdf-lib', 'playwright-core', 'pngjs', 'pptxgenjs', 'react', 'react-dom'];
const IMAGE_RE = /\.(png|jpe?g|gif|webp|svg|avif|mp4|webm|mov)$/i;

function readPkg(nodeModules, name) {
  const file = path.join(nodeModules, ...name.split('/'), 'package.json');
  try {
    return { file, data: JSON.parse(fs.readFileSync(file, 'utf8')) };
  } catch (error) {
    throw new Error(`读取依赖 ${name} 的 package.json 失败：${file}（${error.message}）`);
  }
}

function licenseOf(data) {
  if (typeof data.license === 'string') return data.license;
  if (data.license?.type) return data.license.type;
  if (Array.isArray(data.licenses)) return data.licenses.map(item => item.type || item).join(' OR ');
  return 'UNKNOWN';
}

/** 运行时依赖的传递闭包（dependencies；optionalDependencies 已装则计入）。 */
export function collectRuntimeDeps(nodeModules, roots = RUNTIME_DEPS) {
  const seen = new Map();
  const queue = [...roots];
  while (queue.length) {
    const name = queue.shift();
    if (seen.has(name)) continue;
    let pkg;
    try {
      pkg = readPkg(nodeModules, name);
    } catch (error) {
      if (roots.includes(name)) throw error;
      continue; // 传递依赖里未安装的可选项（如 fsevents）跳过
    }
    seen.set(name, { name, version: pkg.data.version, license: licenseOf(pkg.data), homepage: pkg.data.homepage || pkg.data.repository?.url || '', dir: path.dirname(pkg.file) });
    for (const dep of Object.keys({ ...pkg.data.dependencies, ...pkg.data.optionalDependencies })) queue.push(dep);
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function walkFiles(dir, base, filter, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, base, filter, out);
    else if (filter(entry.name)) out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

export function generateThirdParty(runtimeDir) {
  const nodeModules = path.join(runtimeDir, 'node_modules');
  const deps = collectRuntimeDeps(nodeModules);
  const themesDir = path.join(runtimeDir, 'src', 'components', 'themes');
  const themeImages = walkFiles(themesDir, runtimeDir, name => IMAGE_RE.test(name));
  const socialIcons = walkFiles(path.join(runtimeDir, 'assets', 'social-icons'), runtimeDir, () => true);
  const unicornMedia = walkFiles(path.join(runtimeDir, 'assets', 'unicorn', 'media'), runtimeDir, () => true);
  const fontDirs = walkFiles(path.join(runtimeDir, 'assets', 'vendor', 'fonts'), runtimeDir, () => true);

  const lines = [];
  lines.push('# 第三方组件与素材清单', '');
  lines.push('本文件由 `scripts/gen-third-party.mjs` 生成。插件自身许可为 AGPL-3.0（见 LICENSE），上游与修改说明见 NOTICE.md。', '');
  lines.push('## 1. npm 运行时依赖', '');
  lines.push(`共 ${deps.length} 个包（运行时依赖及其传递依赖；不含 tsx、esbuild 等开发依赖，它们不进发布包）。`, '');
  lines.push('| 包 | 版本 | 许可 |', '|---|---|---|');
  for (const dep of deps) lines.push(`| ${dep.name} | ${dep.version} | ${dep.license} |`);
  const oppoFiles = fontDirs.filter(file => /oppo-sans/i.test(file));
  const otherFonts = fontDirs.filter(file => !/oppo-sans/i.test(file));
  lines.push('', '## 2. 字体', '', '### 2.1 OPPO Sans 4.0', '');
  lines.push('**本软件使用了 OPPO Sans 字体。** 字体随主题页面一起分发，未改动字体文件，不单独分发；许可原文与来源随包附带：', '');
  if (oppoFiles.length) oppoFiles.forEach(file => lines.push(`- \`app/runtime/${file}\``));
  else lines.push('- （开发目录内未找到 OPPO Sans 文件，发布前需补齐）');
  const families = new Map();
  for (const file of otherFonts) {
    const family = path.posix.basename(file).replace(/-\d+(-\d+)?(-italic)?\.(woff2?|ttf|otf)$/i, '').replace(/\.(woff2?|ttf|otf)$/i, '');
    families.set(family, (families.get(family) || 0) + 1);
  }
  lines.push('', '### 2.2 其他随附字体（`app/runtime/assets/vendor/fonts/`）', '');
  lines.push('| 字体族（按文件名归类） | 文件数 |', '|---|---|');
  for (const [family, count] of [...families.entries()].sort()) lines.push(`| ${family} | ${count} |`);
  lines.push('', '这些字体来自上游运行时，源码树内没有逐个的许可原文文件；常见理解是它们为开源字体（多为 SIL OFL 1.1），正式公开前需逐个核对并补许可原文。');
  lines.push('', `## 3. 主题内图片与视频（${themeImages.length} 个）`, '');
  lines.push('位于 `app/runtime/src/components/themes/` 下，随各主题一起分发。逐文件清单：', '');
  themeImages.forEach(file => lines.push(`- \`app/runtime/${file}\``));
  lines.push('', `## 4. 社交平台图标（${socialIcons.length} 个）`, '');
  socialIcons.forEach(file => lines.push(`- \`app/runtime/${file}\``));
  lines.push('', '各平台图标的商标归其权利人所有，仅用于标示作者主页链接。', '');
  lines.push(`## 5. Unicorn 场景贴图（${unicornMedia.length} 个）`, '');
  unicornMedia.forEach(file => lines.push(`- \`app/runtime/${file}\``));
  lines.push('');
  return { text: lines.join('\n'), deps, counts: { themeImages: themeImages.length, socialIcons: socialIcons.length, unicornMedia: unicornMedia.length, fonts: fontDirs.length } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = name => {
    const i = process.argv.indexOf(name);
    return i >= 0 ? process.argv[i + 1] : undefined;
  };
  const runtimeDir = path.resolve(arg('--runtime') || path.join(PLUG, 'app', 'runtime'));
  const out = path.resolve(arg('--out') || path.join(PLUG, 'THIRD-PARTY.md'));
  try {
    const { text, counts, deps } = generateThirdParty(runtimeDir);
    fs.writeFileSync(out, text);
    console.log(`已生成 ${out}：${deps.length} 个 npm 包，${JSON.stringify(counts)}`);
  } catch (error) {
    console.error(`生成 THIRD-PARTY.md 失败：${error.message}`);
    process.exit(1);
  }
}
