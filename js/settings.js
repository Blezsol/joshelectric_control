// ============================================
// JOSH ELECTRIC CONTROL - SETTINGS MANAGEMENT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadCurrentSettings();
    updateDarkModeToggle();
});

function loadCurrentSettings() {
    // Electrical standards
    const voltageEl = document.getElementById('settingsVoltage');
    const frequencyEl = document.getElementById('settingsFrequency');
    const safetyEl = document.getElementById('settingsSafetyMargin');
    
    if (voltageEl) voltageEl.value = JOSH_CONFIG.voltage;
    if (frequencyEl) frequencyEl.value = JOSH_CONFIG.frequency;
    if (safetyEl) safetyEl.value = ((JOSH_CONFIG.safetyMargin - 1) * 100).toFixed(0);
    
    // Tariff
    const currencyEl = document.getElementById('settingsCurrency');
    const tariffEl = document.getElementById('settingsTariff');
    
    if (currencyEl) currencyEl.value = JOSH_CONFIG.currency;
    if (tariffEl) tariffEl.value = JOSH_CONFIG.tariffPerKWh;
    
    // Display settings
    const autoSaveEl = document.getElementById('autoSaveToggle');
    const notifEl = document.getElementById('notificationsToggle');
    
    if (autoSaveEl) autoSaveEl.checked = JOSH_CONFIG.defaults.autoSave !== false;
    if (notifEl) notifEl.checked = JOSH_CONFIG.defaults.notifications !== false;
}

function updateDarkModeToggle() {
    const toggle = document.getElementById('darkModeToggle');
    if (toggle && typeof darkMode !== 'undefined') {
        toggle.checked = darkMode.isDark;
    }
}

function saveAllSettings() {
    // Electrical standards
    JOSH_CONFIG.voltage = parseInt(document.getElementById('settingsVoltage')?.value) || 230;
    JOSH_CONFIG.frequency = parseInt(document.getElementById('settingsFrequency')?.value) || 50;
    JOSH_CONFIG.safetyMargin = 1 + (parseInt(document.getElementById('settingsSafetyMargin')?.value) || 25) / 100;
    
    // Tariff
    JOSH_CONFIG.currency = document.getElementById('settingsCurrency')?.value || 'NGN';
    JOSH_CONFIG.tariffPerKWh = parseFloat(document.getElementById('settingsTariff')?.value) || 48;
    
    // Currency symbol
    const symbols = { 'NGN': '₦', 'USD': '$', 'EUR': '€', 'GBP': '£', 'GHS': '₵' };
    JOSH_CONFIG.currencySymbol = symbols[JOSH_CONFIG.currency] || '₦';
    
    // Display settings
    JOSH_CONFIG.defaults.autoSave = document.getElementById('autoSaveToggle')?.checked;
    JOSH_CONFIG.defaults.notifications = document.getElementById('notificationsToggle')?.checked;
    
    // Save to localStorage
    saveConfig();
    
    // Save to IndexedDB
    if (typeof db !== 'undefined') {
        db.saveSetting('voltage', JOSH_CONFIG.voltage).catch(() => {});
        db.saveSetting('tariff', JOSH_CONFIG.tariffPerKWh).catch(() => {});
        db.saveSetting('currency', JOSH_CONFIG.currency).catch(() => {});
    }
    
    showNotification('Settings saved successfully! Changes will apply immediately.', 'success');
    
    // Refresh dashboard data if open
    if (window.opener && window.opener.dashboard) {
        window.opener.dashboard.loadSettings();
        window.opener.dashboard.renderAll();
    }
}

function toggleDarkMode() {
    if (typeof darkMode !== 'undefined') {
        darkMode.toggle();
    }
}

function exportAllData() {
    if (typeof db !== 'undefined' && db.isReady) {
        db.exportAllData().then(data => {
            downloadJSON(data, `JoshElectric_FullBackup_${new Date().toISOString().split('T')[0]}.json`);
            showNotification('All data exported successfully!', 'success');
        }).catch(() => {
            exportFromLocalStorage();
        });
    } else {
        exportFromLocalStorage();
    }
}

function exportFromLocalStorage() {
    const data = {
        exportDate: new Date().toISOString(),
        version: JOSH_CONFIG.version,
        appliances: JSON.parse(localStorage.getItem('joshelectric_appliances') || '[]'),
        sessions: JSON.parse(localStorage.getItem('joshelectric_sessions') || '[]'),
        config: {
            voltage: JOSH_CONFIG.voltage,
            frequency: JOSH_CONFIG.frequency,
            tariffPerKWh: JOSH_CONFIG.tariffPerKWh,
            currency: JOSH_CONFIG.currency
        }
    };
    
    downloadJSON(data, `JoshElectric_Backup_${new Date().toISOString().split('T')[0]}.json`);
    showNotification('Data exported from localStorage!', 'success');
}

function importData() {
    document.getElementById('importFileInput')?.click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.appliances) {
                localStorage.setItem('joshelectric_appliances', JSON.stringify(data.appliances));
            }
            if (data.sessions) {
                localStorage.setItem('joshelectric_sessions', JSON.stringify(data.sessions));
            }
            if (data.config) {
                Object.assign(JOSH_CONFIG, data.config);
                saveConfig();
            }
            
            if (typeof db !== 'undefined' && data) {
                db.importData(data).catch(() => {});
            }
            
            showNotification('Data imported successfully! Reloading...', 'success');
            setTimeout(() => location.reload(), 1500);
        } catch (error) {
            showNotification('Invalid file format. Please use a valid JSON backup.', 'error');
        }
    };
    reader.readAsText(file);
}

function resetAllData() {
    if (confirm('WARNING: This will delete ALL data including appliances, sessions, and settings. This cannot be undone. Continue?')) {
        if (confirm('FINAL WARNING: All your data will be permanently deleted. Are you absolutely sure?')) {
            // Clear localStorage
            localStorage.removeItem('joshelectric_appliances');
            localStorage.removeItem('joshelectric_sessions');
            localStorage.removeItem('joshelectric_config');
            localStorage.removeItem('joshelectric_current_user');
            localStorage.removeItem('joshelectric_remembered');
            localStorage.removeItem('joshelectric_visited');
            
            // Clear IndexedDB
            if (typeof db !== 'undefined') {
                ['appliances', 'sessions', 'history', 'scenarios', 'settings'].forEach(store => {
                    db.clear(store).catch(() => {});
                });
            }
            
            showNotification('All data reset. Reloading...', 'info');
            setTimeout(() => location.href = '../index.html', 1500);
        }
    }
}

function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    }, 4000);
}

// Export for HTML onclick handlers
window.saveAllSettings = saveAllSettings;
window.toggleDarkMode = toggleDarkMode;
window.exportAllData = exportAllData;
window.importData = importData;
window.handleFileImport = handleFileImport;
window.resetAllData = resetAllData;