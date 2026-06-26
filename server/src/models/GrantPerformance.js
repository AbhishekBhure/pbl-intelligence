import mongoose from 'mongoose';

const grantPerformanceSchema = new mongoose.Schema({
    grantId: { type: String, required: true },
    donor: { type: String, required: true },
    grantName: { type: String, required: true },
    reportingMonth: { type: String, required: true },
    periodEndDate: { type: Date },
    reportDueDate: { type: Date },
    reportStatus: { type: String },
    coveredDistricts: [{ type: String }],
    sampledSchools: { type: Number },
    schoolsCompletedPbl: { type: Number },
    pblCompletionRate: { type: Number },
    schoolsWithEvidence: { type: Number },
    evidenceSubmissionRate: { type: Number },
    totalEnrollment: { type: Number },
    totalAttendance: { type: Number },
    attendanceRate: { type: Number },
    riskStatus: { type: String },
    milestoneSummary: { type: String },
    draftReportText: { type: String },
}, { timestamps: true });

grantPerformanceSchema.index({ grantId: 1, reportingMonth: 1 });

const GrantPerformance = mongoose.model('GrantPerformance', grantPerformanceSchema);
export default GrantPerformance;