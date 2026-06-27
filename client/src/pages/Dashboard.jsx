import { useState, useEffect } from 'react';
import FilterBar from '../components/filters/FilterBar';
import KPICard from '../components/dashboard/KPICard';
import RiskBadge from '../components/dashboard/RiskBadge';
import { fetchDashboard, fetchMoM, fetchFilterOptions } from '../services/api';
import { formatPct, formatNumber, safeAttendanceRate } from '../utils/riskEngine';

const MONTH_MAP = {
    '2025-07': null,
    '2025-08': '2025-07',
    '2025-09': '2025-08',
};

const Dashboard = () => {
    const [filters, setFilters] = useState({ month: '2025-09' });
    const [options, setOptions] = useState({});
    const [kpi, setKpi] = useState(null);
    const [mom, setMom] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load filter options once on mount
    useEffect(() => {
        fetchFilterOptions()
            .then((res) => setOptions(res.data.data))
            .catch((err) => console.error('Filter options error:', err));
    }, []);

    // Load KPI + MoM whenever filters change
    useEffect(() => {
        let cancelled = false;

        const loadData = async () => {
            setLoading(true);
            setError(null);

            try {
                const previousMonth = filters.month ? MONTH_MAP[filters.month] : null;

                const [kpiRes, momRes] = await Promise.all([
                    fetchDashboard(filters),
                    filters.month && previousMonth
                        ? fetchMoM({
                            current: filters.month,
                            previous: previousMonth,
                            district: filters.district,
                            block: filters.block,
                            grade: filters.grade,
                            subject: filters.subject,
                        })
                        : Promise.resolve(null),
                ]);

                if (!cancelled) {
                    setKpi(kpiRes.data.data);
                    setMom(momRes?.data?.data?.mom || null);
                }
            } catch (err) {
                if (!cancelled) {
                    setError('Failed to load dashboard data. Please try again.');
                    console.error(err);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadData();

        // Cleanup — if filters change before fetch completes, ignore stale response
        return () => { cancelled = true; };
    }, [filters]);

    const handleFilterChange = (key, value) => {
        if (key === '__clear__') {
            setFilters({ month: '2025-09' });
            return;
        }
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const attendanceRate = safeAttendanceRate(kpi?.attendanceRate);

    const kpiCards = kpi ? [
        {
            title: 'Total Schools',
            value: formatNumber(kpi.totalSchools),
            subtitle: 'Schools in selected scope',
            icon: '🏫',
            color: '#4f46e5',
            mom: null,
        },
        {
            title: 'Participating Schools',
            value: formatNumber(kpi.participating),
            subtitle: `${formatPct(kpi.participationRate)} participation rate`,
            icon: '✅',
            color: '#10b981',
            mom: mom?.participationRate,
        },
        {
            title: 'Evidence Submitted',
            value: formatNumber(kpi.withEvidence),
            subtitle: `${formatPct(kpi.evidenceRate)} evidence rate`,
            icon: '📎',
            color: '#f59e0b',
            mom: mom?.evidenceRate,
        },
        {
            title: 'Total Enrollment',
            value: formatNumber(kpi.totalEnrollment),
            subtitle: 'Students enrolled across Classes 6–8',
            icon: '👥',
            color: '#6366f1',
            mom: null,
        },
        {
            title: 'Total Attendance',
            value: formatNumber(kpi.totalAttendance),
            subtitle: 'Attendance across PBL sessions',
            icon: '📅',
            color: '#0ea5e9',
            mom: null,
        },
        {
            title: 'Attendance Rate',
            value: formatPct(attendanceRate),
            subtitle: 'Overall PBL session attendance',
            icon: '📈',
            color: '#8b5cf6',
            mom: mom?.attendanceRate,
        },
    ] : [];

    return (
        <div>
            {/* Filter Bar */}
            <FilterBar
                filters={filters}
                options={options}
                onChange={handleFilterChange}
                loading={loading}
            />

            {/* Error */}
            {error && <div style={styles.error}>{error}</div>}

            {/* Loading */}
            {loading && <div style={styles.loadingBar}>Loading dashboard data...</div>}

            {/* KPI Cards */}
            {kpi && (
                <>
                    {kpiCards.length > 0 && (
                        <div style={styles.kpiGrid}>
                            {kpiCards.map((card) => (
                                <KPICard key={card.title} {...card} />
                            ))}
                        </div>
                    )}

                    {/* Risk Distribution */}
                    <div style={styles.riskSection}>
                        <div style={styles.sectionTitle}>Risk Distribution</div>
                        <div style={styles.riskGrid}>
                            {Object.entries(kpi.riskDistribution).map(([status, count]) => (
                                <div key={status} style={styles.riskCard}>
                                    <div style={styles.riskCount}>{count}</div>
                                    <RiskBadge status={status} size="md" />
                                    <div style={styles.riskSub}>
                                        {formatPct(count / kpi.totalSchools)} of schools
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Overall Status */}
                    <div style={styles.statusSection}>
                        <div style={styles.sectionTitle}>Overall Program Status</div>
                        <div style={styles.statusCard}>
                            <div style={styles.statusLeft}>
                                <div style={styles.statusLabel}>
                                    Based on attendance rate of {formatPct(attendanceRate)}
                                </div>
                                <div style={styles.statusSub}>
                                    {kpi.participating} of {kpi.totalSchools} schools participated •{' '}
                                    {kpi.withEvidence} submitted evidence
                                </div>
                            </div>
                            <RiskBadge status={kpi.riskStatus} size="lg" />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const styles = {
    kpiGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
    },
    riskSection: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
    },
    sectionTitle: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#1a1a2e',
        marginBottom: '16px',
    },
    riskGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
    },
    riskCard: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderRadius: '10px',
        border: '1px solid #e5e7eb',
    },
    riskCount: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#1a1a2e',
    },
    riskSub: {
        fontSize: '11px',
        color: '#6b7280',
    },
    statusSection: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px',
    },
    statusCard: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderRadius: '10px',
        border: '1px solid #e5e7eb',
    },
    statusLeft: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    statusLabel: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#1a1a2e',
    },
    statusSub: {
        fontSize: '12px',
        color: '#6b7280',
    },
    loadingBar: {
        backgroundColor: '#eff6ff',
        color: '#3b82f6',
        padding: '12px 16px',
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

export default Dashboard;