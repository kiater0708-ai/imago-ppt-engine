# 第三方组件与素材清单

本文件由 `scripts/gen-third-party.mjs` 生成。插件自身许可为 AGPL-3.0（见 LICENSE），上游与修改说明见 NOTICE.md。

## 1. 随包分发的运行时

- Node.js：仅在 Windows 发布包里随附（`node/node.exe`，许可原文 `node/LICENSE`）；开发目录不含。

## 2. npm 运行时依赖

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

## 3. 字体

**本软件使用了 OPPO Sans 字体。** 字体随主题页面一起分发，未改动字体文件，不单独分发。OPPO Sans 的许可原文与来源见 `app/runtime/assets/vendor/fonts/oppo-sans-4.0-license-notice.txt`、`oppo-sans-4.0-source.txt`。

其余字体为 SIL Open Font License 1.1 授权（字体文件内嵌的版权与许可元数据如下，逐个读自字体的 name 表 nameID 0 / 13 / 14），OFL-1.1 全文见 `licenses/OFL-1.1.txt`。

逐字体版权与许可（187 个文件）：

| 文件 | 字体 | 版权 | 许可 | 依据 |
|---|---|---|---|---|
| `anton-400-1.woff2` | Anton Regular | Copyright 2020 The Anton Project Authors (https://github.com/googlefonts/AntonFont.git) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `anton-400-2.woff2` | Anton Regular | Copyright 2020 The Anton Project Authors (https://github.com/googlefonts/AntonFont.git) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `anton-400-3.woff2` | Anton Regular | Copyright 2020 The Anton Project Authors (https://github.com/googlefonts/AntonFont.git) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `archivo-400-1.woff2` | Archivo SemiBold Regular | Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `archivo-400-2.woff2` | Archivo SemiBold Regular | Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `archivo-400-3.woff2` | Archivo SemiBold Regular | Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `archivo-500-1.woff2` | Archivo SemiBold Regular | Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `archivo-500-2.woff2` | Archivo SemiBold Regular | Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `archivo-500-3.woff2` | Archivo SemiBold Regular | Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `archivo-600-1.woff2` | Archivo SemiBold Regular | Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `archivo-600-2.woff2` | Archivo SemiBold Regular | Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `archivo-600-3.woff2` | Archivo SemiBold Regular | Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `archivo-700-1.woff2` | Archivo SemiBold Regular | Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `archivo-700-2.woff2` | Archivo SemiBold Regular | Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `archivo-700-3.woff2` | Archivo SemiBold Regular | Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `archivo-800-1.woff2` | Archivo SemiBold Regular | Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `archivo-800-2.woff2` | Archivo SemiBold Regular | Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `archivo-800-3.woff2` | Archivo SemiBold Regular | Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `archivo-900-1.woff2` | Archivo SemiBold Regular | Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `archivo-900-2.woff2` | Archivo SemiBold Regular | Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `archivo-900-3.woff2` | Archivo SemiBold Regular | Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `caveat-400-1.woff2` | Caveat Regular | Copyright 2014 The Caveat Project Authors (https://github.com/googlefonts/caveat) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `caveat-400-2.woff2` | Caveat Regular | Copyright 2014 The Caveat Project Authors (https://github.com/googlefonts/caveat) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `caveat-400-3.woff2` | Caveat Regular | Copyright 2014 The Caveat Project Authors (https://github.com/googlefonts/caveat) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `caveat-400-4.woff2` | Caveat Regular | Copyright 2014 The Caveat Project Authors (https://github.com/googlefonts/caveat) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `caveat-600-1.woff2` | Caveat Regular | Copyright 2014 The Caveat Project Authors (https://github.com/googlefonts/caveat) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `caveat-600-2.woff2` | Caveat Regular | Copyright 2014 The Caveat Project Authors (https://github.com/googlefonts/caveat) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `caveat-600-3.woff2` | Caveat Regular | Copyright 2014 The Caveat Project Authors (https://github.com/googlefonts/caveat) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `caveat-600-4.woff2` | Caveat Regular | Copyright 2014 The Caveat Project Authors (https://github.com/googlefonts/caveat) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `caveat-700-1.woff2` | Caveat Regular | Copyright 2014 The Caveat Project Authors (https://github.com/googlefonts/caveat) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `caveat-700-2.woff2` | Caveat Regular | Copyright 2014 The Caveat Project Authors (https://github.com/googlefonts/caveat) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `caveat-700-3.woff2` | Caveat Regular | Copyright 2014 The Caveat Project Authors (https://github.com/googlefonts/caveat) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `caveat-700-4.woff2` | Caveat Regular | Copyright 2014 The Caveat Project Authors (https://github.com/googlefonts/caveat) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-200-1.woff2` | IBM Plex Mono ExtraLight | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-200-2.woff2` | IBM Plex Mono ExtraLight | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-200-3.woff2` | IBM Plex Mono ExtraLight | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-200-4.woff2` | IBM Plex Mono ExtraLight | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-200-5.woff2` | IBM Plex Mono ExtraLight | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-300-1.woff2` | IBM Plex Mono Light | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-300-2.woff2` | IBM Plex Mono Light | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-300-3.woff2` | IBM Plex Mono Light | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-300-4.woff2` | IBM Plex Mono Light | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-300-5.woff2` | IBM Plex Mono Light | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-400-1.woff2` | IBM Plex Mono Regular | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-400-2.woff2` | IBM Plex Mono Regular | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-400-3.woff2` | IBM Plex Mono Regular | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-400-4.woff2` | IBM Plex Mono Regular | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-400-5.woff2` | IBM Plex Mono Regular | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-400-italic-1.woff2` | IBM Plex Mono Italic | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-400-italic-2.woff2` | IBM Plex Mono Italic | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-400-italic-3.woff2` | IBM Plex Mono Italic | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-400-italic-4.woff2` | IBM Plex Mono Italic | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-400-italic-5.woff2` | IBM Plex Mono Italic | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-500-1.woff2` | IBM Plex Mono Medium | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-500-2.woff2` | IBM Plex Mono Medium | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-500-3.woff2` | IBM Plex Mono Medium | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-500-4.woff2` | IBM Plex Mono Medium | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-500-5.woff2` | IBM Plex Mono Medium | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-600-1.woff2` | IBM Plex Mono SemiBold | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-600-2.woff2` | IBM Plex Mono SemiBold | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-600-3.woff2` | IBM Plex Mono SemiBold | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-600-4.woff2` | IBM Plex Mono SemiBold | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-mono-600-5.woff2` | IBM Plex Mono SemiBold | Copyright 2017 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-200-1.woff2` | IBM Plex Sans ExtraLight | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-200-2.woff2` | IBM Plex Sans ExtraLight | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-200-3.woff2` | IBM Plex Sans ExtraLight | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-200-4.woff2` | IBM Plex Sans ExtraLight | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-200-5.woff2` | IBM Plex Sans ExtraLight | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-200-6.woff2` | IBM Plex Sans ExtraLight | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-300-1.woff2` | IBM Plex Sans Regular | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-300-2.woff2` | IBM Plex Sans Regular | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-300-3.woff2` | IBM Plex Sans Regular | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-300-4.woff2` | IBM Plex Sans Regular | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-300-5.woff2` | IBM Plex Sans Regular | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-300-6.woff2` | IBM Plex Sans Regular | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-400-1.woff2` | IBM Plex Sans Regular | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-400-2.woff2` | IBM Plex Sans Regular | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-400-3.woff2` | IBM Plex Sans Regular | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-400-4.woff2` | IBM Plex Sans Regular | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-400-5.woff2` | IBM Plex Sans Regular | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-400-6.woff2` | IBM Plex Sans Regular | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-500-1.woff2` | IBM Plex Sans Regular | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-500-2.woff2` | IBM Plex Sans Regular | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-500-3.woff2` | IBM Plex Sans Regular | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-500-4.woff2` | IBM Plex Sans Regular | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-500-5.woff2` | IBM Plex Sans Regular | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `ibm-plex-sans-500-6.woff2` | IBM Plex Sans Regular | Copyright 2019 IBM Corp. All rights reserved. | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-400-1.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-400-2.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-400-3.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-400-4.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-400-5.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-400-6.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-400-7.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-500-1.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-500-2.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-500-3.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-500-4.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-500-5.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-500-6.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-500-7.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-600-1.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-600-2.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-600-3.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-600-4.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-600-5.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-600-6.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-600-7.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-700-1.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-700-2.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-700-3.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-700-4.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-700-5.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-700-6.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-700-7.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-800-1.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-800-2.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-800-3.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-800-4.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-800-5.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-800-6.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-800-7.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-900-1.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-900-2.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-900-3.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-900-4.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-900-5.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-900-6.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `inter-900-7.woff2` | Inter Regular | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `jetbrains-mono-400-1.woff2` | JetBrains Mono Regular | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `jetbrains-mono-400-2.woff2` | JetBrains Mono Regular | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `jetbrains-mono-400-3.woff2` | JetBrains Mono Regular | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `jetbrains-mono-400-4.woff2` | JetBrains Mono Regular | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `jetbrains-mono-400-5.woff2` | JetBrains Mono Regular | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `jetbrains-mono-400-6.woff2` | JetBrains Mono Regular | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `jetbrains-mono-500-1.woff2` | JetBrains Mono Regular | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `jetbrains-mono-500-2.woff2` | JetBrains Mono Regular | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `jetbrains-mono-500-3.woff2` | JetBrains Mono Regular | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `jetbrains-mono-500-4.woff2` | JetBrains Mono Regular | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `jetbrains-mono-500-5.woff2` | JetBrains Mono Regular | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `jetbrains-mono-500-6.woff2` | JetBrains Mono Regular | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `jetbrains-mono-600-1.woff2` | JetBrains Mono Regular | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `jetbrains-mono-600-2.woff2` | JetBrains Mono Regular | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `jetbrains-mono-600-3.woff2` | JetBrains Mono Regular | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `jetbrains-mono-600-4.woff2` | JetBrains Mono Regular | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `jetbrains-mono-600-5.woff2` | JetBrains Mono Regular | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `jetbrains-mono-600-6.woff2` | JetBrains Mono Regular | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `newsreader-300-1.woff2` | Newsreader 16pt Italic | Copyright 2020 The Newsreader Project Authors (http://github.com/productiontype/Newsreader) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `newsreader-300-2.woff2` | Newsreader 16pt Italic | Copyright 2020 The Newsreader Project Authors (http://github.com/productiontype/Newsreader) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `newsreader-300-3.woff2` | Newsreader 16pt Italic | Copyright 2020 The Newsreader Project Authors (http://github.com/productiontype/Newsreader) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `newsreader-400-1.woff2` | Newsreader 16pt Italic | Copyright 2020 The Newsreader Project Authors (http://github.com/productiontype/Newsreader) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `newsreader-400-2.woff2` | Newsreader 16pt Italic | Copyright 2020 The Newsreader Project Authors (http://github.com/productiontype/Newsreader) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `newsreader-400-3.woff2` | Newsreader 16pt Italic | Copyright 2020 The Newsreader Project Authors (http://github.com/productiontype/Newsreader) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `newsreader-500-1.woff2` | Newsreader 16pt Italic | Copyright 2020 The Newsreader Project Authors (http://github.com/productiontype/Newsreader) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `newsreader-500-2.woff2` | Newsreader 16pt Italic | Copyright 2020 The Newsreader Project Authors (http://github.com/productiontype/Newsreader) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `newsreader-500-3.woff2` | Newsreader 16pt Italic | Copyright 2020 The Newsreader Project Authors (http://github.com/productiontype/Newsreader) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `newsreader-800-1.woff2` | Newsreader 16pt 16pt ExtraBold Italic | Copyright 2020 The Newsreader Project Authors (http://github.com/productiontype/Newsreader) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `newsreader-800-2.woff2` | Newsreader 16pt 16pt ExtraBold Italic | Copyright 2020 The Newsreader Project Authors (http://github.com/productiontype/Newsreader) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `newsreader-800-3.woff2` | Newsreader 16pt 16pt ExtraBold Italic | Copyright 2020 The Newsreader Project Authors (http://github.com/productiontype/Newsreader) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `newsreader-normal-500-1.woff2` | Newsreader 16pt 16pt Medium | Copyright 2020 The Newsreader Project Authors (http://github.com/productiontype/Newsreader) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `newsreader-normal-500-2.woff2` | Newsreader 16pt 16pt Medium | Copyright 2020 The Newsreader Project Authors (http://github.com/productiontype/Newsreader) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `newsreader-normal-500-3.woff2` | Newsreader 16pt 16pt Medium | Copyright 2020 The Newsreader Project Authors (http://github.com/productiontype/Newsreader) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `newsreader-normal-800-1.woff2` | Newsreader 16pt 16pt ExtraBold | Copyright 2020 The Newsreader Project Authors (http://github.com/productiontype/Newsreader) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `newsreader-normal-800-2.woff2` | Newsreader 16pt 16pt ExtraBold | Copyright 2020 The Newsreader Project Authors (http://github.com/productiontype/Newsreader) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `newsreader-normal-800-3.woff2` | Newsreader 16pt 16pt ExtraBold | Copyright 2020 The Newsreader Project Authors (http://github.com/productiontype/Newsreader) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `oppo-sans-4.0.ttf` | OPPO Sans 4.0 | copyright © 2019-2024 by OPPO. All rights reserved. | 随附许可文件 app/runtime/assets/vendor/fonts/oppo-sans-4.0-license-notice.txt | 随附许可文件 |
| `space-grotesk-300-1.woff2` | Space Grotesk Light Light | Copyright 2020 The Space Grotesk Project Authors (https://github.com/floriankarsten/space-grotesk) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `space-grotesk-300-2.woff2` | Space Grotesk Light Light | Copyright 2020 The Space Grotesk Project Authors (https://github.com/floriankarsten/space-grotesk) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `space-grotesk-300-3.woff2` | Space Grotesk Light Light | Copyright 2020 The Space Grotesk Project Authors (https://github.com/floriankarsten/space-grotesk) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `space-grotesk-400-1.woff2` | Space Grotesk Light | Copyright 2020 The Space Grotesk Project Authors (https://github.com/floriankarsten/space-grotesk) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `space-grotesk-400-2.woff2` | Space Grotesk Light | Copyright 2020 The Space Grotesk Project Authors (https://github.com/floriankarsten/space-grotesk) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `space-grotesk-400-3.woff2` | Space Grotesk Light | Copyright 2020 The Space Grotesk Project Authors (https://github.com/floriankarsten/space-grotesk) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `space-grotesk-500-1.woff2` | Space Grotesk Light | Copyright 2020 The Space Grotesk Project Authors (https://github.com/floriankarsten/space-grotesk) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `space-grotesk-500-2.woff2` | Space Grotesk Light | Copyright 2020 The Space Grotesk Project Authors (https://github.com/floriankarsten/space-grotesk) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `space-grotesk-500-3.woff2` | Space Grotesk Light | Copyright 2020 The Space Grotesk Project Authors (https://github.com/floriankarsten/space-grotesk) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `space-grotesk-600-1.woff2` | Space Grotesk Light | Copyright 2020 The Space Grotesk Project Authors (https://github.com/floriankarsten/space-grotesk) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `space-grotesk-600-2.woff2` | Space Grotesk Light | Copyright 2020 The Space Grotesk Project Authors (https://github.com/floriankarsten/space-grotesk) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `space-grotesk-600-3.woff2` | Space Grotesk Light | Copyright 2020 The Space Grotesk Project Authors (https://github.com/floriankarsten/space-grotesk) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `space-grotesk-700-1.woff2` | Space Grotesk Light | Copyright 2020 The Space Grotesk Project Authors (https://github.com/floriankarsten/space-grotesk) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `space-grotesk-700-2.woff2` | Space Grotesk Light | Copyright 2020 The Space Grotesk Project Authors (https://github.com/floriankarsten/space-grotesk) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `space-grotesk-700-3.woff2` | Space Grotesk Light | Copyright 2020 The Space Grotesk Project Authors (https://github.com/floriankarsten/space-grotesk) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `space-mono-400-1.woff2` | Space Mono Regular | Copyright 2016 The Space Mono Project Authors (https://github.com/googlefonts/spacemono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `space-mono-400-2.woff2` | Space Mono Regular | Copyright 2016 The Space Mono Project Authors (https://github.com/googlefonts/spacemono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `space-mono-400-3.woff2` | Space Mono Regular | Copyright 2016 The Space Mono Project Authors (https://github.com/googlefonts/spacemono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `space-mono-700-1.woff2` | Space Mono Bold | Copyright 2016 The Space Mono Project Authors (https://github.com/googlefonts/spacemono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `space-mono-700-2.woff2` | Space Mono Bold | Copyright 2016 The Space Mono Project Authors (https://github.com/googlefonts/spacemono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |
| `space-mono-700-3.woff2` | Space Mono Bold | Copyright 2016 The Space Mono Project Authors (https://github.com/googlefonts/spacemono) | SIL OFL 1.1（licenses/OFL-1.1.txt） | 字体内嵌元数据 |

## 4. 主题内图片与视频（12 个）

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

## 5. 社交平台图标（4 个）

- `app/runtime/assets/social-icons/bilibili.svg`
- `app/runtime/assets/social-icons/douyin.svg`
- `app/runtime/assets/social-icons/github.svg`
- `app/runtime/assets/social-icons/redbook.svg`

各平台图标的商标归其权利人所有，仅用于标示作者主页链接。

## 6. Unicorn 场景贴图（2 个）

- `app/runtime/assets/unicorn/media/blue_noise_med.png`
- `app/runtime/assets/unicorn/media/font_atlas.png`
