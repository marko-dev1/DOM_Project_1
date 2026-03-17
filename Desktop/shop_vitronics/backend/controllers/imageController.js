const ImageService = require('../services/imageService');

class ImageController {
    static async uploadImage(req, res, next) {
        try {
            const imageId = await ImageService.uploadImage(
                req.params.productId,
                req.file,
                req.body.is_primary === 'true'
            );
            res.status(201).json({ id: imageId, message: 'Image uploaded successfully' });
        } catch (error) {
            next(error);
        }
    }

    static async getProductImages(req, res, next) {
        try {
            const images = await ImageService.getProductImages(req.params.productId);
            res.json(images);
        } catch (error) {
            next(error);
        }
    }

    static async setPrimaryImage(req, res, next) {
        try {
            await ImageService.setPrimaryImage(req.params.productId, req.params.imageId);
            res.json({ message: 'Primary image set successfully' });
        } catch (error) {
            next(error);
        }
    }

    static async deleteImage(req, res, next) {
        try {
            await ImageService.deleteImage(req.params.id);
            res.json({ message: 'Image deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ImageController;