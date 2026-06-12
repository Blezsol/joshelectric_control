// ============================================
// JOSH ELECTRIC CONTROL - HISTORY MANAGEMENT
// ============================================

class HistoryManager {
    constructor() {
        this.sessions = [];
        this.init();
    }

    async init() {
        await this.loadSessions();
        this.renderSessions();
    }

    async loadSessions() {
        try {
            if (typeof db !== 'undefined' && db.isReady) {
                this.sessions = await db.getSessions();
            }
        } catch (e) {
            this.sessions = JSON.parse(localStorage.getItem('joshelectric_sessions') || '[]');
        }
    }

    renderSessions(filteredSessions = null) {
        const container = document.getElementById('sessionsList');
        const emptyState = document.getElementById('emptyHistory');
        const sessions = filteredSessions || this.sessions;

        if (!container) return;

        if (sessions.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = sessions.map(session => {
            const date = new Date(session.date);
            const dateStr = date.toLocaleDateString('en-NG', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
            <div class="session-card">
                <div class="session-header">
                    <span class="session-title">
                        <i class="fas fa-folder" style="color: #3b82f6; margin-right: 8px;"></i>
                        ${session.name}
                    </span>
                    <span class="session-date">${dateStr}</span>
                </div>
                <div class="session-stats">
                    <div class="session-stat">
                        <span class="label">Total Load</span>
                        <span class="value">${(session.totalPower || 0).toFixed(1)} W</span>
                    </div>
                    <div class="session-stat">
                        <span class="label">Current Draw</span>
                        <span class="value">${(session.totalCurrent || 0).toFixed(2)} A</span>
                    </div>
                    <div class="session-stat">
                        <span class="label">Monthly Cost</span>
                        <span class="value">${JOSH_CONFIG.currencySymbol}${(session.monthlyCost || 0).toFixed(2)}</span>
                    </div>
                    <div class="session-stat">
                        <span class="label">Appliances</span>
                        <span class="value">${session.appliances ? session.appliances.length : 0}</span>
                    </div>
                </div>
                <div style="margin-top: 12px; display: flex; gap: 8px;">
                    <button class="btn btn-sm btn-primary" onclick="historyManager.loadToDashboard(${session.id})">
                        <i class="fas fa-download"></i> Load
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="historyManager.viewDetails(${session.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="historyManager.deleteSession(${session.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>`;
        }).join('');
    }

    loadToDashboard(id) {
        const session = this.sessions.find(s => s.id === id);
        if (!session) return;

        if (confirm(`Load "${session.name}" to dashboard? Current data will be replaced.`)) {
            localStorage.setItem('joshelectric_appliances', JSON.stringify(session.appliances || []));
            showNotification('Session loaded! Redirecting to dashboard...', 'success');
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1000);
        }
    }

    viewDetails(id) {
        const session = this.sessions.find(s => s.id === id);
        if (!session) return;

        const modal = document.getElementById('sessionDetailModal');
        const title = document.getElementById('sessionDetailTitle');
        const content = document.getElementById('sessionDetailContent');

        if (!modal || !title || !content) return;

        title.textContent = session.name;
        
        let html = `
            <p><strong>Date:</strong> ${new Date(session.date).toLocaleString()}</p>
            <p><strong>Total Load:</strong> ${(session.totalPower || 0).toFixed(1)} W</p>
            <p><strong>Total Current:</strong> ${(session.totalCurrent || 0).toFixed(2)} A</p>
            <p><strong>Monthly Cost:</strong> ${JOSH_CONFIG.currencySymbol}${(session.monthlyCost || 0).toFixed(2)}</p>
            <hr>
            <h4>Appliances (${session.appliances ? session.appliances.length : 0})</h4>
        `;

        if (session.appliances && session.appliances.length > 0) {
            html += '<table class="data-table"><thead><tr>';
            html += '<th>Name</th><th>Qty</th><th>Power (W)</th><th>Hours/Day</th><th>Monthly Cost</th>';
            html += '</tr></thead><tbody>';

            session.appliances.forEach(app => {
                html += `<tr>
                    <td>${app.name}</td>
                    <td>${app.quantity}</td>
                    <td>${(app.powerInWatts || 0).toFixed(1)}</td>
                    <td>${app.hoursPerDay || 8}</td>
                    <td>${JOSH_CONFIG.currencySymbol}${(app.monthlyCost || 0).toFixed(2)}</td>
                </tr>`;
            });

            html += '</tbody></table>';
        }

        content.innerHTML = html;
        modal.style.display = 'flex';
    }

    deleteSession(id) {
        if (!confirm('Delete this session permanently?')) return;

        this.sessions = this.sessions.filter(s => s.id !== id);
        localStorage.setItem('joshelectric_sessions', JSON.stringify(this.sessions));
        
        if (typeof db !== 'undefined') {
            db.delete('sessions', id).catch(() => {});
        }

        this.renderSessions();
        showNotification('Session deleted', 'info');
    }

    filterSessions(searchTerm = null, sortBy = null) {
        const searchInput = document.getElementById('searchHistory');
        const sortSelect = document.getElementById('sortHistory');
        
        const term = searchTerm || (searchInput ? searchInput.value.toLowerCase() : '');
        const sort = sortBy || (sortSelect ? sortSelect.value : 'date-desc');

        let filtered = [...this.sessions];

        // Search filter
        if (term) {
            filtered = filtered.filter(s => s.name.toLowerCase().includes(term));
        }

        // Sort
        switch(sort) {
            case 'date-asc':
                filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'name-asc':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'cost-desc':
                filtered.sort((a, b) => (b.monthlyCost || 0) - (a.monthlyCost || 0));
                break;
            default:
                filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        this.renderSessions(filtered);
        showNotification(`Found ${filtered.length} session(s)`, 'info');
    }

    exportAllSessions() {
        if (this.sessions.length === 0) {
            showNotification('No sessions to export', 'warning');
            return;
        }

        const data = {
            exportDate: new Date().toISOString(),
            totalSessions: this.sessions.length,
            sessions: this.sessions
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `JoshElectric_Sessions_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('All sessions exported!', 'success');
    }

    clearAllSessions() {
        if (this.sessions.length === 0) return;
        
        if (confirm(`Delete ALL ${this.sessions.length} sessions? This cannot be undone.`)) {
            this.sessions = [];
            localStorage.removeItem('joshelectric_sessions');
            
            if (typeof db !== 'undefined') {
                db.clear('sessions').catch(() => {});
            }

            this.renderSessions();
            showNotification('All sessions cleared', 'info');
        }
    }
}

const historyManager = new HistoryManager();
window.historyManager = historyManager;

function closeSessionDetail() {
    document.getElementById('sessionDetailModal').style.display = 'none';
}

function filterSessions() {
    historyManager.filterSessions();
}

function exportAllSessions() {
    historyManager.exportAllSessions();
}

function clearAllSessions() {
    historyManager.clearAllSessions();
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