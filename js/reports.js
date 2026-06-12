// ============================================
// JOSH ELECTRIC CONTROL - REPORT GENERATION
// ============================================

function getAppliances() {
    return JSON.parse(localStorage.getItem('joshelectric_appliances') || '[]');
}

function generateReport(type) {
    const appliances = getAppliances();
    
    if (appliances.length === 0) {
        showNotification('No load data available. Add appliances first.', 'warning');
        return;
    }
    
    showNotification('Generating report...', 'info');
    
    setTimeout(() => {
        switch(type) {
            case 'summary': generateSummaryReport(appliances); break;
            case 'audit': generateAuditReport(appliances); break;
            case 'compliance': generateComplianceReport(appliances); break;
            case 'recommendations': generateRecommendationsReport(appliances); break;
            default: generateSummaryReport(appliances);
        }
    }, 500);
}

function generateSummaryReport(appliances) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const totalPower = appliances.reduce((s, a) => s + a.totalPower, 0);
    const totalCurrent = appliances.reduce((s, a) => s + a.totalCurrent, 0);
    const totalMonthly = appliances.reduce((s, a) => s + a.monthlyCost, 0);
    
    // Header
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('JoshElectric Control', 14, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Load Summary Report', 14, 28);
    
    // Summary
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('Executive Summary', 14, 48);
    doc.setFontSize(9);
    doc.text(`Total Load: ${totalPower.toFixed(1)}W | Current: ${totalCurrent.toFixed(2)}A | Monthly: ${JOSH_CONFIG.currencySymbol}${totalMonthly.toFixed(2)}`, 14, 56);
    
    // Table
    const tableData = appliances.map((app, i) => [
        i + 1, app.name, app.quantity, `${app.powerInWatts.toFixed(1)}W`,
        `${app.hoursPerDay || 8}h`, `${app.totalPower.toFixed(1)}W`,
        `${JOSH_CONFIG.currencySymbol}${app.monthlyCost.toFixed(2)}`
    ]);
    
    doc.autoTable({
        startY: 62,
        head: [['S/N', 'Appliance', 'Qty', 'Power', 'Hrs/Day', 'Total Power', 'Monthly Cost']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 8 },
        styles: { fontSize: 8 }
    });
    
    doc.setFontSize(7);
    doc.setTextColor(128);
    doc.text(`Generated: ${new Date().toLocaleString()} | JoshElectric Control v${JOSH_CONFIG.version}`, 14, 290);
    
    doc.save(`JoshElectric_Summary_${new Date().toISOString().split('T')[0]}.pdf`);
    showNotification('Summary report downloaded!', 'success');
}

function generateAuditReport(appliances) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const totalMonthly = appliances.reduce((s, a) => s + a.monthlyCost, 0);
    const totalDailyKWh = appliances.reduce((s, a) => s + a.dailyKWh, 0);
    
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('Energy Audit Report', 14, 22);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Monthly Consumption: ${totalDailyKWh.toFixed(2)} kWh/day × 30 = ${(totalDailyKWh * 30).toFixed(2)} kWh`, 14, 48);
    doc.text(`Monthly Cost: ${JOSH_CONFIG.currencySymbol}${totalMonthly.toFixed(2)}`, 14, 56);
    doc.text(`Annual Projection: ${JOSH_CONFIG.currencySymbol}${(totalMonthly * 12).toFixed(2)}`, 14, 64);
    doc.text(`Carbon Footprint: ${(totalDailyKWh * 30 * 0.5).toFixed(1)} kg CO2/month`, 14, 72);
    
    doc.save(`JoshElectric_Audit_${new Date().toISOString().split('T')[0]}.pdf`);
    showNotification('Audit report downloaded!', 'success');
}

function generateComplianceReport(appliances) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const totalCurrent = appliances.reduce((s, a) => s + a.totalCurrent, 0);
    const currentWithSafety = totalCurrent * JOSH_CONFIG.safetyMargin;
    
    let rec = JOSH_CONFIG.cableSizes[0];
    for (let c of JOSH_CONFIG.cableSizes) {
        if (currentWithSafety <= c.maxAmps) { rec = c; break; }
    }
    
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('Compliance Certificate', 14, 22);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`System Voltage: ${JOSH_CONFIG.voltage}V`, 14, 48);
    doc.text(`Total Current: ${totalCurrent.toFixed(2)}A (${currentWithSafety.toFixed(2)}A with safety)`, 14, 56);
    doc.text(`Recommended Breaker: ${rec.breaker}`, 14, 64);
    doc.text(`Recommended Cable: ${rec.cable}`, 14, 72);
    doc.text(`Phase: ${totalCurrent < 100 ? 'Single Phase' : 'Three Phase'}`, 14, 80);
    doc.text(`Compliance: ${totalCurrent <= 200 ? 'PASS' : 'REQUIRES REVIEW'}`, 14, 88);
    
    doc.save(`JoshElectric_Compliance_${new Date().toISOString().split('T')[0]}.pdf`);
    showNotification('Compliance certificate downloaded!', 'success');
}

function generateRecommendationsReport(appliances) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const totalMonthly = appliances.reduce((s, a) => s + a.monthlyCost, 0);
    
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('Recommendations Report', 14, 22);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    const recommendations = [
        { title: 'LED Lighting', savings: totalMonthly * 0.08 },
        { title: 'Inverter AC', savings: totalMonthly * 0.15 },
        { title: 'Solar Installation', savings: totalMonthly * 0.40 },
        { title: 'Load Scheduling', savings: totalMonthly * 0.10 }
    ];
    
    let y = 48;
    recommendations.forEach(rec => {
        doc.text(`${rec.title}: Save up to ${JOSH_CONFIG.currencySymbol}${rec.savings.toFixed(0)}/month`, 14, y);
        y += 10;
    });
    
    doc.save(`JoshElectric_Recommendations_${new Date().toISOString().split('T')[0]}.pdf`);
    showNotification('Recommendations report downloaded!', 'success');
}

function quickExportCSV() {
    if (typeof dashboard !== 'undefined') {
        dashboard.exportCSV();
    } else {
        showNotification('Please go to Dashboard to export', 'warning');
    }
}

function quickExportPDF() {
    if (typeof dashboard !== 'undefined') {
        dashboard.exportPDF();
    } else {
        showNotification('Please go to Dashboard to export', 'warning');
    }
}

function quickExportJSON() {
    if (typeof dashboard !== 'undefined') {
        dashboard.exportJSON();
    } else {
        showNotification('Please go to Dashboard to export', 'warning');
    }
}

function quickExportExcel() {
    if (typeof dashboard !== 'undefined') {
        dashboard.exportExcel();
    } else {
        showNotification('Please go to Dashboard to export', 'warning');
    }
}

function printReport() {
    window.print();
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const icons = { success: 'check-circle', error: 'exclamation-circle', warning: 'exclamation-triangle', info: 'info-circle' };
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<i class="fas fa-${icons[type]}"></i> ${message}`;
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Export functions for HTML
window.generateReport = generateReport;
window.quickExportCSV = quickExportCSV;
window.quickExportPDF = quickExportPDF;
window.quickExportJSON = quickExportJSON;
window.quickExportExcel = quickExportExcel;
window.printReport = printReport;