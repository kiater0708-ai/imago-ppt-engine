// 主题预览：启用的主题 info 带 JPEG data URI；没有图、不是 JPEG、名字非法时为 null。
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCli, tmpDir } from './helpers.mjs';
import { themePreview } from '../app/lib/layouts.mjs';

const root = tmpDir('imago-preview-');
after(() => fs.rmSync(root, { recursive: true, force: true }));

test('info：启用的主题都有预览 data URI', async () => {
  const res = await runCli('info');
  assert.equal(res.status, 0);
  for (const theme of res.last.themes.filter(item => item.enabled)) {
    assert.match(theme.preview ?? '', /^data:image\/jpeg;base64,\/9j\//, theme.id);
  }
});

test('themePreview：缺图、非 JPEG、超大、非法名字返回 null', () => {
  fs.writeFileSync(path.join(root, 'ok.jpg'), Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
  fs.writeFileSync(path.join(root, 'png.jpg'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  fs.writeFileSync(path.join(root, 'big.jpg'), Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.alloc(201 * 1024)]));
  assert.match(themePreview('ok', root), /^data:image\/jpeg;base64,/);
  assert.equal(themePreview('missing', root), null);
  assert.equal(themePreview('png', root), null);
  assert.equal(themePreview('big', root), null);
  assert.equal(themePreview('../ok', root), null);
});
