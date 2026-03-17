const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', auth, adminAuth, upload.single('image'), ProductController.createProduct);
router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getProduct);
router.put('/:id', auth, adminAuth, upload.single('image'), ProductController.updateProduct);
router.delete('/:id', auth, adminAuth, ProductController.deleteProduct);

module.exports = router;