# theme08 版式审计

- 版式总数 84；参与审计 82；现有规则已排除（媒体槽隐藏不了 / contentLocked / inspect 失败）2
- 本次自动排除 36 个：写死文字 19、图片主体 22、品牌图标 0（一个版式命中多类时每类各计一次）
- 人工排除（审计时仍渲染，用来核对判定）1；渲染失败 0；待人工确认 1
- select 控件共 59 个，判定为只改外观（可随机）43 个
- 耗时：标记渲染 25 秒（82 页）；控件检查 47 秒（144 页）；合计 1 分 12 秒
- 清单写入：新增自动排除 36 条、清掉旧的自动排除 36 条、styleControls 43 条

## 自动排除（37）

| 版式 | 名称 | 类别 | 证据 | 已有人工排除 |
|---|---|---|---|---|
| p006 | ② 摘要 · Overview | 写死文字 | 写死文字：摘要 / 重点 |  |
| p007 | ③ 结构 · Contents | 写死文字 | 写死文字：重点 |  |
| p008 | ⑤ 趋势 · Trend | 写死文字 | 写死文字：融资额 / 事件数 / 峰值 |  |
| p011 | ⑧ 案例 · Cases | 图片主体 | 图片主体：图片数量 |  |
| p013 | ⑩ 排名 · Ranking | 写死文字 | 写死文字：榜首 |  |
| p014 | ⑪ 象限 · Quadrant | 写死文字 | 写死文字：看好象限 |  |
| p021 | ⑲ 峰值聚焦 · Peak | 图片主体 | 图片主体：图片数量 |  |
| p023 | ㉑ 峰谷对比 · Peak/Trough | 写死文字 | 写死文字：单位 / 均值 |  |
| p027 | ㉕ 累计曲线 · Capital Cur… | 写死文字 | 写死文字：累计资金占比 |  |
| p030 | ㉘ 赛道卡 · Segment | 图片主体 | 图片主体：图片数量 |  |
| p031 | ㉙ 知识入口 · Portal | 图片主体 | 图片主体：图片数量 |  |
| p032 | ㉚ 场景矩阵 · Matrix | 写死文字 | 写死文字：高客单价 |  |
| p034 | ㉜ 场景占比 · Scene Split | 图片主体 | 图片主体：图片数量 |  |
| p037 | ㉟ 架构 · Architecture | 图片主体 | 图片主体：图片数量 |  |
| p038 | ㊱ 供应链 · Supply | 图片主体 | 图片主体：图片数量 |  |
| p040 | ㊳ 芯片层级 · Chip Tiers | 写死文字 | 写死文字：长期确定性 |  |
| p041 | ㊴ 具身智能 · Embodied | 图片主体 | 图片主体：图片数量 |  |
| p043 | ㊷ 内容生成 · Generative | 图片主体 | 图片主体：图片数量 |  |
| p047 | ㊼ 社区变现 · Open Source | 写死文字、图片主体 | 写死文字：COMMUNITY ENTERPRISE / 仅展示社区数据；图片主体：图片数量 |  |
| p048 | ㊽ 安全对齐 · Alignment | 图片主体 | 图片主体：图片数量 |  |
| p050 | ㊿ 早期轮 · Early Stage | 写死文字 | 写死文字：新主题 |  |
| p052 | (53) 资源绑定 · Resource… | 图片主体 | 图片主体：图片可选 |  |
| p056 | (57) 地理卡 · New York | 写死文字、图片主体 | 写死文字：重点；图片主体：图片数量 |  |
| p057 | (58) 地理卡 · Seattle | 图片主体 | 图片主体：图片数量 |  |
| p058 | (59) 地理卡 · Boston | 图片主体 | 图片主体：图片数量 |  |
| p059 | (60) 点阵图 · Other Reg… | 写死文字 | 写死文字：重点 |  |
| p061 | (64) 案例卡 · xAI | 写死文字 | 写死文字：核心资产 |  |
| p062 | (65) 案例卡 · CoreWeave | 图片主体 | 图片主体：图片数量 |  |
| p064 | (67) 案例卡 · Perplexit… | 图片主体 | 图片主体：图片数量 |  |
| p065 | (68) 案例卡 · Databrick… | 写死文字 | 写死文字：延展 |  |
| p066 | (69) 案例卡 · Glean | 图片主体 | 图片主体：图片数量 |  |
| p067 | (71) 案例卡 · SSI | 写死文字、图片主体 | 写死文字：抽象技术意象；图片主体：图片数量 |  |
| p072 | (78) 嵌入流程 · Workflow | 图片主体 | 图片主体：无图片 mediaCount |  |
| p075 | (81) 展望主线 · Mainline… | 写死文字、图片主体 | 写死文字：主线；图片主体：图片数量 |  |
| p080 | (86) 哑铃图 · Range | 写死文字 | 写死文字：跨度 |  |
| p081 | (87) 路线图 · Roadmap | 写死文字 | 写死文字：关键节点 |  |
| p082 | (88) 照片墙 · Photo Wal… | 图片主体 | 图片主体：图片数量 | 照片墙，页面显示「// 图片数量 = 0」占位文字 |

## 待人工确认（1）

候选文字只有一个英文词，判不准是不是写死文字，没有自动排除。

| 版式 | 名称 | 候选文字 |
|---|---|---|
| p046 | ㊻ 流程嵌入 · Low Code | LAYER |

## 渲染失败（0）

（无）

## 可随机的外观控件（styleControls）

| 版式 | 控件 | 名称 | 取值 |
|---|---|---|---|
| p001 | backgroundTheme | 背景主题 | primary / muted |
| p002 | backgroundTheme | 背景主题 | primary / muted |
| p003 | backgroundTheme | 背景主题 | primary / muted |
| p004 | backgroundTheme | 背景主题 | primary / muted |
| p005 | backgroundTheme | 背景主题 | primary / muted |
| p009 | backgroundTheme | 背景主题 | primary / muted |
| p010 | backgroundTheme | 背景主题 | primary / muted |
| p012 | backgroundTheme | 背景主题 | primary / muted |
| p015 | backgroundTheme | 背景主题 | primary / muted |
| p017 | backgroundTheme | 背景主题 | primary / muted / ink |
| p018 | backgroundTheme | 背景主题 | primary / muted |
| p019 | backgroundTheme | 背景主题 | primary / muted |
| p020 | backgroundTheme | 背景主题 | primary / muted |
| p022 | backgroundTheme | 背景主题 | primary / muted |
| p024 | backgroundTheme | 背景主题 | primary / muted |
| p025 | backgroundTheme | 背景主题 | primary / muted |
| p026 | backgroundTheme | 背景主题 | primary / muted / ink |
| p028 | backgroundTheme | 背景主题 | primary / muted / ink |
| p029 | backgroundTheme | 背景主题 | primary / muted |
| p033 | backgroundTheme | 背景主题 | primary / muted |
| p036 | backgroundTheme | 背景主题 | primary / muted |
| p039 | backgroundTheme | 背景主题 | primary / muted |
| p042 | backgroundTheme | 背景主题 | primary / muted |
| p045 | backgroundTheme | 背景主题 | primary / muted |
| p046 | backgroundTheme | 背景主题 | primary / muted |
| p049 | backgroundTheme | 背景主题 | primary / muted / ink |
| p051 | backgroundTheme | 背景主题 | primary / muted |
| p053 | backgroundTheme | 背景主题 | primary / muted |
| p054 | backgroundTheme | 背景主题 | primary / muted |
| p055 | backgroundTheme | 背景主题 | primary / muted / ink |
| p063 | backgroundTheme | 背景主题 | primary / muted |
| p068 | backgroundTheme | 背景主题 | primary / muted |
| p069 | backgroundTheme | 背景主题 | primary / muted |
| p070 | backgroundTheme | 背景主题 | primary / muted |
| p071 | backgroundTheme | 背景主题 | primary / muted |
| p073 | backgroundTheme | 背景主题 | primary / muted |
| p074 | backgroundTheme | 背景主题 | primary / muted / ink |
| p076 | backgroundTheme | 背景主题 | primary / muted |
| p078 | backgroundTheme | 背景主题 | primary / muted / ink |
| p078 | numberStyle | 数字样式 | solid / outline |
| p079 | backgroundTheme | 背景主题 | primary / muted |
| p083 | backgroundTheme | 背景主题 | primary / muted |
| p084 | backgroundTheme | 背景主题 | primary / muted / ink |

### 不收的 select 控件（16，会改版式几何或渲染失败）

| 版式 | 控件 | 原因 |
|---|---|---|
| p009 | chartType | 取值 "bars"：元素数量 52 → 53 |
| p012 | columnCount | 取值 4：第 7 个元素 宽 相差 137.5px |
| p016 | backgroundTheme | 取值 "primary"：元素数量 18 → 19 |
| p019 | chartType | 取值 "area"：第 29 个元素 x 相差 38.0px |
| p025 | chartType | 取值 "grouped"：元素数量 53 → 51 |
| p035 | backgroundTheme | 取值 "ink"：元素数量 19 → 18 |
| p036 | chartType | 取值 "column"：第 33 个元素 x 相差 51.9px |
| p039 | chartType | 取值 "bars"：元素数量 144 → 70 |
| p042 | chartType | 取值 "gate"：元素数量 73 → 76 |
| p051 | chartType | 取值 "bars"：元素数量 45 → 44 |
| p053 | chartType | 取值 "bars"：元素数量 50 → 49 |
| p060 | backgroundTheme | 取值 "primary"：元素数量 22 → 23 |
| p068 | chartType | 取值 "bars"：第 8 个元素 宽 相差 417.8px |
| p070 | chartType | 取值 "bars"：元素数量 69 → 72 |
| p074 | emphasisStyle | 取值 "underline"：第 13 个元素 x 相差 2.0px |
| p076 | chartType | 取值 "bars"：元素数量 62 → 57 |

## 白名单命中（供人复核）

白名单（英文）：top、no、nos、vol、page、pages、fig、figure、est、rev、ver、tel、fax、www、com、am、pm、vs、and、the、for、of、jan、feb、mar、apr、may、jun、jul、aug、sep、sept、oct、nov、dec、mon、tue、wed、thu、fri、sat、sun、january、february、march、april、june、july、august、september、october、november、december、monday、tuesday、wednesday、thursday、friday、saturday、sunday、next、prev、previous、back、scroll、start、end、fin

白名单（中文）：一月、二月、三月、四月、五月、六月、七月、八月、九月、十月、十一月、十二月、周一、周二、周三、周四、周五、周六、周日、星期一、星期二、星期三、星期四、星期五、星期六、星期日、第一季度、第二季度、第三季度、第四季度、季度、上半年、下半年

| 命中文字 | 版式数 |
|---|---|
| L5 | 1 |
| L4 | 1 |
| L3 | 1 |
| L2 | 1 |
| L1 | 1 |

## 现有规则已排除（2，未渲染）

media 2

