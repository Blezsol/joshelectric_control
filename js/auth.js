// ============================================
// JOSH ELECTRIC CONTROL - AUTHENTICATION
// Multi-User with Role-Based Access
// ============================================

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.init();
    }
    
    async init() {
        // Load users from IndexedDB or localStorage
        await this.loadUsers();
        
        // Check for remembered user
        const remembered = localStorage.getItem('joshelectric_remembered');
        if (remembered) {
            try {
                this.currentUser = JSON.parse(remembered);
            } catch (e) {
                localStorage.removeItem('joshelectric_remembered');
            }
        } else {
            const saved = localStorage.getItem('joshelectric_current_user');
            if (saved) {
                try {
                    this.currentUser = JSON.parse(saved);
                } catch (e) {
                    localStorage.removeItem('joshelectric_current_user');
                }
            }
        }
        
        this.updateUI();
        this.setupEventListeners();
        
        // Hide loading screen
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
                setTimeout(() => loadingScreen.remove(), 500);
            }
        }, 800);
    }
    
    async loadUsers() {
        try {
            if (typeof db !== 'undefined' && db.isReady) {
                this.users = await db.getAllUsers();
            }
        } catch (e) {
            // Fallback to localStorage
            this.users = JSON.parse(localStorage.getItem('joshelectric_users') || '[]');
        }
        
        // Create demo users if none exist
        if (this.users.length === 0) {
            this.users = [
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
            localStorage.setItem('joshelectric_users', JSON.stringify(this.users));
            
            // Also save to IndexedDB
            if (typeof db !== 'undefined') {
                this.users.forEach(user => {
                    db.saveUser(user).catch(() => {});
                });
            }
        }
    }
    
    updateUI() {
        const notLoggedIn = document.getElementById('notLoggedIn');
        const loggedIn = document.getElementById('loggedIn');
        const adminLink = document.getElementById('adminLink');
        
        if (this.isLoggedIn()) {
            if (notLoggedIn) notLoggedIn.style.display = 'none';
            if (loggedIn) loggedIn.style.display = 'flex';
            
            const user = this.getCurrentUser();
            const elements = {
                currentUserName: document.getElementById('currentUserName'),
                dropdownUserName: document.getElementById('dropdownUserName'),
                dropdownUserEmail: document.getElementById('dropdownUserEmail'),
                dropdownUserRole: document.getElementById('dropdownUserRole'),
                welcomeUser: document.getElementById('welcomeUser')
            };
            
            if (elements.currentUserName) elements.currentUserName.textContent = user.firstName;
            if (elements.dropdownUserName) elements.dropdownUserName.textContent = `${user.firstName} ${user.lastName}`;
            if (elements.dropdownUserEmail) elements.dropdownUserEmail.textContent = user.email;
            if (elements.dropdownUserRole) {
                elements.dropdownUserRole.textContent = user.role;
                elements.dropdownUserRole.className = `badge ${user.role === 'admin' ? 'danger' : user.role === 'engineer' ? 'info' : 'success'}`;
            }
            if (elements.welcomeUser) elements.welcomeUser.textContent = `${user.firstName} ${user.lastName}`;
            
            // Show admin link for admin users
            if (adminLink && user.role === 'admin') {
                adminLink.style.display = 'flex';
            }
        } else {
            if (notLoggedIn) notLoggedIn.style.display = 'flex';
            if (loggedIn) loggedIn.style.display = 'none';
            if (document.getElementById('welcomeUser')) {
                document.getElementById('welcomeUser').textContent = 'Guest';
            }
            if (adminLink) adminLink.style.display = 'none';
        }
    }
    
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('loginEmail')?.value.trim();
                const password = document.getElementById('loginPassword')?.value;
                const remember = document.getElementById('rememberMe')?.checked;
                this.login(email, password, remember);
            });
        }
        
        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const firstName = document.getElementById('regFirstName')?.value.trim();
                const lastName = document.getElementById('regLastName')?.value.trim();
                const email = document.getElementById('regEmail')?.value.trim();
                const password = document.getElementById('regPassword')?.value;
                const role = document.getElementById('regRole')?.value || 'client';
                this.register(firstName, lastName, email, password, role);
            });
        }
        
        // Sign out
        document.getElementById('signOutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
        
        // Password toggles
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                const input = document.getElementById(targetId);
                const icon = btn.querySelector('i');
                if (input && icon) {
                    if (input.type === 'password') {
                        input.type = 'text';
                        icon.classList.replace('fa-eye', 'fa-eye-slash');
                    } else {
                        input.type = 'password';
                        icon.classList.replace('fa-eye-slash', 'fa-eye');
                    }
                }
            });
        });
    }
    
    login(email, password, remember = false) {
        const user = this.users.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.currentUser = user;
            
            if (remember) {
                localStorage.setItem('joshelectric_remembered', JSON.stringify(user));
            }
            
            localStorage.setItem('joshelectric_current_user', JSON.stringify(user));
            this.updateUI();
            closeLoginModal();
            
            const roleMessages = {
                admin: 'Administrator access granted',
                engineer: 'Engineer access granted',
                client: 'Welcome back'
            };
            
            showNotification(`${roleMessages[user.role] || 'Welcome'}, ${user.firstName}!`, 'success');
            
            // Reload dashboard data
            if (typeof dashboard !== 'undefined') {
                dashboard.loadPastProjects();
                dashboard.updateSystemInfo();
            }
            
            // Update user management page if open
            if (typeof userManager !== 'undefined') {
                userManager.init();
            }
        } else {
            showNotification('Invalid email or password. Please try again.', 'error');
        }
    }
    
    async register(firstName, lastName, email, password, role) {
        if (!firstName || !lastName || !email || !password) {
            showNotification('Please fill all required fields', 'error');
            return;
        }
        
        if (password.length < 6) {
            showNotification('Password must be at least 6 characters', 'error');
            return;
        }
        
        const exists = this.users.find(u => u.email === email);
        if (exists) {
            showNotification('Email already registered', 'error');
            return;
        }
        
        const newUser = {
            id: Date.now(),
            firstName,
            lastName,
            email,
            password,
            role,
            company: '',
            createdAt: new Date().toISOString()
        };
        
        this.users.push(newUser);
        localStorage.setItem('joshelectric_users', JSON.stringify(this.users));
        
        // Save to IndexedDB
        if (typeof db !== 'undefined') {
            try {
                await db.saveUser(newUser);
            } catch (e) {
                console.warn('Failed to save to IndexedDB');
            }
        }
        
        this.currentUser = newUser;
        localStorage.setItem('joshelectric_current_user', JSON.stringify(newUser));
        
        this.updateUI();
        closeRegisterModal();
        showNotification(`Account created! Welcome, ${firstName}!`, 'success');
    }
    
    logout() {
        this.currentUser = null;
        localStorage.removeItem('joshelectric_current_user');
        localStorage.removeItem('joshelectric_remembered');
        this.updateUI();
        showNotification('Signed out successfully. You can continue as guest.', 'info');
    }
    
    getCurrentUser() {
        if (!this.currentUser) {
            const saved = localStorage.getItem('joshelectric_current_user');
            if (saved) {
                try {
                    this.currentUser = JSON.parse(saved);
                } catch (e) {
                    this.currentUser = null;
                }
            }
        }
        return this.currentUser;
    }
    
    isLoggedIn() {
        return !!this.getCurrentUser();
    }
    
    hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    }
    
    isAdmin() {
        return this.hasRole('admin');
    }
}

// Initialize Auth
const auth = new AuthManager();
window.auth = auth;

// Notification function
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<i class="fas fa-${icons[type] || 'info-circle'}"></i> ${message}`;
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

window.showNotification = showNotification;