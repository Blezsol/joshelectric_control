// ============================================
// JOSH ELECTRIC CONTROL - NAVIGATION SYSTEM
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initMobileMenu();
    initDropdowns();
    setupKeyboardShortcuts();
    updateDateTime();
    setInterval(updateDateTime, 60000);
});

function initNavigation() {
    // Highlight active page
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.includes(href.replace('../', '').replace('pages/', ''))) {
            link.classList.add('active');
        }
    });
    
    // Back button handling
    window.addEventListener('popstate', function() {
        location.reload();
    });
}

function initMobileMenu() {
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    const mainNav = document.getElementById('mainNav');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            if (sidebar) {
                sidebar.style.display = sidebar.style.display === 'block' ? 'none' : 'block';
            }
            if (mainNav) {
                mainNav.style.display = mainNav.style.display === 'flex' ? 'none' : 'flex';
            }
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            if (!e.target.closest('.top-navbar') && !e.target.closest('#mobileMenuToggle')) {
                if (sidebar) sidebar.style.display = 'none';
                if (mainNav) mainNav.style.display = 'none';
            }
        }
    });
}

function initDropdowns() {
    // Handle dropdown hover for desktop
    const dropdowns = document.querySelectorAll('.nav-dropdown');
    
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        if (toggle && menu) {
            // For mobile: click to toggle
            toggle.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                }
            });
        }
    });
    
    // User dropdown
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
        });
        
        document.addEventListener('click', function() {
            userDropdown.style.display = 'none';
        });
    }
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+S - Save Session
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (typeof dashboard !== 'undefined' && dashboard.saveSession) {
                dashboard.saveSession();
            }
        }
        
        // Ctrl+E - Export CSV
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            if (typeof dashboard !== 'undefined' && dashboard.exportCSV) {
                dashboard.exportCSV();
            }
        }
        
        // Ctrl+P - Export PDF
        if (e.ctrlKey && e.key === 'p' && !e.shiftKey) {
            e.preventDefault();
            if (typeof dashboard !== 'undefined' && dashboard.exportPDF) {
                dashboard.exportPDF();
            }
        }
        
        // Escape - Close modals
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

function updateDateTime() {
    const dateTimeEl = document.getElementById('currentDateTime');
    if (dateTimeEl) {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        dateTimeEl.textContent = now.toLocaleDateString('en-NG', options);
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.style.display = 'none';
    });
    
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) userDropdown.style.display = 'none';
}

// Global modal functions
function openLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function openRegisterModal() {
    document.getElementById('registerModal').style.display = 'flex';
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
}

// Close modals when clicking overlay
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.style.display = 'none';
    }
});

// Export for global use
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.openRegisterModal = openRegisterModal;
window.closeRegisterModal = closeRegisterModal;