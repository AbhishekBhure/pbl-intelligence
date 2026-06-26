import express from 'express';
import { buildFilter, getKPISummary, getMoMComparison, getFilterOptions } from '../services/aggregator.js';

const router = express.Router();

// GET /api/dashboard?month=2025-09&district=District A&block=...&grade=7&subject=Math
router.get('/', async (req, res) => {
    try {
        const { month, district, block, grade, subject } = req.query;
        const filter = buildFilter({ month, district, block, grade, subject });
        const summary = await getKPISummary(filter);
        res.json({ success: true, data: summary });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/dashboard/mom?current=2025-09&previous=2025-08&district=...
router.get('/mom', async (req, res) => {
    try {
        const { current, previous, district, block, grade, subject } = req.query;

        if (!current || !previous) {
            return res.status(400).json({
                success: false,
                message: 'current and previous month params are required',
            });
        }

        const baseFilter = buildFilter({ district, block, grade, subject });
        const comparison = await getMoMComparison(current, previous, baseFilter);
        res.json({ success: true, data: comparison });
    } catch (err) {
        console.error('MoM error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/dashboard/filters — all unique filter options
router.get('/filters', async (req, res) => {
    try {
        const options = await getFilterOptions();
        res.json({ success: true, data: options });
    } catch (err) {
        console.error('Filters error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;