

const { pool } = require('../config/database');

// ═══════════════════════════════════════════════════════════════════════
//  TABLE BOOTSTRAP  —  called once from database.js createTables()
// ═══════════════════════════════════════════════════════════════════════

const createStockPurchasesTable = async () => {
    const connection = await pool.getConnection();
    try {
        // stock_purchases table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS stock_purchases (
                id              INT AUTO_INCREMENT PRIMARY KEY,
                product_id      INT            NOT NULL,
                product_name    VARCHAR(255)   NOT NULL,
                category        VARCHAR(100)   DEFAULT '',
                supplier_name   VARCHAR(255)   DEFAULT '',
                supplier_phone  VARCHAR(50)    DEFAULT '',
                quantity        INT UNSIGNED   NOT NULL DEFAULT 0,
                unit_cost       DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
                total_cost      DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
                payment_method  VARCHAR(50)    DEFAULT 'Cash',
                status          ENUM('received','pending','returned') DEFAULT 'received',
                notes           TEXT,
                purchase_date   DATETIME       DEFAULT CURRENT_TIMESTAMP,
                created_by      INT            DEFAULT NULL,
                created_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
                updated_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_product_id    (product_id),
                INDEX idx_status        (status),
                INDEX idx_purchase_date (purchase_date),
                INDEX idx_created_at    (created_at),
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // Ensure products table has cost + restockLevel columns
        try {
            await connection.execute(`
                ALTER TABLE products
                    ADD COLUMN IF NOT EXISTS cost         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                    ADD COLUMN IF NOT EXISTS restockLevel INT           NOT NULL DEFAULT 5
            `);
        } catch (alterErr) {
            // MySQL < 8.0 doesn't support IF NOT EXISTS on ALTER TABLE
            if (!alterErr.message.includes('Duplicate column')) {
                console.warn('ALTER products (cost/restockLevel):', alterErr.message);
            }
        }

        console.log('✅ stock_purchases table ready');
    } finally {
        connection.release();
    }
};

// ═══════════════════════════════════════════════════════════════════════
//  READ
// ═══════════════════════════════════════════════════════════════════════

const getAllPurchases = async () => {
    const [rows] = await pool.execute(`
        SELECT
            sp.*,
            p.price        AS product_price,
            p.stock        AS current_stock,
            p.restockLevel AS restock_level
        FROM stock_purchases sp
        LEFT JOIN products p ON p.id = sp.product_id
        ORDER BY sp.purchase_date DESC, sp.created_at DESC
    `);
    return rows;
};

const getPurchaseById = async (id) => {
    const [rows] = await pool.execute(`
        SELECT sp.*, p.price AS product_price, p.stock AS current_stock
        FROM stock_purchases sp
        LEFT JOIN products p ON p.id = sp.product_id
        WHERE sp.id = ?
    `, [id]);
    return rows[0] || null;
};

const getPurchasesByProduct = async (productId) => {
    const [rows] = await pool.execute(
        `SELECT * FROM stock_purchases WHERE product_id = ? ORDER BY purchase_date DESC`,
        [productId]
    );
    return rows;
};

const getPurchaseSummary = async () => {
    const [rows] = await pool.execute(`
        SELECT
            COUNT(*)                                                            AS total_entries,
            COALESCE(SUM(quantity), 0)                                          AS total_units,
            COALESCE(SUM(total_cost), 0)                                        AS total_spend,
            COALESCE(SUM(CASE WHEN DATE(purchase_date) = CURDATE()
                              THEN total_cost ELSE 0 END), 0)                   AS today_spend,
            COALESCE(SUM(CASE WHEN YEARWEEK(purchase_date,1) = YEARWEEK(CURDATE(),1)
                              THEN total_cost ELSE 0 END), 0)                   AS week_spend,
            COALESCE(SUM(CASE WHEN YEAR(purchase_date)  = YEAR(CURDATE())
                           AND MONTH(purchase_date) = MONTH(CURDATE())
                              THEN total_cost ELSE 0 END), 0)                   AS month_spend
        FROM stock_purchases
        WHERE status = 'received'
    `);
    return rows[0];
};

// ═══════════════════════════════════════════════════════════════════════
//  CREATE  —  single DB transaction
//
//  Steps (all-or-nothing):
//    1. INSERT one row into stock_purchases
//    2. If status = 'received':  UPDATE products SET stock = stock + qty
//
//  We use  stock = stock + ?  (atomic increment) so there is no
//  read-then-write race condition.
// ═══════════════════════════════════════════════════════════════════════

const createPurchase = async (data, createdBy = null) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // ── Coerce types once — never trust raw strings from HTTP body ─────────
        const productId    = parseInt(data.product_id);
        const productName  = String(data.product_name || '').trim();
        const category     = String(data.category     || '');
        const supplierName = String(data.supplier_name  || '');
        const supplierPhone= String(data.supplier_phone || '');
        const qty          = parseInt(data.quantity);         // units purchased
        const unitCost     = parseFloat(data.unit_cost);      // cost per unit
        const totalCost    = parseFloat((qty * unitCost).toFixed(2));
        const payment      = String(data.payment_method || 'Cash');
        const status       = String(data.status         || 'received');
        const notes        = String(data.notes          || '');
        const purchaseDate = data.purchase_date
            ? new Date(data.purchase_date).toISOString().slice(0, 19).replace('T', ' ')
            : new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Safety — reject bad values before touching the DB
        if (!productId || isNaN(productId))  throw new Error('Invalid product_id');
        if (!productName)                    throw new Error('product_name is required');
        if (isNaN(qty)  || qty  <= 0)        throw new Error('quantity must be a positive integer');
        if (isNaN(unitCost) || unitCost <= 0) throw new Error('unit_cost must be a positive number');

        console.log(`[purchaseService] CREATE — product_id=${productId} qty=${qty} unit_cost=${unitCost} status=${status}`);

        // ── Step 1: Insert exactly ONE purchase record ────────────────────────
        const [insertResult] = await connection.execute(`
            INSERT INTO stock_purchases
                (product_id, product_name, category,
                 supplier_name, supplier_phone,
                 quantity, unit_cost, total_cost,
                 payment_method, status, notes,
                 purchase_date, created_by)
            VALUES (?, ?, ?,  ?, ?,  ?, ?, ?,  ?, ?, ?,  ?, ?)
        `, [
            productId,    productName,  category,
            supplierName, supplierPhone,
            qty,          unitCost,     totalCost,
            payment,      status,       notes,
            purchaseDate, createdBy || null
        ]);

        const newId = insertResult.insertId;
        console.log(`[purchaseService] Inserted stock_purchase id=${newId}`);

        // ── Step 2: Update inventory atomically (only when received) ──────────
        if (status === 'received') {
            // Check if the cost column exists (added via migration — may not exist yet)
            const [costCols] = await connection.execute(`
                SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME   = 'products'
                  AND COLUMN_NAME  = 'cost'
                LIMIT 1
            `);
            const hasCost = costCols.length > 0;

            const updateSQL = hasCost
                ? 'UPDATE products SET stock = stock + ?, cost = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
                : 'UPDATE products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            const updateParams = hasCost
                ? [qty, unitCost, productId]
                : [qty, productId];

            const [upd] = await connection.execute(updateSQL, updateParams);

            if (upd.affectedRows === 0) {
                throw new Error(`Product id=${productId} not found — inventory not updated`);
            }

            console.log(`[purchaseService] Inventory updated: product_id=${productId} +${qty} units${hasCost ? `, cost=${unitCost}` : ' (cost col missing)'}`);
        }

        await connection.commit();

        // Return the saved record (read after commit so caller gets final data)
        const saved = await getPurchaseById(newId);
        return saved;

    } catch (err) {
        await connection.rollback();
        console.error('[purchaseService] createPurchase ROLLED BACK:', err.message);
        throw err;
    } finally {
        connection.release();
    }
};

// ═══════════════════════════════════════════════════════════════════════
//  DELETE  —  single DB transaction
//
//  Steps (all-or-nothing):
//    1. SELECT the purchase (to know qty + status)
//    2. DELETE the purchase row
//    3. If status was 'received': UPDATE products SET stock = GREATEST(0, stock - qty)
// ═══════════════════════════════════════════════════════════════════════

const deletePurchase = async (id) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Lock the row we are about to delete
        const [rows] = await connection.execute(
            'SELECT * FROM stock_purchases WHERE id = ? FOR UPDATE',
            [id]
        );
        if (!rows.length) throw new Error(`Purchase id=${id} not found`);

        const purchase = rows[0];
        console.log(`[purchaseService] DELETE id=${id} product_id=${purchase.product_id} qty=${purchase.quantity} status=${purchase.status}`);

        // Delete first so FK constraints don't interfere
        await connection.execute('DELETE FROM stock_purchases WHERE id = ?', [id]);

        // Reverse inventory — only for received purchases
        if (purchase.status === 'received') {
            const [upd] = await connection.execute(`
                UPDATE products
                SET stock      = GREATEST(0, stock - ?),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [parseInt(purchase.quantity), purchase.product_id]);

            console.log(`[purchaseService] Inventory reversed: product_id=${purchase.product_id} stock -${purchase.quantity} (affectedRows=${upd.affectedRows})`);
        }

        await connection.commit();
        return purchase; // caller uses this for the response message

    } catch (err) {
        await connection.rollback();
        console.error('[purchaseService] deletePurchase ROLLED BACK:', err.message);
        throw err;
    } finally {
        connection.release();
    }
};

// ═══════════════════════════════════════════════════════════════════════
//  UPDATE STATUS  —  adjusts inventory on status transitions
//
//  pending  → received :  +qty  to stock
//  received → returned :  -qty  from stock  (GREATEST 0)
//  any other change    :  no stock movement
// ═══════════════════════════════════════════════════════════════════════

const updatePurchaseStatus = async (id, newStatus) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.execute(
            'SELECT * FROM stock_purchases WHERE id = ? FOR UPDATE',
            [id]
        );
        if (!rows.length) throw new Error(`Purchase id=${id} not found`);

        const purchase  = rows[0];
        const oldStatus = purchase.status;

        // No-op if status unchanged
        if (oldStatus === newStatus) {
            await connection.commit();
            return purchase;
        }

        await connection.execute(
            'UPDATE stock_purchases SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newStatus, id]
        );

        console.log(`[purchaseService] Status change id=${id}: ${oldStatus} → ${newStatus}`);

        if (oldStatus !== 'received' && newStatus === 'received') {
            const [sCols] = await connection.execute(
                `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='products' AND COLUMN_NAME='cost' LIMIT 1`
            );
            const hasCostCol = sCols.length > 0;
            if (hasCostCol) {
                await connection.execute(
                    'UPDATE products SET stock = stock + ?, cost = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [parseInt(purchase.quantity), parseFloat(purchase.unit_cost), purchase.product_id]
                );
            } else {
                await connection.execute(
                    'UPDATE products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [parseInt(purchase.quantity), purchase.product_id]
                );
            }
            console.log(`[purchaseService] +${purchase.quantity} stock for product_id=${purchase.product_id}`);
        }

        if (oldStatus === 'received' && newStatus === 'returned') {
            // Received → returned: remove stock
            await connection.execute(`
                UPDATE products
                SET stock = GREATEST(0, stock - ?), updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [parseInt(purchase.quantity), purchase.product_id]);
            console.log(`[purchaseService] -${purchase.quantity} stock for product_id=${purchase.product_id}`);
        }

        await connection.commit();
        return await getPurchaseById(id);

    } catch (err) {
        await connection.rollback();
        console.error('[purchaseService] updatePurchaseStatus ROLLED BACK:', err.message);
        throw err;
    } finally {
        connection.release();
    }
};

module.exports = {
    createStockPurchasesTable,
    getAllPurchases,
    getPurchaseById,
    getPurchasesByProduct,
    getPurchaseSummary,
    createPurchase,
    deletePurchase,
    updatePurchaseStatus,
};