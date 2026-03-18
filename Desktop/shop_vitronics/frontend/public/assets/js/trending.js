// 

// ============================================================
// SHARED PRODUCTS CACHE
// ============================================================
let _productsCache = null;

async function fetchProductsCached() {
    if (_productsCache) return _productsCache;
    const res = await fetch('/api/products');
    const data = await res.json();
    _productsCache = Array.isArray(data) ? data : [];
    return _productsCache;
}

function resolveImageUrl(image_url) {
    if (!image_url) return './uploads/default-logo.webp';
    if (image_url.startsWith('http') || image_url.startsWith('/uploads/')) return image_url;
    if (image_url.startsWith('uploads/')) return '/' + image_url;
    return '/uploads/' + image_url;
}

// ============================================================
// TRENDING CARD CLICK — opens product modal correctly
// ============================================================
async function handleTrendingCardClick(productId) {
    const modal = document.getElementById('productModal');
    const modalContent = document.getElementById('modal-content');
    if (!modal || !modalContent) return;

    // 1. Clear stale content and show spinner IMMEDIATELY
    modalContent.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;min-height:300px;">
            <div style="text-align:center;color:#999;">
                <div style="width:40px;height:40px;
                            border:3px solid #eee;
                            border-top-color:#2c5530;
                            border-radius:50%;
                            animation:trendModalSpin 0.7s linear infinite;
                            margin:0 auto 14px;"></div>
                <p style="font-size:13px;margin:0;">Loading product...</p>
            </div>
        </div>
        <style>
            @keyframes trendModalSpin { to { transform: rotate(360deg); } }
        </style>
    `;
    modal.style.display = 'block';

    try {
        // 2. Try cache first — no extra network request
        let product = _productsCache?.find(p => String(p.id) === String(productId));

        // 3. Fallback to individual fetch if not in cache
        if (!product) {
            const res = await fetch(`/api/products/${productId}`);
            product = await res.json();
        }

        if (!product || !product.id) {
            throw new Error('Product not found');
        }

        // 4. Try app's own displayProductModal first
        if (window.app && typeof window.app.displayProductModal === 'function') {
            window.app.displayProductModal(product);
            return;
        }

        // 5. Fallback — render modal content ourselves
        const price = parseFloat(product.price) || 0;
        const stock = parseInt(product.stock) || 0;
        const imageUrl = resolveImageUrl(product.image_url);

        const stockBadge = stock === 0
            ? `<span style="background:#fef2f2;color:#e74c3c;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;">Out of Stock</span>`
            : `<span style="background:#f0fdf4;color:#16a34a;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;">${stock} in stock</span>`;

        modalContent.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:20px;">
                <div>
                    <div style="border:2px dashed #ccc;padding:16px;border-radius:8px;background:#f9f9f9;">
                        <img src="${imageUrl}"
                             alt="${product.name || 'Product'}"
                             style="width:100%;max-height:380px;object-fit:contain;border-radius:6px;"
                             onerror="this.onerror=null;this.src='./uploads/default-logo.webp';">
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:12px;">
                    <h2 style="font-size:1.15em;font-weight:600;margin:0;color:#1a1a2e;line-height:1.4;">
                        ${product.name || 'Product'}
                    </h2>
                    <div style="font-size:1.4em;font-weight:800;color:#2c5530;">
                        KSH ${price.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                    </div>
                    ${stockBadge}
                    <p style="margin:0;line-height:1.6;color:#555;font-size:14px;">
                        ${product.description || 'No description available.'}
                    </p>
                    <button
                        onclick="event.stopPropagation(); window.app ? app.addToCartFromButton(${product.id}) : null"
                        ${stock <= 0 ? 'disabled' : ''}
                        style="margin-top:auto;padding:12px 20px;font-size:14px;font-weight:600;
                               background:${stock > 0 ? '#2c5530' : '#ccc'};
                               color:white;border:none;border-radius:8px;
                               cursor:${stock > 0 ? 'pointer' : 'not-allowed'};
                               transition:opacity .2s;"
                        onmouseover="if(${stock > 0}) this.style.opacity='0.88'"
                        onmouseout="this.style.opacity='1'">
                        ${stock > 0 ? '🛒 Add to Cart' : 'Out of Stock'}
                    </button>
                </div>
            </div>
        `;

    } catch (err) {
        console.error('Trending modal error:', err);
        modalContent.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;min-height:300px;">
                <div style="text-align:center;color:#e74c3c;">
                    <div style="font-size:36px;margin-bottom:12px;">⚠️</div>
                    <p style="font-size:14px;margin:0 0 16px;">Failed to load product.</p>
                    <button onclick="document.getElementById('productModal').style.display='none'"
                            style="padding:8px 20px;background:#2c5530;color:white;
                                   border:none;border-radius:6px;cursor:pointer;font-size:13px;">
                        Close
                    </button>
                </div>
            </div>
        `;
    }
}

// ============================================================
// TRENDING PRODUCTS LOADER
// ============================================================
async function loadTrendingProducts() {
    const container = document.getElementById('trending-scroll');
    const countBadge = document.getElementById('trending-count');
    if (!container) return;

    // Show skeletons while loading
    container.innerHTML = Array(6).fill(0).map(() => `
        <div class="trending-skeleton">
            <div class="trending-skeleton-img"></div>
            <div class="trending-skeleton-line"></div>
            <div class="trending-skeleton-line short"></div>
        </div>
    `).join('');

    try {
        const products = await fetchProductsCached();

        if (products.length === 0) {
            container.innerHTML = `<p style="color:#999;padding:20px;font-size:13px;">No products available.</p>`;
            return;
        }

        const inStock = products.filter(p => (parseInt(p.stock) || 0) > 0);
        const pool = inStock.length >= 6 ? inStock : products;
        const trending = [...pool].sort(() => Math.random() - 0.5).slice(0, 6);

        if (countBadge) countBadge.textContent = `${trending.length} picks`;

        const badges = ['Hot', 'Popular', 'Top Pick', 'Trending', 'Best Seller', 'Featured'];

        container.innerHTML = trending.map((product, i) => {
            const price = parseFloat(product.price) || 0;
            const stock = parseInt(product.stock) || 0;
            const imageUrl = resolveImageUrl(product.image_url);
            const stockLabel = stock === 0 ? 'Out of stock'
                : stock < 5 ? `Only ${stock} left`
                : `${stock} in stock`;
            const stockClass = stock === 0 ? 'out' : stock < 5 ? 'low' : '';

            return `
                <div class="trending-card" onclick="handleTrendingCardClick(${product.id})">
                    <div class="trending-card-badge">${badges[i % badges.length]}</div>
                    <img src="${imageUrl}"
                         alt="${product.name}"
                         class="trending-card-img"
                         loading="lazy"
                         onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                    <div class="trending-card-img-placeholder" style="display:none;">📦</div>
                    <div class="trending-card-body">
                        <div class="trending-card-name">${product.name || 'Product'}</div>
                        <div class="trending-card-price">
                            KSH ${price.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                        </div>
                        <div class="trending-card-stock ${stockClass}">${stockLabel}</div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('Trending load error:', err);
        container.innerHTML = `<p style="color:#e74c3c;padding:20px;font-size:13px;">Could not load trending products.</p>`;
        if (countBadge) countBadge.textContent = 'Error';
    }
}

function scrollTrending(dir) {
    const el = document.getElementById('trending-scroll');
    if (el) el.scrollBy({ left: dir * 340, behavior: 'smooth' });
}

// Boot
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadTrendingProducts);
} else {
    loadTrendingProducts();
}