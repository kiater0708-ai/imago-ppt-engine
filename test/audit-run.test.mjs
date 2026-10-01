// 审计脚本的端到端：真实渲染 + 真实浏览器（没有浏览器就跳过）。只审计少数版式，不写版式清单。
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { tmpDir, PLUG } from './helpers.mjs';
import { detectBrowser } from '../app/lib/browser-detect.mjs';
import { parseArgs } from '../scripts/audit-layouts.mjs';

const root = tmpDir('imago-audit-');
after(() => fs.rmSync(root, { recursive: true, force: true }));
const SCRIPT = path.join(PLUG, 'scripts', 'audit-layouts.mjs');
const browser = await detectBrowser();

function runAudit(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SCRIPT, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('审计超过 8 分钟')); }, 480000);
    child.on('error', reject);
    child.on('close', status => {
      clearTimeout(timer);
      resolve({ status, stdout, stderr });
    });
  });
}

test('parseArgs：参数校验', () => {
  assert.deepEqual(parseArgs(['--theme', 'theme11']).themes, ['theme11']);
  assert.deepEqual(parseArgs(['--theme', 'theme01,theme02']).themes, ['theme01', 'theme02']);
  assert.equal(parseArgs(['--all']).all, true);
  assert.equal(parseArgs(['--all', '--no-controls']).controls, false);
  assert.throws(() => parseArgs([]), /--theme/);
  assert.throws(() => parseArgs(['--all', '--theme', 'theme01']), /不能同时/);
  assert.throws(() => parseArgs(['--theme', 'abc']), /格式不对/);
  assert.throws(() => parseArgs(['--theme']), /缺少取值/);
  assert.throws(() => parseArgs(['--theme', 'theme01', '--concurrency', '9']), /1–4/);
  assert.throws(() => parseArgs(['--theme', 'theme01', '--bogus']), /不认识/);
});

test('audit：theme11 page008 → hardcoded（证据含 IGNIS 燃点），page007 干净；不写清单；总览图与报告生成', { skip: !browser.found && '没有浏览器' }, async () => {
  const out = path.join(root, 'out11');
  const curationFile = path.join(PLUG, 'app', 'curation', 'theme11.json');
  const before = fs.readFileSync(curationFile, 'utf8');
  const res = await runAudit(['--theme', 'theme11', '--only', 'theme11_page008,theme11_page007,theme11_page001', '--out', out]);
  assert.equal(res.status, 0, res.stderr.slice(-800));
  assert.equal(fs.readFileSync(curationFile, 'utf8'), before, '带 --only 不能改版式清单');
  const report = JSON.parse(fs.readFileSync(path.join(out, 'theme11', 'report.json'), 'utf8'));
  const p8 = report.layouts.theme11_page008;
  assert.equal(p8.status, 'ok');
  assert.ok(p8.categories.includes('hardcoded'));
  assert.ok(p8.evidence.hardcoded.some(text => /IGNIS|燃点/.test(text)), JSON.stringify(p8.evidence));
  assert.deepEqual(report.layouts.theme11_page007.categories, []);
  assert.equal(report.counts.audited, 3);
  assert.ok(fs.existsSync(path.join(out, 'theme11', 'report.md')));
  assert.ok(fs.statSync(path.join(out, 'theme11', 'sheet-01.jpg')).size > 1000);
  assert.ok(fs.existsSync(path.join(out, 'README.md')));
  assert.ok(!fs.existsSync(path.join(out, 'theme11', '.shots')), '临时截图目录要清掉');
  assert.ok(!fs.existsSync(path.join(out, '.work')), '工作目录要清掉');
  const last = JSON.parse(res.stdout.trim().split('\n').pop());
  assert.equal(last.failed, 0);
});

test('audit：theme08 page082 → media', { skip: !browser.found && '没有浏览器' }, async () => {
  const out = path.join(root, 'out08');
  const res = await runAudit(['--theme', 'theme08', '--only', 'theme08_page082', '--no-controls', '--out', out]);
  assert.equal(res.status, 0, res.stderr.slice(-800));
  const report = JSON.parse(fs.readFileSync(path.join(out, 'theme08', 'report.json'), 'utf8'));
  const entry = report.layouts.theme08_page082;
  assert.ok(entry.categories.includes('media'), JSON.stringify(entry));
  assert.ok(entry.evidence.media.some(text => /图片数量/.test(text)), JSON.stringify(entry.evidence));
});

test('audit：select 控件——surface 只改配色，几何不变 → 可随机', { skip: !browser.found && '没有浏览器' }, async () => {
  const out = path.join(root, 'outctl');
  const res = await runAudit(['--theme', 'theme11', '--only', 'theme11_page001,theme11_page037', '--out', out]);
  assert.equal(res.status, 0, res.stderr.slice(-800));
  const report = JSON.parse(fs.readFileSync(path.join(out, 'theme11', 'report.json'), 'utf8'));
  const surface = report.layouts.theme11_page001.controls.find(item => item.key === 'surface');
  assert.ok(surface && surface.safe, JSON.stringify(report.layouts.theme11_page001.controls));
  const align = report.layouts.theme11_page037.controls.find(item => item.key === 'align');
  assert.ok(align && !align.safe, '页面 37 的 align 会改版式位置');
});

test('audit：不认识的主题 / 缺参数 → 非零退出', async () => {
  const res = await runAudit(['--theme', 'theme99', '--out', path.join(root, 'bad')]);
  assert.notEqual(res.status, 0);
  const none = await runAudit([]);
  assert.equal(none.status, 2);
});
