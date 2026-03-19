// ── trending.js ───────────────────────────────────────────────────────────────
// Trending products strip.
// Cards open app.showProductDetail(id) — the full page-view detail,
// NOT a modal popup.  Works whether trending is on the home page or
// has been moved into the product-detail slot by _renderProductDetailPage.

// ── Config ────────────────────────────────────────────────────────────────────
const TRENDING_COUNT   = 12;    // how many products to show
const TRENDING_TTL_MS  = 5 * 60 * 1000; // 5-min cache lifetime

// ── State ─────────────────────────────────────────────────────────────────────
let _trendingProducts  = [];
let _trendingFetchedAt = 0;

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Small delay so script.js / ECommerceApp has time to boot
    setTimeout(loadTrendingProducts, 400);
});

// ── Public loader (called by "Refresh picks" button too) ──────────────────────
async function loadTrendingProducts() {
    const scroll  = document.getElementById('trending-scroll');
    const countEl = document.getElementById('trending-count');
    if (!scroll) return;

    // Show skeleton while fetching
    _showTrendingSkeleton(scroll);
    if (countEl) countEl.textContent = 'Loading…';

    // Use cached data if fresh
    const now = Date.now();
    if (_trendingProducts.length > 0 && (now - _trendingFetchedAt) < TRENDING_TTL_MS) {
        _renderTrendingCards(_trendingProducts, scroll, countEl);
        return;
    }

    try {
        // Prefer the master product list already loaded by ECommerceApp
        let pool = _getAppProducts();

        // Fallback: fetch from API
        if (!pool || pool.length === 0) {
            const res = await fetch('/api/products');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            pool = await res.json();
        }

        if (!Array.isArray(pool) || pool.length === 0) {
            throw new Error('No products available');
        }

        // Pick trending: in-stock first, then shuffle, take top N
        const inStock   = pool.filter(p => parseInt(p.stock || 0) > 0);
        const outStock  = pool.filter(p => parseInt(p.stock || 0) <= 0);
        const shuffled  = [..._shuffle(inStock), ..._shuffle(outStock)];
        _trendingProducts  = shuffled.slice(0, TRENDING_COUNT);
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

// ── Render cards ──────────────────────────────────────────────────────────────
function _renderTrendingCards(products, scroll, countEl) {
    if (countEl) {
        countEl.textContent = `${products.length} item${products.length !== 1 ? 's' : ''}`;
    }

    scroll.innerHTML = products.map((p, idx) => {
        const img     = _resolveImg(p.image_url);
        const price   = parseFloat(p.price) || 0;
        const stock   = parseInt(p.stock)   || 0;
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

    // Fade-in animation
    scroll.querySelectorAll('.trending-card').forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(8px)';
        setTimeout(() => {
            card.style.transition = 'opacity .3s ease, transform .3s ease';
            card.style.opacity    = '1';
            card.style.transform  = 'translateY(0)';
        }, i * 50);
    });
}

// ── Add-to-cart from trending card ────────────────────────────────────────────
function _trendingAddToCart(productId) {
    // Find product in app's master list first, then in our local cache
    const pool    = _getAppProducts();
    let   product = (pool || []).find(p => p.id === productId)
                 || _trendingProducts.find(p => p.id === productId);

    if (product && typeof app !== 'undefined') {
        app.addToCart(product);
    } else {
        console.warn('[Trending] product not found for id:', productId);
    }
}

// ── Scroll arrows ─────────────────────────────────────────────────────────────
function scrollTrending(direction) {
    const scroll = document.getElementById('trending-scroll');
    if (!scroll) return;
    const cardWidth = (scroll.querySelector('.trending-card') || { offsetWidth: 180 }).offsetWidth + 12;
    scroll.scrollBy({ left: direction * cardWidth * 2, behavior: 'smooth' });
}

// ── Skeleton placeholder ──────────────────────────────────────────────────────
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

    // Inject shimmer keyframe once
    if (!document.getElementById('trending-shimmer-style')) {
        const s = document.createElement('style');
        s.id = 'trending-shimmer-style';
        s.textContent = `
            @keyframes trendShimmer {
                0%   { background-position: 200% 0 }
                100% { background-position: -200% 0 }
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
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Get the master product list from ECommerceApp if available
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
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}