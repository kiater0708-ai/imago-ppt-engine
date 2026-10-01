# theme04 版式审计

- 版式总数 74；参与审计 73；现有规则已排除（媒体槽隐藏不了 / contentLocked / inspect 失败）1
- 本次自动排除 5 个：写死文字 5、图片主体 0、品牌图标 0（一个版式命中多类时每类各计一次）
- 人工排除（审计时仍渲染，用来核对判定）0；渲染失败 3；待人工确认 0
- select 控件共 113 个，判定为只改外观（可随机）28 个
- 耗时：标记渲染 32 秒（73 页）；控件检查 2 分 53 秒（516 页）；合计 3 分 25 秒
- 清单写入：新增自动排除 8 条、清掉旧的自动排除 6 条、styleControls 28 条

## 自动排除（5）

| 版式 | 名称 | 类别 | 证据 | 已有人工排除 |
|---|---|---|---|---|
| p016 | 一图速览 | 写死文字 | 写死文字：全年 AI 风投总额 美元 / 亿美元事件 / 钱在追少数人 |  |
| p027 | 投资人出手榜 | 写死文字 | 写死文字：风险投资 / 战略投资 / 成长基金 |  |
| p028 | 能力对照矩阵 | 写死文字 | 写死文字：领先 / 具备 / 偏弱 |  |
| p038 | 产业链分层表 | 写死文字 | 写死文字：基础设施 / 模型层 / 应用层 |  |
| p065 | 资本三段式 | 写死文字 | 写死文字：叙事驱动 / 算力卡位 / 兑现为王 |  |

## 待人工确认（0）

候选文字只有一个英文词，判不准是不是写死文字，没有自动排除。

（无）

## 渲染失败（3）

| 版式 | 名称 | 原因 |
|---|---|---|
| p044 | 杂志封面 | 渲染失败（退出码 1）：Goal spec validation failed: - slide 1 layout theme04_page044 field layout: cover-like layouts must use themeXX_page001-page005 |
| p045 | 图背章节页 | 渲染失败（退出码 1）：Goal spec validation failed: - slide 1 layout theme04_page045 field layout: cover-like layouts must use themeXX_page001-page005 |
| p066 | 泳道甘特 | 渲染失败（退出码 1）：Goal spec validation failed: - slide 1 layout theme04_page066 field props: Slide props mismatch for "theme04_page066": lanesData[2].ev: fixed nested array length 1 does not match default 2… |

## 可随机的外观控件（styleControls）

| 版式 | 控件 | 名称 | 取值 |
|---|---|---|---|
| p001 | accentTone | 主色调 | green / yellow / blue / pink |
| p002 | accentTone | 主色调 | green / yellow / blue / pink |
| p003 | accentTone | 主色调 | green / yellow / blue / pink |
| p004 | accentTone | 标题板主色 | green / yellow / blue / pink |
| p004 | paletteVariant | 瓷砖配色 | multi / mono |
| p007 | imageSide | 配图位置 | left / right |
| p007 | accentTone | 主色调 | green / yellow / blue / pink |
| p008 | accentTone | 主色调 | green / yellow / blue / pink |
| p031 | accentTone | 主色调 | green / yellow / blue / pink |
| p035 | accentTone | 主色调 | green / yellow / blue / pink |
| p047 | imageSide | 配图位置 | left / right |
| p047 | accentTone | 主色调 | green / yellow / blue / pink |
| p050 | mediaLayout | 多图排布 | stack / row |
| p051 | accentTone | 主色调 | green / yellow / blue / pink |
| p055 | unicornScene | 动态场景 | tech / automations / moving / goey |
| p055 | accentTone | 主色调 | green / yellow / blue / pink |
| p056 | imageSide | 配图位置 | left / right |
| p056 | accentTone | 主色调 | green / yellow / blue / pink |
| p057 | mediaLayout | 多图构图 | feature / stack |
| p058 | imageSide | 配图位置 | left / right |
| p058 | accentTone | 主色调 | green / yellow / blue / pink |
| p060 | mediaLayout | 排布方式 | scatter / row |
| p061 | accentTone | 主色调 | green / yellow / blue / pink |
| p062 | focusSide | 重点列 | left / right |
| p069 | accentTone | 主色调 | green / yellow / blue / pink |
| p071 | accentTone | 主色调 | green / yellow / blue / pink |
| p072 | accentTone | 主色调 | green / yellow / blue / pink |
| p073 | imageSide | 配图位置 | left / right |

### 不收的 select 控件（85，会改版式几何或渲染失败）

| 版式 | 控件 | 原因 |
|---|---|---|
| p001 | hlStyle | 取值 "pill"：第 4 个元素 y 相差 10.5px |
| p002 | hlStyle | 取值 "pill"：第 8 个元素 y 相差 9.0px |
| p003 | hlStyle | 取值 "pill"：第 9 个元素 y 相差 21.3px |
| p005 | hlStyle | 取值 "pill"：第 4 个元素 宽 相差 7.1px |
| p007 | hlStyle | 取值 "pill"：第 2 个元素 x 相差 2.2px |
| p009 | hlStyle | 取值 "pill"：第 2 个元素 y 相差 8.7px |
| p010 | hlStyle | 取值 "pill"：第 2 个元素 y 相差 3.9px |
| p010 | chartVariant | 取值 "bar"：元素数量 45 → 48 |
| p011 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.6px |
| p011 | chartVariant | 取值 "bars"：元素数量 40 → 50 |
| p012 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.6px |
| p012 | chartVariant | 取值 "bars"：元素数量 45 → 43 |
| p013 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.6px |
| p013 | chartVariant | 取值 "bar"：元素数量 50 → 45 |
| p014 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.6px |
| p014 | chartVariant | 取值 "bar"：元素数量 42 → 38 |
| p015 | hlStyle | 取值 "pill"：第 2 个元素 宽 相差 4.3px |
| p015 | chartVariant | 取值 "total"：元素数量 46 → 36 |
| p017 | hlStyle | 取值 "pill"：第 6 个元素 y 相差 2.2px |
| p017 | chartVariant | 取值 "line"：第 12 个元素 x 相差 20.0px |
| p018 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.6px |
| p018 | chartVariant | 取值 "bar"：元素数量 25 → 24 |
| p019 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.6px |
| p019 | chartVariant | 取值 "absolute"：元素数量 63 → 60 |
| p020 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.6px |
| p020 | chartVariant | 取值 "bar"：元素数量 32 → 26 |
| p021 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.6px |
| p021 | chartVariant | 取值 "bubble"：元素数量 138 → 186 |
| p022 | hlStyle | 取值 "pill"：第 2 个元素 宽 相差 4.3px |
| p023 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.3px |
| p024 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.6px |
| p025 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.6px |
| p026 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.6px |
| p030 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.6px |
| p031 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.6px |
| p032 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.6px |
| p032 | layoutVariant | 取值 "row"：第 6 个元素 宽 相差 431.0px |
| p033 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 6.7px |
| p033 | focusSide | 取值 "left"：第 6 个元素 y 相差 8.0px |
| p034 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.8px |
| p034 | chartVariant | 取值 "bars"：第 7 个元素 y 相差 26.0px |
| p035 | textAlign | 取值 "left"：第 2 个元素 x 相差 550.5px |
| p036 | hlStyle | 取值 "pill"：第 3 个元素 y 相差 4.3px |
| p036 | sortDir | 取值 "asc"：第 12 个元素 x 相差 8.0px |
| p037 | hlStyle | 取值 "pill"：第 3 个元素 y 相差 3.6px |
| p039 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.6px |
| p040 | hlStyle | 取值 "pill"：第 3 个元素 y 相差 3.9px |
| p040 | chartVariant | 取值 "bar"：元素数量 37 → 42 |
| p042 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.6px |
| p042 | frameRatio | 取值 "portrait"：第 6 个元素 y 相差 115.5px |
| p043 | hlStyle | 取值 "pill"：第 3 个元素 y 相差 3.8px |
| p046 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.8px |
| p047 | hlStyle | 取值 "pill"：第 2 个元素 y 相差 4.6px |
| p049 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.8px |
| p049 | chartVariant | 取值 "bars"：元素数量 33 → 87 |
| p051 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.6px |
| p051 | imageSide | 取值 "right"：第 7 个元素 宽 相差 409.1px |
| p052 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.8px |
| p052 | chartVariant | 取值 "bar"：第 7 个元素 x 相差 20.1px |
| p053 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.6px |
| p053 | chartVariant | 取值 "bar"：元素数量 67 → 52 |
| p054 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.6px |
| p054 | chartVariant | 取值 "bars"：元素数量 51 → 45 |
| p055 | backgroundMode | 取值 "media"：元素数量 21 → 19 |
| p055 | hlStyle | 取值 "pill"：第 6 个元素 y 相差 7.3px |
| p055 | textAlign | 取值 "center"：第 6 个元素 x 相差 473.1px |
| p056 | hlStyle | 取值 "pill"：第 2 个元素 y 相差 6.2px |
| p057 | hlStyle | 取值 "pill"：第 2 个元素 y 相差 2.9px |
| p058 | hlStyle | 取值 "pill"：第 2 个元素 y 相差 3.1px |
| p059 | imageSide | 取值 "right"：第 2 个元素 宽 相差 534.0px |
| p060 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.8px |
| p061 | panelSide | 取值 "right"：第 2 个元素 x 相差 110.0px |
| p062 | hlStyle | 取值 "pill"：第 3 个元素 y 相差 4.1px |
| p063 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.8px |
| p063 | focusSide | 取值 "left"：第 8 个元素 x 相差 4.0px |
| p064 | hlStyle | 取值 "pill"：第 3 个元素 y 相差 3.9px |
| p067 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.6px |
| p068 | hlStyle | 取值 "pill"：第 3 个元素 y 相差 3.9px |
| p070 | hlStyle | 取值 "pill"：第 3 个元素 高 相差 7.6px |
| p071 | hlStyle | 取值 "pill"：第 3 个元素 y 相差 11.8px |
| p071 | textAlign | 取值 "center"：第 2 个元素 x 相差 40.1px |
| p072 | hlStyle | 取值 "pill"：第 3 个元素 y 相差 5.3px |
| p072 | textAlign | 取值 "center"：第 2 个元素 x 相差 218.5px |
| p073 | highlightStyle | 取值 "underline"：第 2 个元素 y 相差 3.0px |
| p074 | highlightStyle | 取值 "underline"：第 3 个元素 x 相差 25.0px |

## 白名单命中（供人复核）

白名单（英文）：top、no、nos、vol、page、pages、fig、figure、est、rev、ver、tel、fax、www、com、am、pm、vs、and、the、for、of、jan、feb、mar、apr、may、jun、jul、aug、sep、sept、oct、nov、dec、mon、tue、wed、thu、fri、sat、sun、january、february、march、april、june、july、august、september、october、november、december、monday、tuesday、wednesday、thursday、friday、saturday、sunday、next、prev、previous、back、scroll、start、end、fin、chart、table、curve、trend、peak、trough、total、count、amount、diverging、area、radar、tiers、structure、donut、stage、flow、funnel、convert、bubbles、high、low、wall、statement、menu、scale、part、step、phase、pest、pulse、nodes、layers、layer、columns、waterfall、heat、map

白名单（中文）：一月、二月、三月、四月、五月、六月、七月、八月、九月、十月、十一月、十二月、周一、周二、周三、周四、周五、周六、周日、星期一、星期二、星期三、星期四、星期五、星期六、星期日、第一季度、第二季度、第三季度、第四季度、季度、上半年、下半年、合计、全年合计、单位、占比、均值、月度均值、重点、峰值、低位、目标、其余、全年、数据、分布、基准、结论、高亮、章节、摘要、阶段、纵轴、横轴、数量、金额、关键节点、主线

| 命中文字 | 版式数 |
|---|---|
| PART | 2 |
| Part0 | 1 |
| 占比 | 1 |

## 现有规则已排除（1，未渲染）

media 1

