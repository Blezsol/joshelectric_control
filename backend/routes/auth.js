// ============================================
// JOSH ELECTRIC CONTROL - AUTH ROUTES
// ============================================

const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { generateToken, authenticate } = require('../middleware/auth');

const router = express.Router();

// ===== REGISTER =====
router.post('/register', [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['client', 'engineer', 'admin']).withMessage('Invalid role')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { firstName, lastName, email, password, role = 'client' } = req.body;

        // Check if user exists
        const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const result = await db.query(
            `INSERT INTO users (first_name, last_name, email, password_hash, role) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, email, role, created_at`,
            [firstName, lastName, email, passwordHash, role]
        );

        const user = result.rows[0];
        const token = generateToken(user);

        // Create default settings
        await db.query(
            `INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
            [user.id]
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// ===== LOGIN =====
router.post('/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user
        const result = await db.query(
            'SELECT id, first_name, last_name, email, password_hash, role FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate token
        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ===== GET PROFILE =====
router.get('/profile', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, first_name, last_name, email, role, company, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// ===== UPDATE PROFILE =====
router.put('/profile', authenticate, async (req, res) => {
    try {
        const { firstName, lastName, company } = req.body;
        
        await db.query(
            `UPDATE users SET first_name = COALESCE($1, first_name), 
             last_name = COALESCE($2, last_name), 
             company = COALESCE($3, company),
             updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [firstName, lastName, company, req.user.id]
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

module.exports = router;