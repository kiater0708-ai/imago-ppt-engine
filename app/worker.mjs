// 浏览器任务的子进程入口。由 cli.mjs 通过 `node app/worker.mjs <任务>`（参数放环境变量 IMAGO_WORKER_ARGS） 启动，
// 这样超时时父进程能杀掉整棵进程树（含 Edge/Chrome）。stdout 也是 JSON 行协议：progress / result / error。
import { PluginError, toPluginError, classifyErrnoText, errnoFromText } from './lib/errors.mjs';
import { emit, redirectConsoleToStderr, exitAfterFlush } from './lib/protocol.mjs';
import { runResidueTask, runExportTask } from './lib/browser-tasks.mjs';

redirectConsoleToStderr();


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
    // 磁盘类错误保留 errno 走结构化错误通道；其余按 toPluginError
    const textClass = !(error instanceof PluginError) && !error?.code ? classifyErrnoText(error?.message) : null;
    const failure = textClass ? new PluginError(textClass, `磁盘读写失败：${String(error.message).split('\n')[0]}`, { errno: errnoFromText(error.message) }) : toPluginError(error);
    emit({ event: 'error', code: failure.code, message: failure.message, detail: failure.detail });
    exitAfterFlush(failure.exitCode);
  },
);
