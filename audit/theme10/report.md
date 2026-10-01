# theme10 版式审计

- 版式总数 95；参与审计 75；现有规则已排除（媒体槽隐藏不了 / contentLocked / inspect 失败）20
- 本次自动排除 5 个：写死文字 5、图片主体 0、品牌图标 0（一个版式命中多类时每类各计一次）
- 人工排除（审计时仍渲染，用来核对判定）0；渲染失败 0；待人工确认 0
- select 控件共 94 个，判定为只改外观（可随机）76 个
- 耗时：标记渲染 25 秒（75 页）；控件检查 1 分 46 秒（268 页）；合计 2 分 11 秒
- 清单写入：新增自动排除 5 条、清掉旧的自动排除 6 条、styleControls 76 条

## 自动排除（5）

| 版式 | 名称 | 类别 | 证据 | 已有人工排除 |
|---|---|---|---|---|
| p018 | 抉择双栏 | 写死文字 | 写死文字：三年累计回报 |  |
| p055 | 常见问题 | 写死文字 | 写死文字：答疑 COMMON QUESTIONS / 你可能正想问的 / 个常见问题 |  |
| p062 | 相关性热力 | 写死文字 | 写死文字：分散度 CORRELATION / 它们彼此独立吗 / 全球股票 |  |
| p063 | 因子雷达 | 写死文字 | 写死文字：组合体检 FACTOR PROFILE / 六个维度的均衡 / 回报 |  |
| p088 | 敏感性分析 | 写死文字 | 写死文字：下行情形 / 上行情形 |  |

## 待人工确认（0）

候选文字只有一个英文词，判不准是不是写死文字，没有自动排除。

（无）

## 渲染失败（0）

（无）

## 可随机的外观控件（styleControls）

| 版式 | 控件 | 名称 | 取值 |
|---|---|---|---|
| p001 | theme | 渐变情绪 | dusk / midnight / dawn |
| p002 | theme | 色场情绪 | dusk / dawn / mono |
| p003 | theme | 渐变情绪 | dusk / dawn / mono |
| p004 | theme | 地平线色 | dawn / dusk / ember |
| p005 | theme | 背景主题 | dusk / midnight / graphite / dawn / paper |
| p006 | theme | 背景主题 | midnight / dusk / graphite / dawn / vapor / paper |
| p007 | tone | 页面底色 | dark / light |
| p007 | chartType | 图表类型 | area / bars / line |
| p008 | tone | 页面底色 | dark / light |
| p009 | tone | 页面底色 | dark / light |
| p010 | tone | 页面底色 | dark / light |
| p012 | tone | 页面底色 | dark / light |
| p013 | tone | 页面底色 | dark / light |
| p014 | tone | 页面底色 | dark / light |
| p015 | tone | 页面底色 | dark / light |
| p016 | tone | 页面底色 | dark / light |
| p017 | tone | 页面底色 | dark / light |
| p019 | tone | 页面底色 | dark / light |
| p020 | tone | 页面底色 | dark / light |
| p021 | tone | 页面底色 | dark / light |
| p022 | tone | 页面底色 | dark / light |
| p025 | tone | 页面底色 | dark / light |
| p025 | chartType | 图表类型 | area / bars / line |
| p026 | tone | 页面底色 | dark / light |
| p027 | tone | 页面底色 | dark / light |
| p028 | tone | 页面底色 | dark / light |
| p029 | tone | 页面底色 | dark / light |
| p030 | tone | 页面底色 | dark / light |
| p031 | tone | 页面底色 | dark / light |
| p032 | tone | 页面底色 | dark / light |
| p033 | tone | 页面底色 | dark / light |
| p034 | tone | 页面底色 | dark / light |
| p035 | tone | 页面底色 | dark / light |
| p036 | tone | 页面底色 | dark / light |
| p037 | tone | 页面底色 | dark / light |
| p038 | theme | 背景主题 | midnight / dusk / graphite / dawn / vapor / paper |
| p039 | theme | 背景主题 | vapor / dusk / midnight / graphite / dawn / paper |
| p040 | tone | 页面底色 | dark / light |
| p040 | imageSide | 图片位置 | left / right |
| p044 | tone | 页面底色 | dark / light |
| p044 | trendStyle | 走势样式 | area / line / bars |
| p049 | tone | 页面底色 | dark / light |
| p052 | theme | 背景主题 | dusk / midnight / graphite / dawn / vapor / paper |
| p053 | theme | 背景主题 | graphite / midnight / dusk / dawn / vapor / paper |
| p054 | tone | 页面底色 | dark / light |
| p054 | layout | 构图方式 | justified / grid / feature |
| p056 | theme | 背景主题 | dusk / midnight / graphite / dawn / paper |
| p057 | theme | 背景主题 | dusk / midnight / graphite / dawn / vapor / paper |
| p058 | tone | 页面底色 | dark / light |
| p059 | tone | 页面底色 | dark / light |
| p060 | tone | 页面底色 | dark / light |
| p061 | tone | 页面底色 | dark / light |
| p064 | tone | 页面底色 | dark / light |
| p065 | tone | 页面底色 | dark / light |
| p066 | tone | 页面底色 | dark / light |
| p067 | tone | 页面底色 | dark / light |
| p068 | tone | 页面底色 | dark / light |
| p069 | tone | 页面底色 | dark / light |
| p070 | tone | 页面底色 | dark / light |
| p070 | railSide | 文字栏位置 | left / right |
| p071 | tone | 页面底色 | dark / light |
| p072 | tone | 页面底色 | dark / light |
| p073 | tone | 页面底色 | dark / light |
| p074 | tone | 页面底色 | dark / light |
| p075 | tone | 页面底色 | dark / light |
| p080 | tone | 页面底色 | dark / light |
| p081 | tone | 页面底色 | dark / light |
| p082 | tone | 页面底色 | dark / light |
| p083 | tone | 页面底色 | dark / light |
| p086 | tone | 页面底色 | dark / light |
| p087 | tone | 页面底色 | dark / light |
| p089 | tone | 页面底色 | dark / light |
| p090 | tone | 页面底色 | dark / light |
| p091 | tone | 页面底色 | dark / light |
| p093 | tone | 页面底色 | dark / light |
| p094 | tone | 页面底色 | dark / light |

### 不收的 select 控件（18，会改版式几何或渲染失败）

| 版式 | 控件 | 原因 |
|---|---|---|
| p001 | align | 取值 "center"：第 4 个元素 x 相差 808.5px |
| p002 | fieldSide | 取值 "left"：第 2 个元素 宽 相差 153.6px |
| p005 | align | 取值 "center"：第 5 个元素 x 相差 808.5px |
| p006 | align | 取值 "center"：元素数量 29 → 9 |
| p016 | layout | 取值 "top"：第 2 个元素 y 相差 390.2px |
| p031 | layout | 取值 "below"：第 4 个元素 y 相差 60.5px |
| p035 | layout | 取值 "side"：第 2 个元素 y 相差 391.3px |
| p038 | numberSide | 取值 "right"：第 2 个元素 x 相差 580.2px |
| p039 | align | 取值 "center"：第 3 个元素 x 相差 803.5px |
| p052 | align | 取值 "center"：第 6 个元素 x 相差 701.3px |
| p053 | mode | 取值 "figure"：元素数量 8 → 7 |
| p053 | align | 取值 "center"：第 3 个元素 x 相差 803.8px |
| p057 | align | 取值 "center"：第 2 个元素 x 相差 802.7px |
| p061 | layout | 取值 "side"：第 2 个元素 y 相差 391.3px |
| p068 | layout | 取值 "below"：第 6 个元素 x 相差 21.2px |
| p071 | checkedMode | 取值 "all"：元素数量 34 → 37 |
| p082 | side | 取值 "left"：第 4 个元素 x 相差 920.0px |
| p087 | tilt | 取值 "left"：第 5 个元素 y 相差 65.3px |

## 白名单命中（供人复核）

白名单（英文）：top、no、nos、vol、page、pages、fig、figure、est、rev、ver、tel、fax、www、com、am、pm、vs、and、the、for、of、jan、feb、mar、apr、may、jun、jul、aug、sep、sept、oct、nov、dec、mon、tue、wed、thu、fri、sat、sun、january、february、march、april、june、july、august、september、october、november、december、monday、tuesday、wednesday、thursday、friday、saturday、sunday、next、prev、previous、back、scroll、start、end、fin、chart、table、curve、trend、peak、trough、total、count、amount、diverging、area、radar、tiers、structure、donut、stage、flow、funnel、convert、bubbles、high、low、wall、statement、menu、scale、part、step、phase、pest、pulse、nodes、layers、layer、columns、waterfall、heat、map

白名单（中文）：一月、二月、三月、四月、五月、六月、七月、八月、九月、十月、十一月、十二月、周一、周二、周三、周四、周五、周六、周日、星期一、星期二、星期三、星期四、星期五、星期六、星期日、第一季度、第二季度、第三季度、第四季度、季度、上半年、下半年、合计、全年合计、单位、占比、均值、月度均值、重点、峰值、低位、目标、其余、全年、数据、分布、基准、结论、高亮、章节、摘要、阶段、纵轴、横轴、数量、金额、关键节点、主线

| 命中文字 | 版式数 |
|---|---|
| Q0 | 1 |
| 均值 | 1 |

## 现有规则已排除（20，未渲染）

media 20

