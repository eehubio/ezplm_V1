# ez.eetree.cn × 客户需求 v20260423 集成映射

本文件记录《系统20260409》《系统20260423》两份客户需求文档中的每条需求，落地到 ezplm_optimized_v2 哪个页面、哪个 AI 模态/按钮/面板。

> 升级层位于 `assets/ai-enhance.css` 与 `assets/ai-enhance.js`；所有新增 UI 都集中在 `.ai-*` / `.card-ai` / `.btn-ai` 命名空间，不会影响既有功能。原文件备份为 `*.bak.20260518`。

---

## PM（项目经理）模块

| 需求 ID | 描述（节选） | 落地页 | UI 入口 / 模态 |
|---|---|---|---|
| **PM-1** | 无 MPN BOM 导入 → 按描述/MPN 匹配（条件：客户A优先 · 有库存优先 · 品牌限定 · lead time）→ 带出 MPN/库存/OPO+ETA/需求量；未匹配则推荐 MPN 并备注新增 | `bom.html` | "AI 智能匹配"按钮 → `aiMatchSummaryModal`（含条件选择器 + 未匹配推荐表） |
| **PM-2** | 输出 BOM 为模板格式；非模板 BOM 自动转模板 | `bom.html` | "BOM 模板转换"按钮 → `aiBomTemplateModal` |
| **PM-3** | 图片 OCR → 客户料号 → 内部料号 → EXCEL（直接 Copy 建 PC） | `bom.html` | "OCR 上传"按钮 → `aiOcrModal`（识别后给出 EXCEL 预览 + 建 PC 跳转） |
| **PM-4** | 人工报价：导 BOM → 分类 → 算点 → 折扣模式（A/B/C 客户）→ 模拟运算 → 审批 → 多种 PDF（参考嘉立创） | `bom.html` | "报价向导"按钮 → `aiQuoteWizardModal`（4 步向导） |
| **PM-5** | 物料报价：PM 模板上传 → going-to-buy 智能计算 → 采购填价 → 价过高自动复核 → PM 修正 → 上级审批 | `procurement.html` | "物料报价工作台"按钮 → `aiMaterialQuoteModal` |
| **PM-6** | 一颗料追溯到客户哪几个 PO；工单 ↔ PO 双向追溯（与 MES 关联） | `materials.html`（主） · `bom.html`（次） | "料号 PO 追溯"按钮 → `aiPartTraceModal`（双向视图：料号 ↔ PO ↔ 工单） |
| **PM-7** | 客户对账单上传 → 生成 AR | `procurement.html` | "AR/AP 对账"按钮 → `aiReconcileModal` |
| **PM-8** | 客户/供应商对账单上传 → 生成 AP | `procurement.html` · `supplier-management.html` | 同上 + supplier 页 `aiSupplierApModal` |
| **PM-9** | 缺料分析单 → 按 ETA 算齐料时间 + 按工单顺序模拟 | `procurement.html` | "缺料分析"按钮 → `aiShortageModal` |

## 采购模块

| 需求 ID | 描述（节选） | 落地页 | UI 入口 / 模态 |
|---|---|---|---|
| **采-1** | 维护"供应商 × 物料"的 MOQ/SPQ/单价/lead time，下单时按供应商一键带出，或 EXCEL 导入 | `procurement.html` | "供应商批量下单"按钮 → `aiSupplierBatchModal` |
| **采-2** | 多客户外挂 run ERP → 自动生成采购申请单 | `procurement.html` | "ERP 一键转申请单"按钮 → `aiErpImportModal` |
| **采-3** | 7-8 网站多源询价（含 DC、库存、最低价、最优供应商）+ EOL 自动替代 + 历史趋势 + 导总表 | `procurement.html` | "AI 多源比价"按钮 → `aiPriceCompareModal`（扩展为 8 行 + DC + 趋势 + 导出） |
| **采-4** | OPO 交期协同：供应商在订单明细行逐项回复 + 每两周自动催 | `supplier-management.html` | "AI 自动催办"按钮 → `aiSupplierRulesModal` 中"OPO 交期回复"规则 + 模板上传 |
| **采-5** | 供应商对账单 → 自动生成 AP | `supplier-management.html` | "AP 对账"按钮 → `aiSupplierApModal` |
| **采-6** | 下单时呆滞料/高于历史最低价弹窗；PM 决定转库存 | `procurement.html` · `materials.html` | "下单冲突检测"按钮 → `aiOrderConflictModal`；materials 加呆滞料预警入口 |
| **采-7** | 缺料 → 匹配供应商/数量/ETA → 导 call 料表 + 自动发邮件 | `procurement.html` | "Call 料 + 邮件"按钮 → `aiCallSheetModal` |
| **采-8** | MPN 联动 RoHS/Reach 报告（联动品质） | `materials.html` · `supplier-management.html` | "RoHS/Reach"按钮 → `aiRohsModal`（含锁定相关 MPN 新 PO 规则） |

## 计划模块

| 需求 ID | 描述 | 落地页 | UI 入口 / 模态 |
|---|---|---|---|
| **计-1** | BOM → 工时计算 → 导出报表（保留修改权限） | `bom.html` | "BOM 工时"按钮 → `aiBomLaborModal` |
| **计-2** | 齐料时间 + 工时 + 工序 → 最优排产表 | `procurement.html` | "智能排产"按钮 → `aiScheduleModal` |

---

## 总览：每页新增 UI 数量

| 页面 | 新增按钮 | 新增面板/卡片 | 新增模态 |
|---|---|---|---|
| `bom.html` | +4 | – | +5 |
| `engineering-change.html` | – | – | – （已完整） |
| `materials.html` | +3 | +1（合规与呆滞料预警） | +3 |
| `procurement.html` | +7 | – | +7 |
| `supplier-management.html` | +1 | – | +1 |
| **共计** | **15** | **1** | **16** |

---

## 备份与回滚

- 升级前文件均保留为 `*.bak.20260518`
- 回滚命令：
  ```bash
  cd /Users/gongyusu/Desktop/UI/EZPLM/ezplm_optimized_v2
  for f in bom engineering-change materials procurement supplier-management; do
    mv "$f.html.bak.20260518" "$f.html"
  done
  rm -rf assets/
  rm -f AI-REQUIREMENTS-MAP.md
  ```

---

**版本：** v1.1（含 0423 客户需求增量集成）
**实施日期：** 2026-05-18
