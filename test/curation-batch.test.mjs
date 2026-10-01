// 版式清单：看图批量修复后的手工排除与 notes 的一致性
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine, prepareLayouts, buildContracts, isCover } from '../app/lib/layouts.mjs';
import { loadCuration } from '../app/lib/curation.mjs';

const THEMES = Array.from({ length: 12 }, (_, i) => `theme${String(i + 1).padStart(2, '0')}`);

// 看图批量修复新增的手工排除（reason 带看图编号）
const BATCH_EXCLUDES = [
  'theme10_page020', 'theme10_page093', 'theme10_page069', 'theme03_page027', 'theme03_page031', 'theme03_page039', 'theme03_page077',
  'theme03_page020', 'theme03_page068', 'theme03_page006', 'theme09_page012', 'theme05_page025', 'theme05_page085', 'theme05_page006',
  'theme05_page074', 'theme05_page038', 'theme04_page031', 'theme04_page010', 'theme04_page053', 'theme04_page022', 'theme12_page048',
  'theme12_page034', 'theme06_page068', 'theme06_page009', 'theme07_page010', 'theme01_page037', 'theme11_page040',
];

test('看图批量排除 27 条：都是真实版式、手工条目（非 auto:）、reason 带看图编号；排除的版式不再带 notes', async () => {
  const engine = await loadEngine();
  const all = new Map();
  for (const theme of THEMES) {
    const curation = loadCuration(theme);
    const keys = new Set(engine.THEME_PAGES.filter(page => page.themeKey === theme).map(page => page.key));
    const seen = new Set();
    for (const item of curation.exclude) {
      assert.ok(keys.has(item.layout), `${item.layout} 不是 ${theme} 的版式`);
      assert.ok(!seen.has(item.layout), `${item.layout} 重复排除`);
      seen.add(item.layout);
      assert.equal(curation.notes[item.layout], undefined, `${item.layout} 已排除，不该再带 notes`);
      all.set(item.layout, item.reason);
    }
  }
  assert.equal(BATCH_EXCLUDES.length, 27);
  for (const layout of BATCH_EXCLUDES) {
    assert.ok(all.has(layout), `${layout} 应在 exclude 里`);
    assert.ok(!all.get(layout).startsWith('auto:'), `${layout} 必须是手工条目（auto: 条目会被审计重跑覆盖）`);
    assert.match(all.get(layout), /看图 [A-D]\d+/, `${layout} 的原因要带看图编号`);
  }
});

test('带 notes 的版式契约不超 1500 字符，且都在可用候选里', async () => {
  const engine = await loadEngine();
  for (const theme of THEMES) {
    const curation = loadCuration(theme);
    const { candidates } = prepareLayouts(engine, theme, curation);
    const ids = Object.keys(curation.notes);
    for (const id of ids) assert.ok(candidates.has(id), `${theme} 的 notes 版式 ${id} 不在可用候选里`);
    const { contracts, oversize } = buildContracts(engine, candidates, ids, curation);
    assert.deepEqual(oversize, [], `${theme} 契约超限`);
    for (const id of ids) assert.equal(contracts[id].notes, curation.notes[id]);
  }
});

test('每套主题仍有可用封面（page001–005），没有因为手工排除变空', async () => {
  const engine = await loadEngine();
  for (const theme of THEMES) {
    const { candidates } = prepareLayouts(engine, theme, loadCuration(theme));
    const covers = [...candidates.values()].filter(isCover).length;
    assert.ok(covers >= 2, `${theme} 可用封面只剩 ${covers} 个`);
  }
});
