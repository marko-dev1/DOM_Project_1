const CartService = require('../services/cartService');

class CartController {
    static async getCart(req, res) {
        try {
            const user_id = req.user.id;
            const cart = await CartService.getCart(user_id);
            res.json(cart);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async addToCart(req, res) {
        try {
            const user_id = req.user.id;
            const { product_id, product_name, price, quantity } = req.body;

            if (!product_id || !product_name || !price) {
                return res.status(400).json({ 
                    error: 'Product ID, product name, and price are required' 
                });
            }

            const result = await CartService.addToCart(user_id, {
                product_id,
                product_name,
                price: parseFloat(price),
                quantity: quantity ? parseInt(quantity) : 1
            });

            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    static async updateCartItem(req, res) {
        try {
            const user_id = req.user.id;
            const { item_id } = req.params;
            const { quantity } = req.body;

            if (!quantity) {
                return res.status(400).json({ error: 'Quantity is required' });
            }

            const result = await CartService.updateCartItem(user_id, item_id, parseInt(quantity));
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    static async removeFromCart(req, res) {
        try {
            const user_id = req.user.id;
            const { item_id } = req.params;

            const result = await CartService.removeFromCart(user_id, item_id);
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    static async clearCart(req, res) {
        try {
            const user_id = req.user.id;
            const result = await CartService.clearCart(user_id);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = CartController;