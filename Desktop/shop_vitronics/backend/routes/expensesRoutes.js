
// routes/expenseRoutes.js
const router = require("express").Router();
const controller = require("../controllers/expenseController");

router.post("/", controller.createExpense);
router.get("/", controller.getExpenses);
router.get("/stats/summary", controller.getExpenseStats);
router.put("/:id", controller.updateExpense);
router.delete("/:id", controller.deleteExpense);

module.exports = router;