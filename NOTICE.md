# NOTICE

本项目（绘境 AI 出 PPT 插件）以 **GNU AGPL-3.0** 发布（见 `LICENSE`）。它由以下上游成果改造而来。

## 上游来源

1. **dashi-ppt-skill**（chuspeeism/dashi-ppt-skill）
   主题、版式组件、校验脚本等来自该项目，许可 AGPL-3.0。
2. **大师 PPT 增强版 v0.4.1**（作者 mujingquan835 的公开增强版）
   本插件的运行时（`app/runtime/`）以这一版为基础。
3. **导出引擎 html-deck-to-pptx**
   取上游 v0.2.7（提交 2c33503），许可 **MIT**。原版权与许可文本原样保留在
   `app/runtime/packages/html-deck-to-pptx/LICENSE`。

## 我们的修改

- **导出引擎 5 项「imago 改」**（在 `app/runtime/packages/html-deck-to-pptx/src/` 内，搜索「imago 改」可见）：
  1. 背景超大装饰字（ghost 字）的透明度阈值由 8% 降到 1.5%，不再被当作装饰丢掉；
  2. 主题禁止伪斜体且网页字体没有斜体字形时，按正体导出，避免 PowerPoint 把字压斜；
  3. 字体映射：`OPPO Sans → Microsoft YaHei`，WPS 等环境不再把字体替换成手写体/宋体；
  4. 大字基线对齐：固定行距小于字号的大字，按 OPPO Sans 字体上沿重算位置；
  5. 上沿比例改为在浏览器里实测（Windows 与 Mac 的字体度量不同），量不到才回落 Mac 值。
- **主题组件 3 处「imago 改」**（`app/runtime/dist/theme-runtime/` 内，搜索「imago 改」可见；每处同时改了 `themeNN.module.mjs` 与 `imported-theme-runtime.themeNN.js` 两份）：求和结果取整，防浮点尾差——`theme06`（page017 瀑布图合计）、`theme08`（page024 贡献瀑布总计）、`theme11`（page039 叠加柱柱顶合计）。共 6 个文件：`theme06.module.mjs`、`imported-theme-runtime.theme06.js`、`theme08.module.mjs`、`imported-theme-runtime.theme08.js`、`theme11.module.mjs`、`imported-theme-runtime.theme11.js`。
- **命令行程序**（`app/cli.mjs`、`app/worker.mjs`、`app/lib/`）：`info` / `selftest` / `catalog` / `contracts` / `check` / `export` 六个命令与 JSON 协议。
- **版式清单**（`app/curation/`）：每套主题的排除表、版式说明、可随机控件白名单。
- **预打包**：渲染脚本由 esbuild 预打包成 `render-goal-deck.bundle.mjs`（源码 `render-goal-deck.jsx` 保留），发布包不带 tsx / esbuild。
- **打包脚本**（`scripts/`）：Windows 发布包构建、第三方清单生成。

## 与绘境（Imago）的关系

绘境是一个独立的桌面软件。它通过**命令行 + JSON 文件 + stdout 事件**调用本插件，
**不包含**本插件的代码，本插件也不包含绘境的代码。

## 字体

本软件使用了 **OPPO Sans 4.0** 字体（Guangdong OPPO Mobile Telecommunications Corp., Ltd.），
未做任何修改，随主题页面一起分发；许可原文见
`app/runtime/assets/vendor/fonts/oppo-sans-4.0-license-notice.txt`。
其余字体为 SIL OFL 1.1（全文 `licenses/OFL-1.1.txt`，逐字体版权见 `THIRD-PARTY.md`）。Windows 发布包随附 Node.js（`node/node.exe`），许可原文见 `node/LICENSE`。其余第三方组件与素材见 `THIRD-PARTY.md`。

> 本文件是对来源与许可的说明，不是法律意见。
