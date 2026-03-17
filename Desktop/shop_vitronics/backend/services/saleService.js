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

    const sales_date = date.toISOString().split('T')[0];
    const sales_year = date.getFullYear();
    const sales_month = date.getMonth() + 1;
    const sales_day = date.getDate();

    const sales_week = Math.ceil(
        (((date - new Date(sales_year, 0, 1)) / 86400000) +
            new Date(sales_year, 0, 1).getDay() + 1) / 7
    );

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
