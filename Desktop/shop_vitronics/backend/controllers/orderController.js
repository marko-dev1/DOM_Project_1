
const Order = require('../models/order');
const OrderItem = require('../models/orderItem');
const asyncHandler = require('../middleware/asyncHandler');

 // Get all orders (admin only)
const orderController = {
  getAllOrders: asyncHandler(async (req, res) => {
    const orders = await Order.findAll();
    
    res.json({
      success: true,
      data: orders
    });
  }),

  

  getOrder: asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  console.log('🧾 Fetching order:', { orderId, userId, userRole });

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // ✅ Allow admin or super_admin full access
  if (userRole === 'admin' || userRole === 'super_admin') {
    const items = await OrderItem.findByOrderId(orderId);
    return res.json({
      success: true,
      data: {
        ...order,
        items
      }
    });
  }

  // ✅ Regular users can only view their own orders
  if (order.user_id !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own orders.'
    });
  }

  // ✅ If this order belongs to the user
  const items = await OrderItem.findByOrderId(orderId);
  res.json({
    success: true,
    data: {
      ...order,
      items
    }
  });
}),


  getUserOrders: asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get all orders for the user
  const orders = await Order.findByUserId(userId);

  // Attach items to each order
  for (let order of orders) {
    const items = await OrderItem.findByOrderId(order.id);
    order.items = items; // 
  }

  res.json({
    success: true,
    data: orders
  });
}),


  // Create order
  createOrder: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { shippingAddress, paymentMethod, customerPhone,customerName, items } = req.body;

    if (!shippingAddress || !paymentMethod || !customerPhone || !customerName || !items?.length) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address, phone, customer name, payment method, and items are required'
      });
    }

    // Calculate total
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create order
    const orderId = await Order.create({
      userId,
      totalAmount,
      shippingAddress,
      paymentMethod,
      customerName,
      customerPhone
    });

    // Create order items
    for (const item of items) {
      await OrderItem.create(orderId, item.productId, item.quantity, item.price);
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { orderId, totalAmount }
    });
  }),


  // Update order status (admin only)
updateOrderStatus: asyncHandler(async (req, res) => {
  const { id } = req.params; // ✅ Correct param name
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Status is required'
    });
  }

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid order status'
    });
  }

  const updated = await Order.updateStatus(id, status);
  if (!updated) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  res.json({
    success: true,
    message: 'Order status updated successfully'
  });
}),

  // Delete order (super admin only)
  deleteOrder: asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    
    // First delete order items
    await OrderItem.deleteByOrderId(orderId);
    
    // Then delete order
    const deleted = await Order.delete(orderId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  })
};

module.exports = orderController;



