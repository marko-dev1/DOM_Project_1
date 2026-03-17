
class AuthManager {
    constructor() {
        this.userOrders = [];
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.checkAuthStatus();
            this.setupEventListeners();
            this.setupGlobalEventHandlers();
        });
    }

    checkAuthStatus() {
        
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');

        if (token && userData) {
            try {
                const user = JSON.parse(userData);
                const userName = user.username?.trim() || user.name?.trim() || user.email;
                this.showAuthenticatedUI(userName);
                
                // Store user data fz
                this.currentUser = user;
                
            } catch (error) {
                console.error(' Error parsing user data:', error);
                this.showGuestUI();
            }
        } else {
            this.showGuestUI();
        }
    }

    // Get authentication headers for API requests
    getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    // Make authenticated API requests
    async makeAuthenticatedRequest(url, options = {}) {
        const headers = this.getAuthHeaders();
        
        const config = {
            ...options,
            headers: {
                ...headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            
            // If unauthorized, clear token and redirect to login
            if (response.status === 401) {
                this.handleLogout();
                throw new Error('Session expired. Please login again.');
            }
            
            return response;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // ORDER MANAGEMENT METHODS

    async getUserOrders() {
        try {
            const user = this.currentUser || JSON.parse(localStorage.getItem('userData'));
            const token = localStorage.getItem('authToken');

            if (!user || !token) {
                this.showMessage('Please log in to view orders', 'error');
                return [];
            }

            const userId = user.userId || user.id;
            if (!userId) {
                console.error('No user ID found');
                return [];
            }

            const response = await fetch(`/api/orders/user/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                const orders = data.data || data.orders || [];
                return orders;
            } else {
                throw new Error(data.message || 'Failed to fetch orders');
            }

        } catch (error) {
            console.error('Error fetching user orders:', error);
            this.showMessage('Failed to load orders: ' + error.message, 'error');
            return [];
        }
    }

    // 🆕 Show orders in a modal
    async showOrdersModal() {
        try {
            // Show loading state
            const modal = this.createOrdersModal();
            modal.innerHTML = `
                <div class="modal-content orders-modal">
                    <div class="modal-header">
                        <h3>My Orders</h3>
                        <span class="close-modal">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="loading-orders">
                            <p>Loading your orders...</p>
                        </div>
                    </div>
                </div>
            `;
            modal.style.display = 'block';

            // Setup modal events immediately
            this.setupModalEvents(modal);

            // Fetch orders
            const orders = await this.getUserOrders();
            
            // Update modal with orders
            if (!Array.isArray(orders) || orders.length === 0) {
                modal.innerHTML = `
                    <div class="modal-content orders-modal">
                        <div class="modal-header">
                            <h3>My Orders</h3>
                            <span class="close-modal">&times;</span>
                        </div>
                        <div class="modal-body">
                            <div class="empty-orders">
                                <p>No orders found</p>
                                <p class="empty-message">You haven't placed any orders yet.</p>
                            </div>
                        </div>
                    </div>
                `;
         } else {
                modal.innerHTML = `
            <div class="modal-content orders-modal">
                <div class="modal-header">
                    <h3>My Orders (${orders.length})</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="orders-list">
                        ${orders.map(order => {
                            // Calculate total quantity
                            const totalQuantity = order.items ? order.items.reduce((total, item) => total + (item.quantity || 1), 0) : 0;
                            
                            return `
                            <div class="order-item" data-order-id="${order.id}">
                                <div class="order-header">
                                    <div class="order-title">
                                <h4>Order #${order.id}</h4>
                                <span class="order-status ${order.status}">${order.status}</span>
                            </div>
                            <div class="order-date">${new Date(order.created_at).toLocaleDateString()}</div>
                        </div>
                        
                        <div class="order-product-preview">
                            <span class="main-product">
                                ${order.items && order.items.length > 0 ? 
                                    order.items[0].product_name + 
                                    (order.items.length > 1 ? ` + ${order.items.length - 1} more items` : '')
                                    : 'No products'
                                }
                            </span>
                        </div>
                        
                        <div class="order-details">
                            <div class="order-info">
                                <span class="order-total">Ksh ${parseFloat(order.total_amount).toFixed(2)}</span>
                                <span class="order-items">${totalQuantity} ${totalQuantity === 1 ? 'item' : 'items'}</span>
                            </div>
                            <!--<button class="btn-view-order-details" data-order-id="${order.id}">
                                Close
                            </button>-->
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>
    </div>
`;
                
                // Add event listeners to view details buttons
                modal.querySelectorAll('.btn-view-order-details').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const orderId = e.target.getAttribute('data-order-id');
                        this.viewOrderDetails(parseInt(orderId));
                    });
                });
            }

            // Store orders for later use
            this.userOrders = orders;
            
            // Update orders count
            this.updateOrdersCount(orders.length);
            
            // Re-setup modal events after content update
            this.setupModalEvents(modal);
            
        } catch (error) {
            console.error('Error showing orders modal:', error);
            this.showMessage('Failed to load orders: ' + error.message, 'error');
            
            // Show error state in modal
            const modal = document.getElementById('orders-modal');
            if (modal) {
                modal.innerHTML = `
                    <div class="modal-content orders-modal">
                        <div class="modal-header">
                            <h3>My Orders</h3>
                            <span class="close-modal">&times;</span>
                        </div>
                        <div class="modal-body">
                            <div class="error-orders">
                                <p>Failed to load orders</p>
                                <p class="error-message">Please try again later.</p>
                            </div>
                        </div>
                    </div>
                `;
                this.setupModalEvents(modal);
            }
        }
    }

    // 🆕 Create orders modal element
    createOrdersModal() {
        let modal = document.getElementById('orders-modal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'orders-modal';
            modal.className = 'modal';
            document.body.appendChild(modal);
            
            // Add CSS styles if not already present
            this.injectModalStyles();
        }
        
        return modal;
    }

    // 🆕 Setup modal events
    setupModalEvents(modal) {
        // Close modal events
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
            };
        }
        
        // Close when clicking outside
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
        
        // Close with Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                modal.style.display = 'none';
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    // 🆕 Inject CSS styles for the modal
    injectModalStyles() {
        if (document.getElementById('orders-modal-styles')) return;
        
        const styles = `
            <style id="orders-modal-styles">
                .modal {
                    display: none;
                    position: fixed;
                    z-index: 1000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.5);
                    animation: fadeIn 0.3s;
                }
                
                .orders-modal .modal-content {
                    background-color: #fefefe;
                    margin: 5% auto;
                    padding: 0;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 600px;
                    max-height: 80vh;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    animation: slideIn 0.3s ease-out;
                }
                
                .orders-modal .modal-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .orders-modal .modal-header h3 {
                    margin: 0;
                    font-size: 1.5rem;
                    font-weight: 600;
                }
                
                .orders-modal .close-modal {
                    color: white;
                    font-size: 28px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: opacity 0.2s;
                }
                
                .orders-modal .close-modal:hover {
                    opacity: 0.7;
                }
                
                .orders-modal .modal-body {
                    padding: 0;
                    max-height: 60vh;
                    overflow-y: auto;
                }
                
                .orders-list {
                    padding: 20px;
                }
                
                .loading-orders, .empty-orders, .error-orders {
                    text-align: center;
                    padding: 40px 20px;
                    color: #666;
                }
                
                .error-orders {
                    color: #dc3545;
                }
                
                .order-item {
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 12px;
                    background: white;
                    transition: all 0.2s ease;
                }
                
                .order-item:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    transform: translateY(-2px);
                }
                
                .order-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 12px;
                }
                
                .order-title {
                    flex: 1;
                }
                
                .order-title h4 {
                    margin: 0 0 4px 0;
                    color: #333;
                    font-size: 1.1rem;
                }
                
                .order-status {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                
                .order-status.pending { background: #fff3cd; color: #856404; }
                .order-status.completed { background: #d1edff; color: #0c5460; }
                .order-status.shipped { background: #d4edda; color: #155724; }
                .order-status.cancelled { background: #f8d7da; color: #721c24; }
                .order-status.processing { background: #fff3cd; color: #856404; }
                
                .order-date {
                    color: #666;
                    font-size: 0.9rem;
                }
                
                .order-details {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .order-info {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                }
                
                .order-total {
                    font-weight: 600;
                    color: #2c5530;
                    font-size: 1.1rem;
                }
                
                .order-items {
                    color: #666;
                    font-size: 0.9rem;
                }
                
                .btn-view-order-details {
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: background 0.2s;
                }
                
                .btn-view-order-details:hover {
                    background: #5a6fd8;
                }
                
                .empty-message, .error-message {
                    margin-top: 8px !important;
                    font-size: 0.9rem;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideIn {
                    from { 
                        opacity: 0;
                        transform: translateY(-50px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                /* Responsive design */
                @media (max-width: 768px) {
                    .orders-modal .modal-content {
                        margin: 10% auto;
                        width: 95%;
                        max-height: 85vh;
                    }
                    
                    .order-header {
                        flex-direction: column;
                        gap: 8px;
                    }
                    
                    .order-details {
                        flex-direction: column;
                        gap: 12px;
                        align-items: flex-start;
                    }
                    
                    .order-info {
                        width: 100%;
                        justify-content: space-between;
                    }
                    
                    .btn-view-order-details {
                        width: 100%;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    // 🆕 Method to open orders modal (call this from your UI)
    openOrdersModal() {
        this.showOrdersModal();
    }

    // 🆕 View order details in modal
    async viewOrderDetails(orderId) {
        try {
            const order = await this.getOrderDetails(orderId);
            this.showOrderDetailsModal(order);
        } catch (error) {
            console.error('Error viewing order:', error);
            this.showMessage('Failed to load order details', 'error');
        }
    }

    // Get specific order details
    async getOrderDetails(orderId) {
        try {
            const response = await this.makeAuthenticatedRequest(`/api/orders/${orderId}`);
                            
            const data = await response.json();

            if (data.success) {
                return data.order;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('❌ Error fetching order details:', error);
            this.showMessage('Failed to load order details', 'error');
            throw error;
        }
    }

    // 🆕 Show order details modal
    showOrderDetailsModal(order) {
        const modal = document.getElementById('order-details-modal') || this.createOrderDetailsModal();
        
        modal.innerHTML = `
            <div class="modal-content order-details-modal">
                <div class="modal-header">
                    <h3>Order #${order.id}</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="order-info-section">
                        <h4>Order Information</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <strong>Status:</strong>
                                <span class="status-badge status-${order.status}">${order.status}</span>
                            </div>
                            <div class="info-item">
                                <strong>Order Date:</strong>
                                <span>${new Date(order.created_at).toLocaleString()}</span>
                            </div>
                            <div class="info-item">
                                <strong>Total Amount:</strong>
                                <span>Ksh ${parseFloat(order.total_amount).toFixed(2)}</span>
                            </div>
                            <div class="info-item">
                                <strong>Shipping Address:</strong>
                                <span>${order.shipping_address || 'Not specified'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="order-items-section">
                        <h4>Order Items (${order.items ? order.items.length : 0})</h4>
                        <div class="items-list">
                            ${order.items ? order.items.map(item => `
                                <div class="order-item-detail">
                                    <div class="item-info">
                                        <span class="item-name">${item.product_name || 'Unnamed Product'}</span>
                                        <span class="item-quantity">Quantity: ${item.quantity}</span>
                                    </div>
                                    <div class="item-pricing">
                                        <span class="item-price">Ksh ${parseFloat(item.price).toFixed(2)} each</span>
                                        <span class="item-total">Ksh ${parseFloat(item.item_total || item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                </div>
                            `).join('') : '<p>No items found</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'block';
        this.setupModalEvents(modal);
    }

    // 🆕 Create order details modal element
    createOrderDetailsModal() {
        const modal = document.createElement('div');
        modal.id = 'order-details-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);
        
        // Add styles for order details modal
        this.injectOrderDetailsModalStyles();
        
        return modal;
    }

    // 🆕 Inject CSS styles for order details modal
    injectOrderDetailsModalStyles() {
        if (document.getElementById('order-details-modal-styles')) return;
        
        const styles = `
            <style id="order-details-modal-styles">
                .order-details-modal .modal-content {
                    background-color: #fefefe;
                    margin: 5% auto;
                    padding: 0;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 700px;
                    max-height: 80vh;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
                
                .order-details-modal .modal-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .order-details-modal .modal-body {
                    padding: 20px;
                    max-height: 60vh;
                    overflow-y: auto;
                }
                
                .order-info-section, .order-items-section {
                    margin-bottom: 25px;
                }
                
                .order-info-section h4, .order-items-section h4 {
                    margin-bottom: 15px;
                    color: #333;
                    border-bottom: 2px solid #667eea;
                    padding-bottom: 8px;
                }
                
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                
                .info-item {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                
                .info-item strong {
                    color: #666;
                    font-size: 0.9rem;
                }
                
                .status-badge {
                    padding: 4px 12px;
                    border-radius: 15px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    display: inline-block;
                    width: fit-content;
                }
                
                .status-completed { background: #d4edda; color: #155724; }
                .status-pending { background: #fff3cd; color: #856404; }
                .status-shipped { background: #d1edff; color: #0c5460; }
                .status-cancelled { background: #f8d7da; color: #721c24; }
                .status-processing { background: #fff3cd; color: #856404; }
                
                .items-list {
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .order-item-detail {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px;
                    border-bottom: 1px solid #e0e0e0;
                    background: white;
                }
                
                .order-item-detail:last-child {
                    border-bottom: none;
                }
                
                .item-info {
                    flex: 1;
                }
                
                .item-name {
                    font-weight: 600;
                    color: #333;
                    display: block;
                    margin-bottom: 5px;
                }
                
                .item-quantity {
                    color: #666;
                    font-size: 0.9rem;
                }
                
                .item-pricing {
                    text-align: right;
                }
                
                .item-price {
                    color: #666;
                    font-size: 0.9rem;
                    display: block;
                    margin-bottom: 5px;
                }
                
                .item-total {
                    font-weight: 600;
                    color: #2c5530;
                    font-size: 1.1rem;
                }
                
                @media (max-width: 768px) {
                    .order-details-modal .modal-content {
                        margin: 10% auto;
                        width: 95%;
                    }
                    
                    .info-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .order-item-detail {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 10px;
                    }
                    
                    .item-pricing {
                        text-align: left;
                        width: 100%;
                        display: flex;
                        justify-content: space-between;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    // Update orders count in UI
    updateOrdersCount(count) {
        const ordersCountElements = document.querySelectorAll('.orders-count');
        ordersCountElements.forEach(element => {
            element.textContent = count;
            element.style.display = count > 0 ? 'inline' : 'none';
        });
    }

    setupEventListeners() {
        // Use event delegation for logout buttons to avoid conflicts
        document.addEventListener('click', (e) => {
            if (e.target.closest('.logout-btn')) {
                e.preventDefault();
                this.handleLogout();
            }
        });

        // Use event delegation for orders buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.view-orders-btn')) {
                e.preventDefault();
                e.stopPropagation();
                this.openOrdersModal();
            }
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu-container')) {
                this.closeAllDropdowns();
            }
        });

        const mobileUsername = document.getElementById('mobile-username-text');
        if (mobileUsername) {
            mobileUsername.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMobileDropdown();
            });
        }
    }

    // 🆕 FIXED: Global event handlers - only handle specific order links
    setupGlobalEventHandlers() {
        // Use event delegation to only handle specific order links
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a');
            
            if (!target) return;
            
            const href = target.getAttribute('href');
            const classList = target.classList;
            
            if (href && (
                href.includes('/api/orders') ||
                classList.contains('dropdown-item') && target.textContent.toLowerCase().includes('order')
            )) {
                e.preventDefault();
                e.stopPropagation();
                this.openOrdersModal();
            }
        });
    }
    showAuthenticatedUI(userName) {
        this.toggleUserElements(true, userName);
    }

    showGuestUI() {
        this.toggleUserElements(false, 'Guest');
       }

    toggleUserElements(isAuthenticated, userName) {
    const userMenu = document.getElementById('user-menu-container');
    const loginBtn = document.getElementById('login-btn');
    const usernameText = document.getElementById('username-text');

    const mobileUserMenu = document.getElementById('mobile-user-menu');
    const mobileLoginBtn = document.getElementById('mobile-login-btn');
    const mobileUsernameText = document.getElementById('mobile-username-text');

    if (isAuthenticated) {
        // Show user dropdown
        if (userMenu) userMenu.style.display = 'block';
        if (loginBtn) loginBtn.style.display = 'none';
        if (usernameText) usernameText.style.display = 'inline-block';
        if (usernameText) usernameText.textContent = userName;

        if (mobileUserMenu) mobileUserMenu.style.display = 'block';
        if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
        if (mobileUsernameText) mobileUsernameText.style.display = 'inline-block';
        if (mobileUsernameText) mobileUsernameText.textContent = userName;

    } else {
        // HIDE the entire user menu section
        if (userMenu) userMenu.style.display = 'none';

        // Show only Login button
        if (loginBtn) loginBtn.style.display = 'flex';

        // Completely hide "Guest"
        if (usernameText) usernameText.style.display = 'none';

        if (mobileUserMenu) mobileUserMenu.style.display = 'none';
        if (mobileLoginBtn) mobileLoginBtn.style.display = 'inline-block';
        if (mobileUsernameText) mobileUsernameText.style.display = 'none';
    }
}


    handleLogout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        this.currentUser = null;
        this.userOrders = [];
        
        this.showGuestUI();
        this.showMessage('Successfully logged out', 'success');
        this.closeAllDropdowns();
        
        if (!this.isOnHomePage()) {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }

    toggleMobileDropdown() {
        const dropdown = document.querySelector('.mobile-user-menu .user-dropdown');
        if (dropdown) {
            const isVisible = dropdown.style.display === 'block';
            dropdown.style.display = isVisible ? 'none' : 'block';
        }
    }

    closeAllDropdowns() {
        document.querySelectorAll('.user-dropdown').forEach(dropdown => {
            dropdown.style.display = 'none';
        });
        
        // Also close any open modals
        document.querySelectorAll('.modal').forEach(modal => {
            if (modal.id === 'orders-modal' || modal.id === 'order-details-modal') {
                modal.style.display = 'none';
            }
        });
    }

    isOnHomePage() {
        return window.location.pathname.includes('index.html') || 
               window.location.pathname === '/';
    }

    showMessage(message, type = 'info') {
        if (typeof Toastify === 'object') {
            Toastify({
                text: message,
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: type === 'success' ? "#28a745" : 
                              type === 'error' ? "#dc3545" : "#007bff",
            }).showToast();
        } else {
        }
    }
}

// Initialize the authentication manager
const authManager = new AuthManager();

// Global functions for easy access from HTML
window.viewOrder = (orderId) => authManager.viewOrderDetails(orderId);
window.loadUserOrders = () => authManager.getUserOrders();
window.openOrdersModal = () => authManager.openOrdersModal();
window.showOrdersModal = () => authManager.showOrdersModal();