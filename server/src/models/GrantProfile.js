import mongoose from 'mongoose';

const budgetLineSchema = new mongoose.Schema({
    budgetLine: { type: String },
    approvedBudget: { type: Number },
    monthlyUtilized: { type: Number },
    cumulativeUtilized: { type: Number },
    utilizationRate: { type: Number },
    financeNote: { type: String },
});

const grantProfileSchema = new mongoose.Schema({
    grantId: { type: String, required: true },
    donor: { type: String, required: true },
    grantName: { type: String, required: true },
    periodStart: { type: Date },
    periodEnd: { type: Date },
    coveredDistricts: [{ type: String }],
    reportingMonth: { type: String, required: true },
    budgetLines: [budgetLineSchema],
}, { timestamps: true });

grantProfileSchema.index({ grantId: 1, reportingMonth: 1 });

const GrantProfile = mongoose.model('GrantProfile', grantProfileSchema);
export default GrantProfile;