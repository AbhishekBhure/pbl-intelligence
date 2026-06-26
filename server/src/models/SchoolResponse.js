import mongoose from 'mongoose';

const schoolResponseSchema = new mongoose.Schema({
    reportingMonth: { type: String, required: true },
    timestamp: { type: Date },
    schoolName: { type: String, required: true },
    schoolCode: { type: String, required: true },
    district: { type: String, required: true },
    block: { type: String, required: true },
    pblConducted: { type: Boolean, required: true },
    evidenceSubmitted: { type: Boolean, required: true },
    classesUsed: [{ type: String }],
    subjects: [{ type: String }],
    enrollment: {
        class6: { type: Number, default: 0 },
        class7: { type: Number, default: 0 },
        class8: { type: Number, default: 0 },
    },
    attendance: {
        class6: { science: { type: Number, default: 0 }, math: { type: Number, default: 0 } },
        class7: { science: { type: Number, default: 0 }, math: { type: Number, default: 0 } },
        class8: { science: { type: Number, default: 0 }, math: { type: Number, default: 0 } },
    },
    totalEnrollment: { type: Number, default: 0 },
    totalAttendance: { type: Number, default: 0 },
    attendanceRate: { type: Number, default: 0 },
    riskStatus: {
        type: String,
        enum: ['On Track', 'Behind', 'At Risk', 'Critical'],
        required: true,
    },
}, { timestamps: true });

// Indexes for fast filtering
schoolResponseSchema.index({ reportingMonth: 1 });
schoolResponseSchema.index({ district: 1 });
schoolResponseSchema.index({ block: 1 });
schoolResponseSchema.index({ riskStatus: 1 });
schoolResponseSchema.index({ reportingMonth: 1, district: 1, block: 1 });

const SchoolResponse = mongoose.model('SchoolResponse', schoolResponseSchema);
export default SchoolResponse;