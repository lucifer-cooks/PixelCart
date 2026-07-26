const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const connectDB = require('./utils/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Security and compression middleware
app.use(helmet({
  contentSecurityPolicy: false, // Turn off CSP for easier development with local Stripe integrations/CDN styles
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static folders
// 1. Serve client files statically
app.use(express.static(path.join(__dirname, '../client')));

// 2. Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, './uploads')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api', require('./routes/orderRoutes')); // Maps checkout and orders
app.use('/api/admin', require('./routes/adminRoutes'));

// HTML Client Pages router
app.use('/', require('./routes/clientRoutes'));

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = server; // Export for testing
