import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());



// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'PBL Intelligence API is running' });
});

// Routes (we'll add these in later steps)
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/districts', districtRoutes);
// app.use('/api/grants', grantRoutes);
// app.use('/api/review', reviewRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});

// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });