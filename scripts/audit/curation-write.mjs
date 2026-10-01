// 把审计结论合进版式清单（app/curation/themeNN.json）。纯函数 merge + 带失败处理的写文件。
// 规则：手工条目（reason 不以 auto: 开头）一律保留；上一次审计写的 auto: 条目先清掉再按本次结论重写；
// styleControls 只改审计拥有的键（该版式 select 控件的 key），其余手写键保留。
import fs from 'node:fs';
import path from 'node:path';
import { loadCuration, validateCuration } from '../../app/lib/curation.mjs';
import { prepareLayouts, buildContracts } from '../../app/lib/layouts.mjs';
import { CURATION_DIR } from '../../app/lib/paths.mjs';
import { writeJsonAtomic } from '../../app/lib/fsutil.mjs';

export const AUTO_PREFIX = 'auto:';
const CATEGORY_ORDER = ['media', 'hardcoded', 'brandIcon']; // reason 取第一类证据
const CATEGORY_NAME = { media: 'media', hardcoded: 'hardcoded', brandIcon: 'brandIcon' };

/** 证据文字压成一行、限长，写进 reason。 */
export function evidenceText(list, max = 60) {
  const text = (list || []).slice(0, 3).map(item => `「${String(item).replace(/\s+/g, ' ').slice(0, 30)}」`).join('');
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function autoReason(entry) {
  const parts = CATEGORY_ORDER.filter(category => entry.categories.includes(category))
    .map(category => `${CATEGORY_NAME[category]}${category === 'brandIcon' ? (entry.evidence.brandIcon || []).slice(0, 2).map(item => `「${String(item).split('/').pop().slice(0, 30)}」`).join('') : evidenceText(entry.evidence[category])}`);
  return `${AUTO_PREFIX}${parts.join('；')}`;
}

/**
 * existing：现有清单对象；themeResult.layouts：{layout: entry}（entry 含 status、categories、evidence、controls）。
 * 返回 { curation, addedExclude:[{layout,reason}], removedAuto:[layout], styleControlCount }。不改传入对象。
 */
export function mergeCuration(existing, themeResult) {
  const curation = JSON.parse(JSON.stringify(existing));
  const removedAuto = curation.exclude.filter(item => item.reason.startsWith(AUTO_PREFIX)).map(item => item.layout);
  curation.exclude = curation.exclude.filter(item => !item.reason.startsWith(AUTO_PREFIX));
  const manual = new Set(curation.exclude.map(item => item.layout));
  const addedExclude = [];
  for (const layout of Object.keys(themeResult.layouts).sort()) {
    const entry = themeResult.layouts[layout];
    if (entry.status !== 'ok' || !entry.categories.length || manual.has(layout)) continue;
    addedExclude.push({ layout, reason: autoReason(entry) });
  }
  curation.exclude.push(...addedExclude);
  curation.exclude.sort((a, b) => a.layout.localeCompare(b.layout));

  let styleControlCount = 0;
  for (const layout of Object.keys(themeResult.layouts).sort()) {
    const entry = themeResult.layouts[layout];
    if (entry.status !== 'ok' || manual.has(layout)) continue;
    const owned = new Set((entry.controls || []).map(control => control.key));
    const kept = (curation.styleControls[layout] || []).filter(control => !owned.has(control.key));
    const safe = (entry.controls || []).filter(control => control.safe && !entry.categories.length).map(control => ({ key: control.key, values: control.values }));
    const merged = [...kept, ...safe];
    if (merged.length) curation.styleControls[layout] = merged;
    else delete curation.styleControls[layout];
    styleControlCount += safe.length;
  }
  curation.styleControls = Object.fromEntries(Object.entries(curation.styleControls).sort(([a], [b]) => a.localeCompare(b)));
  return { curation, addedExclude, removedAuto, styleControlCount };
}

/**
 * 契约（contracts 命令的输出）每个版式 ≤1500 字符，styleControls 会算进去。
 * 写入 styleControls 后某个版式的契约超长，就从该版式的控件里按 JSON 长度从长到短逐个去掉，直到不超；
 * 去不掉的（没有 styleControls 也超长）是原本就超长，不归这里管。返回被去掉的 [{layout, key}]。直接改传入的 curation。
 */
export function trimStyleControlsForContractLimit(engine, theme, curation) {
  const dropped = [];
  for (let round = 0; round < 50; round += 1) {
    const { candidates } = prepareLayouts(engine, theme, curation);
    const { oversize } = buildContracts(engine, candidates, [...candidates.keys()], curation);
    const fixable = oversize.filter(item => (curation.styleControls[item.layout] || []).length);
    if (!fixable.length) break;
    for (const item of fixable) {
      const list = curation.styleControls[item.layout];
      const longest = list.reduce((best, control, index) => (JSON.stringify(control).length > JSON.stringify(list[best]).length ? index : best), 0);
      dropped.push({ layout: item.layout, key: list[longest].key });
      list.splice(longest, 1);
      if (!list.length) delete curation.styleControls[item.layout];
    }
  }
  return dropped;
}

/** 读现有清单 → 合并 →（契约超长则收缩 styleControls）→ 校验 → 原子写回。失败抛 Error（中文原因）。dryRun 只返回结果不落盘。 */
export function writeCuration(theme, themeResult, { dir = CURATION_DIR, dryRun = false, engine = null } = {}) {
  let existing;
  try {
    existing = loadCuration(theme, dir);
  } catch (error) {
    throw new Error(`读取现有版式清单失败：${error.message}`);
  }
  const merged = mergeCuration(existing, themeResult);
  merged.droppedForContract = engine ? trimStyleControlsForContractLimit(engine, theme, merged.curation) : [];
  merged.styleControlCount -= merged.droppedForContract.length;
  const problems = validateCuration(merged.curation, theme);
  if (problems.length) throw new Error(`合并后的清单格式不对：${problems.join('；')}`);
  if (!dryRun) {
    const file = path.join(dir, `${theme}.json`);
    try {
      writeJsonAtomic(file, merged.curation);
    } catch (error) {
      throw new Error(`写版式清单失败：${file}（${error.message}）`);
    }
    if (!fs.existsSync(file)) throw new Error(`版式清单写完后不存在：${file}`);
  }
  return merged;
}
