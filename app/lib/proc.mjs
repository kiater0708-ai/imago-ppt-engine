// 子进程执行：收集输出、超时后结束整棵进程树（含浏览器子进程），并保证一定返回。
// 进程树管理（不引入原生依赖，Windows 作业对象由宿主端兜底）：
//   1. POSIX 用独立进程组（detached）+ kill(-pid)，根进程已退出时组信号仍然有效；
//   2. Windows 用 taskkill /PID <pid> /T /F，检查退出码，失败写 stderr 日志；
//   3. trackTree:true 时定期记录后代进程（PID + 命令行），根进程退出后进程树断开也能按记录的 PID 结束；
//   4. 超时后等待 'close' 有独立上限（graceMs），到期主动 destroy stdio 并返回。
import { spawn, spawnSync } from 'node:child_process';
import { snapshotProcesses, descendantsOf, isAlive } from './procs.mjs';

const MAX_CAPTURE = 4 * 1024 * 1024;
const DEFAULT_GRACE_MS = 5000;

const activeTasks = new Set();

/** 结束以 pid 为根的进程树。返回 { ok, method, detail }。失败写日志（stderr）。 */
export function killProcessTree(pid, { platform = process.platform, spawnSyncFn = spawnSync, log = message => process.stderr.write(`${message}\n`) } = {}) {
  if (!Number.isInteger(pid) || pid <= 0) return { ok: false, method: 'none', detail: `无效的 pid：${pid}` };
  if (platform === 'win32') {
    const res = spawnSyncFn('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true, encoding: 'utf8', timeout: 15000 });
    if (res.error) {
      log(`[进程] taskkill 无法运行（pid ${pid}）：${res.error.message}`);
      return { ok: false, method: 'taskkill', detail: res.error.message };
    }
    // 128 = 进程不存在（已经退出），不算失败
    if (res.status !== 0 && res.status !== 128) {
      const detail = String(res.stderr || res.stdout || '').trim();
      log(`[进程] taskkill /PID ${pid} /T /F 退出码 ${res.status}：${detail}`);
      return { ok: false, method: 'taskkill', detail: `退出码 ${res.status}：${detail}` };
    }
    return { ok: true, method: 'taskkill', detail: '' };
  }
  try {
    process.kill(-pid, 'SIGKILL'); // 进程组：根进程已退出时只要组里还有成员就仍然有效
    return { ok: true, method: 'process-group', detail: '' };
  } catch (error) {
    if (error.code === 'ESRCH') return { ok: true, method: 'process-group', detail: '进程组已不存在' };
    try {
      process.kill(pid, 'SIGKILL');
      return { ok: true, method: 'kill', detail: '' };
    } catch (inner) {
      if (inner.code === 'ESRCH') return { ok: true, method: 'kill', detail: '' };
      log(`[进程] 无法结束 pid ${pid}：${inner.message}`);
      return { ok: false, method: 'kill', detail: inner.message };
    }
  }
}

function killRecorded(tracked, rows, opts) {
  const killed = [];
  const byPid = new Map(rows.map(row => [row.pid, row]));
  for (const [pid, command] of tracked) {
    if (!isAlive(pid)) continue;
    const current = byPid.get(pid);
    // PID 可能被系统复用：命令行对不上就不动它
    if (current && command && current.command !== command) continue;
    if (!current && rows.length) continue;
    const result = killProcessTree(pid, opts);
    if (result.ok) killed.push(pid);
  }
  return killed;
}

/**
 * 跑子进程并收集 stdout/stderr/退出码。不抛异常，由调用方判 ok。一定返回。
 * 选项：timeoutMs、graceMs（超时后/管道未关时的最长等待）、trackTree、trackIntervalMs、onStdoutLine、env、cwd、log。
 * 返回：{ ok, code, signal, spawnError, timedOut, truncated, killedPids, stdout, stderr, durationMs, command }
 */
export function runProcess(command, args, {
  cwd, timeoutMs = 120000, env, onStdoutLine, graceMs = DEFAULT_GRACE_MS, trackTree = false, trackIntervalMs, onPid, onHandle,
  log = message => process.stderr.write(`${message}\n`), snapshot = snapshotProcesses,
} = {}) {
  return new Promise(resolve => {
    const started = Date.now();
    let stdout = '';
    let stderr = '';
    let lineBuf = '';
    let timedOut = false;
    let truncated = false;
    let settled = false;
    let child;
    let timer;
    let graceTimer;
    let tracker;
    let exitInfo = null;
    const tracked = new Map();
    const killedPids = [];
    const commandText = [command, ...args].join(' ');
    const interval = trackIntervalMs || (process.platform === 'win32' ? 2000 : 500);

    const record = () => {
      if (!child || child.pid === undefined) return [];
      const rows = snapshot();
      for (const row of descendantsOf(child.pid, rows)) tracked.set(row.pid, row.command);
      return rows;
    };
    const finish = extra => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(graceTimer);
      clearInterval(tracker);
      activeTasks.delete(task);
      if (onStdoutLine && lineBuf.trim()) {
        try { onStdoutLine(lineBuf); } catch { /* 回调出错不影响收尾 */ }
      }
      resolve({ code: null, signal: null, spawnError: null, ...exitInfo, ...extra, stdout, stderr, timedOut, truncated, killedPids, durationMs: Date.now() - started, command: commandText });
    };
    const destroyPipes = () => {
      try { child.stdout.destroy(); } catch { /* 已关闭 */ }
      try { child.stderr.destroy(); } catch { /* 已关闭 */ }
    };
    /** 结束整棵树 + 记录的后代；到 graceMs 还没 close 就强行收尾。 */
    const killAll = () => {
      let rows = [];
      if (trackTree && child.exitCode === null) rows = record(); // 根进程还在：先补记一次
      killProcessTree(child.pid, { log });
      if (trackTree) {
        if (!rows.length) rows = snapshot();
        killedPids.push(...killRecorded(tracked, rows, { log }));
      }
    };
    const task = { kill: () => { try { killAll(); } catch { /* 尽力而为 */ } } };

    try {
      child = spawn(command, args, { cwd, env: env || process.env, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32', windowsHide: true });
    } catch (error) {
      stderr = `无法启动子进程：${error.message}`;
      finish({ ok: false, spawnError: error.message });
      return;
    }
    activeTasks.add(task);
    if (onPid && child.pid) onPid(child.pid);
    // 外部（worker 主动上报的浏览器进程）也可以加进记录名单
    if (onHandle) onHandle({ track: (pid, cmd) => { if (Number.isInteger(pid) && pid > 0 && pid !== process.pid) tracked.set(pid, cmd || ''); } });
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    timer = setTimeout(() => {
      timedOut = true;
      killAll();
      graceTimer = setTimeout(() => {
        stderr += `\n子进程超过 ${timeoutMs}ms 被终止，${graceMs}ms 内管道仍未关闭，已强制收尾`;
        destroyPipes();
        finish({ ok: false });
      }, graceMs);
    }, timeoutMs);
    if (trackTree) {
      tracker = setInterval(() => { try { record(); } catch { /* 记录失败不影响任务 */ } }, interval);
      tracker.unref?.();
    }

    child.stdout.on('data', text => {
      if (stdout.length < MAX_CAPTURE) stdout += text;
      else truncated = true;
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
    child.stderr.on('data', text => {
      if (stderr.length < MAX_CAPTURE) stderr += text;
      else truncated = true;
    });
    child.on('error', error => {
      stderr += `\n子进程错误：${error.message}`;
      exitInfo = { spawnError: error.message };
      finish({ ok: false });
    });
    // 根进程退出：进程树可能断开，孙进程还占着管道。先清理遗留的后代，再给管道 graceMs 收尾。
    child.on('exit', (code, signal) => {
      exitInfo = { code, signal };
      if (trackTree) {
        try { killAll(); } catch { /* 尽力而为 */ }
      } else if (process.platform !== 'win32') {
        // 没开跟踪时只用进程组兜底：组里还有成员就一并结束（正常情况下组已空，ESRCH 忽略）
        try { process.kill(-child.pid, 'SIGKILL'); } catch { /* 组已空 */ }
      }
      if (!settled && !graceTimer) {
        graceTimer = setTimeout(() => {
          destroyPipes();
          if (timedOut) stderr += `\n子进程超过 ${timeoutMs}ms，已结束进程树`;
          finish({ ok: code === 0 && !timedOut });
        }, graceMs);
      }
    });
    child.on('close', (code, signal) => {
      exitInfo = { code, signal };
      if (timedOut) stderr += `\n子进程超过 ${timeoutMs}ms，已结束进程树`;
      finish({ ok: code === 0 && !timedOut });
    });
  });
}

/** 宿主取消（SIGTERM / SIGINT / SIGHUP）时结束所有仍在跑的子进程树。同步执行，供信号处理器用。 */
export function killAllActive() {
  for (const task of [...activeTasks]) task.kill();
}
