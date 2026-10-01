import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCli, PLUG } from './helpers.mjs';
import { keepCount, seededShuffle } from '../app/lib/layouts.mjs';
import { validateCuration } from '../app/lib/curation.mjs';

const catalog = (theme, seed, extra = {}) => runCli('catalog', { request: { protocol: 1, theme, seed, ...extra } }).then(res => {
  assert.equal(res.status, 0, res.stderr.slice(0, 400));
  assert.equal(res.last.event, 'result');
  return res.last;
});

test('catalog：同 seed 两次结果完全相同', async () => {
  const a = await catalog('theme11', 'seed-A');
  const b = await catalog('theme11', 'seed-A');
  assert.deepEqual(a, b);
  const c = await catalog('theme08', 42);
  const d = await catalog('theme08', 42);
  assert.deepEqual(c, d);
});

test('catalog：不同 seed 顺序不同', async () => {
  const a = await catalog('theme11', 'seed-A');
  const b = await catalog('theme11', 'seed-B');
  assert.notDeepEqual(a.layouts.map(item => item.layout), b.layouts.map(item => item.layout));
});

test('catalog：被排除的版式不出现（theme11 与 theme08）', async () => {
  const exclude = { theme11: ['theme11_page008', 'theme11_page013', 'theme11_page071', 'theme11_page083'], theme08: ['theme08_page082'] };
  for (const [theme, ids] of Object.entries(exclude)) {
    for (const seed of ['s1', 's2', 's3']) {
      const result = await catalog(theme, seed, { sampleRatio: 1 });
      const shown = new Set([...result.layouts, ...result.coverCandidates].map(item => item.layout));
      for (const id of ids) assert.equal(shown.has(id), false, `${id} 不应出现`);
    }
  }
});

test('catalog：封面候选都在 page001–005，且是排除后的全量（不受抽样影响）', async () => {
  for (const theme of ['theme11', 'theme08', 'theme01']) {
    const full = await catalog(theme, 'x', { sampleRatio: 1 });
    const sampled = await catalog(theme, 'x', { sampleRatio: 0.3 });
    assert.ok(full.coverCandidates.length > 0);
    for (const item of full.coverCandidates) {
      const number = Number(/page(\d+)$/.exec(item.layout)[1]);
      assert.ok(number >= 1 && number <= 5, `${item.layout} 不在 page001–005`);
      assert.equal(item.cover, true);
    }
    assert.deepEqual(sampled.coverCandidates.map(item => item.layout), full.coverCandidates.map(item => item.layout));
  }
});

test('catalog：按角色分组抽样，每组保留 ⌈ratio×n⌉ 且至少 2 个（组不足 2 个全留）', async () => {
  const result = await catalog('theme11', 'seed-A');
  for (const [group, stat] of Object.entries(result.stats.roleGroups)) {
    assert.equal(stat.kept, keepCount(stat.size, 0.7), `${group} 保留数`);
    assert.ok(stat.kept >= Math.min(2, stat.size), `${group} 至少 2 个`);
  }
  const keptTotal = Object.values(result.stats.roleGroups).reduce((sum, item) => sum + item.kept, 0);
  assert.equal(keptTotal, result.layouts.length);
  assert.equal(result.stats.sampled, result.layouts.length);
});

test('keepCount：⌈ratio×n⌉，至少 2，浮点误差不多进一位', () => {
  assert.equal(keepCount(1, 0.7), 1);
  assert.equal(keepCount(2, 0.7), 2);
  assert.equal(keepCount(3, 0.5), 2);
  assert.equal(keepCount(10, 0.7), 7); // 0.7*10 = 7.000000000000001，不能变 8
  assert.equal(keepCount(30, 0.7), 21);
  assert.equal(keepCount(5, 1), 5);
});

test('seededShuffle：确定性，不改原数组，是排列', () => {
  const items = Array.from({ length: 30 }, (_, i) => `x${i}`);
  const copy = [...items];
  const a = seededShuffle(items, 'k');
  assert.deepEqual(items, copy);
  assert.deepEqual(a, seededShuffle(items, 'k'));
  assert.deepEqual([...a].sort(), [...items].sort());
  assert.notDeepEqual(a, seededShuffle(items, 'k2'));
});

test('catalog：stats 给出被排除原因计数', async () => {
  const result = await catalog('theme11', 'seed-A');
  const t11File = JSON.parse(fs.readFileSync(path.join(PLUG, 'app', 'curation', 'theme11.json'), 'utf8'));
  assert.equal(result.stats.excludedByReason.curation, t11File.exclude.length, '清单里的排除项（手工 + 审计自动写入）都按 curation 计');
  assert.ok(result.stats.excludedByReason.media > 0);
  assert.equal(result.stats.total, result.stats.candidates + result.stats.excluded);
  for (const item of result.layouts) {
    assert.ok(item.layout && item.label !== undefined && Array.isArray(item.roles) && typeof item.cover === 'boolean' && item.summary);
  }
  const wf = result.stats.excludedLayouts.find(item => item.layout === 'theme11_page008');
  assert.equal(wf.category, 'curation');
});

test('catalog：summary 里带清单说明（theme11 page040 / page059）', async () => {
  const result = await catalog('theme11', 'seed-A', { sampleRatio: 1 });
  const p40 = result.layouts.find(item => item.layout === 'theme11_page040');
  assert.ok(p40 && p40.summary.includes('说明 瀑布图'));
});

test('contracts：≤1500 字符、嵌套路径按嵌套结构、notes 与 styleControls 来自清单', async () => {
  const res = await runCli('contracts', { request: { protocol: 1, theme: 'theme11', layouts: ['theme11_page040', 'theme11_page059', 'theme11_page001'] } });
  assert.equal(res.status, 0, res.stderr.slice(0, 400));
  const { contracts } = res.last;
  assert.deepEqual(Object.keys(contracts).sort(), ['theme11_page001', 'theme11_page040', 'theme11_page059']);
  for (const [id, contract] of Object.entries(contracts)) {
    assert.ok(JSON.stringify(contract).length <= 1500, `${id} 契约超过 1500 字符`);
    for (const key of ['fields', 'arrays', 'examples', 'notes', 'styleControls']) assert.ok(key in contract, `${id} 缺 ${key}`);
    assert.ok(Array.isArray(contract.styleControls));
  }
  assert.match(contracts.theme11_page040.notes, /瀑布图/);
  assert.equal(contracts.theme11_page001.notes, null);
  assert.ok(contracts.theme11_page040.examples['不可写的结构字段']);
});

test('contracts：12 套主题所有可用版式的契约都 ≤1500 字符（无 oversize）', async () => {
  const { loadEngine, prepareLayouts, buildContracts } = await import('../app/lib/layouts.mjs');
  const { loadCuration } = await import('../app/lib/curation.mjs');
  const engine = await loadEngine();
  let total = 0;
  for (const pack of engine.THEME_PACKS) {
    const curation = loadCuration(pack.key);
    const { candidates } = prepareLayouts(engine, pack.key, curation);
    const { contracts, oversize } = buildContracts(engine, candidates, [...candidates.keys()], curation);
    total += Object.keys(contracts).length;
    assert.deepEqual(oversize, [], `${pack.key} 有超长契约`);
  }
  assert.ok(total > 500);
});

test('curation：12 个文件格式正确，引用的版式都真实存在；theme11 / theme08 初值', async () => {
  const { loadEngine, themeLayoutKeys } = await import('../app/lib/layouts.mjs');
  const engine = await loadEngine();
  for (const pack of engine.THEME_PACKS) {
    const file = path.join(PLUG, 'app', 'curation', `${pack.key}.json`);
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.deepEqual(validateCuration(data, pack.key), [], file);
    const keys = new Set(themeLayoutKeys(engine, pack.key));
    for (const id of [...data.exclude.map(item => item.layout), ...Object.keys(data.notes), ...Object.keys(data.styleControls)]) {
      assert.ok(keys.has(id), `${pack.key}.json 里的 ${id} 不存在`);
    }
  }
  const t11 = JSON.parse(fs.readFileSync(path.join(PLUG, 'app', 'curation', 'theme11.json'), 'utf8'));
  const manual = list => list.filter(item => !item.reason.startsWith('auto:'));
  assert.deepEqual(manual(t11.exclude).map(item => item.layout).sort(), ['theme11_page008', 'theme11_page013', 'theme11_page071', 'theme11_page083'], '手工条目保持不动');
  assert.deepEqual(Object.keys(t11.notes).sort(), ['theme11_page040', 'theme11_page059']);
  const t08 = JSON.parse(fs.readFileSync(path.join(PLUG, 'app', 'curation', 'theme08.json'), 'utf8'));
  assert.deepEqual(manual(t08.exclude).map(item => item.layout), ['theme08_page082']);
});
