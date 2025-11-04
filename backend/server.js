import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//Import routes
import orderRoutes from './routes/orderRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import chefRoutes from './routes/chefRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

//configure cors 
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        else {
            return callback(new Error('Not allowed by CORS'));
        }
    },

    credentials: true
}))

// Middleware

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.json({ 
      status: 'ok', 
      message: 'Restaurant Management API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        orders: '/api/orders',
        tables: '/api/tables',
        menu: '/api/menu',
        chefs: '/api/chefs'
      }
    });
  });

//Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/chefs', chefRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
      success: false, 
      message: `Route ${req.method} ${req.originalUrl} not found`,
      availableRoutes: ['/api/orders', '/api/tables', '/api/menu', '/api/chefs']
    });
  });

// Error handler middleware 
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`MongoDB: ${process.env.MONGO_URI ? 'Connected' : 'Not configured'}`);
  });