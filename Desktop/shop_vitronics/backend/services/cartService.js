const { Cart, CartItem } = require('../models/cart');

class CartService {
    static async getCart(user_id) {
        try {
            const cart = await Cart.getOrCreateCart(user_id);
            const items = await CartItem.findByCartId(cart.id);
            
            const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

            return {
                cart_id: cart.id,
                items: items.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    product_name: item.product_name,
                    price: parseFloat(item.price),
                    quantity: item.quantity,
                    subtotal: parseFloat(item.price) * item.quantity
                })),
                total: parseFloat(total),
                total_items: totalItems
            };
        } catch (error) {
            throw error;
        }
    }

    static async addToCart(user_id, productData) {
        try {
            const { product_id, product_name, price, quantity = 1 } = productData;
            
            // Validate input
            if (!product_id || !product_name || !price) {
                throw new Error('Product ID, name, and price are required');
            }

            if (price <= 0) {
                throw new Error('Price must be greater than 0');
            }

            if (quantity <= 0) {
                throw new Error('Quantity must be greater than 0');
            }

            const cart = await Cart.getOrCreateCart(user_id);
            
            // Check if item already exists in cart
            const existingItem = await CartItem.findByCartAndProduct(cart.id, product_id);
            
            if (existingItem) {
                // Update quantity if item exists
                const newQuantity = existingItem.quantity + quantity;
                await CartItem.updateQuantity(existingItem.id, newQuantity);
                
                const updatedItem = await CartItem.findByCartAndProduct(cart.id, product_id);
                return {
                    message: 'Item quantity updated in cart',
                    item: {
                        id: updatedItem.id,
                        product_id: updatedItem.product_id,
                        product_name: updatedItem.product_name,
                        price: parseFloat(updatedItem.price),
                        quantity: updatedItem.quantity,
                        subtotal: parseFloat(updatedItem.price) * updatedItem.quantity
                    }
                };
            } else {
                // Add new item to cart
                const cartItem = await CartItem.create({
                    cart_id: cart.id,
                    product_id,
                    product_name,
                    price,
                    quantity
                });

                return {
                    message: 'Item added to cart',
                    item: {
                        id: cartItem.id,
                        product_id: cartItem.product_id,
                        product_name: cartItem.product_name,
                        price: parseFloat(cartItem.price),
                        quantity: cartItem.quantity,
                        subtotal: parseFloat(cartItem.price) * cartItem.quantity
                    }
                };
            }
        } catch (error) {
            throw error;
        }
    }

    static async updateCartItem(user_id, item_id, quantity) {
        try {
            if (quantity <= 0) {
                throw new Error('Quantity must be greater than 0');
            }

            const cart = await Cart.getOrCreateCart(user_id);
            const items = await CartItem.findByCartId(cart.id);
            const item = items.find(item => item.id === parseInt(item_id));

            if (!item) {
                throw new Error('Item not found in cart');
            }

            const updated = await CartItem.updateQuantity(item_id, quantity);
            if (!updated) {
                throw new Error('Failed to update item quantity');
            }

            const updatedItem = await CartItem.findByCartAndProduct(cart.id, item.product_id);
            return {
                message: 'Cart item updated',
                item: {
                    id: updatedItem.id,
                    product_id: updatedItem.product_id,
                    product_name: updatedItem.product_name,
                    price: parseFloat(updatedItem.price),
                    quantity: updatedItem.quantity,
                    subtotal: parseFloat(updatedItem.price) * updatedItem.quantity
                }
            };
        } catch (error) {
            throw error;
        }
    }

    static async removeFromCart(user_id, item_id) {
        try {
            const cart = await Cart.getOrCreateCart(user_id);
            const items = await CartItem.findByCartId(cart.id);
            const item = items.find(item => item.id === parseInt(item_id));

            if (!item) {
                throw new Error('Item not found in cart');
            }

            const deleted = await CartItem.delete(item_id);
            if (!deleted) {
                throw new Error('Failed to remove item from cart');
            }

            return {
                message: 'Item removed from cart',
                item_id: parseInt(item_id)
            };
        } catch (error) {
            throw error;
        }
    }

    static async clearCart(user_id) {
        try {
            const cart = await Cart.getOrCreateCart(user_id);
            const cleared = await CartItem.clearCart(cart.id);
            
            if (!cleared) {
                throw new Error('Failed to clear cart');
            }

            return {
                message: 'Cart cleared successfully'
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = CartService;