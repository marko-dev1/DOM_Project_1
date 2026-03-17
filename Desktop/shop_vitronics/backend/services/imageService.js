const Image = require('../models/Image');
const fs = require('fs');
const path = require('path');

class ImageService {
    static async uploadImage(productId, imageFile, isPrimary = false) {
        const imageId = await Image.create({
            product_id: productId,
            image_path: imageFile.filename,
            is_primary: isPrimary
        });
        return imageId;
    }

    static async getProductImages(productId) {
        return await Image.findByProductId(productId);
    }

    static async setPrimaryImage(productId, imageId) {
        await Image.setPrimary(productId, imageId);
    }

    static async deleteImage(imageId) {
        const image = await Image.findById(imageId);
        if (image) {
            // Delete physical file
            const filePath = path.join(__dirname, '../public/uploads', image.image_path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            await Image.delete(imageId);
        }
    }
}

module.exports = ImageService;