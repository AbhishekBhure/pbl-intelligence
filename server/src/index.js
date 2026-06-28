import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import dashboardRoutes from './routes/dashboard.js';
import districtRoutes from './routes/districts.js';
import grantRoutes from './routes/grants.js';
import reviewRoutes from './routes/review.js';

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://pbl-intelligence-two.vercel.app',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());



// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'PBL Intelligence API is running' });
});

// Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/districts', districtRoutes);
app.use('/api/grants', grantRoutes);
app.use('/api/review', reviewRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });