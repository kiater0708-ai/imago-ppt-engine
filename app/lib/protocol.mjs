// stdout 协议：每行一个 JSON。stdout 只输出这些事件，其他输出一律走 stderr。
export const PROTOCOL_VERSION = 1;

let stdoutBroken = false;

export function emit(event) {
  if (stdoutBroken) return;
  try {
    process.stdout.write(`${JSON.stringify(event)}\n`);
  } catch {
    stdoutBroken = true; // 管道已关（调用方退出），后面不再写，避免 EPIPE 抛出
  }
}

export function progress(stage, done, total) {
  emit({ event: 'progress', stage, done, total });
}

export function log(message) {
  emit({ event: 'log', message: String(message) });
}

process.stdout.on?.('error', () => { stdoutBroken = true; });

/** 保证任何库代码里的 console.log 都不会污染 stdout 协议流。 */
export function redirectConsoleToStderr() {
  const toStderr = (...args) => process.stderr.write(`${args.map(item => (typeof item === 'string' ? item : JSON.stringify(item))).join(' ')}\n`);
  console.log = toStderr;
  console.info = toStderr;
  console.debug = toStderr;
}

/** 写完最后一行再退出，避免管道未刷新就 exit 截断输出。 */
export function exitAfterFlush(code) {
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    process.exit(code);
  };
  try {
    process.stdout.write('', finish);
  } catch {
    finish();
  }
  setTimeout(finish, 2000).unref();
}
