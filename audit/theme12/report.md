# theme12 版式审计

- 版式总数 86；参与审计 55；现有规则已排除（媒体槽隐藏不了 / contentLocked / inspect 失败）31
- 本次自动排除 3 个：写死文字 3、图片主体 0、品牌图标 0（一个版式命中多类时每类各计一次）
- 人工排除（审计时仍渲染，用来核对判定）0；渲染失败 0；待人工确认 0
- select 控件共 123 个，判定为只改外观（可随机）106 个
- 耗时：标记渲染 15 秒（55 页）；控件检查 2 分 1 秒（464 页）；合计 2 分 16 秒
- 清单写入：新增自动排除 3 条、清掉旧的自动排除 3 条、styleControls 106 条

## 自动排除（3）

| 版式 | 名称 | 类别 | 证据 | 已有人工排除 |
|---|---|---|---|---|
| p036 | 路线图 / Roadmap | 写死文字 | 写死文字：LANES QUARTERS |  |
| p047 | 瀑布图 / Waterfall | 写死文字 | 写死文字：收入 到手 |  |
| p060 | 定位矩阵 / Positioning | 写死文字 | 写死文字：家对照 |  |

## 待人工确认（0）

候选文字只有一个英文词，判不准是不是写死文字，没有自动排除。

（无）

## 渲染失败（0）

（无）

## 可随机的外观控件（styleControls）

| 版式 | 控件 | 名称 | 取值 |
|---|---|---|---|
| p001 | theme | 配色 | light / dark |
| p001 | accent | 强调色 | #f15a29 / #d61fb5 / #3bb6ec / #1f6b2a |
| p002 | theme | 配色 | light / dark |
| p002 | accent | 强调色 | #d61fb5 / #f15a29 / #3bb6ec / #baf04f |
| p004 | theme | 面板配色 | accent / dark |
| p004 | accent | 强调色 | #5a138e / #f15a29 / #3bb6ec / #1f6b2a |
| p005 | theme | 配色 | light / dark |
| p005 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p005 | mediaFit | 图片填充 | cover / contain |
| p006 | theme | 配色 | light / dark |
| p006 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p007 | theme | 配色 | light / dark |
| p007 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p008 | theme | 配色 | accent / dark / light |
| p008 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p009 | theme | 配色 | light / dark |
| p009 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p010 | theme | 配色 | light / dark |
| p010 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p011 | theme | 配色 | light / dark |
| p011 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p012 | theme | 配色 | light / dark |
| p012 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p013 | theme | 配色 | light / dark |
| p013 | accent | 强调色 | #5a138e / #f15a29 / #3bb6ec / #1f6b2a |
| p019 | mediaFit | 图片填充 | cover / contain |
| p019 | theme | 配色 | light / dark |
| p019 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p032 | theme | 配色 | light / dark |
| p032 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p033 | theme | 配色 | light / dark |
| p033 | accent | 强调色 | #5a138e / #f15a29 / #3bb6ec / #1f6b2a |
| p034 | theme | 配色 | light / dark |
| p034 | accent | 强调色 | #3bb6ec / #f15a29 / #5a138e / #1f6b2a |
| p035 | theme | 配色 | light / dark |
| p035 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p037 | theme | 配色 | light / dark |
| p037 | accent | 强调色 | #f15a29 / #1f6b2a / #5a138e / #3bb6ec |
| p038 | theme | 配色 | light / dark |
| p038 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p039 | theme | 配色 | light / dark |
| p039 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p040 | theme | 配色 | light / dark |
| p040 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p041 | theme | 配色 | light / dark |
| p041 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p042 | theme | 配色 | dark / color |
| p042 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p043 | theme | 配色 | light / dark |
| p043 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p044 | theme | 配色 | light / dark |
| p044 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p045 | theme | 配色 | light / dark |
| p045 | accent | 强调色 | #1f6b2a / #f15a29 / #5a138e / #3bb6ec |
| p046 | theme | 配色 | light / dark |
| p046 | accent | 强调色 | #1f6b2a / #f15a29 / #3bb6ec / #5a138e |
| p048 | chartType | 图表类型 | area / line / bars |
| p048 | theme | 配色 | light / dark |
| p048 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p049 | theme | 配色 | light / dark |
| p049 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p050 | theme | 配色 | light / dark |
| p050 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p051 | theme | 配色 | light / dark |
| p051 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p052 | theme | 配色 | light / dark |
| p052 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p053 | theme | 配色 | light / dark |
| p053 | accent | 强调色 | #5a138e / #f15a29 / #3bb6ec / #1f6b2a |
| p054 | theme | 配色 | light / dark |
| p054 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p055 | theme | 配色 | light / dark |
| p055 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p056 | theme | 配色 | light / dark |
| p056 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p057 | theme | 配色 | light / dark |
| p057 | accent | 强调色 | #1f6b2a / #f15a29 / #3bb6ec / #5a138e |
| p058 | theme | 配色 | light / dark |
| p058 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p059 | theme | 配色 | light / dark |
| p059 | accent | 强调色 | #5a138e / #f15a29 / #3bb6ec / #1f6b2a |
| p061 | theme | 配色 | light / dark |
| p061 | accent | 强调色 | #5a138e / #f15a29 / #3bb6ec / #1f6b2a |
| p062 | theme | 配色 | light / dark |
| p062 | accent | 强调色 | #3bb6ec / #f15a29 / #5a138e / #1f6b2a |
| p063 | theme | 配色 | light / dark |
| p063 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p064 | theme | 配色 | light / dark |
| p064 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p074 | theme | 配色 | light / dark |
| p074 | accent | 强调色 | #5a138e / #d61fb5 / #f15a29 / #1f6b2a |
| p076 | theme | 配色 | light / dark |
| p076 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p078 | theme | 配色 | light / dark |
| p078 | accent | 强调色 | #c44ee0 / #fbb24d / #74d2f0 / #bcee54 |
| p079 | accent | 强调色 | #5a138e / #f15a29 / #3bb6ec / #1f6b2a |
| p080 | theme | 配色 | dark / accent |
| p080 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p081 | theme | 配色 | light / dark |
| p081 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p082 | theme | 配色 | light / dark |
| p082 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |
| p085 | theme | 配色 | light / dark |
| p085 | accent | 强调色 | #5a138e / #f15a29 / #3bb6ec / #1f6b2a |
| p086 | theme | 配色 | light / dark |
| p086 | accent | 强调色 | #f15a29 / #5a138e / #3bb6ec / #1f6b2a |

### 不收的 select 控件（17，会改版式几何或渲染失败）

| 版式 | 控件 | 原因 |
|---|---|---|
| p002 | align | 取值 "center"：第 86 个元素 x 相差 804.0px |
| p006 | align | 取值 "center"：第 8 个元素 x 相差 815.8px |
| p007 | columns | 取值 1：第 10 个元素 宽 相差 896.0px |
| p008 | align | 取值 "center"：第 7 个元素 x 相差 60.0px |
| p009 | columns | 取值 1：第 7 个元素 x 相差 6.6px |
| p040 | columns | 取值 1：元素数量 39 → 35 |
| p041 | billing | 取值 "yearly"：第 7 个元素 宽 相差 3.0px |
| p042 | numeral | 取值 "roman"：第 2 个元素 x 相差 447.2px |
| p043 | chartType | 取值 "bar"：元素数量 42 → 50 |
| p044 | chartType | 取值 "pie"：元素数量 44 → 41 |
| p054 | chartType | 取值 "grouped"：第 27 个元素 宽 相差 6.3px |
| p064 | columns | 取值 4：第 10 个元素 宽 相差 437.0px |
| p078 | align | 取值 "left"：第 8 个元素 x 相差 791.9px |
| p079 | theme | 取值 "dark"：元素数量 33 → 34 |
| p079 | numeral | 取值 "arabic"：第 7 个元素 宽 相差 153.8px |
| p080 | align | 取值 "center"：第 2 个元素 x 相差 185.3px |
| p082 | columns | 取值 1：元素数量 43 → 39 |

## 白名单命中（供人复核）

白名单（英文）：top、no、nos、vol、page、pages、fig、figure、est、rev、ver、tel、fax、www、com、am、pm、vs、and、the、for、of、jan、feb、mar、apr、may、jun、jul、aug、sep、sept、oct、nov、dec、mon、tue、wed、thu、fri、sat、sun、january、february、march、april、june、july、august、september、october、november、december、monday、tuesday、wednesday、thursday、friday、saturday、sunday、next、prev、previous、back、scroll、start、end、fin、chart、table、curve、trend、peak、trough、total、count、amount、diverging、area、radar、tiers、structure、donut、stage、flow、funnel、convert、bubbles、high、low、wall、statement、menu、scale、part、step、phase、pest、pulse、nodes、layers、layer、columns、waterfall、heat、map

白名单（中文）：一月、二月、三月、四月、五月、六月、七月、八月、九月、十月、十一月、十二月、周一、周二、周三、周四、周五、周六、周日、星期一、星期二、星期三、星期四、星期五、星期六、星期日、第一季度、第二季度、第三季度、第四季度、季度、上半年、下半年、合计、全年合计、单位、占比、均值、月度均值、重点、峰值、低位、目标、其余、全年、数据、分布、基准、结论、高亮、章节、摘要、阶段、纵轴、横轴、数量、金额、关键节点、主线

| 命中文字 | 版式数 |
|---|---|
| pt | 1 |
| M0 | 1 |

## 现有规则已排除（31，未渲染）

media 31

