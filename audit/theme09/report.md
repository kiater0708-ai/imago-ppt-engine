# theme09 版式审计

- 版式总数 111；参与审计 94；现有规则已排除（媒体槽隐藏不了 / contentLocked / inspect 失败）17
- 本次自动排除 22 个：写死文字 19、图片主体 3、品牌图标 0（一个版式命中多类时每类各计一次）
- 人工排除（审计时仍渲染，用来核对判定）0；渲染失败 4；待人工确认 3
- select 控件共 74 个，判定为只改外观（可随机）24 个
- 耗时：标记渲染 40 秒（94 页）；控件检查 2 分 6 秒（350 页）；合计 2 分 46 秒
- 清单写入：新增自动排除 22 条、清掉旧的自动排除 22 条、styleControls 24 条

## 自动排除（22）

| 版式 | 名称 | 类别 | 证据 | 已有人工排除 |
|---|---|---|---|---|
| p018 | 层级旭日 | 写死文字 | 写死文字：亿美元 全年 |  |
| p019 | 论点推演 | 写死文字 | 写死文字：据此推演如右 |  |
| p034 | 08 轮次结构 | 写死文字 | 写死文字：各轮次 分布 |  |
| p036 | 赛道名次 | 写死文字 | 写死文字：名次第 在顶部 / 条赛道 / 轨迹 |  |
| p037 | 同比对望 | 写死文字 | 写死文字：单位 |  |
| p045 | 09 定位矩阵 | 写死文字 | 写死文字：大模型 / 基础设施 / 垂直应用 |  |
| p047 | 09 资本漏斗 | 写死文字 | 写死文字：转化 |  |
| p049 | 计量条 | 写死文字 | 写死文字：目标 |  |
| p052 | 09 观点引述 | 写死文字 | 写死文字：看好 / 谨慎 / 中性 |  |
| p062 | 资金玫瑰 | 写死文字 | 写死文字：赛道 |  |
| p067 | 评级矩阵 | 写死文字 | 写死文字：综合 / 等级 / 卓越 |  |
| p069 | 10 应用落地 | 写死文字 | 写死文字：渗透 |  |
| p070 | 影像拼贴 | 图片主体 | 图片主体：图片槽数量 调大以拼贴影像 / 图片为示意 槽位按比例自适应 |  |
| p071 | 径向透视 | 写死文字 | 写死文字：口径说明 |  |
| p075 | 影像长卷 | 图片主体 | 图片主体：图片槽数量 调大以走带 / 图片为示意 画格按比例自适应 |  |
| p076 | 10 资金瀑布 | 写死文字 | 写死文字：单位 合计 / 合计 / 全年合计 |  |
| p083 | 10 排名变迁 | 写死文字 | 写死文字：升至 |  |
| p084 | 区间对比 | 写死文字 | 写死文字：单位 |  |
| p089 | 10 季度走势 | 写死文字 | 写死文字：单位 |  |
| p090 | 单笔分布 | 写死文字 | 写死文字：峰位 |  |
| p094 | 10 结构演变 | 写死文字 | 写死文字：占比 |  |
| p110 | 企业掘影 | 图片主体 | 图片主体：图片槽数量为 Tweaks 中调高 图片槽数量 以展示企业图集 |  |

## 待人工确认（3）

候选文字只有一个英文词，判不准是不是写死文字，没有自动排除。

| 版式 | 名称 | 候选文字 |
|---|---|---|
| p010 | 目录 | Step |
| p104 | 13 实施路径 | PHASE |
| p111 | 结语 | AInsight |

## 渲染失败（4）

| 版式 | 名称 | 原因 |
|---|---|---|
| p006 | 封面G 终端 | 渲染失败（退出码 1）：Goal spec validation failed: - slide 1 layout theme09_page006 field layout: cover-like layouts must use themeXX_page001-page005 |
| p007 | Cover | 渲染失败（退出码 1）：Goal spec validation failed: - slide 1 layout theme09_page007 field layout: cover-like layouts must use themeXX_page001-page005 |
| p048 | 市占矩形 | 渲染失败（退出码 1）：Goal spec validation failed: - slide 1 layout theme09_page048 field props: Slide props mismatch for "theme09_page048": cats[0].vals 的数量 5 必须等于 segs 的数量 4; cats[1].vals 的数量 5 必须等于 segs 的数量 … |
| p050 | 09 关键指标 | 渲染失败（退出码 1）：Goal spec validation failed: - slide 1 layout theme09_page050 field props.stats[2].spark: too many items (5 > 4); use at most fillPlan.maxCount or choose another layout - slide 1 layout th… |

## 可随机的外观控件（styleControls）

| 版式 | 控件 | 名称 | 取值 |
|---|---|---|---|
| p008 | labelType | 标签类型 | number / symbol / keyword |
| p012 | chartType | 图表类型 | 面积 / 折线 / 柱状 |
| p013 | offset | 图表类型 | 居中 / 基线 |
| p017 | labelType | 标签类型 | number / symbol / keyword |
| p023 | labelType | 标签类型 | number / symbol / keyword |
| p028 | focusIndex | 焦点分组 | 左侧 / 右侧 |
| p030 | labelType | 标签类型 | number / symbol / keyword |
| p032 | labelType | 标签类型 | number / symbol / keyword |
| p035 | sort | 排序方式 | 降序 / 升序 / 原序 |
| p038 | labelType | 标签类型 | number / symbol / keyword |
| p041 | pivot | 中枢符 | VS / ÷ / → / / |
| p046 | sort | 排序 | 降序 / 原序 |
| p051 | labelType | 标签类型 | number / symbol / keyword |
| p056 | labelType | 标签类型 | number / symbol / keyword |
| p059 | labelType | 标签类型 | number / symbol / keyword |
| p066 | labelType | 标签类型 | number / symbol / keyword |
| p073 | labelType | 标签类型 | number / symbol / keyword |
| p079 | sort | 排序 | 降序 / 原序 |
| p081 | labelType | 标签类型 | number / symbol / keyword |
| p093 | direction | 排序 | 升序 / 原序 |
| p095 | labelType | 标签类型 | number / symbol / keyword |
| p101 | labelType | 标签类型 | number / symbol / keyword |
| p103 | labelType | 标签类型 | number / symbol / keyword |
| p106 | imgSide | 图片位置 | left / right |

### 不收的 select 控件（50，会改版式几何或渲染失败）

| 版式 | 控件 | 原因 |
|---|---|---|
| p002 | splitDir | 取值 "左"：第 2 个元素 x 相差 1808.0px |
| p009 | dotShape | 取值 "菱"：第 6 个元素 x 相差 9.1px |
| p010 | labelType | 取值 "symbol"：第 7 个元素 宽 相差 61.6px |
| p011 | labelType | 取值 "symbol"：第 14 个元素 宽 相差 20.5px |
| p012 | granularity | 取值 "月度"：元素数量 39 → 47 |
| p012 | labelType | 取值 "symbol"：第 2 个元素 宽 相差 10.4px |
| p013 | labelType | 取值 "symbol"：第 10 个元素 宽 相差 3.6px |
| p016 | shape | 取值 "饼图"：元素数量 65 → 60 |
| p016 | labelType | 取值 "symbol"：第 2 个元素 宽 相差 10.5px |
| p020 | labelType | 取值 "symbol"：第 11 个元素 宽 相差 4.2px |
| p021 | labelType | 取值 "symbol"：第 2 个元素 宽 相差 12.4px |
| p022 | labelType | 取值 "symbol"：第 2 个元素 宽 相差 12.1px |
| p023 | splitDir | 取值 "右下"：第 2 个元素 x 相差 1108.8px |
| p027 | variant | 取值 "列表"：元素数量 55 → 51 |
| p027 | labelType | 取值 "symbol"：第 2 个元素 宽 相差 12.4px |
| p028 | labelType | 取值 "number"：第 2 个元素 宽 相差 12.4px |
| p029 | labelType | 取值 "symbol"：第 2 个元素 宽 相差 9.2px |
| p030 | align | 取值 "居中"：元素数量 22 → 21 |
| p031 | align | 取值 "居左"：第 2 个元素 x 相差 743.5px |
| p032 | side | 取值 "右归左"：第 6 个元素 y 相差 75.8px |
| p035 | labelType | 取值 "symbol"：第 2 个元素 宽 相差 41.2px |
| p040 | labelType | 取值 "symbol"：第 2 个元素 宽 相差 50.5px |
| p042 | align | 取值 "居中"：元素数量 15 → 14 |
| p043 | orientation | 取值 "纵向"：第 6 个元素 x 相差 38.0px |
| p043 | labelType | 取值 "symbol"：第 2 个元素 宽 相差 50.5px |
| p044 | labelType | 取值 "symbol"：第 6 个元素 x 相差 2.7px |
| p053 | align | 取值 "居左"：第 3 个元素 x 相差 806.1px |
| p054 | labelType | 取值 "symbol"：第 2 个元素 宽 相差 14.4px |
| p055 | labelType | 取值 "symbol"：第 2 个元素 宽 相差 50.5px |
| p057 | labelType | 取值 "symbol"：第 10 个元素 x 相差 2.2px |
| p058 | labelType | 取值 "symbol"：第 2 个元素 宽 相差 50.5px |
| p059 | sort | 取值 "升序"：第 29 个元素 宽 相差 182.0px |
| p061 | labelType | 取值 "symbol"：第 2 个元素 宽 相差 50.5px |
| p063 | chartType | 取值 "整环"：第 1 个元素 y 相差 734.4px |
| p063 | labelType | 取值 "symbol"：第 6 个元素 x 相差 2.8px |
| p065 | labelType | 取值 "symbol"：第 2 个元素 宽 相差 50.5px |
| p072 | labelType | 取值 "symbol"：第 2 个元素 宽 相差 50.5px |
| p077 | labelType | 取值 "symbol"：第 2 个元素 宽 相差 50.5px |
| p079 | labelType | 取值 "symbol"：第 6 个元素 x 相差 2.5px |
| p081 | axis | 取值 "月度"：元素数量 63 → 79 |
| p085 | gaugeStyle | 取值 "整环"：第 9 个元素 x 相差 6.6px |
| p085 | labelType | 取值 "symbol"：第 2 个元素 宽 相差 50.5px |
| p086 | labelType | 取值 "symbol"：第 3 个元素 宽 相差 47.8px |
| p093 | labelType | 取值 "symbol"：第 20 个元素 宽 相差 3.4px |
| p098 | labelType | 取值 "symbol"：第 2 个元素 宽 相差 50.5px |
| p099 | sort | 取值 "原序"：第 9 个元素 宽 相差 4.1px |
| p099 | labelType | 取值 "symbol"：第 2 个元素 宽 相差 50.5px |
| p102 | labelType | 取值 "symbol"：第 2 个元素 宽 相差 50.5px |
| p104 | labelType | 取值 "symbol"：第 2 个元素 宽 相差 50.5px |
| p105 | labelType | 取值 "symbol"：第 2 个元素 宽 相差 50.5px |

## 白名单命中（供人复核）

白名单（英文）：top、no、nos、vol、page、pages、fig、figure、est、rev、ver、tel、fax、www、com、am、pm、vs、and、the、for、of、jan、feb、mar、apr、may、jun、jul、aug、sep、sept、oct、nov、dec、mon、tue、wed、thu、fri、sat、sun、january、february、march、april、june、july、august、september、october、november、december、monday、tuesday、wednesday、thursday、friday、saturday、sunday、next、prev、previous、back、scroll、start、end、fin

白名单（中文）：一月、二月、三月、四月、五月、六月、七月、八月、九月、十月、十一月、十二月、周一、周二、周三、周四、周五、周六、周日、星期一、星期二、星期三、星期四、星期五、星期六、星期日、第一季度、第二季度、第三季度、第四季度、季度、上半年、下半年

| 命中文字 | 版式数 |
|---|---|
| No | 1 |
| R1 | 1 |
| R2 | 1 |
| R3 | 1 |
| R4 | 1 |
| VS | 1 |
| F0 | 1 |
| MAR | 1 |
| M4 M6 | 1 |
| Q1 | 1 |
| Q2 | 1 |
| Q3 | 1 |
| Q4 | 1 |

## 现有规则已排除（17，未渲染）

media 17

