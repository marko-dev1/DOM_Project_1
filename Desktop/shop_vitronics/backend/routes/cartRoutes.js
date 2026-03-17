const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const auth = require('../middleware/auth');

// All cart routes require authentication
router.use(auth.authenticate);

// GET /api/cart - Get user's cart
router.get('/', cartController.getCart);

// POST /api/cart - Add item to cart
router.post('/', cartController.addToCart);

// PUT /api/cart/:itemId - Update cart item quantity
router.put('/:itemId', cartController.updateCartItem);

// DELETE /api/cart/:itemId - Remove item from cart
router.delete('/:itemId', cartController.removeFromCart);

// DELETE /api/cart - Clear entire cart
router.delete('/', cartController.clearCart);

module.exports = router;