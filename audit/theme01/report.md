# theme01 版式审计

- 版式总数 84；参与审计 81；现有规则已排除（媒体槽隐藏不了 / contentLocked / inspect 失败）3
- 本次自动排除 7 个：写死文字 6、图片主体 1、品牌图标 0（一个版式命中多类时每类各计一次）
- 人工排除（审计时仍渲染，用来核对判定）0；渲染失败 0；待人工确认 0
- select 控件共 118 个，判定为只改外观（可随机）97 个
- 耗时：标记渲染 26 秒（81 页）；控件检查 3 分 42 秒（674 页）；合计 4 分 7 秒
- 清单写入：新增自动排除 7 条、清掉旧的自动排除 9 条、styleControls 97 条

## 自动排除（7）

| 版式 | 名称 | 类别 | 证据 | 已有人工排除 |
|---|---|---|---|---|
| p010 | 横纵分析法 | 写死文字 | 写死文字：交叉 |  |
| p051 | 市销率天梯 · 估值 vs 收入 | 写死文字 | 写死文字：估值 收入 |  |
| p052 | 贴纸拼贴 · 前沿掠影 | 图片主体 | 图片主体：图片 / 点击上传 |  |
| p053 | 资金热力矩阵 | 写死文字 | 写死文字：单位 美元 |  |
| p065 | 三强能力雷达 | 写死文字 | 写死文字：均分 |  |
| p068 | 估值跃迁 · 哑铃图 | 写死文字 | 写死文字：估值 / 估值 美元 |  |
| p075 | 同比对比 · 分组柱状图 | 写死文字 | 写死文字：单位 美元 |  |

## 待人工确认（0）

候选文字只有一个英文词，判不准是不是写死文字，没有自动排除。

（无）

## 渲染失败（0）

（无）

## 可随机的外观控件（styleControls）

| 版式 | 控件 | 名称 | 取值 |
|---|---|---|---|
| p001 | accentColor | 主题色 | #5b8def / #46b083 / #e0a23a / #e8503a / #7a5ae0 |
| p002 | accentColor | 主题色 | #46b083 / #5b8def / #e0a23a / #e8503a / #7a5ae0 |
| p003 | accentColor | 主题色 | #e0a23a / #5b8def / #46b083 / #e8503a / #7a5ae0 |
| p004 | accentColor | 主题色 | #7a5ae0 / #5b8def / #46b083 / #e0a23a / #e8503a |
| p005 | accentColor | 主题色 | #5b8def / #46b083 / #e0a23a / #e8503a / #7a5ae0 |
| p006 | accentColor | 主题色 | #e8503a / #5b8def / #46b083 / #e0a23a / #7a5ae0 |
| p007 | accentColor | 强调色 | #e8503a / #5b8def / #46b083 / #e0a23a / #7a5ae0 / #c9f24d |
| p008 | imageFit | 图片填充 | cover / contain |
| p008 | accentColor | 主题色 | #46b083 / #5b8def / #e0a23a / #e8503a / #7a5ae0 / #c9f24d |
| p009 | accentColor | 主题色 | #5b8def / #46b083 / #e0a23a / #e8503a / #7a5ae0 |
| p011 | accentColor | 主题色 | #5b8def / #46b083 / #e0a23a / #e8503a / #7a5ae0 |
| p011 | imageFit | 图片填充 | cover / contain |
| p013 | accentColor | 主题色 | #5b8def / #46b083 / #e0a23a / #e8503a / #7a5ae0 |
| p013 | imageFit | 图片填充 | cover / contain |
| p014 | palette | 分层配色 | #5b8def,#46b083,#e0a23a / #7a5ae0,#5b8def,#46b083 / #e8503a,#e0a23a,#46b083 / #3… |
| p015 | imageFit | 图片填充 | cover / contain |
| p015 | imageLayout | 图片版式 | normal / collage |
| p015 | accentColor | 主题色 | #5b8def / #46b083 / #e0a23a / #e8503a / #7a5ae0 / #c9f24d |
| p018 | accentColor | 强调色 | #7a5ae0 / #5b8def / #46b083 / #e0a23a / #e8503a / #c9f24d |
| p021 | accentColor | 主题色 | #5b8def / #46b083 / #e0a23a / #e8503a / #7a5ae0 |
| p022 | accentColor | 主题色 | #5b8def / #46b083 / #e0a23a / #e8503a / #7a5ae0 / #c9f24d |
| p023 | accentColor | 强调色 | #7a5ae0 / #5b8def / #46b083 / #e0a23a / #e8503a / #c9f24d |
| p024 | accentColor | 主题色 | #5b8def / #46b083 / #e0a23a / #e8503a / #7a5ae0 |
| p024 | imageFit | 图片填充 | cover / contain |
| p025 | accentColor | 强调色 | #46b083 / #5b8def / #e0a23a / #e8503a / #7a5ae0 |
| p025 | imageFit | 图片填充 | contain / cover |
| p026 | imageFit | 图片填充 | cover / contain |
| p026 | imageLayout | 图片版式 | normal / collage |
| p027 | accentColor | 荧光色 | #c9f24d / #46b083 / #5b8def / #e0a23a / #e8503a / #7a5ae0 |
| p028 | accentColor | 强调色 | #e8503a / #5b8def / #46b083 / #e0a23a / #7a5ae0 / #c9f24d |
| p029 | imageFit | 图片填充 | cover / contain |
| p029 | imageSide | 图片位置 | left / right |
| p029 | imageLayout | 图片版式 | normal / collage |
| p029 | accentColor | 主题色 | #7a5ae0 / #5b8def / #46b083 / #e0a23a / #e8503a |
| p030 | unicornScene | 动态场景 | tech / automations / moving / goey |
| p030 | imageFit | 图片填充 | cover / contain |
| p030 | accentColor | 主题色 | #7a5ae0 / #5b8def / #46b083 / #e0a23a / #e8503a / #c9f24d |
| p032 | barColor | 柱状颜色 | #5b8def / #46b083 / #7a5ae0 / #e0a23a |
| p032 | lineColor | 折线颜色 | #e8503a / #e0a23a / #7a5ae0 / #46b083 |
| p033 | accentColor | 主题色 | #5b8def / #46b083 / #e0a23a / #e8503a / #7a5ae0 |
| p035 | imageFit | 图片填充 | cover / contain |
| p035 | imageLayout | 图片版式 | normal / collage |
| p035 | accentColor | 主题色 | #5b8def / #46b083 / #e0a23a / #e8503a / #7a5ae0 / #c9f24d |
| p036 | accentColor | 主题色 | #5b8def / #46b083 / #e0a23a / #e8503a / #7a5ae0 |
| p036 | imageFit | 图片填充 | cover / contain |
| p037 | accentColor | 主题色 | #e8503a / #5b8def / #46b083 / #e0a23a / #7a5ae0 |
| p039 | highlightColumn | 重点强调 | none / bullish / cautious |
| p040 | accentColor | 强调色 | #46b083 / #5b8def / #e0a23a / #e8503a / #7a5ae0 |
| p041 | unicornScene | 动态场景 | tech / automations / moving / goey |
| p041 | imageFit | 图片填充 | cover / contain |
| p041 | accentColor | 主题色 | #7a5ae0 / #5b8def / #46b083 / #e0a23a / #e8503a / #c9f24d |
| p042 | palette | 三卡配色 | #5b8def,#46b083,#7a5ae0 / #7a5ae0,#5b8def,#46b083 / #e8503a,#e0a23a,#46b083 / #5… |
| p043 | imageFit | 图片裁切 | cover / contain |
| p043 | highlightSide | 点亮一侧 | left / right / none |
| p043 | accentColor | 强调色 | #e8503a / #5b8def / #46b083 / #e0a23a / #7a5ae0 / #c9f24d |
| p045 | imageFit | 图片填充 | cover / contain |
| p045 | imageLayout | 图片版式 | normal / collage |
| p046 | imageFit | 图片填充 | cover / contain |
| p046 | imageLayout | 图片版式 | normal / collage |
| p047 | accentColor | 荧光色 | #c9f24d / #46b083 / #5b8def / #e0a23a / #e8503a / #7a5ae0 |
| p048 | accentColor | 主题色 | #5b8def / #e8503a / #46b083 / #e0a23a / #7a5ae0 |
| p049 | accentColor | 主题色 | #7a5ae0 / #5b8def / #46b083 / #e0a23a / #e8503a |
| p050 | accentColor | 强调色 | #e8503a / #5b8def / #46b083 / #e0a23a / #7a5ae0 / #c9f24d |
| p054 | accentColor | 主题色 | #46b083 / #5b8def / #e0a23a / #e8503a / #7a5ae0 |
| p055 | accentColor | 主题色 | #5b8def / #46b083 / #e0a23a / #e8503a / #7a5ae0 |
| p056 | accentColor | 聚焦色 | #7a5ae0 / #5b8def / #46b083 / #e0a23a / #e8503a |
| p057 | imageFit | 图片填充 | cover / contain |
| p057 | imageSide | 图片位置 | right / left |
| p057 | accentColor | 主题色 | #c9f24d / #5b8def / #46b083 / #e0a23a / #e8503a / #7a5ae0 |
| p058 | accentColor | 主题色 | #e0a23a / #5b8def / #46b083 / #e8503a / #7a5ae0 |
| p059 | accentColor | 主题色 | #5b8def / #46b083 / #e0a23a / #e8503a / #7a5ae0 |
| p060 | accentColor | 主题色 | #46b083 / #5b8def / #e0a23a / #e8503a / #7a5ae0 |
| p061 | accentColor | 主题色 | #e8503a / #5b8def / #46b083 / #e0a23a / #7a5ae0 |
| p062 | unicornScene | 动态场景 | tech / automations / moving / goey |
| p062 | imageFit | 图片适配 | cover / contain |
| p062 | accentColor | 主题色 | #e0a23a / #5b8def / #46b083 / #e8503a / #7a5ae0 |
| p063 | unicornScene | 动态场景 | tech / automations / moving / goey |
| p063 | imageFit | 图片填充 | cover / contain |
| p063 | accentColor | 荧光色 | #c9f24d / #5b8def / #46b083 / #e0a23a / #e8503a / #7a5ae0 |
| p064 | accentColor | 主题色 | #7a5ae0 / #5b8def / #46b083 / #e0a23a / #e8503a / #c9f24d |
| p066 | accentColor | 主题色 | #5b8def / #46b083 / #e0a23a / #e8503a / #7a5ae0 |
| p067 | accentColor | 分类色 | #46b083 / #5b8def / #e0a23a / #7a5ae0 / #e8503a |
| p067 | totalColor | 合计柱色 | #2b2b30 / #5b8def / #46b083 / #e0a23a / #7a5ae0 / #e8503a |
| p069 | accentColor | 荧光色 | #c9f24d / #46b083 / #5b8def / #e0a23a / #e8503a / #7a5ae0 |
| p070 | accentColor | 主题色 | #5b8def / #46b083 / #e0a23a / #e8503a / #7a5ae0 |
| p071 | accentColor | 主题色 | #46b083 / #5b8def / #e0a23a / #e8503a / #7a5ae0 |
| p072 | accentColor | 主题色 | #7a5ae0 / #5b8def / #46b083 / #e0a23a / #e8503a |
| p073 | imageSide | 图片位置 | right / left |
| p073 | imageFit | 图片填充 | cover / contain |
| p073 | accentColor | 主题色 | #46b083 / #5b8def / #e0a23a / #e8503a / #7a5ae0 |
| p074 | accentColor | 主题色 | #5b8def / #46b083 / #e0a23a / #e8503a / #7a5ae0 |
| p079 | accentColor | 主题色 | #7a5ae0 / #5b8def / #46b083 / #e0a23a / #e8503a |
| p080 | palette | 阶段配色 | #5b8def,#46b083,#e0a23a / #7a5ae0,#5b8def,#46b083 / #e8503a,#e0a23a,#46b083 / #2… |
| p082 | accentColor | 主题色 | #7a5ae0 / #5b8def / #46b083 / #e0a23a / #e8503a |
| p083 | colorMode | 配色模式 | series / mono |
| p083 | accentColor | 主题色 | #5b8def / #46b083 / #e0a23a / #e8503a / #7a5ae0 |
| p084 | accentColor | 主题色 | #5b8def / #46b083 / #e0a23a / #e8503a / #7a5ae0 |

### 不收的 select 控件（21，会改版式几何或渲染失败）

| 版式 | 控件 | 原因 |
|---|---|---|
| p006 | align | 取值 "left"：第 2 个元素 x 相差 810.0px |
| p007 | columns | 取值 4：第 8 个元素 宽 相差 433.0px |
| p012 | chartType | 取值 "line"：元素数量 37 → 29 |
| p015 | layout | 取值 "overlay"：第 5 个元素 宽 相差 624.0px |
| p016 | chartType | 取值 "pie"：元素数量 40 → 37 |
| p021 | emphasizeCol | 取值 -1：元素数量 69 → 49 |
| p027 | align | 取值 "center"：第 2 个元素 x 相差 978.0px |
| p028 | layout | 取值 "below"：第 7 个元素 x 相差 193.2px |
| p030 | backgroundMode | 取值 "media"：第 3 个元素 x 相差 736.2px |
| p030 | plate | 取值 "bottom-right"：第 6 个元素 x 相差 856.0px |
| p033 | emphasizeCol | 取值 -1：元素数量 48 → 41 |
| p035 | layout | 取值 "overlay"：第 5 个元素 宽 相差 624.0px |
| p041 | backgroundMode | 取值 "media"：第 3 个元素 x 相差 736.2px |
| p041 | plate | 取值 "center-left"：第 6 个元素 x 相差 856.0px |
| p044 | chartType | 取值 "bar"：第 5 个元素 y 相差 96.4px |
| p047 | align | 取值 "center"：第 2 个元素 x 相差 978.0px |
| p062 | backgroundMode | 取值 "media"：元素数量 26 → 22 |
| p063 | backgroundMode | 取值 "media"：元素数量 21 → 20 |
| p078 | radiusScale | 取值 "linear"：第 7 个元素 宽 相差 10.4px |
| p079 | chartType | 取值 "pie"：元素数量 58 → 55 |
| p082 | align | 取值 "center"：第 2 个元素 x 相差 808.4px |

## 白名单命中（供人复核）

白名单（英文）：top、no、nos、vol、page、pages、fig、figure、est、rev、ver、tel、fax、www、com、am、pm、vs、and、the、for、of、jan、feb、mar、apr、may、jun、jul、aug、sep、sept、oct、nov、dec、mon、tue、wed、thu、fri、sat、sun、january、february、march、april、june、july、august、september、october、november、december、monday、tuesday、wednesday、thursday、friday、saturday、sunday、next、prev、previous、back、scroll、start、end、fin、chart、table、curve、trend、peak、trough、total、count、amount、diverging、area、radar、tiers、structure、donut、stage、flow、funnel、convert、bubbles、high、low、wall、statement、menu、scale、part、step、phase、pest、pulse、nodes、layers、layer、columns、waterfall、heat、map

白名单（中文）：一月、二月、三月、四月、五月、六月、七月、八月、九月、十月、十一月、十二月、周一、周二、周三、周四、周五、周六、周日、星期一、星期二、星期三、星期四、星期五、星期六、星期日、第一季度、第二季度、第三季度、第四季度、季度、上半年、下半年、合计、全年合计、单位、占比、均值、月度均值、重点、峰值、低位、目标、其余、全年、数据、分布、基准、结论、高亮、章节、摘要、阶段、纵轴、横轴、数量、金额、关键节点、主线

| 命中文字 | 版式数 |
|---|---|
| 其余 | 1 |
| Q1 | 1 |
| Q2 | 1 |
| Q3 | 1 |
| Q4 | 1 |
| 合计 | 1 |
| 目标 | 1 |
| M0 | 1 |

## 现有规则已排除（3，未渲染）

media 3

