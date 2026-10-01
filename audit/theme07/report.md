# theme07 版式审计

- 版式总数 71；参与审计 70；现有规则已排除（媒体槽隐藏不了 / contentLocked / inspect 失败）1
- 本次自动排除 9 个：写死文字 9、图片主体 0、品牌图标 0（一个版式命中多类时每类各计一次）
- 人工排除（审计时仍渲染，用来核对判定）0；渲染失败 0；待人工确认 0
- select 控件共 155 个，判定为只改外观（可随机）93 个
- 耗时：标记渲染 23 秒（70 页）；控件检查 5 分 12 秒（980 页）；合计 5 分 34 秒
- 清单写入：新增自动排除 9 条、清掉旧的自动排除 12 条、styleControls 91 条；另有 2 个控件因契约会超 1500 字符没有写入（p054.accentColor、p054.focusIndex）

## 自动排除（9）

| 版式 | 名称 | 类别 | 证据 | 已有人工排除 |
|---|---|---|---|---|
| p011 | 排名 Ranking | 写死文字 | 写死文字：亿美元 |  |
| p012 | 象限 Quadrant | 写死文字 | 写死文字：高热度 高兑现 / 高热度 低兑现 / 低热度 高兑现 |  |
| p014 | 策略 Outlook | 写死文字 | 写死文字：看好方向 / 谨慎方向 |  |
| p017 | 气泡 Deal Map | 写死文字 | 写死文字：亿美元 |  |
| p020 | 季度 Q3 峰值 | 写死文字 | 写死文字：融资额 |  |
| p022 | 峰谷 Peak/Trough | 写死文字 | 写死文字：常规 |  |
| p051 | 联盟 云厂商 | 写死文字 | 写死文字：算力消费回收 |  |
| p063 | 风险 壁垒压缩 | 写死文字 | 写死文字：壁垒线 |  |
| p064 | 策略 优先基建 | 写死文字 | 写死文字：确定性 |  |

## 待人工确认（0）

候选文字只有一个英文词，判不准是不是写死文字，没有自动排除。

（无）

## 渲染失败（0）

（无）

## 可随机的外观控件（styleControls）

| 版式 | 控件 | 名称 | 取值 |
|---|---|---|---|
| p001 | accentColor | 主题色 | #8FD400 / #23C76A / #2F7BFF / #F2A93B / #0D100A |
| p002 | accentColor | 主题色 | #8FD400 / #23C76A / #2F7BFF / #F2A93B / #0D100A |
| p003 | accentColor | 主题色 | #8FD400 / #23C76A / #2F7BFF / #F2A93B / #0D100A |
| p004 | accentColor | 主题色 | #8FE327 / #23C76A / #2F7BFF / #F5A623 / #FFFFFF |
| p005 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p006 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p007 | columns | 每行列数 | 3 / 4 |
| p007 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p008 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p010 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p013 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p015 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p016 | backgroundVariant | 背景风格 | dark / paper |
| p016 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p018 | chartType | 图表类型 | bars / line / area |
| p018 | focusIndex | 重点元素 | 0 / 1 / 2 / 3 |
| p018 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p019 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p021 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p023 | focusIndex | 重点元素 | 0 / 1 / 2 / 3 / 4 |
| p023 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p024 | focusIndex | 重点元素 | 0 / 1 / 2 / 3 |
| p024 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p025 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p026 | focusIndex | 重点元素 | 0 / 1 / 2 / 3 |
| p026 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p027 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p028 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p029 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p030 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p031 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p032 | imageRatio | 图片比例 | landscape / portrait / square / auto |
| p032 | focusIndex | 重点元素 | 0 / 1 / 2 |
| p032 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p033 | imageRatio | 图片比例 | portrait / landscape / square / auto |
| p033 | focusIndex | 重点元素 | 0 / 1 / 2 / 3 |
| p033 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p034 | focusIndex | 重点元素 | 0 / 1 / 2 / 3 |
| p034 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p035 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p036 | focusIndex | 重点元素 | 0 / 1 / 2 |
| p036 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p037 | imageRatio | 图片比例 | portrait / landscape / square / auto |
| p037 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p038 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p039 | focusIndex | 重点元素 | 0 / 1 / 2 / 3 |
| p039 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p040 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p041 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p042 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p043 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p044 | focusIndex | 重点元素 | 0 / 1 |
| p044 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p045 | focusIndex | 重点元素 | 0 / 1 / 2 |
| p045 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p046 | backgroundVariant | 背景风格 | dark / paper |
| p046 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p047 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p048 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p049 | focusIndex | 重点元素 | 0 / 1 / 2 / 3 |
| p049 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p050 | imageRatio | 图片比例 | landscape / portrait / square / auto |
| p050 | focusIndex | 重点元素 | 0 / 1 / 2 / 3 |
| p050 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p052 | imageRatio | 图片比例 | auto / normal / portrait / landscape / square |
| p052 | focusIndex | 重点元素 | 0 / 1 / 2 / 3 |
| p052 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p053 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p054 | focusIndex | 重点元素 | 0 / 1 / 2 / 3 |
| p054 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p055 | focusIndex | 重点元素 | 0 / 1 / 2 |
| p055 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p056 | focusIndex | 重点元素 | 0 / 1 / 2 / 3 |
| p056 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p057 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p058 | focusIndex | 重点元素 | 0 / 1 / 2 / 3 |
| p058 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p059 | backgroundVariant | 背景风格 | dark / paper |
| p059 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p060 | focusIndex | 重点元素 | 0 / 1 / 2 / 3 |
| p060 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p061 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p062 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p065 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p066 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p067 | backgroundVariant | 背景风格 | paper / dark |
| p067 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p068 | backgroundVariant | 背景风格 | dark / paper |
| p068 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p069 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p070 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |
| p071 | imageRatio | 图片比例 | portrait / landscape / square / auto |
| p071 | accentColor | 主题色 | #86D62B / #23C76A / #2F7BFF / #F2A93B / #0E110B |

### 不收的 select 控件（62，会改版式几何或渲染失败）

| 版式 | 控件 | 原因 |
|---|---|---|
| p005 | backgroundVariant | 取值 "solid"：元素数量 86 → 85 |
| p005 | heroMotif | 取值 "lens"：元素数量 86 → 84 |
| p006 | focusIndex | 取值 1：第 39 个元素 y 相差 6.0px |
| p006 | chartType | 取值 "donut"：元素数量 120 → 117 |
| p007 | focusIndex | 取值 0：第 7 个元素 y 相差 6.0px |
| p008 | layout | 取值 "row"：第 18 个元素 宽 相差 518.7px |
| p008 | focusIndex | 取值 0：第 18 个元素 x 相差 8.0px |
| p010 | chartType | 取值 "grid"：元素数量 79 → 90 |
| p010 | focusIndex | 取值 0：第 19 个元素 x 相差 3.7px |
| p013 | focusIndex | 取值 1：第 18 个元素 x 相差 8.0px |
| p015 | align | 取值 "left"：第 11 个元素 x 相差 791.8px |
| p016 | layout | 取值 "center"：元素数量 56 → 52 |
| p019 | focusIndex | 取值 1：第 18 个元素 x 相差 6.0px |
| p021 | focusIndex | 取值 0：第 14 个元素 x 相差 7.5px |
| p024 | metricMode | 取值 "count"：元素数量 102 → 80 |
| p026 | imageRatio | 取值 "landscape"：第 11 个元素 x 相差 150.5px |
| p027 | chartType | 取值 "lollipop"：第 17 个元素 y 相差 9.0px |
| p027 | focusIndex | 取值 1：第 13 个元素 x 相差 6.0px |
| p029 | focusIndex | 取值 1：第 15 个元素 x 相差 6.0px |
| p030 | imageRatio | 取值 "landscape"：第 31 个元素 y 相差 47.3px |
| p030 | focusIndex | 取值 1：第 11 个元素 x 相差 6.0px |
| p031 | focusIndex | 取值 1：第 17 个元素 x 相差 6.0px |
| p033 | chartType | 取值 "bars"：元素数量 77 → 72 |
| p034 | chartType | 取值 "bars"：元素数量 153 → 78 |
| p035 | focusIndex | 取值 1：第 21 个元素 x 相差 6.0px |
| p036 | imageRatio | 取值 "portrait"：第 29 个元素 y 相差 33.8px |
| p037 | chartType | 取值 "donut"：元素数量 76 → 83 |
| p037 | focusIndex | 取值 1：第 16 个元素 宽 相差 13.9px |
| p038 | chartType | 取值 "bars"：元素数量 119 → 78 |
| p038 | focusIndex | 取值 1：第 65 个元素 x 相差 8.0px |
| p039 | imageRatio | 取值 "portrait"：第 8 个元素 y 相差 33.8px |
| p040 | imageRatio | 取值 "landscape"：第 31 个元素 y 相差 33.8px |
| p040 | focusIndex | 取值 1：第 12 个元素 x 相差 4.8px |
| p041 | focusIndex | 取值 1：第 21 个元素 x 相差 6.0px |
| p042 | imageRatio | 取值 "portrait"：第 8 个元素 y 相差 33.8px |
| p042 | focusIndex | 取值 1：第 20 个元素 x 相差 5.4px |
| p043 | imageRatio | 取值 "landscape"：第 40 个元素 y 相差 95.3px |
| p043 | focusIndex | 取值 0：第 12 个元素 y 相差 4.0px |
| p044 | imageRatio | 取值 "portrait"：第 8 个元素 y 相差 33.8px |
| p044 | chartType | 取值 "bar"：元素数量 71 → 72 |
| p045 | imageRatio | 取值 "landscape"：第 32 个元素 y 相差 33.8px |
| p046 | layout | 取值 "center"：元素数量 77 → 54 |
| p047 | focusIndex | 取值 1：第 21 个元素 x 相差 6.0px |
| p048 | chartType | 取值 "donut"：元素数量 91 → 81 |
| p048 | focusIndex | 取值 1：第 29 个元素 y 相差 6.0px |
| p049 | chartType | 取值 "bars"：元素数量 82 → 77 |
| p054 | region | 取值 1：第 4 个元素 宽 相差 21.8px |
| p054 | imageRatio | 取值 "landscape"：第 45 个元素 x 相差 125.5px |
| p054 | chartType | 取值 "donut"：元素数量 88 → 1 |
| p055 | align | 取值 "left"：第 11 个元素 x 相差 797.4px |
| p056 | imageRatio | 取值 "landscape"：第 27 个元素 x 相差 111.5px |
| p058 | imageRatio | 取值 "landscape"：第 29 个元素 x 相差 111.5px |
| p059 | layout | 取值 "center"：元素数量 57 → 53 |
| p061 | focusIndex | 取值 1：第 17 个元素 x 相差 6.0px |
| p065 | focusIndex | 取值 0：第 11 个元素 y 相差 6.0px |
| p066 | focusIndex | 取值 1：第 11 个元素 y 相差 6.0px |
| p067 | align | 取值 "left"：第 11 个元素 x 相差 789.4px |
| p068 | layout | 取值 "center"：元素数量 56 → 52 |
| p069 | chartType | 取值 "bars"：元素数量 68 → 86 |
| p069 | focusIndex | 取值 1：第 15 个元素 y 相差 3.0px |
| p070 | focusIndex | 取值 1：第 17 个元素 x 相差 6.0px |
| p071 | focusIndex | 取值 1：第 12 个元素 x 相差 6.0px |

## 白名单命中（供人复核）

白名单（英文）：top、no、nos、vol、page、pages、fig、figure、est、rev、ver、tel、fax、www、com、am、pm、vs、and、the、for、of、jan、feb、mar、apr、may、jun、jul、aug、sep、sept、oct、nov、dec、mon、tue、wed、thu、fri、sat、sun、january、february、march、april、june、july、august、september、october、november、december、monday、tuesday、wednesday、thursday、friday、saturday、sunday、next、prev、previous、back、scroll、start、end、fin、chart、table、curve、trend、peak、trough、total、count、amount、diverging、area、radar、tiers、structure、donut、stage、flow、funnel、convert、bubbles、high、low、wall、statement、menu、scale、part、step、phase、pest、pulse、nodes、layers、layer、columns、waterfall、heat、map

白名单（中文）：一月、二月、三月、四月、五月、六月、七月、八月、九月、十月、十一月、十二月、周一、周二、周三、周四、周五、周六、周日、星期一、星期二、星期三、星期四、星期五、星期六、星期日、第一季度、第二季度、第三季度、第四季度、季度、上半年、下半年、合计、全年合计、单位、占比、均值、月度均值、重点、峰值、低位、目标、其余、全年、数据、分布、基准、结论、高亮、章节、摘要、阶段、纵轴、横轴、数量、金额、关键节点、主线

| 命中文字 | 版式数 |
|---|---|
| 重点 | 1 |
| 峰值月 | 1 |
| 月度均值 | 1 |
| 均值 | 1 |
| 纵轴 | 1 |
| 横轴 | 1 |
| Q1 | 1 |
| 峰值 | 1 |
| 低位 | 1 |
| 数量 | 1 |
| 金额 | 1 |
| NODES | 1 |
| LAYERS | 1 |

## 现有规则已排除（1，未渲染）

media 1

