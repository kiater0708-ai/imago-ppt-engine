// 版面检测校准：对一批已有产物（每个目录里有 goal.json）逐份跑真实的 check 命令，
// 统计 TEXT_OVERFLOW / TEXT_OVERLAP / DUP_TEXT 每种 code 命中的页；同时把每页的版面探测原始数据落盘，
// 之后改阈值不用重新开浏览器（--offline 只读落盘的数据重新判）。
//   node scripts/calibrate-layout.mjs --out <工作目录> --src <产物根目录>[,<产物根目录>…] [--only 名字,名字] [--offline]
// 工作目录必须在产物目录之外（check 的 workDir 放这里，产物目录只读）。输出 <out>/calibration.json 与终端汇总。
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { analyzeSlideLayout, LAYOUT_CODES } from '../app/lib/layout-check.mjs';
import { readJson, writeJsonAtomic, ensureDir } from '../app/lib/fsutil.mjs';
import { withDeckBrowser, extractSlideTextsParallel, RESIDUE_TEXT_OPTIONS, SLIDE_SELECTOR } from '../app/lib/browser-session.mjs';
import { readLayoutProbe, PROBE_MAX_ITEMS } from '../app/lib/layout-probe.mjs';
import { detectBrowser } from '../app/lib/browser-detect.mjs';

const CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'app', 'cli.mjs');

function parseArgs(argv) {
  const args = { out: null, src: [], only: null, offline: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = () => {
      if (i + 1 >= argv.length) throw new Error(`${arg} 缺少参数`);
      i += 1;
      return argv[i];
    };
    if (arg === '--out') args.out = path.resolve(value());
    else if (arg === '--src') args.src.push(...value().split(',').map(item => path.resolve(item)).filter(Boolean));
    else if (arg === '--only') args.only = new Set(value().split(',').map(item => item.trim()).filter(Boolean));
    else if (arg === '--offline') args.offline = true;
    else throw new Error(`不认识的参数：${arg}`);
  }
  if (!args.out) throw new Error('要指定 --out <工作目录>');
  if (!args.src.length) throw new Error('要指定 --src <产物根目录>');
  return args;
}

/** 列出产物根目录下含 goal.json 的子目录。目录读不出来直接抛错，不当作「没有产物」。 */
function listDecks(srcRoots) {
  const decks = [];
  for (const root of srcRoots) {
    let names;
    try {
      names = fs.readdirSync(root).sort();
    } catch (error) {
      throw new Error(`读产物目录失败：${root}（${error.message}）`);
    }
    for (const name of names) {
      const goal = path.join(root, name, 'goal.json');
      if (fs.existsSync(goal)) decks.push({ name, goal });
    }
  }
  return decks;
}

function runCheck(goal, workDir) {
  return new Promise((resolve, reject) => {
    const requestFile = `${workDir}.request.json`;
    try {
      writeJsonAtomic(requestFile, { protocol: 1, goal, workDir });
    } catch (error) {
      reject(new Error(`写请求文件失败：${error.message}`));
      return;
    }
    const child = spawn(process.execPath, [CLI, 'check', '--request', requestFile], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('check 超过 5 分钟')); }, 300000);
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', status => {
      clearTimeout(timer);
      const events = stdout.split('\n').filter(Boolean).map(line => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);
      const last = events[events.length - 1];
      if (!last) reject(new Error(`check 没有输出（退出码 ${status}）：${stderr.slice(-300)}`));
      else resolve({ status, last });
    });
  });
}

async function dumpProbes(workDir, goal) {
  const browser = await detectBrowser();
  if (!browser.found) throw new Error('没有找到浏览器');
  return withDeckBrowser({ deckPptDir: path.join(workDir, 'ppt'), browserPath: browser.path, tmpBase: workDir }, async ({ browser: b, url }) => {
    const { texts } = await extractSlideTextsParallel(b, url, {
      expectedTotal: goal.slides.length,
      options: { ...RESIDUE_TEXT_OPTIONS, onStable: page => page.evaluate(readLayoutProbe, { selector: SLIDE_SELECTOR, maxItems: PROBE_MAX_ITEMS }) },
    });
    return texts.map(item => ({ index: item.index, layout: item.layout, probe: item.probe }));
  });
}

function analyzeDeck(goal, probes) {
  const issues = [];
  goal.slides.forEach((slide, index) => {
    const entry = probes[index];
    if (!entry || !entry.probe) return;
    issues.push(...analyzeSlideLayout({ index, layout: slide.layout, probe: entry.probe, props: slide.props || {} }));
  });
  return issues;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const decks = listDecks(args.src).filter(deck => !args.only || args.only.has(deck.name));
  if (!decks.length) throw new Error('没有找到要校准的产物');
  for (const deck of decks) {
    for (const root of args.src) if (args.out === root || args.out.startsWith(root + path.sep)) throw new Error('--out 不能放在产物目录里');
  }
  ensureDir(path.join(args.out, 'work'));
  ensureDir(path.join(args.out, 'probes'));
  const resultFile = path.join(args.out, 'calibration.json');
  const results = fs.existsSync(resultFile) ? readJson(resultFile) : {};
  for (const deck of decks) {
    const workDir = path.join(args.out, 'work', deck.name);
    const probeFile = path.join(args.out, 'probes', `${deck.name}.json`);
    const record = { name: deck.name, goal: deck.goal };
    try {
      if (!args.offline) {
        const { status, last } = await runCheck(deck.goal, workDir);
        if (last.event !== 'result') throw new Error(`check 失败：${last.code || ''} ${last.message || ''}（退出码 ${status}）`);
        record.rendered = last.rendered;
        record.slideCount = last.slideCount ?? null;
        record.checkIssues = last.issues.map(({ index, layout, field, code, fixable, message }) => ({ index, layout, field, code, fixable, message }));
        if (last.rendered) writeJsonAtomic(probeFile, await dumpProbes(workDir, readJson(path.join(workDir, 'goal.json'))));
      } else if (!fs.existsSync(probeFile)) {
        throw new Error(`没有落盘的探测数据：${probeFile}（先不带 --offline 跑一遍）`);
      }
      if (fs.existsSync(probeFile)) {
        const goal = readJson(path.join(workDir, 'goal.json'));
        record.layoutIssues = analyzeDeck(goal, readJson(probeFile));
        record.rendered = record.rendered ?? true;
      }
    } catch (error) {
      record.error = String(error.message || error).split('\n')[0];
    }
    results[deck.name] = { ...(results[deck.name] || {}), ...record };
    writeJsonAtomic(resultFile, results);
    const counts = Object.fromEntries(LAYOUT_CODES.map(code => [code, (record.layoutIssues || []).filter(issue => issue.code === code).length]));
    console.log(`${deck.name}\t${record.error ? `失败：${record.error}` : `rendered=${record.rendered} ${JSON.stringify(counts)}`}`);
  }
}

main().catch(error => {
  console.error(`校准失败：${error.message}`);
  process.exit(1);
});
