// 可随机外观控件：select 控件逐个取值渲染，比较页面元素的位置与大小。
// 本文件只放纯函数（枚举取值、几何比较）；渲染与取元素在 browser.mjs / runner.mjs。

export const GEOMETRY_TOLERANCE_PX = 2; // 1920 宽基准

/** 一个 select 控件的全部取值（options 里的 value，去重，保持顺序）。没有 options 返回空数组。 */
export function selectValues(control) {
  const seen = new Set();
  const out = [];
  for (const option of control?.options || []) {
    const value = option && typeof option === 'object' ? option.value : option;
    if (value === undefined || value === null) continue;
    const key = JSON.stringify(value);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

/** 版式的 select 控件：[{key, publicKey, label, default, values}]。取值不足 2 个的没有比较意义，不收。 */
export function selectControls(record) {
  const out = [];
  for (const control of record?.controls || []) {
    if (control.type !== 'select' || !control.key) continue;
    const values = selectValues(control);
    if (values.length < 2) continue;
    out.push({ key: control.key, publicKey: control.publicKey || control.key, label: control.label || '', default: control.default, values });
  }
  return out;
}

/**
 * 比较两份几何快照（每项 [x, y, w, h]，1920 宽基准）。
 * 返回 { same, reason, maxDiff }。元素数量不同直接不同；任一元素任一分量差超过容差也不同。
 */
export function compareGeometry(base, other, tolerance = GEOMETRY_TOLERANCE_PX) {
  if (!Array.isArray(base) || !Array.isArray(other)) return { same: false, reason: '缺少几何快照', maxDiff: null };
  if (base.length !== other.length) return { same: false, reason: `元素数量 ${base.length} → ${other.length}`, maxDiff: null };
  let maxDiff = 0;
  for (let i = 0; i < base.length; i += 1) {
    for (let k = 0; k < 4; k += 1) {
      const a = Number(base[i]?.[k]);
      const b = Number(other[i]?.[k]);
      if (!Number.isFinite(a) || !Number.isFinite(b)) return { same: false, reason: `第 ${i} 个元素几何值无效`, maxDiff: null };
      const diff = Math.abs(a - b);
      if (diff > maxDiff) maxDiff = diff;
      if (diff > tolerance) return { same: false, reason: `第 ${i} 个元素 ${['x', 'y', '宽', '高'][k]} 相差 ${diff.toFixed(1)}px`, maxDiff };
    }
  }
  return { same: true, reason: '', maxDiff };
}

/**
 * 一个控件的所有取值与基线（默认值渲染）比较：全部相同才算只改外观。
 * results：[{value, geometry|null, base?, error?}]；每项自带同一 deck 里渲染的 base，没有才用 baseGeometry。
 */
export function judgeControl(baseGeometry, results, tolerance = GEOMETRY_TOLERANCE_PX) {
  if (!results.length) return { safe: false, reason: '没有可比较的取值' };
  for (const item of results) {
    if (item.error || !Array.isArray(item.geometry)) return { safe: false, reason: `取值 ${JSON.stringify(item.value)} 渲染失败：${item.error || '没有快照'}` };
    const base = item.base ?? baseGeometry;
    if (!Array.isArray(base)) return { safe: false, reason: '基线没有几何快照' };
    const cmp = compareGeometry(base, item.geometry, tolerance);
    if (!cmp.same) return { safe: false, reason: `取值 ${JSON.stringify(item.value)}：${cmp.reason}` };
  }
  return { safe: true, reason: '' };
}
