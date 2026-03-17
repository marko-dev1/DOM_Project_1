// models/order.js
const db = require('../config/database');

const Order = {
   findAll: async () => {
  const [orders] = await db.pool.execute(`
    SELECT 
      o.id, 
      o.total_amount, 
      o.status, 
      o.shipping_address,
      o.payment_method, 
      o.customer_Name AS customer_name,
      o.customer_phone,
      o.created_at, 
      u.username, 
      u.email 
    FROM orders o 
    LEFT JOIN users u ON o.user_id = u.id 
    ORDER BY o.created_at DESC
  `);
  return orders;
},

  // Find order by ID
  findById: async (orderId) => {
    const [orders] = await db.pool.execute(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );
    return orders[0] || null;
  },





  // Find orders by user ID
  findByUserId: async (userId) => {
    const [orders] = await db.pool.execute(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return orders;
  },

  // Create new order
  create: async (orderData) => {
    const { userId, totalAmount, shippingAddress, paymentMethod, customerPhone, customerName } = orderData;
    
    const [result] = await db.pool.execute(
      `INSERT INTO orders (user_id, total_amount, shipping_address, payment_method, customer_phone, customer_Name) 
       VALUES (?, ?, ?, ?, ?,?)`,
      [userId, totalAmount, shippingAddress, paymentMethod, customerPhone, customerName]
    );
    
    return result.insertId;
  },

  // Update order status
  updateStatus: async (orderId, status) => {
    const [result] = await db.pool.execute(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, orderId]
    );
    return result.affectedRows > 0;
  },

  // Delete order
  delete: async (orderId) => {
    const [result] = await db.pool.execute(
      'DELETE FROM orders WHERE id = ?',
      [orderId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = Order;