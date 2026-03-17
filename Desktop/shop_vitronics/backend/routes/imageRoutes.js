const express = require('express');
const router = express.Router();
const ImageController = require('../controllers/imageController');
const upload = require('../middleware/upload');

router.get('/product/:productId', ImageController.getProductImages);
router.post('/product/:productId', upload.single('image'), ImageController.uploadImage);
router.put('/product/:productId/primary/:imageId', ImageController.setPrimaryImage);
router.delete('/:id', ImageController.deleteImage);

module.exports = router;