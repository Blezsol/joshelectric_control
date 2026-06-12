// ============================================
// JOSH ELECTRIC CONTROL - LOAD MODELLING
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadCableSizingTable();
    updateVoltageField();
});

function updateVoltageField() {
    const vdVoltage = document.getElementById('vdVoltage');
    if (vdVoltage) vdVoltage.value = JOSH_CONFIG.voltage;
}

function analyzeSingleLoad() {
    const loadType = document.getElementById('loadType').value;
    const ratedPower = parseFloat(document.getElementById('ratedPower').value) || 0;
    const powerFactor = parseFloat(document.getElementById('powerFactor').value) || 0.85;
    const efficiency = (parseFloat(document.getElementById('efficiency').value) || 90) / 100;
    const hours = parseFloat(document.getElementById('operatingHours').value) || 8;
    const voltage = JOSH_CONFIG.voltage;
    
    if (ratedPower <= 0) {
        showNotification('Please enter a valid power rating', 'error');
        return;
    }
    
    if (powerFactor <= 0 || powerFactor > 1) {
        showNotification('Power factor must be between 0.1 and 1.0', 'error');
        return;
    }
    
    // Calculations
    const apparentPower = ratedPower / (powerFactor * efficiency);
    const reactivePower = apparentPower * Math.sin(Math.acos(Math.min(powerFactor, 0.99)));
    const actualCurrent = apparentPower / voltage;
    const inputPower = ratedPower / efficiency;
    const dailyEnergy = (inputPower * hours) / 1000;
    const monthlyCost = dailyEnergy * 30 * JOSH_CONFIG.tariffPerKWh;
    
    // Display results
    const elements = {
        apparentPower: document.getElementById('apparentPower'),
        reactivePower: document.getElementById('reactivePower'),
        actualCurrent: document.getElementById('actualCurrent'),
        inputPower: document.getElementById('inputPower'),
        dailyEnergy: document.getElementById('dailyEnergy'),
        loadMonthlyCost: document.getElementById('loadMonthlyCost')
    };
    
    if (elements.apparentPower) elements.apparentPower.textContent = apparentPower.toFixed(1) + ' VA';
    if (elements.reactivePower) elements.reactivePower.textContent = reactivePower.toFixed(1) + ' VAR';
    if (elements.actualCurrent) elements.actualCurrent.textContent = actualCurrent.toFixed(2) + ' A';
    if (elements.inputPower) elements.inputPower.textContent = inputPower.toFixed(1) + ' W';
    if (elements.dailyEnergy) elements.dailyEnergy.textContent = dailyEnergy.toFixed(2) + ' kWh';
    if (elements.loadMonthlyCost) elements.loadMonthlyCost.textContent = JOSH_CONFIG.currencySymbol + monthlyCost.toFixed(2);
    
    document.getElementById('singleLoadResults').style.display = 'block';
    showNotification('Load analysis complete!', 'success');
}

function calculateDiversity() {
    const sumMax = parseFloat(document.getElementById('sumMaxDemand').value) || 0;
    const systemMax = parseFloat(document.getElementById('systemMaxDemand').value) || 0;
    
    if (sumMax <= 0 || systemMax <= 0) {
        showNotification('Please enter valid values greater than zero', 'error');
        return;
    }
    
    if (systemMax > sumMax) {
        showNotification('System demand cannot exceed sum of individual demands', 'warning');
        return;
    }
    
    const diversity = sumMax / systemMax;
    document.getElementById('diversityFactorValue').textContent = diversity.toFixed(2);
    
    let interpretation = '';
    let color = '';
    
    if (diversity > 2.0) {
        interpretation = 'Excellent diversity factor. Loads are well distributed with minimal coincidence.';
        color = '#10b981';
    } else if (diversity > 1.5) {
        interpretation = 'Good diversity factor. Acceptable for most residential and commercial installations.';
        color = '#3b82f6';
    } else if (diversity > 1.2) {
        interpretation = 'Fair diversity factor. Some loads operate simultaneously. Consider load scheduling.';
        color = '#f59e0b';
    } else {
        interpretation = 'Low diversity factor. Most loads operate at the same time. Load management recommended.';
        color = '#ef4444';
    }
    
    const interpretationEl = document.getElementById('diversityInterpretation');
    if (interpretationEl) {
        interpretationEl.textContent = interpretation;
        interpretationEl.style.color = color;
    }
    
    document.getElementById('diversityResult').style.display = 'block';
    showNotification('Diversity factor calculated!', 'success');
}

function calculateVoltageDrop() {
    const current = parseFloat(document.getElementById('vdCurrent').value) || 0;
    const length = parseFloat(document.getElementById('vdLength').value) || 0;
    const cableSize = parseFloat(document.getElementById('vdCableSize').value) || 2.5;
    const voltage = JOSH_CONFIG.voltage;
    
    if (current <= 0 || length <= 0) {
        showNotification('Please enter valid values', 'error');
        return;
    }
    
    // Copper resistivity: 0.0172 Ω·mm²/m at 20°C
    const resistivity = 0.0172;
    const resistance = (resistivity * length) / cableSize;
    const voltageDrop = current * resistance * 2; // Two-way (there and back)
    const percentDrop = (voltageDrop / voltage) * 100;
    const endVoltage = voltage - voltageDrop;
    
    document.getElementById('voltageDropValue').textContent = voltageDrop.toFixed(2) + ' V';
    document.getElementById('voltageDropPercent').textContent = percentDrop.toFixed(2) + '%';
    document.getElementById('endVoltage').textContent = endVoltage.toFixed(1) + ' V';
    
    const statusEl = document.getElementById('voltageDropStatus');
    if (statusEl) {
        if (percentDrop <= 3) {
            statusEl.textContent = '✓ Acceptable (≤3%)';
            statusEl.style.color = '#10b981';
        } else if (percentDrop <= 5) {
            statusEl.textContent = '⚠ Marginal (3-5%)';
            statusEl.style.color = '#f59e0b';
        } else {
            statusEl.textContent = '✗ Excessive (>5%)';
            statusEl.style.color = '#ef4444';
        }
    }
    
    document.getElementById('voltageDropResult').style.display = 'block';
    showNotification('Voltage drop calculated!', 'success');
}

function loadCableSizingTable() {
    const tbody = document.getElementById('cableSizingTable');
    if (!tbody) return;
    
    const applications = [
        'Lighting circuits', 'Lighting, socket outlets', 'Socket outlets, small AC',
        'Socket outlets, AC units', 'Sub-main, larger AC', 'Sub-main, distribution',
        'Main distribution', 'Main distribution', 'Main incomer', 'Main incomer',
        'Main incomer (large)', 'Main incomer (large)', 'Industrial main', 'Industrial main'
    ];
    
    tbody.innerHTML = JOSH_CONFIG.cableSizes.map((cable, i) => `
        <tr>
            <td><strong>${cable.cable}</strong></td>
            <td>${cable.maxAmps}A</td>
            <td><span class="badge primary">${cable.breaker}</span></td>
            <td>${applications[i] || 'General purpose'}</td>
        </tr>
    `).join('');
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<i class="fas fa-${icons[type]}"></i> ${message}`;
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}