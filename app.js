let currentPage = 'list';
let currentWaybillId = null;
let filteredWaybills = [...waybills];
let currentPageNum = 1;
const pageSize = 5;
let tempChart = null;
let evidenceChart = null;

document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    renderWaybillList();
    updateStats();
    initDateFilter();
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
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('filter-date').value = '2024-06-15';
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

        return `
            <tr>
                <td><strong>${w.id}</strong></td>
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

    renderTempChart(waybill);
    renderTimeline(waybill);
    renderAlerts(waybill);
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

    const doorRecords = getDoorRecords(waybill.id);
    
    const doorAnnotations = doorRecords.map(door => {
        const doorTime = new Date(door.time).getTime();
        const idx = tempData.findIndex(d => d.time.getTime() >= doorTime);
        return idx >= 0 ? idx : null;
    }).filter(i => i !== null);

    tempChart = new Chart(ctx, {
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
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 13 },
                    bodyFont: { size: 12 },
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '℃';
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
            desc: stop.desc
        });
    });

    doors.forEach(door => {
        items.push({
            time: door.time,
            type: 'door',
            title: '开门记录',
            desc: `${door.location}，持续 ${door.duration} 分钟`
        });
    });

    alerts.forEach(alert => {
        items.push({
            time: alert.startTime,
            type: 'alert',
            title: getAlertTypeName(alert.type),
            desc: `持续 ${alert.duration}，最高温度 ${alert.maxTemp.toFixed(1)}℃`
        });
    });

    items.sort((a, b) => new Date(a.time) - new Date(b.time));

    timeline.innerHTML = items.map(item => `
        <div class="timeline-item ${item.type}">
            <div class="timeline-time">${formatDateTime(item.time)}</div>
            <div class="timeline-title">${item.title}</div>
            <div class="timeline-desc">${item.desc}</div>
        </div>
    `).join('');
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

    alertsList.innerHTML = alerts.map(alert => `
        <div class="alert-item ${alert.type}">
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
        </div>
    `).join('');
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

    document.querySelectorAll('input[name="audit-reason"]').forEach(r => r.checked = false);
    document.querySelectorAll('input[name="responsibility"]').forEach(r => r.checked = false);
    document.querySelectorAll('input[name="sign-status"]').forEach(r => r.checked = false);
    document.getElementById('audit-remark').value = '';
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
    const today = new Date();
    const auditNo = 'JH' + today.getFullYear() + 
        String(today.getMonth() + 1).padStart(2, '0') +
        String(today.getDate()).padStart(2, '0') +
        Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    document.getElementById('report-no').textContent = auditNo;
    document.getElementById('report-audit-date').textContent = formatDate(today);
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
    document.getElementById('report-max-temp').textContent = summary.total.maxTemp ? summary.total.maxTemp.toFixed(1) + '℃' : '-';

    document.getElementById('report-reason').textContent = reason.value;
    document.getElementById('report-responsibility').textContent = responsibility.value;
    document.getElementById('report-sign-status').textContent = signStatus.value;
    document.getElementById('report-remark').textContent = remark || '无';
    document.getElementById('report-sign-date').textContent = formatDate(today);

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