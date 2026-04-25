/**
 * Global Toast Notification System
 * Replaces generic window.alert() with premium animated toasts.
 */

const Toast = {
    init() {
        if (!document.getElementById('toastContainer')) {
            const container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    },

    show(message, type = 'info', duration = 4000) {
        this.init();
        const container = document.getElementById('toastContainer');
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = '';
        if (window.lucide) {
            switch(type) {
                case 'success': icon = '<i data-lucide="check-circle" class="w-5 h-5 text-green-500"></i>'; break;
                case 'error': icon = '<i data-lucide="alert-circle" class="w-5 h-5 text-red-500"></i>'; break;
                case 'warning': icon = '<i data-lucide="alert-triangle" class="w-5 h-5 text-yellow-500"></i>'; break;
                default: icon = '<i data-lucide="info" class="w-5 h-5 text-blue-500"></i>'; break;
            }
        }

        toast.innerHTML = `
            ${icon}
            <span class="toast-msg">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                ${window.lucide ? '<i data-lucide="x" class="w-4 h-4"></i>' : '×'}
            </button>
            <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
        `;

        container.appendChild(toast);
        if (window.lucide) lucide.createIcons();

        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'fadeIn 0.3s ease-in reverse forwards';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    },

    success(message, duration) { this.show(message, 'success', duration); },
    error(message, duration) { this.show(message, 'error', duration); },
    warning(message, duration) { this.show(message, 'warning', duration); },
    info(message, duration) { this.show(message, 'info', duration); }
};

window.Toast = Toast;
