// 进程级清理登记：任务临时目录等在正常结束时自己清；被信号取消时由这里统一清。
const cleanups = new Set();

export function registerCleanup(fn) {
  cleanups.add(fn);
  return () => cleanups.delete(fn);
}

export function runCleanups() {
  for (const fn of [...cleanups]) {
    cleanups.delete(fn);
    try { fn(); } catch (error) { process.stderr.write(`[清理] 失败：${error.message}\n`); }
  }
}
