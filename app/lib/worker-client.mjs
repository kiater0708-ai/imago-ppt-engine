// 父进程侧：启动 worker 子进程跑浏览器任务，转发 progress，超时杀整棵进程树，把失败转成对应错误码。
import path from 'node:path';
import { APP_DIR } from './paths.mjs';
import { PluginError } from './errors.mjs';
import { runProcess } from './proc.mjs';
import { emit } from './protocol.mjs';
import { tail } from './fsutil.mjs';

const WORKER = path.join(APP_DIR, 'worker.mjs');
// 这些错误码原样透传，其余一律归到调用方指定的 failCode
const PASS_THROUGH = new Set(['NO_BROWSER', 'BAD_REQUEST', 'DISK_FULL', 'IO']);

export async function runWorker(task, args, { timeoutMs, failCode, label, browserPath }) {
  let resultEvent = null;
  let errorEvent = null;
  const env = { ...process.env, IMAGO_WORKER_ARGS: JSON.stringify(args) };
  if (browserPath) env.CHROME_PATH = browserPath;
  const res = await runProcess(process.execPath, [WORKER, task], {
    cwd: APP_DIR,
    timeoutMs,
    env,
    onStdoutLine: line => {
      let event;
      try { event = JSON.parse(line); } catch { return; }
      if (event.event === 'progress') emit(event);
      else if (event.event === 'result') resultEvent = event;
      else if (event.event === 'error') errorEvent = event;
    },
  });
  const stderrTail = tail(res.stderr, 1500);
  if (res.timedOut) {
    throw new PluginError(failCode, `${label}超过 ${Math.round(timeoutMs / 1000)} 秒未完成，已终止浏览器和子进程`, { timeout: true, timeoutMs, stderrTail });
  }
  if (res.spawnError) throw new PluginError('INTERNAL', `无法启动 ${label}子进程：${res.spawnError}`);
  if (errorEvent) {
    const code = PASS_THROUGH.has(errorEvent.code) ? errorEvent.code : failCode;
    throw new PluginError(code, errorEvent.message || `${label}失败`, { ...(errorEvent.detail || {}), workerCode: errorEvent.code, stderrTail });
  }
  if (res.ok && resultEvent) {
    const { event, ok, ...rest } = resultEvent;
    return rest;
  }
  throw new PluginError(failCode, `${label}子进程异常退出（退出码 ${res.code}${res.signal ? `，信号 ${res.signal}` : ''}）`, { stderrTail });
}
