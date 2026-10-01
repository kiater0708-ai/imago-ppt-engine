// 主题停用：版式清单顶层 enabled:false → info 的 themes[].enabled 为 false；停用的主题各命令仍可调用。
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCli, tmpDir } from './helpers.mjs';
import { validateCuration, isThemeEnabled, loadCuration, emptyCuration } from '../app/lib/curation.mjs';

const root = tmpDir('imago-enabled-');
after(() => fs.rmSync(root, { recursive: true, force: true }));

test('info：每个主题带 enabled 布尔；theme03、theme04、theme05 停用，其余启用', async () => {
  const res = await runCli('info');
  assert.equal(res.status, 0);
  const themes = res.last.themes;
  assert.equal(themes.length, 12);
  for (const theme of themes) assert.equal(typeof theme.enabled, 'boolean', theme.id);
  assert.deepEqual(themes.filter(theme => !theme.enabled).map(theme => theme.id), ['theme03', 'theme04', 'theme05']);
});

test('停用的主题各命令仍可调用（catalog 照常出结果），info 之外的字段不变', async () => {
  const res = await runCli('catalog', { request: { protocol: 1, theme: 'theme03', seed: 'x' } });
  assert.equal(res.status, 0, res.stderr.slice(0, 300));
  assert.ok(res.last.layouts.length > 0);
});

test('validateCuration：enabled 只接受布尔；不写合法', () => {
  const base = emptyCuration('theme03');
  assert.deepEqual(validateCuration(base, 'theme03'), []);
  assert.deepEqual(validateCuration({ ...base, enabled: false }, 'theme03'), []);
  assert.deepEqual(validateCuration({ ...base, enabled: true }, 'theme03'), []);
  assert.match(validateCuration({ ...base, enabled: 'false' }, 'theme03').join(), /enabled 必须是布尔值/);
});

test('isThemeEnabled：没写 / true → 启用；false → 停用；清单格式错误直接抛 INTERNAL，不默认成启用', () => {
  const write = (theme, data) => fs.writeFileSync(path.join(root, `${theme}.json`), typeof data === 'string' ? data : JSON.stringify(data));
  write('theme01', emptyCuration('theme01'));
  write('theme02', { ...emptyCuration('theme02'), enabled: false });
  write('theme06', { ...emptyCuration('theme06'), enabled: 'no' });
  write('theme07', '{oops');
  assert.equal(isThemeEnabled('theme01', root), true);
  assert.equal(isThemeEnabled('theme02', root), false);
  assert.equal(isThemeEnabled('theme08', root), true, '清单文件不存在按空清单处理 = 启用');
  assert.throws(() => isThemeEnabled('theme06', root), error => error.code === 'INTERNAL' && /格式错误/.test(error.message));
  assert.throws(() => isThemeEnabled('theme07', root), error => error.code === 'INTERNAL' && /解析失败/.test(error.message));
  assert.equal(loadCuration('theme02', root).enabled, false);
});
