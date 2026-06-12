// ============================================
// JOSH ELECTRIC CONTROL - SESSION ROUTES
// ============================================

const express = require('express');
const { authenticate } = require('../middleware/auth');
const db = require('../database/db');

const router = express.Router();

// ===== GET ALL SESSIONS =====
router.get('/', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM sessions WHERE user_id = $1 ORDER BY date DESC LIMIT 50',
            [req.user.id]
        );
        res.json({ sessions: result.rows });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// ===== SAVE SESSION =====
router.post('/', authenticate, async (req, res) => {
    try {
        const session = req.body;
        
        await db.query(
            `INSERT INTO sessions (id, user_id, name, date, total_power, total_current, monthly_cost, appliances_data)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name, total_power = EXCLUDED.total_power,
             total_current = EXCLUDED.total_current, monthly_cost = EXCLUDED.monthly_cost,
             appliances_data = EXCLUDED.appliances_data`,
            [session.id, req.user.id, session.name, session.date, session.totalPower,
             session.totalCurrent, session.monthlyCost, JSON.stringify(session.appliances)]
        );

        res.status(201).json({ message: 'Session saved successfully' });
    } catch (error) {
        console.error('Save session error:', error);
        res.status(500).json({ error: 'Failed to save session' });
    }
});

// ===== DELETE SESSION =====
router.delete('/:id', authenticate, async (req, res) => {
    try {
        await db.query(
            'DELETE FROM sessions WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        res.json({ message: 'Session deleted' });
    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({ error: 'Failed to delete session' });
    }
});

module.exports = router;