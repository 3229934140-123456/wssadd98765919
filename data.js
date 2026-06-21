const tempDataCache = {};

const waybills = [
    {
        id: 'YD202406150001',
        customer: '双汇食品',
        meatType: '冷冻',
        tempZone: { min: -20, max: -15, label: '冷冻 -20℃ ~ -15℃', type: 'frozen' },
        plate: '豫A·88621',
        departure: '2024-06-15 08:30',
        arrival: '2024-06-15 14:45',
        status: 'arrived',
        alertStatus: 'mild',
        alertCount: 2,
        duration: '6小时15分'
    },
    {
        id: 'YD202406150002',
        customer: '雨润集团',
        meatType: '冷藏',
        tempZone: { min: 0, max: 4, label: '冷藏 0℃ ~ 4℃', type: 'chilled' },
        plate: '苏B·35216',
        departure: '2024-06-15 06:00',
        arrival: '2024-06-15 11:30',
        status: 'arrived',
        alertStatus: 'normal',
        alertCount: 0,
        duration: '5小时30分'
    },
    {
        id: 'YD202406150003',
        customer: '金锣肉制品',
        meatType: '鲜肉',
        tempZone: { min: 0, max: 8, label: '鲜肉 0℃ ~ 8℃', type: 'fresh' },
        plate: '鲁C·77890',
        departure: '2024-06-15 05:00',
        arrival: '2024-06-15 09:00',
        status: 'arrived',
        alertStatus: 'severe',
        alertCount: 3,
        duration: '4小时'
    },
    {
        id: 'YD202406150004',
        customer: '双汇食品',
        meatType: '冷冻',
        tempZone: { min: -22, max: -18, label: '冷冻 -22℃ ~ -18℃', type: 'frozen' },
        plate: '豫A·66543',
        departure: '2024-06-15 10:00',
        arrival: '2024-06-15 16:30',
        status: 'transporting',
        alertStatus: 'continuous',
        alertCount: 1,
        duration: '运输中'
    },
    {
        id: 'YD202406150005',
        customer: '众品食业',
        meatType: '冷藏',
        tempZone: { min: 2, max: 6, label: '冷藏 2℃ ~ 6℃', type: 'chilled' },
        plate: '豫D·22345',
        departure: '2024-06-15 07:30',
        arrival: '2024-06-15 13:00',
        status: 'arrived',
        alertStatus: 'normal',
        alertCount: 0,
        duration: '5小时30分'
    },
    {
        id: 'YD202406140001',
        customer: '双汇食品',
        meatType: '冷冻',
        tempZone: { min: -20, max: -15, label: '冷冻 -20℃ ~ -15℃', type: 'frozen' },
        plate: '豫A·88621',
        departure: '2024-06-14 08:00',
        arrival: '2024-06-14 14:00',
        status: 'arrived',
        alertStatus: 'normal',
        alertCount: 0,
        duration: '6小时'
    },
    {
        id: 'YD202406140002',
        customer: '雨润集团',
        meatType: '鲜肉',
        tempZone: { min: 0, max: 8, label: '鲜肉 0℃ ~ 8℃', type: 'fresh' },
        plate: '苏B·35216',
        departure: '2024-06-14 06:30',
        arrival: '2024-06-14 10:30',
        status: 'arrived',
        alertStatus: 'mild',
        alertCount: 1,
        duration: '4小时'
    },
    {
        id: 'YD202406140003',
        customer: '金锣肉制品',
        meatType: '冷冻',
        tempZone: { min: -25, max: -20, label: '冷冻 -25℃ ~ -20℃', type: 'frozen' },
        plate: '鲁C·77890',
        departure: '2024-06-14 09:00',
        arrival: '2024-06-14 15:30',
        status: 'arrived',
        alertStatus: 'severe',
        alertCount: 2,
        duration: '6小时30分'
    },
    {
        id: 'YD202406140004',
        customer: '众品食业',
        meatType: '冷藏',
        tempZone: { min: 0, max: 4, label: '冷藏 0℃ ~ 4℃', type: 'chilled' },
        plate: '豫D·22345',
        departure: '2024-06-14 07:00',
        arrival: '2024-06-14 12:30',
        status: 'arrived',
        alertStatus: 'normal',
        alertCount: 0,
        duration: '5小时30分'
    },
    {
        id: 'YD202406130001',
        customer: '双汇食品',
        meatType: '鲜肉',
        tempZone: { min: 0, max: 8, label: '鲜肉 0℃ ~ 8℃', type: 'fresh' },
        plate: '豫A·66543',
        departure: '2024-06-13 05:30',
        arrival: '2024-06-13 09:30',
        status: 'arrived',
        alertStatus: 'mild',
        alertCount: 1,
        duration: '4小时'
    }
];

function seededRandom(seed) {
    let s = seed;
    return function() {
        s = Math.sin(s * 9999) * 9999;
        return s - Math.floor(s);
    };
}

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

function generateTempData(waybillId) {
    if (tempDataCache[waybillId]) {
        return tempDataCache[waybillId];
    }

    const waybill = waybills.find(w => w.id === waybillId);
    if (!waybill) return null;

    const seed = hashString(waybillId);
    const random = seededRandom(seed);

    const startTime = new Date(waybill.departure).getTime();
    const endTime = new Date(waybill.arrival).getTime();
    const totalMinutes = Math.floor((endTime - startTime) / (1000 * 60));
    const interval = 5;
    const points = Math.floor(totalMinutes / interval);

    const data = [];
    const tempMin = waybill.tempZone.min;
    const tempMax = waybill.tempZone.max;
    const tempRange = tempMax - tempMin;
    const baseTemp = tempMin + tempRange * 0.4;

    const alertPeriods = getAlertPeriods(waybillId);

    for (let i = 0; i <= points; i++) {
        const time = startTime + i * interval * 60 * 1000;
        let temp = baseTemp + Math.sin(i * 0.25 + seed * 0.001) * (tempRange * 0.25);
        temp += (random() - 0.5) * (tempRange * 0.15);

        let inAlert = false;
        let alertType = null;
        for (const period of alertPeriods) {
            if (i >= period.startIdx && i <= period.endIdx) {
                inAlert = true;
                alertType = period.type;
                const alertProgress = (i - period.startIdx) / (period.endIdx - period.startIdx);
                const peakFactor = Math.sin(alertProgress * Math.PI);
                if (period.type === 'mild') {
                    temp = tempMax + 0.5 + peakFactor * 1.5 + (random() - 0.5) * 0.3;
                } else if (period.type === 'severe') {
                    temp = tempMax + 2 + peakFactor * 3 + (random() - 0.5) * 0.5;
                } else if (period.type === 'continuous') {
                    temp = tempMax + 3 + peakFactor * 4 + (random() - 0.5) * 0.8;
                }
                break;
            }
        }

        data.push({
            time: new Date(time),
            temp: Math.round(temp * 10) / 10,
            inAlert: inAlert,
            alertType: alertType
        });
    }

    tempDataCache[waybillId] = data;
    return data;
}

function getAlertPeriods(waybillId) {
    const waybill = waybills.find(w => w.id === waybillId);
    if (!waybill) return [];

    const alerts = getAlerts(waybillId);
    const startTime = new Date(waybill.departure).getTime();
    const interval = 5;

    return alerts.map(alert => {
        const startMs = new Date(alert.startTime).getTime();
        const endMs = new Date(alert.endTime).getTime();
        const startIdx = Math.floor((startMs - startTime) / (interval * 60 * 1000));
        const endIdx = Math.floor((endMs - startTime) / (interval * 60 * 1000));
        return {
            type: alert.type,
            startIdx: Math.max(0, startIdx),
            endIdx: endIdx,
            alert: alert
        };
    });
}

function getDoorRecords(waybillId) {
    const records = {
        'YD202406150001': [
            { time: '2024-06-15 10:15', duration: 8, location: '郑州东服务区' },
            { time: '2024-06-15 12:40', duration: 12, location: '漯河服务区' }
        ],
        'YD202406150002': [
            { time: '2024-06-15 08:20', duration: 15, location: '南京西服务区' }
        ],
        'YD202406150003': [
            { time: '2024-06-15 06:10', duration: 25, location: '济南服务区' },
            { time: '2024-06-15 07:30', duration: 18, location: '泰安服务区' }
        ],
        'YD202406150004': [
            { time: '2024-06-15 11:20', duration: 10, location: '许昌服务区' }
        ],
        'YD202406150005': [],
        'YD202406140001': [
            { time: '2024-06-14 10:00', duration: 6, location: '郑州西服务区' }
        ],
        'YD202406140002': [
            { time: '2024-06-14 07:45', duration: 20, location: '常州服务区' }
        ],
        'YD202406140003': [
            { time: '2024-06-14 10:30', duration: 30, location: '青岛服务区' },
            { time: '2024-06-14 13:00', duration: 15, location: '潍坊服务区' }
        ],
        'YD202406140004': [],
        'YD202406130001': [
            { time: '2024-06-13 06:40', duration: 12, location: '开封服务区' }
        ]
    };
    return records[waybillId] || [];
}

function getStops(waybillId) {
    const stops = {
        'YD202406150001': [
            { time: '2024-06-15 08:30', type: 'departure', location: '双汇郑州物流中心', desc: '车辆出发，开始运输' },
            { time: '2024-06-15 10:15', type: 'stop', location: '郑州东服务区', desc: '中途停靠休息' },
            { time: '2024-06-15 12:40', type: 'stop', location: '漯河服务区', desc: '司机换班休息' },
            { time: '2024-06-15 14:45', type: 'arrival', location: '双汇武汉配送中心', desc: '到达目的地' }
        ],
        'YD202406150002': [
            { time: '2024-06-15 06:00', type: 'departure', location: '雨润南京工厂', desc: '车辆出发，开始运输' },
            { time: '2024-06-15 08:20', type: 'stop', location: '南京西服务区', desc: '装卸部分货物' },
            { time: '2024-06-15 11:30', type: 'arrival', location: '雨润上海分公司', desc: '到达目的地' }
        ],
        'YD202406150003': [
            { time: '2024-06-15 05:00', type: 'departure', location: '金锣济南屠宰场', desc: '车辆出发，开始运输' },
            { time: '2024-06-15 06:10', type: 'stop', location: '济南服务区', desc: '装货后检查' },
            { time: '2024-06-15 07:30', type: 'stop', location: '泰安服务区', desc: '中途停靠' },
            { time: '2024-06-15 09:00', type: 'arrival', location: '金锣济宁分公司', desc: '到达目的地' }
        ],
        'YD202406150004': [
            { time: '2024-06-15 10:00', type: 'departure', location: '双汇郑州物流中心', desc: '车辆出发，开始运输' },
            { time: '2024-06-15 11:20', type: 'stop', location: '许昌服务区', desc: '中途停靠' },
            { time: '2024-06-15 16:30', type: 'arrival', location: '双汇长沙配送中心', desc: '预计到达' }
        ],
        'YD202406150005': [
            { time: '2024-06-15 07:30', type: 'departure', location: '众品许昌工厂', desc: '车辆出发，开始运输' },
            { time: '2024-06-15 13:00', type: 'arrival', location: '众品合肥分公司', desc: '到达目的地' }
        ],
        'YD202406140001': [
            { time: '2024-06-14 08:00', type: 'departure', location: '双汇郑州物流中心', desc: '车辆出发，开始运输' },
            { time: '2024-06-14 10:00', type: 'stop', location: '郑州西服务区', desc: '中途检查' },
            { time: '2024-06-14 14:00', type: 'arrival', location: '双汇西安配送中心', desc: '到达目的地' }
        ],
        'YD202406140002': [
            { time: '2024-06-14 06:30', type: 'departure', location: '雨润南京工厂', desc: '车辆出发，开始运输' },
            { time: '2024-06-14 07:45', type: 'stop', location: '常州服务区', desc: '装卸货物' },
            { time: '2024-06-14 10:30', type: 'arrival', location: '雨润苏州分公司', desc: '到达目的地' }
        ],
        'YD202406140003': [
            { time: '2024-06-14 09:00', type: 'departure', location: '金锣青岛工厂', desc: '车辆出发，开始运输' },
            { time: '2024-06-14 10:30', type: 'stop', location: '青岛服务区', desc: '装货' },
            { time: '2024-06-14 13:00', type: 'stop', location: '潍坊服务区', desc: '中途停靠' },
            { time: '2024-06-14 15:30', type: 'arrival', location: '金锣济南分公司', desc: '到达目的地' }
        ],
        'YD202406140004': [
            { time: '2024-06-14 07:00', type: 'departure', location: '众品许昌工厂', desc: '车辆出发，开始运输' },
            { time: '2024-06-14 12:30', type: 'arrival', location: '众品武汉分公司', desc: '到达目的地' }
        ],
        'YD202406130001': [
            { time: '2024-06-13 05:30', type: 'departure', location: '双汇郑州物流中心', desc: '车辆出发，开始运输' },
            { time: '2024-06-13 06:40', type: 'stop', location: '开封服务区', desc: '中途检查' },
            { time: '2024-06-13 09:30', type: 'arrival', location: '双汇商丘分公司', desc: '到达目的地' }
        ]
    };
    return stops[waybillId] || [];
}

function getAlerts(waybillId) {
    const waybill = waybills.find(w => w.id === waybillId);
    if (!waybill) return [];

    const alerts = {
        'YD202406150001': [
            {
                type: 'mild',
                startTime: '2024-06-15 10:15',
                endTime: '2024-06-15 10:40',
                duration: '25分钟',
                maxTemp: waybill.tempZone.max + 1.8,
                avgTemp: waybill.tempZone.max + 1.2,
                description: '温度轻微超限，可能因开门装卸导致',
                relatedDoors: ['郑州东服务区 10:15']
            },
            {
                type: 'mild',
                startTime: '2024-06-15 12:40',
                endTime: '2024-06-15 12:55',
                duration: '15分钟',
                maxTemp: waybill.tempZone.max + 0.9,
                avgTemp: waybill.tempZone.max + 0.6,
                description: '温度短暂上升，属正常波动范围',
                relatedDoors: ['漯河服务区 12:40']
            }
        ],
        'YD202406150002': [],
        'YD202406150003': [
            {
                type: 'severe',
                startTime: '2024-06-15 06:10',
                endTime: '2024-06-15 06:45',
                duration: '35分钟',
                maxTemp: waybill.tempZone.max + 4.2,
                avgTemp: waybill.tempZone.max + 3.0,
                description: '温度严重超限，装货后温度未及时降下来',
                relatedDoors: ['济南服务区 06:10']
            },
            {
                type: 'mild',
                startTime: '2024-06-15 07:30',
                endTime: '2024-06-15 07:55',
                duration: '25分钟',
                maxTemp: waybill.tempZone.max + 2.1,
                avgTemp: waybill.tempZone.max + 1.5,
                description: '温度超限，可能与开门检查有关',
                relatedDoors: ['泰安服务区 07:30']
            },
            {
                type: 'severe',
                startTime: '2024-06-15 08:10',
                endTime: '2024-06-15 08:25',
                duration: '15分钟',
                maxTemp: waybill.tempZone.max + 3.5,
                avgTemp: waybill.tempZone.max + 2.8,
                description: '温度再次严重超限，需关注制冷效果',
                relatedDoors: []
            }
        ],
        'YD202406150004': [
            {
                type: 'continuous',
                startTime: '2024-06-15 13:20',
                endTime: '2024-06-15 15:00',
                duration: '1小时40分钟',
                maxTemp: waybill.tempZone.max + 5.0,
                avgTemp: waybill.tempZone.max + 3.8,
                description: '温度持续超限，疑似制冷设备故障',
                relatedDoors: []
            }
        ],
        'YD202406150005': [],
        'YD202406140001': [],
        'YD202406140002': [
            {
                type: 'mild',
                startTime: '2024-06-14 07:45',
                endTime: '2024-06-14 08:10',
                duration: '25分钟',
                maxTemp: waybill.tempZone.max + 1.5,
                avgTemp: waybill.tempZone.max + 1.0,
                description: '装卸货时开门导致温度短暂上升',
                relatedDoors: ['常州服务区 07:45']
            }
        ],
        'YD202406140003': [
            {
                type: 'severe',
                startTime: '2024-06-14 10:30',
                endTime: '2024-06-14 11:15',
                duration: '45分钟',
                maxTemp: waybill.tempZone.max + 6.0,
                avgTemp: waybill.tempZone.max + 4.2,
                description: '长时间开门装货导致温度大幅上升',
                relatedDoors: ['青岛服务区 10:30']
            },
            {
                type: 'mild',
                startTime: '2024-06-14 13:00',
                endTime: '2024-06-14 13:20',
                duration: '20分钟',
                maxTemp: waybill.tempZone.max + 1.8,
                avgTemp: waybill.tempZone.max + 1.2,
                description: '中途停靠导致温度轻微上升',
                relatedDoors: ['潍坊服务区 13:00']
            }
        ],
        'YD202406140004': [],
        'YD202406130001': [
            {
                type: 'mild',
                startTime: '2024-06-13 06:40',
                endTime: '2024-06-13 06:55',
                duration: '15分钟',
                maxTemp: waybill.tempZone.max + 1.2,
                avgTemp: waybill.tempZone.max + 0.8,
                description: '中途检查开门导致温度轻微波动',
                relatedDoors: ['开封服务区 06:40']
            }
        ]
    };
    return alerts[waybillId] || [];
}

function getAlertSummary(waybillId) {
    const alerts = getAlerts(waybillId);
    const summary = {
        mild: { count: 0, duration: 0 },
        severe: { count: 0, duration: 0 },
        continuous: { count: 0, duration: 0 },
        total: { count: 0, duration: 0, maxTemp: null }
    };

    alerts.forEach(alert => {
        const durationMinutes = parseDuration(alert.duration);
        summary[alert.type].count++;
        summary[alert.type].duration += durationMinutes;
        summary.total.count++;
        summary.total.duration += durationMinutes;
        if (summary.total.maxTemp === null || alert.maxTemp > summary.total.maxTemp) {
            summary.total.maxTemp = alert.maxTemp;
        }
    });

    return summary;
}

function parseDuration(durationStr) {
    if (!durationStr) return 0;
    let minutes = 0;
    const hourMatch = durationStr.match(/(\d+)小时/);
    const minMatch = durationStr.match(/(\d+)分钟/);
    if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
    if (minMatch) minutes += parseInt(minMatch[1]);
    return minutes;
}

function getAuditRecord(waybillId) {
    try {
        const records = JSON.parse(localStorage.getItem('auditRecords') || '{}');
        return records[waybillId] || null;
    } catch (e) {
        return null;
    }
}

function saveAuditRecord(waybillId, record) {
    try {
        const records = JSON.parse(localStorage.getItem('auditRecords') || '{}');
        records[waybillId] = {
            ...record,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem('auditRecords', JSON.stringify(records));
        return true;
    } catch (e) {
        return false;
    }
}