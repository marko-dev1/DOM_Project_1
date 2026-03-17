const ProductService = require('../services/productService');

class ProductController {
  static async createProduct(req, res) {
    try {
      const { name, description, price, cost, stock, category } = req.body;
      const image_url = req.file ? `/uploads/${req.file.filename}` : null;

      if (!name || !price || !cost || !stock) {
        return res.status(400).json({ error: 'Name, price, cost, and stock are required' });
      }

      const productId = await ProductService.createProduct({
        name,
        description,
        price: parseFloat(price),
        cost: parseFloat(cost),
        stock: parseInt(stock),
        category,
        image_url
      });

      res.status(201).json({ message: 'Product created successfully', productId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAllProducts(req, res) {
    try {
      const products = await ProductService.getAllProducts();
      
      // Ensure image URLs are properly formatted
      const productsWithCorrectUrls = products.map(product => ({
        ...product,
        image_url: product.image_url ? 
          (product.image_url.startsWith('http') || product.image_url.startsWith('/uploads/') ? 
            product.image_url : 
            '/uploads/' + product.image_url
          ) : 
          '/uploads/default-product.jpg' // Default image if none exists
      }));
      
      res.json(productsWithCorrectUrls);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await ProductService.getProductById(id);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      // Format the image URL for single product
      const productWithCorrectUrl = {
        ...product,
        image_url: product.image_url ? 
          (product.image_url.startsWith('http') || product.image_url.startsWith('/uploads/') ? 
            product.image_url : 
            '/uploads/' + product.image_url
          ) : 
          '/uploads/logo.png' // Default image if none exists
      };
      
      res.json(productWithCorrectUrl);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const { name, description, price, cost ,stock, category } = req.body;
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
}

module.exports = ProductController;