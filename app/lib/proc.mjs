// 子进程执行：收集输出、超时后结束整棵进程树（含浏览器子进程），并保证一定返回。
// 进程树管理（不引入原生依赖，Windows 作业对象由宿主端兜底）：
//   1. POSIX 用独立进程组（detached）+ kill(-pid)；组信号 ESRCH（组长已退出）时改按单 PID 终止；
//   2. Windows 用 taskkill /PID <pid> /T /F，检查退出码，失败写 stderr 日志；
//   3. trackTree:true 时记录后代进程（PID + 启动时间 + 命令行；开头几次轮询更密，之后按间隔），
//      根进程退出、进程树断开后，按记录结束它们——结束前重新取快照，PID、启动时间、命令行三者一致才杀；
//      快照取不到（返回空）时不杀记录的 PID，只杀自己持有句柄的子进程；
//   4. 终止与扫描的总耗时受 graceMs 约束：每次同步调用设短超时并计入总期限，超期就不再继续；
//   5. 超时后等待 'close' 有独立上限（graceMs），到期主动 destroy stdio 并返回；
//   6. 返回 survivors：终止后仍存活的记录进程（调用方据此决定能不能删它们用的临时目录）。
import { spawn, spawnSync } from 'node:child_process';
import { snapshotProcesses, descendantsOf, isAlive } from './procs.mjs';

const MAX_CAPTURE = 4 * 1024 * 1024;
const DEFAULT_GRACE_MS = 5000;
const RAMP_MS = [50, 100, 200, 400]; // 启动后前几次轮询的间隔：根进程很快退出时也来得及记下后代

/** 结束以 pid 为根的进程树。返回 { ok, method, detail }。失败写日志（stderr）。 */
export function killProcessTree(pid, {
  platform = process.platform, spawnSyncFn = spawnSync, killFn = process.kill.bind(process), timeoutMs = 15000,
  log = message => process.stderr.write(`${message}\n`),
} = {}) {
  if (!Number.isInteger(pid) || pid <= 0) return { ok: false, method: 'none', detail: `无效的 pid：${pid}` };
  if (platform === 'win32') {
    const res = spawnSyncFn('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true, encoding: 'utf8', timeout: Math.max(500, timeoutMs) });
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
    killFn(-pid, 'SIGKILL'); // 进程组：组长已退出时只要组里还有成员就仍然有效
    return { ok: true, method: 'process-group', detail: '' };
  } catch (error) {
    // 不是组长（或组已空）：组信号 ESRCH 不代表目标进程不在，改按单 PID 终止
    if (error.code !== 'ESRCH' && error.code !== 'EPERM') {
      log(`[进程] 进程组信号失败（pid ${pid}）：${error.message}`);
    }
  }
  try {
    killFn(pid, 'SIGKILL');
    return { ok: true, method: 'kill', detail: '' };
  } catch (inner) {
    if (inner.code === 'ESRCH') return { ok: true, method: 'kill', detail: '进程已不存在' };
    log(`[进程] 无法结束 pid ${pid}：${inner.message}`);
    return { ok: false, method: 'kill', detail: inner.message };
  }
}

const activeTasks = new Set();

/**
 * 跑子进程并收集 stdout/stderr/退出码。不抛异常，由调用方判 ok。一定返回。
 * 选项：timeoutMs、graceMs、trackTree、trackIntervalMs、onStdoutLine、onHandle、env、cwd、log、
 *       snapshot（进程快照函数，可注入）、kill（终止函数，可注入）。
 * 返回：{ ok, code, signal, spawnError, timedOut, truncated, killedPids, survivors, stdout, stderr, durationMs, command }
 */
export function runProcess(command, args, {
  cwd, timeoutMs = 120000, env, onStdoutLine, graceMs = DEFAULT_GRACE_MS, trackTree = false, trackIntervalMs, onPid, onHandle,
  log = message => process.stderr.write(`${message}\n`), snapshot = snapshotProcesses, kill = killProcessTree,
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
    let trackTimer;
    let rampStep = 0;
    let exitInfo = null;
    const tracked = new Map(); // pid → { command, start }
    const killedPids = [];
    const commandText = [command, ...args].join(' ');
    const interval = trackIntervalMs || (process.platform === 'win32' ? 2000 : 500);

    const snap = timeoutMs => snapshot({ timeoutMs: Math.max(300, Math.min(10000, timeoutMs)) });
    const record = (rows = snap(3000)) => {
      if (!child || child.pid === undefined) return rows;
      for (const row of descendantsOf(child.pid, rows)) tracked.set(row.pid, { command: row.command, start: row.start || '' });
      return rows;
    };
    const survivorsNow = () => {
      const list = [];
      for (const pid of tracked.keys()) if (isAlive(pid)) list.push(pid);
      if (child?.pid && child.exitCode === null && child.signalCode === null && isAlive(child.pid)) list.unshift(child.pid);
      return list;
    };
    /** 刚发完 SIGKILL，进程可能还没被回收（kill(pid,0) 仍成功）：最多再等 800ms、每 50ms 看一次，仍在的才算存活。 */
    const confirmGone = () => {
      let list = survivorsNow();
      for (let waited = 0; list.length && waited < 800; waited += 50) {
        try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50); } catch { break; }
        list = survivorsNow();
      }
      return list;
    };
    const finish = extra => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(graceTimer);
      clearTimeout(trackTimer);
      activeTasks.delete(task);
      if (onStdoutLine && lineBuf.trim()) {
        try { onStdoutLine(lineBuf); } catch { /* 回调出错不影响收尾 */ }
      }
      const survivors = trackTree ? confirmGone() : [];
      resolve({ code: null, signal: null, spawnError: null, ...exitInfo, ...extra, stdout, stderr, timedOut, truncated, killedPids, survivors, durationMs: Date.now() - started, command: commandText });
    };
    const destroyPipes = () => {
      try { child.stdout.destroy(); } catch { /* 已关闭 */ }
      try { child.stderr.destroy(); } catch { /* 已关闭 */ }
    };

    /**
     * 结束整棵树 + 记录的后代，总耗时 ≤ graceMs：
     *  - 根进程：进程组 / taskkill（自己持有句柄的子进程，不需要核对身份）；
     *  - 记录的 PID：重新取快照，PID+启动时间+命令行三者一致才杀；快照为空则不杀。
     */
    let killedOnce = false;
    const killAll = () => {
      if (killedOnce || settled) return; // 超时那次已经杀过、或已经收尾：不再重复扫描（慢快照会白白阻塞事件循环）
      killedOnce = true;
      const deadline = Date.now() + graceMs;
      const remaining = () => Math.max(0, deadline - Date.now());
      if (trackTree && child.exitCode === null && remaining() > 0) record(snap(remaining())); // 根进程还在：先补记一次
      kill(child.pid, { log, timeoutMs: Math.min(5000, Math.max(500, remaining())) });
      if (!trackTree || tracked.size === 0) return;
      if (remaining() <= 0) {
        log(`[进程] 已超过 ${graceMs}ms 终止期限，不再扫描记录的后代进程`);
        return;
      }
      const rows = snap(remaining());
      if (!rows.length) {
        log('[进程] 进程快照取不到，不杀记录的 PID（只杀了自己持有句柄的子进程）');
        return;
      }
      const byPid = new Map(rows.map(row => [row.pid, row]));
      for (const [pid, entry] of tracked) {
        if (remaining() <= 0) {
          log(`[进程] 已超过 ${graceMs}ms 终止期限，停止逐个结束记录的后代进程`);
          break;
        }
        if (!isAlive(pid)) continue;
        const current = byPid.get(pid);
        // 身份核对：PID 可能已被复用。三者一致才杀；启动时间没记到的也不杀
        if (!current || !entry.start || current.start !== entry.start || current.command !== entry.command) continue;
        const result = kill(pid, { log, timeoutMs: Math.min(5000, Math.max(500, remaining())) });
        if (result.ok) killedPids.push(pid);
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
    if (onHandle) {
      onHandle({
        track: (pid, info) => {
          if (!Number.isInteger(pid) || pid <= 0 || pid === process.pid) return;
          const entry = typeof info === 'string' ? { command: info, start: '' } : { command: info?.command || '', start: info?.start || '' };
          tracked.set(pid, entry);
        },
      });
    }
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    timer = setTimeout(() => {
      timedOut = true;
      // 先挂收尾定时器，再做（同步、有总期限的）终止：killAll 里每次同步调用都带短超时
      graceTimer = setTimeout(() => {
        stderr += `\n子进程超过 ${timeoutMs}ms 被终止，${graceMs}ms 内管道仍未关闭，已强制收尾`;
        destroyPipes();
        finish({ ok: false });
      }, graceMs);
      killAll();
    }, timeoutMs);
    if (trackTree) {
      const schedule = () => {
        // 调用方显式给了 trackIntervalMs 就按它固定间隔；否则开头几次更密，之后按默认间隔
        const delay = trackIntervalMs ? trackIntervalMs : (rampStep < RAMP_MS.length ? RAMP_MS[rampStep] : interval);
        rampStep += 1;
        trackTimer = setTimeout(() => {
          try { record(); } catch { /* 记录失败不影响任务 */ }
          if (!settled) schedule();
        }, delay);
        trackTimer.unref?.();
      };
      schedule();
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
      if (!settled && !graceTimer) {
        graceTimer = setTimeout(() => {
          destroyPipes();
          if (timedOut) stderr += `\n子进程超过 ${timeoutMs}ms，已结束进程树`;
          finish({ ok: code === 0 && !timedOut });
        }, graceMs);
      }
      if (trackTree) {
        try { killAll(); } catch { /* 尽力而为 */ }
      } else if (process.platform !== 'win32') {
        // 没开跟踪时只用进程组兜底：组里还有成员就一并结束（正常情况下组已空，ESRCH 忽略）
        try { process.kill(-child.pid, 'SIGKILL'); } catch { /* 组已空 */ }
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
