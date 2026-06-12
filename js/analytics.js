// ============================================
// JOSH ELECTRIC CONTROL - ANALYTICS & CHARTS
// ============================================

class AnalyticsManager {
    constructor() {
        this.charts = {};
        this.appliances = [];
        this.init();
    }

    async init() {
        await this.loadData();
        this.renderPredictionSummary();
        this.initAllCharts();
        this.renderSmartRecommendations();
        this.renderSavingsAnalysis();
        this.updatePerformanceMetrics();
    }

    async loadData() {
        try {
            if (typeof db !== 'undefined' && db.isReady) {
                this.appliances = await db.getAppliances();
            }
        } catch (e) {
            this.appliances = JSON.parse(localStorage.getItem('joshelectric_appliances') || '[]');
        }
    }

    renderPredictionSummary() {
        if (typeof predictor === 'undefined') return;

        const prediction = predictor.predictNextMonth();
        
        const elements = {
            predictedKWh: document.getElementById('predictedKWh'),
            predictedCost: document.getElementById('predictedCost'),
            consumptionTrend: document.getElementById('consumptionTrend'),
            confidenceLevel: document.getElementById('confidenceLevel')
        };

        if (elements.predictedKWh) elements.predictedKWh.textContent = prediction.predictedMonthlyKWh;
        if (elements.predictedCost) elements.predictedCost.textContent = prediction.predictedCost;
        
        if (elements.consumptionTrend) {
            elements.consumptionTrend.textContent = prediction.trend;
            elements.consumptionTrend.style.color = prediction.trend === 'increasing' ? '#ef4444' : 
                prediction.trend === 'decreasing' ? '#10b981' : '#f59e0b';
        }
        
        if (elements.confidenceLevel) elements.confidenceLevel.textContent = prediction.confidence;
    }

    initAllCharts() {
        this.initLoadDistributionChart();
        this.initConsumptionTrendChart();
        this.initHourlyProfileChart();
        this.initCostComparisonChart();
    }

    initLoadDistributionChart() {
        const ctx = document.getElementById('loadDistributionChart');
        if (!ctx) return;

        // Categorize appliances
        const categories = {
            'Cooling': 0,
            'Lighting': 0,
            'Kitchen': 0,
            'Entertainment': 0,
            'Others': 0
        };

        this.appliances.forEach(app => {
            const name = app.name.toLowerCase();
            if (name.includes('ac') || name.includes('air condition') || name.includes('fan')) {
                categories['Cooling'] += app.totalPower;
            } else if (name.includes('light') || name.includes('bulb')) {
                categories['Lighting'] += app.totalPower;
            } else if (name.includes('cook') || name.includes('fridge') || name.includes('freezer') || 
                       name.includes('microwave') || name.includes('kettle') || name.includes('blender')) {
                categories['Kitchen'] += app.totalPower;
            } else if (name.includes('tv') || name.includes('television') || name.includes('computer') || 
                       name.includes('laptop') || name.includes('decoder')) {
                categories['Entertainment'] += app.totalPower;
            } else {
                categories['Others'] += app.totalPower;
            }
        });

        const labels = Object.keys(categories);
        const data = Object.values(categories);
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

        if (this.charts.loadDistribution) {
            this.charts.loadDistribution.destroy();
        }

        this.charts.loadDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: data.length > 0 && data.some(d => d > 0) ? data : [1, 1, 1, 1, 1],
                    backgroundColor: colors,
                    borderWidth: 3,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    title: { display: true, text: 'Power Distribution by Category (Watts)' }
                }
            }
        });
    }

    initConsumptionTrendChart() {
        const ctx = document.getElementById('consumptionTrendChart');
        if (!ctx) return;

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        const labels = [];
        const data = [];
        const totalDailyKWh = this.appliances.reduce((s, a) => s + a.dailyKWh, 0);

        for (let i = 5; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12;
            labels.push(months[monthIndex]);
            const variation = 0.85 + Math.random() * 0.3;
            data.push(parseFloat((totalDailyKWh * 30 * variation).toFixed(1)));
        }

        if (this.charts.consumptionTrend) {
            this.charts.consumptionTrend.destroy();
        }

        this.charts.consumptionTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Monthly kWh',
                    data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: '#3b82f6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true } },
                scales: {
                    y: { beginAtZero: false, title: { display: true, text: 'kWh' } }
                }
            }
        });
    }

    initHourlyProfileChart() {
        const ctx = document.getElementById('hourlyProfileChart');
        if (!ctx) return;

        if (typeof predictor === 'undefined') return;

        const peakData = predictor.predictPeakDemand(this.appliances);
        const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
        const hourlyLoad = Array(24).fill(0);

        this.appliances.forEach(app => {
            const usageHours = predictor.getUsageHours(app.name);
            const hourlyPower = app.totalPower / (app.hoursPerDay || 8);
            usageHours.forEach(hour => {
                if (hour >= 0 && hour < 24) {
                    hourlyLoad[hour] += hourlyPower;
                }
            });
        });

        if (this.charts.hourlyProfile) {
            this.charts.hourlyProfile.destroy();
        }

        this.charts.hourlyProfile = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: hours,
                datasets: [{
                    label: 'Estimated Load (W)',
                    data: hourlyLoad,
                    backgroundColor: hourlyLoad.map(v => v > 5000 ? '#ef4444' : v > 2000 ? '#f59e0b' : '#10b981'),
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Watts' } }
                }
            }
        });
    }

    initCostComparisonChart() {
        const ctx = document.getElementById('costComparisonChart');
        if (!ctx) return;

        const topAppliances = [...this.appliances]
            .sort((a, b) => b.monthlyCost - a.monthlyCost)
            .slice(0, 8);

        if (this.charts.costComparison) {
            this.charts.costComparison.destroy();
        }

        this.charts.costComparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topAppliances.map(a => a.name.length > 15 ? a.name.substring(0, 15) + '...' : a.name),
                datasets: [{
                    label: `Monthly Cost (${JOSH_CONFIG.currencySymbol})`,
                    data: topAppliances.map(a => a.monthlyCost),
                    backgroundColor: topAppliances.map((_, i) => 
                        i < 3 ? '#ef4444' : i < 5 ? '#f59e0b' : '#10b981'
                    ),
                    borderRadius: 8
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true, title: { display: true, text: JOSH_CONFIG.currencySymbol } }
                }
            }
        });
    }

    renderSmartRecommendations() {
        const container = document.getElementById('smartRecommendations');
        if (!container) return;

        if (typeof predictor === 'undefined') {
            container.innerHTML = '<div class="alert alert-info">Prediction engine initializing...</div>';
            return;
        }

        const recommendations = this.generateRecommendations();
        
        container.innerHTML = recommendations.map((rec, i) => `
            <div class="alert alert-${rec.type}" style="margin-bottom: 12px;">
                <i class="fas fa-${rec.icon}"></i>
                <div>
                    <strong>${rec.title}</strong>
                    <p style="margin: 4px 0 0 0; font-size: 0.85rem;">${rec.message}</p>
                    ${rec.savings ? `<small style="color: #10b981;">Potential savings: ${JOSH_CONFIG.currencySymbol}${rec.savings}/month</small>` : ''}
                </div>
            </div>
        `).join('');
    }

    generateRecommendations() {
        const recommendations = [];
        const totalPower = this.appliances.reduce((s, a) => s + a.totalPower, 0);
        const totalMonthly = this.appliances.reduce((s, a) => s + a.monthlyCost, 0);

        // High consumption warning
        if (totalMonthly > 50000) {
            recommendations.push({
                type: 'warning',
                icon: 'exclamation-triangle',
                title: 'High Energy Consumption Detected',
                message: 'Your monthly cost exceeds ₦50,000. Consider energy audit and efficiency improvements.',
                savings: (totalMonthly * 0.3).toFixed(0)
            });
        }

        // AC recommendations
        const acLoads = this.appliances.filter(a => a.name.toLowerCase().includes('ac') || 
            a.name.toLowerCase().includes('air condition'));
        if (acLoads.length > 0) {
            const acCost = acLoads.reduce((s, a) => s + a.monthlyCost, 0);
            recommendations.push({
                type: 'info',
                icon: 'snowflake',
                title: 'Air Conditioner Optimization',
                message: `AC units account for ${JOSH_CONFIG.currencySymbol}${acCost.toFixed(0)}/month. Set temperature to 24-26°C and clean filters regularly.`,
                savings: (acCost * 0.25).toFixed(0)
            });
        }

        // Lighting recommendations
        const lightingLoads = this.appliances.filter(a => a.name.toLowerCase().includes('light') || 
            a.name.toLowerCase().includes('bulb'));
        if (lightingLoads.length > 0 && lightingLoads.some(l => l.powerInWatts > 15)) {
            recommendations.push({
                type: 'info',
                icon: 'lightbulb',
                title: 'Switch to LED Lighting',
                message: 'Non-LED bulbs detected. Switching to LED can reduce lighting costs by up to 80%.',
                savings: (lightingLoads.reduce((s, a) => s + a.monthlyCost, 0) * 0.6).toFixed(0)
            });
        }

        // Solar recommendation
        const totalDailyKWh = this.appliances.reduce((s, a) => s + a.dailyKWh, 0);
        if (totalDailyKWh > 10) {
            recommendations.push({
                type: 'success',
                icon: 'solar-panel',
                title: 'Solar Installation Viable',
                message: `With ${totalDailyKWh.toFixed(1)} kWh daily consumption, a solar system could save significantly on electricity bills.`,
                savings: (totalMonthly * 0.4).toFixed(0)
            });
        }

        // Peak load warning
        if (totalPower > 10000) {
            recommendations.push({
                type: 'danger',
                icon: 'bolt',
                title: 'High Peak Load Alert',
                message: 'Consider load scheduling to avoid peak demand charges and reduce strain on electrical system.',
                savings: (totalMonthly * 0.15).toFixed(0)
            });
        }

        return recommendations;
    }

    renderSavingsAnalysis() {
        const tbody = document.getElementById('savingsTableBody');
        if (!tbody) return;

        const totalMonthly = this.appliances.reduce((s, a) => s + a.monthlyCost, 0);

        const savingsItems = [
            {
                area: 'LED Lighting Upgrade',
                monthly: totalMonthly * 0.08,
                annual: totalMonthly * 0.08 * 12,
                cost: 50000,
                action: 'Replace bulbs'
            },
            {
                area: 'Inverter AC Installation',
                monthly: totalMonthly * 0.15,
                annual: totalMonthly * 0.15 * 12,
                cost: 350000,
                action: 'Upgrade AC'
            },
            {
                area: 'Solar Panel System (3kW)',
                monthly: totalMonthly * 0.40,
                annual: totalMonthly * 0.40 * 12,
                cost: 750000,
                action: 'Install solar'
            },
            {
                area: 'Load Scheduling',
                monthly: totalMonthly * 0.10,
                annual: totalMonthly * 0.10 * 12,
                cost: 0,
                action: 'Optimize schedule'
            },
            {
                area: 'Power Factor Correction',
                monthly: totalMonthly * 0.05,
                annual: totalMonthly * 0.05 * 12,
                cost: 150000,
                action: 'Install capacitors'
            }
        ];

        tbody.innerHTML = savingsItems.map(item => `
            <tr>
                <td><strong>${item.area}</strong></td>
                <td style="color:#10b981;font-weight:600;">${JOSH_CONFIG.currencySymbol}${item.monthly.toFixed(0)}</td>
                <td style="color:#10b981;">${JOSH_CONFIG.currencySymbol}${item.annual.toFixed(0)}</td>
                <td>${item.cost > 0 ? JOSH_CONFIG.currencySymbol + item.cost.toLocaleString() : 'Free'}</td>
                <td>${item.cost > 0 ? (item.cost / (item.monthly * 12)).toFixed(1) + ' years' : 'Immediate'}</td>
                <td><button class="btn btn-sm btn-primary">${item.action}</button></td>
            </tr>
        `).join('');
    }

    updatePerformanceMetrics() {
        const totalPower = this.appliances.reduce((s, a) => s + a.totalPower, 0);
        const totalDailyKWh = this.appliances.reduce((s, a) => s + a.dailyKWh, 0);
        
        // Load Factor calculation
        const peakLoad = totalPower;
        const avgLoad = totalPower * 0.65;
        const loadFactor = peakLoad > 0 ? (avgLoad / peakLoad).toFixed(2) : 0;

        // Update metrics
        const metricEls = {
            metricLoadFactor: document.getElementById('metricLoadFactor'),
            metricDemandFactor: document.getElementById('metricDemandFactor'),
            metricEER: document.getElementById('metricEER')
        };

        if (metricEls.metricLoadFactor) metricEls.metricLoadFactor.textContent = loadFactor;
        if (metricEls.metricDemandFactor) metricEls.metricDemandFactor.textContent = '0.72';
        if (metricEls.metricEER) metricEls.metricEER.textContent = (totalDailyKWh > 0 ? (totalPower / 1000 / totalDailyKWh * 8).toFixed(1) : '--');

        // Update status badges based on values
        this.updateBadgeStatus('lfStatus', loadFactor, 0.6, 0.8);
        this.updateBadgeStatus('dfStatus', 0.72, 0.7, 0.9);
    }

    updateBadgeStatus(elementId, value, min, max) {
        const el = document.getElementById(elementId);
        if (!el) return;

        if (value >= min && value <= max) {
            el.className = 'badge success';
            el.textContent = 'Good';
        } else if (value < min) {
            el.className = 'badge warning';
            el.textContent = 'Low';
        } else {
            el.className = 'badge info';
            el.textContent = 'High';
        }
    }
}

// Initialize analytics
const analytics = new AnalyticsManager();
window.analytics = analytics;