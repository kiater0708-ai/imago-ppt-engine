// 请求 JSON 的读取与校验。规则：必带 protocol:1；所有路径参数必须是绝对路径。
import path from 'node:path';
import { PluginError } from './errors.mjs';
import { PROTOCOL_VERSION } from './protocol.mjs';
import { readJson } from './fsutil.mjs';

export function parseArgv(argv) {
  const args = { command: null, request: null };
  const rest = [...argv];
  if (rest.length && !rest[0].startsWith('--')) args.command = rest.shift();
  for (let i = 0; i < rest.length; i += 1) {
    const item = rest[i];
    if (item === '--request') {
      const value = rest[i + 1];
      if (value === undefined || value.startsWith('--')) throw new PluginError('BAD_REQUEST', '参数 --request 缺少取值');
      args.request = value;
      i += 1;
    } else {
      throw new PluginError('BAD_REQUEST', `不认识的参数：${item}`);
    }
  }
  return args;
}

export function requireAbsolute(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new PluginError('BAD_REQUEST', `请求字段 ${name} 必须是非空字符串`);
  if (!path.isAbsolute(value)) throw new PluginError('BAD_REQUEST', `请求字段 ${name} 必须是绝对路径，收到：${value}`);
  return path.normalize(value);
}

/** 读取 --request 文件并检查 protocol。required=false 时（info）没有 request 返回 {protocol}。 */
export function loadRequest(file, { required }) {
  if (!file) {
    if (required) throw new PluginError('BAD_REQUEST', '缺少 --request <请求.json>');
    return { protocol: PROTOCOL_VERSION };
  }
  requireAbsolute(file, '--request');
  const request = readJson(file);
  return checkRequest(request);
}

export function checkRequest(request) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) throw new PluginError('BAD_REQUEST', '请求必须是 JSON 对象');
  if (request.protocol === undefined) throw new PluginError('BAD_REQUEST', '请求缺少 protocol 字段（应为 1）');
  if (request.protocol !== PROTOCOL_VERSION) {
    throw new PluginError('BAD_REQUEST', `不支持的协议版本 ${JSON.stringify(request.protocol)}，本插件只支持 ${PROTOCOL_VERSION}`, { supported: [PROTOCOL_VERSION] });
  }
  return request;
}

export function requireString(request, key, pattern) {
  const value = request[key];
  if (typeof value !== 'string' || !value.trim()) throw new PluginError('BAD_REQUEST', `请求字段 ${key} 必须是非空字符串`);
  if (pattern && !pattern.test(value)) throw new PluginError('BAD_REQUEST', `请求字段 ${key} 格式不对：${value}`);
  return value;
}
