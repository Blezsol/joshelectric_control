// ============================================
// JOSH ELECTRIC CONTROL - GLOBAL CONFIGURATION
// With API Integration for Render Backend
// ============================================

const JOSH_CONFIG = {
    // Company Info
    companyName: 'JoshElectric Control',
    companyShort: 'JoshElectric',
    version: '3.0.0',
    buildDate: '2025-06-12',
    
    // API Configuration
    apiUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 
        'http://localhost:10000/api' : 
        'https://joshelectric-control.onrender.com/api',
    
    // Electrical Standards (Nigerian Default)
    voltage: 230,
    frequency: 50,
    tariffPerKWh: 48,
    currency: 'NGN',
    currencySymbol: '₦',
    safetyMargin: 1.25,
    
    // Cable Sizing Table (IEC Standard)
    cableSizes: [
        { maxAmps: 6, cable: "1.5mm²", breaker: "6A" },
        { maxAmps: 10, cable: "2.5mm²", breaker: "10A" },
        { maxAmps: 16, cable: "2.5mm²", breaker: "16A" },
        { maxAmps: 20, cable: "4mm²", breaker: "20A" },
        { maxAmps: 25, cable: "4mm²", breaker: "25A" },
        { maxAmps: 32, cable: "6mm²", breaker: "32A" },
        { maxAmps: 40, cable: "10mm²", breaker: "40A" },
        { maxAmps: 50, cable: "10mm²", breaker: "50A" },
        { maxAmps: 63, cable: "16mm²", breaker: "63A" },
        { maxAmps: 80, cable: "25mm²", breaker: "80A" },
        { maxAmps: 100, cable: "35mm²", breaker: "100A" },
        { maxAmps: 125, cable: "50mm²", breaker: "125A" },
        { maxAmps: 160, cable: "70mm²", breaker: "160A" },
        { maxAmps: 200, cable: "95mm²", breaker: "200A" }
    ],
    
    // Default Settings
    defaults: {
        theme: 'light',
        autoSave: true,
        notifications: true,
        dailyHours: 8,
        tutorialCompleted: false
    },
    
    // Energy Tips
    tips: [
        "Replace incandescent bulbs with LED to save up to 80% on lighting costs.",
        "Unplug appliances when not in use to avoid phantom power consumption.",
        "Use natural light during the day to reduce lighting costs.",
        "Set air conditioner temperature to 24-26°C for optimal efficiency.",
        "Clean AC filters monthly for better cooling and lower energy use.",
        "Consider solar panels to reduce dependency on grid electricity.",
        "Run heavy appliances like washing machines during off-peak hours.",
        "Use power strips to easily disconnect multiple devices at once.",
        "Regular maintenance of electrical appliances improves efficiency.",
        "Insulate your home to reduce cooling and heating costs."
    ],
    
    // Appliance Presets (Common Nigerian Appliances)
    appliancePresets: [
        { name: "Air Conditioner (1HP)", power: 1000, typicalHours: 8 },
        { name: "Air Conditioner (1.5HP)", power: 1500, typicalHours: 8 },
        { name: "Air Conditioner (2HP)", power: 2000, typicalHours: 8 },
        { name: "Refrigerator (Medium)", power: 200, typicalHours: 24 },
        { name: "Freezer (Chest)", power: 300, typicalHours: 24 },
        { name: "Electric Water Heater", power: 2000, typicalHours: 3 },
        { name: "Washing Machine", power: 500, typicalHours: 2 },
        { name: "Electric Cooker (2 Plates)", power: 3000, typicalHours: 3 },
        { name: "Microwave Oven", power: 1200, typicalHours: 1 },
        { name: "LED Bulb (10W)", power: 10, typicalHours: 8 },
        { name: "LED Bulb (15W)", power: 15, typicalHours: 8 },
        { name: "Ceiling Fan", power: 75, typicalHours: 12 },
        { name: "Standing Fan", power: 60, typicalHours: 10 },
        { name: "Television (32\" LED)", power: 50, typicalHours: 8 },
        { name: "Television (55\" LED)", power: 100, typicalHours: 8 },
        { name: "Desktop Computer", power: 200, typicalHours: 8 },
        { name: "Laptop", power: 65, typicalHours: 8 },
        { name: "Phone Charger", power: 5, typicalHours: 4 },
        { name: "Electric Iron", power: 1200, typicalHours: 1 },
        { name: "Pumping Machine (1HP)", power: 750, typicalHours: 2 },
        { name: "Pumping Machine (2HP)", power: 1500, typicalHours: 2 },
        { name: "Electric Kettle", power: 1500, typicalHours: 1 },
        { name: "Blender", power: 500, typicalHours: 0.5 },
        { name: "Home Theater System", power: 150, typicalHours: 4 },
        { name: "DSTV Decoder", power: 30, typicalHours: 12 }
    ],

    // ===== API HELPER METHODS =====
    
    // Get auth token from localStorage
    getToken() {
        return localStorage.getItem('joshelectric_token');
    },
    
    // Set auth token
    setToken(token) {
        if (token) {
            localStorage.setItem('joshelectric_token', token);
        }
    },
    
    // Remove auth token
    removeToken() {
        localStorage.removeItem('joshelectric_token');
    },
    
    // Check if user has a valid token
    hasToken() {
        return !!this.getToken();
    },
    
    // Make API call with automatic token handling
    async apiCall(endpoint, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        };
        
        const config = {
            ...options,
            headers
        };
        
        try {
            const response = await fetch(`${this.apiUrl}${endpoint}`, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `API call failed with status ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error.message);
            throw error;
        }
    },
    
    // Check API health
    async checkApiHealth() {
        try {
            const data = await this.apiCall('/health');
            return data.status === 'ok';
        } catch (error) {
            console.warn('API health check failed:', error.message);
            return false;
        }
    },
    
    // Sync appliances to server
    async syncAppliances(appliances) {
        try {
            const data = await this.apiCall('/appliances/bulk', {
                method: 'POST',
                body: JSON.stringify({ appliances })
            });
            console.log('✅ Appliances synced to server:', data.count || 0);
            return data;
        } catch (error) {
            console.warn('⚠️ Failed to sync appliances:', error.message);
            return null;
        }
    },
    
    // Load appliances from server
    async loadAppliances() {
        try {
            const data = await this.apiCall('/appliances');
            if (data.appliances && data.appliances.length > 0) {
                return data.appliances.map(app => ({
                    id: app.id,
                    name: app.name,
                    quantity: app.quantity,
                    powerInWatts: parseFloat(app.power_in_watts),
                    currentInAmps: parseFloat(app.current_in_amps),
                    hoursPerDay: parseFloat(app.hours_per_day) || 8,
                    totalPower: parseFloat(app.total_power),
                    totalCurrent: parseFloat(app.total_current),
                    dailyKWh: parseFloat(app.daily_kwh),
                    monthlyCost: parseFloat(app.monthly_cost),
                    voltage: app.voltage || this.voltage,
                    dateAdded: app.date_added || new Date().toISOString()
                }));
            }
            return [];
        } catch (error) {
            console.warn('⚠️ Failed to load appliances from server:', error.message);
            return [];
        }
    },
    
    // Sync session to server
    async syncSession(session) {
        try {
            await this.apiCall('/sessions', {
                method: 'POST',
                body: JSON.stringify(session)
            });
            console.log('✅ Session synced to server');
            return true;
        } catch (error) {
            console.warn('⚠️ Failed to sync session:', error.message);
            return false;
        }
    },
    
    // Load sessions from server
    async loadSessions() {
        try {
            const data = await this.apiCall('/sessions');
            return data.sessions || [];
        } catch (error) {
            console.warn('⚠️ Failed to load sessions:', error.message);
            return [];
        }
    },
    
    // Load user settings from server
    async loadUserSettings() {
        try {
            const data = await this.apiCall('/settings');
            if (data.settings) {
                const s = data.settings;
                this.voltage = s.voltage || this.voltage;
                this.frequency = s.frequency || this.frequency;
                this.tariffPerKWh = parseFloat(s.tariff_per_kwh) || this.tariffPerKWh;
                this.currency = s.currency || this.currency;
                this.safetyMargin = parseFloat(s.safety_margin) || this.safetyMargin;
                
                const symbols = { 'NGN': '₦', 'USD': '$', 'EUR': '€', 'GBP': '£', 'GHS': '₵' };
                this.currencySymbol = symbols[this.currency] || '₦';
                
                this.defaults.theme = s.theme || this.defaults.theme;
                this.defaults.autoSave = s.auto_save !== undefined ? s.auto_save : this.defaults.autoSave;
                this.defaults.notifications = s.notifications !== undefined ? s.notifications : this.defaults.notifications;
            }
        } catch (error) {
            console.warn('⚠️ Failed to load settings from server:', error.message);
        }
    },
    
    // Sync settings to server
    async syncSettings() {
        try {
            await this.apiCall('/settings', {
                method: 'PUT',
                body: JSON.stringify({
                    voltage: this.voltage,
                    frequency: this.frequency,
                    tariffPerKWh: this.tariffPerKWh,
                    currency: this.currency,
                    safetyMargin: this.safetyMargin,
                    theme: this.defaults.theme,
                    autoSave: this.defaults.autoSave,
                    notifications: this.defaults.notifications
                })
            });
            console.log('✅ Settings synced to server');
        } catch (error) {
            console.warn('⚠️ Failed to sync settings:', error.message);
        }
    },
    
    // Initialize connection check
    isOnline: navigator.onLine,
    
    // Update online status
    updateOnlineStatus() {
        this.isOnline = navigator.onLine;
    }
};

// ===== LOAD CONFIG FROM LOCAL STORAGE =====
function loadConfig() {
    const saved = localStorage.getItem('joshelectric_config');
    if (saved) {
        try {
            const config = JSON.parse(saved);
            JOSH_CONFIG.voltage = config.voltage || JOSH_CONFIG.voltage;
            JOSH_CONFIG.frequency = config.frequency || JOSH_CONFIG.frequency;
            JOSH_CONFIG.tariffPerKWh = config.tariffPerKWh || JOSH_CONFIG.tariffPerKWh;
            JOSH_CONFIG.currency = config.currency || JOSH_CONFIG.currency;
            JOSH_CONFIG.safetyMargin = config.safetyMargin || JOSH_CONFIG.safetyMargin;
            updateCurrencySymbol();
        } catch (e) {
            console.warn('Failed to load config, using defaults');
        }
    }
}

// ===== SAVE CONFIG TO LOCAL STORAGE =====
function saveConfig() {
    localStorage.setItem('joshelectric_config', JSON.stringify({
        voltage: JOSH_CONFIG.voltage,
        frequency: JOSH_CONFIG.frequency,
        tariffPerKWh: JOSH_CONFIG.tariffPerKWh,
        currency: JOSH_CONFIG.currency,
        safetyMargin: JOSH_CONFIG.safetyMargin
    }));
    
    // Also sync to server if logged in
    if (JOSH_CONFIG.hasToken()) {
        JOSH_CONFIG.syncSettings().catch(() => {});
    }
}

// ===== UPDATE CURRENCY SYMBOL =====
function updateCurrencySymbol() {
    const symbols = {
        'NGN': '₦',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'GHS': '₵',
        'ZAR': 'R'
    };
    JOSH_CONFIG.currencySymbol = symbols[JOSH_CONFIG.currency] || '₦';
}

// ===== ONLINE/OFFLINE LISTENERS =====
window.addEventListener('online', () => {
    JOSH_CONFIG.updateOnlineStatus();
    console.log('🌐 Back online');
    showNotification ? showNotification('Back online! Syncing data...', 'success') : null;
});

window.addEventListener('offline', () => {
    JOSH_CONFIG.updateOnlineStatus();
    console.log('📡 Offline - using local data');
    showNotification ? showNotification('You are offline. Changes saved locally.', 'warning') : null;
});

// Load config on startup
loadConfig();