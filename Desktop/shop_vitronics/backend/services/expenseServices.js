

// services/expenseServices.js
const model = require('../models/expense');

exports.createExpense = async (data) => {
    return model.createExpense(data);
};

exports.getExpenses = async (filters) => {
    let conditions = [];
    let params = [];

    // Base query
    let query = "SELECT * FROM expenses WHERE 1=1";

    // Filter by time period (using UTC dates for consistency)
    if (filters.filter === "day") {
        const today = new Date();
        const todayStr = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())).toISOString().split('T')[0];
        query += " AND DATE(created_at) = ?";
        params.push(todayStr);
    } else if (filters.filter === "week") {
        const now = new Date();
        const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay()));
        const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        if (weekStart < monthStart) {
            weekStart.setTime(monthStart.getTime());
        }
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const todayStr = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString().split('T')[0];
        query += " AND DATE(created_at) BETWEEN ? AND ?";
        params.push(weekStartStr, todayStr);
    } else if (filters.filter === "month") {
        const now = new Date();
        const monthStartStr = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().split('T')[0];
        const todayStr = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString().split('T')[0];
        query += " AND DATE(created_at) BETWEEN ? AND ?";
        params.push(monthStartStr, todayStr);
    }

    // Search by description
    if (filters.search) {
        query += " AND (description LIKE ? OR category LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
    }

    // Filter by category
    if (filters.category) {
        query += " AND category = ?";
        params.push(filters.category);
    }

    // Filter by payment method
    if (filters.payment) {
        query += " AND payment_method = ?";
        params.push(filters.payment);
    }

    // Date range filter
    if (filters.dateFrom) {
        query += " AND DATE(created_at) >= ?";
        params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
        query += " AND DATE(created_at) <= ?";
        params.push(filters.dateTo);
    }

    query += " ORDER BY created_at DESC";

    return model.getExpenses(query, params);
};

exports.updateExpense = async (id, data) => {
    return model.updateExpense(id, data);
};

exports.deleteExpense = async (id) => {
    return model.deleteExpense(id);
};

exports.getExpenseStats = async () => {
    return model.getExpenseStats();
};