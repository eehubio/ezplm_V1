/**
 * EZPLM - 物料占料系统
 * 解决多项目物料冲突问题
 *
 * 功能：
 * 1. 为项目/生产计划预留物料库存
 * 2. 防止超领和库存冲突
 * 3. 自动计算可用库存
 * 4. 占料过期自动释放
 */

class MaterialReservation {
    /**
     * 为项目或生产计划占用物料
     * @param {string} sourceType - 'project' | 'production' | 'bom'
     * @param {string} sourceId - 项目ID或生产计划ID
     * @param {Array} materials - [{materialId, materialName, quantity, unit}]
     * @returns {Object} - {success: boolean, reservations: [], errors: []}
     */
    static reserveMaterials(sourceType, sourceId, materials) {
        const reservations = [];
        const errors = [];
        const sourceName = this.getSourceName(sourceType, sourceId);

        // 遍历每个物料，检查库存并占用
        materials.forEach(item => {
            try {
                // 1. 获取可用库存
                const available = this.getAvailableQuantity(item.materialId);

                // 2. 检查库存是否足够
                if (available < item.quantity) {
                    errors.push({
                        materialId: item.materialId,
                        materialName: item.materialName,
                        required: item.quantity,
                        available: available,
                        shortage: item.quantity - available
                    });
                    return;
                }

                // 3. 创建占料记录
                const reservation = {
                    id: this.generateReservationId(),
                    materialId: item.materialId,
                    materialName: item.materialName,
                    sourceType: sourceType,
                    sourceId: sourceId,
                    sourceName: sourceName,
                    quantity: item.quantity,
                    unit: item.unit || 'pcs',
                    status: 'reserved',  // reserved, partially_used, used, released, expired
                    usedQuantity: 0,
                    createdAt: new Date().toISOString(),
                    createdBy: this.getCurrentUser(),
                    expiresAt: this.calculateExpiry(sourceType),
                    notes: `为 ${sourceName} 占用物料`
                };

                reservations.push(reservation);

                // 4. 记录到localStorage（实际应该调用后端API）
                this.saveReservation(reservation);

            } catch (error) {
                errors.push({
                    materialId: item.materialId,
                    materialName: item.materialName,
                    error: error.message
                });
            }
        });

        return {
            success: errors.length === 0,
            reservations: reservations,
            errors: errors
        };
    }

    /**
     * 获取物料可用库存（总库存 - 已占用 - 安全库存）
     */
    static getAvailableQuantity(materialId) {
        // 1. 获取总库存
        const totalStock = this.getTotalStock(materialId);

        // 2. 获取已占用数量
        const reserved = this.getReservedQuantity(materialId);

        // 3. 获取安全库存
        const safetyStock = this.getSafetyStock(materialId);

        // 可用 = 总库存 - 已占用 - 安全库存
        return Math.max(0, totalStock - reserved - safetyStock);
    }

    /**
     * 获取物料总库存
     */
    static getTotalStock(materialId) {
        // 实际应该从后端API获取
        // 这里从localStorage模拟
        const inventory = JSON.parse(localStorage.getItem('inventory') || '{}');
        return inventory[materialId] || 0;
    }

    /**
     * 获取物料已占用数量
     */
    static getReservedQuantity(materialId) {
        const reservations = this.getAllReservations();
        return reservations
            .filter(r => r.materialId === materialId &&
                        (r.status === 'reserved' || r.status === 'partially_used'))
            .reduce((sum, r) => sum + (r.quantity - r.usedQuantity), 0);
    }

    /**
     * 获取安全库存
     */
    static getSafetyStock(materialId) {
        // 实际应该从物料主数据获取
        const materials = JSON.parse(localStorage.getItem('materials') || '[]');
        const material = materials.find(m => m.id === materialId);
        return material?.safetyStock || 0;
    }

    /**
     * 占料转实际使用（生产领料时调用）
     */
    static confirmUsage(reservationId, actualQuantity) {
        const reservations = this.getAllReservations();
        const index = reservations.findIndex(r => r.id === reservationId);

        if (index === -1) {
            throw new Error('占料记录不存在');
        }

        const reservation = reservations[index];

        if (actualQuantity > reservation.quantity - reservation.usedQuantity) {
            throw new Error('使用数量超过占用数量');
        }

        // 更新占料记录
        reservation.usedQuantity += actualQuantity;

        if (reservation.usedQuantity >= reservation.quantity) {
            reservation.status = 'used';
        } else {
            reservation.status = 'partially_used';
        }

        reservation.updatedAt = new Date().toISOString();
        reservation.updatedBy = this.getCurrentUser();

        // 保存
        reservations[index] = reservation;
        this.saveAllReservations(reservations);

        // 扣减实际库存
        this.deductStock(reservation.materialId, actualQuantity);

        return reservation;
    }

    /**
     * 释放占料（项目取消或不需要时）
     */
    static releaseReservation(reservationId, reason = '') {
        const reservations = this.getAllReservations();
        const index = reservations.findIndex(r => r.id === reservationId);

        if (index === -1) {
            throw new Error('占料记录不存在');
        }

        const reservation = reservations[index];

        // 只能释放未使用或部分使用的占料
        if (reservation.status !== 'reserved' && reservation.status !== 'partially_used') {
            throw new Error('该占料记录不能释放');
        }

        // 更新状态
        reservation.status = 'released';
        reservation.releasedAt = new Date().toISOString();
        reservation.releasedBy = this.getCurrentUser();
        reservation.releaseReason = reason;

        reservations[index] = reservation;
        this.saveAllReservations(reservations);

        return reservation;
    }

    /**
     * 获取项目/生产计划的所有占料记录
     */
    static getReservationsBySource(sourceType, sourceId) {
        const reservations = this.getAllReservations();
        return reservations.filter(r =>
            r.sourceType === sourceType &&
            r.sourceId === sourceId &&
            r.status !== 'released'
        );
    }

    /**
     * 检查并自动释放过期占料
     */
    static checkAndReleaseExpired() {
        const reservations = this.getAllReservations();
        const now = new Date();
        let releasedCount = 0;

        reservations.forEach((reservation, index) => {
            if (reservation.status === 'reserved' &&
                new Date(reservation.expiresAt) < now) {
                reservations[index].status = 'expired';
                reservations[index].expiredAt = now.toISOString();
                releasedCount++;
            }
        });

        if (releasedCount > 0) {
            this.saveAllReservations(reservations);
            console.log(`自动释放了 ${releasedCount} 条过期占料`);
        }

        return releasedCount;
    }

    /**
     * 获取物料占用详情（用于显示）
     */
    static getMaterialReservationDetail(materialId) {
        const reservations = this.getAllReservations();
        const materialReservations = reservations.filter(r =>
            r.materialId === materialId &&
            (r.status === 'reserved' || r.status === 'partially_used')
        );

        const totalStock = this.getTotalStock(materialId);
        const reserved = materialReservations.reduce((sum, r) =>
            sum + (r.quantity - r.usedQuantity), 0
        );
        const available = this.getAvailableQuantity(materialId);

        return {
            materialId: materialId,
            totalStock: totalStock,
            reserved: reserved,
            available: available,
            reservations: materialReservations.map(r => ({
                id: r.id,
                sourceName: r.sourceName,
                quantity: r.quantity - r.usedQuantity,
                createdAt: r.createdAt
            }))
        };
    }

    // ==================== 工具方法 ====================

    static generateReservationId() {
        return 'RSV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    static getSourceName(sourceType, sourceId) {
        // 实际应该从数据库获取
        switch(sourceType) {
            case 'project':
                return `项目 ${sourceId}`;
            case 'production':
                return `生产计划 ${sourceId}`;
            case 'bom':
                return `BOM ${sourceId}`;
            default:
                return sourceId;
        }
    }

    static calculateExpiry(sourceType) {
        // 根据来源类型设置不同的过期时间
        const now = new Date();
        switch(sourceType) {
            case 'project':
                // 项目占料：6个月
                now.setMonth(now.getMonth() + 6);
                break;
            case 'production':
                // 生产计划：30天
                now.setDate(now.getDate() + 30);
                break;
            case 'bom':
                // BOM占料：90天
                now.setDate(now.getDate() + 90);
                break;
            default:
                now.setDate(now.getDate() + 30);
        }
        return now.toISOString();
    }

    static getCurrentUser() {
        // 实际应该从session获取
        return localStorage.getItem('currentUser') || 'admin';
    }

    static saveReservation(reservation) {
        const reservations = this.getAllReservations();
        reservations.push(reservation);
        this.saveAllReservations(reservations);
    }

    static getAllReservations() {
        return JSON.parse(localStorage.getItem('materialReservations') || '[]');
    }

    static saveAllReservations(reservations) {
        localStorage.setItem('materialReservations', JSON.stringify(reservations));
    }

    static deductStock(materialId, quantity) {
        const inventory = JSON.parse(localStorage.getItem('inventory') || '{}');
        inventory[materialId] = (inventory[materialId] || 0) - quantity;
        localStorage.setItem('inventory', JSON.stringify(inventory));
    }

    /**
     * 显示物料占用情况对话框
     */
    static showReservationDialog(materialId, materialName) {
        const detail = this.getMaterialReservationDetail(materialId);

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
            <div class="modal-content" style="background: white; border-radius: 12px; width: 600px; max-height: 80vh; overflow: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                <div class="modal-header" style="padding: 24px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 20px; font-weight: 700; color: #1a1a1a;">📦 物料占用详情</div>
                        <div style="font-size: 13px; color: #999; margin-top: 4px;">${materialName} (${materialId})</div>
                    </div>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #999; line-height: 1;">×</button>
                </div>
                <div class="modal-body" style="padding: 24px;">
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                        <div style="padding: 16px; background: #f8f9fa; border-radius: 8px;">
                            <div style="font-size: 12px; color: #999; margin-bottom: 4px;">总库存</div>
                            <div style="font-size: 24px; font-weight: 700; color: #333;">${detail.totalStock}</div>
                        </div>
                        <div style="padding: 16px; background: #fff3e0; border-radius: 8px;">
                            <div style="font-size: 12px; color: #999; margin-bottom: 4px;">已占用</div>
                            <div style="font-size: 24px; font-weight: 700; color: #f57c00;">${detail.reserved}</div>
                        </div>
                        <div style="padding: 16px; background: #e8f5e9; border-radius: 8px;">
                            <div style="font-size: 12px; color: #999; margin-bottom: 4px;">可用</div>
                            <div style="font-size: 24px; font-weight: 700; color: #00890b;">${detail.available}</div>
                        </div>
                    </div>

                    ${detail.reservations.length > 0 ? `
                        <div style="margin-top: 24px;">
                            <div style="font-size: 16px; font-weight: 700; margin-bottom: 12px;">占用记录</div>
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background: #f8f9fa;">
                                        <th style="padding: 12px; text-align: left; font-size: 12px; color: #666;">占用来源</th>
                                        <th style="padding: 12px; text-align: right; font-size: 12px; color: #666;">数量</th>
                                        <th style="padding: 12px; text-align: left; font-size: 12px; color: #666;">占用时间</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${detail.reservations.map(r => `
                                        <tr style="border-bottom: 1px solid #f0f0f0;">
                                            <td style="padding: 12px; font-size: 13px;">${r.sourceName}</td>
                                            <td style="padding: 12px; text-align: right; font-weight: 600; color: #f57c00;">${r.quantity}</td>
                                            <td style="padding: 12px; font-size: 12px; color: #999;">${new Date(r.createdAt).toLocaleString('zh-CN')}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : '<div style="text-align: center; color: #999; padding: 20px;">暂无占用记录</div>'}
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
}

// 定期检查过期占料（每小时执行一次）
setInterval(() => {
    MaterialReservation.checkAndReleaseExpired();
}, 3600000);

// 初始化时检查一次
MaterialReservation.checkAndReleaseExpired();

// 导出供其他页面使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MaterialReservation;
}
