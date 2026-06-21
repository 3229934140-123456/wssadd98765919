let currentPage = 'list';
let currentWaybillId = null;
let filteredWaybills = [...waybills];
let currentPageNum = 1;
const pageSize = 5;
let tempChart = null;
let evidenceChart = null;
let currentQuickFilter = 'all';
let currentAlertIndex = -1;

document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    renderWaybillList();
    updateStats();
    initDateFilter();
    initModalClose();
});

function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.dataset.page;
            if (page === 'detail' || page === 'audit') {
                if (!currentWaybillId) {
                    alert('请先选择一个运单');
                    return;
                }
            }
            navigateTo(page);
        });
    });
}

function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });

    document.getElementById('page-' + page).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === page) {
            btn.classList.add('active');
        }
    });

    currentPage = page;

    if (page === 'detail' && currentWaybillId) {
        renderDetail();
    }
    if (page === 'audit' && currentWaybillId) {
        renderAuditForm();
    }

    window.scrollTo(0, 0);
}

function initDateFilter() {
    document.getElementById('filter-date').value = '2024-06-15';
    applyFilters();
}

function initModalClose() {
    const modal = document.getElementById('alert-modal');
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeAlertModal();
        }
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAlertModal();
        }
    });
}

function quickFilter(type) {
    currentQuickFilter = type;
    
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === type) {
            btn.classList.add('active');
        }
    });

    applyFilters();
}

function applyFilters() {
    const customer = document.getElementById('filter-customer').value;
    const meatType = document.getElementById('filter-meat-type').value;
    const plate = document.getElementById('filter-plate').value.trim();
    const date = document.getElementById('filter-date').value;

    filteredWaybills = waybills.filter(w => {
        if (customer && w.customer !== customer) return false;
        if (meatType && w.meatType !== meatType) return false;
        if (plate && !w.plate.includes(plate)) return false;
        if (date && !w.departure.startsWith(date)) return false;

        if (currentQuickFilter === 'mild' && w.alertStatus !== 'mild') return false;
        if (currentQuickFilter === 'severe' && w.alertStatus !== 'severe') return false;
        if (currentQuickFilter === 'continuous' && w.alertStatus !== 'continuous') return false;
        if (currentQuickFilter === 'abnormal' && w.alertStatus === 'normal') return false;

        return true;
    });

    currentPageNum = 1;
    renderWaybillList();
    updateStats();
}

function resetFilters() {
    document.getElementById('filter-customer').value = '';
    document.getElementById('filter-meat-type').value = '';
    document.getElementById('filter-plate').value = '';
    document.getElementById('filter-date').value = '';
    
    currentQuickFilter = 'all';
    document.querySelectorAll('.quick-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.quick-btn[data-filter="all"]').classList.add('active');

    filteredWaybills = [...waybills];
    currentPageNum = 1;
    renderWaybillList();
    updateStats();
}

function updateStats() {
    const total = filteredWaybills.length;
    const normal = filteredWaybills.filter(w => w.alertStatus === 'normal').length;
    const mild = filteredWaybills.filter(w => w.alertStatus === 'mild').length;
    const severe = filteredWaybills.filter(w => w.alertStatus === 'severe' || w.alertStatus === 'continuous').length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-normal').textContent = normal;
    document.getElementById('stat-warning').textContent = mild;
    document.getElementById('stat-danger').textContent = severe;
}

function renderWaybillList() {
    const tbody = document.getElementById('waybill-list');
    const start = (currentPageNum - 1) * pageSize;
    const end = start + pageSize;
    const pageData = filteredWaybills.slice(start, end);

    tbody.innerHTML = pageData.map(w => {
        const statusText = {
            'transporting': '运输中',
            'arrived': '已到达',
            'delayed': '延误'
        }[w.status] || w.status;

        const alertText = {
            'normal': '正常',
            'mild': '轻微超限',
            'severe': '严重超限',
            'continuous': '持续超限'
        }[w.alertStatus] || '正常';

        const auditRecord = getAuditRecord(w.id);
        const auditedBadge = auditRecord ? '<span class="audited-badge">已稽核</span>' : '';

        return `
            <tr>
                <td><strong>${w.id}</strong>${auditedBadge}</td>
                <td>${w.customer}</td>
                <td>${w.meatType}</td>
                <td><span class="temp-zone ${w.tempZone.type}">${w.tempZone.label}</span></td>
                <td>${w.plate}</td>
                <td>${formatDateTime(w.departure)}</td>
                <td>${formatDateTime(w.arrival)}</td>
                <td><span class="status-badge ${w.status}">${statusText}</span></td>
                <td><span class="alert-badge ${w.alertStatus}">${alertText}${w.alertCount > 0 ? ' (' + w.alertCount + '次)' : ''}</span></td>
                <td><button class="action-btn" onclick="viewDetail('${w.id}')">查看详情</button></td>
            </tr>
        `;
    }).join('');

    const totalPages = Math.ceil(filteredWaybills.length / pageSize) || 1;
    document.getElementById('total-count').textContent = filteredWaybills.length;
    document.getElementById('current-page').textContent = currentPageNum;
    document.getElementById('total-pages').textContent = totalPages;
}

function formatDateTime(datetimeStr) {
    if (!datetimeStr) return '-';
    const parts = datetimeStr.split(' ');
    if (parts.length === 2) {
        return parts[0].substring(5) + ' ' + parts[1];
    }
    return datetimeStr;
}

function changePage(delta) {
    const totalPages = Math.ceil(filteredWaybills.length / pageSize) || 1;
    const newPage = currentPageNum + delta;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPageNum = newPage;
        renderWaybillList();
    }
}

function viewDetail(waybillId) {
    currentWaybillId = waybillId;
    navigateTo('detail');
}

function renderDetail() {
    const waybill = waybills.find(w => w.id === currentWaybillId);
    if (!waybill) return;

    document.getElementById('detail-subtitle').textContent = `运单 ${waybill.id} - 温度监控数据分析`;
    document.getElementById('detail-waybill-no').textContent = waybill.id;
    document.getElementById('detail-customer').textContent = waybill.customer;
    document.getElementById('detail-meat-type').textContent = waybill.meatType;
    document.getElementById('detail-plate').textContent = waybill.plate;
    
    const tempZoneEl = document.getElementById('detail-temp-zone');
    tempZoneEl.textContent = waybill.tempZone.label;
    tempZoneEl.className = 'summary-value temp-zone ' + waybill.tempZone.type;
    
    document.getElementById('detail-duration').textContent = waybill.duration;

    document.getElementById('chart-waybill-no').textContent = waybill.id;
    document.getElementById('chart-gen-time').textContent = formatDateTimeFull(new Date());

    renderTempChart(waybill);
    renderTimeline(waybill);
    renderAlerts(waybill);
}

function formatDateTimeFull(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

function renderTempChart(waybill) {
    const ctx = document.getElementById('tempChart').getContext('2d');
    
    if (tempChart) {
        tempChart.destroy();
    }

    const tempData = generateTempData(waybill.id);
    if (!tempData || tempData.length === 0) return;

    const labels = tempData.map(d => {
        const h = d.time.getHours().toString().padStart(2, '0');
        const m = d.time.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    });

    const temps = tempData.map(d => d.temp);
    const upperLimits = tempData.map(() => waybill.tempZone.max);
    const lowerLimits = tempData.map(() => waybill.tempZone.min);

    const alerts = getAlerts(waybill.id);
    const alertDatasets = [];

    alerts.forEach((alert, idx) => {
        const alertData = tempData.map((d, i) => {
            const inAlert = d.inAlert && d.alertType === alert.type;
            return inAlert ? d.temp : null;
        });

        let borderColor, bgColor;
        if (alert.type === 'mild') {
            borderColor = '#f59e0b';
            bgColor = 'rgba(245, 158, 11, 0.3)';
        } else if (alert.type === 'severe') {
            borderColor = '#ef4444';
            bgColor = 'rgba(239, 68, 68, 0.3)';
        } else {
            borderColor = '#991b1b';
            bgColor = 'rgba(153, 27, 27, 0.4)';
        }

        alertDatasets.push({
            label: `超温${idx + 1}`,
            data: alertData,
            borderColor: borderColor,
            backgroundColor: bgColor,
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 6,
            borderWidth: 3,
            pointHitRadius: 20,
            alertIndex: idx
        });
    });

    const datasets = [
        {
            label: '车厢温度',
            data: temps,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 5,
            borderWidth: 2
        },
        {
            label: '温度上限',
            data: upperLimits,
            borderColor: '#ef4444',
            borderDash: [8, 4],
            pointRadius: 0,
            borderWidth: 2,
            fill: false
        },
        {
            label: '温度下限',
            data: lowerLimits,
            borderColor: '#10b981',
            borderDash: [8, 4],
            pointRadius: 0,
            borderWidth: 2,
            fill: false
        },
        ...alertDatasets
    ];

    tempChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            onClick: function(e, elements) {
                if (!elements || elements.length === 0) return;
                
                let alertIndex = -1;
                for (const el of elements) {
                    const datasetIndex = el.datasetIndex;
                    const dataset = tempChart.data.datasets[datasetIndex];
                    if (dataset && dataset.alertIndex !== undefined) {
                        const val = dataset.data[el.index];
                        if (val !== null) {
                            alertIndex = dataset.alertIndex;
                            break;
                        }
                    }
                }
                
                if (alertIndex < 0) {
                    const dataIndex = elements[0].index;
                    const dataPoint = tempData[dataIndex];
                    if (dataPoint && dataPoint.inAlert) {
                        const alerts = getAlerts(waybill.id);
                        const pointTime = dataPoint.time.getTime();
                        for (let i = 0; i < alerts.length; i++) {
                            const startTime = new Date(alerts[i].startTime).getTime();
                            const endTime = new Date(alerts[i].endTime).getTime();
                            if (pointTime >= startTime && pointTime <= endTime) {
                                alertIndex = i;
                                break;
                            }
                        }
                    }
                }
                
                if (alertIndex >= 0) {
                    showAlertModal(alertIndex);
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    padding: 12,
                    titleFont: { size: 13 },
                    bodyFont: { size: 12 },
                    callbacks: {
                        label: function(context) {
                            if (context.dataset.label.startsWith('超温')) {
                                return null;
                            }
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '℃';
                        },
                        afterBody: function(context) {
                            const dataIndex = context[0].dataIndex;
                            const dataPoint = tempData[dataIndex];
                            if (dataPoint && dataPoint.inAlert) {
                                return ['🔴 超温中 - 点击查看详情'];
                            }
                            return [];
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxTicksLimit: 10,
                        font: { size: 11 }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '℃';
                        },
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

function renderTimeline(waybill) {
    const timeline = document.getElementById('timeline');
    const stops = getStops(waybill.id);
    const alerts = getAlerts(waybill.id);
    const doors = getDoorRecords(waybill.id);

    const items = [];

    stops.forEach(stop => {
        items.push({
            time: stop.time,
            type: stop.type,
            title: stop.location,
            desc: stop.desc,
            clickable: false,
            alertIndex: -1
        });
    });

    doors.forEach(door => {
        items.push({
            time: door.time,
            type: 'door',
            title: '🚪 开门记录',
            desc: `${door.location}，持续 ${door.duration} 分钟`,
            clickable: false,
            alertIndex: -1
        });
    });

    alerts.forEach((alert, idx) => {
        items.push({
            time: alert.startTime,
            type: 'alert',
            title: '⚠️ ' + getAlertTypeName(alert.type),
            desc: `持续 ${alert.duration}，最高温度 ${alert.maxTemp.toFixed(1)}℃`,
            clickable: true,
            alertIndex: idx
        });
    });

    items.sort((a, b) => new Date(a.time) - new Date(b.time));

    timeline.innerHTML = items.map((item, idx) => {
        const clickClass = item.clickable ? 'clickable' : '';
        const onClick = item.clickable ? `onclick="showAlertModal(${item.alertIndex})"` : '';
        return `
            <div class="timeline-item ${item.type} ${clickClass}" ${onClick} style="${item.clickable ? 'cursor: pointer;' : ''}">
                <div class="timeline-time">${formatDateTime(item.time)}</div>
                <div class="timeline-title">${item.title}</div>
                <div class="timeline-desc">${item.desc}</div>
                ${item.clickable ? '<div class="timeline-action">点击查看详情 →</div>' : ''}
            </div>
        `;
    }).join('');
}

function getAlertTypeName(type) {
    const names = {
        'mild': '轻微超限',
        'severe': '严重超限',
        'continuous': '持续超限'
    };
    return names[type] || type;
}

function renderAlerts(waybill) {
    const alertsList = document.getElementById('alerts-list');
    const alerts = getAlerts(waybill.id);

    if (alerts.length === 0) {
        alertsList.innerHTML = `
            <div class="alert-item normal" style="border-left-color: #10b981; background: #ecfdf5;">
                <div class="alert-header">
                    <span class="alert-type" style="color: #059669;">✅ 温区正常</span>
                    <span class="alert-time">全程</span>
                </div>
                <div class="alert-details">
                    <span>运输过程温度稳定，无超温记录</span>
                </div>
            </div>
        `;
        return;
    }

    alertsList.innerHTML = alerts.map((alert, idx) => `
        <div class="alert-item ${alert.type} clickable" onclick="showAlertModal(${idx})">
            <div class="alert-header">
                <span class="alert-type">⚠️ ${getAlertTypeName(alert.type)}</span>
                <span class="alert-time">${alert.startTime} ~ ${alert.endTime}</span>
            </div>
            <div class="alert-details">
                <span>持续时长：${alert.duration}</span>
                <span>最高温度：${alert.maxTemp.toFixed(1)}℃</span>
            </div>
            <div class="alert-details" style="margin-top: 6px; color: #6b7280;">
                <span>${alert.description}</span>
            </div>
            <div class="alert-action">点击查看详情 →</div>
        </div>
    `).join('');
}

function showAlertModal(alertIndex) {
    const waybill = waybills.find(w => w.id === currentWaybillId);
    if (!waybill) return;

    const alerts = getAlerts(waybill.id);
    const alert = alerts[alertIndex];
    if (!alert) return;

    currentAlertIndex = alertIndex;

    document.getElementById('modal-alert-title').textContent = 
        getAlertTypeName(alert.type) + ' - 详情';

    const typeColors = {
        'mild': 'color: #b45309;',
        'severe': 'color: #dc2626;',
        'continuous': 'color: #991b1b;'
    };

    document.getElementById('modal-alert-type').textContent = getAlertTypeName(alert.type);
    document.getElementById('modal-alert-type').style.cssText = typeColors[alert.type] || '';
    document.getElementById('modal-alert-start').textContent = alert.startTime;
    document.getElementById('modal-alert-end').textContent = alert.endTime;
    document.getElementById('modal-alert-duration').textContent = alert.duration;
    document.getElementById('modal-alert-max').textContent = alert.maxTemp.toFixed(1) + '℃';
    document.getElementById('modal-alert-avg').textContent = 
        alert.avgTemp !== undefined && alert.avgTemp !== null 
            ? alert.avgTemp.toFixed(1) + '℃' 
            : '-';
    document.getElementById('modal-alert-desc').textContent = alert.description || '暂无描述';

    const doorsHtml = alert.relatedDoors && alert.relatedDoors.length > 0
        ? alert.relatedDoors.map(door => `
            <div class="related-door-item">
                <span class="related-door-icon">🚪</span>
                <span>${door}</span>
            </div>
        `).join('')
        : '<span class="no-related">暂无关联开门记录</span>';
    document.getElementById('modal-related-doors').innerHTML = doorsHtml;

    const stops = getStops(waybill.id);
    const alertStartTime = new Date(alert.startTime).getTime();
    const nearbyStops = stops.filter(s => {
        const stopTime = new Date(s.time).getTime();
        return Math.abs(stopTime - alertStartTime) < 30 * 60 * 1000;
    });

    const stopsHtml = nearbyStops.length > 0
        ? nearbyStops.map(stop => `
            <div class="related-stop-item">
                <span class="related-door-icon">📍</span>
                <span>${stop.location} - ${formatDateTime(stop.time)}</span>
            </div>
        `).join('')
        : '<span class="no-related">暂无附近停靠记录</span>';
    document.getElementById('modal-related-stops').innerHTML = stopsHtml;

    document.getElementById('alert-modal').style.display = 'flex';
}

function closeAlertModal() {
    document.getElementById('alert-modal').style.display = 'none';
    currentAlertIndex = -1;
}

function goToAudit() {
    navigateTo('audit');
}

function renderAuditForm() {
    const waybill = waybills.find(w => w.id === currentWaybillId);
    if (!waybill) return;

    document.getElementById('audit-waybill-no').textContent = waybill.id;
    document.getElementById('audit-customer').textContent = waybill.customer;
    document.getElementById('audit-meat-type').textContent = waybill.meatType;
    document.getElementById('audit-plate').textContent = waybill.plate;

    const summary = getAlertSummary(waybill.id);
    document.getElementById('mild-count').textContent = summary.mild.count;
    document.getElementById('severe-count').textContent = summary.severe.count;
    document.getElementById('continuous-count').textContent = summary.continuous.count;
    document.getElementById('total-alert-count').textContent = summary.total.duration + '分钟';

    document.getElementById('audit-form').style.display = 'block';
    document.getElementById('audit-report').style.display = 'none';

    const historyRecord = getAuditRecord(waybill.id);
    const historySection = document.getElementById('history-section');
    
    if (historyRecord) {
        historySection.style.display = 'block';
        document.getElementById('history-reason').textContent = historyRecord.reason || '-';
        document.getElementById('history-responsibility').textContent = historyRecord.responsibility || '-';
        document.getElementById('history-sign-status').textContent = historyRecord.signStatus || '-';
        document.getElementById('history-remark').textContent = historyRecord.remark || '无';
        document.getElementById('history-updated').textContent = 
            historyRecord.updatedAt ? formatDateTimeFull(new Date(historyRecord.updatedAt)) : '-';
    } else {
        historySection.style.display = 'none';
    }

    const hasFormValue = checkFormHasValue();
    if (!hasFormValue && historyRecord) {
        loadHistoryData();
    } else if (!hasFormValue && !historyRecord) {
        clearFormValues();
    }
}

function checkFormHasValue() {
    const reasonChecked = document.querySelector('input[name="audit-reason"]:checked');
    const respChecked = document.querySelector('input[name="responsibility"]:checked');
    const signChecked = document.querySelector('input[name="sign-status"]:checked');
    const remarkValue = document.getElementById('audit-remark').value.trim();
    return reasonChecked || respChecked || signChecked || remarkValue;
}

function clearFormValues() {
    document.querySelectorAll('input[name="audit-reason"]').forEach(r => r.checked = false);
    document.querySelectorAll('input[name="responsibility"]').forEach(r => r.checked = false);
    document.querySelectorAll('input[name="sign-status"]').forEach(r => r.checked = false);
    document.getElementById('audit-remark').value = '';
}

function loadHistoryData() {
    const historyRecord = getAuditRecord(currentWaybillId);
    if (!historyRecord) return;

    const reasonRadios = document.querySelectorAll('input[name="audit-reason"]');
    reasonRadios.forEach(r => {
        if (r.value === historyRecord.reason) r.checked = true;
    });

    const respRadios = document.querySelectorAll('input[name="responsibility"]');
    respRadios.forEach(r => {
        if (r.value === historyRecord.responsibility) r.checked = true;
    });

    const signRadios = document.querySelectorAll('input[name="sign-status"]');
    signRadios.forEach(r => {
        if (r.value === historyRecord.signStatus) r.checked = true;
    });

    document.getElementById('audit-remark').value = historyRecord.remark || '';

    document.getElementById('history-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function generateAuditReport() {
    const reason = document.querySelector('input[name="audit-reason"]:checked');
    const responsibility = document.querySelector('input[name="responsibility"]:checked');
    const signStatus = document.querySelector('input[name="sign-status"]:checked');
    const remark = document.getElementById('audit-remark').value.trim();

    if (!reason) {
        alert('请选择稽核原因');
        return;
    }
    if (!responsibility) {
        alert('请选择责任建议');
        return;
    }
    if (!signStatus) {
        alert('请选择是否允许签收');
        return;
    }

    const waybill = waybills.find(w => w.id === currentWaybillId);
    const summary = getAlertSummary(waybill.id);
    const now = new Date();
    const auditNo = 'JH' + now.getFullYear() + 
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    saveAuditRecord(currentWaybillId, {
        reason: reason.value,
        responsibility: responsibility.value,
        signStatus: signStatus.value,
        remark: remark
    });

    document.getElementById('report-no').textContent = auditNo;
    document.getElementById('report-audit-date').textContent = formatDate(now);
    document.getElementById('report-waybill-no').textContent = waybill.id;
    document.getElementById('report-customer').textContent = waybill.customer;
    document.getElementById('report-meat-type').textContent = waybill.meatType;
    document.getElementById('report-plate').textContent = waybill.plate;
    document.getElementById('report-temp-zone').textContent = waybill.tempZone.label;
    document.getElementById('report-departure').textContent = waybill.departure;
    document.getElementById('report-arrival').textContent = waybill.arrival;

    document.getElementById('report-mild-count').textContent = summary.mild.count;
    document.getElementById('report-mild-duration').textContent = summary.mild.duration + '分钟';
    document.getElementById('report-severe-count').textContent = summary.severe.count;
    document.getElementById('report-severe-duration').textContent = summary.severe.duration + '分钟';
    document.getElementById('report-continuous-count').textContent = summary.continuous.count;
    document.getElementById('report-continuous-duration').textContent = summary.continuous.duration + '分钟';
    document.getElementById('report-max-temp').textContent = 
        summary.total.maxTemp !== undefined && summary.total.maxTemp !== null 
            ? summary.total.maxTemp.toFixed(1) + '℃' 
            : '-';

    document.getElementById('report-reason').textContent = reason.value;
    document.getElementById('report-responsibility').textContent = responsibility.value;
    document.getElementById('report-sign-status').textContent = signStatus.value;
    document.getElementById('report-remark').textContent = remark || '无';
    document.getElementById('report-sign-date').textContent = formatDate(now);

    document.getElementById('audit-form').style.display = 'none';
    document.getElementById('audit-report').style.display = 'block';

    setTimeout(() => {
        renderEvidenceChart(waybill);
    }, 100);
}

function renderEvidenceChart(waybill) {
    const ctx = document.getElementById('evidenceChart').getContext('2d');
    
    if (evidenceChart) {
        evidenceChart.destroy();
    }

    const tempData = generateTempData(waybill.id);
    if (!tempData || tempData.length === 0) return;

    const labels = tempData.map(d => {
        const h = d.time.getHours().toString().padStart(2, '0');
        const m = d.time.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    });

    const temps = tempData.map(d => d.temp);
    const upperLimits = tempData.map(() => waybill.tempZone.max);
    const lowerLimits = tempData.map(() => waybill.tempZone.min);

    evidenceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '车厢温度',
                    data: temps,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0,
                    borderWidth: 2
                },
                {
                    label: '温度上限',
                    data: upperLimits,
                    borderColor: '#ef4444',
                    borderDash: [6, 3],
                    pointRadius: 0,
                    borderWidth: 1.5,
                    fill: false
                },
                {
                    label: '温度下限',
                    data: lowerLimits,
                    borderColor: '#10b981',
                    borderDash: [6, 3],
                    pointRadius: 0,
                    borderWidth: 1.5,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { size: 11 },
                        boxWidth: 12
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { maxTicksLimit: 8, font: { size: 10 } }
                },
                y: {
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: {
                        callback: v => v + '℃',
                        font: { size: 10 }
                    }
                }
            }
        }
    });

    const chartContainer = document.getElementById('evidence-chart-container');
    let metaDiv = chartContainer.querySelector('.report-chart-meta');
    if (!metaDiv) {
        metaDiv = document.createElement('div');
        metaDiv.className = 'report-chart-meta';
        chartContainer.appendChild(metaDiv);
    }
    metaDiv.innerHTML = `
        <span>运单号：${waybill.id}</span>
        <span>生成时间：${formatDateTimeFull(new Date())}</span>
    `;
}

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function downloadReport() {
    const reportContent = document.getElementById('report-content');
    
    html2canvas(reportContent, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        const waybill = waybills.find(w => w.id === currentWaybillId);
        pdf.save(`温区稽核单_${waybill.id}.pdf`);
    }).catch(err => {
        console.error('生成PDF失败:', err);
        alert('生成PDF失败，请重试');
    });
}

function backToEdit() {
    document.getElementById('audit-form').style.display = 'block';
    document.getElementById('audit-report').style.display = 'none';
    window.scrollTo(0, 0);
}
