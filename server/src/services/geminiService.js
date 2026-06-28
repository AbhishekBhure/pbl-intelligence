import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// ─── Core Gemini caller ──────────────────────────────────────────────────────
const callGemini = async (prompt) => {
    const response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2048,
            },
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API error: ${err}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
};

// ─── Grant Narrative Generator ───────────────────────────────────────────────
export const generateGrantNarrative = async (facts) => {
    try {
        const prompt = `
You are a professional grant report writer for an education nonprofit.
Write a formal 3-paragraph grant report section using ONLY the facts provided below.
Do NOT invent any numbers, locations, achievements, or evidence not present in the facts.
Distinguish clearly between computed data and narrative explanation.

FACTS:
- Grant Name: ${facts.grantName}
- Donor: ${facts.donor}
- Reporting Month: ${facts.reportingMonth}
- Covered Districts: ${facts.coveredDistricts.join(', ')}
- Total Sampled Schools: ${facts.sampledSchools}
- Schools Completed PBL: ${facts.schoolsCompletedPbl} (${(facts.pblCompletionRate * 100).toFixed(1)}%)
- Schools With Evidence: ${facts.schoolsWithEvidence} (${(facts.evidenceSubmissionRate * 100).toFixed(1)}%)
- Total Enrollment: ${facts.totalEnrollment}
- Total Attendance: ${facts.totalAttendance} (${(facts.attendanceRate * 100).toFixed(1)}%)
- Overall Risk Status: ${facts.riskStatus}
- Report Status: ${facts.reportStatus}
- Milestone Summary: ${facts.milestoneSummary}
- Budget Utilization: ${facts.budgetLines.map(b => `${b.budgetLine}: ${(b.utilizationRate * 100).toFixed(1)}%`).join(', ')}
- Linked Media Assets: ${facts.mediaAssets.length > 0 ? facts.mediaAssets.map(m => m.title).join(', ') : 'None'}

INSTRUCTIONS:
- Paragraph 1: Summarize PBL implementation progress using the numbers above.
- Paragraph 2: Highlight finance utilization and milestone status.
- Paragraph 3: State the risk status, what needs attention, and next steps.
- Use formal grant report language.
- Never fabricate data.
    `.trim();

        const narrative = await callGemini(prompt);
        return { success: true, narrative, source: 'gemini' };
    } catch (err) {
        console.error('Gemini narrative error:', err.message);
        // Graceful fallback — deterministic summary
        return {
            success: false,
            source: 'fallback',
            narrative: buildFallbackNarrative(facts),
        };
    }
};

// ─── Review Summary Generator ────────────────────────────────────────────────
export const generateReviewSummary = async (insights) => {
    try {
        const { month, kpi, mom, priorityDistricts, topDistricts, riskDetail } = insights;

        const prompt = `
You are a program review assistant for an education nonprofit running Project-Based Learning programs.
Write a structured program review summary using ONLY the facts provided below.
Do NOT invent any data, districts, or outcomes not present in the facts.

FACTS:
- Reporting Month: ${month}
- Total Schools: ${kpi.totalSchools}
- Participating Schools: ${kpi.participating} (${(kpi.participationRate * 100).toFixed(1)}%)
- Schools With Evidence: ${kpi.withEvidence} (${(kpi.evidenceRate * 100).toFixed(1)}%)
- Total Enrollment: ${kpi.totalEnrollment}
- Total Attendance: ${kpi.totalAttendance} (${(kpi.attendanceRate * 100).toFixed(1)}%)
- Overall Risk Status: ${kpi.riskStatus}
- Risk Distribution: On Track: ${kpi.riskDistribution['On Track']}, Behind: ${kpi.riskDistribution['Behind']}, At Risk: ${kpi.riskDistribution['At Risk']}, Critical: ${kpi.riskDistribution['Critical']}
${mom ? `- Participation MoM: ${mom.mom.participationRate.label}
- Evidence MoM: ${mom.mom.evidenceRate.label}
- Attendance MoM: ${mom.mom.attendanceRate.label}` : '- Month-over-month: No previous month data available'}
- Priority Districts (need follow-up): ${priorityDistricts.map(d => `${d.district} (${d.riskStatus})`).join(', ') || 'None'}
- Top Performing Districts: ${topDistricts.map(d => `${d.district} (${(d.attendanceRate * 100).toFixed(1)}%)`).join(', ') || 'None'}

INSTRUCTIONS:
Write the summary in these exact sections:
1. ACHIEVEMENTS: What went well this month based on the data.
2. GAPS & RISKS: What indicators are behind or at risk and why it matters.
3. PRIORITY GEOGRAPHIES: Which districts need immediate follow-up and why.
4. DISCUSSION POINTS: 3 specific questions for the leadership review meeting based on the data.

Use bullet points inside each section. Be specific — cite the actual numbers from the facts.
    `.trim();

        const narrative = await callGemini(prompt);
        return { success: true, narrative, source: 'gemini' };
    } catch (err) {
        console.error('Gemini review error:', err.message);
        return {
            success: false,
            source: 'fallback',
            narrative: buildFallbackReview(insights),
        };
    }
};

// ─── Fallback: deterministic narrative when Gemini is unavailable ─────────────
const buildFallbackNarrative = (facts) => {
    return `
GRANT REPORT — ${facts.grantName} (${facts.reportingMonth})

Implementation Progress:
${facts.grantName} covered ${facts.coveredDistricts.join(', ')} in ${facts.reportingMonth}. 
Of ${facts.sampledSchools} sampled schools, ${facts.schoolsCompletedPbl} (${(facts.pblCompletionRate * 100).toFixed(1)}%) completed PBL activities. 
Evidence was submitted by ${facts.schoolsWithEvidence} schools (${(facts.evidenceSubmissionRate * 100).toFixed(1)}%). 
Student attendance across PBL sessions stood at ${(facts.attendanceRate * 100).toFixed(1)}% (${facts.totalAttendance} of ${facts.totalEnrollment} enrolled students).

Finance Utilization:
${facts.budgetLines.map(b => `${b.budgetLine}: ${(b.utilizationRate * 100).toFixed(1)}% utilized (${b.cumulativeUtilized}/${b.approvedBudget} units). Note: ${b.financeNote}.`).join('\n')}

Risk & Next Steps:
Overall program status is ${facts.riskStatus}. Milestone status: ${facts.milestoneSummary}. 
Report status: ${facts.reportStatus}. 
Focus areas: evidence submission and attendance rates require follow-up across covered districts.
  `.trim();
};

const buildFallbackReview = (insights) => {
    const { month, kpi, priorityDistricts } = insights;
    return `
PROGRAM REVIEW SUMMARY — ${month}

ACHIEVEMENTS:
- ${kpi.participating} of ${kpi.totalSchools} schools participated in PBL (${(kpi.participationRate * 100).toFixed(1)}%).
- ${kpi.withEvidence} schools submitted evidence (${(kpi.evidenceRate * 100).toFixed(1)}%).
- ${kpi.riskDistribution['On Track']} schools are On Track.

GAPS & RISKS:
- Overall attendance rate is ${(kpi.attendanceRate * 100).toFixed(1)}% — status: ${kpi.riskStatus}.
- ${kpi.riskDistribution['Critical']} schools are Critical, ${kpi.riskDistribution['At Risk']} are At Risk.

PRIORITY GEOGRAPHIES:
${priorityDistricts.map(d => `- ${d.district}: ${d.riskStatus} (Attendance: ${(d.attendanceRate * 100).toFixed(1)}%)`).join('\n') || '- No priority districts identified.'}

DISCUSSION POINTS:
- What is driving the low attendance rate in critical schools?
- Which blocks need immediate field visits this month?
- How can evidence submission be improved before the next reporting cycle?
  `.trim();
};