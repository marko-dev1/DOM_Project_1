

// // services/expenseServices.js
// const model = require('../models/expense');

// exports.createExpense = async (data) => {
//     return model.createExpense(data);
// };

// exports.getExpenses = async (filters) => {
//     let conditions = [];
//     let params = [];

//     // Base query
//     let query = "SELECT * FROM expenses WHERE 1=1";

//     // Filter by time period
//     if (filters.filter === "day") {
//         query += " AND DATE(created_at) = CURDATE()";
//     } else if (filters.filter === "week") {
//         query += " AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)";
//     } else if (filters.filter === "month") {
//         query += " AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())";
//     }

//     // Search by description
//     if (filters.search) {
//         query += " AND (description LIKE ? OR category LIKE ?)";
//         const searchTerm = `%${filters.search}%`;
//         params.push(searchTerm, searchTerm);
//     }

//     // Filter by category
//     if (filters.category) {
//         query += " AND category = ?";
//         params.push(filters.category);
//     }

//     // Filter by payment method
//     if (filters.payment) {
//         query += " AND payment_method = ?";
//         params.push(filters.payment);
//     }

//     // Date range filter
//     if (filters.dateFrom) {
//         query += " AND DATE(created_at) >= ?";
//         params.push(filters.dateFrom);
//     }
//     if (filters.dateTo) {
//         query += " AND DATE(created_at) <= ?";
//         params.push(filters.dateTo);
//     }

//     query += " ORDER BY created_at DESC";

//     return model.getExpenses(query, params);
// };

// exports.updateExpense = async (id, data) => {
//     return model.updateExpense(id, data);
// };

// exports.deleteExpense = async (id) => {
//     return model.deleteExpense(id);
// };



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

    // Filter by time period
    if (filters.filter === "day") {
        query += " AND DATE(created_at) = CURDATE()";
    } else if (filters.filter === "week") {
        query += " AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)";
    } else if (filters.filter === "month") {
        query += " AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())";
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