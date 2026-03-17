const express = require('express');
const router = express.Router();
const revenueController = require('../controllers/revenueController');
const { auth } = require('../middleware/auth');

// GET /api/revenue/summary
router.get('/summary', revenueController.getRevenueSummary);

// GET /api/revenue/trend?days=7
router.get('/trend', revenueController.getRevenueTrend);

// POST /api/revenue/manual - Create manual revenue entry (requires authentication)
router.post('/manual', revenueController.createManualRevenue);

// GET /api/revenue/repairs-services - Get repairs and services entries (authenticated)
router.get('/repairs-services', auth, revenueController.getRepairsServices);

// POST /api/revenue/repairs-services - Create repairs and services entry (authenticated)
router.post('/repairs-services', auth, revenueController.createRepairsServices);

// GET /api/revenue/repairs-services-summary - Get summary of repairs and services (authenticated)
router.get('/repairs-services-summary', auth, revenueController.getRepairsServicesSummary);

// console.log(revenueController);

module.exports = router;
