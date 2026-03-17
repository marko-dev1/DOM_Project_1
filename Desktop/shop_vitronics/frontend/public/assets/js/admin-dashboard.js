
let currentUser = null;
let editingProductId = null;
let inventoryData = [];
let filteredInventory = [];

let allServicesData = [];
let servicesPage = 1;
const servicesLimit = 6;
let servicesTotal = 0;

// initialize sales data structure from backend
let salesManager = {
    salesData: [], 
    dailySales: {}, 
    weeklySales: {}, 
    monthlySales: {} 
};
let cart = [];
// Sales pagination state 
let salesPage = 1;
let salesLimit = 6;
let salesTotal = 0;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    setupEventListeners();
    loadInventoryDashboard(); 
});

function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'admin-login.html';
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUser = payload;

        const adminName = payload.username || payload.name || payload.email || "Admin";
        document.getElementById('adminName').textContent = adminName.split("@")[0];

        
        if (payload.role === 'super_admin') {
            document.getElementById('adminsSection').style.display = 'block';
            document.getElementById('addAdminSection').style.display = 'block';
        }
    } catch (error) {
        console.error('Invalid token:', error);
        logout();
    }
}

function setupEventListeners() {
    // Sidebar menu
    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        if (item.dataset.section) {
            item.addEventListener('click', () => switchSection(item.dataset.section));
        }
    });

    // Forms
    document.getElementById('addAdminForm')?.addEventListener('submit', handleAddAdmin);
    document.getElementById('productForm')?.addEventListener('submit', handleProductSubmit);

    // Load initial data
    loadDashboardStats();
    loadProducts();
    loadOrders();
    loadUsers();

    if (currentUser?.role === 'super_admin') {
        loadAdmins();
    }
    startAutoRefresh();
}

function switchSection(sectionName) {
    // Update active menu item
    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // Show selected section
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName).classList.add('active');

    // Refresh section data
    switch (sectionName) {
        case 'products':
            loadProducts();
            break;
        case 'inventory':
            loadFullInventory();
            break;
        case 'sales':
            initializeSales();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'users':
            loadUsers();
            break;
        case 'admins':
            loadAdmins();
            break;
        case 'expenses':
            if (typeof loadExpenses === 'function') {
                loadExpenses();
            }
            break;
        case 'revenue':
            initializeRevenue();
            break;
        case 'dashboard':
            loadDashboardStats();
            loadInventoryDashboard();
            break;
    }
}

// Enhanced API Call function
async function apiCall(url, options = {}) {
    const token = localStorage.getItem('adminToken');

    if (!token) {
        console.error('No adminToken found');
        logout();
        throw new Error('No authentication token found');
    }

    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    };
    if (options.body instanceof FormData) {
        delete defaultOptions.headers['Content-Type'];
    }

    try {
        const response = await fetch(url, { ...defaultOptions, ...options });

        // console.log(`📡 Response: ${response.status} for ${url}`);

        if (response.status === 401) {
            console.error(' 401 Unauthorized');
            logout();
            throw new Error('Authentication failed');
        }

        if (response.status === 404) {
            console.error(`Error 404 Not Found: ${url}`);
            throw new Error(`API endpoint not found: ${url}`);
        }

        const responseText = await response.text();
        let responseData;

        try {
            responseData = responseText ? JSON.parse(responseText) : {};
        } catch {
            responseData = { message: responseText || 'Invalid JSON' };
        }

        if (!response.ok) {
            throw new Error(responseData.message || responseData.error || `Request failed: ${response.status}`);
        }

        return responseData;
    } catch (error) {
        console.error(` API Call failed for ${url}:`, error);
        throw error;
    }
}

// Global wrapper functions for expenses module
// These ensure modal functions are available globally even if expenses.js loads asynchronously
let expenseModuleRetries = 0;
const MAX_EXPENSE_RETRIES = 5;

function showExpenseModal() {
    if (typeof window.expenseShowModal === 'function') {
        window.expenseShowModal();
        expenseModuleRetries = 0;
    } else if (expenseModuleRetries < MAX_EXPENSE_RETRIES) {
        console.warn(`⚠️ Expense modal not ready. Retry ${expenseModuleRetries + 1}/${MAX_EXPENSE_RETRIES}`);
        expenseModuleRetries++;
        setTimeout(() => {
            showExpenseModal();  // Retry
        }, 200);
    } else {
        console.error('Expense module failed to load after retries');
        alert('Expense module is not available. Please refresh the page and try again.');
    }
}

function editExpense(id) {
    if (typeof window.expenseEditExpense === 'function') {
        window.expenseEditExpense(id);
    } else {
        console.warn('⚠️ Edit expense function not ready');
        alert('Please wait for the expense module to load and try again.');
    }
}

function confirmDelete(id) {
    if (typeof window.expenseConfirmDelete === 'function') {
        window.expenseConfirmDelete(id);
    } else {
        console.warn('⚠️ Confirm delete function not ready');
        alert('Please wait for the expense module to load and try again.');
    }
}

function exportToCSV() {
    if (typeof window.expenseExportToCSV === 'function') {
        window.expenseExportToCSV();
    } else {
        console.warn('⚠️ Export function not ready');
        alert('Please wait for the expense module to load and try again.');
    }
}

function printReport() {
    if (typeof window.expensePrintReport === 'function') {
        window.expensePrintReport();
    } else {
        console.warn('⚠️ Print function not ready');
        alert('Please wait for the expense module to load and try again.');
    }
}

// Dashboard Stats
async function loadDashboardStats() {
    try {
        // console.log(' Loading dashboard stats...');

        // Load products
        const products = await apiCall('/api/products');
        const productsCount = Array.isArray(products) ? products.length : 0;
        document.getElementById('totalProducts').textContent = productsCount;

        // Load users
        try {
            const users = await apiCall('/api/users');
            const usersCount = Array.isArray(users) ? users.length : 0;
            document.getElementById('totalUsers').textContent = usersCount;
        } catch (error) {
            console.warn('⚠️ Could not load users:', error.message);
            document.getElementById('totalUsers').textContent = '0';
        }

        // Calculate pending orders
        const orders = await apiCall('/api/orders');
        const pendingOrdersCount = Array.isArray(orders) ?
            orders.filter(order => order.status === 'pending').length : 0;
        document.getElementById('pendingOrders').textContent = pendingOrdersCount;

        // Load admins
        if (currentUser?.role === 'super_admin') {
            try {
                const admins = await apiCall('/api/users/admins');
                const adminsCount = Array.isArray(admins) ? admins.length : 0;
                document.getElementById('totalAdmins').textContent = adminsCount;
            } catch (error) {
                console.warn('⚠️ Could not load admins:', error.message);
                document.getElementById('totalAdmins').textContent = '0';
            }
        }

        // Update sales and revenue stats
        await updateSalesStatsFromBackend();
        await updateRevenueStatsFromBackend();
        await updateExpenseStatsFromBackend();
        await updateRepairsServicesStatsFromBackend();
        await renderRevenueBreakdownChart();

        // console.log(' Dashboard stats loaded');
    } catch (error) {
        console.error(' Error loading dashboard stats:', error);
        setDefaultStats();
    }
}

function setDefaultStats() {
    document.getElementById('totalUsers').textContent = '0';
    document.getElementById('totalProducts').textContent = '0';
    document.getElementById('pendingOrders').textContent = '0';
    document.getElementById('totalAdmins').textContent = '0';
}

// INVENTORY MANAGEMENT FUNCTIONS
async function loadInventoryDashboard() {
    try {
        const products = await apiCall('/api/products');
        inventoryData = Array.isArray(products) ? products : [];

        // Update dashboard stats
        updateDashboardInventoryStats(inventoryData);

        // Update inventory alerts
        updateInventoryAlerts(inventoryData);

    } catch (error) {
        console.error('Error loading inventory:', error);
    }
}

function updateDashboardInventoryStats(products) {
    if (!Array.isArray(products)) return;

    const totalItems = products.length;
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach(product => {
        const price = parseFloat(product.price) || 0;
        const stock = parseInt(product.stock) || 0;
        const restockLevel = parseInt(product.restockLevel) || 5;

        totalValue += price * stock;

        if (stock === 0) {
            outOfStockCount++;
        } else if (stock < restockLevel) {
            lowStockCount++;
        }
    });

    // Update DOM elements
    document.getElementById('totalInventoryValue').textContent = `KSH ${totalValue.toLocaleString()}`;
    document.getElementById('inventoryItemCount').textContent = `${totalItems} items`;
    document.getElementById('lowStockCount').textContent = lowStockCount;
    if (document.getElementById('outOfStockCount')) {
        document.getElementById('outOfStockCount').textContent = outOfStockCount;
    }
}

function updateInventoryAlerts(products) {
    const alertsContainer = document.getElementById('inventoryAlerts');
    if (!alertsContainer) return;

    const lowStockCount = products.filter(p => {
        const stock = parseInt(p.stock) || 0;
        const restockLevel = parseInt(p.restockLevel) || 5;
        return stock > 0 && stock < restockLevel;
    }).length;

    const outOfStockCount = products.filter(p => (parseInt(p.stock) || 0) === 0).length;
    const totalValue = products.reduce((sum, p) => sum + ((parseFloat(p.price) || 0) * (parseInt(p.stock) || 0)), 0);

    let alertsHTML = '';

    if (outOfStockCount > 0) {
        alertsHTML += `
                    <div class="inventory-alert">
                        <strong>${outOfStockCount} products are out of stock!</strong>
                        <p>Urgent attention needed to restock these items.</p>
                    </div>
                `;
    }

    if (lowStockCount > 0) {
        alertsHTML += `
                    <div class="inventory-warning">
                        <strong> ${lowStockCount} products have low stock!</strong>
                        <p>Consider restocking these items soon.</p>
                    </div>
                `;
    }

    if (lowStockCount === 0 && outOfStockCount === 0) {
        alertsHTML = `
                    <div class="inventory-success">
                        <strong> All products are sufficiently stocked!</strong>
                        <p>No restock alerts at this time.</p>
                    </div>
                `;
    }

    alertsHTML += `
                <div class="inventory-success">
                    <strong> Total Inventory Value: KSH ${totalValue.toLocaleString()}</strong>
                    <p>${products.length} items in inventory |  ${lowStockCount + outOfStockCount} need attention</p>
                </div>
            `;

    alertsContainer.innerHTML = alertsHTML;
}



async function loadFullInventory() {
    try {
        const products = await apiCall('/api/products');
        inventoryData     = Array.isArray(products) ? products : [];
        filteredInventory = [...inventoryData];
        inventoryPage     = 1; // reset to page 1 on every load

        applyInventoryPagination();
        updateInventoryStats(filteredInventory);

    } catch (error) {
        console.error('Error loading inventory:', error);
        showNotification('Error loading inventory', 'error');
    }
}

function renderInventoryTable(products) {
    const inventoryList = document.getElementById('inventoryList');
    if (!inventoryList) return;

    if (!Array.isArray(products) || products.length === 0) {
        inventoryList.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                            <h3>No inventory items found</h3>
                            <p>Add products to see them in inventory.</p>
                        </td>
                    </tr>
                `;
        return;
    }

    inventoryList.innerHTML = products.map(product => {
        const stock = parseInt(product.stock) || 0;
        const restockLevel = parseInt(product.restockLevel) || 5;
        const price = parseFloat(product.price) || 0;
        const value = price * stock;
        const status = getStockStatus(stock, restockLevel);
        const statusClass = getStatusClass(status);

        return `
                    <tr>
                        <td>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                ${product.image_url ?
                `<img src="${product.image_url}" alt="${product.name}" style="width: 30px; height: 30px; object-fit: cover; border-radius: 4px;">` :
                '<div style="width: 50px; height: 50px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999; border-radius: 4px;">No Image</div>'
            }
                                <div>
                                    <strong >${product.name ? product.name.substring(0, 50) + '...' : 'Unnamed Product, Update product name'}</strong><br>
                                    <small style="color: #666;">${product.category || 'Uncategorized'}</small>
                                </div>
                            </div>
                        </td>
                        <td><strong>${stock}</strong><small> units</small></td>
                        <td><strong>${restockLevel}</strong><small> units</small></td>
                        <td>
                            <span class="stock-status ${statusClass}">${status}</span>
                        </td>
                        <td><strong>KSH ${value.toLocaleString()}</strong></td>
                        <td>
                            <button class="restock-btn" onclick="showRestockModal('${product.id}', '${product.name}', ${stock}, ${restockLevel})">
                                Restock
                            </button>
                        </td>
                    </tr>
                `;
    }).join('');
}

function getStockStatus(stock, restockLevel) {
    if (stock === 0) return 'Out of Stock';
    if (stock < restockLevel) return 'Low Stock';
    return 'Good Stock';
}

function getStatusClass(status) {
    switch (status) {
        case 'Out of Stock': return 'stock-out';
        case 'Low Stock': return 'stock-low';
        case 'Good Stock': return 'stock-good';
        default: return '';
    }
}

function updateInventoryStats(products) {
    if (!Array.isArray(products)) return;

    const totalItems = products.length;
    let totalValue = 0;
    let totalStock = 0;
    let restockAlerts = 0;

    products.forEach(product => {
        const price = parseFloat(product.price) || 0;
        const stock = parseInt(product.stock) || 0;
        const restockLevel = parseInt(product.restockLevel) || 5;

        totalValue += price * stock;
        totalStock += stock;

        if (stock === 0 || stock < restockLevel) {
            restockAlerts++;
        }
    });

    const totalInventoryItemsEl = document.getElementById('totalInventoryItems');
    const inventoryTotalValueEl = document.getElementById('inventoryTotalValue');
    const averageStockEl = document.getElementById('averageStock');
    const totalRestockAlertsEl = document.getElementById('totalRestockAlerts');

    if (totalInventoryItemsEl) totalInventoryItemsEl.textContent = totalItems;
    if (inventoryTotalValueEl) inventoryTotalValueEl.textContent = `KSH ${totalValue.toLocaleString()}`;
    if (averageStockEl) averageStockEl.textContent = Math.round(totalStock / totalItems) || 0;
    if (totalRestockAlertsEl) totalRestockAlertsEl.textContent = restockAlerts;
 }

 // ==================== INVENTORY PAGINATION ====================

let inventoryPage = 1;
const inventoryLimit = 10;
let inventoryTotal = 0;
let allInventoryData = [];

function applyInventoryPagination() {
    const start = (inventoryPage - 1) * inventoryLimit;
    const end   = start + inventoryLimit;
    const pageData = filteredInventory.slice(start, end);
    renderInventoryTable(pageData);
    updateInventoryPaginationUI();
}

function updateInventoryPaginationUI() {
    const prevBtn  = document.getElementById('prevInventoryBtn');
    const nextBtn  = document.getElementById('nextInventoryBtn');
    const pageInfo = document.getElementById('inventoryPageInfo');
    if (!prevBtn || !nextBtn || !pageInfo) return;

    const totalPages = Math.max(1, Math.ceil(filteredInventory.length / inventoryLimit));

    pageInfo.textContent = `Page ${inventoryPage} of ${totalPages} (${filteredInventory.length} items)`;

    prevBtn.disabled     = inventoryPage <= 1;
    prevBtn.style.opacity = inventoryPage <= 1 ? '0.5' : '1';

    nextBtn.disabled     = inventoryPage >= totalPages;
    nextBtn.style.opacity = inventoryPage >= totalPages ? '0.5' : '1';
}

function prevInventoryPage() {
    if (inventoryPage > 1) {
        inventoryPage--;
        applyInventoryPagination();
    }
}

function nextInventoryPage() {
    const totalPages = Math.ceil(filteredInventory.length / inventoryLimit);
    if (inventoryPage < totalPages) {
        inventoryPage++;
        applyInventoryPagination();
    }
}


function searchInventory(query) {
    const inventoryList = document.getElementById('inventoryList');
    if (!inventoryList) return;

    if (!query.trim()) {
        filteredInventory = [...inventoryData];
    } else {
        const searchTerm  = query.toLowerCase();
        filteredInventory = inventoryData.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            (product.category && product.category.toLowerCase().includes(searchTerm))
        );
    }

    inventoryPage = 1; // reset to page 1 on every search
    applyInventoryPagination();
}

// RESTOCK FUNCTIONS
function showRestockModal(productId, productName, currentStock, restockLevel) {
    // Create modal HTML if it doesn't exist
    if (!document.getElementById('restockModal')) {
        const modalHTML = `
                    <div id="restockModal" class="modal">
                        <div class="modal-content">
                            <span class="close" onclick="closeRestockModal()" style="float: right; cursor: pointer; font-size: 24px;">&times;</span>
                            <h2>Restock Product</h2>
                            <form id="restockForm">
                                <input type="hidden" id="restockProductId">
                                <div class="form-group">
                                    <label for="restockProductName">Product Name</label>
                                    <input type="text" id="restockProductName" class="form-control" readonly>
                                </div>
                                <div class="form-group">
                                    <label for="currentStock">Current Stock</label>
                                    <input type="number" id="currentStock" class="form-control" readonly>
                                </div>
                                <div class="form-group">
                                    <label for="restockLevel">Restock Level</label>
                                    <input type="number" id="restockLevel" class="form-control" readonly>
                                </div>
                                <div class="form-group">
                                    <label for="addStock">Quantity to Add</label>
                                    <input type="number" id="addStock" class="form-control" min="1" required>
                                </div>
                                <div class="form-group">
                                    <label for="newStockLevel">New Stock Level</label>
                                    <input type="number" id="newStockLevel" class="form-control" readonly>
                                </div>
                                <div style="display: flex; gap: 10px; margin-top: 20px;">
                                    <button type="submit" class="btn btn-primary">Restock Product</button>
                                    <button type="button" class="btn btn-danger" onclick="closeRestockModal()">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                
                `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add event listeners
        document.getElementById('restockForm').addEventListener('submit', processRestock);
        document.getElementById('addStock').addEventListener('input', updateNewStockLevel);
    }

    // Populate modal fields
    document.getElementById('restockProductId').value = productId;
    document.getElementById('restockProductName').value = productName;
    document.getElementById('currentStock').value = currentStock;
    document.getElementById('restockLevel').value = restockLevel;

    // Calculate suggested restock quantity
    const suggestedQty = Math.max(restockLevel * 2 - currentStock, restockLevel);
    document.getElementById('addStock').value = suggestedQty;
    updateNewStockLevel();

    // Show modal
    document.getElementById('restockModal').style.display = 'block';
}

function updateNewStockLevel() {
    const currentStock = parseInt(document.getElementById('currentStock').value) || 0;
    const addStock = parseInt(document.getElementById('addStock').value) || 0;
    document.getElementById('newStockLevel').value = currentStock + addStock;
}

function closeRestockModal() {
    document.getElementById('restockModal').style.display = 'none';
}

async function processRestock(e) {
    e.preventDefault();

    const productId = document.getElementById('restockProductId').value;
    const addQuantity = parseInt(document.getElementById('addStock').value);

    if (!addQuantity || addQuantity <= 0) {
        showNotification('Please enter a valid quantity', 'error');
        return;
    }

    try {
        // First, get the current product data
        const product = await apiCall(`/api/products/${productId}`);

        if (!product) {
            showNotification('Product not found', 'error');
            return;
        }

        // Calculate new stock
        const currentStock = parseInt(product.stock) || 0;
        const newStock = currentStock + addQuantity;

        // Create a clean update object with only the necessary fields
        const updateData = {
            name: product.name || '',
            description: product.description || '',
            price: parseFloat(product.price) || 0,
            stock: newStock,
            restockLevel: parseInt(product.restockLevel) || 5,
            category: product.category || 'other'
        };

        // Remove any undefined or null values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined || updateData[key] === null) {
                delete updateData[key];
            }
        });

        // console.log('Updating product with data:', updateData);

        await apiCall(`/api/products/${productId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });

        showNotification(`Successfully restocked ${addQuantity} units. New stock: ${newStock}`, 'success');
        closeRestockModal();

        // Refresh all relevant data
        loadInventoryDashboard();
        if (document.getElementById('inventory')?.classList.contains('active')) {
            loadFullInventory();
        }
        if (document.getElementById('products')?.classList.contains('active')) {
            loadProducts();
        }
        loadDashboardStats();

    } catch (error) {
        console.error('Error restocking product:', error);
        showNotification('Error restocking product: ' + error.message, 'error');
    }
}

function showBulkRestock() {
    // Create modal HTML if it doesn't exist
    if (!document.getElementById('bulkRestockModal')) {
        const modalHTML = `
                    <div id="bulkRestockModal" class="modal">
                        <div class="modal-content" style="max-width: 800px;">
                            <span class="close" onclick="closeBulkRestockModal()" style="float: right; cursor: pointer; font-size: 24px;">&times;</span>
                            <h2>Bulk Restock - Low Stock Items</h2>
                            <div id="bulkRestockList" style="max-height: 400px; overflow-y: auto; margin: 20px 0;">
                                <!-- Low stock products will be listed here -->
                            </div>
                            <div style="display: flex; gap: 10px; margin-top: 20px;">
                                <button class="btn btn-primary" onclick="processBulkRestock()">
                                    Restock Selected Items
                                </button>
                                <button class="btn btn-secondary" onclick="closeBulkRestockModal()">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Get low stock products
    const lowStockProducts = inventoryData
        .filter(p => {
            const stock = parseInt(p.stock) || 0;
            const restockLevel = parseInt(p.restockLevel) || 5;
            return stock < restockLevel;
        })
        .sort((a, b) => (parseInt(a.stock) || 0) - (parseInt(b.stock) || 0));

    if (lowStockProducts.length === 0) {
        showNotification('No low stock items found', 'info');
        return;
    }

    const bulkList = document.getElementById('bulkRestockList');
    bulkList.innerHTML = '<h4 style="margin-bottom: 15px;">Low Stock Products</h4>';

    lowStockProducts.forEach(product => {
        const stock = parseInt(product.stock) || 0;
        const restockLevel = parseInt(product.restockLevel) || 5;
        const suggestedQty = Math.max(restockLevel * 2 - stock, restockLevel);

        bulkList.innerHTML += `
                    <div class="bulk-restock-item">
                        <div>
                            <strong>${product.name}</strong>
                            <div style="font-size: 14px; color: #666; margin-top: 5px;">
                                Current: ${stock} units | Restock Level: ${restockLevel} units
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <input type="number" 
                                   id="bulkQty_${product.id}" 
                                   value="${suggestedQty}" 
                                   min="1" 
                                   style="width: 100px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <input type="checkbox" id="bulkSelect_${product.id}" checked style="width: 20px; height: 20px;">
                        </div>
                    </div>
                `;
    });

    document.getElementById('bulkRestockModal').style.display = 'block';
}

function closeBulkRestockModal() {
    document.getElementById('bulkRestockModal').style.display = 'none';
}

async function processBulkRestock() {
    const selectedProducts = [];

    inventoryData.forEach(product => {
        const checkbox = document.getElementById(`bulkSelect_${product.id}`);
        const quantityInput = document.getElementById(`bulkQty_${product.id}`);

        if (checkbox && checkbox.checked && quantityInput) {
            const quantity = parseInt(quantityInput.value) || 0;
            if (quantity > 0) {
                selectedProducts.push({
                    id: product.id,
                    name: product.name,
                    quantity: quantity
                });
            }
        }
    });

    if (selectedProducts.length === 0) {
        showNotification('Please select at least one product to restock', 'warning');
        return;
    }

    try {
        // Process each product restock
        for (const item of selectedProducts) {
            try {
                // Get current product data
                const product = await apiCall(`/api/products/${item.id}`);

                if (product) {
                    // Calculate new stock
                    const currentStock = parseInt(product.stock) || 0;
                    const newStock = currentStock + item.quantity;

                    // Create an update object
                    const updateData = {
                        name: product.name || '',
                        description: product.description || '',
                        price: parseFloat(product.price) || 0,
                        stock: newStock,
                        restockLevel: parseInt(product.restockLevel) || 5,
                        category: product.category || 'other'
                    };

                    // Remove any undefined or null values
                    Object.keys(updateData).forEach(key => {
                        if (updateData[key] === undefined || updateData[key] === null) {
                            delete updateData[key];
                        }
                    });

                    await apiCall(`/api/products/${item.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(updateData)
                    });
                }
            } catch (error) {
                console.error(`Error restocking product ${item.id}:`, error);
                // Continue with other products even if one fails
            }
        }

        showNotification(`Successfully restocked ${selectedProducts.length} products`, 'success');
        closeBulkRestockModal();

        // Refresh all data
        loadInventoryDashboard();
        if (document.getElementById('inventory')?.classList.contains('active')) {
            loadFullInventory();
        }
        if (document.getElementById('products')?.classList.contains('active')) {
            loadProducts();
        }
        loadDashboardStats();

    } catch (error) {
        console.error('Error in bulk restock:', error);
        showNotification('Error processing bulk restock', 'error');
    }
}

// Helper function to fix product prices
function fixProductPrice(price) {
    if (typeof price === 'string') {
        // Remove any non-numeric characters except decimal point
        const cleaned = price.replace(/[^0-9.]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    } else if (typeof price === 'number') {
        return price;
    }
    return 0;
}

// Products Management
async function loadProducts() {
    try {
        const products = await apiCall('/api/products');
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error loading products: ' + error.message, 'error');
    }
}

function displayProducts(products) {
    const productsList = document.getElementById('productsList');

    if (!Array.isArray(products)) {
        console.warn('Products is not an array');
        products = [];
    }

    if (products.length === 0) {
        productsList.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                            <h3>No products found</h3>
                            <p>There are no products in the system yet.</p>
                        </td>
                    </tr>
                `;
        return;
    }

    productsList.innerHTML = products.map(product => {
       const cost = parseFloat(product.cost) || 0;
       const price = parseFloat(product.price) || 0;
        return `
                <tr>
                   <td>
                        ${product.image_url ?
            `<img src="${product.image_url}" alt="${product.name}" loading="lazy" style="width: 30px; height: 30px; object-fit: cover; border-radius: 4px;">` :
            '<div style="width:50px;height:50px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#999;border-radius:4px;">No Image</div>'
        }
            </td>
                  


                    <td> <strong>${product.name ? product.name.substring(0, 50) + '...' : 'Unnamed Product.Update product name'} </strong></td>
                    <td>${cost.toFixed(2)}</td> 
                    <td>${price.toFixed(2)}</td> 
                    <td><strong>${product.stock || 0}</strong><small>units</small></td>
                    <td><small>${product.category || '-'}</small></td>
                    <td>
                        <button class="btn btn-warning" style="background-color:orange; color: white; padding: 6px 12px; margin-right: 5px;" onclick="editProduct(${product.id})">Edit</button>
                        <button class="btn btn-danger" style="background-color:red; color: white; padding: 6px 12px;" onclick="deleteProduct(${product.id})">Delete</button>
                    </td>
                </tr>
            `;
    }).join('');
}

function searchProducts(query) {
    query = query.toLowerCase().trim();
    const rows = document.querySelectorAll("#productsList tr");
    let visibleCount = 0;

    rows.forEach(row => {
        const name = row.querySelector("td:nth-child(2)")?.textContent.toLowerCase() || "";
        const cost = row.querySelector("td:nth-child(3)")?.textContent.toLowerCase() || "";
        const price = row.querySelector("td:nth-child(4)")?.textContent.toLowerCase() || "";
        const stock = row.querySelector("td:nth-child(5)")?.textContent.toLowerCase() || "";
        const category = row.querySelector("td:nth-child(6)")?.textContent.toLowerCase() || "";

        const match =
            name.includes(query) ||
            cost.includes(query) ||
            price.includes(query) ||
            stock.includes(query) ||
            category.includes(query);

        if (match) {
            row.style.display = "";
            visibleCount++;
        } else {
            row.style.display = "none";
        }
    });
}

async function loadOrders() {
    try {
        const token = localStorage.getItem('adminToken') || ('authToken');
        const response = await fetch('/api/orders', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        // console.log('Fetched orders:', result);

        if (result.success && Array.isArray(result.data)) {
            const orders = result.data;
            // console.log('✅ Passing orders to displayOrders:', orders);
            displayOrders(orders);

            // Update order count
            const orderCountElement = document.getElementById('totalOrders');
            if (orderCountElement) {
                orderCountElement.textContent = orders.length;
            }
        } else {
            displayOrders([]);
        }
    } catch (error) {
        console.error(' Error loading orders:', error);
    }
}

function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');

    if (!Array.isArray(orders)) {
        console.warn('Orders is not an array');
        orders = [];
    }

    if (orders.length === 0) {
        ordersList.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                            <h3>No orders found</h3>
                            <p>There are no orders in the system yet.</p>
                        </td>
                    </tr>
                `;
        return;
    }

    ordersList.innerHTML = orders.map(order => `
                <tr>
                    <td><strong>#${order.id || 'N/A'}</strong></td>
                    <td>
                        <div>${order.username || order.customer_Name || 'Customer'}</div>
                        <small style="color: #666;">${order.customer_phone || order.email || 'No contact'}</small>
                    </td>
                    <td>KSH ${parseFloat(order.total_amount || 0).toFixed(2)}</td>
                    <td>
                        <select onchange="updateOrderStatus(${order.id}, this.value)" class="form-control" style="padding: 6px; border-radius: 4px; border: 1px solid #ddd;">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                           <!-- <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>-->
                            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                    <td>${order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown'}</td>
                    <td>
                        <button class="btn btn-primary" onclick="viewOrderDetails(${order.id})" style="padding: 6px 12px;">View Details</button>
                    </td>
                </tr>
            `).join('');
}

function searchOrders(query) {
    query = query.toLowerCase();
    const rows = document.querySelectorAll("#ordersList tr");

    rows.forEach(row => {
        const orderId = row.querySelector("td:nth-child(1)").textContent.toLowerCase();
        const user = row.querySelector("td:nth-child(2)").textContent.toLowerCase();
        const amount = row.querySelector("td:nth-child(3)").textContent.toLowerCase();
        const status = row.querySelector("td:nth-child(4)").textContent.toLowerCase();

        if (
            orderId.includes(query) ||
            user.includes(query) ||
            amount.includes(query) ||
            status.includes(query)
        ) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}

// Users Management
async function loadUsers() {
    try {
        // console.log('🔄 Loading users...');
        const users = await apiCall('/api/users');
        displayUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Error loading users: ' + error.message, 'error');
        displayUsers([]);
    }
}

function displayUsers(users) {
    const usersList = document.getElementById('usersList');

    if (!Array.isArray(users)) {
        console.warn('Users is not an array');
        users = [];
    }

    if (users.length === 0) {
        usersList.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 40px; color: #666;">
                            <h3>No users found</h3>
                            <p>There are no users in the system yet.</p>
                        </td>
                    </tr>
                `;
        return;
    }

    usersList.innerHTML = users.map(user => `
                <tr>
                    <td>${user.username || 'Unknown'}</td>
                    <td>${user.email || 'No email'}</td>
                    <td>${user.phone_number || 'No phone'}</td>
                    <td>${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</td>
                    <td>
                        <button class="btn btn-danger" style="background-color: red; color: white; padding: 6px 12px;" onclick="deleteUser(${user.id})">Delete</button>
                    </td>
                </tr>
            `).join('');
}

function searchUsers(query) {
    query = query.toLowerCase();
    const rows = document.querySelectorAll("#usersList tr");

    rows.forEach(row => {
        const username = row.querySelector("td:nth-child(1)").textContent.toLowerCase();
        const email = row.querySelector("td:nth-child(2)").textContent.toLowerCase();
        const phone = row.querySelector("td:nth-child(3)").textContent.toLowerCase();

        if (username.includes(query) || email.includes(query) || phone.includes(query)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}

// Admins Management
async function loadAdmins() {
    try {
        const admins = await apiCall('/api/users/admins');
        displayAdmins(admins);
    } catch (error) {
        console.error('Error loading admins:', error);
        showNotification('Error loading admins: ' + error.message, 'error');
    }
}

function displayAdmins(admins) {
    const adminsList = document.getElementById('adminsList');

    if (!Array.isArray(admins)) {
        console.warn('Admins is not an array');
        admins = [];
    }

    if (admins.length === 0) {
        adminsList.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 40px; color: #666;">
                            <h3>No admins found</h3>
                            <p>There are no additional admins in the system.</p>
                        </td>
                    </tr>
                `;
        return;
    }

    adminsList.innerHTML = admins.map(admin => `
                <tr>
                    <td>${admin.username}</td>
                    <td>${admin.email}</td>
                    <td>${admin.role}</td>
                    <td>${new Date(admin.created_at).toLocaleDateString()}</td>
                    <td>
                        ${admin.role !== 'super_admin' ? `
                            <button class="btn btn-danger" style="background-color: red; color: white; padding: 6px 12px;" onclick="deleteAdmin(${admin.id})">Delete</button>
                        ` : '<span style="color: #999;">Protected</span>'}
                    </td>
                </tr>
            `).join('');
}

// Product Modal Functions
function showAddProductModal() {
    editingProductId = null;
    document.getElementById('productModalTitle').textContent = 'Add Product';
    document.getElementById('productForm').reset();

    // Ensure restock level field exists
    if (!document.getElementById('productRestockLevel')) {
        const stockField = document.getElementById('productStock');
        if (stockField) {
            const restockLevelHTML = `
                        <div class="form-group">
                            <label for="productRestockLevel">Restock Level (Minimum Stock)</label>
                            <input type="number" id="productRestockLevel" class="form-control" required value="5">
                            <small>Alert when stock falls below this level</small>
                        </div>
                    `;
            stockField.insertAdjacentHTML('afterend', restockLevelHTML);
        }
    }

    document.getElementById('productModal').style.display = 'block';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    editingProductId = null;
}

async function editProduct(productId) {
    try {
        const product = await apiCall(`/api/products/${productId}`);

        editingProductId = productId;
        document.getElementById('productModalTitle').textContent = 'Edit Product';
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productPrice').value = fixProductPrice(product.price); 
        document.getElementById('productCost').value = product.cost || 0;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productRestockLevel').value = product.restockLevel || 5;
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading product for edit:', error);
        showNotification('Error loading product details', 'error');
    }
}

async function handleProductSubmit(e) {
    e.preventDefault();

    try {
        const formData = new FormData();
        formData.append('name', document.getElementById('productName').value);
        formData.append('description', document.getElementById('productDescription').value);
        
        
        const price = parseFloat(document.getElementById('productPrice').value) || 0;
        formData.append('price', price.toString());
        const cost = parseFloat(document.getElementById('productCost').value) || 0;
        formData.append('cost', cost.toString());
        
        formData.append('stock', document.getElementById('productStock').value);
        formData.append('restockLevel', document.getElementById('productRestockLevel').value);
        formData.append('category', document.getElementById('productCategory').value);

        const imageFile = document.getElementById('productImage').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        const url = editingProductId ? `/api/products/${editingProductId}` : '/api/products';
        const method = editingProductId ? 'PUT' : 'POST';

        await apiCall(url, {
            method: method,
            body: formData
        });

        closeProductModal();
        loadProducts();
        loadDashboardStats();
        loadInventoryDashboard(); // Refresh inventory data
        showNotification(
            editingProductId ? 'Product updated successfully' : 'Product added successfully',
            'success'
        );
    } catch (error) {
        console.error('Error saving product:', error);
        showNotification('Error saving product: ' + error.message, 'error');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        await apiCall(`/api/products/${productId}`, { method: 'DELETE' });
        loadProducts();
        loadDashboardStats();
        loadInventoryDashboard(); // Refresh inventory data
        showNotification('Product deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Error deleting product', 'error');
    }
}

// Order Management
async function updateOrderStatus(orderId, status) {
    try {
        await apiCall(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        showNotification('Order status updated successfully', 'success');
    } catch (error) {
        console.error('Error updating order status:', error);
        showNotification('Error updating order status: ' + error.message, 'error');
        loadOrders();
    }
}

function viewOrderDetails(orderId) {
    alert('Order details view would open for order #' + orderId);
    // Implement order details view as needed
}

// User Management
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        await apiCall(`/api/users/${userId}`, { method: 'DELETE' });
        loadUsers();
        loadDashboardStats();
        showNotification('User deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Error deleting user', 'error');
    }
}

// Admin Management
async function handleAddAdmin(e) {
    e.preventDefault();

    try {
        const formData = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };

        await apiCall('/api/users/admins', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        document.getElementById('addAdminForm').reset();
        loadAdmins();
        loadDashboardStats();
        showNotification('Admin created successfully', 'success');
        switchSection('admins');
    } catch (error) {
        console.error('Error creating admin:', error);
        showNotification('Error creating admin: ' + error.message, 'error');
    }
}

async function deleteAdmin(adminId) {
    if (!confirm('Are you sure you want to delete this admin?')) return;

    try {
        await apiCall(`/api/users/admins/${adminId}`, { method: 'DELETE' });
        loadAdmins();
        loadDashboardStats();
        showNotification('Admin deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting admin:', error);
        showNotification('Error deleting admin', 'error');
    }
}

// Utility Functions
function showNotification(message, type = 'info') {
    document.querySelectorAll('.notification').forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                background: ${getNotificationColor(type)};
                color: white;
                border-radius: 4px;
                z-index: 10000;
                animation: slideIn 0.3s ease;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function getNotificationColor(type) {
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    return colors[type] || colors.info;
}

function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = 'admin-login.html';
}

// ==================== SALES MANAGEMENT FUNCTIONS - DB ONLY ====================

// Initialize sales
function initializeSales() {
    salesPage = 1;
    loadSalesFromBackend();
}

let allSalesData = []; // store full dataset

async function loadSalesFromBackend() {
    try {
        const response = await apiCall(`/api/sales`); // no limit/offset, fetch all

        if (response.success && response.data) {
            allSalesData = response.data.map(sale => {
                let totalAmount = parseFloat(sale.total_amount) || 0;
                let itemsCount = 0;
                if (sale.items && Array.isArray(sale.items)) {
                    itemsCount = sale.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
                }
                return {
                    id: sale.id,
                    saleNumber: sale.order_id || sale.sale_number || sale.id,
                    order_id: sale.order_id,
                    customerName: sale.customer_name || 'Walk-in Customer',
                    customer_name: sale.customer_name,
                    customerPhone: sale.customer_phone || '',
                    customerEmail: sale.customer_email || '',
                    paymentMethod: sale.payment_method || 'cash',
                    paymentStatus: sale.status || 'completed',
                    status: sale.status,
                    notes: sale.notes || '',
                    items: sale.items || [],
                    product_count: itemsCount,
                    totalAmount: totalAmount,
                    total_amount: totalAmount,
                     profit: parseFloat(sale.profit) || 0,
                    date: sale.sales_date || new Date(),
                    sales_date: sale.sales_date,
                    saleType: sale.order_id?.toString().startsWith('MANUAL-') ? 'manual' : 'online',
                    createdAt: sale.created_at || new Date(),
                    created_at: sale.created_at,
                    createdBy: sale.created_by_name || 'Admin'
                };
            });

            salesTotal = allSalesData.length;
            applyClientSidePagination();
        }
    } catch (error) {
        console.error('Error loading sales from backend:', error);
        const salesList = document.getElementById('salesList');
        if (salesList) {
            salesList.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center;padding:40px;color:#666;">
                        Failed to load sales. 
                        <button class="btn btn-primary" onclick="loadSalesFromBackend()">Retry</button>
                    </td>
                </tr>`;
        }
    }
}

function applyClientSidePagination() {
    const start = (salesPage - 1) * salesLimit;
    const end = start + salesLimit;
    salesManager.salesData = allSalesData.slice(start, end);
    updateSalesDisplay();
    updateSalesPaginationUI();
    // loadTotalProfit();
    calculateAndDisplayAllProfits();
}
    

function updateSalesDisplay() {

    const salesList = document.getElementById('salesList');
    const sales = salesManager.salesData;

    if (!salesList) return;

    if (sales.length === 0) {
        salesList.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px;">
                    <div style="color: #666; font-size: 16px;">
                        <i class="fas fa-shopping-cart" style="font-size: 48px; margin-bottom: 20px; color: #ddd;"></i>
                        <p>No sales recorded yet</p>
                        <button class="btn btn-primary" onclick="showNewSaleModal()">
                            <i class="fas fa-plus"></i> Record First Sale
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    salesList.innerHTML = sales.map(sale => {
        // Safely format the total amount
        let totalAmount = 0;
        if (sale.totalAmount !== null && sale.totalAmount !== undefined) {
            if (typeof sale.totalAmount === 'string') {
                totalAmount = parseFloat(sale.totalAmount) || 0;
            } else if (typeof sale.totalAmount === 'number') {
                totalAmount = sale.totalAmount;
            }
        }

        // FIXED: Better items count detection
        let itemsCount = 0;

        // Check product_count first
        if (sale.product_count !== undefined && sale.product_count !== null) {
            itemsCount = parseInt(sale.product_count) || 0;
        }
        // Then check items array
        else if (sale.items) {
            if (Array.isArray(sale.items)) {
                itemsCount = sale.items.length;
                // If items array has quantity properties, sum them
                if (sale.items.length > 0 && sale.items[0].quantity) {
                    itemsCount = sale.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
                }
            } else if (typeof sale.items === 'object') {
                itemsCount = Object.keys(sale.items).length;
            }
        }
        // Then check order_items
        else if (sale.order_items) {
            if (Array.isArray(sale.order_items)) {
                itemsCount = sale.order_items.length;
            }
        }

        // FIXED: Force minimum items count if total amount > 0
        if (itemsCount === 0 && totalAmount > 0) {
            itemsCount = 1;
        }

        // Get customer name from all possible locations
        let customerName = 'Walk-in Customer';
        if (sale.customerName) {
            customerName = sale.customerName;
        } else if (sale.customer_name) {
            customerName = sale.customer_name;
        } else if (sale.customer && sale.customer.name) {
            customerName = sale.customer.name;
        } else if (sale.user && sale.user.name) {
            customerName = sale.user.name;
        }


        let formattedDate = 'Unknown';
        let formattedTime = '';
        let timeString = '';

        try {
            const dateStr = sale.date || sale.sales_date || sale.created_at || sale.updated_at || sale.timestamp;

            if (dateStr) {

                const dateObj = new Date(dateStr);

                if (!isNaN(dateObj.getTime())) {


                    formattedDate = dateObj.toLocaleDateString('en-KE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        timeZone: 'Africa/Nairobi'
                    });

                    formattedTime = dateObj.toLocaleTimeString('en-KE', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                        timeZone: 'Africa/Nairobi'
                    });

                    timeString = `<br><small class="text-muted">${formattedTime}</small>`;
                }
            }

            // If separate time field exists
            if (sale.time) {
                formattedTime = sale.time;
                timeString = `<br><small class="text-muted">${formattedTime}</small>`;
            }

        } catch (e) {
            console.warn('Error formatting date:', e);
        }


        return `
        <tr>
            <td><strong>${sale.saleNumber || sale.order_id || sale.id || 'N/A'}</strong></td>
            <td>${customerName}</td>
           <td>
                <span class="badge bg-info">${itemsCount}</span> 
                ${itemsCount === 1 ? 'item' : 'items'}
            </td>
            <td><strong>KSH ${totalAmount.toFixed(2)}</strong></td>
            <td>${sale.paymentMethod || sale.payment_method || 'Cash'}</td>
            <td><span class="badge bg-success">${sale.paymentStatus || sale.status || 'Completed'}</span></td>
           <!--  <td>${formattedDate}${timeString}</td>-->
             <td>${formattedDate}</td>
            <td>
                <button class="btn btn-sm py-0 btn-info" onclick="viewSaleDetails('${sale.id || sale.order_id}')">
                    View
                </button>
               <button class="btn btn-sm py-0 btn-danger" onclick="deleteSale('${sale.id || sale.order_id}')">
                    Delete
                </button>
            </td>
        </tr>
    `}).join('');
}


// async function loadTotalProfit() {
//     try {
//         const data = allSalesData.length > 0
//             ? allSalesData
//             : ((await apiCall('/api/sales')).data || []);

//         const dailyProfits = {};

//         data.forEach(sale => {
//             const items = sale.items || [];
//             let saleProfit = 0;

//             if (items.length > 0) {
//                 items.forEach(item => {
//                     const qty       = parseInt(item.quantity) || 0;
//                     const sellPrice = parseFloat(item.unit_price || 0);
//                     const costPrice = parseFloat(item.product_cost || item.cost_price || item.cost || 0);
//                     saleProfit += (sellPrice - costPrice) * qty;
//                 });
//             } else {
//                 // Fallback: backend already calculates profit field
//                 saleProfit = parseFloat(sale.profit || 0);
//             }

//             // Use local date to avoid UTC timezone shift
//             const saleDate  = new Date(sale.created_at || sale.sales_date || sale.date);
//             const dateKey   = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}-${String(saleDate.getDate()).padStart(2, '0')}`;

//             dailyProfits[dateKey] = (dailyProfits[dateKey] || 0) + saleProfit;
//         });

//         // Today key using LOCAL date
//         const now      = new Date();
//         const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

//         const todayProfit = dailyProfits[todayKey] || 0;
//         const totalProfit = Object.values(dailyProfits).reduce((sum, d) => sum + d, 0);

      
//         // Update todayProfit
//         const todayEl = document.getElementById('todayProfit');
//         if (todayEl) {
//             todayEl.textContent = `KSH ${todayProfit.toLocaleString('en-KE', {
//                 minimumFractionDigits: 2, maximumFractionDigits: 2
//             })}`;
//             todayEl.style.color = todayProfit >= 0 ? '#27ae60' : '#e74c3c';
//         }

//         // Update totalProfit
//         const totalEl = document.getElementById('totalProfit');
//         if (totalEl) {
//             totalEl.textContent = `KSH ${totalProfit.toLocaleString('en-KE', {
//                 minimumFractionDigits: 2, maximumFractionDigits: 2
//             })}`;
//             totalEl.style.color = totalProfit >= 0 ? '#27ae60' : '#e74c3c';
//         }

//     } catch (error) {
//         console.error('Error calculating profit:', error);
//         ['todayProfit', 'totalProfit'].forEach(id => {
//             const el = document.getElementById(id);
//             if (el) el.textContent = 'KSH 0.00';
//         });
//     }
// }

async function calculateAndDisplayAllProfits() {
    try {
        const data = allSalesData.length > 0
            ? allSalesData
            : ((await apiCall('/api/sales')).data || []);

        const now      = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const weekAgo  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        let todayProfit  = 0;
        let weekProfit   = 0;
        let monthProfit  = 0;
        let totalProfit  = 0;

        data.forEach(sale => {
            const profit   = parseFloat(sale.profit || 0);
            const saleDate = new Date(sale.created_at || sale.sales_date || sale.date);
            const saleDateKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}-${String(saleDate.getDate()).padStart(2, '0')}`;

            totalProfit += profit;
            if (saleDateKey === todayStr) todayProfit += profit;
            if (saleDate >= weekAgo)      weekProfit  += profit;
            if (saleDate >= monthAgo)     monthProfit += profit;
        });

        const fmt   = val => `KSH ${val.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        // const color = val => val >= 0 ? '#05ae3d' : '#e74c3c';

        // All profit elements — sales stats bar + revenue cards — updated together
        const updates = {
            // Sales stats bar
            'todayProfit':        todayProfit,
            'totalProfit':        totalProfit,

            // Revenue stat cards
            'todayProfitRevenue': todayProfit,
            'weeklyProfit':       weekProfit,
            'monthlyProfit':      monthProfit,
        };

        Object.entries(updates).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = fmt(val);
                // el.style.color = color(val);
            }
        });

    } catch (error) {
        console.error('Error calculating profits:', error);
        ['todayProfit', 'totalProfit', 'todayProfitRevenue', 'weeklyProfit', 'monthlyProfit']
            .forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = 'KSH 0.00';
            });
    }
}
async function updateSalesStatsFromBackend() {
    try {
        const response = await apiCall('/api/sales/stats/summary');
        
        if (response.success && response.data) {
            const stats = response.data;
            
            // Update sales page stats
            if (document.getElementById('dailySalesTotal')) {
                document.getElementById('dailySalesTotal').textContent = 
                    `${(stats.daily?.total_revenue || 0).toFixed(2)}`;
                document.getElementById('weeklySalesTotal').textContent = 
                    `${(stats.weekly?.total_revenue || 0).toFixed(2)}`;
                document.getElementById('monthlySalesTotal').textContent = 
                    `${(stats.monthly?.total_revenue || 0).toFixed(2)}`;
                document.getElementById('allTimeSales').textContent = 
                    `${(stats.allTime?.total_revenue || 0).toFixed(2)}`;
            }
            
            // Update dashboard stats
            if (document.getElementById('todaySales')) {
                const todayStats = stats.daily || {};
                document.getElementById('todaySales').textContent = 
                    `KSH ${(todayStats.total_revenue || 0).toFixed(2)}`;
                document.getElementById('todaySalesCount').textContent = 
                    `${todayStats.sales_count || 0} sales`;
            }
        }
        //  await loadTotalProfit();
        await calculateAndDisplayAllProfits();
    } catch (error) {
        console.error('Error fetching sales stats:', error);
        
        // Show error state
        if (document.getElementById('dailySalesTotal')) {
            document.getElementById('dailySalesTotal').textContent = 'KSH 0.00';
            document.getElementById('weeklySalesTotal').textContent = 'KSH 0.00';
            document.getElementById('monthlySalesTotal').textContent = 'KSH 0.00';
            document.getElementById('allTimeSales').textContent = 'KSH 0.00';
        }
        
        if (document.getElementById('todaySales')) {
            document.getElementById('todaySales').textContent = 'KSH 0.00';
            document.getElementById('todaySalesCount').textContent = '0 sales';
        }
    }
}

async function updateRevenueStatsFromBackend() {
    try {
        const response = await apiCall('/api/revenue/summary');
        let expenseStats = { weekly: 0, monthly: 0, today: 0, allTime: 0 };
        
        // Also fetch expense stats to ensure accurate weekly/monthly expenses
        try {
            const expenseResponse = await apiCall('/api/expenses/stats/summary');
            if (expenseResponse.success && expenseResponse.data) {
                expenseStats = expenseResponse.data;
            }
        } catch (error) {
            console.warn('⚠️ Could not fetch expense stats:', error.message);
        }

        if (response.success && response.data) {
            const stats = response.data;

            const daily = stats.daily || {};
            const weekly = stats.weekly || {};
            const monthly = stats.monthly || {};
            const allTime = stats.allTime || {};

            if (document.getElementById('totalRevenueAll')) {
                document.getElementById('totalRevenueAll').textContent = `KSH ${Number(allTime.revenue || 0).toLocaleString()}`;
            }

            if (document.getElementById('todayRevenue')) {
                document.getElementById('todayRevenue').textContent = `KSH ${Number(daily.revenue ).toFixed(2)} `;
            }
            if (document.getElementById('todayRevenueCount')) {
                document.getElementById('todayRevenueCount').textContent = `${daily.sales_count || 0} transactions`;
            }

            if (document.getElementById('weekRevenue')) {
                document.getElementById('weekRevenue').textContent = `KSH ${Number(weekly.revenue ).toFixed(2)}`;
            }
            if (document.getElementById('weekRevenueCount')) {
                document.getElementById('weekRevenueCount').textContent = `${weekly.sales_count || 0} transactions`;
            }

            if (document.getElementById('monthRevenue')) {
                document.getElementById('monthRevenue').textContent = `KSH ${Number(monthly.revenue || 0).toFixed(2)}`;
            }
            if (document.getElementById('monthRevenueCount')) {
                document.getElementById('monthRevenueCount').textContent = `${monthly.sales_count || 0} transactions`;
            }

            if (document.getElementById('avgRevenue')) {
                const avg = (allTime.revenue || 0) / Math.max(1, (allTime.sales_count || 1));
                document.getElementById('avgRevenue').textContent = `KSH ${avg.toFixed(2)}`;
            }

            if (document.getElementById('weeklyProfit')) {
                document.getElementById('weeklyProfit').textContent = `KSH ${Number(weekly.profit || 0).toFixed(2)}`;
            }
            if (document.getElementById('monthlyProfit')) {
                document.getElementById('monthlyProfit').textContent = `KSH ${Number(monthly.profit || 0).toFixed(2)}`;
            }

            if (document.getElementById('weeklyRevenue')) {
                document.getElementById('weeklyRevenue').textContent = `KSH ${Number(weekly.revenue || 0).toFixed(2)}`;
            }
            if (document.getElementById('weeklyExpenses')) {
                document.getElementById('weeklyExpenses').textContent = `KSH ${Number(expenseStats.weekly || 0).toFixed(2)}`;
            }

            if (document.getElementById('monthlyRevenue')) {
                document.getElementById('monthlyRevenue').textContent = `KSH ${Number(monthly.revenue || 0).toFixed(2)}`;
            }
            if (document.getElementById('monthlyExpenses')) {
                document.getElementById('monthlyExpenses').textContent = `KSH ${Number(expenseStats.monthly || 0).toFixed(2)}`;
            }

            if (document.getElementById('todayProfit')) {
                document.getElementById('todayProfit').textContent = `KSH ${Number(daily.profit || 0).toFixed(2)}`;
            }

            if (document.getElementById('netRevenue')) {
                const netAll = Number(allTime.revenue || 0) - Number(expenseStats.allTime || 0);
                document.getElementById('netRevenue').textContent = `KSH ${netAll.toFixed(2)}`;
            }

            // Add weekly net revenue (revenue - expenses)
            if (document.getElementById('weeklyNetRevenue')) {
                const weeklyNet = Number(weekly.revenue || 0) - Number(expenseStats.weekly || 0);
                document.getElementById('weeklyNetRevenue').textContent = `KSH ${weeklyNet.toFixed(2)}`;
            }

           
            if (document.getElementById('monthlyNetRevenue')) {
    const monthlyNet = Number(monthly.revenue || 0) - Number(expenseStats.monthly || 0);
    document.getElementById('monthlyNetRevenue').textContent = `KSH ${monthlyNet.toFixed(2)}`;
}

            if (document.getElementById('profitMargin')) {
                const margin = (Number(allTime.revenue || 0) > 0) ? (Number(allTime.profit || 0) / Number(allTime.revenue || 1)) * 100 : 0;
                document.getElementById('profitMargin').textContent = `${margin.toFixed(2)}%`;
            }
        }
        await calculateAndDisplayAllProfits();
    } catch (error) {
        console.error('Error fetching revenue stats:', error);
    }
}
function updateSalesPaginationUI() {
    const prevBtn = document.getElementById('prevSalesBtn');
    const nextBtn = document.getElementById('nextSalesBtn');
    const pageInfo = document.getElementById('salesPageInfo');
    if (!prevBtn || !nextBtn || !pageInfo) return;

    const totalPages = Math.max(1, Math.ceil(salesTotal / salesLimit));

    pageInfo.textContent = `Page ${salesPage} of ${totalPages}`;

    prevBtn.disabled = salesPage <= 1;
    prevBtn.style.opacity = salesPage <= 1 ? '0.5' : '1';

    nextBtn.disabled = salesPage >= totalPages;
    nextBtn.style.opacity = salesPage >= totalPages ? '0.5' : '1';
}

// Update expense stats from backend
async function updateExpenseStatsFromBackend() {
    try {
        const response = await apiCall('/api/expenses/stats/summary');
        if (response.success && response.data) {
            const expenseData = response.data;
            
            // Capture weekly expenses independently
            const weeklyExpenses = Number(expenseData.weekly || 0);
            const monthlyExpenses = Number(expenseData.monthly || 0);
            const todayExpenses = Number(expenseData.today || 0);
            const allTimeExpenses = Number(expenseData.allTime || 0);
            
            // Update weekly expenses (set to zero if none)
            if (document.getElementById('weeklyExpenses')) {
                document.getElementById('weeklyExpenses').textContent = `KSH ${weeklyExpenses.toFixed(2)}`;
            }
            
            // Push weekly expenses to monthly (add to monthly display)
            if (document.getElementById('monthlyExpenses')) {
                document.getElementById('monthlyExpenses').textContent = `KSH ${monthlyExpenses.toFixed(2)}`;
            }
            
            // Update other expense displays
            if (document.getElementById('todayExpenses')) {
                document.getElementById('todayExpenses').textContent = `KSH ${todayExpenses.toLocaleString()}`;
            }

            if (document.getElementById('totalExpenses')) {
                document.getElementById('totalExpenses').textContent = `KSH ${allTimeExpenses.toLocaleString()}`;
            }

            if (document.getElementById('weekExpenses')) {
                document.getElementById('weekExpenses').textContent = `KSH ${weeklyExpenses.toLocaleString()}`;
            }

            if (document.getElementById('monthExpenses')) {
                document.getElementById('monthExpenses').textContent = `KSH ${monthlyExpenses.toLocaleString()}`;
            }

            // Return expenses data for use in revenue calculations
            return { weekly: weeklyExpenses, monthly: monthlyExpenses, today: todayExpenses, allTime: allTimeExpenses };
        }
    } catch (error) {
        console.error('Error fetching expense stats:', error);
        return { weekly: 0, monthly: 0, today: 0, allTime: 0 };
    }
}

// Update repairs and services revenue stats from backend
async function updateRepairsServicesStatsFromBackend() {
    try {
        const response = await apiCall('/api/revenue/repairs-services-summary');
        
        if (response.success && response.data) {
            const stats = response.data;
            const allTime = stats.allTime || {};
            
            // Get breakdown by service type for payment methods
            let cashTotal = 0;
            let mpesaTotal = 0;
            let cardTotal = 0;
            let bankTotal = 0;
            
            // Fetch all services to calculate payment method totals
            try {
                const servicesResponse = await apiCall('/api/revenue/repairs-services');
                if (servicesResponse.success && Array.isArray(servicesResponse.data)) {
                    servicesResponse.data.forEach(service => {
                        const amount = Number(service.amount || 0);
                        const method = (service.payment_method || '').toLowerCase();
                        
                        if (method.includes('cash')) {
                            cashTotal += amount;
                        } else if (method.includes('mpesa')) {
                            mpesaTotal += amount;
                        } else if (method.includes('card')) {
                            cardTotal += amount;
                        } else if (method.includes('bank')) {
                            bankTotal += amount;
                        }
                    });
                }
            } catch (error) {
                console.warn('Could not fetch services breakdown:', error.message);
            }
            
            // Update dashboard card
            if (document.getElementById('RepairsRevenue')) {
                document.getElementById('RepairsRevenue').textContent = `KSH ${Number(allTime.total || 0).toFixed(2)}`;
            }
            
            if (document.getElementById('RepairsCashRevenue')) {
                document.getElementById('RepairsCashRevenue').textContent = `KSH ${cashTotal.toFixed(2)}`;
            }
            
            if (document.getElementById('RepairsMpesaRevenue')) {
                document.getElementById('RepairsMpesaRevenue').textContent = `KSH ${mpesaTotal.toFixed(2)}`;
            }
            
            if (document.getElementById('RepairsNetRevenue')) {
                document.getElementById('RepairsNetRevenue').textContent = `KSH ${(cashTotal + mpesaTotal + cardTotal + bankTotal).toFixed(2)}`;
            }
        }
    } catch (error) {
        console.warn('Error fetching repairs and services stats:', error);
    }
}

// Render Revenue & Expenses Breakdown Circular Chart
async function renderRevenueBreakdownChart() {
    try {
        const canvas = document.getElementById('revenueBreakdownChart');
        if (!canvas) return; // Chart container not in DOM

        // Fetch revenue summary and sales data
        const revenueResponse = await apiCall('/api/revenue/summary');
        const salesResponse = await apiCall('/api/sales?limit=1000&offset=0');
        
        let totalMonthlyRevenue = 0;
        let salesRevenue = 0;
        let monthlyExpenses = 0;
        let otherRevenue = 0;

        // Get total and expenses from revenue summary
        if (revenueResponse.success && revenueResponse.data) {
            const stats = revenueResponse.data;
            totalMonthlyRevenue = Number(stats.monthly?.revenue || 0);
            monthlyExpenses = Number(stats.monthly?.expenses || 0);
        }

        // Calculate sales revenue from sales data (current month)
        if (salesResponse.success && Array.isArray(salesResponse.data)) {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            
            salesRevenue = salesResponse.data
                .filter(sale => {
                    const saleDate = new Date(sale.sales_date || sale.date || sale.created_at);
                    return saleDate >= monthStart && saleDate <= now;
                })
                .reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
        }

        // Calculate other revenue (repairs, services, manual entries, etc.)
        otherRevenue = Math.max(0, totalMonthlyRevenue - salesRevenue);

        // Destroy existing chart if it exists
        const existingChart = window.revenueBreakdownChartInstance;
        if (existingChart) {
            existingChart.destroy();
        }

        // Create donut chart with multiple revenue sources
        const ctx = canvas.getContext('2d');
        window.revenueBreakdownChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Sales Revenue', 'Other Sources', 'Expenses'],
                datasets: [{
                    data: [salesRevenue, otherRevenue, monthlyExpenses],
                    backgroundColor: [
                        '#3b82f6', // Blue for sales
                        '#10b981', // Green for other revenue
                        '#ef4444'  // Red for expenses
                    ],
                    borderColor: [
                        '#1e40af',
                        '#059669',
                        '#dc2626'
                    ],
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 14, weight: '600' },
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = 'KSH ' + Number(context.parsed).toLocaleString();
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return label + ': ' + value + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error rendering revenue breakdown chart:', error);
    }
}


function prevSalesPage() {
    if (salesPage > 1) {
        salesPage--;
        applyClientSidePagination();
    }
}

function nextSalesPage() {
    const totalPages = Math.ceil(salesTotal / salesLimit);
    if (salesPage < totalPages) {
        salesPage++;
        applyClientSidePagination();
    }
}

// Store all products for search
let allProductsForSale = [];

async function loadProductsForSale() {
    try {
        const products = await apiCall('/api/products');
        
        // Store all in-stock products
        allProductsForSale = Array.isArray(products) 
            ? products.filter(p => (parseInt(p.stock) || 0) > 0)
            : [];

        renderProductSearch(''); // show all initially

    } catch (error) {
        console.error('Error loading products for sale:', error);
        showNotification('Error loading products', 'error');
    }
}

function renderProductSearch(query) {
    const list = document.getElementById('productSearchResults');
    if (!list) return;

    const q = query.toLowerCase().trim();
    const filtered = q
        ? allProductsForSale.filter(p =>
            (p.name || '').toLowerCase().includes(q) ||
            (p.category || '').toLowerCase().includes(q)
          )
        : allProductsForSale;

    if (filtered.length === 0) {
        list.innerHTML = `<div class="product-search-empty">No products found</div>`;
        list.style.display = 'block';
        return;
    }

    list.innerHTML = filtered.map(p => {
        const price = fixProductPrice(p.price);
        const stock = parseInt(p.stock) || 0;
        return `
            <div class="product-search-item" onclick="selectProductFromSearch(${p.id}, '${(p.name || '').replace(/'/g, "\\'")}', ${price}, ${stock})">
                <div class="product-search-name">${p.name || 'Unnamed'}</div>
                <div class="product-search-meta">
                    <span class="product-search-price">KSH ${price.toFixed(2)}</span>
                    <span class="product-search-stock ${stock < 5 ? 'low' : ''}">Stock: ${stock}</span>
                </div>
            </div>
        `;
    }).join('');

    list.style.display = 'block';
}

function selectProductFromSearch(id, name, price, stock) {
    // Clear search
    const input = document.getElementById('productSearchInput');
    if (input) input.value = '';
    const list = document.getElementById('productSearchResults');
    if (list) list.style.display = 'none';

    // Add to cart
    const existingItem = cart.find(item => item.id == id);
    if (existingItem) {
        if (existingItem.quantity < stock) {
            existingItem.quantity++;
        } else {
            showNotification(`Only ${stock} units available in stock!`, 'warning');
            return;
        }
    } else {
        cart.push({ id: String(id), name, price, stock, quantity: 1 });
    }

    updateCartDisplay();
}

// Show new sale modal
function showNewSaleModal() {
    if (!document.getElementById('newSaleModal')) {
        createNewSaleModal();
    }

    const modal = document.getElementById('newSaleModal');
    modal.style.display = 'block';
    loadProductsForSale();
    cart = [];
    updateCartDisplay();
}
function createNewSaleModal() {
    const modalHTML = `
    <div id="newSaleModal" class="modal">
        <div class="modal-content" style="max-width: 900px;">
            <h2>Record New Sale</h2>
            <form id="newSaleForm">
                <div class="form-row">
                    <div class="form-group" style="flex: 1;">
                        <label for="customerName">Customer Name</label>
                        <input type="text" id="customerName" class="form-control" 
                               placeholder="Enter customer name (optional)">
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label for="customerPhone">Phone Number</label>
                        <input type="tel" id="customerPhone" class="form-control" 
                               placeholder="Phone (optional)">
                    </div>
                </div>

                <div class="form-group">
                    <label>Search & Add Products</label>
                    <div class="product-search-wrapper">
                        <input type="text" id="productSearchInput" class="form-control"
                               placeholder="Type product name to search..."
                               oninput="renderProductSearch(this.value)"
                               onfocus="renderProductSearch(this.value)"
                               autocomplete="off" />
                        <div id="productSearchResults" class="product-search-results" style="display:none;"></div>
                    </div>
                </div>

                <div class="cart-section">
                    <h4>Shopping Cart</h4>
                    <div id="saleCart" style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Price</th>
                                    <th>Quantity</th>
                                    <th>Total</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="cartItems">
                                <tr id="emptyCartMessage">
                                    <td colspan="5" style="text-align: center; color: #999; padding: 20px;">
                                        No items in cart
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group" style="flex: 1;">
                        <label for="paymentMethod">Payment Method</label>
                        <select id="paymentMethod" class="form-control" required>
                            <option value="cash">Cash</option>
                            <option value="mpesa">M-Pesa</option>
                            <option value="card">Card</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="credit">Credit</option>
                        </select>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label for="saleTotal">Total Amount (KSH)</label>
                        <input type="text" id="saleTotal" class="form-control"
                               value="0.00" readonly style="font-weight: bold; font-size: 18px;">
                    </div>
                </div>

                <div class="form-group">
                    <label for="saleNotes">Notes</label>
                    <textarea id="saleNotes" class="form-control" rows="2"
                              placeholder="Any additional notes..."></textarea>
                </div>

                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-check"></i> Complete Sale
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="closeNewSaleModal()">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('newSaleForm').addEventListener('submit', processNewSale);

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const wrapper = document.getElementById('newSaleModal')?.querySelector('.product-search-wrapper');
        if (wrapper && !wrapper.contains(e.target)) {
            const list = document.getElementById('productSearchResults');
            if (list) list.style.display = 'none';
        }
    });
}
// Add product to cart
function addProductToCart() {
    const productSelect = document.getElementById('productSelect');
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    
    if (!selectedOption.value) return;
    
    const product = {
        id: selectedOption.value,
        name: selectedOption.getAttribute('data-name'),
        price: parseFloat(selectedOption.getAttribute('data-price')) || 0,
        stock: parseInt(selectedOption.getAttribute('data-stock')) || 0,
        quantity: 1
    };
    
    // Validate the product data
    if (isNaN(product.price) || product.price <= 0) {
        showNotification('Product price is invalid', 'error');
        return;
    }
    
    if (isNaN(product.stock) || product.stock <= 0) {
        showNotification('Product stock is invalid', 'error');
        return;
    }
    
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
        } else {
            showNotification(`Only ${product.stock} units available in stock!`, 'warning');
            return;
        }
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    updateCartDisplay();
    productSelect.selectedIndex = 0;
}

// Update cart display
function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const saleTotal = document.getElementById('saleTotal');
    
    if (!cartItems || !saleTotal) return;
    
    if (cart.length === 0) {
        if (emptyCartMessage) emptyCartMessage.style.display = '';
        saleTotal.value = '0.00';
        return;
    }
    
    if (emptyCartMessage) emptyCartMessage.style.display = 'none';
    
    cartItems.innerHTML = cart.map((item, index) => `
        <tr>
            <td>${item.name}</td>
            <td>KSH ${item.price.toFixed(2)}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <button class="btn btn-sm btn-secondary" onclick="updateCartQuantity(${index}, -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" value="${item.quantity}" min="1" max="${item.stock}" 
                           style="width: 60px; text-align: center;" 
                           onchange="updateCartQuantityInput(${index}, this.value)">
                    <button class="btn btn-sm btn-secondary" onclick="updateCartQuantity(${index}, 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </td>
            <td>KSH ${(item.price * item.quantity).toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="removeFromCart(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    saleTotal.value = total.toFixed(2);
}

// Cart quantity functions
function updateCartQuantity(index, change) {
    const item = cart[index];
    const newQuantity = item.quantity + change;
    
    if (newQuantity < 1) {
        removeFromCart(index);
        return;
    }
    
    if (newQuantity > item.stock) {
        showNotification(`Only ${item.stock} units available in stock!`, 'warning');
        return;
    }
    
    cart[index].quantity = newQuantity;
    updateCartDisplay();
}

function updateCartQuantityInput(index, value) {
    const quantity = parseInt(value);
    const item = cart[index];
    
    if (isNaN(quantity) || quantity < 1) {
        cart[index].quantity = 1;
    } else if (quantity > item.stock) {
        showNotification(`Only ${item.stock} units available in stock!`, 'warning');
        cart[index].quantity = item.stock;
    } else {
        cart[index].quantity = quantity;
    }
    
    updateCartDisplay();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartDisplay();
}

// Process new sale - DB ONLY
async function processNewSale(e) {
    e.preventDefault();
    
    if (cart.length === 0) {
        showNotification('Please add products to the cart before completing the sale.', 'warning');
        return;
    }
    
    // Disable submit button to prevent double submission
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;
    
    try {
        const customerName = document.getElementById('customerName').value;
        const customerPhone = document.getElementById('customerPhone').value;
        const paymentMethod = document.getElementById('paymentMethod').value;
        const saleNotes = document.getElementById('saleNotes').value;
        const totalAmount = parseFloat(document.getElementById('saleTotal').value);
        
        // Validate stock availability before processing
        for (const item of cart) {
            const product = await apiCall(`/api/products/${item.id}`);
            if (!product || parseInt(product.stock) < item.quantity) {
                throw new Error(`Insufficient stock for ${item.name}. Available: ${product?.stock || 0}, Requested: ${item.quantity}`);
            }
        }
        
        const saleData = {
            customerName:  customerName || 'Walk-in Customer',
            customerPhone: customerPhone || '',
            customerEmail: '',
            paymentMethod: paymentMethod,
            notes: saleNotes,
            items: cart.map(item => ({
                productId: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity
            })),
            totalAmount: totalAmount,
            subtotal: totalAmount
        };
        
        // console.log('📤 Sending sale to database:', saleData);
        
        // Send to backend ONLY
        const response = await apiCall('/api/sales/manual', {
            method: 'POST',
            body: JSON.stringify(saleData)
        });
        
        if (response.success) {
            // Clear cart
            cart = [];
            
            // Close modal
            closeNewSaleModal();
            
            // Reload sales data from backend
            await loadSalesFromBackend();
            
            // Update product stock (handled by backend, but we refresh the UI)
            await loadInventoryDashboard();
            if (document.getElementById('inventory')?.classList.contains('active')) {
                loadFullInventory();
            }
            if (document.getElementById('products')?.classList.contains('active')) {
                loadProducts();
            }
            
            // Generate receipt
            if (response.data) {
                generateReceipt(response.data);
            }
            
            showNotification('✅ Sale recorded successfully in database!', 'success');
        } else {
            throw new Error(response.error || 'Failed to record sale');
        }
        
    } catch (error) {
        console.error('❌ Error processing sale:', error);
        
        // Show error message 
        let errorMessage = 'Failed to record sale: ';
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage += 'Cannot connect to database server. Please check if backend is running or network is accessible.';
        } else if (error.message.includes('Insufficient stock, consider restocking')) {
            errorMessage = error.message;
        } else {
            errorMessage += error.message;
        }
        
        showNotification(errorMessage, 'error');
        
    } finally {
        // Restore button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Update product stock after sale - now just refreshes UI, stock update handled by backend
async function updateProductStockAfterSale(cartItems) {
    // Just refresh inventory data - stock  updated by backend in transaction
    await loadInventoryDashboard();
    if (document.getElementById('inventory')?.classList.contains('active')) {
        loadFullInventory();
    }
    if (document.getElementById('products')?.classList.contains('active')) {
        loadProducts();
    }
}

// Generate receipt
function generateReceipt(sale) {
    const receiptWindow = window.open('', 'Receipt', 'width=400,height=600');
    
    receiptWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sales Receipt</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .store-name { font-size: 24px; font-weight: bold; }
                .receipt-info { margin-bottom: 20px; }
                .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .items-table th, .items-table td { padding: 8px; border-bottom: 1px solid #ddd; }
                .total { font-weight: bold; font-size: 18px; }
                .footer { margin-top: 30px; text-align: center; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="store-name">Vitronics Phones & Accessories</div>
                <div>Official Sales Receipt</div>
            </div>
            
            <div class="receipt-info">
                <div><strong>Receipt ID:</strong> ${sale.saleNumber || sale.id}</div>
                <div><strong>Date:</strong> ${new Date(sale.date || sale.sale_date).toLocaleString()}</div>
                <div><strong>Customer:</strong> ${sale.customerName || sale.customer_name}</div>
                ${sale.customerPhone || sale.customer_phone ? `<div><strong>Phone:</strong> ${sale.customerPhone || sale.customer_phone}</div>` : ''}
                <div><strong>Payment Method:</strong> ${sale.paymentMethod || sale.payment_method}</div>
            </div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${(sale.items || []).map(item => `
                        <tr>
                            <td>${item.name || item.product_name}</td>
                            <td>${item.quantity}</td>
                            <td>KSH ${(item.price || item.unit_price || 0).toFixed(2)}</td>
                            <td>KSH ${(item.total || item.total_price || 0).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div style="text-align: right;">
                <div class="total">Total: KSH ${(sale.totalAmount || sale.total_amount || 0).toFixed(2)}</div>
            </div>
            
            <div class="footer">
                <p>Thank you for your purchase!</p>
                <p>Receipt generated on ${new Date().toLocaleString()}</p>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                    
                }
            </script>
        </body>
        </html>
    `);
    
    receiptWindow.document.close();
}

// Close new sale modal
function closeNewSaleModal() {
    const modal = document.getElementById('newSaleModal');
    if (modal) {
        modal.style.display = 'none';
    }
    cart = [];
}


        
async function viewSaleDetails(saleId) {
    try {
        // console.log('Fetching sale:', saleId);
        
        // Try to find in current data first
        let sale = salesManager.salesData.find(s => s.id == saleId);
        
        if (!sale) {
            // Fetch from backend
            const response = await apiCall(`/api/sales/${saleId}`);
            if (response.success) {
                sale = response.data;
                // console.log('Sale data:', sale);
            }
        }
        
        if (!sale) {
            showNotification('Sale not found in database', 'error');
            return;
        }
        
        // Fetch items separately using the new endpoint
        let items = [];
        try {
            // console.log('Fetching items for sale:', saleId);
            const itemsResponse = await apiCall(`/api/sales/${saleId}/items`);
            if (itemsResponse.success) {
                items = itemsResponse.data;
                // console.log('Fetched items:', items.length, items);
            }
        } catch (itemsError) {
            console.error('Error fetching items:', itemsError);
            showNotification('Could not load sale items', 'warning');
        }
        
        // Safely parse total amount
        let totalAmount = 0;
        if (sale.total_amount || sale.totalAmount) {
            const amount = sale.total_amount || sale.totalAmount;
            if (typeof amount === 'string') {
                totalAmount = parseFloat(amount) || 0;
            } else if (typeof amount === 'number') {
                totalAmount = amount;
            }
        }
        
        // If total is 0 but we have items, calculate from items
        if (totalAmount === 0 && items.length > 0) {
            totalAmount = items.reduce((sum, item) => {
                return sum + (parseFloat(item.total) || (parseFloat(item.quantity) * parseFloat(item.price)) || 0);
            }, 0);
        }
        
        // Format sale data for display
        const formattedSale = {
            id: sale.id,
            saleNumber: sale.sale_number || sale.saleNumber || sale.order_id || `POS-${sale.id}`,
            customerName: sale.customer_name || sale.customerName || 'Walk-in Customer',
            customerPhone: sale.customer_phone || sale.customerPhone || '',
            customerEmail: sale.customer_email || sale.customerEmail || '',
            paymentMethod: sale.payment_method || sale.paymentMethod || 'Cash',
            paymentStatus: sale.payment_status || sale.status || sale.paymentStatus || 'Completed',
            notes: sale.notes || '',
            date: sale.sale_date || sale.date || sale.created_at || new Date(),
            totalAmount: totalAmount,
            items: items
        };
        
        // Display the modal
        const detailsHTML = `
        <div id="saleDetailsModal" class="modal" style="display: block;">
            <div class="modal-content" style="max-width: 700px;">
                <span class="close" onclick="closeSaleDetailsModal()" style="float: right; cursor: pointer; font-size: 24px;">&times;</span>
                <h2>Sale Details - ${formattedSale.saleNumber}</h2>
                <div style="margin-bottom: 20px;">
                    <p><strong>Customer:</strong> ${formattedSale.customerName}</p>
                    ${formattedSale.customerPhone ? `<p><strong>Phone:</strong> ${formattedSale.customerPhone}</p>` : ''}
                    ${formattedSale.customerEmail ? `<p><strong>Email:</strong> ${formattedSale.customerEmail}</p>` : ''}
                    <p><strong>Date:</strong> ${new Date(formattedSale.date).toLocaleString()}</p>
                    <p><strong>Payment Method:</strong> ${formattedSale.paymentMethod}</p>
                    <p><strong>Status:</strong> <span class="badge bg-success">${formattedSale.paymentStatus}</span></p>
                    ${formattedSale.notes ? `<p><strong>Notes:</strong> ${formattedSale.notes}</p>` : ''}
                </div>
                
                <h4>Items Sold:</h4>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${formattedSale.items && formattedSale.items.length > 0 ? 
                            formattedSale.items.map(item => {
                                // Safely parse item prices
                                const unitPrice = parseFloat(item.price || item.unit_price || 0) || 0;
                                const totalPrice = parseFloat(item.total || item.total_price || 0) || 0;
                                return `
                                <tr>
                                    <td>${item.name || item.product_name || 'Unknown Product'}</td>
                                    <td>${item.quantity || 0}</td>
                                    <td>KSH ${unitPrice.toFixed(2)}</td>
                                    <td>KSH ${totalPrice.toFixed(2)}</td>
                                </tr>
                            `}).join('') 
                            : `<tr><td colspan="4" style="text-align: center;">No items found for this sale</td></tr>`
                        }
                    </tbody>
                </table>
                
                <div style="text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold;">
                    Total: KSH ${formattedSale.totalAmount.toFixed(2)}
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn btn-secondary" onclick="closeSaleDetailsModal()">
                        Close
                    </button>
                    <button class="btn btn-primary" onclick="printReceipt('${formattedSale.id}')">
                        <i class="fas fa-print"></i> Print Receipt
                    </button>
                </div>
            </div>
        </div>
        `;
        

        // Remove any existing modal
        const existingModal = document.getElementById('saleDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', detailsHTML);
        
    } catch (error) {
        console.error('Error viewing sale details:', error);
        showNotification('Error loading sale details from database', 'error');
    }
}
// Close sale details modal
function closeSaleDetailsModal() {
    const modal = document.getElementById('saleDetailsModal');
    if (modal) {
        modal.remove();
    }
}

// function printReceipt(saleId) {
//     const sale = salesManager.salesData.find(s => s.id === saleId);
//     if (sale) {
//         generateReceipt(sale);
//     }
// }

// Print Receipt for Thermal Printer (80mm width)
async function printReceipt(saleId) {
    try {
        showNotification('Preparing receipt...', 'info');
        
        // Fetch sale data
        let sale = salesManager.salesData.find(s => s.id == saleId);
        
        if (!sale) {
            const response = await apiCall(`/api/sales/${saleId}`);
            if (response.success) {
                sale = response.data;
            }
        }
        
        if (!sale) {
            showNotification('Sale not found', 'error');
            return;
        }
        
        // Fetch items
        let items = [];
        try {
            const itemsResponse = await apiCall(`/api/sales/${saleId}/items`);
            if (itemsResponse.success) {
                items = itemsResponse.data;
            }
        } catch (error) {
            console.error('Error fetching items:', error);
        }
        
        // Calculate totals
        let totalAmount = parseFloat(sale.total_amount || sale.totalAmount || 0);
        if (totalAmount === 0 && items.length > 0) {
            totalAmount = items.reduce((sum, item) => {
                return sum + (parseFloat(item.total_price || item.total || 0) || 
                             (parseInt(item.quantity) * parseFloat(item.unit_price || item.price || 0)));
            }, 0);
        }
        
        // Format date
        const saleDate = new Date(sale.sales_date || sale.date || sale.created_at || new Date());
        const formattedDate = saleDate.toLocaleDateString() + ' ' + saleDate.toLocaleTimeString();
        
        // Store/Company details
        const storeName = 'VITRONICS TECHNOLOGIES LIMITED';
        const storePhone = '0703182530';
        const storeEmail = 'info@vitronicstechnologies.co.ke';
        const storeAddress = 'Nairobi, Kenya';
        
        // Generate receipt HTML with thermal printer optimized styling
        const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt - ${sale.order_id || sale.saleNumber || saleId}</title>
            <style>
                @page {
                    size: 80mm auto; /* Thermal printer width */
                    margin: 0;
                }
                body {
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    width: 72mm; /* Slightly less than 80mm for margins */
                    margin: 0 auto;
                    padding: 5px;
                    background: white;
                    color: black;
                }
                .header {
                    text-align: center;
                    margin-bottom: 10px;
                    border-bottom: 1px dashed #000;
                    padding-bottom: 5px;
                }
                .store-name {
                    font-size: 16px;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .store-details {
                    font-size: 10px;
                }
                .receipt-title {
                    font-size: 14px;
                    font-weight: bold;
                    margin: 5px 0;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    margin: 3px 0;
                }
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 10px 0;
                    font-size: 11px;
                }
                .items-table th {
                    border-bottom: 1px solid #000;
                    padding: 3px 0;
                    text-align: left;
                }
                .items-table td {
                    padding: 2px 0;
                }
                .items-table .item-name {
                    max-width: 100px;
                    overflow: hidden;
                    white-space: nowrap;
                }
                .qty, .price, .total {
                    text-align: right;
                }
                .totals {
                    border-top: 1px solid #000;
                    margin-top: 5px;
                    padding-top: 5px;
                }
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    font-weight: bold;
                    font-size: 12px;
                }
                .grand-total {
                    font-size: 14px;
                    font-weight: bold;
                    border-top: 2px solid #000;
                    border-bottom: 2px solid #000;
                    padding: 5px 0;
                    margin: 5px 0;
                }
                .payment-info {
                    margin: 10px 0;
                    padding: 5px 0;
                    border-top: 1px dashed #000;
                    border-bottom: 1px dashed #000;
                }
                .footer {
                    text-align: center;
                    margin-top: 15px;
                    font-size: 10px;
                    border-top: 1px dashed #000;
                    padding-top: 10px;
                }
                .thank-you {
                    font-size: 12px;
                    font-weight: bold;
                    margin: 5px 0;
                }
                @media print {
                    .no-print {
                        display: none;
                    }
                }
                .no-print {
                    text-align: center;
                    margin-top: 20px;
                }
                .no-print button {
                    padding: 8px 15px;
                    margin: 0 5px;
                    font-size: 12px;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="store-name">${storeName}</div>
                <div class="store-details">${storeAddress}</div>
                <div class="store-details">Tel: ${storePhone}</div>
                <div class="store-details">${storeEmail}</div>
                <div class="receipt-title">SALES RECEIPT</div>
            </div>
            
            <div class="info-row">
                <span>Receipt No:</span>
                <span>${sale.order_id || sale.saleNumber || `POS-${saleId}`}</span>
            </div>
            <div class="info-row">
                <span>Date:</span>
                <span>${formattedDate}</span>
            </div>
            <div class="info-row">
                <span>Cashier:</span>
                <span>${sale.user_name || 'Admin'}</span>
            </div>
            <div class="info-row">
                <span>Customer:</span>
                <span>${sale.customer_name || sale.customerName || 'Walk-in Customer'}</span>
            </div>
            ${sale.customer_phone ? `
            <div class="info-row">
                <span>Phone:</span>
                <span>${sale.customer_phone}</span>
            </div>` : ''}
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th class="qty">Qty</th>
                        <th class="price">Price</th>
                        <th class="total">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.length > 0 ? items.map(item => {
                        const qty = parseInt(item.quantity) || 0;
                        const price = parseFloat(item.unit_price || item.price || 0);
                        const total = parseFloat(item.total_price || item.total || 0) || (qty * price);
                        return `
                        <tr>
                            <td class="item-name">${item.product_name || item.name || 'Product'}</td>
                            <td class="qty">${qty}</td>
                            <td class="price">${price.toFixed(2)}</td>
                            <td class="total">${total.toFixed(2)}</td>
                        </tr>
                    `}).join('') : `
                        <tr>
                            <td colspan="4" style="text-align: center;">No items</td>
                        </tr>
                    `}
                </tbody>
            </table>
            
            <div class="totals">
                <div class="info-row">
                    <span>Subtotal:</span>
                    <span>KSH ${totalAmount.toFixed(2)}</span>
                </div>
                <div class="info-row">
                    <span>Discount:</span>
                    <span>KSH 0.00</span>
                </div>
                <div class="grand-total info-row">
                    <span>TOTAL:</span>
                    <span>KSH ${totalAmount.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="payment-info">
                <div class="info-row">
                    <span>Payment Method:</span>
                    <span>${(sale.payment_method || sale.paymentMethod || 'Cash').toUpperCase()}</span>
                </div>
                <div class="info-row">
                    <span>Amount Paid:</span>
                    <span>KSH ${totalAmount.toFixed(2)}</span>
                </div>
                <div class="info-row">
                    <span>Change:</span>
                    <span>KSH 0.00</span>
                </div>
                <div class="info-row">
                    <span>Status:</span>
                    <span>${(sale.payment_status || sale.status || 'PAID').toUpperCase()}</span>
                </div>
            </div>
            
            <div class="footer">
                <div class="thank-you">THANK YOU FOR SHOPPING WITH US!</div>
                <div>Terms & Conditions Apply</div>
                <div>Goods once sold cannot be returned</div>
                <div>${new Date().toLocaleString()}</div>
                <div>----------------------------</div>
                <div>Powered by Vitronics POS</div>
            </div>
            
            <div class="no-print">
                <button onclick="window.print()">Print Receipt</button>
                <button onclick="window.close()">Close</button>
            </div>
            
            <script>
                // Auto-trigger print dialog when page loads
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                };
            </script>
        </body>
        </html>
        `;
        
        // Open print window
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        
        showNotification('Receipt ready for printing', 'success');
        
    } catch (error) {
        console.error('Error printing receipt:', error);
        showNotification('Error printing receipt: ' + error.message, 'error');
    }
}

// Alternative: Direct print function (opens print dialog immediately)
function printReceiptDirect(saleData) {
    const receiptContent = generateReceiptContent(saleData);
    
    // Create hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(receiptContent);
    iframeDoc.close();
    
    // Focus and print
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    
    // Remove iframe after printing
    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 1000);
}

// Delete sale - DB ONLY
async function deleteSale(saleId) {
    if (!confirm('Are you sure you want to delete this sale? This action cannot be undone.')) {
        return;
    }
    
    try {
        // console.log('🗑️ Deleting sale from database:', saleId);
        
        // Delete from backend ONLY
        const response = await apiCall(`/api/sales/manual/${saleId}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            // Reload sales data from backend
            await loadSalesFromBackend();
            
            // Refresh inventory data (stock was restored by backend)
            await loadInventoryDashboard();
            if (document.getElementById('inventory')?.classList.contains('active')) {
                loadFullInventory();
            }
            if (document.getElementById('products')?.classList.contains('active')) {
                loadProducts();
            }
            
            showNotification('✅ Sale deleted successfully from database', 'success');
        } else {
            throw new Error(response.error || 'Failed to delete sale');
        }
        
    } catch (error) {
        console.error('❌ Error deleting sale:', error);
        showNotification('Error deleting sale: ' + error.message, 'error');
    }
}

// Debounce — waits 500ms after user stops typing before searching
let salesSearchTimeout = null;
function debouncedSearchSales(query) {
    clearTimeout(salesSearchTimeout);
    
    // Show loading hint while waiting
    const input = document.getElementById('salesSearch');
    if (query.trim()) {
        input.style.borderColor = '#f39c12';
    } else {
        input.style.borderColor = '';
    }

    salesSearchTimeout = setTimeout(() => {
        input.style.borderColor = '';
        searchSales(query);
    }, 500); // waits 500ms after last keystroke
}


async function searchSales(query) {
    const salesList = document.getElementById('salesList');
    if (!salesList) return;

    if (!query.trim()) {
        salesPage = 1;
        loadSalesFromBackend();
        return;
    }

    // Search locally from allSalesData first (faster, works for full names)
    const q = query.toLowerCase();
    const localResults = allSalesData.filter(sale =>
        (sale.customerName || '').toLowerCase().includes(q) ||
        (sale.saleNumber || '').toString().toLowerCase().includes(q) ||
        (sale.paymentMethod || '').toLowerCase().includes(q) ||
        (sale.totalAmount || '').toString().includes(q) ||
        // Search inside product names within items
        (sale.items || []).some(item =>
            (item.product_name || item.name || '').toLowerCase().includes(q)
        )
    );

    if (localResults.length > 0) {
        // Show local results immediately
        salesManager.salesData = localResults;
        updateSalesDisplay();

        const pageInfo = document.getElementById('salesPageInfo');
        if (pageInfo) pageInfo.textContent = `${localResults.length} result${localResults.length !== 1 ? 's' : ''} found`;

        const prevBtn = document.getElementById('prevSalesBtn');
        const nextBtn = document.getElementById('nextSalesBtn');
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        return;
    }

    // Fallback to backend search if nothing found locally
    try {
        const response = await apiCall(`/api/sales/search/all?q=${encodeURIComponent(query)}`);

        if (response.success && response.data) {
            if (response.data.length === 0) {
                salesList.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 25px; color: #666;">
                            No sales found matching "<strong>${query}</strong>"
                        </td>
                    </tr>`;
                return;
            }

            salesManager.salesData = response.data.map(sale => ({
                ...sale,
                saleNumber: sale.sale_number || sale.order_id || sale.id,
                customerName: sale.customer_name || 'Walk-in Customer',
                totalAmount: parseFloat(sale.total_amount || 0),
                paymentMethod: sale.payment_method || 'Cash',
                paymentStatus: sale.status || 'Completed',
                date: sale.sales_date || sale.created_at
            }));
            updateSalesDisplay();
        }
    } catch (error) {
        console.error('Search error:', error);
        salesList.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 25px; color: #e74c3c;">
                    Search failed: ${error.message}
                    <button class="btn btn-sm btn-primary" onclick="loadSalesFromBackend()" style="margin-left: 10px;">Reset</button>
                </td>
            </tr>`;
    }
}


let globalSalesData = [];

// Generate Sales Report
async function generateSalesReport() {
    try {
        showNotification('Generating sales report...', 'info');
        
        // Get date range (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        // Fetch sales data
        const response = await apiCall(`/api/sales?startDate=${startDateStr}&endDate=${endDateStr}`);
        
        if (!response.success) {
            throw new Error(response.error || 'Failed to fetch sales data');
        }
        
        const sales = response.data || [];
        globalSalesData = sales; // Store for CSV export
        
        // Calculate summary statistics
        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, sale) => {
            const amount = parseFloat(sale.total_amount || sale.totalAmount || 0);
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        
        const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
        
        // Group by payment method
        const paymentMethodStats = {};
        sales.forEach(sale => {
            const method = sale.payment_method || sale.paymentMethod || 'cash';
            const amount = parseFloat(sale.total_amount || sale.totalAmount || 0);
            
            if (!paymentMethodStats[method]) {
                paymentMethodStats[method] = { count: 0, total: 0 };
            }
            paymentMethodStats[method].count++;
            paymentMethodStats[method].total += isNaN(amount) ? 0 : amount;
        });
        
        // Get top products
        const productSales = {};
        let totalItemsSold = 0;
        
        sales.forEach(sale => {
            const items = sale.items || [];
            items.forEach(item => {
                const productId = item.product_id || item.id;
                const productName = item.product_name || item.name || 'Unknown Product';
                const quantity = parseInt(item.quantity) || 0;
                const revenue = parseFloat(item.total_price || item.total || 0) || 
                               (quantity * (parseFloat(item.unit_price || item.price || 0)));
                
                totalItemsSold += quantity;
                
                if (!productSales[productId]) {
                    productSales[productId] = { name: productName, quantity: 0, revenue: 0 };
                }
                productSales[productId].quantity += quantity;
                productSales[productId].revenue += isNaN(revenue) ? 0 : revenue;
            });
        });
        
        // Get top 10 products
        const topProducts = Object.values(productSales)
            .map(p => ({ ...p, revenue: parseFloat(p.revenue) || 0 }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
        
        // Generate report HTML
        const reportHTML = `
        <div id="salesReportModal" class="modal" style="display: block;">
            <div class="modal-content" style="max-width: 1000px; max-height: 90vh; overflow-y: auto; padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
                    <h2 style="margin: 0;">Sales Report</h2>
                    <span onclick="closeSalesReportModal()" style="cursor: pointer; font-size: 24px;">&times;</span>
                </div>
                
                <p><strong>Period:</strong> ${new Date(startDateStr).toLocaleDateString()} - ${new Date(endDateStr).toLocaleDateString()}</p>
                <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                
                <!-- Summary Cards -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 20px 0;">
                    <div class="summary-card" style="background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center;">
                        <div style="font-size: 14px; color: #666;">Total Orders</div>
                        <div class="stat-value" style="font-size: 24px; font-weight: bold;">${totalSales}</div>
                    </div>
                    <div class="summary-card" style="background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center;">
                        <div style="font-size: 14px; color: #666;">Total Revenue</div>
                        <div class="stat-value" style="font-size: 24px; font-weight: bold; color: #28a745;">KSH ${totalRevenue.toFixed(2)}</div>
                    </div>
                    <div class="summary-card" style="background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center;">
                        <div style="font-size: 14px; color: #666;">Average Order</div>
                        <div class="stat-value" style="font-size: 24px; font-weight: bold; color: #007bff;">KSH ${averageOrderValue.toFixed(2)}</div>
                    </div>
                    <div class="summary-card" style="background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center;">
                        <div style="font-size: 14px; color: #666;">Items Sold</div>
                        <div class="stat-value" style="font-size: 24px; font-weight: bold;">${totalItemsSold}</div>
                    </div>
                </div>
                
                <!-- Payment Methods Table -->
                <div style="margin: 20px 0; background: white; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                    <h3 style="margin: 0 0 15px 0;">Payment Methods</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Method</th>
                                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Orders</th>
                                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Amount</th>
                                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(paymentMethodStats).map(([method, stats]) => {
                                const percentage = totalRevenue > 0 ? ((stats.total / totalRevenue) * 100).toFixed(1) : 0;
                                return `
                                <tr class="payment-method-row">
                                    <td style="padding: 8px 10px; border-bottom: 1px solid #dee2e6;">${method.charAt(0).toUpperCase() + method.slice(1)}</td>
                                    <td style="padding: 8px 10px; text-align: right; border-bottom: 1px solid #dee2e6;">${stats.count}</td>
                                    <td style="padding: 8px 10px; text-align: right; border-bottom: 1px solid #dee2e6;">KSH ${stats.total.toFixed(2)}</td>
                                    <td style="padding: 8px 10px; text-align: right; border-bottom: 1px solid #dee2e6;">${percentage}%</td>
                                </tr>
                            `}).join('')}
                        </tbody>
                        <tfoot>
                            <tr style="font-weight: bold; background: #f8f9fa;">
                                <td style="padding: 10px; text-align: left;">Total</td>
                                <td style="padding: 10px; text-align: right;">${totalSales}</td>
                                <td style="padding: 10px; text-align: right;">KSH ${totalRevenue.toFixed(2)}</td>
                                <td style="padding: 10px; text-align: right;">100%</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <!-- Top Products Table -->
                <div style="margin: 20px 0; background: white; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                    <h3 style="margin: 0 0 15px 0;">Top 10 Products</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">#</th>
                                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Product</th>
                                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Quantity</th>
                                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${topProducts.map((product, index) => {
                                const revenue = parseFloat(product.revenue) || 0;
                                return `
                                <tr class="product-row">
                                    <td style="padding: 8px 10px; border-bottom: 1px solid #dee2e6;">${index + 1}</td>
                                    <td style="padding: 8px 10px; border-bottom: 1px solid #dee2e6;">${product.name}</td>
                                    <td style="padding: 8px 10px; text-align: right; border-bottom: 1px solid #dee2e6;">${product.quantity}</td>
                                    <td style="padding: 8px 10px; text-align: right; border-bottom: 1px solid #dee2e6;">KSH ${revenue.toFixed(2)}</td>
                                </tr>
                            `}).join('')}
                        </tbody>
                        <tfoot>
                            <tr style="font-weight: bold; background: #f8f9fa;">
                                <td style="padding: 10px; text-align: right;" colspan="2">Total</td>
                                <td style="padding: 10px; text-align: right;">${topProducts.reduce((sum, p) => sum + p.quantity, 0)}</td>
                                <td style="padding: 10px; text-align: right;">KSH ${topProducts.reduce((sum, p) => sum + (parseFloat(p.revenue) || 0), 0).toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <!-- Action Buttons -->
                <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn btn-secondary" onclick="closeSalesReportModal()">Close</button>
                    <button class="btn btn-primary" onclick="exportReportToPDF()" style="background: #dc3545; border-color: #dc3545;">Export PDF</button>
                    <button class="btn btn-success" onclick="exportReportToCSV()">Export CSV</button>
                </div>
            </div>
        </div>
        `;
        
        // Remove existing modal
        const existingModal = document.getElementById('salesReportModal');
        if (existingModal) existingModal.remove();
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', reportHTML);
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error generating report: ' + error.message, 'error');
    }
}

// Export to PDF with product details and totals
async function exportReportToPDF() {
    try {
        showNotification('Preparing PDF...', 'info');
        
        if (!window.jspdf) {
            throw new Error('PDF library not loaded');
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let y = 20;
        
        // Title
        doc.setFontSize(18);
        doc.text('Sales Report', 15, y);
        y += 10;
        
        // Date
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 15, y);
        y += 15;
        
        // Summary Section
        doc.setFontSize(14);
        doc.text('Summary', 15, y);
        y += 10;
        
        doc.setFontSize(10);
        const summaryData = [];
        document.querySelectorAll('.summary-card').forEach(card => {
            const label = card.querySelector('div:first-child')?.textContent || '';
            const value = card.querySelector('.stat-value')?.textContent || '';
            summaryData.push([label, value]);
        });
        
        doc.autoTable({
            startY: y,
            head: [['Metric', 'Value']],
            body: summaryData,
            theme: 'striped',
            headStyles: { fillColor: [52, 73, 94] }
        });
        
        y = doc.lastAutoTable.finalY + 15;
        
        // Payment Methods Section with Total
        doc.setFontSize(14);
        doc.text('Payment Methods', 15, y);
        y += 10;
        
        const paymentData = [];
        let paymentTotal = 0;
        document.querySelectorAll('.payment-method-row').forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 3) {
                const method = cells[0]?.textContent?.trim() || '';
                const orders = cells[1]?.textContent?.trim() || '0';
                const amount = cells[2]?.textContent?.trim() || 'KSH 0';
                paymentData.push([method, orders, amount]);
                
                // Extract numeric value for total
                const amountNum = parseFloat(amount.replace('KSH', '').trim()) || 0;
                paymentTotal += amountNum;
            }
        });
        
        // Add total row
        paymentData.push(['TOTAL', '', `KSH ${paymentTotal.toFixed(2)}`]);
        
        doc.autoTable({
            startY: y,
            head: [['Method', 'Orders', 'Amount']],
            body: paymentData,
            theme: 'striped',
            headStyles: { fillColor: [52, 73, 94] },
            foot: [['', '', `KSH ${paymentTotal.toFixed(2)}`]],
            footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
        });
        
        y = doc.lastAutoTable.finalY + 15;
        
        // Check if we need a new page
        if (y > 250) {
            doc.addPage();
            y = 20;
        }
        
        // Top Products Section with Total
        doc.setFontSize(14);
        doc.text('Top 10 Products', 15, y);
        y += 10;
        
        const productData = [];
        let productRevenueTotal = 0;
        let productQuantityTotal = 0;
        
        document.querySelectorAll('.product-row').forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 4) {
                const rank = cells[0]?.textContent?.trim() || '';
                const name = cells[1]?.textContent?.trim() || '';
                const qty = cells[2]?.textContent?.trim() || '0';
                const revenue = cells[3]?.textContent?.trim() || 'KSH 0';
                productData.push([rank, name, qty, revenue]);
                
                productQuantityTotal += parseInt(qty) || 0;
                const revenueNum = parseFloat(revenue.replace('KSH', '').trim()) || 0;
                productRevenueTotal += revenueNum;
            }
        });
        
        // Add total row
        productData.push(['', 'TOTAL', productQuantityTotal.toString(), `KSH ${productRevenueTotal.toFixed(2)}`]);
        
        doc.autoTable({
            startY: y,
            head: [['#', 'Product', 'Quantity', 'Revenue']],
            body: productData,
            theme: 'striped',
            headStyles: { fillColor: [52, 73, 94] },
            foot: [['', 'TOTAL', productQuantityTotal.toString(), `KSH ${productRevenueTotal.toFixed(2)}`]],
            footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
        });
        
        // Save PDF
        doc.save(`sales-report-${new Date().toISOString().split('T')[0]}.pdf`);
        showNotification('PDF downloaded', 'success');
        
    } catch (error) {
        console.error('PDF Error:', error);
        showNotification('Error exporting to PDF: ' + error.message, 'error');
    }
}

// Export to CSV with product details and totals
function exportReportToCSV() {
    try {
        showNotification('Preparing CSV...', 'info');
        
        const sales = globalSalesData;
        if (!sales || !sales.length) {
            showNotification('No data to export', 'warning');
            return;
        }
        
        // Calculate totals
        let totalRevenue = 0;
        let totalItems = 0;
        
        // Prepare detailed sales data with products
        const salesDetails = [
            ['SALES REPORT', new Date().toLocaleString()],
            [],
            ['ORDER DETAILS'],
            ['Order ID', 'Date', 'Customer', 'Payment Method', 'Total Amount']
        ];
        
        sales.forEach(sale => {
            const amount = parseFloat(sale.total_amount || sale.totalAmount || 0);
            totalRevenue += amount;
            
            salesDetails.push([
                sale.order_id || sale.saleNumber || 'N/A',
                new Date(sale.sales_date || sale.date || sale.created_at).toLocaleDateString(),
                sale.customer_name || sale.customerName || 'Walk-in',
                sale.payment_method || sale.paymentMethod || 'cash',
                amount.toFixed(2)
            ]);
        });
        
        // Add total row for orders
        salesDetails.push([]);
        salesDetails.push(['TOTAL ORDERS', '', '', '', totalRevenue.toFixed(2)]);
        salesDetails.push([]);
        
        // Products section
        salesDetails.push(['PRODUCTS SOLD']);
        salesDetails.push(['Sale ID', 'Product Name', 'Quantity', 'Unit Price', 'Total Price']);
        
        const productTotals = {};
        
        sales.forEach(sale => {
            const items = sale.items || [];
            items.forEach(item => {
                const quantity = parseInt(item.quantity) || 0;
                const unitPrice = parseFloat(item.unit_price || item.price || 0);
                const totalPrice = parseFloat(item.total_price || item.total || 0) || (quantity * unitPrice);
                
                totalItems += quantity;
                
                // Track product totals
                const productName = item.product_name || item.name || 'Unknown';
                if (!productTotals[productName]) {
                    productTotals[productName] = { quantity: 0, revenue: 0 };
                }
                productTotals[productName].quantity += quantity;
                productTotals[productName].revenue += totalPrice;
                
                salesDetails.push([
                    sale.order_id || sale.id || 'N/A',
                    productName,
                    quantity,
                    unitPrice.toFixed(2),
                    totalPrice.toFixed(2)
                ]);
            });
        });
        
        // Add product summary
        salesDetails.push([]);
        salesDetails.push(['PRODUCT SUMMARY']);
        salesDetails.push(['Product', 'Total Quantity', 'Total Revenue']);
        
        Object.entries(productTotals).forEach(([product, data]) => {
            salesDetails.push([product, data.quantity, data.revenue.toFixed(2)]);
        });
        
        // Add grand total
        salesDetails.push([]);
        salesDetails.push(['GRAND TOTAL', '', '']);
        salesDetails.push(['Total Items Sold', totalItems, '']);
        salesDetails.push(['Total Revenue', '', totalRevenue.toFixed(2)]);
        
        // Convert to CSV
        const csv = salesDetails.map(row => 
            row.map(cell => {
                if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
                    return `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            }).join(',')
        ).join('\n');
        
        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotification('CSV downloaded', 'success');
        
    } catch (error) {
        console.error('CSV Error:', error);
        showNotification('Error exporting to CSV: ' + error.message, 'error');
    }
}

// Close modal
function closeSalesReportModal() {
    const modal = document.getElementById('salesReportModal');
    if (modal) modal.remove();
}




// ==================== REVENUE MANAGEMENT ====================

let revenueData = [];
let currentRevenuePage = 1;
const revenueItemsPerPage = 10;

// Initialize revenue
function initializeRevenue() {
    loadRevenue();
}

// Load revenue data
async function loadRevenue() {
    try {
        // Get filter values
        const filter = document.getElementById('revenueFilter')?.value || 'all';
        const paymentMethod = document.getElementById('paymentMethodFilter')?.value || '';
        const dateFrom = document.getElementById('revenueDateFrom')?.value || '';
        const dateTo = document.getElementById('revenueDateTo')?.value || '';
        const searchTerm = document.getElementById('revenueSearch')?.value || '';

        // Build query string
        let queryParams = new URLSearchParams({
            filter: filter,
            ...(paymentMethod && { payment_method: paymentMethod }),
            ...(dateFrom && { date_from: dateFrom }),
            ...(dateTo && { date_to: dateTo }),
            ...(searchTerm && { search: searchTerm })
        });

        const response = await apiCall(`/api/sales?${queryParams}`);
        
        if (response.success && response.data) {
            revenueData = response.data;
            updateRevenueStats();
            displayRevenue();
            renderRevenueBreakdownChart();
        }
    } catch (error) {
        console.error('Error loading revenue:', error);
        showNotification('Error loading revenue data', 'error');
    }
}

// Update revenue statistics
function updateRevenueStats() {

    const now = new Date();
    const today = now.toDateString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    

    let totalRevenue = 0;
    let todayRevenue = 0;
    let weekRevenue = 0;
    let monthRevenue = 0;
    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;
    
    // Profit calculations
    let totalProfit = 0;
    let todayProfit = 0;
    let weekProfit = 0;
    let monthProfit = 0;
    
    // Payment method totals
    let cashTotal = 0;
    let mpesaTotal = 0;
    let cardTotal = 0;
    let bankTotal = 0;
    let cashCount = 0;
    let mpesaCount = 0;
    let cardCount = 0;
    let bankCount = 0;
    
    // Online vs POS
    let onlineTotal = 0;
    let posTotal = 0;

    revenueData.forEach(sale => {
        const amount = parseFloat(sale.total_amount || sale.totalAmount || 0);
        const profit = parseFloat(sale.profit || 0);  // Add profit from sale data
        const date = new Date(sale.sales_date || sale.date || sale.created_at);
        const paymentMethod = (sale.payment_method || sale.paymentMethod || '').toLowerCase();
        const saleType = sale.order_id?.toString().startsWith('MANUAL-') ? 'pos' : 'online';
        
        totalRevenue += amount;
        totalProfit += profit;  // Add profit to total
        
        // Count by payment method
        if (paymentMethod.includes('cash')) {
            cashTotal += amount;
            cashCount++;
        } else if (paymentMethod.includes('mpesa')) {
            mpesaTotal += amount;
            mpesaCount++;
        } else if (paymentMethod.includes('card')) {
            cardTotal += amount;
            cardCount++;
        } else if (paymentMethod.includes('bank')) {
            bankTotal += amount;
            bankCount++;
        }
        
        // Sale type
        if (saleType === 'online') {
            onlineTotal += amount;
        } else {
            posTotal += amount;
        }
        
        // Time-based calculations
        if (date.toDateString() === today) {
            todayRevenue += amount;
            todayProfit += profit;  // Add today's profit
            todayCount++;
        }
        if (date >= weekAgo) {
            weekRevenue += amount;
            weekProfit += profit;  // Add week's profit
            weekCount++;
        }
        if (date >= monthAgo) {
            monthRevenue += amount;
            monthProfit += profit;  // Add month's profit
            monthCount++;
        }
    });

    // Payment methods (revenue table specific)
    document.getElementById('cashRevenue').textContent = `KSH ${cashTotal.toFixed(2)}`;
    document.getElementById('mpesaRevenue').textContent = `KSH ${mpesaTotal.toFixed(2)}`;
    document.getElementById('cardRevenue').textContent = `KSH ${cardTotal.toFixed(2)}`;
    document.getElementById('bankRevenue').textContent = `KSH ${bankTotal.toFixed(2)}`;
    
    document.getElementById('cashCount').textContent = `${cashCount} transactions`;
    document.getElementById('mpesaCount').textContent = `${mpesaCount} transactions`;
    document.getElementById('cardCount').textContent = `${cardCount} transactions`;
    document.getElementById('bankCount').textContent = `${bankCount} transactions`;
    
    // Averages
    const avgTransaction = revenueData.length > 0 ? totalRevenue / revenueData.length : 0;
    const maxTransaction = revenueData.reduce((max, sale) => {
        const amount = parseFloat(sale.total_amount || sale.totalAmount || 0);
        return Math.max(max, amount);
    }, 0);
    
    document.getElementById('avgRevenue').textContent = `KSH ${avgTransaction.toFixed(2)}`;
    document.getElementById('maxRevenue').textContent = `KSH ${maxTransaction.toFixed(2)}`;
    
    // Most used payment method
    const paymentCounts = {
        'Cash': cashCount,
        'M-Pesa': mpesaCount,
        'Card': cardCount,
        'Bank': bankCount
    };
    const topMethod = Object.entries(paymentCounts).sort((a, b) => b[1] - a[1])[0];
    document.getElementById('topPaymentMethod').textContent = topMethod ? topMethod[0] : '-';
    
    // Online vs POS
    document.getElementById('onlineSales').textContent = `KSH ${onlineTotal.toFixed(2)}`;
    document.getElementById('posSales').textContent = `KSH ${posTotal.toFixed(2)}`;
    
    
    // Total transactions
    document.getElementById('totalTransactions').textContent = revenueData.length;
    
    // Avg order value
    const avgOrder = revenueData.length > 0 ? totalRevenue / revenueData.length : 0;
    document.getElementById('avgOrderValue').textContent = `KSH ${avgOrder.toFixed(2)}`;
    
    
}

// Display revenue in table
function displayRevenue() {
    const tbody = document.getElementById('revenueList');
    if (!tbody) return;
    
    if (!revenueData || revenueData.length === 0) {
        document.getElementById('noRevenueData').style.display = 'block';
        tbody.innerHTML = '';
        return;
    }
    
    document.getElementById('noRevenueData').style.display = 'none';
    
    // Pagination
    const start = (currentRevenuePage - 1) * revenueItemsPerPage;
    const end = start + revenueItemsPerPage;
    const paginatedData = revenueData.slice(start, end);
    
    // Update pagination info
    const totalPages = Math.ceil(revenueData.length / revenueItemsPerPage);
    document.getElementById('revenuePageInfo').textContent = `Page ${currentRevenuePage} of ${totalPages}`;
    document.getElementById('prevRevenueBtn').disabled = currentRevenuePage === 1;
    document.getElementById('nextRevenueBtn').disabled = currentRevenuePage === totalPages;
    
    tbody.innerHTML = paginatedData.map(sale => {
        const amount = parseFloat(sale.total_amount || sale.totalAmount || 0);
        const date = new Date(sale.sales_date || sale.date || sale.created_at);
        const items = sale.items || [];
        const itemCount = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0) || 1;
        const saleType = sale.order_id?.toString().startsWith('MANUAL-') ? 'POS' : 'Online';
        const customer = sale.customer_name || sale.customerName || 'Walk-in Customer';
        
        return `
            <tr>
                <td><strong>${sale.order_id || sale.saleNumber || sale.id}</strong></td>
                <td>${customer}</td>
                <td>${itemCount} ${itemCount === 1 ? 'item' : 'items'}</td>
                <td><strong>KSH ${amount.toFixed(2)}</strong></td>
                <td>${sale.payment_method || sale.paymentMethod || 'Cash'}</td>
                <td><span class="badge ${saleType === 'Online' ? 'bg-info' : 'bg-success'}">${saleType}</span></td>
                <td>${date.toLocaleDateString()} <br> <small>${date.toLocaleTimeString()}</small></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewRevenueDetails('${sale.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Show add revenue modal
function showAddRevenueModal() {
    const modal = document.getElementById('addRevenueModal');
    const form = document.getElementById('addRevenueForm');
    
    // Set default date to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('revenueDate').value = now.toISOString().slice(0, 16);
    
    modal.style.display = 'block';
    
    // Handle form submit
    form.onsubmit = async (e) => {
        e.preventDefault();
        await saveManualRevenue();
    };
}

// Close add revenue modal
function closeAddRevenueModal() {
    document.getElementById('addRevenueModal').style.display = 'none';
    document.getElementById('addRevenueForm').reset();
}

// Save manual revenue
async function saveManualRevenue() {
    const revenueData = {
        description: document.getElementById('revenueDescription').value,
        amount: parseFloat(document.getElementById('revenueAmount').value),
        payment_method: document.getElementById('revenuePayment').value,
        category: document.getElementById('revenueCategory').value,
        date: document.getElementById('revenueDate').value,
        customer_name: document.getElementById('revenueCustomer').value || 'Walk-in Customer',
        notes: document.getElementById('revenueNotes').value
    };
    
    try {
        const response = await apiCall('/api/revenue/manual', {
            method: 'POST',
            body: JSON.stringify(revenueData)
        });
        
        if (response.success) {
            showNotification('Revenue added successfully', 'success');
            closeAddRevenueModal();
            loadRevenue(); // Reload data
            loadDashboardStats(); // Update dashboard
        }
    } catch (error) {
        showNotification('Error adding revenue: ' + error.message, 'error');
    }
}

// View revenue details
async function viewRevenueDetails(saleId) {
    try {
        const response = await apiCall(`/api/sales/${saleId}`);
        
        if (response.success) {
            const sale = response.data;
            const items = sale.items || [];
            const total = parseFloat(sale.total_amount || sale.totalAmount || 0);
            
            let itemsHtml = '';
            if (items.length > 0) {
                itemsHtml = `
                    <h4>Items:</h4>
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>${item.product_name || item.name}</td>
                                    <td>${item.quantity}</td>
                                    <td>KSH ${parseFloat(item.unit_price || item.price).toFixed(2)}</td>
                                    <td>KSH ${parseFloat(item.total_price || item.total).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }
            
            const detailsHtml = `
                <div style="padding: 20px;">
                    <p><strong>Receipt No:</strong> ${sale.order_id || sale.saleNumber || sale.id}</p>
                    <p><strong>Date:</strong> ${new Date(sale.sales_date || sale.date).toLocaleString()}</p>
                    <p><strong>Customer:</strong> ${sale.customer_name || sale.customerName || 'Walk-in Customer'}</p>
                    <p><strong>Payment Method:</strong> ${sale.payment_method || sale.paymentMethod}</p>
                    <p><strong>Status:</strong> ${sale.status || 'Completed'}</p>
                    ${itemsHtml}
                    <hr>
                    <h3 style="text-align: right;">Total: KSH ${total.toFixed(2)}</h3>
                </div>
            `;
            
            document.getElementById('revenueDetailsContent').innerHTML = detailsHtml;
            document.getElementById('revenueDetailsModal').style.display = 'block';
        }
    } catch (error) {
        showNotification('Error loading details', 'error');
    }
}

// Close revenue details modal
function closeRevenueDetailsModal() {
    document.getElementById('revenueDetailsModal').style.display = 'none';
}


// Update revenue chart
function updateRevenueChart() {
    const canvas = document.getElementById('revenueChart');
    if (!canvas) return;
    
    // Wait for Chart.js to load
    if (typeof Chart === 'undefined') {
        console.log('Chart.js not loaded yet');
        // Try again in 1 second
        setTimeout(updateRevenueChart, 1000);
        return;
    }
    
    // Get last 7 days
    const labels = [];
    const revenueData_points = [];
    const expenseData_points = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
        
        // Calculate revenue for this day
        const dayRevenue = revenueData
            .filter(sale => {
                const saleDate = new Date(sale.sales_date || sale.date || sale.created_at);
                saleDate.setHours(0, 0, 0, 0);
                return saleDate.getTime() === date.getTime();
            })
            .reduce((sum, sale) => sum + (parseFloat(sale.total_amount || sale.totalAmount || 0)), 0);
        
        revenueData_points.push(dayRevenue);
        
        // Get expenses for this day (if available)
        const dayExpense = window.expensesData ? window.expensesData
            .filter(exp => {
                const expDate = new Date(exp.date);
                expDate.setHours(0, 0, 0, 0);
                return expDate.getTime() === date.getTime();
            })
            .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0) : 0;
        
        expenseData_points.push(dayExpense);
    }
    
    // Destroy existing chart if it exists
    if (window.revenueChart instanceof Chart) {
        window.revenueChart.destroy();
    }
    
    // Get canvas context
    const ctx = canvas.getContext('2d');
    
    try {
        // Create new chart
        window.revenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue (KSH)',
                    data: revenueData_points,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Expenses (KSH)',
                    data: expenseData_points,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += 'KSH ' + context.parsed.y.toFixed(2);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'KSH ' + value;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating chart:', error);
    }
}

// Search revenue
function searchRevenue() {
    loadRevenue();
}

// Reset revenue filters
function resetRevenueFilters() {
    document.getElementById('revenueFilter').value = 'all';
    document.getElementById('paymentMethodFilter').value = '';
    document.getElementById('revenueDateFrom').value = '';
    document.getElementById('revenueDateTo').value = '';
    document.getElementById('revenueSearch').value = '';
    loadRevenue();
}

// Pagination functions
function prevRevenuePage() {
    if (currentRevenuePage > 1) {
        currentRevenuePage--;
        displayRevenue();
    }
}

function nextRevenuePage() {
    const totalPages = Math.ceil(revenueData.length / revenueItemsPerPage);
    if (currentRevenuePage < totalPages) {
        currentRevenuePage++;
        displayRevenue();
    }
}

// Export to CSV
function exportRevenueToCSV() {
    if (!revenueData || revenueData.length === 0) {
        showNotification('No data to export', 'warning');
        return;
    }
    
    const csvData = [
        ['Receipt No', 'Customer', 'Items', 'Amount', 'Payment Method', 'Type', 'Date', 'Status']
    ];
    
    revenueData.forEach(sale => {
        const items = sale.items || [];
        const itemCount = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0) || 1;
        
        csvData.push([
            sale.order_id || sale.saleNumber || sale.id,
            sale.customer_name || sale.customerName || 'Walk-in Customer',
            itemCount.toString(),
            (parseFloat(sale.total_amount || sale.totalAmount || 0)).toFixed(2),
            sale.payment_method || sale.paymentMethod || 'Cash',
            sale.order_id?.toString().startsWith('MANUAL-') ? 'POS' : 'Online',
            new Date(sale.sales_date || sale.date || sale.created_at).toLocaleString(),
            sale.status || 'Completed'
        ]);
    });
    
    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('Revenue report exported', 'success');
}

// Print revenue report
function printRevenueReport() {
    const printWindow = window.open('', '_blank');
    
    const total = revenueData.reduce((sum, sale) => 
        sum + (parseFloat(sale.total_amount || sale.totalAmount || 0)), 0);
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Revenue Report</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #f4f4f4; padding: 10px; text-align: left; }
                td { padding: 8px; border-bottom: 1px solid #ddd; }
                .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <h1>Revenue Report</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>Total Transactions: ${revenueData.length}</p>
            <p class="total">Total Revenue: KSH ${total.toFixed(2)}</p>
            
            <table>
                <thead>
                    <tr>
                        <th>Receipt No</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Payment</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${revenueData.map(sale => `
                        <tr>
                            <td>${sale.order_id || sale.saleNumber || sale.id}</td>
                            <td>${sale.customer_name || sale.customerName || 'Walk-in Customer'}</td>
                            <td>KSH ${(parseFloat(sale.total_amount || sale.totalAmount || 0)).toFixed(2)}</td>
                            <td>${sale.payment_method || sale.paymentMethod || 'Cash'}</td>
                            <td>${new Date(sale.sales_date || sale.date || sale.created_at).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

// Add Chart.js if not already included
if (!window.Chart) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    document.head.appendChild(script);
}

// ============================================
// REPAIRS & SERVICES FUNCTIONS
// ============================================


async function loadRepairsServices(selectedMonth = '') {
    try {
        const summaryResponse = await apiCall('/api/revenue/repairs-services-summary');
        if (summaryResponse.success) {
            updateRepairsServicesSummary(summaryResponse.data);
        }

        let apiUrl = '/api/revenue/repairs-services';
        if (selectedMonth) {
            const [year, month] = selectedMonth.split('-');
            const startDate = `${year}-${month}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = `${year}-${month}-${lastDay}`;
            apiUrl += `?startDate=${startDate}&endDate=${endDate}`;
        }

        const servicesResponse = await apiCall(apiUrl);
        if (servicesResponse.success) {
            allServicesData = servicesResponse.data || [];
            servicesTotal = allServicesData.length;
            servicesPage = 1; // reset to page 1 on every load/filter
            populateServicesMonthFilter(allServicesData);
            applyServicesPagination();
        }
    } catch (error) {
        console.error('Error loading repairs and services:', error);
        showNotification('Error loading services data', 'error');
    }
}

function applyServicesPagination() {
    const start = (servicesPage - 1) * servicesLimit;
    const end = start + servicesLimit;
    const pageData = allServicesData.slice(start, end);
    updateRepairsServicesTable(pageData);
    updateServicesPaginationUI();
}
function updateServicesPaginationUI() {
    const prevBtn = document.getElementById('prevServicesBtn');
    const nextBtn = document.getElementById('nextServicesBtn');
    const pageInfo = document.getElementById('servicesPageInfo');
    if (!prevBtn || !nextBtn || !pageInfo) return;

    const totalPages = Math.max(1, Math.ceil(servicesTotal / servicesLimit));

    pageInfo.textContent = `Page ${servicesPage} of ${totalPages}`;

    prevBtn.disabled = servicesPage <= 1;
    prevBtn.style.opacity = servicesPage <= 1 ? '0.5' : '1';

    nextBtn.disabled = servicesPage >= totalPages;
    nextBtn.style.opacity = servicesPage >= totalPages ? '0.5' : '1';
}

function prevServicesPage() {
    if (servicesPage > 1) {
        servicesPage--;
        applyServicesPagination();
    }
}

function nextServicesPage() {
    const totalPages = Math.ceil(servicesTotal / servicesLimit);
    if (servicesPage < totalPages) {
        servicesPage++;
        applyServicesPagination();
    }
}

// Populate month dropdown with available months from services data
function populateServicesMonthFilter(services) {
    const filterSelect = document.getElementById('servicesMonthFilter');
    if (!filterSelect) return;

    // Get unique months from services data
    const monthsSet = new Set();
    if (services && Array.isArray(services)) {
        services.forEach(service => {
            const date = new Date(service.completed_at || service.created_at);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            monthsSet.add(`${year}-${month}`);
        });
    }

    // Convert to sorted array
    const months = Array.from(monthsSet).sort().reverse();

    // Keep the first option and add month options
    const currentOptions = Array.from(filterSelect.options).map(o => o.value);
    if (!currentOptions.includes('All Months')) {
        // Reset dropdown
        filterSelect.innerHTML = '<option value="">All Months</option>';
    }

    // Add months
    months.forEach(month => {
        if (!filterSelect.querySelector(`option[value="${month}"]`)) {
            const [year, monthNum] = month.split('-');
            const monthName = new Date(year, monthNum - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
            const option = document.createElement('option');
            option.value = month;
            option.textContent = monthName;
            filterSelect.appendChild(option);
        }
    });

    // Add event listener for month filter
    filterSelect.removeEventListener('change', handleServicesMonthFilter);
    filterSelect.addEventListener('change', handleServicesMonthFilter);
}

// Handle month filter change
async function handleServicesMonthFilter(e) {
    const selectedMonth = e.target.value;
    await loadRepairsServices(selectedMonth);
}

// Update repairs and services summary cards
function updateRepairsServicesSummary(data) {
    // Today's data
    if (document.getElementById('todayServicesRevenue')) {
        const amt = Number(data.daily.total) || 0;
        document.getElementById('todayServicesRevenue').textContent = 'KSH ' + amt.toFixed(2);
    }
    if (document.getElementById('todayServicesCount')) {
        document.getElementById('todayServicesCount').textContent = (data.daily.count || 0) + ' services';
    }

    // Weekly data
    if (document.getElementById('weekServicesRevenue')) {
        const amt = Number(data.weekly.total) || 0;
        document.getElementById('weekServicesRevenue').textContent = 'KSH ' + amt.toFixed(2);
    }
    if (document.getElementById('weekServicesCount')) {
        document.getElementById('weekServicesCount').textContent = (data.weekly.count || 0) + ' services';
    }

    // Monthly data
    if (document.getElementById('monthServicesRevenue')) {
        const amt = Number(data.monthly.total) || 0;
        document.getElementById('monthServicesRevenue').textContent = 'KSH ' + amt.toFixed(2);
    }
    if (document.getElementById('monthServicesCount')) {
        document.getElementById('monthServicesCount').textContent = (data.monthly.count || 0) + ' services';
    }

    // All time data
    if (document.getElementById('totalServicesRevenue')) {
        const amt = Number(data.allTime.total) || 0;
        document.getElementById('totalServicesRevenue').textContent = 'KSH ' + amt.toFixed(2);
    }

    // Service type breakdown
    const serviceTypeMap = {
        'repair': { element: 'repairs', icon: '🔧' },
        'service': { element: 'maintenance', icon: '⚙️' },
        'consultation': { element: 'consultation', icon: '📋' },
        'installation': { element: 'installation', icon: '📦' }
    };

    // Reset all counts
    Object.values(serviceTypeMap).forEach(type => {
        if (document.getElementById(type.element + 'Amount')) {
            document.getElementById(type.element + 'Amount').textContent = 'KSH 0';
        }
        if (document.getElementById(type.element + 'Count')) {
            document.getElementById(type.element + 'Count').textContent = '0 items';
        }
    });

    // Update with actual data
    if (data.allTime.breakdown && Array.isArray(data.allTime.breakdown)) {
        data.allTime.breakdown.forEach(item => {
            const typeKey = item.service_type;
            if (serviceTypeMap[typeKey]) {
                const elem = serviceTypeMap[typeKey].element;
                if (document.getElementById(elem + 'Amount')) {
                    const amt = Number(item.total_amount) || 0;
                    document.getElementById(elem + 'Amount').textContent = 'KSH ' + amt.toFixed(2);
                }
                if (document.getElementById(elem + 'Count')) {
                    document.getElementById(elem + 'Count').textContent = (item.count || 0) + ' items';
                }
            }
        });
    }
}

// Update repairs and services table
function updateRepairsServicesTable(services) {
    const tbody = document.getElementById('servicesTableBody');
    if (!tbody) return;
    
    if (!services || services.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No services recorded yet</td></tr>';
        return;
    }

    tbody.innerHTML = services.map(service => {
        const date = new Date(service.completed_at || service.created_at);
        const serviceTypeIcons = {
            'repair': '',
            'service': ''
        };
        const icon = serviceTypeIcons[service.service_type] ;
        
        return `
            <tr>
               
                <td>${icon} ${service.service_type}</td>
                <td>${service.customer_name}</td>
                <td>${service.description}</td>
                <td>KSH ${parseFloat(service.amount).toFixed(2)}</td>
                <td>${service.payment_method}</td>
                <td><span class="badge bg-${service.status === 'completed' ? 'success' : 'warning'}">${service.status}</span></td>
            <td>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</td>
                </tr>
        `;
    }).join('');
}

// Show add repairs and services modal
function showAddRepairsServicesModal() {
    const modal = document.getElementById('addRepairsServicesModal');
    if (!modal) {
        console.error('Modal not found');
        return;
    }
    
    const form = document.getElementById('addRepairsServicesForm');
    
    // Set default date to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const dateInput = document.getElementById('serviceDate');
    if (dateInput) {
        dateInput.value = now.toISOString().slice(0, 16);
    }
    
    modal.style.display = 'block';
    
    // Handle form submit
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            await saveRepairsServices();
        };
    }
}

// Close add repairs and services modal
function closeAddRepairsServicesModal() {
    const modal = document.getElementById('addRepairsServicesModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    const form = document.getElementById('addRepairsServicesForm');
    if (form) {
        form.reset();
    }
}

// Save repairs and services
async function saveRepairsServices() {
    const servicesData = {
        service_type: document.getElementById('serviceType')?.value || 'Repair/services',
        description: document.getElementById('serviceDescription')?.value,
        customer_name: document.getElementById('serviceCustomerName')?.value|| 'Walk-in Customer',
        customer_phone: document.getElementById('serviceCustomerPhone')?.value || null,
        customer_email: document.getElementById('serviceCustomerEmail')?.value || null,
        amount: parseFloat(document.getElementById('serviceAmount')?.value || 0),
        payment_method: document.getElementById('servicePayment')?.value || 'Repairs/Services',
        product_category: document.getElementById('serviceProductCategory')?.value || null,
        technician_name: document.getElementById('serviceTechnicianName')?.value || null,
        notes: document.getElementById('serviceNotes')?.value || null,
        date: document.getElementById('serviceDate')?.value
    };
    
    // Validate required fields
    if (!servicesData.service_type || !servicesData.description || !servicesData.customer_name || !servicesData.amount || !servicesData.payment_method) {
        showNotification('Please fill in all required fields', 'warning');
        return;
    }
    
    try {
        const response = await apiCall('/api/revenue/repairs-services', {
            method: 'POST',
            body: JSON.stringify(servicesData)
        });
        
        if (response.success) {
            showNotification('Service recorded successfully', 'success');
            closeAddRepairsServicesModal();
            loadRepairsServices(); // Reload services data
            loadDashboardStats(); // Update dashboard including repairs card
            
            // Also update main revenue summary if it's showing
            if (typeof initializeRevenue === 'function') {
                initializeRevenue();
            }
        }
    } catch (error) {
        showNotification('Error adding service: ' + error.message, 'error');
    }
}


// Initialize revenue when section is shown
document.addEventListener('DOMContentLoaded', function() {
    const originalSwitchSection = window.switchSection;
    window.switchSection = function(sectionName) {
        if (originalSwitchSection) originalSwitchSection(sectionName);
        if (sectionName === 'revenue') {
            loadRevenue();
        }
        if (sectionName === 'repairs-services') {
            loadRepairsServices();
        }
    };
});

// ==================== AUTO REFRESH ====================

let autoRefreshInterval = null;
const AUTO_REFRESH_SECONDS = 30;

function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);

    autoRefreshInterval = setInterval(async () => {
        const activeSection = document.querySelector('.content-section.active')?.id;

        try {
            switch (activeSection) {
                case 'dashboard':
                    await loadDashboardStats();
                    await loadInventoryDashboard();
                    break;
                case 'sales':
                    await loadSalesFromBackend();
                    await updateSalesStatsFromBackend();
                    break;
                case 'revenue':
                    await loadRevenue();
                    await updateRevenueStatsFromBackend();
                    break;
                case 'inventory':
                    await loadFullInventory();
                    break;
                case 'orders':
                    await loadOrders();
                    break;
                default:
                    await updateSalesStatsFromBackend();
                    await calculateAndDisplayAllProfits();
                    break;
            }
        } catch (error) {
            console.warn('Auto-refresh error:', error.message);
        }

    }, AUTO_REFRESH_SECONDS * 1000);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// Pause when tab hidden, resume when visible
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopAutoRefresh();
    } else {
        startAutoRefresh();
        loadDashboardStats();
    }
});