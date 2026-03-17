const Order = require('../models/order');
const OrderItem = require('../models/orderItem');
const Cart = require('../models/cart'); 
const orderService = {
  createOrder: async (userId, items, totalPrice, paymentMethod) => {
    const orderId = await Order.create(userId, totalPrice, paymentMethod);

    for (const item of items) {
      await OrderItem.create(orderId, item.product_id, item.quantity, item.price);
    }

    // Optionally clear cart after successful order
    if (Cart.clearByUserId) {
      await Cart.clearByUserId(userId);
    }

    return orderId;
  },

  getUserOrders: async (userId) => {
    return await Order.findByUserId(userId);
  },

  getOrderDetails: async (orderId) => {
    const order = await Order.findById(orderId);
    const items = await OrderItem.findByOrderId(orderId);
    return { order, items };
  }
};

module.exports = orderService;
