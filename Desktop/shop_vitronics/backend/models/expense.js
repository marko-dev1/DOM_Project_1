

// models/expense.js
const db = require('../config/database');

exports.createExpense = async (expense) => {
    const [result] = await db.pool.execute(
        `INSERT INTO expenses 
        (description, category, amount, payment_method, created_at)
        VALUES (?, ?, ?, ?, ?)`,
        [expense.description, expense.category, expense.amount, 
         expense.payment_method, new Date()]
    );
    return result;
};

exports.getExpenses = async (query, params = []) => {
    const [rows] = await db.pool.execute(query, params);
    return rows;
};

exports.updateExpense = async (id, data) => {
    const [result] = await db.pool.execute(
        `UPDATE expenses 
         SET description = ?, category = ?, amount = ?, payment_method = ?
         WHERE id = ?`,
        [data.description, data.category, data.amount, data.payment_method, id]
    );
    return result;
};

// exports.deleteExpense = async (id) => {
//     await db.pool.execute("DELETE FROM expenses WHERE id = ?", [id]);
// };

exports.deleteExpense = async (id) => {
    const [result] = await db.pool.execute(
        "DELETE FROM expenses WHERE id = ?",
        [id]
    );
    return result;   // ✅ VERY IMPORTANT
};

exports.getExpenseStats = async () => {
    const query = `
        SELECT 
            COALESCE(SUM(CASE 
                WHEN DATE(created_at) = CURDATE() THEN amount ELSE 0 
            END), 0) as today,
            COALESCE(SUM(CASE 
                WHEN YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1) THEN amount ELSE 0 
            END), 0) as weekly,
            COALESCE(SUM(CASE 
                WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN amount ELSE 0 
            END), 0) as monthly,
            COALESCE(SUM(amount), 0) as allTime
        FROM expenses
    `;
    const [rows] = await db.pool.execute(query);
    return rows[0] || { today: 0, weekly: 0, monthly: 0, allTime: 0 };
};
