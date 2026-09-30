// 读字体文件的 name 表：版权（nameID 0）、许可描述（13）、许可 URL（14），以及字体族名（1）与全名（4）。
// 支持 WOFF2（brotli）、WOFF（zlib）、TTF/OTF。不依赖第三方库。
import fs from 'node:fs';
import zlib from 'node:zlib';

const WOFF2_KNOWN_TAGS = [
  'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT',
  'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH',
  'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar',
  'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill',
];

function readBase128(buf, pos) {
  let value = 0;
  for (let i = 0; i < 5; i += 1) {
    if (pos.offset >= buf.length) throw new Error('WOFF2 表目录被截断');
    const byte = buf[pos.offset];
    pos.offset += 1;
    if (i === 0 && byte === 0x80) throw new Error('WOFF2 UIntBase128 有前导零');
    if (value & 0xfe000000) throw new Error('WOFF2 UIntBase128 溢出');
    value = (value << 7) | (byte & 0x7f);
    if (!(byte & 0x80)) return value >>> 0;
  }
  throw new Error('WOFF2 UIntBase128 超过 5 字节');
}

/** WOFF2 → 取出未变换的 name 表原始字节。 */
function nameTableFromWoff2(buf) {
  if (buf.length < 48) throw new Error('WOFF2 文件太短');
  const numTables = buf.readUInt16BE(12);
  const totalCompressed = buf.readUInt32BE(20);
  const pos = { offset: 48 };
  const tables = [];
  for (let i = 0; i < numTables; i += 1) {
    if (pos.offset >= buf.length) throw new Error('WOFF2 表目录被截断');
    const flags = buf[pos.offset];
    pos.offset += 1;
    const tagIndex = flags & 0x3f;
    const version = flags >> 6;
    let tag;
    if (tagIndex === 63) {
      tag = buf.toString('latin1', pos.offset, pos.offset + 4);
      pos.offset += 4;
    } else {
      tag = WOFF2_KNOWN_TAGS[tagIndex];
    }
    const origLength = readBase128(buf, pos);
    const isGlyfLoca = tag === 'glyf' || tag === 'loca';
    const transformed = isGlyfLoca ? version === 0 : version !== 0;
    const storedLength = transformed ? readBase128(buf, pos) : origLength;
    tables.push({ tag, storedLength });
  }
  const data = zlib.brotliDecompressSync(buf.subarray(pos.offset, pos.offset + totalCompressed));
  let cursor = 0;
  for (const table of tables) {
    if (table.tag === 'name') return data.subarray(cursor, cursor + table.storedLength);
    cursor += table.storedLength;
  }
  return null;
}

function nameTableFromSfnt(buf) {
  const numTables = buf.readUInt16BE(4);
  for (let i = 0; i < numTables; i += 1) {
    const base = 12 + i * 16;
    if (buf.toString('latin1', base, base + 4) === 'name') {
      const offset = buf.readUInt32BE(base + 8);
      const length = buf.readUInt32BE(base + 12);
      return buf.subarray(offset, offset + length);
    }
  }
  return null;
}

function nameTableFromWoff(buf) {
  const numTables = buf.readUInt16BE(12);
  for (let i = 0; i < numTables; i += 1) {
    const base = 44 + i * 20;
    if (buf.toString('latin1', base, base + 4) === 'name') {
      const offset = buf.readUInt32BE(base + 4);
      const compLength = buf.readUInt32BE(base + 8);
      const origLength = buf.readUInt32BE(base + 12);
      const raw = buf.subarray(offset, offset + compLength);
      return compLength < origLength ? zlib.inflateSync(raw) : raw;
    }
  }
  return null;
}

function decodeName(buf, platformId, start, length) {
  const raw = buf.subarray(start, start + length);
  if (platformId === 3 || platformId === 0) {
    const swapped = Buffer.from(raw);
    swapped.swap16();
    return swapped.toString('utf16le');
  }
  return raw.toString('latin1'); // Mac Roman，版权/许可文字基本都是 ASCII
}

/** 解析 name 表，返回 { [nameID]: 字符串 }（同一 nameID 优先取 Windows Unicode、英语记录）。 */
export function parseNameTable(table) {
  if (!table || table.length < 6) return {};
  const count = table.readUInt16BE(2);
  const storage = table.readUInt16BE(4);
  const best = new Map();
  for (let i = 0; i < count; i += 1) {
    const base = 6 + i * 12;
    if (base + 12 > table.length) break;
    const platformId = table.readUInt16BE(base);
    const languageId = table.readUInt16BE(base + 4);
    const nameId = table.readUInt16BE(base + 6);
    const length = table.readUInt16BE(base + 8);
    const offset = table.readUInt16BE(base + 10);
    if (storage + offset + length > table.length) continue;
    const rank = (platformId === 3 && languageId === 0x409 ? 0 : platformId === 3 ? 1 : platformId === 1 ? 2 : 3);
    const text = decodeName(table, platformId, storage + offset, length).replace(/\0/g, '').trim();
    if (!text) continue;
    if (!best.has(nameId) || rank < best.get(nameId).rank) best.set(nameId, { rank, text });
  }
  return Object.fromEntries([...best.entries()].map(([id, item]) => [id, item.text]));
}

/** 读一个字体文件的版权与许可信息。失败抛错（调用方决定怎么报）。 */
export function readFontInfo(file) {
  const buf = fs.readFileSync(file);
  if (buf.length < 12) throw new Error('文件太短，不是字体');
  const magic = buf.toString('latin1', 0, 4);
  let table;
  if (magic === 'wOF2') table = nameTableFromWoff2(buf);
  else if (magic === 'wOFF') table = nameTableFromWoff(buf);
  else if (magic === 'OTTO' || magic === 'true' || buf.readUInt32BE(0) === 0x00010000) table = nameTableFromSfnt(buf);
  else throw new Error(`不认识的字体格式（文件头 ${JSON.stringify(magic)}）`);
  if (!table) throw new Error('字体里没有 name 表');
  const names = parseNameTable(table);
  return {
    family: names[1] || '',
    fullName: names[4] || '',
    version: names[5] || '',
    copyright: names[0] || '',
    licenseDescription: names[13] || '',
    licenseUrl: names[14] || '',
  };
}

const OFL_RE = /open font license|scripts\.sil\.org\/ofl|openfontlicense\.org|\bOFL\b/i;

/** 许可归类：'OFL-1.1' | 'other'（有许可文字但不是 OFL）| null（读不到任何许可信息）。 */
export function classifyLicense(info) {
  const text = `${info.licenseDescription} ${info.licenseUrl}`;
  if (OFL_RE.test(text)) return 'OFL-1.1';
  if (info.licenseDescription || info.licenseUrl) return 'other';
  return null;
}
