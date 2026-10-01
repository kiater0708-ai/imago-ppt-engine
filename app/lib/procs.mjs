// 进程表快照：用来记录任务的后代进程（浏览器等）。POSIX 用 ps，Windows 用 PowerShell（CIM）。
// 每个进程记 PID、父 PID、启动时间、命令行；结束记录的进程前要核对三者一致（PID 会被系统复用）。
// 快照取不到返回 []，调用方据此不去杀记录的 PID。
import { execFileSync } from 'node:child_process';

const PS_ROW = /^\s*(\d+)\s+(\d+)\s+(\w{3}\s+\w{3}\s+\d+\s+\d\d:\d\d:\d\d\s+\d{4})\s+(.*)$/;

export function parsePsOutput(text) {
  const rows = [];
  for (const line of String(text).split('\n')) {
    const match = PS_ROW.exec(line);
    if (match) rows.push({ pid: Number(match[1]), ppid: Number(match[2]), start: match[3].replace(/\s+/g, ' '), command: match[4].trim() });
  }
  return rows;
}

export function parseCimJson(text) {
  let data;
  try {
    data = JSON.parse(String(text).replace(/^\uFEFF/, ''));
  } catch {
    return [];
  }
  const list = Array.isArray(data) ? data : [data];
  return list
    .filter(item => item && Number.isInteger(item.ProcessId))
    .map(item => ({
      pid: item.ProcessId, ppid: Number(item.ParentProcessId) || 0,
      start: String(item.Start || ''), command: String(item.CommandLine || item.Name || ''),
    }));
}

/**
 * 当前所有进程 [{pid, ppid, start, command}]。取不到返回 []（跟踪是尽力而为，不能让任务失败）。
 * timeoutMs：这次同步调用的上限，调用方把它算进自己的总期限。
 */
export function snapshotProcesses({ platform = process.platform, exec = execFileSync, timeoutMs = 10000 } = {}) {
  try {
    if (platform === 'win32') {
      const script = "[Console]::OutputEncoding=[Text.Encoding]::UTF8; Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,CommandLine,@{n='Start';e={if($_.CreationDate){$_.CreationDate.ToUniversalTime().ToString('o')}}} | ConvertTo-Json -Compress";
      const out = exec('powershell', ['-NoProfile', '-NonInteractive', '-Command', script], { encoding: 'utf8', timeout: timeoutMs, windowsHide: true, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
      return parseCimJson(out);
    }
    const out = exec('ps', ['-Ao', 'pid=,ppid=,lstart=,command='], { encoding: 'utf8', timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'], env: { ...process.env, LC_ALL: 'C' } });
    return parsePsOutput(out);
  } catch {
    return [];
  }
}

/** rows 里 rootPid 的所有后代（不含 root 自己）。 */
export function descendantsOf(rootPid, rows) {
  const children = new Map();
  for (const row of rows) {
    if (!children.has(row.ppid)) children.set(row.ppid, []);
    children.get(row.ppid).push(row);
  }
  const out = [];
  const queue = [rootPid];
  const seen = new Set(queue);
  while (queue.length) {
    for (const child of children.get(queue.shift()) || []) {
      if (seen.has(child.pid)) continue;
      seen.add(child.pid);
      out.push(child);
      queue.push(child.pid);
    }
  }
  return out;
}

export function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === 'EPERM'; // 存在但无权限发信号
  }
}
