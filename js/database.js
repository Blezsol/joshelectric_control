// ============================================
// JOSH ELECTRIC CONTROL - DATABASE MANAGER
// IndexedDB Backend for Production
// ============================================

class DatabaseManager {
    constructor() {
        this.dbName = 'JoshElectricDB';
        this.dbVersion = 2;
        this.db = null;
        this.isReady = false;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('Database upgrade needed');

                // Appliances store
                if (!db.objectStoreNames.contains('appliances')) {
                    const applianceStore = db.createObjectStore('appliances', { keyPath: 'id' });
                    applianceStore.createIndex('name', 'name', { unique: false });
                    applianceStore.createIndex('dateAdded', 'dateAdded', { unique: false });
                }

                // Sessions store
                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
                    sessionStore.createIndex('date', 'date', { unique: false });
                }

                // Users store
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'id' });
                    userStore.createIndex('email', 'email', { unique: true });
                    userStore.createIndex('role', 'role', { unique: false });
                }

                // History store for analytics
                if (!db.objectStoreNames.contains('history')) {
                    const historyStore = db.createObjectStore('history', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    historyStore.createIndex('date', 'date', { unique: false });
                    historyStore.createIndex('type', 'type', { unique: false });
                }

                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                // Scenarios store for comparative analysis
                if (!db.objectStoreNames.contains('scenarios')) {
                    const scenarioStore = db.createObjectStore('scenarios', { keyPath: 'id' });
                    scenarioStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.isReady = true;
                console.log('Database initialized successfully');
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                reject(event.target.error);
            };

            request.onblocked = () => {
                console.warn('Database blocked - close other tabs');
                reject(new Error('Database blocked'));
            };
        });
    }

    // Generic CRUD Operations
    async add(storeName, data) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, id) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clear(storeName) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getByIndex(storeName, indexName, value) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async ensureReady() {
        if (!this.isReady) {
            await this.init();
        }
    }

    // Specific methods for JoshElectric
    async saveAppliances(appliances) {
        await this.ensureReady();
        const transaction = this.db.transaction(['appliances'], 'readwrite');
        const store = transaction.objectStore('appliances');
        
        // Clear existing and add all
        await this.clear('appliances');
        
        for (const appliance of appliances) {
            await new Promise((resolve, reject) => {
                const request = store.add(appliance);
                request.onsuccess = resolve;
                request.onerror = reject;
            });
        }
    }

    async getAppliances() {
        return await this.getAll('appliances');
    }

    async saveSession(session) {
        // Save to IndexedDB and localStorage as backup
        await this.add('sessions', session);
        this.syncToLocalStorage();
    }

    async getSessions() {
        return await this.getAll('sessions');
    }

    async saveUser(user) {
        return await this.put('users', user);
    }

    async getUserByEmail(email) {
        const users = await this.getByIndex('users', 'email', email);
        return users[0] || null;
    }

    async getAllUsers() {
        return await this.getAll('users');
    }

    async saveSetting(key, value) {
        return await this.put('settings', { key, value });
    }

    async getSetting(key) {
        const setting = await this.get('settings', key);
        return setting ? setting.value : null;
    }

    async addHistoryEntry(entry) {
        return await this.add('history', {
            ...entry,
            date: new Date().toISOString()
        });
    }

    async getHistory(limit = 30) {
        const history = await this.getAll('history');
        return history
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }

    async saveScenario(scenario) {
        return await this.add('scenarios', scenario);
    }

    async getScenarios() {
        return await this.getAll('scenarios');
    }

    syncToLocalStorage() {
        // Backup critical data to localStorage
        this.getAppliances().then(appliances => {
            if (appliances.length > 0) {
                localStorage.setItem('joshelectric_appliances', JSON.stringify(appliances));
            }
        });
        
        this.getSessions().then(sessions => {
            if (sessions.length > 0) {
                localStorage.setItem('joshelectric_sessions', JSON.stringify(sessions));
            }
        });
    }

    async exportAllData() {
        const data = {
            exportDate: new Date().toISOString(),
            version: '2.0',
            appliances: await this.getAppliances(),
            sessions: await this.getSessions(),
            scenarios: await this.getScenarios(),
            history: await this.getHistory(100)
        };
        return data;
    }

    async importData(data) {
        if (!data || !data.version) {
            throw new Error('Invalid data format');
        }

        if (data.appliances) {
            for (const app of data.appliances) {
                await this.put('appliances', app);
            }
        }

        if (data.sessions) {
            for (const session of data.sessions) {
                await this.put('sessions', session);
            }
        }

        if (data.scenarios) {
            for (const scenario of data.scenarios) {
                await this.put('scenarios', scenario);
            }
        }

        this.syncToLocalStorage();
    }
}

// Initialize database
const db = new DatabaseManager();
window.db = db;

// Initialize on load
db.init().then(() => {
    console.log('Database ready');
    // Load demo users if not exist
    db.getAllUsers().then(users => {
        if (users.length === 0) {
            const demoUsers = [
                { id: 1, firstName: 'Admin', lastName: 'User', email: 'admin@joshelectric.com', 
                  password: 'admin123', role: 'admin', company: 'JoshElectric Ltd.', 
                  createdAt: new Date().toISOString() },
                { id: 2, firstName: 'Engineer', lastName: 'User', email: 'engineer@joshelectric.com', 
                  password: 'eng123', role: 'engineer', company: 'JoshElectric Ltd.', 
                  createdAt: new Date().toISOString() },
                { id: 3, firstName: 'Demo', lastName: 'Client', email: 'demo@joshelectric.com', 
                  password: 'demo123', role: 'client', company: 'Private Residence', 
                  createdAt: new Date().toISOString() }
            ];
            demoUsers.forEach(user => db.saveUser(user));
        }
    });
}).catch(err => {
    console.warn('Database init failed, falling back to localStorage:', err);
});