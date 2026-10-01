// 总览图：每张 4×5 格，每格是该版式标记填充后的缩略图，左上角标版式编号，自动排除的格子加红框并写类别。
// 做法：拼一个静态 HTML（图片相对路径引用同目录的 jpg），交给 playwright 逐张截图（见 browser.mjs 的 renderSheets）。
export const SHEET_COLS = 4;
export const SHEET_ROWS = 5;
export const SHEET_PER_PAGE = SHEET_COLS * SHEET_ROWS;
export const CELL_W = 470;
export const IMG_H = 264;
export const CAPTION_H = 30;

const CATEGORY_LABEL = { hardcoded: '写死文字', media: '图片主体', brandIcon: '品牌图标' };

function esc(text) {
  return String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

/** 版式编号：theme11_page008 → p008。 */
export function layoutNumber(layout) {
  const match = /_page(\d+)$/.exec(String(layout));
  return match ? `p${match[1]}` : String(layout);
}

/**
 * cells：[{layout, shot|null, categories:[], manual:boolean, error?:string, uncertain:boolean}]，已按版式编号排序。
 * 返回 { html, sheetCount }。图片 src 用 imgBase 下的相对文件名（shot 给相对路径）。
 */
export function buildSheetsHtml(cells) {
  const sheets = [];
  for (let i = 0; i < cells.length; i += SHEET_PER_PAGE) sheets.push(cells.slice(i, i + SHEET_PER_PAGE));
  if (!sheets.length) sheets.push([]);
  const body = sheets.map((sheet, index) => {
    const items = sheet.map(cell => {
      const auto = cell.categories.length > 0;
      const border = auto ? '#e5262b' : cell.manual ? '#e8a13a' : cell.uncertain ? '#d9c93c' : '#d8d8d8';
      const caption = cell.error
        ? `渲染失败：${esc(cell.error).slice(0, 40)}`
        : auto ? cell.categories.map(category => CATEGORY_LABEL[category] || category).join(' / ')
          : cell.manual ? '人工排除' : cell.uncertain ? '待人工确认' : '';
      const image = cell.shot
        ? `<img src="${esc(cell.shot)}" width="${CELL_W}" height="${IMG_H}" alt="">`
        : `<div class="blank">${esc(cell.error ? '无截图' : '无截图')}</div>`;
      return `<div class="cell" style="border-color:${border}">${image}<span class="no">${esc(layoutNumber(cell.layout))}</span><div class="cap${auto ? ' red' : ''}">${caption}</div></div>`;
    }).join('');
    return `<section class="sheet" data-sheet="${index + 1}">${items}</section>`;
  }).join('\n');
  const html = `<!doctype html>
<html lang="zh"><head><meta charset="utf-8"><title>版式总览</title>
<style>
html,body{margin:0;background:#fff;font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
.sheet{display:grid;grid-template-columns:repeat(${SHEET_COLS},${CELL_W + 6}px);grid-auto-rows:${IMG_H + CAPTION_H + 6}px;gap:4px;padding:4px;width:${SHEET_COLS * (CELL_W + 6 + 4) + 4}px;height:${SHEET_ROWS * (IMG_H + CAPTION_H + 6 + 4) + 4}px;box-sizing:border-box;background:#fff;margin-bottom:20px}
.cell{position:relative;border:3px solid #d8d8d8;overflow:hidden;background:#f3f3f3}
.cell img{display:block;object-fit:cover}
.blank{width:${CELL_W}px;height:${IMG_H}px;display:flex;align-items:center;justify-content:center;color:#999;font-size:20px}
.no{position:absolute;left:0;top:0;background:rgba(0,0,0,.72);color:#fff;font-size:20px;font-weight:700;padding:2px 8px}
.cap{height:${CAPTION_H}px;line-height:${CAPTION_H}px;padding:0 8px;font-size:18px;color:#444;white-space:nowrap;overflow:hidden}
.cap.red{color:#e5262b;font-weight:700}
</style></head><body>
${body}
</body></html>
`;
  return { html, sheetCount: sheets.length };
}
