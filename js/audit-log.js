/**
 * EZPLM - 操作日志审计系统
 * 功能：
 * 1. 记录所有关键操作
 * 2. 追踪数据变更历史
 * 3. 安全审计
 * 4. 合规性支持
 */

class AuditLog {
    // 操作类型
    static ACTIONS = {
        CREATE: 'create',
        READ: 'read',
        UPDATE: 'update',
        DELETE: 'delete',
        APPROVE: 'approve',
        REJECT: 'reject',
        LOGIN: 'login',
        LOGOUT: 'logout',
        EXPORT: 'export',
        IMPORT: 'import'
    };

    // 模块类型
    static MODULES = {
        REQUIREMENT: 'requirement',
        PROJECT: 'project',
        MATERIAL: 'material',
        BOM: 'bom',
        PROCUREMENT: 'procurement',
        INVENTORY: 'inventory',
        PRODUCTION: 'production',
        QC: 'qc',
        SUPPLIER: 'supplier',
        USER: 'user',
        SYSTEM: 'system'
    };

    // 日志级别
    static LEVELS = {
        INFO: 'info',
        WARNING: 'warning',
        ERROR: 'error',
        CRITICAL: 'critical'
    };

    /**
     * 记录操作日志
     * @param {string} module - 模块名称
     * @param {string} action - 操作类型
     * @param {Object} details - 详细信息
     * @param {string} level - 日志级别
     */
    static log(module, action, details = {}, level = this.LEVELS.INFO) {
        const logEntry = {
            id: this.generateLogId(),
            timestamp: new Date().toISOString(),
            userId: this.getCurrentUserId(),
            userName: this.getCurrentUserName(),
            userRole: this.getCurrentUserRole(),
            module: module,
            action: action,
            level: level,
            details: details,
            ipAddress: this.getIPAddress(),
            userAgent: navigator.userAgent,
            sessionId: this.getSessionId()
        };

        // 保存日志
        this.saveLog(logEntry);

        // 关键操作实时发送到服务器
        if (level === this.LEVELS.CRITICAL || level === this.LEVELS.ERROR) {
            this.sendToServer(logEntry);
        }

        // 控制台输出（开发环境）
        if (this.isDevelopment()) {
            console.log(`[AuditLog] ${module}.${action}:`, logEntry);
        }

        return logEntry;
    }

    /**
     * 记录创建操作
     */
    static logCreate(module, objectId, objectData) {
        return this.log(module, this.ACTIONS.CREATE, {
            objectId: objectId,
            objectType: module,
            data: this.sanitizeData(objectData),
            message: `创建了${this.getModuleName(module)} ${objectId}`
        });
    }

    /**
     * 记录更新操作
     */
    static logUpdate(module, objectId, oldData, newData) {
        const changes = this.compareData(oldData, newData);

        return this.log(module, this.ACTIONS.UPDATE, {
            objectId: objectId,
            objectType: module,
            changes: changes,
            oldData: this.sanitizeData(oldData),
            newData: this.sanitizeData(newData),
            message: `更新了${this.getModuleName(module)} ${objectId}，变更了 ${Object.keys(changes).length} 个字段`
        });
    }

    /**
     * 记录删除操作
     */
    static logDelete(module, objectId, objectData) {
        return this.log(module, this.ACTIONS.DELETE, {
            objectId: objectId,
            objectType: module,
            data: this.sanitizeData(objectData),
            message: `删除了${this.getModuleName(module)} ${objectId}`
        }, this.LEVELS.WARNING);
    }

    /**
     * 记录审批操作
     */
    static logApprove(module, objectId, result, reason = '') {
        const action = result === 'approved' ? this.ACTIONS.APPROVE : this.ACTIONS.REJECT;

        return this.log(module, action, {
            objectId: objectId,
            result: result,
            reason: reason,
            message: `${result === 'approved' ? '批准' : '拒绝'}了${this.getModuleName(module)} ${objectId}`
        });
    }

    /**
     * 记录导出操作
     */
    static logExport(module, exportType, filter = {}) {
        return this.log(module, this.ACTIONS.EXPORT, {
            exportType: exportType,
            filter: filter,
            message: `导出了${this.getModuleName(module)}数据`
        }, this.LEVELS.WARNING);
    }

    /**
     * 记录安全相关操作
     */
    static logSecurity(action, details) {
        return this.log(this.MODULES.SYSTEM, action, details, this.LEVELS.CRITICAL);
    }

    /**
     * 记录错误
     */
    static logError(module, error, context = {}) {
        return this.log(module, 'error', {
            error: {
                message: error.message,
                stack: error.stack
            },
            context: context
        }, this.LEVELS.ERROR);
    }

    /**
     * 获取操作历史
     * @param {Object} filter - 筛选条件
     * @returns {Array} - 日志列表
     */
    static getHistory(filter = {}) {
        let logs = this.getAllLogs();

        // 按模块筛选
        if (filter.module) {
            logs = logs.filter(log => log.module === filter.module);
        }

        // 按对象ID筛选
        if (filter.objectId) {
            logs = logs.filter(log => log.details.objectId === filter.objectId);
        }

        // 按用户筛选
        if (filter.userId) {
            logs = logs.filter(log => log.userId === filter.userId);
        }

        // 按时间范围筛选
        if (filter.startDate) {
            logs = logs.filter(log => new Date(log.timestamp) >= new Date(filter.startDate));
        }
        if (filter.endDate) {
            logs = logs.filter(log => new Date(log.timestamp) <= new Date(filter.endDate));
        }

        // 按操作类型筛选
        if (filter.action) {
            logs = logs.filter(log => log.action === filter.action);
        }

        // 按日志级别筛选
        if (filter.level) {
            logs = logs.filter(log => log.level === filter.level);
        }

        // 排序（最新的在前）
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // 分页
        if (filter.page && filter.pageSize) {
            const start = (filter.page - 1) * filter.pageSize;
            const end = start + filter.pageSize;
            return {
                data: logs.slice(start, end),
                total: logs.length,
                page: filter.page,
                pageSize: filter.pageSize
            };
        }

        return logs;
    }

    /**
     * 显示操作历史对话框
     */
    static showHistoryDialog(module, objectId, objectName = '') {
        const history = this.getHistory({ module, objectId });

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
            <div class="modal-content" style="background: white; border-radius: 12px; width: 900px; max-height: 80vh; overflow: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                <div class="modal-header" style="padding: 24px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 20px; font-weight: 700; color: #1a1a1a;">📜 操作历史</div>
                        <div style="font-size: 13px; color: #999; margin-top: 4px;">${objectName} (${objectId})</div>
                    </div>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #999; line-height: 1;">×</button>
                </div>
                <div class="modal-body" style="padding: 24px;">
                    ${history.length > 0 ? `
                        <div style="position: relative;">
                            <div style="position: absolute; left: 24px; top: 12px; bottom: 12px; width: 2px; background: #e0e0e0;"></div>
                            ${history.map((log, index) => `
                                <div style="display: flex; gap: 16px; margin-bottom: ${index < history.length - 1 ? '24px' : '0'}; position: relative;">
                                    <div style="width: 40px; height: 40px; border-radius: 50%; background: ${this.getLevelColor(log.level)}; color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; z-index: 1;">
                                        ${this.getActionIcon(log.action)}
                                    </div>
                                    <div style="flex: 1; background: #f8f9fa; padding: 16px; border-radius: 8px;">
                                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                                            <div>
                                                <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 4px;">
                                                    ${log.details.message || this.getActionName(log.action)}
                                                </div>
                                                <div style="font-size: 12px; color: #666;">
                                                    ${log.userName} · ${log.userRole}
                                                </div>
                                            </div>
                                            <div style="font-size: 11px; color: #999;">
                                                ${this.formatTimestamp(log.timestamp)}
                                            </div>
                                        </div>
                                        ${log.details.changes ? `
                                            <div style="margin-top: 12px; font-size: 12px;">
                                                <div style="font-weight: 600; margin-bottom: 6px; color: #666;">变更内容：</div>
                                                ${Object.entries(log.details.changes).map(([key, value]) => `
                                                    <div style="padding: 4px 0; border-bottom: 1px solid #e0e0e0;">
                                                        <span style="color: #999;">${key}:</span>
                                                        <span style="color: #ff4757; text-decoration: line-through; margin: 0 8px;">${value.old}</span>
                                                        →
                                                        <span style="color: #00890b; margin-left: 8px;">${value.new}</span>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        ` : ''}
                                        ${log.details.reason ? `
                                            <div style="margin-top: 12px; padding: 8px; background: #fff; border-left: 3px solid #f39c12; font-size: 12px; color: #666;">
                                                原因：${log.details.reason}
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<div style="text-align: center; padding: 40px; color: #999;">暂无操作记录</div>'}
                </div>
                <div class="modal-footer" style="padding: 16px 24px; border-top: 1px solid #e0e0e0; text-align: right;">
                    <button class="btn" style="background: #f0f0f0; color: #666; padding: 10px 20px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600;" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                </div>
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

    static generateLogId() {
        return 'LOG-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    static getCurrentUserId() {
        return localStorage.getItem('userId') || 'anonymous';
    }

    static getCurrentUserName() {
        return localStorage.getItem('userName') || '未知用户';
    }

    static getCurrentUserRole() {
        return localStorage.getItem('userRole') || 'unknown';
    }

    static getIPAddress() {
        // 实际应该从服务器获取
        return localStorage.getItem('userIP') || '127.0.0.1';
    }

    static getSessionId() {
        let sessionId = sessionStorage.getItem('sessionId');
        if (!sessionId) {
            sessionId = 'SESSION-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('sessionId', sessionId);
        }
        return sessionId;
    }

    static isDevelopment() {
        return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    }

    static sanitizeData(data) {
        // 移除敏感信息
        const sanitized = { ...data };
        const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];

        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '***';
            }
        });

        return sanitized;
    }

    static compareData(oldData, newData) {
        const changes = {};

        Object.keys(newData).forEach(key => {
            if (oldData[key] !== newData[key]) {
                changes[key] = {
                    old: oldData[key],
                    new: newData[key]
                };
            }
        });

        return changes;
    }

    static getModuleName(module) {
        const names = {
            'requirement': '需求',
            'project': '项目',
            'material': '物料',
            'bom': 'BOM',
            'procurement': '采购订单',
            'inventory': '库存',
            'production': '生产计划',
            'qc': '质检',
            'supplier': '供应商',
            'user': '用户',
            'system': '系统'
        };
        return names[module] || module;
    }

    static getActionName(action) {
        const names = {
            'create': '创建',
            'read': '查看',
            'update': '更新',
            'delete': '删除',
            'approve': '批准',
            'reject': '拒绝',
            'export': '导出',
            'import': '导入'
        };
        return names[action] || action;
    }

    static getActionIcon(action) {
        const icons = {
            'create': '➕',
            'read': '👁️',
            'update': '✏️',
            'delete': '🗑️',
            'approve': '✅',
            'reject': '❌',
            'export': '📤',
            'import': '📥'
        };
        return icons[action] || '📝';
    }

    static getLevelColor(level) {
        const colors = {
            'info': '#1976d2',
            'warning': '#f39c12',
            'error': '#ff4757',
            'critical': '#c0392b'
        };
        return colors[level] || '#999';
    }

    static formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) {
            return '刚刚';
        } else if (diff < 3600000) {
            return Math.floor(diff / 60000) + '分钟前';
        } else if (diff < 86400000) {
            return Math.floor(diff / 3600000) + '小时前';
        } else {
            return date.toLocaleString('zh-CN');
        }
    }

    static saveLog(logEntry) {
        const logs = this.getAllLogs();
        logs.push(logEntry);

        // 只保留最近1000条日志（localStorage限制）
        if (logs.length > 1000) {
            logs.splice(0, logs.length - 1000);
        }

        localStorage.setItem('auditLogs', JSON.stringify(logs));
    }

    static getAllLogs() {
        return JSON.parse(localStorage.getItem('auditLogs') || '[]');
    }

    static sendToServer(logEntry) {
        // 实际应该发送到后端API
        console.log('Sending critical log to server:', logEntry);

        // 使用 navigator.sendBeacon 确保即使页面关闭也能发送
        if (navigator.sendBeacon) {
            const data = JSON.stringify(logEntry);
            navigator.sendBeacon('/api/audit-log', data);
        }
    }

    /**
     * 清除旧日志（定期清理）
     */
    static cleanOldLogs(days = 90) {
        const logs = this.getAllLogs();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const cleaned = logs.filter(log =>
            new Date(log.timestamp) > cutoffDate
        );

        localStorage.setItem('auditLogs', JSON.stringify(cleaned));
        return logs.length - cleaned.length;
    }
}

// 页面卸载时记录
window.addEventListener('beforeunload', () => {
    AuditLog.cleanOldLogs(90);
});

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuditLog;
}
