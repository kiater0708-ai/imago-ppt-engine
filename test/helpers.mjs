// 测试公共工具：跑 CLI、读 JSON 行、临时目录。
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
export const PLUG = path.resolve(TEST_DIR, '..');
export const CLI = path.join(PLUG, 'app', 'cli.mjs');
export const FIXTURES = path.join(TEST_DIR, 'fixtures');

export function tmpDir(prefix = 'imago-ppt-test-') {
  return fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), prefix));
}

export function writeRequest(dir, request, name = 'request.json') {
  const file = path.join(dir, name);
  fs.writeFileSync(file, JSON.stringify(request));
  return file;
}

/** 跑 CLI。返回 { status, events, last, stdout, stderr, nonJsonLines }。 */
export function runCli(command, { request, requestFile, env, timeoutMs = 600000 } = {}) {
  return new Promise((resolve, reject) => {
    const dir = tmpDir('imago-req-');
    const args = [CLI];
    if (command) args.push(command);
    if (request !== undefined) args.push('--request', writeRequest(dir, request));
    else if (requestFile) args.push('--request', requestFile);
    const child = spawn(process.execPath, args, { env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error(`CLI 超过 ${timeoutMs}ms`)); }, timeoutMs);
    child.on('error', reject);
    child.on('close', status => {
      clearTimeout(timer);
      fs.rmSync(dir, { recursive: true, force: true });
      const events = [];
      const nonJsonLines = [];
      for (const line of stdout.split('\n').filter(Boolean)) {
        try { events.push(JSON.parse(line)); } catch { nonJsonLines.push(line); }
      }
      resolve({ status, events, last: events[events.length - 1], stdout, stderr, nonJsonLines });
    });
  });
}

export function fixture(name) {
  return path.join(FIXTURES, `${name}.goal.json`);
}

export function readJsonFile(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
