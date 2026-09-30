// 子进程执行：收集输出、超时后结束整棵进程树（含浏览器子进程）。
// POSIX 用独立进程组（detached）+ kill(-pid)；Windows 用 taskkill /T /F。
import { spawn, spawnSync } from 'node:child_process';

const MAX_CAPTURE = 4 * 1024 * 1024;

export function killTree(child) {
  if (!child || child.pid === undefined || child.exitCode !== null) return;
  try {
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore', timeout: 10000 });
    } else {
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch {
        child.kill('SIGKILL');
      }
    }
  } catch {
    try { child.kill('SIGKILL'); } catch { /* 进程已不在 */ }
  }
}

/**
 * 跑子进程并收集 stdout/stderr/退出码。不抛异常，由调用方判 ok。
 * 超时：先杀整棵进程树，再返回 timedOut:true。
 * onStdoutLine(line)：逐行回调（worker 事件用）。
 */
export function runProcess(command, args, { cwd, timeoutMs = 120000, env, onStdoutLine } = {}) {
  return new Promise(resolve => {
    const started = Date.now();
    let stdout = '';
    let stderr = '';
    let lineBuf = '';
    let timedOut = false;
    let settled = false;
    let child;
    let timer;
    const commandText = [command, ...args].join(' ');
    const finish = result => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (onStdoutLine && lineBuf.trim()) {
        try { onStdoutLine(lineBuf); } catch { /* 回调出错不影响收尾 */ }
      }
      resolve({ code: null, signal: null, spawnError: null, ...result, stdout, stderr, timedOut, durationMs: Date.now() - started, command: commandText });
    };
    try {
      child = spawn(command, args, {
        cwd,
        env: env || process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: process.platform !== 'win32',
        windowsHide: true,
      });
    } catch (error) {
      stderr = `无法启动子进程：${error.message}`;
      finish({ ok: false, spawnError: error.message });
      return;
    }
    timer = setTimeout(() => {
      timedOut = true;
      killTree(child);
    }, timeoutMs);
    child.stdout.on('data', chunk => {
      const text = chunk.toString();
      if (stdout.length < MAX_CAPTURE) stdout += text;
      if (onStdoutLine) {
        lineBuf += text;
        let index;
        while ((index = lineBuf.indexOf('\n')) >= 0) {
          const line = lineBuf.slice(0, index);
          lineBuf = lineBuf.slice(index + 1);
          if (line.trim()) {
            try { onStdoutLine(line); } catch { /* 回调出错不影响子进程 */ }
          }
        }
      }
    });
    child.stderr.on('data', chunk => {
      if (stderr.length < MAX_CAPTURE) stderr += chunk.toString();
    });
    child.on('error', error => {
      stderr += `\n子进程错误：${error.message}`;
      finish({ ok: false, spawnError: error.message });
    });
    child.on('close', (code, signal) => {
      if (timedOut) stderr += `\n子进程超过 ${timeoutMs}ms，已结束进程树`;
      finish({ ok: code === 0 && !timedOut, code, signal });
    });
  });
}
