# 绘境 AI 出 PPT 插件

把 goal.json（每页选哪个版式、写什么内容）渲染成网页、校验内容、导出**可编辑的 PPTX** 并逐页截图。
绘境（闭源桌面软件）负责策划与写内容；本插件负责渲染、校验、导出，只通过「命令行 + JSON 文件 + stdout 事件」和绘境交互。

许可 AGPL-3.0，上游与修改说明见 `NOTICE.md`，第三方清单见 `THIRD-PARTY.md`。

## 命令协议（v1）

```text
node app/cli.mjs <命令> --request <请求.json>      # info 可不带 --request
```

- 请求是 JSON 文件，**必带 `"protocol": 1`**，否则报 `BAD_REQUEST`。**所有路径都必须是绝对路径**（包括 `--request` 本身）；Windows 上必须带盘符（`C:\dir`）或是 UNC 路径，`\dir`、`/dir` 这类依赖当前盘符的写法一律拒绝。
- 插件只把输出写进请求指定的目录。输出目录里出现符号链接 / 联接点、目标文件是链接或与原 goal 是同一文件（含硬链接），一律 `BAD_REQUEST`。每次浏览器任务的临时文件放在 `<workDir 或 deckDir>/.tmp/<随机>/`，任务结束（含超时、被强杀）后由父进程删除。插件安装目录只读也能正常运行。
- **协议 v1 只支持单主题**：`check` 要求 goal 里所有版式属于同一主题（与 `themePack` 一致），否则 `BAD_REQUEST`。
- stdout **每行一个 JSON**，其他输出（子进程、调试）只走 stderr：

  ```json
  {"event":"progress","stage":"render","done":3,"total":7}
  {"event":"log","message":"..."}
  {"event":"result", ...}
  {"event":"error","code":"NO_BROWSER","message":"...","detail":{}}
  ```

  最后一行一定是 `result` 或 `error`。
- 退出码：

  | 退出码 | 错误码 | 含义 |
  |---|---|---|
  | 0 | — | 成功（`check` 发现内容问题也是成功，看 result 里的 `ok` 与 `issues`） |
  | 1 | `INTERNAL` | 其他 / 插件内部错误 |
  | 2 | `BAD_REQUEST` | 请求错误（缺 protocol、相对路径、主题不存在…） |
  | 3 | `NO_BROWSER` | 没有可用的 Edge / Chrome，或浏览器启动失败 |
  | 4 | `RENDER_FAILED` | 渲染 / 校验流程自身失败（脚本崩溃、超时）。注意：校验**发现内容问题**不算失败 |
  | 5 | `EXPORT_FAILED` | 导出失败 |
  | 6 | `DISK_FULL` / `IO` | 磁盘写入失败（空间不足 / 其他读写错误） |
  | 130 | `CANCELLED` | 宿主取消：收到 SIGTERM / SIGINT / SIGHUP，插件已先结束自己启动的 worker 与浏览器、清理临时目录，再发 `{"event":"error","code":"CANCELLED"}` 退出 |

- 超时：渲染 120 秒、浏览器检查 180 秒、导出 300 秒。超时会结束子进程与浏览器（POSIX 进程组 + 记录的后代 PID；Windows `taskkill /T /F` + 记录的后代 PID），并报对应错误码（`detail.timeout = true`）。收到 SIGTERM / SIGINT / SIGHUP 时同样先结束子进程、清临时目录，再发 `CANCELLED` 错误事件并以退出码 130 退出。宿主端仍应用作业对象兜底。

### 命令

| 命令 | 请求 | result 字段 |
|---|---|---|
| `info` | — | `pluginVersion`、`protocol`、`engine`、`themes:[{id,name,scenario,audience,preview,enabled}]`（preview 是封面预览 JPEG 的 data URI，没有预览图时为 null；`enabled:false` 的主题宿主不要展示给学员，见下「主题停用」）、`browser:{found,path,kind}` |
| `selftest` | `{protocol, workDir}` | `ok`、`steps`（各步耗时）、`pptx`、`pages` |
| `catalog` | `{protocol, theme, seed, sampleRatio?=0.7}` | `layouts:[{layout,label,roles,cover,summary}]`、`coverCandidates`（同结构，全量）、`stats` |
| `contracts` | `{protocol, theme, layouts:[...]}` | `contracts:{<layout>:{label,fields,arrays,forcedProps,examples,notes,styleControls,...}}` |
| `check` | `{protocol, goal, workDir}` | `ok`、`goal`、`deckDir`、`layoutChanges`、`numberChanges`、`normalized`、`issues`、`timings` |
| `export` | `{protocol, deckDir, pptx, shotsDir?, title?, author?, application?}` | `pptx`、`pages`、`slideCount`、`warnings`、`durationMs` |

**catalog**：先按版式清单（`app/curation/<theme>.json`）与全局规则排除（媒体槽不能隐藏到 0 的版式、contentLocked）；再按 seed 确定性打乱（同 seed 结果完全相同）；按主角色（`roles[0]`，没有角色的归 `_none` 组）分组，每组保留 ⌈ratio×组大小⌉ 个且至少 2 个（组不足 2 个全留）；`coverCandidates` 是排除后的 page001–005 全量。`stats.excludedByReason` 给出被排除原因计数（`curation` / `media` / `contentLocked` / `inspectFailed`）。

**contracts**：每个版式 ≤1500 字符。`forcedProps` 是必须强制写入的数量字段（媒体数量=0），`mediaFields` 里的媒体字段不要写。被排除或不属于该主题的版式报 `BAD_REQUEST`。

**check**：把 goal 复制进 workDir 再处理，**不改原文件**（workDir 里的 goal.json 不能就是原文件）。步骤：数值规整（只修浮点尾差，如 5.199999999999999 → 5.2）+ 页码规整 → 完整性 → write-safe-props（`layoutChanges`；输出必须是结构严格正确的 JSON，否则 `RENDER_FAILED`）→ validate-goal-spec → 渲染（渲染前把 `workDir/ppt/` 整体删除重建，里面的硬链接不会被原地改写）→ swiss → goal-copy → 浏览器可见文字检查。前三步已发现问题时不再渲染，直接返回（`rendered:false`）。`deckDir` 就是 workDir（内含 `goal.json`、`ppt/index.html`）。

**页码规整**：去页之后，模型按计划页数写的页码（如「05 / 15」）与实际页数对不上。`check` 在 workDir 的 goal 副本里按实际页序与实际页数重写这几个字段（不改原文件）：theme02 的 `index`（「NN / 总数」）、theme12 的 `page`（当前页）与 `total`（总页数），保留原有补零宽度与分隔写法；其他主题的页码由组件运行时自己算。改动记在 result 的 `normalized:[{index, layout, field, from, to}]`（没改动为空数组）。同形但不是页码的字段（如 theme04_page051 的评分「5 / 5」）不碰。

`issues[]`：`{index(0 起，未知为 null), layout, field|null, code, message(中文，附大师原文), fixable}`。deck 级问题（如同一版式多页使用、核心文案重复）按大师原文点名的页逐页展开，没点名页号则 `index:null`。禁用词（Roadmap 等）按出现次数核对：页面可见次数 > 我们写入该页 props 文字里的次数，多出来的才算模板残留（所以同一个词在版式里被显示两次而作者只写了一次，会被报）。`code` 固定集合：

| code | 含义 | fixable |
|---|---|---|
| `MISSING_FIELD` | 缺字段 / 为空 / 类型不对 | true |
| `BAD_ARRAY_COUNT` | 数组项数不合法或与数量字段不一致 | true |
| `OUT_OF_RANGE` | 数值超出硬限制 | true |
| `UNKNOWN_PROP` | 版式没有这个属性 | true |
| `OVER_BUDGET` | 文字超出字数预算 | true |
| `TEMPLATE_RESIDUE` | 页面还显示模板默认文字，且对应字段我们没写 | true |
| `HARDCODED_TEXT` | 组件写死的文字（如 IGNIS 燃点），props 修不了 | false |
| `MEDIA_PLACEHOLDER` | 页面出现「图片数量」类占位文字 | false |
| `EMPTY_PAGE` | 运行时页面为空 | false |
| `FLOAT_ARTIFACT` | 页面可见文字出现长尾小数（`\d+\.\d{6,}`，如 5.199999999999999），疑似组件求和未取整；message 带原文片段，按页定位 | false |
| `TEXT_OVERFLOW` | 可见文字超出画布 ≥ 8px / 被自己或所在卡片的 `overflow` 裁掉 / 被画在上面的不透明元素盖住（版面检测，见下） | 能定位到字段 true，否则 false |
| `TEXT_OVERLAP` | 两段可见文字互相压住（相交面积 ≥ 较小者的 30%） | 能定位到字段 true，否则 false |
| `DUP_TEXT` | 可见文字里同一个 ≥2 字的片段紧挨着重复（「万元万元」「陈知远陈知远」），而我们写的 props 里没有这个重复 | 能定位到字段 true，否则 false |
| `VALIDATOR` | 大师校验原文（尽量解析出页号与字段；模板级问题 fixable:false） | 视情况 |

`FLOAT_ARTIFACT`、`TEXT_OVERFLOW`、`TEXT_OVERLAP`、`DUP_TEXT` 是后加的 code（协议版本不变，新增 code 属于向后兼容）：调用方遇到不认识的 code，一律按「不可修」处理（等同 `HARDCODED_TEXT`），不要因此报错。

**export**：同一个浏览器会话、同一个静态服务，先导出 PPTX（先写临时名，成功后改名），再逐页截图 1920×1080 到 `shotsDir`（默认 `<deckDir>/shots`）`p01.png…`。`deckDir` 需含 `ppt/index.html`。截图等待：`document.fonts.ready` + 当前页动画（CSS 动画与 gsap）结束，封顶 2 秒。PPTX 元数据作者默认沿用大师原值，可用 `author` / `application` 覆盖。

### 浏览器探测顺序

环境变量 `IMAGO_PPT_BROWSER` → Windows 注册表 `HKLM` / `HKCU` 的 `App Paths\msedge.exe` → 运行时 `chrome-path.mjs` 的候选（Chrome、Edge 固定路径）→ 非 Windows 开发机可用 playwright 缓存里的 headless shell。都没有报 `NO_BROWSER`。

### 浏览器可见文字检查怎么等

动画不强行快进（避免触发业务回调、改变内容），而是把页面动画调成 10 倍速（CDP `Animation.setPlaybackRate`，gsap 全局时间线 `timeScale` 同样 10 倍）。逐页翻到后重新计时：有限动画/补间跑完、字体加载完，且可见文字稳定 800ms 不变就读，单页上限 1.5 秒。为了 16 页 deck 的 `check` 在约 6 秒内完成，用最多 8 个标签页并行，每个标签页只管一部分页、只往前翻一遍。限制：访问页面后超过约 0.8 秒才由 `setTimeout` 之类挂上来的内容读不到；页面里的无限循环动画不会被等待。

### 版面检测（TEXT_OVERFLOW / TEXT_OVERLAP / DUP_TEXT）

和残留检查在同一次浏览器读数里完成（页面稳定后每页多量一次元素几何，16 页 deck 的 `check` 仍在约 4–6 秒）。只量「有直接文字的可见元素」的真实文字范围（按文字节点量，不是元素盒子），坐标一律换算到 1920×1080 画布。

- **`message` 与 `field`**：把元素文字与该页 props 里的字符串 / 数字比对（相同 > 字段是元素文字的一部分 > 元素文字是长字段的一部分），找到的字段路径填进 `field`（数组用 `items[2].title`）。溢出：「字段 X 的文字太长，超出版面……请缩短到约 M 字」，M 按溢出比例估；重叠：「字段 X 与 Y 的文字互相压住，请缩短其中较长的」，`field` 指向较长的那个；重复：「字段 X 与 Y 拼接后出现重复『…』，请改写其中一个」（只有一个字段含该片段时改成「与页面自带的文字重复」）。找不到字段 `fixable:false`。同一页同一 code 最多 3 条（按严重程度）。
- **装饰与出血不报**：有效透明度（自己与祖先 `opacity` 的乘积 × 文字填充色 alpha）< 0.3、`aria-hidden`、字号 > 160px 且 `pointer-events:none`（水印 / 背景大字的惯用写法）的文字，既不查超出画布、不查被盖住，也不参与重叠；单个符号（引号、箭头）这类没有字母数字的文字不查；无限滚动的跑马灯容器不查裁切。字号大本身不算装饰：不透明的大号正文压住小标签、议程被放成满屏巨字，正是要报的问题。
- **TEXT_OVERFLOW 的四种成因**：① 文字范围超出画布 ≥ 8px（整行在画布外也算）；② 元素自己 `overflow:hidden/clip` 且 `scrollWidth > clientWidth + 2`（或高度），并且文字墨迹（行框竖直方向按字形收窄）越过它自己的裁切框 ≥ 字号的 0.35 倍——大字号 + 行高 < 1 时 scroll 会比 client 多出字形余量，字其实完整可见；`text-overflow:ellipsis` 的元素末尾字已被省略号换掉，不看越界量；被裁的文字已经 ≤ 2 个字、没有可缩时，报 `fixable:false`；③ 文字超出最近的 `overflow:hidden/clip` 祖先（卡片）的可见范围 ≥ 8px，淡到 < 0.1 的水印不查，0.1–0.3 的淡字只在它是个词（≥3 个字母 / 汉字）时才查（序号水印出血是设计）；④ 文字取样点（每行左 / 中 / 右三点）有 ≥ 30% 被「画在它上面」的不透明元素盖住（背景色或渐变色标 alpha ≥ 0.6、图片 / 视频 / 画布；SVG 图形不算；文字自己 `pointer-events:none` 命中不到就不测）。③④ 是在 spec 的两条之外加的，原因见校准一节。
- **TEXT_OVERLAP**：按行取墨迹范围（行框竖直方向收窄到汉字 0.75 / 数字拉丁 0.6，大数字与小标签上下紧挨时行框会相交但字不碰），两段文字墨迹相交面积 ≥ 较小者面积的 30% 且 ≥ 200px²；父子元素、文字完全相同（描边 / 投影叠层）的不算。
- **DUP_TEXT**：对页面 `innerText` 的每一行找 `(\S{2,}?)\1`；片段必须含字母 / 汉字，不是同一个字重复，纯英文片段至少 4 个字符（中文名 + 同样的英文缩写常是设计），该页 props 里没有任何一个字段含「片段+片段」；重复的两处字号相差 ≥ 1.25 倍（大标题 + 小号副标题写同一个词）不报。

**校准**（40 份真实产物，共 572 页，见 `scripts/calibrate-layout.mjs`）：命中 36 页（6.3%）——`TEXT_OVERFLOW` 21 页 / 38 条，`TEXT_OVERLAP` 11 页 / 15 条，`DUP_TEXT` 9 页 / 9 条。36 页里 26 页对着截图逐页看过，10 页（主要是 DUP_TEXT）对照的是看图报告文字和 pptx 里的文字，都没有找到误报；程度轻的两页（theme08 的数字标签擦到说明文字、气泡图标签被气泡压住一角）算真问题但很轻。限制：页面上用 `setTimeout` 等晚挂载的内容、被 `pointer-events:none` 的文字是否被盖住、跨 `clip-path` 的遮挡，检测不到；同页被卡片盖住的文字只有取样点命中才算。重新校准：`node scripts/calibrate-layout.mjs --out <工作目录> --src <产物根目录>[,…]`（`--offline` 只读落盘的探测数据重新判，改阈值不用开浏览器）。

### 主题停用

`app/curation/<theme>.json` 顶层可以写 `"enabled": false`（不写或 `true` = 启用）。`info` 的 `themes[]` 每项带 `enabled` 布尔，宿主（绘境）对 `enabled:false` 的主题不展示给学员。停用只是标记：`catalog` / `contracts` / `check` / `export` 对它们仍可调用，便于以后修。当前停用 theme03、theme04、theme05（真跑里版式问题太多）。清单里 `enabled` 不是布尔，或清单读不出来，`info` 直接报 `INTERNAL`，不会悄悄当成启用。

## 开发

```bash
npm run setup     # 在 app/runtime 里 npm ci（含 tsx、esbuild 等开发依赖）
npm test          # node:test
node scripts/bundle-render.mjs   # 生成渲染 bundle（不生成时 check 回落到 tsx）
node scripts/gen-third-party.mjs # 重新生成 THIRD-PARTY.md
node scripts/compare-shots.mjs --deck <目录> --out <目录>   # 截图等待策略对比
node scripts/calibrate-layout.mjs --out <目录> --src <产物根目录>   # 版面检测阈值校准
```

依赖全部装在 `app/runtime/node_modules`（渲染时要从那里拷贝 gsap 等库进 deck）。Node ≥ 20.11。

## 打包（Windows x64）

```bash
node scripts/build-win.mjs --version 0.1.0 --out dist
```

产出 `dist/imago-ppt-plugin-<版本>-win-x64.zip`：`node/node.exe` 与 `node/LICENSE`（Node v24.21.0，下载后校验 sha256）、`app/`（含只含运行时依赖的 `node_modules`，用 `scripts/prod-deps` 的完整 lock 经 `npm ci --omit=dev --omit=optional` 安装，全部纯 JS）、`licenses/OFL-1.1.txt`、许可文件、`manifest.json`（各文件 sha256 与大小）。THIRD-PARTY.md 逐个读字体 name 表生成版权与许可条目，**读不到许可信息的字体会让打包失败**。下载或 npm 失败会报错退出，不留半成品 zip。
