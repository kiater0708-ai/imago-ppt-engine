#!/usr/bin/env node
// 生成 THIRD-PARTY.md：npm 运行时依赖（含传递依赖）及其许可、OPPO Sans 字体、主题内图片与社交图标清单。
// 用法：node scripts/gen-third-party.mjs [--runtime <runtime 目录>] [--out <THIRD-PARTY.md>]
// 依赖清单从 <runtime>/node_modules 里的 package.json 读出（只取运行时依赖的传递闭包，不含 devDependencies）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFontInfo, classifyLicense } from './font-info.mjs';

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

/** 字体文件同目录下、文件名以字体主名开头且含 license 的文本文件（如 oppo-sans-4.0-license-notice.txt）。 */
function licenseFileFor(fontFile, siblings) {
  const stem = path.basename(fontFile).replace(/\.(woff2?|ttf|otf)$/i, '');
  return siblings.find(name => name.toLowerCase().startsWith(stem.toLowerCase()) && /licen[sc]e/i.test(name)) || null;
}

/**
 * 逐字体读 name 表，得到版权与许可条目。读不到许可信息（name 表没有、同目录也没有许可文件）的记入 problems。
 * 返回 { entries:[{file, family, fullName, copyright, license, licenseSource}], problems:[{file, reason}] }。
 */
export function collectFontLicenses(runtimeDir) {
  const dir = path.join(runtimeDir, 'assets', 'vendor', 'fonts');
  let names = [];
  try {
    names = fs.readdirSync(dir).sort();
  } catch {
    return { entries: [], problems: [] };
  }
  const entries = [];
  const problems = [];
  for (const name of names.filter(item => /\.(woff2?|ttf|otf)$/i.test(item))) {
    const rel = `assets/vendor/fonts/${name}`;
    let info;
    try {
      info = readFontInfo(path.join(dir, name));
    } catch (error) {
      problems.push({ file: rel, reason: `读不了字体文件：${error.message}` });
      continue;
    }
    const kind = classifyLicense(info);
    const licenseFile = licenseFileFor(name, names);
    if (kind === 'OFL-1.1') {
      entries.push({ file: rel, family: info.family, fullName: info.fullName, copyright: info.copyright, license: 'SIL OFL 1.1（licenses/OFL-1.1.txt）', licenseSource: '字体内嵌元数据' });
    } else if (kind === 'other' || licenseFile) {
      if (!info.copyright && !licenseFile) { problems.push({ file: rel, reason: '没有版权信息' }); continue; }
      entries.push({
        file: rel, family: info.family, fullName: info.fullName, copyright: info.copyright,
        license: licenseFile ? `随附许可文件 app/runtime/assets/vendor/fonts/${licenseFile}` : (info.licenseDescription || info.licenseUrl),
        licenseSource: licenseFile ? '随附许可文件' : '字体内嵌元数据',
      });
    } else {
      problems.push({ file: rel, reason: `字体 name 表里没有许可描述/许可 URL，同目录也没有许可文件（版权：${info.copyright || '无'}）` });
    }
  }
  return { entries, problems };
}

const cell = text => String(text || '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();

export function generateThirdParty(runtimeDir, { node } = {}) {
  const nodeModules = path.join(runtimeDir, 'node_modules');
  const deps = collectRuntimeDeps(nodeModules);
  const themesDir = path.join(runtimeDir, 'src', 'components', 'themes');
  const themeImages = walkFiles(themesDir, runtimeDir, name => IMAGE_RE.test(name));
  const socialIcons = walkFiles(path.join(runtimeDir, 'assets', 'social-icons'), runtimeDir, () => true);
  const unicornMedia = walkFiles(path.join(runtimeDir, 'assets', 'unicorn', 'media'), runtimeDir, () => true);
  const fonts = collectFontLicenses(runtimeDir);

  const lines = [];
  lines.push('# 第三方组件与素材清单', '');
  lines.push('本文件由 `scripts/gen-third-party.mjs` 生成。插件自身许可为 AGPL-3.0（见 LICENSE），上游与修改说明见 NOTICE.md。', '');
  lines.push('## 1. 随包分发的运行时', '');
  if (node) {
    lines.push(`- **Node.js ${node.version}**（win-x64，只带 \`node/node.exe\`）。许可：Node.js 许可（含所含第三方组件的许可声明），官方原文见 \`${node.licensePath}\`。`, '');
  } else {
    lines.push('- Node.js：仅在 Windows 发布包里随附（`node/node.exe`，许可原文 `node/LICENSE`）；开发目录不含。', '');
  }
  lines.push('## 2. npm 运行时依赖', '');
  lines.push(`共 ${deps.length} 个包（运行时依赖及其传递依赖；不含 tsx、esbuild 等开发依赖，它们不进发布包）。`, '');
  lines.push('| 包 | 版本 | 许可 |', '|---|---|---|');
  for (const dep of deps) lines.push(`| ${dep.name} | ${dep.version} | ${cell(dep.license)} |`);
  lines.push('', '## 3. 字体', '');
  lines.push('**本软件使用了 OPPO Sans 字体。** 字体随主题页面一起分发，未改动字体文件，不单独分发。OPPO Sans 的许可原文与来源见 `app/runtime/assets/vendor/fonts/oppo-sans-4.0-license-notice.txt`、`oppo-sans-4.0-source.txt`。', '');
  lines.push('其余字体为 SIL Open Font License 1.1 授权（字体文件内嵌的版权与许可元数据如下，逐个读自字体的 name 表 nameID 0 / 13 / 14），OFL-1.1 全文见 `licenses/OFL-1.1.txt`。', '');
  lines.push(`逐字体版权与许可（${fonts.entries.length} 个文件）：`, '');
  lines.push('| 文件 | 字体 | 版权 | 许可 | 依据 |', '|---|---|---|---|---|');
  for (const item of fonts.entries) lines.push(`| \`${item.file.replace('assets/vendor/fonts/', '')}\` | ${cell(item.fullName || item.family)} | ${cell(item.copyright)} | ${cell(item.license)} | ${item.licenseSource} |`);
  if (fonts.problems.length) {
    lines.push('', '**读不到许可信息的字体（发布前必须处理）：**', '');
    for (const item of fonts.problems) lines.push(`- \`${item.file}\`：${item.reason}`);
  }
  lines.push('', `## 4. 主题内图片与视频（${themeImages.length} 个）`, '');
  lines.push('位于 `app/runtime/src/components/themes/` 下，随各主题一起分发。逐文件清单：', '');
  themeImages.forEach(file => lines.push(`- \`app/runtime/${file}\``));
  lines.push('', `## 5. 社交平台图标（${socialIcons.length} 个）`, '');
  socialIcons.forEach(file => lines.push(`- \`app/runtime/${file}\``));
  lines.push('', '各平台图标的商标归其权利人所有，仅用于标示作者主页链接。', '');
  lines.push(`## 6. Unicorn 场景贴图（${unicornMedia.length} 个）`, '');
  unicornMedia.forEach(file => lines.push(`- \`app/runtime/${file}\``));
  lines.push('');
  return {
    text: lines.join('\n'), deps, fontProblems: fonts.problems, fontCount: fonts.entries.length,
    counts: { themeImages: themeImages.length, socialIcons: socialIcons.length, unicornMedia: unicornMedia.length, fonts: fonts.entries.length },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = name => {
    const i = process.argv.indexOf(name);
    return i >= 0 ? process.argv[i + 1] : undefined;
  };
  const runtimeDir = path.resolve(arg('--runtime') || path.join(PLUG, 'app', 'runtime'));
  const out = path.resolve(arg('--out') || path.join(PLUG, 'THIRD-PARTY.md'));
  try {
    const { text, counts, deps, fontProblems } = generateThirdParty(runtimeDir);
    if (fontProblems.length) {
      console.error(`读不到许可信息的字体（${fontProblems.length} 个）：\n${fontProblems.map(item => `  ${item.file}：${item.reason}`).join('\n')}`);
      process.exit(1);
    }
    fs.writeFileSync(out, text);
    console.log(`已生成 ${out}：${deps.length} 个 npm 包，${JSON.stringify(counts)}`);
  } catch (error) {
    console.error(`生成 THIRD-PARTY.md 失败：${error.message}`);
    process.exit(1);
  }
}
