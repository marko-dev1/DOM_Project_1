// services/saleService.js
const { pool } = require('../config/database');

const createSale = async ({
    order_id = null,
    user_id = null,
    total_amount,
    product_count = 0,
    payment_method,
    sale_type = 'manual'
}) => {
    const date = new Date();

    // Use UTC dates for consistency
    const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    
    const sales_date = utcDate.toISOString().split('T')[0];
    const sales_year = utcDate.getUTCFullYear();
    const sales_month = utcDate.getUTCMonth() + 1;
    const sales_day = utcDate.getUTCDate();

    // Calculate week number using UTC (Monday as start of week)
    const utcTime = utcDate.getTime();
    const yearStart = new Date(Date.UTC(sales_year, 0, 1));
    const yearStartDay = yearStart.getUTCDay() || 7; // Convert Sunday (0) to 7
    const daysSinceYearStart = Math.floor((utcTime - yearStart.getTime()) / (24 * 60 * 60 * 1000));
    const sales_week = Math.ceil((daysSinceYearStart + yearStartDay) / 7);

    const sales_quarter = Math.ceil(sales_month / 3);

    const [result] = await pool.execute(
        `INSERT INTO sales 
        (order_id, user_id, total_amount, sales_date, sales_year, sales_month,
         sales_week, sales_day, sales_quarter, product_count, payment_method, sale_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            order_id,
            user_id,
            total_amount,
            sales_date,
            sales_year,
            sales_month,
            sales_week,
            sales_day,
            sales_quarter,
            product_count,
            payment_method,
            sale_type
        ]
    );

    return result.insertId;
};

const getSales = async () => {
    const [rows] = await pool.execute(`
        SELECT s.*, u.username
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.id
        ORDER BY s.created_at DESC
    `);
    return rows;
};

const getSalesSummary = async () => {
    const [rows] = await pool.execute(`
        SELECT 
            sales_date,
            COUNT(*) as total_orders,
            SUM(total_amount) as total_sales
        FROM sales
        GROUP BY sales_date
        ORDER BY sales_date DESC
    `);
    return rows;
};

module.exports = {
    createSale,
    getSales,
    getSalesSummary
};
