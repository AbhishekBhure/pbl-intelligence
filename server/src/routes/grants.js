import express from 'express';
import GrantProfile from '../models/GrantProfile.js';
import GrantPerformance from '../models/GrantPerformance.js';
import MediaEvidence from '../models/MediaEvidence.js';
import { generateGrantNarrative } from '../services/geminiService.js';

const router = express.Router();

// GET /api/grants — list all unique grants
router.get('/', async (req, res) => {
    try {
        const grants = await GrantPerformance.aggregate([
            {
                $group: {
                    _id: '$grantId',
                    grantName: { $first: '$grantName' },
                    donor: { $first: '$donor' },
                    coveredDistricts: { $first: '$coveredDistricts' },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        res.json({ success: true, data: grants });
    } catch (err) {
        console.error('Grants list error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/grants/:grantId?month=2025-09
router.get('/:grantId', async (req, res) => {
    try {
        const { grantId } = req.params;
        const { month } = req.query;

        if (!month) {
            return res.status(400).json({ success: false, message: 'month query param is required' });
        }

        // Fetch all three data sources in parallel
        const [profile, performance, media] = await Promise.all([
            GrantProfile.findOne({ grantId, reportingMonth: month }).lean(),
            GrantPerformance.findOne({ grantId, reportingMonth: month }).lean(),
            MediaEvidence.find({ grantId }).lean(),
        ]);

        if (!profile || !performance) {
            return res.status(404).json({
                success: false,
                message: `No data found for grant ${grantId} in month ${month}`,
            });
        }

        res.json({
            success: true,
            data: { profile, performance, media },
        });
    } catch (err) {
        console.error('Grant detail error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/grants/:grantId/narrative
router.post('/:grantId/narrative', async (req, res) => {
    try {
        const { grantId } = req.params;
        const { month } = req.body;

        if (!month) {
            return res.status(400).json({ success: false, message: 'month is required in request body' });
        }

        // Fetch facts
        const [profile, performance, media] = await Promise.all([
            GrantProfile.findOne({ grantId, reportingMonth: month }).lean(),
            GrantPerformance.findOne({ grantId, reportingMonth: month }).lean(),
            MediaEvidence.find({ grantId, reportingMonth: month }).lean(),
        ]);

        if (!profile || !performance) {
            return res.status(404).json({
                success: false,
                message: `No data found for grant ${grantId} in month ${month}`,
            });
        }

        // Build structured facts object
        const facts = {
            grantName: performance.grantName,
            donor: performance.donor,
            reportingMonth: month,
            coveredDistricts: performance.coveredDistricts,
            pblCompletionRate: performance.pblCompletionRate,
            evidenceSubmissionRate: performance.evidenceSubmissionRate,
            attendanceRate: performance.attendanceRate,
            totalEnrollment: performance.totalEnrollment,
            totalAttendance: performance.totalAttendance,
            sampledSchools: performance.sampledSchools,
            schoolsCompletedPbl: performance.schoolsCompletedPbl,
            schoolsWithEvidence: performance.schoolsWithEvidence,
            riskStatus: performance.riskStatus,
            reportStatus: performance.reportStatus,
            milestoneSummary: performance.milestoneSummary,
            budgetLines: profile.budgetLines,
            mediaAssets: media.map((m) => ({ title: m.title, type: m.recordType, summary: m.summary })),
        };

        const narrative = await generateGrantNarrative(facts);

        res.json({
            success: true,
            data: { facts, narrative },
        });
    } catch (err) {
        console.error('Narrative error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;