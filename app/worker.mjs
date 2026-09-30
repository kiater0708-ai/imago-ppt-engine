// 浏览器任务的子进程入口。由 cli.mjs 通过 `node app/worker.mjs <任务>`（参数放环境变量 IMAGO_WORKER_ARGS） 启动，
// 这样超时时父进程能杀掉整棵进程树（含 Edge/Chrome）。stdout 也是 JSON 行协议：progress / result / error。
import { PluginError, toPluginError } from './lib/errors.mjs';
import { emit, redirectConsoleToStderr, exitAfterFlush } from './lib/protocol.mjs';
import { runResidueTask, runExportTask } from './lib/browser-tasks.mjs';

redirectConsoleToStderr();

const DISK_TEXT = /ENOSPC|no space left|磁盘空间不足/i;

async function main() {
  const task = process.argv[2];
  if (!task || !process.env.IMAGO_WORKER_ARGS) throw new PluginError('INTERNAL', 'worker 用法：IMAGO_WORKER_ARGS=<参数 JSON> node app/worker.mjs <residue|export>');
  let args;
  try {
    args = JSON.parse(process.env.IMAGO_WORKER_ARGS);
  } catch (error) {
    throw new PluginError('INTERNAL', `worker 参数不是合法 JSON：${error.message}`);
  }
  if (task === 'residue') return runResidueTask(args);
  if (task === 'export') return runExportTask(args);
  throw new PluginError('INTERNAL', `未知的 worker 任务：${task}`);
}

main().then(
  result => {
    emit({ event: 'result', ok: true, ...result });
    exitAfterFlush(0);
  },
  error => {
    const failure = DISK_TEXT.test(String(error?.message)) && !(error instanceof PluginError) ? new PluginError('DISK_FULL', `磁盘空间不足：${error.message}`) : toPluginError(error);
    emit({ event: 'error', code: failure.code, message: failure.message, detail: failure.detail });
    exitAfterFlush(failure.exitCode);
  },
);
