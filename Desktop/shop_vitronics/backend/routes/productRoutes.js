
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth, adminAuth } = require('../middleware/auth');
const ProductController = require('../controllers/productController');

// Memory storage 
const memUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
    }
});

// ── Existing product routes 
router.post('/',        auth, adminAuth, require('../middleware/upload').single('image'), ProductController.createProduct);
router.get('/',         ProductController.getAllProducts);
router.get('/search',   ProductController.searchProducts);
router.get('/:id',      ProductController.getProduct);
router.put('/:id',      auth, adminAuth, require('../middleware/upload').single('image'), ProductController.updateProduct);
router.delete('/:id',   auth, adminAuth, ProductController.deleteProduct);

// ── NEW:  description generation routes

router.post('/ai/generate', auth, adminAuth, memUpload.single('image'), ProductController.generateDescription);


router.post('/ai/edit', auth, adminAuth, ProductController.aiEditDescription);

module.exports = router;