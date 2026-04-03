
const ProductService = require('../services/productService');
const aiProductService = require('../services/aiProductService');
const crypto = require('crypto');

// In-memory lock store — prevents duplicate submissions within 30 seconds
const pendingUploads = new Map();
const LOCK_TTL_MS = 50000;

function getFingerprint(req) {
    const raw = [
        req.file?.originalname || '',
        req.file?.size || '',
        req.body.name || '',
        req.body.price || ''
    ].join('|');
    return crypto.createHash('md5').update(raw).digest('hex');
}

function cleanExpiredLocks() {
    const now = Date.now();
    for (const [key, val] of pendingUploads.entries()) {
        if (now - val.createdAt > LOCK_TTL_MS) {
            pendingUploads.delete(key);
        }
    }
}

class ProductController {

    static async createProduct(req, res) {
        try {
            const { name, price, cost, stock, category } = req.body;
            const image_url = req.file ? `/uploads/${req.file.filename}` : null;

            // 1. Validation
            if (!name || !price || !cost || !stock) {
                return res.status(400).json({ error: 'Name, price, cost, and stock are required' });
            }

            // 2. Duplicate upload check
            cleanExpiredLocks();
            const fingerprint = getFingerprint(req);

            if (pendingUploads.has(fingerprint)) {
                const existing = pendingUploads.get(fingerprint);
                console.log('Duplicate upload blocked. Returning existing product:', existing.productId);
                return res.status(200).json({
                    message: 'Product already created (duplicate request blocked).',
                    productId: existing.productId,
                    duplicate: true
                });
            }

            // Lock immediately before async work
            pendingUploads.set(fingerprint, { productId: null, createdAt: Date.now() });

            // 3. description generation
            let description = null;
            if (req.file) {
                try {
                    const fs = require('fs');
                    const imageBuffer = fs.readFileSync(req.file.path);
                    const aiContent = await aiProductService.generateFromImage(
                        imageBuffer,
                        req.file.mimetype
                    );
                    description = aiContent.description;
                    console.log('AI description generated for:', name);
                } catch (aiError) {
                    console.error('AI description failed, saving without it:', aiError.message);
                    description = req.body.description || null;
                }
            } else {
                description = req.body.description || null;
            }

            // 4. Save to DB
            const productId = await ProductService.createProduct({
                name,
                description,
                price: parseFloat(price),
                cost: parseFloat(cost),
                stock: parseInt(stock),
                category,
                image_url
            });

            // Update lock with real productId
            pendingUploads.set(fingerprint, { productId, createdAt: Date.now() });

            res.status(201).json({ message: 'Product created successfully', productId });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getAllProducts(req, res) {
        try {
            const products = await ProductService.getAllProducts();
            res.json(ProductController._formatImageUrls(products));
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getProduct(req, res) {
        try {
            const { id } = req.params;
            const product = await ProductService.getProductById(id);
            if (!product) return res.status(404).json({ error: 'Product not found' });
            res.json(ProductController._formatImageUrl(product));
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async updateProduct(req, res) {
        try {
            const { id } = req.params;
            const { name, description, price, cost, stock, category } = req.body;
            const image_url = req.file ? `/uploads/${req.file.filename}` : undefined;

            const updateData = { name, description, price, cost, stock, category };
            if (image_url) updateData.image_url = image_url;

            const success = await ProductService.updateProduct(id, updateData);
            if (success) {
                res.json({ message: 'Product updated successfully' });
            } else {
                res.status(404).json({ error: 'Product not found' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async deleteProduct(req, res) {
        try {
            const { id } = req.params;
            const success = await ProductService.deleteProduct(id);
            if (success) {
                res.json({ message: 'Product deleted successfully' });
            } else {
                res.status(404).json({ error: 'Product not found' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async searchProducts(req, res) {
        try {
            const q = (req.query.q || '').trim();
            if (!q) return res.json([]);
            if (q.length < 2) {
                return res.status(400).json({ error: 'Search query must be at least 2 characters' });
            }
            const results = await ProductService.searchProducts(q);
            res.json(ProductController._formatImageUrls(results));
        } catch (error) {
            console.error('Search error:', error);
            res.status(500).json({ error: 'Search failed', message: error.message });
        }
    }

    static async generateDescription(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No image provided. Send it under the field name "image".' });
            }

            const aiContent = await aiProductService.generateFromImage(
                req.file.buffer,
                req.file.mimetype
            );

            const productId = req.body.product_id ? parseInt(req.body.product_id) : null;

            if (productId) {
                const product = await ProductService.getProductById(productId);
                if (!product) {
                    return res.status(404).json({ error: `Product with id ${productId} not found.` });
                }
                await ProductService.updateProduct(productId, { description: aiContent.description });
                return res.status(200).json({
                    success: true,
                    message: 'description generated and saved to product.',
                    product_id: productId,
                    ai_content: aiContent
                });
            }

            return res.status(200).json({
                success: true,
                message: 'description generated. Supply product_id to save it.',
                ai_content: aiContent
            });

        } catch (error) {
            console.error('AI generate error:', error.message);
            if (error instanceof SyntaxError) {
                return res.status(500).json({ error: 'malformed content. Please try again.' });
            }
            return res.status(500).json({ error: 'Failed to generate description.', details: error.message });
        }
    }

    static async aiEditDescription(req, res) {
        try {
            const { product_id, editInstruction } = req.body;

            if (!product_id) return res.status(400).json({ error: 'product_id is required.' });
            if (!editInstruction?.trim()) return res.status(400).json({ error: 'editInstruction is required.' });

            const product = await ProductService.getProductById(product_id);
            if (!product) return res.status(404).json({ error: `Product with id ${product_id} not found.` });

            const currentContent = {
                title:       product.name        || '',
                tagline:     product.tagline      || '',
                description: product.description  || '',
                bullets:     [],
                seoKeywords: []
            };

            const updatedContent = await aiProductService.editDescription(currentContent, editInstruction);

            await ProductService.updateProduct(product_id, { description: updatedContent.description });

            return res.status(200).json({
                success: true,
                message: 'Product description updated with AI edit.',
                product_id,
                ai_content: updatedContent
            });

        } catch (error) {
            console.error('AI edit error:', error.message);
            if (error instanceof SyntaxError) {
                return res.status(500).json({ error: 'AI returned malformed content. Please try again.' });
            }
            return res.status(500).json({ error: 'Failed to edit description.', details: error.message });
        }
    }

    static _formatImageUrl(product, defaultImg = '/uploads/logo.png') {
        return {
            ...product,
            image_url: product.image_url
                ? (product.image_url.startsWith('http') || product.image_url.startsWith('/uploads/')
                    ? product.image_url
                    : '/uploads/' + product.image_url)
                : defaultImg
        };
    }

    static _formatImageUrls(products, defaultImg = '/uploads/default-product.jpg') {
        return products.map(p => ProductController._formatImageUrl(p, defaultImg));
    }
}

module.exports = ProductController;