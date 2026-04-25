/**
 * Multi-step Checkout Logic
 */

const Checkout = {
    state: {
        step: 1,
        shippingAddress: {},
        paymentMethod: 'CreditCard',
        items: []
    },

    init() {
        if (!Auth.isAuthenticated()) {
            Toast.warning('Please login to checkout');
            setTimeout(() => window.location.href = '/login.html?redirect=checkout.html', 1500);
            return;
        }

        this.state.items = Cart.getItems();
        if (this.state.items.length === 0) {
            window.location.href = '/cart.html';
            return;
        }

        this.renderSummary();
        this.bindEvents();
        if (window.lucide) lucide.createIcons();
    },

    bindEvents() {
        // Step 1: Shipping
        document.getElementById('shippingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.state.shippingAddress = {
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                postalCode: document.getElementById('postalCode').value,
                country: document.getElementById('country').value,
            };
            this.goToStep(2);
        });

        // Card number formatting
        const ccInput = document.getElementById('cardNumber');
        if (ccInput) {
            ccInput.addEventListener('input', (e) => {
                let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                let matches = v.match(/\d{4,16}/g);
                let match = matches && matches[0] || '';
                let parts = [];
                for (let i = 0, len = match.length; i < len; i += 4) {
                    parts.push(match.substring(i, i + 4));
                }
                if (parts.length) {
                    e.target.value = parts.join(' ');
                } else {
                    e.target.value = v;
                }
            });
        }

        // Expiry formatting
        const expInput = document.getElementById('cardExpiry');
        if (expInput) {
            expInput.addEventListener('input', (e) => {
                let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                if (v.length >= 2) {
                    e.target.value = v.substring(0, 2) + '/' + v.substring(2, 4);
                } else {
                    e.target.value = v;
                }
            });
        }

        // Step 2: Payment
        document.getElementById('paymentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const cc = document.getElementById('cardNumber').value;
            document.getElementById('reviewCardEnd').innerText = cc.slice(-4) || 'XXXX';
            this.prepareReview();
            this.goToStep(3);
        });

        // Step 3: Place Order
        document.getElementById('placeOrderBtn').addEventListener('click', () => this.placeOrder());
    },

    goToStep(stepNum) {
        // Update tabs
        document.querySelectorAll('.step').forEach((el, idx) => {
            if (idx + 1 < stepNum) {
                el.classList.add('done');
                el.classList.remove('active');
            } else if (idx + 1 === stepNum) {
                el.classList.add('active');
                el.classList.remove('done');
            } else {
                el.classList.remove('active', 'done');
            }
        });

        // Show/Hide forms
        document.getElementById('formStep1').classList.add('hidden');
        document.getElementById('formStep2').classList.add('hidden');
        document.getElementById('formStep3').classList.add('hidden');
        
        const form = document.getElementById(`formStep${stepNum}`);
        form.classList.remove('hidden');
        form.classList.add('animate-fade');

        this.state.step = stepNum;
    },

    renderSummary() {
        const items = this.state.items;
        const totalQty = items.reduce((a, c) => a + c.qty, 0);
        const totalPrice = items.reduce((a, c) => a + c.price * c.qty, 0);

        document.getElementById('summaryCount').innerText = totalQty;
        document.getElementById('summaryItemsTotal').innerText = Utils.formatCurrency(totalPrice);
        document.getElementById('summaryTotal').innerText = Utils.formatCurrency(totalPrice);

        document.getElementById('summaryItemsPreview').innerHTML = items.map(item => `
            <div class="flex gap-3 py-2">
                <div class="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img src="${item.image}" class="w-full h-full object-cover">
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-gray-900 line-clamp-1">${item.name}</p>
                    <p class="text-xs text-gray-500">Qty: ${item.qty} × ${Utils.formatCurrency(item.price)}</p>
                </div>
            </div>
        `).join('');
    },

    prepareReview() {
        const addr = this.state.shippingAddress;
        document.getElementById('reviewAddress').innerText = `${addr.address}, ${addr.city}, ${addr.postalCode}, ${addr.country}`;
        
        document.getElementById('reviewItems').innerHTML = this.state.items.map(item => `
            <div class="flex justify-between items-center bg-white p-3 border border-gray-100 rounded-lg">
                <div class="flex items-center gap-3">
                    <div class="font-medium px-2 py-1 bg-gray-100 rounded text-sm">${item.qty}x</div>
                    <span class="font-medium text-gray-900">${item.name}</span>
                </div>
                <span class="font-bold">${Utils.formatCurrency(item.price * item.qty)}</span>
            </div>
        `).join('');
    },

    async placeOrder() {
        const btn = document.getElementById('placeOrderBtn');
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner border-white"></div> Processing...';

        const totalPrice = this.state.items.reduce((a, c) => a + c.price * c.qty, 0);

        try {
            // 1. Create order
            const orderRes = await Utils.fetchApi('/api/orders', {
                method: 'POST',
                body: JSON.stringify({
                    orderItems: this.state.items,
                    shippingAddress: this.state.shippingAddress,
                    paymentMethod: this.state.paymentMethod,
                    totalPrice: totalPrice,
                })
            });

            // 2. Simulate Payment gateway execution
            await Utils.fetchApi(`/api/orders/${orderRes._id}/pay`, {
                method: 'PUT',
                body: JSON.stringify({
                    id: 'sim_txn_' + Date.now(),
                    status: 'COMPLETED',
                    email_address: Auth.getUser().email
                })
            });

            // 3. Clear cart and redirect
            Cart.clear();
            window.location.href = `/success.html?id=${orderRes._id}`;
        } catch (error) {
            Toast.error(error.message || 'Failed to place order. Items may be out of stock.');
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="lock" class="w-4 h-4 mr-1"></i> Place Order';
            if (window.lucide) lucide.createIcons();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Checkout.init();
});
