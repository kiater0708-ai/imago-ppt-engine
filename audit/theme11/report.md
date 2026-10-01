# theme11 版式审计

- 版式总数 87；参与审计 63；现有规则已排除（媒体槽隐藏不了 / contentLocked / inspect 失败）24
- 本次自动排除 10 个：写死文字 12、图片主体 1、品牌图标 0（一个版式命中多类时每类各计一次）
- 人工排除（审计时仍渲染，用来核对判定）4；渲染失败 0；待人工确认 0
- select 控件共 55 个，判定为只改外观（可随机）50 个
- 耗时：标记渲染 17 秒（63 页）；控件检查 1 分 1 秒（208 页）；合计 1 分 19 秒
- 清单写入：新增自动排除 10 条、清掉旧的自动排除 10 条、styleControls 50 条

## 自动排除（12）

| 版式 | 名称 | 类别 | 证据 | 已有人工排除 |
|---|---|---|---|---|
| p008 | 大势 | 写死文字 | 写死文字：IGNIS 燃点 | 组件写死 IGNIS 燃点 |
| p011 | 方法 | 写死文字 | 写死文字：IGNIS 燃点 |  |
| p012 | 实证 | 写死文字 | 写死文字：IGNIS 燃点 |  |
| p013 | 渠道 | 写死文字 | 写死文字：IGNIS 燃点 | 品牌字标写死改不掉（P0 gala-deck2 实测） |
| p015 | 漏斗 | 写死文字 | 写死文字：IGNIS 燃点 |  |
| p026 | 清单 | 写死文字 | 写死文字：IGNIS 燃点 |  |
| p029 | 作品 | 写死文字 | 写死文字：IGNIS 燃点 |  |
| p032 | 对照 | 写死文字 | 写死文字：IGNIS 燃点 |  |
| p035 | 账目 | 写死文字 | 写死文字：IGNIS 燃点 |  |
| p043 | 异议 | 写死文字 | 写死文字：IGNIS 燃点 |  |
| p051 | 对比 | 写死文字 | 写死文字：IGNIS 燃点 |  |
| p063 | 现场 | 写死文字、图片主体 | 写死文字：门店开业 / 首店 当天售罄 / 产品特写；图片主体：点击 拖拽上传 |  |

## 待人工确认（0）

候选文字只有一个英文词，判不准是不是写死文字，没有自动排除。

（无）

## 渲染失败（0）

（无）

## 可随机的外观控件（styleControls）

| 版式 | 控件 | 名称 | 取值 |
|---|---|---|---|
| p001 | surface | 背景基调 | ink / paper / ember |
| p003 | surface | 背景基调 | ink / paper / ember |
| p004 | surface | 背景基调 | ink / paper / ember |
| p005 | surface | 背景基调 | ink / paper / ember |
| p006 | surface | 背景基调 | ink / paper / ember |
| p007 | surface | 背景基调 | ink / paper / ember |
| p018 | surface | 背景基调 | ink / paper / ember |
| p019 | surface | 背景基调 | ink / paper / ember |
| p020 | surface | 背景基调 | ink / paper / ember |
| p021 | surface | 背景基调 | ink / paper / ember |
| p022 | surface | 背景基调 | ink / paper / ember |
| p023 | surface | 背景基调 | ink / paper / ember |
| p024 | surface | 背景基调 | ink / paper / ember |
| p025 | surface | 背景基调 | ink / paper / ember |
| p027 | surface | 背景基调 | ink / paper / ember |
| p028 | surface | 背景基调 | ink / paper / ember |
| p030 | surface | 背景基调 | ink / paper / ember |
| p031 | surface | 背景基调 | ink / paper / ember |
| p033 | surface | 背景基调 | ink / paper / ember |
| p034 | surface | 背景基调 | ink / paper / ember |
| p037 | surface | 背景基调 | ink / paper / ember |
| p039 | surface | 背景基调 | ink / paper / ember |
| p040 | surface | 背景基调 | ink / paper / ember |
| p042 | surface | 背景基调 | ink / paper / ember |
| p044 | surface | 背景基调 | ink / paper / ember |
| p045 | surface | 背景基调 | ink / paper / ember |
| p047 | surface | 背景基调 | ink / paper / ember |
| p048 | surface | 背景基调 | ink / paper / ember |
| p049 | surface | 背景基调 | ink / paper / ember |
| p052 | surface | 背景基调 | ink / paper / ember |
| p053 | surface | 背景基调 | ink / paper / ember |
| p054 | surface | 背景基调 | ink / paper / ember |
| p054 | chartVariant | 图表类型 | area / lines |
| p056 | surface | 背景基调 | ink / paper / ember |
| p057 | surface | 背景基调 | ink / paper / ember |
| p059 | surface | 背景基调 | ink / paper / ember |
| p060 | surface | 背景基调 | ink / paper / ember |
| p062 | surface | 背景基调 | ink / paper / ember |
| p064 | surface | 背景基调 | ink / paper / ember |
| p066 | surface | 背景基调 | ink / paper / ember |
| p067 | surface | 背景基调 | ink / paper / ember |
| p069 | surface | 背景基调 | ink / paper / ember |
| p072 | surface | 背景基调 | ink / paper / ember |
| p074 | surface | 背景基调 | ink / paper / ember |
| p075 | surface | 背景基调 | ink / paper / ember |
| p077 | surface | 背景基调 | ink / paper / ember |
| p079 | surface | 背景基调 | ink / paper / ember |
| p080 | surface | 背景基调 | ink / paper / ember |
| p082 | surface | 背景基调 | ink / paper / ember |
| p085 | surface | 背景基调 | ink / paper / ember |

### 不收的 select 控件（5，会改版式几何或渲染失败）

| 版式 | 控件 | 原因 |
|---|---|---|
| p033 | portraitShape | 取值 "circle"：第 19 个元素 y 相差 35.2px |
| p037 | align | 取值 "center"：第 16 个元素 x 相差 721.8px |
| p045 | orientation | 取值 "stack"：第 21 个元素 x 相差 1014.5px |
| p056 | align | 取值 "center"：第 16 个元素 x 相差 726.8px |
| p069 | align | 取值 "center"：第 16 个元素 x 相差 729.7px |

## 白名单命中（供人复核）

白名单（英文）：top、no、nos、vol、page、pages、fig、figure、est、rev、ver、tel、fax、www、com、am、pm、vs、and、the、for、of、jan、feb、mar、apr、may、jun、jul、aug、sep、sept、oct、nov、dec、mon、tue、wed、thu、fri、sat、sun、january、february、march、april、june、july、august、september、october、november、december、monday、tuesday、wednesday、thursday、friday、saturday、sunday、next、prev、previous、back、scroll、start、end、fin、chart、table、curve、trend、peak、trough、total、count、amount、diverging、area、radar、tiers、structure、donut、stage、flow、funnel、convert、bubbles、high、low、wall、statement、menu、scale、part、step、phase、pest、pulse、nodes、layers、layer、columns、waterfall、heat、map

白名单（中文）：一月、二月、三月、四月、五月、六月、七月、八月、九月、十月、十一月、十二月、周一、周二、周三、周四、周五、周六、周日、星期一、星期二、星期三、星期四、星期五、星期六、星期日、第一季度、第二季度、第三季度、第四季度、季度、上半年、下半年、合计、全年合计、单位、占比、均值、月度均值、重点、峰值、低位、目标、其余、全年、数据、分布、基准、结论、高亮、章节、摘要、阶段、纵轴、横轴、数量、金额、关键节点、主线

本主题没有命中。

## 现有规则已排除（24，未渲染）

media 24

