// controllers/saleController.js
const saleService = require('../services/saleService');

const createManualSale = async (req, res) => {
    try {
        const { total_amount, product_count, payment_method } = req.body;

        if (!total_amount) {
            return res.status(400).json({ message: 'Total amount is required' });
        }

        const saleId = await saleService.createSale({
            user_id: req.user.id,
            total_amount,
            product_count,
            payment_method,
            sale_type: 'pos'
        });

        res.status(201).json({
            message: 'POS sale recorded successfully',
            saleId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to record sale' });
    }
};

const recordEcommerceSale = async (order) => {
    // Used internally after order confirmation
    await saleService.createSale({
        order_id: order.id,
        user_id: order.user_id,
        total_amount: order.total_amount,
        product_count: order.product_count,
        payment_method: order.payment_method,
        sale_type: 'ecommerce'
    });
};

const getAllSales = async (req, res) => {
    try {
        const sales = await saleService.getSales();
        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch sales' });
    }
};

const getSalesSummary = async (req, res) => {
    try {
        const summary = await saleService.getSalesSummary();
        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch summary' });
    }
};

module.exports = {
    createManualSale,
    recordEcommerceSale,
    getAllSales,
    getSalesSummary
};
