

/**
 * purchaseController.js
 * HTTP handlers — validates input, calls purchaseService, sends JSON response.
 */

const purchaseService = require('../services/purchaseService');

// ── Helpers ───────────────────────────────────────────────────────────────────
const ok  = (res, data, meta = {}) =>
    res.status(200).json({ success: true,  data, ...meta });

const created = (res, data) =>
    res.status(201).json({ success: true,  data });

const badRequest = (res, message) =>
    res.status(400).json({ success: false, error: message });

const notFound = (res, message = 'Record not found') =>
    res.status(404).json({ success: false, error: message });

const serverError = (res, err) => {
    console.error('purchaseController error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/stock-purchases
//  Returns all purchases ordered by purchase_date DESC
// ═══════════════════════════════════════════════════════════════
const getAll = async (req, res) => {
    try {
        const purchases = await purchaseService.getAllPurchases();
        ok(res, purchases, { count: purchases.length });
    } catch (err) {
        serverError(res, err);
    }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/stock-purchases/summary
//  Returns spend totals (today / week / month / all-time)
// ═══════════════════════════════════════════════════════════════
const getSummary = async (req, res) => {
    try {
        const summary = await purchaseService.getPurchaseSummary();
        ok(res, summary);
    } catch (err) {
        serverError(res, err);
    }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/stock-purchases/:id
// ═══════════════════════════════════════════════════════════════
const getOne = async (req, res) => {
    try {
        const purchase = await purchaseService.getPurchaseById(req.params.id);
        if (!purchase) return notFound(res);
        ok(res, purchase);
    } catch (err) {
        serverError(res, err);
    }
};

// ═══════════════════════════════════════════════════════════════
//  GET /api/stock-purchases/product/:productId
//  All purchases for a specific product
// ═══════════════════════════════════════════════════════════════
const getByProduct = async (req, res) => {
    try {
        const purchases = await purchaseService.getPurchasesByProduct(req.params.productId);
        ok(res, purchases, { count: purchases.length });
    } catch (err) {
        serverError(res, err);
    }
};

// ═══════════════════════════════════════════════════════════════
//  POST /api/stock-purchases
//  Body: { product_id, product_name, quantity, unit_cost,
//          supplier_name?, supplier_phone?, payment_method?,
//          status?, notes?, purchase_date? }
//
//  When status = 'received':
//    • products.stock  += quantity
//    • products.cost    = unit_cost   (updates CoGS for Net Revenue)
// ═══════════════════════════════════════════════════════════════
const create = async (req, res) => {
    try {
        const {
            product_id,
            product_name,
            quantity,
            unit_cost,
        } = req.body;

        // ── Validation ────────────────────────────────────────────────────────
        if (!product_id)
            return badRequest(res, 'product_id is required');
        if (!product_name || !String(product_name).trim())
            return badRequest(res, 'product_name is required');

        const qty  = parseInt(quantity);
        const cost = parseFloat(unit_cost);

        if (isNaN(qty)  || qty  <= 0)
            return badRequest(res, 'quantity must be a positive integer');
        if (isNaN(cost) || cost <= 0)
            return badRequest(res, 'unit_cost must be a positive number');

        // ── Allowed status values ─────────────────────────────────────────────
        const allowedStatuses = ['received', 'pending', 'returned'];
        const status = req.body.status || 'received';
        if (!allowedStatuses.includes(status))
            return badRequest(res, `status must be one of: ${allowedStatuses.join(', ')}`);

        // ── Create (handles inventory update inside transaction) ───────────────
        const createdBy = req.user?.id || null;
        const purchase  = await purchaseService.createPurchase(
            { ...req.body, quantity: qty, unit_cost: cost, status },
            createdBy
        );

        created(res, purchase);

    } catch (err) {
        // Surface foreign-key / not-found errors clearly
        if (err.message.includes('not found'))
            return notFound(res, err.message);
        if (err.code === 'ER_NO_REFERENCED_ROW_2')
            return badRequest(res, `product_id ${req.body.product_id} does not exist in products table`);
        serverError(res, err);
    }
};

// ═══════════════════════════════════════════════════════════════
//  PATCH /api/stock-purchases/:id/status
//  Body: { status: 'received' | 'pending' | 'returned' }
//
//  Status transitions automatically adjust inventory:
//    pending  → received  : +qty to stock
//    received → returned  : -qty from stock
// ═══════════════════════════════════════════════════════════════
const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowedStatuses = ['received', 'pending', 'returned'];

        if (!status || !allowedStatuses.includes(status))
            return badRequest(res, `status must be one of: ${allowedStatuses.join(', ')}`);

        const updated = await purchaseService.updatePurchaseStatus(req.params.id, status);
        ok(res, updated);

    } catch (err) {
        if (err.message.includes('not found'))
            return notFound(res, err.message);
        serverError(res, err);
    }
};

// ═══════════════════════════════════════════════════════════════
//  DELETE /api/stock-purchases/:id
//  Reverses inventory if the purchase was 'received'
// ═══════════════════════════════════════════════════════════════
const remove = async (req, res) => {
    try {
        const deleted = await purchaseService.deletePurchase(req.params.id);
        ok(res, {
            message: `Purchase id=${req.params.id} deleted`,
            reversed_stock: deleted.status === 'received',
            product_id:     deleted.product_id,
            quantity:       deleted.quantity,
        });
    } catch (err) {
        if (err.message.includes('not found'))
            return notFound(res, err.message);
        serverError(res, err);
    }
};

module.exports = { getAll, getSummary, getOne, getByProduct, create, updateStatus, remove };