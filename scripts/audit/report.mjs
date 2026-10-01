// 审计报告：report.json（机器读，提交）、report.md（人读，提交）、audit/README.md（12 套总表）。纯函数，文件读写在主脚本。
import { DECOR_WHITELIST_LATIN, DECOR_WHITELIST_CJK } from './judge.mjs';
import { layoutNumber } from './sheet.mjs';

const CATEGORY_NAME = { hardcoded: '写死文字', media: '图片主体', brandIcon: '品牌图标' };

export function formatDuration(ms) {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} 秒`;
  return `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`;
}

function mdCell(text, max = 80) {
  const value = String(text ?? '').replace(/\s+/g, ' ').replace(/\|/g, '\\|').trim();
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

/** 统计。auto 排除只统计非人工条目；某版式同时命中多类时每类各计一次。 */
export function summarize(result) {
  const layouts = Object.values(result.layouts);
  const count = { total: result.total, audited: layouts.length, ruleExcluded: result.ruleExcluded.length, hardcoded: 0, media: 0, brandIcon: 0, autoExcluded: 0, manualExcluded: 0, renderFailed: 0, uncertain: 0, styleControls: 0, selectControls: 0 };
  for (const entry of layouts) {
    if (entry.manual) count.manualExcluded += 1;
    if (entry.status === 'renderFailed') { count.renderFailed += 1; continue; }
    for (const category of entry.categories) count[category] += 1;
    if (entry.categories.length && !entry.manual) count.autoExcluded += 1;
    if (!entry.categories.length && entry.uncertain.length) count.uncertain += 1;
    for (const control of entry.controls || []) {
      count.selectControls += 1;
      if (control.safe && !entry.categories.length && !entry.manual) count.styleControls += 1;
    }
  }
  return count;
}

/** report.json 内容。 */
export function buildReportJson(result, { curationChange } = {}) {
  return {
    theme: result.theme,
    counts: summarize(result),
    timings: result.timings,
    ruleExcluded: result.ruleExcluded,
    layouts: Object.fromEntries(Object.entries(result.layouts).sort(([a], [b]) => a.localeCompare(b)).map(([layout, entry]) => [layout, {
      label: entry.label,
      status: entry.status,
      ...(entry.error ? { error: entry.error } : {}),
      manualExclude: entry.manual,
      categories: entry.categories,
      evidence: entry.evidence,
      uncertain: entry.uncertain,
      whitelisted: entry.whitelisted,
      controls: (entry.controls || []).map(({ key, publicKey, label, values, safe, reason }) => ({ key, publicKey, label, values, safe, reason })),
      ...(entry.collisions?.length ? { markerCollisions: entry.collisions } : {}),
    }])),
    curation: curationChange || null,
  };
}

/** report.md 内容。 */
export function buildReportMd(result, { curationChange } = {}) {
  const counts = summarize(result);
  const entries = Object.values(result.layouts).sort((a, b) => a.layout.localeCompare(b.layout));
  const lines = [];
  lines.push(`# ${result.theme} 版式审计`, '');
  lines.push(`- 版式总数 ${counts.total}；参与审计 ${counts.audited}；现有规则已排除（媒体槽隐藏不了 / contentLocked / inspect 失败）${counts.ruleExcluded}`);
  lines.push(`- 本次自动排除 ${counts.autoExcluded} 个：写死文字 ${counts.hardcoded}、图片主体 ${counts.media}、品牌图标 ${counts.brandIcon}（一个版式命中多类时每类各计一次）`);
  lines.push(`- 人工排除（审计时仍渲染，用来核对判定）${counts.manualExcluded}；渲染失败 ${counts.renderFailed}；待人工确认 ${counts.uncertain}`);
  lines.push(`- select 控件共 ${counts.selectControls} 个，判定为只改外观（可随机）${counts.styleControls} 个`);
  lines.push(`- 耗时：标记渲染 ${formatDuration(result.timings.markerMs)}（${result.timings.markerPages} 页）；控件检查 ${formatDuration(result.timings.controlMs)}（${result.timings.controlPages} 页）；合计 ${formatDuration(result.timings.totalMs)}`);
  if (curationChange) lines.push(`- 清单写入：新增自动排除 ${curationChange.added} 条、清掉旧的自动排除 ${curationChange.removed} 条、styleControls ${curationChange.styleControls} 条${curationChange.droppedForContract?.length ? `；另有 ${curationChange.droppedForContract.length} 个控件因契约会超 1500 字符没有写入（${curationChange.droppedForContract.map(item => `${layoutNumber(item.layout)}.${item.key}`).join('、')}）` : ''}`);
  lines.push('');

  const excluded = entries.filter(entry => entry.categories.length);
  lines.push(`## 自动排除（${excluded.length}）`, '');
  if (excluded.length) {
    lines.push('| 版式 | 名称 | 类别 | 证据 | 已有人工排除 |', '|---|---|---|---|---|');
    for (const entry of excluded) {
      const evidence = entry.categories.map(category => `${CATEGORY_NAME[category]}：${(entry.evidence[category] || []).slice(0, 3).map(item => mdCell(item, 40)).join(' / ')}`).join('；');
      lines.push(`| ${layoutNumber(entry.layout)} | ${mdCell(entry.label, 20)} | ${entry.categories.map(category => CATEGORY_NAME[category]).join('、')} | ${mdCell(evidence, 120)} | ${entry.manual ? mdCell(entry.manual, 40) : ''} |`);
    }
  } else lines.push('（无）');
  lines.push('');

  const uncertain = entries.filter(entry => !entry.categories.length && entry.uncertain.length);
  lines.push(`## 待人工确认（${uncertain.length}）`, '', '候选文字只有一个英文词，判不准是不是写死文字，没有自动排除。', '');
  if (uncertain.length) {
    lines.push('| 版式 | 名称 | 候选文字 |', '|---|---|---|');
    for (const entry of uncertain) lines.push(`| ${layoutNumber(entry.layout)} | ${mdCell(entry.label, 20)} | ${mdCell(entry.uncertain.slice(0, 6).join(' / '), 100)} |`);
  } else lines.push('（无）');
  lines.push('');

  const failed = entries.filter(entry => entry.status === 'renderFailed');
  lines.push(`## 渲染失败（${failed.length}）`, '');
  if (failed.length) {
    lines.push('| 版式 | 名称 | 原因 |', '|---|---|---|');
    for (const entry of failed) lines.push(`| ${layoutNumber(entry.layout)} | ${mdCell(entry.label, 20)} | ${mdCell(entry.error, 200)} |`);
  } else lines.push('（无）');
  lines.push('');

  lines.push('## 可随机的外观控件（styleControls）', '');
  const safeRows = entries.filter(entry => !entry.categories.length && !entry.manual).flatMap(entry => (entry.controls || []).filter(control => control.safe).map(control => ({ entry, control })));
  if (safeRows.length) {
    lines.push('| 版式 | 控件 | 名称 | 取值 |', '|---|---|---|---|');
    for (const { entry, control } of safeRows) lines.push(`| ${layoutNumber(entry.layout)} | ${control.key} | ${mdCell(control.label, 20)} | ${mdCell(control.values.join(' / '), 80)} |`);
  } else lines.push('（无）');
  lines.push('');
  const unsafeRows = entries.filter(entry => !entry.categories.length && !entry.manual).flatMap(entry => (entry.controls || []).filter(control => !control.safe).map(control => ({ entry, control })));
  lines.push(`### 不收的 select 控件（${unsafeRows.length}，会改版式几何或渲染失败）`, '');
  if (unsafeRows.length) {
    lines.push('| 版式 | 控件 | 原因 |', '|---|---|---|');
    for (const { entry, control } of unsafeRows) lines.push(`| ${layoutNumber(entry.layout)} | ${control.key} | ${mdCell(control.reason, 100)} |`);
  } else lines.push('（无）');
  lines.push('');

  const whitelisted = new Map();
  for (const entry of entries) for (const text of entry.whitelisted || []) whitelisted.set(text, (whitelisted.get(text) || 0) + 1);
  lines.push('## 白名单命中（供人复核）', '');
  lines.push(`白名单（英文）：${DECOR_WHITELIST_LATIN.join('、')}`, '', `白名单（中文）：${DECOR_WHITELIST_CJK.join('、')}`, '');
  if (whitelisted.size) {
    lines.push('| 命中文字 | 版式数 |', '|---|---|');
    for (const [text, n] of [...whitelisted.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40)) lines.push(`| ${mdCell(text, 60)} | ${n} |`);
  } else lines.push('本主题没有命中。');
  lines.push('');

  if (result.ruleExcluded.length) {
    lines.push(`## 现有规则已排除（${result.ruleExcluded.length}，未渲染）`, '');
    const byCategory = {};
    for (const item of result.ruleExcluded) byCategory[item.category] = (byCategory[item.category] || 0) + 1;
    lines.push(Object.entries(byCategory).map(([category, n]) => `${category} ${n}`).join('；'), '');
  }
  return `${lines.join('\n')}\n`;
}

/** audit/README.md：12 套主题总表。reports：各主题的 report.json 内容。 */
export function buildReadme(reports) {
  const rows = [...reports].sort((a, b) => a.theme.localeCompare(b.theme));
  const lines = ['# 版式审计汇总', '', '`node scripts/audit-layouts.mjs --theme themeNN`（或 `--all`）生成；每套主题的详情见 `audit/<theme>/report.md`，总览图在 `audit/<theme>/sheet-NN.jpg`（图片不提交）。', ''];
  lines.push('| 主题 | 版式数 | 规则已排除 | 参与审计 | 写死文字 | 图片主体 | 品牌图标 | 自动排除 | 待确认 | 渲染失败 | 可随机控件 | 耗时 |', '|---|---|---|---|---|---|---|---|---|---|---|---|');
  const sum = { total: 0, ruleExcluded: 0, audited: 0, hardcoded: 0, media: 0, brandIcon: 0, autoExcluded: 0, uncertain: 0, renderFailed: 0, styleControls: 0, ms: 0 };
  for (const report of rows) {
    const c = report.counts;
    for (const key of Object.keys(sum)) if (key !== 'ms') sum[key] += c[key] || 0;
    sum.ms += report.timings.totalMs || 0;
    lines.push(`| ${report.theme} | ${c.total} | ${c.ruleExcluded} | ${c.audited} | ${c.hardcoded} | ${c.media} | ${c.brandIcon} | ${c.autoExcluded} | ${c.uncertain} | ${c.renderFailed} | ${c.styleControls} | ${formatDuration(report.timings.totalMs)} |`);
  }
  lines.push(`| **合计** | ${sum.total} | ${sum.ruleExcluded} | ${sum.audited} | ${sum.hardcoded} | ${sum.media} | ${sum.brandIcon} | ${sum.autoExcluded} | ${sum.uncertain} | ${sum.renderFailed} | ${sum.styleControls} | ${formatDuration(sum.ms)} |`, '');
  lines.push('说明：一个版式命中多类时每类各计一次，「自动排除」按版式去重；人工排除的版式也参与审计但不重复写入清单。', '');
  return `${lines.join('\n')}\n`;
}
