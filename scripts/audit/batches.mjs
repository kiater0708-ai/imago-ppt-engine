// 审计分批：一批 ≤size 页、版式不重复；deck 级规则「一份 goal 只能有一个封面候选（page001–005）」所以每批最多放一个封面。
export function isCoverLayout(layout) {
  const match = /_page(\d+)$/.exec(String(layout));
  return Boolean(match) && Number(match[1]) >= 1 && Number(match[1]) <= 5;
}

/**
 * items：[{layout, ...}]（layout 互不相同）。返回批次数组，每批 ≤size 项、至多 1 个封面候选。
 * 封面候选一批放一个（批数不足时自动多开批），其余轮流补到各批里，批与批的大小尽量均匀。
 */
export function makeBatches(items, size = 20) {
  if (!Number.isInteger(size) || size < 2) throw new Error(`批大小必须是 ≥2 的整数：${size}`);
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.layout)) throw new Error(`同一轮里 layout 重复：${item.layout}`);
    seen.add(item.layout);
  }
  if (!items.length) return [];
  const covers = items.filter(item => isCoverLayout(item.layout));
  const others = items.filter(item => !isCoverLayout(item.layout));
  const count = Math.max(Math.ceil(items.length / size), covers.length, 1);
  const batches = Array.from({ length: count }, () => []);
  covers.forEach((item, i) => batches[i].push(item));
  for (const item of others) {
    let target = 0;
    for (let i = 1; i < batches.length; i += 1) if (batches[i].length < batches[target].length) target = i;
    batches[target].push(item);
  }
  return batches.filter(batch => batch.length);
}
