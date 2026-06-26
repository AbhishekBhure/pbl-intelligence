import mongoose from 'mongoose';

const mediaEvidenceSchema = new mongoose.Schema({
    recordId: { type: String, required: true, unique: true },
    recordType: { type: String, enum: ['image', 'news_clipping'] },
    grantId: { type: String, required: true },
    donor: { type: String },
    reportingMonth: { type: String },
    district: { type: String },
    title: { type: String },
    summary: { type: String },
    fileName: { type: String },
    relativePath: { type: String },
    usageNote: { type: String },
}, { timestamps: true });

mediaEvidenceSchema.index({ grantId: 1 });
mediaEvidenceSchema.index({ reportingMonth: 1 });

const MediaEvidence = mongoose.model('MediaEvidence', mediaEvidenceSchema);
export default MediaEvidence;