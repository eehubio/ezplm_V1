/**
 * EZPLM - 基于角色的访问控制(RBAC)系统
 * 功能：
 * 1. 角色权限管理
 * 2. 操作权限检查
 * 3. 页面访问控制
 * 4. 数据范围限制
 */

class PermissionControl {
    // 角色定义
    static ROLES = {
        ADMIN: 'R00_ADMIN',
        SALES: 'R01_SALES',
        PM: 'R02_PM',
        ENGINEER: 'R03_ENGINEER',
        PROCUREMENT: 'R04_PROCUREMENT',
        PMC: 'R05_PMC',
        QC: 'R06_QC',
        PRODUCTION: 'R07_PRODUCTION',
        WAREHOUSE: 'R08_WAREHOUSE',
        SUPPLIER: 'R09_SUPPLIER',
        FINANCE: 'R10_FINANCE'
    };

    // 操作类型
    static ACTIONS = {
        CREATE: 'create',
        READ: 'read',
        UPDATE: 'update',
        DELETE: 'delete',
        APPROVE: 'approve',
        EXPORT: 'export'
    };

    // 权限矩阵（模块 → 角色 → 操作列表）
    static PERMISSIONS = {
        // 需求管理
        'requirement': {
            [this.ROLES.ADMIN]: ['create', 'read', 'update', 'delete', 'approve'],
            [this.ROLES.SALES]: ['create', 'read', 'update', 'delete'],
            [this.ROLES.PM]: ['read', 'update'],
            [this.ROLES.FINANCE]: ['read']
        },

        // 项目管理
        'project': {
            [this.ROLES.ADMIN]: ['create', 'read', 'update', 'delete'],
            [this.ROLES.PM]: ['create', 'read', 'update', 'delete'],
            [this.ROLES.SALES]: ['read'],
            [this.ROLES.ENGINEER]: ['read', 'update'],
            [this.ROLES.PMC]: ['read', 'update'],
            [this.ROLES.QC]: ['read'],
            [this.ROLES.PRODUCTION]: ['read'],
            [this.ROLES.WAREHOUSE]: ['read'],
            [this.ROLES.FINANCE]: ['read']
        },

        // 物料管理
        'material': {
            [this.ROLES.ADMIN]: ['create', 'read', 'update', 'delete'],
            [this.ROLES.ENGINEER]: ['create', 'read', 'update', 'delete'],
            [this.ROLES.PM]: ['read'],
            [this.ROLES.PROCUREMENT]: ['read', 'update'],
            [this.ROLES.PMC]: ['read'],
            [this.ROLES.QC]: ['read'],
            [this.ROLES.PRODUCTION]: ['read'],
            [this.ROLES.WAREHOUSE]: ['read'],
            [this.ROLES.SUPPLIER]: ['read'],
            [this.ROLES.FINANCE]: ['read']
        },

        // 客供物料
        'customer_material': {
            [this.ROLES.ADMIN]: ['create', 'read', 'update', 'delete'],
            [this.ROLES.PM]: ['read', 'update'],
            [this.ROLES.ENGINEER]: ['read', 'update'],
            [this.ROLES.PROCUREMENT]: ['read', 'update'],
            [this.ROLES.PMC]: ['create', 'read', 'update', 'delete'],
            [this.ROLES.QC]: ['read'],
            [this.ROLES.PRODUCTION]: ['read'],
            [this.ROLES.WAREHOUSE]: ['read', 'update']
        },

        // BOM管理
        'bom': {
            [this.ROLES.ADMIN]: ['create', 'read', 'update', 'delete'],
            [this.ROLES.ENGINEER]: ['create', 'read', 'update', 'delete'],
            [this.ROLES.PM]: ['read', 'update'],
            [this.ROLES.PMC]: ['read'],
            [this.ROLES.PROCUREMENT]: ['read'],
            [this.ROLES.QC]: ['read'],
            [this.ROLES.WAREHOUSE]: ['read']
        },

        // 采购管理
        'procurement': {
            [this.ROLES.ADMIN]: ['create', 'read', 'update', 'delete', 'approve'],
            [this.ROLES.PROCUREMENT]: ['create', 'read', 'update', 'delete'],
            [this.ROLES.PM]: ['read'],
            [this.ROLES.ENGINEER]: ['read'],
            [this.ROLES.PMC]: ['read'],
            [this.ROLES.WAREHOUSE]: ['read'],
            [this.ROLES.SUPPLIER]: ['read'],  // 只能看自己的订单
            [this.ROLES.FINANCE]: ['read', 'approve']
        },

        // 库存管理
        'inventory': {
            [this.ROLES.ADMIN]: ['create', 'read', 'update', 'delete'],
            [this.ROLES.WAREHOUSE]: ['create', 'read', 'update', 'delete'],
            [this.ROLES.PM]: ['read'],
            [this.ROLES.ENGINEER]: ['read'],
            [this.ROLES.PROCUREMENT]: ['read'],
            [this.ROLES.PMC]: ['read', 'update'],
            [this.ROLES.QC]: ['read'],
            [this.ROLES.PRODUCTION]: ['read']
        },

        // 生产管理
        'production': {
            [this.ROLES.ADMIN]: ['create', 'read', 'update', 'delete'],
            [this.ROLES.PMC]: ['create', 'read', 'update', 'delete'],
            [this.ROLES.PM]: ['read'],
            [this.ROLES.ENGINEER]: ['read'],
            [this.ROLES.PROCUREMENT]: ['read'],
            [this.ROLES.QC]: ['read'],
            [this.ROLES.PRODUCTION]: ['read', 'update'],
            [this.ROLES.WAREHOUSE]: ['read']
        },

        // 质检管理
        'qc': {
            [this.ROLES.ADMIN]: ['create', 'read', 'update', 'delete'],
            [this.ROLES.QC]: ['create', 'read', 'update', 'delete'],
            [this.ROLES.PM]: ['read'],
            [this.ROLES.ENGINEER]: ['read'],
            [this.ROLES.PMC]: ['read'],
            [this.ROLES.PRODUCTION]: ['read'],
            [this.ROLES.WAREHOUSE]: ['read']
        },

        // 供应商管理
        'supplier': {
            [this.ROLES.ADMIN]: ['create', 'read', 'update', 'delete'],
            [this.ROLES.PROCUREMENT]: ['create', 'read', 'update', 'delete'],
            [this.ROLES.PM]: ['read'],
            [this.ROLES.PMC]: ['read'],
            [this.ROLES.SUPPLIER]: ['read', 'update']  // 只能管理自己
        },

        // 审批中心
        'approval': {
            [this.ROLES.ADMIN]: ['create', 'read', 'update', 'delete', 'approve'],
            [this.ROLES.PM]: ['create', 'read', 'update', 'approve'],
            [this.ROLES.SALES]: ['read', 'update'],
            [this.ROLES.ENGINEER]: ['read', 'update'],
            [this.ROLES.PROCUREMENT]: ['read', 'update'],
            [this.ROLES.PMC]: ['read', 'update'],
            [this.ROLES.QC]: ['read', 'update'],
            [this.ROLES.FINANCE]: ['read', 'approve']
        },

        // 时间管控看板
        'timeline': {
            [this.ROLES.ADMIN]: ['read'],
            [this.ROLES.PM]: ['read'],
            [this.ROLES.SALES]: ['read'],
            [this.ROLES.ENGINEER]: ['read'],
            [this.ROLES.PROCUREMENT]: ['read'],
            [this.ROLES.PMC]: ['read'],
            [this.ROLES.QC]: ['read'],
            [this.ROLES.FINANCE]: ['read']
        }
    };

    /**
     * 检查用户是否有权限执行某操作
     * @param {string} module - 模块名称
     * @param {string} action - 操作类型
     * @param {string} role - 用户角色（可选，不传则从session获取）
     * @returns {boolean}
     */
    static hasPermission(module, action, role = null) {
        const userRole = role || this.getCurrentUserRole();

        // 管理员拥有所有权限
        if (userRole === this.ROLES.ADMIN) {
            return true;
        }

        // 检查模块权限配置
        const modulePerms = this.PERMISSIONS[module];
        if (!modulePerms) {
            console.warn(`模块 ${module} 未配置权限`);
            return false;
        }

        // 检查角色权限
        const rolePerms = modulePerms[userRole];
        if (!rolePerms) {
            return false;
        }

        return rolePerms.includes(action);
    }

    /**
     * 检查多个权限（AND逻辑）
     */
    static hasAllPermissions(checks) {
        return checks.every(check =>
            this.hasPermission(check.module, check.action, check.role)
        );
    }

    /**
     * 检查多个权限（OR逻辑）
     */
    static hasAnyPermission(checks) {
        return checks.some(check =>
            this.hasPermission(check.module, check.action, check.role)
        );
    }

    /**
     * 获取用户可访问的模块列表
     */
    static getAccessibleModules(role = null) {
        const userRole = role || this.getCurrentUserRole();
        const modules = [];

        for (const [module, perms] of Object.entries(this.PERMISSIONS)) {
            if (perms[userRole] && perms[userRole].length > 0) {
                modules.push({
                    module: module,
                    permissions: perms[userRole]
                });
            }
        }

        return modules;
    }

    /**
     * 数据范围过滤（用于列表查询）
     * @param {string} module - 模块名称
     * @param {Array} data - 原始数据
     * @returns {Array} - 过滤后的数据
     */
    static filterDataByScope(module, data) {
        const userRole = this.getCurrentUserRole();
        const userId = this.getCurrentUserId();

        // 管理员看所有数据
        if (userRole === this.ROLES.ADMIN) {
            return data;
        }

        // 供应商只能看自己的数据
        if (userRole === this.ROLES.SUPPLIER) {
            return data.filter(item => item.supplierId === userId);
        }

        // 销售只能看自己的客户/需求
        if (userRole === this.ROLES.SALES && (module === 'requirement' || module === 'customer')) {
            return data.filter(item => item.salesOwnerId === userId);
        }

        // 项目经理只能看自己负责的项目
        if (userRole === this.ROLES.PM && module === 'project') {
            return data.filter(item => item.pmId === userId);
        }

        // 默认返回所有数据
        return data;
    }

    /**
     * UI元素权限控制（隐藏无权限的按钮）
     */
    static applyUIPermissions() {
        const userRole = this.getCurrentUserRole();

        // 查找所有带权限标记的元素
        document.querySelectorAll('[data-permission]').forEach(element => {
            const permission = element.dataset.permission;  // format: "module:action"
            const [module, action] = permission.split(':');

            if (!this.hasPermission(module, action, userRole)) {
                // 隐藏或禁用元素
                if (element.dataset.permissionMode === 'disable') {
                    element.disabled = true;
                    element.style.opacity = '0.5';
                    element.style.cursor = 'not-allowed';
                    element.title = '您没有此操作权限';
                } else {
                    element.style.display = 'none';
                }
            }
        });
    }

    /**
     * 页面访问控制（在页面加载时调用）
     */
    static checkPageAccess(module, requiredAction = 'read') {
        if (!this.hasPermission(module, requiredAction)) {
            // 无权限，跳转到403页面
            alert('您没有访问此页面的权限');
            location.href = '403.html';
            return false;
        }
        return true;
    }

    /**
     * 操作前权限检查（装饰器模式）
     */
    static requirePermission(module, action) {
        return function(target, propertyKey, descriptor) {
            const originalMethod = descriptor.value;

            descriptor.value = function(...args) {
                if (!PermissionControl.hasPermission(module, action)) {
                    alert(`您没有权限执行此操作`);
                    return;
                }
                return originalMethod.apply(this, args);
            };

            return descriptor;
        };
    }

    /**
     * 显示权限错误提示
     */
    static showPermissionError(action = '执行此操作') {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;

        modal.innerHTML = `
            <div class="modal-content" style="background: white; border-radius: 12px; width: 400px; padding: 32px; text-align: center;">
                <div style="font-size: 60px; margin-bottom: 16px;">🔒</div>
                <div style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">权限不足</div>
                <div style="font-size: 14px; color: #666; margin-bottom: 24px;">您没有权限${action}，请联系管理员</div>
                <button onclick="this.closest('.modal-overlay').remove()" style="background: #00890b; color: white; padding: 12px 32px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">我知道了</button>
            </div>
        `;

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);
    }

    // ==================== 工具方法 ====================

    /**
     * 获取当前用户角色
     */
    static getCurrentUserRole() {
        // 实际应该从session或JWT token获取
        const userRole = localStorage.getItem('userRole');
        return userRole || this.ROLES.ADMIN;  // 默认管理员（实际应该要求登录）
    }

    /**
     * 获取当前用户ID
     */
    static getCurrentUserId() {
        return localStorage.getItem('userId') || 'user001';
    }

    /**
     * 获取当前用户信息
     */
    static getCurrentUser() {
        return {
            id: this.getCurrentUserId(),
            role: this.getCurrentUserRole(),
            name: localStorage.getItem('userName') || '管理员'
        };
    }

    /**
     * 设置用户角色（用于测试）
     */
    static setUserRole(role) {
        if (Object.values(this.ROLES).includes(role)) {
            localStorage.setItem('userRole', role);
            console.log(`用户角色已切换为：${role}`);
        } else {
            console.error(`无效的角色：${role}`);
        }
    }

    /**
     * 角色切换UI（用于开发测试）
     */
    static showRoleSwitcher() {
        const switcher = document.createElement('div');
        switcher.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            border: 2px solid #00890b;
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
        `;

        switcher.innerHTML = `
            <div style="font-size: 12px; font-weight: 700; margin-bottom: 8px; color: #00890b;">
                🔧 角色切换（开发模式）
            </div>
            <select id="roleSwitcher" style="width: 100%; padding: 6px; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 12px;">
                <option value="${this.ROLES.ADMIN}">管理员</option>
                <option value="${this.ROLES.SALES}">销售人员</option>
                <option value="${this.ROLES.PM}">项目经理</option>
                <option value="${this.ROLES.ENGINEER}">硬件工程师</option>
                <option value="${this.ROLES.PROCUREMENT}">采购专员</option>
                <option value="${this.ROLES.PMC}">PMC</option>
                <option value="${this.ROLES.QC}">质检工程师</option>
                <option value="${this.ROLES.PRODUCTION}">生产人员</option>
                <option value="${this.ROLES.WAREHOUSE}">仓库管理员</option>
                <option value="${this.ROLES.SUPPLIER}">供应商</option>
                <option value="${this.ROLES.FINANCE}">财务</option>
            </select>
            <button onclick="PermissionControl.switchRole()" style="margin-top: 8px; width: 100%; padding: 6px; background: #00890b; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">切换角色</button>
        `;

        // 设置当前选中的角色
        setTimeout(() => {
            document.getElementById('roleSwitcher').value = this.getCurrentUserRole();
        }, 100);

        document.body.appendChild(switcher);
    }

    static switchRole() {
        const newRole = document.getElementById('roleSwitcher').value;
        this.setUserRole(newRole);
        alert(`角色已切换，页面将刷新`);
        location.reload();
    }
}

// 页面加载时应用权限控制
document.addEventListener('DOMContentLoaded', () => {
    PermissionControl.applyUIPermissions();
});

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PermissionControl;
}
