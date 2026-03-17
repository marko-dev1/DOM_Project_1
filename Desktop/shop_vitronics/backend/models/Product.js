// Fix the import at the top of Product.js
const database = require('../config/database');
const pool = database.pool;

class Product {
    static async create(productData) {
        const { name, description, price, cost, stock, category, image_url } = productData;
        const query = 'INSERT INTO products (name, description, price, cost, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const [result] = await pool.execute(query, [name, description, price, cost, stock, category, image_url]);
        return result.insertId;
    }

    static async findAll() {
        const query = 'SELECT * FROM products ORDER BY created_at DESC';
        const [rows] = await pool.execute(query);
        return rows;
    }

    static async findById(id) {
        const query = 'SELECT * FROM products WHERE id = ?';
        const [rows] = await pool.execute(query, [id]);
        return rows[0];
    }

    static async update(id, productData) {
        const { name, description, price, cost, stock, category, image_url } = productData;
        const query = 'UPDATE products SET name = ?, description = ?, price = ?, cost = ?, stock = ?, category = ?, image_url = ? WHERE id = ?';
        const [result] = await pool.execute(query, [name, description, price, cost, stock, category, image_url, id]);
        return result.affectedRows > 0;
    }

    // added restock level logic here

        static async update(id, productData) {
    // Filter out undefined values
    const validData = {};
    const validFields = ['name', 'description', 'price', 'cost', 'stock', 'category', 'image_url', 'restockLevel'];
    
    validFields.forEach(field => {
        if (productData[field] !== undefined) {
            validData[field] = productData[field];
        }
    });
    
    // Build dynamic query
    const setClauses = [];
    const values = [];
    
    Object.keys(validData).forEach(key => {
        setClauses.push(`${key} = ?`);
        values.push(validData[key]);
    });
    
    if (setClauses.length === 0) {
        return false; // No valid data to update
    }
    
    values.push(id);
    const query = `UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
}

    static async delete(id) {
        const query = 'DELETE FROM products WHERE id = ?';
        const [result] = await pool.execute(query, [id]);
        return result.affectedRows > 0;
    }

    static async updateStock(id, stock) {
        // const query = 'UPDATE products SET stock = ? WHERE id = ?';
        const query = 'UPDATE products SET stock = stock + ? WHERE id = ?';
        const [result] = await pool.execute(query, [stock, id]);
        return result.affectedRows > 0;
    }
}

module.exports = Product;

