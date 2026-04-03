
// module.exports = Product;

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

    // ── Unified update — handles both full updates and partial (restock level etc) ──
    static async update(id, productData) {
        const validFields = ['name', 'description', 'price', 'cost', 'stock', 'category', 'image_url', 'restockLevel'];
        const setClauses = [];
        const values = [];

        validFields.forEach(field => {
            if (productData[field] !== undefined) {
                setClauses.push(`${field} = ?`);
                values.push(productData[field]);
            }
        });

        if (setClauses.length === 0) return false;

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
        const query = 'UPDATE products SET stock = stock + ? WHERE id = ?';
        const [result] = await pool.execute(query, [stock, id]);
        return result.affectedRows > 0;
    }

    // ── Full-table search across name, description, category ──
    static async search(q) {
    if (!q || !q.trim()) return [];

    const like = `%${q.trim()}%`;

    const query = `
        SELECT *
        FROM products
        WHERE
            LOWER(name)        LIKE LOWER(?) OR
            LOWER(description) LIKE LOWER(?) OR
            LOWER(category)    LIKE LOWER(?)
        ORDER BY
            CASE
                WHEN LOWER(name)     LIKE LOWER(?) THEN 0
                WHEN LOWER(category) LIKE LOWER(?) THEN 1
                ELSE 2
            END,
            name ASC
        LIMIT 200
    `;

    const [rows] = await pool.query(query, [like, like, like, like, like]);
    return rows;
}
}

module.exports = Product;