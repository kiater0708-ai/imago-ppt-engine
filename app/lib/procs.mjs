// 进程表快照：用来记录任务的后代进程（浏览器等）。POSIX 用 ps，Windows 用 PowerShell（CIM）。
// 只用于「记住我们启动的进程树里有谁」，在根进程已退出、进程树断开时仍能按 PID 结束它们。
import { execFileSync } from 'node:child_process';

export function parsePsOutput(text) {
  const rows = [];
  for (const line of String(text).split('\n')) {
    const match = /^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(line);
    if (match) rows.push({ pid: Number(match[1]), ppid: Number(match[2]), command: match[3].trim() });
  }
  return rows;
}

export function parseCimJson(text) {
  let data;
  try {
    data = JSON.parse(String(text).replace(/^﻿/, ''));
  } catch {
    return [];
  }
  const list = Array.isArray(data) ? data : [data];
  return list
    .filter(item => item && Number.isInteger(item.ProcessId))
    .map(item => ({ pid: item.ProcessId, ppid: Number(item.ParentProcessId) || 0, command: String(item.CommandLine || item.Name || '') }));
}

/** 当前所有进程 [{pid, ppid, command}]。取不到返回 []（跟踪是尽力而为，不能让任务失败）。 */
export function snapshotProcesses({ platform = process.platform, exec = execFileSync } = {}) {
  try {
    if (platform === 'win32') {
      const script = '[Console]::OutputEncoding=[Text.Encoding]::UTF8; Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress';
      const out = exec('powershell', ['-NoProfile', '-NonInteractive', '-Command', script], { encoding: 'utf8', timeout: 15000, windowsHide: true, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
      return parseCimJson(out);
    }
    const out = exec('ps', ['-Ao', 'pid=,ppid=,command='], { encoding: 'utf8', timeout: 10000, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
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
