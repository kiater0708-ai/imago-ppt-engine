// 审计的浏览器子进程：由 runner.mjs 用 runProcess 启动（超时由父进程杀整棵进程树，含浏览器）。
// 参数在环境变量 IMAGO_WORKER_ARGS（JSON）；结果写进 <resultFile>，stdout 只发协议事件。
import fs from 'node:fs';
import { emit, redirectConsoleToStderr, exitAfterFlush } from '../../app/lib/protocol.mjs';
import { toPluginError } from '../../app/lib/errors.mjs';
import { writeJsonAtomic } from '../../app/lib/fsutil.mjs';
import { auditDeck, renderSheets } from './browser.mjs';

redirectConsoleToStderr();

async function main() {
  let args;
  try {
    args = JSON.parse(process.env.IMAGO_WORKER_ARGS || '');
  } catch (error) {
    throw new Error(`审计 worker 参数不是合法 JSON：${error.message}`);
  }
  if (args.task === 'sheets') {
    const done = await renderSheets(args);
    writeJsonAtomic(args.resultFile, done);
    return done;
  }
  const pages = await auditDeck({ ...args, log: message => process.stderr.write(`${message}\n`) });
  writeJsonAtomic(args.resultFile, { pages });
  if (!fs.existsSync(args.resultFile)) throw new Error(`结果文件没有写出：${args.resultFile}`);
  return { pages: pages.length };
}

main().then(
  result => {
    emit({ event: 'result', ok: true, ...result });
    exitAfterFlush(0);
  },
  error => {
    const failure = toPluginError(error);
    emit({ event: 'error', code: failure.code, message: failure.message, detail: failure.detail });
    exitAfterFlush(failure.exitCode || 1);
  },
);
