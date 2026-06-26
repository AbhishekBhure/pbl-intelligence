import SchoolResponse from '../models/SchoolResponse.js';
import { classifyRisk, calcMoM, summarizeRiskDistribution } from './riskEngine.js';

// ─── Build MongoDB filter from query params ──────────────────────────────────
export const buildFilter = ({ month, district, block, grade, subject }) => {
    const filter = {};
    if (month) filter.reportingMonth = month;
    if (district) filter.district = district;
    if (block) filter.block = block;
    if (grade) filter.classesUsed = grade;
    if (subject) filter.subjects = subject;
    return filter;
};

// ─── Get KPI summary for a given filter ─────────────────────────────────────
export const getKPISummary = async (filter) => {
    const schools = await SchoolResponse.find(filter).lean();

    const totalSchools = schools.length;
    const participating = schools.filter((s) => s.pblConducted).length;
    const withEvidence = schools.filter((s) => s.evidenceSubmitted).length;
    const totalEnrollment = schools.reduce((sum, s) => sum + s.totalEnrollment, 0);
    const totalAttendance = schools.reduce((sum, s) => sum + s.totalAttendance, 0);

    const participationRate = totalSchools > 0 ? participating / totalSchools : 0;
    const evidenceRate = totalSchools > 0 ? withEvidence / totalSchools : 0;
    const attendanceRate = totalEnrollment > 0 ? totalAttendance / totalEnrollment : 0;

    const riskStatuses = schools.map((s) => s.riskStatus);
    const riskDistribution = summarizeRiskDistribution(riskStatuses);

    return {
        totalSchools,
        participating,
        withEvidence,
        totalEnrollment,
        totalAttendance,
        participationRate: parseFloat(participationRate.toFixed(4)),
        evidenceRate: parseFloat(evidenceRate.toFixed(4)),
        attendanceRate: parseFloat(attendanceRate.toFixed(4)),
        riskDistribution,
        riskStatus: classifyRisk(attendanceRate),
    };
};

// ─── Get month-over-month comparison for two months ─────────────────────────
export const getMoMComparison = async (currentMonth, previousMonth, baseFilter = {}) => {
    const currentFilter = { ...baseFilter, reportingMonth: currentMonth };
    const previousFilter = { ...baseFilter, reportingMonth: previousMonth };

    const [current, previous] = await Promise.all([
        getKPISummary(currentFilter),
        getKPISummary(previousFilter),
    ]);

    return {
        current,
        previous,
        mom: {
            participationRate: calcMoM(current.participationRate, previous.participationRate),
            evidenceRate: calcMoM(current.evidenceRate, previous.evidenceRate),
            attendanceRate: calcMoM(current.attendanceRate, previous.attendanceRate),
            totalEnrollment: calcMoM(current.totalEnrollment, previous.totalEnrollment),
        },
    };
};

// ─── Get performance grouped by district ────────────────────────────────────
export const getDistrictPerformance = async (filter) => {
    const pipeline = [
        { $match: filter },
        {
            $group: {
                _id: '$district',
                totalSchools: { $sum: 1 },
                participating: { $sum: { $cond: ['$pblConducted', 1, 0] } },
                withEvidence: { $sum: { $cond: ['$evidenceSubmitted', 1, 0] } },
                totalEnrollment: { $sum: '$totalEnrollment' },
                totalAttendance: { $sum: '$totalAttendance' },
            },
        },
        {
            $addFields: {
                participationRate: {
                    $cond: [
                        { $gt: ['$totalSchools', 0] },
                        { $divide: ['$participating', '$totalSchools'] },
                        0,
                    ],
                },
                evidenceRate: {
                    $cond: [
                        { $gt: ['$totalSchools', 0] },
                        { $divide: ['$withEvidence', '$totalSchools'] },
                        0,
                    ],
                },
                attendanceRate: {
                    $cond: [
                        { $gt: ['$totalEnrollment', 0] },
                        { $divide: ['$totalAttendance', '$totalEnrollment'] },
                        0,
                    ],
                },
            },
        },
        { $sort: { attendanceRate: -1 } },
    ];

    const results = await SchoolResponse.aggregate(pipeline);

    return results.map((d) => ({
        district: d._id,
        totalSchools: d.totalSchools,
        participating: d.participating,
        withEvidence: d.withEvidence,
        totalEnrollment: d.totalEnrollment,
        totalAttendance: d.totalAttendance,
        participationRate: parseFloat(d.participationRate.toFixed(4)),
        evidenceRate: parseFloat(d.evidenceRate.toFixed(4)),
        attendanceRate: parseFloat(d.attendanceRate.toFixed(4)),
        riskStatus: classifyRisk(d.attendanceRate),
        needsFollowUp: d.attendanceRate < 0.60,
    }));
};

// ─── Get performance grouped by block ───────────────────────────────────────
export const getBlockPerformance = async (filter) => {
    const pipeline = [
        { $match: filter },
        {
            $group: {
                _id: { district: '$district', block: '$block' },
                totalSchools: { $sum: 1 },
                participating: { $sum: { $cond: ['$pblConducted', 1, 0] } },
                withEvidence: { $sum: { $cond: ['$evidenceSubmitted', 1, 0] } },
                totalEnrollment: { $sum: '$totalEnrollment' },
                totalAttendance: { $sum: '$totalAttendance' },
            },
        },
        {
            $addFields: {
                participationRate: {
                    $cond: [
                        { $gt: ['$totalSchools', 0] },
                        { $divide: ['$participating', '$totalSchools'] },
                        0,
                    ],
                },
                evidenceRate: {
                    $cond: [
                        { $gt: ['$totalSchools', 0] },
                        { $divide: ['$withEvidence', '$totalSchools'] },
                        0,
                    ],
                },
                attendanceRate: {
                    $cond: [
                        { $gt: ['$totalEnrollment', 0] },
                        { $divide: ['$totalAttendance', '$totalEnrollment'] },
                        0,
                    ],
                },
            },
        },
        { $sort: { attendanceRate: -1 } },
    ];

    const results = await SchoolResponse.aggregate(pipeline);

    return results.map((b) => ({
        district: b._id.district,
        block: b._id.block,
        totalSchools: b.totalSchools,
        participating: b.participating,
        withEvidence: b.withEvidence,
        totalEnrollment: b.totalEnrollment,
        totalAttendance: b.totalAttendance,
        participationRate: parseFloat(b.participationRate.toFixed(4)),
        evidenceRate: parseFloat(b.evidenceRate.toFixed(4)),
        attendanceRate: parseFloat(b.attendanceRate.toFixed(4)),
        riskStatus: classifyRisk(b.attendanceRate),
        needsFollowUp: b.attendanceRate < 0.60,
    }));
};

// ─── Get list of unique filter options ──────────────────────────────────────
export const getFilterOptions = async () => {
    const [months, districts, blocks, grades, subjects] = await Promise.all([
        SchoolResponse.distinct('reportingMonth'),
        SchoolResponse.distinct('district'),
        SchoolResponse.distinct('block'),
        SchoolResponse.distinct('classesUsed'),
        SchoolResponse.distinct('subjects'),
    ]);

    return {
        months: months.sort(),
        districts: districts.sort(),
        blocks: blocks.sort(),
        grades: grades.filter(Boolean).sort(),
        subjects: subjects.filter(Boolean).sort(),
    };
};