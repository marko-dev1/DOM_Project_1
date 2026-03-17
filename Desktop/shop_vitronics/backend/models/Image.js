const Database = require('../config/database');

class Image {
    static async create(imageData) {
        const sql = 'INSERT INTO images (product_id, image_path, is_primary) VALUES (?, ?, ?)';
        await Database.query(sql, [
            imageData.product_id,
            imageData.image_path,
            imageData.is_primary
        ]);
    }

    static async findByProductId(productId) {
        const sql = 'SELECT * FROM images WHERE product_id = ? ORDER BY is_primary DESC';
        return await Database.query(sql, [productId]);
    }

    static async setPrimary(productId, imageId) {
        // Reset all primary flags for this product
        await Database.query('UPDATE images SET is_primary = FALSE WHERE product_id = ?', [productId]);
        
        // Set the new primary image
        await Database.query('UPDATE images SET is_primary = TRUE WHERE id = ? AND product_id = ?', [imageId, productId]);
    }

    static async delete(id) {
        const sql = 'DELETE FROM images WHERE id = ?';
        await Database.query(sql, [id]);
    }
}

module.exports = Image;