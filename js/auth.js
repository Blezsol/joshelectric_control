// ============================================
// JOSH ELECTRIC CONTROL - AUTHENTICATION
// Fixed - Working Sign In/Register
// ============================================

// Modal functions - MUST be global
function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex';
        console.log('Login modal opened');
    } else {
        console.error('Login modal not found');
    }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function openRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.style.display = 'flex';
        console.log('Register modal opened');
    } else {
        console.error('Register modal not found');
    }
}

function closeRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Make modal functions globally accessible
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.openRegisterModal = openRegisterModal;
window.closeRegisterModal = closeRegisterModal;

// Close modals when clicking outside
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.style.display = 'none';
    }
});

// Close modals with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.style.display = 'none';
        });
    }
});

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

// ===== AUTH MANAGER CLASS =====
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.isInitialized = false;
        this.init();
    }
    
    init() {
        console.log('AuthManager initializing...');
        this.loadUsers();
        
        // Check for remembered user
        const remembered = localStorage.getItem('joshelectric_remembered');
        if (remembered) {
            try {
                this.currentUser = JSON.parse(remembered);
                console.log('Remembered user loaded:', this.currentUser.email);
            } catch (e) {
                localStorage.removeItem('joshelectric_remembered');
            }
        } else {
            const saved = localStorage.getItem('joshelectric_current_user');
            if (saved) {
                try {
                    this.currentUser = JSON.parse(saved);
                    console.log('Saved user loaded:', this.currentUser.email);
                } catch (e) {
                    localStorage.removeItem('joshelectric_current_user');
                }
            }
        }
        
        this.setupEventListeners();
        this.updateUI();
        this.isInitialized = true;
        console.log('AuthManager initialized. Logged in:', this.isLoggedIn());
    }
    
    loadUsers() {
        const stored = localStorage.getItem('joshelectric_users');
        if (stored) {
            try {
                this.users = JSON.parse(stored);
            } catch (e) {
                this.users = [];
            }
        }
        
        // Create demo users if none exist
        if (this.users.length === 0) {
            this.users = [
                { 
                    id: 1, 
                    firstName: 'Admin', 
                    lastName: 'User', 
                    email: 'admin@joshelectric.com', 
                    password: 'admin123', 
                    role: 'admin', 
                    company: 'JoshElectric Ltd.', 
                    createdAt: new Date().toISOString() 
                },
                { 
                    id: 2, 
                    firstName: 'Engineer', 
                    lastName: 'User', 
                    email: 'engineer@joshelectric.com', 
                    password: 'eng123', 
                    role: 'engineer', 
                    company: 'JoshElectric Ltd.', 
                    createdAt: new Date().toISOString() 
                },
                { 
                    id: 3, 
                    firstName: 'Demo', 
                    lastName: 'Client', 
                    email: 'demo@joshelectric.com', 
                    password: 'demo123', 
                    role: 'client', 
                    company: 'Private Residence', 
                    createdAt: new Date().toISOString() 
                }
            ];
            localStorage.setItem('joshelectric_users', JSON.stringify(this.users));
            console.log('Demo users created');
        }
    }
    
    saveUsers() {
        localStorage.setItem('joshelectric_users', JSON.stringify(this.users));
    }
    
    setupEventListeners() {
        console.log('Setting up auth event listeners...');
        
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Login form submitted');
                const email = document.getElementById('loginEmail')?.value?.trim();
                const password = document.getElementById('loginPassword')?.value;
                const remember = document.getElementById('rememberMe')?.checked;
                this.login(email, password, remember);
            });
            console.log('Login form listener attached');
        } else {
            console.warn('Login form not found in DOM');
        }
        
        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Register form submitted');
                const firstName = document.getElementById('regFirstName')?.value?.trim();
                const lastName = document.getElementById('regLastName')?.value?.trim();
                const email = document.getElementById('regEmail')?.value?.trim();
                const password = document.getElementById('regPassword')?.value;
                const role = document.getElementById('regRole')?.value || 'client';
                this.register(firstName, lastName, email, password, role);
            });
            console.log('Register form listener attached');
        } else {
            console.warn('Register form not found in DOM');
        }
        
        // Sign out button
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
        
        // Password toggle buttons
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const input = document.getElementById(targetId);
                const icon = this.querySelector('i');
                
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
        console.log('Login attempt:', email);
        
        if (!email || !password) {
            showNotification('Please enter email and password', 'error');
            return;
        }
        
        const user = this.users.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.currentUser = user;
            
            if (remember) {
                localStorage.setItem('joshelectric_remembered', JSON.stringify(user));
            }
            
            localStorage.setItem('joshelectric_current_user', JSON.stringify(user));
            this.updateUI();
            closeLoginModal();
            
            // Clear form
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
            
            showNotification(`Welcome back, ${user.firstName}!`, 'success');
            
            // Reload dashboard data
            setTimeout(() => {
                if (typeof dashboard !== 'undefined') {
                    dashboard.loadPastProjects();
                    dashboard.updateSystemInfo();
                    dashboard.updateQuickStats();
                }
            }, 500);
            
        } else {
            showNotification('Invalid email or password. Try demo@joshelectric.com / demo123', 'error');
        }
    }
    
    register(firstName, lastName, email, password, role) {
        console.log('Register attempt:', email);
        
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
            showNotification('Email already registered. Please login instead.', 'error');
            return;
        }
        
        const newUser = {
            id: Date.now(),
            firstName,
            lastName,
            email,
            password,
            role: role || 'client',
            company: '',
            createdAt: new Date().toISOString()
        };
        
        this.users.push(newUser);
        this.saveUsers();
        
        this.currentUser = newUser;
        localStorage.setItem('joshelectric_current_user', JSON.stringify(newUser));
        
        this.updateUI();
        closeRegisterModal();
        
        // Clear form
        document.getElementById('regFirstName').value = '';
        document.getElementById('regLastName').value = '';
        document.getElementById('regEmail').value = '';
        document.getElementById('regPassword').value = '';
        
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
    
    updateUI() {
        const notLoggedIn = document.getElementById('notLoggedIn');
        const loggedIn = document.getElementById('loggedIn');
        
        console.log('Updating UI. Logged in:', this.isLoggedIn());
        
        if (this.isLoggedIn()) {
            if (notLoggedIn) notLoggedIn.style.display = 'none';
            if (loggedIn) loggedIn.style.display = 'flex';
            
            const user = this.getCurrentUser();
            
            if (document.getElementById('currentUserName')) {
                document.getElementById('currentUserName').textContent = user.firstName;
            }
            if (document.getElementById('dropdownUserName')) {
                document.getElementById('dropdownUserName').textContent = `${user.firstName} ${user.lastName}`;
            }
            if (document.getElementById('dropdownUserEmail')) {
                document.getElementById('dropdownUserEmail').textContent = user.email;
            }
            if (document.getElementById('welcomeUser')) {
                document.getElementById('welcomeUser').textContent = `${user.firstName} ${user.lastName}`;
            }
            
            // Show/hide admin link
            const adminLink = document.getElementById('adminLink');
            if (adminLink) {
                adminLink.style.display = user.role === 'admin' ? 'flex' : 'none';
            }
        } else {
            if (notLoggedIn) notLoggedIn.style.display = 'flex';
            if (loggedIn) loggedIn.style.display = 'none';
            if (document.getElementById('welcomeUser')) {
                document.getElementById('welcomeUser').textContent = 'Guest';
            }
        }
    }
}

// Initialize Auth when DOM is ready
let auth;

function initAuth() {
    console.log('Initializing Auth...');
    auth = new AuthManager();
    window.auth = auth;
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}