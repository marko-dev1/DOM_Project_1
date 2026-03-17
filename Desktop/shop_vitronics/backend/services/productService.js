const Product = require('../models/Product');

class ProductService {
  static async createProduct(productData) {
    return await Product.create(productData);
  }

  static async getAllProducts() {
    return await Product.findAll();
  }

  static async getProductById(id) {
    return await Product.findById(id);
  }

  static async updateProduct(id, productData) {
    return await Product.update(id, productData);
  }

  static async deleteProduct(id) {
    return await Product.delete(id);
  }

  static async updateStock(id, stock) {
    return await Product.updateStock(id, stock);
  }
}

module.exports = ProductService;