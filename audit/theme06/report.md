# theme06 版式审计

- 版式总数 83；参与审计 82；现有规则已排除（媒体槽隐藏不了 / contentLocked / inspect 失败）1
- 本次自动排除 20 个：写死文字 20、图片主体 0、品牌图标 0（一个版式命中多类时每类各计一次）
- 人工排除（审计时仍渲染，用来核对判定）0；渲染失败 0；待人工确认 3
- select 控件共 109 个，判定为只改外观（可随机）74 个
- 耗时：标记渲染 25 秒（82 页）；控件检查 2 分 31 秒（512 页）；合计 2 分 56 秒
- 清单写入：新增自动排除 20 条、清掉旧的自动排除 26 条、styleControls 74 条

## 自动排除（20）

| 版式 | 名称 | 类别 | 证据 | 已有人工排除 |
|---|---|---|---|---|
| p006 | 02 · 报告摘要 / OVERVIEW | 写死文字 | 写死文字：全年融资 TOTAL / 大额事件 DEALS / 平均单笔 AVG TICKET |  |
| p014 | 10 · 峰值季度 / Q3 PEAK | 写死文字 | 写死文字：高亮面积图 PEAK CURVE |  |
| p016 | 12 · 峰值与低位 / PEAK & … | 写死文字 | 写死文字：峰谷差 COLUMNS |  |
| p023 | 19 · 工作流自动化 / AI AGE… | 写死文字 | 写死文字：SEG SPLIT |  |
| p024 | 20 · 知识入口 / ENTERPRI… | 写死文字 | 写死文字：SEG SPLIT |  |
| p030 | 26 · 风险研判 / RISK | 写死文字 | 写死文字：中风险 / 综合风险水位 / 项风险 RISKS |  |
| p038 | 34 · 企业流程嵌入 / LOW CO… | 写死文字 | 写死文字：SEG SPLIT |  |
| p043 | 39 · 复杂交易结构 / DEAL S… | 写死文字 | 写死文字：STRUCT STACKED |  |
| p045 | 41 · 钱以外的资源 / STRATE… | 写死文字 | 写死文字：授信 / 渠道 / 供应 |  |
| p049 | 45 · 行业客户优势 / NEW YO… | 写死文字 | 写死文字：REGIONS PANEL |  |
| p050 | 46 · 云计算人才外溢 / SEATT… | 写死文字 | 写死文字：REGIONS PANEL |  |
| p051 | 47 · 科研与硬科技 / BOSTON | 写死文字 | 写死文字：REGIONS PANEL |  |
| p054 | 50 · 商业化标杆 / OPENAI | 写死文字 | 写死文字：FIGURES MOSAIC |  |
| p055 | 51 · 安全可靠模型 / ANTHRO… | 写死文字 | 写死文字：FIGURES MOSAIC |  |
| p056 | 52 · 实时数据生态 / XAI | 写死文字 | 写死文字：FIGURES MOSAIC |  |
| p057 | 53 · 算力基础设施 / COREWE… | 写死文字 | 写死文字：FIGURES MOSAIC |  |
| p059 | 55 · AI 搜索入口 / PERPL… | 写死文字 | 写死文字：FIGURES MOSAIC |  |
| p060 | 56 · 数据平台延展 / DATABR… | 写死文字 | 写死文字：FIGURES MOSAIC |  |
| p061 | 57 · 企业知识入口 / GLEAN | 写死文字 | 写死文字：FIGURES MOSAIC |  |
| p063 | 59 · 强叙事模型实验室 / SSI | 写死文字 | 写死文字：FIGURES MOSAIC |  |

## 待人工确认（3）

候选文字只有一个英文词，判不准是不是写死文字，没有自动排除。

| 版式 | 名称 | 候选文字 |
|---|---|---|
| p025 | 21 · 专业服务 / LEGAL AI | SEG TABLE |
| p052 | 48 · 分散型应用落地 / OTHER… | REGIONS MAP |
| p058 | 54 · 数据基础设施 / SCALE … | CASE |

## 渲染失败（0）

（无）

## 可随机的外观控件（styleControls）

| 版式 | 控件 | 名称 | 取值 |
|---|---|---|---|
| p001 | accent | 强调色 | #d2fb30 / #ff5a3c / #3ca0ff / #ffd23c |
| p002 | accent | 强调色 | #d2fb30 / #ff5a3c / #3ca0ff / #ffd23c |
| p003 | accent | 强调色 | #d2fb30 / #ff5a3c / #3ca0ff / #ffd23c |
| p004 | accent | 强调色 | #d2fb30 / #ff5a3c / #3ca0ff / #ffd23c |
| p005 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p007 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p008 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p009 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p010 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p011 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p012 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p013 | layout | 指标呈现 | chart / table |
| p013 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p015 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p017 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p018 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p019 | align | 对齐方式 | left / center |
| p019 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p020 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p021 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p022 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p025 | layout | 布局形式 | media / table |
| p025 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p026 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p027 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p029 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p031 | emphasis | 对比侧重 | none / left / right |
| p031 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p032 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p033 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p034 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p035 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p036 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p037 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p039 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p040 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p041 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p042 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p044 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p046 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p047 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p048 | align | 对齐方式 | left / center |
| p048 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p052 | layout | 右栏形式 | media / map |
| p052 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p053 | align | 对齐方式 | left / center |
| p053 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p058 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p062 | align | 对齐方式 | left / center |
| p062 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p064 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p065 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p066 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p067 | align | 对齐方式 | left / center |
| p067 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p068 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p069 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p070 | layout | 方向排布 | cards / rows |
| p070 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p071 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p072 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p073 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p074 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p075 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p076 | align | 对齐方式 | left / center |
| p076 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p077 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p078 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p079 | align | 对齐方式 | left / center |
| p079 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p080 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p081 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p082 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |
| p083 | accent | 强调色 | #c8f135 / #ff5a3c / #3ca0ff / #ffd23c |

### 不收的 select 控件（35，会改版式几何或渲染失败）

| 版式 | 控件 | 原因 |
|---|---|---|
| p007 | layout | 取值 "grid"：元素数量 56 → 46 |
| p008 | stackStyle | 取值 "list"：第 14 个元素 y 相差 54.0px |
| p009 | chartType | 取值 "bars"：元素数量 37 → 40 |
| p010 | background | 取值 "solid"：元素数量 22 → 21 |
| p011 | chartType | 取值 "dots"：第 17 个元素 x 相差 8.0px |
| p012 | layout | 取值 "table"：元素数量 46 → 47 |
| p017 | chartType | 取值 "stack"：元素数量 47 → 39 |
| p018 | chartType | 取值 "grouped"：元素数量 43 → 45 |
| p020 | chartType | 取值 "line"：第 50 个元素 x 相差 13.0px |
| p021 | background | 取值 "solid"：元素数量 24 → 23 |
| p022 | chartType | 取值 "bars"：元素数量 44 → 60 |
| p026 | chartType | 取值 "dots"：元素数量 72 → 376 |
| p027 | layout | 取值 "columns"：第 14 个元素 y 相差 140.5px |
| p032 | align | 取值 "center"：第 13 个元素 x 相差 352.5px |
| p034 | chartType | 取值 "ring"：第 15 个元素 x 相差 57.1px |
| p035 | align | 取值 "center"：第 13 个元素 x 相差 815.8px |
| p036 | chartType | 取值 "steps"：元素数量 63 → 51 |
| p037 | chartType | 取值 "bars"：元素数量 39 → 48 |
| p040 | chartType | 取值 "steps"：元素数量 63 → 51 |
| p041 | background | 取值 "solid"：元素数量 24 → 23 |
| p042 | chartType | 取值 "bars"：第 23 个元素 y 相差 39.0px |
| p044 | chartType | 取值 "ring"：第 15 个元素 x 相差 57.1px |
| p046 | chartType | 取值 "bars"：元素数量 43 → 46 |
| p064 | background | 取值 "solid"：元素数量 23 → 22 |
| p065 | chartType | 取值 "columns"：元素数量 60 → 48 |
| p068 | chartType | 取值 "columns"：元素数量 60 → 48 |
| p069 | layout | 取值 "rows"：元素数量 64 → 60 |
| p071 | align | 取值 "center"：第 13 个元素 x 相差 815.8px |
| p072 | layout | 取值 "stack"：元素数量 75 → 71 |
| p073 | background | 取值 "solid"：元素数量 22 → 21 |
| p074 | chartType | 取值 "columns"：元素数量 112 → 77 |
| p077 | layout | 取值 "grid"：元素数量 39 → 40 |
| p080 | background | 取值 "solid"：元素数量 23 → 22 |
| p081 | chartType | 取值 "bars"：元素数量 62 → 56 |
| p083 | layout | 取值 "stack"：元素数量 75 → 71 |

## 白名单命中（供人复核）

白名单（英文）：top、no、nos、vol、page、pages、fig、figure、est、rev、ver、tel、fax、www、com、am、pm、vs、and、the、for、of、jan、feb、mar、apr、may、jun、jul、aug、sep、sept、oct、nov、dec、mon、tue、wed、thu、fri、sat、sun、january、february、march、april、june、july、august、september、october、november、december、monday、tuesday、wednesday、thursday、friday、saturday、sunday、next、prev、previous、back、scroll、start、end、fin、chart、table、curve、trend、peak、trough、total、count、amount、diverging、area、radar、tiers、structure、donut、stage、flow、funnel、convert、bubbles、high、low、wall、statement、menu、scale、part、step、phase、pest、pulse、nodes、layers、layer、columns、waterfall、heat、map

白名单（中文）：一月、二月、三月、四月、五月、六月、七月、八月、九月、十月、十一月、十二月、周一、周二、周三、周四、周五、周六、周日、星期一、星期二、星期三、星期四、星期五、星期六、星期日、第一季度、第二季度、第三季度、第四季度、季度、上半年、下半年、合计、全年合计、单位、占比、均值、月度均值、重点、峰值、低位、目标、其余、全年、数据、分布、基准、结论、高亮、章节、摘要、阶段、纵轴、横轴、数量、金额、关键节点、主线

| 命中文字 | 版式数 |
|---|---|
| FLOW | 3 |
| TIERS | 2 |
| STRUCTURE | 2 |
| DONUT | 2 |
| STAGE | 2 |
| MENU | 1 |
| 章节 | 1 |
| PEAK | 1 |
| TREND | 1 |
| CHART | 1 |
| TABLE | 1 |
| CURVE | 1 |
| 阶段 | 1 |
| 均值 | 1 |
| TOTAL | 1 |
| 合计 WATERFALL | 1 |
| COUNT | 1 |
| AMOUNT | 1 |
| DIVERGING | 1 |
| AREA | 1 |
| RADAR | 1 |
| TOP SCALE | 1 |
| FUNNEL | 1 |
| CONVERT | 1 |
| BUBBLES | 1 |
| 合计 | 1 |
| R0 | 1 |
| 数据 | 1 |
| 峰值 PEAK | 1 |
| 低位 TROUGH | 1 |
| HIGH | 1 |
| WALL | 1 |
| STATEMENT | 1 |

## 现有规则已排除（1，未渲染）

media 1

