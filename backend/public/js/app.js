/**
 * Core Application Logic (Homepage/Discovery)
 */

const App = {
    state: {
        products: [],
        categories: [],
        filters: {
            keyword: '',
            category: '',
            minPrice: '',
            maxPrice: '',
            sort: '-createdAt',
            page: 1,
            limit: 12
        },
        totalPages: 1
    },

    async init() {
        Auth.initAuthUI();
        Cart.updateBadge();
        
        // Initialize lucide icons early
        if (window.lucide) lucide.createIcons();

        this.bindEvents();
        await Promise.all([
            this.fetchCategories(),
            this.fetchProducts()
        ]);
        
        // Load recently viewed only if logged in or has local data
        this.loadRecentlyViewed();
    },

    bindEvents() {
        // Search (Desktop & Mobile)
        const searchHandler = Utils.debounce((e) => {
            this.state.filters.keyword = e.target.value;
            this.state.filters.page = 1;
            this.fetchProducts();
        }, 400);

        const searchInput = document.getElementById('searchInput');
        const mobileSearchInput = document.getElementById('mobileSearchInput');
        
        if (searchInput) searchInput.addEventListener('input', searchHandler);
        if (mobileSearchInput) mobileSearchInput.addEventListener('input', searchHandler);

        // Sorting
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.state.filters.sort = e.target.value;
                this.state.filters.page = 1;
                this.fetchProducts();
            });
        }

        // Price Filter
        const applyPriceBtn = document.getElementById('applyPriceBtn');
        if (applyPriceBtn) {
            applyPriceBtn.addEventListener('click', () => {
                this.state.filters.minPrice = document.getElementById('minPrice').value;
                this.state.filters.maxPrice = document.getElementById('maxPrice').value;
                this.state.filters.page = 1;
                this.fetchProducts();
            });
        }
    },

    async fetchCategories() {
        try {
            const categories = await Utils.fetchApi('/api/products/categories');
            this.state.categories = categories;
            this.renderCategories();
        } catch (error) {
            console.error('Failed to load categories', error);
        }
    },

    async fetchProducts() {
        try {
            // Build query string
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(this.state.filters)) {
                if (value) params.append(key, value);
            }

            const data = await Utils.fetchApi(`/api/products?${params.toString()}`);
            this.state.products = data.products;
            this.state.totalPages = data.pages;
            
            const resultsCount = document.getElementById('resultsCount');
            if (resultsCount) {
                resultsCount.innerText = `Showing ${data.products.length} of ${data.total} products`;
            }

            this.renderProducts();
            this.renderPagination();
        } catch (error) {
            Toast.error('Failed to load products');
        }
    },

    renderCategories() {
        const container = document.getElementById('categoryFilters');
        if (!container) return;

        container.innerHTML = `
            <label class="filter-option">
                <input type="radio" name="category" value="" ${this.state.filters.category === '' ? 'checked' : ''}>
                <span>All Categories</span>
            </label>
        ` + this.state.categories.map(cat => `
            <label class="filter-option">
                <input type="radio" name="category" value="${cat._id}" ${this.state.filters.category === cat._id ? 'checked' : ''}>
                <span>${cat._id}</span>
                <span class="filter-count">${cat.count}</span>
            </label>
        `).join('');

        // Bind radio change events
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.state.filters.category = e.target.value;
                this.state.filters.page = 1;
                this.fetchProducts();
            });
        });
    },

    renderProducts() {
        const grid = document.getElementById('productGrid');
        if (!grid) return;

        if (this.state.products.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1">
                    <i data-lucide="search" class="mx-auto h-12 w-12 text-gray-400 mb-4"></i>
                    <h3 class="text-lg font-bold">No products found</h3>
                    <p class="text-gray-500">Try adjusting your filters or search term.</p>
                    <button class="btn btn-secondary mt-4" onclick="App.clearFilters()">Clear Filters</button>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        grid.innerHTML = this.state.products.map((p, index) => {
            const hasSale = p.salePrice && p.salePrice < p.price;
            const priceHtml = hasSale 
                ? `<span class="product-price product-price-sale">${Utils.formatCurrency(p.salePrice)}</span>
                   <span class="product-price-original">${Utils.formatCurrency(p.price)}</span>`
                : `<span class="product-price">${Utils.formatCurrency(p.price)}</span>`;

            const imageSrc = p.images && p.images.length > 0 ? p.images[0] : 'https://via.placeholder.com/300?text=No+Image';
            
            // Animation stagger
            const animDelay = (index % 12) * 0.05;

            return `
                <div class="card product-card animate-fade" style="animation-delay: ${animDelay}s">
                    ${hasSale ? `<div class="product-badge"><span class="badge badge-danger">SALE</span></div>` : ''}
                    <a href="/product.html?id=${p._id}" class="card-img-wrap block">
                        <img src="${imageSrc}" alt="${p.name}" class="card-img" loading="lazy">
                    </a>
                    <div class="product-info flex flex-col h-full">
                        <a href="/product.html?id=${p._id}"><h3 class="product-name line-clamp-1">${p.name}</h3></a>
                        <p class="product-desc line-clamp-2">${p.description}</p>
                        <div class="product-footer">
                            <div>${priceHtml}</div>
                            <button class="product-cart-btn" onclick="Cart.add('${p._id}', '${p.name.replace(/'/g, "\\'")}', ${hasSale ? p.salePrice : p.price}, '${imageSrc}')" title="Add to Cart">
                                <i data-lucide="shopping-cart" class="w-5 h-5"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (window.lucide) lucide.createIcons();
    },

    renderPagination() {
        const container = document.getElementById('pagination');
        if (!container || this.state.totalPages <= 1) {
            if(container) container.innerHTML = '';
            return;
        }

        let html = '';
        const currentPage = this.state.filters.page;

        // Prev
        html += `<button class="btn btn-secondary btn-sm" ${currentPage === 1 ? 'disabled' : ''} onclick="App.changePage(${currentPage - 1})">Prev</button>`;
        
        // Page numbers
        for (let i = 1; i <= this.state.totalPages; i++) {
            if (i === 1 || i === this.state.totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                html += `<button class="btn ${i === currentPage ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="App.changePage(${i})">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                html += `<span class="px-2 py-1 text-gray-400">...</span>`;
            }
        }

        // Next
        html += `<button class="btn btn-secondary btn-sm" ${currentPage === this.state.totalPages ? 'disabled' : ''} onclick="App.changePage(${currentPage + 1})">Next</button>`;

        container.innerHTML = html;
    },

    changePage(page) {
        if (page < 1 || page > this.state.totalPages) return;
        this.state.filters.page = page;
        document.getElementById('productsSection').scrollIntoView({ behavior: 'smooth' });
        this.fetchProducts();
    },

    clearFilters() {
        this.state.filters = { keyword: '', category: '', minPrice: '', maxPrice: '', sort: '-createdAt', page: 1, limit: 12 };
        if (document.getElementById('searchInput')) document.getElementById('searchInput').value = '';
        if (document.getElementById('mobileSearchInput')) document.getElementById('mobileSearchInput').value = '';
        if (document.getElementById('minPrice')) document.getElementById('minPrice').value = '';
        if (document.getElementById('maxPrice')) document.getElementById('maxPrice').value = '';
        if (document.getElementById('sortSelect')) document.getElementById('sortSelect').value = '-createdAt';
        this.fetchProducts();
        this.renderCategories();
    },

    async loadRecentlyViewed() {
        const container = document.getElementById('recentlyViewedContainer');
        if (!container) return;

        let items = [];
        
        // If logged in, fetch from profile
        if (Auth.isAuthenticated()) {
            try {
                const profile = await Utils.fetchApi('/api/auth/profile');
                if (profile.recentlyViewed && profile.recentlyViewed.length > 0) {
                    items = profile.recentlyViewed.map(rv => rv.product).filter(p => p !== null);
                }
            } catch (err) {
                // fallback to local
                items = this.getLocalRecentlyViewed();
            }
        } else {
            items = this.getLocalRecentlyViewed();
        }

        if (items.length > 0) {
            // Render it horizontally
            container.innerHTML = `
                <div class="recently-viewed">
                    <h2 class="text-2xl font-bold mb-6">Recently Viewed</h2>
                    <div class="recently-viewed-grid">
                        ${items.map(p => {
                            const imageSrc = p.images && p.images.length > 0 ? p.images[0] : 'https://via.placeholder.com/300?text=No+Image';
                            const price = p.salePrice || p.price;
                            return `
                                <a href="/product.html?id=${p._id}" class="card flex-shrink-0" style="width: 220px; text-decoration: none;">
                                    <div class="card-img-wrap" style="height: 180px;">
                                        <img src="${imageSrc}" class="w-full h-full object-cover">
                                    </div>
                                    <div class="p-3">
                                        <h4 class="font-bold text-sm text-gray-900 line-clamp-1">${p.name}</h4>
                                        <p class="text-primary-600 font-bold mt-1">${Utils.formatCurrency(price)}</p>
                                    </div>
                                </a>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
    },

    getLocalRecentlyViewed() {
        try {
            return JSON.parse(localStorage.getItem('recentlyViewed')) || [];
        } catch (e) {
            return [];
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Only init if we are on the main app page or similar
    if (document.getElementById('productGrid')) {
        App.init();
    } else {
        Auth.initAuthUI();
        Cart.updateBadge();
        if (window.lucide) lucide.createIcons();
    }
});
