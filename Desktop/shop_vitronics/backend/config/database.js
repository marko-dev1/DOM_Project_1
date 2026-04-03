const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST ,
    user: process.env.DB_USER ,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection function
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

// Initialize database function
const initializeDatabase = async () => {
    try {
        await testConnection();
        await createTables();
        await createDefaultAdmin();
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
    }
};

// Create tables function
const createTables = async () => {
    let connection;
    try {
        connection = await pool.getConnection();

        
        // Users table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('customer', 'admin', 'super_admin') DEFAULT 'customer',
                name VARCHAR(100),
                phone_number VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_role (role),
                INDEX idx_created_at (created_at),
                INDEX idx_email (email),
                INDEX idx_username (username)
            )
        `);

        // Products table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                stock INT DEFAULT 0,
                category VARCHAR(100),
                image_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_category (category),
                INDEX idx_name (name),
                INDEX idx_created_at (created_at),
                INDEX idx_price (price),
                INDEX idx_stock (stock)
            )
        `);

        // Orders table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS orders (
                 id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                total_amount DECIMAL(10,2) NOT NULL,
                status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
                shipping_address TEXT NOT NULL,
                payment_method VARCHAR(50),
                customer_phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at),
                INDEX idx_user_status (user_id, status),
                INDEX idx_payment_method (payment_method),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
                    )
            
        `);
        // Order items table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                product_name VARCHAR(255) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                quantity INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_order_id (order_id),
                INDEX idx_product_id (product_id),
                INDEX idx_order_product (order_id, product_id),
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);

        
        await connection.execute(`
    CREATE TABLE IF NOT EXISTS sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(100) NOT NULL,
        user_id INT,
        total_amount DECIMAL(10,2) NOT NULL,
        sales_date DATE NOT NULL,
        sales_year INT NOT NULL,
        sales_month INT NOT NULL,
        sales_week INT NOT NULL,
        sales_day INT NOT NULL,
        product_count INT DEFAULT 0,
        payment_method VARCHAR(50),
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- ADD THESE CUSTOMER COLUMNS
        customer_name VARCHAR(255) DEFAULT 'Walk-in Customer',
        customer_phone VARCHAR(50) DEFAULT '',
        customer_email VARCHAR(255) DEFAULT '',
        notes TEXT,
        
        INDEX idx_sales_date (sales_date),
        INDEX idx_sales_year_month (sales_year, sales_month),
        INDEX idx_sales_year_week (sales_year, sales_week),
        INDEX idx_order_id (order_id),
        INDEX idx_customer_name (customer_name),
        INDEX idx_customer_phone (customer_phone),
        INDEX idx_customer_email (customer_email),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
`);
        // Sales summary table for caching
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS sales_summary (
                id INT AUTO_INCREMENT PRIMARY KEY,
                period_type ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL,
                period_date DATE NOT NULL,
                total_sales DECIMAL(15,2) DEFAULT 0,
                total_orders INT DEFAULT 0,
                average_order_value DECIMAL(10,2) DEFAULT 0,
                top_product_id INT,
                top_product_name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_period (period_type, period_date),
                INDEX idx_period_type_date (period_type, period_date)
            )
        `);

        await connection.execute(`
    CREATE TABLE IF NOT EXISTS sale_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(255),
        quantity INT NOT NULL DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_sale_id (sale_id),
        INDEX idx_product_id (product_id)
    )
`);

            await pool.execute(`
           CREATE TABLE IF NOT EXISTS  expenses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                description VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                amount DECIMAL(10,2) NOT NULL,
                payment_method VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_created_at (created_at),
                INDEX idx_category (category),
                INDEX idx_payment_method (payment_method),
                INDEX idx_category_date (category, created_at)
            );

        `);

        // Carts table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS carts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                UNIQUE KEY unique_user_cart (user_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Cart items table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS cart_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cart_id INT NOT NULL,
                product_id INT NOT NULL,
                product_name VARCHAR(255) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_cart_id (cart_id),
                INDEX idx_product_id (product_id),
                INDEX idx_cart_product (cart_id, product_id),
                FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS manual_revenue (
                id INT AUTO_INCREMENT PRIMARY KEY,
                description VARCHAR(255) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                payment_method VARCHAR(50) NOT NULL,
                category VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                year INT,
                month INT,
                week INT,
                day INT,
                customer_name VARCHAR(255),
                notes TEXT,
                INDEX idx_created_at (created_at),
                INDEX idx_year_month (year, month),
                INDEX idx_payment_method (payment_method)
            )
        `);
// Stock purchases table
        await connection.execute(`
    CREATE TABLE IF NOT EXISTS stock_purchases (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        product_id      INT            NOT NULL,
        product_name    VARCHAR(255)   NOT NULL,
        category        VARCHAR(100)   DEFAULT '',
        supplier_name   VARCHAR(255)   DEFAULT '',
        supplier_phone  VARCHAR(50)    DEFAULT '',
        quantity        INT            NOT NULL DEFAULT 0,
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
        INDEX idx_supplier      (supplier_name),
        INDEX idx_created_at    (created_at),
 
        FOREIGN KEY (product_id)  REFERENCES products(id)  ON DELETE CASCADE,
        FOREIGN KEY (created_by)  REFERENCES users(id)     ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`);

        // Repairs and services revenue table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS repairs_services (
                id INT AUTO_INCREMENT PRIMARY KEY,
                service_type ENUM('repair', 'service', 'consultation', 'installation', 'maintenance', 'warranty') NOT NULL,
                description VARCHAR(255) NOT NULL,
                customer_name VARCHAR(255) NOT NULL,
                customer_phone VARCHAR(20),
                customer_email VARCHAR(255),
                amount DECIMAL(10,2) NOT NULL,
                payment_method VARCHAR(50) NOT NULL,
                product_category VARCHAR(100),
                status ENUM('pending', 'in-progress', 'completed', 'cancelled') DEFAULT 'completed',
                technician_name VARCHAR(100),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL,
                year INT,
                month INT,
                week INT,
                day INT,
                INDEX idx_service_type (service_type),
                INDEX idx_created_at (created_at),
                INDEX idx_status (status),
                INDEX idx_completed_at (completed_at),
                INDEX idx_customer_phone (customer_phone),
                INDEX idx_year_month (year, month),
                INDEX idx_payment_method (payment_method)
            )
        `);

    } catch (error) {
        console.error('❌ Error creating tables:', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
};

// Create default admin function
const createDefaultAdmin = async () => {
    let connection;
    try {
        connection = await pool.getConnection();
        
        // Check if super admin already exists
        const [rows] = await connection.execute(
            'SELECT * FROM users WHERE role = ?',
            ['super_admin']
        );
        if (rows.length === 0) {
           
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            await connection.execute(
                'INSERT INTO users (username, email, password, role, name) VALUES (?, ?, ?, ?, ?)',
                ['superadmin', 'admin@ecommerce.com', hashedPassword, 'super_admin', 'Super Administrator']
            );
            
            
        } else {
        }

    } catch (error) {
        console.error('❌ Error creating default admin:', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
};

initializeDatabase().catch(console.error);
module.exports = {
    pool,
    testConnection,
    initializeDatabase
}; 
