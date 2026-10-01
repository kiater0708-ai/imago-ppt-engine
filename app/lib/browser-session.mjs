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
    if (rows.length) emit({ event: 'pids', pids: rows.map(row => ({ pid: row.pid, command: row.command, start: row.start })) });
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

export async function openDeckPage(browser, url, { deviceScaleFactor = 1, waitUntil = 'networkidle' } = {}) {
  const context = await browser.newContext({ viewport: VIEWPORT, ignoreHTTPSErrors: true, deviceScaleFactor });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil, timeout: 60000 });
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

/** 没有 window.go 时用键盘翻页：回首页用 Home（不认 Home 就连按 ArrowLeft），其余按方向键走差值。 */
async function pressToward(page, from, to) {
  if (to === from) return;
  if (to === 0) {
    await page.keyboard.press('Home');
    if ((await activeIndex(page)) === 0) return;
    from = Math.max(0, await activeIndex(page));
  }
  const key = to > from ? 'ArrowRight' : 'ArrowLeft';
  for (let n = 0; n < Math.min(Math.abs(to - from), 500); n += 1) await page.keyboard.press(key);
}

/**
 * 逐页翻到，对每页执行 visit(index)。
 * 默认用键盘右键（真实观看时的路径，含翻页动画，截图用）；instant:true 时用页面自己的 go(i, {animate:false})
 * （导出引擎也是这样翻页的），不播翻页动画，文字检查用它；页面没有 go 就退回键盘（含往回翻）。
 */
export async function walkSlides(page, total, visit, { instant = false, indexes = null } = {}) {
  const results = [];
  const order = indexes ? [...indexes].sort((x, y) => x - y) : Array.from({ length: total }, (_, k) => k);
  const goInstant = index => page.evaluate(i => {
    if (typeof window.go !== 'function') return false;
    window.go(i, { animate: false, force: true });
    const slides = window.__getVisibleSlides?.() || [...document.querySelectorAll('#deck > .slide')];
    window.__ensureRuntimeSlideRendered?.(slides[i]); // 懒渲染的页面：和导出引擎一样先让它渲染出来
    return true;
  }, index);
  for (const i of order) {
    if (instant) {
      // go() 偶尔会赶上上一次切换还没提交而被覆盖（从末页翻回首页时出现过）：没到位就重发，最多 5 次
      for (let attempt = 0; attempt < 5 && (await activeIndex(page)) !== i; attempt += 1) {
        const before = await activeIndex(page);
        const moved = await goInstant(i);
        if (!moved) await pressToward(page, before, i);
        const settle = Date.now() + 600;
        while (Date.now() < settle && (await activeIndex(page)) !== i) await page.waitForTimeout(50);
      }
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

export const TEXT_CAP_MS = 1500;
export const TEXT_SETTLE_MS = 500; // 兼容旧调用方（审计脚本）的选项名，已不再使用
export const TEXT_REREAD_MS = 300; // 默认稳定窗口（审计脚本等）；残留检查用 RESIDUE_TEXT_OPTIONS
export const ANIMATION_RATE = 10;
const TEXT_POLL_MS = 30;

/** 残留文字检查的取文字参数：稳定窗口 800ms（能等到 setTimeout 之类 700ms 内的延迟挂载），单页上限 1.5 秒，8 个标签页并行。 */
export const RESIDUE_TEXT_OPTIONS = { capMs: 1500, rereadMs: 800 };
export const RESIDUE_TABS = 8;

/**
 * 仅审计脚本使用（scripts/audit）：把动画强行快进到结束状态。会触发业务回调、改变内容，
 * 残留文字检查不再用它（改用 prepareAnimationSpeed 加速）。
 */
export function fastForwardAnimations(page) {
  return page.evaluate(() => {
    const finite = timing => !(timing && (timing.iterations === Infinity || timing.endTime === Infinity));
    for (const animation of document.getAnimations()) {
      try {
        if (finite(animation.effect?.getComputedTiming?.())) animation.finish();
      } catch { /* 个别动画不能 finish（如已取消），跳过 */ }
    }
    const g = window.gsap;
    if (g?.globalTimeline?.getChildren) {
      for (const child of g.globalTimeline.getChildren(true, true, true)) {
        try {
          if (child.repeat?.() === -1 || !Number.isFinite(child.totalDuration())) continue;
          child.progress(1);
        } catch { /* 个别补间不能快进，跳过 */ }
      }
    }
  });
}

/**
 * 加速页面动画（不改变内容，回调照常执行，只是跑得更快）：
 * CDP Animation.setPlaybackRate 调 WAAPI/CSS 动画的播放倍速，gsap 全局时间线 timeScale 调到同样倍数。
 * 失败（非 Chromium、CDP 不可用）只写日志，按原速等（有单页上限兜底）。返回是否生效。
 */
export async function prepareAnimationSpeed(page, rate = ANIMATION_RATE) {
  try {
    const session = await page.context().newCDPSession(page);
    await session.send('Animation.enable');
    await session.send('Animation.setPlaybackRate', { playbackRate: rate });
    return true;
  } catch (error) {
    process.stderr.write(`[浏览器] 设置动画倍速失败，按原速等待：${String(error.message || error).split('\n')[0]}\n`);
    return false;
  }
}

/** gsap 可能在页面里晚一点才加载或被替换：每页都把全局时间线 timeScale 设一遍。 */
function applyGsapRate(page, rate) {
  return page.evaluate(r => {
    try { window.gsap?.globalTimeline?.timeScale?.(r); } catch { /* 没有 gsap 或不支持 */ }
  }, rate).catch(() => {});
}

/** 页面还有没有在跑的东西：有限的 WAAPI 动画、有限且没有无限父级的 gsap 补间、字体加载。 */
function pageBusy(page) {
  return page.evaluate(() => {
    const finite = timing => !(timing && (timing.iterations === Infinity || timing.endTime === Infinity));
    const animations = document.getAnimations().filter(a => (a.playState === 'running' || a.playState === 'pending') && finite(a.effect?.getComputedTiming?.())).length;
    let tweens = 0;
    const g = window.gsap;
    if (g?.globalTimeline?.getChildren) {
      const infiniteAncestor = child => {
        for (let parent = child.parent; parent && parent !== g.globalTimeline; parent = parent.parent) {
          if (parent.repeat?.() === -1 || !Number.isFinite(parent.totalDuration())) return true;
        }
        return false;
      };
      for (const child of g.globalTimeline.getChildren(true, true, true)) {
        try {
          if (child.isActive() && child.repeat?.() !== -1 && Number.isFinite(child.totalDuration()) && !infiniteAncestor(child)) tweens += 1;
        } catch { /* 个别补间读不了状态，当没有 */ }
      }
    }
    const fonts = document.fonts && document.fonts.status === 'loading' ? 1 : 0;
    return animations + tweens + fonts;
  });
}

/**
 * 取每页运行时可见文字：[{index, layout, text, waitedMs}]。
 * 先把动画调成 10 倍速（回调照常执行，不强行快进）；逐页翻到后重新计时：
 * 页面「不忙」（有限动画/补间跑完、没有未触发的短 setTimeout、字体加载完）且可见文字连续两次读数一致、
 * 距上次变化 ≥ rereadMs，就取；否则每 30ms 再读，单页上限 capMs。
 * 上限到了仍在变化就取最后一次读数；一直是空的返回空文本（由调用方判空页）。
 */
export async function extractSlideTexts(page, total, onPage, { capMs = TEXT_CAP_MS, settleMs = TEXT_SETTLE_MS, rereadMs = TEXT_REREAD_MS, indexes = null } = {}) {
  void settleMs;
  await prepareAnimationSpeed(page);
  const read = () => page.evaluate(selector => {
    const slide = document.querySelector(`${selector}.active`) || document.querySelectorAll(selector)[0];
    return { text: slide.innerText.replace(/\s+/g, ' ').trim(), layout: slide.dataset.vmLayout || '' };
  }, SLIDE_SELECTOR);
  return walkSlides(page, total, async index => {
    const started = Date.now(); // 翻页之后才开始计时：每页的挂载、动画都是这次激活重新开始的
    await applyGsapRate(page, ANIMATION_RATE);
    let current = await read();
    let lastChange = Date.now();
    for (;;) {
      const busy = await pageBusy(page).catch(() => 0);
      if (current.text.length > 0 && !busy && Date.now() - lastChange >= rereadMs) break;
      if (Date.now() - started >= capMs) break;
      await page.waitForTimeout(TEXT_POLL_MS);
      const next = await read();
      if (next.text !== current.text) lastChange = Date.now();
      current = next;
    }
    onPage?.(index + 1, total);
    return { index, layout: current.layout, text: current.text, waitedMs: Date.now() - started };
  }, { instant: true, indexes });
}

/**
 * 多个标签页并行取文字：同时打开 min(tabs, expectedTotal) 个标签页（加载时间重叠），
 * 第 k 个标签页负责页号 % count === k 的那些页（每个标签页只往前翻一遍，翻页后各自重新计时），
 * 所以每页都等得起完整的稳定窗口，总耗时 ≈ 窗口 × 页数 / 标签页数。
 * 返回 { texts（按页号排好）, total }；任何一个标签页失败就整体失败，额外开的标签页一律关掉。
 */
export async function extractSlideTextsParallel(browser, url, { expectedTotal, onPage, options = {}, tabs = RESIDUE_TABS }) {
  const count = Math.max(1, Math.min(tabs, expectedTotal || 1));
  const opened = [];
  try {
    const results = await Promise.allSettled(Array.from({ length: count }, () => openDeckPage(browser, url, { waitUntil: 'load' })));
    for (const item of results) if (item.status === 'fulfilled') opened.push(item.value);
    const failed = results.find(item => item.status === 'rejected');
    if (failed) throw failed.reason;
    const total = opened[0].total;
    if (opened.some(item => item.total !== total)) throw new PluginError('RENDER_FAILED', `并行打开的标签页里幻灯片数量不一致：${opened.map(item => item.total).join('、')}`);
    const active = Math.min(count, total);
    let done = 0;
    const tick = () => { done += 1; onPage?.(done, total); };
    const jobs = opened.slice(0, active).map((item, k) => {
      const indexes = Array.from({ length: total }, (_, i) => i).filter(i => i % active === k);
      return extractSlideTexts(item.page, total, tick, { ...options, indexes });
    });
    const parts = await Promise.all(jobs);
    return { texts: parts.flat().sort((x, y) => x.index - y.index), total };
  } finally {
    await Promise.all(opened.map(item => item.context.close().catch(() => {})));
  }
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
