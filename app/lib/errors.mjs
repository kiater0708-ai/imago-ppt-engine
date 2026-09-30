// 插件错误：错误码与退出码固定一组（协议 v1）。绘境按 code 出中文提示，不直接显示 message。
export const EXIT_CODES = {
  BAD_REQUEST: 2,
  NO_BROWSER: 3,
  RENDER_FAILED: 4,
  EXPORT_FAILED: 5,
  DISK_FULL: 6,
  IO: 6,
  INTERNAL: 1,
};

export class PluginError extends Error {
  constructor(code, message, detail) {
    super(message);
    this.name = 'PluginError';
    this.code = code;
    this.detail = detail;
  }

  get exitCode() {
    return EXIT_CODES[this.code] ?? 1;
  }
}

const DISK_FULL_ERRNO = new Set(['ENOSPC', 'EDQUOT']);
const IO_ERRNO = new Set(['EACCES', 'EPERM', 'EROFS', 'EIO', 'EMFILE', 'ENFILE', 'ENOTDIR', 'EISDIR', 'ENAMETOOLONG', 'EBUSY']);
const ERRNO_TEXT_RE = /\b(ENOSPC|EDQUOT|EACCES|EPERM|EROFS|EIO|EMFILE|ENFILE|EBUSY)\b/;

/** 把 Node 文件系统错误归类为 DISK_FULL / IO；不是文件系统写入错误返回 null。 */
export function classifyFsError(error) {
  const errno = error?.code;
  if (DISK_FULL_ERRNO.has(errno)) return 'DISK_FULL';
  if (IO_ERRNO.has(errno)) return 'IO';
  return null;
}

/** 从子进程 stderr / 错误文字里认 errno（渲染脚本只把错误写成文字）。认不出返回 null。 */
export function classifyErrnoText(text) {
  const match = ERRNO_TEXT_RE.exec(String(text || ''));
  if (!match) return null;
  return DISK_FULL_ERRNO.has(match[1]) ? 'DISK_FULL' : 'IO';
}

export function errnoFromText(text) {
  const match = ERRNO_TEXT_RE.exec(String(text || ''));
  return match ? match[1] : null;
}

/** 任何异常 → PluginError。文件系统写入类错误归 6（保留 errno），其余归 INTERNAL。 */
export function toPluginError(error) {
  if (error instanceof PluginError) return error;
  const fsCode = classifyFsError(error);
  if (fsCode) {
    return new PluginError(fsCode, `磁盘读写失败：${error.message}`, { errno: error.code, path: error.path });
  }
  return new PluginError('INTERNAL', `插件内部错误：${error?.message || error}`, { stack: String(error?.stack || '').split('\n').slice(0, 6).join('\n') });
}
