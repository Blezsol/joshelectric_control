// ============================================
// JOSH ELECTRIC CONTROL - NAVIGATION SYSTEM
// Fully Responsive for Mobile
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
    initMobileDropdowns();
    initSidebarToggle();
    initUserDropdown();
    updateDateTime();
    setInterval(updateDateTime, 60000);
    highlightActivePage();
    createMobileOverlay();
});

function initMobileMenu() {
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const mainNav = document.getElementById('mainNav');
    const overlay = document.getElementById('mobileNavOverlay');
    
    if (mobileToggle && mainNav) {
        mobileToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const isOpen = mainNav.classList.contains('show');
            
            // Close sidebar if open
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.remove('show');
            
            // Toggle nav
            if (isOpen) {
                closeMobileMenu();
            } else {
                mainNav.classList.add('show');
                if (overlay) overlay.classList.add('show');
                mobileToggle.innerHTML = '<i class="fas fa-times"></i>';
            }
        });
    }
    
    // Close when clicking overlay
    if (overlay) {
        overlay.addEventListener('click', function() {
            closeMobileMenu();
        });
    }
    
    // Close when clicking outside
    document.addEventListener('click', function(e) {
        if (mainNav && mainNav.classList.contains('show')) {
            if (!e.target.closest('#mainNav') && !e.target.closest('#mobileMenuToggle')) {
                closeMobileMenu();
            }
        }
    });
    
    // Close on window resize (if going to desktop)
    window.addEventListener('resize', function() {
        if (window.innerWidth > 900 && mainNav && mainNav.classList.contains('show')) {
            closeMobileMenu();
        }
    });
}

function closeMobileMenu() {
    const mainNav = document.getElementById('mainNav');
    const overlay = document.getElementById('mobileNavOverlay');
    const mobileToggle = document.getElementById('mobileMenuToggle');
    
    if (mainNav) mainNav.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
    if (mobileToggle) mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
}

function initMobileDropdowns() {
    document.querySelectorAll('.nav-dropdown .dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            if (window.innerWidth <= 900) {
                e.preventDefault();
                e.stopPropagation();
                const dropdown = this.closest('.nav-dropdown');
                dropdown.classList.toggle('active');
            }
        });
    });
}

function initSidebarToggle() {
    // Sidebar toggle is handled by mobile-menu-toggle
    // Additional: Close sidebar when clicking main content on mobile
    const mainContent = document.querySelector('.main-content');
    const sidebar = document.getElementById('sidebar');
    
    if (mainContent && sidebar) {
        mainContent.addEventListener('click', function(e) {
            if (window.innerWidth <= 900 && sidebar.classList.contains('show')) {
                if (!e.target.closest('#sidebar') && !e.target.closest('#mobileMenuToggle')) {
                    sidebar.classList.remove('show');
                }
            }
        });
    }
}

function initUserDropdown() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.style.display = 
                userDropdown.style.display === 'block' ? 'none' : 'block';
        });
        
        document.addEventListener('click', function() {
            userDropdown.style.display = 'none';
        });
    }
}

function createMobileOverlay() {
    // Create overlay if it doesn't exist
    if (!document.getElementById('mobileNavOverlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'mobileNavOverlay';
        overlay.className = 'mobile-nav-overlay';
        document.body.appendChild(overlay);
    }
}

function highlightActivePage() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.includes(href.replace('../', '').replace('pages/', ''))) {
            link.classList.add('active');
        }
    });
}

function updateDateTime() {
    const dateTimeEl = document.getElementById('currentDateTime');
    if (dateTimeEl) {
        const now = new Date();
        const options = { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        dateTimeEl.textContent = now.toLocaleDateString('en-NG', options);
    }
}

// Expose functions globally
window.closeMobileMenu = closeMobileMenu;