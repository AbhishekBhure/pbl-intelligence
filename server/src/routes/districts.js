import express from 'express';
import { buildFilter, getDistrictPerformance, getBlockPerformance } from '../services/aggregator.js';
import { explainRisk } from '../services/riskEngine.js';

const router = express.Router();

// GET /api/districts?month=2025-09&grade=7&subject=Math
router.get('/', async (req, res) => {
    try {
        const { month, district, grade, subject } = req.query;
        const filter = buildFilter({ month, district, grade, subject });
        const districts = await getDistrictPerformance(filter);

        // Annotate each district with risk explanation
        const annotated = districts.map((d) => ({
            ...d,
            attendanceRiskDetail: explainRisk(d.attendanceRate, 'Attendance'),
            participationRiskDetail: explainRisk(d.participationRate, 'Participation'),
            evidenceRiskDetail: explainRisk(d.evidenceRate, 'Evidence Submission'),
        }));

        // Split into high and low performing
        const highPerforming = annotated.filter((d) => d.attendanceRate >= 0.60);
        const lowPerforming = annotated.filter((d) => d.attendanceRate < 0.60);

        res.json({
            success: true,
            data: {
                all: annotated,
                highPerforming,
                lowPerforming,
                total: annotated.length,
            },
        });
    } catch (err) {
        console.error('Districts error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/districts/blocks?month=2025-09&district=District A
router.get('/blocks', async (req, res) => {
    try {
        const { month, district, grade, subject } = req.query;
        const filter = buildFilter({ month, district, grade, subject });
        const blocks = await getBlockPerformance(filter);

        const annotated = blocks.map((b) => ({
            ...b,
            attendanceRiskDetail: explainRisk(b.attendanceRate, 'Attendance'),
            participationRiskDetail: explainRisk(b.participationRate, 'Participation'),
            evidenceRiskDetail: explainRisk(b.evidenceRate, 'Evidence Submission'),
        }));

        const highPerforming = annotated.filter((b) => b.attendanceRate >= 0.60);
        const lowPerforming = annotated.filter((b) => b.attendanceRate < 0.60);

        res.json({
            success: true,
            data: {
                all: annotated,
                highPerforming,
                lowPerforming,
                total: annotated.length,
            },
        });
    } catch (err) {
        console.error('Blocks error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;