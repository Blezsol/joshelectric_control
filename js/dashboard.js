// ============================================
// JOSH ELECTRIC CONTROL - DASHBOARD LOGIC
// Complete Main Dashboard Manager with API Sync
// ============================================

class DashboardManager {
    constructor() {
        this.appliances = [];
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.realtimeInterval = null;
        this.isSyncing = false;
        this.lastSyncTime = null;
        this.init();
    }
    
    async init() {
        // Show loading state
        this.showLoading(true);
        
        // Load from server first if logged in, then fallback to local
        await this.loadData();
        this.loadSettings();
        this.renderAll();
        this.setupEventListeners();
        this.loadPastProjects();
        this.updateSystemInfo();
        this.startRealTimeMonitoring();
        this.loadRandomTip();
        this.updateQuickStats();
        this.checkApiStatus();
        
        // Load demo data if first visit and no appliances
        if (this.appliances.length === 0 && !localStorage.getItem('joshelectric_visited')) {
            this.loadDemoData();
            localStorage.setItem('joshelectric_visited', 'true');
        }
        
        // Record analytics
        this.recordDailySnapshot();
        
        // Hide loading
        this.showLoading(false);
        
        console.log('✅ Dashboard initialized with', this.appliances.length, 'appliances');
    }
    
    showLoading(show) {
        const loader = document.getElementById('loadingScreen');
        if (loader) {
            if (show) {
                loader.classList.remove('hidden');
                loader.style.display = 'flex';
            } else {
                loader.classList.add('hidden');
                setTimeout(() => {
                    if (loader.classList.contains('hidden')) {
                        loader.style.display = 'none';
                    }
                }, 500);
            }
        }
    }
    
    async loadData() {
        // Try to load from server first (if logged in)
        if (auth.isLoggedIn() && JOSH_CONFIG.hasToken()) {
            try {
                const serverAppliances = await JOSH_CONFIG.loadAppliances();
                if (serverAppliances.length > 0) {
                    this.appliances = serverAppliances;
                    console.log('📡 Loaded', serverAppliances.length, 'appliances from server');
                    // Update local copy
                    localStorage.setItem('joshelectric_appliances', JSON.stringify(this.appliances));
                    return;
                }
            } catch (error) {
                console.warn('⚠️ Failed to load from server, trying local storage');
            }
        }
        
        // Fallback to localStorage
        const local = localStorage.getItem('joshelectric_appliances');
        if (local) {
            try {
                this.appliances = JSON.parse(local);
                console.log('💾 Loaded', this.appliances.length, 'appliances from local storage');
            } catch (e) {
                this.appliances = [];
            }
        }
        
        // Try IndexedDB as last resort
        if (this.appliances.length === 0 && typeof db !== 'undefined' && db.isReady) {
            try {
                this.appliances = await db.getAppliances();
                console.log('🗄️ Loaded', this.appliances.length, 'appliances from IndexedDB');
            } catch (e) {
                console.warn('Failed to load from IndexedDB');
            }
        }
    }
    
    async checkApiStatus() {
        if (auth.isLoggedIn()) {
            const isHealthy = await JOSH_CONFIG.checkApiHealth();
            const modeEl = document.getElementById('sidebarMode');
            if (modeEl) {
                modeEl.textContent = isHealthy ? 'Connected' : 'Local Mode';
                modeEl.style.color = isHealthy ? '#10b981' : '#f59e0b';
            }
            
            // Load user settings from server
            if (isHealthy) {
                await JOSH_CONFIG.loadUserSettings();
                this.loadSettings();
                this.renderAll();
            }
        }
    }
    
    loadDemoData() {
        const demos = [
            { name: 'Air Conditioner (1.5HP)', quantity: 2, powerInWatts: 1500, currentInAmps: 6.52, 
              hoursPerDay: 8, totalPower: 3000, totalCurrent: 13.04, dailyKWh: 24, monthlyCost: 34560,
              voltage: 230, dateAdded: new Date().toISOString() },
            { name: 'Refrigerator (Medium)', quantity: 1, powerInWatts: 200, currentInAmps: 0.87,
              hoursPerDay: 24, totalPower: 200, totalCurrent: 0.87, dailyKWh: 4.8, monthlyCost: 6912,
              voltage: 230, dateAdded: new Date().toISOString() },
            { name: 'Electric Water Heater', quantity: 1, powerInWatts: 2000, currentInAmps: 8.70,
              hoursPerDay: 3, totalPower: 2000, totalCurrent: 8.70, dailyKWh: 6, monthlyCost: 8640,
              voltage: 230, dateAdded: new Date().toISOString() },
            { name: 'LED Bulbs (10 pieces)', quantity: 10, powerInWatts: 15, currentInAmps: 0.07,
              hoursPerDay: 8, totalPower: 150, totalCurrent: 0.65, dailyKWh: 1.2, monthlyCost: 1728,
              voltage: 230, dateAdded: new Date().toISOString() },
            { name: 'Washing Machine', quantity: 1, powerInWatts: 500, currentInAmps: 2.17,
              hoursPerDay: 2, totalPower: 500, totalCurrent: 2.17, dailyKWh: 1, monthlyCost: 1440,
              voltage: 230, dateAdded: new Date().toISOString() },
            { name: 'Television (55" LED)', quantity: 1, powerInWatts: 100, currentInAmps: 0.43,
              hoursPerDay: 8, totalPower: 100, totalCurrent: 0.43, dailyKWh: 0.8, monthlyCost: 1152,
              voltage: 230, dateAdded: new Date().toISOString() },
            { name: 'Pumping Machine (1HP)', quantity: 1, powerInWatts: 750, currentInAmps: 3.26,
              hoursPerDay: 2, totalPower: 750, totalCurrent: 3.26, dailyKWh: 1.5, monthlyCost: 2160,
              voltage: 230, dateAdded: new Date().toISOString() }
        ];
        
        this.appliances = demos.map(d => ({ ...d, id: Date.now() + Math.random() }));
        this.saveData();
        showNotification('Demo data loaded with common Nigerian appliances! 🇳🇬', 'info');
    }
    
    loadSettings() {
        const voltageInput = document.getElementById('voltage');
        if (voltageInput) voltageInput.value = JOSH_CONFIG.voltage;
        this.updateSystemInfo();
    }
    
    updateSystemInfo() {
        if (document.getElementById('sidebarVoltage')) 
            document.getElementById('sidebarVoltage').textContent = JOSH_CONFIG.voltage + 'V';
        if (document.getElementById('sidebarTariff')) 
            document.getElementById('sidebarTariff').textContent = JOSH_CONFIG.currencySymbol + JOSH_CONFIG.tariffPerKWh + '/kWh';
        if (document.getElementById('sidebarFrequency'))
            document.getElementById('sidebarFrequency').textContent = JOSH_CONFIG.frequency + ' Hz';
        
        const modeEl = document.getElementById('sidebarMode');
        if (modeEl) {
            const isOnline = JOSH_CONFIG.isOnline;
            modeEl.textContent = isOnline ? (auth.isLoggedIn() ? 'Connected' : 'Online') : 'Offline';
            modeEl.style.color = isOnline ? '#10b981' : '#ef4444';
        }
    }
    
    updateQuickStats() {
        const countEl = document.getElementById('quickApplianceCount');
        const powerEl = document.getElementById('quickTotalPower');
        const efficiencyEl = document.getElementById('quickEfficiency');
        
        if (countEl) countEl.textContent = this.appliances.length;
        
        const totalPower = this.appliances.reduce((s, a) => s + a.totalPower, 0);
        if (powerEl) powerEl.textContent = this.formatPower(totalPower);
        
        if (efficiencyEl && this.appliances.length > 0) {
            const avgPower = totalPower / this.appliances.length;
            if (avgPower < 500) efficiencyEl.textContent = 'Excellent';
            else if (avgPower < 1000) efficiencyEl.textContent = 'Good';
            else if (avgPower < 2000) efficiencyEl.textContent = 'Fair';
            else efficiencyEl.textContent = 'Review';
        }
    }
    
    formatPower(watts) {
        if (watts >= 1000) {
            return (watts / 1000).toFixed(2) + ' kW';
        }
        return watts.toFixed(0) + ' W';
    }
    
    loadRandomTip() {
        const tipEl = document.getElementById('randomTip');
        if (tipEl && JOSH_CONFIG.tips && JOSH_CONFIG.tips.length > 0) {
            const randomIndex = Math.floor(Math.random() * JOSH_CONFIG.tips.length);
            tipEl.textContent = JOSH_CONFIG.tips[randomIndex];
        }
    }
    
    startRealTimeMonitoring() {
        if (this.realtimeInterval) clearInterval(this.realtimeInterval);
        
        const updateDisplay = () => {
            const totalPower = this.appliances.reduce((s, a) => s + a.totalPower, 0);
            const variation = 0.95 + Math.random() * 0.1;
            const realTimePower = totalPower * variation;
            const hourlyCost = (realTimePower / 1000) * JOSH_CONFIG.tariffPerKWh;
            
            const powerEl = document.getElementById('realTimePower');
            const costEl = document.getElementById('hourlyCost');
            const statusEl = document.getElementById('loadStatus');
            const pfEl = document.getElementById('powerFactorDisplay');
            
            if (powerEl) powerEl.textContent = realTimePower.toFixed(1);
            if (costEl) costEl.textContent = JOSH_CONFIG.currencySymbol + hourlyCost.toFixed(2);
            if (pfEl) pfEl.textContent = (0.82 + Math.random() * 0.15).toFixed(2);
            
            if (statusEl) {
                if (realTimePower > 10000) {
                    statusEl.textContent = 'High Load ⚠️';
                    statusEl.style.color = '#ef4444';
                } else if (realTimePower > 5000) {
                    statusEl.textContent = 'Moderate';
                    statusEl.style.color = '#f59e0b';
                } else {
                    statusEl.textContent = 'Normal ✓';
                    statusEl.style.color = '#10b981';
                }
            }
        };
        
        updateDisplay();
        this.realtimeInterval = setInterval(updateDisplay, 3000);
    }
    
    recordDailySnapshot() {
        const totalDailyKWh = this.appliances.reduce((s, a) => s + a.dailyKWh, 0);
        const totalMonthlyCost = this.appliances.reduce((s, a) => s + a.monthlyCost, 0);
        
        if (typeof predictor !== 'undefined') {
            predictor.recordHistory(totalDailyKWh, totalMonthlyCost);
        }
        
        this.updatePredictiveAlert();
    }
    
    updatePredictiveAlert() {
        if (typeof predictor === 'undefined') return;
        
        const prediction = predictor.predictNextMonth();
        const alertEl = document.getElementById('predictiveAlert');
        const messageEl = document.getElementById('predictionMessage');
        
        if (alertEl && messageEl && prediction && prediction.confidence > 30) {
            alertEl.style.display = 'flex';
            const trendEmoji = prediction.trend === 'increasing' ? '📈' : prediction.trend === 'decreasing' ? '📉' : '📊';
            messageEl.textContent = `${trendEmoji} Next month: ~${JOSH_CONFIG.currencySymbol}${prediction.predictedCost}. ${prediction.recommendation}`;
        }
    }
    
    addAppliance() {
        const name = document.getElementById('applianceName')?.value.trim();
        const quantity = parseInt(document.getElementById('quantity')?.value);
        const rating = parseFloat(document.getElementById('powerRating')?.value);
        const unit = document.getElementById('unitType')?.value;
        const hoursPerDay = parseFloat(document.getElementById('hoursPerDay')?.value) || 8;
        const voltage = JOSH_CONFIG.voltage;
        
        if (!name || isNaN(quantity) || quantity < 1 || isNaN(rating) || rating <= 0 || isNaN(hoursPerDay) || hoursPerDay <= 0) {
            showNotification('Please fill all required fields correctly', 'error');
            return;
        }
        
        let powerInWatts, currentInAmps;
        if (unit === 'A') {
            currentInAmps = rating;
            powerInWatts = rating * voltage;
        } else {
            powerInWatts = rating;
            currentInAmps = rating / voltage;
        }
        
        const totalPower = powerInWatts * quantity;
        const totalCurrent = currentInAmps * quantity;
        const dailyKWh = (totalPower * hoursPerDay) / 1000;
        const monthlyCost = dailyKWh * 30 * JOSH_CONFIG.tariffPerKWh;
        
        const newAppliance = {
            id: Date.now(),
            name,
            quantity,
            powerInWatts,
            currentInAmps,
            hoursPerDay,
            totalPower,
            totalCurrent,
            dailyKWh,
            monthlyCost,
            voltage,
            dateAdded: new Date().toISOString()
        };
        
        this.appliances.push(newAppliance);
        
        // Clear inputs
        document.getElementById('applianceName').value = '';
        document.getElementById('quantity').value = '1';
        document.getElementById('powerRating').value = '';
        document.getElementById('hoursPerDay').value = '8';
        
        this.saveData();
        this.renderAll();
        this.updateQuickStats();
        this.loadRandomTip();
        showNotification(`${name} added successfully!`, 'success');
    }
    
    addMultipleAppliances() {
        const name = document.getElementById('applianceName')?.value.trim();
        const powerRating = parseFloat(document.getElementById('powerRating')?.value);
        
        if (!name || isNaN(powerRating)) {
            showNotification('Enter appliance name and power rating first', 'warning');
            return;
        }
        
        const quantities = [1, 2, 3, 5];
        const originalQty = document.getElementById('quantity').value;
        
        quantities.forEach(qty => {
            document.getElementById('quantity').value = qty;
            this.addAppliance();
        });
        
        document.getElementById('quantity').value = originalQty;
        showNotification(`Added ${name} with multiple quantities`, 'success');
    }
    
    removeAppliance(id) {
        const app = this.appliances.find(a => a.id === id);
        this.appliances = this.appliances.filter(app => app.id !== id);
        this.saveData();
        this.renderAll();
        this.updateQuickStats();
        if (app) showNotification(`${app.name} removed`, 'info');
    }
    
    clearAll() {
        if (this.appliances.length === 0) return;
        if (confirm(`Delete all ${this.appliances.length} appliances? This cannot be undone.`)) {
            this.appliances = [];
            this.saveData();
            this.renderAll();
            this.updateQuickStats();
            showNotification('All appliances cleared', 'info');
        }
    }
    
    sortTable(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        
        this.appliances.sort((a, b) => {
            let valA, valB;
            switch(column) {
                case 'name': valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); break;
                case 'power': valA = a.totalPower; valB = b.totalPower; break;
                case 'cost': valA = a.monthlyCost; valB = b.monthlyCost; break;
                default: return 0;
            }
            if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        
        this.renderTable();
    }
    
    // ===== EXPORT FUNCTIONS =====
    
    exportCSV() {
        if (this.appliances.length === 0) {
            showNotification('No data to export', 'warning');
            return;
        }
        
        let csv = 'S/N,Appliance,Quantity,Power (W),Current (A),Hours/Day,Total Power (W),Total Current (A),Daily (kWh),Monthly Cost (NGN),% of Total\n';
        const totalMonthly = this.appliances.reduce((s, a) => s + a.monthlyCost, 0);
        
        this.appliances.forEach((app, i) => {
            const percentage = totalMonthly > 0 ? ((app.monthlyCost / totalMonthly) * 100).toFixed(1) : 0;
            csv += `${i+1},"${app.name}",${app.quantity},${app.powerInWatts.toFixed(1)},${app.currentInAmps.toFixed(2)},${app.hoursPerDay || 8},${app.totalPower.toFixed(1)},${app.totalCurrent.toFixed(2)},${app.dailyKWh.toFixed(2)},${app.monthlyCost.toFixed(2)},${percentage}%\n`;
        });
        
        const totalPower = this.appliances.reduce((s, a) => s + a.totalPower, 0);
        const totalCurrent = this.appliances.reduce((s, a) => s + a.totalCurrent, 0);
        const totalDaily = this.appliances.reduce((s, a) => s + a.dailyKWh, 0);
        
        csv += `\nTOTALS,,,,,,${totalPower.toFixed(1)},${totalCurrent.toFixed(2)},${totalDaily.toFixed(2)},${totalMonthly.toFixed(2)},\n`;
        csv += `\nGenerated by JoshElectric Control v${JOSH_CONFIG.version} on ${new Date().toLocaleString()}\n`;
        csv += `Tariff: ${JOSH_CONFIG.currencySymbol}${JOSH_CONFIG.tariffPerKWh}/kWh | Voltage: ${JOSH_CONFIG.voltage}V\n`;
        
        this.downloadFile(csv, `JoshElectric_Load_Data_${this.getDateString()}.csv`, 'text/csv');
        showNotification('CSV exported successfully! 📄', 'success');
    }
    
    async exportPDF() {
        if (this.appliances.length === 0) {
            showNotification('No data to export', 'warning');
            return;
        }
        
        showNotification('Generating PDF report...', 'info');
        
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            
            // Header
            doc.setFillColor(30, 58, 138);
            doc.rect(0, 0, pageWidth, 35, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('JoshElectric Control', 14, 18);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('Professional Electric Load Management System', 14, 26);
            doc.text(`Report Date: ${new Date().toLocaleString()}`, 14, 32);
            
            // Summary
            const totalPower = this.appliances.reduce((s, a) => s + a.totalPower, 0);
            const totalCurrent = this.appliances.reduce((s, a) => s + a.totalCurrent, 0);
            const totalDaily = this.appliances.reduce((s, a) => s + a.dailyKWh, 0);
            const totalMonthly = this.appliances.reduce((s, a) => s + a.monthlyCost, 0);
            
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Load Summary', 14, 48);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`Total Load: ${this.formatPower(totalPower)} | Current: ${totalCurrent.toFixed(2)}A`, 14, 56);
            doc.text(`Daily: ${totalDaily.toFixed(2)} kWh | Monthly: ${JOSH_CONFIG.currencySymbol}${totalMonthly.toFixed(2)}`, 14, 62);
            
            // Table
            const tableData = this.appliances.map((app, i) => [
                i + 1, app.name, app.quantity, `${app.powerInWatts.toFixed(1)}W`,
                `${app.currentInAmps.toFixed(2)}A`, `${app.hoursPerDay || 8}h`,
                `${app.totalPower.toFixed(1)}W`, `${app.totalCurrent.toFixed(2)}A`,
                `${app.dailyKWh.toFixed(2)}kWh`, `${JOSH_CONFIG.currencySymbol}${app.monthlyCost.toFixed(2)}`
            ]);
            
            doc.autoTable({
                startY: 68,
                head: [['#', 'Appliance', 'Qty', 'Power', 'Current', 'Hrs', 'Total', 'T.Current', 'Daily', 'Monthly']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 7 },
                styles: { fontSize: 7, cellPadding: 2 },
            });
            
            // Recommendations
            const finalY = doc.lastAutoTable.finalY + 10;
            const currentWithSafety = totalCurrent * JOSH_CONFIG.safetyMargin;
            let rec = JOSH_CONFIG.cableSizes[0];
            for (let c of JOSH_CONFIG.cableSizes) {
                if (currentWithSafety <= c.maxAmps) { rec = c; break; }
            }
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Recommendations', 14, finalY);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(`Breaker: ${rec.breaker} | Cable: ${rec.cable} | Phase: ${totalCurrent < 100 ? 'Single' : 'Three'}`, 14, finalY + 7);
            
            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(7);
                doc.setTextColor(128);
                doc.text(`JoshElectric Control v${JOSH_CONFIG.version} | Page ${i} of ${pageCount}`, 14, 290);
            }
            
            doc.save(`JoshElectric_Report_${this.getDateString()}.pdf`);
            showNotification('PDF report downloaded! 📕', 'success');
        } catch (error) {
            console.error('PDF Error:', error);
            showNotification('Error generating PDF. Please try CSV export.', 'error');
        }
    }
    
    exportJSON() {
        if (this.appliances.length === 0) {
            showNotification('No data to export', 'warning');
            return;
        }
        
        const data = {
            exportDate: new Date().toISOString(),
            version: JOSH_CONFIG.version,
            generatedBy: 'JoshElectric Control',
            config: {
                voltage: JOSH_CONFIG.voltage,
                frequency: JOSH_CONFIG.frequency,
                tariffPerKWh: JOSH_CONFIG.tariffPerKWh,
                currency: JOSH_CONFIG.currency,
                currencySymbol: JOSH_CONFIG.currencySymbol
            },
            appliances: this.appliances,
            summary: {
                totalPower: this.appliances.reduce((s, a) => s + a.totalPower, 0),
                totalCurrent: this.appliances.reduce((s, a) => s + a.totalCurrent, 0),
                totalDailyKWh: this.appliances.reduce((s, a) => s + a.dailyKWh, 0),
                monthlyCost: this.appliances.reduce((s, a) => s + a.monthlyCost, 0),
                applianceCount: this.appliances.length
            }
        };
        
        this.downloadFile(JSON.stringify(data, null, 2), 
            `JoshElectric_Data_${this.getDateString()}.json`, 
            'application/json');
        showNotification('JSON exported successfully! 📋', 'success');
    }
    
    exportExcel() {
        if (this.appliances.length === 0) {
            showNotification('No data to export', 'warning');
            return;
        }
        
        let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">';
        html += '<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>';
        html += '<x:ExcelWorksheet><x:Name>Load Data</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>';
        html += '</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>';
        html += '<table border="1"><thead><tr style="background-color:#1e3a8a;color:white;font-weight:bold;">';
        html += '<th>S/N</th><th>Appliance</th><th>Qty</th><th>Power (W)</th><th>Current (A)</th>';
        html += '<th>Hours/Day</th><th>Total Power (W)</th><th>Daily (kWh)</th><th>Monthly Cost (NGN)</th>';
        html += '</tr></thead><tbody>';
        
        this.appliances.forEach((app, i) => {
            html += `<tr>
                <td>${i + 1}</td><td>${app.name}</td><td>${app.quantity}</td>
                <td>${app.powerInWatts.toFixed(1)}</td><td>${app.currentInAmps.toFixed(2)}</td>
                <td>${app.hoursPerDay || 8}</td><td>${app.totalPower.toFixed(1)}</td>
                <td>${app.dailyKWh.toFixed(2)}</td><td>${app.monthlyCost.toFixed(2)}</td>
            </tr>`;
        });
        
        html += '</tbody></table></body></html>';
        
        this.downloadFile(html, 
            `JoshElectric_Report_${this.getDateString()}.xls`, 
            'application/vnd.ms-excel');
        showNotification('Excel file exported! 📊', 'success');
    }
    
    // ===== SESSION MANAGEMENT =====
    
    async saveSession() {
        if (this.appliances.length === 0) {
            showNotification('No data to save', 'warning');
            return;
        }
        
        const session = {
            id: Date.now(),
            name: `Session - ${new Date().toLocaleDateString('en-NG')}`,
            date: new Date().toISOString(),
            appliances: [...this.appliances],
            totalPower: this.appliances.reduce((s, a) => s + a.totalPower, 0),
            totalCurrent: this.appliances.reduce((s, a) => s + a.totalCurrent, 0),
            monthlyCost: this.appliances.reduce((s, a) => s + a.monthlyCost, 0)
        };
        
        // Save locally
        this.saveSessionToLocal(session);
        
        // Sync to server if logged in
        if (auth.isLoggedIn()) {
            await JOSH_CONFIG.syncSession(session);
        }
        
        this.loadPastProjects();
        showNotification('Session saved! ' + (auth.isLoggedIn() ? '☁️ Synced to cloud' : '💾 Saved locally'), 'success');
    }
    
    saveSessionToLocal(session) {
        const sessions = JSON.parse(localStorage.getItem('joshelectric_sessions') || '[]');
        sessions.unshift(session);
        if (sessions.length > 20) sessions.pop();
        localStorage.setItem('joshelectric_sessions', JSON.stringify(sessions));
    }
    
    loadPastProjects() {
        const container = document.getElementById('pastProjectsList');
        if (!container) return;
        
        let sessions = [];
        try {
            const stored = localStorage.getItem('joshelectric_sessions');
            if (stored) sessions = JSON.parse(stored);
        } catch (e) {}
        
        if (sessions.length === 0) {
            container.innerHTML = '<p style="color:#64748b;font-size:0.85rem;padding:8px;">No saved projects yet.<br><small>Save a session to see it here.</small></p>';
            return;
        }
        
        container.innerHTML = sessions.slice(0, 5).map(session => `
            <div class="project-item" onclick="dashboard.loadSession(${session.id})" style="cursor:pointer;" title="Click to load">
                <i class="fas fa-folder"></i>
                <div>
                    <span class="project-name">${session.name}</span>
                    <span class="project-date">${new Date(session.date).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
    }
    
    loadSession(id) {
        const sessions = JSON.parse(localStorage.getItem('joshelectric_sessions') || '[]');
        const session = sessions.find(s => s.id === id);
        
        if (session && confirm(`Load "${session.name}"?\nCurrent data will be replaced.`)) {
            this.appliances = [...session.appliances];
            this.saveData();
            this.renderAll();
            this.updateQuickStats();
            showNotification('Session loaded! ' + session.name, 'success');
        }
    }
    
    // ===== RENDER FUNCTIONS =====
    
    renderTable() {
        const tableBody = document.getElementById('tableBody');
        const tableFooter = document.getElementById('tableFooter');
        const countEl = document.getElementById('applianceCount');
        
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        if (countEl) countEl.textContent = `${this.appliances.length} appliances`;
        
        if (this.appliances.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="12" style="text-align:center;padding:40px;color:#94a3b8;">
                <i class="fas fa-inbox" style="font-size:2.5rem;display:block;margin-bottom:12px;"></i>
                <strong>No appliances added yet</strong><br>
                <small>Use the form above to add your electrical loads</small>
            </td></tr>`;
            tableFooter.innerHTML = '';
            return;
        }
        
        const totalMonthly = this.appliances.reduce((s, a) => s + a.monthlyCost, 0);
        
        this.appliances.forEach((app, i) => {
            const percentage = totalMonthly > 0 ? ((app.monthlyCost / totalMonthly) * 100).toFixed(1) : 0;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${i + 1}</td>
                <td><strong>${app.name}</strong></td>
                <td>${app.quantity}</td>
                <td>${app.powerInWatts.toFixed(1)}</td>
                <td>${app.currentInAmps.toFixed(2)}</td>
                <td>${app.hoursPerDay || 8}h</td>
                <td>${app.totalPower.toFixed(1)}</td>
                <td>${app.totalCurrent.toFixed(2)}</td>
                <td>${app.dailyKWh.toFixed(2)}</td>
                <td><strong>${JOSH_CONFIG.currencySymbol}${app.monthlyCost.toFixed(2)}</strong></td>
                <td>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <div class="progress-bar" style="width:50px;">
                            <div class="progress-fill" style="width:${Math.min(percentage, 100)}%;${percentage > 30 ? 'background:#ef4444;' : percentage > 15 ? 'background:#f59e0b;' : 'background:#10b981;'}"></div>
                        </div>
                        <small>${percentage}%</small>
                    </div>
                </td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="dashboard.removeAppliance(${app.id})" title="Remove ${app.name}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        const totalPower = this.appliances.reduce((s, a) => s + a.totalPower, 0);
        const totalCurrent = this.appliances.reduce((s, a) => s + a.totalCurrent, 0);
        const totalDaily = this.appliances.reduce((s, a) => s + a.dailyKWh, 0);
        
        tableFooter.innerHTML = `
            <tr style="background:#f1f5f9;font-weight:700;font-size:0.9rem;">
                <td colspan="6" style="text-align:right;">TOTALS:</td>
                <td>${this.formatPower(totalPower)}</td>
                <td>${totalCurrent.toFixed(2)} A</td>
                <td>${totalDaily.toFixed(2)} kWh</td>
                <td><strong>${JOSH_CONFIG.currencySymbol}${totalMonthly.toFixed(2)}</strong></td>
                <td>100%</td>
                <td></td>
            </tr>`;
    }
    
    updateCalculations() {
        const totalPower = this.appliances.reduce((s, a) => s + a.totalPower, 0);
        const totalCurrent = this.appliances.reduce((s, a) => s + a.totalCurrent, 0);
        const totalDaily = this.appliances.reduce((s, a) => s + a.dailyKWh, 0);
        const totalMonthly = this.appliances.reduce((s, a) => s + a.monthlyCost, 0);
        
        // Update summary cards
        const els = {
            totalPower: document.getElementById('totalPower'),
            totalCurrent: document.getElementById('totalCurrent'),
            dailyConsumption: document.getElementById('dailyConsumption'),
            monthlyCost: document.getElementById('monthlyCost'),
            powerTrend: document.getElementById('powerTrend'),
            costTrend: document.getElementById('costTrend'),
            breakerSize: document.getElementById('breakerSize'),
            cableSize: document.getElementById('cableSize'),
            phaseRecommendation: document.getElementById('phaseRecommendation'),
            safetyNote: document.getElementById('safetyNote'),
            solarRecommendation: document.getElementById('solarRecommendation')
        };
        
        if (els.totalPower) els.totalPower.textContent = totalPower.toFixed(1);
        if (els.totalCurrent) els.totalCurrent.textContent = totalCurrent.toFixed(2);
        if (els.dailyConsumption) els.dailyConsumption.textContent = totalDaily.toFixed(2);
        if (els.monthlyCost) els.monthlyCost.textContent = totalMonthly.toFixed(2);
        
        // Trends
        if (els.powerTrend) {
            els.powerTrend.textContent = totalPower > 5000 ? '↑ High load' : '✓ Normal';
            els.powerTrend.style.color = totalPower > 5000 ? '#ef4444' : '#10b981';
        }
        if (els.costTrend) {
            els.costTrend.textContent = totalMonthly > 30000 ? '↑ Above average' : '✓ Manageable';
            els.costTrend.style.color = totalMonthly > 30000 ? '#ef4444' : '#10b981';
        }
        
        // Recommendations
        const currentWithSafety = totalCurrent * JOSH_CONFIG.safetyMargin;
        let rec = JOSH_CONFIG.cableSizes[0];
        for (let c of JOSH_CONFIG.cableSizes) {
            if (currentWithSafety <= c.maxAmps) { rec = c; break; }
        }
        if (currentWithSafety > JOSH_CONFIG.cableSizes[JOSH_CONFIG.cableSizes.length - 1].maxAmps) {
            rec = JOSH_CONFIG.cableSizes[JOSH_CONFIG.cableSizes.length - 1];
        }
        
        if (els.breakerSize) els.breakerSize.textContent = `${rec.breaker} (${currentWithSafety.toFixed(1)}A safety)`;
        if (els.cableSize) els.cableSize.textContent = rec.cable;
        
        if (els.phaseRecommendation) {
            if (totalCurrent < 30) els.phaseRecommendation.textContent = 'Single Phase ✓';
            else if (totalCurrent < 100) els.phaseRecommendation.textContent = 'Single/Three Phase';
            else els.phaseRecommendation.innerHTML = '<span style="color:#ef4444;">Three Phase Required ⚠️</span>';
        }
        
        if (els.safetyNote) {
            els.safetyNote.textContent = totalCurrent > 200 ? 
                '⚠️ Exceeds standard ratings' : 
                `${((JOSH_CONFIG.safetyMargin - 1) * 100)}% safety margin`;
        }
        
        // Solar recommendation
        if (els.solarRecommendation && totalDaily > 5) {
            const systemSize = (totalDaily / 5.5).toFixed(1);
            els.solarRecommendation.textContent = `~${systemSize}kW system recommended`;
        }
    }
    
    renderAll() {
        this.renderTable();
        this.updateCalculations();
    }
    
    // ===== DATA PERSISTENCE =====
    
    async saveData() {
        // Always save locally
        localStorage.setItem('joshelectric_appliances', JSON.stringify(this.appliances));
        
        // Save to IndexedDB
        if (typeof db !== 'undefined' && db.isReady) {
            try {
                await db.saveAppliances(this.appliances);
            } catch (e) {
                console.warn('IndexedDB save failed');
            }
        }
        
        // Sync to server if logged in
        if (auth.isLoggedIn() && JOSH_CONFIG.hasToken() && !this.isSyncing) {
            this.isSyncing = true;
            try {
                await JOSH_CONFIG.syncAppliances(this.appliances);
                this.lastSyncTime = new Date();
            } catch (e) {
                console.warn('Server sync failed, data saved locally');
            }
            this.isSyncing = false;
        }
    }
    
    getDateString() {
        return new Date().toISOString().split('T')[0];
    }
    
    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }
    
    // ===== EVENT LISTENERS =====
    
    setupEventListeners() {
        document.getElementById('addBtn')?.addEventListener('click', () => this.addAppliance());
        document.getElementById('addMultipleBtn')?.addEventListener('click', () => this.addMultipleAppliances());
        document.getElementById('clearBtn')?.addEventListener('click', () => this.clearAll());
        document.getElementById('exportCsvBtn')?.addEventListener('click', () => this.exportCSV());
        document.getElementById('exportPdfBtn')?.addEventListener('click', () => this.exportPDF());
        document.getElementById('exportJsonBtn')?.addEventListener('click', () => this.exportJSON());
        document.getElementById('exportExcelBtn')?.addEventListener('click', () => this.exportExcel());
        document.getElementById('saveSessionBtn')?.addEventListener('click', () => this.saveSession());
        
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.renderAll();
            this.updateQuickStats();
            this.loadRandomTip();
            this.checkApiStatus();
            showNotification('Dashboard refreshed 🔄', 'info');
        });
        
        // Enter key to add appliance
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && document.activeElement?.tagName === 'INPUT' && 
                !['loginEmail', 'loginPassword', 'regEmail', 'regPassword'].includes(document.activeElement?.id)) {
                e.preventDefault();
                this.addAppliance();
            }
        });
        
        // Appliance name autofill
        document.getElementById('applianceName')?.addEventListener('input', (e) => {
            const preset = JOSH_CONFIG.appliancePresets.find(p => 
                p.name.toLowerCase() === e.target.value.toLowerCase()
            );
            const hintEl = document.getElementById('powerHint');
            const hoursEl = document.getElementById('hoursPerDay');
            
            if (preset) {
                if (hintEl) hintEl.textContent = `Typical: ${preset.power}W, ${preset.typicalHours}h/day`;
                if (hoursEl) hoursEl.value = preset.typicalHours;
                document.getElementById('powerRating').value = preset.power;
            } else if (hintEl) {
                hintEl.textContent = 'Enter power rating in Watts or Amperes';
            }
        });
        
        // Online/Offline detection
        window.addEventListener('online', () => {
            this.updateSystemInfo();
            if (auth.isLoggedIn()) {
                this.saveData(); // Sync when back online
            }
        });
        window.addEventListener('offline', () => this.updateSystemInfo());
    }
}

// ===== INITIALIZE DASHBOARD =====
const dashboard = new DashboardManager();
window.dashboard = dashboard;

// ===== TUTORIAL SYSTEM =====
let tutorialStep = 0;
const tutorialSteps = [
    { title: 'Welcome! 🇳🇬', content: 'JoshElectric Control helps you manage electrical loads for Nigerian homes and businesses.' },
    { title: 'Add Appliances', content: 'Enter appliance name, quantity, power rating, and daily usage hours. Use the suggestions for quick entry.' },
    { title: 'View Calculations', content: 'See automatic calculations for power, current, daily consumption, and monthly costs in Naira.' },
    { title: 'Get Recommendations', content: 'The system recommends breaker sizes, cable types, phase configuration, and solar potential.' },
    { title: 'Export & Save', content: 'Export reports as PDF, CSV, JSON, or Excel. Sign in to save data to the cloud.' }
];

function startTutorial() {
    tutorialStep = 0;
    showTutorialStep();
}

function showTutorialStep() {
    const overlay = document.getElementById('tutorialOverlay');
    const title = document.getElementById('tutorialTitle');
    const content = document.getElementById('tutorialContent');
    const nextBtn = document.getElementById('tutorialNext');
    const dots = document.getElementById('tutorialDots');
    
    if (!overlay || tutorialStep >= tutorialSteps.length) {
        if (overlay) overlay.style.display = 'none';
        localStorage.setItem('joshelectric_tutorial_completed', 'true');
        return;
    }
    
    overlay.style.display = 'block';
    title.textContent = tutorialSteps[tutorialStep].title;
    content.textContent = tutorialSteps[tutorialStep].content;
    nextBtn.textContent = tutorialStep === tutorialSteps.length - 1 ? 'Finish 🎉' : 'Next →';
    
    dots.innerHTML = tutorialSteps.map((_, i) => 
        `<span class="tutorial-dot${i === tutorialStep ? ' active' : ''}"></span>`
    ).join('');
}

document.getElementById('tutorialNext')?.addEventListener('click', () => {
    tutorialStep++;
    showTutorialStep();
});

document.getElementById('tutorialSkip')?.addEventListener('click', () => {
    document.getElementById('tutorialOverlay').style.display = 'none';
    localStorage.setItem('joshelectric_tutorial_completed', 'true');
});

// Show tutorial for first-time visitors
if (!localStorage.getItem('joshelectric_tutorial_completed')) {
    setTimeout(startTutorial, 2000);
}

// ===== GLOBAL FUNCTIONS =====
function viewPredictions() {
    window.location.href = 'pages/analytics.html';
}

function printRecommendations() {
    window.print();
}

function toggleFormTips() {
    const tips = document.getElementById('formTips');
    if (tips) tips.style.display = tips.style.display === 'none' ? 'block' : 'none';
}

// Export for HTML onclick handlers
window.startTutorial = startTutorial;
window.viewPredictions = viewPredictions;
window.printRecommendations = printRecommendations;
window.toggleFormTips = toggleFormTips;
window.sortTable = (col) => dashboard.sortTable(col);

console.log('🚀 JoshElectric Control v' + JOSH_CONFIG.version + ' initialized');
console.log('📡 API URL:', JOSH_CONFIG.apiUrl);
console.log('💾 Data source:', auth.isLoggedIn() ? 'Server + Local' : 'Local Only');