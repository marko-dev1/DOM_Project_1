
// models/orderItem.js
const db = require('../config/database');

const OrderItem = {
  // Find order items by order ID
  findByOrderId: async (orderId) => {
    const [items] = await db.pool.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderId]
    );
    return items;
  },

  // Create order item
  create: async (orderId, productId, quantity, price) => {
    // First get product name
    const [products] = await db.pool.execute(
      'SELECT name FROM products WHERE id = ?',
      [productId]
    );
    
    const productName = products[0]?.name || 'Unknown Product';
    
    const [result] = await db.pool.execute(
      `INSERT INTO order_items (order_id, product_id, product_name, quantity, price) 
       VALUES (?, ?, ?, ?, ?)`,
      [orderId, productId, productName, quantity, price]
    );
    
    return result.insertId;
  },

  // Delete order items by order ID
  deleteByOrderId: async (orderId) => {
    const [result] = await db.pool.execute(
      'DELETE FROM order_items WHERE order_id = ?',
      [orderId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = OrderItem;
