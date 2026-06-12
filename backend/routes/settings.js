// ============================================
// JOSH ELECTRIC CONTROL - SETTINGS ROUTES
// ============================================

const express = require('express');
const { authenticate } = require('../middleware/auth');
const db = require('../database/db');

const router = express.Router();

// ===== GET SETTINGS =====
router.get('/', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM user_settings WHERE user_id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            // Create default settings
            await db.query('INSERT INTO user_settings (user_id) VALUES ($1)', [req.user.id]);
            const newResult = await db.query('SELECT * FROM user_settings WHERE user_id = $1', [req.user.id]);
            return res.json({ settings: newResult.rows[0] });
        }

        res.json({ settings: result.rows[0] });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// ===== UPDATE SETTINGS =====
router.put('/', authenticate, async (req, res) => {
    try {
        const { voltage, frequency, tariffPerKWh, currency, safetyMargin, theme, autoSave, notifications } = req.body;

        await db.query(
            `UPDATE user_settings SET 
             voltage = COALESCE($1, voltage),
             frequency = COALESCE($2, frequency),
             tariff_per_kwh = COALESCE($3, tariff_per_kwh),
             currency = COALESCE($4, currency),
             safety_margin = COALESCE($5, safety_margin),
             theme = COALESCE($6, theme),
             auto_save = COALESCE($7, auto_save),
             notifications = COALESCE($8, notifications),
             updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $9`,
            [voltage, frequency, tariffPerKWh, currency, safetyMargin, theme, autoSave, notifications, req.user.id]
        );

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

module.exports = router;