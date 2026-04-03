

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
    // Use UTC dates to match revenue controller calculations
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const todayStr = today.toISOString().split('T')[0];

    const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay()));
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    
    // If week start falls in previous month, use month start instead
    if (weekStart < monthStart) {
        weekStart.setTime(monthStart.getTime());
    }
    
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const query = `
        SELECT 
            COALESCE(SUM(CASE 
                WHEN DATE(created_at) = ? THEN amount ELSE 0 
            END), 0) as today,
            COALESCE(SUM(CASE 
                WHEN DATE(created_at) BETWEEN ? AND ? THEN amount ELSE 0 
            END), 0) as weekly,
            COALESCE(SUM(CASE 
                WHEN DATE(created_at) BETWEEN ? AND ? THEN amount ELSE 0 
            END), 0) as monthly,
            COALESCE(SUM(amount), 0) as allTime
        FROM expenses
    `;
    const [rows] = await db.pool.execute(query, [todayStr, weekStartStr, todayStr, monthStartStr, todayStr]);
    return rows[0] || { today: 0, weekly: 0, monthly: 0, allTime: 0 };
};
