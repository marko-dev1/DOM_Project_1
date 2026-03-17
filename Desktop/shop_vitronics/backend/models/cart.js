const db = require('../config/database');

class Cart {
    constructor(id, user_id, created_at, updated_at) {
        this.id = id;
        this.user_id = user_id;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }

    static async create(user_id) {
        const sql = `INSERT INTO carts (user_id) VALUES (?)`;
        try {
            const [result] = await db.execute(sql, [user_id]);
            return new Cart(result.insertId, user_id, new Date(), new Date());
        } catch (error) {
            throw error;
        }
    }

    static async findByUserId(user_id) {
        const sql = `SELECT * FROM carts WHERE user_id = ?`;
        try {
            const [rows] = await db.execute(sql, [user_id]);
            if (rows.length > 0) {
                const cart = rows[0];
                return new Cart(cart.id, cart.user_id, cart.created_at, cart.updated_at);
            }
            return null;
        } catch (error) {
            throw error;
        }
    }

    static async getOrCreateCart(user_id) {
        try {
            let cart = await this.findByUserId(user_id);
            if (!cart) {
                cart = await this.create(user_id);
            }
            return cart;
        } catch (error) {
            throw error;
        }
    }
}

class CartItem {
    constructor(id, cart_id, product_id, product_name, price, quantity, created_at, updated_at) {
        this.id = id;
        this.cart_id = cart_id;
        this.product_id = product_id;
        this.product_name = product_name;
        this.price = price;
        this.quantity = quantity;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }

    static async create(cartItemData) {
        const sql = `INSERT INTO cart_items (cart_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?)`;
        const values = [
            cartItemData.cart_id,
            cartItemData.product_id,
            cartItemData.product_name,
            cartItemData.price,
            cartItemData.quantity
        ];
        
        try {
            const [result] = await db.execute(sql, values);
            return new CartItem(
                result.insertId,
                cartItemData.cart_id,
                cartItemData.product_id,
                cartItemData.product_name,
                cartItemData.price,
                cartItemData.quantity,
                new Date(),
                new Date()
            );
        } catch (error) {
            throw error;
        }
    }

    static async findByCartId(cart_id) {
        const sql = `SELECT * FROM cart_items WHERE cart_id = ? ORDER BY created_at DESC`;
        try {
            const [rows] = await db.execute(sql, [cart_id]);
            return rows.map(row => new CartItem(
                row.id,
                row.cart_id,
                row.product_id,
                row.product_name,
                row.price,
                row.quantity,
                row.created_at,
                row.updated_at
            ));
        } catch (error) {
            throw error;
        }
    }

    static async findByCartAndProduct(cart_id, product_id) {
        const sql = `SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?`;
        try {
            const [rows] = await db.execute(sql, [cart_id, product_id]);
            if (rows.length > 0) {
                const row = rows[0];
                return new CartItem(
                    row.id,
                    row.cart_id,
                    row.product_id,
                    row.product_name,
                    row.price,
                    row.quantity,
                    row.created_at,
                    row.updated_at
                );
            }
            return null;
        } catch (error) {
            throw error;
        }
    }

    static async updateQuantity(id, quantity) {
        const sql = `UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        try {
            const [result] = await db.execute(sql, [quantity, id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async delete(id) {
        const sql = `DELETE FROM cart_items WHERE id = ?`;
        try {
            const [result] = await db.execute(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async clearCart(cart_id) {
        const sql = `DELETE FROM cart_items WHERE cart_id = ?`;
        try {
            const [result] = await db.execute(sql, [cart_id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = { Cart, CartItem };