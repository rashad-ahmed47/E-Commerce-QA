/**
 * Common Utility Functions
 */

const Utils = {
    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    // Format date
    formatDate(dateString) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateString));
    },

    // Debounce function for search inputs
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // API fetch wrapper with built-in error handling
    async fetchApi(url, options = {}) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };

            const token = localStorage.getItem('token');
            if (token && !headers['Authorization']) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(url, { ...options, headers });
            
            // Check for unauthorized/session expired
            if (response.status === 401 && window.location.pathname !== '/login.html') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login.html?expired=true';
                throw new Error('Session expired. Please login again.');
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Something went wrong');
                }
                return data;
            }
            
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            
            return response.text();
            
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // Parse JWT to check expiry
    isTokenExpired(token) {
        if (!token) return true;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 < Date.now();
        } catch (e) {
            return true;
        }
    }
};

window.Utils = Utils;
