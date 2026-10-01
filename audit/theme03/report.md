# theme03 版式审计

- 版式总数 77；参与审计 76；现有规则已排除（媒体槽隐藏不了 / contentLocked / inspect 失败）1
- 本次自动排除 6 个：写死文字 6、图片主体 0、品牌图标 0（一个版式命中多类时每类各计一次）
- 人工排除（审计时仍渲染，用来核对判定）0；渲染失败 0；待人工确认 0
- select 控件共 101 个，判定为只改外观（可随机）90 个
- 耗时：标记渲染 35 秒（76 页）；控件检查 2 分 24 秒（254 页）；合计 2 分 59 秒
- 清单写入：新增自动排除 6 条、清掉旧的自动排除 7 条、styleControls 90 条

## 自动排除（6）

| 版式 | 名称 | 类别 | 证据 | 已有人工排除 |
|---|---|---|---|---|
| p021 | 案例对比 | 写死文字 | 写死文字：亿美元 |  |
| p037 | 三视野 | 写死文字 | 写死文字：当下兑现 / 确定性 / 赔率 |  |
| p038 | 核心结论 | 写死文字 | 写死文字：集中 / 节奏 / 分层 |  |
| p045 | SWOT | 写死文字 | 写死文字：内部 增益 / 内部 损害 / 外部 增益 |  |
| p050 | 波士顿矩阵 | 写死文字 | 写死文字：高增长 高份额 / 高增长 低份额 / 低增长 高份额 |  |
| p073 | 护城河 | 写死文字 | 写死文字：信任 渠道 / 数据 协同 / 资源锁定 |  |

## 待人工确认（0）

候选文字只有一个英文词，判不准是不是写死文字，没有自动排除。

（无）

## 渲染失败（0）

（无）

## 可随机的外观控件（styleControls）

| 版式 | 控件 | 名称 | 取值 |
|---|---|---|---|
| p001 | accent | 强调色 | blue / lime |
| p002 | accent | 强调色 | blue / lime |
| p003 | unicornScene | 动态场景 | tech / automations / moving / goey |
| p003 | accent | 强调色 | blue / lime |
| p004 | accent | 强调色 | blue / lime |
| p005 | unicornScene | 动态场景 | tech / automations / moving / goey |
| p005 | accent | 强调色 | blue / lime |
| p006 | accent | 强调色 | blue / lime |
| p007 | diagramStyle1 | 图形类型 1 | auto / radial / burst / orbit / mesh / spiral / constellation |
| p007 | diagramStyle2 | 图形类型 2 | auto / radial / burst / orbit / mesh / spiral / constellation |
| p007 | diagramStyle3 | 图形类型 3 | auto / radial / burst / orbit / mesh / spiral / constellation |
| p007 | accent | 强调色 | blue / lime |
| p008 | chartType | 图表类型 | line / bar / area |
| p008 | accent | 强调色 | blue / lime |
| p009 | accent | 强调色 | blue / lime |
| p010 | accent | 强调色 | blue / lime |
| p011 | accent | 强调色 | blue / lime |
| p012 | accent | 强调色 | blue / lime |
| p013 | accent | 强调色 | blue / lime |
| p014 | accent | 强调色 | blue / lime |
| p015 | accent | 强调色 | blue / lime |
| p016 | accent | 强调色 | blue / lime |
| p017 | layout | 图片排布 | row / column |
| p017 | accent | 强调色 | blue / lime |
| p018 | accent | 强调色 | blue / lime |
| p019 | layout | 图片排布 | row / column |
| p019 | accent | 强调色 | blue / lime |
| p020 | layout | 图片排布 | row / column |
| p020 | accent | 强调色 | blue / lime |
| p022 | accent | 强调色 | blue / lime |
| p023 | chartType | 图表类型 | bar / lollipop |
| p023 | accent | 强调色 | blue / lime |
| p024 | accent | 强调色 | blue / lime |
| p025 | accent | 强调色 | blue / lime |
| p026 | accent | 强调色 | blue / lime |
| p027 | chartType | 主系列样式 | area / line |
| p027 | accent | 强调色 | blue / lime |
| p028 | accent | 强调色 | blue / lime |
| p029 | accent | 强调色 | blue / lime |
| p031 | chartType | 图表类型 | bar / step / area |
| p031 | accent | 强调色 | blue / lime |
| p032 | accent | 强调色 | blue / lime |
| p033 | accent | 强调色 | blue / lime |
| p034 | accent | 强调色 | blue / lime |
| p035 | focusSide | 突出栏目 | none / left / right |
| p035 | accent | 强调色 | blue / lime |
| p036 | accent | 强调色 | blue / lime |
| p039 | accent | 强调色 | blue / lime |
| p040 | accent | 强调色 | blue / lime |
| p041 | accent | 强调色 | blue / lime |
| p042 | accent | 强调色 | blue / lime |
| p043 | accent | 强调色 | blue / lime |
| p044 | accent | 强调色 | blue / lime |
| p046 | accent | 强调色 | blue / lime |
| p047 | accent | 强调色 | blue / lime |
| p048 | accent | 强调色 | blue / lime |
| p049 | accent | 强调色 | blue / lime |
| p051 | accent | 强调色 | blue / lime |
| p052 | accent | 强调色 | blue / lime |
| p053 | chartType | 柱样式 | bar / lollipop |
| p053 | accent | 强调色 | blue / lime |
| p054 | accent | 强调色 | blue / lime |
| p055 | accent | 强调色 | blue / lime |
| p056 | focusSide | 重点突出 | none / left / right |
| p056 | accent | 强调色 | blue / lime |
| p057 | accent | 强调色 | blue / lime |
| p058 | accent | 强调色 | blue / lime |
| p059 | accent | 强调色 | blue / lime |
| p060 | accent | 强调色 | blue / lime |
| p061 | accent | 强调色 | blue / lime |
| p062 | accent | 强调色 | blue / lime |
| p063 | layout | 图片排布 | row / column |
| p063 | accent | 强调色 | blue / lime |
| p064 | accent | 强调色 | blue / lime |
| p065 | accent | 强调色 | blue / lime |
| p066 | accent | 强调色 | blue / lime |
| p067 | layout | 图片排布 | row / column |
| p067 | accent | 强调色 | blue / lime |
| p068 | accent | 强调色 | blue / lime |
| p069 | accent | 强调色 | blue / lime |
| p070 | accent | 强调色 | blue / lime |
| p071 | unicornScene | 动态场景 | tech / automations / moving / goey |
| p071 | accent | 强调色 | blue / lime |
| p072 | accent | 强调色 | blue / lime |
| p074 | accent | 强调色 | blue / lime |
| p075 | layout | 图片排布 | row / column |
| p075 | accent | 强调色 | blue / lime |
| p076 | layout | 图片排布 | row / column |
| p076 | accent | 强调色 | blue / lime |
| p077 | accent | 强调色 | blue / lime |

### 不收的 select 控件（11，会改版式几何或渲染失败）

| 版式 | 控件 | 原因 |
|---|---|---|
| p003 | backgroundMode | 取值 "media"：元素数量 25 → 21 |
| p005 | backgroundMode | 取值 "media"：元素数量 25 → 23 |
| p006 | columns | 取值 "2"：元素数量 41 → 42 |
| p010 | chartType | 取值 "pie"：元素数量 40 → 38 |
| p011 | chartType | 取值 "lollipop"：元素数量 58 → 66 |
| p029 | chartType | 取值 "lollipop"：第 13 个元素 y 相差 6.5px |
| p033 | columns | 取值 "4"：第 7 个元素 x 相差 420.0px |
| p036 | orientation | 取值 "vertical"：元素数量 33 → 26 |
| p039 | align | 取值 "center"：第 5 个元素 x 相差 787.0px |
| p071 | backgroundMode | 取值 "media"：元素数量 23 → 21 |
| p071 | align | 取值 "center"：元素数量 23 → 21 |

## 白名单命中（供人复核）

白名单（英文）：top、no、nos、vol、page、pages、fig、figure、est、rev、ver、tel、fax、www、com、am、pm、vs、and、the、for、of、jan、feb、mar、apr、may、jun、jul、aug、sep、sept、oct、nov、dec、mon、tue、wed、thu、fri、sat、sun、january、february、march、april、june、july、august、september、october、november、december、monday、tuesday、wednesday、thursday、friday、saturday、sunday、next、prev、previous、back、scroll、start、end、fin、chart、table、curve、trend、peak、trough、total、count、amount、diverging、area、radar、tiers、structure、donut、stage、flow、funnel、convert、bubbles、high、low、wall、statement、menu、scale、part、step、phase、pest、pulse、nodes、layers、layer、columns、waterfall、heat、map

白名单（中文）：一月、二月、三月、四月、五月、六月、七月、八月、九月、十月、十一月、十二月、周一、周二、周三、周四、周五、周六、周日、星期一、星期二、星期三、星期四、星期五、星期六、星期日、第一季度、第二季度、第三季度、第四季度、季度、上半年、下半年、合计、全年合计、单位、占比、均值、月度均值、重点、峰值、低位、目标、其余、全年、数据、分布、基准、结论、高亮、章节、摘要、阶段、纵轴、横轴、数量、金额、关键节点、主线

| 命中文字 | 版式数 |
|---|---|
| 高亮 | 1 |
| Q1 | 1 |
| Q2 | 1 |
| Q3 | 1 |
| Q4 | 1 |
| L1 | 1 |
| L2 | 1 |
| L3 | 1 |
| L4 | 1 |
| L5 | 1 |
| PEST | 1 |

## 现有规则已排除（1，未渲染）

media 1

