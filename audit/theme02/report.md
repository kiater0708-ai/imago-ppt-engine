# theme02 版式审计

- 版式总数 74；参与审计 70；现有规则已排除（媒体槽隐藏不了 / contentLocked / inspect 失败）4
- 本次自动排除 17 个：写死文字 13、图片主体 4、品牌图标 0（一个版式命中多类时每类各计一次）
- 人工排除（审计时仍渲染，用来核对判定）0；渲染失败 1；待人工确认 0
- select 控件共 135 个，判定为只改外观（可随机）115 个
- 耗时：标记渲染 23 秒（70 页）；控件检查 1 分 20 秒（292 页）；合计 1 分 43 秒
- 清单写入：新增自动排除 17 条、清掉旧的自动排除 17 条、styleControls 115 条

## 自动排除（17）

| 版式 | 名称 | 类别 | 证据 | 已有人工排除 |
|---|---|---|---|---|
| p004 | 封面 C · 满幅图海报 | 图片主体 | 图片主体：上传主视觉 需切到 上传 显示 |  |
| p011 | 融资榜单 · Leaderboard | 写死文字 | 写死文字：占比 |  |
| p019 | 资金流向 · Sankey | 写死文字 | 写死文字：带宽 融资额 全年合计 / 汇入 占全年 |  |
| p026 | 主题海报 · Poster | 图片主体 | 图片主体：上传主图 需切到 上传 显示 |  |
| p029 | 案例图集 · Gallery | 图片主体 | 图片主体：纯标题版式 图片数量为 |  |
| p031 | 双图对比 · Compare | 写死文字 | 写死文字：结论 |  |
| p033 | 笔数分布 · Pictogram | 写死文字 | 写死文字：占全部 |  |
| p037 | 资本漏斗 · Funnel | 写死文字 | 写死文字：留存 |  |
| p038 | 估值散点 · Scatter | 写死文字 | 写死文字：估值 ARR 十亿美元 营收倍数 |  |
| p039 | 资本桥 · Waterfall | 写死文字 | 写死文字：贡献 |  |
| p041 | 达成度 · Progress | 写死文字 | 写死文字：目标 |  |
| p055 | 结论主张 · Manifesto | 写死文字 | 写死文字：横向看集中 / 纵向看节奏 / 结构看分层 |  |
| p060 | 集中度 · Pareto | 写死文字 | 写死文字：前三家合计 |  |
| p062 | 赛道版图 · Treemap | 写死文字 | 写死文字：面积 吸纳资金 全年合计 |  |
| p064 | 斜率图 · Slope | 写死文字 | 写死文字：金额份额 放大 |  |
| p069 | 名次变迁 · Bump | 写死文字 | 写死文字：全年上升 |  |
| p070 | 瀑布流图墙 · Masonry | 图片主体 | 图片主体：纯标题版式 图片数量为 |  |

## 待人工确认（0）

候选文字只有一个英文词，判不准是不是写死文字，没有自动排除。

（无）

## 渲染失败（1）

| 版式 | 名称 | 原因 |
|---|---|---|
| p068 | 资本去向 · Sunburst | 渲染失败（退出码 1）：Goal spec validation failed: - slide 1 layout theme02_page068 field props.groups[1].children: too many items (3 > 2); use at most fillPlan.maxCount or choose another layout - slide 1 layou… |

## 可随机的外观控件（styleControls）

| 版式 | 控件 | 名称 | 取值 |
|---|---|---|---|
| p001 | scheme | 配色方案 | green / violet |
| p001 | emphasis | 强调卡片 | default / ticket |
| p002 | scheme | 配色方案 | green / violet |
| p002 | emphasis | 强调卡片 | default / ticket |
| p003 | scheme | 配色方案 | green / violet |
| p003 | emphasis | 强调卡片 | default / ticket |
| p005 | scheme | 配色方案 | green / violet |
| p005 | emphasis | 强调卡片 | default / ticket |
| p006 | scheme | 配色方案 | green / violet |
| p006 | emphasis | 强调卡片 | default / ticket |
| p007 | scheme | 配色方案 | green / violet |
| p007 | emphasis | 强调卡片 | default / ticket |
| p008 | scheme | 配色方案 | green / violet |
| p008 | emphasis | 强调卡片 | default / ticket |
| p009 | scheme | 配色方案 | green / violet |
| p009 | emphasis | 强调卡片 | default / ticket |
| p010 | scheme | 配色方案 | green / violet |
| p010 | emphasis | 强调卡片 | default / ticket |
| p012 | scheme | 配色方案 | green / violet |
| p012 | emphasis | 强调卡片 | default / ticket |
| p013 | scheme | 配色方案 | green / violet |
| p013 | emphasis | 强调卡片 | default / ticket |
| p013 | layout | 版式 | split / full |
| p014 | scheme | 配色方案 | green / violet |
| p014 | emphasis | 强调卡片 | default / ticket |
| p015 | scheme | 配色方案 | green / violet |
| p015 | emphasis | 强调卡片 | default / ticket |
| p016 | scheme | 配色方案 | green / violet |
| p016 | emphasis | 强调卡片 | default / ticket |
| p017 | scheme | 配色方案 | green / violet |
| p017 | emphasis | 强调卡片 | default / ticket |
| p018 | scheme | 配色方案 | green / violet |
| p018 | emphasis | 强调卡片 | default / ticket |
| p020 | scheme | 配色方案 | green / violet |
| p020 | emphasis | 强调卡片 | default / ticket |
| p021 | scheme | 配色方案 | green / violet |
| p021 | emphasis | 强调卡片 | default / ticket |
| p022 | scheme | 配色方案 | green / violet |
| p022 | emphasis | 强调卡片 | default / ticket |
| p022 | emphasize | 强调侧 | to / from / both |
| p023 | scheme | 配色方案 | green / violet |
| p023 | emphasis | 强调卡片 | default / ticket |
| p024 | scheme | 配色方案 | green / violet |
| p024 | emphasis | 强调卡片 | default / ticket |
| p024 | imageSide | 图片位置 | left / right |
| p025 | scheme | 配色方案 | green / violet |
| p025 | emphasis | 强调卡片 | default / ticket |
| p025 | overlay | 标题蒙层 | corner / bar / none |
| p032 | scheme | 配色方案 | green / violet |
| p032 | emphasis | 强调卡片 | default / ticket |
| p034 | scheme | 配色方案 | green / violet |
| p034 | emphasis | 强调卡片 | default / ticket |
| p035 | scheme | 配色方案 | green / violet |
| p035 | emphasis | 强调卡片 | default / ticket |
| p036 | scheme | 配色方案 | green / violet |
| p036 | emphasis | 强调卡片 | default / ticket |
| p040 | scheme | 配色方案 | green / violet |
| p040 | emphasis | 强调卡片 | default / ticket |
| p042 | scheme | 配色方案 | green / violet |
| p042 | emphasis | 强调卡片 | default / ticket |
| p042 | imageSide | 头像位置 | left / right |
| p044 | scheme | 配色方案 | green / violet |
| p044 | emphasis | 强调卡片 | default / ticket |
| p045 | scheme | 配色方案 | green / violet |
| p045 | emphasis | 强调卡片 | default / ticket |
| p046 | scheme | 配色方案 | green / violet |
| p046 | emphasis | 强调卡片 | default / ticket |
| p047 | scheme | 配色方案 | green / violet |
| p047 | emphasis | 强调卡片 | default / ticket |
| p048 | scheme | 配色方案 | green / violet |
| p048 | emphasis | 强调卡片 | default / ticket |
| p049 | scheme | 配色方案 | green / violet |
| p049 | emphasis | 强调卡片 | default / ticket |
| p050 | scheme | 配色方案 | green / violet |
| p050 | emphasis | 强调卡片 | default / ticket |
| p051 | scheme | 配色方案 | green / violet |
| p051 | emphasis | 强调卡片 | default / ticket |
| p051 | focusSide | 重点强调 | none / left / right |
| p052 | scheme | 配色方案 | green / violet |
| p052 | emphasis | 强调卡片 | default / ticket |
| p052 | imageSide | 图片位置 | left / right |
| p053 | scheme | 配色方案 | green / violet |
| p053 | emphasis | 强调卡片 | default / ticket |
| p054 | scheme | 配色方案 | green / violet |
| p054 | emphasis | 强调卡片 | default / ticket |
| p054 | sortBy | 排序方式 | none / to / delta |
| p056 | scheme | 配色方案 | green / violet |
| p056 | emphasis | 强调卡片 | default / ticket |
| p057 | scheme | 配色方案 | green / violet |
| p057 | emphasis | 强调卡片 | default / ticket |
| p058 | scheme | 配色方案 | green / violet |
| p058 | emphasis | 强调卡片 | default / ticket |
| p058 | faceTexture | 表面质感 | gloss / duotone / hatched |
| p059 | scheme | 配色方案 | green / violet |
| p059 | emphasis | 强调卡片 | default / ticket |
| p059 | imageSide | 图片位置 | left / right |
| p061 | scheme | 配色方案 | green / violet |
| p061 | emphasis | 强调卡片 | default / ticket |
| p061 | scaleMode | 半径映射 | radius / area |
| p063 | scheme | 配色方案 | green / violet |
| p063 | emphasis | 强调卡片 | default / ticket |
| p065 | scheme | 配色方案 | green / violet |
| p065 | emphasis | 强调卡片 | default / ticket |
| p066 | scheme | 配色方案 | green / violet |
| p066 | emphasis | 强调卡片 | default / ticket |
| p067 | scheme | 配色方案 | green / violet |
| p067 | emphasis | 强调卡片 | default / ticket |
| p071 | scheme | 配色方案 | green / violet |
| p071 | emphasis | 强调卡片 | default / ticket |
| p072 | scheme | 配色方案 | green / violet |
| p072 | emphasis | 强调卡片 | default / ticket |
| p073 | scheme | 配色方案 | green / violet |
| p073 | emphasis | 强调卡片 | default / ticket |
| p074 | scheme | 配色方案 | green / violet |
| p074 | emphasis | 强调卡片 | default / ticket |

### 不收的 select 控件（20，会改版式几何或渲染失败）

| 版式 | 控件 | 原因 |
|---|---|---|
| p001 | layout | 取值 "centered"：第 2 个元素 x 相差 797.0px |
| p003 | statSide | 取值 "left"：第 2 个元素 y 相差 63.7px |
| p008 | chartType | 取值 "bar"：第 11 个元素 y 相差 11.7px |
| p010 | chartType | 取值 "pie"：元素数量 36 → 34 |
| p012 | orientation | 取值 "vertical"：第 6 个元素 x 相差 156.4px |
| p014 | align | 取值 "center"：第 2 个元素 x 相差 357.3px |
| p020 | layout | 取值 "feature"：第 6 个元素 宽 相差 531.6px |
| p021 | align | 取值 "center"：元素数量 20 → 18 |
| p023 | layout | 取值 "hero-right"：第 6 个元素 宽 相差 495.3px |
| p023 | heroExtra | 取值 "spark"：元素数量 32 → 34 |
| p040 | layout | 取值 "gauges"：元素数量 34 → 27 |
| p044 | orientation | 取值 "vertical"：第 6 个元素 宽 相差 1337.5px |
| p046 | layout | 取值 "grid"：第 6 个元素 宽 相差 863.0px |
| p047 | align | 取值 "center"：第 2 个元素 x 相差 797.0px |
| p048 | chartType | 取值 "stacked"：元素数量 44 → 45 |
| p049 | titlePlacement | 取值 "bl"：第 3 个元素 y 相差 648.6px |
| p049 | overlayStyle | 取值 "plain"：元素数量 9 → 8 |
| p072 | baseline | 取值 "bottom"：第 7 个元素 y 相差 38.1px |
| p073 | layout | 取值 "stack"：元素数量 29 → 26 |
| p074 | align | 取值 "center"：元素数量 13 → 12 |

## 白名单命中（供人复核）

白名单（英文）：top、no、nos、vol、page、pages、fig、figure、est、rev、ver、tel、fax、www、com、am、pm、vs、and、the、for、of、jan、feb、mar、apr、may、jun、jul、aug、sep、sept、oct、nov、dec、mon、tue、wed、thu、fri、sat、sun、january、february、march、april、june、july、august、september、october、november、december、monday、tuesday、wednesday、thursday、friday、saturday、sunday、next、prev、previous、back、scroll、start、end、fin

白名单（中文）：一月、二月、三月、四月、五月、六月、七月、八月、九月、十月、十一月、十二月、周一、周二、周三、周四、周五、周六、周日、星期一、星期二、星期三、星期四、星期五、星期六、星期日、第一季度、第二季度、第三季度、第四季度、季度、上半年、下半年

| 命中文字 | 版式数 |
|---|---|
| VS | 2 |

## 现有规则已排除（4，未渲染）

media 4

