const validateProduct = (req, res, next) => {
    const { name, price, category } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Product name is required' });
    }

    if (!price || isNaN(price) || parseFloat(price) <= 0) {
        return res.status(400).json({ error: 'Valid price is required' });
    }

    if (!category || !category.trim()) {
        return res.status(400).json({ error: 'Category is required' });
    }

    next();
};

const validateImageUpload = (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'At least one image is required' });
    }
    next();
};

module.exports = {
    validateProduct,
    validateImageUpload
};