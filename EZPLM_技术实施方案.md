# EZPLM 新版本技术实施方案

**版本:** V2.0
**文档日期:** 2025-01-03
**目标:** 基于现有UI原型构建完整的EZPLM产品lifecycle管理系统
**参考系统:** www.ezplm.cn

---

## 1. 技术架构方案

### 1.1 整体架构设计

采用前后端分离的微服务架构，确保系统的可扩展性和高可用性。

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层 (Frontend)                      │
│  Vue 3 + Vite + TypeScript + Element Plus + Pinia           │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTPS/REST API
┌─────────────────────────────────────────────────────────────┐
│                      API网关层 (Gateway)                      │
│        Nginx + Kong (认证、限流、路由、监控)                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      业务服务层 (Services)                    │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │用户服务  │项目服务  │物料服务  │采购服务  │生产服务  │  │
│  │User      │Project   │Material  │Purchase  │Product   │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │库存服务  │BOM服务   │协作服务  │教育服务  │招聘服务  │  │
│  │Inventory │BOM       │Collab    │Education │HR        │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
│          Spring Boot 3.x + MyBatis-Plus + Redis             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      数据存储层 (Storage)                     │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │ MySQL 8.0    │ Redis 7.x    │ MinIO/OSS    │            │
│  │ (主数据库)   │ (缓存/队列)  │ (文件存储)   │            │
│  └──────────────┴──────────────┴──────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈详细定义

**前端技术栈**
- **框架**: Vue 3.4+ (Composition API)
- **构建工具**: Vite 5.x
- **语言**: TypeScript 5.x
- **UI组件库**: Element Plus 2.x
- **状态管理**: Pinia 2.x
- **路由**: Vue Router 4.x
- **HTTP客户端**: Axios 1.x
- **图表库**: ECharts 5.x
- **富文本编辑器**: TinyMCE / WangEditor
- **表格组件**: VxeTable (高性能虚拟滚动)

**后端技术栈**
- **框架**: Spring Boot 3.2.x
- **Java版本**: JDK 17 LTS
- **ORM**: MyBatis-Plus 3.5.x
- **安全**: Spring Security + JWT
- **API文档**: Knife4j (Swagger增强版)
- **校验**: Hibernate Validator
- **工具类**: Hutool 5.x, Apache Commons

**数据存储**
- **关系数据库**: MySQL 8.0.35
- **缓存**: Redis 7.2 (主从 + Sentinel)
- **消息队列**: RabbitMQ 3.12 (可选，异步任务)
- **对象存储**: MinIO / 阿里云OSS
- **全文搜索**: Elasticsearch 8.x (可选，用于高级搜索)

**DevOps**
- **容器化**: Docker + Docker Compose
- **CI/CD**: Jenkins / GitLab CI
- **监控**: Prometheus + Grafana
- **日志**: ELK Stack (Elasticsearch + Logstash + Kibana)

---

## 2. 核心功能模块设计

### 2.1 用户与权限管理模块

#### 2.1.1 角色定义
系统共定义7种用户角色，每个角色有明确的权限范围：

| 角色代码 | 角色名称 | 主要职责 | 关键页面权限 |
|---------|---------|---------|-------------|
| `ADMIN` | 系统管理员 | 系统配置、用户管理、组织架构 | organization-settings.html, numbering-rules.html, category-management.html |
| `PM` | 项目经理 | 项目管理、团队协调、进度把控 | projects.html, tasks.html, timeline-dashboard.html, approval-center.html |
| `ENGINEER` | 工程师 | 技术开发、BOM设计、文档编写 | bom.html, engineering-change.html, reference-designs.html, cloud-search.html |
| `PURCHASER` | 采购专员 | 采购管理、供应商对接、物料询价 | procurement.html, component-supply.html, supplier-management.html |
| `WAREHOUSE` | 仓库管理员 | 库存管理、出入库、质检协调 | inventory.html, quality-inspection.html, materials.html |
| `PRODUCER` | 生产人员 | 生产执行、工单管理、SOP操作 | production.html, sop-view.html, work-order-detail.html |
| `VIEWER` | 观察者 | 只读权限、查看报表和数据 | dashboard-pro.html, analytics.html (只读) |

#### 2.1.2 数据库表设计
```sql
-- 用户表
CREATE TABLE sys_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL COMMENT 'BCrypt加密',
    real_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    organization_id BIGINT,
    department_id BIGINT,
    status TINYINT DEFAULT 1 COMMENT '1:启用 0:禁用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_org (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 角色表
CREATE TABLE sys_role (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_code VARCHAR(50) UNIQUE NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    sort_order INT DEFAULT 0,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户角色关联表
CREATE TABLE sys_user_role (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    UNIQUE KEY uk_user_role (user_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 权限表
CREATE TABLE sys_permission (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    permission_code VARCHAR(100) UNIQUE NOT NULL,
    permission_name VARCHAR(100),
    resource_type VARCHAR(20) COMMENT 'PAGE/API/BUTTON',
    resource_path VARCHAR(200),
    parent_id BIGINT DEFAULT 0,
    sort_order INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 角色权限关联表
CREATE TABLE sys_role_permission (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    UNIQUE KEY uk_role_perm (role_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 2.1.3 核心API接口
```java
// 认证接口
POST   /api/auth/login              // 用户登录
POST   /api/auth/logout             // 用户登出
POST   /api/auth/refresh            // 刷新Token
GET    /api/auth/userinfo           // 获取当前用户信息

// 用户管理接口
GET    /api/users                   // 分页查询用户列表
GET    /api/users/{id}              // 获取用户详情
POST   /api/users                   // 创建用户
PUT    /api/users/{id}              // 更新用户
DELETE /api/users/{id}              // 删除用户
PUT    /api/users/{id}/roles        // 分配角色
GET    /api/users/{id}/permissions  // 获取用户权限树
```

### 2.2 项目与任务管理模块

#### 2.2.1 核心实体设计
**项目实体 (Project)**
```java
@Data
@TableName("project")
public class Project {
    private Long id;
    private String projectNo;        // 项目编号 PROJ-2025-0001
    private String projectName;      // 项目名称
    private String projectType;      // 项目类型: R&D/PRODUCTION/OUTSOURCING
    private String description;      // 项目描述
    private Long ownerId;            // 项目负责人ID
    private Date startDate;          // 开始日期
    private Date endDate;            // 预计结束日期
    private String status;           // PLANNING/IN_PROGRESS/COMPLETED/ARCHIVED
    private Integer progress;        // 进度百分比 0-100
    private BigDecimal budget;       // 预算
    private String priority;         // 优先级: HIGH/MEDIUM/LOW
    private Long organizationId;     // 所属组织
    private Date createTime;
    private Date updateTime;
    private Long createBy;
}
```

**任务实体 (Task)**
```java
@Data
@TableName("task")
public class Task {
    private Long id;
    private String taskNo;           // 任务编号 TASK-2025-0001
    private String taskName;         // 任务名称
    private Long projectId;          // 关联项目ID
    private Long parentTaskId;       // 父任务ID (支持子任务)
    private String taskType;         // DESIGN/DEVELOPMENT/TEST/DOCUMENT
    private String description;      // 任务描述
    private Long assigneeId;         // 负责人ID
    private Date startDate;          // 开始日期
    private Date dueDate;            // 截止日期
    private String status;           // TODO/IN_PROGRESS/REVIEW/COMPLETED
    private String priority;         // 优先级
    private Integer estimatedHours;  // 预估工时
    private Integer actualHours;     // 实际工时
    private Date createTime;
    private Long createBy;
}
```

#### 2.2.2 关键接口
```java
// 项目接口
GET    /api/projects                        // 项目列表 (支持状态、负责人筛选)
POST   /api/projects                        // 创建项目
GET    /api/projects/{id}                   // 项目详情
PUT    /api/projects/{id}                   // 更新项目
DELETE /api/projects/{id}                   // 删除项目
GET    /api/projects/{id}/timeline          // 项目时间线
GET    /api/projects/{id}/members           // 项目成员列表
POST   /api/projects/{id}/members           // 添加项目成员

// 任务接口
GET    /api/tasks                           // 任务列表
POST   /api/tasks                           // 创建任务
GET    /api/tasks/{id}                      // 任务详情
PUT    /api/tasks/{id}                      // 更新任务
PUT    /api/tasks/{id}/status               // 更新任务状态
POST   /api/tasks/{id}/comments             // 添加任务评论
GET    /api/tasks/{id}/attachments          // 获取任务附件
POST   /api/tasks/{id}/attachments          // 上传任务附件
```

### 2.3 BOM与物料管理模块

#### 2.3.1 数据库表设计
```sql
-- BOM主表
CREATE TABLE bom (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    bom_no VARCHAR(50) UNIQUE NOT NULL,
    bom_name VARCHAR(200) NOT NULL,
    project_id BIGINT,
    version VARCHAR(20) DEFAULT 'v1.0',
    product_name VARCHAR(200),
    status VARCHAR(20) DEFAULT 'DRAFT' COMMENT 'DRAFT/APPROVED/ARCHIVED',
    total_cost DECIMAL(15,2),
    material_count INT DEFAULT 0 COMMENT '物料种类数量',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    create_by BIGINT,
    approve_time DATETIME,
    approve_by BIGINT,
    INDEX idx_project (project_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BOM明细表
CREATE TABLE bom_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    bom_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    material_no VARCHAR(100) COMMENT '物料编号',
    material_name VARCHAR(200),
    specification VARCHAR(500) COMMENT '规格型号',
    manufacturer VARCHAR(200) COMMENT '制造商',
    quantity INT NOT NULL COMMENT '用量',
    unit VARCHAR(20) DEFAULT '个',
    unit_price DECIMAL(10,4) COMMENT '单价',
    total_price DECIMAL(15,2) COMMENT '总价',
    designator VARCHAR(500) COMMENT '位号 如 R1,R2,R3',
    substitute_material_id BIGINT COMMENT '替代料ID',
    remark TEXT,
    sort_order INT DEFAULT 0,
    INDEX idx_bom (bom_id),
    INDEX idx_material (material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 物料主数据表
CREATE TABLE material (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    material_no VARCHAR(100) UNIQUE NOT NULL COMMENT '物料编号 MT-IC-2024-0001',
    material_name VARCHAR(200) NOT NULL,
    category_id BIGINT COMMENT '分类ID',
    specification VARCHAR(500),
    manufacturer VARCHAR(200),
    model VARCHAR(200) COMMENT '型号',
    unit VARCHAR(20) DEFAULT '个',
    standard_price DECIMAL(10,4) COMMENT '标准价格',
    safety_stock INT DEFAULT 0 COMMENT '安全库存',
    material_type VARCHAR(50) COMMENT 'IC/RESISTOR/CAPACITOR/PCB等',
    datasheet_url VARCHAR(500),
    remark TEXT,
    status TINYINT DEFAULT 1 COMMENT '1:启用 0:停用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category_id),
    INDEX idx_type (material_type),
    FULLTEXT idx_search (material_name, specification, model)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 物料分类表
CREATE TABLE material_category (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_code VARCHAR(50) UNIQUE NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    parent_id BIGINT DEFAULT 0,
    level INT DEFAULT 1,
    sort_order INT DEFAULT 0,
    path VARCHAR(500) COMMENT '层级路径 如 /1/12/123',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 2.3.2 关键业务逻辑

**BOM版本管理**
- BOM采用版本控制机制，每次修改创建新版本
- 版本号规则：v1.0, v1.1, v2.0 (大版本.小版本)
- 只有审批通过的BOM才能用于生产和采购
- 支持BOM对比功能，查看不同版本差异

**物料编号规则**
```
物料编号格式: {类别代码}-{子类代码}-{年份}-{流水号}
示例:
  MT-IC-2024-0001    (IC芯片类)
  MT-R-2024-0156     (电阻类)
  MT-C-2024-0089     (电容类)
  MT-PCB-2024-0023   (PCB板类)
```

#### 2.3.3 核心API接口
```java
// BOM接口
GET    /api/bom                             // BOM列表
POST   /api/bom                             // 创建BOM
GET    /api/bom/{id}                        // BOM详情
PUT    /api/bom/{id}                        // 更新BOM
POST   /api/bom/{id}/items                  // 添加BOM物料
DELETE /api/bom/items/{itemId}              // 删除BOM物料
POST   /api/bom/{id}/approve                // 审批BOM
POST   /api/bom/{id}/version                // 创建新版本
GET    /api/bom/{id}/compare/{versionId}    // 版本对比
POST   /api/bom/{id}/export                 // 导出BOM (Excel)

// 物料接口
GET    /api/materials                       // 物料列表
POST   /api/materials                       // 创建物料
GET    /api/materials/{id}                  // 物料详情
PUT    /api/materials/{id}                  // 更新物料
GET    /api/materials/search                // 物料搜索 (支持模糊搜索)
GET    /api/materials/categories            // 物料分类树
```

### 2.4 采购管理模块

#### 2.4.1 采购流程设计
```
采购申请 → 询价比价 → 创建采购单 → 审批 → 发送供应商 → 跟踪交期 → 收货 → 质检 → 入库 → 付款
   ↓          ↓           ↓         ↓         ↓            ↓        ↓      ↓      ↓       ↓
 申请单    询价单      采购单     审批流    供应商确认    物流跟踪   收货单  质检单  入库单  付款单
```

#### 2.4.2 数据库表设计
```sql
-- 采购单主表
CREATE TABLE procurement_order (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    po_no VARCHAR(50) UNIQUE NOT NULL COMMENT '采购单号 PO-2024-1001',
    po_name VARCHAR(200),
    supplier_id BIGINT NOT NULL COMMENT '供应商ID',
    project_id BIGINT COMMENT '关联项目',
    total_amount DECIMAL(15,2) COMMENT '总金额',
    status VARCHAR(20) DEFAULT 'DRAFT' COMMENT 'DRAFT/PENDING/APPROVED/SENT/PARTIAL/COMPLETED/CANCELLED',
    buyer_id BIGINT COMMENT '采购员ID',
    delivery_date DATE COMMENT '要求交货日期',
    delivery_address VARCHAR(500),
    payment_terms VARCHAR(200) COMMENT '付款条件',
    remark TEXT,
    attachment_urls JSON COMMENT '附件URL列表',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    create_by BIGINT,
    approve_time DATETIME,
    approve_by BIGINT,
    INDEX idx_supplier (supplier_id),
    INDEX idx_status (status),
    INDEX idx_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 采购单明细表
CREATE TABLE procurement_order_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    po_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    material_no VARCHAR(100),
    material_name VARCHAR(200),
    specification VARCHAR(500),
    quantity INT NOT NULL,
    unit VARCHAR(20),
    unit_price DECIMAL(10,4),
    total_price DECIMAL(15,2),
    received_quantity INT DEFAULT 0 COMMENT '已收货数量',
    tax_rate DECIMAL(5,2) DEFAULT 0.13 COMMENT '税率',
    delivery_date DATE,
    remark VARCHAR(500),
    INDEX idx_po (po_id),
    INDEX idx_material (material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 供应商表
CREATE TABLE supplier (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    supplier_no VARCHAR(50) UNIQUE NOT NULL,
    supplier_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    address VARCHAR(500),
    business_scope VARCHAR(500) COMMENT '经营范围',
    payment_terms VARCHAR(200),
    delivery_cycle INT COMMENT '交货周期(天)',
    rating DECIMAL(3,2) COMMENT '评分 0-5.0',
    status TINYINT DEFAULT 1 COMMENT '1:合作中 0:停用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (supplier_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 询价单表
CREATE TABLE inquiry (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    inquiry_no VARCHAR(50) UNIQUE NOT NULL,
    inquiry_name VARCHAR(200),
    project_id BIGINT,
    status VARCHAR(20) DEFAULT 'PENDING' COMMENT 'PENDING/REPLIED/CLOSED',
    material_count INT DEFAULT 0,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    create_by BIGINT,
    deadline_date DATETIME COMMENT '报价截止时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 询价回复表 (供应商报价)
CREATE TABLE inquiry_reply (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    inquiry_id BIGINT NOT NULL,
    supplier_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    quoted_price DECIMAL(10,4) COMMENT '报价',
    moq INT COMMENT '最小起订量',
    delivery_cycle INT COMMENT '交货周期(天)',
    stock_quantity INT COMMENT '库存数量',
    valid_until DATE COMMENT '报价有效期',
    remark TEXT,
    reply_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_inquiry (inquiry_id),
    INDEX idx_supplier (supplier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 2.4.3 核心API接口
```java
// 采购单接口
GET    /api/procurement/orders                      // 采购单列表
POST   /api/procurement/orders                      // 创建采购单
GET    /api/procurement/orders/{id}                 // 采购单详情
PUT    /api/procurement/orders/{id}                 // 更新采购单
POST   /api/procurement/orders/{id}/items           // 添加采购明细
POST   /api/procurement/orders/{id}/approve         // 审批采购单
POST   /api/procurement/orders/{id}/send            // 发送给供应商
GET    /api/procurement/orders/{id}/tracking        // 订单跟踪

// 询价接口
POST   /api/procurement/inquiries                   // 创建询价单
GET    /api/procurement/inquiries/{id}              // 询价单详情
POST   /api/procurement/inquiries/{id}/send         // 发送询价
GET    /api/procurement/inquiries/{id}/replies      // 获取报价回复
POST   /api/procurement/inquiries/compare           // 比价分析

// 供应商接口
GET    /api/suppliers                               // 供应商列表
POST   /api/suppliers                               // 创建供应商
GET    /api/suppliers/{id}                          // 供应商详情
GET    /api/suppliers/{id}/materials                // 供应商物料目录
POST   /api/suppliers/{id}/evaluate                 // 供应商评价
```

### 2.5 库存与质检管理模块

#### 2.5.1 库存管理数据表
```sql
-- 库存主表
CREATE TABLE inventory (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    material_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL COMMENT '仓库ID',
    location_code VARCHAR(50) COMMENT '库位号',
    quantity INT DEFAULT 0 COMMENT '库存数量',
    available_quantity INT DEFAULT 0 COMMENT '可用数量',
    reserved_quantity INT DEFAULT 0 COMMENT '预留数量',
    safety_stock INT DEFAULT 0 COMMENT '安全库存',
    batch_no VARCHAR(100) COMMENT '批次号',
    production_date DATE COMMENT '生产日期',
    expiry_date DATE COMMENT '有效期',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_material_warehouse (material_id, warehouse_id, location_code, batch_no),
    INDEX idx_material (material_id),
    INDEX idx_warehouse (warehouse_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 入库单表
CREATE TABLE inbound_order (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    inbound_no VARCHAR(50) UNIQUE NOT NULL COMMENT 'IN-2025-0001',
    inbound_type VARCHAR(20) COMMENT 'PURCHASE/RETURN/TRANSFER',
    source_order_no VARCHAR(50) COMMENT '来源单据号(采购单号等)',
    warehouse_id BIGINT NOT NULL,
    supplier_id BIGINT COMMENT '供应商ID',
    status VARCHAR(20) DEFAULT 'PENDING' COMMENT 'PENDING/INSPECTING/COMPLETED',
    total_quantity INT DEFAULT 0,
    receiver_id BIGINT COMMENT '收货人',
    receive_time DATETIME,
    inspector_id BIGINT COMMENT '质检员',
    inspect_time DATETIME,
    remark TEXT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    create_by BIGINT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 出库单表
CREATE TABLE outbound_order (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    outbound_no VARCHAR(50) UNIQUE NOT NULL COMMENT 'OUT-2025-0001',
    outbound_type VARCHAR(20) COMMENT 'PRODUCTION/PROJECT/TRANSFER/SCRAP',
    target_order_no VARCHAR(50) COMMENT '目标单据号',
    warehouse_id BIGINT NOT NULL,
    project_id BIGINT COMMENT '关联项目',
    status VARCHAR(20) DEFAULT 'PENDING' COMMENT 'PENDING/PICKING/COMPLETED',
    total_quantity INT DEFAULT 0,
    picker_id BIGINT COMMENT '拣货人',
    pick_time DATETIME,
    receiver VARCHAR(100) COMMENT '领用人',
    remark TEXT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    create_by BIGINT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 质检单表
CREATE TABLE quality_inspection (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    qc_no VARCHAR(50) UNIQUE NOT NULL COMMENT 'QC-2025-0001',
    inbound_order_id BIGINT COMMENT '入库单ID',
    material_id BIGINT NOT NULL,
    batch_no VARCHAR(100),
    inspection_quantity INT COMMENT '送检数量',
    qualified_quantity INT DEFAULT 0 COMMENT '合格数量',
    unqualified_quantity INT DEFAULT 0 COMMENT '不合格数量',
    status VARCHAR(20) DEFAULT 'PENDING' COMMENT 'PENDING/INSPECTING/PASSED/FAILED',
    inspector_id BIGINT,
    inspection_time DATETIME,
    unqualified_reason TEXT COMMENT '不合格原因',
    handling_method VARCHAR(50) COMMENT 'RETURN/REPLACE/CONCESSION/REWORK',
    remark TEXT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 2.5.2 关键业务逻辑

**库存预留机制**
- 创建采购申请/生产计划时，自动预留物料
- 预留后：可用数量 = 库存数量 - 预留数量
- 出库时释放预留，扣减库存

**质检流程**
```
收货 → 创建质检单 → 质检中 → 质检结果
                              ↓
                      合格 → 入库
                      不合格 → 选择处理方式
                              ├─ 退货
                              ├─ 换货
                              ├─ 让步接收
                              └─ 返工
```

**库存预警**
- 低于安全库存时，系统自动预警
- 支持邮件、站内信通知采购员
- 生成建议采购计划

#### 2.5.3 核心API接口
```java
// 库存接口
GET    /api/inventory                        // 库存查询
GET    /api/inventory/material/{materialId}  // 按物料查询库存
GET    /api/inventory/warnings               // 库存预警列表
POST   /api/inventory/adjust                 // 库存调整
GET    /api/inventory/transactions           // 库存流水

// 入库接口
POST   /api/inbound/orders                   // 创建入库单
GET    /api/inbound/orders/{id}              // 入库单详情
POST   /api/inbound/orders/{id}/receive      // 确认收货
POST   /api/inbound/orders/{id}/complete     // 完成入库

// 出库接口
POST   /api/outbound/orders                  // 创建出库单
GET    /api/outbound/orders/{id}             // 出库单详情
POST   /api/outbound/orders/{id}/pick        // 拣货
POST   /api/outbound/orders/{id}/complete    // 完成出库

// 质检接口
POST   /api/qc/inspections                   // 创建质检单
GET    /api/qc/inspections/{id}              // 质检单详情
PUT    /api/qc/inspections/{id}/result       // 录入质检结果
POST   /api/qc/inspections/{id}/handle       // 不合格品处理
```

### 2.6 生产管理模块

#### 2.6.1 生产计划与工单
```sql
-- 生产计划表
CREATE TABLE production_plan (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    plan_no VARCHAR(50) UNIQUE NOT NULL COMMENT 'PP-2025-0001',
    plan_name VARCHAR(200) NOT NULL,
    project_id BIGINT,
    product_name VARCHAR(200),
    bom_id BIGINT NOT NULL COMMENT '关联BOM',
    plan_quantity INT NOT NULL COMMENT '计划数量',
    plan_type VARCHAR(20) COMMENT 'ORDER/STOCK' COMMENT '订单生产/备货生产',
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    start_date DATE,
    end_date DATE,
    standard_cycle INT COMMENT '标准周期(天)',
    status VARCHAR(20) DEFAULT 'PENDING' COMMENT 'PENDING/APPROVED/IN_PROGRESS/COMPLETED',
    sop_id BIGINT COMMENT '关联SOP',
    responsible_id BIGINT COMMENT '负责人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    create_by BIGINT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 生产工单表
CREATE TABLE work_order (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    wo_no VARCHAR(50) UNIQUE NOT NULL COMMENT 'WO-2025-0001',
    plan_id BIGINT NOT NULL COMMENT '生产计划ID',
    product_name VARCHAR(200),
    bom_id BIGINT,
    target_quantity INT COMMENT '目标数量',
    completed_quantity INT DEFAULT 0 COMMENT '完成数量',
    qualified_quantity INT DEFAULT 0 COMMENT '合格数量',
    status VARCHAR(20) DEFAULT 'PENDING' COMMENT 'PENDING/IN_PROGRESS/PAUSED/COMPLETED',
    start_time DATETIME,
    end_time DATETIME,
    responsible_id BIGINT,
    workshop VARCHAR(100) COMMENT '生产车间',
    production_line VARCHAR(100) COMMENT '生产线',
    remark TEXT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SOP (标准作业程序) 表
CREATE TABLE sop (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    sop_no VARCHAR(50) UNIQUE NOT NULL COMMENT 'SOP-2025-001',
    sop_name VARCHAR(200) NOT NULL,
    product_name VARCHAR(200),
    process_type VARCHAR(50) COMMENT 'SMT/ASSEMBLY/TEST/PACKING',
    version VARCHAR(20) DEFAULT 'v1.0',
    status VARCHAR(20) DEFAULT 'DRAFT' COMMENT 'DRAFT/PUBLISHED/ARCHIVED',
    standard_time INT COMMENT '标准工时(分钟)',
    content TEXT COMMENT 'SOP内容(JSON格式)',
    attachment_urls JSON COMMENT '附件URL',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    create_by BIGINT,
    publish_time DATETIME,
    publish_by BIGINT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 2.6.2 核心API接口
```java
// 生产计划接口
GET    /api/production/plans                 // 生产计划列表
POST   /api/production/plans                 // 创建生产计划
GET    /api/production/plans/{id}            // 计划详情
PUT    /api/production/plans/{id}            // 更新计划
POST   /api/production/plans/{id}/approve    // 审批计划
POST   /api/production/plans/{id}/workorders // 生成工单

// 工单接口
GET    /api/production/workorders            // 工单列表
GET    /api/production/workorders/{id}       // 工单详情
PUT    /api/production/workorders/{id}/start // 开始生产
PUT    /api/production/workorders/{id}/report// 报工(更新完成数量)
PUT    /api/production/workorders/{id}/pause // 暂停
PUT    /api/production/workorders/{id}/complete// 完工

// SOP接口
GET    /api/production/sops                  // SOP列表
POST   /api/production/sops                  // 创建SOP
GET    /api/production/sops/{id}             // SOP详情
PUT    /api/production/sops/{id}             // 更新SOP
POST   /api/production/sops/{id}/publish     // 发布SOP
POST   /api/production/sops/import           // 导入SOP文档
```

---

## 3. 跨模块业务流程集成

### 3.1 完整的项目交付流程

```
1. 项目立项 (projects.html)
   ├─ 创建项目
   ├─ 分配团队成员
   └─ 设置里程碑

2. 需求与设计 (bom.html, engineering-change.html)
   ├─ 创建BOM
   ├─ 添加物料清单
   ├─ 设计审查
   └─ BOM审批

3. 采购准备 (procurement.html)
   ├─ 根据BOM生成采购需求
   ├─ 发起询价
   ├─ 比价选择供应商
   └─ 创建采购单

4. 采购执行 (procurement-tracking.html)
   ├─ 发送采购单
   ├─ 跟踪交期
   └─ 收货

5. 质检与入库 (quality-inspection.html, inventory.html)
   ├─ 创建质检单
   ├─ 质检检验
   ├─ 合格品入库
   └─ 不合格品处理

6. 生产准备 (production.html)
   ├─ 创建生产计划
   ├─ 关联BOM和SOP
   ├─ 物料预留
   └─ 生成工单

7. 生产执行 (work-order-detail.html)
   ├─ 领料出库
   ├─ 按SOP生产
   ├─ 过程质检
   └─ 成品入库

8. 项目交付 (projects.html)
   ├─ 交付验收
   ├─ 成本核算
   └─ 项目归档
```

### 3.2 数据联动关系

**BOM → 采购 → 库存 → 生产 联动**
```javascript
// 示例：从BOM生成采购需求
{
  "bomId": 12345,
  "bomItems": [
    {
      "materialId": 1001,
      "requiredQuantity": 100,
      "currentStock": 30,
      "safetyStock": 50,
      "purchaseQuantity": 120  // 自动计算: 100 - 30 + 50 = 120
    }
  ]
}

// 采购入库后自动更新库存
onPurchaseReceived() {
  inventory.quantity += receivedQuantity;
  inventory.availableQuantity = quantity - reservedQuantity;
}

// 生产计划自动预留库存
onProductionPlanCreated() {
  bomItems.forEach(item => {
    inventory.reservedQuantity += item.quantity * plan.quantity;
    inventory.availableQuantity -= item.quantity * plan.quantity;
  });
}
```

---

## 4. 前端实施要点

### 4.1 项目结构
```
ezplm-frontend/
├── public/
├── src/
│   ├── api/                    # API接口封装
│   │   ├── user.ts
│   │   ├── project.ts
│   │   ├── bom.ts
│   │   ├── procurement.ts
│   │   └── ...
│   ├── assets/                 # 静态资源
│   ├── components/             # 公共组件
│   │   ├── Common/
│   │   │   ├── TopBar.vue     # 顶部导航栏
│   │   │   ├── Sidebar.vue    # 侧边栏
│   │   │   └── Breadcrumb.vue # 面包屑
│   │   ├── Form/
│   │   │   ├── MaterialSelect.vue
│   │   │   ├── UserSelect.vue
│   │   │   └── DateRangePicker.vue
│   │   └── Table/
│   │       ├── DataTable.vue
│   │       └── ActionButtons.vue
│   ├── composables/            # 组合式函数
│   │   ├── useAuth.ts
│   │   ├── usePermission.ts
│   │   └── useTable.ts
│   ├── layouts/                # 布局组件
│   │   ├── DefaultLayout.vue
│   │   └── EmptyLayout.vue
│   ├── router/                 # 路由配置
│   │   ├── index.ts
│   │   └── guards.ts          # 路由守卫
│   ├── stores/                 # Pinia状态管理
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   └── app.ts
│   ├── utils/                  # 工具函数
│   │   ├── request.ts         # Axios封装
│   │   ├── permission.ts      # 权限判断
│   │   └── validate.ts        # 表单校验
│   ├── views/                  # 页面组件
│   │   ├── dashboard/
│   │   ├── project/
│   │   ├── bom/
│   │   ├── procurement/
│   │   └── ...
│   ├── App.vue
│   └── main.ts
├── .env.development           # 开发环境配置
├── .env.production            # 生产环境配置
└── package.json
```

### 4.2 权限控制实现
```typescript
// composables/usePermission.ts
export function usePermission() {
  const authStore = useAuthStore()

  const hasPermission = (permission: string) => {
    return authStore.permissions.includes(permission)
  }

  const hasRole = (role: string) => {
    return authStore.roles.includes(role)
  }

  const hasAnyRole = (roles: string[]) => {
    return roles.some(role => authStore.roles.includes(role))
  }

  return { hasPermission, hasRole, hasAnyRole }
}

// 使用示例
<el-button
  v-if="hasPermission('procurement:order:create')"
  @click="createOrder">
  创建采购单
</el-button>

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/auth')
    return
  }

  if (to.meta.roles) {
    const hasRole = to.meta.roles.some(role =>
      authStore.roles.includes(role)
    )
    if (!hasRole) {
      next('/403')
      return
    }
  }

  next()
})
```

### 4.3 通用组件设计
```vue
<!-- components/Table/DataTable.vue -->
<template>
  <div class="data-table">
    <el-table :data="data" v-loading="loading">
      <slot></slot>
    </el-table>
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script setup lang="ts">
// 通用表格组件，支持分页、加载状态等
</script>
```

---

## 5. 后端实施要点

### 5.1 项目结构
```
ezplm-backend/
├── ezplm-common/              # 公共模块
│   ├── common-core/           # 核心工具类
│   ├── common-security/       # 安全认证
│   └── common-redis/          # Redis工具
├── ezplm-api/                 # API接口定义
│   └── api-system/
├── ezplm-modules/             # 业务模块
│   ├── module-system/         # 系统管理
│   │   ├── controller/
│   │   ├── service/
│   │   ├── mapper/
│   │   └── entity/
│   ├── module-project/        # 项目管理
│   ├── module-bom/            # BOM管理
│   ├── module-procurement/    # 采购管理
│   ├── module-inventory/      # 库存管理
│   └── module-production/     # 生产管理
└── ezplm-gateway/             # 网关服务
```

### 5.2 统一响应格式
```java
@Data
public class ApiResponse<T> {
    private Integer code;        // 200:成功 其他:失败
    private String message;      // 响应消息
    private T data;              // 响应数据
    private Long timestamp;      // 时间戳

    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(200);
        response.setMessage("操作成功");
        response.setData(data);
        response.setTimestamp(System.currentTimeMillis());
        return response;
    }

    public static <T> ApiResponse<T> error(String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(500);
        response.setMessage(message);
        response.setTimestamp(System.currentTimeMillis());
        return response;
    }
}
```

### 5.3 分页查询封装
```java
@Data
public class PageQuery {
    private Integer pageNum = 1;
    private Integer pageSize = 10;
    private String orderBy;
}

@Data
public class PageResult<T> {
    private Long total;
    private List<T> records;
    private Integer pageNum;
    private Integer pageSize;
    private Integer totalPages;
}

// Service层使用
public PageResult<Project> getProjectList(PageQuery query) {
    Page<Project> page = new Page<>(query.getPageNum(), query.getPageSize());
    IPage<Project> result = projectMapper.selectPage(page, null);

    PageResult<Project> pageResult = new PageResult<>();
    pageResult.setTotal(result.getTotal());
    pageResult.setRecords(result.getRecords());
    pageResult.setPageNum(query.getPageNum());
    pageResult.setPageSize(query.getPageSize());
    return pageResult;
}
```

### 5.4 异常处理
```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ApiResponse<?> handleBusinessException(BusinessException e) {
        log.error("业务异常：{}", e.getMessage());
        return ApiResponse.error(e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiResponse<?> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldError().getDefaultMessage();
        return ApiResponse.error("参数校验失败：" + message);
    }

    @ExceptionHandler(Exception.class)
    public ApiResponse<?> handleException(Exception e) {
        log.error("系统异常", e);
        return ApiResponse.error("系统异常，请联系管理员");
    }
}
```

---

## 附录：关键页面与功能映射表

| 页面文件 | 功能说明 | 角色权限 | 关键API |
|---------|---------|---------|---------|
| dashboard-pro.html | 专业版仪表盘 | ALL | /api/dashboard/statistics |
| projects.html | 项目列表 | PM, ENGINEER | /api/projects |
| project-detail.html | 项目详情 | PM, ENGINEER | /api/projects/{id} |
| bom.html | BOM管理 | ENGINEER | /api/bom |
| bom-detail.html | BOM详情 | ENGINEER | /api/bom/{id} |
| materials.html | 物料管理 | WAREHOUSE, PURCHASER | /api/materials |
| procurement.html | 采购管理 | PURCHASER | /api/procurement/orders |
| procurement-detail.html | 采购单详情 | PURCHASER | /api/procurement/orders/{id} |
| inventory.html | 库存管理 | WAREHOUSE | /api/inventory |
| quality-inspection.html | 质检管理 | WAREHOUSE | /api/qc/inspections |
| production.html | 生产管理 | PRODUCER, PM | /api/production/plans |
| sop-view.html | SOP查看 | PRODUCER | /api/production/sops/{id} |
| tasks.html | 任务管理 | ALL | /api/tasks |
| collaboration.html | 团队协作 | ALL | /api/collaboration |
| approval-center.html | 审批中心 | PM, ADMIN | /api/approvals |
| organization-settings.html | 组织设置 | ADMIN | /api/organization |
| supplier-management.html | 供应商管理 | PURCHASER | /api/suppliers |

---

**实施优先级建议:**
1. **第一阶段 (1-2个月):** 用户权限、项目管理、BOM管理、物料管理
2. **第二阶段 (2-3个月):** 采购管理、供应商管理、库存管理、质检管理
3. **第三阶段 (3-4个月):** 生产管理、SOP管理、协作功能、审批流程
4. **第四阶段 (4-5个月):** 教育模块、招聘模块、元器件供货平台、数据分析

**技术实施团队配置建议:**
- 前端工程师: 2-3人 (Vue3 + TypeScript)
- 后端工程师: 3-4人 (Spring Boot + MySQL)
- 测试工程师: 1-2人
- UI/UX设计师: 1人
- 项目经理: 1人
