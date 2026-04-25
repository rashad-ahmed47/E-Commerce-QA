/**
 * Shopping Cart Logic
 */

const Cart = {
    getItems() {
        try {
            return JSON.parse(localStorage.getItem('cart')) || [];
        } catch (e) {
            return [];
        }
    },

    saveItems(items) {
        localStorage.setItem('cart', JSON.stringify(items));
        this.updateBadge();
        
        // Dispatch custom event for cross-page sync
        window.dispatchEvent(new Event('cartUpdated'));
    },

    add(id, name, price, image, qty = 1) {
        const items = this.getItems();
        const existingItem = items.find(i => i.product === id);

        if (existingItem) {
            existingItem.qty += Number(qty);
            Toast.success(`Increased ${name} quantity`);
        } else {
            items.push({ product: id, name, price, image, qty: Number(qty) });
            Toast.success(`${name} added to cart`);
        }

        this.saveItems(items);
    },

    remove(id) {
        const items = this.getItems();
        const filtered = items.filter(i => i.product !== id);
        this.saveItems(filtered);
    },

    updateQty(id, qty) {
        if (qty < 1) return this.remove(id);
        
        const items = this.getItems();
        const item = items.find(i => i.product === id);
        if (item) {
            item.qty = Number(qty);
            this.saveItems(items);
        }
    },

    clear() {
        localStorage.removeItem('cart');
        this.updateBadge();
        window.dispatchEvent(new Event('cartUpdated'));
    },

    updateBadge() {
        const badge = document.getElementById('cartBadge');
        if (!badge) return;

        const items = this.getItems();
        const totalItems = items.reduce((acc, item) => acc + item.qty, 0);

        if (totalItems > 0) {
            badge.innerText = totalItems > 99 ? '99+' : totalItems;
            badge.classList.remove('hidden');
            badge.classList.add('animate-scale');
            setTimeout(() => badge.classList.remove('animate-scale'), 300);
        } else {
            badge.classList.add('hidden');
        }
    },
    
    getTotal() {
        const items = this.getItems();
        return items.reduce((acc, item) => acc + (item.price * item.qty), 0);
    }
};

window.Cart = Cart;
