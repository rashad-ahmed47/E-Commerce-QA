/**
 * Authentication and Session Management
 */

const Auth = {
    getToken() {
        const token = localStorage.getItem('token');
        if (Utils.isTokenExpired(token)) {
            this.logout();
            return null;
        }
        return token;
    },

    getUser() {
        try {
            return JSON.parse(localStorage.getItem('user'));
        } catch (e) {
            return null;
        }
    },

    isAuthenticated() {
        return !!this.getToken() && !!this.getUser();
    },

    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'Admin';
    },

    async login(email, password) {
        try {
            const data = await Utils.fetchApi('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({
                _id: data._id,
                name: data.name,
                email: data.email,
                role: data.role
            }));
            
            return data;
        } catch (error) {
            throw error;
        }
    },

    async register(name, email, password) {
        try {
            const data = await Utils.fetchApi('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, password })
            });

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({
                _id: data._id,
                name: data.name,
                email: data.email,
                role: data.role
            }));
            
            return data;
        } catch (error) {
            throw error;
        }
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    },

    // Initialize UI links based on auth state
    initAuthUI() {
        const authLinks = document.getElementById('authLinks');
        if (!authLinks) return;

        if (this.isAuthenticated()) {
            const user = this.getUser();
            
            let linksHtml = '';
            
            if (this.isAdmin()) {
                linksHtml += `
                    <a href="/admin/dashboard.html" class="nav-link text-primary-600 font-bold">
                        <i data-lucide="shield"></i> Admin
                    </a>
                `;
            }

            linksHtml += `
                <div class="relative group" style="position:relative;">
                    <button class="btn btn-ghost">
                        <i data-lucide="user"></i> ${user.name.split(' ')[0]}
                    </button>
                    <div class="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                        <a href="/account.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Profile</a>
                        <a href="/orders.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Orders</a>
                        <a href="/returns.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Returns</a>
                        <a href="/my-listings.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100">My Listings</a>
                        <button onclick="Auth.logout()" class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100 font-bold">Log out</button>
                    </div>
                </div>
            `;
            
            authLinks.innerHTML = linksHtml;
        } else {
            authLinks.innerHTML = `
                <a href="/login.html" class="btn btn-secondary btn-sm">Login</a>
                <a href="/register.html" class="btn btn-primary btn-sm">Sign Up</a>
            `;
        }
        
        if (window.lucide) lucide.createIcons();
    }
};

window.Auth = Auth;
