// 单个主题的审计流程：分类 → 标记渲染（写死文字 / 图片 / 品牌图标 / 基线几何 / 截图）→ select 控件逐值渲染 → 汇总。
// 单个版式渲染失败只记进「渲染失败」，不让整套中断。
import fs from 'node:fs';
import path from 'node:path';
import { mediaBlocker } from '../../app/lib/layouts.mjs';
import { ensureDir } from '../../app/lib/fsutil.mjs';
import { buildMarkerProps } from './markers.mjs';
import { judgeLayout } from './judge.mjs';
import { selectControls, judgeControl } from './controls.mjs';
import { makeBatches, isCoverLayout } from './batches.mjs';
import { renderBatch, runWithBisect, BATCH_SIZE } from './runner.mjs';

/** 并发池：最多 n 个同时跑，保持结果顺序。fn 抛错会被收成 {error}，不影响其他任务。 */
export async function mapPool(items, n, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      try {
        out[index] = { value: await fn(items[index], index) };
      } catch (error) {
        out[index] = { error: String(error?.message || error) };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(n, items.length)) }, worker));
  return out;
}

/** 把版式分成「参与审计」与「已被现有规则排除（contentLocked / 媒体槽隐藏不了 / inspect 失败）」。 */
export function classifyLayouts(engine, keys) {
  const auditable = [];
  const ruleExcluded = [];
  for (const layout of keys) {
    let info;
    try {
      info = engine.inspectLayout(layout, { compact: true });
    } catch (error) {
      ruleExcluded.push({ layout, category: 'inspectFailed', reason: `inspectLayout 抛错：${error.message}` });
      continue;
    }
    if (!info) {
      ruleExcluded.push({ layout, category: 'inspectFailed', reason: 'inspectLayout 返回空' });
      continue;
    }
    if (info.contentLocked) {
      ruleExcluded.push({ layout, category: 'contentLocked', reason: `contentLocked：${info.contentLockedReason || ''}` });
      continue;
    }
    const blocker = mediaBlocker(info);
    if (blocker) {
      ruleExcluded.push({ layout, category: 'media', reason: blocker });
      continue;
    }
    auditable.push({ layout, info });
  }
  return { auditable, ruleExcluded };
}

/**
 * 审计一个主题。opts：{ engine, theme, curation, browserPath, workRoot, shotsRoot, concurrency, controls, limit, log }。
 * 返回 { theme, total, ruleExcluded, layouts:{layout:entry}, shots:{layout:file}, timings, batchFailures }。
 */
export async function auditTheme({ engine, theme, curation, browserPath, workRoot, shotsRoot, concurrency = 2, controls = true, limit = null, only = null, log = () => {} }) {
  const started = Date.now();
  const keys = engine.THEME_PAGES.filter(page => page.themeKey === theme).map(page => page.key).sort();
  let { auditable, ruleExcluded } = classifyLayouts(engine, only ? keys.filter(key => only.includes(key)) : keys);
  if (limit) auditable = auditable.slice(0, limit);
  const manual = new Map((curation.exclude || []).filter(item => !String(item.reason).startsWith('auto:')).map(item => [item.layout, item.reason]));
  const batchFailures = [];
  ensureDir(shotsRoot);

  // ---- 阶段 1：标记渲染 ----
  const prepared = auditable.map(({ layout, info }) => {
    const record = engine.getLayoutRecord(layout);
    const built = buildMarkerProps(info, record?.defaultProps || {});
    return { layout, info, record, label: info.label || '', slideProps: built.props, markers: [...built.markers, ...built.keptTokens], collisions: built.collisions };
  });
  const byLayout = new Map(prepared.map(item => [item.layout, item]));
  let shotSeq = 0;
  const runMarker = async slides => {
    shotSeq += 1;
    const shotsDir = path.join(shotsRoot, `m${shotSeq}`);
    return renderBatch(slides, { workRoot, theme, browserPath, geometry: true, shotsDir });
  };
  const t1 = Date.now();
  const batches = makeBatches(prepared.map(item => ({ layout: item.layout, props: item.slideProps })), BATCH_SIZE);
  log(`${theme}：${prepared.length} 个版式参与审计（规则已排除 ${ruleExcluded.length}），分 ${batches.length} 批渲染`);
  const markerResults = new Map();
  await mapPool(batches, concurrency, async (batch, index) => {
    await runWithBisect(batch, runMarker, markerResults, (size, message) => {
      batchFailures.push({ phase: 'marker', size, message });
      log(`  第 ${index + 1} 批（${size} 页）失败，拆开重试：${message.slice(0, 120)}`);
    });
    log(`  标记渲染 第 ${index + 1}/${batches.length} 批完成`);
  });
  const markerMs = Date.now() - t1;

  const layouts = {};
  const geometry = new Map();
  const shots = {};
  for (const item of prepared) {
    const result = markerResults.get(item.layout);
    const entry = {
      layout: item.layout, label: item.label, manual: manual.get(item.layout) || null,
      status: 'ok', categories: [], evidence: { hardcoded: [], media: [], brandIcon: [] }, uncertain: [], whitelisted: [],
      collisions: item.collisions, controls: [],
    };
    if (!result || result.error) {
      entry.status = 'renderFailed';
      entry.error = result?.error || '没有渲染结果';
    } else {
      const page = result.page;
      const verdict = judgeLayout({ lines: page.lines, markers: item.markers, resources: page.resources });
      Object.assign(entry, { categories: verdict.categories, evidence: verdict.evidence, uncertain: verdict.uncertain, whitelisted: verdict.whitelisted });
      geometry.set(item.layout, page.rects);
      if (page.shot && fs.existsSync(page.shot)) {
        const target = path.join(shotsRoot, `${item.layout}.jpg`);
        try {
          fs.renameSync(page.shot, target);
          shots[item.layout] = target;
        } catch (error) {
          log(`  ${item.layout} 截图改名失败：${error.message}`);
        }
      }
    }
    layouts[item.layout] = entry;
  }

  // ---- 阶段 2：select 控件逐值渲染 ----
  const t2 = Date.now();
  let controlPages = 0;
  if (controls) {
    const live = prepared.filter(item => {
      const entry = layouts[item.layout];
      return entry.status === 'ok' && !entry.categories.length && !entry.manual;
    });
    const tasks = new Map(); // layout → [{control, value}]
    for (const item of live) {
      const list = [];
      for (const control of selectControls(item.record)) {
        layouts[item.layout].controls.push({ key: control.key, publicKey: control.publicKey, label: control.label, default: control.default, values: control.values, safe: false, reason: '尚未渲染', results: [] });
        for (const value of control.values) {
          if (JSON.stringify(value) === JSON.stringify(control.default)) continue;
          list.push({ control, value });
        }
      }
      if (list.length) tasks.set(item.layout, list);
    }
    const rounds = Math.max(0, ...[...tasks.values()].map(list => list.length));
    log(`${theme}：${live.length} 个版式进入控件检查，${[...tasks.values()].reduce((sum, list) => sum + list.length, 0)} 个取值，${rounds} 轮`);
    for (let round = 0; round < rounds; round += 1) {
      const items = [];
      for (const [layout, list] of tasks) {
        if (round >= list.length) continue;
        const { control, value } = list[round];
        items.push({ layout, props: { ...byLayout.get(layout).slideProps, [control.key]: value }, control, value });
      }
      controlPages += items.length * 2;
      const meta = new Map(items.map(item => [item.layout, item]));
      const roundBatches = makeBatches(items, BATCH_SIZE);
      const results = new Map();
      // 页码文字（「3 / 20」）的宽度随位置变，所以基线必须和取值版放在同样的 deck 里（同样的页序、同样的总页数）：
      // 每批渲染两次，取值版与默认值版成对比较
      const runControl = async slides => {
        const variant = await renderBatch(slides, { workRoot, theme, browserPath, geometry: true });
        const base = await renderBatch(slides.map(slide => ({ layout: slide.layout, props: byLayout.get(slide.layout).slideProps })), { workRoot, theme, browserPath, geometry: true });
        return variant.map((page, index) => ({ rects: page.rects, base: base[index].rects }));
      };
      await mapPool(roundBatches, concurrency, batch => runWithBisect(batch, runControl, results, (size, message) => {
        batchFailures.push({ phase: 'control', size, message });
      }));
      for (const [layout, result] of results) {
        const { control, value } = meta.get(layout);
        const record = layouts[layout].controls.find(item => item.key === control.key);
        record.results.push(result.error ? { value, geometry: null, error: result.error } : { value, geometry: result.page.rects, base: result.page.base });
      }
      log(`  控件检查 第 ${round + 1}/${rounds} 轮完成（${items.length} 页）`);
    }
    for (const item of live) {
      for (const record of layouts[item.layout].controls) {
        const verdict = judgeControl(null, record.results);
        record.safe = verdict.safe;
        record.reason = verdict.reason;
        delete record.results; // 几何快照不进报告
      }
    }
  }
  const controlMs = Date.now() - t2;

  return {
    theme, total: keys.length, ruleExcluded, layouts, shots, batchFailures,
    timings: { markerMs, controlMs, totalMs: Date.now() - started, markerPages: prepared.length, controlPages },
  };
}

export { isCoverLayout };
