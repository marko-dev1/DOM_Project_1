
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const userAdminRoutes = require('./backend/routes/userAdminRoutes');
const salesRoutes = require('./backend/routes/salesRoutes');
const productRoutes = require('./backend/routes/productRoutes');
const orderRoutes = require('./backend/routes/orderRoutes');

const expensesRoutes = require('./backend/routes/expensesRoutes');
const revenueRoutes = require('./backend/routes/revenueRoutes');

try {
    const salesRoutes = require('./backend/routes/salesRoutes');
    
    if (salesRoutes && salesRoutes.stack) {
        
        salesRoutes.stack.forEach((layer, index) => {
            if (layer.route) {
            }
        });
    }
} catch (error) {
    console.error('❌ Failed to load salesRoutes:', error.message);
    console.error(error.stack);
}
console.log('----------------------------------------\n');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, './frontend/public')));

app.use('/uploads', express.static(path.join(__dirname, '/public/uploads')));

 let database;
try {
    database = require('./backend/config/database');
} catch (error) {
  
    process.exit(1);
}

// Test endpoint - add this first
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Server is working! 🚀', 
        timestamp: new Date().toISOString(),
        endpoints: [
            '/api/products', 
            '/api/users', 
            '/api/orders', 
            '/api/admin', 
            '/api/profile',
            '/api/sales'  // Added this
        ]
    });
});

// Load routes directly (simplified approach)
try { 
    app.use('/api', userAdminRoutes);
    app.use('/api/users', userAdminRoutes);
    app.use('/api/sales', salesRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/orders', orderRoutes);
    app.use("/api/expenses", expensesRoutes);
    app.use('/api/revenue', revenueRoutes);
    
    console.log('✅ All routes loaded successfully');
} catch (error) {
    console.error('❌ Error loading routes:', error.message);
    
}

app.get('/api/debug/routes', (req, res) => {
    const routes = [];
    
    // Check sales routes
    if (salesRoutes.stack) {
        salesRoutes.stack.forEach(layer => {
            if (layer.route) {
                const path = layer.route.path;
                const methods = Object.keys(layer.route.methods);
                routes.push({
                    path: `/api/sales${path}`,
                    methods: methods
                });
            }
        });
    }
    
    res.json({ salesRoutes: routes });
});

// Serve pages
app.get('/admin', (req, res) => {
   res.sendFile(path.join(__dirname, './frontend/public/admin-dashboard.html'));
});

app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, './frontend/public/admin-login.html'));
});

app.get('/', (req, res) => {
    res.json({ 
        message: 'vitronics API Server',
        status: 'Running',
        endpoints: {
            test: '/api/test',
            health: '/api/health',
            products: '/api/products',
            users: '/api/users', 
            orders: '/api/orders',
            sales: '/api/sales',  // Added this
            admin: '/admin',
            adminLogin: '/admin-login',
            login: '/api/login',
            debug: '/api/debug/routes'  // Added for debugging
        }
    });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const isConnected = database.testConnection ? await database.testConnection() : false;
        res.json({ 
            status: 'OK', 
            database: isConnected ? 'Connected' : 'Disconnected',
            timestamp: new Date().toISOString(),
            routes: {
                products: 'Available',
                users: 'Available', 
                orders: 'Available',
                sales: 'Available',  // Added this
                admins: 'Available'
            }
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'Error', 
            database: 'Disconnected',
            error: error.message 
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    res.status(500).json({ 
        error: 'Internal server error',
        message: error.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        requested: req.originalUrl,
        available: [
            '/api/test', 
            '/api/health', 
            '/api/products', 
            '/api/users', 
            '/api/orders',
            '/api/sales',  // Added this
            '/api/debug/routes'
        ]
    });
});

// Start server function
const startServer = async () => {
    try {
        // Verify database connection
        if (database.testConnection && typeof database.testConnection === 'function') {
            const isConnected = await database.testConnection();
            
            if (!isConnected) {
                console.error('❌ Database connection failed');
            } else {
            }
        }
        
        const PORT = process.env.PORT || 8000;
        app.listen(PORT, () => {
        });
        console.log(`✅ Server is running on port ${PORT}`);
    } catch (error) {
        console.error('❌ Server startup error:', error);
        process.exit(1);
    }
};

if (salesRoutes && typeof salesRoutes === 'function') {
} else {
    console.error('❌ salesRoutes is not properly exported');
}

// Start the server
startServer();