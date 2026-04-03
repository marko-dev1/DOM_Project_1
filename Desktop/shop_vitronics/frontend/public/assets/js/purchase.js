
// // // ─── State ───────────────────────────────────────────────────
// // let stockPurchasesData   = [];
// // let filteredPurchases    = [];
// // let stockPurchasesPage   = 1;
// // const stockPurchasesLimit = 10;

// // (function patchSwitchSection() {
// //     const tryPatch = () => {
// //         if (typeof window.switchSection === 'function') {
// //             const _orig = window.switchSection;
// //             window.switchSection = function (sectionName) {
// //                 if (sectionName === 'stock-purchases' || sectionName === 'net-revenue') {
                   
// //                     document.querySelectorAll('.sidebar-menu li').forEach(i => i.classList.remove('active'));
// //                     document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

// //                     const li = document.querySelector(`[data-section="${sectionName}"]`);
// //                     if (li) li.classList.add('active');

// //                     const sec = document.getElementById(sectionName);
// //                     if (sec) sec.classList.add('active');

// //                     if (sectionName === 'stock-purchases') loadStockPurchases();
// //                     if (sectionName === 'net-revenue')      initNetRevenue();
// //                 } else {
// //                     _orig(sectionName);
// //                 }
// //             };
// //         } else {
// //             setTimeout(tryPatch, 50);
// //         }
// //     };
// //     tryPatch();
// // })();

// // // ═══════════════════════════════════════════════════════════════
// // //  STOCK PURCHASES
// // // ═══════════════════════════════════════════════════════════════

// // async function loadStockPurchases() {
// //     try {
// //         showStockPurchasesLoading(true);

// //         // Fetch from backend (POST /api/stock-purchases)
// //         // Falls back to empty array if endpoint doesn't exist yet
// //         let data = [];
// //         try {
// //             const res = await apiCall('/api/stock-purchases');
// //             data = Array.isArray(res) ? res : (res.data || []);
// //         } catch (e) {
// //             // endpoint may not exist yet — work with local cache
// //             data = stockPurchasesData.length ? stockPurchasesData : [];
// //         }

// //         stockPurchasesData = data;
// //         filteredPurchases  = [...data];
// //         stockPurchasesPage = 1;

// //         renderStockPurchasesStats(data);
// //         applyStockPurchasesPagination();
// //         await updateCogsInNetRevenue();

// //     } catch (err) {
// //         console.error('loadStockPurchases error:', err);
// //         showNotification('Error loading stock purchases', 'error');
// //     } finally {
// //         showStockPurchasesLoading(false);
// //     }
// // }

// // function showStockPurchasesLoading(on) {
// //     const el = document.getElementById('stockPurchasesLoading');
// //     if (el) el.style.display = on ? 'block' : 'none';
// // }

// // // ── Stats bar ────────────────────────────────────────────────
// // function renderStockPurchasesStats(purchases) {
// //     const now      = new Date();
// //     const todayStr = now.toDateString();
// //     const weekAgo  = new Date(now - 7  * 86400000);
// //     const monthAgo = new Date(now - 30 * 86400000);

// //     let totalCost = 0, todayCost = 0, weekCost = 0, monthCost = 0;
// //     let totalQty  = 0;

// //     purchases.forEach(p => {
// //         const cost = parseFloat(p.total_cost || p.unit_cost * p.quantity || 0);
// //         const qty  = parseInt(p.quantity || 0);
// //         const d    = new Date(p.purchase_date || p.created_at);

// //         totalCost += cost;
// //         totalQty  += qty;
// //         if (d.toDateString() === todayStr) todayCost += cost;
// //         if (d >= weekAgo)  weekCost  += cost;
// //         if (d >= monthAgo) monthCost += cost;
// //     });

// //     set('spTotalCost',   fmt(totalCost));
// //     set('spTodayCost',   fmt(todayCost));
// //     set('spWeekCost',    fmt(weekCost));
// //     set('spMonthCost',   fmt(monthCost));
// //     set('spTotalItems',  purchases.length + ' entries');
// //     set('spTotalQty',    totalQty + ' units');
// // }

// // // ── Table ────────────────────────────────────────────────────
// // function applyStockPurchasesPagination() {
// //     const start    = (stockPurchasesPage - 1) * stockPurchasesLimit;
// //     const pageData = filteredPurchases.slice(start, start + stockPurchasesLimit);
// //     renderStockPurchasesTable(pageData);
// //     updateStockPurchasesPaginationUI();
// // }

// // function renderStockPurchasesTable(purchases) {
// //     const tbody = document.getElementById('stockPurchasesTableBody');
// //     if (!tbody) return;

// //     if (!purchases.length) {
// //         tbody.innerHTML = `<tr><td colspan="9" class="sp-empty">
// //             No stock purchases recorded yet.<br>
// //             <button class="sp-btn sp-btn-primary" onclick="showAddStockPurchaseModal()" style="margin-top:12px">
// //                 + Record First Purchase
// //             </button></td></tr>`;
// //         return;
// //     }

// //     tbody.innerHTML = purchases.map(p => {
// //         const unitCost  = parseFloat(p.unit_cost  || 0);
// //         const qty       = parseInt(p.quantity      || 0);
// //         const totalCost = parseFloat(p.total_cost  || unitCost * qty);
// //         const date      = new Date(p.purchase_date || p.created_at);

// //         return `<tr>
// //             <td><strong>${p.product_name || '—'}</strong><br>
// //                 <small style="color:#888">${p.category || ''}</small></td>
// //             <td>${p.supplier_name || '—'}</td>
// //             <td><strong>${qty}</strong> units</td>
// //             <td>KSH ${unitCost.toFixed(2)}</td>
// //             <td><strong>KSH ${totalCost.toFixed(2)}</strong></td>
// //             <td>${p.payment_method || 'Cash'}</td>
// //             <td><span class="sp-badge sp-badge-${p.status === 'received' ? 'success' : 'warn'}">${p.status || 'received'}</span></td>
// //             <td>${date.toLocaleDateString()}</td>
// //             <td>
// //                 <button class="sp-btn sp-btn-sm sp-btn-danger" onclick="deleteStockPurchase('${p.id}')">✕</button>
// //             </td>
// //         </tr>`;
// //     }).join('');
// // }

// // function updateStockPurchasesPaginationUI() {
// //     const totalPages = Math.max(1, Math.ceil(filteredPurchases.length / stockPurchasesLimit));
// //     set('spPageInfo', `Page ${stockPurchasesPage} of ${totalPages} (${filteredPurchases.length} records)`);

// //     const prev = document.getElementById('prevSpBtn');
// //     const next = document.getElementById('nextSpBtn');
// //     if (prev) { prev.disabled = stockPurchasesPage <= 1; prev.style.opacity = prev.disabled ? '.5' : '1'; }
// //     if (next) { next.disabled = stockPurchasesPage >= totalPages; next.style.opacity = next.disabled ? '.5' : '1'; }
// // }

// // function prevStockPurchasesPage() {
// //     if (stockPurchasesPage > 1) { stockPurchasesPage--; applyStockPurchasesPagination(); }
// // }
// // function nextStockPurchasesPage() {
// //     if (stockPurchasesPage < Math.ceil(filteredPurchases.length / stockPurchasesLimit)) {
// //         stockPurchasesPage++; applyStockPurchasesPagination();
// //     }
// // }

// // function searchStockPurchases(q) {
// //     q = q.toLowerCase().trim();
// //     filteredPurchases = q
// //         ? stockPurchasesData.filter(p =>
// //             (p.product_name  || '').toLowerCase().includes(q) ||
// //             (p.supplier_name || '').toLowerCase().includes(q) ||
// //             (p.category      || '').toLowerCase().includes(q))
// //         : [...stockPurchasesData];
// //     stockPurchasesPage = 1;
// //     applyStockPurchasesPagination();
// // }

// // // ── Add Purchase Modal ───────────────────────────────────────
// // function showAddStockPurchaseModal() {
// //     ensureStockPurchaseModal();
// //     const modal = document.getElementById('addStockPurchaseModal');

// //     // Pre-fill date
// //     const now = new Date();
// //     now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
// //     const dateEl = document.getElementById('spPurchaseDate');
// //     if (dateEl) dateEl.value = now.toISOString().slice(0, 16);

// //     // Populate products dropdown
// //     populateSpProductDropdown();

// //     modal.style.display = 'flex';
// // }

// // async function populateSpProductDropdown() {
// //     const sel = document.getElementById('spProductSelect');
// //     if (!sel) return;
// //     try {
// //         const products = await apiCall('/api/products');
// //         const list = Array.isArray(products) ? products : [];

// //         sel.innerHTML = '<option value="">— Select product —</option>' +
// //             list.map(p => {
// //                 const stock = parseInt(p.stock || 0);
// //                 const cost  = parseFloat(p.cost || 0);
// //                 return `<option value="${p.id}"
// //                     data-name="${(p.name||'').replace(/"/g,'&quot;')}"
// //                     data-cost="${cost}"
// //                     data-stock="${stock}"
// //                     data-cat="${p.category || ''}"
// //                     data-restock="${p.restockLevel || 5}"
// //                     data-price="${p.price || 0}">
// //                     ${p.name} — Stock: ${stock} units
// //                 </option>`;
// //             }).join('');

// //         sel.onchange = () => {
// //             const opt = sel.options[sel.selectedIndex];
// //             if (!opt.value) { clearStockPreview(); return; }

// //             // Auto-fill unit cost from product.cost
// //             const costEl = document.getElementById('spUnitCost');
// //             if (costEl) costEl.value = opt.dataset.cost || '';

// //             recalcTotalCost();
// //             updateStockPreview(opt);
// //         };
// //     } catch (e) { console.warn('populateSpProductDropdown:', e); }
// // }

// // function updateStockPreview(opt) {
// //     const preview = document.getElementById('spStockPreview');
// //     if (!preview) return;
// //     const currentStock = parseInt(opt.dataset.stock || 0);
// //     const qty          = parseInt(document.getElementById('spQuantity')?.value || 0);
// //     const newStock     = currentStock + qty;
// //     const restock      = parseInt(opt.dataset.restock || 5);
// //     const statusColor  = newStock === 0 ? '#ef4444' : newStock < restock ? '#f59e0b' : '#10b981';
// //     preview.innerHTML  = `
// //         <span style="color:#64748b">Current stock:</span>
// //         <strong>${currentStock} units</strong>
// //         &nbsp;→&nbsp;
// //         <span style="color:#3b82f6">After purchase:</span>
// //         <strong style="color:${statusColor}">${newStock} units</strong>`;
// //     preview.style.display = 'block';
// // }

// // function clearStockPreview() {
// //     const preview = document.getElementById('spStockPreview');
// //     if (preview) { preview.innerHTML = ''; preview.style.display = 'none'; }
// // }

// // function recalcTotalCost() {
// //     const qty  = parseFloat(document.getElementById('spQuantity')?.value  || 0);
// //     const cost = parseFloat(document.getElementById('spUnitCost')?.value   || 0);
// //     const el   = document.getElementById('spTotalCostPreview');
// //     if (el) el.textContent = `KSH ${(qty * cost).toFixed(2)}`;
// // }

// // function closeAddStockPurchaseModal() {
// //     const modal = document.getElementById('addStockPurchaseModal');
// //     if (modal) modal.style.display = 'none';
// //     document.getElementById('addStockPurchaseForm')?.reset();
// // }

// // async function saveStockPurchase(e) {
// //     // Block native form submit immediately — must be first, before any guard
// //     if (e && typeof e.preventDefault === 'function') e.preventDefault();
// //     if (e && typeof e.stopPropagation === 'function') e.stopPropagation();

// //     // Hard guard — if a save is already in-flight, ignore the second event entirely
// //     if (saveStockPurchase._inFlight) {
// //         console.warn('[saveStockPurchase] Already saving — duplicate event ignored');
// //         return;
// //     }
// //     saveStockPurchase._inFlight = true;

// //     const sel         = document.getElementById('spProductSelect');
// //     const productId   = sel?.value || null;
// //     const productName = sel?.options[sel.selectedIndex]?.dataset.name || '';
// //     const category    = sel?.options[sel.selectedIndex]?.dataset.cat  || '';
// //     const qty         = parseInt(document.getElementById('spQuantity')?.value  || 0);
// //     const unitCost    = parseFloat(document.getElementById('spUnitCost')?.value || 0);
// //     const status      = document.getElementById('spStatus')?.value || 'received';

// //     const releaseGuard = () => { saveStockPurchase._inFlight = false; };

// //     if (!productId) {
// //         releaseGuard();
// //         showNotification('Please select a product', 'warning'); return;
// //     }
// //     if (qty <= 0) {
// //         releaseGuard();
// //         showNotification('Quantity must be greater than 0', 'warning'); return;
// //     }
// //     if (unitCost <= 0) {
// //         releaseGuard();
// //         showNotification('Unit cost must be greater than 0', 'warning'); return;
// //     }

// //     // Disable submit button to prevent double-submit
// //     const submitBtn = document.querySelector('#addStockPurchaseForm button[type="submit"]');
// //     if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving…'; }

// //     const payload = {
// //         product_id:     parseInt(productId, 10),   
// //         product_name:   productName,
// //         category:       category,
// //         supplier_name:  document.getElementById('spSupplierName')?.value  || '',
// //         supplier_phone: document.getElementById('spSupplierPhone')?.value || '',
// //         quantity:       qty,
// //         unit_cost:      unitCost,
// //         total_cost:     qty * unitCost,
// //         payment_method: document.getElementById('spPaymentMethod')?.value || 'Cash',
// //         status:         status,
// //         notes:          document.getElementById('spNotes')?.value         || '',
// //         purchase_date:  document.getElementById('spPurchaseDate')?.value  || new Date().toISOString(),
// //     };

// //     try {
// //         // POST to backend — the backend handles inventory update atomically
// //         // in a single DB transaction. The frontend must NOT touch products
// //         // stock separately (doing so causes double-counting).
// //         const res = await apiCall('/api/stock-purchases', {
// //             method: 'POST',
// //             body: JSON.stringify(payload)
// //         });

// //         if (!res || res.success === false) {
// //             throw new Error(res?.error || 'Server did not confirm the purchase was saved');
// //         }

// //         const stockNote = status === 'received'
// //             ? `+${qty} units added to inventory`
// //             : `inventory unchanged (status: ${status})`;

// //         // Refresh UI from backend — single source of truth
// //         await refreshInventoryUI();
// //         await loadStockPurchases();
// //         closeAddStockPurchaseModal();
// //         showNotification(`✓ Purchase saved — ${stockNote}`, 'success');

// //     } catch (err) {
// //         console.error('saveStockPurchase error:', err);
// //         showNotification('Error saving purchase: ' + err.message, 'error');
// //     } finally {
// //         saveStockPurchase._inFlight = false;
// //         if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Purchase'; }
// //     }
// // }

// // // ─── Refresh all open inventory/product views from the server ────────────────
// // // Called after any purchase save or delete so every panel shows live data.
// // // Does NOT modify stock itself — reads only.
// // async function refreshInventoryUI() {
// //     try {
// //         if (typeof loadInventoryDashboard === 'function') {
// //             await loadInventoryDashboard();
// //         }
// //         if (typeof loadFullInventory === 'function' &&
// //             document.getElementById('inventory')?.classList.contains('active')) {
// //             await loadFullInventory();
// //         }
// //         if (typeof loadProducts === 'function' &&
// //             document.getElementById('products')?.classList.contains('active')) {
// //             await loadProducts();
// //         }
// //     } catch (_) { /* non-critical — UI refresh failure should not block the save */ }
// // }

// // async function deleteStockPurchase(id) {
// //     const purchase = stockPurchasesData.find(p => String(p.id) === String(id));
// //     if (!purchase) { showNotification('Purchase record not found', 'error'); return; }

// //     const confirmMsg = `Delete purchase of ${purchase.quantity} × ${purchase.product_name}?

// // ` +
// //         `This will also deduct ${purchase.quantity} unit(s) from inventory ` +
// //         `(only if status was "received").`;
// //     if (!confirm(confirmMsg)) return;

// //     const delBtn = document.querySelector(`button[onclick="deleteStockPurchase('${id}')"]`);
// //     if (delBtn) { delBtn.disabled = true; delBtn.textContent = '…'; }

// //     try {
// //         // DELETE on backend — stock reversal is handled atomically in the
// //         // backend transaction. Frontend must NOT touch products stock separately.
// //         await apiCall(`/api/stock-purchases/${id}`, { method: 'DELETE' });

// //         const stockNote = purchase.status === 'received'
// //             ? `${purchase.quantity} units removed from inventory`
// //             : 'inventory unchanged (was not received)';

// //         await refreshInventoryUI();
// //         await loadStockPurchases();
// //         showNotification(`✓ Purchase deleted — ${stockNote}`, 'success');

// //     } catch (err) {
// //         console.error('deleteStockPurchase error:', err);
// //         showNotification('Error deleting purchase: ' + err.message, 'error');
// //         if (delBtn) { delBtn.disabled = false; delBtn.textContent = '✕'; }
// //     }
// // }

// // // ─── Export stock purchases to CSV ──────────────────────────
// // function exportStockPurchasesCSV() {
// //     if (!stockPurchasesData.length) { showNotification('No data to export', 'warning'); return; }
// //     const rows = [['Product', 'Category', 'Supplier', 'Qty', 'Unit Cost (KSH)', 'Total Cost (KSH)', 'Payment', 'Status', 'Date']];
// //     stockPurchasesData.forEach(p => {
// //         rows.push([
// //             p.product_name, p.category, p.supplier_name,
// //             p.quantity, p.unit_cost, p.total_cost || (p.unit_cost * p.quantity),
// //             p.payment_method, p.status,
// //             new Date(p.purchase_date || p.created_at).toLocaleDateString()
// //         ]);
// //     });
// //     downloadCSV(rows, 'stock-purchases');
// // }

// // // ═══════════════════════════════════════════════════════════════
// // //  NET REVENUE  =  Σ (sale_price - cogs_per_unit) × qty  −  expenses
// // // ═══════════════════════════════════════════════════════════════

// // async function initNetRevenue() {
// //     await populateNrMonthDropdown();   // fill dropdown first
// //     await computeAndRenderNetRevenue(); // then compute for current selection
// // }

// // // Populate the month dropdown from actual sale dates
// // async function populateNrMonthDropdown() {
// //     const sel = document.getElementById('nrMonthSelect');
// //     if (!sel) return;

// //     try {
// //         const res  = await apiCall('/api/sales');
// //         const data = res.success ? (res.data || []) : (Array.isArray(res) ? res : []);

// //         // Collect unique YYYY-MM strings
// //         const monthsSet = new Set();
// //         data.forEach(sale => {
// //             const d = new Date(sale.sales_date || sale.date || sale.created_at);
// //             if (!isNaN(d)) {
// //                 const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
// //                 monthsSet.add(key);
// //             }
// //         });

// //         // Sort descending (most recent first)
// //         const months = Array.from(monthsSet).sort().reverse();

// //         // Rebuild options, preserving current selection
// //         const current = sel.value;
// //         sel.innerHTML = '<option value="all">📊 All Time</option>';
// //         months.forEach(m => {
// //             const [yr, mo] = m.split('-').map(Number);
// //             const label = new Date(yr, mo - 1, 1)
// //                 .toLocaleString('default', { month: 'long', year: 'numeric' });
// //             const opt = document.createElement('option');
// //             opt.value = m;
// //             opt.textContent = label;
// //             if (m === current) opt.selected = true;
// //             sel.appendChild(opt);
// //         });

// //         // Default to current calendar month if available
// //         if (current === 'all' || !current) {
// //             const now = new Date();
// //             const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
// //             if (monthsSet.has(thisMonth)) sel.value = thisMonth;
// //         }

// //     } catch (_) { /* silent — dropdown stays with just "All Time" */ }
// // }

// // // Called when user picks a different month
// // function onNrMonthChange(value) {
// //     computeAndRenderNetRevenue(value);
// // }

// // // selectedMonth: 'all' | 'YYYY-MM'  (default: 'all')
// // async function computeAndRenderNetRevenue(selectedMonth) {
// //     selectedMonth = selectedMonth || document.getElementById('nrMonthSelect')?.value || 'all';
// //     try {
// //         set('nrBreakdownBody', '');
// //         const loadingRow = `<tr><td colspan="6" style="text-align:center;padding:24px;color:#888">
// //             <span style="display:inline-block;animation:spin 1s linear infinite;margin-right:8px">⟳</span>
// //             Calculating…</td></tr>`;
// //         const tbody = document.getElementById('nrBreakdownBody');
// //         if (tbody) tbody.innerHTML = loadingRow;

// //         // ── 1. Fetch products eagerly — CoGS lives in product.cost ──────────
// //         const cogsById   = {}; // product_id  → unit cost (KSH)
// //         const cogsByName = {}; // lower-name  → unit cost (KSH)
// //         const priceById  = {}; // product_id  → selling price (fallback)

// //         try {
// //             const products = await apiCall('/api/products');
// //             const list = Array.isArray(products) ? products : (products.data || []);
// //             list.forEach(p => {
// //                 // product.cost  = what you paid per unit  (CoGS)
// //                 // product.price = what you sell for
// //                 const costVal  = parseFloat(p.cost  || p.productCost || p.unit_cost || 0);
// //                 const priceVal = parseFloat(p.price || 0);
// //                 const idKey    = String(p.id);
// //                 const nameKey  = (p.name || '').toLowerCase().trim();

// //                 cogsById[idKey]     = costVal;
// //                 priceById[idKey]    = priceVal;
// //                 if (nameKey) {
// //                     cogsByName[nameKey]  = costVal;
// //                 }
// //             });
// //         } catch (_) { console.warn('Could not fetch products for CoGS lookup — net revenue may be inaccurate or connection issues'); }

// //         // Stock-purchase records override the product catalogue cost (most-recent wins)
// //         const sortedPurchases = [...stockPurchasesData].sort((a, b) =>
// //             new Date(a.purchase_date || a.created_at || 0) -
// //             new Date(b.purchase_date || b.created_at || 0)
// //         );
// //         sortedPurchases.forEach(p => {
// //             const cost    = parseFloat(p.unit_cost || 0);
// //             const idKey   = String(p.product_id   || '');
// //             const nameKey = (p.product_name || '').toLowerCase().trim();
// //             if (idKey   && cost > 0) cogsById[idKey]     = cost;
// //             if (nameKey && cost > 0) cogsByName[nameKey] = cost;
// //         });

// //         // Helper: resolve CoGS per unit for any sale line item
// //         const resolveCogsUnit = (item) => {
// //             const idKey   = String(item.product_id || item.id || '');
// //             const nameKey = (item.product_name || item.name || '').toLowerCase().trim();

// //             // Priority: product catalogue cost > stock-purchase override > item-embedded cost
// //             if (idKey   && cogsById[idKey]     !== undefined && cogsById[idKey]   > 0) return cogsById[idKey];
// //             if (nameKey && cogsByName[nameKey] !== undefined && cogsByName[nameKey] > 0) return cogsByName[nameKey];

// //             // Item may carry its own cost field (some backends embed it)
// //             const embedded = parseFloat(item.cost || item.unit_cost || item.productCost || 0);
// //             return embedded;
// //         };

// //         // ── 2. Fetch sales ───────────────────────────────────────────────────
// //         let sales = [];
// //         try {
// //             const res = await apiCall('/api/sales');
// //             sales = res.success ? (res.data || []) : (Array.isArray(res) ? res : []);
// //         } catch (_) {}

// //         // ── 3. For each sale, ensure items are populated ─────────────────────
// //         //   backend exposes /api/sales/:id/items separately.
// //         //   We batch-fetch only for sales where items is absent/empty.
// //         const salesWithItems = await Promise.all(sales.map(async (sale) => {
// //             if (Array.isArray(sale.items) && sale.items.length > 0) return sale;
// //             try {
// //                 const r = await apiCall(`/api/sales/${sale.id}/items`);
// //                 return { ...sale, items: r.success ? (r.data || []) : [] };
// //             } catch (_) {
// //                 return { ...sale, items: [] };
// //             }
// //         }));

// //         // ── 4. Determine filter window (must come before expenses so
// //         //    isMonthView / filterStart / filterEnd are defined) ────────────────
// //         const now        = new Date();
// //         const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
// //         const weekStart  = new Date(todayStart);
// //         weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
        
// //         // If week start falls in previous month, use month start instead
// //         // This ensures weekly data resets when new month begins mid-week
// //         const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
// //         if (weekStart < monthStart) {
// //             weekStart.setTime(monthStart.getTime());
// //         }
        
// //         //  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

// //         // When a specific month is selected, restrict ALL aggregation to that month.
// //         // When "all" is selected, aggregate everything and show today/week/month sub-cards.
// //         let filterStart = null;
// //         let filterEnd   = null;
// //         let isMonthView = false;
// //         let monthLabel  = '';

// //         if (selectedMonth && selectedMonth !== 'all') {
// //             const [yr, mo] = selectedMonth.split('-').map(Number);
// //             filterStart  = new Date(yr, mo - 1, 1);
// //             filterEnd    = new Date(yr, mo, 0, 23, 59, 59, 999); // last ms of month
// //             isMonthView  = true;
// //             monthLabel   = filterStart.toLocaleString('default', { month: 'long', year: 'numeric' });
// //         }

// //         // Update card labels to reflect current view
// //         if (isMonthView) {
// //             set('nrLabelToday', 'First Week of ' + monthLabel);
// //             set('nrSubToday',   'Week 1 gross profit');
// //             set('nrLabelWeek',  'Mid-Month ' + monthLabel);
// //             set('nrSubWeek',    'Weeks 2–3 gross profit');
// //             set('nrLabelMonth', monthLabel + ' Total');
// //             set('nrSubMonth',   'Full month gross profit');
// //         } else {
// //             set('nrLabelToday', "Today's Gross Profit");
// //             set('nrSubToday',   'Sales − CoGS today');
// //             set('nrLabelWeek',  "This Week's Gross Profit");
// //             set('nrSubWeek',    'Sales − CoGS this week');
// //             set('nrLabelMonth', "This Month's Gross Profit");
// //             set('nrSubMonth',   'Sales − CoGS this month');
// //         }

// //         const PURCHASE_KEYWORDS = [
// //             'stock', 'purchase', 'inventory', 'restock', 'procurement',
// //             'goods', 'merchandise', 'product cost', 'buying', 'supplier',
// //             'wholesale', 'cogs', 'cost of goods'
// //         ];
// //         const isPurchaseEntry = (exp) => {
// //             const cat  = (exp.category    || '').toLowerCase();
// //             const desc = (exp.description || exp.name || exp.title || '').toLowerCase();
// //             return PURCHASE_KEYWORDS.some(k => cat.includes(k) || desc.includes(k));
// //         };

// //         let expenseTotal = 0;
// //         let rawExpenses  = [];
// //         try {
// //             const listRes = await apiCall('/api/expenses');
// //             rawExpenses = listRes.success
// //                 ? (listRes.data || [])
// //                 : (Array.isArray(listRes) ? listRes : []);
// //         } catch (_) {}

// //         if (rawExpenses.length > 0) {
// //             rawExpenses
// //                 .filter(exp => !isPurchaseEntry(exp))
// //                 .forEach(exp => {
// //                     const amt     = parseFloat(exp.amount || exp.total || 0);
// //                     const expDate = new Date(exp.date || exp.expense_date || exp.created_at);
// //                     const inPeriod = !isMonthView
// //                         ? true
// //                         : (expDate >= filterStart && expDate <= filterEnd);
// //                     if (inPeriod) expenseTotal += amt;
// //                 });
// //         } else {
// //             // Fallback: stats/summary API (no per-month filtering available)
// //             try {
// //                 const expRes = await apiCall('/api/expenses/stats/summary');
// //                 if (expRes.success && expRes.data) {
// //                     expenseTotal = isMonthView
// //                         ? Number(expRes.data.monthly || 0)
// //                         : Number(expRes.data.allTime || 0);
// //                 }
// //             } catch (_) {}
// //         }

// //         // ── 6. Aggregate ─────────────────────────────────────────────────────
// //         let grossRevTotal = 0, cogsTotal = 0, grossProfitTotal = 0;
// //         // Sub-period accumulators
// //         let profitP1 = 0; // today  OR week-1  of selected month
// //         let profitP2 = 0; // week   OR mid-month of selected month
// //         let profitP3 = 0; // month  OR full selected month
// //         let revP3    = 0; // revenue for period-3 (used in audit)

// //         const breakdown = [];

// //         // For a selected month, split into 3 sub-periods:
// //         //   P1 = days 1–7   (first week)
// //         //   P2 = days 8–21  (mid-month)
// //         //   P3 = entire month
// //         const getSubPeriod = (saleDate) => {
// //             if (!isMonthView) {
// //                 return {
// //                     p1: saleDate >= todayStart,
// //                     p2: saleDate >= weekStart,
// //                     p3: saleDate >= monthStart
// //                 };
// //             }
// //             const day = saleDate.getDate();
// //             return {
// //                 p1: day >= 1  && day <= 7,
// //                 p2: day >= 8  && day <= 21,
// //                 p3: true  // entire selected month (filter already applied below)
// //             };
// //         };

// //         salesWithItems.forEach(sale => {
// //             const saleDate = new Date(sale.sales_date || sale.date || sale.created_at);

// //             // If a month filter is active, skip sales outside that month
// //             if (isMonthView && (saleDate < filterStart || saleDate > filterEnd)) return;

// //             const { p1, p2, p3 } = getSubPeriod(saleDate);
// //             const items = Array.isArray(sale.items) ? sale.items : [];

// //             if (items.length > 0) {
// //                 items.forEach(item => {
// //                     const qty       = parseInt(item.quantity || 1);
// //                     const sellPrice = parseFloat(item.unit_price || item.price || 0);
// //                     const pid       = String(item.product_id || item.id || '');
// //                     const pname     = item.product_name || item.name || 'Unknown';
// //                     const cogsUnit  = resolveCogsUnit(item);

// //                     const revenue  = sellPrice * qty;
// //                     const itemCogs = cogsUnit  * qty;
// //                     const profit   = (sellPrice - cogsUnit) * qty;

// //                     grossRevTotal    += revenue;
// //                     cogsTotal        += itemCogs;
// //                     grossProfitTotal += profit;

// //                     if (p1) profitP1 += profit;
// //                     if (p2) profitP2 += profit;
// //                     if (p3) { profitP3 += profit; revP3 += revenue; }

// //                     const existing = breakdown.find(b => b.id === pid && b.name === pname);
// //                     if (existing) {
// //                         existing.revenue += revenue;
// //                         existing.cogs    += itemCogs;
// //                         existing.profit  += profit;
// //                         existing.qty     += qty;
// //                     } else {
// //                         breakdown.push({ id: pid, name: pname, revenue, cogs: itemCogs, profit, qty, cogsUnit, sellPrice });
// //                     }
// //                 });
// //             } else {
// //                 const amt        = parseFloat(sale.total_amount || 0);
// //                 const saleProfit = parseFloat(sale.profit       || 0);
// //                 const saleCogs   = amt - saleProfit;

// //                 grossRevTotal    += amt;
// //                 cogsTotal        += saleCogs;
// //                 grossProfitTotal += saleProfit;

// //                 if (p1) profitP1 += saleProfit;
// //                 if (p2) profitP2 += saleProfit;
// //                 if (p3) { profitP3 += saleProfit; revP3 += amt; }
// //             }
// //         });

// //         // Net Revenue = Gross Profit − Expenses (scoped to same period)
// //         const netTotal = grossProfitTotal - expenseTotal;
// //         const netToday = profitP1;
// //         const netWeek  = profitP2;
// //         const netMonth = profitP3;



// //         const grossMarkup = cogsTotal > 0 ? (grossProfitTotal / cogsTotal * 100) : (grossRevTotal > 0 ? 100 : 0);
// //         const netMarginPct = grossRevTotal > 0 ? (netTotal / grossRevTotal * 100) : 0;

// //         // ── Render summary cards ──────────────────────────────
// //         set('nrGrossRevenue',   fmt(grossRevTotal));
// //         set('nrTotalCogs',      fmt(cogsTotal));
// //         set('nrGrossProfit',    fmt(grossProfitTotal));
// //         set('nrTotalExpenses',  fmt(expenseTotal));
// //         set('nrExpensesLabel',  isMonthView ? monthLabel + ' expenses' : 'All-time operating expenses');
// //         set('nrNetRevenue',     fmt(netTotal),       netTotal  >= 0 ? '#0ec96a' : '#e74c3c');
// //         set('nrGrossMargin',    grossMarkup.toFixed(1) + '% markup');
// //         set('nrNetMargin',      netMarginPct.toFixed(1) + '% net margin', netMarginPct >= 0 ? '#0ec96a' : '#e74c3c');

// //         set('nrNetToday',  fmt(netToday),  netToday  >= 0 ? '#0ec96a' : '#e74c3c');
// //         set('nrNetWeek',   fmt(netWeek),   netWeek   >= 0 ? '#0ec96a' : '#e74c3c');
// //         set('nrNetMonth',  fmt(netMonth),  netMonth  >= 0 ? '#0ec96a' : '#e74c3c');

// //         // ── Audit trail — shows every input number so user can verify ──────
// //         const auditEl = document.getElementById('nrAuditContent');
// //         if (auditEl) {
// //             const salesCount = salesWithItems.filter(s => {
// //                 if (!isMonthView) return true;
// //                 const d = new Date(s.sales_date || s.date || s.created_at);
// //                 return d >= filterStart && d <= filterEnd;
// //             }).length;
// //             const itemsCount = breakdown.reduce((s, b) => s + b.qty, 0);
// //             const periodLabel = isMonthView ? monthLabel : 'All Time';
// //             auditEl.innerHTML = `
// //                 <table class="nr-audit-table">
                   
// //                     <tbody>
// //                         <tr class="nr-audit-section"><td colspan="3">GROSS REVENUE — ${periodLabel}</td></tr>
// //                         <tr><td>Total sales processed</td><td>${salesCount} sales</td><td>From /api/sales + /api/sales/:id/items</td></tr>
// //                         <tr><td>Total items sold</td><td>${itemsCount} units</td><td>Sum of all line-item quantities</td></tr>
// //                         <tr class="nr-audit-pos"><td><strong>Gross Revenue</strong></td><td><strong>${fmt(grossRevTotal)}</strong></td><td>Σ (unit_price × qty) across all items</td></tr>

// //                         <tr class="nr-audit-section"><td colspan="3">COST OF GOODS SOLD (CoGS)</td></tr>
// //                         <tr><td>CoGS source</td><td>product.cost field</td><td>Overridden by Stock Purchases unit_cost if present</td></tr>
// //                         <tr class="nr-audit-neg"><td><strong>Total CoGS</strong></td><td><strong>${fmt(cogsTotal)}</strong></td><td>Σ (product.cost × qty) across all items</td></tr>

// //                         <tr class="nr-audit-section"><td colspan="3">GROSS PROFIT</td></tr>
// //                         <tr class="nr-audit-pos"><td><strong>Gross Profit</strong></td><td><strong>${fmt(grossProfitTotal)}</strong></td><td>${fmt(grossRevTotal)} − ${fmt(cogsTotal)}</td></tr>
// //                         <tr><td>Gross Markup</td><td>${grossMarkup.toFixed(2)}%</td><td>${fmt(grossProfitTotal)} ÷ ${fmt(cogsTotal)} × 100</td></tr>

// //                         <tr class="nr-audit-section"><td colspan="3">OPERATING EXPENSES — ${periodLabel}</td></tr>
// //                         <tr class="nr-audit-neg"><td><strong>Expenses (${periodLabel})</strong></td><td><strong>${fmt(expenseTotal)}</strong></td><td>${isMonthView ? 'Expenses dated within ' + monthLabel + ' (stock purchases excluded)' : 'All expenses ever (stock purchases excluded)'}</td></tr>

// //                         <tr class="nr-audit-section"><td colspan="3">NET REVENUE (bottom line)</td></tr>
// //                         <tr class="${netTotal >= 0 ? 'nr-audit-pos' : 'nr-audit-neg'}">
// //                             <td><strong>NET REVENUE</strong></td>
// //                             <td><strong>${fmt(netTotal)}</strong></td>
// //                             <td>${fmt(grossProfitTotal)} − ${fmt(expenseTotal)} (${periodLabel} expenses)</td>
// //                         </tr>
// //                         <tr><td>Net Margin</td><td>${netMarginPct.toFixed(2)}%</td><td>${fmt(netTotal)} ÷ ${fmt(grossRevTotal)} × 100</td></tr>

// //                         <tr class="nr-audit-section"><td colspan="3">TOTAL GROSS PROFITS</td></tr>
// //                         <tr class="${netToday >= 0 ? 'nr-audit-pos' : 'nr-audit-neg'}"><td>${isMonthView ? 'Week 1 Gross Profit' : "Today's Gross Profit"}</td><td>${fmt(netToday)}</td><td>${isMonthView ? 'Days 1–7 of ' + monthLabel : 'Items sold today × (sell price − cost)'}</td></tr>
// //                         <tr class="${netWeek >= 0 ? 'nr-audit-pos' : 'nr-audit-neg'}"><td>${isMonthView ? 'Mid-Month Gross Profit' : "This Week's Gross Profit"}</td><td>${fmt(netWeek)}</td><td>${isMonthView ? 'Days 8–21 of ' + monthLabel : 'Items sold this week × (sell price − cost)'}</td></tr>
// //                         <tr class="${netMonth >= 0 ? 'nr-audit-pos' : 'nr-audit-neg'}"><td>${isMonthView ? monthLabel + ' Total Gross Profit' : "This Month's Gross Profit"}</td><td>${fmt(netMonth)}</td><td>${isMonthView ? 'Full month: ' + monthLabel : 'Items sold this month × (sell price − cost)'}</td></tr>
                       
// //                     </tbody>
// //                 </table>`;
// //         }

// //         // ── Product breakdown table ───────────────────────────
// //         renderNetRevenueBreakdown(breakdown.sort((a, b) => b.profit - a.profit));

// //         // Also push the net revenue figure to the main revenue dashboard cards
// //         pushNetRevenueToRevenueDashboard({ netTotal, netToday, netWeek, netMonth, grossProfitTotal, cogsTotal });

// //     } catch (err) {
// //         console.error('computeAndRenderNetRevenue error:', err);
// //     }
// // }

// // // buildCogsMap is now handled inline inside computeAndRenderNetRevenue.
// // // Kept as a no-op stub to avoid any residual reference errors.
// // function buildCogsMap() { return {}; }

// // // Push computed net revenue values to existing revenue dashboard elements
// // function pushNetRevenueToRevenueDashboard(vals) {
// //     const safeSet = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
// //     safeSet('netRevenue',        fmt(vals.netTotal));
// //     safeSet('monthlyNetRevenue', fmt(vals.netMonth));
// //     safeSet('weeklyNetRevenue',  fmt(vals.netWeek));
// //     safeSet('nrGrossProfitDash', fmt(vals.grossProfitTotal));
// //     safeSet('nrCogsDash',        fmt(vals.cogsTotal));
// // }

// // // Recalculate when CoGS data changes (stock purchase added/deleted)
// // async function updateCogsInNetRevenue() {
// //     const activeSection = document.querySelector('.content-section.active')?.id;
// //     if (activeSection === 'net-revenue') {
// //         await computeAndRenderNetRevenue();
// //     }
// //     // Always push updated CoGS-based net revenue to the revenue stat cards
// //     await computeAndRenderNetRevenue();
// // }

// // function renderNetRevenueBreakdown(breakdown) {
// //     const tbody = document.getElementById('nrBreakdownBody');
// //     if (!tbody) return;

// //     if (!breakdown.length) {
// //         tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#888">No sales data with CoGS available yet</td></tr>';
// //         return;
// //     }

// //     tbody.innerHTML = breakdown.slice(0, 50).map(b => {
// //         // Markup % = Profit / CoGS × 100

// //         const markup = b.cogs > 0 ? (b.profit / b.cogs * 100) : (b.revenue > 0 ? 100 : 0);
// //         return `<tr>
// //             <td><strong>${b.name}</strong></td>
// //             <td>${b.qty}</td>
// //             <td>${fmt(b.revenue)}</td>
// //             <td>${fmt(b.cogs)}</td>
// //             <td class="${b.profit >= 0 ? 'nr-positive' : 'nr-negative'}">${fmt(b.profit)}</td>
// //             <td class="${markup >= 0 ? 'nr-positive' : 'nr-negative'}">${markup.toFixed(1)}%</td>
// //         </tr>`;
// //     }).join('');
// // }

// // // ═══════════════════════════════════════════════════════════════
// // //  SIDEBAR MENU ITEMS  (injected into existing sidebar)
// // // ═══════════════════════════════════════════════════════════════

// // function injectSidebarItems() {
// //     const sidebar = document.querySelector('.sidebar-menu');
// //     if (!sidebar || document.querySelector('[data-section="stock-purchases"]')) return;

// //     // Stock Purchases item — insert after inventory
// //     const inventoryItem = sidebar.querySelector('[data-section="inventory"]');
// //     const spItem = document.createElement('li');
// //     spItem.dataset.section = 'stock-purchases';
// //     spItem.innerHTML = `<span>Stock Purchases</span>`;
// //     spItem.addEventListener('click', () => switchSection('stock-purchases'));
// //     if (inventoryItem) inventoryItem.after(spItem);
// //     else sidebar.appendChild(spItem);

// //     // Net Revenue item — insert after revenue
// //     const revenueItem = sidebar.querySelector('[data-section="revenue"]');
// //     const nrItem = document.createElement('li');
// //     nrItem.dataset.section = 'net-revenue';
// //     nrItem.innerHTML = `<span>Net Revenue</span>`;
// //     nrItem.addEventListener('click', () => switchSection('net-revenue'));
// //     if (revenueItem) revenueItem.after(nrItem);
// //     else sidebar.appendChild(nrItem);
// // }

// // // ═══════════════════════════════════════════════════════════════
// // //  DOM SECTIONS  (injected into #main-content or body)
// // // ═══════════════════════════════════════════════════════════════

// // function injectSections() {
// //     // Find the container that holds all other .content-section elements.
// //     // Try common selectors used by typical admin dashboards.
// //     const container = (
// //         document.querySelector('.main-content')   ||
// //         document.querySelector('#main-content')   ||
// //         document.querySelector('.content')        ||
// //         document.querySelector('#content')        ||
// //         document.querySelector('.content-wrapper')||
// //         // Last resort: the parent of an existing content-section
// //         document.querySelector('.content-section')?.parentElement ||
// //         document.body
// //     );

// //     if (!document.getElementById('stock-purchases')) {
// //         container.insertAdjacentHTML('beforeend', stockPurchasesSectionHTML());
// //     }
// //     if (!document.getElementById('net-revenue')) {
// //         container.insertAdjacentHTML('beforeend', netRevenueSectionHTML());
// //     }
// //     if (!document.getElementById('addStockPurchaseModal')) {
// //         // Modals always go on body so they overlay everything correctly
// //         document.body.insertAdjacentHTML('beforeend', addStockPurchaseModalHTML());
// //     }
// // }

// // // ═══════════════════════════════════════════════════════════════
// // //  HTML TEMPLATES
// // // ═══════════════════════════════════════════════════════════════

// // function stockPurchasesSectionHTML() {
// //     return `
// // <section id="stock-purchases" class="content-section sp-section">
// //   <div class="sp-header">
// //     <div>
// //       <h2 class="sp-title">📦 Stock Purchases</h2>
// //       <p class="sp-subtitle">Track CoGS — every unit bought, its cost, and supplier</p>
// //     </div>
// //     <div class="sp-header-actions">
// //       <button class="sp-btn sp-btn-primary" onclick="showAddStockPurchaseModal()">+ New Purchase</button>
// //       <button class="sp-btn sp-btn-secondary" onclick="exportStockPurchasesCSV()">⬇ Export CSV</button>
// //     </div>
// //   </div>

// //   <!-- Stats -->
// //   <div class="sp-stats-grid">
// //     <div class="sp-stat-card sp-stat-blue">
// //       <div class="sp-stat-label">Total Spend</div>
// //       <div class="sp-stat-value" id="spTotalCost">KSH 0.00</div>
// //       <div class="sp-stat-sub" id="spTotalItems">0 entries</div>
// //     </div>
// //     <div class="sp-stat-card sp-stat-orange">
// //       <div class="sp-stat-label">Today's Spend</div>
// //       <div class="sp-stat-value" id="spTodayCost">KSH 0.00</div>
// //     </div>
// //     <div class="sp-stat-card sp-stat-purple">
// //       <div class="sp-stat-label">This Week</div>
// //       <div class="sp-stat-value" id="spWeekCost">KSH 0.00</div>
// //     </div>
// //     <div class="sp-stat-card sp-stat-green">
// //       <div class="sp-stat-label">This Month</div>
// //       <div class="sp-stat-value" id="spMonthCost">KSH 0.00</div>
// //     </div>
// //     <div class="sp-stat-card sp-stat-gray">
// //       <div class="sp-stat-label">Total Units Bought</div>
// //       <div class="sp-stat-value" id="spTotalQty">0 units</div>
// //     </div>
// //   </div>

// //   <!-- Search -->
// //   <div class="sp-search-bar">
// //     <input type="text" class="sp-search-input" placeholder="Search by product, supplier or category…"
// //            oninput="searchStockPurchases(this.value)" />
// //   </div>

// //   <!-- Table -->
// //   <div class="sp-table-wrapper">
// //     <div id="stockPurchasesLoading" style="display:none;text-align:center;padding:20px;color:#888">Loading…</div>
// //     <table class="sp-table">
// //       <thead>
// //         <tr>
// //           <th>Product</th><th>Supplier</th><th>Qty</th>
// //           <th>Unit Cost</th><th>Total Cost</th><th>Payment</th>
// //           <th>Status</th><th>Date</th><th></th>
// //         </tr>
// //       </thead>
// //       <tbody id="stockPurchasesTableBody">
// //         <tr><td colspan="9" class="sp-empty">Loading stock purchases…</td></tr>
// //       </tbody>
// //     </table>
// //   </div>

// //   <!-- Pagination -->
// //   <div class="sp-pagination">
// //     <button id="prevSpBtn" class="sp-btn sp-btn-secondary" onclick="prevStockPurchasesPage()">← Prev</button>
// //     <span id="spPageInfo" class="sp-page-info">Page 1</span>
// //     <button id="nextSpBtn" class="sp-btn sp-btn-secondary" onclick="nextStockPurchasesPage()">Next →</button>
// //   </div>
// // </section>`;
// // }

// // function netRevenueSectionHTML() {
// //     return `
// // <section id="net-revenue" class="content-section sp-section">
// //   <div class="sp-header">
// //     <div>
// //       <h2 class="sp-title">📊 Net Revenue</h2>
// //       <p class="sp-subtitle">Net Revenue = (Sell Price − CoGS) × Qty − Expenses</p>
// //     </div>
// //     <div class="sp-header-actions" style="align-items:center;flex-wrap:wrap;gap:10px">
// //       <div class="nr-month-picker">
// //         <label class="nr-month-label" for="nrMonthSelect">📅 View Month</label>
// //         <select id="nrMonthSelect" class="sp-input nr-month-select" onchange="onNrMonthChange(this.value)">
// //           <option value="all">All Time</option>
// //         </select>
// //       </div>
// //       <button class="sp-btn sp-btn-primary" onclick="computeAndRenderNetRevenue(document.getElementById('nrMonthSelect').value)">↻ Refresh</button>
// //     </div>
// //   </div>

// //   <!-- Top KPI cards -->
// //   <div class="sp-stats-grid nr-grid">
// //     <div class="sp-stat-card sp-stat-blue">
// //       <div class="sp-stat-label">Gross Revenue</div>
// //       <div class="sp-stat-value" id="nrGrossRevenue">KSH 0.00</div>
// //       <div class="sp-stat-sub">Total sales</div>
// //     </div>
// //     <div class="sp-stat-card sp-stat-orange">
// //       <div class="sp-stat-label">Total CoGS</div>
// //       <div class="sp-stat-value" id="nrTotalCogs">KSH 0.00</div>
// //       <div class="sp-stat-sub">Cost of goods sold</div>
// //     </div>
// //     <div class="sp-stat-card sp-stat-purple">
// //       <div class="sp-stat-label">Gross Profit</div>
// //       <div class="sp-stat-value" id="nrGrossProfit">KSH 0.00</div>
// //       <div class="sp-stat-sub" id="nrGrossMargin">0.0% markup</div>
// //     </div>
// //     <div class="sp-stat-card sp-stat-red">
// //       <div class="sp-stat-label">Total Expenses</div>
// //       <div class="sp-stat-value" id="nrTotalExpenses">KSH 0.00</div>
// //       <div class="sp-stat-sub" id="nrExpensesLabel">All operating expenses</div>
// //     </div>
// //     <div class="sp-stat-card nr-net-card">
// //       <div class="sp-stat-label">NET REVENUE</div>
// //       <div class="sp-stat-value nr-big" id="nrNetRevenue">KSH 0.00</div>
// //       <div class="sp-stat-sub" id="nrNetMargin">0.0% net margin</div>
// //     </div>
// //   </div>

// //   <!-- Time-window gross profit cards — labels update with dropdown -->
// //   <div class="nr-time-grid">
// //     <div class="nr-time-card">
// //       <div class="nr-time-label" id="nrLabelToday">Today's Gross Profit</div>
// //       <div class="nr-time-value" id="nrNetToday">KSH 0.00</div>
// //       <div class="nr-time-sub" id="nrSubToday">Sales − CoGS today</div>
// //     </div>
// //     <div class="nr-time-card">
// //       <div class="nr-time-label" id="nrLabelWeek">This Week's Gross Profit</div>
// //       <div class="nr-time-value" id="nrNetWeek">KSH 0.00</div>
// //       <div class="nr-time-sub" id="nrSubWeek">Sales − CoGS this week</div>
// //     </div>
// //     <div class="nr-time-card">
// //       <div class="nr-time-label" id="nrLabelMonth">This Month's Gross Profit</div>
// //       <div class="nr-time-value" id="nrNetMonth">KSH 0.00</div>
// //       <div class="nr-time-sub" id="nrSubMonth">Sales − CoGS this month</div>
// //     </div>
// //   </div>

// //   <!-- Formula explainer -->
// //   <div class="nr-formula-box">
// //     <span class="nr-formula-label">Formula:</span>
// //     <code>Net Revenue = Σ [ (Sell Price − CoGS per unit) × Qty ] − Total Expenses</code>
   
// //   </div>

// //   <!-- Calculation audit trail — shows every number going into NET REVENUE -->
// //   <div id="nrAuditBox" class="nr-audit-box">
// //     <div class="nr-audit-title">📋 Net Revenue Calculation Audit</div>
// //     <div id="nrAuditContent" class="nr-audit-content">Click Refresh to load audit trail.</div>
// //   </div>

// //   <!-- Per-product breakdown -->
// //   <!--<div class="sp-table-wrapper" style="margin-top:24px">
// //     <h3 style="padding:16px 20px 0;font-size:15px;color:var(--sp-text)">Product Profitability Breakdown</h3>
// //     <table class="sp-table">
// //       <thead>
// //         <tr>
// //           <th>Product</th><th>Units Sold</th><th>Revenue</th>
// //           <th>CoGS</th><th>Gross Profit</th><th>Markup % <small style="font-weight:400;text-transform:none">(Profit÷CoGS)</small></th>
// //         </tr>
// //       </thead>
// //       <tbody id="nrBreakdownBody">
// //         <tr><td colspan="6" style="text-align:center;padding:20px;color:#888">Click Refresh to load data</td></tr>
// //       </tbody>
// //     </table>
// //   </div>-->
// // </section>`;
// // }

// // function addStockPurchaseModalHTML() {
// //     return `
// // <div id="addStockPurchaseModal" class="sp-modal-overlay" style="display:none">
// //   <div class="sp-modal">
// //     <div class="sp-modal-header">
// //       <h3>Record Stock Purchase</h3>
// //       <button class="sp-modal-close" onclick="closeAddStockPurchaseModal()">✕</button>
// //     </div>
// //     <form id="addStockPurchaseForm" autocomplete="off" onsubmit="saveStockPurchase(event); return false;">

// //       <div class="sp-form-row">
// //         <div class="sp-form-group">
// //           <label>Product *</label>
// //           <select id="spProductSelect" class="sp-input" required>
// //             <option value="">Loading products…</option>
// //           </select>
// //           <div id="spStockPreview" class="sp-stock-preview" style="display:none"></div>
// //         </div>
// //         <div class="sp-form-group">
// //           <label>Supplier Name</label>
// //           <input id="spSupplierName" class="sp-input" placeholder="e.g. Safaricom Distributor" />
// //         </div>
// //       </div>

// //       <div class="sp-form-row">
// //         <div class="sp-form-group">
// //           <label>Supplier Phone</label>
// //           <input id="spSupplierPhone" class="sp-input" placeholder="0700 000 000" />
// //         </div>
// //         <div class="sp-form-group">
// //           <label>Payment Method</label>
// //           <select id="spPaymentMethod" class="sp-input">
// //             <option>Cash</option><option>M-Pesa</option>
// //             <option>Bank Transfer</option><option>Card</option><option>Credit</option>
// //           </select>
// //         </div>
// //       </div>

// //       <div class="sp-form-row">
// //         <div class="sp-form-group">
// //           <label>Quantity (units) *</label>
// //           <input id="spQuantity" type="number" min="1" class="sp-input" required
// //                  oninput="recalcTotalCost(); const _o=document.getElementById('spProductSelect'); if(_o&&_o.selectedIndex>0) updateStockPreview(_o.options[_o.selectedIndex]);"
// //                  placeholder="e.g. 10" />
// //         </div>
// //         <div class="sp-form-group">
// //           <label>Unit Cost (KSH) *</label>
// //           <input id="spUnitCost" type="number" min="0" step="0.01" class="sp-input" required
// //                  oninput="recalcTotalCost()" placeholder="e.g. 4500.00" />
// //         </div>
// //       </div>

// //       <div class="sp-total-preview">
// //         Total Cost: <strong id="spTotalCostPreview">KSH 0.00</strong>
// //       </div>

// //       <div class="sp-form-row">
// //         <div class="sp-form-group">
// //           <label>Status</label>
// //           <select id="spStatus" class="sp-input">
// //             <option value="received">Received</option>
// //             <option value="pending">Pending Delivery</option>
// //             <option value="returned">Returned</option>
// //           </select>
// //         </div>
// //         <div class="sp-form-group">
// //           <label>Purchase Date</label>
// //           <input id="spPurchaseDate" type="datetime-local" class="sp-input" />
// //         </div>
// //       </div>

// //       <div class="sp-form-group">
// //         <label>Notes</label>
// //         <textarea id="spNotes" class="sp-input" rows="2" placeholder="Invoice number, reference, etc."></textarea>
// //       </div>

// //       <div class="sp-modal-footer">
// //         <button type="button" class="sp-btn sp-btn-secondary" onclick="closeAddStockPurchaseModal()">Cancel</button>
// //         <button type="button" class="sp-btn sp-btn-primary" onclick="saveStockPurchase(event)">Save Purchase</button>
// //       </div>
// //     </form>
// //   </div>
// // </div>`;
// // }

// // function ensureStockPurchaseModal() {
// //     if (!document.getElementById('addStockPurchaseModal')) {
// //         document.body.insertAdjacentHTML('beforeend', addStockPurchaseModalHTML());
// //     }
// // }

// // // ═══════════════════════════════════════════════════════════════
// // //  STYLES
// // // ═══════════════════════════════════════════════════════════════

// // function injectStyles() {
// //     if (document.getElementById('sp-styles')) return;
// //     const style = document.createElement('style');
// //     style.id = 'sp-styles';
// //     style.textContent = `
// // /* ── Variables ────────────────────────── */
// // :root {
// //   --sp-bg:       #f4f6fb;
// //   --sp-surface:  #ffffff;
// //   --sp-border:   #e2e8f0;
// //   --sp-text:     #1e293b;
// //   --sp-muted:    #64748b;
// //   --sp-blue:     #3b82f6;
// //   --sp-green:    #10b981;
// //   --sp-orange:   #f59e0b;
// //   --sp-purple:   #8b5cf6;
// //   --sp-red:      #ef4444;
// //   --sp-gray:     #94a3b8;
// //   --sp-radius:   10px;
// //   --sp-shadow:   0 2px 12px rgba(0,0,0,.07);
// // }

// // /* ── Section shell ────────────────────── */
// // .sp-section {
// //   padding: 28px 32px;
// //   background: var(--sp-bg);
// //   box-sizing: border-box;
// //   overflow-y: auto;
// // }
// // .sp-header {
// //   display: flex;
// //   justify-content: space-between;
// //   align-items: flex-start;
// //   margin-bottom: 24px;
// //   flex-wrap: wrap;
// //   gap: 12px;
// // }
// // .sp-title  { font-size: 22px; font-weight: 700; color: var(--sp-text); margin: 0; }
// // .sp-subtitle { font-size: 13px; color: var(--sp-muted); margin: 4px 0 0; }
// // .sp-header-actions { display: flex; gap: 10px; }

// // /* ── Stat cards ───────────────────────── */
// // .sp-stats-grid {
// //   display: grid;
// //   grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
// //   gap: 16px;
// //   margin-bottom: 24px;
// // }
// // .nr-grid { grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); }
// // .sp-stat-card {
// //   background: var(--sp-surface);
// //   border-radius: var(--sp-radius);
// //   box-shadow: var(--sp-shadow);
// //   padding: 18px 20px;
// //   border-left: 4px solid transparent;
// //   transition: transform .15s;
// // }
// // .sp-stat-card:hover { transform: translateY(-2px); }
// // .sp-stat-blue   { border-left-color: var(--sp-blue); }
// // .sp-stat-orange { border-left-color: var(--sp-orange); }
// // .sp-stat-purple { border-left-color: var(--sp-purple); }
// // .sp-stat-green  { border-left-color: var(--sp-green); }
// // .sp-stat-gray   { border-left-color: var(--sp-gray); }
// // .sp-stat-red    { border-left-color: var(--sp-red); }
// // .nr-net-card    { border-left-color: var(--sp-green); background: #f0fdf4; }

// // .sp-stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: .8px; color: var(--sp-muted); }
// // .sp-stat-value { font-size: 20px; font-weight: 700; color: var(--sp-text); margin: 6px 0 4px; }
// // .sp-stat-sub   { font-size: 11px; color: var(--sp-muted); }
// // .nr-big        { font-size: 26px; color: var(--sp-green); }

// // /* ── Time-window row ──────────────────── */
// // .nr-time-grid {
// //   display: grid;
// //   grid-template-columns: repeat(3, 1fr);
// //   gap: 14px;
// //   margin-bottom: 20px;
// // }
// // .nr-time-card {
// //   background: var(--sp-surface);
// //   border-radius: var(--sp-radius);
// //   box-shadow: var(--sp-shadow);
// //   padding: 16px 20px;
// //   text-align: center;
// // }
// // .nr-time-label { font-size: 12px; color: var(--sp-muted); text-transform: uppercase; letter-spacing: .6px; }
// // .nr-time-value { font-size: 22px; font-weight: 700; margin-top: 8px; }

// // /* ── Formula box ──────────────────────── */
// // .nr-formula-box {
// //   background: #eff6ff;
// //   border: 1px solid #bfdbfe;
// //   border-radius: 8px;
// //   padding: 14px 18px;
// //   font-size: 13px;
// //   color: #1e40af;
// //   display: flex;
// //   flex-wrap: wrap;
// //   gap: 10px;
// //   align-items: center;
// //   margin-bottom: 8px;
// // }
// // .nr-formula-label { font-weight: 700; }
// // .nr-formula-note  { font-size: 11px; color: var(--sp-muted); flex-basis: 100%; }
// // .nr-formula-box code { background: #dbeafe; padding: 4px 8px; border-radius: 5px; font-size: 13px; }

// // /* ── Profit colours ───────────────────── */
// // .nr-positive { color: var(--sp-green); font-weight: 600; }
// // .nr-negative { color: var(--sp-red);   font-weight: 600; }

// // /* ── Search ───────────────────────────── */
// // .sp-search-bar { margin-bottom: 16px; }
// // .sp-search-input {
// //   width: 100%;
// //   max-width: 420px;
// //   padding: 10px 14px;
// //   border: 1px solid var(--sp-border);
// //   border-radius: 8px;
// //   font-size: 14px;
// //   outline: none;
// //   transition: border-color .2s;
// // }
// // .sp-search-input:focus { border-color: var(--sp-blue); }

// // /* ── Table ────────────────────────────── */
// // .sp-table-wrapper {
// //   background: var(--sp-surface);
// //   border-radius: var(--sp-radius);
// //   box-shadow: var(--sp-shadow);
// //   overflow: auto;
// //   margin-bottom: 16px;
// // }
// // .sp-table { width: 100%; border-collapse: collapse; font-size: 10px; }
// // .sp-table thead { background: #f8fafc; }
// // .sp-table th    { padding: 12px 16px; text-align: left; font-size: 12px;
// //                   font-weight: 600; color: var(--sp-muted); text-transform: uppercase;
// //                   letter-spacing: .5px; border-bottom: 1px solid var(--sp-border); }
// // .sp-table td    { padding: 13px 16px; border-bottom: 1px solid #f1f5f9; color: var(--sp-text); }
// // .sp-table tbody tr:hover { background: #f8fafc; }
// // .sp-table tbody tr:last-child td { border-bottom: none; }
// // .sp-empty       { text-align: center; padding: 40px !important; color: var(--sp-muted); }

// // /* ── Badge ────────────────────────────── */
// // .sp-badge { display: inline-block; padding: 3px 10px; border-radius: 20px;
// //             font-size: 11px; font-weight: 600; text-transform: capitalize; }
// // .sp-badge-success { background: #d1fae5; color: #065f46; }
// // .sp-badge-warn    { background: #fef3c7; color: #92400e; }

// // /* ── Buttons ──────────────────────────── */
// // .sp-btn {
// //   display: inline-flex; align-items: center; gap: 6px;
// //   padding: 9px 16px; border-radius: 7px; font-size: 13px;
// //   font-weight: 600; cursor: pointer; border: none; transition: all .15s;
// // }
// // .sp-btn-primary   { background: var(--sp-blue); color: #fff; }
// // .sp-btn-primary:hover   { background: #2563eb; }
// // .sp-btn-secondary { background: #f1f5f9; color: var(--sp-text); border: 1px solid var(--sp-border); }
// // .sp-btn-secondary:hover { background: #e2e8f0; }
// // .sp-btn-danger    { background: #fee2e2; color: var(--sp-red); }
// // .sp-btn-danger:hover    { background: #fecaca; }
// // .sp-btn-sm { padding: 5px 10px; font-size: 12px; }

// // /* ── Pagination ───────────────────────── */
// // .sp-pagination { display: flex; align-items: center; gap: 14px; justify-content: center; padding: 8px 0; }
// // .sp-page-info  { font-size: 13px; color: var(--sp-muted); }

// // /* ── Modal ────────────────────────────── */
// // .sp-modal-overlay {
// //   position: fixed; inset: 0; background: rgba(15,23,42,.5);
// //   display: flex; align-items: center; justify-content: center;
// //   z-index: 9999; backdrop-filter: blur(2px);
// // }
// // .sp-modal {
// //   background: var(--sp-surface);
// //   border-radius: 14px;
// //   padding: 32px;
// //   width: 100%;
// //   max-width: 680px;
// //   max-height: 90vh;
// //   overflow-y: auto;
// //   box-shadow: 0 20px 60px rgba(0,0,0,.18);
// // }
// // .sp-modal-header {
// //   display: flex; justify-content: space-between; align-items: center;
// //   margin-bottom: 24px;
// // }
// // .sp-modal-header h3 { margin: 0; font-size: 18px; color: var(--sp-text); }
// // .sp-modal-close {
// //   background: none; border: none; font-size: 18px;
// //   cursor: pointer; color: var(--sp-muted); line-height: 1;
// // }
// // .sp-modal-close:hover { color: var(--sp-red); }
// // .sp-form-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
// // .sp-form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
// // .sp-form-group label { font-size: 12px; font-weight: 600; color: var(--sp-muted);
// //                         text-transform: uppercase; letter-spacing: .5px; }
// // .sp-input {
// //   padding: 10px 12px; border: 1px solid var(--sp-border);
// //   border-radius: 7px; font-size: 14px; color: var(--sp-text);
// //   outline: none; transition: border-color .2s; width: 100%; box-sizing: border-box;
// // }
// // .sp-input:focus { border-color: var(--sp-blue); }
// // .sp-total-preview {
// //   background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;
// //   padding: 12px 16px; font-size: 14px; color: #1e40af; margin-bottom: 16px;
// // }
// // .sp-stock-preview {
// //   margin-top: 8px;
// //   padding: 8px 12px;
// //   background: #f8fafc;
// //   border: 1px solid #e2e8f0;
// //   border-radius: 6px;
// //   font-size: 13px;
// //   line-height: 1.6;
// // }
// // .sp-modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }

// // /* ── Month picker ─────────────────────────── */
// // .nr-month-picker {
// //   display: flex;
// //   align-items: center;
// //   gap: 8px;
// // }
// // .nr-month-label {
// //   font-size: 12px;
// //   font-weight: 600;
// //   color: var(--sp-muted);
// //   white-space: nowrap;
// // }
// // .nr-month-select {
// //   min-width: 180px;
// //   padding: 8px 12px;
// //   font-size: 13px;
// //   font-weight: 600;
// //   border: 1.5px solid var(--sp-blue);
// //   border-radius: 7px;
// //   color: var(--sp-text);
// //   background: #fff;
// //   cursor: pointer;
// // }
// // .nr-month-select:focus { outline: none; border-color: #2563eb; }

// // /* ── Time card subtitle ───────────────────── */
// // .nr-time-sub { font-size: 11px; color: var(--sp-muted); margin-top: 4px; }

// // /* ── Audit box ────────────────────────────── */
// // .nr-audit-box {
// //   background: var(--sp-surface);
// //   border: 1px solid var(--sp-border);
// //   border-radius: var(--sp-radius);
// //   box-shadow: var(--sp-shadow);
// //   margin-bottom: 20px;
// //   overflow: hidden;
// // }
// // .nr-audit-title {
// //   background: #f8fafc;
// //   padding: 12px 18px;
// //   font-size: 13px;
// //   font-weight: 700;
// //   color: var(--sp-text);
// //   border-bottom: 1px solid var(--sp-border);
// // }
// // .nr-audit-content { padding: 0; }
// // .nr-audit-table {
// //   width: 100%;
// //   border-collapse: collapse;
// //   font-size: 13px;
// // }
// // .nr-audit-table th {
// //   padding: 9px 14px;
// //   text-align: left;
// //   font-size: 11px;
// //   font-weight: 600;
// //   color: var(--sp-muted);
// //   text-transform: uppercase;
// //   letter-spacing: .5px;
// //   background: #f8fafc;
// //   border-bottom: 1px solid var(--sp-border);
// // }
// // .nr-audit-table td {
// //   padding: 8px 14px;
// //   border-bottom: 1px solid #f1f5f9;
// //   color: var(--sp-text);
// //   vertical-align: top;
// // }
// // .nr-audit-table td:nth-child(2) { font-family: monospace; font-size: 13px; white-space: nowrap; }
// // .nr-audit-table td:nth-child(3) { color: var(--sp-muted); font-size: 12px; }
// // .nr-audit-section td {
// //   background: #f1f5f9;
// //   font-size: 11px;
// //   font-weight: 700;
// //   text-transform: uppercase;
// //   letter-spacing: .8px;
// //   color: var(--sp-muted);
// //   padding: 6px 14px;
// // }
// // .nr-audit-pos td:nth-child(2) { color: var(--sp-green); }
// // .nr-audit-neg td:nth-child(2) { color: var(--sp-red); }

// // @media (max-width: 640px) {
// //   .sp-section  { padding: 16px; }
// //   .sp-form-row { grid-template-columns: 1fr; }
// //   .nr-time-grid { grid-template-columns: 1fr; }
// //   .nr-audit-table td:nth-child(3) { display: none; }
// // }

// // .main-content #stock-purchases,
// // .main-content #net-revenue,
// // .content-wrapper #stock-purchases,
// // .content-wrapper #net-revenue,
// // #main-content #stock-purchases,
// // #main-content #net-revenue {
// //   position: relative;
// //   width: 100%;
// // }

// // /* Spinner for loading state */
// // @keyframes spin {
// //   to { transform: rotate(360deg); }
// // }`;
// //     document.head.appendChild(style);
// // }


// // // ═══════════════════════════════════════════════════════════════
// // //  HELPERS
// // // ═══════════════════════════════════════════════════════════════

// // function fmt(val) {
// //     return `KSH ${Number(val || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// // }
// // function set(id, text, color) {
// //     const el = document.getElementById(id);
// //     if (!el) return;
// //     el.textContent = text;
// //     if (color) el.style.color = color;
// // }
// // function downloadCSV(rows, filename) {
// //     const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
// //     const a = document.createElement('a');
// //     a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
// //     a.download = `${filename}-${new Date().toISOString().slice(0,10)}.csv`;
// //     a.click();
// // }

// // // ── Optional: thin product-cache so loadProductsForSale & stock modal share data ──
// // let _productCache = null;
// // function getCachedProducts()  { return _productCache; }
// // function setCachedProducts(p) { _productCache = p; }

// // // ═══════════════════════════════════════════════════════════════
// // //  INIT
// // // ═══════════════════════════════════════════════════════════════

// // document.addEventListener('DOMContentLoaded', () => {
// //     injectStyles();
// //     injectSections();
// //     injectSidebarItems();

// //     // If net-revenue cards exist on the dashboard, populate them on load
// //     updateCogsInNetRevenue();
// // });

// // ─── State ───────────────────────────────────────────────────
// let stockPurchasesData   = [];
// let filteredPurchases    = [];
// let stockPurchasesPage   = 1;
// const stockPurchasesLimit = 10;

// (function patchSwitchSection() {
//     const tryPatch = () => {
//         if (typeof window.switchSection === 'function') {
//             const _orig = window.switchSection;
//             window.switchSection = function (sectionName) {
//                 if (sectionName === 'stock-purchases' || sectionName === 'net-revenue') {
                   
//                     document.querySelectorAll('.sidebar-menu li').forEach(i => i.classList.remove('active'));
//                     document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

//                     const li = document.querySelector(`[data-section="${sectionName}"]`);
//                     if (li) li.classList.add('active');

//                     const sec = document.getElementById(sectionName);
//                     if (sec) sec.classList.add('active');

//                     if (sectionName === 'stock-purchases') loadStockPurchases();
//                     if (sectionName === 'net-revenue')      initNetRevenue();
//                 } else {
//                     _orig(sectionName);
//                 }
//             };
//         } else {
//             setTimeout(tryPatch, 50);
//         }
//     };
//     tryPatch();
// })();

// // ═══════════════════════════════════════════════════════════════
// //  TIMEZONE HELPER
// //  All date comparisons use UTC to avoid live-server vs local-
// //  server discrepancies (e.g. Nairobi UTC+3 vs a UTC host).
// // ═══════════════════════════════════════════════════════════════

// /**
//  * Parse any date string to a Date, forcing date-only strings
//  * ("YYYY-MM-DD") to UTC midnight so they are never shifted by
//  * the host's local timezone offset.
//  */
// function parseDate(raw) {
//     if (!raw) return new Date(NaN);
//     const s = String(raw).trim();
//     // Date-only: "2025-04-01"  → treat as UTC midnight
//     if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + 'T00:00:00Z');
//     return new Date(s);
// }

// /**
//  * Return a Date at UTC midnight for the given Date object's UTC date.
//  * Use this instead of new Date(y, m, d) to avoid local-offset shifts.
//  */
// function utcMidnight(date) {
//     return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
// }

// // ═══════════════════════════════════════════════════════════════
// //  STOCK PURCHASES
// // ═══════════════════════════════════════════════════════════════

// async function loadStockPurchases() {
//     try {
//         showStockPurchasesLoading(true);

//         let data = [];
//         try {
//             const res = await apiCall('/api/stock-purchases');
//             data = Array.isArray(res) ? res : (res.data || []);
//         } catch (e) {
//             data = stockPurchasesData.length ? stockPurchasesData : [];
//         }

//         stockPurchasesData = data;
//         filteredPurchases  = [...data];
//         stockPurchasesPage = 1;

//         renderStockPurchasesStats(data);
//         applyStockPurchasesPagination();
//         await updateCogsInNetRevenue();

//     } catch (err) {
//         console.error('loadStockPurchases error:', err);
//         showNotification('Error loading stock purchases', 'error');
//     } finally {
//         showStockPurchasesLoading(false);
//     }
// }

// function showStockPurchasesLoading(on) {
//     const el = document.getElementById('stockPurchasesLoading');
//     if (el) el.style.display = on ? 'block' : 'none';
// }

// // ── Stats bar ────────────────────────────────────────────────
// function renderStockPurchasesStats(purchases) {
//     const now      = new Date();
//     // Use UTC-based boundaries so live server (UTC) and local (UTC+3) agree
//     const todayUTC = utcMidnight(now);
//     const weekAgo  = new Date(todayUTC.getTime() - 7  * 86400000);
//     const monthAgo = new Date(todayUTC.getTime() - 30 * 86400000);

//     let totalCost = 0, todayCost = 0, weekCost = 0, monthCost = 0;
//     let totalQty  = 0;

//     purchases.forEach(p => {
//         const cost = parseFloat(p.total_cost || p.unit_cost * p.quantity || 0);
//         const qty  = parseInt(p.quantity || 0);
//         const d    = parseDate(p.purchase_date || p.created_at);
//         const dUTC = utcMidnight(d);

//         totalCost += cost;
//         totalQty  += qty;
//         if (dUTC.getTime() === todayUTC.getTime()) todayCost += cost;
//         if (dUTC >= weekAgo)  weekCost  += cost;
//         if (dUTC >= monthAgo) monthCost += cost;
//     });

//     set('spTotalCost',   fmt(totalCost));
//     set('spTodayCost',   fmt(todayCost));
//     set('spWeekCost',    fmt(weekCost));
//     set('spMonthCost',   fmt(monthCost));
//     set('spTotalItems',  purchases.length + ' entries');
//     set('spTotalQty',    totalQty + ' units');
// }

// // ── Table ────────────────────────────────────────────────────
// function applyStockPurchasesPagination() {
//     const start    = (stockPurchasesPage - 1) * stockPurchasesLimit;
//     const pageData = filteredPurchases.slice(start, start + stockPurchasesLimit);
//     renderStockPurchasesTable(pageData);
//     updateStockPurchasesPaginationUI();
// }

// function renderStockPurchasesTable(purchases) {
//     const tbody = document.getElementById('stockPurchasesTableBody');
//     if (!tbody) return;

//     if (!purchases.length) {
//         tbody.innerHTML = `<tr><td colspan="9" class="sp-empty">
//             No stock purchases recorded yet.<br>
//             <button class="sp-btn sp-btn-primary" onclick="showAddStockPurchaseModal()" style="margin-top:12px">
//                 + Record First Purchase
//             </button></td></tr>`;
//         return;
//     }

//     tbody.innerHTML = purchases.map(p => {
//         const unitCost  = parseFloat(p.unit_cost  || 0);
//         const qty       = parseInt(p.quantity      || 0);
//         const totalCost = parseFloat(p.total_cost  || unitCost * qty);
//         const date      = parseDate(p.purchase_date || p.created_at);

//         return `<tr>
//             <td><strong>${p.product_name || '—'}</strong><br>
//                 <small style="color:#888">${p.category || ''}</small></td>
//             <td>${p.supplier_name || '—'}</td>
//             <td><strong>${qty}</strong> units</td>
//             <td>KSH ${unitCost.toFixed(2)}</td>
//             <td><strong>KSH ${totalCost.toFixed(2)}</strong></td>
//             <td>${p.payment_method || 'Cash'}</td>
//             <td><span class="sp-badge sp-badge-${p.status === 'received' ? 'success' : 'warn'}">${p.status || 'received'}</span></td>
//             <td>${date.toLocaleDateString()}</td>
//             <td>
//                 <button class="sp-btn sp-btn-sm sp-btn-danger" onclick="deleteStockPurchase('${p.id}')">✕</button>
//             </td>
//         </tr>`;
//     }).join('');
// }

// function updateStockPurchasesPaginationUI() {
//     const totalPages = Math.max(1, Math.ceil(filteredPurchases.length / stockPurchasesLimit));
//     set('spPageInfo', `Page ${stockPurchasesPage} of ${totalPages} (${filteredPurchases.length} records)`);

//     const prev = document.getElementById('prevSpBtn');
//     const next = document.getElementById('nextSpBtn');
//     if (prev) { prev.disabled = stockPurchasesPage <= 1; prev.style.opacity = prev.disabled ? '.5' : '1'; }
//     if (next) { next.disabled = stockPurchasesPage >= totalPages; next.style.opacity = next.disabled ? '.5' : '1'; }
// }

// function prevStockPurchasesPage() {
//     if (stockPurchasesPage > 1) { stockPurchasesPage--; applyStockPurchasesPagination(); }
// }
// function nextStockPurchasesPage() {
//     if (stockPurchasesPage < Math.ceil(filteredPurchases.length / stockPurchasesLimit)) {
//         stockPurchasesPage++; applyStockPurchasesPagination();
//     }
// }

// function searchStockPurchases(q) {
//     q = q.toLowerCase().trim();
//     filteredPurchases = q
//         ? stockPurchasesData.filter(p =>
//             (p.product_name  || '').toLowerCase().includes(q) ||
//             (p.supplier_name || '').toLowerCase().includes(q) ||
//             (p.category      || '').toLowerCase().includes(q))
//         : [...stockPurchasesData];
//     stockPurchasesPage = 1;
//     applyStockPurchasesPagination();
// }

// // ── Add Purchase Modal ───────────────────────────────────────
// function showAddStockPurchaseModal() {
//     ensureStockPurchaseModal();
//     const modal = document.getElementById('addStockPurchaseModal');

//     const now = new Date();
//     now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
//     const dateEl = document.getElementById('spPurchaseDate');
//     if (dateEl) dateEl.value = now.toISOString().slice(0, 16);

//     populateSpProductDropdown();

//     modal.style.display = 'flex';
// }

// async function populateSpProductDropdown() {
//     const sel = document.getElementById('spProductSelect');
//     if (!sel) return;
//     try {
//         const products = await apiCall('/api/products');
//         const list = Array.isArray(products) ? products : [];

//         sel.innerHTML = '<option value="">— Select product —</option>' +
//             list.map(p => {
//                 const stock = parseInt(p.stock || 0);
//                 const cost  = parseFloat(p.cost || 0);
//                 return `<option value="${p.id}"
//                     data-name="${(p.name||'').replace(/"/g,'&quot;')}"
//                     data-cost="${cost}"
//                     data-stock="${stock}"
//                     data-cat="${p.category || ''}"
//                     data-restock="${p.restockLevel || 5}"
//                     data-price="${p.price || 0}">
//                     ${p.name} — Stock: ${stock} units
//                 </option>`;
//             }).join('');

//         sel.onchange = () => {
//             const opt = sel.options[sel.selectedIndex];
//             if (!opt.value) { clearStockPreview(); return; }

//             const costEl = document.getElementById('spUnitCost');
//             if (costEl) costEl.value = opt.dataset.cost || '';

//             recalcTotalCost();
//             updateStockPreview(opt);
//         };
//     } catch (e) { console.warn('populateSpProductDropdown:', e); }
// }

// function updateStockPreview(opt) {
//     const preview = document.getElementById('spStockPreview');
//     if (!preview) return;
//     const currentStock = parseInt(opt.dataset.stock || 0);
//     const qty          = parseInt(document.getElementById('spQuantity')?.value || 0);
//     const newStock     = currentStock + qty;
//     const restock      = parseInt(opt.dataset.restock || 5);
//     const statusColor  = newStock === 0 ? '#ef4444' : newStock < restock ? '#f59e0b' : '#10b981';
//     preview.innerHTML  = `
//         <span style="color:#64748b">Current stock:</span>
//         <strong>${currentStock} units</strong>
//         &nbsp;→&nbsp;
//         <span style="color:#3b82f6">After purchase:</span>
//         <strong style="color:${statusColor}">${newStock} units</strong>`;
//     preview.style.display = 'block';
// }

// function clearStockPreview() {
//     const preview = document.getElementById('spStockPreview');
//     if (preview) { preview.innerHTML = ''; preview.style.display = 'none'; }
// }

// function recalcTotalCost() {
//     const qty  = parseFloat(document.getElementById('spQuantity')?.value  || 0);
//     const cost = parseFloat(document.getElementById('spUnitCost')?.value   || 0);
//     const el   = document.getElementById('spTotalCostPreview');
//     if (el) el.textContent = `KSH ${(qty * cost).toFixed(2)}`;
// }

// function closeAddStockPurchaseModal() {
//     const modal = document.getElementById('addStockPurchaseModal');
//     if (modal) modal.style.display = 'none';
//     document.getElementById('addStockPurchaseForm')?.reset();
// }

// async function saveStockPurchase(e) {
//     if (e && typeof e.preventDefault === 'function') e.preventDefault();
//     if (e && typeof e.stopPropagation === 'function') e.stopPropagation();

//     if (saveStockPurchase._inFlight) {
//         console.warn('[saveStockPurchase] Already saving — duplicate event ignored');
//         return;
//     }
//     saveStockPurchase._inFlight = true;

//     const sel         = document.getElementById('spProductSelect');
//     const productId   = sel?.value || null;
//     const productName = sel?.options[sel.selectedIndex]?.dataset.name || '';
//     const category    = sel?.options[sel.selectedIndex]?.dataset.cat  || '';
//     const qty         = parseInt(document.getElementById('spQuantity')?.value  || 0);
//     const unitCost    = parseFloat(document.getElementById('spUnitCost')?.value || 0);
//     const status      = document.getElementById('spStatus')?.value || 'received';

//     const releaseGuard = () => { saveStockPurchase._inFlight = false; };

//     if (!productId) {
//         releaseGuard();
//         showNotification('Please select a product', 'warning'); return;
//     }
//     if (qty <= 0) {
//         releaseGuard();
//         showNotification('Quantity must be greater than 0', 'warning'); return;
//     }
//     if (unitCost <= 0) {
//         releaseGuard();
//         showNotification('Unit cost must be greater than 0', 'warning'); return;
//     }

//     const submitBtn = document.querySelector('#addStockPurchaseForm button[type="submit"]');
//     if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving…'; }

//     const payload = {
//         product_id:     parseInt(productId, 10),
//         product_name:   productName,
//         category:       category,
//         supplier_name:  document.getElementById('spSupplierName')?.value  || '',
//         supplier_phone: document.getElementById('spSupplierPhone')?.value || '',
//         quantity:       qty,
//         unit_cost:      unitCost,
//         total_cost:     qty * unitCost,
//         payment_method: document.getElementById('spPaymentMethod')?.value || 'Cash',
//         status:         status,
//         notes:          document.getElementById('spNotes')?.value         || '',
//         purchase_date:  document.getElementById('spPurchaseDate')?.value  || new Date().toISOString(),
//     };

//     try {
//         const res = await apiCall('/api/stock-purchases', {
//             method: 'POST',
//             body: JSON.stringify(payload)
//         });

//         if (!res || res.success === false) {
//             throw new Error(res?.error || 'Server did not confirm the purchase was saved');
//         }

//         const stockNote = status === 'received'
//             ? `+${qty} units added to inventory`
//             : `inventory unchanged (status: ${status})`;

//         await refreshInventoryUI();
//         await loadStockPurchases();
//         closeAddStockPurchaseModal();
//         showNotification(`✓ Purchase saved — ${stockNote}`, 'success');

//     } catch (err) {
//         console.error('saveStockPurchase error:', err);
//         showNotification('Error saving purchase: ' + err.message, 'error');
//     } finally {
//         saveStockPurchase._inFlight = false;
//         if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Purchase'; }
//     }
// }

// async function refreshInventoryUI() {
//     try {
//         if (typeof loadInventoryDashboard === 'function') {
//             await loadInventoryDashboard();
//         }
//         if (typeof loadFullInventory === 'function' &&
//             document.getElementById('inventory')?.classList.contains('active')) {
//             await loadFullInventory();
//         }
//         if (typeof loadProducts === 'function' &&
//             document.getElementById('products')?.classList.contains('active')) {
//             await loadProducts();
//         }
//     } catch (_) { /* non-critical */ }
// }

// async function deleteStockPurchase(id) {
//     const purchase = stockPurchasesData.find(p => String(p.id) === String(id));
//     if (!purchase) { showNotification('Purchase record not found', 'error'); return; }

//     const confirmMsg = `Delete purchase of ${purchase.quantity} × ${purchase.product_name}?\n\n` +
//         `This will also deduct ${purchase.quantity} unit(s) from inventory ` +
//         `(only if status was "received").`;
//     if (!confirm(confirmMsg)) return;

//     const delBtn = document.querySelector(`button[onclick="deleteStockPurchase('${id}')"]`);
//     if (delBtn) { delBtn.disabled = true; delBtn.textContent = '…'; }

//     try {
//         await apiCall(`/api/stock-purchases/${id}`, { method: 'DELETE' });

//         const stockNote = purchase.status === 'received'
//             ? `${purchase.quantity} units removed from inventory`
//             : 'inventory unchanged (was not received)';

//         await refreshInventoryUI();
//         await loadStockPurchases();
//         showNotification(`✓ Purchase deleted — ${stockNote}`, 'success');

//     } catch (err) {
//         console.error('deleteStockPurchase error:', err);
//         showNotification('Error deleting purchase: ' + err.message, 'error');
//         if (delBtn) { delBtn.disabled = false; delBtn.textContent = '✕'; }
//     }
// }

// // ─── Export stock purchases to CSV ──────────────────────────
// function exportStockPurchasesCSV() {
//     if (!stockPurchasesData.length) { showNotification('No data to export', 'warning'); return; }
//     const rows = [['Product', 'Category', 'Supplier', 'Qty', 'Unit Cost (KSH)', 'Total Cost (KSH)', 'Payment', 'Status', 'Date']];
//     stockPurchasesData.forEach(p => {
//         rows.push([
//             p.product_name, p.category, p.supplier_name,
//             p.quantity, p.unit_cost, p.total_cost || (p.unit_cost * p.quantity),
//             p.payment_method, p.status,
//             parseDate(p.purchase_date || p.created_at).toLocaleDateString()
//         ]);
//     });
//     downloadCSV(rows, 'stock-purchases');
// }

// // ═══════════════════════════════════════════════════════════════
// //  NET REVENUE  =  Σ (sale_price - cogs_per_unit) × qty  −  expenses
// // ═══════════════════════════════════════════════════════════════

// async function initNetRevenue() {
//     await populateNrMonthDropdown();
//     await computeAndRenderNetRevenue();
// }

// // Populate the month dropdown from actual sale dates
// async function populateNrMonthDropdown() {
//     const sel = document.getElementById('nrMonthSelect');
//     if (!sel) return;

//     try {
//         const res  = await apiCall('/api/sales');
//         const data = res.success ? (res.data || []) : (Array.isArray(res) ? res : []);

//         // Collect unique YYYY-MM strings — use UTC month to match server
//         const monthsSet = new Set();
//         data.forEach(sale => {
//             const d = parseDate(sale.sales_date || sale.date || sale.created_at);
//             if (!isNaN(d)) {
//                 const yr = d.getUTCFullYear();
//                 const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
//                 monthsSet.add(`${yr}-${mo}`);
//             }
//         });

//         const months = Array.from(monthsSet).sort().reverse();

//         const current = sel.value;
//         sel.innerHTML = '<option value="all">📊 All Time</option>';
//         months.forEach(m => {
//             const [yr, mo] = m.split('-').map(Number);
//             // Use UTC date so label doesn't shift timezone
//             const label = new Date(Date.UTC(yr, mo - 1, 1))
//                 .toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });
//             const opt = document.createElement('option');
//             opt.value = m;
//             opt.textContent = label;
//             if (m === current) opt.selected = true;
//             sel.appendChild(opt);
//         });

//         // Default to current UTC calendar month if available
//         if (current === 'all' || !current) {
//             const now = new Date();
//             const thisMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
//             if (monthsSet.has(thisMonth)) sel.value = thisMonth;
//         }

//     } catch (_) { /* silent — dropdown stays with just "All Time" */ }
// }

// function onNrMonthChange(value) {
//     computeAndRenderNetRevenue(value);
// }

// // selectedMonth: 'all' | 'YYYY-MM'
// async function computeAndRenderNetRevenue(selectedMonth) {
//     selectedMonth = selectedMonth || document.getElementById('nrMonthSelect')?.value || 'all';
//     try {
//         set('nrBreakdownBody', '');
//         const loadingRow = `<tr><td colspan="6" style="text-align:center;padding:24px;color:#888">
//             <span style="display:inline-block;animation:spin 1s linear infinite;margin-right:8px">⟳</span>
//             Calculating…</td></tr>`;
//         const tbody = document.getElementById('nrBreakdownBody');
//         if (tbody) tbody.innerHTML = loadingRow;

//         // ── 1. Fetch products — CoGS lives in product.cost ──────────────────
//         const cogsById   = {};
//         const cogsByName = {};
//         const priceById  = {};

//         try {
//             const products = await apiCall('/api/products');
//             const list = Array.isArray(products) ? products : (products.data || []);
//             list.forEach(p => {
//                 const costVal  = parseFloat(p.cost  || p.productCost || p.unit_cost || 0);
//                 const priceVal = parseFloat(p.price || 0);
//                 const idKey    = String(p.id);
//                 const nameKey  = (p.name || '').toLowerCase().trim();

//                 cogsById[idKey]     = costVal;
//                 priceById[idKey]    = priceVal;
//                 if (nameKey) cogsByName[nameKey] = costVal;
//             });
//         } catch (_) { console.warn('Could not fetch products for CoGS lookup'); }

//         // Stock-purchase records override the product catalogue cost (most-recent wins)
//         const sortedPurchases = [...stockPurchasesData].sort((a, b) =>
//             parseDate(a.purchase_date || a.created_at || 0) -
//             parseDate(b.purchase_date || b.created_at || 0)
//         );
//         sortedPurchases.forEach(p => {
//             const cost    = parseFloat(p.unit_cost || 0);
//             const idKey   = String(p.product_id   || '');
//             const nameKey = (p.product_name || '').toLowerCase().trim();
//             if (idKey   && cost > 0) cogsById[idKey]     = cost;
//             if (nameKey && cost > 0) cogsByName[nameKey] = cost;
//         });

//         const resolveCogsUnit = (item) => {
//             const idKey   = String(item.product_id || item.id || '');
//             const nameKey = (item.product_name || item.name || '').toLowerCase().trim();
//             if (idKey   && cogsById[idKey]     !== undefined && cogsById[idKey]   > 0) return cogsById[idKey];
//             if (nameKey && cogsByName[nameKey] !== undefined && cogsByName[nameKey] > 0) return cogsByName[nameKey];
//             return parseFloat(item.cost || item.unit_cost || item.productCost || 0);
//         };

//         // ── 2. Fetch sales ───────────────────────────────────────────────────
//         let sales = [];
//         try {
//             const res = await apiCall('/api/sales');
//             sales = res.success ? (res.data || []) : (Array.isArray(res) ? res : []);
//         } catch (_) {}

//         // ── 3. Populate sale items ───────────────────────────────────────────
//         const salesWithItems = await Promise.all(sales.map(async (sale) => {
//             if (Array.isArray(sale.items) && sale.items.length > 0) return sale;
//             try {
//                 const r = await apiCall(`/api/sales/${sale.id}/items`);
//                 return { ...sale, items: r.success ? (r.data || []) : [] };
//             } catch (_) {
//                 return { ...sale, items: [] };
//             }
//         }));

//         // ── 4. Determine UTC-based filter boundaries ─────────────────────────
//         const now = new Date();

//         // UTC today midnight
//         const todayStart = utcMidnight(now);

//         // UTC week start (Sunday) — clamp to UTC month start if it crossed over
//         const utcMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
//         const weekStart = new Date(todayStart);
//         weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay()); // back to Sunday
//         if (weekStart < utcMonthStart) weekStart.setTime(utcMonthStart.getTime());

//         const monthStart = utcMonthStart;

//         let filterStart = null;
//         let filterEnd   = null;
//         let isMonthView = false;
//         let monthLabel  = '';

//         if (selectedMonth && selectedMonth !== 'all') {
//             const [yr, mo] = selectedMonth.split('-').map(Number);
//             filterStart = new Date(Date.UTC(yr, mo - 1, 1));
//             filterEnd   = new Date(Date.UTC(yr, mo, 1) - 1); // last ms of month in UTC
//             isMonthView = true;
//             monthLabel  = filterStart.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });
//         }

//         // Update card labels
//         if (isMonthView) {
//             set('nrLabelToday', 'First Week of ' + monthLabel);
//             set('nrSubToday',   'Week 1 gross profit');
//             set('nrLabelWeek',  'Mid-Month ' + monthLabel);
//             set('nrSubWeek',    'Weeks 2–3 gross profit');
//             set('nrLabelMonth', monthLabel + ' Total');
//             set('nrSubMonth',   'Full month gross profit');
//         } else {
//             set('nrLabelToday', "Today's Gross Profit");
//             set('nrSubToday',   'Sales − CoGS today');
//             set('nrLabelWeek',  "This Week's Gross Profit");
//             set('nrSubWeek',    'Sales − CoGS this week');
//             set('nrLabelMonth', "This Month's Gross Profit");
//             set('nrSubMonth',   'Sales − CoGS this month');
//         }

//         // ── 5. Fetch and filter expenses ─────────────────────────────────────
//         const PURCHASE_KEYWORDS = [
//             'stock', 'purchase', 'inventory', 'restock', 'procurement',
//             'goods', 'merchandise', 'product cost', 'buying', 'supplier',
//             'wholesale', 'cogs', 'cost of goods'
//         ];
//         const isPurchaseEntry = (exp) => {
//             const cat  = (exp.category    || '').toLowerCase();
//             const desc = (exp.description || exp.name || exp.title || '').toLowerCase();
//             return PURCHASE_KEYWORDS.some(k => cat.includes(k) || desc.includes(k));
//         };

//         let expenseTotal = 0;
//         let rawExpenses  = [];
//         try {
//             const listRes = await apiCall('/api/expenses');
//             rawExpenses = listRes.success
//                 ? (listRes.data || [])
//                 : (Array.isArray(listRes) ? listRes : []);
//         } catch (_) {}

//         if (rawExpenses.length > 0) {
//             rawExpenses
//                 .filter(exp => !isPurchaseEntry(exp))
//                 .forEach(exp => {
//                     const amt     = parseFloat(exp.amount || exp.total || 0);
//                     const expDate = parseDate(exp.date || exp.expense_date || exp.created_at);
//                     const inPeriod = !isMonthView
//                         ? true
//                         : (expDate >= filterStart && expDate <= filterEnd);
//                     if (inPeriod) expenseTotal += amt;
//                 });
//         } else {
//             try {
//                 const expRes = await apiCall('/api/expenses/stats/summary');
//                 if (expRes.success && expRes.data) {
//                     expenseTotal = isMonthView
//                         ? Number(expRes.data.monthly || 0)
//                         : Number(expRes.data.allTime || 0);
//                 }
//             } catch (_) {}
//         }

//         // ── 6. Aggregate ─────────────────────────────────────────────────────
//         let grossRevTotal = 0, cogsTotal = 0, grossProfitTotal = 0;
//         let profitP1 = 0, profitP2 = 0, profitP3 = 0;
//         let revP3    = 0;

//         const breakdown = [];

//         const getSubPeriod = (saleDate) => {
//             if (!isMonthView) {
//                 return {
//                     p1: saleDate >= todayStart,
//                     p2: saleDate >= weekStart,
//                     p3: saleDate >= monthStart
//                 };
//             }
//             // Use UTC day-of-month for month-view sub-period split
//             const day = saleDate.getUTCDate();
//             return {
//                 p1: day >= 1  && day <= 7,
//                 p2: day >= 8  && day <= 21,
//                 p3: true
//             };
//         };

//         salesWithItems.forEach(sale => {
//             // Always use parseDate so "YYYY-MM-DD" strings are treated as UTC midnight
//             const saleDate = parseDate(sale.sales_date || sale.date || sale.created_at);

//             // Skip sales outside selected month (UTC-aware comparison)
//             if (isMonthView && (saleDate < filterStart || saleDate > filterEnd)) return;

//             const { p1, p2, p3 } = getSubPeriod(saleDate);
//             const items = Array.isArray(sale.items) ? sale.items : [];

//             if (items.length > 0) {
//                 items.forEach(item => {
//                     const qty       = parseInt(item.quantity || 1);
//                     const sellPrice = parseFloat(item.unit_price || item.price || 0);
//                     const pid       = String(item.product_id || item.id || '');
//                     const pname     = item.product_name || item.name || 'Unknown';
//                     const cogsUnit  = resolveCogsUnit(item);

//                     const revenue  = sellPrice * qty;
//                     const itemCogs = cogsUnit  * qty;
//                     const profit   = (sellPrice - cogsUnit) * qty;

//                     grossRevTotal    += revenue;
//                     cogsTotal        += itemCogs;
//                     grossProfitTotal += profit;

//                     if (p1) profitP1 += profit;
//                     if (p2) profitP2 += profit;
//                     if (p3) { profitP3 += profit; revP3 += revenue; }

//                     const existing = breakdown.find(b => b.id === pid && b.name === pname);
//                     if (existing) {
//                         existing.revenue += revenue;
//                         existing.cogs    += itemCogs;
//                         existing.profit  += profit;
//                         existing.qty     += qty;
//                     } else {
//                         breakdown.push({ id: pid, name: pname, revenue, cogs: itemCogs, profit, qty, cogsUnit, sellPrice });
//                     }
//                 });
//             } else {
//                 const amt        = parseFloat(sale.total_amount || 0);
//                 const saleProfit = parseFloat(sale.profit       || 0);
//                 const saleCogs   = amt - saleProfit;

//                 grossRevTotal    += amt;
//                 cogsTotal        += saleCogs;
//                 grossProfitTotal += saleProfit;

//                 if (p1) profitP1 += saleProfit;
//                 if (p2) profitP2 += saleProfit;
//                 if (p3) { profitP3 += saleProfit; revP3 += amt; }
//             }
//         });

//         const netTotal = grossProfitTotal - expenseTotal;
//         const netToday = profitP1;
//         const netWeek  = profitP2;
//         const netMonth = profitP3;

//         const grossMarkup   = cogsTotal > 0 ? (grossProfitTotal / cogsTotal * 100) : (grossRevTotal > 0 ? 100 : 0);
//         const netMarginPct  = grossRevTotal > 0 ? (netTotal / grossRevTotal * 100) : 0;

//         // ── Render summary cards ─────────────────────────────────────────────
//         set('nrGrossRevenue',   fmt(grossRevTotal));
//         set('nrTotalCogs',      fmt(cogsTotal));
//         set('nrGrossProfit',    fmt(grossProfitTotal));
//         set('nrTotalExpenses',  fmt(expenseTotal));
//         set('nrExpensesLabel',  isMonthView ? monthLabel + ' expenses' : 'All-time operating expenses');
//         set('nrNetRevenue',     fmt(netTotal),       netTotal  >= 0 ? '#0ec96a' : '#e74c3c');
//         set('nrGrossMargin',    grossMarkup.toFixed(1) + '% markup');
//         set('nrNetMargin',      netMarginPct.toFixed(1) + '% net margin', netMarginPct >= 0 ? '#0ec96a' : '#e74c3c');

//         set('nrNetToday',  fmt(netToday),  netToday  >= 0 ? '#0ec96a' : '#e74c3c');
//         set('nrNetWeek',   fmt(netWeek),   netWeek   >= 0 ? '#0ec96a' : '#e74c3c');
//         set('nrNetMonth',  fmt(netMonth),  netMonth  >= 0 ? '#0ec96a' : '#e74c3c');

//         // ── Audit trail ──────────────────────────────────────────────────────
//         const auditEl = document.getElementById('nrAuditContent');
//         if (auditEl) {
//             const salesCount = salesWithItems.filter(s => {
//                 if (!isMonthView) return true;
//                 const d = parseDate(s.sales_date || s.date || s.created_at);
//                 return d >= filterStart && d <= filterEnd;
//             }).length;
//             const itemsCount = breakdown.reduce((s, b) => s + b.qty, 0);
//             const periodLabel = isMonthView ? monthLabel : 'All Time';
//             auditEl.innerHTML = `
//                 <table class="nr-audit-table">
//                     <tbody>
//                         <tr class="nr-audit-section"><td colspan="3">GROSS REVENUE — ${periodLabel}</td></tr>
//                         <tr><td>Total sales processed</td><td>${salesCount} sales</td><td>From /api/sales + /api/sales/:id/items</td></tr>
//                         <tr><td>Total items sold</td><td>${itemsCount} units</td><td>Sum of all line-item quantities</td></tr>
//                         <tr class="nr-audit-pos"><td><strong>Gross Revenue</strong></td><td><strong>${fmt(grossRevTotal)}</strong></td><td>Σ (unit_price × qty) across all items</td></tr>

//                         <tr class="nr-audit-section"><td colspan="3">COST OF GOODS SOLD (CoGS)</td></tr>
//                         <tr><td>CoGS source</td><td>product.cost field</td><td>Overridden by Stock Purchases unit_cost if present</td></tr>
//                         <tr class="nr-audit-neg"><td><strong>Total CoGS</strong></td><td><strong>${fmt(cogsTotal)}</strong></td><td>Σ (product.cost × qty) across all items</td></tr>

//                         <tr class="nr-audit-section"><td colspan="3">GROSS PROFIT</td></tr>
//                         <tr class="nr-audit-pos"><td><strong>Gross Profit</strong></td><td><strong>${fmt(grossProfitTotal)}</strong></td><td>${fmt(grossRevTotal)} − ${fmt(cogsTotal)}</td></tr>
//                         <tr><td>Gross Markup</td><td>${grossMarkup.toFixed(2)}%</td><td>${fmt(grossProfitTotal)} ÷ ${fmt(cogsTotal)} × 100</td></tr>

//                         <tr class="nr-audit-section"><td colspan="3">OPERATING EXPENSES — ${periodLabel}</td></tr>
//                         <tr class="nr-audit-neg"><td><strong>Expenses (${periodLabel})</strong></td><td><strong>${fmt(expenseTotal)}</strong></td><td>${isMonthView ? 'Expenses dated within ' + monthLabel + ' (stock purchases excluded)' : 'All expenses ever (stock purchases excluded)'}</td></tr>

//                         <tr class="nr-audit-section"><td colspan="3">NET REVENUE (bottom line)</td></tr>
//                         <tr class="${netTotal >= 0 ? 'nr-audit-pos' : 'nr-audit-neg'}">
//                             <td><strong>NET REVENUE</strong></td>
//                             <td><strong>${fmt(netTotal)}</strong></td>
//                             <td>${fmt(grossProfitTotal)} − ${fmt(expenseTotal)} (${periodLabel} expenses)</td>
//                         </tr>
//                         <tr><td>Net Margin</td><td>${netMarginPct.toFixed(2)}%</td><td>${fmt(netTotal)} ÷ ${fmt(grossRevTotal)} × 100</td></tr>

//                         <tr class="nr-audit-section"><td colspan="3">TOTAL GROSS PROFITS</td></tr>
//                         <tr class="${netToday >= 0 ? 'nr-audit-pos' : 'nr-audit-neg'}"><td>${isMonthView ? 'Week 1 Gross Profit' : "Today's Gross Profit"}</td><td>${fmt(netToday)}</td><td>${isMonthView ? 'Days 1–7 of ' + monthLabel : 'Items sold today × (sell price − cost)'}</td></tr>
//                         <tr class="${netWeek >= 0 ? 'nr-audit-pos' : 'nr-audit-neg'}"><td>${isMonthView ? 'Mid-Month Gross Profit' : "This Week's Gross Profit"}</td><td>${fmt(netWeek)}</td><td>${isMonthView ? 'Days 8–21 of ' + monthLabel : 'Items sold this week × (sell price − cost)'}</td></tr>
//                         <tr class="${netMonth >= 0 ? 'nr-audit-pos' : 'nr-audit-neg'}"><td>${isMonthView ? monthLabel + ' Total Gross Profit' : "This Month's Gross Profit"}</td><td>${fmt(netMonth)}</td><td>${isMonthView ? 'Full month: ' + monthLabel : 'Items sold this month × (sell price − cost)'}</td></tr>
//                     </tbody>
//                 </table>`;
//         }

//         renderNetRevenueBreakdown(breakdown.sort((a, b) => b.profit - a.profit));
//         pushNetRevenueToRevenueDashboard({ netTotal, netToday, netWeek, netMonth, grossProfitTotal, cogsTotal });

//     } catch (err) {
//         console.error('computeAndRenderNetRevenue error:', err);
//     }
// }

// function buildCogsMap() { return {}; }

// function pushNetRevenueToRevenueDashboard(vals) {
//     const safeSet = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
//     safeSet('netRevenue',        fmt(vals.netTotal));
//     safeSet('monthlyNetRevenue', fmt(vals.netMonth));
//     safeSet('weeklyNetRevenue',  fmt(vals.netWeek));
//     safeSet('nrGrossProfitDash', fmt(vals.grossProfitTotal));
//     safeSet('nrCogsDash',        fmt(vals.cogsTotal));
// }

// async function updateCogsInNetRevenue() {
//     const activeSection = document.querySelector('.content-section.active')?.id;
//     if (activeSection === 'net-revenue') {
//         await computeAndRenderNetRevenue();
//     }
//     await computeAndRenderNetRevenue();
// }

// function renderNetRevenueBreakdown(breakdown) {
//     const tbody = document.getElementById('nrBreakdownBody');
//     if (!tbody) return;

//     if (!breakdown.length) {
//         tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#888">No sales data with CoGS available yet</td></tr>';
//         return;
//     }

//     tbody.innerHTML = breakdown.slice(0, 50).map(b => {
//         const markup = b.cogs > 0 ? (b.profit / b.cogs * 100) : (b.revenue > 0 ? 100 : 0);
//         return `<tr>
//             <td><strong>${b.name}</strong></td>
//             <td>${b.qty}</td>
//             <td>${fmt(b.revenue)}</td>
//             <td>${fmt(b.cogs)}</td>
//             <td class="${b.profit >= 0 ? 'nr-positive' : 'nr-negative'}">${fmt(b.profit)}</td>
//             <td class="${markup >= 0 ? 'nr-positive' : 'nr-negative'}">${markup.toFixed(1)}%</td>
//         </tr>`;
//     }).join('');
// }

// // ═══════════════════════════════════════════════════════════════
// //  SIDEBAR MENU ITEMS
// // ═══════════════════════════════════════════════════════════════

// function injectSidebarItems() {
//     const sidebar = document.querySelector('.sidebar-menu');
//     if (!sidebar || document.querySelector('[data-section="stock-purchases"]')) return;

//     const inventoryItem = sidebar.querySelector('[data-section="inventory"]');
//     const spItem = document.createElement('li');
//     spItem.dataset.section = 'stock-purchases';
//     spItem.innerHTML = `<span>Stock Purchases</span>`;
//     spItem.addEventListener('click', () => switchSection('stock-purchases'));
//     if (inventoryItem) inventoryItem.after(spItem);
//     else sidebar.appendChild(spItem);

//     const revenueItem = sidebar.querySelector('[data-section="revenue"]');
//     const nrItem = document.createElement('li');
//     nrItem.dataset.section = 'net-revenue';
//     nrItem.innerHTML = `<span>Net Revenue</span>`;
//     nrItem.addEventListener('click', () => switchSection('net-revenue'));
//     if (revenueItem) revenueItem.after(nrItem);
//     else sidebar.appendChild(nrItem);
// }

// // ═══════════════════════════════════════════════════════════════
// //  DOM SECTIONS
// // ═══════════════════════════════════════════════════════════════

// function injectSections() {
//     const container = (
//         document.querySelector('.main-content')   ||
//         document.querySelector('#main-content')   ||
//         document.querySelector('.content')        ||
//         document.querySelector('#content')        ||
//         document.querySelector('.content-wrapper')||
//         document.querySelector('.content-section')?.parentElement ||
//         document.body
//     );

//     if (!document.getElementById('stock-purchases')) {
//         container.insertAdjacentHTML('beforeend', stockPurchasesSectionHTML());
//     }
//     if (!document.getElementById('net-revenue')) {
//         container.insertAdjacentHTML('beforeend', netRevenueSectionHTML());
//     }
//     if (!document.getElementById('addStockPurchaseModal')) {
//         document.body.insertAdjacentHTML('beforeend', addStockPurchaseModalHTML());
//     }
// }

// // ═══════════════════════════════════════════════════════════════
// //  HTML TEMPLATES
// // ═══════════════════════════════════════════════════════════════

// function stockPurchasesSectionHTML() {
//     return `
// <section id="stock-purchases" class="content-section sp-section">
//   <div class="sp-header">
//     <div>
//       <h2 class="sp-title">📦 Stock Purchases</h2>
//       <p class="sp-subtitle">Track CoGS — every unit bought, its cost, and supplier</p>
//     </div>
//     <div class="sp-header-actions">
//       <button class="sp-btn sp-btn-primary" onclick="showAddStockPurchaseModal()">+ New Purchase</button>
//       <button class="sp-btn sp-btn-secondary" onclick="exportStockPurchasesCSV()">⬇ Export CSV</button>
//     </div>
//   </div>

//   <!-- Stats -->
//   <div class="sp-stats-grid">
//     <div class="sp-stat-card sp-stat-blue">
//       <div class="sp-stat-label">Total Spend</div>
//       <div class="sp-stat-value" id="spTotalCost">KSH 0.00</div>
//       <div class="sp-stat-sub" id="spTotalItems">0 entries</div>
//     </div>
//     <div class="sp-stat-card sp-stat-orange">
//       <div class="sp-stat-label">Today's Spend</div>
//       <div class="sp-stat-value" id="spTodayCost">KSH 0.00</div>
//     </div>
//     <div class="sp-stat-card sp-stat-purple">
//       <div class="sp-stat-label">This Week</div>
//       <div class="sp-stat-value" id="spWeekCost">KSH 0.00</div>
//     </div>
//     <div class="sp-stat-card sp-stat-green">
//       <div class="sp-stat-label">This Month</div>
//       <div class="sp-stat-value" id="spMonthCost">KSH 0.00</div>
//     </div>
//     <div class="sp-stat-card sp-stat-gray">
//       <div class="sp-stat-label">Total Units Bought</div>
//       <div class="sp-stat-value" id="spTotalQty">0 units</div>
//     </div>
//   </div>

//   <!-- Search -->
//   <div class="sp-search-bar">
//     <input type="text" class="sp-search-input" placeholder="Search by product, supplier or category…"
//            oninput="searchStockPurchases(this.value)" />
//   </div>

//   <!-- Table -->
//   <div class="sp-table-wrapper">
//     <div id="stockPurchasesLoading" style="display:none;text-align:center;padding:20px;color:#888">Loading…</div>
//     <table class="sp-table">
//       <thead>
//         <tr>
//           <th>Product</th><th>Supplier</th><th>Qty</th>
//           <th>Unit Cost</th><th>Total Cost</th><th>Payment</th>
//           <th>Status</th><th>Date</th><th></th>
//         </tr>
//       </thead>
//       <tbody id="stockPurchasesTableBody">
//         <tr><td colspan="9" class="sp-empty">Loading stock purchases…</td></tr>
//       </tbody>
//     </table>
//   </div>

//   <!-- Pagination -->
//   <div class="sp-pagination">
//     <button id="prevSpBtn" class="sp-btn sp-btn-secondary" onclick="prevStockPurchasesPage()">← Prev</button>
//     <span id="spPageInfo" class="sp-page-info">Page 1</span>
//     <button id="nextSpBtn" class="sp-btn sp-btn-secondary" onclick="nextStockPurchasesPage()">Next →</button>
//   </div>
// </section>`;
// }

// function netRevenueSectionHTML() {
//     return `
// <section id="net-revenue" class="content-section sp-section">
//   <div class="sp-header">
//     <div>
//       <h2 class="sp-title">📊 Net Revenue</h2>
//       <p class="sp-subtitle">Net Revenue = (Sell Price − CoGS) × Qty − Expenses</p>
//     </div>
//     <div class="sp-header-actions" style="align-items:center;flex-wrap:wrap;gap:10px">
//       <div class="nr-month-picker">
//         <label class="nr-month-label" for="nrMonthSelect">📅 View Month</label>
//         <select id="nrMonthSelect" class="sp-input nr-month-select" onchange="onNrMonthChange(this.value)">
//           <option value="all">All Time</option>
//         </select>
//       </div>
//       <button class="sp-btn sp-btn-primary" onclick="computeAndRenderNetRevenue(document.getElementById('nrMonthSelect').value)">↻ Refresh</button>
//     </div>
//   </div>

//   <!-- Top KPI cards -->
//   <div class="sp-stats-grid nr-grid">
//     <div class="sp-stat-card sp-stat-blue">
//       <div class="sp-stat-label">Gross Revenue</div>
//       <div class="sp-stat-value" id="nrGrossRevenue">KSH 0.00</div>
//       <div class="sp-stat-sub">Total sales</div>
//     </div>
//     <div class="sp-stat-card sp-stat-orange">
//       <div class="sp-stat-label">Total CoGS</div>
//       <div class="sp-stat-value" id="nrTotalCogs">KSH 0.00</div>
//       <div class="sp-stat-sub">Cost of goods sold</div>
//     </div>
//     <div class="sp-stat-card sp-stat-purple">
//       <div class="sp-stat-label">Gross Profit</div>
//       <div class="sp-stat-value" id="nrGrossProfit">KSH 0.00</div>
//       <div class="sp-stat-sub" id="nrGrossMargin">0.0% markup</div>
//     </div>
//     <div class="sp-stat-card sp-stat-red">
//       <div class="sp-stat-label">Total Expenses</div>
//       <div class="sp-stat-value" id="nrTotalExpenses">KSH 0.00</div>
//       <div class="sp-stat-sub" id="nrExpensesLabel">All operating expenses</div>
//     </div>
//     <div class="sp-stat-card nr-net-card">
//       <div class="sp-stat-label">NET REVENUE</div>
//       <div class="sp-stat-value nr-big" id="nrNetRevenue">KSH 0.00</div>
//       <div class="sp-stat-sub" id="nrNetMargin">0.0% net margin</div>
//     </div>
//   </div>

//   <!-- Time-window gross profit cards -->
//   <div class="nr-time-grid">
//     <div class="nr-time-card">
//       <div class="nr-time-label" id="nrLabelToday">Today's Gross Profit</div>
//       <div class="nr-time-value" id="nrNetToday">KSH 0.00</div>
//       <div class="nr-time-sub" id="nrSubToday">Sales − CoGS today</div>
//     </div>
//     <div class="nr-time-card">
//       <div class="nr-time-label" id="nrLabelWeek">This Week's Gross Profit</div>
//       <div class="nr-time-value" id="nrNetWeek">KSH 0.00</div>
//       <div class="nr-time-sub" id="nrSubWeek">Sales − CoGS this week</div>
//     </div>
//     <div class="nr-time-card">
//       <div class="nr-time-label" id="nrLabelMonth">This Month's Gross Profit</div>
//       <div class="nr-time-value" id="nrNetMonth">KSH 0.00</div>
//       <div class="nr-time-sub" id="nrSubMonth">Sales − CoGS this month</div>
//     </div>
//   </div>

//   <!-- Formula explainer -->
//   <div class="nr-formula-box">
//     <span class="nr-formula-label">Formula:</span>
//     <code>Net Revenue = Σ [ (Sell Price − CoGS per unit) × Qty ] − Total Expenses</code>
//   </div>

//   <!-- Calculation audit trail -->
//   <div id="nrAuditBox" class="nr-audit-box">
//     <div class="nr-audit-title">📋 Net Revenue Calculation Audit</div>
//     <div id="nrAuditContent" class="nr-audit-content">Click Refresh to load audit trail.</div>
//   </div>

//   <!-- Per-product breakdown (hidden by default) -->
//   <!--<div class="sp-table-wrapper" style="margin-top:24px">
//     <h3 style="padding:16px 20px 0;font-size:15px;color:var(--sp-text)">Product Profitability Breakdown</h3>
//     <table class="sp-table">
//       <thead>
//         <tr>
//           <th>Product</th><th>Units Sold</th><th>Revenue</th>
//           <th>CoGS</th><th>Gross Profit</th><th>Markup % <small style="font-weight:400;text-transform:none">(Profit÷CoGS)</small></th>
//         </tr>
//       </thead>
//       <tbody id="nrBreakdownBody">
//         <tr><td colspan="6" style="text-align:center;padding:20px;color:#888">Click Refresh to load data</td></tr>
//       </tbody>
//     </table>
//   </div>-->
// </section>`;
// }

// function addStockPurchaseModalHTML() {
//     return `
// <div id="addStockPurchaseModal" class="sp-modal-overlay" style="display:none">
//   <div class="sp-modal">
//     <div class="sp-modal-header">
//       <h3>Record Stock Purchase</h3>
//       <button class="sp-modal-close" onclick="closeAddStockPurchaseModal()">✕</button>
//     </div>
//     <form id="addStockPurchaseForm" autocomplete="off" onsubmit="saveStockPurchase(event); return false;">

//       <div class="sp-form-row">
//         <div class="sp-form-group">
//           <label>Product *</label>
//           <select id="spProductSelect" class="sp-input" required>
//             <option value="">Loading products…</option>
//           </select>
//           <div id="spStockPreview" class="sp-stock-preview" style="display:none"></div>
//         </div>
//         <div class="sp-form-group">
//           <label>Supplier Name</label>
//           <input id="spSupplierName" class="sp-input" placeholder="e.g. Safaricom Distributor" />
//         </div>
//       </div>

//       <div class="sp-form-row">
//         <div class="sp-form-group">
//           <label>Supplier Phone</label>
//           <input id="spSupplierPhone" class="sp-input" placeholder="0700 000 000" />
//         </div>
//         <div class="sp-form-group">
//           <label>Payment Method</label>
//           <select id="spPaymentMethod" class="sp-input">
//             <option>Cash</option><option>M-Pesa</option>
//             <option>Bank Transfer</option><option>Card</option><option>Credit</option>
//           </select>
//         </div>
//       </div>

//       <div class="sp-form-row">
//         <div class="sp-form-group">
//           <label>Quantity (units) *</label>
//           <input id="spQuantity" type="number" min="1" class="sp-input" required
//                  oninput="recalcTotalCost(); const _o=document.getElementById('spProductSelect'); if(_o&&_o.selectedIndex>0) updateStockPreview(_o.options[_o.selectedIndex]);"
//                  placeholder="e.g. 10" />
//         </div>
//         <div class="sp-form-group">
//           <label>Unit Cost (KSH) *</label>
//           <input id="spUnitCost" type="number" min="0" step="0.01" class="sp-input" required
//                  oninput="recalcTotalCost()" placeholder="e.g. 4500.00" />
//         </div>
//       </div>

//       <div class="sp-total-preview">
//         Total Cost: <strong id="spTotalCostPreview">KSH 0.00</strong>
//       </div>

//       <div class="sp-form-row">
//         <div class="sp-form-group">
//           <label>Status</label>
//           <select id="spStatus" class="sp-input">
//             <option value="received">Received</option>
//             <option value="pending">Pending Delivery</option>
//             <option value="returned">Returned</option>
//           </select>
//         </div>
//         <div class="sp-form-group">
//           <label>Purchase Date</label>
//           <input id="spPurchaseDate" type="datetime-local" class="sp-input" />
//         </div>
//       </div>

//       <div class="sp-form-group">
//         <label>Notes</label>
//         <textarea id="spNotes" class="sp-input" rows="2" placeholder="Invoice number, reference, etc."></textarea>
//       </div>

//       <div class="sp-modal-footer">
//         <button type="button" class="sp-btn sp-btn-secondary" onclick="closeAddStockPurchaseModal()">Cancel</button>
//         <button type="button" class="sp-btn sp-btn-primary" onclick="saveStockPurchase(event)">Save Purchase</button>
//       </div>
//     </form>
//   </div>
// </div>`;
// }

// function ensureStockPurchaseModal() {
//     if (!document.getElementById('addStockPurchaseModal')) {
//         document.body.insertAdjacentHTML('beforeend', addStockPurchaseModalHTML());
//     }
// }

// // ═══════════════════════════════════════════════════════════════
// //  STYLES
// // ═══════════════════════════════════════════════════════════════

// function injectStyles() {
//     if (document.getElementById('sp-styles')) return;
//     const style = document.createElement('style');
//     style.id = 'sp-styles';
//     style.textContent = `
// /* ── Variables ────────────────────────── */
// :root {
//   --sp-bg:       #f4f6fb;
//   --sp-surface:  #ffffff;
//   --sp-border:   #e2e8f0;
//   --sp-text:     #1e293b;
//   --sp-muted:    #64748b;
//   --sp-blue:     #3b82f6;
//   --sp-green:    #10b981;
//   --sp-orange:   #f59e0b;
//   --sp-purple:   #8b5cf6;
//   --sp-red:      #ef4444;
//   --sp-gray:     #94a3b8;
//   --sp-radius:   10px;
//   --sp-shadow:   0 2px 12px rgba(0,0,0,.07);
// }

// /* ── Section shell ────────────────────── */
// .sp-section {
//   padding: 28px 32px;
//   background: var(--sp-bg);
//   box-sizing: border-box;
//   overflow-y: auto;
// }
// .sp-header {
//   display: flex;
//   justify-content: space-between;
//   align-items: flex-start;
//   margin-bottom: 24px;
//   flex-wrap: wrap;
//   gap: 12px;
// }
// .sp-title  { font-size: 22px; font-weight: 700; color: var(--sp-text); margin: 0; }
// .sp-subtitle { font-size: 13px; color: var(--sp-muted); margin: 4px 0 0; }
// .sp-header-actions { display: flex; gap: 10px; }

// /* ── Stat cards ───────────────────────── */
// .sp-stats-grid {
//   display: grid;
//   grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
//   gap: 16px;
//   margin-bottom: 24px;
// }
// .nr-grid { grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); }
// .sp-stat-card {
//   background: var(--sp-surface);
//   border-radius: var(--sp-radius);
//   box-shadow: var(--sp-shadow);
//   padding: 18px 20px;
//   border-left: 4px solid transparent;
//   transition: transform .15s;
// }
// .sp-stat-card:hover { transform: translateY(-2px); }
// .sp-stat-blue   { border-left-color: var(--sp-blue); }
// .sp-stat-orange { border-left-color: var(--sp-orange); }
// .sp-stat-purple { border-left-color: var(--sp-purple); }
// .sp-stat-green  { border-left-color: var(--sp-green); }
// .sp-stat-gray   { border-left-color: var(--sp-gray); }
// .sp-stat-red    { border-left-color: var(--sp-red); }
// .nr-net-card    { border-left-color: var(--sp-green); background: #f0fdf4; }

// .sp-stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: .8px; color: var(--sp-muted); }
// .sp-stat-value { font-size: 20px; font-weight: 700; color: var(--sp-text); margin: 6px 0 4px; }
// .sp-stat-sub   { font-size: 11px; color: var(--sp-muted); }
// .nr-big        { font-size: 26px; color: var(--sp-green); }

// /* ── Time-window row ──────────────────── */
// .nr-time-grid {
//   display: grid;
//   grid-template-columns: repeat(3, 1fr);
//   gap: 14px;
//   margin-bottom: 20px;
// }
// .nr-time-card {
//   background: var(--sp-surface);
//   border-radius: var(--sp-radius);
//   box-shadow: var(--sp-shadow);
//   padding: 16px 20px;
//   text-align: center;
// }
// .nr-time-label { font-size: 12px; color: var(--sp-muted); text-transform: uppercase; letter-spacing: .6px; }
// .nr-time-value { font-size: 22px; font-weight: 700; margin-top: 8px; }

// /* ── Formula box ──────────────────────── */
// .nr-formula-box {
//   background: #eff6ff;
//   border: 1px solid #bfdbfe;
//   border-radius: 8px;
//   padding: 14px 18px;
//   font-size: 13px;
//   color: #1e40af;
//   display: flex;
//   flex-wrap: wrap;
//   gap: 10px;
//   align-items: center;
//   margin-bottom: 8px;
// }
// .nr-formula-label { font-weight: 700; }
// .nr-formula-note  { font-size: 11px; color: var(--sp-muted); flex-basis: 100%; }
// .nr-formula-box code { background: #dbeafe; padding: 4px 8px; border-radius: 5px; font-size: 13px; }

// /* ── Profit colours ───────────────────── */
// .nr-positive { color: var(--sp-green); font-weight: 600; }
// .nr-negative { color: var(--sp-red);   font-weight: 600; }

// /* ── Search ───────────────────────────── */
// .sp-search-bar { margin-bottom: 16px; }
// .sp-search-input {
//   width: 100%;
//   max-width: 420px;
//   padding: 10px 14px;
//   border: 1px solid var(--sp-border);
//   border-radius: 8px;
//   font-size: 14px;
//   outline: none;
//   transition: border-color .2s;
// }
// .sp-search-input:focus { border-color: var(--sp-blue); }

// /* ── Table ────────────────────────────── */
// .sp-table-wrapper {
//   background: var(--sp-surface);
//   border-radius: var(--sp-radius);
//   box-shadow: var(--sp-shadow);
//   overflow: auto;
//   margin-bottom: 16px;
// }
// .sp-table { width: 100%; border-collapse: collapse; font-size: 10px; }
// .sp-table thead { background: #f8fafc; }
// .sp-table th    { padding: 12px 16px; text-align: left; font-size: 12px;
//                   font-weight: 600; color: var(--sp-muted); text-transform: uppercase;
//                   letter-spacing: .5px; border-bottom: 1px solid var(--sp-border); }
// .sp-table td    { padding: 13px 16px; border-bottom: 1px solid #f1f5f9; color: var(--sp-text); }
// .sp-table tbody tr:hover { background: #f8fafc; }
// .sp-table tbody tr:last-child td { border-bottom: none; }
// .sp-empty       { text-align: center; padding: 40px !important; color: var(--sp-muted); }

// /* ── Badge ────────────────────────────── */
// .sp-badge { display: inline-block; padding: 3px 10px; border-radius: 20px;
//             font-size: 11px; font-weight: 600; text-transform: capitalize; }
// .sp-badge-success { background: #d1fae5; color: #065f46; }
// .sp-badge-warn    { background: #fef3c7; color: #92400e; }

// /* ── Buttons ──────────────────────────── */
// .sp-btn {
//   display: inline-flex; align-items: center; gap: 6px;
//   padding: 9px 16px; border-radius: 7px; font-size: 13px;
//   font-weight: 600; cursor: pointer; border: none; transition: all .15s;
// }
// .sp-btn-primary   { background: var(--sp-blue); color: #fff; }
// .sp-btn-primary:hover   { background: #2563eb; }
// .sp-btn-secondary { background: #f1f5f9; color: var(--sp-text); border: 1px solid var(--sp-border); }
// .sp-btn-secondary:hover { background: #e2e8f0; }
// .sp-btn-danger    { background: #fee2e2; color: var(--sp-red); }
// .sp-btn-danger:hover    { background: #fecaca; }
// .sp-btn-sm { padding: 5px 10px; font-size: 12px; }

// /* ── Pagination ───────────────────────── */
// .sp-pagination { display: flex; align-items: center; gap: 14px; justify-content: center; padding: 8px 0; }
// .sp-page-info  { font-size: 13px; color: var(--sp-muted); }

// /* ── Modal ────────────────────────────── */
// .sp-modal-overlay {
//   position: fixed; inset: 0; background: rgba(15,23,42,.5);
//   display: flex; align-items: center; justify-content: center;
//   z-index: 9999; backdrop-filter: blur(2px);
// }
// .sp-modal {
//   background: var(--sp-surface);
//   border-radius: 14px;
//   padding: 32px;
//   width: 100%;
//   max-width: 680px;
//   max-height: 90vh;
//   overflow-y: auto;
//   box-shadow: 0 20px 60px rgba(0,0,0,.18);
// }
// .sp-modal-header {
//   display: flex; justify-content: space-between; align-items: center;
//   margin-bottom: 24px;
// }
// .sp-modal-header h3 { margin: 0; font-size: 18px; color: var(--sp-text); }
// .sp-modal-close {
//   background: none; border: none; font-size: 18px;
//   cursor: pointer; color: var(--sp-muted); line-height: 1;
// }
// .sp-modal-close:hover { color: var(--sp-red); }
// .sp-form-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
// .sp-form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
// .sp-form-group label { font-size: 12px; font-weight: 600; color: var(--sp-muted);
//                         text-transform: uppercase; letter-spacing: .5px; }
// .sp-input {
//   padding: 10px 12px; border: 1px solid var(--sp-border);
//   border-radius: 7px; font-size: 14px; color: var(--sp-text);
//   outline: none; transition: border-color .2s; width: 100%; box-sizing: border-box;
// }
// .sp-input:focus { border-color: var(--sp-blue); }
// .sp-total-preview {
//   background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;
//   padding: 12px 16px; font-size: 14px; color: #1e40af; margin-bottom: 16px;
// }
// .sp-stock-preview {
//   margin-top: 8px;
//   padding: 8px 12px;
//   background: #f8fafc;
//   border: 1px solid #e2e8f0;
//   border-radius: 6px;
//   font-size: 13px;
//   line-height: 1.6;
// }
// .sp-modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }

// /* ── Month picker ─────────────────────────── */
// .nr-month-picker {
//   display: flex;
//   align-items: center;
//   gap: 8px;
// }
// .nr-month-label {
//   font-size: 12px;
//   font-weight: 600;
//   color: var(--sp-muted);
//   white-space: nowrap;
// }
// .nr-month-select {
//   min-width: 180px;
//   padding: 8px 12px;
//   font-size: 13px;
//   font-weight: 600;
//   border: 1.5px solid var(--sp-blue);
//   border-radius: 7px;
//   color: var(--sp-text);
//   background: #fff;
//   cursor: pointer;
// }
// .nr-month-select:focus { outline: none; border-color: #2563eb; }

// /* ── Time card subtitle ───────────────────── */
// .nr-time-sub { font-size: 11px; color: var(--sp-muted); margin-top: 4px; }

// /* ── Audit box ────────────────────────────── */
// .nr-audit-box {
//   background: var(--sp-surface);
//   border: 1px solid var(--sp-border);
//   border-radius: var(--sp-radius);
//   box-shadow: var(--sp-shadow);
//   margin-bottom: 20px;
//   overflow: hidden;
// }
// .nr-audit-title {
//   background: #f8fafc;
//   padding: 12px 18px;
//   font-size: 13px;
//   font-weight: 700;
//   color: var(--sp-text);
//   border-bottom: 1px solid var(--sp-border);
// }
// .nr-audit-content { padding: 0; }
// .nr-audit-table {
//   width: 100%;
//   border-collapse: collapse;
//   font-size: 13px;
// }
// .nr-audit-table th {
//   padding: 9px 14px;
//   text-align: left;
//   font-size: 11px;
//   font-weight: 600;
//   color: var(--sp-muted);
//   text-transform: uppercase;
//   letter-spacing: .5px;
//   background: #f8fafc;
//   border-bottom: 1px solid var(--sp-border);
// }
// .nr-audit-table td {
//   padding: 8px 14px;
//   border-bottom: 1px solid #f1f5f9;
//   color: var(--sp-text);
//   vertical-align: top;
// }
// .nr-audit-table td:nth-child(2) { font-family: monospace; font-size: 13px; white-space: nowrap; }
// .nr-audit-table td:nth-child(3) { color: var(--sp-muted); font-size: 12px; }
// .nr-audit-section td {
//   background: #f1f5f9;
//   font-size: 11px;
//   font-weight: 700;
//   text-transform: uppercase;
//   letter-spacing: .8px;
//   color: var(--sp-muted);
//   padding: 6px 14px;
// }
// .nr-audit-pos td:nth-child(2) { color: var(--sp-green); }
// .nr-audit-neg td:nth-child(2) { color: var(--sp-red); }

// @media (max-width: 640px) {
//   .sp-section  { padding: 16px; }
//   .sp-form-row { grid-template-columns: 1fr; }
//   .nr-time-grid { grid-template-columns: 1fr; }
//   .nr-audit-table td:nth-child(3) { display: none; }
// }

// .main-content #stock-purchases,
// .main-content #net-revenue,
// .content-wrapper #stock-purchases,
// .content-wrapper #net-revenue,
// #main-content #stock-purchases,
// #main-content #net-revenue {
//   position: relative;
//   width: 100%;
// }

// @keyframes spin {
//   to { transform: rotate(360deg); }
// }`;
//     document.head.appendChild(style);
// }

// // ═══════════════════════════════════════════════════════════════
// //  HELPERS
// // ═══════════════════════════════════════════════════════════════

// function fmt(val) {
//     return `KSH ${Number(val || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// }
// function set(id, text, color) {
//     const el = document.getElementById(id);
//     if (!el) return;
//     el.textContent = text;
//     if (color) el.style.color = color;
// }
// function downloadCSV(rows, filename) {
//     const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
//     const a = document.createElement('a');
//     a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
//     a.download = `${filename}-${new Date().toISOString().slice(0,10)}.csv`;
//     a.click();
// }

// let _productCache = null;
// function getCachedProducts()  { return _productCache; }
// function setCachedProducts(p) { _productCache = p; }

// // ═══════════════════════════════════════════════════════════════
// //  INIT
// // ═══════════════════════════════════════════════════════════════

// document.addEventListener('DOMContentLoaded', () => {
//     injectStyles();
//     injectSections();
//     injectSidebarItems();
//     updateCogsInNetRevenue();
// });


// ─── State ───────────────────────────────────────────────────
let stockPurchasesData   = [];
let filteredPurchases    = [];
let stockPurchasesPage   = 1;
const stockPurchasesLimit = 10;

(function patchSwitchSection() {
    const tryPatch = () => {
        if (typeof window.switchSection === 'function') {
            const _orig = window.switchSection;
            window.switchSection = function (sectionName) {
                if (sectionName === 'stock-purchases' || sectionName === 'net-revenue') {
                   
                    document.querySelectorAll('.sidebar-menu li').forEach(i => i.classList.remove('active'));
                    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

                    const li = document.querySelector(`[data-section="${sectionName}"]`);
                    if (li) li.classList.add('active');

                    const sec = document.getElementById(sectionName);
                    if (sec) sec.classList.add('active');

                    if (sectionName === 'stock-purchases') loadStockPurchases();
                    if (sectionName === 'net-revenue')      initNetRevenue();
                } else {
                    _orig(sectionName);
                }
            };
        } else {
            setTimeout(tryPatch, 50);
        }
    };
    tryPatch();
})();

// ═══════════════════════════════════════════════════════════════
//  TIMEZONE HELPER
//  All date comparisons use UTC to avoid live-server vs local-
//  server discrepancies (e.g. Nairobi UTC+3 vs a UTC host).
// ═══════════════════════════════════════════════════════════════

/**
 * Parse any date string to a Date, forcing date-only strings
 * ("YYYY-MM-DD") to UTC midnight so they are never shifted by
 * the host's local timezone offset.
 */
function parseDate(raw) {
    if (!raw) return new Date(NaN);
    const s = String(raw).trim();
    // Date-only: "2025-04-01"  → treat as UTC midnight
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + 'T00:00:00Z');
    return new Date(s);
}

/**
 * Return a Date at UTC midnight for the given Date object's UTC date.
 * Use this instead of new Date(y, m, d) to avoid local-offset shifts.
 */
function utcMidnight(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

// ═══════════════════════════════════════════════════════════════
//  STOCK PURCHASES
// ═══════════════════════════════════════════════════════════════

async function loadStockPurchases() {
    try {
        showStockPurchasesLoading(true);

        let data = [];
        try {
            const res = await apiCall('/api/stock-purchases');
            data = Array.isArray(res) ? res : (res.data || []);
        } catch (e) {
            data = stockPurchasesData.length ? stockPurchasesData : [];
        }

        stockPurchasesData = data;
        filteredPurchases  = [...data];
        stockPurchasesPage = 1;

        renderStockPurchasesStats(data);
        applyStockPurchasesPagination();
        await updateCogsInNetRevenue();

    } catch (err) {
        console.error('loadStockPurchases error:', err);
        showNotification('Error loading stock purchases', 'error');
    } finally {
        showStockPurchasesLoading(false);
    }
}

function showStockPurchasesLoading(on) {
    const el = document.getElementById('stockPurchasesLoading');
    if (el) el.style.display = on ? 'block' : 'none';
}

// ── Stats bar ────────────────────────────────────────────────
function renderStockPurchasesStats(purchases) {
    const now      = new Date();
    // Use UTC-based boundaries so live server (UTC) and local (UTC+3) agree
    const todayUTC = utcMidnight(now);
    const weekAgo  = new Date(todayUTC.getTime() - 7  * 86400000);
    const monthAgo = new Date(todayUTC.getTime() - 30 * 86400000);

    let totalCost = 0, todayCost = 0, weekCost = 0, monthCost = 0;
    let totalQty  = 0;

    purchases.forEach(p => {
        const cost = parseFloat(p.total_cost || p.unit_cost * p.quantity || 0);
        const qty  = parseInt(p.quantity || 0);
        const d    = parseDate(p.purchase_date || p.created_at);
        const dUTC = utcMidnight(d);

        totalCost += cost;
        totalQty  += qty;
        if (dUTC.getTime() === todayUTC.getTime()) todayCost += cost;
        if (dUTC >= weekAgo)  weekCost  += cost;
        if (dUTC >= monthAgo) monthCost += cost;
    });

    set('spTotalCost',   fmt(totalCost));
    set('spTodayCost',   fmt(todayCost));
    set('spWeekCost',    fmt(weekCost));
    set('spMonthCost',   fmt(monthCost));
    set('spTotalItems',  purchases.length + ' entries');
    set('spTotalQty',    totalQty + ' units');
}

// ── Table ────────────────────────────────────────────────────
function applyStockPurchasesPagination() {
    const start    = (stockPurchasesPage - 1) * stockPurchasesLimit;
    const pageData = filteredPurchases.slice(start, start + stockPurchasesLimit);
    renderStockPurchasesTable(pageData);
    updateStockPurchasesPaginationUI();
}

function renderStockPurchasesTable(purchases) {
    const tbody = document.getElementById('stockPurchasesTableBody');
    if (!tbody) return;

    if (!purchases.length) {
        tbody.innerHTML = `<tr><td colspan="9" class="sp-empty">
            No stock purchases recorded yet.<br>
            <button class="sp-btn sp-btn-primary" onclick="showAddStockPurchaseModal()" style="margin-top:12px">
                + Record First Purchase
            </button></td></tr>`;
        return;
    }

    tbody.innerHTML = purchases.map(p => {
        const unitCost  = parseFloat(p.unit_cost  || 0);
        const qty       = parseInt(p.quantity      || 0);
        const totalCost = parseFloat(p.total_cost  || unitCost * qty);
        const date      = parseDate(p.purchase_date || p.created_at);

        return `<tr>
            <td><strong>${p.product_name || '—'}</strong><br>
                <small style="color:#888">${p.category || ''}</small></td>
            <td>${p.supplier_name || '—'}</td>
            <td><strong>${qty}</strong> units</td>
            <td>KSH ${unitCost.toFixed(2)}</td>
            <td><strong>KSH ${totalCost.toFixed(2)}</strong></td>
            <td>${p.payment_method || 'Cash'}</td>
            <td><span class="sp-badge sp-badge-${p.status === 'received' ? 'success' : 'warn'}">${p.status || 'received'}</span></td>
            <td>${date.toLocaleDateString()}</td>
            <td>
                <button class="sp-btn sp-btn-sm sp-btn-danger" onclick="deleteStockPurchase('${p.id}')">✕</button>
            </td>
        </tr>`;
    }).join('');
}

function updateStockPurchasesPaginationUI() {
    const totalPages = Math.max(1, Math.ceil(filteredPurchases.length / stockPurchasesLimit));
    set('spPageInfo', `Page ${stockPurchasesPage} of ${totalPages} (${filteredPurchases.length} records)`);

    const prev = document.getElementById('prevSpBtn');
    const next = document.getElementById('nextSpBtn');
    if (prev) { prev.disabled = stockPurchasesPage <= 1; prev.style.opacity = prev.disabled ? '.5' : '1'; }
    if (next) { next.disabled = stockPurchasesPage >= totalPages; next.style.opacity = next.disabled ? '.5' : '1'; }
}

function prevStockPurchasesPage() {
    if (stockPurchasesPage > 1) { stockPurchasesPage--; applyStockPurchasesPagination(); }
}
function nextStockPurchasesPage() {
    if (stockPurchasesPage < Math.ceil(filteredPurchases.length / stockPurchasesLimit)) {
        stockPurchasesPage++; applyStockPurchasesPagination();
    }
}

function searchStockPurchases(q) {
    q = q.toLowerCase().trim();
    filteredPurchases = q
        ? stockPurchasesData.filter(p =>
            (p.product_name  || '').toLowerCase().includes(q) ||
            (p.supplier_name || '').toLowerCase().includes(q) ||
            (p.category      || '').toLowerCase().includes(q))
        : [...stockPurchasesData];
    stockPurchasesPage = 1;
    applyStockPurchasesPagination();
}

// ── Add Purchase Modal ───────────────────────────────────────
function showAddStockPurchaseModal() {
    ensureStockPurchaseModal();
    const modal = document.getElementById('addStockPurchaseModal');

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const dateEl = document.getElementById('spPurchaseDate');
    if (dateEl) dateEl.value = now.toISOString().slice(0, 16);

    populateSpProductDropdown();

    modal.style.display = 'flex';
}

async function populateSpProductDropdown() {
    const sel = document.getElementById('spProductSelect');
    if (!sel) return;
    try {
        const products = await apiCall('/api/products');
        const list = Array.isArray(products) ? products : [];

        sel.innerHTML = '<option value="">— Select product —</option>' +
            list.map(p => {
                const stock = parseInt(p.stock || 0);
                const cost  = parseFloat(p.cost || 0);
                return `<option value="${p.id}"
                    data-name="${(p.name||'').replace(/"/g,'&quot;')}"
                    data-cost="${cost}"
                    data-stock="${stock}"
                    data-cat="${p.category || ''}"
                    data-restock="${p.restockLevel || 5}"
                    data-price="${p.price || 0}">
                    ${p.name} — Stock: ${stock} units
                </option>`;
            }).join('');

        sel.onchange = () => {
            const opt = sel.options[sel.selectedIndex];
            if (!opt.value) { clearStockPreview(); return; }

            const costEl = document.getElementById('spUnitCost');
            if (costEl) costEl.value = opt.dataset.cost || '';

            recalcTotalCost();
            updateStockPreview(opt);
        };
    } catch (e) { console.warn('populateSpProductDropdown:', e); }
}

function updateStockPreview(opt) {
    const preview = document.getElementById('spStockPreview');
    if (!preview) return;
    const currentStock = parseInt(opt.dataset.stock || 0);
    const qty          = parseInt(document.getElementById('spQuantity')?.value || 0);
    const newStock     = currentStock + qty;
    const restock      = parseInt(opt.dataset.restock || 5);
    const statusColor  = newStock === 0 ? '#ef4444' : newStock < restock ? '#f59e0b' : '#10b981';
    preview.innerHTML  = `
        <span style="color:#64748b">Current stock:</span>
        <strong>${currentStock} units</strong>
        &nbsp;→&nbsp;
        <span style="color:#3b82f6">After purchase:</span>
        <strong style="color:${statusColor}">${newStock} units</strong>`;
    preview.style.display = 'block';
}

function clearStockPreview() {
    const preview = document.getElementById('spStockPreview');
    if (preview) { preview.innerHTML = ''; preview.style.display = 'none'; }
}

function recalcTotalCost() {
    const qty  = parseFloat(document.getElementById('spQuantity')?.value  || 0);
    const cost = parseFloat(document.getElementById('spUnitCost')?.value   || 0);
    const el   = document.getElementById('spTotalCostPreview');
    if (el) el.textContent = `KSH ${(qty * cost).toFixed(2)}`;
}

function closeAddStockPurchaseModal() {
    const modal = document.getElementById('addStockPurchaseModal');
    if (modal) modal.style.display = 'none';
    document.getElementById('addStockPurchaseForm')?.reset();
}

async function saveStockPurchase(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();

    if (saveStockPurchase._inFlight) {
        console.warn('[saveStockPurchase] Already saving — duplicate event ignored');
        return;
    }
    saveStockPurchase._inFlight = true;

    const sel         = document.getElementById('spProductSelect');
    const productId   = sel?.value || null;
    const productName = sel?.options[sel.selectedIndex]?.dataset.name || '';
    const category    = sel?.options[sel.selectedIndex]?.dataset.cat  || '';
    const qty         = parseInt(document.getElementById('spQuantity')?.value  || 0);
    const unitCost    = parseFloat(document.getElementById('spUnitCost')?.value || 0);
    const status      = document.getElementById('spStatus')?.value || 'received';

    const releaseGuard = () => { saveStockPurchase._inFlight = false; };

    if (!productId) {
        releaseGuard();
        showNotification('Please select a product', 'warning'); return;
    }
    if (qty <= 0) {
        releaseGuard();
        showNotification('Quantity must be greater than 0', 'warning'); return;
    }
    if (unitCost <= 0) {
        releaseGuard();
        showNotification('Unit cost must be greater than 0', 'warning'); return;
    }

    const submitBtn = document.querySelector('#addStockPurchaseForm button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving…'; }

    const payload = {
        product_id:     parseInt(productId, 10),
        product_name:   productName,
        category:       category,
        supplier_name:  document.getElementById('spSupplierName')?.value  || '',
        supplier_phone: document.getElementById('spSupplierPhone')?.value || '',
        quantity:       qty,
        unit_cost:      unitCost,
        total_cost:     qty * unitCost,
        payment_method: document.getElementById('spPaymentMethod')?.value || 'Cash',
        status:         status,
        notes:          document.getElementById('spNotes')?.value         || '',
        purchase_date:  document.getElementById('spPurchaseDate')?.value  || new Date().toISOString(),
    };

    try {
        const res = await apiCall('/api/stock-purchases', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (!res || res.success === false) {
            throw new Error(res?.error || 'Server did not confirm the purchase was saved');
        }

        const stockNote = status === 'received'
            ? `+${qty} units added to inventory`
            : `inventory unchanged (status: ${status})`;

        await refreshInventoryUI();
        await loadStockPurchases();
        closeAddStockPurchaseModal();
        showNotification(`✓ Purchase saved — ${stockNote}`, 'success');

    } catch (err) {
        console.error('saveStockPurchase error:', err);
        showNotification('Error saving purchase: ' + err.message, 'error');
    } finally {
        saveStockPurchase._inFlight = false;
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Purchase'; }
    }
}

async function refreshInventoryUI() {
    try {
        if (typeof loadInventoryDashboard === 'function') {
            await loadInventoryDashboard();
        }
        if (typeof loadFullInventory === 'function' &&
            document.getElementById('inventory')?.classList.contains('active')) {
            await loadFullInventory();
        }
        if (typeof loadProducts === 'function' &&
            document.getElementById('products')?.classList.contains('active')) {
            await loadProducts();
        }
    } catch (_) { /* non-critical */ }
}

async function deleteStockPurchase(id) {
    const purchase = stockPurchasesData.find(p => String(p.id) === String(id));
    if (!purchase) { showNotification('Purchase record not found', 'error'); return; }

    const confirmMsg = `Delete purchase of ${purchase.quantity} × ${purchase.product_name}?\n\n` +
        `This will also deduct ${purchase.quantity} unit(s) from inventory ` +
        `(only if status was "received").`;
    if (!confirm(confirmMsg)) return;

    const delBtn = document.querySelector(`button[onclick="deleteStockPurchase('${id}')"]`);
    if (delBtn) { delBtn.disabled = true; delBtn.textContent = '…'; }

    try {
        await apiCall(`/api/stock-purchases/${id}`, { method: 'DELETE' });

        const stockNote = purchase.status === 'received'
            ? `${purchase.quantity} units removed from inventory`
            : 'inventory unchanged (was not received)';

        await refreshInventoryUI();
        await loadStockPurchases();
        showNotification(`✓ Purchase deleted — ${stockNote}`, 'success');

    } catch (err) {
        console.error('deleteStockPurchase error:', err);
        showNotification('Error deleting purchase: ' + err.message, 'error');
        if (delBtn) { delBtn.disabled = false; delBtn.textContent = '✕'; }
    }
}

// ─── Export stock purchases to CSV ──────────────────────────
function exportStockPurchasesCSV() {
    if (!stockPurchasesData.length) { showNotification('No data to export', 'warning'); return; }
    const rows = [['Product', 'Category', 'Supplier', 'Qty', 'Unit Cost (KSH)', 'Total Cost (KSH)', 'Payment', 'Status', 'Date']];
    stockPurchasesData.forEach(p => {
        rows.push([
            p.product_name, p.category, p.supplier_name,
            p.quantity, p.unit_cost, p.total_cost || (p.unit_cost * p.quantity),
            p.payment_method, p.status,
            parseDate(p.purchase_date || p.created_at).toLocaleDateString()
        ]);
    });
    downloadCSV(rows, 'stock-purchases');
}

// ═══════════════════════════════════════════════════════════════
//  NET REVENUE  =  Σ (sale_price - cogs_per_unit) × qty  −  expenses
// ═══════════════════════════════════════════════════════════════

async function initNetRevenue() {
    await populateNrMonthDropdown();
    await computeAndRenderNetRevenue();
}

// Populate the month dropdown from actual sale dates
async function populateNrMonthDropdown() {
    const sel = document.getElementById('nrMonthSelect');
    if (!sel) return;

    try {
        const res  = await apiCall('/api/sales');
        const data = res.success ? (res.data || []) : (Array.isArray(res) ? res : []);

        // Collect unique YYYY-MM strings — prefer server-computed fields
        const monthsSet = new Set();
        data.forEach(sale => {
            const sy = parseInt(sale.sales_year  || 0);
            const sm = parseInt(sale.sales_month || 0);
            if (sy && sm) {
                monthsSet.add(`${sy}-${String(sm).padStart(2, '0')}`);
            } else {
                const d = parseDate(sale.sales_date || sale.date || sale.created_at);
                if (!isNaN(d)) {
                    monthsSet.add(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
                }
            }
        });

        const months = Array.from(monthsSet).sort().reverse();

        const current = sel.value;
        sel.innerHTML = '<option value="all">📊 All Time</option>';
        months.forEach(m => {
            const [yr, mo] = m.split('-').map(Number);
            // Use UTC date so label doesn't shift timezone
            const label = new Date(Date.UTC(yr, mo - 1, 1))
                .toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = label;
            if (m === current) opt.selected = true;
            sel.appendChild(opt);
        });

        // Default to current UTC calendar month if available
        if (current === 'all' || !current) {
            const now = new Date();
            const thisMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
            if (monthsSet.has(thisMonth)) sel.value = thisMonth;
        }

    } catch (_) { /* silent — dropdown stays with just "All Time" */ }
}

function onNrMonthChange(value) {
    computeAndRenderNetRevenue(value);
}

// selectedMonth: 'all' | 'YYYY-MM'
async function computeAndRenderNetRevenue(selectedMonth) {
    selectedMonth = selectedMonth || document.getElementById('nrMonthSelect')?.value || 'all';
    try {
        set('nrBreakdownBody', '');
        const loadingRow = `<tr><td colspan="6" style="text-align:center;padding:24px;color:#888">
            <span style="display:inline-block;animation:spin 1s linear infinite;margin-right:8px">⟳</span>
            Calculating…</td></tr>`;
        const tbody = document.getElementById('nrBreakdownBody');
        if (tbody) tbody.innerHTML = loadingRow;

        // ── 1. Fetch products — CoGS lives in product.cost ──────────────────
        const cogsById   = {};
        const cogsByName = {};
        const priceById  = {};

        try {
            const products = await apiCall('/api/products');
            const list = Array.isArray(products) ? products : (products.data || []);
            list.forEach(p => {
                const costVal  = parseFloat(p.cost  || p.productCost || p.unit_cost || 0);
                const priceVal = parseFloat(p.price || 0);
                const idKey    = String(p.id);
                const nameKey  = (p.name || '').toLowerCase().trim();

                cogsById[idKey]     = costVal;
                priceById[idKey]    = priceVal;
                if (nameKey) cogsByName[nameKey] = costVal;
            });
        } catch (_) { console.warn('Could not fetch products for CoGS lookup'); }

        // Stock-purchase records override the product catalogue cost (most-recent wins)
        const sortedPurchases = [...stockPurchasesData].sort((a, b) =>
            parseDate(a.purchase_date || a.created_at || 0) -
            parseDate(b.purchase_date || b.created_at || 0)
        );
        sortedPurchases.forEach(p => {
            const cost    = parseFloat(p.unit_cost || 0);
            const idKey   = String(p.product_id   || '');
            const nameKey = (p.product_name || '').toLowerCase().trim();
            if (idKey   && cost > 0) cogsById[idKey]     = cost;
            if (nameKey && cost > 0) cogsByName[nameKey] = cost;
        });

        const resolveCogsUnit = (item) => {
            // 1. item.product_cost is embedded directly by your API — use it first
            const embedded = parseFloat(item.product_cost || item.cost || item.unit_cost || item.productCost || 0);
            if (embedded > 0) return embedded;

            // 2. Fall back to product catalogue / stock-purchase override maps
            const idKey   = String(item.product_id || item.id || '');
            const nameKey = (item.product_name || item.name || '').toLowerCase().trim();
            if (idKey   && cogsById[idKey]     !== undefined && cogsById[idKey]   > 0) return cogsById[idKey];
            if (nameKey && cogsByName[nameKey] !== undefined && cogsByName[nameKey] > 0) return cogsByName[nameKey];
            return 0;
        };

        // ── 2. Fetch sales ───────────────────────────────────────────────────
        let sales = [];
        try {
            const res = await apiCall('/api/sales');
            sales = res.success ? (res.data || []) : (Array.isArray(res) ? res : []);
        } catch (_) {}

        // ── 3. Populate sale items ───────────────────────────────────────────
        const salesWithItems = await Promise.all(sales.map(async (sale) => {
            if (Array.isArray(sale.items) && sale.items.length > 0) return sale;
            try {
                const r = await apiCall(`/api/sales/${sale.id}/items`);
                return { ...sale, items: r.success ? (r.data || []) : [] };
            } catch (_) {
                return { ...sale, items: [] };
            }
        }));

        // ── 4. Determine UTC-based filter boundaries ─────────────────────────
        const now = new Date();

        // UTC today midnight
        const todayStart = utcMidnight(now);

        // UTC week start (Sunday) — clamp to UTC month start if it crossed over
        const utcMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const weekStart = new Date(todayStart);
        weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay()); // back to Sunday
        if (weekStart < utcMonthStart) weekStart.setTime(utcMonthStart.getTime());

        const monthStart = utcMonthStart;

        let filterStart = null;
        let filterEnd   = null;
        let isMonthView = false;
        let monthLabel  = '';

        if (selectedMonth && selectedMonth !== 'all') {
            const [yr, mo] = selectedMonth.split('-').map(Number);
            filterStart = new Date(Date.UTC(yr, mo - 1, 1));
            filterEnd   = new Date(Date.UTC(yr, mo, 1) - 1); // last ms of month in UTC
            isMonthView = true;
            monthLabel  = filterStart.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });
        }

        // Update card labels
        if (isMonthView) {
            set('nrLabelToday', 'First Week of ' + monthLabel);
            set('nrSubToday',   'Week 1 gross profit');
            set('nrLabelWeek',  'Mid-Month ' + monthLabel);
            set('nrSubWeek',    'Weeks 2–3 gross profit');
            set('nrLabelMonth', monthLabel + ' Total');
            set('nrSubMonth',   'Full month gross profit');
        } else {
            set('nrLabelToday', "Today's Gross Profit");
            set('nrSubToday',   'Sales − CoGS today');
            set('nrLabelWeek',  "This Week's Gross Profit");
            set('nrSubWeek',    'Sales − CoGS this week');
            set('nrLabelMonth', "This Month's Gross Profit");
            set('nrSubMonth',   'Sales − CoGS this month');
        }

        // ── 5. Fetch and filter expenses ─────────────────────────────────────
        const PURCHASE_KEYWORDS = [
            'stock', 'purchase', 'inventory', 'restock', 'procurement',
            'goods', 'merchandise', 'product cost', 'buying', 'supplier',
            'wholesale', 'cogs', 'cost of goods'
        ];
        const isPurchaseEntry = (exp) => {
            const cat  = (exp.category    || '').toLowerCase();
            const desc = (exp.description || exp.name || exp.title || '').toLowerCase();
            return PURCHASE_KEYWORDS.some(k => cat.includes(k) || desc.includes(k));
        };

        let expenseTotal = 0;
        let rawExpenses  = [];
        try {
            const listRes = await apiCall('/api/expenses');
            rawExpenses = listRes.success
                ? (listRes.data || [])
                : (Array.isArray(listRes) ? listRes : []);
        } catch (_) {}

        if (rawExpenses.length > 0) {
            rawExpenses
                .filter(exp => !isPurchaseEntry(exp))
                .forEach(exp => {
                    const amt     = parseFloat(exp.amount || exp.total || 0);
                    const expDate = parseDate(exp.date || exp.expense_date || exp.created_at);
                    const inPeriod = !isMonthView
                        ? true
                        : (expDate >= filterStart && expDate <= filterEnd);
                    if (inPeriod) expenseTotal += amt;
                });
        } else {
            try {
                const expRes = await apiCall('/api/expenses/stats/summary');
                if (expRes.success && expRes.data) {
                    expenseTotal = isMonthView
                        ? Number(expRes.data.monthly || 0)
                        : Number(expRes.data.allTime || 0);
                }
            } catch (_) {}
        }

        // ── 6. Aggregate ─────────────────────────────────────────────────────
        let grossRevTotal = 0, cogsTotal = 0, grossProfitTotal = 0;
        let profitP1 = 0, profitP2 = 0, profitP3 = 0;
        let revP3    = 0;

        const breakdown = [];

        salesWithItems.forEach(sale => {
            // Use server-computed date fields (sales_month, sales_year, sales_day) which
            // already reflect the correct LOCAL date. Parsing sales_date as UTC would
            // shift dates by the server timezone offset (e.g. "2026-04-02T23:00:00Z"
            // is April 3rd in Nairobi but April 2nd in UTC — the server's sales_day=3
            // is the ground truth).
            const saleYear  = parseInt(sale.sales_year  || 0);
            const saleMonth = parseInt(sale.sales_month || 0); // 1-based
            const saleDay   = parseInt(sale.sales_day   || 0);

            // Fallback: parse timestamp only if server fields are absent
            let saleDateForComparison = null;
            if (!saleYear) {
                saleDateForComparison = parseDate(sale.sales_date || sale.date || sale.created_at);
            }

            // Month filter — use sales_month/sales_year when available
            if (isMonthView) {
                const [fyr, fmo] = selectedMonth.split('-').map(Number);
                if (saleYear) {
                    if (saleYear !== fyr || saleMonth !== fmo) return; // skip
                } else {
                    if (saleDateForComparison < filterStart || saleDateForComparison > filterEnd) return;
                }
            }

            // Sub-period bucketing
            const getSubPeriod = () => {
                if (!isMonthView) {
                    // "All Time" view — bucket by today/week/month using server fields
                    const now        = new Date();
                    const todayY     = now.getUTCFullYear(), todayM = now.getUTCMonth() + 1, todayD = now.getUTCDate();
                    const isToday    = saleYear ? (saleYear === todayY && saleMonth === todayM && saleDay === todayD)
                                                : saleDateForComparison >= todayStart;
                    const isThisWeek = saleYear ? (() => {
                        const sd = new Date(Date.UTC(saleYear, saleMonth - 1, saleDay));
                        return sd >= weekStart;
                    })() : saleDateForComparison >= weekStart;
                    const isThisMonth = saleYear ? (saleYear === todayY && saleMonth === todayM)
                                                 : saleDateForComparison >= monthStart;
                    return { p1: isToday, p2: isThisWeek, p3: isThisMonth };
                }
                // Month view — split by day-of-month
                const day = saleYear ? saleDay : saleDateForComparison.getUTCDate();
                return {
                    p1: day >= 1  && day <= 7,
                    p2: day >= 8  && day <= 21,
                    p3: true
                };
            };

            const { p1, p2, p3 } = getSubPeriod();
            const items = Array.isArray(sale.items) ? sale.items : [];

            if (items.length > 0) {
                items.forEach(item => {
                    const qty       = parseInt(item.quantity || 1);
                    const sellPrice = parseFloat(item.unit_price || item.price || 0);
                    const pid       = String(item.product_id || item.id || '');
                    const pname     = item.product_name || item.name || 'Unknown';
                    const cogsUnit  = resolveCogsUnit(item);

                    const revenue  = sellPrice * qty;
                    const itemCogs = cogsUnit  * qty;
                    const profit   = (sellPrice - cogsUnit) * qty;

                    grossRevTotal    += revenue;
                    cogsTotal        += itemCogs;
                    grossProfitTotal += profit;

                    if (p1) profitP1 += profit;
                    if (p2) profitP2 += profit;
                    if (p3) { profitP3 += profit; revP3 += revenue; }

                    const existing = breakdown.find(b => b.id === pid && b.name === pname);
                    if (existing) {
                        existing.revenue += revenue;
                        existing.cogs    += itemCogs;
                        existing.profit  += profit;
                        existing.qty     += qty;
                    } else {
                        breakdown.push({ id: pid, name: pname, revenue, cogs: itemCogs, profit, qty, cogsUnit, sellPrice });
                    }
                });
            } else {
                const amt        = parseFloat(sale.total_amount || 0);
                const saleProfit = parseFloat(sale.profit       || 0);
                const saleCogs   = amt - saleProfit;

                grossRevTotal    += amt;
                cogsTotal        += saleCogs;
                grossProfitTotal += saleProfit;

                if (p1) profitP1 += saleProfit;
                if (p2) profitP2 += saleProfit;
                if (p3) { profitP3 += saleProfit; revP3 += amt; }
            }
        });

        const netTotal = grossProfitTotal - expenseTotal;
        const netToday = profitP1;
        const netWeek  = profitP2;
        const netMonth = profitP3;

        const grossMarkup   = cogsTotal > 0 ? (grossProfitTotal / cogsTotal * 100) : (grossRevTotal > 0 ? 100 : 0);
        const netMarginPct  = grossRevTotal > 0 ? (netTotal / grossRevTotal * 100) : 0;

        // ── Render summary cards ─────────────────────────────────────────────
        set('nrGrossRevenue',   fmt(grossRevTotal));
        set('nrTotalCogs',      fmt(cogsTotal));
        set('nrGrossProfit',    fmt(grossProfitTotal));
        set('nrTotalExpenses',  fmt(expenseTotal));
        set('nrExpensesLabel',  isMonthView ? monthLabel + ' expenses' : 'All-time operating expenses');
        set('nrNetRevenue',     fmt(netTotal),       netTotal  >= 0 ? '#0ec96a' : '#e74c3c');
        set('nrGrossMargin',    grossMarkup.toFixed(1) + '% markup');
        set('nrNetMargin',      netMarginPct.toFixed(1) + '% net margin', netMarginPct >= 0 ? '#0ec96a' : '#e74c3c');

        set('nrNetToday',  fmt(netToday),  netToday  >= 0 ? '#0ec96a' : '#e74c3c');
        set('nrNetWeek',   fmt(netWeek),   netWeek   >= 0 ? '#0ec96a' : '#e74c3c');
        set('nrNetMonth',  fmt(netMonth),  netMonth  >= 0 ? '#0ec96a' : '#e74c3c');

        // ── Audit trail ──────────────────────────────────────────────────────
        const auditEl = document.getElementById('nrAuditContent');
        if (auditEl) {
            const salesCount = salesWithItems.filter(s => {
                if (!isMonthView) return true;
                const [fyr, fmo] = selectedMonth.split('-').map(Number);
                const sy = parseInt(s.sales_year  || 0);
                const sm = parseInt(s.sales_month || 0);
                if (sy) return sy === fyr && sm === fmo;
                const d = parseDate(s.sales_date || s.date || s.created_at);
                return d >= filterStart && d <= filterEnd;
            }).length;
            const itemsCount = breakdown.reduce((s, b) => s + b.qty, 0);
            const periodLabel = isMonthView ? monthLabel : 'All Time';
            auditEl.innerHTML = `
                <table class="nr-audit-table">
                    <tbody>
                        <tr class="nr-audit-section"><td colspan="3">GROSS REVENUE — ${periodLabel}</td></tr>
                        <tr><td>Total sales processed</td><td>${salesCount} sales</td><td>From /api/sales + /api/sales/:id/items</td></tr>
                        <tr><td>Total items sold</td><td>${itemsCount} units</td><td>Sum of all line-item quantities</td></tr>
                        <tr class="nr-audit-pos"><td><strong>Gross Revenue</strong></td><td><strong>${fmt(grossRevTotal)}</strong></td><td>Σ (unit_price × qty) across all items</td></tr>

                        <tr class="nr-audit-section"><td colspan="3">COST OF GOODS SOLD (CoGS)</td></tr>
                        <tr><td>CoGS source</td><td>product.cost field</td><td>Overridden by Stock Purchases unit_cost if present</td></tr>
                        <tr class="nr-audit-neg"><td><strong>Total CoGS</strong></td><td><strong>${fmt(cogsTotal)}</strong></td><td>Σ (product.cost × qty) across all items</td></tr>

                        <tr class="nr-audit-section"><td colspan="3">GROSS PROFIT</td></tr>
                        <tr class="nr-audit-pos"><td><strong>Gross Profit</strong></td><td><strong>${fmt(grossProfitTotal)}</strong></td><td>${fmt(grossRevTotal)} − ${fmt(cogsTotal)}</td></tr>
                        <tr><td>Gross Markup</td><td>${grossMarkup.toFixed(2)}%</td><td>${fmt(grossProfitTotal)} ÷ ${fmt(cogsTotal)} × 100</td></tr>

                        <tr class="nr-audit-section"><td colspan="3">OPERATING EXPENSES — ${periodLabel}</td></tr>
                        <tr class="nr-audit-neg"><td><strong>Expenses (${periodLabel})</strong></td><td><strong>${fmt(expenseTotal)}</strong></td><td>${isMonthView ? 'Expenses dated within ' + monthLabel + ' (stock purchases excluded)' : 'All expenses ever (stock purchases excluded)'}</td></tr>

                        <tr class="nr-audit-section"><td colspan="3">NET REVENUE (bottom line)</td></tr>
                        <tr class="${netTotal >= 0 ? 'nr-audit-pos' : 'nr-audit-neg'}">
                            <td><strong>NET REVENUE</strong></td>
                            <td><strong>${fmt(netTotal)}</strong></td>
                            <td>${fmt(grossProfitTotal)} − ${fmt(expenseTotal)} (${periodLabel} expenses)</td>
                        </tr>
                        <tr><td>Net Margin</td><td>${netMarginPct.toFixed(2)}%</td><td>${fmt(netTotal)} ÷ ${fmt(grossRevTotal)} × 100</td></tr>

                        <tr class="nr-audit-section"><td colspan="3">TOTAL GROSS PROFITS</td></tr>
                        <tr class="${netToday >= 0 ? 'nr-audit-pos' : 'nr-audit-neg'}"><td>${isMonthView ? 'Week 1 Gross Profit' : "Today's Gross Profit"}</td><td>${fmt(netToday)}</td><td>${isMonthView ? 'Days 1–7 of ' + monthLabel : 'Items sold today × (sell price − cost)'}</td></tr>
                        <tr class="${netWeek >= 0 ? 'nr-audit-pos' : 'nr-audit-neg'}"><td>${isMonthView ? 'Mid-Month Gross Profit' : "This Week's Gross Profit"}</td><td>${fmt(netWeek)}</td><td>${isMonthView ? 'Days 8–21 of ' + monthLabel : 'Items sold this week × (sell price − cost)'}</td></tr>
                        <tr class="${netMonth >= 0 ? 'nr-audit-pos' : 'nr-audit-neg'}"><td>${isMonthView ? monthLabel + ' Total Gross Profit' : "This Month's Gross Profit"}</td><td>${fmt(netMonth)}</td><td>${isMonthView ? 'Full month: ' + monthLabel : 'Items sold this month × (sell price − cost)'}</td></tr>
                    </tbody>
                </table>`;
        }

        renderNetRevenueBreakdown(breakdown.sort((a, b) => b.profit - a.profit));
        pushNetRevenueToRevenueDashboard({ netTotal, netToday, netWeek, netMonth, grossProfitTotal, cogsTotal });

    } catch (err) {
        console.error('computeAndRenderNetRevenue error:', err);
    }
}

function buildCogsMap() { return {}; }

function pushNetRevenueToRevenueDashboard(vals) {
    const safeSet = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    safeSet('netRevenue',        fmt(vals.netTotal));
    safeSet('monthlyNetRevenue', fmt(vals.netMonth));
    safeSet('weeklyNetRevenue',  fmt(vals.netWeek));
    safeSet('nrGrossProfitDash', fmt(vals.grossProfitTotal));
    safeSet('nrCogsDash',        fmt(vals.cogsTotal));
}

async function updateCogsInNetRevenue() {
    const activeSection = document.querySelector('.content-section.active')?.id;
    if (activeSection === 'net-revenue') {
        await computeAndRenderNetRevenue();
    }
    await computeAndRenderNetRevenue();
}

function renderNetRevenueBreakdown(breakdown) {
    const tbody = document.getElementById('nrBreakdownBody');
    if (!tbody) return;

    if (!breakdown.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#888">No sales data with CoGS available yet</td></tr>';
        return;
    }

    tbody.innerHTML = breakdown.slice(0, 50).map(b => {
        const markup = b.cogs > 0 ? (b.profit / b.cogs * 100) : (b.revenue > 0 ? 100 : 0);
        return `<tr>
            <td><strong>${b.name}</strong></td>
            <td>${b.qty}</td>
            <td>${fmt(b.revenue)}</td>
            <td>${fmt(b.cogs)}</td>
            <td class="${b.profit >= 0 ? 'nr-positive' : 'nr-negative'}">${fmt(b.profit)}</td>
            <td class="${markup >= 0 ? 'nr-positive' : 'nr-negative'}">${markup.toFixed(1)}%</td>
        </tr>`;
    }).join('');
}

// ═══════════════════════════════════════════════════════════════
//  SIDEBAR MENU ITEMS
// ═══════════════════════════════════════════════════════════════

function injectSidebarItems() {
    const sidebar = document.querySelector('.sidebar-menu');
    if (!sidebar || document.querySelector('[data-section="stock-purchases"]')) return;

    const inventoryItem = sidebar.querySelector('[data-section="inventory"]');
    const spItem = document.createElement('li');
    spItem.dataset.section = 'stock-purchases';
    spItem.innerHTML = `<span>Stock Purchases</span>`;
    spItem.addEventListener('click', () => switchSection('stock-purchases'));
    if (inventoryItem) inventoryItem.after(spItem);
    else sidebar.appendChild(spItem);

    const revenueItem = sidebar.querySelector('[data-section="revenue"]');
    const nrItem = document.createElement('li');
    nrItem.dataset.section = 'net-revenue';
    nrItem.innerHTML = `<span>Net Revenue</span>`;
    nrItem.addEventListener('click', () => switchSection('net-revenue'));
    if (revenueItem) revenueItem.after(nrItem);
    else sidebar.appendChild(nrItem);
}

// ═══════════════════════════════════════════════════════════════
//  DOM SECTIONS
// ═══════════════════════════════════════════════════════════════

function injectSections() {
    const container = (
        document.querySelector('.main-content')   ||
        document.querySelector('#main-content')   ||
        document.querySelector('.content')        ||
        document.querySelector('#content')        ||
        document.querySelector('.content-wrapper')||
        document.querySelector('.content-section')?.parentElement ||
        document.body
    );

    if (!document.getElementById('stock-purchases')) {
        container.insertAdjacentHTML('beforeend', stockPurchasesSectionHTML());
    }
    if (!document.getElementById('net-revenue')) {
        container.insertAdjacentHTML('beforeend', netRevenueSectionHTML());
    }
    if (!document.getElementById('addStockPurchaseModal')) {
        document.body.insertAdjacentHTML('beforeend', addStockPurchaseModalHTML());
    }
}

// ═══════════════════════════════════════════════════════════════
//  HTML TEMPLATES
// ═══════════════════════════════════════════════════════════════

function stockPurchasesSectionHTML() {
    return `
<section id="stock-purchases" class="content-section sp-section">
  <div class="sp-header">
    <div>
      <h2 class="sp-title">📦 Stock Purchases</h2>
      <p class="sp-subtitle">Track CoGS — every unit bought, its cost, and supplier</p>
    </div>
    <div class="sp-header-actions">
      <button class="sp-btn sp-btn-primary" onclick="showAddStockPurchaseModal()">+ New Purchase</button>
      <button class="sp-btn sp-btn-secondary" onclick="exportStockPurchasesCSV()">⬇ Export CSV</button>
    </div>
  </div>

  <!-- Stats -->
  <div class="sp-stats-grid">
    <div class="sp-stat-card sp-stat-blue">
      <div class="sp-stat-label">Total Spend</div>
      <div class="sp-stat-value" id="spTotalCost">KSH 0.00</div>
      <div class="sp-stat-sub" id="spTotalItems">0 entries</div>
    </div>
    <div class="sp-stat-card sp-stat-orange">
      <div class="sp-stat-label">Today's Spend</div>
      <div class="sp-stat-value" id="spTodayCost">KSH 0.00</div>
    </div>
    <div class="sp-stat-card sp-stat-purple">
      <div class="sp-stat-label">This Week</div>
      <div class="sp-stat-value" id="spWeekCost">KSH 0.00</div>
    </div>
    <div class="sp-stat-card sp-stat-green">
      <div class="sp-stat-label">This Month</div>
      <div class="sp-stat-value" id="spMonthCost">KSH 0.00</div>
    </div>
    <div class="sp-stat-card sp-stat-gray">
      <div class="sp-stat-label">Total Units Bought</div>
      <div class="sp-stat-value" id="spTotalQty">0 units</div>
    </div>
  </div>

  <!-- Search -->
  <div class="sp-search-bar">
    <input type="text" class="sp-search-input" placeholder="Search by product, supplier or category…"
           oninput="searchStockPurchases(this.value)" />
  </div>

  <!-- Table -->
  <div class="sp-table-wrapper">
    <div id="stockPurchasesLoading" style="display:none;text-align:center;padding:20px;color:#888">Loading…</div>
    <table class="sp-table">
      <thead>
        <tr>
          <th>Product</th><th>Supplier</th><th>Qty</th>
          <th>Unit Cost</th><th>Total Cost</th><th>Payment</th>
          <th>Status</th><th>Date</th><th></th>
        </tr>
      </thead>
      <tbody id="stockPurchasesTableBody">
        <tr><td colspan="9" class="sp-empty">Loading stock purchases…</td></tr>
      </tbody>
    </table>
  </div>

  <!-- Pagination -->
  <div class="sp-pagination">
    <button id="prevSpBtn" class="sp-btn sp-btn-secondary" onclick="prevStockPurchasesPage()">← Prev</button>
    <span id="spPageInfo" class="sp-page-info">Page 1</span>
    <button id="nextSpBtn" class="sp-btn sp-btn-secondary" onclick="nextStockPurchasesPage()">Next →</button>
  </div>
</section>`;
}

function netRevenueSectionHTML() {
    return `
<section id="net-revenue" class="content-section sp-section">
  <div class="sp-header">
    <div>
      <h2 class="sp-title">📊 Net Revenue</h2>
      <p class="sp-subtitle">Net Revenue = (Sell Price − CoGS) × Qty − Expenses</p>
    </div>
    <div class="sp-header-actions" style="align-items:center;flex-wrap:wrap;gap:10px">
      <div class="nr-month-picker">
        <label class="nr-month-label" for="nrMonthSelect">📅 View Month</label>
        <select id="nrMonthSelect" class="sp-input nr-month-select" onchange="onNrMonthChange(this.value)">
          <option value="all">All Time</option>
        </select>
      </div>
      <button class="sp-btn sp-btn-primary" onclick="computeAndRenderNetRevenue(document.getElementById('nrMonthSelect').value)">↻ Refresh</button>
    </div>
  </div>

  <!-- Top KPI cards -->
  <div class="sp-stats-grid nr-grid">
    <div class="sp-stat-card sp-stat-blue">
      <div class="sp-stat-label">Gross Revenue</div>
      <div class="sp-stat-value" id="nrGrossRevenue">KSH 0.00</div>
      <div class="sp-stat-sub">Total sales</div>
    </div>
    <div class="sp-stat-card sp-stat-orange">
      <div class="sp-stat-label">Total CoGS</div>
      <div class="sp-stat-value" id="nrTotalCogs">KSH 0.00</div>
      <div class="sp-stat-sub">Cost of goods sold</div>
    </div>
    <div class="sp-stat-card sp-stat-purple">
      <div class="sp-stat-label">Gross Profit</div>
      <div class="sp-stat-value" id="nrGrossProfit">KSH 0.00</div>
      <div class="sp-stat-sub" id="nrGrossMargin">0.0% markup</div>
    </div>
    <div class="sp-stat-card sp-stat-red">
      <div class="sp-stat-label">Total Expenses</div>
      <div class="sp-stat-value" id="nrTotalExpenses">KSH 0.00</div>
      <div class="sp-stat-sub" id="nrExpensesLabel">All operating expenses</div>
    </div>
    <div class="sp-stat-card nr-net-card">
      <div class="sp-stat-label">NET REVENUE</div>
      <div class="sp-stat-value nr-big" id="nrNetRevenue">KSH 0.00</div>
      <div class="sp-stat-sub" id="nrNetMargin">0.0% net margin</div>
    </div>
  </div>

  <!-- Time-window gross profit cards -->
  <div class="nr-time-grid">
    <div class="nr-time-card">
      <div class="nr-time-label" id="nrLabelToday">Today's Gross Profit</div>
      <div class="nr-time-value" id="nrNetToday">KSH 0.00</div>
      <div class="nr-time-sub" id="nrSubToday">Sales − CoGS today</div>
    </div>
    <div class="nr-time-card">
      <div class="nr-time-label" id="nrLabelWeek">This Week's Gross Profit</div>
      <div class="nr-time-value" id="nrNetWeek">KSH 0.00</div>
      <div class="nr-time-sub" id="nrSubWeek">Sales − CoGS this week</div>
    </div>
    <div class="nr-time-card">
      <div class="nr-time-label" id="nrLabelMonth">This Month's Gross Profit</div>
      <div class="nr-time-value" id="nrNetMonth">KSH 0.00</div>
      <div class="nr-time-sub" id="nrSubMonth">Sales − CoGS this month</div>
    </div>
  </div>

  <!-- Formula explainer -->
  <div class="nr-formula-box">
    <span class="nr-formula-label">Formula:</span>
    <code>Net Revenue = Σ [ (Sell Price − CoGS per unit) × Qty ] − Total Expenses</code>
  </div>

  <!-- Calculation audit trail -->
  <div id="nrAuditBox" class="nr-audit-box">
    <div class="nr-audit-title">📋 Net Revenue Calculation Audit</div>
    <div id="nrAuditContent" class="nr-audit-content">Click Refresh to load audit trail.</div>
  </div>

  <!-- Per-product breakdown (hidden by default) -->
  <!--<div class="sp-table-wrapper" style="margin-top:24px">
    <h3 style="padding:16px 20px 0;font-size:15px;color:var(--sp-text)">Product Profitability Breakdown</h3>
    <table class="sp-table">
      <thead>
        <tr>
          <th>Product</th><th>Units Sold</th><th>Revenue</th>
          <th>CoGS</th><th>Gross Profit</th><th>Markup % <small style="font-weight:400;text-transform:none">(Profit÷CoGS)</small></th>
        </tr>
      </thead>
      <tbody id="nrBreakdownBody">
        <tr><td colspan="6" style="text-align:center;padding:20px;color:#888">Click Refresh to load data</td></tr>
      </tbody>
    </table>
  </div>-->
</section>`;
}

function addStockPurchaseModalHTML() {
    return `
<div id="addStockPurchaseModal" class="sp-modal-overlay" style="display:none">
  <div class="sp-modal">
    <div class="sp-modal-header">
      <h3>Record Stock Purchase</h3>
      <button class="sp-modal-close" onclick="closeAddStockPurchaseModal()">✕</button>
    </div>
    <form id="addStockPurchaseForm" autocomplete="off" onsubmit="saveStockPurchase(event); return false;">

      <div class="sp-form-row">
        <div class="sp-form-group">
          <label>Product *</label>
          <select id="spProductSelect" class="sp-input" required>
            <option value="">Loading products…</option>
          </select>
          <div id="spStockPreview" class="sp-stock-preview" style="display:none"></div>
        </div>
        <div class="sp-form-group">
          <label>Supplier Name</label>
          <input id="spSupplierName" class="sp-input" placeholder="e.g. Safaricom Distributor" />
        </div>
      </div>

      <div class="sp-form-row">
        <div class="sp-form-group">
          <label>Supplier Phone</label>
          <input id="spSupplierPhone" class="sp-input" placeholder="0700 000 000" />
        </div>
        <div class="sp-form-group">
          <label>Payment Method</label>
          <select id="spPaymentMethod" class="sp-input">
            <option>Cash</option><option>M-Pesa</option>
            <option>Bank Transfer</option><option>Card</option><option>Credit</option>
          </select>
        </div>
      </div>

      <div class="sp-form-row">
        <div class="sp-form-group">
          <label>Quantity (units) *</label>
          <input id="spQuantity" type="number" min="1" class="sp-input" required
                 oninput="recalcTotalCost(); const _o=document.getElementById('spProductSelect'); if(_o&&_o.selectedIndex>0) updateStockPreview(_o.options[_o.selectedIndex]);"
                 placeholder="e.g. 10" />
        </div>
        <div class="sp-form-group">
          <label>Unit Cost (KSH) *</label>
          <input id="spUnitCost" type="number" min="0" step="0.01" class="sp-input" required
                 oninput="recalcTotalCost()" placeholder="e.g. 4500.00" />
        </div>
      </div>

      <div class="sp-total-preview">
        Total Cost: <strong id="spTotalCostPreview">KSH 0.00</strong>
      </div>

      <div class="sp-form-row">
        <div class="sp-form-group">
          <label>Status</label>
          <select id="spStatus" class="sp-input">
            <option value="received">Received</option>
            <option value="pending">Pending Delivery</option>
            <option value="returned">Returned</option>
          </select>
        </div>
        <div class="sp-form-group">
          <label>Purchase Date</label>
          <input id="spPurchaseDate" type="datetime-local" class="sp-input" />
        </div>
      </div>

      <div class="sp-form-group">
        <label>Notes</label>
        <textarea id="spNotes" class="sp-input" rows="2" placeholder="Invoice number, reference, etc."></textarea>
      </div>

      <div class="sp-modal-footer">
        <button type="button" class="sp-btn sp-btn-secondary" onclick="closeAddStockPurchaseModal()">Cancel</button>
        <button type="button" class="sp-btn sp-btn-primary" onclick="saveStockPurchase(event)">Save Purchase</button>
      </div>
    </form>
  </div>
</div>`;
}

function ensureStockPurchaseModal() {
    if (!document.getElementById('addStockPurchaseModal')) {
        document.body.insertAdjacentHTML('beforeend', addStockPurchaseModalHTML());
    }
}

// ═══════════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════════

function injectStyles() {
    if (document.getElementById('sp-styles')) return;
    const style = document.createElement('style');
    style.id = 'sp-styles';
    style.textContent = `
/* ── Variables ────────────────────────── */
:root {
  --sp-bg:       #f4f6fb;
  --sp-surface:  #ffffff;
  --sp-border:   #e2e8f0;
  --sp-text:     #1e293b;
  --sp-muted:    #64748b;
  --sp-blue:     #3b82f6;
  --sp-green:    #10b981;
  --sp-orange:   #f59e0b;
  --sp-purple:   #8b5cf6;
  --sp-red:      #ef4444;
  --sp-gray:     #94a3b8;
  --sp-radius:   10px;
  --sp-shadow:   0 2px 12px rgba(0,0,0,.07);
}

/* ── Section shell ────────────────────── */
.sp-section {
  padding: 28px 32px;
  background: var(--sp-bg);
  box-sizing: border-box;
  overflow-y: auto;
}
.sp-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}
.sp-title  { font-size: 22px; font-weight: 700; color: var(--sp-text); margin: 0; }
.sp-subtitle { font-size: 13px; color: var(--sp-muted); margin: 4px 0 0; }
.sp-header-actions { display: flex; gap: 10px; }

/* ── Stat cards ───────────────────────── */
.sp-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
.nr-grid { grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); }
.sp-stat-card {
  background: var(--sp-surface);
  border-radius: var(--sp-radius);
  box-shadow: var(--sp-shadow);
  padding: 18px 20px;
  border-left: 4px solid transparent;
  transition: transform .15s;
}
.sp-stat-card:hover { transform: translateY(-2px); }
.sp-stat-blue   { border-left-color: var(--sp-blue); }
.sp-stat-orange { border-left-color: var(--sp-orange); }
.sp-stat-purple { border-left-color: var(--sp-purple); }
.sp-stat-green  { border-left-color: var(--sp-green); }
.sp-stat-gray   { border-left-color: var(--sp-gray); }
.sp-stat-red    { border-left-color: var(--sp-red); }
.nr-net-card    { border-left-color: var(--sp-green); background: #f0fdf4; }

.sp-stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: .8px; color: var(--sp-muted); }
.sp-stat-value { font-size: 20px; font-weight: 700; color: var(--sp-text); margin: 6px 0 4px; }
.sp-stat-sub   { font-size: 11px; color: var(--sp-muted); }
.nr-big        { font-size: 26px; color: var(--sp-green); }

/* ── Time-window row ──────────────────── */
.nr-time-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}
.nr-time-card {
  background: var(--sp-surface);
  border-radius: var(--sp-radius);
  box-shadow: var(--sp-shadow);
  padding: 16px 20px;
  text-align: center;
}
.nr-time-label { font-size: 12px; color: var(--sp-muted); text-transform: uppercase; letter-spacing: .6px; }
.nr-time-value { font-size: 22px; font-weight: 700; margin-top: 8px; }

/* ── Formula box ──────────────────────── */
.nr-formula-box {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 14px 18px;
  font-size: 13px;
  color: #1e40af;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
}
.nr-formula-label { font-weight: 700; }
.nr-formula-note  { font-size: 11px; color: var(--sp-muted); flex-basis: 100%; }
.nr-formula-box code { background: #dbeafe; padding: 4px 8px; border-radius: 5px; font-size: 13px; }

/* ── Profit colours ───────────────────── */
.nr-positive { color: var(--sp-green); font-weight: 600; }
.nr-negative { color: var(--sp-red);   font-weight: 600; }

/* ── Search ───────────────────────────── */
.sp-search-bar { margin-bottom: 16px; }
.sp-search-input {
  width: 100%;
  max-width: 420px;
  padding: 10px 14px;
  border: 1px solid var(--sp-border);
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color .2s;
}
.sp-search-input:focus { border-color: var(--sp-blue); }

/* ── Table ────────────────────────────── */
.sp-table-wrapper {
  background: var(--sp-surface);
  border-radius: var(--sp-radius);
  box-shadow: var(--sp-shadow);
  overflow: auto;
  margin-bottom: 16px;
}
.sp-table { width: 100%; border-collapse: collapse; font-size: 10px; }
.sp-table thead { background: #f8fafc; }
.sp-table th    { padding: 12px 16px; text-align: left; font-size: 12px;
                  font-weight: 600; color: var(--sp-muted); text-transform: uppercase;
                  letter-spacing: .5px; border-bottom: 1px solid var(--sp-border); }
.sp-table td    { padding: 13px 16px; border-bottom: 1px solid #f1f5f9; color: var(--sp-text); }
.sp-table tbody tr:hover { background: #f8fafc; }
.sp-table tbody tr:last-child td { border-bottom: none; }
.sp-empty       { text-align: center; padding: 40px !important; color: var(--sp-muted); }

/* ── Badge ────────────────────────────── */
.sp-badge { display: inline-block; padding: 3px 10px; border-radius: 20px;
            font-size: 11px; font-weight: 600; text-transform: capitalize; }
.sp-badge-success { background: #d1fae5; color: #065f46; }
.sp-badge-warn    { background: #fef3c7; color: #92400e; }

/* ── Buttons ──────────────────────────── */
.sp-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 16px; border-radius: 7px; font-size: 13px;
  font-weight: 600; cursor: pointer; border: none; transition: all .15s;
}
.sp-btn-primary   { background: var(--sp-blue); color: #fff; }
.sp-btn-primary:hover   { background: #2563eb; }
.sp-btn-secondary { background: #f1f5f9; color: var(--sp-text); border: 1px solid var(--sp-border); }
.sp-btn-secondary:hover { background: #e2e8f0; }
.sp-btn-danger    { background: #fee2e2; color: var(--sp-red); }
.sp-btn-danger:hover    { background: #fecaca; }
.sp-btn-sm { padding: 5px 10px; font-size: 12px; }

/* ── Pagination ───────────────────────── */
.sp-pagination { display: flex; align-items: center; gap: 14px; justify-content: center; padding: 8px 0; }
.sp-page-info  { font-size: 13px; color: var(--sp-muted); }

/* ── Modal ────────────────────────────── */
.sp-modal-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; backdrop-filter: blur(2px);
}
.sp-modal {
  background: var(--sp-surface);
  border-radius: 14px;
  padding: 32px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,.18);
}
.sp-modal-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px;
}
.sp-modal-header h3 { margin: 0; font-size: 18px; color: var(--sp-text); }
.sp-modal-close {
  background: none; border: none; font-size: 18px;
  cursor: pointer; color: var(--sp-muted); line-height: 1;
}
.sp-modal-close:hover { color: var(--sp-red); }
.sp-form-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.sp-form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.sp-form-group label { font-size: 12px; font-weight: 600; color: var(--sp-muted);
                        text-transform: uppercase; letter-spacing: .5px; }
.sp-input {
  padding: 10px 12px; border: 1px solid var(--sp-border);
  border-radius: 7px; font-size: 14px; color: var(--sp-text);
  outline: none; transition: border-color .2s; width: 100%; box-sizing: border-box;
}
.sp-input:focus { border-color: var(--sp-blue); }
.sp-total-preview {
  background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;
  padding: 12px 16px; font-size: 14px; color: #1e40af; margin-bottom: 16px;
}
.sp-stock-preview {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.6;
}
.sp-modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }

/* ── Month picker ─────────────────────────── */
.nr-month-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}
.nr-month-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--sp-muted);
  white-space: nowrap;
}
.nr-month-select {
  min-width: 180px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  border: 1.5px solid var(--sp-blue);
  border-radius: 7px;
  color: var(--sp-text);
  background: #fff;
  cursor: pointer;
}
.nr-month-select:focus { outline: none; border-color: #2563eb; }

/* ── Time card subtitle ───────────────────── */
.nr-time-sub { font-size: 11px; color: var(--sp-muted); margin-top: 4px; }

/* ── Audit box ────────────────────────────── */
.nr-audit-box {
  background: var(--sp-surface);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius);
  box-shadow: var(--sp-shadow);
  margin-bottom: 20px;
  overflow: hidden;
}
.nr-audit-title {
  background: #f8fafc;
  padding: 12px 18px;
  font-size: 13px;
  font-weight: 700;
  color: var(--sp-text);
  border-bottom: 1px solid var(--sp-border);
}
.nr-audit-content { padding: 0; }
.nr-audit-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.nr-audit-table th {
  padding: 9px 14px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: var(--sp-muted);
  text-transform: uppercase;
  letter-spacing: .5px;
  background: #f8fafc;
  border-bottom: 1px solid var(--sp-border);
}
.nr-audit-table td {
  padding: 8px 14px;
  border-bottom: 1px solid #f1f5f9;
  color: var(--sp-text);
  vertical-align: top;
}
.nr-audit-table td:nth-child(2) { font-family: monospace; font-size: 13px; white-space: nowrap; }
.nr-audit-table td:nth-child(3) { color: var(--sp-muted); font-size: 12px; }
.nr-audit-section td {
  background: #f1f5f9;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .8px;
  color: var(--sp-muted);
  padding: 6px 14px;
}
.nr-audit-pos td:nth-child(2) { color: var(--sp-green); }
.nr-audit-neg td:nth-child(2) { color: var(--sp-red); }

@media (max-width: 640px) {
  .sp-section  { padding: 16px; }
  .sp-form-row { grid-template-columns: 1fr; }
  .nr-time-grid { grid-template-columns: 1fr; }
  .nr-audit-table td:nth-child(3) { display: none; }
}

.main-content #stock-purchases,
.main-content #net-revenue,
.content-wrapper #stock-purchases,
.content-wrapper #net-revenue,
#main-content #stock-purchases,
#main-content #net-revenue {
  position: relative;
  width: 100%;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}`;
    document.head.appendChild(style);
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

function fmt(val) {
    return `KSH ${Number(val || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function set(id, text, color) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    if (color) el.style.color = color;
}
function downloadCSV(rows, filename) {
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${filename}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
}

let _productCache = null;
function getCachedProducts()  { return _productCache; }
function setCachedProducts(p) { _productCache = p; }

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    injectStyles();
    injectSections();
    injectSidebarItems();
    updateCogsInNetRevenue();
});