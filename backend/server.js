// ============================================
// JOSH ELECTRIC CONTROL - BACKEND SERVER
// Fixed CSP for inline event handlers
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// ===== FIXED CSP - Allows inline scripts and event handlers =====
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",        // Allows onclick handlers
                "'unsafe-eval'",          // Allows eval()
                "https://cdnjs.cloudflare.com",
                "https://cdn.jsdelivr.net",
                "https://joshelectric-control.onrender.com"
            ],
            scriptSrcAttr: [
                "'unsafe-inline'",        // CRITICAL: Allows onclick, onsubmit, etc.
                "'unsafe-hashes'"         // Allows hashed inline handlers
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdnjs.cloudflare.com",
                "https://cdn.jsdelivr.net",
                "https://fonts.googleapis.com"
            ],
            styleSrcElem: [
                "'self'",
                "'unsafe-inline'",
                "https://cdnjs.cloudflare.com",
                "https://cdn.jsdelivr.net",
                "https://fonts.googleapis.com"
            ],
            fontSrc: [
                "'self'",
                "https://cdnjs.cloudflare.com",
                "https://fonts.gstatic.com",
                "data:"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "https:",
                "blob:"
            ],
            connectSrc: [
                "'self'",
                "https://joshelectric-control.onrender.com",
                "https://joshelectric.onrender.com",
                "https://cdnjs.cloudflare.com",
                "https://cdn.jsdelivr.net",
                "wss://joshelectric-control.onrender.com"
            ],
            mediaSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameSrc: ["'self'"],
            workerSrc: ["'self'", "blob:"],
            manifestSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ===== CORS =====
app.use(cors({
    origin: [
        'https://joshelectric-control.onrender.com',
        'https://joshelectric.onrender.com',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ===== RATE LIMITING =====
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ===== API ROUTES =====
app.use('/api/auth', require('./routes/auth'));
app.use('/api/appliances', require('./routes/appliances'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/settings', require('./routes/settings'));

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// ===== SERVE STATIC FILES =====
// Serve with correct MIME types
app.use('/js', express.static(path.join(__dirname, '..', 'js'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
    }
}));

app.use('/css', express.static(path.join(__dirname, '..', 'css'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        }
    }
}));

app.use('/pages', express.static(path.join(__dirname, '..', 'pages'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        }
    }
}));

app.use('/assets', express.static(path.join(__dirname, '..', 'assets'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.svg')) {
            res.setHeader('Content-Type', 'image/svg+xml');
        }
    }
}));

// Serve root files (index.html, sw.js, manifest.json, test-auth.html)
app.use(express.static(path.join(__dirname, '..'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        } else if (filePath.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
        }
    }
}));

// ===== SPA FALLBACK =====
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`🚀 JoshElectric Control running on port ${PORT}`);
    console.log(`📡 Health: http://localhost:${PORT}/api/health`);
});