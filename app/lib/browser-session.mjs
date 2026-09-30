// 无头浏览器会话：本地静态服务（只监听 127.0.0.1）+ playwright-core。
// 在 worker 子进程里跑（超时由父进程杀整棵进程树，浏览器不会变孤儿）。
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { PluginError } from './errors.mjs';
import { importFromRuntime, requireFromRuntime } from './paths.mjs';
import { ensureDir } from './fsutil.mjs';
import { emit } from './protocol.mjs';
import { snapshotProcesses, descendantsOf } from './procs.mjs';

export const SLIDE_SELECTOR = '#deck > .slide';
export const VIEWPORT = { width: 1920, height: 1080 };
export const SETTLE_CAP_MS = 2000;
export const FIXED_WAIT_MS = 1500;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.json': 'application/json',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.gif': 'image/gif', '.ico': 'image/x-icon', '.wasm': 'application/wasm',
};

/**
 * 静态服务：只服务 root 目录内的文件。
 * 用真实路径（realpath）判断：符号链接 / Windows 联接点指到目录外的文件一律 403；
 * 目录前缀相似的兄弟目录（/a/ppt 与 /a/ppt-evil）也拒绝。
 */
export function startStaticServer(root) {
  let realRoot;
  try {
    realRoot = fs.realpathSync(path.resolve(root));
  } catch (error) {
    return Promise.reject(error);
  }
  const inside = file => file === realRoot || file.startsWith(realRoot + path.sep);
  const server = http.createServer((req, res) => {
    const reply = (status, headers, body) => {
      res.writeHead(status, headers);
      res.end(body);
    };
    try {
      const rel = decodeURIComponent((req.url || '/').split('?')[0]);
      const wanted = path.resolve(realRoot, `.${rel === '/' ? '/index.html' : rel}`);
      if (!inside(wanted)) return reply(403);
      fs.realpath(wanted, (realError, real) => {
        if (realError) return reply(realError.code === 'ENOENT' || realError.code === 'ENOTDIR' ? 404 : 500);
        if (!inside(real)) return reply(403);
        fs.readFile(real, (error, data) => {
          if (error) return reply(error.code === 'ENOENT' || error.code === 'EISDIR' ? 404 : 500);
          return reply(200, { 'Content-Type': MIME[path.extname(real).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' }, data);
        });
      });
    } catch {
      reply(400);
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${server.address().port}/` }));
  });
}

/** 浏览器刚启动：把本进程的后代（浏览器进程）报给父进程，父进程强杀 worker 后按这个名单结束它们。 */
function reportBrowserPids() {
  if (!process.env.IMAGO_WORKER_ARGS) return; // 只有 worker 子进程的 stdout 是事件通道
  try {
    const rows = descendantsOf(process.pid, snapshotProcesses());
    if (rows.length) emit({ event: 'pids', pids: rows.map(row => ({ pid: row.pid, command: row.command })) });
  } catch { /* 记录失败不影响任务，父进程还有定期轮询 */ }
}

async function closeQuietly(browser) {
  if (!browser) return;
  await Promise.race([browser.close().catch(() => {}), new Promise(resolve => setTimeout(resolve, 8000))]);
}

/**
 * 起静态服务 + 浏览器，回调拿到 {browser, url, chromium}；无论成败都关浏览器和服务。
 * 浏览器路径由父进程探测后经环境变量 CHROME_PATH 传入（运行时的 launchExportBrowser 读它）。
 */
export async function withDeckBrowser({ deckPptDir, browserPath, tmpBase }, fn) {
  if (!fs.existsSync(path.join(deckPptDir, 'index.html'))) {
    throw new PluginError('BAD_REQUEST', `找不到 ${path.join(deckPptDir, 'index.html')}`);
  }
  if (!browserPath) throw new PluginError('NO_BROWSER', '没有找到 Edge 或 Chrome');
  process.env.CHROME_PATH = browserPath;
  const { chromium } = requireFromRuntime('playwright-core');
  const { launchExportBrowser } = await importFromRuntime('scripts/preview/launch-export-browser.mjs');
  let served;
  try {
    served = await startStaticServer(deckPptDir);
  } catch (error) {
    throw new PluginError('INTERNAL', `启动本地静态服务失败：${error.message}`);
  }
  let browser = null;
  try {
    try {
      browser = await launchExportBrowser(chromium, {
        fallbackTmpDirs: tmpBase ? [path.join(tmpBase, '.browser-tmp')] : [],
        log: message => process.stderr.write(`${message}\n`),
      });
    } catch (error) {
      throw new PluginError('NO_BROWSER', `浏览器启动失败：${String(error.message || error).split('\n')[0]}`, { browserPath });
    }
    reportBrowserPids();
    return await fn({ browser, url: served.url });
  } finally {
    await closeQuietly(browser);
    served.server.close();
  }
}

export async function openDeckPage(browser, url, { deviceScaleFactor = 1 } = {}) {
  const context = await browser.newContext({ viewport: VIEWPORT, ignoreHTTPSErrors: true, deviceScaleFactor });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
  } catch (error) {
    await context.close().catch(() => {});
    throw new PluginError('RENDER_FAILED', `打开 deck 页面失败：${String(error.message || error).split('\n')[0]}`);
  }
  const total = await page.locator(SLIDE_SELECTOR).count();
  if (!total) {
    await context.close().catch(() => {});
    throw new PluginError('RENDER_FAILED', '页面里没有找到幻灯片（#deck > .slide）');
  }
  return { page, context, total };
}

async function activeIndex(page) {
  return page.evaluate(selector => [...document.querySelectorAll(selector)].findIndex(slide => slide.classList.contains('active')), SLIDE_SELECTOR);
}

/**
 * 逐页翻到，对每页执行 visit(index)。
 * 默认用键盘右键（真实观看时的路径，含翻页动画，截图用）；instant:true 时用页面自己的 go(i, {animate:false})
 * （导出引擎也是这样翻页的），不播翻页动画，文字检查用它，省掉每页约 1 秒的动画时间。
 */
export async function walkSlides(page, total, visit, { instant = false } = {}) {
  const results = [];
  for (let i = 0; i < total; i += 1) {
    if (instant && i > 0) {
      const moved = await page.evaluate(index => {
        if (typeof window.go !== 'function') return false;
        window.go(index, { animate: false, force: true });
        const slides = window.__getVisibleSlides?.() || [...document.querySelectorAll('#deck > .slide')];
        window.__ensureRuntimeSlideRendered?.(slides[index]); // 懒渲染的页面：和导出引擎一样先让它渲染出来
        return true;
      }, i);
      if (!moved) await page.keyboard.press('ArrowRight');
    }
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline && (await activeIndex(page)) !== i) await page.waitForTimeout(100);
    const active = await activeIndex(page);
    if (active !== i) throw new PluginError('RENDER_FAILED', `翻页失败：应在第 ${i + 1} 页，当前激活的是第 ${active + 1} 页`);
    results.push(await visit(i));
    if (!instant && i < total - 1) await page.keyboard.press('ArrowRight');
  }
  return results;
}

/**
 * 等页面「静下来」再截图：document.fonts.ready + 当前页动画（WAAPI 与 gsap）全部结束，封顶 capMs。
 * 无限循环的动画（背景光斑等）永远结束不了，不等它们。
 */
export async function waitSettled(page, capMs = SETTLE_CAP_MS) {
  return page.evaluate(async cap => {
    const started = performance.now();
    await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, cap))]);
    const busy = () => {
      const waapi = document.getAnimations().some(animation => {
        if (animation.playState !== 'running' && animation.playState !== 'pending') return false;
        const timing = animation.effect?.getComputedTiming?.();
        return !(timing && (timing.iterations === Infinity || timing.endTime === Infinity));
      });
      let tweens = false;
      const g = window.gsap;
      if (g?.globalTimeline?.getChildren) {
        tweens = g.globalTimeline.getChildren(true, true, true).some(child => {
          try {
            return child.isActive() && child.repeat?.() !== -1 && Number.isFinite(child.totalDuration());
          } catch {
            return false;
          }
        });
      }
      return waapi || tweens;
    };
    let idleRounds = 0;
    while (performance.now() - started < cap && idleRounds < 3) {
      idleRounds = busy() ? 0 : idleRounds + 1;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return Math.round(performance.now() - started);
  }, capMs);
}

export const TEXT_STABLE_MS = 300;
export const TEXT_CAP_MS = 3000;
const TEXT_POLL_MS = 100;

/**
 * 取每页运行时可见文字：[{index, layout, text, waitedMs}]。
 * 等待策略：等字体、等动画结束，再等可见文字稳定（连续读数一致 ≥300ms），每页总上限 3 秒。
 * 到上限仍在变化就取最后一次读数；一直是空的返回空文本（由调用方判空页）。
 */
export async function extractSlideTexts(page, total, onPage, { capMs = TEXT_CAP_MS, stableMs = TEXT_STABLE_MS } = {}) {
  return walkSlides(page, total, async index => {
    const started = Date.now();
    const read = () => page.evaluate(({ selector, i }) => {
      const slide = document.querySelectorAll(selector)[i];
      return { text: slide.innerText.replace(/\s+/g, ' ').trim(), layout: slide.dataset.vmLayout || '' };
    }, { selector: SLIDE_SELECTOR, i: index });
    await waitSettled(page, Math.min(SETTLE_CAP_MS, capMs));
    let current = await read();
    let lastChange = Date.now();
    while (Date.now() - started < capMs) {
      if (current.text.length > 0 && Date.now() - lastChange >= stableMs) break;
      await page.waitForTimeout(TEXT_POLL_MS);
      const next = await read();
      if (next.text !== current.text) lastChange = Date.now();
      current = next;
    }
    onPage?.(index + 1, total);
    return { index, layout: current.layout, text: current.text, waitedMs: Date.now() - started };
  }, { instant: true });
}

/** 读 PNG 头里的宽高（IHDR），不解码整张图。 */
export function pngSize(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const head = Buffer.alloc(24);
    fs.readSync(fd, head, 0, 24, 0);
    return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
  } finally {
    fs.closeSync(fd);
  }
}

export function shotName(index) {
  return `p${String(index + 1).padStart(2, '0')}.png`;
}

export const SHOT_W = 1920;
export const SHOT_H = 1080;

/**
 * 页面在 1920×1080 视口里是「编辑模式」：左侧有缩略图栏、四周有留白，幻灯片只有约 1262×710 CSS 像素。
 * 先量出幻灯片的 CSS 宽度，再用 deviceScaleFactor = 1920/宽度 重新开页面，
 * 让幻灯片元素截出来正好是 1920×1080 像素（按高分辨率重新渲染，不是拉伸）。
 * 返回 { page, context, total, scale }。
 */
export async function openDeckPageForShots(browser, url) {
  const probe = await openDeckPage(browser, url);
  let rect;
  try {
    rect = await probe.page.evaluate(selector => {
      const box = document.querySelector(selector).getBoundingClientRect();
      return { width: box.width, height: box.height };
    }, SLIDE_SELECTOR);
  } finally {
    await probe.context.close().catch(() => {});
  }
  if (!(rect.width > 100)) throw new PluginError('EXPORT_FAILED', `量不到幻灯片尺寸：${JSON.stringify(rect)}`);
  const scale = SHOT_W / rect.width;
  const opened = await openDeckPage(browser, url, { deviceScaleFactor: scale });
  return { ...opened, scale, cssWidth: rect.width, cssHeight: rect.height };
}

/** 逐页截图 1920×1080 → shotsDir/p01.png…。waitStrategy：'adaptive'（默认）或 'fixed1500'（对比用）。 */
export async function captureShots(page, total, shotsDir, { waitStrategy = 'adaptive', onPage, expectFullSize = false } = {}) {
  ensureDir(shotsDir);
  try {
    for (const name of fs.readdirSync(shotsDir)) {
      if (/^p\d+\.png$/.test(name)) fs.rmSync(path.join(shotsDir, name), { force: true }); // 只清自己命名规则的旧截图
    }
  } catch (error) {
    throw new PluginError('IO', `清理截图目录失败：${shotsDir}（${error.message}）`);
  }
  const waits = [];
  const files = await walkSlides(page, total, async index => {
    if (waitStrategy === 'fixed1500') {
      await page.waitForTimeout(FIXED_WAIT_MS);
      waits.push(FIXED_WAIT_MS);
    } else {
      waits.push(await waitSettled(page));
    }
    const file = path.join(shotsDir, shotName(index));
    await page.locator(SLIDE_SELECTOR).nth(index).screenshot({ path: file });
    if (!fs.existsSync(file) || fs.statSync(file).size <= 0) throw new PluginError('EXPORT_FAILED', `截图没有生成：${file}`);
    if (expectFullSize) {
      const size = pngSize(file);
      if (size.width !== SHOT_W || size.height !== SHOT_H) throw new PluginError('EXPORT_FAILED', `截图尺寸应为 ${SHOT_W}×${SHOT_H}，实际 ${size.width}×${size.height}：${file}`);
    }
    onPage?.(index + 1, total);
    return file;
  });
  return { files, waits };
}

/** 仅测试用：IMAGO_TEST_HANG=<任务名> 时在浏览器已启动后永远挂起，用来验证超时会杀掉浏览器进程树。 */
export async function testHang(task, { beforeHang } = {}) {
  if (process.env.IMAGO_TEST_HANG === task) {
    if (beforeHang) beforeHang();
    await new Promise(() => {});
  }
}
