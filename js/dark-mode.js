// ============================================
// JOSH ELECTRIC CONTROL - DARK MODE
// Simple Theme Toggle
// ============================================

class DarkModeManager {
    constructor() {
        this.isDark = localStorage.getItem('joshelectric_dark_mode') === 'true';
        this.init();
    }

    init() {
        this.applyTheme();
        this.setupToggle();
        this.updateIcon();
    }

    applyTheme() {
        const themeStyle = document.getElementById('theme-style');
        if (themeStyle) {
            themeStyle.disabled = !this.isDark;
        }
        
        if (this.isDark) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    toggle() {
        this.isDark = !this.isDark;
        localStorage.setItem('joshelectric_dark_mode', this.isDark);
        this.applyTheme();
        this.updateIcon();
        showNotification(
            this.isDark ? 'Dark mode activated 🌙' : 'Light mode activated ☀️', 
            'info'
        );
    }

    updateIcon() {
        const toggleBtn = document.getElementById('darkModeToggle');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            if (this.isDark) {
                icon.className = 'fas fa-sun';
                toggleBtn.title = 'Switch to Light Mode';
            } else {
                icon.className = 'fas fa-moon';
                toggleBtn.title = 'Switch to Dark Mode';
            }
        }
    }

    setupToggle() {
        const toggleBtn = document.getElementById('darkModeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }
    }
}

const darkMode = new DarkModeManager();
window.darkMode = darkMode;