//routes/sales.js
const express = require('express');
const router = express.Router();
const Sales = require('../models/Sales');
const { pool } = require('../config/database');
const {auth,  superAdminAuth } = require('../middleware/auth');



// GET /api/sales - Get all sales
router.get('/',auth, superAdminAuth, async (req, res) => {
    try {
        // Parse query parameters with validation
        let limit = parseInt(req.query.limit);
        let offset = parseInt(req.query.offset);
        
        // Set defaults if invalid
        if (isNaN(limit) || limit <= 0) limit = 100;
        if (isNaN(offset) || offset < 0) offset = 0;
        
        const sales = await Sales.getAllSales();
        
        res.json({
            success: true,
            data: sales
        });
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sales: ' + error.message
        });
    }
});


// POST /api/sales/manual - Record a new manual sale
router.post('/manual', auth, superAdminAuth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        // Set transaction isolation level to avoid locks
        await connection.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        await connection.beginTransaction();
        
        const {
            customerName,
            customerPhone,
            customerEmail,
            paymentMethod = 'cash',
            notes,
            saleDate,
            items = [],
            totalAmount,
            subtotal
        } = req.body;

        // Validate items
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot create sale without items'
            });
        }

        // Parse total amount
        const parsedTotalAmount = parseFloat(totalAmount) || 0;

        // Create order ID
        const orderId = `POS-${Date.now()}`;
        
        // Use provided sale date or current date (UTC-based)
        let saleDateObj;
        if (saleDate) {
            // Parse date string as UTC to avoid timezone issues
            const [year, month, day] = saleDate.split('-').map(Number);
            saleDateObj = new Date(Date.UTC(year, month - 1, day));
        } else {
            // Use current UTC date
            const now = new Date();
            saleDateObj = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        }
        const salesYear = saleDateObj.getUTCFullYear();
        const salesMonth = saleDateObj.getUTCMonth() + 1;
        const salesWeek = Sales.getWeekNumber(saleDateObj);
        const salesDay = saleDateObj.getUTCDate();
        const salesDateStr = saleDateObj.toISOString().split('T')[0];

        // Calculate product count and validate items
        let productCount = 0;
        const processedItems = [];
        
        for (const item of items) {
            // Parse numeric values safely
            const quantity = parseInt(item.quantity) || 1;
            const price = parseFloat(item.price || item.unit_price || 0);
            
            // Validate price
            if (isNaN(price) || price <= 0) {
                throw new Error(`Invalid price for item: ${item.name || item.productName || 'Unknown'}`);
            }
            
            const totalPrice = quantity * price;
            productCount += quantity;
            
            processedItems.push({
                ...item,
                quantity,
                price,
                totalPrice
            });
        }

        // 1. Insert the sale
        const [saleResult] = await connection.execute(`
            INSERT INTO sales (
                order_id, 
                user_id, 
                total_amount, 
                sales_date, 
                sales_year, 
                sales_month, 
                sales_week, 
                sales_day, 
                product_count,
                payment_method, 
                status,
                customer_name,
                customer_phone,
                customer_email,
                notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?)
        `, [
            orderId,
            req.user?.id || null,
            parsedTotalAmount,
            salesDateStr,
            salesYear,
            salesMonth,
            salesWeek,
            salesDay,
            productCount,
            paymentMethod,
            customerName || 'Walk-in Customer',
            customerPhone || '',
            customerEmail || '',
            notes || ''
        ]);

        const saleId = saleResult.insertId;

        // 2. Insert items into sale_items
        for (const item of processedItems) {
            const quantity = item.quantity;
            const unitPrice = item.price;
            const totalPrice = item.totalPrice;

            await connection.execute(`
                INSERT INTO sale_items (
                    sale_id, 
                    product_id, 
                    product_name,
                    quantity, 
                    unit_price, 
                    total_price
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
                saleId,
                item.productId || item.id || null,
                item.name || item.productName || 'Unknown Product',
                quantity,
                unitPrice,
                totalPrice
            ]);

            // 3. Update product stock
            if (item.productId || item.id) {
                try {
                    // Check current stock
                    const [product] = await connection.execute(`
                        SELECT stock FROM products WHERE id = ?
                    `, [item.productId || item.id]);
                    
                    if (product.length > 0) {
                        const currentStock = parseInt(product[0].stock) || 0;
                        
                        if (currentStock < quantity) {
                            throw new Error(`Insufficient stock for ${item.name || 'product'}. Available: ${currentStock}, Required: ${quantity}`);
                        }
                        
                        // Update stock
                        const [updateResult] = await connection.execute(`
                            UPDATE products 
                            SET stock = stock - ? 
                            WHERE id = ? AND stock >= ?
                        `, [quantity, item.productId || item.id, quantity]);
                        
                        if (updateResult.affectedRows > 0) {
                        } else {
                            throw new Error(`Failed to update stock for product ${item.productId || item.id}`);
                        }
                    }
                } catch (stockError) {
                    console.error('Stock update error:', stockError);
                    throw stockError;
                }
            }
        }

        await connection.commit();

        // Fetch the created sale with items
        const [saleData] = await connection.execute(`
            SELECT s.*, 
                   COUNT(si.id) as items_count
            FROM sales s
            LEFT JOIN sale_items si ON s.id = si.sale_id
            WHERE s.id = ?
            GROUP BY s.id
        `, [saleId]);

        // Fetch items
        const [saleItems] = await connection.execute(`
            SELECT * FROM sale_items WHERE sale_id = ?
        `, [saleId]);

        // Format items for response (parse all numbers)
        const formattedItems = saleItems.map(item => ({
            ...item,
            quantity: parseInt(item.quantity) || 0,
            unit_price: parseFloat(item.unit_price) || 0,
            total_price: parseFloat(item.total_price) || 0
        }));

        const responseData = {
            ...saleData[0],
            id: saleId,
            saleNumber: orderId,
            customerName: customerName || 'Walk-in Customer',
            customerPhone: customerPhone || '',
            customerEmail: customerEmail || '',
            items: formattedItems,
            notes: notes,
            paymentMethod: paymentMethod,
            totalAmount: parsedTotalAmount,
            date: salesDateStr
        };

        res.status(201).json({
            success: true,
            message: 'Sale recorded successfully',
            data: responseData
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error recording sale:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to record sale'
        });
    } finally {
        connection.release();
    }
});
// GET /api/sales/stats/summary - Get sales statistics
router.get('/stats/summary',auth, superAdminAuth, async (req, res) => {
    try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Get daily stats
        const dailyStats = await Sales.getSalesStatistics(todayStr, todayStr);
        
        // Get weekly stats
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        
        // If week start falls in previous month, use month start instead
        // This ensures weekly data resets when new month begins mid-week
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        if (weekStart < monthStart) {
            weekStart.setTime(monthStart.getTime());
        }
        
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = todayStr;
        const weeklyStats = await Sales.getSalesStatistics(weekStartStr, weekEndStr);
        
        // Get monthly stats
        const monthStartStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
        const monthlyStats = await Sales.getSalesStatistics(monthStartStr, weekEndStr);
        
        // Get all time stats
        const allTimeStats = await Sales.getSalesStatistics('2000-01-01', weekEndStr);
        const totalSalesCount = await Sales.getSalesCount();

        // Ensure all values are numbers, not strings
        const response = {
            success: true,
            data: {
                daily: {
                    total_revenue: Number(dailyStats?.total_revenue || 0),
                    sales_count: Number(dailyStats?.total_orders || 0),
                    average_order_value: Number(dailyStats?.average_order_value || 0)
                },
                weekly: {
                    total_revenue: Number(weeklyStats?.total_revenue || 0),
                    sales_count: Number(weeklyStats?.total_orders || 0),
                    average_order_value: Number(weeklyStats?.average_order_value || 0)
                },
                monthly: {
                    total_revenue: Number(monthlyStats?.total_revenue || 0),
                    sales_count: Number(monthlyStats?.total_orders || 0),
                    average_order_value: Number(monthlyStats?.average_order_value || 0)
                },
                allTime: {
                    total_revenue: Number(allTimeStats?.total_revenue || 0),
                    sales_count: Number(totalSalesCount || 0),
                    average_order_value: Number(allTimeStats?.average_order_value || 0)
                }
            }
        };
        res.json(response);

    } catch (error) {
        console.error('Error fetching sales stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sales statistics'
        });
    }
});


// DELETE /api/sales/manual/:id - Delete a manual sale
router.delete('/manual/:id',auth, superAdminAuth, async (req, res) => {
    try {
        let sale;
        
        // Check if it's an order_id (starts with POS-) or a database ID
        if (req.params.id.startsWith('POS-')) {
            // It's an order ID
            sale = await Sales.getSaleByOrderId(req.params.id);
        } else {
            sale = await Sales.getSaleById(req.params.id);
        }
        
        if (!sale) {
            return res.status(404).json({
                success: false,
                error: 'Sale not found'
            });
        }

        // Delete using the order_id
        const deleted = await Sales.deleteSale(sale.order_id || req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Sale not found or cannot be deleted'
            });
        }

        res.json({
            success: true,
            message: 'Sale deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting sale:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete sale'
        });
    }
});

// get profit

router.get('/stats/profit', auth, superAdminAuth, async (req,res)=>{

try{

const {month, year} = req.query;

let dateFilter = '';

if(month && year){
dateFilter = `AND MONTH(s.sales_date) = ? AND YEAR(s.sales_date) = ?`;
}

const [result] = await pool.execute(`
SELECT
SUM(si.quantity * si.unit_price) as revenue,
SUM(si.quantity * si.cost_price) as cost,
SUM((si.unit_price - si.cost_price) * si.quantity) as profit
FROM sale_items si
JOIN sales s ON si.sale_id = s.id
WHERE s.status='completed'
${dateFilter}
`, month ? [month,year] : []);

res.json({
success:true,
data:{
revenue: Number(result[0].revenue || 0),
cost: Number(result[0].cost || 0),
profit: Number(result[0].profit || 0)
}
});

}catch(error){
res.status(500).json({error:error.message});
}

});

// GET /api/sales/:id - Get single sale by ID
router.get('/:id',auth, superAdminAuth, async (req, res) => {
    try {
        let sale;
        
        // Check if it's an order_id or sale ID
        if (req.params.id.startsWith('POS-')) {
            sale = await Sales.getSaleByOrderId(req.params.id);
        } else {
            sale = await Sales.getSaleById(req.params.id);
        }

        if (!sale) {
            return res.status(404).json({
                success: false,
                error: 'Sale not found'
            });
        }

        // Format the response
        const formattedSale = {
            ...sale,
            id: sale.id,
            saleNumber: sale.order_id || sale.sale_number,
            customerName: sale.customer_name || 'Walk-in Customer',
            customerPhone: sale.customer_phone || '',
            customerEmail: sale.customer_email || '',
            items: sale.items || [], 
            totalAmount: parseFloat(sale.total_amount || 0)
        };

        res.json({
            success: true,
            data: formattedSale
        });

    } catch (error) {
        console.error('Error fetching sale:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sale'
        });
    }
});

// Backend route for sale items
router.get('/:id/items',auth, superAdminAuth, async (req, res) => {
    try {
        const saleId = req.params.id;
        
        // First check if the sale exists
        let sale;
        if (saleId.startsWith('POS-')) {
            sale = await Sales.getSaleByOrderId(saleId);
        } else {
            sale = await Sales.getSaleById(saleId);
        }
        
        if (!sale) {
            return res.status(404).json({
                success: false,
                error: 'Sale not found'
            });
        }

        // Get items from sale_items table 
        const [items] = await pool.execute(`
            SELECT 
                si.*,
                p.name
            FROM sale_items si
            LEFT JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ?
        `, [sale.id || saleId]);
        
        // Format items for frontend
        const formattedItems = items.map(item => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name || item.name || 'Unknown Product',
            name: item.product_name || item.name || 'Unknown Product',
            quantity: parseInt(item.quantity) || 0,
            price: parseFloat(item.unit_price || item.price || 0),
            unit_price: parseFloat(item.unit_price || item.price || 0),
            total: parseFloat(item.total_price || (item.quantity * (item.unit_price || item.price || 0)) || 0),
            total_price: parseFloat(item.total_price || (item.quantity * (item.unit_price || item.price || 0)) || 0)
        }));
        
        res.json({ 
            success: true, 
            data: formattedItems 
        });
        
    } catch (error) {
        console.error('Error fetching sale items:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// GET /api/sales/search/all - Search sales
router.get('/search/all',auth, superAdminAuth, async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Search query required'
            });
        }

        const sales = await Sales.searchSales(q);

        res.json({
            success: true,
            data: sales
        });

    } catch (error) {
        console.error('Error searching sales:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search sales'
        });
    }
});

module.exports = router;