// ============================================
// JOSH ELECTRIC CONTROL - DATABASE CONNECTION
// PostgreSQL with Render
// ============================================

const { Pool } = require('pg');

// Use DATABASE_URL from Render, or individual params
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
    console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
    process.exit(-1);
});

// ===== INITIALIZE TABLES =====
async function initializeDatabase() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'client',
                company VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Appliances table
        await client.query(`
            CREATE TABLE IF NOT EXISTS appliances (
                id BIGINT PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                power_in_watts DECIMAL(10,2) NOT NULL,
                current_in_amps DECIMAL(10,2) NOT NULL,
                hours_per_day DECIMAL(4,1) DEFAULT 8,
                total_power DECIMAL(10,2) NOT NULL,
                total_current DECIMAL(10,2) NOT NULL,
                daily_kwh DECIMAL(10,2) NOT NULL,
                monthly_cost DECIMAL(10,2) NOT NULL,
                voltage INTEGER DEFAULT 230,
                date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Sessions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS sessions (
                id BIGINT PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                total_power DECIMAL(10,2),
                total_current DECIMAL(10,2),
                monthly_cost DECIMAL(10,2),
                appliances_data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Settings table
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_settings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
                voltage INTEGER DEFAULT 230,
                frequency INTEGER DEFAULT 50,
                tariff_per_kwh DECIMAL(10,2) DEFAULT 48.00,
                currency VARCHAR(10) DEFAULT 'NGN',
                safety_margin DECIMAL(3,2) DEFAULT 1.25,
                theme VARCHAR(20) DEFAULT 'light',
                auto_save BOOLEAN DEFAULT true,
                notifications BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // History table for analytics
        await client.query(`
            CREATE TABLE IF NOT EXISTS load_history (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                total_kwh DECIMAL(10,2) NOT NULL,
                total_cost DECIMAL(10,2) NOT NULL,
                appliance_count INTEGER,
                record_date DATE DEFAULT CURRENT_DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create indexes
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_appliances_user ON appliances(user_id);
            CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_history_user_date ON load_history(user_id, record_date);
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        `);

        await client.query('COMMIT');
        console.log('✅ Database tables initialized successfully');
        
        // Create demo users if not exist
        await createDemoUsers(client);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Database initialization error:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function createDemoUsers(client) {
    const bcrypt = require('bcryptjs');
    
    const demoUsers = [
        { firstName: 'Admin', lastName: 'User', email: 'admin@joshelectric.com', password: 'admin123', role: 'admin' },
        { firstName: 'Engineer', lastName: 'User', email: 'engineer@joshelectric.com', password: 'eng123', role: 'engineer' },
        { firstName: 'Demo', lastName: 'Client', email: 'demo@joshelectric.com', password: 'demo123', role: 'client' }
    ];

    for (const user of demoUsers) {
        const exists = await client.query('SELECT id FROM users WHERE email = $1', [user.email]);
        
        if (exists.rows.length === 0) {
            const hash = await bcrypt.hash(user.password, 10);
            await client.query(
                `INSERT INTO users (first_name, last_name, email, password_hash, role) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [user.firstName, user.lastName, user.email, hash, user.role]
            );
            console.log(`✅ Demo user created: ${user.email}`);
        }
    }
}

// ===== HELPER FUNCTIONS =====
async function query(text, params) {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
        console.log('Query executed:', { text: text.substring(0, 50), duration, rows: res.rowCount });
    }
    
    return res;
}

async function getClient() {
    const client = await pool.connect();
    return client;
}

// Initialize on startup
initializeDatabase().catch(console.error);

module.exports = {
    query,
    getClient,
    pool,
    initializeDatabase
};