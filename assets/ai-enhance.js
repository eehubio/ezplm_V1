/* ============================================================
   ai-enhance.js — AI 助手抽屉 + 通用 AI 模态 + 上下文建议
   注入到 ez.eetree.cn 页面后会自动挂载浮动 FAB 与抽屉。
   ------------------------------------------------------------ */

(function () {
  'use strict';

  // 不同页面的上下文 (基于 body data-ai-context 或 location)
  // v1.1 已覆盖《系统20260423》客户需求
  const PAGE_CONTEXT = {
    'bom': {
      title: 'BOM AI 助手',
      agents: ['Agent ① 语义匹配', 'Agent ② OCR', 'Agent ⑧ BOM-ECN 联动'],
      greeting: '我是 BOM 智能助手，可以：无 MPN BOM 智能匹配、推荐新增 MPN、非模板→标准模板转换、图片 OCR→内部料号 EXCEL、料号 PO 追溯、BOM 工时与报价向导。',
      suggestions: [
        '帮我匹配无 MPN 的 BOM（优先客户A料 + 有库存）',
        '把客户的非模板 BOM 转成我们标准模板',
        '上传一张 BOM 图片做 OCR 并导出 EXCEL',
        'STM32F103 用在哪些客户 PO 上？',
        '算一下本 BOM 的工时',
        '按 A 类客户折扣模式给出报价',
      ],
    },
    'engineering-change': {
      title: '工程变更 AI 助手',
      agents: ['Agent ⑧ 变更影响分析'],
      greeting: '我可以对每条 ECR 进行实时影响分析，覆盖在产工单、在库批次、在途采购单与未发客单。',
      suggestions: [
        '分析 ECR-2024-003 的影响',
        '列出本周高风险变更',
        '替代料 CP2102 → CH340G 影响多少订单？',
      ],
    },
    'materials': {
      title: '物料 AI 助手',
      agents: ['Agent ⑤ 替代关系图谱', 'Agent ② OCR', '合规 + 呆滞料'],
      greeting: '我可以推荐国产替代、构建替代关系图谱、追溯料号在所有 PO/工单/采购的使用、识别呆滞料并联动 RoHS/Reach 合规。',
      suggestions: [
        '为 STM32F103C8T6 推荐 4 个国产替代',
        'STM32F103 用在哪些 PO 和工单上？',
        '列出 90 天以上的呆滞料',
        '哪些 MPN 的 RoHS 文件即将过期？',
        'OCR 识别物料规格书',
      ],
    },
    'procurement': {
      title: '采购 AI 助手',
      agents: ['Agent ④ 在途拦截', 'Agent ⑤ 多源比价', '齐料/排产/对账'],
      greeting: '我可以做 8 源比价（含 DC/库存）、缺料分析与齐料 ETA、call 料表自动发邮件、下单冲突检测（呆滞料/高于历史价/合规锁定）、按供应商模板一键带料、外挂 ERP 转申请单、AR/AP 对账、智能排产。',
      suggestions: [
        '8 源比价 STM32F103',
        '本周哪些工单存在缺料？齐料时间？',
        '生成 call 料表并发邮件',
        '检测本次下单是否存在呆滞料 / 高于历史价',
        '按立创商城模板一键带料',
        '从金蝶 + SAP 一键转采购申请单',
        '上传客户对账单生成 AR',
        '基于齐料和工时给出最优排产',
      ],
    },
    'supplier-management': {
      title: '供应商 AI 助手',
      agents: ['Agent ⑦ 协同/催办', 'OPO 交期', 'AP 对账'],
      greeting: '我可以自动催办交期/RoHS/质量反馈、每两周发 OPO 交期模板给供应商、上传供应商对账单生成 AP。',
      suggestions: [
        '列出本周交期未回复供应商',
        '触发 RoHS 文件续证提醒',
        '生成供应商质量评分',
        '下载 OPO 行级回复模板',
        '上传立创对账单生成 AP',
      ],
    },
    'default': {
      title: 'ezPLM AI 助手',
      agents: ['全局智能体'],
      greeting: '您好，我可以协助您处理 BOM 匹配、采购优化、供应商协同等业务。',
      suggestions: ['今日待办', '本月采购洞察', '帮我搜索物料'],
    },
  };

  function detectContext() {
    const body = document.body;
    if (body && body.dataset.aiContext) return body.dataset.aiContext;
    const path = location.pathname.split('/').pop().replace('.html', '');
    return PAGE_CONTEXT[path] ? path : 'default';
  }

  function el(tag, opts) {
    const e = document.createElement(tag);
    if (!opts) return e;
    if (opts.cls) e.className = opts.cls;
    if (opts.html != null) e.innerHTML = opts.html;
    if (opts.text != null) e.textContent = opts.text;
    if (opts.attrs) Object.entries(opts.attrs).forEach(([k, v]) => e.setAttribute(k, v));
    if (opts.on) Object.entries(opts.on).forEach(([k, v]) => e.addEventListener(k, v));
    return e;
  }

  function mountFAB() {
    if (document.querySelector('.ai-fab')) return;
    const ctx = PAGE_CONTEXT[detectContext()] || PAGE_CONTEXT.default;

    const fab = el('button', {
      cls: 'ai-fab',
      attrs: { title: ctx.title, 'aria-label': ctx.title },
      html: '✦',
      on: { click: () => openDrawer() },
    });
    document.body.appendChild(fab);

    const mask = el('div', { cls: 'ai-drawer-mask', on: { click: closeDrawer } });
    const drawer = el('aside', { cls: 'ai-drawer' });

    drawer.innerHTML = `
      <div class="ai-drawer-head">
        <h3>${ctx.title}</h3>
        <button class="ai-drawer-close" aria-label="关闭">✕</button>
      </div>
      <div class="ai-drawer-body" id="aiDrawerBody"></div>
      <div class="ai-drawer-input">
        <input type="text" placeholder="问我任何关于这个页面的事…" id="aiDrawerInput" />
        <button id="aiDrawerSend">发送</button>
      </div>
    `;
    document.body.appendChild(mask);
    document.body.appendChild(drawer);

    drawer.querySelector('.ai-drawer-close').addEventListener('click', closeDrawer);

    const body = drawer.querySelector('#aiDrawerBody');
    addBotMsg(body, ctx.greeting, ctx.suggestions);

    const input = drawer.querySelector('#aiDrawerInput');
    const send = drawer.querySelector('#aiDrawerSend');
    function doSend() {
      const v = input.value.trim();
      if (!v) return;
      addUserMsg(body, v);
      input.value = '';
      setTimeout(() => simulateReply(body, v, ctx), 600);
    }
    send.addEventListener('click', doSend);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSend(); });
  }

  function openDrawer() {
    document.querySelector('.ai-drawer-mask').classList.add('show');
    document.querySelector('.ai-drawer').classList.add('show');
    setTimeout(() => document.querySelector('#aiDrawerInput').focus(), 250);
  }
  function closeDrawer() {
    document.querySelector('.ai-drawer-mask').classList.remove('show');
    document.querySelector('.ai-drawer').classList.remove('show');
  }
  window.aiOpenDrawer = openDrawer;
  window.aiCloseDrawer = closeDrawer;

  function addBotMsg(host, text, suggestions) {
    const m = el('div', { cls: 'ai-msg ai-msg-bot' });
    m.innerHTML = text;
    if (suggestions && suggestions.length) {
      const wrap = el('div', { cls: 'ai-suggestions' });
      suggestions.forEach((s) => {
        const b = el('button', {
          cls: 'ai-suggestion', text: s,
          on: { click: () => {
            document.querySelector('#aiDrawerInput').value = s;
            document.querySelector('#aiDrawerSend').click();
          }},
        });
        wrap.appendChild(b);
      });
      m.appendChild(wrap);
    }
    host.appendChild(m);
    host.scrollTop = host.scrollHeight;
  }
  function addUserMsg(host, text) {
    const m = el('div', { cls: 'ai-msg ai-msg-user', text });
    host.appendChild(m);
    host.scrollTop = host.scrollHeight;
  }

  function simulateReply(host, q, ctx) {
    const lower = q.toLowerCase();
    let reply;
    // 需求 PM-1：无 MPN 智能匹配 + 推荐 MPN
    if ((lower.includes('匹配') || lower.includes('match')) && (lower.includes('无') || lower.includes('mpn') || lower.includes('bom'))) {
      reply = 'Agent ① 已按"客户A料 + 有库存 + 合格供应商"3 条件匹配最近上传的 BOM：<br>· 132 项已匹配（带 OPO ETA / 库存 / 需求量）<br>· 18 项 70-90% 置信度需工程确认<br>· 6 项 EOL → Agent ⑤ 推荐替代<br>· <b>6 项未匹配 → 推荐新增 MPN</b>（含 Bourns SRR6038、AMS1117-3.3 等）。<br>点击 "AI 智能匹配" → 表底部"推荐新增 MPN"区可一键建卡。';
    } else if (lower.includes('匹配') || lower.includes('match')) {
      reply = '已对最近上传的 BOM 执行 Agent ① 语义匹配：132 项匹配成功（平均置信度 96.4%）。点击"AI 智能匹配"查看明细 + 多条件设置。';
    } else if (lower.includes('模板') && lower.includes('bom')) {
      reply = '"BOM 模板转换"已识别客户原始字段：P/N → 内部料号 100%、Description → 规格描述 98%、Pkg → 封装 94%。已统一单位为 pcs，下载标准模板或直接导入新 BOM。';
    } else if (lower.includes('ocr') || lower.includes('图片')) {
      reply = '请把图片/PDF/Excel 拖入 "OCR 上传" 模态。识别完成后会给出"客户料号 → 内部料号"EXCEL 预览，支持<b>直接 Copy 建 PC</b>或导出 xlsx。';
    } else if (lower.includes('差异') || lower.includes('变更') || lower.includes('ecn') || lower.includes('ecr')) {
      reply = 'Agent ⑧ 已比较版本：本 BOM 与现行 V2.3 有 6 处变更（4 替换 / 1 新增 / 1 删除）。影响 3 个在产工单、12 个在库批次、2 个未发客单。点击 "AI 变更影响分析" 查看 4 象限详情。';
    } else if (lower.includes('追溯') || (lower.includes('po') && lower.includes('用')) || (lower.includes('用') && lower.includes('哪'))) {
      reply = '需求 PM-6 追溯：<br>· STM32F103 → 客户 PO 4 条（SO-887/892/901/910）<br>· 工单 3 个（WO-118/122/124）<br>· 在途采购 PO 3 张（PO-3290/3301/3315）<br>MES 数据延迟 ≤ 15 分钟。点击 "料号 PO 追溯"或 materials.html 的"料号多维追溯"查看。';
    } else if (lower.includes('工时') || lower.includes('hour')) {
      reply = '需求 计-1：本 BOM 工时合计 <b>588.4 分钟 ≈ 9.8 小时</b>（SMT 41.0 + IC 12.6 + AOI 150 + DIP 4.8 + 测试 300 + 包装 80）。可在"BOM 工时"中修正单元工时（需 PM+ 权限），并一键传递到 procurement.html 的智能排产。';
    } else if (lower.includes('报价')) {
      reply = '需求 PM-4 报价向导：当前选中 A 类客户（物料毛利 8% + SMT ¥0.005/点）。100 板含税总价 <b>¥ 228,464.53</b>。可一键生成"标准版/明细版"PDF 并送审批。';
    } else if (lower.includes('呆滞') || lower.includes('库龄')) {
      reply = '需求 采-6：当前呆滞料 <b>23 项 · 价值 ¥ 86.4K</b>（90+ 天 14 项，180+ 天 9 项）。下单同 MPN 时系统自动弹窗提示 PM 决定是否转通用库存。';
    } else if (lower.includes('rohs') || lower.includes('reach') || lower.includes('合规')) {
      reply = '需求 采-8：已收 RoHS/Reach 报告 1,860 份，30 天内过期 2 份（USB-C 24Pin、CH340G），缺失 12 项。<b>缺失/过期的 MPN 在下单时会被自动锁定</b>，必须续证或经理紧急豁免。';
    } else if (lower.includes('比价') || lower.includes('compare')) {
      reply = '需求 采-3：已跨 8 家询价源（立创/Mouser/Digi-Key/Arrow/LCSC/ICKey/华强/中科芯）比价 STM32F103C8T6：<br>· 最优：立创商城 ¥4.18 (库存 12K · DC 2425+) <br>· 国产替代：CKS32F103 ¥3.90 (节省 ¥2.8K)<br>历史 6 个月趋势线显示价格已从 ¥5.20 下降到 ¥4.18。';
    } else if (lower.includes('缺料') || lower.includes('齐料') || lower.includes('eta')) {
      reply = '需求 PM-9：缺料分析结果：WO-118 齐料 5/19（缓冲 +3 天 · 低风险），WO-122 齐料 5/26（缓冲 -1 天 · 中风险），WO-124 齐料 6/04（缓冲 -7 天 · 高风险）。建议提前催 PO-3340 或与客户协商延期。';
    } else if (lower.includes('call') || lower.includes('催货邮件')) {
      reply = '需求 采-7：已生成 call 料表 4 条，按供应商分组发送邮件草稿：立创 2 条、华强 1 条、中科芯 1 条（但中科芯 RoHS 未续证已预警）。一键发送将生成 4 个跟踪号。';
    } else if (lower.includes('下单') && (lower.includes('冲突') || lower.includes('呆滞') || lower.includes('历史价'))) {
      reply = '需求 采-6：本次下单冲突检测：<br>⚠ STM32F103 同 MPN 呆滞料 5K 可消化<br>⚠ 单价 ¥4.55 较历史最低 ¥4.18 高 8.8%<br>✖ CH340G RoHS 缺失 → 已锁定 PO 创建。';
    } else if (lower.includes('erp') || lower.includes('申请单')) {
      reply = '需求 采-2：从 3 套外挂 ERP（金蝶 K3 86 行、SAP B1 132 行、Odoo 48 行）合并 266 条净需求，已生成统一申请单 PR-20260518。';
    } else if (lower.includes('物料报价') || lower.includes('going-to-buy') || lower.includes('going to buy')) {
      reply = '需求 PM-5 物料报价工作台：已从 PM 模板算出 going-to-buy（STM32 1500、USB-C 800、0603 RES 0 因库存覆盖）。USB-C 采购报价 ¥8.50 较历史均价 ¥6.00 高 42% → <b>已自动退回采购重报</b>。';
    } else if (lower.includes('对账') || lower.includes('ar') || lower.includes('ap')) {
      reply = '需求 PM-7/8、采-5：已比对客户 A 对账单，3 行匹配 1 行单价差 ¥60；建议生成 AR 凭证并通知客户复核差异。供应商 AP 流程相同，进入"AP 对账上传"。';
    } else if (lower.includes('催办') || lower.includes('催单') || lower.includes('提醒')) {
      reply = 'Agent ⑦ 已扫描 23 家供应商：7 家交期未回（>3 天）已生成邮件草稿；4 家临近交期未发货已触发短信；2 家 RoHS 30 天到期已发续证通知。需求 采-4 的 OPO 双周自动催下次触发 6/01 09:00。';
    } else if (lower.includes('opo') || lower.includes('交期')) {
      reply = '需求 采-4：OPO 行级模板已下载链接就绪。供应商按 PO 行填报回填 EXCEL 后，系统自动行级关联无需 VLOOKUP。当前 86 行待回复中，已 2 家延误（华强 5 天、中科芯 9 天）。';
    } else if (lower.includes('排产') || lower.includes('schedule')) {
      reply = '需求 计-2：基于齐料 ETA + BOM 工时给出最优排产：WO-118（5/19→5/20，安全 ✓）、WO-122（5/26→5/27，延 2 天 ⚠）、WO-124（6/04→6/05，延 8 天 ✖ 建议协商）。';
    } else if (lower.includes('替代')) {
      reply = '已生成 Top 4 替代：1. CH340G ¥2.40（推荐｜国产替代） 2. FT232RL ¥6.80（兼容型号） 3. CP2104 ¥4.10（pin-compatible） 4. PL2303HX ¥1.80（成本优先）。点击"替代关系图谱"看完整关系。';
    } else if (lower.includes('评分') || lower.includes('质量')) {
      reply = 'Agent ⑦ 质量评分：立创商城 96 · 中科芯 94 · 华强 90 · Mouser 82（合规扣分）。可在"AI 质量评分"模态查看 5 维度明细。';
    } else {
      reply = `已收到您的请求："${escapeHtml(q)}"。基于本页 (${ctx.agents.join(' / ')}) 正在生成建议……`;
    }
    addBotMsg(host, reply);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  // ---------- 通用模态打开/关闭 ----------
  window.aiOpenModal = function (id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('show');
  };
  window.aiCloseModal = function (id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('show');
  };

  // ---------- DOM ready 注入 ----------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountFAB);
  } else {
    mountFAB();
  }
})();
