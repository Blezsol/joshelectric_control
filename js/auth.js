// ============================================
// JOSH ELECTRIC CONTROL - AUTHENTICATION
// Complete Fixed Version - Working User Menu
// ============================================

// ===== MODAL FUNCTIONS =====
function openLoginModal() {
    var modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex';
        console.log('Login modal opened');
    }
}

function closeLoginModal() {
    var modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function openRegisterModal() {
    var modal = document.getElementById('registerModal');
    if (modal) {
        modal.style.display = 'flex';
        console.log('Register modal opened');
    }
}

function closeRegisterModal() {
    var modal = document.getElementById('registerModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Make modal functions globally accessible
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.openRegisterModal = openRegisterModal;
window.closeRegisterModal = closeRegisterModal;

// ===== NOTIFICATION FUNCTION =====
function showNotification(message, type) {
    type = type || 'info';
    var container = document.getElementById('notificationContainer');
    if (!container) return;

    var icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };

    var notification = document.createElement('div');
    notification.className = 'notification ' + type;
    notification.innerHTML = '<i class="fas fa-' + (icons[type] || 'info-circle') + '"></i> ' + message;
    container.appendChild(notification);

    setTimeout(function() {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(function() {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

window.showNotification = showNotification;

// ===== AUTH MANAGER =====
var AuthManager = function() {
    this.currentUser = null;
    this.users = [];
    this.init();
};

AuthManager.prototype.init = function() {
    console.log('AuthManager: Initializing...');
    this.loadUsers();
    this.loadCurrentUser();
    this.setupForms();
    this.setupUserMenu();
    this.setupSignOut();
    this.updateUI();
    console.log('AuthManager: Initialized. Logged in:', this.isLoggedIn());
};

AuthManager.prototype.loadUsers = function() {
    var stored = localStorage.getItem('joshelectric_users');
    if (stored) {
        try {
            this.users = JSON.parse(stored);
        } catch (e) {
            this.users = [];
        }
    }

    // Create demo users if none exist
    if (!this.users || this.users.length === 0) {
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
};

AuthManager.prototype.loadCurrentUser = function() {
    // Check remembered user first
    var remembered = localStorage.getItem('joshelectric_remembered');
    if (remembered) {
        try {
            this.currentUser = JSON.parse(remembered);
            console.log('Remembered user loaded:', this.currentUser.email);
            return;
        } catch (e) {
            localStorage.removeItem('joshelectric_remembered');
        }
    }

    // Check current user
    var saved = localStorage.getItem('joshelectric_current_user');
    if (saved) {
        try {
            this.currentUser = JSON.parse(saved);
            console.log('Saved user loaded:', this.currentUser.email);
        } catch (e) {
            this.currentUser = null;
            localStorage.removeItem('joshelectric_current_user');
        }
    }
};

AuthManager.prototype.saveUsers = function() {
    localStorage.setItem('joshelectric_users', JSON.stringify(this.users));
};

AuthManager.prototype.setupForms = function() {
    var self = this;

    // Login Form
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
        // Remove existing listeners by cloning
        var newForm = loginForm.cloneNode(true);
        loginForm.parentNode.replaceChild(newForm, loginForm);
        loginForm = newForm;
        loginForm.id = 'loginForm';
        
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var email = document.getElementById('loginEmail').value.trim();
            var password = document.getElementById('loginPassword').value;
            var remember = document.getElementById('rememberMe').checked;
            self.login(email, password, remember);
        });
        console.log('Login form listener attached');
    }

    // Register Form
    var registerForm = document.getElementById('registerForm');
    if (registerForm) {
        var newRegForm = registerForm.cloneNode(true);
        registerForm.parentNode.replaceChild(newRegForm, registerForm);
        registerForm = newRegForm;
        registerForm.id = 'registerForm';
        
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var firstName = document.getElementById('regFirstName').value.trim();
            var lastName = document.getElementById('regLastName').value.trim();
            var email = document.getElementById('regEmail').value.trim();
            var password = document.getElementById('regPassword').value;
            var role = document.getElementById('regRole').value || 'client';
            self.register(firstName, lastName, email, password, role);
        });
        console.log('Register form listener attached');
    }
};

// ===== SETUP USER MENU (THE FIX) =====
AuthManager.prototype.setupUserMenu = function() {
    var self = this;
    var userMenuBtn = document.getElementById('userMenuBtn');
    var userDropdown = document.getElementById('userDropdown');

    if (userMenuBtn && userDropdown) {
        // Remove existing listeners
        var newBtn = userMenuBtn.cloneNode(true);
        userMenuBtn.parentNode.replaceChild(newBtn, userMenuBtn);
        userMenuBtn = newBtn;
        userMenuBtn.id = 'userMenuBtn';

        userMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            var dropdown = document.getElementById('userDropdown');
            if (dropdown) {
                if (dropdown.style.display === 'block') {
                    dropdown.style.display = 'none';
                } else {
                    dropdown.style.display = 'block';
                }
                console.log('User dropdown toggled:', dropdown.style.display);
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.user-menu')) {
                var dropdown = document.getElementById('userDropdown');
                if (dropdown) {
                    dropdown.style.display = 'none';
                }
            }
        });

        // Close dropdown on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                var dropdown = document.getElementById('userDropdown');
                if (dropdown) {
                    dropdown.style.display = 'none';
                }
            }
        });

        console.log('User menu listeners attached');
    } else {
        console.warn('User menu elements not found:', {
            userMenuBtn: !!userMenuBtn,
            userDropdown: !!userDropdown
        });
    }
};

// ===== SETUP SIGN OUT =====
AuthManager.prototype.setupSignOut = function() {
    var self = this;
    var signOutBtn = document.getElementById('signOutBtn');
    
    if (signOutBtn) {
        var newSignOut = signOutBtn.cloneNode(true);
        signOutBtn.parentNode.replaceChild(newSignOut, signOutBtn);
        signOutBtn = newSignOut;
        signOutBtn.id = 'signOutBtn';
        
        signOutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Sign out clicked');
            self.logout();
        });
        console.log('Sign out listener attached');
    }
};

AuthManager.prototype.login = function(email, password, remember) {
    console.log('Login attempt:', email);

    if (!email || !password) {
        showNotification('Please enter email and password', 'error');
        return;
    }

    var user = null;
    for (var i = 0; i < this.users.length; i++) {
        if (this.users[i].email === email && this.users[i].password === password) {
            user = this.users[i];
            break;
        }
    }

    if (user) {
        this.currentUser = user;

        if (remember) {
            localStorage.setItem('joshelectric_remembered', JSON.stringify(user));
        }
        localStorage.setItem('joshelectric_current_user', JSON.stringify(user));

        this.updateUI();
        closeLoginModal();

        // Clear form
        var loginEmail = document.getElementById('loginEmail');
        var loginPassword = document.getElementById('loginPassword');
        if (loginEmail) loginEmail.value = '';
        if (loginPassword) loginPassword.value = '';

        showNotification('Welcome back, ' + user.firstName + '!', 'success');

        // Reload dashboard
        setTimeout(function() {
            if (typeof dashboard !== 'undefined') {
                dashboard.loadPastProjects();
                dashboard.updateSystemInfo();
                dashboard.updateQuickStats();
            }
        }, 500);
    } else {
        showNotification('Invalid email or password. Try demo@joshelectric.com / demo123', 'error');
    }
};

AuthManager.prototype.register = function(firstName, lastName, email, password, role) {
    console.log('Register attempt:', email);

    if (!firstName || !lastName || !email || !password) {
        showNotification('Please fill all required fields', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }

    // Check if email exists
    var exists = false;
    for (var i = 0; i < this.users.length; i++) {
        if (this.users[i].email === email) {
            exists = true;
            break;
        }
    }

    if (exists) {
        showNotification('Email already registered. Please login instead.', 'error');
        return;
    }

    var newUser = {
        id: Date.now(),
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
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
    var regFirstName = document.getElementById('regFirstName');
    var regLastName = document.getElementById('regLastName');
    var regEmail = document.getElementById('regEmail');
    var regPassword = document.getElementById('regPassword');
    if (regFirstName) regFirstName.value = '';
    if (regLastName) regLastName.value = '';
    if (regEmail) regEmail.value = '';
    if (regPassword) regPassword.value = '';

    showNotification('Account created! Welcome, ' + firstName + '!', 'success');
};

AuthManager.prototype.logout = function() {
    console.log('Logging out...');
    this.currentUser = null;
    localStorage.removeItem('joshelectric_current_user');
    localStorage.removeItem('joshelectric_remembered');
    
    // Close user dropdown
    var userDropdown = document.getElementById('userDropdown');
    if (userDropdown) userDropdown.style.display = 'none';
    
    this.updateUI();
    showNotification('Signed out successfully.', 'info');
    console.log('Logged out');
};

AuthManager.prototype.getCurrentUser = function() {
    if (!this.currentUser) {
        var saved = localStorage.getItem('joshelectric_current_user');
        if (saved) {
            try {
                this.currentUser = JSON.parse(saved);
            } catch (e) {
                this.currentUser = null;
            }
        }
    }
    return this.currentUser;
};

AuthManager.prototype.isLoggedIn = function() {
    return !!this.getCurrentUser();
};

AuthManager.prototype.updateUI = function() {
    var notLoggedIn = document.getElementById('notLoggedIn');
    var loggedIn = document.getElementById('loggedIn');

    console.log('Updating UI. Logged in:', this.isLoggedIn());

    if (this.isLoggedIn()) {
        // User IS logged in
        if (notLoggedIn) {
            notLoggedIn.style.display = 'none';
        }
        if (loggedIn) {
            loggedIn.style.display = 'flex';
            loggedIn.style.alignItems = 'center';
            loggedIn.style.gap = '8px';
        }

        var user = this.getCurrentUser();
        if (user) {
            var currentUserName = document.getElementById('currentUserName');
            var dropdownUserName = document.getElementById('dropdownUserName');
            var dropdownUserEmail = document.getElementById('dropdownUserEmail');
            var dropdownUserRole = document.getElementById('dropdownUserRole');
            var welcomeUser = document.getElementById('welcomeUser');

            if (currentUserName) currentUserName.textContent = user.firstName;
            if (dropdownUserName) dropdownUserName.textContent = user.firstName + ' ' + user.lastName;
            if (dropdownUserEmail) dropdownUserEmail.textContent = user.email;
            if (dropdownUserRole) {
                dropdownUserRole.textContent = user.role;
                dropdownUserRole.className = 'badge ' + (user.role === 'admin' ? 'danger' : user.role === 'engineer' ? 'info' : 'success');
            }
            if (welcomeUser) welcomeUser.textContent = user.firstName + ' ' + user.lastName;
        }
    } else {
        // User is NOT logged in - SHOW sign in/register buttons
        if (notLoggedIn) {
            notLoggedIn.style.display = 'flex';
            notLoggedIn.style.alignItems = 'center';
            notLoggedIn.style.gap = '8px';
        }
        if (loggedIn) {
            loggedIn.style.display = 'none';
        }

        var welcomeUser = document.getElementById('welcomeUser');
        if (welcomeUser) welcomeUser.textContent = 'Guest';
    }
};

// ===== INITIALIZE AUTH =====
var auth;

function initAuth() {
    console.log('Initializing Auth...');
    auth = new AuthManager();
    window.auth = auth;
    console.log('Auth ready. isLoggedIn:', auth.isLoggedIn());
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}