

// controllers/expenseController.js
const service = require('../services/expenseServices');

exports.createExpense = async (req, res) => {
    try {
        // Validate input
        const { description, category, amount, payment_method, created_at} = req.body;
        
        if (!description || !category || !amount || !payment_method) {
            return res.status(400).json({ 
                error: "Missing required fields",
                required: ["description", "category", "amount", "payment_method", "created_at"]
            });
        }

        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: "Amount must be a positive number" });
        }

        const result = await service.createExpense(req.body);
        res.status(201).json({ 
            message: "Expense added successfully", 
            success: true,
            id: result.insertId 
        });
    } catch (error) {
        console.error("Error creating expense:", error);
        res.status(500).json({ error: error.message || "Failed to create expense" });
    }
};

exports.getExpenses = async (req, res) => {
    try {
        const filters = {
            filter: req.query.filter || "all",
            search: req.query.search || "",
            category: req.query.category || "",
            payment: req.query.payment || "",
            dateFrom: req.query.dateFrom || "",
            dateTo: req.query.dateTo || ""
        };

        const expenses = await service.getExpenses(filters);
        
        // Always return an array (empty if no results)
        res.json(expenses || []);
    } catch (error) {
        console.error("Error getting expenses:", error);
        // Return empty array instead of error object to prevent frontend issues
        res.status(200).json([]);
    }
};

exports.updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { description, category, amount, payment_method } = req.body;

        if (!description || !category || !amount || !payment_method) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: "Amount must be a positive number" });
        }

        const result = await service.updateExpense(id, req.body);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Expense not found" });
        }

        res.json({ message: "Expense updated successfully", success: true });
    } catch (error) {
        console.error("Error updating expense:", error);
        res.status(500).json({ error: error.message || "Failed to update expense" });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id || isNaN(id)) {
            return res.status(400).json({ error: "Invalid expense ID" });
        }

        const result = await service.deleteExpense(id);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Expense not found" });
        }

        res.json({ message: "Expense deleted successfully", success: true });
    } catch (error) {
        console.error("Error deleting expense:", error);
        res.status(500).json({ error: error.message || "Failed to delete expense" });
    }
};

exports.getExpenseStats = async (req, res) => {
    try {
        const stats = await service.getExpenseStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error("Error getting expense stats:", error);
        res.status(500).json({ 
            success: false, 
            data: { weekly: 0, monthly: 0, today: 0, allTime: 0 },
            error: error.message 
        });
    }
};