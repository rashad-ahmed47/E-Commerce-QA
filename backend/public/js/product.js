/**
 * Product Details Logic (PDP)
 */

const ProductPage = {
    state: {
        product: null,
        currentQty: 1
    },

    async init() {
        Auth.initAuthUI();
        Cart.updateBadge();
        
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        if (!id) {
            window.location.href = '/';
            return;
        }

        try {
            await this.loadProduct(id);
            this.bindEvents();
            this.initZoom();
            this.trackView(id);
            
            // Check scroll for mobile sticky cart
            window.addEventListener('scroll', Utils.debounce(() => {
                const stickyCart = document.querySelector('.sticky-cart');
                const mainCartBtn = document.getElementById('addToCartBtn');
                
                if (mainCartBtn && stickyCart) {
                    const rect = mainCartBtn.getBoundingClientRect();
                    if (rect.top < 0 && window.innerWidth <= 768) {
                        stickyCart.classList.add('show');
                    } else {
                        stickyCart.classList.remove('show');
                    }
                }
            }, 50));
            
        } catch (error) {
            Toast.error('Failed to load product details');
        }
    },

    async loadProduct(id) {
        const product = await Utils.fetchApi(`/api/products/${id}`);
        this.state.product = product;
        this.render();
    },

    trackView(id) {
        if (Auth.isAuthenticated()) {
            Utils.fetchApi(`/api/products/${id}/track`, { method: 'POST' }).catch(console.error);
        } else {
            // Local tracking
            let viewed = [];
            try {
                viewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
            } catch(e){}
            
            viewed = viewed.filter(p => p._id !== this.state.product._id);
            viewed.unshift(this.state.product);
            if(viewed.length > 20) viewed.pop();
            
            localStorage.setItem('recentlyViewed', JSON.stringify(viewed));
        }
    },

    render() {
        const p = this.state.product;
        const hasSale = p.salePrice && p.salePrice < p.price;
        const currentPrice = hasSale ? p.salePrice : p.price;

        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('productContent').classList.remove('hidden');

        // Breadcrumbs & Titles
        document.title = `${p.name} - E-SHOP`;
        document.getElementById('bcCategory').innerText = p.category;
        document.getElementById('bcName').innerText = p.name;
        document.getElementById('productName').innerText = p.name;
        document.getElementById('productSku').innerText = p.sku;
        document.getElementById('productDescription').innerText = p.description;
        
        // Sticky Mobile
        document.getElementById('mobileTitle').innerText = p.name;
        document.getElementById('mobilePrice').innerText = Utils.formatCurrency(currentPrice);

        // Pricing
        const priceContainer = document.getElementById('priceContainer');
        if (hasSale) {
            document.getElementById('saleBadge').classList.remove('hidden');
            priceContainer.innerHTML = `
                <span class="text-4xl font-extrabold text-danger-500">${Utils.formatCurrency(p.salePrice)}</span>
                <span class="text-xl text-gray-400 line-through mb-1">${Utils.formatCurrency(p.price)}</span>
            `;
        } else {
            priceContainer.innerHTML = `
                <span class="text-4xl font-extrabold text-gray-900">${Utils.formatCurrency(p.price)}</span>
            `;
        }

        // Stock Status
        const stockStatus = document.getElementById('stockStatus');
        const addToCartBtn = document.getElementById('addToCartBtn');
        const mobileAddToCart = document.getElementById('mobileAddToCart');

        if (p.stockQuantity > 0) {
            if (p.stockQuantity <= p.safetyThreshold) {
                stockStatus.innerHTML = `<i data-lucide="alert-circle" class="w-5 h-5 text-warning-500"></i> <span class="text-warning-600">Only ${p.stockQuantity} left in stock - order soon.</span>`;
            } else {
                stockStatus.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5 text-success-500"></i> <span class="text-success-600">In Stock</span>`;
            }
        } else {
            stockStatus.innerHTML = `<i data-lucide="x-circle" class="w-5 h-5 text-danger-500"></i> <span class="text-danger-600">Out of Stock</span>`;
            addToCartBtn.disabled = true;
            addToCartBtn.innerText = 'Out of Stock';
            mobileAddToCart.disabled = true;
            mobileAddToCart.innerText = 'Out of Stock';
            
            // Hide qty selector
            document.getElementById('qty').parentElement.style.display = 'none';
        }

        // Images
        const mainImage = document.getElementById('mainImage');
        const thumbContainer = document.getElementById('thumbnailContainer');
        
        if (p.images && p.images.length > 0) {
            mainImage.src = p.images[0];
            
            if (p.images.length > 1) {
                thumbContainer.innerHTML = p.images.map((img, idx) => `
                    <button class="flex-shrink-0 w-20 h-20 rounded-xl border-2 ${idx === 0 ? 'border-primary-500' : 'border-transparent'} overflow-hidden" onclick="ProductPage.setMainImage('${img}', this)">
                        <img src="${img}" class="w-full h-full object-cover">
                    </button>
                `).join('');
            }
        } else {
            mainImage.src = 'https://via.placeholder.com/600?text=No+Image';
        }

        this.renderReviews();
        
        if (window.lucide) lucide.createIcons();
    },

    setMainImage(url, thumbBtn) {
        document.getElementById('mainImage').src = url;
        
        // Update thumbnail borders
        document.querySelectorAll('#thumbnailContainer button').forEach(btn => {
            btn.classList.remove('border-primary-500');
            btn.classList.add('border-transparent');
        });
        thumbBtn.classList.remove('border-transparent');
        thumbBtn.classList.add('border-primary-500');
    },

    renderReviews() {
        const p = this.state.product;
        document.getElementById('avgRatingDisplay').innerText = p.rating ? p.rating.toFixed(1) : '0.0';
        document.getElementById('totalReviewsDisplay').innerText = `${p.numReviews} review${p.numReviews !== 1 ? 's' : ''}`;
        
        // Stars
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (p.rating >= i) starsHtml += '<i data-lucide="star" class="w-5 h-5 fill-current"></i>';
            else if (p.rating >= i - 0.5) starsHtml += '<i data-lucide="star-half" class="w-5 h-5 fill-current"></i>';
            else starsHtml += '<i data-lucide="star" class="w-5 h-5 text-gray-300"></i>';
        }
        document.getElementById('avgStarsDisplay').innerHTML = starsHtml;
        document.getElementById('ratingContainer').innerHTML = starsHtml; // Header stars

        // Review Form Visibility
        if (Auth.isAuthenticated()) {
            document.getElementById('loginToReview').classList.add('hidden');
            
            // Check if already reviewed
            const user = Auth.getUser();
            const hasReviewed = p.reviews && p.reviews.some(r => r.user.toString() === user._id);
            
            if (!hasReviewed) {
                document.getElementById('reviewFormSection').classList.remove('hidden');
            } else {
                document.getElementById('reviewFormSection').innerHTML = '<p class="text-sm text-success-600 font-bold"><i data-lucide="check" class="inline w-4 h-4"></i> You have already reviewed this product.</p>';
            }
        }

        // Reviews List
        const list = document.getElementById('reviewsList');
        if (!p.reviews || p.reviews.length === 0) {
            list.innerHTML = '<p class="text-gray-500">No reviews yet. Be the first to review this product!</p>';
        } else {
            list.innerHTML = p.reviews.map(r => {
                let rStars = '';
                for (let i = 1; i <= 5; i++) {
                    rStars += `<i data-lucide="star" class="w-4 h-4 ${r.rating >= i ? 'fill-current text-yellow-400' : 'text-gray-300'}"></i>`;
                }
                
                return `
                    <div class="border-b border-gray-100 pb-6">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg">
                                ${r.name.charAt(0)}
                            </div>
                            <div>
                                <h4 class="font-bold text-gray-900">${r.name}</h4>
                                <div class="flex gap-1">${rStars}</div>
                            </div>
                        </div>
                        <p class="text-gray-600 mt-3">${r.comment}</p>
                    </div>
                `;
            }).join('');
        }
        
        if (window.lucide) lucide.createIcons();
    },

    bindEvents() {
        document.getElementById('addToCartBtn').addEventListener('click', () => this.addToCart());
        document.getElementById('mobileAddToCart').addEventListener('click', () => this.addToCart());
        
        const reviewForm = document.getElementById('reviewForm');
        if (reviewForm) {
            reviewForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const rating = document.getElementById('rating').value;
                const comment = document.getElementById('comment').value;

                try {
                    await Utils.fetchApi(`/api/products/${this.state.product._id}/reviews`, {
                        method: 'POST',
                        body: JSON.stringify({ rating, comment })
                    });
                    
                    Toast.success('Review submitted successfully!');
                    this.loadProduct(this.state.product._id);
                } catch (error) {
                    Toast.error(error.message);
                }
            });
        }
    },

    addToCart() {
        const p = this.state.product;
        const qty = parseInt(document.getElementById('qty').value);
        const price = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
        const image = p.images && p.images.length > 0 ? p.images[0] : '';
        
        Cart.add(p._id, p.name, price, image, qty);
    },

    initZoom() {
        const container = document.getElementById('mainImageContainer');
        const img = document.getElementById('mainImage');
        const lens = document.getElementById('lens');

        if (window.innerWidth <= 768) return; // Disable zoom on mobile

        container.addEventListener('mouseenter', () => {
            lens.style.display = 'block';
            img.style.transform = 'scale(2)';
        });

        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Move lens
            let lensX = x - (lens.offsetWidth / 2);
            let lensY = y - (lens.offsetHeight / 2);

            // Boundary checks for lens
            if (lensX < 0) lensX = 0;
            if (lensY < 0) lensY = 0;
            if (lensX > rect.width - lens.offsetWidth) lensX = rect.width - lens.offsetWidth;
            if (lensY > rect.height - lens.offsetHeight) lensY = rect.height - lens.offsetHeight;

            lens.style.left = lensX + 'px';
            lens.style.top = lensY + 'px';

            // Move image opposite to cursor percentage
            const xPercent = (x / rect.width) * 100;
            const yPercent = (y / rect.height) * 100;
            
            img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
        });

        container.addEventListener('mouseleave', () => {
            lens.style.display = 'none';
            img.style.transform = 'scale(1)';
            img.style.transformOrigin = 'center center';
        });
    }
};

window.incrementQty = () => {
    const input = document.getElementById('qty');
    const max = ProductPage.state.product.stockQuantity;
    if (parseInt(input.value) < max) input.value = parseInt(input.value) + 1;
};

window.decrementQty = () => {
    const input = document.getElementById('qty');
    if (parseInt(input.value) > 1) input.value = parseInt(input.value) - 1;
};

document.addEventListener('DOMContentLoaded', () => {
    ProductPage.init();
});
