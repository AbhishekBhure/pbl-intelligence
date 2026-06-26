import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import SchoolResponse from '../models/SchoolResponse.js';
import GrantProfile from '../models/GrantProfile.js';
import GrantPerformance from '../models/GrantPerformance.js';
import MediaEvidence from '../models/MediaEvidence.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

// ─── Helpers ────────────────────────────────────────────────────────────────

const readCSV = (filePath) =>
    new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });

const parseBoolean = (val) =>
    typeof val === 'string' && val.trim().toLowerCase() === 'yes';

const parseClasses = (val) => {
    if (!val || val === 'Not conducted') return [];
    const matches = val.match(/\d/g);
    return matches ? [...new Set(matches)] : [];
};

const parseSubjects = (val) => {
    if (!val || val === 'Not applicable') return [];
    const subjects = [];
    if (val.toLowerCase().includes('math')) subjects.push('Math');
    if (val.toLowerCase().includes('science')) subjects.push('Science');
    return subjects;
};

const parseDistricts = (val) => {
    if (!val) return [];
    return val.split(';').map((d) => d.trim()).filter(Boolean);
};

const safeFloat = (val) => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
};

const safeInt = (val) => {
    const n = parseInt(val);
    return isNaN(n) ? 0 : n;
};

// ─── Parsers ────────────────────────────────────────────────────────────────

const parseSchoolRow = (row) => ({
    reportingMonth: row['Reporting Month']?.trim(),
    timestamp: new Date(row['Timestamp']),
    schoolName: row["What is the name of your school?"]?.trim(),
    schoolCode: row["What is your school's synthetic school code?"]?.trim(),
    district: row['What is the name of your district?']?.trim(),
    block: row['Block Details']?.trim(),
    pblConducted: parseBoolean(row['Was the PBL project conducted in your school this month?']),
    evidenceSubmitted: parseBoolean(row['Was evidence submitted for the completed PBL project?']),
    classesUsed: parseClasses(row['In which class/classes did you conduct the PBL project?']),
    subjects: parseSubjects(row['Which subject do you teach?']),
    enrollment: {
        class6: safeInt(row['Total number of students enrolled in Class 6, including all sections']),
        class7: safeInt(row['Total number of students enrolled in Class 7, including all sections']),
        class8: safeInt(row['Total number of students enrolled in Class 8, including all sections']),
    },
    attendance: {
        class6: {
            science: safeInt(row['Average student attendance during the Class 6 PBL Science session. If you did not teach Science in Class 6, enter 0.']),
            math: safeInt(row['Average student attendance during the Class 6 PBL Math session. If you did not teach Math in Class 6, enter 0.']),
        },
        class7: {
            science: safeInt(row['Average student attendance during the Class 7 PBL Science session. If you did not teach Science in Class 7, enter 0.']),
            math: safeInt(row['Average student attendance during the Class 7 PBL Math session. If you did not teach Math in Class 7, enter 0.']),
        },
        class8: {
            science: safeInt(row['Average student attendance during the Class 8 PBL Science session. If you did not teach Science in Class 8, enter 0.']),
            math: safeInt(row['Average student attendance during the Class 8 PBL Math session. If you did not teach Math in Class 8, enter 0.']),
        },
    },
    totalEnrollment: safeInt(row['Derived: Total enrollment across Classes 6-8']),
    totalAttendance: safeInt(row['Derived: Total attendance across PBL Science and Math sessions']),
    attendanceRate: safeFloat(row['Derived: Overall PBL attendance rate']),
    riskStatus: row['Derived: Risk status']?.trim(),
});

const parseGrantProfileRows = (rows) => {
    // Group rows by grantId + reportingMonth
    const grouped = {};
    for (const row of rows) {
        const key = `${row['grant_id']}_${row['reporting_month']}`;
        if (!grouped[key]) {
            grouped[key] = {
                grantId: row['grant_id']?.trim(),
                donor: row['donor']?.trim(),
                grantName: row['grant_name']?.trim(),
                periodStart: new Date(row['period_start']),
                periodEnd: new Date(row['period_end']),
                coveredDistricts: parseDistricts(row['covered_districts']),
                reportingMonth: row['reporting_month']?.trim(),
                budgetLines: [],
            };
        }
        grouped[key].budgetLines.push({
            budgetLine: row['budget_line']?.trim(),
            approvedBudget: safeInt(row['approved_budget_units']),
            monthlyUtilized: safeInt(row['monthly_utilized_units']),
            cumulativeUtilized: safeInt(row['cumulative_utilized_units']),
            utilizationRate: safeFloat(row['cumulative_utilization_rate']),
            financeNote: row['finance_note']?.trim(),
        });
    }
    return Object.values(grouped);
};

const parseGrantPerformanceRow = (row) => ({
    grantId: row['grant_id']?.trim(),
    donor: row['donor']?.trim(),
    grantName: row['grant_name']?.trim(),
    reportingMonth: row['reporting_month']?.trim(),
    periodEndDate: new Date(row['period_end_date']),
    reportDueDate: new Date(row['report_due_date']),
    reportStatus: row['report_status']?.trim(),
    coveredDistricts: parseDistricts(row['covered_districts']),
    sampledSchools: safeInt(row['sampled_school_records']),
    schoolsCompletedPbl: safeInt(row['schools_completed_pbl']),
    pblCompletionRate: safeFloat(row['pbl_completion_rate']),
    schoolsWithEvidence: safeInt(row['schools_with_evidence']),
    evidenceSubmissionRate: safeFloat(row['evidence_submission_rate']),
    totalEnrollment: safeInt(row['total_enrollment']),
    totalAttendance: safeInt(row['total_attendance']),
    attendanceRate: safeFloat(row['attendance_rate']),
    riskStatus: row['risk_status']?.trim(),
    milestoneSummary: row['milestone_summary']?.trim(),
    draftReportText: row['draft_report_text']?.trim(),
});

const parseMediaEvidenceRow = (row) => ({
    recordId: row['record_id']?.trim(),
    recordType: row['record_type']?.trim(),
    grantId: row['grant_id']?.trim(),
    donor: row['donor']?.trim(),
    reportingMonth: row['reporting_month']?.trim(),
    district: row['district']?.trim(),
    title: row['title']?.trim(),
    summary: row['summary_or_caption']?.trim(),
    fileName: row['file_name']?.trim(),
    relativePath: row['relative_path']?.trim(),
    usageNote: row['usage_note']?.trim(),
});

// ─── Main Seed Function ──────────────────────────────────────────────────────

const seed = async () => {
    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing collections...');
    await SchoolResponse.deleteMany({});
    await GrantProfile.deleteMany({});
    await GrantPerformance.deleteMany({});
    await MediaEvidence.deleteMany({});
    console.log('✅ Collections cleared');

    // ── School Responses ──
    const csvDir = join(__dirname, '../../../data');

    console.log('\n📂 Seeding school responses...');
    const monthFiles = [
        'PBL_School_Response_Data_July_2025.csv',
        'PBL_School_Response_Data_August_2025.csv',
        'PBL_School_Response_Data_September_2025.csv',
    ];

    let totalSchools = 0;
    for (const file of monthFiles) {
        const rows = await readCSV(join(csvDir, file));
        const docs = rows.map(parseSchoolRow);
        await SchoolResponse.insertMany(docs, { ordered: false });
        console.log(`  ✅ ${file}: ${docs.length} records inserted`);
        totalSchools += docs.length;
    }
    console.log(`  📊 Total school records: ${totalSchools}`);

    // ── Grant Profiles ──
    console.log('\n📂 Seeding grant profiles...');
    const grantProfileRows = await readCSV(join(csvDir, '01_Grant_Profile_and_Finance.csv'));
    const grantProfileDocs = parseGrantProfileRows(grantProfileRows);
    await GrantProfile.insertMany(grantProfileDocs, { ordered: false });
    console.log(`  ✅ Grant profiles: ${grantProfileDocs.length} records inserted`);

    // ── Grant Performances ──
    console.log('\n📂 Seeding grant performances...');
    const grantPerfRows = await readCSV(join(csvDir, '02_Grant_Performance_and_Report_Material.csv'));
    const grantPerfDocs = grantPerfRows.map(parseGrantPerformanceRow);
    await GrantPerformance.insertMany(grantPerfDocs, { ordered: false });
    console.log(`  ✅ Grant performances: ${grantPerfDocs.length} records inserted`);

    // ── Media Evidence ──
    console.log('\n📂 Seeding media evidence...');
    const mediaRows = await readCSV(join(csvDir, '03_Evidence_and_Media_Index.csv'));
    const mediaDocs = mediaRows.map(parseMediaEvidenceRow);
    await MediaEvidence.insertMany(mediaDocs, { ordered: false });
    console.log(`  ✅ Media evidence: ${mediaDocs.length} records inserted`);

    console.log('\n🎉 Seed complete!');
    await mongoose.connection.close();
    process.exit(0);
};

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    mongoose.connection.close();
    process.exit(1);
});