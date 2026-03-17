const jwt = require("jsonwebtoken");
const User = require('../models/user');

const token = jwt.sign(
  {
    id: user.id,
    role: user.role   // "user", "admin", "superadmin"
  },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);


module.exports = function auth(req, res, next) {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "No token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;   // contains { id, role }
        next();
    } catch (error) {
        return res.status(400).json({ message: "Invalid token" });
    }
};

module.exports = function adminAuth(req, res, next) {

    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
        return res.status(403).json({ message: "Admins only" });
    }

    next();
};

module.exports = function superAdminAuth(req, res, next) {

    if (req.user.role !== "superadmin") {
        return next();
        return res.status(403).json({ message: "Superadmin access only" });
    }

   
};


// Adding to cart: {id: 11, name: 'phone case Redmi note 14 pro', description: 'phone case Redmi note 14 pro sleek design\r\navailable color: pink\r\n', price: '1550.00', stock: 1, …}
// script.js:218 Cart item image_url: /uploads/image-1762416674874-781147000.jpg
// script.js:401 🛒 Sending order data: {user_id: 7, total_amount: 1550, shipping_address: 'kk', payment_method: 'standard_checkout', customer_phone: '0733 921981', …}
// script.js:411 📨 Response status: 200
// script.js:414 📦 Response data: {success: true, orderId: 45, message: 'Order created successfully', orderNumber: 'ORD-45', totalAmount: 1550, …}