// ==================== CALENDAR HELPER FUNCTIONS ====================

function getCalendarMonthStart() {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getCalendarWeekStart() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);

    const day = now.getDay(); // 0=Sun
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const d = new Date(now.getFullYear(), now.getMonth(), diff);
    d.setHours(0, 0, 0, 0);

    // If week start falls in previous month, use month start instead
    if (d < monthStart) {
        return monthStart;
    }

    return d;
}

function getCalendarTodayStart() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

// Global variables
let currentPage = 1;
const itemsPerPage = 10;
let expensesData = [];
let deleteId = null;
let searchTimeout = null;

// Show expense modal
function showExpenseModal() {
    document.getElementById("expenseModal").style.display = "block";
    // Set default date to now
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById("expenseDate").value = `${year}-${month}-${day}T${hours}:${minutes}`;
}

function closeExpenseModal() {
    document.getElementById("expenseModal").style.display = "none";
    document.getElementById("expenseForm").reset();
}

function closeEditModal() {
    document.getElementById("editExpenseModal").style.display = "none";
}

function closeDeleteModal() {
    document.getElementById("deleteModal").style.display = "none";
    deleteId = null;
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast-notification show ${type}`;
    setTimeout(() => {
        toast.className = 'toast-notification';
    }, 3000);
}

// Debounce search
function debounceLoadExpenses() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadExpenses();
    }, 500);
}

// Reset filters
function resetFilters() {
    document.getElementById('expenseSearch').value = '';
    document.getElementById('expenseFilter').value = 'all';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('paymentFilter').value = '';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    currentPage = 1;
    loadExpenses();
}

// Add expense form submit
document.getElementById("expenseForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const expense = {
        description: document.getElementById("expenseDescription").value,
        category: document.getElementById("expenseCategory").value,
        amount: document.getElementById("expenseAmount").value,
        payment_method: document.getElementById("expensePayment").value,
        expense_date: document.getElementById("expenseDate").value,
        notes: document.getElementById("expenseNotes").value
    };

    await saveExpense(expense);
});

async function saveExpense(expense) {
    try {
        const response = await fetch("/api/expenses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(expense)
        });

        if (response.ok) {
            closeExpenseModal();
            loadExpenses();
            showToast(' Expense added successfully!', 'success');
        } else {
            showToast(' Error adding expense', 'error');
        }
    } catch (error) {
        showToast(' Error adding expense', 'error');
    }
}

// Edit expense
function editExpense(id) {
    const expense = expensesData.find(e => e.id === id);
    if (!expense) return;

    document.getElementById('editExpenseId').value = expense.id;
    document.getElementById('editExpenseDescription').value = expense.description;
    document.getElementById('editExpenseCategory').value = expense.category;
    document.getElementById('editExpenseAmount').value = expense.amount;
    document.getElementById('editExpensePayment').value = expense.payment_method;
    
    document.getElementById('editExpenseModal').style.display = 'block';
}

document.getElementById("editExpenseForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById('editExpenseId').value;
    const expense = {
        description: document.getElementById("editExpenseDescription").value,
        category: document.getElementById("editExpenseCategory").value,
        amount: document.getElementById("editExpenseAmount").value,
        payment_method: document.getElementById("editExpensePayment").value
    };

    try {
        const response = await fetch(`/api/expenses/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(expense)
        });

        if (response.ok) {
            closeEditModal();
            loadExpenses();
            showToast('✅ Expense updated successfully!', 'success');
        }
    } catch (error) {
        showToast('❌ Error updating expense', 'error');
    }
});

// Delete expense confirmation
function confirmDelete(id) {
    deleteId = id;
    document.getElementById('deleteModal').style.display = 'block';
}

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (!deleteId) return;

    try {
        const response = await fetch(`/api/expenses/${deleteId}`, { 
            method: "DELETE" 
        });
        
        if (response.ok) {
            loadExpenses();
            closeDeleteModal();
            showToast(' Expense deleted successfully!', 'success');
        }
    } catch (error) {
        showToast(' Error deleting expense', 'error');
    }
});



// Update your loadExpenses function to handle errors properly
async function loadExpenses() {
    const filter = document.getElementById("expenseFilter").value;
    const search = document.getElementById("expenseSearch").value;
    const category = document.getElementById("categoryFilter")?.value || '';
    const payment = document.getElementById("paymentFilter")?.value || '';
    const dateFrom = document.getElementById("dateFrom")?.value || '';
    const dateTo = document.getElementById("dateTo")?.value || '';

    let url = `/api/expenses?filter=${filter}&search=${search}&category=${category}&payment=${payment}`;
    
    if (dateFrom) url += `&dateFrom=${dateFrom}`;
    if (dateTo) url += `&dateTo=${dateTo}`;

    try {
        const res = await fetch(url);
        
        // Check if response is ok
        if (!res.ok) {
            const errorData = await res.json();
            console.error("Server error:", errorData);
            showToast('Error loading expenses: ' + (errorData.error || 'Server error'), 'error');
            return;
        }
        
        const data = await res.json();

        // Check if data is an array
        if (!Array.isArray(data)) {
            console.error("Expenses not array:", data);
            // If it's an error object, show error message
            if (data.error) {
                showToast('Error: ' + data.error, 'error');
            } else {
                showToast('Invalid data format received', 'error');
            }
            // Set empty array to prevent further errors
            expensesData = [];
        } else {
            expensesData = data;
        }

        displayExpenses(expensesData);
        updateAllStats(expensesData);
        updatePagination(expensesData.length);
    } catch (error) {
        console.error('Error loading expenses:', error);
        showToast(' Error loading expenses', 'error');
        // Set empty array to prevent further errors
        expensesData = [];
        displayExpenses([]);
        updateAllStats([]);
        updatePagination(0);
    }
}

// Display expenses in table
function displayExpenses(expenses) {
    const tbody = document.getElementById("expensesList");
    const noDataMessage = document.getElementById("noDataMessage");
    
    if (expenses.length === 0) {
        tbody.innerHTML = "";
        noDataMessage.style.display = 'block';
        return;
    }

    noDataMessage.style.display = 'none';
    tbody.innerHTML = "";

    // Pagination
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedExpenses = expenses.slice(start, end);

    paginatedExpenses.forEach(exp => {
        const categoryEmoji = {
            'rent': '',
            // 'stock': '',
            'transport': '',
            'utilities': '',
            // 'salary': '',
            'other': ''
        };

        const paymentEmoji = {
            'cash': '',
            'mpesa': '',
            // 'bank': ''
        };

        tbody.innerHTML += `
            <tr>
                <td>
                    <strong>${exp.description}</strong>
                    ${exp.notes ? `<br><small class="notes">📝 ${exp.notes}</small>` : ''}
                </td>
                <td><span class="category-badge"> ${exp.category}</span></td>
                <td><span class="amount">KSH ${Number(exp.amount).toLocaleString()}</span></td>
                <td><span class="payment-badge"> ${exp.payment_method}</span></td>
                <td>${new Date(exp.expense_date || exp.created_at).toLocaleString()}</td>
                <td class="actions">
                    <button class="btn-icon btn-edit" onclick="editExpense(${exp.id})" title="Edit">✏️</button>
                    <button class="btn-icon btn-delete" onclick="confirmDelete(${exp.id})" title="Delete">🗑️</button>
                </td>
            </tr>
        `;
    });
}

// Update all statistics
function updateAllStats(expenses) {
    // Basic totals
    const totals = {
        all: 0,
        day: 0,
        week: 0,
        month: 0,
        cash: 0,
        mpesa: 0
        // bank: 0
    };

    const counts = {
        day: 0,
        week: 0,
        month: 0,
        all: expenses.length
    };

    // Use calendar-based periods
    const todayStart = getCalendarTodayStart();
    const weekStart = getCalendarWeekStart();
    const monthStart = getCalendarMonthStart();

    // Category tracking
    const categoryTotals = {};
    const paymentTotals = {};

    expenses.forEach(exp => {
        const amount = Number(exp.amount);
        const category = exp.category;
        const payment = exp.payment_method;
        
        // Totals by payment method
        if (payment === 'cash') totals.cash += amount;
        if (payment === 'mpesa') totals.mpesa += amount;
        // if (payment === 'bank') totals.bank += amount;
        
        // Category totals
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
        
        // Payment totals for most used
        paymentTotals[payment] = (paymentTotals[payment] || 0) + 1;

        totals.all += amount;

        const expDate = new Date(exp.expense_date || exp.created_at);
        expDate.setHours(0, 0, 0, 0); // Normalize to start of day
        
        if (expDate >= todayStart) {
            totals.day += amount;
            counts.day++;
        }
        if (expDate >= weekStart) {
            totals.week += amount;
            counts.week++;
        }
        if (expDate >= monthStart) {
            totals.month += amount;
            counts.month++;
        }
    });

    // Update display
    document.getElementById("totalExpenses").innerText = "KSH " + totals.all.toLocaleString();
    document.getElementById("todayExpenses").innerText = "KSH " + totals.day.toLocaleString();
    document.getElementById("weekExpenses").innerText = "KSH " + totals.week.toLocaleString();
    document.getElementById("monthExpenses").innerText = "KSH " + totals.month.toLocaleString();
    
    document.getElementById("todayCount").innerText = counts.day + " expenses";
    document.getElementById("weekCount").innerText = counts.week + " expenses";
    document.getElementById("monthCount").innerText = counts.month + " expenses";
    
    // Summary cards
    document.getElementById("totalTransactions").innerText = expenses.length;
    document.getElementById("avgExpense").innerText = "KSH " + (expenses.length ? (totals.all / expenses.length).toFixed(0).toLocaleString() : "0");
    
    const maxExpense = expenses.length ? Math.max(...expenses.map(e => Number(e.amount))) : 0;
    document.getElementById("maxExpense").innerText = "KSH " + maxExpense.toLocaleString();
    
    // Most used category
    let topCategory = { name: '-', count: 0 };
    for (const [cat, total] of Object.entries(categoryTotals)) {
        if (total > topCategory.count) {
            topCategory = { name: cat, count: total };
        }
    }
    document.getElementById("topCategory").innerText = topCategory.name !== '-' ? topCategory.name : '-';
    
    // Most used payment
    let topPayment = { name: '-', count: 0 };
    for (const [pay, count] of Object.entries(paymentTotals)) {
        if (count > topPayment.count) {
            topPayment = { name: pay, count: count };
        }
    }
    document.getElementById("topPayment").innerText = topPayment.name !== '-' ? topPayment.name : '-';
    
    // Payment totals
    document.getElementById("cashTotal").innerText = "KSH " + totals.cash.toLocaleString();
    document.getElementById("mpesaTotal").innerText = "KSH " + totals.mpesa.toLocaleString();
    // document.getElementById("bankTotal").innerText = "KSH " + totals.bank.toLocaleString();
    
    // Category breakdown
    displayCategoryBreakdown(categoryTotals, totals.all);
}

// Display category breakdown
function displayCategoryBreakdown(categoryTotals, totalAmount) {
    const categoryList = document.getElementById('categoryList');
    categoryList.innerHTML = '';
    
    const categories = [
        { key: 'rent', name: 'Rent'},
        // { key: 'stock', name: 'Stock' },
        { key: 'transport', name: 'Transport' },
        { key: 'utilities', name: 'Utilities' },
        // { key: 'salary', name: 'Salary'},
        { key: 'other', name: 'Other' }
    ];
    
    categories.forEach(cat => {
        const amount = categoryTotals[cat.key] || 0;
        const percentage = totalAmount ? ((amount / totalAmount) * 100).toFixed(1) : 0;
        
        const div = document.createElement('div');
        div.className = 'category-item';
        div.innerHTML = `
            <div class="category-header">
                <span class="category-name">${cat.name}</span>
                <span class="category-amount">KSH ${amount.toLocaleString()}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
            <span class="category-percent">${percentage}%</span>
        `;
        categoryList.appendChild(div);
    });
}

// Pagination functions
function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    document.getElementById('pageInfo').innerText = `Page ${currentPage} of ${Math.max(1, totalPages)}`;
    
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage >= totalPages;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadExpenses();
    }
}

function nextPage() {
    const totalPages = Math.ceil(expensesData.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        loadExpenses();
    }
}

// Export to CSV
function exportToCSV() {
    if (expensesData.length === 0) {
        showToast(' No data to export', 'warning');
        return;
    }

    const headers = ['Description', 'Category', 'Amount (KSH)', 'Payment Method', 'Date', 'Notes'];
    const csvData = expensesData.map(exp => [
        exp.description,
        exp.category,
        exp.amount,
        exp.payment_method,
        new Date(exp.expense_date || exp.created_at).toLocaleString(),
        exp.notes || ''
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast('📥 Export started!', 'success');
}

// Print report
function printReport() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Expense Report</title>
                <style>
                    body { font-family: Arial; padding: 20px; }
                    h1 { color: #333; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #f4f4f4; padding: 10px; text-align: left; }
                    td { padding: 10px; border-bottom: 1px solid #ddd; }
                    .total { font-weight: bold; margin-top: 20px; }
                </style>
            </head>
            <body>
                <h1>Expense Report - ${new Date().toLocaleDateString()}</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Payment</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expensesData.map(exp => `
                            <tr>
                                <td>${exp.description}</td>
                                <td>${exp.category}</td>
                                <td>KSH ${exp.amount}</td>
                                <td>${exp.payment_method}</td>
                                <td>${new Date(exp.expense_date || exp.created_at).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="total">Total Expenses: KSH ${expensesData.reduce((sum, exp) => sum + Number(exp.amount), 0).toLocaleString()}</div>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
    loadExpenses();
    
    // Close modals when clicking outside
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            closeExpenseModal();
            closeEditModal();
            closeDeleteModal();
        }
    }
});