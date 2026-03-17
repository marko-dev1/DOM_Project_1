
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth, adminAuth, superAdminAuth } = require('../middleware/auth');
const db = require('../config/database');

// 🧾 Admin routes
router.get('/', auth, orderController.getAllOrders);
// comment out to block general admin to access orders
router.get('/:orderId', auth, adminAuth, orderController.getOrder);

router.put('/:id/status', auth, adminAuth, orderController.updateOrderStatus);
router.delete('/:id', auth, adminAuth, orderController.deleteOrder);

// 🛒 Customer routes
router.post('/', auth, orderController.createOrder);
router.get('/user/:userId', auth, orderController.getUserOrders);

// 🆕 POST /api/orders/checkout - Create new order (PROTECTED)
router.post('/checkout', auth, async (req, res) => {
    let connection;
    try {
        // 🚨 Get user_id from authenticated user instead of request body
        const user_id = req.user.userId || req.user.id;
        const { 
            total_amount, 
            shipping_address, 
            payment_method, 
            customer_phone,
            customer_name,
            cart_items 
        } = req.body;

        // 

        // Validate required fields
        if (!total_amount || !shipping_address || !customer_phone || !cart_items) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                required: ['total_amount', 'shipping_address', 'customer_phone', 'cart_items'],
                received: {
                    total_amount: !!total_amount,
                    shipping_address: !!shipping_address,
                    customer_phone: !!customer_phone,
                    cart_items: cart_items ? cart_items.length : 0
                }
            });
        }

        // Validate cart items
        if (!Array.isArray(cart_items) || cart_items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart items must be a non-empty array'
            });
        }

        // Get connection from pool
        connection = await db.pool.getConnection();
        await connection.beginTransaction();

        try {
            // Insert order
            const [orderResult] = await connection.execute(
                `INSERT INTO orders (
                    user_id, 
                    total_amount, 
                    shipping_address, 
                    payment_method, 
                    customer_phone,
                    customer_name
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    user_id, // 🚨 Use authenticated user ID
                    parseFloat(total_amount),
                    shipping_address,
                    // payment_method || 'standard_checkout',
                    payment_method ? payment_method : 'WhatsApp',

                    customer_phone,
                    customer_name
                ]
            );

            const orderId = orderResult.insertId;
          

            // Insert order items - using your exact table structure
            let insertedItems = 0;
            for (const item of cart_items) {
                await connection.execute(
                    `INSERT INTO order_items (
                        order_id, 
                        product_id, 
                        product_name, 
                        price, 
                        quantity
                    ) VALUES (?, ?, ?, ?, ?)`,
                    [
                        orderId,
                        item.id || item.product_id || null,
                        item.name || item.product_name || 'Unknown Product',
                        parseFloat(item.price) || 0,
                        parseInt(item.quantity) || 1
                    ]
                );
                insertedItems++;
               
            }

            await connection.commit();
           

            res.json({
                success: true,
                orderId: orderId,
                message: 'Order created successfully',
                orderNumber: `ORD-${orderId}`,
                totalAmount: total_amount,
                itemCount: insertedItems
            });

        } catch (dbError) {
            await connection.rollback();
            console.error('❌ Database error:', dbError);
            throw dbError;
        }

    } catch (error) {
        console.error('❌ Order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order: ' + error.message
        });
    } finally {
        if (connection) {
            await connection.release();
        }
    }
});


// In your orderRoutes.js - Update the user orders route
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const requestedUserId = parseInt(req.params.userId);
        const authenticatedUserId = req.user.userId || req.user.id;
        
       

        // Security check: Users can only view their own orders unless admin
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && requestedUserId !== authenticatedUserId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own orders.'
            });
        }

        const [orders] = await db.pool.execute(`
            SELECT o.*, u.username, u.email 
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
        `, [requestedUserId]);

        // 🚨 FIX: Get order items for each order
        for (let order of orders) {
            const [items] = await db.pool.execute(`
                SELECT *, (price * quantity) as item_total 
                FROM order_items 
                WHERE order_id = ?
            `, [order.id]);
            order.items = items;
            
            
        }

      

        res.json({
            success: true,
            data: orders,
            count: orders.length
        });

    } catch (error) {
        console.error('❌ Error fetching user orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user orders'
        });
    }
});
// GET /api/orders - Get all orders (ADMIN ONLY)
router.get('/', auth, adminAuth, async (req, res) => {
    try {
    
        
        const [orders] = await db.pool.execute(`
            SELECT o.*, u.username, u.email 
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            ORDER BY o.created_at DESC
        `);

        // For each order, get order items
        for (let order of orders) {
            const [items] = await db.pool.execute(`
                SELECT * FROM order_items WHERE order_id = ?
            `, [order.id]);
            order.items = items;
            
            // Calculate item totals for display
            order.items.forEach(item => {
                item.item_total = (item.price * item.quantity).toFixed(2);
            });
        }

        res.json({
            success: true,
            count: orders.length,
            orders: orders
        });

    } catch (error) {
        console.error('❌ Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders'
        });
    }
});

// GET /api/orders/:id - Get single order with detailed items
router.get('/:id', auth, async (req, res) => {
    try {
        const orderId = req.params.id;
        const authenticatedUserId = req.user.userId || req.user.id;
        
        

        const [orders] = await db.pool.execute(`
            SELECT o.*, u.username, u.email 
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            WHERE o.id = ?
        `, [orderId]);

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const order = orders[0];

        // 🚨 Security check: Users can only view their own orders unless admin
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && order.user_id !== authenticatedUserId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own orders.'
            });
        }

        const [items] = await db.pool.execute(`
            SELECT *, (price * quantity) as item_total 
            FROM order_items 
            WHERE order_id = ?
        `, [orderId]);

        order.items = items;

        res.json({
            success: true,
            order: order
        });

    } catch (error) {
        console.error('❌ Error fetching order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order'
        });
    }
});

// PUT /api/orders/:id/status - Update order status (ADMIN ONLY)
router.put('/:id/status', auth, adminAuth, async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
            });
        }

        await db.pool.execute(
            'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, orderId]
        );

        res.json({
            success: true,
            message: `Order status updated to ${status}`
        });

    } catch (error) {
        console.error('❌ Error updating order status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status'
        });
    }
});

// GET order items for a specific order
router.get('/:id/items', auth, async (req, res) => {
    try {
        const orderId = req.params.id;
        const [items] = await db.pool.execute(`
            SELECT *, (price * quantity) as item_total 
            FROM order_items 
            WHERE order_id = ?
        `, [orderId]);

        res.json({
            success: true,
            items: items,
            count: items.length
        });

    } catch (error) {
        console.error('❌ Error fetching order items:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order items'
        });
    }
});

// Test endpoint
router.get('/test/checkout', (req, res) => {
    res.json({ 
        message: 'Order routes are working! ✅',
        endpoints: {
            'POST /checkout': 'Create new order',
            'GET /': 'Get all orders', 
            'GET /:id': 'Get single order',
            'GET /:id/items': 'Get order items',
            'PUT /:id/status': 'Update order status',
            'GET /user/:userId': 'Get user orders'
        }
    });
});

module.exports = router;