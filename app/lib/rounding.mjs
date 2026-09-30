// 数值取整：只修浮点尾差（如 5.199999999999999 → 5.2），不改真实数值。
// 规则：取 6 位有效数字，只有当它与原值的相对差 ≤ 1e-8 时才替换。
// 6 位有效数字是显示精度上限；相对差判据保证真实的 3.14159265 这类值原样保留。
// numericBounds 只有范围没有小数位信息，不参与取整。
const REL_TOLERANCE = 1e-8;

export function roundFloatTail(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || Number.isInteger(value)) return value;
  const rounded = Number(value.toPrecision(6));
  if (rounded === value) return value;
  return Math.abs(rounded - value) <= Math.abs(value) * REL_TOLERANCE ? rounded : value;
}

/** 递归规整 props 里的所有 number，直接改传入对象。返回改动列表 [{path, from, to}]。 */
export function normalizeNumbers(node, basePath = '', changes = []) {
  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      if (typeof item === 'number') {
        const next = roundFloatTail(item);
        if (next !== item) { node[index] = next; changes.push({ path: `${basePath}[${index}]`, from: item, to: next }); }
      } else normalizeNumbers(item, `${basePath}[${index}]`, changes);
    });
  } else if (node && typeof node === 'object') {
    for (const [key, item] of Object.entries(node)) {
      const here = basePath ? `${basePath}.${key}` : key;
      if (typeof item === 'number') {
        const next = roundFloatTail(item);
        if (next !== item) { node[key] = next; changes.push({ path: here, from: item, to: next }); }
      } else normalizeNumbers(item, here, changes);
    }
  }
  return changes;
}
