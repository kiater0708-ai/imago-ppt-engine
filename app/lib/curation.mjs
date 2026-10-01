// 版式清单（curation）：每套主题一个 JSON，跟插件走，加类型不改代码。
// 格式：{ theme, enabled?:boolean, exclude:[{layout,reason}], notes:{layout:文字}, styleControls:{layout:[{key,values:[...]}]} }
// enabled:false = 主题停用（info 标出来，由宿主决定不展示；各命令仍可调用，便于以后修）；不写或 true = 启用。
import fs from 'node:fs';
import path from 'node:path';
import { CURATION_DIR } from './paths.mjs';
import { PluginError } from './errors.mjs';

const THEME_RE = /^theme\d{2}$/;

export function emptyCuration(theme) {
  return { theme, exclude: [], notes: {}, styleControls: {} };
}

export function validateCuration(data, theme) {
  const problems = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) return ['根节点必须是对象'];
  if (data.theme !== theme) problems.push(`theme 字段应为 ${theme}，实际 ${JSON.stringify(data.theme)}`);
  if (data.enabled !== undefined && typeof data.enabled !== 'boolean') problems.push('enabled 必须是布尔值（true / false）');
  if (!Array.isArray(data.exclude)) problems.push('exclude 必须是数组');
  else data.exclude.forEach((item, i) => {
    if (!item || typeof item.layout !== 'string' || !item.layout.startsWith(`${theme}_page`)) problems.push(`exclude[${i}].layout 不是 ${theme} 的版式 id`);
    if (typeof item?.reason !== 'string' || !item.reason.trim()) problems.push(`exclude[${i}].reason 必须是非空字符串`);
  });
  if (!data.notes || typeof data.notes !== 'object' || Array.isArray(data.notes)) problems.push('notes 必须是对象');
  else for (const [layout, note] of Object.entries(data.notes)) {
    if (!layout.startsWith(`${theme}_page`)) problems.push(`notes 里 ${layout} 不是 ${theme} 的版式 id`);
    if (typeof note !== 'string' || !note.trim()) problems.push(`notes.${layout} 必须是非空字符串`);
  }
  if (!data.styleControls || typeof data.styleControls !== 'object' || Array.isArray(data.styleControls)) problems.push('styleControls 必须是对象');
  else for (const [layout, list] of Object.entries(data.styleControls)) {
    if (!layout.startsWith(`${theme}_page`)) problems.push(`styleControls 里 ${layout} 不是 ${theme} 的版式 id`);
    if (!Array.isArray(list)) { problems.push(`styleControls.${layout} 必须是数组`); continue; }
    list.forEach((control, i) => {
      if (typeof control?.key !== 'string' || !control.key) problems.push(`styleControls.${layout}[${i}].key 必须是非空字符串`);
      if (!Array.isArray(control?.values) || !control.values.length) problems.push(`styleControls.${layout}[${i}].values 必须是非空数组`);
    });
  }
  return problems;
}

/** 读某主题的清单。文件不存在按空清单处理；格式不对是插件自身的数据错误，报 INTERNAL。 */
export function loadCuration(theme, dir = CURATION_DIR) {
  if (!THEME_RE.test(theme)) throw new PluginError('BAD_REQUEST', `主题 id 格式不对：${theme}`);
  const file = path.join(dir, `${theme}.json`);
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return emptyCuration(theme);
    throw new PluginError('INTERNAL', `读取版式清单失败：${file}（${error.message}）`);
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new PluginError('INTERNAL', `版式清单 JSON 解析失败：${file}（${error.message}）`);
  }
  const problems = validateCuration(data, theme);
  if (problems.length) throw new PluginError('INTERNAL', `版式清单格式错误：${file}`, { problems });
  return data;
}

/** 主题是否启用：清单顶层 enabled 不是 false 就算启用。清单读不出来 / 格式不对按 loadCuration 的规则抛错，不默认成启用。 */
export function isThemeEnabled(theme, dir = CURATION_DIR) {
  return loadCuration(theme, dir).enabled !== false;
}
