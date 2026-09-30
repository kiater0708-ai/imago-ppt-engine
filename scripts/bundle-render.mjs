#!/usr/bin/env node
// 把 render-goal-deck.jsx 预打包成 runtime/scripts/render-goal-deck.bundle.mjs，运行时不再需要 tsx / esbuild。
// 用法：node scripts/bundle-render.mjs [--out <文件>]   （默认写进开发目录 app/runtime/scripts/）
// 要点：
//   1. platform node、format esm，node 内置模块与 react / react-dom 外部化（它们是运行时依赖，纯 JS）。
//   2. renderDeck.jsx / runtime-build.mjs 顶部 import 了 esbuild（原生二进制）。打包时换成桩：
//      运行时 DASHI_PPT_THEME_RUNTIME=prebuilt，只拷贝预构建的主题 bundle，不会真调用 esbuild。
//   3. 源码里的 import.meta.url / dirname / filename 按「源文件相对 runtime/ 的位置」改写，
//      保证被打进同一个文件后仍指向原来的路径（bundle 固定放在 runtime/scripts/ 下）。
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUG = path.resolve(HERE, '..');
const RUNTIME = path.join(PLUG, 'app', 'runtime');
const ENTRY = path.join(RUNTIME, 'scripts', 'render-goal-deck.jsx');
const DEFAULT_OUT = path.join(RUNTIME, 'scripts', 'render-goal-deck.bundle.mjs');

const ESBUILD_STUB = `
const fail = () => { throw new Error('esbuild 不在插件发布包里：主题运行时必须走预构建（DASHI_PPT_THEME_RUNTIME=prebuilt）'); };
export const buildSync = fail;
export const build = fail;
export default { buildSync, build };
`;

function rewriteImportMeta(source, file) {
  if (!/import\.meta\.(url|dirname|filename)/.test(source)) return source;
  const rel = path.relative(RUNTIME, file).split(path.sep).join('/');
  const relDir = path.posix.dirname(rel);
  return source
    .replace(/import\.meta\.url/g, `new URL(${JSON.stringify(rel)}, __RT_BASE).href`)
    .replace(/import\.meta\.dirname/g, `__rtDir(${JSON.stringify(relDir)})`)
    .replace(/import\.meta\.filename/g, `__fup(new URL(${JSON.stringify(rel)}, __RT_BASE))`);
}

export async function bundleRender({ out = DEFAULT_OUT } = {}) {
  let esbuild;
  try {
    esbuild = createRequire(path.join(RUNTIME, 'package.json'))('esbuild');
  } catch (error) {
    throw new Error(`加载 esbuild 失败：${error.message}（先运行 npm run setup 安装开发依赖）`);
  }
  if (!fs.existsSync(ENTRY)) throw new Error(`找不到渲染脚本源码：${ENTRY}`);

  const plugin = {
    name: 'imago-bundle',
    setup(build) {
      build.onResolve({ filter: /^esbuild$/ }, () => ({ path: 'esbuild', namespace: 'esbuild-stub' }));
      build.onLoad({ filter: /.*/, namespace: 'esbuild-stub' }, () => ({ contents: ESBUILD_STUB, loader: 'js' }));
      build.onLoad({ filter: /\.(mjs|js|jsx)$/, namespace: 'file' }, args => {
        if (args.path.includes(`${path.sep}node_modules${path.sep}`)) return null;
        let source;
        try {
          source = fs.readFileSync(args.path, 'utf8');
        } catch (error) {
          return { errors: [{ text: `读取失败：${args.path}（${error.message}）` }] };
        }
        return { contents: rewriteImportMeta(source, args.path), loader: args.path.endsWith('.jsx') ? 'jsx' : 'js' };
      });
    },
  };

  const tmp = `${out}.tmp-${process.pid}`;
  try {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const result = await esbuild.build({
      entryPoints: [ENTRY],
      outfile: tmp,
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node20',
      absWorkingDir: RUNTIME,
      external: ['react', 'react-dom', 'react-dom/*', 'react/*'],
      banner: {
        js: [
          "import { fileURLToPath as __fup } from 'node:url';",
          "const __RT_BASE = new URL('../', import.meta.url);",
          "const __rtDir = rel => __fup(new URL(rel || '.', __RT_BASE)).replace(/[\\\\/]+$/, '');",
        ].join('\n'),
      },
      plugins: [plugin],
      logLevel: 'silent',
      metafile: true,
    });
    if (result.errors?.length) throw new Error(result.errors.map(item => item.text).join('; '));
    fs.renameSync(tmp, out);
    return { out, bytes: fs.statSync(out).size, inputs: Object.keys(result.metafile.inputs).length };
  } catch (error) {
    try { fs.rmSync(tmp, { force: true }); } catch { /* 临时文件删不掉不影响报错 */ }
    throw new Error(`打包渲染脚本失败：${error.message}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outIndex = process.argv.indexOf('--out');
  const out = outIndex >= 0 ? path.resolve(process.argv[outIndex + 1] || '') : DEFAULT_OUT;
  bundleRender({ out }).then(
    info => console.log(`已生成 ${info.out}（${(info.bytes / 1024).toFixed(0)} KB，${info.inputs} 个源文件）`),
    error => { console.error(error.message); process.exit(1); },
  );
}
