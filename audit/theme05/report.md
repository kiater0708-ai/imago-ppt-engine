# theme05 版式审计

- 版式总数 94；参与审计 94；现有规则已排除（媒体槽隐藏不了 / contentLocked / inspect 失败）0
- 本次自动排除 23 个：写死文字 22、图片主体 1、品牌图标 0（一个版式命中多类时每类各计一次）
- 人工排除（审计时仍渲染，用来核对判定）0；渲染失败 0；待人工确认 1
- select 控件共 154 个，判定为只改外观（可随机）138 个
- 耗时：标记渲染 29 秒（94 页）；控件检查 5 分 24 秒（1178 页）；合计 5 分 53 秒
- 清单写入：新增自动排除 23 条、清掉旧的自动排除 31 条、styleControls 138 条

## 自动排除（23）

| 版式 | 名称 | 类别 | 证据 | 已有人工排除 |
|---|---|---|---|---|
| p001 | 封面 精益智造 | 写死文字 | 写死文字：项指标 |  |
| p003 | 封面 链通全国 | 写死文字 | 写死文字：SUPPLY NET / 打通物流脉络 / 构筑产业护城河 |  |
| p004 | 封面 把握消费趋势 | 写死文字 | 写死文字：PRESS MENU TO BEGIN SERVE WITH HEART ACH… |  |
| p010 | 占比 Share | 写死文字 | 写死文字：通用大模型 |  |
| p015 | 象限 Quadrant | 写死文字 | 写死文字：高热度 高兑现 / 明星兑现 / STAR DELIVERY |  |
| p016 | 风险 Risk | 写死文字 | 写死文字：风险传导链 / 风险 |  |
| p020 | 气泡 Deal Map | 写死文字 | 写死文字：金额区间 笔数 |  |
| p026 | 瀑布 Waterfall | 写死文字 | 写死文字：赛道贡献明细 |  |
| p029 | 累计曲线 Cumulative | 写死文字 | 写死文字：头部集中度 |  |
| p036 | 场景占比 Scene | 写死文字 | 写死文字：场景占比 |  |
| p037 | 金句 Statement | 写死文字 | 写死文字：研发效率 / Developer Productivity |  |
| p041 | 容量栅格 Capacity | 写死文字 | 写死文字：占用 单元 / 闲置 单元 |  |
| p045 | 分层防线 Gate | 写死文字 | 写死文字：外层 通用防护 / 内层 核心合规 |  |
| p060 | 占比大数字 Dominance | 写死文字 | 写死文字：占比构成 |  |
| p065 | 三类资源 Triad | 写死文字 | 写死文字：AI 竞争首先是资源组织能力竞争 / EXPANDED SLIDE P6 |  |
| p072 | 架构栈 Stack | 写死文字 | 写死文字：AI 延展 |  |
| p077 | 转化阶梯 Ladder | 写死文字 | 写死文字：较上一阶段流失 |  |
| p078 | 风险登记表 Register | 写死文字 | 写死文字：判断 |  |
| p080 | 壁垒压缩 Squeeze | 写死文字 | 写死文字：残余 / RESIDUAL MOAT |  |
| p082 | 工作流嵌入 Embed | 写死文字 | 写死文字：宿主刚性流程 HOST PROCESS |  |
| p088 | 影像档案 Mosaic | 图片主体 | 图片主体：SET 图片槽数量 拖入影像 |  |
| p091 | 对比大数字 Versus | 写死文字 | 写死文字：TOP 公司 / 拿走全年大额融资的六成以上 / 其余 公司 |  |
| p092 | 金句 Lede | 写死文字 | 写死文字：资本不再为故事付费 AI 公司必须 自己配得上这个价格 |  |

## 待人工确认（1）

候选文字只有一个英文词，判不准是不是写死文字，没有自动排除。

| 版式 | 名称 | 候选文字 |
|---|---|---|
| p017 | 策略 Outlook | PHASE TIMELINE |

## 渲染失败（0）

（无）

## 可随机的外观控件（styleControls）

| 版式 | 控件 | 名称 | 取值 |
|---|---|---|---|
| p005 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p005 | sidePanelTheme | 侧栏主题 | dark / light |
| p006 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p008 | panelColor | 面板色 | #2c44a0 / #7a3c90 / #3c9a52 / #d8402e / #1a1814 |
| p008 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p009 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p011 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p012 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p013 | colorScale | 色阶模式 | warm / cool / mono |
| p013 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p014 | colorMode | 配色模式 | category / accent / mono |
| p014 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p017 | leftColor | 左栏色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p017 | rightColor | 右栏色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p017 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p018 | theme | 背景主题 | paper / dark |
| p018 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p019 | theme | 背景主题 | dark / paper / color |
| p019 | bgColor | 色块背景 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p019 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p021 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p022 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p023 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p024 | chartType | 曲线类型 | area / line |
| p024 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p025 | highColor | 高位色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p025 | lowColor | 低位色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p025 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p027 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p028 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p030 | theme | 背景主题 | dark / paper / color |
| p030 | bgColor | 色块背景 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p030 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p031 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p032 | cardTheme | 主体卡主题 | color / dark / paper |
| p032 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p033 | imageSide | 图片位置 | right / left |
| p033 | cardTheme | 文本卡主题 | color / dark / paper |
| p033 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p034 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p035 | colorMode | 配色方式 | category / accent / mono |
| p035 | cardTheme | 主体卡主题 | color / dark / paper |
| p035 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p038 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p039 | imageSide | 图片位置 | left / right |
| p039 | cardTheme | 规格卡主题 | color / dark / paper |
| p039 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p040 | imageSide | 图片位置 | right / left |
| p040 | colorMode | 占比条配色 | category / accent / mono |
| p040 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p042 | colorMode | 占比条配色 | category / accent / mono |
| p042 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p043 | imageSide | 图片位置 | left / right |
| p043 | cardTheme | 身份卡主题 | color / dark / paper |
| p043 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p044 | imageSide | 图片位置 | left / right |
| p044 | cardTheme | 身份卡主题 | color / dark / paper |
| p044 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p046 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p047 | imageSide | 图片位置 | left / right |
| p047 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p048 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p049 | imageSide | 图片位置 | left / right |
| p049 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p050 | imageSide | 图片位置 | left / right |
| p050 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p051 | imageSide | 图片位置 | left / right |
| p051 | emphasize | 强调端 | source / dest |
| p051 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p052 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p053 | theme | 背景主题 | dark / paper / color |
| p053 | bgColor | 色块背景 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p053 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p054 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p055 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p056 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p057 | imageSide | 图片位置 | right / left |
| p057 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p058 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p059 | imageSide | 图片位置 | right / left |
| p059 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p061 | imageSide | 图片位置 | right / left |
| p061 | cardTheme | 身份卡主题 | paper / dark / color |
| p061 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p062 | imageSide | 图片位置 | right / left |
| p062 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p063 | imageSide | 图片位置 | left / right |
| p063 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p064 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p066 | imageSide | 图片位置 | right / left |
| p066 | cardTheme | 主体卡主题 | color / dark / paper |
| p066 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p067 | imageSide | 图片位置 | right / left |
| p067 | cardTheme | 主体卡主题 | dark / color / paper |
| p067 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p068 | imageSide | 图片位置 | right / left |
| p068 | cardTheme | 主体卡主题 | color / dark / paper |
| p068 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p069 | imageSide | 图片位置 | right / left |
| p069 | cardTheme | 主体卡主题 | dark / color / paper |
| p069 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p070 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p071 | imageSide | 图片位置 | right / left |
| p071 | cardTheme | 主体卡主题 | color / dark / paper |
| p071 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p073 | imageSide | 图片位置 | right / left |
| p073 | cardTheme | 主体卡主题 | dark / color / paper |
| p073 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p074 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p075 | imageSide | 图片位置 | right / left |
| p075 | cardTheme | 主体卡主题 | dark / color / paper |
| p075 | curveStyle | 轨迹线型 | dashed / solid |
| p075 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p076 | theme | 背景主题 | dark / paper / color |
| p076 | bgColor | 色块背景 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p076 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p079 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p081 | panelTheme | 面板主题 | dark / color / paper |
| p081 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p083 | panelTheme | 面板主题 | dark / color / paper |
| p083 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p084 | theme | 背景主题 | paper / dark / color |
| p084 | bgColor | 色块背景 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p084 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p085 | colorMode | 连线配色 | change / category / mono |
| p085 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p086 | colorScale | 色阶 | heat / accent / mono |
| p086 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p087 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p089 | unicornScene | 动态场景 | tech / automations / moving / goey |
| p089 | textColor | 文字颜色 | white / black |
| p089 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p090 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p093 | panelTheme | 面板主题 | dark / color / paper |
| p093 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p094 | theme | 背景主题 | dark / paper / color |
| p094 | bgColor | 色块背景 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |
| p094 | accentColor | 强调色 | #d8402e / #e2742c / #efbe2e / #3c9a52 / #4da0c6 / #2c44a0 / #7a3c90 |

### 不收的 select 控件（16，会改版式几何或渲染失败）

| 版式 | 控件 | 原因 |
|---|---|---|
| p006 | chartType | 取值 "cells"：元素数量 27 → 37 |
| p009 | chartType | 取值 "line"：元素数量 45 → 37 |
| p018 | quoteAlign | 取值 "center"：第 4 个元素 x 相差 848.6px |
| p021 | chartType | 取值 "line"：元素数量 48 → 42 |
| p023 | chartType | 取值 "bar"：元素数量 43 → 49 |
| p024 | scope | 取值 "month"：元素数量 45 → 44 |
| p028 | numberAlign | 取值 "center"：第 6 个元素 x 相差 393.7px |
| p038 | chartType | 取值 "line"：元素数量 57 → 51 |
| p055 | chartType | 取值 "stack"：元素数量 40 → 39 |
| p056 | chartType | 取值 "pie"：元素数量 50 → 51 |
| p079 | numberAlign | 取值 "center"：第 15 个元素 x 相差 93.5px |
| p084 | align | 取值 "left"：第 5 个元素 x 相差 815.2px |
| p086 | gradeStyle | 取值 "score"：第 22 个元素 x 相差 9.0px |
| p087 | layout | 取值 "below"：第 10 个元素 y 相差 135.0px |
| p089 | backgroundMode | 取值 "media"：元素数量 28 → 33 |
| p094 | layout | 取值 "center"：元素数量 41 → 29 |

## 白名单命中（供人复核）

白名单（英文）：top、no、nos、vol、page、pages、fig、figure、est、rev、ver、tel、fax、www、com、am、pm、vs、and、the、for、of、jan、feb、mar、apr、may、jun、jul、aug、sep、sept、oct、nov、dec、mon、tue、wed、thu、fri、sat、sun、january、february、march、april、june、july、august、september、october、november、december、monday、tuesday、wednesday、thursday、friday、saturday、sunday、next、prev、previous、back、scroll、start、end、fin、chart、table、curve、trend、peak、trough、total、count、amount、diverging、area、radar、tiers、structure、donut、stage、flow、funnel、convert、bubbles、high、low、wall、statement、menu、scale、part、step、phase、pest、pulse、nodes、layers、layer、columns、waterfall、heat、map

白名单（中文）：一月、二月、三月、四月、五月、六月、七月、八月、九月、十月、十一月、十二月、周一、周二、周三、周四、周五、周六、周日、星期一、星期二、星期三、星期四、星期五、星期六、星期日、第一季度、第二季度、第三季度、第四季度、季度、上半年、下半年、合计、全年合计、单位、占比、均值、月度均值、重点、峰值、低位、目标、其余、全年、数据、分布、基准、结论、高亮、章节、摘要、阶段、纵轴、横轴、数量、金额、关键节点、主线

| 命中文字 | 版式数 |
|---|---|
| 重点 | 4 |
| Q1 | 3 |
| Q2 | 3 |
| Q3 | 3 |
| Q4 | 2 |
| 合计 | 2 |
| PULSE | 2 |
| 峰值 | 1 |
| 基准 Q1 | 1 |
| 月度均值 | 1 |
| 均值 | 1 |
| 分布 | 1 |
| 基准 pt | 1 |
| II | 1 |
| L4 | 1 |
| L3 | 1 |
| L2 | 1 |
| L1 | 1 |

