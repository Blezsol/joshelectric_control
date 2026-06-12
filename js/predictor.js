// ============================================
// JOSH ELECTRIC CONTROL - PREDICTIVE ANALYTICS
// AI-Powered Load Prediction Engine
// ============================================

class LoadPredictor {
    constructor() {
        this.historyData = [];
        this.predictionModel = null;
        this.confidenceLevel = 0;
    }

    async initialize() {
        // Load historical data
        try {
            this.historyData = await db.getHistory(90);
        } catch (e) {
            this.historyData = JSON.parse(localStorage.getItem('joshelectric_history') || '[]');
        }
    }

    predictNextMonth() {
        const appliances = window.dashboard?.appliances || 
                          JSON.parse(localStorage.getItem('joshelectric_appliances') || '[]');
        
        if (appliances.length === 0) {
            return {
                predictedKWh: 0,
                predictedCost: 0,
                trend: 'stable',
                confidence: 0,
                recommendation: 'Add appliances to get predictions'
            };
        }

        const totalDailyKWh = appliances.reduce((s, a) => s + a.dailyKWh, 0);
        const currentMonthlyCost = appliances.reduce((s, a) => s + a.monthlyCost, 0);

        // Seasonal adjustment for Nigeria
        const currentMonth = new Date().getMonth();
        const seasonalFactors = {
            0: 1.15, 1: 1.20, 2: 1.10, 3: 1.05,  // Dry season - higher AC usage
            4: 0.95, 5: 0.90, 6: 0.85, 7: 0.80,    // Rainy season - cooler
            8: 0.85, 9: 0.90, 10: 0.95, 11: 1.05    // Transition
        };
        
        const seasonFactor = seasonalFactors[currentMonth] || 1.0;

        // Calculate trend from history
        let trend = 'stable';
        let trendFactor = 1.0;
        
        if (this.historyData.length >= 7) {
            const recentData = this.historyData.slice(-7);
            const values = recentData.map(d => d.totalKWh || 0);
            const { slope } = this.linearRegression(
                values.map((_, i) => i),
                values
            );
            
            if (slope > 0.5) trend = 'increasing';
            else if (slope < -0.5) trend = 'decreasing';
            trendFactor = 1 + (slope / 100);
        }

        // Calculate predicted values
        const predictedDailyKWh = totalDailyKWh * seasonFactor * trendFactor;
        const predictedMonthlyKWh = predictedDailyKWh * 30;
        const predictedCost = predictedMonthlyKWh * JOSH_CONFIG.tariffPerKWh;

        // Calculate confidence
        this.confidenceLevel = Math.min(95, 60 + (this.historyData.length * 3));
        
        // Generate smart recommendations
        let recommendation = '';
        if (trend === 'increasing') {
            recommendation = `Consumption trending upward. Consider energy audit.`;
            if (predictedCost > 50000) {
                recommendation += ' Solar installation may save ₦' + 
                    (predictedCost * 0.4).toFixed(0) + '/month.';
            }
        } else if (trend === 'decreasing') {
            recommendation = 'Good energy management! Your efficient practices are showing results.';
        } else {
            recommendation = 'Stable consumption pattern. Maintain current practices.';
        }

        // Calculate peak demand prediction
        const peakDemand = this.predictPeakDemand(appliances);

        return {
            predictedDailyKWh: predictedDailyKWh.toFixed(2),
            predictedMonthlyKWh: predictedMonthlyKWh.toFixed(2),
            predictedCost: predictedCost.toFixed(2),
            currentCost: currentMonthlyCost.toFixed(2),
            trend,
            confidence: this.confidenceLevel.toFixed(0),
            recommendation,
            seasonFactor,
            peakDemand,
            potentialSavings: this.calculatePotentialSavings(appliances)
        };
    }

    predictPeakDemand(appliances) {
        // Simulate time-of-day usage patterns
        const hours = Array(24).fill(0);
        
        appliances.forEach(app => {
            const hourlyPower = app.totalPower / (app.hoursPerDay || 8);
            const usageHours = this.getUsageHours(app.name);
            
            usageHours.forEach(hour => {
                if (hour >= 0 && hour < 24) {
                    hours[hour] += hourlyPower;
                }
            });
        });

        const peakHour = hours.indexOf(Math.max(...hours));
        const peakValue = Math.max(...hours);
        
        return {
            peakHour,
            peakValue: peakValue.toFixed(0),
            peakTime: `${peakHour}:00 - ${peakHour + 1}:00`,
            recommendation: peakValue > 10000 ? 
                'Consider load shifting during peak hours' : 
                'Peak demand is manageable'
        };
    }

    getUsageHours(applianceName) {
        const name = applianceName.toLowerCase();
        
        if (name.includes('light') || name.includes('bulb')) {
            return [6, 7, 18, 19, 20, 21, 22];
        } else if (name.includes('ac') || name.includes('air condition')) {
            return [10, 11, 12, 13, 14, 20, 21, 22, 23];
        } else if (name.includes('fridge') || name.includes('freezer')) {
            return Array.from({length: 24}, (_, i) => i);
        } else if (name.includes('water heater') || name.includes('heater')) {
            return [6, 7, 8, 18, 19, 20];
        } else if (name.includes('tv') || name.includes('television')) {
            return [18, 19, 20, 21, 22, 23];
        } else if (name.includes('computer') || name.includes('laptop')) {
            return [9, 10, 11, 12, 13, 14, 15, 16, 17];
        } else {
            return [8, 9, 10, 11, 12, 13, 14, 15];
        }
    }

    calculatePotentialSavings(appliances) {
        const totalMonthlyCost = appliances.reduce((s, a) => s + a.monthlyCost, 0);
        
        // Calculate savings from various improvements
        const savings = {
            ledUpgrade: 0,
            efficientAC: 0,
            solarInstallation: 0,
            loadShifting: 0,
            total: 0
        };

        // LED upgrade savings (30% reduction in lighting cost)
        appliances.forEach(app => {
            if (app.name.toLowerCase().includes('light') || app.name.toLowerCase().includes('bulb')) {
                savings.ledUpgrade += app.monthlyCost * 0.30;
            }
            if (app.name.toLowerCase().includes('ac') || app.name.toLowerCase().includes('air condition')) {
                savings.efficientAC += app.monthlyCost * 0.25;
            }
        });

        // Solar potential (40% of total bill)
        savings.solarInstallation = totalMonthlyCost * 0.40;
        
        // Load shifting savings (10% by avoiding peak hours)
        savings.loadShifting = totalMonthlyCost * 0.10;

        savings.total = savings.ledUpgrade + savings.efficientAC + 
                       savings.solarInstallation + savings.loadShifting;

        return savings;
    }

    linearRegression(x, y) {
        const n = x.length;
        if (n === 0) return { slope: 0, intercept: 0 };
        
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        
        for (let i = 0; i < n; i++) {
            sumX += x[i];
            sumY += y[i];
            sumXY += x[i] * y[i];
            sumXX += x[i] * x[i];
        }
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        return { slope, intercept };
    }

    recordHistory(totalKWh, totalCost) {
        const entry = {
            date: new Date().toISOString(),
            totalKWh,
            totalCost,
            applianceCount: window.dashboard?.appliances?.length || 0,
            type: 'daily_snapshot'
        };

        // Save to IndexedDB
        db.addHistoryEntry(entry).catch(() => {
            // Fallback to localStorage
            const history = JSON.parse(localStorage.getItem('joshelectric_history') || '[]');
            history.push({ ...entry, id: Date.now() });
            if (history.length > 100) history.shift();
            localStorage.setItem('joshelectric_history', JSON.stringify(history));
        });

        this.historyData.push(entry);
    }
}

// Initialize predictor
const predictor = new LoadPredictor();
window.predictor = predictor;

// Initialize on load
setTimeout(() => predictor.initialize(), 1000);