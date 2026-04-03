
// ── Combined E-Commerce Application ──────────────────────────────────────────
let _searchDebounceTimer    = null;
let _searchAbortController  = null;

// ── Levenshtein distance for fuzzy search ─────────────────────────────────────
function _levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            matrix[i][j] = b[i - 1] === a[j - 1]
                ? matrix[i - 1][j - 1]
                : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
        }
    }
    return matrix[b.length][a.length];
}

// ── Trending Section Configuration ────────────────────────────────────────────
const TRENDING_COUNT   = 12;    // how many products to show
const TRENDING_TTL_MS  = 5 * 60 * 1000; // 5-min cache lifetime

// ── Trending State ────────────────────────────────────────────────────────────
let _trendingProducts  = [];
let _trendingFetchedAt = 0;

// ── Trending DOM Helpers ──────────────────────────────────────────────────────
function _trendingHome() {
    const trending = document.getElementById('trending-section');
    if (!trending) return;
    trending.style.display = '';
    trending.style.marginTop = '';
    trending.style.borderTop = '';
    const productsSection = document.querySelector('.products-section');
    if (productsSection && productsSection.parentNode) {
        productsSection.parentNode.insertBefore(trending, productsSection);
    }
}

function _trendingIntoSlot() {
    const trending = document.getElementById('trending-section');
    const slot = document.getElementById('pd-trending-slot');
    if (!trending || !slot) return;
    trending.style.display = '';
    trending.style.marginTop = '0';
    trending.style.borderTop = 'none';
    slot.appendChild(trending);
}

function _trendingHide() {
    const trending = document.getElementById('trending-section');
    if (trending) trending.style.display = 'none';
}

// ── Trending Product Functions ────────────────────────────────────────────────
async function loadTrendingProducts() {
    const scroll = document.getElementById('trending-scroll');
    const countEl = document.getElementById('trending-count');
    if (!scroll) return;

    _showTrendingSkeleton(scroll);
    if (countEl) countEl.textContent = 'Loading…';

    const now = Date.now();
    if (_trendingProducts.length > 0 && (now - _trendingFetchedAt) < TRENDING_TTL_MS) {
        _renderTrendingCards(_trendingProducts, scroll, countEl);
        return;
    }

    try {
        let pool = _getAppProducts();

        if (!pool || pool.length === 0) {
            const res = await fetch('/api/products');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            pool = await res.json();
        }

        if (!Array.isArray(pool) || pool.length === 0) {
            throw new Error('No products available');
        }

        const inStock = pool.filter(p => parseInt(p.stock || 0) > 0);
        const outStock = pool.filter(p => parseInt(p.stock || 0) <= 0);
        const shuffled = [..._shuffle(inStock), ..._shuffle(outStock)];
        _trendingProducts = shuffled.slice(0, TRENDING_COUNT);
        _trendingFetchedAt = Date.now();

        _renderTrendingCards(_trendingProducts, scroll, countEl);

    } catch (err) {
        console.warn('[Trending] load failed:', err.message);
        scroll.innerHTML = `
            <div style="padding:20px;color:#888;font-size:13px;text-align:center;width:100%;">
                ⚠️ Could not load trending products.
                <button onclick="loadTrendingProducts()" style="
                    margin-top:8px;display:block;margin-left:auto;margin-right:auto;
                    padding:6px 16px;background:#2c5530;color:white;border:none;
                    border-radius:6px;cursor:pointer;font-size:12px;">
                    Retry
                </button>
            </div>`;
        if (countEl) countEl.textContent = '';
    }
}

function _renderTrendingCards(products, scroll, countEl) {
    if (countEl) {
        countEl.textContent = `${products.length} item${products.length !== 1 ? 's' : ''}`;
    }

    scroll.innerHTML = products.map((p, idx) => {
        const img = _resolveImg(p.image_url);
        const price = parseFloat(p.price) || 0;
        const stock = parseInt(p.stock) || 0;
        const inStock = stock > 0;

        return `
        <div class="trending-card"
             onclick="app.showProductDetail(${p.id})"
             title="${_esc(p.name)}"
             style="animation-delay:${idx * 0.05}s;cursor:pointer;">
            <div class="trending-card-img-wrap" style="position:relative;">
                <img src="${img}"
                     alt="${_esc(p.name)}"
                     loading="lazy"
                     onerror="this.onerror=null;this.src='/uploads/default-logo.webp'"
                     style="width:100%;aspect-ratio:1/1;object-fit:contain;
                            background:#f5f5f5;border-radius:10px;display:block;padding:6px;">
                ${!inStock ? `
                <div style="position:absolute;top:6px;right:6px;background:#e74c3c;
                            color:white;font-size:9px;font-weight:700;
                            padding:2px 7px;border-radius:10px;letter-spacing:.3px;">
                    Out of Stock
                </div>` : ''}
                ${inStock && idx < 3 ? `
                <div style="position:absolute;top:6px;left:6px;
                            background:linear-gradient(135deg,#ff6b35,#f7931e);
                            color:white;font-size:9px;font-weight:700;
                            padding:2px 7px;border-radius:10px;letter-spacing:.3px;">
                    🔥 Hot
                </div>` : ''}
            </div>
            <div class="trending-card-info" style="padding:8px 4px 4px;">
                <div class="trending-card-name" style="
                    font-size:12px;font-weight:600;color:#1a1a2e;line-height:1.35;
                    margin-bottom:4px;
                    display:-webkit-box;-webkit-line-clamp:2;
                    -webkit-box-orient:vertical;overflow:hidden;">
                    ${_esc(p.name)}
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:4px;">
                    <div style="font-size:13px;font-weight:800;color:#2c5530;">
                        Ksh ${price.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                    </div>
                    ${inStock ? `
                    <button onclick="event.stopPropagation(); _trendingAddToCart(${p.id})"
                            style="padding:3px 10px;background:linear-gradient(135deg,#2c5530,#3d7a43);
                                   color:white;border:none;border-radius:6px;cursor:pointer;
                                   font-size:10px;font-weight:700;white-space:nowrap;
                                   transition:opacity .2s;"
                            onmouseover="this.style.opacity='.82'"
                            onmouseout="this.style.opacity='1'">
                        + Cart
                    </button>` : `
                    <span style="font-size:10px;color:#e74c3c;font-weight:600;">Sold out</span>`}
                </div>
            </div>
        </div>`;
    }).join('');

    scroll.querySelectorAll('.trending-card').forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(8px)';
        setTimeout(() => {
            card.style.transition = 'opacity .3s ease, transform .3s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, i * 50);
    });
}

function _trendingAddToCart(productId) {
    const pool = _getAppProducts();
    let product = (pool || []).find(p => p.id === productId) || _trendingProducts.find(p => p.id === productId);
    if (product && typeof app !== 'undefined') {
        app.addToCart(product);
    } else {
        console.warn('[Trending] product not found for id:', productId);
    }
}

function scrollTrending(direction) {
    const scroll = document.getElementById('trending-scroll');
    if (!scroll) return;
    const cardWidth = (scroll.querySelector('.trending-card') || { offsetWidth: 180 }).offsetWidth + 12;
    scroll.scrollBy({ left: direction * cardWidth * 2, behavior: 'smooth' });
}

function _showTrendingSkeleton(scroll) {
    scroll.innerHTML = Array(6).fill(0).map(() => `
        <div class="trending-skeleton" style="
            min-width:140px;max-width:160px;flex-shrink:0;border-radius:12px;
            background:white;overflow:hidden;border:1px solid #eee;">
            <div style="width:100%;aspect-ratio:1/1;
                background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);
                background-size:200% 100%;animation:trendShimmer 1.4s infinite;"></div>
            <div style="padding:8px;">
                <div style="height:12px;border-radius:4px;margin-bottom:6px;
                    background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);
                    background-size:200% 100%;animation:trendShimmer 1.4s infinite;"></div>
                <div style="height:12px;width:60%;border-radius:4px;
                    background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);
                    background-size:200% 100%;animation:trendShimmer 1.4s infinite;"></div>
            </div>
        </div>
    `).join('');
}

// ── Trending Helper Functions ─────────────────────────────────────────────────
function _getAppProducts() {
    if (typeof app !== 'undefined' && app._masterProducts && app._masterProducts.length > 0) {
        return app._masterProducts;
    }
    return null;
}

function _resolveImg(url) {
    if (!url) return '/uploads/default-logo.webp';
    if (url.startsWith('http') || url.startsWith('/uploads/')) return url;
    if (url.startsWith('uploads/')) return '/' + url;
    return '/uploads/' + url;
}

function _esc(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ── Main Application Class ────────────────────────────────────────────────────
class ECommerceApp {
    constructor() {
        this.products = [];
        this._masterProducts = [];
        this.currentCategory = 'all';
        this.cart = [];
        this.currentToken = localStorage.getItem('token');
        this.isSyncing = false;

        this._currentView = 'products';
        this._currentProductId = null;
        this._currentQuery = '';
        this._searchCache = new Map();

        this.init();
    }

    init() {
        this.loadCartFromStorage();
        this.setupEventListeners();
        this.updateCartCount();
        this.loadAllProducts().then(() => {
            this._restorePageState();
            // Load trending products after main app is initialized
            setTimeout(loadTrendingProducts, 200);
        });
        if (this.isUserAuthenticated()) this.syncCartWithBackend();
    }

    isUserAuthenticated() {
        return this.currentToken &&
               this.currentToken !== 'null' &&
               this.currentToken !== 'undefined';
    }

    setupEventListeners() {
        const modal = document.getElementById('productModal');
        const closeBtn = document.querySelector('.close');
        if (closeBtn) closeBtn.onclick = () => { if (modal) modal.style.display = 'none'; };
        window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

        const checkoutModal = document.getElementById('checkoutModal');
        const cancelCheckout = document.getElementById('cancelCheckout');
        if (cancelCheckout) cancelCheckout.onclick = () => checkoutModal.style.display = 'none';
        window.addEventListener('click', (e) => { if (e.target === checkoutModal) checkoutModal.style.display = 'none'; });

        const searchInput = document.getElementById('search-bar');
        if (searchInput) searchInput.addEventListener('input', (e) => searchProducts(e.target.value));

        window.addEventListener('beforeunload', () => this._savePageState());
    }

    // ── Reload persistence ────────────────────────────────────────────────────
    _savePageState() {
        const searchBar = document.getElementById('search-bar');
        sessionStorage.setItem('vt_page_state', JSON.stringify({
            view: this._currentView,
            productId: this._currentProductId,
            query: searchBar?.value?.trim() || this._currentQuery,
            category: this.currentCategory || 'all'
        }));
    }

    _restorePageState() {
        const raw = sessionStorage.getItem('vt_page_state');
        if (!raw) return;
        let state;
        try { state = JSON.parse(raw); } catch { return; }
        sessionStorage.removeItem('vt_page_state');
        if (!this._masterProducts || this._masterProducts.length === 0) return;

        if (state.view === 'detail' && state.productId) {
            this.showProductDetail(state.productId);
        } else if (state.view === 'search' && state.query) {
            const bar = document.getElementById('search-bar');
            if (bar) bar.value = state.query;
            this.searchProducts(state.query);
        } else if (state.category && state.category !== 'all') {
            this.filterByCategory(state.category);
        } else {
            _trendingHome();
        }
    }

    // ── Cart Functions ────────────────────────────────────────────────────────
    addToCart(product, quantity = 1) {
        let productObj;
        if (typeof product === 'string') {
            try { productObj = JSON.parse(product); }
            catch { this.showNotification('Error adding product to cart'); return; }
        } else {
            productObj = product;
        }

        const cartProduct = {
            id: productObj.id,
            name: productObj.name,
            price: parseFloat(productObj.price),
            image_url: productObj.image_url || '/uploads/default-logo.webp',
            stock_quantity: productObj.stock_quantity,
            description: productObj.description
        };

        const idx = this.cart.findIndex(i => i.id === cartProduct.id);
        if (idx > -1) { this.cart[idx].quantity += quantity; }
        else { this.cart.push({ ...cartProduct, quantity }); }

        this.saveCartToStorage();
        this.updateCartCount();
        this.showNotification(`${cartProduct.name} added to cart!`);
        this.refreshCartModal();

        if (this.isUserAuthenticated() && !this.isSyncing) {
            this.syncItemToBackend(cartProduct, idx > -1 ? this.cart[idx].quantity : quantity);
        }
    }

    removeFromCart(productId) {
        const item = this.cart.find(i => i.id === productId);
        this.cart = this.cart.filter(i => i.id !== productId);
        this.saveCartToStorage();
        this.updateCartCount();
        this.showNotification('Item removed from cart');
        if (this.isUserAuthenticated() && item) this.removeItemFromBackend(item.id);
        this.refreshCartModal();
    }

    updateQuantity(productId, newQty) {
        const idx = this.cart.findIndex(i => i.id === productId);
        if (idx > -1) {
            if (newQty <= 0) { this.removeFromCart(productId); }
            else {
                this.cart[idx].quantity = newQty;
                this.saveCartToStorage();
                this.updateCartCount();
                if (this.isUserAuthenticated()) this.updateQuantityInBackend(productId, newQty);
                this.refreshCartModal();
            }
        }
    }

    getCartTotal() { return this.cart.reduce((t, i) => t + i.price * i.quantity, 0); }
    getCartItemCount() { return this.cart.reduce((t, i) => t + i.quantity, 0); }

    updateCartCount() {
        const el = document.getElementById('cart-count');
        if (!el) return;
        const n = this.getCartItemCount();
        el.textContent = n;
        el.style.display = n > 0 ? 'block' : 'none';
    }

    saveCartToStorage() { localStorage.setItem('ecommerce_cart', JSON.stringify(this.cart)); }
    
    loadCartFromStorage() {
        try {
            const s = localStorage.getItem('ecommerce_cart');
            this.cart = s ? JSON.parse(s) : [];
        } catch { this.cart = []; }
    }

    // ── Cart page view ────────────────────────────────────────────────────────
    showCart() { this._showCartView(); }

    _showCartView() {
        const section = document.querySelector('.products-section .container');
        if (!section) return;
        this._currentView = 'cart';
        this._currentProductId = null;
        _trendingHide();
        this.loadCartFromStorage();
        section.innerHTML = this._buildCartViewHTML();
    }

    _buildCartViewHTML() {
        const itemCount = this.getCartItemCount();
        const total = this.getCartTotal();

        const itemsHTML = this.cart.length === 0
            ? `<div style="text-align:center;padding:60px 20px;color:#888;">
                   <div style="font-size:56px;margin-bottom:16px;">🛒</div>
                   <h3 style="font-size:18px;margin:0 0 8px;color:#444;">Your cart is empty</h3>
                   <p style="font-size:14px;margin:0 0 24px;">Browse our products and add something you like.</p>
                   <button onclick="app._restorePreviousView()" style="
                       padding:10px 24px;background:#2c5530;color:white;border:none;
                       border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;">
                       Browse Products
                   </button>
               </div>`
            : this.cart.map((item, idx) => {
                const imageUrl = item.image_url || '/uploads/default-logo.webp';
                const lineTotal = (item.price * item.quantity).toLocaleString('en-KE', { minimumFractionDigits: 2 });
                return `
                <div class="cv-item" id="cv-item-${item.id}" style="
                    display:flex;align-items:center;gap:14px;padding:14px;
                    border:1px solid #eee;border-radius:12px;background:white;
                    margin-bottom:10px;animation:cvFadeIn .25s ease ${idx * 0.05}s both;">
                    <img src="${imageUrl}" alt="${item.name}"
                         style="width:72px;height:72px;object-fit:contain;border-radius:8px;
                                background:#f5f5f5;flex-shrink:0;padding:4px;"
                         onerror="this.src='/uploads/default-logo.webp'">
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:14px;font-weight:600;color:#1a1a2e;white-space:nowrap;
                                    overflow:hidden;text-overflow:ellipsis;margin-bottom:4px;">${item.name}</div>
                        <div style="font-size:13px;color:#2c5530;font-weight:700;margin-bottom:8px;">
                            Ksh ${item.price.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <button onclick="app._cartUpdateQty(${item.id}, ${item.quantity - 1})"
                                    style="width:28px;height:28px;border:1px solid #ddd;background:white;
                                           border-radius:6px;cursor:pointer;font-size:16px;font-weight:600;
                                           display:flex;align-items:center;justify-content:center;">−</button>
                            <span style="min-width:28px;text-align:center;font-weight:700;font-size:14px;">
                                ${item.quantity}
                            </span>
                            <button onclick="app._cartUpdateQty(${item.id}, ${item.quantity + 1})"
                                    style="width:28px;height:28px;border:1px solid #ddd;background:white;
                                           border-radius:6px;cursor:pointer;font-size:16px;font-weight:600;
                                           display:flex;align-items:center;justify-content:center;">+</button>
                        </div>
                    </div>
                    <div style="text-align:right;flex-shrink:0;">
                        <div style="font-size:14px;font-weight:700;color:#1a1a2e;margin-bottom:10px;">
                            Ksh ${lineTotal}
                        </div>
                        <button onclick="app._cartRemove(${item.id})"
                                style="background:#fee2e2;color:#dc2626;border:none;width:30px;height:30px;
                                       border-radius:6px;cursor:pointer;font-size:16px;
                                       display:flex;align-items:center;justify-content:center;">×</button>
                    </div>
                </div>`;
            }).join('');

        const summaryHTML = this.cart.length > 0 ? `
            <div style="background:white;border:1px solid #eee;border-radius:12px;padding:20px;margin-top:8px;">
                <div style="display:flex;justify-content:space-between;font-size:14px;color:#666;margin-bottom:8px;">
                    <span>Subtotal (${itemCount} item${itemCount !== 1 ? 's' : ''})</span>
                    <span>Ksh ${total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:14px;color:#666;
                            margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #eee;">
                    <span>Delivery</span><span>Ksh 100.00</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:17px;font-weight:800;
                            color:#1a1a2e;margin-bottom:20px;">
                    <span>Total</span>
                    <span>Ksh ${(total + 100).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:10px;">
                    <button onclick="app._cartCheckout()" style="
                        padding:14px;background:linear-gradient(135deg,#2c5530,#3d7a43);color:white;
                        border:none;border-radius:10px;cursor:pointer;font-size:15px;font-weight:700;
                        box-shadow:0 4px 12px rgba(44,85,48,0.3);transition:opacity .2s;"
                        onmouseover="this.style.opacity='.88'" onmouseout="this.style.opacity='1'">
                        Proceed to Checkout
                    </button>
                    <button onclick="app._cartWhatsapp()" style="
                        padding:13px;background:linear-gradient(135deg,#25D366,#1aa34a);color:white;
                        border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:700;
                        display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity .2s;"
                        onmouseover="this.style.opacity='.88'" onmouseout="this.style.opacity='1'">
                        <img src="/img/images/whatsapp.png" alt="WhatsApp"
                             style="width:18px;height:18px;object-fit:contain;">
                        Order via WhatsApp
                    </button>
                </div>
            </div>` : '';

        return `
            <style>@keyframes cvFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}</style>
            <div id="cart-page-view" style="max-width:680px;margin:0 auto;padding:0 0 40px;">
                <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;flex-wrap:wrap;">
                    <button onclick="app._restorePreviousView()" style="
                        display:inline-flex;align-items:center;gap:6px;padding:9px 18px;
                        background:#2c5530;color:white;border:none;border-radius:8px;
                        cursor:pointer;font-size:14px;font-weight:600;transition:opacity .2s;flex-shrink:0;"
                        onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
                        ← Continue Shopping
                    </button>
                    <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:0;">
                        Cart
                        <span style="font-size:13px;font-weight:500;color:#888;margin-left:6px;">
                            (${itemCount} item${itemCount !== 1 ? 's' : ''})
                        </span>
                    </h2>
                    ${this.cart.length > 0 ? `
                    <button onclick="app._cartClearAll()" style="
                        margin-left:auto;padding:6px 14px;background:#fee2e2;color:#dc2626;
                        border:1px solid #fca5a5;border-radius:6px;cursor:pointer;
                        font-size:12px;font-weight:600;">Clear all</button>` : ''}
                </div>
                <div id="cv-items-wrap">${itemsHTML}</div>
                <div id="cv-summary-wrap">${summaryHTML}</div>
            </div>`;
    }

    _cartUpdateQty(productId, newQty) {
        if (newQty <= 0) { this._cartRemove(productId); return; }
        const idx = this.cart.findIndex(i => i.id === productId);
        if (idx === -1) return;
        this.cart[idx].quantity = newQty;
        this.saveCartToStorage();
        this.updateCartCount();
        if (this.isUserAuthenticated()) this.updateQuantityInBackend(productId, newQty);
        const section = document.querySelector('.products-section .container');
        if (section && section.querySelector('#cart-page-view')) section.innerHTML = this._buildCartViewHTML();
    }

    _cartRemove(productId) {
        const item = this.cart.find(i => i.id === productId);
        this.cart = this.cart.filter(i => i.id !== productId);
        this.saveCartToStorage();
        this.updateCartCount();
        this.showNotification('Item removed');
        if (this.isUserAuthenticated() && item) this.removeItemFromBackend(item.id);
        const section = document.querySelector('.products-section .container');
        if (section && section.querySelector('#cart-page-view')) section.innerHTML = this._buildCartViewHTML();
    }

    _cartClearAll() {
        this.cart = [];
        this.saveCartToStorage();
        this.updateCartCount();
        const section = document.querySelector('.products-section .container');
        if (section && section.querySelector('#cart-page-view')) section.innerHTML = this._buildCartViewHTML();
    }

    _cartCheckout() {
        if (!this.cart.length) { this.showNotification('Your cart is empty!'); return; }
        this._showCheckoutView();
    }

    _cartWhatsapp() {
        if (!this.cart.length) { this.showNotification('Your cart is empty!'); return; }
        this.completeOrderViaWhatsApp();
    }

    // ── Checkout ──────────────────────────────────────────────────────────────
    _showCheckoutView() {
        const section = document.querySelector('.products-section .container');
        if (!section) return;
        this._currentView = 'checkout';
        this._currentProductId = null;
        const total = this.getCartTotal();
        const finalTotal = total + 100;

        section.innerHTML = `
            <style>
                @keyframes cvFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
                .co-input{width:100%;padding:11px 14px;border:1px solid #ddd;border-radius:8px;font-size:14px;box-sizing:border-box;transition:border-color .2s;}
                .co-input:focus{outline:none;border-color:#2c5530;box-shadow:0 0 0 3px rgba(44,85,48,0.1);}
            </style>
            <div style="max-width:560px;margin:0 auto;padding:0 0 40px;animation:cvFadeIn .3s ease;">
                <button onclick="app._showCartView()" style="
                    display:inline-flex;align-items:center;gap:6px;margin-bottom:24px;padding:9px 18px;
                    background:#2c5530;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;">
                    ← Back to Cart
                </button>
                <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:0 0 20px;">Checkout</h2>
                <div style="background:#f9f9f9;border:1px solid #eee;border-radius:12px;padding:16px;margin-bottom:20px;">
                    <h4 style="margin:0 0 12px;font-size:14px;color:#555;text-transform:uppercase;letter-spacing:.5px;">Order Summary</h4>
                    ${this.cart.map(item => `
                        <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid #eee;color:#444;">
                            <span style="flex:1;margin-right:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                                ${item.name} <span style="color:#888;">× ${item.quantity}</span>
                            </span>
                            <span style="font-weight:600;flex-shrink:0;">
                                Ksh ${(item.price * item.quantity).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                            </span>
                        </div>`).join('')}
                    <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;color:#666;">
                        <span>Delivery</span><span>Ksh 100.00</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:#2c5530;padding-top:10px;border-top:2px solid #ddd;margin-top:4px;">
                        <span>Total</span>
                        <span>Ksh ${finalTotal.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
                <div style="background:white;border:1px solid #eee;border-radius:12px;padding:20px;margin-bottom:16px;">
                    <h4 style="margin:0 0 16px;font-size:14px;color:#555;text-transform:uppercase;letter-spacing:.5px;">Your Details</h4>
                    <div style="display:flex;flex-direction:column;gap:12px;">
                        <div><label style="display:block;font-size:13px;font-weight:600;color:#444;margin-bottom:5px;">Full Name *</label>
                            <input id="co-name" type="text" class="co-input" placeholder="e.g. Jane Wanjiku"></div>
                        <div><label style="display:block;font-size:13px;font-weight:600;color:#444;margin-bottom:5px;">Phone Number *</label>
                            <input id="co-phone" type="tel" class="co-input" placeholder="07XX XXX XXX"></div>
                        <div><label style="display:block;font-size:13px;font-weight:600;color:#444;margin-bottom:5px;">Shipping Address *</label>
                            <textarea id="co-address" class="co-input" rows="3" placeholder="Enter your full delivery address" style="resize:vertical;"></textarea></div>
                        <div><label style="display:block;font-size:13px;font-weight:600;color:#444;margin-bottom:5px;">Notes (optional)</label>
                            <textarea id="co-notes" class="co-input" rows="2" placeholder="Any special delivery instructions" style="resize:vertical;"></textarea></div>
                    </div>
                </div>
                <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-bottom:20px;">
                    <h4 style="margin:0 0 8px;font-size:14px;color:#92400e;">Payment Instructions</h4>
                    <p style="margin:0 0 6px;font-size:13px;color:#78350f;">We accept payment via <strong>M-Pesa Pochi La Biashara</strong>.</p>
                    <p style="margin:0;font-size:13px;color:#78350f;">
                        Pochi No: <strong style="color:#dc2626;font-size:15px;">0703 182 530</strong> —
                        pay <strong>Ksh ${finalTotal.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</strong> after placing order.
                    </p>
                </div>
                <button id="co-submit-btn" onclick="app._submitCheckout()" style="
                    width:100%;padding:14px;background:linear-gradient(135deg,#2c5530,#3d7a43);color:white;
                    border:none;border-radius:10px;cursor:pointer;font-size:15px;font-weight:700;
                    box-shadow:0 4px 12px rgba(44,85,48,0.3);transition:opacity .2s;"
                    onmouseover="this.style.opacity='.88'" onmouseout="this.style.opacity='1'">
                    Place Order
                </button>
            </div>`;
    }

    async _submitCheckout() {
        const name = document.getElementById('co-name')?.value.trim();
        const phone = document.getElementById('co-phone')?.value.trim();
        const address = document.getElementById('co-address')?.value.trim();
        const notes = document.getElementById('co-notes')?.value.trim();

        if (!name || !phone || !address) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        const phoneRegex = /^(\+?254|0)?[17]\d{8}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
            this.showNotification('Please enter a valid Kenyan phone number (e.g. 0712345678)', 'error');
            return;
        }

        const btn = document.getElementById('co-submit-btn');
        if (btn) { btn.disabled = true; btn.textContent = 'Placing order…'; }

        const total = this.getCartTotal();
        const fullAddress = notes ? `${address}\n\nNotes: ${notes}` : address;

        try {
            const res = await fetch('/api/orders/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    user_id: this.getCurrentUserId(),
                    total_amount: total,
                    shipping_address: fullAddress,
                    payment_method: 'standard_checkout',
                    customer_phone: phone,
                    customer_name: name,
                    cart_items: this.cart
                })
            });
            
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || `Error ${res.status}`);
            
            if (result.success) {
                this.cart = [];
                this._currentView = 'products';
                this._currentProductId = null;
                this._currentQuery = '';
                this.saveCartToStorage();
                this.updateCartCount();
                
                const section = document.querySelector('.products-section .container');
                if (section) {
                    section.innerHTML = `
                        <div style="max-width:480px;margin:60px auto;text-align:center;padding:0 20px 60px;">
                            <style>@keyframes cvFadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}</style>
                            <div style="font-size:64px;margin-bottom:16px;animation:cvFadeIn .4s ease;">✅</div>
                            <h2 style="font-size:22px;font-weight:800;color:#2c5530;margin:0 0 10px;">Order Confirmed!</h2>
                            <p style="font-size:14px;color:#555;margin:0 0 6px;">Order ID: <strong>${result.orderId}</strong></p>
                            <p style="font-size:14px;color:#555;margin:0 0 24px;">
                                Please pay <strong>Ksh ${(total + 100).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</strong>
                                via M-Pesa Pochi La Biashara to <strong style="color:#dc2626;">0703 182 530</strong>.
                            </p>
                            <button onclick="app.showAllProductsView()" style="
                                padding:12px 28px;background:#2c5530;color:white;border:none;
                                border-radius:8px;cursor:pointer;font-size:14px;font-weight:700;">
                                Continue Shopping
                            </button>
                        </div>`;
                    _trendingHome();
                }
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            let msg = 'Failed to place order. ';
            if (err.message.includes('Failed to fetch')) msg += 'Check your internet connection.';
            else msg += err.message;
            this.showNotification(msg, 'error');
            if (btn) { btn.disabled = false; btn.textContent = 'Place Order'; }
        }
    }

    _restorePreviousView() { this.showAllProductsView(); }

    displayCartModal() { this._showCartView(); }

    refreshCartModal() {
        const section = document.querySelector('.products-section .container');
        if (section && section.querySelector('#cart-page-view')) section.innerHTML = this._buildCartViewHTML();
    }

    // ── Main Products View ────────────────────────────────────────────────────
    showAllProductsView() {
        const section = document.querySelector('.products-section .container');
        if (!section) return;

        section.innerHTML = `
            <h2 id="section-title">All Products</h2>
            <div class="products-grid" id="products-grid"></div>
            <div id="loading" class="loading" style="display:none;">Loading products...</div>
            <div id="error-message" class="error-message" style="display:none;"></div>
        `;

        this._isSearchActive = false;
        this._currentView = 'products';
        this._currentProductId = null;
        this._currentQuery = '';
        this._searchCache.clear();

        _trendingHome();

        if (this._masterProducts && this._masterProducts.length > 0) {
            this._allProducts = [...this._masterProducts];
            this.displayProducts(this._allProducts);
        } else if (this.products && this.products.length > 0) {
            this._masterProducts = [...this.products];
            this._allProducts = [...this.products];
            this.displayProducts(this._allProducts);
        } else {
            this.loadAllProducts();
        }
        
        // Refresh trending products when showing all products
        setTimeout(loadTrendingProducts, 100);
    }

    // ── Standard Checkout ─────────────────────────────────────────────────────
    standardCheckout() {
        const itemCount = this.getCartItemCount();
        const total = this.getCartTotal().toFixed(2);
        const finalTotal = (parseFloat(total) + 100).toFixed(2);
        const self = this;
        const modal = document.getElementById('checkoutModal');
        const details = document.getElementById('checkoutDetails');
        const proceedBtn = document.getElementById('proceedCheckout');
        const cancelBtn = document.getElementById('cancelCheckout');

        details.innerHTML = `
            <div class="checkout-form">
                <h3>Order Summary</h3>
                <p>Proceed with standard checkout for <strong>${itemCount}</strong> items?</p>
                <p>Total: Ksh ${total}</p><p>Delivery Fee: Ksh 100</p>
                <p><strong>Final Total: Ksh ${finalTotal}</strong></p>
                <div class="customer-info"><h4>Customer Information</h4>
                    <div class="form-group"><label>Enter Name *</label>
                        <input type="text" id="customerName" required placeholder="e.g Micheal Monach"></div>
                    <div class="form-group"><label>Phone Number *</label>
                        <input type="tel" id="customerPhone" required placeholder="07XX XXX XXX"></div>
                    <div class="form-group"><label>Shipping Address *</label>
                        <textarea id="shippingAddress" required placeholder="Enter your complete shipping address"></textarea></div>
                    <div class="form-group"><label>Additional Notes (Optional)</label>
                        <textarea id="customerNotes" placeholder="Any special delivery instructions"></textarea></div>
                </div>
                <div class="payment-info"><h4>Payment Instructions</h4>
                    <p>Kindly note, we are only accepting online payments via pochi la biashara</p>
                    <p>Enter Pochi Biashara No: <strong style="color:red;">0703 182 530</strong> and pay Ksh ${finalTotal} to complete payment.</p>
                </div>
            </div>`;
        modal.style.display = 'block';

        proceedBtn.onclick = async () => {
            const customerName = document.getElementById('customerName').value;
            const customerPhone = document.getElementById('customerPhone').value;
            const shippingAddress = document.getElementById('shippingAddress').value;
            const customerNotes = document.getElementById('customerNotes').value;
            
            if (!customerName || !customerPhone || !shippingAddress) {
                self.showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            const phoneRegex = /^(\+?254|0)?[17]\d{8}$/;
            if (!phoneRegex.test(customerPhone.replace(/\s/g, ''))) {
                self.showNotification('Please enter a valid Kenyan phone number', 'error');
                return;
            }
            
            const fullShippingAddress = customerNotes
                ? `${shippingAddress}\n\nAdditional Notes: ${customerNotes}` : shippingAddress;
            const origText = proceedBtn.textContent;
            proceedBtn.disabled = true;
            proceedBtn.textContent = 'Processing Order...';
            
            try {
                const response = await fetch('/api/orders/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({
                        user_id: self.getCurrentUserId(),
                        total_amount: parseFloat(total),
                        shipping_address: fullShippingAddress,
                        payment_method: 'standard_checkout',
                        customer_phone: customerPhone,
                        customer_name: customerName,
                        cart_items: self.cart
                    })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || `HTTP ${response.status}`);
                if (result.success) {
                    self.cart = [];
                    self.saveCartToStorage();
                    self.updateCartCount();
                    self.closeModal();
                    if (typeof Toastify !== 'undefined') {
                        Toastify({
                            text: `✅ Order Confirmed!\nOrder ID: ${result.orderId}\nTotal: Ksh ${finalTotal}\n\nPay via M-Pesa Pochi La Biashara No: 0703 182 530.`,
                            duration: 120000,
                            close: true,
                            gravity: 'top',
                            position: 'center',
                            backgroundColor: '#28a745',
                            stopOnFocus: true
                        }).showToast();
                    }
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                let msg = 'Failed to place order. ';
                if (error.message.includes('Failed to fetch')) msg += 'Cannot connect to server.';
                else if (error.message.includes('404')) msg += 'Server endpoint not found.';
                else msg += error.message;
                self.showNotification(msg, 'error');
            } finally {
                proceedBtn.disabled = false;
                proceedBtn.textContent = origText;
            }
        };
        cancelBtn.onclick = () => { modal.style.display = 'none'; };
    }

    getCurrentUserId() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData).id : null;
    }

    completeOrderViaWhatsApp() {
        if (!this.cart.length) { this.showNotification('Your cart is empty.'); return; }
        const total = this.getCartTotal();
        const detailsModal = document.createElement('div');
        detailsModal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:10000;display:flex;align-items:center;justify-content:center;color:white;font-family:Arial,sans-serif;`;
        detailsModal.innerHTML = `
            <div style="background:#222;border-radius:10px;padding:20px;max-width:500px;width:90%;">
                <h2 style="color:#25D366;text-align:center;">Complete Your WhatsApp Order</h2>
                <form id="orderDetailsForm">
                    <div style="margin-bottom:15px;"><label style="display:block;margin-bottom:5px;">Full Name *</label>
                        <input type="text" id="fullName" required style="width:100%;padding:10px;border-radius:5px;border:none;"></div>
                    <div style="margin-bottom:15px;"><label style="display:block;margin-bottom:5px;">Delivery Address *</label>
                        <input type="text" id="deliveryAddress" required style="width:100%;padding:10px;border-radius:5px;border:none;"></div>
                    <div style="margin-bottom:20px;"><label style="display:block;margin-bottom:5px;">WhatsApp Number *</label>
                        <input type="tel" id="whatsappNumber" required placeholder="2547XXXXXXXX or 07XXXXXXXX" style="width:100%;padding:10px;border-radius:5px;border:none;">
                        <small style="color:#ccc;">We'll contact you on this number</small></div>
                    <div style="display:flex;gap:10px;">
                        <button type="submit" style="flex:1;padding:12px;background:#25D366;color:white;border:none;border-radius:5px;cursor:pointer;">Continue to WhatsApp</button>
                        <button type="button" id="cancelDetailsBtn" style="flex:1;padding:12px;background:#555;color:white;border:none;border-radius:5px;cursor:pointer;">Cancel</button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(detailsModal);
        
        detailsModal.querySelector('#orderDetailsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const fullName = document.getElementById('fullName').value.trim();
            const deliveryAddress = document.getElementById('deliveryAddress').value.trim();
            let whatsappNumber = document.getElementById('whatsappNumber').value.trim();
            
            if (!fullName || !deliveryAddress || !whatsappNumber) {
                this.showNotification('Please fill in all required fields.');
                return;
            }
            
            whatsappNumber = whatsappNumber.replace(/\D/g, '');
            if (whatsappNumber.startsWith('0')) whatsappNumber = '254' + whatsappNumber.substring(1);
            else if (whatsappNumber.startsWith('7')) whatsappNumber = '254' + whatsappNumber;
            
            if (!/^2547\d{8}$/.test(whatsappNumber)) {
                this.showNotification('Please enter a valid Kenyan WhatsApp number');
                return;
            }
            
            const order = {
                id: 'ORD' + Date.now().toString().slice(-6),
                date: new Date().toLocaleString(),
                paymentMethod: 'WhatsApp Order',
                subtotal: total,
                deliveryFee: 100,
                finalTotal: total + 100,
                items: [...this.cart],
                user: { fullName, phone: whatsappNumber, deliveryAddress }
            };
            
            document.body.removeChild(detailsModal);
            this.generateWhatsAppOrder(order);
        });
        
        detailsModal.querySelector('#cancelDetailsBtn').addEventListener('click', () => {
            document.body.removeChild(detailsModal);
        });
    }

    generateWhatsAppOrder(order) {
        const message = `*NEW ORDER - VITRONICS STORE*\n\n*ORDER SUMMARY*\nOrder #: ${order.id}\nDate: ${order.date}\n\n*ITEMS ORDERED*\n${order.items.map(i => `${i.name}\nQuantity: ${i.quantity}\nPrice: Ksh ${(i.price * i.quantity).toLocaleString()}`).join('\n\n')}\n\n*PAYMENT SUMMARY*\nSubtotal: Ksh ${order.subtotal.toLocaleString()}\nDelivery: Ksh ${order.deliveryFee.toLocaleString()}\nTOTAL: Ksh ${order.finalTotal.toLocaleString()}\n\n*CUSTOMER DETAILS*\nName: ${order.user.fullName}\nPhone: ${order.user.phone}\nAddress: ${order.user.deliveryAddress}\n\n📞 Call/WhatsApp: +254 703 182530`.trim();
        
        const modal = document.createElement('div');
        modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-family:Arial,sans-serif;`;
        modal.innerHTML = `
            <div style="background:#222;border-radius:10px;padding:20px;max-width:500px;width:90%;">
                <h2 style="color:#25D366;text-align:center;">Your Order is Ready</h2>
                <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
                    <a href="https://wa.me/254703182530?text=${encodeURIComponent(message)}" target="_blank"
                       style="display:block;background:#25D366;color:white;text-align:center;padding:15px;border-radius:8px;text-decoration:none;font-weight:bold;">
                        📱 Send as WhatsApp Message
                    </a>
                </div>
                <div style="background:#333;padding:15px;border-radius:8px;margin-bottom:15px;">
                    <p style="margin-top:0;">Order Summary:</p>
                    <div id="orderMessage" style="width:100%;height:200px;padding:10px;margin-bottom:10px;border-radius:5px;background:#444;color:white;border:1px solid #666;overflow-y:auto;white-space:pre-wrap;font-family:monospace;user-select:text;-webkit-user-select:text;cursor:text;">${message}</div>
                    <button id="copyButton" style="width:100%;padding:10px;background:#555;color:white;border:none;border-radius:5px;cursor:pointer;">📋 Copy Order Details</button>
                </div>
                <button id="closeButton" style="width:100%;padding:10px;background:#f14848;color:white;border:none;border-radius:5px;cursor:pointer;">Cancel Your Order</button>
            </div>`;
        document.body.appendChild(modal);
        
        modal.querySelector('#copyButton').addEventListener('click', () => {
            const txt = document.getElementById('orderMessage').textContent;
            if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(txt).then(() => this.showCopyFeedback(modal.querySelector('#copyButton')));
            } else {
                this.fallbackCopyText(txt);
            }
        });
        
        modal.querySelector('#closeButton').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.showCancellationConfirmation(order.id);
        });
    }

    fallbackCopyText(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:absolute;left:-9999px;opacity:0;';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            this.showCopyFeedback(document.querySelector('#copyButton'));
        } catch {
            this.showNotification('Failed to copy. Please copy manually.');
        } finally {
            document.body.removeChild(ta);
        }
    }

    showCopyFeedback(btn) {
        const orig = btn.textContent;
        const origBg = btn.style.background;
        btn.textContent = '✓ Copied!';
        btn.style.background = '#25D366';
        setTimeout(() => {
            btn.textContent = orig;
            btn.style.background = origBg;
        }, 2000);
    }

    showCancellationConfirmation(orderId) {
        const el = document.createElement('div');
        el.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#f42b2b;color:white;padding:10px 20px;border-radius:5px;z-index:10001;box-shadow:0 2px 10px rgba(0,0,0,0.2);animation:fadeInOut 3s forwards;`;
        el.textContent = `Order #${orderId} has been cancelled!`;
        document.body.appendChild(el);
        
        const sty = document.createElement('style');
        sty.textContent = `@keyframes fadeInOut{0%{opacity:0;top:10px}10%{opacity:1;top:20px}90%{opacity:1;top:20px}100%{opacity:0;top:10px}}`;
        document.head.appendChild(sty);
        
        setTimeout(() => {
            if (document.body.contains(el)) document.body.removeChild(el);
            document.head.removeChild(sty);
        }, 3000);
    }

    closeModal() {
        const modal = document.getElementById('productModal');
        if (modal) modal.style.display = 'none';
    }

    showNotification(message, type = 'success') {
        document.querySelectorAll('.notification').forEach(n => n.remove());
        const n = document.createElement('div');
        n.className = 'notification';
        n.textContent = message;
        n.style.cssText = `position:fixed;top:20px;right:20px;background:${type === 'success' ? '#4CAF50' : '#dc3545'};color:white;padding:15px 20px;border-radius:5px;z-index:9999;animation:slideIn 0.3s ease;box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
        document.body.appendChild(n);
        setTimeout(() => { if (n.parentNode) n.parentNode.removeChild(n); }, 3000);
    }

    // ── Products ──────────────────────────────────────────────────────────────
    async loadAllProducts() {
        this.showLoading();
        try {
            const res = await fetch('/api/products');
            if (!res.ok) throw new Error('Failed to fetch products');
            this.products = await res.json();
            this._masterProducts = [...this.products];
            this.displayProducts(this.products);
        } catch {
            this.showSampleProducts();
        }
    }

    showSampleProducts() {
        this.products = [
            { id: 1, name: 'Smartphone X', price: 29999.99, description: 'Latest smartphone', image_url: '/uploads/phone1.jpg', stock: 10, category: 'phones' },
            { id: 2, name: 'Wireless Earbuds', price: 3499.99, description: 'Noise cancellation', image_url: '/uploads/earbuds1.jpg', stock: 25, category: 'phones accessories' },
            { id: 3, name: 'Laptop Sleeve', price: 1999.99, description: 'Protective sleeve', image_url: '/uploads/sleeve1.jpg', stock: 15, category: 'laptop accessories' }
        ];
        this._masterProducts = [...this.products];
        this.displayProducts(this.products);
    }

    async filterByCategory(category) {
        this.currentCategory = category;
        this._isSearchActive = false;
        this._currentView = 'products';
        this._currentProductId = null;
        this._currentQuery = '';

        const searchBar = document.getElementById('search-bar');
        if (searchBar) searchBar.value = '';

        const section = document.querySelector('.products-section .container');
        if (section && !section.querySelector('#products-grid')) {
            section.innerHTML = `
                <h2 id="section-title">All Products</h2>
                <div class="products-grid" id="products-grid"></div>
                <div id="loading" class="loading" style="display:none;">Loading products...</div>
                <div id="error-message" class="error-message" style="display:none;"></div>
            `;
        }

        _trendingHome();

        this.showLoading();

        try {
            let products;
            if (category === 'all') {
                products = this._masterProducts.length > 0 ? this._masterProducts : this.products;
            } else {
                const res = await fetch(`/api/products/category/${category}`);
                if (!res.ok) throw new Error('Failed to fetch category');
                products = await res.json();
            }
            this.displayProducts(products);
            this.updateSectionTitle(category);
        } catch {
            const filtered = category === 'all'
                ? (this._masterProducts.length > 0 ? this._masterProducts : this.products)
                : this.products.filter(p => p.category === category);
            this.displayProducts(filtered);
            this.updateSectionTitle(category);
        }
    }

    displayProducts(products) {
        this._allProducts = products;
        this._pageSize = 15;
        this._currentPage = 0;
        this._hasMore = true;

        const grid = document.getElementById('products-grid');
        if (!grid) return;
        grid.innerHTML = '';
        this._removePagination();

        const firstBatch = products.slice(0, this._pageSize);
        const total = firstBatch.length;
        if (total === 0) { this._loadNextPage(); return; }

        let loaded = 0;
        firstBatch.forEach(product => {
            const img = new Image();
            img.onload = img.onerror = () => { loaded++; if (loaded === total) this._loadNextPage(); };
            img.src = product.image_url || '/uploads/default-logo.webp';
        });
        setTimeout(() => { if (this._currentPage === 0) this._loadNextPage(); }, 2000);
    }

    _loadNextPage() {
        if (!this._hasMore) return;
        const all = this._allProducts || [];
        const start = this._currentPage * this._pageSize;
        const slice = all.slice(start, start + this._pageSize);
        if (slice.length === 0) { this._hasMore = false; this._buildPagination(); return; }

        const grid = document.getElementById('products-grid');
        const loading = document.getElementById('loading');
        const error = document.getElementById('error-message');
        if (!grid) return;
        if (loading) loading.style.display = 'none';
        if (error) error.style.display = 'none';

        const fragment = document.createDocumentFragment();
        slice.forEach(product => {
            const imageUrl = product.image_url || '/uploads/default-logo.webp';
            const card = document.createElement('div');
            card.className = 'product-card';
            card.dataset.name = (product.name || '').toLowerCase();
            card.innerHTML = `
                <div class="product-image-container" onclick="app.showProductDetail(${product.id})">
                    <img src="${imageUrl}" loading="${this._currentPage === 0 ? 'eager' : 'lazy'}" decoding="async" width="300" height="300"
                         style="width:100%;height:250px;object-fit:cover;object-position:center 20%;background:#f9f9f9;border-radius:8px;display:block;"
                         alt="${product.name}" class="product-image img-loading"
                         onerror="this.onerror=null;this.src='/uploads/default-logo.webp'">
                    ${product.stock <= 0 ? '<div class="out-of-stock-overlay">Out of Stock</div>' : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-name" style="margin-bottom:0;padding:0" title="${product.name}">
                        ${product.name ? product.name.substring(0, 45) + (product.name.length > 45 ? '...' : '') : ''}
                    </h3>
                    <div class="product-price">Ksh ${Number(product.price).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</div>
                    <p class="product-description" style="padding:0;margin:0;">
                        ${product.description ? product.description.substring(0, 70) + (product.description.length > 70 ? '...' : '') : 'No description available'}
                    </p>
                </div>
                
                <div class="add-to-cart-info">
                    <button class="add-to-cart-btn" title="Add to cart" 
                        onclick="event.stopPropagation(); app.addToCartFromButton(${product.id})"
                        ${product.stock <= 0 ? 'disabled' : ''}>BUY NOW</button>
                    ${product.stock > 0 ? `
                        <a href="https://wa.me/254703182530?text=${encodeURIComponent(`Hello, I am interested in:\nProduct: ${product.name}\nPrice: Ksh ${Number(product.price).toLocaleString('en-KE', { minimumFractionDigits: 2 })}\nPlease let me know if it's available. Thank you!`)}"
                           target="_blank" class="whatsapp-float" title="Chat on WhatsApp">
                            <img src="/img/images/whatsapp.png" alt="WhatsApp">
                        </a>` : `
                        <div class="whatsapp-float disabled" title="Out of stock">
                            <img src="/img/images/whatsapp.png" alt="WhatsApp">
                        </div>`}
                </div>`;
            fragment.appendChild(card);
        });

        grid.appendChild(fragment);
        this._currentPage++;
        this._hasMore = (this._currentPage * this._pageSize) < all.length;
        this._buildPagination();
    }

    _buildPagination() {
        let ctrl = document.getElementById('pagination-controls');
        if (!ctrl) {
            ctrl = document.createElement('div');
            ctrl.id = 'pagination-controls';
            ctrl.className = 'pagination-load-more';
            const section = document.querySelector('.products-section .container');
            if (section) section.appendChild(ctrl);
        }
        const loaded = Math.min(this._currentPage * this._pageSize, (this._allProducts || []).length);
        const total = (this._allProducts || []).length;
        if (!this._hasMore) {
            ctrl.innerHTML = total > this._pageSize ? `<p class="pg-end-msg">✓ All ${total} products loaded</p>` : '';
            return;
        }
        ctrl.innerHTML = `
            <div class="pg-progress"><div class="pg-progress-bar" style="width:${Math.round((loaded/total)*100)}%"></div></div>
            <p class="pg-count">${loaded} of ${total} products</p>
            <button class="pg-load-more-btn" onclick="app._loadNextPage()">Load More <span class="pg-load-arrow">↓</span></button>`;
    }

    _removePagination() {
        const ctrl = document.getElementById('pagination-controls');
        if (ctrl) ctrl.innerHTML = '';
    }

    addToCartFromButton(productId) {
        const product = (this._allProducts || []).find(p => p.id === productId) ||
                       (this._masterProducts || []).find(p => p.id === productId) ||
                       this.products.find(p => p.id === productId);
        if (product) this.addToCart(product);
        else this.showNotification('Error adding product to cart');
    }

    // ── Product Detail ────────────────────────────────────────────────────────
    async showProductDetail(productId) {
        const main = document.querySelector('.products-section .container');
        if (!main) return;

        this._currentView = 'detail';
        this._currentProductId = productId;

        main.innerHTML = `
            <div id="product-detail-view">
                <button onclick="app.showAllProductsView()" style="
                    display:inline-flex;align-items:center;gap:6px;margin-bottom:20px;padding:9px 18px;
                    background:#2c5530;color:white;border:none;border-radius:8px;
                    cursor:pointer;font-size:14px;font-weight:600;">← Back to Products</button>
                <div id="pd-skeleton" style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
                    <div style="background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);background-size:200% 100%;animation:pdShimmer 1.4s infinite;border-radius:12px;aspect-ratio:1/1;"></div>
                    <div style="display:flex;flex-direction:column;gap:14px;padding-top:10px;">
                        ${[80,50,30,90,40,100].map(w => `<div style="height:${w===100?44:16}px;width:${w}%;border-radius:8px;background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);background-size:200% 100%;animation:pdShimmer 1.4s infinite;"></div>`).join('')}
                    </div>
                </div>
                <style>
                    @keyframes pdShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
                    @media(max-width:600px){#pd-skeleton{grid-template-columns:1fr!important}}
                </style>
            </div>`;

        _trendingHide();

        try {
            let product = (this._masterProducts || []).find(p => p.id === productId) ||
                         (this._allProducts || []).find(p => p.id === productId) ||
                         (this.products || []).find(p => p.id === productId);

            if (!product) {
                const res = await fetch(`/api/products/${productId}`);
                if (!res.ok) throw new Error('Not found');
                product = await res.json();
                if (!this._masterProducts.find(p => p.id === product.id)) this._masterProducts.push(product);
            }

            const similar = (this._masterProducts || [])
                .filter(p => p.id !== productId && p.category === product.category)
                .sort(() => Math.random() - 0.5)
                .slice(0, 15);

            this._renderProductDetailPage(product, similar);

        } catch (err) {
            console.error('Product detail error:', err);
            _trendingHome();
            const skel = document.getElementById('pd-skeleton');
            if (skel) skel.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:40px;color:#e74c3c;">
                    <p style="font-size:16px;">⚠️ Could not load product.</p>
                    <button onclick="app.showAllProductsView()" style="margin-top:12px;padding:9px 20px;background:#2c5530;color:white;border:none;border-radius:8px;cursor:pointer;">← Back to Products</button>
                </div>`;
        }
    }

    _renderProductDetailPage(product, similar) {
        const view = document.getElementById('product-detail-view');
        if (!view) return;

        const resolveImg = (url) => {
            if (!url) return '/uploads/default-logo.webp';
            if (url.startsWith('http') || url.startsWith('/uploads/')) return url;
            if (url.startsWith('uploads/')) return '/' + url;
            return '/uploads/' + url;
        };

        const imageUrl = resolveImg(product.image_url);
        const price = parseFloat(product.price) || 0;
        const stock = parseInt(product.stock) || 0;
        const inStock = stock > 0;
        const whatsappMsg = encodeURIComponent(`Hello, I am interested in:\nProduct: ${product.name}\nPrice: Ksh ${price.toLocaleString('en-KE',{minimumFractionDigits:2})}\nPlease let me know if it's available. Thank you!`);

        const similarHTML = similar.length === 0 ? '' : `
            <div style="margin-top:48px;border-top:2px solid #eee;padding-top:32px;">
                <h3 style="font-size:18px;font-weight:700;color:#1a1a2e;margin-bottom:20px;">Similar Products</h3>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(160px,100%),1fr));gap:14px;">
                    ${similar.map(p => {
                        const img = resolveImg(p.image_url);
                        const pr = parseFloat(p.price)||0;
                        const st = parseInt(p.stock)||0;
                        return `
                        <div onclick="app.showProductDetail(${p.id})"
                             style="background:white;border:1px solid #e8ecf0;border-radius:12px;overflow:hidden;cursor:pointer;transition:all .22s;position:relative;"
                             onmouseover="this.style.transform='translateY(-3px)';this.style.borderColor='#2c5530';this.style.boxShadow='0 6px 18px rgba(44,85,48,0.14)'"
                             onmouseout="this.style.transform='';this.style.borderColor='#e8ecf0';this.style.boxShadow=''">
                            <div style="aspect-ratio:1/1;overflow:hidden;background:#f9f9f9;">
                                <img src="${img}" alt="${p.name}" loading="lazy" style="width:100%;height:100%;object-fit:contain;padding:8px;display:block;" onerror="this.src='/uploads/default-logo.webp'">
                            </div>
                            ${st <= 0 ? `<div style="position:absolute;top:8px;right:8px;background:#e74c3c;color:white;font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;">Out of Stock</div>` : ''}
                            <div style="padding:10px;">
                                <div style="font-size:12px;font-weight:600;color:#1a1a2e;line-height:1.35;margin-bottom:5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${p.name}</div>
                                <div style="font-size:13px;font-weight:800;color:#2c5530;">Ksh ${pr.toLocaleString('en-KE',{minimumFractionDigits:2})}</div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;

        view.innerHTML = `
            <style>
                @keyframes pdFadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
                #pd-main{animation:pdFadeIn .35s ease}
                @media(max-width:640px){#pd-grid{grid-template-columns:1fr!important}#pd-img-wrap{max-height:300px!important}}
            </style>
            <button onclick="app.showAllProductsView()" style="
                display:inline-flex;align-items:center;gap:6px;margin-bottom:24px;padding:9px 18px;
                background:#2c5530;color:white;border:none;border-radius:8px;cursor:pointer;
                font-size:14px;font-weight:600;transition:opacity .2s;"
                onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
                ← Back to Products
            </button>
            <div id="pd-main">
                <div id="pd-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start;">
                    <div>
                        <div id="pd-img-wrap" style="border:2px solid #eee;border-radius:14px;background:#f9f9f9;overflow:hidden;max-height:460px;display:flex;align-items:center;justify-content:center;padding:16px;">
                            <img id="pd-main-img" src="${imageUrl}" alt="${product.name}"
                                 style="max-width:100%;max-height:420px;object-fit:contain;display:block;border-radius:8px;"
                                 onerror="this.onerror=null;this.src='/uploads/default-logo.webp'">
                        </div>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:14px;">
                        <h1 style="font-size:clamp(16px,3vw,22px);font-weight:700;color:#1a1a2e;line-height:1.35;margin:0;">${product.name}</h1>
                        <div style="font-size:clamp(20px,4vw,28px);font-weight:800;color:#2c5530;">
                            Ksh ${price.toLocaleString('en-KE',{minimumFractionDigits:2})}
                        </div>
                        <div style="display:inline-flex;
                        align-items:center;gap:6px;
                        align-self:flex-start;
                        padding:5px 14px;
                        border-radius:20px;
                        font-size:13px;
                        font-weight:600;
                        background:${inStock?'#e8f5e9':'#ffebee'};color:${inStock?'#2e7d32':'#c62828'};">
                            <span style="width:7px;
                            height:7px;
                            border-radius:50%;
                            flex-shrink:0;
                            background:${inStock?'#2e7d32':'#c62828'};box-shadow:0 0 6px ${inStock?'#2e7d32':'#c62828'};"></span>
                            ${inStock ? `${stock} in stock` : 'Out of stock'}
                        </div>
                        <p style="font-size:14px;
                        line-height:1.7;
                        color:#555;margin:0;
                        background:#f9f9f9;
                        padding:14px;border-radius:10px;">
                            ${product.description || 'No description available.'}
                        </p>
                        ${product.category ? `<div style="font-size:12px;color:#888;">Category: <span style="background:#eef5ee;color:#2c5530;font-weight:600;padding:2px 10px;border-radius:10px;">${product.category}</span></div>` : ''}
                       <div style="display:flex;flex-direction:grid;gap:10px;margin-top:6px;align-items:flex-start;">

                            <button onclick="app.addToCartFromButton(${product.id})" ${!inStock?'disabled':''}
                                    style="padding:12px 20px;
                                    font-size:14px;
                                    font-weight:700;
                                    border:none;border-radius:10px;
                                    cursor:${inStock?'pointer':'not-allowed'};
                                    background:${inStock?'linear-gradient(135deg,#2c5530,#3d7a43)':'#ccc'};
                                    color:white;transition:opacity .2s;
                                    box-shadow:${inStock?'0 4px 14px rgba(44,85,48,0.3)':'none'};"
                                    ${inStock?'onmouseover="this.style.opacity=\'.88\'" onmouseout="this.style.opacity=\'1\'"':''}>
                                🛒 ${inStock ? 'Add to Cart' : 'Out of Stock'}
                            </button>
                            ${inStock ? `
                            <a href="https://wa.me/254703182530?text=${whatsappMsg}" target="_blank"
                               style="display:flex;
                               align-items:center;
                               justify-content:center;
                               gap:10px;
                               padding:12px 20px;
                               font-size:14px;
                               font-weight:700;
                               border-radius:10px;
                               text-decoration:none;
                               background:linear-gradient(135deg,#25D366,#1aa34a);
                               color:white;box-shadow:0 4px 14px rgba(37,211,102,0.3);
                               transition:opacity .2s;"
                               onmouseover="this.style.opacity='.88'" onmouseout="this.style.opacity='1'">
                                <img src="/img/images/whatsapp.png" alt="WhatsApp" style="width:20px;height:20px;object-fit:contain;">
                                Order via WhatsApp
                            </a>` : ''}
                        </div>
                    </div>
                </div>
                ${similarHTML}
                <div id="pd-trending-slot" style="margin-top:48px;border-top:2px solid #eee;padding-top:32px;"></div>
            </div>`;

        _trendingIntoSlot();
        window.scrollTo({  behavior: 'smooth' });
    }

    // ── Utilities ─────────────────────────────────────────────────────────────
    updateSectionTitle(category) {
        const title = document.getElementById('section-title');
        if (!title) return;
        const names = {
            'all': 'All Products',
            'screens': 'Screens',
            'phones': 'Phones',
            'phones accessories': 'Phone Accessories',
            'computer': 'Computer & Network',
            'batteries': 'Batteries',
            'smartWatches': 'Smart Watches'
        };
        title.textContent = names[category] || (category.charAt(0).toUpperCase() + category.slice(1));
    }

    showLoading() {
        const loading = document.getElementById('loading');
        const error = document.getElementById('error-message');
        if (loading) loading.style.display = 'block';
        if (error) error.style.display = 'none';
    }

    showError(message) {
        const error = document.getElementById('error-message');
        const loading = document.getElementById('loading');
        if (error) { error.textContent = message; error.style.display = 'block'; }
        if (loading) loading.style.display = 'none';
    }

    // ── Backend cart sync ─────────────────────────────────────────────────────
    async syncCartWithBackend() {
        if (!this.isUserAuthenticated() || this.isSyncing) return;
        this.isSyncing = true;
        try {
            const res = await fetch('/api/cart', { headers: { 'Authorization': `Bearer ${this.currentToken}` } });
            if (res.ok) this.mergeCarts((await res.json()).items);
        } catch { /* silent */ }
        finally { this.isSyncing = false; }
    }

    mergeCarts(backendItems) {
        if (!backendItems || !backendItems.length) {
            if (this.cart.length) this.syncLocalCartToBackend();
            return;
        }
        if (!this.cart.length) {
            this.cart = backendItems.map(i => ({
                id: i.product_id,
                name: i.product_name,
                price: i.price,
                quantity: i.quantity,
                image_url: '/uploads/default-logo.webp'
            }));
            this.saveCartToStorage();
            this.updateCartCount();
        } else {
            this.syncLocalCartToBackend();
        }
    }

    async syncLocalCartToBackend() {
        if (!this.isUserAuthenticated()) return;
        try { await fetch('/api/cart/clear', { method: 'DELETE', headers: { 'Authorization': `Bearer ${this.currentToken}` } }); } catch {}
        for (const item of this.cart) {
            try {
                await fetch('/api/cart/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.currentToken}` },
                    body: JSON.stringify({ product_id: item.id, product_name: item.name, price: item.price, quantity: item.quantity })
                });
            } catch {}
        }
    }

    async syncItemToBackend(product, quantity) {
        if (!this.isUserAuthenticated()) return;
        try {
            await fetch('/api/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.currentToken}` },
                body: JSON.stringify({ product_id: product.id, product_name: product.name, price: product.price, quantity })
            });
        } catch {}
    }

    async removeItemFromBackend(productId) {
        if (!this.isUserAuthenticated()) return;
        try {
            const res = await fetch('/api/cart', { headers: { 'Authorization': `Bearer ${this.currentToken}` } });
            if (!res.ok) return;
            const data = await res.json();
            const item = data.items.find(i => i.product_id === productId);
            if (item) await fetch(`/api/cart/remove/${item.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${this.currentToken}` } });
        } catch {}
    }

    async updateQuantityInBackend(productId, quantity) {
        if (!this.isUserAuthenticated()) return;
        try {
            const res = await fetch('/api/cart', { headers: { 'Authorization': `Bearer ${this.currentToken}` } });
            if (!res.ok) return;
            const data = await res.json();
            const item = data.items.find(i => i.product_id === productId);
            if (item) {
                await fetch(`/api/cart/update/${item.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.currentToken}` },
                    body: JSON.stringify({ quantity })
                });
            }
        } catch {}
    }

    clearCart() {
        this.cart = [];
        this.saveCartToStorage();
        this.updateCartCount();
        this.refreshCartModal();
        this.showNotification('Cart cleared');
    }

    getCartItems() { return [...this.cart]; }
    debugCart() { this.updateCartCount(); return this.cart; }

    // ── SEARCH ────────────────────────────────────────────────────────────────
    async searchProducts(query) {
        const q = (query || '').trim();
        const qLower = q.toLowerCase();
        this._currentQuery = q;

        if (!q) {
            this._isSearchActive = false;
            this._currentView = 'products';
            this._currentQuery = '';
            this._updateSearchUI('', 0, true);
            
            const section = document.querySelector('.products-section .container');
            const onGrid = section && section.querySelector('#products-grid');
            
            if (!onGrid) {
                this.showAllProductsView();
            } else {
                _trendingHome();
                this._allProducts = [...(this._masterProducts.length > 0 ? this._masterProducts : this.products)];
                this._pageSize = 15;
                this._currentPage = 0;
                this._hasMore = true;
                const grid = document.getElementById('products-grid');
                if (grid) { grid.innerHTML = ''; this._removePagination(); this._loadNextPage(); }
            }
            return;
        }

        if (this._searchCache.has(q)) {
            this._currentView = 'search';
            this._currentProductId = null;
            this._ensureGridShell();
            this._renderSearchResults(this._searchCache.get(q), q);
            return;
        }

        this._currentView = 'search';
        this._currentProductId = null;
        this._ensureGridShell();
        this._updateSearchUI(q, null, false);

        const grid = document.getElementById('products-grid');
        if (grid) grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#888;"><div style="font-size:32px;animation:spin 1s linear infinite;display:inline-block;">⏳</div><p style="margin-top:12px;">Searching products…</p></div>`;

        if (_searchAbortController) _searchAbortController.abort();
        _searchAbortController = new AbortController();

        let results = null;

        try {
            const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`, { signal: _searchAbortController.signal });
            if (res.ok) { const data = await res.json(); if (Array.isArray(data) && data.length > 0) results = data; }
        } catch (e) { if (e.name === 'AbortError') return; }

        if (!results || results.length === 0) {
            try {
                const res = await fetch('/api/products', { signal: _searchAbortController.signal });
                if (res.ok) {
                    const all = await res.json();
                    if (Array.isArray(all) && all.length > 0) {
                        const existingIds = new Set(this._masterProducts.map(p => p.id));
                        all.forEach(p => { if (!existingIds.has(p.id)) this._masterProducts.push(p); });
                    }
                    results = (all || []).filter(p => {
                        const name = (p.name||'').toLowerCase();
                        const desc = (p.description||'').toLowerCase();
                        const cat = (p.category||'').toLowerCase();
                        return name.includes(qLower) || desc.includes(qLower) || cat.includes(qLower);
                    });
                }
            } catch (e) { if (e.name === 'AbortError') return; }
        }

        if (!results || results.length === 0) results = this._fuzzySearch(qLower);

        if (results && results.length > 0) {
            const existingIds = new Set(this._masterProducts.map(p => p.id));
            results.forEach(p => { if (!existingIds.has(p.id)) this._masterProducts.push(p); });
        }

        this._searchCache.set(q, results || []);
        if (this._searchCache.size > 50) this._searchCache.delete(this._searchCache.keys().next().value);

        this._renderSearchResults(results || [], q);
    }

    _ensureGridShell() {
        const section = document.querySelector('.products-section .container');
        if (!section) return;
        if (!section.querySelector('#products-grid')) {
            section.innerHTML = `
                <h2 id="section-title">All Products</h2>
                <div class="products-grid" id="products-grid"></div>
                <div id="loading" class="loading" style="display:none;">Loading products...</div>
                <div id="error-message" class="error-message" style="display:none;"></div>`;
            _trendingHome();
        }
    }

    _fuzzySearch(qLower) {
        const pool = this._masterProducts.length > 0 ? this._masterProducts : this.products;
        const words = qLower.split(/\s+/).filter(w => w.length > 0);

        const scored = pool.map(p => {
            const name = (p.name||'').toLowerCase();
            const desc = (p.description||'').toLowerCase();
            const cat = (p.category||'').toLowerCase();
            const text = `${name} ${cat} ${desc}`;
            let score = 0;
            
            if (name.includes(qLower)) score += 120;
            if (cat.includes(qLower)) score += 80;
            if (desc.includes(qLower)) score += 40;
            if (words.length > 1 && words.every(w => text.includes(w))) score += 70;
            
            words.forEach(w => {
                if (name.includes(w)) score += 30;
                if (cat.includes(w)) score += 20;
                if (desc.includes(w)) score += 8;
            });
            
            const nameWords = `${name} ${cat}`.split(/\s+/);
            words.forEach(qWord => {
                if (qWord.length < 3) return;
                nameWords.forEach(nWord => {
                    if (nWord.length < 3) return;
                    const dist = _levenshtein(qWord, nWord);
                    const maxLen = Math.max(qWord.length, nWord.length);
                    const sim = 1 - dist / maxLen;
                    if (sim >= 0.65 && dist > 0) score += Math.round(sim * 45);
                });
            });
            return { p, score };
        }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score).map(({ p }) => p);

        return scored;
    }

    _renderSearchResults(results, query) {
        this._isSearchActive = true;
        this._allProducts = results || [];
        this._pageSize = 15;
        this._currentPage = 0;
        this._hasMore = true;

        const grid = document.getElementById('products-grid');
        if (!grid) return;
        grid.innerHTML = '';
        this._removePagination();
        this._updateSearchUI(query, (results || []).length, false);

        if (!results || results.length === 0) {
            grid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#888;">
                    <div style="font-size:48px;margin-bottom:16px;">🔍</div>
                    <h3 style="font-size:18px;color:#444;margin:0 0 8px;">No results for "${query}"</h3>
                    <p style="font-size:14px;margin:0 0 20px;">Try checking the spelling, or use a broader keyword.</p>
                    <button onclick="app._clearSearch()" style="padding:10px 24px;background:#2c5530;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;">Show All Products</button>
                </div>`;
            return;
        }
        this._loadNextPage();
    }

    _updateSearchUI(query, count, isCleared) {
        const title = document.getElementById('section-title');
        if (!title) return;
        if (isCleared || !query) { title.innerHTML = 'All Products'; return; }
        const countLabel = count === null
            ? `<span style="font-size:13px;font-weight:400;color:#888;margin-left:8px;">Searching…</span>`
            : `<span style="font-size:13px;font-weight:400;color:#888;margin-left:8px;">${count} result${count !== 1 ? 's' : ''}</span>`;
        title.innerHTML = `Search: "<strong>${query}</strong>" ${countLabel}
            <button onclick="app._clearSearch()" style="margin-left:12px;padding:4px 12px;font-size:12px;font-weight:600;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;cursor:pointer;vertical-align:middle;">✕ Clear</button>`;
    }

    _clearSearch() {
        const searchBar = document.getElementById('search-bar');
        if (searchBar) searchBar.value = '';
        this._isSearchActive = false;
        this._currentView = 'products';
        this._currentQuery = '';
        this._allProducts = [...(this._masterProducts.length > 0 ? this._masterProducts : this.products)];
        this._pageSize = 15;
        this._currentPage = 0;
        this._hasMore = true;
        const title = document.getElementById('section-title');
        if (title) title.innerHTML = 'All Products';
        _trendingHome();
        const grid = document.getElementById('products-grid');
        if (grid) { grid.innerHTML = ''; this._removePagination(); this._loadNextPage(); }
    }
}

// ── Global Functions ──────────────────────────────────────────────────────────
function showAllProducts() { app.filterByCategory('all'); }
function filterByCategory(cat) { app.filterByCategory(cat); }
function showCart() { app.showCart(); }

function searchProducts(query) {
    clearTimeout(_searchDebounceTimer);
    _searchDebounceTimer = setTimeout(() => app.searchProducts(query), 300);
}

function greeting() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good morning';
    if (h >= 12 && h < 17) return 'Good afternoon';
    if (h >= 17 && h < 21) return 'Good evening';
    return 'Hello';
}

// ── Boot ──────────────────────────────────────────────────────────────────────
// Initialize trending styles first
if (!document.getElementById('trending-shimmer-style')) {
    const s = document.createElement('style');
    s.id = 'trending-shimmer-style';
    s.textContent = `
        @keyframes trendShimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        .trending-card {
            min-width: 140px;
            max-width: 165px;
            flex-shrink: 0;
            border-radius: 12px;
            background: white;
            border: 1px solid #e8ecf0;
            overflow: hidden;
            transition: transform .22s, border-color .22s, box-shadow .22s;
            cursor: pointer;
        }
        .trending-card:hover {
            transform: translateY(-4px);
            border-color: #2c5530;
            box-shadow: 0 8px 20px rgba(44,85,48,0.15);
        }
        .trending-scroll-wrap {
            position: relative;
            display: flex;
            align-items: center;
            gap: 0;
        }
        .trending-scroll {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            scroll-behavior: smooth;
            padding: 8px 4px 12px;
            flex: 1;
            scrollbar-width: thin;
            scrollbar-color: #2c5530 #f0f0f0;
        }
        .trending-scroll::-webkit-scrollbar { height: 4px; }
        .trending-scroll::-webkit-scrollbar-track { background: #f0f0f0; border-radius: 2px; }
        .trending-scroll::-webkit-scrollbar-thumb { background: #2c5530; border-radius: 2px; }
        .trending-arrow {
            flex-shrink: 0;
            width: 32px; height: 32px;
            border-radius: 50%;
            border: 1px solid #e0e0e0;
            background: white;
            cursor: pointer;
            font-size: 18px;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            transition: background .2s, border-color .2s;
            z-index: 2;
        }
        .trending-arrow:hover { background: #2c5530; color: white; border-color: #2c5530; }
    `;
    document.head.appendChild(s);
}

// Initialize notification animations
if (!document.querySelector('#notification-animations')) {
    const style = document.createElement('style');
    style.id = 'notification-animations';
    style.textContent = `
        @keyframes slideIn { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
        @keyframes spin { 0% { transform:rotate(0deg); } 100% { transform:rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .modal-loader .spinner {
            border:4px solid #f3f3f3;
            border-top:4px solid #2c5530;
            border-radius:50%;
            width:40px;
            height:40px;
            animation:spin 1s linear infinite;
            margin:0 auto 10px;
        }
        .fade-in { animation:fadeIn 0.3s ease; }
    `;
    document.head.appendChild(style);
}

// Initialize the app
const app = new ECommerceApp();

// Image loading handler
document.addEventListener('load', (e) => {
    if (e.target.tagName === 'IMG' && e.target.classList.contains('product-image')) {
        e.target.classList.remove('img-loading');
        e.target.classList.add('img-loaded');
        const container = e.target.closest('.product-image-container');
        if (container) container.classList.add('img-loaded');
    }
}, true);
