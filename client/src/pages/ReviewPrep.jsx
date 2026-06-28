import { useState, useEffect } from 'react';
import RiskBadge from '../components/dashboard/RiskBadge';
import { fetchReviewSummary, fetchFilterOptions } from '../services/api';
import { formatPct, formatNumber, safeAttendanceRate } from '../utils/riskEngine';

const MONTH_OPTIONS = ['2025-07', '2025-08', '2025-09'];

const ReviewPrep = () => {
    const [month, setMonth] = useState('2025-09');
    const [options, setOptions] = useState({});
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load filter options once
    useEffect(() => {
        fetchFilterOptions()
            .then((res) => setOptions(res.data.data))
            .catch((err) => console.error('Filter options error:', err));
    }, []);

    // Load review summary whenever month changes
    useEffect(() => {
        let cancelled = false;

        const loadData = async () => {
            setLoading(true);
            setError(null);
            setData(null);
            try {
                const res = await fetchReviewSummary({ month });
                if (!cancelled) setData(res.data.data);
            } catch (err) {
                if (!cancelled) setError('Failed to load review summary.');
                console.error(err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadData();
        return () => { cancelled = true; };
    }, [month]);

    const insights = data?.insights;
    const narrative = data?.narrative;
    const kpi = insights?.kpi;
    const mom = insights?.mom;
    const riskDetail = insights?.riskDetail;

    const attendanceRate = safeAttendanceRate(kpi?.attendanceRate);

    // Parse narrative sections
    const parseSections = (text) => {
        if (!text) return [];
        const sectionKeys = ['ACHIEVEMENTS', 'GAPS & RISKS', 'PRIORITY GEOGRAPHIES', 'DISCUSSION POINTS'];
        const sections = [];

        sectionKeys.forEach((key, idx) => {
            const start = text.indexOf(key + ':');
            if (start === -1) return;
            const end = sectionKeys
                .slice(idx + 1)
                .map((k) => text.indexOf(k + ':'))
                .filter((i) => i !== -1)
                .sort((a, b) => a - b)[0];

            const content = end !== undefined
                ? text.slice(start + key.length + 1, end).trim()
                : text.slice(start + key.length + 1).trim();

            sections.push({ title: key, content });
        });

        return sections;
    };

    const sections = parseSections(narrative?.narrative);

    const sectionIcons = {
        'ACHIEVEMENTS': { icon: '✅', color: '#10b981', bg: '#d1fae5' },
        'GAPS & RISKS': { icon: '⚠️', color: '#f97316', bg: '#ffedd5' },
        'PRIORITY GEOGRAPHIES': { icon: '⚑', color: '#ef4444', bg: '#fee2e2' },
        'DISCUSSION POINTS': { icon: '💬', color: '#4f46e5', bg: '#ede9fe' },
    };

    return (
        <div>
            {/* Month Selector */}
            <div style={styles.selectorBar}>
                <div style={styles.selectorLabel}>Select Reporting Month</div>
                <div style={styles.monthRow}>
                    {MONTH_OPTIONS.map((m) => (
                        <button
                            key={m}
                            style={{
                                ...styles.monthBtn,
                                ...(month === m ? styles.monthBtnActive : {}),
                            }}
                            onClick={() => setMonth(m)}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error */}
            {error && <div style={styles.error}>{error}</div>}

            {/* Loading */}
            {loading && (
                <div style={styles.loadingBox}>
                    <div style={styles.loadingSpinner}>⏳</div>
                    <div>Generating review summary for {month}...</div>
                </div>
            )}

            {/* Content */}
            {!loading && data && (
                <>
                    {/* KPI Snapshot */}
                    <div style={styles.snapshotCard}>
                        <div style={styles.snapshotTitle}>
                            📊 Program Snapshot — {month}
                        </div>
                        <div style={styles.snapshotGrid}>
                            {[
                                {
                                    label: 'Total Schools',
                                    value: formatNumber(kpi?.totalSchools),
                                },
                                {
                                    label: 'Participating',
                                    value: `${formatNumber(kpi?.participating)} (${formatPct(kpi?.participationRate)})`,
                                },
                                {
                                    label: 'Evidence Submitted',
                                    value: `${formatNumber(kpi?.withEvidence)} (${formatPct(kpi?.evidenceRate)})`,
                                },
                                {
                                    label: 'Total Enrollment',
                                    value: formatNumber(kpi?.totalEnrollment),
                                },
                                {
                                    label: 'Attendance Rate',
                                    value: formatPct(attendanceRate),
                                },
                                {
                                    label: 'Overall Status',
                                    value: <RiskBadge status={kpi?.riskStatus} size="md" />,
                                },
                            ].map((item) => (
                                <div key={item.label} style={styles.snapshotItem}>
                                    <div style={styles.snapshotItemLabel}>{item.label}</div>
                                    <div style={styles.snapshotItemValue}>{item.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* MoM Movement */}
                    {mom && (
                        <div style={styles.momCard}>
                            <div style={styles.snapshotTitle}>📈 Month-over-Month Movement</div>
                            <div style={styles.momGrid}>
                                {[
                                    { label: 'Participation Rate', data: mom?.participationRate },
                                    { label: 'Evidence Rate', data: mom?.evidenceRate },
                                    { label: 'Attendance Rate', data: mom?.attendanceRate },
                                ].filter((item) => item.data && item.data.direction).map((item) => (
                                    <div key={item.label} style={styles.momItem}>
                                        <div style={styles.momLabel}>{item.label}</div>
                                        <div style={{
                                            ...styles.momValue,
                                            color: item.data.direction === 'up'
                                                ? '#10b981'
                                                : item.data.direction === 'down'
                                                    ? '#ef4444'
                                                    : '#6b7280',
                                        }}>
                                            {item.data.direction === 'up' ? '↑' : item.data.direction === 'down' ? '↓' : '→'}
                                            {' '}{Math.abs(item.data.deltaPct)}%
                                        </div>
                                        <div style={styles.momSub}>{item.data.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Risk Detail */}
                    {riskDetail && (
                        <div style={styles.riskDetailCard}>
                            <div style={styles.snapshotTitle}>🔍 Risk Detail by Indicator</div>
                            <div style={styles.riskDetailGrid}>
                                {Object.entries(riskDetail).map(([key, detail]) => (
                                    <div key={key} style={styles.riskDetailItem}>
                                        <div style={styles.riskDetailTop}>
                                            <div style={styles.riskDetailMetric}>{detail.explanation?.split(' is at')[0]}</div>
                                            <RiskBadge status={detail.status} size="sm" />
                                        </div>
                                        <div style={styles.riskDetailExplain}>{detail.explanation}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI / Fallback Narrative */}
                    <div style={styles.narrativeCard}>
                        <div style={styles.narrativeHeader}>
                            <div style={styles.snapshotTitle}>
                                📋 Review Summary
                            </div>
                            <div style={{
                                ...styles.sourceBadge,
                                backgroundColor: narrative?.source === 'gemini' ? '#d1fae5' : '#fef3c7',
                                color: narrative?.source === 'gemini' ? '#065f46' : '#92400e',
                            }}>
                                {narrative?.source === 'gemini' ? '✨ AI Generated' : '⚙️ Deterministic Fallback'}
                            </div>
                        </div>

                        {sections.length > 0 ? (
                            <div style={styles.sectionsGrid}>
                                {sections.map((section) => {
                                    const meta = sectionIcons[section.title] || { icon: '📌', color: '#6b7280', bg: '#f3f4f6' };
                                    return (
                                        <div key={section.title} style={{ ...styles.sectionCard, borderColor: meta.color }}>
                                            <div style={{ ...styles.sectionCardTitle, color: meta.color, backgroundColor: meta.bg }}>
                                                {meta.icon} {section.title}
                                            </div>
                                            <div style={styles.sectionCardContent}>
                                                {section.content.split('\n').filter(Boolean).map((line, i) => {
                                                    // Remove all markdown symbols
                                                    const cleaned = line
                                                        .replace(/\*\*(.*?)\*\*/g, '$1')  // bold
                                                        .replace(/^\*+\d*\.?\**$/, '')     // lone * or **2. etc
                                                        .replace(/^\*\s*/, '')             // leading *
                                                        .replace(/^-\s*/, '')              // leading -
                                                        .trim();

                                                    if (!cleaned) return null;

                                                    const isBullet = line.trimStart().startsWith('*') || line.trimStart().startsWith('-');

                                                    return (
                                                        <div key={i} style={styles.sectionLine}>
                                                            {isBullet ? `• ${cleaned}` : cleaned}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={styles.rawNarrative}>
                                {narrative?.narrative}
                            </div>
                        )}
                    </div>

                    {/* Priority Districts */}
                    {insights?.priorityDistricts?.length > 0 && (
                        <div style={styles.priorityCard}>
                            <div style={styles.snapshotTitle}>⚑ Priority Districts — Needs Immediate Follow-up</div>
                            <div style={styles.priorityList}>
                                {insights.priorityDistricts.map((d, idx) => (
                                    <div key={idx} style={styles.priorityItem}>
                                        <div style={styles.priorityLeft}>
                                            <div style={styles.priorityName}>{d.district}</div>
                                            <div style={styles.prioritySub}>
                                                {d.totalSchools} schools • {formatNumber(d.totalEnrollment)} enrolled
                                            </div>
                                        </div>
                                        <div style={styles.priorityRight}>
                                            <div style={styles.priorityStat}>
                                                Attendance: {formatPct(Math.min(d.attendanceRate, 1))}
                                            </div>
                                            <RiskBadge status={d.riskStatus} size="sm" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const styles = {
    selectorBar: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '24px',
    },
    selectorLabel: {
        fontSize: '11px',
        fontWeight: '700',
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '12px',
    },
    monthRow: {
        display: 'flex',
        gap: '8px',
    },
    monthBtn: {
        padding: '8px 20px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '600',
        backgroundColor: '#f3f4f6',
        color: '#6b7280',
        border: '1.5px solid #e5e7eb',
        cursor: 'pointer',
    },
    monthBtnActive: {
        backgroundColor: '#4f46e5',
        color: '#ffffff',
        borderColor: '#4f46e5',
    },
    snapshotCard: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
    },
    snapshotTitle: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#1a1a2e',
        marginBottom: '16px',
    },
    snapshotGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '12px',
    },
    snapshotItem: {
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        padding: '12px',
        border: '1px solid #e5e7eb',
    },
    snapshotItemLabel: {
        fontSize: '11px',
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: '6px',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
    },
    snapshotItemValue: {
        fontSize: '15px',
        fontWeight: '700',
        color: '#1a1a2e',
    },
    momCard: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
    },
    momGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
    },
    momItem: {
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        padding: '16px',
        border: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    momLabel: {
        fontSize: '11px',
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
    },
    momValue: {
        fontSize: '24px',
        fontWeight: '700',
    },
    momSub: {
        fontSize: '11px',
        color: '#9ca3af',
    },
    riskDetailCard: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
    },
    riskDetailGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    riskDetailItem: {
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        padding: '14px',
        border: '1px solid #e5e7eb',
    },
    riskDetailTop: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '6px',
    },
    riskDetailMetric: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#1a1a2e',
    },
    riskDetailExplain: {
        fontSize: '12px',
        color: '#6b7280',
    },
    narrativeCard: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
    },
    narrativeHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
    },
    sourceBadge: {
        fontSize: '11px',
        fontWeight: '600',
        padding: '4px 12px',
        borderRadius: '20px',
    },
    sectionsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px',
    },
    sectionCard: {
        borderRadius: '10px',
        border: '1.5px solid',
        overflow: 'hidden',
    },
    sectionCardTitle: {
        padding: '10px 14px',
        fontSize: '12px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    sectionCardContent: {
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    sectionLine: {
        fontSize: '13px',
        color: '#374151',
        lineHeight: '1.5',
    },
    rawNarrative: {
        fontSize: '13px',
        color: '#374151',
        lineHeight: '1.7',
        whiteSpace: 'pre-wrap',
    },
    priorityCard: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
    },
    priorityList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    priorityItem: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px',
        backgroundColor: '#fff5f5',
        borderRadius: '8px',
        border: '1px solid #fecaca',
    },
    priorityLeft: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    priorityName: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#1a1a2e',
    },
    prioritySub: {
        fontSize: '12px',
        color: '#6b7280',
    },
    priorityRight: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '6px',
    },
    priorityStat: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#374151',
    },
    loadingBox: {
        backgroundColor: '#eff6ff',
        color: '#3b82f6',
        padding: '24px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
    },
    loadingSpinner: {
        fontSize: '24px',
    },
    error: {
        backgroundColor: '#fee2e2',
        color: '#dc2626',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '500',
        marginBottom: '16px',
    },
};

export default ReviewPrep;