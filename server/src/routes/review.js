import express from 'express';
import { buildFilter, getKPISummary, getDistrictPerformance, getMoMComparison } from '../services/aggregator.js';
import { explainRisk, needsFollowUp } from '../services/riskEngine.js';
import { generateReviewSummary } from '../services/geminiService.js';

const router = express.Router();

// GET /api/review/summary?month=2025-09&district=...
router.get('/summary', async (req, res) => {
    try {
        const { month, district, block, grade, subject } = req.query;

        if (!month) {
            return res.status(400).json({ success: false, message: 'month param is required' });
        }

        // Determine previous month
        const monthMap = { '2025-07': null, '2025-08': '2025-07', '2025-09': '2025-08' };
        const previousMonth = monthMap[month] || null;

        const filter = buildFilter({ month, district, block, grade, subject });

        // Gather all deterministic insights
        const [kpi, districts] = await Promise.all([
            getKPISummary(filter),
            getDistrictPerformance(filter),
        ]);

        let momData = null;
        if (previousMonth) {
            const baseFilter = buildFilter({ district, block, grade, subject });
            momData = await getMoMComparison(month, previousMonth, baseFilter);
        }

        // Build priority flags
        const priorityDistricts = districts
            .filter((d) => needsFollowUp(d.riskStatus))
            .slice(0, 5);

        const topDistricts = districts
            .filter((d) => !needsFollowUp(d.riskStatus))
            .slice(0, 3);

        // Structured deterministic insights
        const insights = {
            month,
            kpi,
            mom: momData,
            priorityDistricts,
            topDistricts,
            riskDetail: {
                attendance: explainRisk(kpi.attendanceRate, 'Overall Attendance'),
                participation: explainRisk(kpi.participationRate, 'Participation'),
                evidence: explainRisk(kpi.evidenceRate, 'Evidence Submission'),
            },
            riskDistribution: kpi.riskDistribution,
        };

        // Generate AI narrative on top of deterministic insights
        const narrative = await generateReviewSummary(insights);

        res.json({
            success: true,
            data: { insights, narrative },
        });
    } catch (err) {
        console.error('Review summary error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;