#!/usr/bin/env node
// 插件入口：node app/cli.mjs <命令> --request <请求.json>
// stdout 只输出 JSON 行（progress / log / result / error），其余输出一律走 stderr。
import { PluginError, toPluginError } from './lib/errors.mjs';
import { emit, redirectConsoleToStderr, exitAfterFlush } from './lib/protocol.mjs';
import { parseArgv, loadRequest } from './lib/request.mjs';
import { cmdInfo, cmdCatalog, cmdContracts, cmdCheck, cmdExport, cmdSelftest } from './lib/commands.mjs';

redirectConsoleToStderr();

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
  const spec = COMMANDS[args.command];
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
