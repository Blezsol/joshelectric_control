// ============================================
// JOSH ELECTRIC CONTROL - MULTI-USER MANAGEMENT
// ============================================

class UserManager {
    constructor() {
        this.users = [];
        this.currentUser = auth.getCurrentUser();
        this.init();
    }

    async init() {
        // Check if user is admin
        if (!this.currentUser || this.currentUser.role !== 'admin') {
            document.getElementById('adminOnly').style.display = 'none';
        } else {
            document.getElementById('adminOnly').style.display = 'block';
        }

        await this.loadUsers();
        this.renderUsers();
    }

    async loadUsers() {
        try {
            this.users = await db.getAllUsers();
        } catch (e) {
            const stored = JSON.parse(localStorage.getItem('joshelectric_users') || '[]');
            this.users = stored;
        }
    }

    async addUser(firstName, lastName, email, password, role) {
        if (!firstName || !lastName || !email || !password) {
            showNotification('Please fill all fields', 'error');
            return;
        }

        if (password.length < 6) {
            showNotification('Password must be at least 6 characters', 'error');
            return;
        }

        const exists = this.users.find(u => u.email === email);
        if (exists) {
            showNotification('Email already exists', 'error');
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

        try {
            await db.saveUser(newUser);
        } catch (e) {
            this.users.push(newUser);
            localStorage.setItem('joshelectric_users', JSON.stringify(this.users));
        }

        await this.loadUsers();
        this.renderUsers();
        
        // Clear form
        ['newFirstName', 'newLastName', 'newEmail', 'newPassword'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        showNotification(`User ${firstName} ${lastName} added!`, 'success');
    }

    async deleteUser(id) {
        if (!confirm('Delete this user? This cannot be undone.')) return;

        try {
            await db.delete('users', id);
        } catch (e) {
            this.users = this.users.filter(u => u.id !== id);
            localStorage.setItem('joshelectric_users', JSON.stringify(this.users));
        }

        await this.loadUsers();
        this.renderUsers();
        showNotification('User deleted', 'info');
    }

    renderUsers() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        if (this.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
            return;
        }

        const roleBadges = {
            admin: 'danger',
            engineer: 'info',
            client: 'success'
        };

        tbody.innerHTML = this.users.map(user => `
            <tr>
                <td>#${user.id.toString().slice(-4)}</td>
                <td><strong>${user.firstName} ${user.lastName}</strong></td>
                <td>${user.email}</td>
                <td><span class="badge ${roleBadges[user.role] || 'secondary'}">${user.role}</span></td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td><span class="badge success">Active</span></td>
                <td>
                    ${this.currentUser?.role === 'admin' && user.id !== this.currentUser.id ? 
                        `<button class="btn btn-sm btn-secondary" onclick="userManager.deleteUser(${user.id})">
                            <i class="fas fa-trash"></i>
                        </button>` : 
                        '<small>—</small>'}
                </td>
            </tr>
        `).join('');
    }
}

const userManager = new UserManager();
window.userManager = userManager;

function addNewUser() {
    const firstName = document.getElementById('newFirstName')?.value.trim();
    const lastName = document.getElementById('newLastName')?.value.trim();
    const email = document.getElementById('newEmail')?.value.trim();
    const password = document.getElementById('newPassword')?.value;
    const role = document.getElementById('newRole')?.value;

    userManager.addUser(firstName, lastName, email, password, role);
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}