// ============================================
// JOSH ELECTRIC CONTROL - COMPARATIVE ANALYSIS
// ============================================

class ComparativeAnalyzer {
    constructor() {
        this.scenarios = [];
        this.chart = null;
        this.init();
    }

    async init() {
        await this.loadScenarios();
        this.renderComparison();
        this.renderChart();
    }

    async loadScenarios() {
        try {
            this.scenarios = await db.getScenarios();
        } catch (e) {
            this.scenarios = JSON.parse(localStorage.getItem('joshelectric_scenarios') || '[]');
        }
    }

    async saveCurrentScenario() {
        const nameInput = document.getElementById('scenarioName');
        const name = nameInput?.value.trim();

        if (!name) {
            showNotification('Please enter a scenario name', 'error');
            return;
        }

        const appliances = window.opener?.dashboard?.appliances || 
                          JSON.parse(localStorage.getItem('joshelectric_appliances') || '[]');

        if (appliances.length === 0) {
            showNotification('No appliances to save. Add appliances first.', 'warning');
            return;
        }

        const totalPower = appliances.reduce((s, a) => s + a.totalPower, 0);
        const totalCurrent = appliances.reduce((s, a) => s + a.totalCurrent, 0);
        const totalDailyKWh = appliances.reduce((s, a) => s + a.dailyKWh, 0);
        const monthlyCost = appliances.reduce((s, a) => s + a.monthlyCost, 0);

        const scenario = {
            id: Date.now(),
            name,
            createdAt: new Date().toISOString(),
            appliances: [...appliances],
            summary: {
                totalPower,
                totalCurrent,
                totalDailyKWh,
                monthlyCost,
                applianceCount: appliances.length
            }
        };

        try {
            await db.saveScenario(scenario);
        } catch (e) {
            this.scenarios.push(scenario);
            localStorage.setItem('joshelectric_scenarios', JSON.stringify(this.scenarios));
        }

        await this.loadScenarios();
        this.renderComparison();
        this.renderChart();
        
        if (nameInput) nameInput.value = '';
        showNotification(`Scenario "${name}" saved!`, 'success');
    }

    deleteScenario(id) {
        if (!confirm('Delete this scenario?')) return;

        this.scenarios = this.scenarios.filter(s => s.id !== id);
        localStorage.setItem('joshelectric_scenarios', JSON.stringify(this.scenarios));
        
        db.clear('scenarios').then(() => {
            this.scenarios.forEach(s => db.saveScenario(s));
        }).catch(() => {});

        this.renderComparison();
        this.renderChart();
        showNotification('Scenario deleted', 'info');
    }

    renderComparison() {
        const container = document.getElementById('comparisonContainer');
        if (!container) return;

        if (this.scenarios.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-pie"></i>
                    <h3>No Scenarios Saved</h3>
                    <p>Save load configurations to compare them side by side.</p>
                </div>`;
            return;
        }

        if (this.scenarios.length < 2) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    <p>Save at least <strong>2 scenarios</strong> to see comparison. 
                       Currently: ${this.scenarios.length} scenario saved.</p>
                </div>`;
            
            // Show single scenario details
            const s = this.scenarios[0];
            container.innerHTML += `
                <div class="session-card">
                    <div class="session-header">
                        <span class="session-title">${s.name}</span>
                        <span class="session-date">${new Date(s.createdAt).toLocaleString()}</span>
                    </div>
                    <div class="session-stats">
                        <div class="session-stat">
                            <span class="label">Total Load</span>
                            <span class="value">${s.summary.totalPower.toFixed(1)} W</span>
                        </div>
                        <div class="session-stat">
                            <span class="label">Monthly Cost</span>
                            <span class="value">${JOSH_CONFIG.currencySymbol}${s.summary.monthlyCost.toFixed(2)}</span>
                        </div>
                        <div class="session-stat">
                            <span class="label">Appliances</span>
                            <span class="value">${s.summary.applianceCount}</span>
                        </div>
                    </div>
                </div>`;
            return;
        }

        // Build comparison table
        const baseline = this.scenarios[0];
        let html = '<div class="table-responsive"><table class="data-table"><thead><tr>';
        html += '<th>Scenario</th>';
        html += '<th>Appliances</th>';
        html += '<th>Total Load (W)</th>';
        html += '<th>Daily (kWh)</th>';
        html += '<th>Monthly Cost</th>';
        html += '<th>vs Baseline</th>';
        html += '<th>Actions</th>';
        html += '</tr></thead><tbody>';

        this.scenarios.forEach((scenario, i) => {
            const savings = baseline.summary.monthlyCost - scenario.summary.monthlyCost;
            const savingsPercent = baseline.summary.monthlyCost > 0 ? 
                ((savings / baseline.summary.monthlyCost) * 100).toFixed(1) : 0;
            
            const savingsColor = savings >= 0 ? '#10b981' : '#ef4444';
            const savingsIcon = savings >= 0 ? '↓' : '↑';

            html += `<tr>
                <td><strong>${scenario.name}</strong>${i === 0 ? ' (Baseline)' : ''}</td>
                <td>${scenario.summary.applianceCount}</td>
                <td>${scenario.summary.totalPower.toFixed(1)} W</td>
                <td>${scenario.summary.totalDailyKWh.toFixed(2)} kWh</td>
                <td>${JOSH_CONFIG.currencySymbol}${scenario.summary.monthlyCost.toFixed(2)}</td>
                <td style="color: ${savingsColor}; font-weight: 600;">
                    ${i === 0 ? '—' : `${savingsIcon} ${JOSH_CONFIG.currencySymbol}${Math.abs(savings).toFixed(2)} (${savingsPercent}%)`}
                </td>
                <td>
                    ${i > 0 ? `<button class="btn btn-sm btn-secondary" onclick="analyzer.deleteScenario(${scenario.id})">
                        <i class="fas fa-trash"></i>
                    </button>` : '<small>Baseline</small>'}
                </td>
            </tr>`;
        });

        html += '</tbody></table></div>';

        // Add best scenario recommendation
        const bestScenario = this.scenarios.reduce((best, curr) => 
            curr.summary.monthlyCost < best.summary.monthlyCost ? curr : best
        );

        html += `
            <div class="alert alert-success" style="margin-top: 16px;">
                <i class="fas fa-trophy"></i>
                <strong>Best Scenario:</strong> "${bestScenario.name}" with monthly cost of 
                ${JOSH_CONFIG.currencySymbol}${bestScenario.summary.monthlyCost.toFixed(2)}
                (Saves ${JOSH_CONFIG.currencySymbol}${(baseline.summary.monthlyCost - bestScenario.summary.monthlyCost).toFixed(2)} vs baseline)
            </div>`;

        container.innerHTML = html;
    }

    renderChart() {
        const ctx = document.getElementById('comparisonChart');
        if (!ctx || this.scenarios.length < 2) return;

        if (this.chart) {
            this.chart.destroy();
        }

        const labels = this.scenarios.map(s => s.name);
        const powerData = this.scenarios.map(s => s.summary.totalPower);
        const costData = this.scenarios.map(s => s.summary.monthlyCost);
        const dailyData = this.scenarios.map(s => s.summary.totalDailyKWh);

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Total Load (W)',
                        data: powerData,
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        borderColor: '#3b82f6',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: `Monthly Cost (${JOSH_CONFIG.currencySymbol})`,
                        data: costData,
                        backgroundColor: 'rgba(245, 158, 11, 0.7)',
                        borderColor: '#f59e0b',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        position: 'left',
                        title: { display: true, text: 'Watts' }
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        title: { display: true, text: JOSH_CONFIG.currencySymbol },
                        grid: { drawOnChartArea: false }
                    }
                },
                plugins: {
                    legend: { position: 'bottom' },
                    title: {
                        display: true,
                        text: 'Scenario Comparison: Load vs Cost'
                    }
                }
            }
        });
    }
}

const analyzer = new ComparativeAnalyzer();
window.analyzer = analyzer;

function saveScenario() {
    analyzer.saveCurrentScenario();
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}