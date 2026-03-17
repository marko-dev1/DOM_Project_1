const errorHandler = (err, req, res, next) => {
    console.error('Error Stack:', err.stack);
    console.error('Error Details:', err);

    let error = { ...err };
    error.message = err.message;

    // MySQL duplicate entry
    if (err.code === 'ER_DUP_ENTRY') {
        const message = 'Duplicate entry found';
        error = { message, statusCode: 400 };
    }

    // MySQL connection error
    if (err.code === 'ECONNREFUSED') {
        const message = 'Database connection failed';
        error = { message, statusCode: 500 };
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = { message, statusCode: 400 };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = { message, statusCode: 401 };
    }

    // JWT expired
    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = { message, statusCode: 401 };
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;