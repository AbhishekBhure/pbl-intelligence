import { useState, useEffect } from 'react';
import RiskBadge from '../components/dashboard/RiskBadge';
import { fetchGrants, fetchGrantDetail, generateNarrative } from '../services/api';
import { formatPct, formatNumber } from '../utils/riskEngine';

const GrantReporting = () => {
    const [grants, setGrants] = useState([]);
    const [selectedGrant, setSelectedGrant] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState('2025-09');
    const [detail, setDetail] = useState(null);
    const [narrative, setNarrative] = useState(null);
    const [loading, setLoading] = useState(false);
    const [narrativeLoading, setNarrativeLoading] = useState(false);
    const [error, setError] = useState(null);

    const MONTHS = ['2025-07', '2025-08', '2025-09'];

    // Load all grants on mount
    useEffect(() => {
        fetchGrants()
            .then((res) => {
                const list = res.data.data;
                setGrants(list);
                if (list.length > 0) setSelectedGrant(list[0]._id);
            })
            .catch((err) => console.error('Grants list error:', err));
    }, []);

    // Load grant detail whenever grant or month changes
    useEffect(() => {
        if (!selectedGrant) return;
        let cancelled = false;

        const loadDetail = async () => {
            setLoading(true);
            setError(null);
            setDetail(null);
            setNarrative(null);
            try {
                const res = await fetchGrantDetail(selectedGrant, selectedMonth);
                if (!cancelled) setDetail(res.data.data);
            } catch (err) {
                if (!cancelled) setError('Failed to load grant detail.');
                console.error(err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadDetail();
        return () => { cancelled = true; };
    }, [selectedGrant, selectedMonth]);

    const handleGenerateNarrative = async () => {
        setNarrativeLoading(true);
        setNarrative(null);
        try {
            const res = await generateNarrative(selectedGrant, selectedMonth);
            setNarrative(res.data.data);
        } catch (err) {
            console.error('Narrative error:', err);
        } finally {
            setNarrativeLoading(false);
        }
    };

    const perf = detail?.performance;
    const profile = detail?.profile;
    const media = detail?.media || [];

    return (
        <div>
            {/* Selector Bar */}
            <div style={styles.selectorBar}>
                <div style={styles.selectorRow}>
                    {/* Grant Selector */}
                    <div style={styles.selectorGroup}>
                        <div style={styles.selectorLabel}>Grant</div>
                        <div style={styles.grantBtns}>
                            {grants.map((g) => (
                                <button
                                    key={g._id}
                                    style={{
                                        ...styles.grantBtn,
                                        ...(selectedGrant === g._id ? styles.grantBtnActive : {}),
                                    }}
                                    onClick={() => setSelectedGrant(g._id)}
                                >
                                    <div style={styles.grantBtnName}>{g.grantName}</div>
                                    <div style={styles.grantBtnDonor}>{g.donor}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Month Selector */}
                    <div style={styles.selectorGroup}>
                        <div style={styles.selectorLabel}>Reporting Month</div>
                        <div style={styles.monthBtns}>
                            {MONTHS.map((m) => (
                                <button
                                    key={m}
                                    style={{
                                        ...styles.monthBtn,
                                        ...(selectedMonth === m ? styles.monthBtnActive : {}),
                                    }}
                                    onClick={() => setSelectedMonth(m)}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && <div style={styles.error}>{error}</div>}

            {/* Loading */}
            {loading && (
                <div style={styles.loadingBox}>
                    ⏳ Loading grant data for {selectedGrant} — {selectedMonth}...
                </div>
            )}

            {/* Grant Detail */}
            {!loading && detail && (
                <>
                    {/* Performance Metrics */}
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <div style={styles.cardTitle}>📊 Performance Metrics</div>
                            <RiskBadge status={perf?.riskStatus} size="md" />
                        </div>
                        <div style={styles.metricsGrid}>
                            {[
                                {
                                    label: 'Sampled Schools',
                                    value: formatNumber(perf?.sampledSchools),
                                },
                                {
                                    label: 'PBL Completion',
                                    value: `${formatNumber(perf?.schoolsCompletedPbl)} schools`,
                                    sub: formatPct(perf?.pblCompletionRate),
                                },
                                {
                                    label: 'Evidence Submitted',
                                    value: `${formatNumber(perf?.schoolsWithEvidence)} schools`,
                                    sub: formatPct(perf?.evidenceSubmissionRate),
                                },
                                {
                                    label: 'Total Enrollment',
                                    value: formatNumber(perf?.totalEnrollment),
                                },
                                {
                                    label: 'Total Attendance',
                                    value: formatNumber(perf?.totalAttendance),
                                    sub: formatPct(Math.min(perf?.attendanceRate || 0, 1)),
                                },
                                {
                                    label: 'Report Status',
                                    value: perf?.reportStatus,
                                },
                            ].map((item) => (
                                <div key={item.label} style={styles.metricItem}>
                                    <div style={styles.metricLabel}>{item.label}</div>
                                    <div style={styles.metricValue}>{item.value}</div>
                                    {item.sub && <div style={styles.metricSub}>{item.sub}</div>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Covered Districts */}
                    <div style={styles.card}>
                        <div style={styles.cardTitle}>🗺️ Covered Districts</div>
                        <div style={styles.districtTags}>
                            {perf?.coveredDistricts?.map((d) => (
                                <span key={d} style={styles.districtTag}>{d}</span>
                            ))}
                        </div>
                    </div>

                    {/* Milestones */}
                    <div style={styles.card}>
                        <div style={styles.cardTitle}>🎯 Milestone Summary</div>
                        <div style={styles.milestoneList}>
                            {perf?.milestoneSummary?.split('|').map((m, i) => (
                                <div key={i} style={styles.milestoneItem}>
                                    <span style={styles.milestoneDot}>●</span>
                                    <span style={styles.milestoneText}>{m.trim()}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Finance Utilization */}
                    <div style={styles.card}>
                        <div style={styles.cardTitle}>💰 Finance Utilization</div>
                        <div style={styles.financeList}>
                            {profile?.budgetLines?.map((line, idx) => (
                                <div key={idx} style={styles.financeItem}>
                                    <div style={styles.financeTop}>
                                        <div style={styles.financeName}>{line.budgetLine}</div>
                                        <div style={styles.financeStats}>
                                            <span style={styles.financeNote}>{line.financeNote}</span>
                                            <span style={styles.financePct}>
                                                {formatPct(line.utilizationRate)}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={styles.financeBarBg}>
                                        <div
                                            style={{
                                                ...styles.financeBarFill,
                                                width: `${Math.min(line.utilizationRate * 100, 100)}%`,
                                                backgroundColor:
                                                    line.utilizationRate >= 0.75 ? '#10b981' :
                                                        line.utilizationRate >= 0.60 ? '#f59e0b' : '#ef4444',
                                            }}
                                        />
                                    </div>
                                    <div style={styles.financeUnits}>
                                        {line.cumulativeUtilized} / {line.approvedBudget} units utilized
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Media Evidence */}
                    {media.length > 0 && (
                        <div style={styles.card}>
                            <div style={styles.cardTitle}>🖼️ Linked Evidence & Media</div>
                            <div style={styles.mediaGrid}>
                                {media.map((m) => (
                                    <div key={m.recordId} style={styles.mediaItem}>
                                        <div style={styles.mediaType}>
                                            {m.recordType === 'image' ? '🖼️ Image' : '📰 News Clipping'}
                                        </div>
                                        <div style={styles.mediaTitle}>{m.title}</div>
                                        <div style={styles.mediaSummary}>{m.summary}</div>
                                        <div style={styles.mediaFile}>{m.fileName}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Generate Narrative Button */}
                    <div style={styles.narrativeSection}>
                        <button
                            style={{
                                ...styles.generateBtn,
                                opacity: narrativeLoading ? 0.7 : 1,
                            }}
                            onClick={handleGenerateNarrative}
                            disabled={narrativeLoading}
                        >
                            {narrativeLoading ? '⏳ Generating...' : '✨ Generate Grant Report Section'}
                        </button>
                    </div>

                    {/* Narrative Output */}
                    {narrative && (
                        <div style={styles.card}>
                            <div style={styles.cardHeader}>
                                <div style={styles.cardTitle}>📄 Grant Report Section</div>
                                <div style={{
                                    ...styles.sourceBadge,
                                    backgroundColor: narrative.narrative?.source === 'gemini'
                                        ? '#d1fae5' : '#fef3c7',
                                    color: narrative.narrative?.source === 'gemini'
                                        ? '#065f46' : '#92400e',
                                }}>
                                    {narrative.narrative?.source === 'gemini'
                                        ? '✨ AI Generated' : '⚙️ Deterministic Fallback'}
                                </div>
                            </div>

                            {/* Facts Used */}
                            <div style={styles.factsBox}>
                                <div style={styles.factsTitle}>📌 Facts Used to Generate This Report</div>
                                <div style={styles.factsGrid}>
                                    {[
                                        { label: 'PBL Completion', value: formatPct(narrative.facts?.pblCompletionRate) },
                                        { label: 'Evidence Rate', value: formatPct(narrative.facts?.evidenceSubmissionRate) },
                                        { label: 'Attendance Rate', value: formatPct(Math.min(narrative.facts?.attendanceRate || 0, 1)) },
                                        { label: 'Total Enrollment', value: formatNumber(narrative.facts?.totalEnrollment) },
                                        { label: 'Risk Status', value: narrative.facts?.riskStatus },
                                        { label: 'Report Status', value: narrative.facts?.reportStatus },
                                    ].map((f) => (
                                        <div key={f.label} style={styles.factItem}>
                                            <div style={styles.factLabel}>{f.label}</div>
                                            <div style={styles.factValue}>{f.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Narrative Text */}
                            <div style={styles.narrativeText}>
                                {narrative.narrative?.narrative
                                    ?.split('\n')
                                    .map((line, i) => {
                                        const cleaned = line.replace(/\*\*(.*?)\*\*/g, '$1');
                                        return (
                                            <p key={i} style={{
                                                margin: cleaned.trim() === '' ? '8px 0' : '0 0 12px 0',
                                                fontWeight: cleaned !== line ? '700' : '400',
                                            }}>
                                                {cleaned}
                                            </p>
                                        );
                                    })}
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
        padding: '20px',
        marginBottom: '24px',
    },
    selectorRow: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    selectorGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    selectorLabel: {
        fontSize: '11px',
        fontWeight: '700',
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
    },
    grantBtns: {
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
    },
    grantBtn: {
        padding: '10px 16px',
        borderRadius: '10px',
        border: '1.5px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        cursor: 'pointer',
        textAlign: 'left',
    },
    grantBtnActive: {
        backgroundColor: '#ede9fe',
        borderColor: '#4f46e5',
    },
    grantBtnName: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#1a1a2e',
    },
    grantBtnDonor: {
        fontSize: '11px',
        color: '#6b7280',
        marginTop: '2px',
    },
    monthBtns: {
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
    card: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
    },
    cardTitle: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#1a1a2e',
        marginBottom: '16px',
    },
    metricsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '12px',
    },
    metricItem: {
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        padding: '12px',
        border: '1px solid #e5e7eb',
    },
    metricLabel: {
        fontSize: '11px',
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        marginBottom: '6px',
    },
    metricValue: {
        fontSize: '15px',
        fontWeight: '700',
        color: '#1a1a2e',
    },
    metricSub: {
        fontSize: '12px',
        color: '#4f46e5',
        fontWeight: '600',
        marginTop: '2px',
    },
    districtTags: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
    },
    districtTag: {
        backgroundColor: '#ede9fe',
        color: '#4f46e5',
        fontSize: '12px',
        fontWeight: '600',
        padding: '4px 12px',
        borderRadius: '20px',
    },
    milestoneList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    milestoneItem: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '10px 14px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
    },
    milestoneDot: {
        color: '#4f46e5',
        fontSize: '8px',
        marginTop: '4px',
        flexShrink: 0,
    },
    milestoneText: {
        fontSize: '13px',
        color: '#374151',
    },
    financeList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    financeItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    financeTop: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    financeName: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#1a1a2e',
    },
    financeStats: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    financeNote: {
        fontSize: '11px',
        color: '#6b7280',
        backgroundColor: '#f3f4f6',
        padding: '2px 8px',
        borderRadius: '4px',
    },
    financePct: {
        fontSize: '13px',
        fontWeight: '700',
        color: '#1a1a2e',
    },
    financeBarBg: {
        height: '8px',
        backgroundColor: '#e5e7eb',
        borderRadius: '4px',
        overflow: 'hidden',
    },
    financeBarFill: {
        height: '100%',
        borderRadius: '4px',
        transition: 'width 0.4s ease',
    },
    financeUnits: {
        fontSize: '11px',
        color: '#9ca3af',
    },
    mediaGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '12px',
    },
    mediaItem: {
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        padding: '14px',
        border: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    mediaType: {
        fontSize: '11px',
        fontWeight: '700',
        color: '#6b7280',
        textTransform: 'uppercase',
    },
    mediaTitle: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#1a1a2e',
    },
    mediaSummary: {
        fontSize: '12px',
        color: '#6b7280',
        lineHeight: '1.5',
    },
    mediaFile: {
        fontSize: '11px',
        color: '#9ca3af',
        fontFamily: 'monospace',
    },
    narrativeSection: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '20px',
    },
    generateBtn: {
        padding: '12px 32px',
        borderRadius: '10px',
        backgroundColor: '#4f46e5',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '700',
        cursor: 'pointer',
        border: 'none',
        boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
    },
    sourceBadge: {
        fontSize: '11px',
        fontWeight: '600',
        padding: '4px 12px',
        borderRadius: '20px',
    },
    factsBox: {
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '14px',
        marginBottom: '16px',
    },
    factsTitle: {
        fontSize: '12px',
        fontWeight: '700',
        color: '#6b7280',
        marginBottom: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
    },
    factsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '10px',
    },
    factItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    factLabel: {
        fontSize: '11px',
        color: '#9ca3af',
        fontWeight: '600',
    },
    factValue: {
        fontSize: '13px',
        fontWeight: '700',
        color: '#1a1a2e',
    },
    narrativeText: {
        fontSize: '14px',
        color: '#374151',
        lineHeight: '1.8',
        whiteSpace: 'pre-wrap',
        borderTop: '1px solid #e5e7eb',
        paddingTop: '16px',
    },
    loadingBox: {
        backgroundColor: '#eff6ff',
        color: '#3b82f6',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '500',
        marginBottom: '16px',
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

export default GrantReporting;