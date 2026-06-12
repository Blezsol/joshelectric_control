# ⚡ JoshElectric Control

## Professional Electric Load Management System for Nigerian Homes & Businesses

![Version](https://img.shields.io/badge/version-3.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)
![Database](https://img.shields.io/badge/database-PostgreSQL-blue)
![Backend](https://img.shields.io/badge/backend-Node.js%20%2F%20Express-green)
![Frontend](https://img.shields.io/badge/frontend-Vanilla%20JS%20%7C%20HTML5%20%7C%20CSS3-orange)

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [User Guide](#user-guide)
- [Academic Context](#academic-context)
- [Screenshots](#screenshots)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## 📖 Project Overview

**JoshElectric Control** is a comprehensive web-based electrical load management system designed specifically for Nigerian residential and commercial applications. The system provides real-time load monitoring, predictive analytics, cost estimation, and intelligent recommendations to help users optimize their electricity consumption.

### 🎯 Problem Statement

Nigeria faces significant challenges in electricity management, including:
- Unstable power supply from the national grid
- Rising electricity tariffs
- Lack of tools for households to monitor and manage electrical loads
- Limited access to professional electrical system design tools
- Need for cost-effective energy management solutions

### 💡 Solution

JoshElectric Control addresses these challenges by providing:
- Intuitive web-based interface for load calculation
- Automatic system recommendations (breaker sizing, cable selection, phase configuration)
- Cost estimation in Nigerian Naira (₦)
- Predictive analytics for consumption forecasting
- Multi-user support with role-based access
- Offline functionality for areas with limited connectivity
- Solar potential analysis
- Professional report generation

---

## ✨ Features

### Core Functionality

| Feature | Description |
|---------|-------------|
| **Load Calculation** | Automatic power, current, and energy calculations |
| **Cost Estimation** | Daily, weekly, monthly, and annual cost projections in NGN |
| **System Recommendations** | Breaker size, cable size, phase configuration, safety margins |
| **Multiple Export Formats** | PDF, CSV, JSON, Excel reports |
| **Session Management** | Save and load configurations |
| **Data Persistence** | Local storage, IndexedDB, and cloud sync |

### Advanced Features

| Feature | Description |
|---------|-------------|
| **Predictive Analytics** | AI-powered consumption forecasting |
| **Comparative Analysis** | Side-by-side scenario comparison |
| **Multi-User System** | Admin, Engineer, and Client roles |
| **Dark Mode** | Light/Dark theme toggle |
| **Offline Support** | Service Worker for offline functionality |
| **PWA Ready** | Installable as a Progressive Web App |
| **Real-Time Monitoring** | Simulated real-time power display |
| **Solar Analysis** | Solar system sizing recommendations |
| **Energy Audit** | Comprehensive energy audit reports |

### Nigerian Context Features

- Default voltage: 230V (Nigerian standard)
- Default frequency: 50Hz
- Currency: Nigerian Naira (₦)
- Tariff: ₦48/kWh (adjustable)
- Common Nigerian appliance presets
- DISCO tariff configuration support

---

## 🛠 Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom properties, Grid, Flexbox, Animations
- **Vanilla JavaScript (ES6+)** - No framework dependencies
- **Chart.js** - Interactive data visualization
- **jsPDF + AutoTable** - PDF report generation
- **Font Awesome 6** - Professional icons

### Backend (Optional - for cloud deployment)
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **JWT** - Authentication
- **bcrypt.js** - Password hashing
- **Helmet** - Security headers
- **CORS** - Cross-origin support

### Storage Options
- **localStorage** - Client-side data (default)
- **IndexedDB** - Structured client-side storage
- **PostgreSQL** - Server-side database (with backend)

### Deployment
- **Render** - Cloud hosting platform
- **Service Worker** - Offline caching
- **PWA Manifest** - Installable web app

---

## 📁 Project Structure
joshelectric-control/
│
├── index.html # Main landing page (Dashboard)
├── sw.js # Service Worker for offline
├── manifest.json # PWA manifest
├── README.md # Project documentation
│
├── pages/ # Application pages
│ ├── load-modelling.html # Load modelling & calculations
│ ├── analytics.html # Analytics & predictions
│ ├── comparative-analysis.html # Comparative load analysis
│ ├── multi-user.html # User management (admin)
│ ├── history.html # Session history
│ ├── reports.html # Report generation
│ └── settings.html # System configuration
│
├── css/ # Stylesheets
│ ├── dashboard.css # Main dashboard styles
│ ├── components.css # Reusable UI components
│ ├── pages.css # Page-specific styles
│ ├── auth.css # Authentication modal styles
│ └── dark-mode.css # Dark theme styles
│
├── js/ # JavaScript modules
│ ├── config.js # Global configuration & API client
│ ├── database.js # IndexedDB manager
│ ├── auth.js # Multi-user authentication
│ ├── dashboard.js # Main dashboard logic
│ ├── predictor.js # Predictive analytics engine
│ ├── dark-mode.js # Theme toggle
│ ├── navigation.js # Navigation & routing
│ ├── load-modelling.js # Load modelling calculations
│ ├── analytics.js # Charts & analytics
│ ├── comparative.js # Comparative analysis
│ ├── multi-user.js # User management logic
│ ├── history.js # Session history management
│ ├── reports.js # Report generation
│ └── settings.js # Settings management
│
├── backend/ # Backend API (for deployment)
│ ├── server.js # Express server
│ ├── package.json # Backend dependencies
│ ├── .env # Environment variables
│ ├── database/
│ │ └── db.js # PostgreSQL connection & migrations
│ ├── routes/
│ │ ├── auth.js # Authentication routes
│ │ ├── appliances.js # Appliance CRUD routes
│ │ ├── sessions.js # Session management routes
│ │ └── settings.js # User settings routes
│ └── middleware/
│ └── auth.js # JWT authentication middleware
│
└── assets/ # Static assets
└── logo.svg # Company logo