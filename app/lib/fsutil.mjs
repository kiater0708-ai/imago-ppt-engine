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

/** 两个路径是否同一个文件：先比 dev+ino（能识别硬链接、符号链接），拿不到再比 realpath。 */
export function sameFile(a, b) {
  try {
    const sa = fs.statSync(a, { bigint: true });
    const sb = fs.statSync(b, { bigint: true });
    if (sa.ino !== 0n && sb.ino !== 0n) return sa.dev === sb.dev && sa.ino === sb.ino;
  } catch {
    /* 其中一个不存在：下面比路径 */
  }
  return samePath(a, b);
}

export function samePath(a, b) {
  const real = value => {
    try { return fs.realpathSync(value); } catch { return path.resolve(value); }
  };
  return real(a) === real(b);
}

/** 目标路径自身不能是符号链接/联接点；已存在的必须是普通文件。不存在没关系。 */
export function assertPlainFileOrMissing(file, what = '输出文件') {
  let stat;
  try {
    stat = fs.lstatSync(file);
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw toPluginError(error);
  }
  if (stat.isSymbolicLink()) throw new PluginError('BAD_REQUEST', `${what}是符号链接或联接点，拒绝写入：${file}`, { path: file });
  if (!stat.isFile()) throw new PluginError('BAD_REQUEST', `${what}已存在且不是普通文件：${file}`, { path: file });
}

/**
 * 递归检查目录里没有符号链接/联接点（Windows junction 在 Node 里同样报 isSymbolicLink）。
 * 输出目录里出现链接，写入就可能越出请求的目录，一律拒绝。dir 自己允许（调用方已 realpath）。
 */
export function assertNoLinksInside(dir, what = '输出目录') {
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw toPluginError(error);
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isSymbolicLink()) throw new PluginError('BAD_REQUEST', `${what}里有符号链接或联接点，拒绝写入：${full}`, { path: full });
      if (entry.isDirectory()) stack.push(full);
    }
  }
}

/** 目录的真实路径（创建后解析）。返回规范化的真实路径，之后的所有输出都基于它。 */
export function ensureRealDir(dir) {
  ensureDir(dir);
  try {
    return fs.realpathSync(dir);
  } catch (error) {
    throw toPluginError(error);
  }
}

/** 临时文件 + 原子替换：不跟随目标处已有的链接，硬链接的另一端不受影响。 */
export function writeFileAtomic(file, content) {
  assertPlainFileOrMissing(file);
  const tmp = path.join(path.dirname(file), `.${path.basename(file)}.tmp-${process.pid}-${Math.random().toString(36).slice(2, 8)}`);
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(tmp, content, { flag: 'wx' });
    fs.renameSync(tmp, file);
  } catch (error) {
    try { fs.rmSync(tmp, { force: true }); } catch { /* 临时文件删不掉也不掩盖原错误 */ }
    throw toPluginError(error);
  }
}

export function writeJsonAtomic(file, value) {
  writeFileAtomic(file, `${JSON.stringify(value, null, 2)}\n`);
}

export function tail(text, max = 2000) {
  const value = String(text || '');
  return value.length > max ? `…${value.slice(-max)}` : value;
}
