
// Main Application
class ECommerceApp {
    constructor() {
        this.products = [];
        this.currentCategory = 'all';
        this.cart = [];
        this.currentToken = localStorage.getItem('token');
        this.isSyncing = false; 
        this.init();
    }

    init() {
        this.loadCartFromStorage();
        this.loadAllProducts();
        this.setupEventListeners();
        this.updateCartCount();
        
        // Only sync with backend if user is properly logged in
        if (this.isUserAuthenticated()) {
            this.syncCartWithBackend();
        }
    }

    // FIXED: Proper authentication check
    isUserAuthenticated() {
        return this.currentToken && this.currentToken !== 'null' && this.currentToken !== 'undefined';
    }

    setupEventListeners() {
        const modal = document.getElementById('productModal');
        const closeBtn = document.querySelector('.close');

        closeBtn.onclick = () => modal.style.display = 'none';

        window.addEventListener('click', (event) => {
            if (event.target === modal) modal.style.display = 'none';
        });

        // Checkout modal
        const checkoutModal = document.getElementById('checkoutModal');
        const cancelCheckout = document.getElementById('cancelCheckout');

        if (cancelCheckout) {
            cancelCheckout.onclick = () => checkoutModal.style.display = 'none';
        }

        window.addEventListener('click', (event) => {
            if (event.target === checkoutModal) checkoutModal.style.display = 'none';
        });

        // Product card click - Enhanced with loading spinner
        document.addEventListener('click', (event) => {
            const card = event.target.closest('.product-card');
            if (!card) return;

            modal.style.display = 'block';
            
            // Show loading state immediately
            if (window.performance_optimizer) {
                window.performance_optimizer.showModalLoader('#productModal');
            }
            
            // Simulate loading content - replace with actual product loading
            const modalContent = document.getElementById('modal-content');
            setTimeout(() => {
                // Hide loader
                if (window.performance_optimizer) {
                    window.performance_optimizer.hideModalLoader('#productModal');
                }
                
                // Show content with fade-in
                if (modalContent) {
                    modalContent.classList.add('fade-in');
                }
            }, 100);
        });
    }

    // ============ UPDATED CART FUNCTIONALITY ============
    
    addToCart(product, quantity = 1) {
        console.log('Adding to cart:', product);
        
        // Handle both object and string input
        let productObj;
        if (typeof product === 'string') {
            try {
                productObj = JSON.parse(product);
            } catch (e) {
                console.error('Error parsing product:', e);
                this.showNotification('Error adding product to cart');
                return;
            }
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

        const existingItemIndex = this.cart.findIndex(item => item.id === cartProduct.id);
        
        if (existingItemIndex > -1) {
            this.cart[existingItemIndex].quantity += quantity;
        } else {
            this.cart.push({
                ...cartProduct,
                quantity: quantity
            });
        }
        
        this.saveCartToStorage();
        this.updateCartCount();
        this.showNotification(`${cartProduct.name} added to cart!`);
        
        // Refresh cart modal if it's open
        this.refreshCartModal();
        
        // Only sync to backend if user is authenticated AND not currently syncing
        if (this.isUserAuthenticated() && !this.isSyncing) {
            this.syncItemToBackend(cartProduct, 
                existingItemIndex > -1 ? this.cart[existingItemIndex].quantity : quantity);
        }
    }

    removeFromCart(productId) {
        const item = this.cart.find(item => item.id === productId);
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCartToStorage();
        this.updateCartCount();
        this.showNotification('Item removed from cart');
        
        // Only remove from backend if user is authenticated
        if (this.isUserAuthenticated() && item) {
            this.removeItemFromBackend(item.id);
        }
        
        this.refreshCartModal();
    }

    updateQuantity(productId, newQuantity) {
        const itemIndex = this.cart.findIndex(item => item.id === productId);
        
        if (itemIndex > -1) {
            if (newQuantity <= 0) {
                this.removeFromCart(productId);
            } else {
                this.cart[itemIndex].quantity = newQuantity;
                this.saveCartToStorage();
                this.updateCartCount();
                
                // Only update backend if user is authenticated
                if (this.isUserAuthenticated()) {
                    this.updateQuantityInBackend(productId, newQuantity);
                }
                
                this.refreshCartModal();
            }
        }
    }

    getCartTotal() {
        return this.cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    getCartItemCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    updateCartCount() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            const count = this.getCartItemCount();
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'block' : 'none';
        }
    }

    saveCartToStorage() {
        localStorage.setItem('ecommerce_cart', JSON.stringify(this.cart));
    }

    loadCartFromStorage() {
        try {
            const savedCart = localStorage.getItem('ecommerce_cart');
            if (savedCart) {
                this.cart = JSON.parse(savedCart);
            } else {
                this.cart = [];
            }
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            this.cart = [];
        }
    }

    showCart() {
        this.displayCartModal();
    }

    displayCartModal() {
        const modal = document.getElementById('productModal');
        const modalContent = document.getElementById('modal-content');
        
        // Ensure cart is loaded from storage
        this.loadCartFromStorage();
        
        modalContent.innerHTML = this.generateCartModalHTML();
        modal.style.display = 'block';
    }

    generateCartModalHTML() {
        return `
            <div class="cart-modal" style="padding: 30px;">
                <h2>Shopping Cart (${this.getCartItemCount()} items)</h2>
                ${this.cart.length === 0 ? 
                    '<p class="empty-cart" style="text-align: center; padding: 40px; color: #666;">Your cart is empty</p>' : 
                    this.generateCartItemsHTML()
                }
                <div class="cart-actions" style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                    <button onclick="app.closeModal()" class="btn-secondary" style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">Continue Shopping</button>
                    ${this.cart.length > 0 ? `
                        <button onclick="app.checkout()" class="btn-primary" style="padding: 12px 24px; background: #2c5530; color: white; border: none; border-radius: 6px; cursor: pointer;">Proceed to Checkout - Ksh ${this.getCartTotal().toFixed(2)}</button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    generateCartItemsHTML() {
        return `
            <div class="cart-items" style="max-height: 400px; overflow-y: auto; margin: 20px 0;">
                ${this.cart.map(item => {
                    // Fix: Use image_url directly
                    const imageUrl = item.image_url || '/uploads/default-logo.webp';
                    
                    return `
                        <div class="cart-item" style="display: flex; align-items: center; padding: 15px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 10px; background: #f9f9f9;">
                            <img src="${imageUrl}" 
                                 alt="${item.name}" 
                                 class="cart-item-image"
                                 style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px; margin-right: 15px;"
                                 onerror="this.onerror=null; this.src='/uploads/default-logo.webp'">
                            <div class="cart-item-details" style="flex: 1;">
                                <h4 style="margin: 0 0 5px 0; color: #333;">${item.name}</h4>
                                <div class="cart-item-price" style="color: #2c5530; font-weight: bold; margin-bottom: 8px;">Ksh ${item.price.toFixed(2)}</div>
                                <div class="quantity-controls" style="display: flex; align-items: center; gap: 10px;">
                                    <button onclick="app.updateQuantity(${item.id}, ${item.quantity - 1})" style="width: 30px; height: 30px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">-</button>
                                    <span class="quantity-display" style="min-width: 30px; text-align: center; font-weight: bold;">${item.quantity}</span>
                                    <button onclick="app.updateQuantity(${item.id}, ${item.quantity + 1})" style="width: 30px; height: 30px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">+</button>
                                </div>
                            </div>
                            <button class="remove-item" onclick="app.removeFromCart(${item.id})" style="background: #dc3545; color: white; border: none; width: 30px; height: 30px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2em;">×</button>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="cart-total" style="text-align: right; font-size: 1.3em; margin: 20px 0; padding-top: 20px; border-top: 2px solid #eee;">
                <strong>Total: Ksh ${this.getCartTotal().toFixed(2)}</strong>
            </div>
        `;
    }

    refreshCartModal() {
        const modal = document.getElementById('productModal');
        const modalContent = document.getElementById('modal-content');
        
        if (modal.style.display === 'block' && modalContent.innerHTML.includes('cart-modal')) {
            this.displayCartModal();
        }
    }

    // ============ END OF UPDATED CART FUNCTIONALITY ============

    checkout() {
        if (this.cart.length === 0) {
            this.showNotification('Your cart is empty!');
            return;
        }
        this.showCheckoutOptions();
    }

    showCheckoutOptions() {
        const modal = document.getElementById('productModal');
        const modalContent = document.getElementById('modal-content');
        
        modalContent.innerHTML = `
            <div class="checkout-options-modal" style="padding: 30px;">
                <h2>Checkout Options</h2>
                <div class="checkout-methods" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 30px 0;">
                    <div class="checkout-method" onclick="app.completeOrderViaWhatsApp()" style="border: 2px solid #e0e0e0; border-radius: 10px; padding: 20px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; gap: 15px;">
                        <div class="method-icon" style="font-size: 2em;">📱</div>
                        <div class="method-info">
                            <h3 style="margin: 0 0 5px 0; color: #333;">Order via WhatsApp</h3>
                            <p style="margin: 0; color: #666; font-size: 0.9em;">Send your order directly to our WhatsApp for quick processing</p>
                        </div>
                    </div>
                    
                    <div class="checkout-method" onclick="app.standardCheckout()" style="border: 2px solid #e0e0e0; border-radius: 10px; padding: 20px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; gap: 15px;">
                        <div class="method-icon" style="font-size: 2em;">🛒</div>
                        <div class="method-info">
                            <h3 style="margin: 0 0 5px 0; color: #333;">Standard Checkout</h3>
                            <p style="margin: 0; color: #666; font-size: 0.9em;">Complete your order on our website</p>
                        </div>
                    </div>
                </div>
                
                <div class="cart-summary-preview" style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4>Order Summary</h4>
                    ${this.cart.map(item => `
                        <div class="preview-item" style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee;">
                            <span>${item.name} x ${item.quantity}</span>
                            <span>Ksh ${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                    <div class="preview-total" style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #ddd; font-size: 1.1em;">
                        <strong>Total: Ksh ${this.getCartTotal().toFixed(2)}</strong>
                    </div>
                </div>
                
                <button onclick="app.closeModal()" class="btn btn-warning" style="width: 100%; padding: 12px; background: #ffc107; color: #212529; border: none; border-radius: 6px; cursor: pointer; margin-top: 20px;">Back to Cart</button>
            </div>
        `;
        
        modal.style.display = 'block';
    }

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
                <p>Total: Ksh ${total}</p>
                <p>Delivery Fee: Ksh 100</p>
                <p><strong>Final Total: Ksh ${finalTotal}</strong></p>
                
                <div class="customer-info">
                    <h4>Customer Information</h4>
                    <div class="form-group">
                        <label for="customerName">Enter Name *</label>
                        <input type="text" id="customerName" required placeholder="e.g Micheal Monach">
                    </div>
                    <div class="form-group">
                        <label for="customerPhone">Phone Number *</label>
                        <input type="tel" id="customerPhone" required placeholder="07XX XXX XXX">
                    </div>
                    <div class="form-group">
                        <label for="shippingAddress">Shipping Address *</label>
                        <textarea id="shippingAddress" required placeholder="Enter your complete shipping address"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="customerNotes">Additional Notes (Optional)</label>
                        <textarea id="customerNotes" placeholder="Any special delivery instructions"></textarea>
                    </div>
                </div>
                
                <div class="payment-info">
                    <h4>Payment Instructions</h4>
                    <p>Kindly note, we are only accepting online payments via pochi la biashara</p>
                    <p>Enter Pochi Biashara No: <strong style="color:red;">0703 182 530</strong> and pay Ksh ${finalTotal} to complete payment.</p>
                </div>
            </div>
        `;

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
                self.showNotification('Please enter a valid Kenyan phone number (e.g., 0712345678)', 'error');
                return;
            }

            const fullShippingAddress = customerNotes 
                ? `${shippingAddress}\n\nAdditional Notes: ${customerNotes}`
                : shippingAddress;

            const originalText = proceedBtn.textContent;
            proceedBtn.disabled = true;
            proceedBtn.textContent = 'Processing Order...';

            try {
                const orderData = {
                    user_id: self.getCurrentUserId(),
                    total_amount: parseFloat(total),
                    shipping_address: fullShippingAddress,
                    payment_method: 'standard_checkout',
                    customer_phone: customerPhone,
                    customer_name: customerName,
                    cart_items: self.cart
                };

                const response = await fetch('/api/orders/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify(orderData)
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || `HTTP error! status: ${response.status}`);
                }

                if (result.success) {
                    self.cart = [];
                    self.saveCartToStorage();
                    self.updateCartCount();
                    self.closeModal();

                    Toastify({
                        text: `✅ Order Confirmed!\nOrder ID: ${result.orderId}\nTotal: Ksh ${finalTotal}\n\nPay via M-Pesa Pochi La Biashara No: 0703 182 530.\n\nThis message will automatically close after 2 minutes`,
                        duration: 120000,
                        close: true,
                        gravity: "top",
                        position: "center",
                        backgroundColor: "#28a745",
                        stopOnFocus: true,
                    }).showToast();

                    document.getElementById('customerName').value = '';
                    document.getElementById('customerPhone').value = '';
                    document.getElementById('shippingAddress').value = '';
                    document.getElementById('customerNotes').value = '';

                } else {
                    throw new Error(result.message);
                }

            } catch (error) {
                console.error('❌ Checkout error:', error);
                
                let errorMessage = 'Failed to place order. ';
                
                if (error.message.includes('Failed to fetch')) {
                    errorMessage += 'Cannot connect to server. Please check your internet connection.';
                } else if (error.message.includes('404')) {
                    errorMessage += 'Server endpoint not found. Please contact support.';
                } else {
                    errorMessage += error.message;
                }
                
                self.showNotification(errorMessage, 'error');
                
            } finally {
                proceedBtn.disabled = false;
                proceedBtn.textContent = originalText;
            }
        };

        cancelBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }

    getCurrentUserId() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData).id : null;
    }

    completeOrderViaWhatsApp() {
        if (this.cart.length === 0) {
            this.showNotification("Your cart is empty. Please add items before checkout.");
            return;
        }

        const total = this.getCartTotal();
        
        const detailsModal = document.createElement('div');
        detailsModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: Arial, sans-serif;
        `;

        detailsModal.innerHTML = `
            <div style="background: #222; border-radius: 10px; padding: 20px; max-width: 500px; width: 90%;">
                <h2 style="color: #25D366; text-align: center;">Complete Your WhatsApp Order</h2>
                
                <form id="orderDetailsForm">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px;">Full Name *</label>
                        <input type="text" id="fullName" required 
                               style="width: 100%; padding: 10px; border-radius: 5px; border: none;">
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px;">Delivery Address *</label>
                        <input type="text" id="deliveryAddress" required 
                               style="width: 100%; padding: 10px; border-radius: 5px; border: none;">
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px;">WhatsApp Number *</label>
                        <input type="tel" id="whatsappNumber" required 
                               placeholder="2547XXXXXXXX or 07XXXXXXXX" 
                               style="width: 100%; padding: 10px; border-radius: 5px; border: none;">
                        <small style="color: #ccc;">We'll contact you on this number</small>
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button type="submit" 
                                style="flex: 1; padding: 12px; background: #25D366; color: white; 
                                       border: none; border-radius: 5px; cursor: pointer;">
                            Continue to WhatsApp
                        </button>
                        <button type="button" id="cancelDetailsBtn" 
                                style="flex: 1; padding: 12px; background: #555; color: white; 
                                       border: none; border-radius: 5px; cursor: pointer;">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(detailsModal);

        detailsModal.querySelector('#orderDetailsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const fullName = document.getElementById('fullName').value.trim();
            const deliveryAddress = document.getElementById('deliveryAddress').value.trim();
            let whatsappNumber = document.getElementById('whatsappNumber').value.trim();
            
            if (!fullName || !deliveryAddress || !whatsappNumber) {
                this.showNotification("Please fill in all required fields.");
                return;
            }
            
            whatsappNumber = whatsappNumber.replace(/\D/g, '');
            if (whatsappNumber.startsWith("0")) {
                whatsappNumber = "254" + whatsappNumber.substring(1);
            } else if (whatsappNumber.startsWith("7")) {
                whatsappNumber = "254" + whatsappNumber;
            }
            
            if (!/^2547\d{8}$/.test(whatsappNumber)) {
                this.showNotification("Please enter a valid Kenyan WhatsApp number");
                return;
            }
            
            const order = {
                id: "ORD" + Date.now().toString().slice(-6),
                date: new Date().toLocaleString(),
                paymentMethod: "WhatsApp Order",
                subtotal: total,
                deliveryFee: 100,
                finalTotal: total + 100,
                items: [...this.cart],
                user: {
                    fullName: fullName,
                    phone: whatsappNumber,
                    deliveryAddress: deliveryAddress
                }
            };
            
            document.body.removeChild(detailsModal);
            this.generateWhatsAppOrder(order);
        });

        detailsModal.querySelector('#cancelDetailsBtn').addEventListener('click', () => {
            document.body.removeChild(detailsModal);
        });
    }

    generateWhatsAppOrder(order) {
        const message = `
*NEW ORDER - VITRONICS STORE*   

*ORDER SUMMARY*
Order #: ${order.id}
Date: ${order.date}

*ITEMS ORDERED*
${order.items.map(item => 
`${item.name}
Quantity: ${item.quantity}
Price: Ksh ${(item.price * item.quantity).toLocaleString()}`
).join('\n\n')}

*PAYMENT SUMMARY*
Subtotal: Ksh ${order.subtotal.toLocaleString()}
Delivery: Ksh ${order.deliveryFee.toLocaleString()}
TOTAL: Ksh ${order.finalTotal.toLocaleString()}

*CUSTOMER DETAILS*
Name: ${order.user.fullName}
Phone: ${order.user.phone}
Address: ${order.user.deliveryAddress}

🐀 Call/WhatsApp for assistance: +254 703 182530
        `.trim();

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: Arial, sans-serif;
        `;

        modal.innerHTML = `
            <div style="background: #222; border-radius: 10px; padding: 20px; max-width: 500px; width: 90%;">
                <h2 style="color: #25D366; text-align: center;">Your Order is Ready</h2>
                
                <div style="margin: 15px 0; text-align: center;">
                    <p>Choose how you'd like to send your order:</p>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
                    <a href="https://wa.me/254703182530?text=${encodeURIComponent(message)}" 
                       target="_blank"
                       style="display: block;
                              background: #25D366;
                              color: white;
                              text-align: center;
                              padding: 15px;
                              border-radius: 8px;
                              text-decoration: none;
                              font-weight: bold;">
                        📱 Send as WhatsApp Message
                    </a>
                    
                    <button id="generatePdfBtn"
                            style="display: block;
                                   background: #ff6b35;
                                   color: white;
                                   text-align: center;
                                   padding: 15px;
                                   border-radius: 8px;
                                   border: none;
                                   font-weight: bold;
                                   cursor: pointer;">
                        📄 Generate PDF Receipt & Send
                    </button>
                </div>
                
                <div style="background: #333; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <p style="margin-top: 0;">Order Summary:</p>
                    
                    <div id="orderMessage" 
                         style="width: 100%;
                                height: 200px;
                                padding: 10px;
                                margin-bottom: 10px;
                                border-radius: 5px;
                                background: #444;
                                color: white;
                                border: 1px solid #666;
                                overflow-y: auto;
                                white-space: pre-wrap;
                                font-family: monospace;
                                user-select: text;
                                -webkit-user-select: text;
                                cursor: text;">
${message}
                    </div>
                    
                    <button id="copyButton"
                            style="width: 100%;
                                   padding: 10px;
                                   background: #555;
                                   color: white;
                                   border: none;
                                   border-radius: 5px;
                                   cursor: pointer;">
                        📋 Copy Order Details
                    </button>
                </div>
                
                <button id="closeButton"
                        style="width: 100%;
                               padding: 10px;
                               background: #f14848;
                               color: white;
                               border: none;
                               border-radius: 5px;
                               cursor: pointer;">
                    Cancel Your Order
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('#copyButton').addEventListener('click', () => {
            const messageDiv = document.getElementById('orderMessage');
            const messageText = messageDiv.textContent || messageDiv.innerText;
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(messageText)
                    .then(() => {
                        this.showCopyFeedback(modal.querySelector('#copyButton'));
                    })
                    .catch(() => {
                        this.fallbackCopyText(messageText);
                    });
            } else {
                this.fallbackCopyText(messageText);
            }
        });

        modal.querySelector('#generatePdfBtn').addEventListener('click', () => {
            this.generateAndSendPdfReceipt(order);
        });

        modal.querySelector('#closeButton').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.showCancellationConfirmation(order.id);
        });
    }

    generateAndSendPdfReceipt(order) {
        this.showNotification('Generating PDF receipt...');

        try {
            if (typeof jspdf === 'undefined') {
                this.showNotification('PDF generation library not loaded. Please try sending as message.');
                return;
            }

            const doc = new jspdf.jsPDF();
            
            doc.setFillColor(37, 211, 102);
            doc.rect(0, 0, 210, 25, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('VITRONICS STORE', 105, 12, { align: 'center' });
            doc.setFontSize(10);
            doc.text('ORDER RECEIPT', 105, 18, { align: 'center' });
            
            doc.setTextColor(0, 0, 0);
            
            let yPosition = 35;
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('ORDER SUMMARY', 14, yPosition);
            yPosition += 8;
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`Order Number: ${order.id}`, 14, yPosition);
            doc.text(`Date: ${order.date}`, 140, yPosition);
            yPosition += 5;
            
            doc.text(`Payment Method: ${order.paymentMethod}`, 14, yPosition);
            yPosition += 10;
            
            doc.setFont('helvetica', 'bold');
            doc.text('ITEMS ORDERED', 14, yPosition);
            yPosition += 6;
            
            doc.setFillColor(240, 240, 240);
            doc.rect(14, yPosition, 182, 6, 'F');
            doc.setFontSize(8);
            doc.text('Item', 16, yPosition + 4);
            doc.text('Qty', 120, yPosition + 4);
            doc.text('Price', 150, yPosition + 4);
            doc.text('Total', 170, yPosition + 4);
            yPosition += 8;
            
            doc.setFont('helvetica', 'normal');
            order.items.forEach((item, index) => {
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                const itemName = item.name.length > 40 ? item.name.substring(0, 37) + '...' : item.name;
                const itemTotal = (item.price * item.quantity).toFixed(2);
                
                doc.text(`${index + 1}. ${itemName}`, 16, yPosition);
                doc.text(item.quantity.toString(), 120, yPosition);
                doc.text(`Ksh ${item.price.toFixed(2)}`, 150, yPosition);
                doc.text(`Ksh ${itemTotal}`, 170, yPosition);
                yPosition += 5;
            });
            
            yPosition += 8;
            
            doc.setFont('helvetica', 'bold');
            doc.text('PAYMENT SUMMARY', 14, yPosition);
            yPosition += 6;
            
            doc.setFont('helvetica', 'normal');
            doc.text('Subtotal:', 120, yPosition);
            doc.text(`Ksh ${order.subtotal.toFixed(2)}`, 170, yPosition);
            yPosition += 5;
            
            doc.text('Delivery Fee:', 120, yPosition);
            doc.text(`Ksh ${order.deliveryFee.toFixed(2)}`, 170, yPosition);
            yPosition += 5;
            
            doc.setDrawColor(0, 0, 0);
            doc.line(120, yPosition, 190, yPosition);
            yPosition += 3;
            
            doc.setFont('helvetica', 'bold');
            doc.text('TOTAL:', 120, yPosition);
            doc.text(`Ksh ${order.finalTotal.toFixed(2)}`, 170, yPosition);
            yPosition += 10;
            
            doc.setFont('helvetica', 'bold');
            doc.text('CUSTOMER DETAILS', 14, yPosition);
            yPosition += 6;
            
            doc.setFont('helvetica', 'normal');
            doc.text(`Name: ${order.user.fullName}`, 20, yPosition);
            yPosition += 5;
            
            doc.text(`Phone: ${order.user.phone}`, 20, yPosition);
            yPosition += 5;
            
            const addressLines = doc.splitTextToSize(`Delivery Address: ${order.user.deliveryAddress}`, 150);
            doc.text(addressLines, 20, yPosition);
            yPosition += (addressLines.length * 5) + 10;
            
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.text('Thank you for your order! For assistance, call/WhatsApp: +254 703 182530', 105, 280, { align: 'center' });
            doc.text('This is an automated receipt generated by Vitronics Store E-Commerce System', 105, 285, { align: 'center' });
            
            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            
            this.downloadAndSharePdf(pdfBlob, pdfUrl, order);
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            this.showNotification('Error generating PDF. Please try sending as message instead.');
        }
    }

    downloadAndSharePdf(pdfBlob, pdfUrl, order) {
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = `VitronicsStore_Order_${order.id}.pdf`;
        document.body.appendChild(downloadLink);
        
        const whatsappMessage = `
*NEW ORDER - VITRONICS STORE* 📄

Order #${order.id}

I've attached the PDF receipt with all order details.

Please check the attached document for:
• Complete item list with quantities
• Payment breakdown
• Delivery information

Thank you! 🛒
        `.trim();
        
        const shareModal = document.createElement('div');
        shareModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10001;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: Arial, sans-serif;
        `;
        
        shareModal.innerHTML = `
            <div style="background: #222; border-radius: 10px; padding: 25px; max-width: 450px; width: 90%; text-align: center;">
                <h3 style="color: #25D366; margin-bottom: 10px;">📄 PDF Receipt Ready!</h3>
                <p style="color: #ccc; margin-bottom: 20px;">Your professional order receipt has been generated.</p>
                
                <div style="background: #333; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: left;">
                    <h4 style="color: #ff6b35; margin-top: 0;">Order #${order.id}</h4>
                    <p style="margin: 5px 0;"><strong>Customer:</strong> ${order.user.fullName}</p>
                    <p style="margin: 5px 0;"><strong>Total:</strong> Ksh ${order.finalTotal.toLocaleString()}</p>
                    <p style="margin: 5px 0;"><strong>Items:</strong> ${order.items.length} product(s)</p>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button id="downloadPdfBtn"
                            style="padding: 15px;
                                   background: #ff6b35;
                                   color: white;
                                   border: none;
                                   border-radius: 8px;
                                   cursor: pointer;
                                   font-weight: bold;
                                   font-size: 14px;">
                        ⬇️ Download PDF Receipt
                    </button>
                    
                    <a href="https://web.whatsapp.com/send?phone=254703182530&text=${encodeURIComponent(whatsappMessage)}"
                       target="_blank"
                       style="padding: 15px;
                              background: #25D366;
                              color: white;
                              border-radius: 8px;
                              text-decoration: none;
                              font-weight: bold;
                              font-size: 14px;">
                        📱 Open WhatsApp & Attach PDF
                    </a>
                    
                    <div style="background: #2a2a2a; padding: 12px; border-radius: 6px; margin: 10px 0;">
                        <p style="margin: 0; font-size: 12px; color: #aaa;">
                            💡 <strong>How to send:</strong><br>
                            1. Download the PDF<br>
                            2. Open WhatsApp<br>
                            3. Attach the downloaded file<br>
                            4. Send to +254 703 182530
                        </p>
                    </div>
                    
                    <button id="closeShareModal"
                            style="padding: 12px;
                                   background: #555;
                                   color: white;
                                   border: none;
                                   border-radius: 6px;
                                   cursor: pointer;">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(shareModal);
        
        shareModal.querySelector('#downloadPdfBtn').addEventListener('click', () => {
            downloadLink.click();
            this.showNotification('PDF receipt downloaded successfully!');
        });
        
        shareModal.querySelector('#closeShareModal').addEventListener('click', () => {
            document.body.removeChild(shareModal);
            URL.revokeObjectURL(pdfUrl);
        });
        
        setTimeout(() => {
            downloadLink.click();
            this.showNotification('PDF downloaded automatically. Ready for WhatsApp!');
        }, 500);
    }

    fallbackCopyText(text) {
        const tempTextarea = document.createElement('textarea');
        tempTextarea.value = text;
        tempTextarea.style.cssText = 'position: absolute; left: -9999px; opacity: 0;';
        document.body.appendChild(tempTextarea);
        tempTextarea.select();
        
        try {
            document.execCommand('copy');
            this.showCopyFeedback(document.querySelector('#copyButton'));
        } catch (err) {
            console.error('Fallback copy failed:', err);
            this.showNotification('Failed to copy text. Please select and copy manually.');
        } finally {
            document.body.removeChild(tempTextarea);
        }
    }

    showCopyFeedback(button) {
        const originalText = button.textContent;
        const originalBackground = button.style.background;
        
        button.textContent = '✓ Copied!';
        button.style.background = '#25D366';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = originalBackground;
        }, 2000);
    }

    showCancellationConfirmation(orderId) {
        const confirmation = document.createElement('div');
        confirmation.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #f42b2b;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10001;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            animation: fadeInOut 3s forwards;
        `;
        
        confirmation.innerHTML = `Order #${orderId} has been cancelled!`;
        document.body.appendChild(confirmation);
        
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes fadeInOut {
                0% { opacity: 0; top: 10px; }
                10% { opacity: 1; top: 20px; }
                90% { opacity: 1; top: 20px; }
                100% { opacity: 0; top: 10px; }
            }
        `;
        document.head.appendChild(style);
        
        setTimeout(() => {
            if (document.body.contains(confirmation)) {
                document.body.removeChild(confirmation);
            }
            document.head.removeChild(style);
        }, 3000);
    }

    closeModal() {
        const modal = document.getElementById('productModal');
        modal.style.display = 'none';
    }

    showNotification(message, type = 'success') {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        const backgroundColor = type === 'success' ? '#4CAF50' : '#dc3545';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${backgroundColor};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    async loadAllProducts() {
        this.showLoading();
        try {
            const response = await fetch('/api/products');
            if (!response.ok) throw new Error('Failed to fetch products');
            
            this.products = await response.json();
            this.displayProducts(this.products);
        } catch (error) {
            this.showSampleProducts();
        }
    }

    showSampleProducts() {
        this.products = [
            {
                id: 1,
                name: "Smartphone X",
                price: 29999.99,
                description: "Latest smartphone with advanced features",
                primary_image: "phone1.jpg",
                stock_quantity: 10,
                category: "phones"
            },
            {
                id: 2,
                name: "Wireless Earbuds",
                price: 3499.99,
                description: "High-quality wireless earbuds with noise cancellation",
                primary_image: "earbuds1.jpg",
                stock_quantity: 25,
                category: "phones accessories"
            },
            {
                id: 3,
                name: "Laptop Sleeve",
                price: 1999.99,
                description: "Protective sleeve for laptops up to 15 inches",
                primary_image: "sleeve1.jpg",
                stock_quantity: 15,
                category: "laptop accessories"
            }
        ];
        this.displayProducts(this.products);
    }

    async filterByCategory(category) {
        this.showLoading();
        this.currentCategory = category;
        
        try {
            let products;
            if (category === 'all') {
                products = this.products;
            } else {
                const response = await fetch(`/api/products/category/${category}`);
                if (!response.ok) throw new Error('Failed to fetch products by category');
                products = await response.json();
            }
            
            this.displayProducts(products);
            this.updateSectionTitle(category);
        } catch (error) {
            const filteredProducts = category === 'all' 
                ? this.products 
                : this.products.filter(product => product.category === category);
            this.displayProducts(filteredProducts);
            this.updateSectionTitle(category);
        }
    }

  
    // displayProducts(products) {
    //     // Store full list, no shuffle, reset pagination state
    //     this._allProducts  = products;
    //     this._pageSize     = 12;
    //     this._currentPage  = 0;
    //     this._hasMore      = true;

    //     // Clear grid and load first page
    //     const grid = document.getElementById('products-grid');
    //     grid.innerHTML = '';
    //     this._removePagination();
    //     this._loadNextPage();
    // }
displayProducts(products) {
    this._allProducts  = products;
    this._pageSize     = 12;
    this._currentPage  = 0;
    this._hasMore      = true;

    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';
    this._removePagination();

    // Preload first 12 images before rendering
    const firstBatch = products.slice(0, this._pageSize);
    let loaded = 0;
    const total = firstBatch.length;

    if (total === 0) { this._loadNextPage(); return; }

    firstBatch.forEach(product => {
        const img = new Image();
        img.onload = img.onerror = () => {
            loaded++;
            if (loaded === total) this._loadNextPage();
        };
        img.src = product.image_url || '/uploads/default-logo.webp';
    });

    // Safety fallback — render anyway after 2s even if some images stall
    setTimeout(() => {
        if (this._currentPage === 0) this._loadNextPage();
    }, 2000);
}

    _loadNextPage() {
        if (!this._hasMore) return;

        const all   = this._allProducts || [];
        const start = this._currentPage * this._pageSize;
        const slice = all.slice(start, start + this._pageSize);

        if (slice.length === 0) {
            this._hasMore = false;
            this._buildPagination(); // show end message
            return;
        }

        const grid    = document.getElementById('products-grid');
        const loading = document.getElementById('loading');
        const error   = document.getElementById('error-message');

        loading.style.display = 'none';
        error.style.display   = 'none';

        if (this._currentPage === 0 && slice.length === 0) {
            grid.innerHTML = '<p class="no-products" style="text-align:center;padding:20px;color:#666;grid-column:1/-1;">No products found in this category.</p>';
            return;
        }

        const fragment = document.createDocumentFragment();
        slice.forEach(product => {
            const imageUrl = product.image_url || '/uploads/default-logo.webp';
            const card = document.createElement('div');
            card.className = 'product-card';
            card.dataset.name = product.name.toLowerCase();
            card.innerHTML = `
                <div class="product-image-container" onclick="app.showProductDetail(${product.id})">
                   <img src="${imageUrl}" 
                        loading="${this._currentPage === 0 ? 'eager' : 'lazy'}"
                        decoding="async"
                        width="300" height="300"
                       style="width:100%;height:250px;object-fit:cover;object-position:center 20%;background:#f9f9f9;border-radius:8px;display:block;"
                         alt="${product.name}" class="product-image img-loading"
                         onerror="this.onerror=null;this.src='/uploads/default-logo.webp'">
                    ${product.stock <= 0 ? '<div class="out-of-stock-overlay">Out of Stock</div>' : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-name" style="margin-bottom:0;padding:0" title="${product.name}">
                        ${product.name ? product.name.substring(0, 45) + '...' : product.name}
                    </h3>
                    <div class="product-price">Ksh ${Number(product.price).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</div>
                    <p class="product-description" style="padding:0;margin:0;">
                        ${product.description ? product.description.substring(0, 70) + '...' : 'No description available'}
                    </p>
                    <div class="stock-info ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                        ${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </div>
                </div>
                <div class="add-to-cart-info">
                    <button class="add-to-cart-btn" title="Add to cart"
                        onclick="event.stopPropagation(); app.addToCartFromButton(${product.id})"
                        ${product.stock <= 0 ? 'disabled' : ''}>
                        BUY NOW
                    </button>
                    ${product.stock > 0 ? `
                        <a href="https://wa.me/254703182530?text=${encodeURIComponent(`Hello, I am interested in:\nProduct: ${product.name}\nPrice: Ksh ${Number(product.price).toLocaleString('en-KE', { minimumFractionDigits: 2 })}\nPlease let me know if it's available and how I can place an order. Thank you!`)}"
                           target="_blank" class="whatsapp-float" title="Chat on WhatsApp">
                            <img src="/img/images/whatsapp.png" alt="WhatsApp">
                        </a>
                    ` : `
                        <div class="whatsapp-float disabled" title="Out of stock">
                            <img src="/img/images/whatsapp.png" alt="WhatsApp">
                        </div>
                    `}
                </div>`;
            fragment.appendChild(card);
        });

        grid.appendChild(fragment);
        this._currentPage++;

        // Check if more pages remain
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
        const total  = (this._allProducts || []).length;

        if (!this._hasMore) {
            ctrl.innerHTML = total > this._pageSize
                ? `<p class="pg-end-msg">✓ All ${total} products loaded</p>`
                : '';
            return;
        }

        ctrl.innerHTML = `
            <div class="pg-progress">
                <div class="pg-progress-bar" style="width:${Math.round((loaded/total)*100)}%"></div>
            </div>
            <p class="pg-count">${loaded} of ${total} products</p>
            <button class="pg-load-more-btn" onclick="app._loadNextPage()">
                Load More
                <span class="pg-load-arrow">↓</span>
            </button>`;
    }

    _removePagination() {
        const ctrl = document.getElementById('pagination-controls');
        if (ctrl) ctrl.innerHTML = '';
    }

    

    addToCartFromButton(productId) {
        const product =
            (this._allProducts || []).find(p => p.id === productId) ||
            this.products.find(p => p.id === productId);
        if (product) {
            this.addToCart(product);
        } else {
            console.error('Product not found:', productId);
            this.showNotification('Error adding product to cart');
        }
    }

    async showProductDetail(productId) {
        try {
            const response = await fetch(`/api/products/${productId}`);
            if (!response.ok) throw new Error('Failed to fetch product details');

            const product = await response.json();
            this.displayProductModal(product);
        } catch (error) {
            const product = this.products.find(p => p.id === productId);
            if (product) this.displayProductModal(product);
        }
    }


 
    displayProductModal(product) {
    const modal = document.getElementById('productModal');
    const modalContent = document.getElementById('modal-content');

    // Clear stale content immediately before populating
    modalContent.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;padding:60px;color:#999;">
            <div style="text-align:center;">
                <div style="width:36px;height:36px;border:3px solid #eee;border-top-color:#2c5530;
                            border-radius:50%;animation:spin 0.7s linear infinite;margin:0 auto 12px;"></div>
                <p style="font-size:14px;">Loading product...</p>
            </div>
        </div>
        <style>
            @keyframes spin { to { transform: rotate(360deg); } }
        </style>
    `;

    // Show modal immediately with loader — don't wait
    modal.style.display = 'block';

    // Resolve image URL
    let imageUrl;
    if (product.image_url) {
        if (product.image_url.startsWith('http') || product.image_url.startsWith('/uploads/')) {
            imageUrl = product.image_url;
        } else if (product.image_url.startsWith('uploads/')) {
            imageUrl = '/' + product.image_url;
        } else {
            imageUrl = '/uploads/' + product.image_url;
        }
    } else {
        imageUrl = './uploads/default-logo.webp';
    }

    // Preload the image, then render content once it's ready
    const img = new Image();
    img.onload = () => renderContent();
    img.onerror = () => {
        imageUrl = './uploads/default-logo.webp';
        renderContent();
    };
    img.src = imageUrl;

    function renderContent() {
        modalContent.innerHTML = `
            <div class="product-detail" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:20px;">
                <div class="product-images">
                    <div style="border:2px dashed #ccc;padding:20px;border-radius:8px;background:#f9f9f9;">
                        <img src="${imageUrl}" 
                             alt="${product.name}" 
                             class="detail-image"
                             style="width:100%;max-height:400px;object-fit:contain;border-radius:8px;"
                             onerror="this.onerror=null;this.src='./uploads/default-logo.webp';">
                    </div>
                </div>
                <div class="product-info">
                    <h2 style="font-size:1.2em;font-weight:400;">${product.name}</h2>
                    <div style="font-size:1.3em;font-weight:bold;color:#2c5530;margin:10px 0;">
                        Ksh ${parseFloat(product.price).toFixed(2)}
                    </div>
                    <div class="stock-info ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}" 
                         style="display:inline-block;padding:0.5rem 1rem;border-radius:15px;font-weight:500;margin:10px 0;">
                        ${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </div>
                    <p style="margin:10px 0;line-height:1.6;">
                        ${product.description || 'No description available'}
                    </p>
                    <button class="add-to-cart-btn large" 
                            onclick="event.stopPropagation(); app.addToCartFromButton(${product.id})"
                            ${product.stock <= 0 ? 'disabled' : ''}
                            style="padding:10px;font-size:1em;background:#2c5530;color:white;border:none;border-radius:6px;cursor:pointer;">
                        ${product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                </div>
            </div>
        `;
    }
}
    updateSectionTitle(category) {
        const title = document.getElementById('section-title');
        const categoryNames = {
            'all': 'All Products',
            'screens': 'Screens',
            'phones': 'Phones',
            'phones accessories': 'Phone Accessories',
            'computer': 'Computer & Network',
            'batteries': 'Batteries',
            'smartWatches': 'Smart Watches'
        };
        
        title.textContent = categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('error-message').style.display = 'none';
    }

    showError(message) {
        const error = document.getElementById('error-message');
        error.textContent = message;
        error.style.display = 'block';
        document.getElementById('loading').style.display = 'none';
    }

    async syncCartWithBackend() {
        if (!this.isUserAuthenticated() || this.isSyncing) {
            return;
        }

        this.isSyncing = true;
        try {
            const response = await fetch('/api/cart', {
                headers: {
                    'Authorization': `Bearer ${this.currentToken}`
                }
            });

            if (response.ok) {
                const backendCart = await response.json();
                this.mergeCarts(backendCart.items);
            }
        } catch (error) {
            console.error('Failed to sync cart with backend:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    mergeCarts(backendItems) {
        if (!backendItems || backendItems.length === 0) {
            if (this.cart.length > 0) {
                this.syncLocalCartToBackend();
            }
            return;
        }

        if (this.cart.length === 0) {
            this.cart = backendItems.map(item => ({
                id: item.product_id,
                name: item.product_name,
                price: item.price,
                quantity: item.quantity,
                image_url: 'default-logo.webp'
            }));
            this.saveCartToStorage();
            this.updateCartCount();
        } else {
            console.log('Both local and backend carts have items. Using local cart.');
            this.syncLocalCartToBackend();
        }
    }

    async syncLocalCartToBackend() {
        if (!this.isUserAuthenticated()) {
            return;
        }

        try {
            await fetch('/api/cart/clear', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.currentToken}`
                }
            });
        } catch (error) {
            console.error('Failed to clear backend cart:', error);
        }

        for (const item of this.cart) {
            try {
                await fetch('/api/cart/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.currentToken}`
                    },
                    body: JSON.stringify({
                        product_id: item.id,
                        product_name: item.name,
                        price: item.price,
                        quantity: item.quantity
                    })
                });
            } catch (error) {
                console.error('Failed to sync item to backend:', error);
            }
        }
    }

    async syncItemToBackend(product, quantity) {
        if (!this.isUserAuthenticated()) {
            return;
        }

        try {
            await fetch('/api/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.currentToken}`
                },
                body: JSON.stringify({
                    product_id: product.id,
                    product_name: product.name,
                    price: product.price,
                    quantity: quantity
                })
            });
        } catch (error) {
            console.error('Failed to sync cart item with backend:', error);
        }
    }

    async removeItemFromBackend(productId) {
        if (!this.isUserAuthenticated()) {
            return;
        }

        try {
            const response = await fetch('/api/cart', {
                headers: {
                    'Authorization': `Bearer ${this.currentToken}`
                }
            });

            if (response.ok) {
                const cartData = await response.json();
                const backendItem = cartData.items.find(item => item.product_id === productId);
                
                if (backendItem) {
                    await fetch(`/api/cart/remove/${backendItem.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${this.currentToken}`
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Failed to remove item from backend:', error);
        }
    }

    async updateQuantityInBackend(productId, quantity) {
        if (!this.isUserAuthenticated()) {
            return;
        }

        try {
            const response = await fetch('/api/cart', {
                headers: {
                    'Authorization': `Bearer ${this.currentToken}`
                }
            });

            if (response.ok) {
                const cartData = await response.json();
                const backendItem = cartData.items.find(item => item.product_id === productId);
                
                if (backendItem) {
                    await fetch(`/api/cart/update/${backendItem.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.currentToken}`
                        },
                        body: JSON.stringify({
                            quantity: quantity
                        })
                    });
                }
            }
        } catch (error) {
            console.error('Failed to update quantity in backend:', error);
        }
    }

    clearCart() {
        this.cart = [];
        this.saveCartToStorage();
        this.updateCartCount();
        this.refreshCartModal();
        this.showNotification('Cart cleared');
    }

    getCartItems() {
        return [...this.cart];
    }

    // NEW: Debug method to check cart state (optional)
    debugCart() {
        console.log('=== CART DEBUG INFO ===');
        console.log('Cart contents:', this.cart);
        console.log('Cart count:', this.getCartItemCount());
        console.log('Cart total:', this.getCartTotal());
        console.log('Storage cart:', localStorage.getItem('ecommerce_cart'));
        console.log('User authenticated:', this.isUserAuthenticated());
        console.log('Is syncing:', this.isSyncing);
        console.log('======================');
        
        this.updateCartCount();
        
        return this.cart;
    }
}

// Global functions
function showAllProducts() {
    app.filterByCategory('all');
}

function filterByCategory(category) {
    app.filterByCategory(category);
}

function showCart() {
    app.showCart();
}

function searchProducts(query) {
    console.log("Searching for:", query);
}

function greeting() {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
        return "Good morning";
    } else if (hour >= 12 && hour < 17) {
        return "Good afternoon";
    } else if (hour >= 17 && hour < 21) {
        return "Good evening";
    } else {
        return "Hello";
    }
}

// Initialize the app
const app = new ECommerceApp();

// Add CSS for animations if not present
if (!document.querySelector('#notification-animations')) {
    const style = document.createElement('style');
    style.id = 'notification-animations';
    style.innerHTML = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .modal-loader .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #2c5530;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .fade-in {
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

// Fade in images as they load, remove skeleton shimmer
document.addEventListener('load', (e) => {
    if (e.target.tagName === 'IMG' && e.target.classList.contains('product-image')) {
        e.target.classList.remove('img-loading');
        e.target.classList.add('img-loaded');
        const container = e.target.closest('.product-image-container');
        if (container) container.classList.add('img-loaded');
    }
}, true);