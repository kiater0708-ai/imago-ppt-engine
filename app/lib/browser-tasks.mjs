// worker 里跑的两个浏览器任务：运行时文字检查（check 的最后一步）与 PPTX 导出 + 逐页截图（export）。
import fs from 'node:fs';
import path from 'node:path';
import { PluginError, classifyFsError, classifyErrnoText, errnoFromText } from './errors.mjs';
import { progress } from './protocol.mjs';
import { importFromRuntime } from './paths.mjs';
import { readJson, ensureDir, copyFile } from './fsutil.mjs';
import { loadEngine } from './layouts.mjs';
import { checkSlideResidue, findFloatArtifacts, findMediaPlaceholder, norm, stringLeaves } from './residue.mjs';
import { withDeckBrowser, openDeckPage, openDeckPageForShots, extractSlideTextsParallel, RESIDUE_TEXT_OPTIONS, captureShots, testHang, SLIDE_SELECTOR } from './browser-session.mjs';

/**
 * 运行时文字检查。返回 { issues, slideCount, texts:[{index,layout,waitedMs,length}] }。
 * 只做检查，不改 goal。issue 字段：{index, layout, field, code, message, fixable}。
 */
export async function runResidueTask({ goalFile, deckPptDir, browserPath, tmpBase }) {
  const goal = readJson(goalFile, 'INTERNAL');
  const engine = await loadEngine();
  const infos = new Map();
  for (const slide of goal.slides) {
    if (!infos.has(slide.layout)) {
      try { infos.set(slide.layout, engine.inspectLayout(slide.layout, { compact: true })); } catch { infos.set(slide.layout, null); }
    }
  }
  return withDeckBrowser({ deckPptDir, browserPath, tmpBase }, async ({ browser, url }) => {
    await testHang('residue');
    {
      const { texts } = await extractSlideTextsParallel(browser, url, {
        expectedTotal: goal.slides.length,
        onPage: (done, all) => progress('residue', done, all),
        options: RESIDUE_TEXT_OPTIONS,
      });
      const issues = [];
      if (texts.length !== goal.slides.length) {
        issues.push({ index: null, layout: null, field: null, code: 'VALIDATOR', fixable: false, message: `浏览器里有 ${texts.length} 页，goal 有 ${goal.slides.length} 页，无法逐页核对` });
        return { issues, slideCount: texts.length, texts: texts.map(({ text, ...rest }) => ({ ...rest, length: text.length })) };
      }
      goal.slides.forEach((slide, index) => {
        const shown = texts[index];
        const where = `第 ${index + 1} 页（${slide.layout}）`;
        if (shown.layout && shown.layout !== slide.layout) {
          issues.push({ index, layout: slide.layout, field: null, code: 'VALIDATOR', fixable: false, message: `${where}：浏览器里这一页的版式是 ${shown.layout}，与 goal 不一致` });
          return;
        }
        if (!shown.text) {
          issues.push({ index, layout: slide.layout, field: null, code: 'EMPTY_PAGE', fixable: false, message: `${where}：运行时页面为空（等待 ${Math.round(shown.waitedMs / 1000)} 秒仍无可见文字）` });
          return;
        }
        const info = infos.get(slide.layout);
        const record = engine.getLayoutRecord(slide.layout);
        if (!info || !record) {
          issues.push({ index, layout: slide.layout, field: null, code: 'VALIDATOR', fixable: false, message: `${where}：找不到版式契约或默认 props，无法做残留检查` });
          return;
        }
        const ours = norm(stringLeaves(slide.props).map(item => item.value).join(' '));
        const placeholder = findMediaPlaceholder(shown.text);
        const placeholderReal = placeholder && !ours.includes(norm(placeholder).slice(0, 4));
        if (placeholderReal) {
          issues.push({ index, layout: slide.layout, field: null, code: 'MEDIA_PLACEHOLDER', fixable: false, message: `${where}：页面出现媒体占位文字『${placeholder}』，该版式以图片/视频为主体，无图时无法使用，应换版式` });
        }
        const floats = findFloatArtifacts(shown.text);
        if (floats.length) {
          issues.push({ index, layout: slide.layout, field: null, code: 'FLOAT_ARTIFACT', fixable: false, message: `${where}：页面可见文字出现长尾小数『${floats.slice(0, 3).join('』『')}』${floats.length > 3 ? `等 ${floats.length} 处` : ''}，疑似组件求和未取整的浮点尾差，props 修不了` });
        }
        for (const hit of checkSlideResidue({ text: shown.text, props: slide.props || {}, defaultProps: record.defaultProps || {}, info })) {
          if (placeholderReal && findMediaPlaceholder(hit.text)) continue; // 已按媒体占位报过
          issues.push({
            index, layout: slide.layout, field: hit.path || null,
            code: hit.fixable ? 'TEMPLATE_RESIDUE' : 'HARDCODED_TEXT',
            fixable: Boolean(hit.fixable),
            message: `${where}：${hit.message}`,
          });
        }
      });
      return { issues, slideCount: texts.length, texts: texts.map(({ text, ...rest }) => ({ ...rest, length: text.length })) };
    }
  });
}

/** 导出阶段的任何异常 → 协议错误：磁盘类先按 errno 归 6（保留 errno），其余才是 EXPORT_FAILED。 */
export function wrapExportError(error, what = 'PPTX 导出失败') {
  if (error instanceof PluginError) return error;
  const fsCode = classifyFsError(error) || classifyErrnoText(error?.message);
  if (fsCode) {
    return new PluginError(fsCode, `磁盘读写失败：${String(error.message || error).split('\n')[0]}`, { errno: error.code || errnoFromText(error?.message), path: error.path });
  }
  return new PluginError('EXPORT_FAILED', `${what}：${String(error?.message || error).split('\n')[0]}`);
}

/** 临时 PPTX 改成正式文件名。失败时删掉临时文件，并保留 errno 分类。fsImpl 可注入（测试）。 */
export function finalizePptx(part, pptx, fsImpl = fs) {
  try {
    if (!fsImpl.existsSync(part) || fsImpl.statSync(part).size <= 0) throw new PluginError('EXPORT_FAILED', '导出结束但没有生成 PPTX 文件');
    fsImpl.renameSync(part, pptx);
  } catch (error) {
    try { fsImpl.rmSync(part, { force: true }); } catch { /* 临时文件由父进程兜底清理 */ }
    throw wrapExportError(error);
  }
}

/**
 * 导出：同一个浏览器会话、同一个静态服务，先导出可编辑 PPTX，再逐页截图。
 * PPTX 先写临时名（partFile，由父进程指定并负责兜底清理），成功后改名，失败不留半成品。
 */
export async function runExportTask({ deckPptDir, pptx, shotsDir, title, author, application, browserPath, tmpBase, waitStrategy = 'adaptive', partFile }) {
  const engine = await importFromRuntime('packages/html-deck-to-pptx/src/editable.mjs');
  const { brandPptxFile } = await importFromRuntime('scripts/pptx-metadata.mjs');
  ensureDir(path.dirname(pptx));
  // pptxgenjs 会给不以 .pptx 结尾的文件名补后缀，所以临时名也以 .pptx 结尾
  const part = partFile || path.join(path.dirname(pptx), `.${path.basename(pptx, '.pptx')}.part-${process.pid}.pptx`);
  return withDeckBrowser({ deckPptDir, browserPath, tmpBase }, async ({ browser, url }) => {
    await testHang('export');
    await testHang('export-part', { beforeHang: () => fs.writeFileSync(part, 'partial') });
    let result;
    try {
      result = await engine.exportEditablePptxFromUrl(browser, url, {
        outFile: part,
        title: title || 'Deck',
        onProgress: info => {
          if (info && typeof info.percent === 'number') progress('export', Math.min(100, info.percent), 100);
        },
      });
      const brandOptions = {};
      if (author) brandOptions.author = author;
      if (application) brandOptions.application = application;
      await brandPptxFile(part, brandOptions);
    } catch (error) {
      try { fs.rmSync(part, { force: true }); } catch { /* 父进程兜底 */ }
      throw wrapExportError(error);
    }
    finalizePptx(part, pptx);
    const { page, context, total } = await openDeckPageForShots(browser, url);
    try {
      const { files, waits } = await captureShots(page, total, shotsDir, { waitStrategy, expectFullSize: true, onPage: (done, all) => progress('screenshots', done, all) });
      return {
        pptx,
        pages: files,
        slideCount: result.slideCount ?? total,
        warnings: Array.isArray(result.warnings) ? result.warnings.length : Number(result.warnings) || 0,
        textObjects: result.textObjects ?? null,
        settleWaitsMs: waits,
      };
    } catch (error) {
      throw wrapExportError(error, '逐页截图失败');
    } finally {
      await context.close().catch(() => {});
    }
  });
}

export { SLIDE_SELECTOR, copyFile };
