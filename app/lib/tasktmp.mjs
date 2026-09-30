// 任务临时目录：由父进程为每次浏览器任务创建 <base>/.tmp/<随机>，交给 worker（经 TMPDIR/TMP/TEMP），
// 进程树确认结束后由父进程删除。worker 被强杀时 Playwright 的 profile / artifacts 目录也在这里，不会散落到系统临时目录。
import fs from 'node:fs';
import path from 'node:path';
import { PluginError, toPluginError } from './errors.mjs';

/**
 * 创建任务临时目录。base 必须已存在；<base>/.tmp 若已存在必须是真实目录（不是符号链接/联接点）。
 * 返回 { dir, env(), cleanup(extraFiles?) }。cleanup 失败只记日志，不抛。
 */
export function createTaskTmp(base, { rmSync = fs.rmSync, log = message => process.stderr.write(`${message}\n`) } = {}) {
  const parent = path.join(base, '.tmp');
  try {
    fs.mkdirSync(base, { recursive: true });
    let stat = null;
    try { stat = fs.lstatSync(parent); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (stat && (stat.isSymbolicLink() || !stat.isDirectory())) {
      throw new PluginError('BAD_REQUEST', `${parent} 不是普通目录（符号链接或文件），拒绝在其中创建临时目录`, { path: parent });
    }
    if (!stat) fs.mkdirSync(parent);
  } catch (error) {
    if (error instanceof PluginError) throw error;
    throw toPluginError(error);
  }
  let dir;
  try {
    dir = fs.mkdtempSync(path.join(parent, 'task-'));
  } catch (error) {
    throw toPluginError(error);
  }
  return {
    dir,
    /** 给 worker 子进程用的环境变量：所有临时文件都落到任务目录。 */
    env: () => ({ TMPDIR: dir, TMP: dir, TEMP: dir }),
    cleanup(extraFiles = []) {
      for (const file of extraFiles) {
        try { rmSync(file, { force: true }); } catch (error) { log(`[临时文件] 删除失败：${file}（${error.message}）`); }
      }
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch (error) {
        log(`[临时目录] 删除失败：${dir}（${error.message}）`);
        return;
      }
      try {
        fs.rmdirSync(parent); // 空的 .tmp 一并删掉；不空（并发任务在用）就保留
      } catch { /* 非空或已不在 */ }
    },
  };
}
