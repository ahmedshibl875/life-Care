const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const path = require('path');
require('dotenv').config();

const app = express();

// Serving static files (For accessible Medical files securely)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Security Middlewares
app.use(helmet()); // Set security HTTP headers
// app.use(xss()); // Prevent XSS attacks (Cross-site scripting) - Removed due to Express 5 incompatibility
// app.use(mongoSanitize()); // Prevent NoSQL Injection attacks - Removed due to Express 5 incompatibility
// app.use(hpp()); // Prevent HTTP Parameter Pollution - Removed due to Express 5 incompatibility

// General Middleware
app.use(express.json({ limit: '10kb' })); // Body parser, reading data from body into req.body (with a size limit)
app.use(cors());

// Routes
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const uploadRoutes = require('./routes/upload');
const { router: notificationRoutes } = require('./routes/notifications');
const connectionRoutes = require('./routes/connections');

app.use('/api/auth', authRoutes);
app.use('/api/actions', apiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/connections', connectionRoutes);

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lifecare', {
    serverSelectionTimeoutMS: 5000, // Fail fast if DB is down instead of 10s hang
    socketTimeoutMS: 45000, // Keep socket alive up to 45s for larger queries
})
    .then(() => console.log('✅ Connected to MongoDB (lifecare) via 127.0.0.1'))
    .catch(err => console.error('❌ Database Connection Error:', err));

mongoose.connection.on('error', err => {
    console.error('🔄 MongoDB Runtime Error:', err);
});

// Fallback error handler
app.use((err, req, res, next) => {
    console.error('⚠️ Unhandled Application Error:', err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Security Backend running on port ${PORT}`));
