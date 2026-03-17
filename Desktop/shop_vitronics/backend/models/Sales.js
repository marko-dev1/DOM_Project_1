
// models/sales.js
const { pool } = require('../config/database');

class Sales {
    



static async createSale(saleData, items = []) {
    try {
        const {
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
        } = saleData;

        // Start a transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Insert the sale
            const [result] = await connection.execute(
                `INSERT INTO sales (
                    order_id, user_id, total_amount, sales_date, 
                    sales_year, sales_month, sales_week, sales_day,
                    product_count, payment_method, status,
                    customer_name, customer_phone, customer_email, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    order_id || '',
                    user_id || null,
                    parseFloat(total_amount) || 0,
                    sales_date,
                    parseInt(sales_year) || new Date().getFullYear(),
                    parseInt(sales_month) || new Date().getMonth() + 1,
                    parseInt(sales_week) || 0,
                    parseInt(sales_day) || new Date().getDate(),
                    parseInt(product_count) || 0,
                    payment_method || 'cash',
                    status || 'completed',
                    customer_name || 'Walk-in Customer',
                    customer_phone || '',
                    customer_email || '',
                    notes || ''
                ]
            );

            const saleId = result.insertId;

            // Insert all sale items
            if (items && items.length > 0) {
                for (const item of items) {
                    await connection.execute(
                        `INSERT INTO sale_items (
                            sale_id, product_id, product_name, quantity, 
                            unit_price, total_price
                        ) VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            saleId,
                            item.productId,
                            item.name || 'Unknown Product',
                            parseInt(item.quantity) || 0,
                            parseFloat(item.price) || 0,
                            parseFloat(item.total || item.price * item.quantity) || 0
                        ]
                    );
                }
            }

            await connection.commit();
            connection.release();
            
            return saleId;

        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }

    } catch (error) {
        console.error('Error creating sale:', error);
        throw error;
    }
}

static async getSaleById(id) {
    try {
        // Get sale details
        const [sales] = await pool.execute(`
            SELECT * FROM sales WHERE id = ?
        `, [id]);
        
        if (sales.length === 0) {
            return null;
        }
        
        const sale = sales[0];
        
        // Get sale items
        const [items] = await pool.execute(`
            SELECT * FROM sale_items WHERE sale_id = ?
        `, [id]);
        
        // Combine sale with items
        return {
            ...sale,
            items: items
        };
        
    } catch (error) {
        console.error('Error fetching sale by ID:', error);
        throw error;
    }
}



static async getSaleByOrderId(orderId) {
    try {
        const [rows] = await pool.query(
            `SELECT 
                s.*,
                COALESCE((
                    SELECT SUM(quantity) 
                    FROM sale_items si 
                    WHERE si.sale_id = s.id
                ), 0) as total_quantity
            FROM sales s 
            WHERE s.order_id = ?`,
            [orderId]
        );
        
        if (rows.length > 0) {
            const sale = rows[0];
            
            // Get items for this sale
            const [items] = await pool.query(
                `SELECT 
                    si.*,
                    p.name as product_name
                FROM sale_items si
                LEFT JOIN products p ON si.product_id = p.id
                WHERE si.sale_id = ?`,
                [sale.id]
            );
            sale.items = items;
            
            // Ensure product_count is set correctly
            sale.product_count = Number(sale.total_quantity || 0) || items.reduce((sum, item) => sum + item.quantity, 0);
            
            return sale;
        }
        
        return null;
    } catch (error) {
        console.error('Error getting sale by order id:', error);
        throw error;
    }
}
    // Delete sale
    static async deleteSale(orderId) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM sales WHERE order_id = ?',
                [orderId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting sale:', error);
            throw error;
        }
    }

static async updateProductStock(productId, quantityChange) {
    try {
        
        // Check current stock first (optional but recommended)
        const [product] = await pool.execute(`
            SELECT stock FROM products WHERE id = ?
        `, [productId]);
        
        if (product.length === 0) {
            console.warn(`Product ${productId} not found for stock update`);
            return false;
        }
        
        const currentStock = parseInt(product[0].stock) || 0;
        
        // For selling (negative change), check if enough stock
        if (quantityChange < 0 && currentStock < Math.abs(quantityChange)) {
            throw new Error(`Insufficient stock for product ID ${productId}. Available: ${currentStock}, Required: ${Math.abs(quantityChange)}`);
        }
        
        // Update stock using the correct column name 'stock'
        const [result] = await pool.execute(`
            UPDATE products 
            SET stock = stock + ? 
            WHERE id = ?
        `, [quantityChange, productId]);
        
        return result.affectedRows > 0;
        
    } catch (error) {
        console.error('Error updating product stock:', error);
        throw error;
    }
}
    // Get daily sales
    static async getDailySales(startDate, endDate) {
        try {
            const [rows] = await pool.execute(
                `SELECT 
                    sales_date,
                    COUNT(DISTINCT order_id) as total_orders,
                    COALESCE(SUM(total_amount), 0) as total_sales,
                    COALESCE(AVG(total_amount), 0) as average_order_value,
                    COALESCE(SUM(product_count), 0) as total_products_sold
                 FROM sales 
                 WHERE sales_date BETWEEN ? AND ?
                 GROUP BY sales_date
                 ORDER BY sales_date DESC`,
                [startDate, endDate]
            );
            return rows;
        } catch (error) {
            console.error('Error getting daily sales:', error);
            throw error;
        }
    }

    // Get weekly sales
    static async getWeeklySales(startDate, endDate) {
        try {
            const [rows] = await pool.execute(
                `SELECT 
                    sales_year,
                    sales_week,
                    MIN(sales_date) as week_start_date,
                    MAX(sales_date) as week_end_date,
                    COUNT(DISTINCT order_id) as total_orders,
                    COALESCE(SUM(total_amount), 0) as total_sales,
                    COALESCE(AVG(total_amount), 0) as average_order_value,
                    COALESCE(SUM(product_count), 0) as total_products_sold
                 FROM sales 
                 WHERE sales_date BETWEEN ? AND ?
                 GROUP BY sales_year, sales_week
                 ORDER BY sales_year DESC, sales_week DESC`,
                [startDate, endDate]
            );
            return rows;
        } catch (error) {
            console.error('Error getting weekly sales:', error);
            throw error;
        }
    }

    // Get monthly sales
    static async getMonthlySales(year = null, month = null) {
        try {
            let query = `SELECT 
                    sales_year,
                    sales_month,
                    DATE_FORMAT(MIN(sales_date), '%Y-%m-01') as month_start_date,
                    LAST_DAY(MAX(sales_date)) as month_end_date,
                    COUNT(DISTINCT order_id) as total_orders,
                    COALESCE(SUM(total_amount), 0) as total_sales,
                    COALESCE(AVG(total_amount), 0) as average_order_value,
                    COALESCE(SUM(product_count), 0) as total_products_sold
                 FROM sales 
                 WHERE 1=1`;
            
            const params = [];
            
            if (year) {
                query += ' AND sales_year = ?';
                params.push(parseInt(year));
            }
            
            if (month) {
                query += ' AND sales_month = ?';
                params.push(parseInt(month));
            }
            
            query += ` GROUP BY sales_year, sales_month
                       ORDER BY sales_year DESC, sales_month DESC`;
            
            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Error getting monthly sales:', error);
            throw error;
        }
    }

    // Get sales by date range
    static async getSalesByDateRange(startDate, endDate, limit = 100, offset = 0) {
        try {
            const limitNum = parseInt(limit) || 100;
            const offsetNum = parseInt(offset) || 0;
            
            const [rows] = await pool.execute(
                `SELECT s.*, u.name as customer_name, u.email as customer_email, u.phone_number as customer_phone, o.status as order_status
                 FROM sales s
                 LEFT JOIN users u ON s.user_id = u.id
                 LEFT JOIN orders o ON s.order_id = o.id
                 WHERE s.sales_date BETWEEN ? AND ?
                 ORDER BY s.created_at DESC
                 LIMIT ? OFFSET ?`,
                [startDate, endDate, limitNum, offsetNum]
            );
            return rows;
        } catch (error) {
            console.error('Error getting sales by date range:', error);
            throw error;
        }
    }

    // Get sales summary for a specific period
    static async getSalesSummary(periodType, periodDate) {
        try {
            const [rows] = await pool.execute(
                `SELECT * FROM sales_summary 
                 WHERE period_type = ? AND period_date = ?`,
                [periodType, periodDate]
            );
            return rows[0];
        } catch (error) {
            console.error('Error getting sales summary:', error);
            throw error;
        }
    }



    // Update sales summary cache
static async updateSalesSummary(periodType, periodDate, summaryData) {
    try {
        const { total_sales, total_orders, average_order_value } = summaryData;
        
        // Format the period_date based on period_type
        let formattedPeriodDate = periodDate;
        
        // For weekly summaries, ensure it's stored as a string without date validation
        if (periodType === 'weekly') {
            // Make sure it's stored as a simple string format like '2026-W07'
            formattedPeriodDate = String(periodDate);
        }
        
        await pool.execute(
            `INSERT INTO sales_summary 
             (period_type, period_date, total_sales, total_orders, average_order_value)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             total_sales = VALUES(total_sales),
             total_orders = VALUES(total_orders),
             average_order_value = VALUES(average_order_value),
             updated_at = CURRENT_TIMESTAMP`,
            [
                periodType, 
                formattedPeriodDate, 
                parseFloat(total_sales || 0), 
                parseInt(total_orders || 0), 
                parseFloat(average_order_value || 0)
            ]
        );
    } catch (error) {
        console.error('Error updating sales summary:', error);
        throw error;
    }
}
    // Get top selling products
    static async getTopSellingProducts(startDate, endDate, limit = 10) {
        try {
            const limitNum = parseInt(limit) || 10;
            
            const [rows] = await pool.execute(
                `SELECT 
                    oi.product_id,
                    oi.product_name,
                    COALESCE(SUM(oi.quantity), 0) as total_quantity_sold,
                    COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue,
                    COUNT(DISTINCT s.order_id) as times_ordered
                 FROM sales s
                 JOIN order_items oi ON s.order_id = oi.order_id
                 WHERE s.sales_date BETWEEN ? AND ?
                 GROUP BY oi.product_id, oi.product_name
                 ORDER BY total_quantity_sold DESC
                 LIMIT ?`,
                [startDate, endDate, limitNum]
            );
            return rows;
        } catch (error) {
            console.error('Error getting top selling products:', error);
            throw error;
        }
    }

    // Get sales statistics
    static async getSalesStatistics(startDate, endDate) {
        try {
            const [rows] = await pool.execute(
                `SELECT 
                    COUNT(DISTINCT order_id) as total_orders,
                    COALESCE(SUM(total_amount), 0) as total_revenue,
                    COALESCE(AVG(total_amount), 0) as average_order_value,
                    COUNT(DISTINCT user_id) as unique_customers,
                    COALESCE(SUM(product_count), 0) as total_products_sold,
                    COALESCE(MIN(total_amount), 0) as smallest_order,
                    COALESCE(MAX(total_amount), 0) as largest_order
                 FROM sales 
                 WHERE sales_date BETWEEN ? AND ?`,
                [startDate, endDate]
            );
            return rows[0];
        } catch (error) {
            console.error('Error getting sales statistics:', error);
            throw error;
        }
    }

    // Helper function to get week number
    static getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

 

    static async searchSales(query, limit = 50) {
    try {
        const searchTerm = `%${query}%`;
        const limitNum = parseInt(limit) || 50;

        const [rows] = await pool.query(
            `SELECT s.*, u.name as customer_name, u.email as customer_email, u.phone_number as customer_phone
             FROM sales s
             LEFT JOIN users u ON s.user_id = u.id
             WHERE s.order_id LIKE ? 
                OR u.name LIKE ? 
                OR u.email LIKE ?
                OR u.phone_number LIKE ?
                OR s.payment_method LIKE ?
             ORDER BY s.sales_date DESC
             LIMIT ${limitNum}`,
            [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
        );

        return rows;
    } catch (error) {
        console.error('Error searching sales:', error);
        throw error;
    }
}

static async getAllSales(limit = 100, offset = 0) {
    try {
        const queryLimit = parseInt(limit) || 100;
        const queryOffset = parseInt(offset) || 0;
        
        
        const [rows] = await pool.query(
            `SELECT 
                s.*, 
                u.name as user_name,
                u.email as user_email,
                COALESCE((
                    SELECT COUNT(*) 
                    FROM sale_items si 
                    WHERE si.sale_id = s.id
                ), 0) as item_count,
                COALESCE((
                    SELECT SUM(quantity) 
                    FROM sale_items si 
                    WHERE si.sale_id = s.id
                ), 0) as total_quantity
            FROM sales s
            LEFT JOIN users u ON s.user_id = u.id
            ORDER BY s.sales_date DESC
            LIMIT ${queryLimit} OFFSET ${queryOffset}`
        );
        
        // Get items for each sale
        for (let sale of rows) {
            try {
                const [items] = await pool.query(
                    `SELECT 
                        si.*,
                        p.name as product_name,
                        p.cost as product_cost
                    FROM sale_items si
                    LEFT JOIN products p ON si.product_id = p.id
                    WHERE si.sale_id = ?`,
                    [sale.id]
                );
                sale.items = items;
                
                // Ensure item_count and total_quantity are numbers
                sale.item_count = Number(sale.item_count || items.length);
                sale.total_quantity = Number(sale.total_quantity || 0);
                
                // Calculate product_count if it's not set correctly
                if (!sale.product_count || sale.product_count === 0) {
                    sale.product_count = sale.total_quantity || items.reduce((sum, item) => sum + item.quantity, 0);
                }
                
                // Calculate profit: sum of (unit_price - product_cost) * quantity for all items
                let profit = 0;
                items.forEach(item => {
                    const cost = parseFloat(item.product_cost || 0);
                    const price = parseFloat(item.unit_price || 0);
                    const qty = parseFloat(item.quantity || 0);
                    profit += (price - cost) * qty;
                });
                sale.profit = profit;
            } catch (itemError) {
                console.error(`Error fetching items for sale ${sale.id}:`, itemError);
                sale.items = [];
                sale.item_count = 0;
                sale.total_quantity = 0;
                sale.product_count = 0;
                sale.profit = 0;
            }
        }
        
        return rows;
    } catch (error) {
        console.error('Error getting all sales:', error);
        throw error;
    }
}

    // Get sales count
    static async getSalesCount() {
        try {
            const [rows] = await pool.execute(
                'SELECT COUNT(*) as count FROM sales'
            );
            return rows[0].count;
        } catch (error) {
            console.error('Error getting sales count:', error);
            throw error;
        }
    }

    // Get total revenue
    static async getTotalRevenue() {
        try {
            const [rows] = await pool.execute(
                'SELECT COALESCE(SUM(total_amount), 0) as total FROM sales'
            );
            return rows[0].total;
        } catch (error) {
            console.error('Error getting total revenue:', error);
            throw error;
        }
    }

    // Get sales by payment method
    static async getSalesByPaymentMethod(startDate, endDate) {
        try {
            const [rows] = await pool.execute(
                `SELECT 
                    payment_method,
                    COUNT(*) as total_orders,
                    COALESCE(SUM(total_amount), 0) as total_revenue
                 FROM sales 
                 WHERE sales_date BETWEEN ? AND ?
                 GROUP BY payment_method`,
                [startDate, endDate]
            );
            return rows;
        } catch (error) {
            console.error('Error getting sales by payment method:', error);
            throw error;
        }
    }

    // Get daily sales trend
    static async getDailySalesTrend(days = 30) {
        try {
            const daysNum = parseInt(days) || 30;
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            const [rows] = await pool.execute(
                `SELECT 
                    sales_date,
                    COUNT(*) as order_count,
                    COALESCE(SUM(total_amount), 0) as revenue
                 FROM sales 
                 WHERE sales_date BETWEEN ? AND ?
                 GROUP BY sales_date
                 ORDER BY sales_date ASC`,
                [startDate, endDate]
            );
            return rows;
        } catch (error) {
            console.error('Error getting daily sales trend:', error);
            throw error;
        }
    }
}

module.exports = Sales;