const Sales = require('../models/Sales');
const db = require('../config/database');

exports.getRevenueSummary = async (req, res) => {
    try {
        // Use UTC dates to ensure consistency between local and live server
        const now = new Date();
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const todayStr = today.toISOString().split('T')[0];

        const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (now.getUTCDay() || 7) + 1)); // Monday start
        
        // If week start falls in previous month, use month start instead
        // This ensures weekly data resets when new month begins mid-week
        const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        if (weekStart < monthStart) {
            weekStart.setTime(monthStart.getTime());
        }
        
        const weekStartStr = weekStart.toISOString().split('T')[0];

        const monthStartStr = monthStart.toISOString().split('T')[0];
        const allTimeStart = '2000-01-01';

        // Get sales statistics
        const dailySales = await Sales.getSalesStatistics(todayStr, todayStr);
        const weeklySales = await Sales.getSalesStatistics(weekStartStr, todayStr);
        const monthlySales = await Sales.getSalesStatistics(monthStartStr, todayStr);
        const allTimeSales = await Sales.getSalesStatistics(allTimeStart, todayStr);

        // Get expenses
        const [dailyExpRows] = await db.pool.execute(
            'SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE DATE(created_at) BETWEEN ? AND ?',
            [todayStr, todayStr]
        );
        const [weeklyExpRows] = await db.pool.execute(
            'SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE DATE(created_at) BETWEEN ? AND ?',
            [weekStartStr, todayStr]
        );
        const [monthlyExpRows] = await db.pool.execute(
            'SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE DATE(created_at) BETWEEN ? AND ?',
            [monthStartStr, todayStr]
        );
        const [allTimeExpRows] = await db.pool.execute(
            'SELECT COALESCE(SUM(amount),0) as total FROM expenses',
            []
        );

        // Get manual revenue
        const manualRevenueQuery = `
            SELECT COALESCE(SUM(amount),0) as total 
            FROM manual_revenue 
            WHERE DATE(created_at) BETWEEN ? AND ?
        `;

        const [[dailyManual]] = await db.pool.execute(manualRevenueQuery, [todayStr, todayStr]);
        const [[weeklyManual]] = await db.pool.execute(manualRevenueQuery, [weekStartStr, todayStr]);
        const [[monthlyManual]] = await db.pool.execute(manualRevenueQuery, [monthStartStr, todayStr]);
        const [[allTimeManual]] = await db.pool.execute(
            'SELECT COALESCE(SUM(amount),0) as total FROM manual_revenue'
        );

        // Get repairs/services revenue
        const servicesRevenueQuery = `
            SELECT COALESCE(SUM(amount),0) as total
            FROM repairs_services
            WHERE status = 'completed' AND DATE(completed_at) BETWEEN ? AND ?
        `;
        const [[dailyServices]] = await db.pool.execute(servicesRevenueQuery, [todayStr, todayStr]);
        const [[weeklyServices]] = await db.pool.execute(servicesRevenueQuery, [weekStartStr, todayStr]);
        const [[monthlyServices]] = await db.pool.execute(servicesRevenueQuery, [monthStartStr, todayStr]);
        const [[allTimeServices]] = await db.pool.execute(
            'SELECT COALESCE(SUM(amount),0) as total FROM repairs_services WHERE status = ?',
            ['completed']
        );

        // Calculate total revenue (sales + manual + services)
        const dailyRevenue = Number(dailySales?.total_revenue || 0) + Number(dailyManual?.total || 0) + Number(dailyServices?.total || 0);
        const weeklyRevenue = Number(weeklySales?.total_revenue || 0) + Number(weeklyManual?.total || 0) + Number(weeklyServices?.total || 0);
        const monthlyRevenue = Number(monthlySales?.total_revenue || 0) + Number(monthlyManual?.total || 0) + Number(monthlyServices?.total || 0);
        const allTimeRevenue = Number(allTimeSales?.total_revenue || 0) + Number(allTimeManual?.total || 0) + Number(allTimeServices?.total || 0);
        
        // Get expenses
        const dailyExpenses = Number(dailyExpRows[0]?.total || 0);
        const weeklyExpenses = Number(weeklyExpRows[0]?.total || 0);
        const monthlyExpenses = Number(monthlyExpRows[0]?.total || 0);
        const allTimeExpenses = Number(allTimeExpRows[0]?.total || 0);

        // Calculate product-level profit using sale_items and product cost
        const profitQuery = `
            SELECT COALESCE(SUM((si.unit_price - COALESCE(p.price,0)) * si.quantity), 0) as profit
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            LEFT JOIN products p ON si.product_id = p.id
            WHERE s.sales_date BETWEEN ? AND ?
        `;

        const [[dailyProfitRow]] = await db.pool.execute(profitQuery, [todayStr, todayStr]);
        const [[weeklyProfitRow]] = await db.pool.execute(profitQuery, [weekStartStr, todayStr]);
        const [[monthlyProfitRow]] = await db.pool.execute(profitQuery, [monthStartStr, todayStr]);
        const [[allTimeProfitRow]] = await db.pool.execute(profitQuery, [allTimeStart, todayStr]);

        const response = {
            success: true,
            data: {
                daily: {
                    revenue: dailyRevenue,
                    expenses: dailyExpenses,
                    profit: Number(dailyProfitRow?.profit || 0),
                    sales_count: Number(dailySales?.total_orders || 0),
                    services_revenue: Number(dailyServices?.total || 0)
                },
                weekly: {
                    revenue: weeklyRevenue,
                    expenses: weeklyExpenses,
                    profit: Number(weeklyProfitRow?.profit || 0),
                    sales_count: Number(weeklySales?.total_orders || 0),
                    services_revenue: Number(weeklyServices?.total || 0)
                },
                monthly: {
                    revenue: monthlyRevenue,
                    expenses: monthlyExpenses,
                    profit: Number(monthlyProfitRow?.profit || 0),
                    sales_count: Number(monthlySales?.total_orders || 0),
                    services_revenue: Number(monthlyServices?.total || 0)
                },
                allTime: {
                    revenue: allTimeRevenue,
                    expenses: allTimeExpenses,
                    profit: Number(allTimeProfitRow?.profit || 0),
                    sales_count: Number(allTimeSales?.total_orders || 0),
                    services_revenue: Number(allTimeServices?.total || 0)
                }
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching revenue summary:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch revenue summary' });
    }
};

exports.getRevenueTrend = async (req, res) => {
    try {
        const groupBy = (req.query.groupBy || 'day').toLowerCase();

        if (groupBy === 'month') {
            const months = Math.max(1, parseInt(req.query.months, 10) || 6);
            const now = new Date();
            const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            const startDate = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth() - (months - 1), 1));
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            const [salesRows] = await db.pool.execute(
                `SELECT DATE_FORMAT(s.sales_date, '%Y-%m') as month_key,
                        COALESCE(SUM(s.total_amount), 0) as total
                 FROM sales s
                 WHERE s.sales_date BETWEEN ? AND ?
                 GROUP BY DATE_FORMAT(s.sales_date, '%Y-%m')
                 ORDER BY month_key ASC`,
                [startStr, endStr]
            );

            const [manualRevenueRows] = await db.pool.execute(
                `SELECT DATE_FORMAT(created_at, '%Y-%m') as month_key,
                        COALESCE(SUM(amount), 0) as total
                 FROM manual_revenue
                 WHERE DATE(created_at) BETWEEN ? AND ?
                 GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                 ORDER BY month_key ASC`,
                [startStr, endStr]
            );

            const [servicesRevenueRows] = await db.pool.execute(
                `SELECT DATE_FORMAT(completed_at, '%Y-%m') as month_key,
                        COALESCE(SUM(amount), 0) as total
                 FROM repairs_services
                 WHERE status = 'completed' AND DATE(completed_at) BETWEEN ? AND ?
                 GROUP BY DATE_FORMAT(completed_at, '%Y-%m')
                 ORDER BY month_key ASC`,
                [startStr, endStr]
            );

            const [expenseRows] = await db.pool.execute(
                `SELECT DATE_FORMAT(created_at, '%Y-%m') as month_key,
                        COALESCE(SUM(amount), 0) as total
                 FROM expenses
                 WHERE DATE(created_at) BETWEEN ? AND ?
                 GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                 ORDER BY month_key ASC`,
                [startStr, endStr]
            );

            const [profitRows] = await db.pool.execute(
                `SELECT DATE_FORMAT(s.sales_date, '%Y-%m') as month_key,
                        COALESCE(SUM((si.unit_price - COALESCE(p.cost,0)) * si.quantity), 0) as profit
                 FROM sale_items si
                 JOIN sales s ON si.sale_id = s.id
                 LEFT JOIN products p ON si.product_id = p.id
                 WHERE s.sales_date BETWEEN ? AND ?
                 GROUP BY DATE_FORMAT(s.sales_date, '%Y-%m')
                 ORDER BY month_key ASC`,
                [startStr, endStr]
            );

            const salesMap = {};
            (salesRows || []).forEach(r => { salesMap[r.month_key] = Number(r.total || 0); });

            const manualMap = {};
            (manualRevenueRows || []).forEach(r => { manualMap[r.month_key] = Number(r.total || 0); });

            const servicesMap = {};
            (servicesRevenueRows || []).forEach(r => { servicesMap[r.month_key] = Number(r.total || 0); });

            const expenseMap = {};
            (expenseRows || []).forEach(r => { expenseMap[r.month_key] = Number(r.total || 0); });

            const profitMap = {};
            (profitRows || []).forEach(r => { profitMap[r.month_key] = Number(r.profit || 0); });

            const labels = [];
            const revenues = [];
            const expenses = [];
            const profits = [];
            const netProfits = [];

            for (let i = 0; i < months; i++) {
                const current = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
                const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
                const label = current.toLocaleString('en-US', { month: 'short', year: 'numeric' });

                const revenueTotal =
                    (salesMap[monthKey] || 0) +
                    (manualMap[monthKey] || 0) +
                    (servicesMap[monthKey] || 0);
                const expenseTotal = expenseMap[monthKey] || 0;
                const grossProfit = profitMap[monthKey] || 0;
                const netProfit = grossProfit - expenseTotal;

                labels.push(label);
                revenues.push(revenueTotal);
                expenses.push(expenseTotal);
                profits.push(grossProfit);
                netProfits.push(netProfit);
            }

            return res.json({
                success: true,
                data: { labels, revenues, expenses, profits, netProfits, groupBy: 'month' }
            });
        }

        const days = parseInt(req.query.days) || 7;
        const endDate = new Date();
        const startDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        const salesRows = await Sales.getDailySales(startStr, endStr);

        const [expenseRows] = await db.pool.execute(
            `SELECT DATE(created_at) as date, COALESCE(SUM(amount),0) as total
             FROM expenses
             WHERE DATE(created_at) BETWEEN ? AND ?
             GROUP BY DATE(created_at)
             ORDER BY DATE(created_at) ASC`,
            [startStr, endStr]
        );

        // Get manual revenue for trend
        const [manualRevenueRows] = await db.pool.execute(
            `SELECT DATE(created_at) as date, COALESCE(SUM(amount),0) as total
             FROM manual_revenue
             WHERE DATE(created_at) BETWEEN ? AND ?
             GROUP BY DATE(created_at)
             ORDER BY DATE(created_at) ASC`,
            [startStr, endStr]
        );

        // Build maps for easy lookup
        const salesMap = {};
        (salesRows || []).forEach(r => { salesMap[r.sales_date] = Number(r.total_sales || 0); });
        
        const expMap = {};
        (expenseRows || []).forEach(r => { expMap[r.date] = Number(r.total || 0); });
        
        const manualMap = {};
        (manualRevenueRows || []).forEach(r => { manualMap[r.date] = Number(r.total || 0); });

        const labels = [];
        const revenues = [];
        const expenses = [];
        const profits = [];

        // Get daily profit per day using sale_items and product cost
        const [profitRows] = await db.pool.execute(
            `SELECT s.sales_date as date, COALESCE(SUM((si.unit_price - COALESCE(p.cost,0)) * si.quantity), 0) as profit
             FROM sale_items si
             JOIN sales s ON si.sale_id = s.id
             LEFT JOIN products p ON si.product_id = p.id
             WHERE s.sales_date BETWEEN ? AND ?
             GROUP BY s.sales_date
             ORDER BY s.sales_date ASC`,
            [startStr, endStr]
        );

        const profitMap = {};
        (profitRows || []).forEach(r => { profitMap[r.date] = Number(r.profit || 0); });

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const key = d.toISOString().split('T')[0];
            labels.push(key);
            
            // Calculate total revenue (sales + manual revenue)
            const dailySalesAmount = salesMap[key] || 0;
            const dailyManualAmount = manualMap[key] || 0;
            revenues.push(dailySalesAmount + dailyManualAmount);
            
            expenses.push(expMap[key] || 0);
            profits.push(profitMap[key] || 0);
        }

        res.json({ success: true, data: { labels, revenues, expenses, profits, groupBy: 'day' } });
    } catch (error) {
        console.error('Error fetching revenue trend:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch revenue trend' });
    }
};

exports.createManualRevenue = async (req, res) => {
    try {
        const { description, amount, payment_method, category, date, customer_name, notes } = req.body;

        // Validate required fields
        if (!description || !amount || !payment_method) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: description, amount, payment_method"
            });
        }

        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: "Amount must be a positive number"
            });
        }

        // Get the current timestamp or use provided date
        const revenueDate = date ? new Date(date) : new Date();

        // Extract year, month, week, day for grouping
        const year = revenueDate.getFullYear();
        const month = revenueDate.getMonth() + 1;
        
        // Calculate week of month (1-5)
        const firstDayOfMonth = new Date(year, revenueDate.getMonth(), 1);
        const week = Math.ceil((revenueDate.getDate() + firstDayOfMonth.getDay()) / 7);
        
        const day = revenueDate.getDate();

        // Insert manual revenue entry
        const query = `
            INSERT INTO manual_revenue 
            (description, amount, payment_method, category, created_at, year, month, week, day, customer_name, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.pool.execute(query, [
            description,
            parseFloat(amount),
            payment_method,
            category || 'other',
            revenueDate,
            year,
            month,
            week,
            day,
            customer_name || null,
            notes || null
        ]);

        res.json({
            success: true,
            message: "Manual revenue entry created successfully",
            data: {
                id: result.insertId,
                description,
                amount: parseFloat(amount),
                payment_method,
                category: category || 'other',
                date: revenueDate,
                customer_name: customer_name || null,
                notes: notes || null
            }
        });

    } catch (error) {
        console.error('Error creating manual revenue:', error);
        
        // Check if table doesn't exist and provide helpful message
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(500).json({
                success: false,
                error: 'Revenue table not initialized. Please run database migrations first.'
            });
        }

        // Handle duplicate entry or other constraint violations
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                error: 'Duplicate entry detected'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to create revenue entry: ' + error.message
        });
    }
};

// Optional: Add function to get manual revenue list
exports.getManualRevenue = async (req, res) => {
    try {
        const { startDate, endDate, category, payment_method } = req.query;
        
        let query = 'SELECT * FROM manual_revenue WHERE 1=1';
        const params = [];

        if (startDate && endDate) {
            query += ' AND DATE(created_at) BETWEEN ? AND ?';
            params.push(startDate, endDate);
        } else if (startDate) {
            query += ' AND DATE(created_at) >= ?';
            params.push(startDate);
        } else if (endDate) {
            query += ' AND DATE(created_at) <= ?';
            params.push(endDate);
        }

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        if (payment_method) {
            query += ' AND payment_method = ?';
            params.push(payment_method);
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await db.pool.execute(query, params);

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error('Error fetching manual revenue:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch manual revenue entries'
        });
    }
};

// Create repairs and services revenue entry
exports.createRepairsServices = async (req, res) => {
    try {
        const { service_type, description, customer_name, customer_phone, customer_email, amount, payment_method, product_category, technician_name, notes, date } = req.body;

        // Validate required fields
        if (!service_type || !description || !customer_name || !amount || !payment_method) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: service_type, description, customer_name, amount, payment_method"
            });
        }

        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: "Amount must be a positive number"
            });
        }

        // Get the current timestamp or use provided date
        const servicesDate = date ? new Date(date) : new Date();
        const completedDate = new Date();

        // Extract year, month, week, day for grouping
        const year = servicesDate.getFullYear();
        const month = servicesDate.getMonth() + 1;
        const firstDayOfMonth = new Date(year, servicesDate.getMonth(), 1);
        const week = Math.ceil((servicesDate.getDate() + firstDayOfMonth.getDay()) / 7);
        const day = servicesDate.getDate();

        const connection = await db.pool.getConnection();

        try {
            // Insert repairs and services entry
            const query = `
                INSERT INTO repairs_services 
                (service_type, description, customer_name, customer_phone, customer_email, amount, payment_method, product_category, technician_name, notes, created_at, completed_at, year, month, week, day, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await connection.execute(query, [
                service_type,
                description,
                customer_name,
                customer_phone || null,
                customer_email || null,
                parseFloat(amount),
                payment_method,
                product_category || null,
                technician_name || null,
                notes || null,
                servicesDate,
                completedDate,
                year,
                month,
                week,
                day,
                'completed'
            ]);

            res.json({
                success: true,
                message: "Repairs and services entry created successfully",
                data: {
                    id: result.insertId,
                    service_type,
                    description,
                    customer_name,
                    customer_phone: customer_phone || null,
                    customer_email: customer_email || null,
                    amount: parseFloat(amount),
                    payment_method,
                    product_category: product_category || null,
                    technician_name: technician_name || null,
                    notes: notes || null,
                    date: servicesDate
                }
            });
        } finally {
            if (connection) connection.release();
        }
    } catch (error) {
        console.error('Error creating repairs and services entry:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create repairs and services entry'
        });
    }
};

// Get repairs and services entries
exports.getRepairsServices = async (req, res) => {
    try {
        const { startDate, endDate, service_type, status, payment_method } = req.query;
        let query = 'SELECT * FROM repairs_services WHERE 1=1';
        const params = [];

        if (startDate) {
            query += ' AND DATE(created_at) >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND DATE(created_at) <= ?';
            params.push(endDate);
        }

        if (service_type) {
            query += ' AND service_type = ?';
            params.push(service_type);
        }

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        if (payment_method) {
            query += ' AND payment_method = ?';
            params.push(payment_method);
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await db.pool.execute(query, params);

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error('Error fetching repairs and services:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch repairs and services entries'
        });
    }
};

// Get repairs and services summary
exports.getRepairsServicesSummary = async (req, res) => {
    try {
        // Use UTC dates to ensure consistency between local and live server
        const now = new Date();
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const todayStr = today.toISOString().split('T')[0];

        // Calendar week start (Monday, UTC)
        const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (now.getUTCDay() || 7) + 1)); // Monday start
        
        // If week start falls in previous month, use month start instead
        // This ensures weekly data resets when new month begins mid-week
        const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        if (weekStart < monthStart) {
            weekStart.setTime(monthStart.getTime());
        }
        
        const weekStartStr = weekStart.toISOString().split('T')[0];

        const monthStartStr = monthStart.toISOString().split('T')[0];
        const allTimeStart = '2000-01-01';

        // Query for summary
        const summaryQuery = `
            SELECT 
                service_type,
                COUNT(*) as count,
                COALESCE(SUM(amount), 0) as total_amount
            FROM repairs_services
            WHERE status = 'completed' AND DATE(completed_at) BETWEEN ? AND ?
            GROUP BY service_type
        `;

        let [dailySummary] = await db.pool.execute(summaryQuery, [todayStr, todayStr]);
        let [weeklySummary] = await db.pool.execute(summaryQuery, [weekStartStr, todayStr]);
        let [monthlySummary] = await db.pool.execute(summaryQuery, [monthStartStr, todayStr]);
        let [allTimeSummary] = await db.pool.execute(summaryQuery, [allTimeStart, todayStr]);
        // convert string totals/counts to numbers
        const normalize = rows => rows.map(r => ({
            service_type: r.service_type,
            count: Number(r.count) || 0,
            total_amount: Number(r.total_amount) || 0
        }));
        dailySummary = normalize(dailySummary);
        weeklySummary = normalize(weeklySummary);
        monthlySummary = normalize(monthlySummary);
        allTimeSummary = normalize(allTimeSummary);

        // Get total counts and amounts
        const [dailyTotal] = await db.pool.execute(
            'SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM repairs_services WHERE status = ? AND DATE(completed_at) BETWEEN ? AND ?',
            ['completed', todayStr, todayStr]
        );
        const [weeklyTotal] = await db.pool.execute(
            'SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM repairs_services WHERE status = ? AND DATE(completed_at) BETWEEN ? AND ?',
            ['completed', weekStartStr, todayStr]
        );
        const [monthlyTotal] = await db.pool.execute(
            'SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM repairs_services WHERE status = ? AND DATE(completed_at) BETWEEN ? AND ?',
            ['completed', monthStartStr, todayStr]
        );
        const [allTimeTotal] = await db.pool.execute(
            'SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM repairs_services WHERE status = ?',
            ['completed']
        );

        res.json({
            success: true,
            data: {
                daily: {
                    count: dailyTotal[0]?.count || 0,
                    total: Number(dailyTotal[0]?.total || 0),
                    breakdown: dailySummary || []
                },
                weekly: {
                    count: weeklyTotal[0]?.count || 0,
                    total: Number(weeklyTotal[0]?.total || 0),
                    breakdown: weeklySummary || []
                },
                monthly: {
                    count: monthlyTotal[0]?.count || 0,
                    total: Number(monthlyTotal[0]?.total || 0),
                    breakdown: monthlySummary || []
                },
                allTime: {
                    count: allTimeTotal[0]?.count || 0,
                    total: Number(allTimeTotal[0]?.total || 0),
                    breakdown: allTimeSummary || []
                }
            }
        });

    } catch (error) {
        console.error('Error fetching repairs and services summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch repairs and services summary'
        });
    }
};
