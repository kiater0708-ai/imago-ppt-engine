// 带失败处理的文件读写。所有写入失败都转成 PluginError（磁盘满 / IO 归 6）。
import fs from 'node:fs';
import path from 'node:path';
import { PluginError, toPluginError } from './errors.mjs';

export function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (error) {
    throw new PluginError('BAD_REQUEST', `读取文件失败：${file}（${error.code || error.message}）`, { path: file });
  }
}

export function readJson(file, code = 'BAD_REQUEST') {
  const text = readText(file);
  try {
    return JSON.parse(text.replace(/^﻿/, ''));
  } catch (error) {
    throw new PluginError(code, `JSON 解析失败：${file}（${error.message}）`, { path: file });
  }
}

export function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (error) {
    throw toPluginError(error);
  }
}

export function writeText(file, content) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  } catch (error) {
    throw toPluginError(error);
  }
}

export function writeJson(file, value) {
  writeText(file, `${JSON.stringify(value, null, 2)}\n`);
}

export function copyFile(from, to) {
  try {
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  } catch (error) {
    if (error.code === 'ENOENT' && !fs.existsSync(from)) throw new PluginError('BAD_REQUEST', `源文件不存在：${from}`, { path: from });
    throw toPluginError(error);
  }
}

export function samePath(a, b) {
  const real = value => {
    try { return fs.realpathSync(value); } catch { return path.resolve(value); }
  };
  return real(a) === real(b);
}

export function tail(text, max = 2000) {
  const value = String(text || '');
  return value.length > max ? `…${value.slice(-max)}` : value;
}
