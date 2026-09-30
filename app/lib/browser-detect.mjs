// 浏览器探测。顺序：IMAGO_PPT_BROWSER → 注册表里的 Edge（仅 Windows）→ 运行时 chrome-path.mjs 的候选 → Chrome 常见位置
// → （仅非 Windows 开发机）playwright 缓存里的 headless shell。找不到返回 found:false，由调用方报 NO_BROWSER。
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { importFromRuntime } from './paths.mjs';

export const APP_PATHS_KEY = 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\msedge.exe';

export function browserKind(file) {
  const base = String(file || '').split(/[\\/]/).pop().toLowerCase(); // 不依赖当前平台的分隔符
  if (base.includes('msedge') || base.includes('microsoft edge')) return 'edge';
  if (base === 'chrome.exe' || base === 'google chrome' || base.includes('google-chrome') || base === 'chrome') return 'chrome';
  return 'chromium';
}

function isFile(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

/** 解析 `reg query ... /ve` 的输出，取默认值。失败或没有返回 ''。
 * /ve 只输出默认值这一行；中文 Windows 上 reg 按 GBK 输出，「(默认)」按 UTF-8 解码会成乱码，所以不认值名，取第一条 REG_SZ 行。 */
export function parseRegDefault(output) {
  for (const line of String(output).split(/\r?\n/)) {
    const match = /^\s+\S.*?\s+REG_(?:EXPAND_)?SZ\s+(.+?)\s*$/i.exec(line);
    if (match) return match[1].replace(/^"(.*)"$/, '$1');
  }
  return '';
}

function defaultRegQuery(hive, extra = []) {
  try {
    const output = execFileSync('reg', ['query', `${hive}\\${APP_PATHS_KEY}`, '/ve', ...extra], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000, windowsHide: true,
    });
    return parseRegDefault(output);
  } catch {
    return ''; // 键不存在或 reg 不可用：跳过
  }
}

export async function detectBrowser({ env = process.env, platform = process.platform, regQuery = defaultRegQuery, exists = isFile } = {}) {
  const tried = [];
  // IMAGO_TEST_NO_BROWSER=1 仅测试用：模拟「本机没有任何浏览器」
  if (env.IMAGO_TEST_NO_BROWSER === '1') return { found: false, path: null, kind: null, source: null, tried };
  const accept = (file, source) => {
    tried.push({ source, path: file || null, exists: Boolean(file) && exists(file) });
    return file && exists(file) ? { found: true, path: file, kind: browserKind(file), source, tried } : null;
  };

  if (env.IMAGO_PPT_BROWSER) {
    const hit = accept(env.IMAGO_PPT_BROWSER, 'IMAGO_PPT_BROWSER');
    if (hit) return hit;
  }

  if (platform === 'win32') {
    for (const [hive, extra] of [['HKLM', []], ['HKLM', ['/reg:32']], ['HKCU', []]]) {
      const hit = accept(regQuery(hive, extra), `registry:${hive}${extra.length ? extra[0] : ''}`);
      if (hit) return hit;
    }
  }

  let chromePath = null;
  try {
    chromePath = await importFromRuntime('scripts/chrome-path.mjs');
  } catch (error) {
    tried.push({ source: 'chrome-path.mjs', path: null, exists: false, error: error.message });
  }
  if (chromePath) {
    let candidate = '';
    try {
      // 探测期间不让运行时脚本再读 CHROME_PATH（已在上面处理过 IMAGO_PPT_BROWSER）
      const saved = process.env.CHROME_PATH;
      delete process.env.CHROME_PATH;
      try { candidate = chromePath.resolveChromeExecutablePath(); } finally { if (saved !== undefined) process.env.CHROME_PATH = saved; }
    } catch (error) {
      tried.push({ source: 'chrome-path.mjs', path: null, exists: false, error: error.message });
    }
    if (candidate) {
      const hit = accept(candidate, 'chrome-path.mjs');
      if (hit) return hit;
    }
    if (platform !== 'win32') {
      let shell = '';
      try { shell = chromePath.resolveHeadlessShellPath(); } catch { shell = ''; }
      if (shell) {
        const hit = accept(shell, 'playwright-headless-shell');
        if (hit) return hit;
      }
    }
  }
  return { found: false, path: null, kind: null, source: null, tried };
}

/** 让运行时的 getExportBrowserPath()（读 CHROME_PATH）和子进程都用探测到的浏览器。 */
export function applyBrowserToEnv(browser, env = process.env) {
  if (browser?.found) env.CHROME_PATH = browser.path;
  return env;
}
