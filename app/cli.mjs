#!/usr/bin/env node
// 插件入口：node app/cli.mjs <命令> --request <请求.json>
// stdout 只输出 JSON 行（progress / log / result / error），其余输出一律走 stderr。
import { PluginError, toPluginError } from './lib/errors.mjs';
import { emit, redirectConsoleToStderr, exitAfterFlush } from './lib/protocol.mjs';
import { parseArgv, loadRequest } from './lib/request.mjs';
import { killAllActive } from './lib/proc.mjs';
import { runCleanups } from './lib/cleanup.mjs';
import { cmdInfo, cmdCatalog, cmdContracts, cmdCheck, cmdExport, cmdSelftest } from './lib/commands.mjs';

redirectConsoleToStderr();

// 宿主取消（SIGTERM / SIGINT / SIGHUP）：先结束自己启动的 worker 与浏览器，再清临时目录，最后退出
for (const signal of ['SIGTERM', 'SIGINT', 'SIGHUP']) {
  process.on(signal, () => {
    try { killAllActive(); } catch (error) { process.stderr.write(`[取消] 结束子进程失败：${error.message}\n`); }
    try { runCleanups(); } catch (error) { process.stderr.write(`[取消] 清理临时目录失败：${error.message}\n`); }
    emit({ event: 'error', code: 'CANCELLED', message: `收到 ${signal}，任务已取消`, detail: { signal } });
    exitAfterFlush(130);
  });
}

const COMMANDS = {
  info: { run: cmdInfo, needsRequest: false },
  selftest: { run: cmdSelftest, needsRequest: true },
  catalog: { run: cmdCatalog, needsRequest: true },
  contracts: { run: cmdContracts, needsRequest: true },
  check: { run: cmdCheck, needsRequest: true },
  export: { run: cmdExport, needsRequest: true },
};

async function main() {
  const args = parseArgv(process.argv.slice(2));
  if (!args.command) throw new PluginError('BAD_REQUEST', `缺少命令，可用：${Object.keys(COMMANDS).join(' / ')}`);
  // Object.hasOwn：constructor / toString / __proto__ 这类继承属性名不是命令
  const spec = Object.hasOwn(COMMANDS, args.command) ? COMMANDS[args.command] : null;
  if (!spec) throw new PluginError('BAD_REQUEST', `未知命令：${args.command}，可用：${Object.keys(COMMANDS).join(' / ')}`);
  const request = loadRequest(args.request, { required: spec.needsRequest });
  return spec.run(request);
}

main().then(
  result => {
    emit({ event: 'result', ok: result.ok ?? true, ...result });
    exitAfterFlush(0);
  },
  error => {
    const failure = toPluginError(error);
    process.stderr.write(`${failure.code}: ${failure.message}\n`);
    emit({ event: 'error', code: failure.code, message: failure.message, detail: failure.detail ?? {} });
    exitAfterFlush(failure.exitCode);
  },
);
