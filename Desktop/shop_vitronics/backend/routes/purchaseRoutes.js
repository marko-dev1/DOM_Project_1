

const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/purchaseController');

// GET    /api/stock-purchases              — list all
router.get('/',                          controller.getAll);

// GET    /api/stock-purchases/summary     — spend totals
router.get('/summary',                   controller.getSummary);

// GET    /api/stock-purchases/product/:productId  — by product
router.get('/product/:productId',        controller.getByProduct);

// GET    /api/stock-purchases/:id         — single record
router.get('/:id',                       controller.getOne);

// POST   /api/stock-purchases             — create + update inventory
router.post('/',                         controller.create);

// PATCH  /api/stock-purchases/:id/status  — change status + adjust inventory
router.patch('/:id/status',              controller.updateStatus);

// DELETE /api/stock-purchases/:id         — delete + reverse inventory
router.delete('/:id',                    controller.remove);

module.exports = router;