// 父进程侧：启动 worker 子进程跑浏览器任务，转发 progress，超时杀整棵进程树，把失败转成对应错误码。
// 每次任务的临时目录（<tmpBase>/.tmp/<随机>）由父进程创建，经 TMPDIR/TMP/TEMP 交给 worker，
// 进程树确认结束后由父进程删除（worker 被强杀也不会留下 Playwright 的 profile / artifacts）。
import path from 'node:path';
import { APP_DIR } from './paths.mjs';
import { PluginError } from './errors.mjs';
import { runProcess } from './proc.mjs';
import { emit } from './protocol.mjs';
import { tail } from './fsutil.mjs';
import { createTaskTmp } from './tasktmp.mjs';
import { registerCleanup } from './cleanup.mjs';

const WORKER = path.join(APP_DIR, 'worker.mjs');
// 这些错误码原样透传（磁盘类连同 errno 一起，走结构化错误通道），其余一律归到调用方指定的 failCode
const PASS_THROUGH = new Set(['NO_BROWSER', 'BAD_REQUEST', 'DISK_FULL', 'IO']);

/** worker 的 error 事件 → PluginError。 */
export function pluginErrorFromWorkerEvent(event, failCode, label, stderrTail) {
  const code = PASS_THROUGH.has(event.code) ? event.code : failCode;
  return new PluginError(code, event.message || `${label}失败`, { ...(event.detail || {}), workerCode: event.code, stderrTail });
}

/**
 * 跑一个 worker 任务。tmpBase：任务临时目录的父目录（请求里的 workDir / deckDir，必须已存在）。
 * cleanupFiles：任务的临时文件（如 PPTX 的 .part），进程树结束后由父进程兜底删除。
 */
export async function runWorker(task, args, { timeoutMs, failCode, label, browserPath, tmpBase, cleanupFiles = [], trackIntervalMs }) {
  let resultEvent = null;
  let errorEvent = null;
  let handle = null;
  const taskTmp = createTaskTmp(tmpBase);
  const unregister = registerCleanup(() => taskTmp.cleanup(cleanupFiles));
  const env = { ...process.env, ...taskTmp.env(), IMAGO_WORKER_ARGS: JSON.stringify({ ...args, tmpBase: taskTmp.dir }) };
  if (browserPath) env.CHROME_PATH = browserPath;
  try {
    const res = await runProcess(process.execPath, [WORKER, task], {
      cwd: APP_DIR,
      timeoutMs,
      env,
      trackTree: true,
      trackIntervalMs,
      onHandle: h => { handle = h; },
      onStdoutLine: line => {
        let event;
        try { event = JSON.parse(line); } catch { return; }
        if (event.event === 'progress') emit(event);
        else if (event.event === 'pids') for (const item of event.pids || []) handle?.track(item.pid, item.command);
        else if (event.event === 'result') resultEvent = event;
        else if (event.event === 'error') errorEvent = event;
      },
    });
    const stderrTail = tail(res.stderr, 1500);
    if (res.timedOut) {
      throw new PluginError(failCode, `${label}超过 ${Math.round(timeoutMs / 1000)} 秒未完成，已终止浏览器和子进程`, { timeout: true, timeoutMs, stderrTail, killedPids: res.killedPids });
    }
    if (res.spawnError) throw new PluginError('INTERNAL', `无法启动 ${label}子进程：${res.spawnError}`);
    if (errorEvent) throw pluginErrorFromWorkerEvent(errorEvent, failCode, label, stderrTail);
    if (res.ok && resultEvent) {
      const { event, ok, ...rest } = resultEvent;
      return rest;
    }
    throw new PluginError(failCode, `${label}子进程异常退出（退出码 ${res.code}${res.signal ? `，信号 ${res.signal}` : ''}）`, { stderrTail });
  } finally {
    // runProcess 返回时进程树已结束（或已强制收尾）：现在清理临时目录与临时文件
    unregister();
    taskTmp.cleanup(cleanupFiles);
  }
}
