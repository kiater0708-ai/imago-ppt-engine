// 插件目录与运行时目录。运行时依赖（playwright-core 等）装在 runtime/node_modules 里。
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PluginError } from './errors.mjs';

export const LIB_DIR = path.dirname(fileURLToPath(import.meta.url));
export const APP_DIR = path.resolve(LIB_DIR, '..');
export const RUNTIME_DIR = path.join(APP_DIR, 'runtime');
export const CURATION_DIR = path.join(APP_DIR, 'curation');
export const SCRIPTS_DIR = path.join(RUNTIME_DIR, 'scripts');

export const RENDER_BUNDLE = path.join(SCRIPTS_DIR, 'render-goal-deck.bundle.mjs');
export const RENDER_SOURCE = path.join(SCRIPTS_DIR, 'render-goal-deck.jsx');

/** 从运行时目录解析并加载 CJS/ESM 依赖（playwright-core、pngjs…）。 */
export function requireFromRuntime(name) {
  try {
    return createRequire(path.join(RUNTIME_DIR, 'package.json'))(name);
  } catch (error) {
    throw new PluginError('INTERNAL', `加载运行时依赖 ${name} 失败：${error.message}（开发环境先运行 npm run setup）`, { dependency: name });
  }
}

export async function importFromRuntime(relative) {
  const file = path.join(RUNTIME_DIR, relative);
  try {
    return await import(pathToFileURL(file).href);
  } catch (error) {
    throw new PluginError('INTERNAL', `加载运行时模块失败：${relative}（${error.message}）`, { file });
  }
}

export function pluginVersion() {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(APP_DIR, 'version.json'), 'utf8'));
    return { version: String(data.version), protocol: Number(data.protocol) || 1 };
  } catch (error) {
    throw new PluginError('INTERNAL', `读取 version.json 失败：${error.message}`);
  }
}
