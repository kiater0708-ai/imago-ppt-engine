# 第三方组件与素材清单

本文件由 `scripts/gen-third-party.mjs` 生成。插件自身许可为 AGPL-3.0（见 LICENSE），上游与修改说明见 NOTICE.md。

## 1. npm 运行时依赖

共 32 个包（运行时依赖及其传递依赖；不含 tsx、esbuild 等开发依赖，它们不进发布包）。

| 包 | 版本 | 许可 |
|---|---|---|
| @pdf-lib/standard-fonts | 1.0.0 | MIT |
| @pdf-lib/upng | 1.0.1 | MIT |
| @types/node | 22.19.19 | MIT |
| core-util-is | 1.0.3 | MIT |
| gsap | 3.15.0 | Standard 'no charge' license: https://gsap.com/standard-license. |
| html-to-image | 1.11.13 | MIT |
| https | 1.0.0 | ISC |
| image-size | 1.2.1 | MIT |
| immediate | 3.0.6 | MIT |
| inherits | 2.0.4 | ISC |
| isarray | 1.0.0 | MIT |
| js-tokens | 4.0.0 | MIT |
| jszip | 3.10.1 | (MIT OR GPL-3.0-or-later) |
| lie | 3.3.0 | MIT |
| loose-envify | 1.4.0 | MIT |
| pako | 1.0.11 | (MIT AND Zlib) |
| pdf-lib | 1.17.1 | MIT |
| playwright-core | 1.60.0 | Apache-2.0 |
| pngjs | 7.0.0 | MIT |
| pptxgenjs | 4.0.1 | MIT |
| process-nextick-args | 2.0.1 | MIT |
| queue | 6.0.2 | MIT |
| react | 18.3.1 | MIT |
| react-dom | 18.3.1 | MIT |
| readable-stream | 2.3.8 | MIT |
| safe-buffer | 5.1.2 | MIT |
| scheduler | 0.23.2 | MIT |
| setimmediate | 1.0.5 | MIT |
| string_decoder | 1.1.1 | MIT |
| tslib | 1.14.1 | 0BSD |
| undici-types | 6.21.0 | MIT |
| util-deprecate | 1.0.2 | MIT |

## 2. 字体

### 2.1 OPPO Sans 4.0

**本软件使用了 OPPO Sans 字体。** 字体随主题页面一起分发，未改动字体文件，不单独分发；许可原文与来源随包附带：

- `app/runtime/assets/vendor/fonts/oppo-sans-4.0-license-notice.txt`
- `app/runtime/assets/vendor/fonts/oppo-sans-4.0-source.txt`
- `app/runtime/assets/vendor/fonts/oppo-sans-4.0.ttf`

### 2.2 其他随附字体（`app/runtime/assets/vendor/fonts/`）

| 字体族（按文件名归类） | 文件数 |
|---|---|
| anton | 3 |
| archivo | 18 |
| caveat | 12 |
| ibm-plex-mono | 25 |
| ibm-plex-mono-400-italic | 5 |
| ibm-plex-sans | 24 |
| inter | 42 |
| jetbrains-mono | 18 |
| newsreader | 12 |
| newsreader-normal | 6 |
| space-grotesk | 15 |
| space-mono | 6 |

这些字体来自上游运行时，源码树内没有逐个的许可原文文件；常见理解是它们为开源字体（多为 SIL OFL 1.1），正式公开前需逐个核对并补许可原文。

## 3. 主题内图片与视频（12 个）

位于 `app/runtime/src/components/themes/` 下，随各主题一起分发。逐文件清单：

- `app/runtime/src/components/themes/theme03/source/assets/3d/01.png`
- `app/runtime/src/components/themes/theme03/source/assets/3d/02.png`
- `app/runtime/src/components/themes/theme03/source/assets/3d/03.png`
- `app/runtime/src/components/themes/theme03/source/assets/3d/04.png`
- `app/runtime/src/components/themes/theme03/source/assets/3d/05.png`
- `app/runtime/src/components/themes/theme03/source/assets/3d/06.png`
- `app/runtime/src/components/themes/theme03/source/assets/3d/07.png`
- `app/runtime/src/components/themes/theme03/source/assets/3d/08.png`
- `app/runtime/src/components/themes/theme03/source/assets/3d/09.png`
- `app/runtime/src/components/themes/theme03/source/assets/3d/10.png`
- `app/runtime/src/components/themes/theme03/source/assets/3d/11.png`
- `app/runtime/src/components/themes/theme03/source/assets/3d/12.png`

## 4. 社交平台图标（4 个）

- `app/runtime/assets/social-icons/bilibili.svg`
- `app/runtime/assets/social-icons/douyin.svg`
- `app/runtime/assets/social-icons/github.svg`
- `app/runtime/assets/social-icons/redbook.svg`

各平台图标的商标归其权利人所有，仅用于标示作者主页链接。

## 5. Unicorn 场景贴图（2 个）

- `app/runtime/assets/unicorn/media/blue_noise_med.png`
- `app/runtime/assets/unicorn/media/font_atlas.png`
