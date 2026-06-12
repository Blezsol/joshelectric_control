// ============================================
// JOSH ELECTRIC CONTROL - APPLIANCE ROUTES
// ============================================

const express = require('express');
const { authenticate, optionalAuth } = require('../middleware/auth');
const db = require('../database/db');

const router = express.Router();

// ===== GET ALL APPLIANCES =====
router.get('/', optionalAuth, async (req, res) => {
    try {
        let result;
        
        if (req.user) {
            result = await db.query(
                'SELECT * FROM appliances WHERE user_id = $1 ORDER BY created_at DESC',
                [req.user.id]
            );
        } else {
            // Return demo data for non-authenticated users
            result = await db.query(
                "SELECT * FROM appliances WHERE user_id = (SELECT id FROM users WHERE email = 'demo@joshelectric.com' LIMIT 1) ORDER BY created_at DESC"
            );
        }

        res.json({ appliances: result.rows });
    } catch (error) {
        console.error('Get appliances error:', error);
        res.status(500).json({ error: 'Failed to fetch appliances' });
    }
});

// ===== SAVE ALL APPLIANCES (Bulk) =====
router.post('/bulk', authenticate, async (req, res) => {
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        // Delete existing appliances for user
        await client.query('DELETE FROM appliances WHERE user_id = $1', [req.user.id]);
        
        // Insert new appliances
        const { appliances } = req.body;
        
        for (const app of appliances) {
            await client.query(
                `INSERT INTO appliances (id, user_id, name, quantity, power_in_watts, current_in_amps, 
                 hours_per_day, total_power, total_current, daily_kwh, monthly_cost, voltage, date_added)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                 ON CONFLICT (id) DO UPDATE SET
                 name = EXCLUDED.name, quantity = EXCLUDED.quantity, 
                 power_in_watts = EXCLUDED.power_in_watts, current_in_amps = EXCLUDED.current_in_amps,
                 hours_per_day = EXCLUDED.hours_per_day, total_power = EXCLUDED.total_power,
                 total_current = EXCLUDED.total_current, daily_kwh = EXCLUDED.daily_kwh,
                 monthly_cost = EXCLUDED.monthly_cost, updated_at = CURRENT_TIMESTAMP`,
                [app.id, req.user.id, app.name, app.quantity, app.powerInWatts, app.currentInAmps,
                 app.hoursPerDay || 8, app.totalPower, app.totalCurrent, app.dailyKWh, app.monthlyCost,
                 app.voltage || 230, app.dateAdded || new Date().toISOString()]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Appliances saved successfully', count: appliances.length });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Bulk save error:', error);
        res.status(500).json({ error: 'Failed to save appliances' });
    } finally {
        client.release();
    }
});

// ===== ADD SINGLE APPLIANCE =====
router.post('/', authenticate, async (req, res) => {
    try {
        const app = req.body;
        
        await db.query(
            `INSERT INTO appliances (id, user_id, name, quantity, power_in_watts, current_in_amps, 
             hours_per_day, total_power, total_current, daily_kwh, monthly_cost, voltage)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [app.id || Date.now(), req.user.id, app.name, app.quantity, app.powerInWatts, 
             app.currentInAmps, app.hoursPerDay || 8, app.totalPower, app.totalCurrent, 
             app.dailyKWh, app.monthlyCost, app.voltage || 230]
        );

        res.status(201).json({ message: 'Appliance added successfully' });
    } catch (error) {
        console.error('Add appliance error:', error);
        res.status(500).json({ error: 'Failed to add appliance' });
    }
});

// ===== DELETE APPLIANCE =====
router.delete('/:id', authenticate, async (req, res) => {
    try {
        await db.query(
            'DELETE FROM appliances WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        res.json({ message: 'Appliance deleted' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete appliance' });
    }
});

module.exports = router;