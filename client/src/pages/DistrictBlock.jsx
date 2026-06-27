import { useState, useEffect } from 'react';
import FilterBar from '../components/filters/FilterBar';
import RiskBadge from '../components/dashboard/RiskBadge';
import { fetchDistricts, fetchBlocks, fetchFilterOptions } from '../services/api';
import { formatPct, formatNumber } from '../utils/riskEngine';

const DistrictBlock = () => {
    const [filters, setFilters] = useState({ month: '2025-09' });
    const [options, setOptions] = useState({});
    const [districts, setDistricts] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [activeTab, setActiveTab] = useState('districts');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load filter options once
    useEffect(() => {
        fetchFilterOptions()
            .then((res) => setOptions(res.data.data))
            .catch((err) => console.error('Filter options error:', err));
    }, []);

    // Load districts + blocks whenever filters change
    useEffect(() => {
        let cancelled = false;

        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [distRes, blockRes] = await Promise.all([
                    fetchDistricts(filters),
                    fetchBlocks(filters),
                ]);

                if (!cancelled) {
                    setDistricts(distRes.data.data.all);
                    setBlocks(blockRes.data.data.all);
                }
            } catch (err) {
                if (!cancelled) {
                    setError('Failed to load district data. Please try again.');
                    console.error(err);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadData();
        return () => { cancelled = true; };
    }, [filters]);

    const handleFilterChange = (key, value) => {
        if (key === '__clear__') {
            setFilters({ month: '2025-09' });
            return;
        }
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const highDistricts = districts.filter((d) => !d.needsFollowUp);
    const lowDistricts = districts.filter((d) => d.needsFollowUp);
    const highBlocks = blocks.filter((b) => !b.needsFollowUp);
    const lowBlocks = blocks.filter((b) => b.needsFollowUp);

    const renderTable = (rows, type) => {
        if (rows.length === 0) {
            return <div style={styles.empty}>No {type} found for selected filters.</div>;
        }

        return (
            <table style={styles.table}>
                <thead>
                    <tr style={styles.thead}>
                        <th style={styles.th}>{type === 'districts' ? 'District' : 'Block'}</th>
                        {type === 'blocks' && <th style={styles.th}>District</th>}
                        <th style={styles.th}>Schools</th>
                        <th style={styles.th}>Participating</th>
                        <th style={styles.th}>Part. Rate</th>
                        <th style={styles.th}>Evidence Rate</th>
                        <th style={styles.th}>Attendance Rate</th>
                        <th style={styles.th}>Enrollment</th>
                        <th style={styles.th}>Risk Status</th>
                        <th style={styles.th}>Follow-up</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, idx) => (
                        <tr
                            key={idx}
                            style={{
                                ...styles.tr,
                                backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                            }}
                        >
                            <td style={styles.td}>
                                <div style={styles.nameCell}>
                                    {type === 'blocks' ? row.block : row.district}
                                </div>
                            </td>
                            {type === 'blocks' && (
                                <td style={styles.td}>
                                    <div style={styles.districtTag}>{row.district}</div>
                                </td>
                            )}
                            <td style={styles.td}>{formatNumber(row.totalSchools)}</td>
                            <td style={styles.td}>{formatNumber(row.participating)}</td>
                            <td style={styles.td}>{formatPct(row.participationRate)}</td>
                            <td style={styles.td}>{formatPct(row.evidenceRate)}</td>
                            <td style={styles.td}>
                                <div style={styles.rateCell}>
                                    <div style={styles.rateBar}>
                                        <div
                                            style={{
                                                ...styles.rateBarFill,
                                                width: `${Math.min(row.attendanceRate * 100, 100)}%`,
                                                backgroundColor: row.needsFollowUp ? '#ef4444' : '#10b981',
                                            }}
                                        />
                                    </div>
                                    <span>{formatPct(Math.min(row.attendanceRate, 1))}</span>
                                </div>
                            </td>
                            <td style={styles.td}>{formatNumber(row.totalEnrollment)}</td>
                            <td style={styles.td}>
                                <RiskBadge status={row.riskStatus} size="sm" />
                            </td>
                            <td style={styles.td}>
                                {row.needsFollowUp ? (
                                    <span style={styles.flagYes}>⚑ Yes</span>
                                ) : (
                                    <span style={styles.flagNo}>✓ No</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    const currentRows = activeTab === 'districts' ? districts : blocks;
    const currentHigh = activeTab === 'districts' ? highDistricts : highBlocks;
    const currentLow = activeTab === 'districts' ? lowDistricts : lowBlocks;

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

            {/* Summary Cards */}
            {!loading && currentRows.length > 0 && (
                <div style={styles.summaryGrid}>
                    {[
                        {
                            label: 'Total',
                            value: currentRows.length,
                            color: '#4f46e5',
                            bg: '#ede9fe',
                        },
                        {
                            label: 'Performing Well',
                            value: currentHigh.length,
                            color: '#10b981',
                            bg: '#d1fae5',
                        },
                        {
                            label: 'Need Follow-up',
                            value: currentLow.length,
                            color: '#ef4444',
                            bg: '#fee2e2',
                        },
                    ].map((s) => (
                        <div key={s.label} style={{ ...styles.summaryCard, backgroundColor: s.bg }}>
                            <div style={{ ...styles.summaryValue, color: s.color }}>{s.value}</div>
                            <div style={{ ...styles.summaryLabel, color: s.color }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tabs */}
            <div style={styles.tabRow}>
                {['districts', 'blocks'].map((tab) => (
                    <button
                        key={tab}
                        style={{
                            ...styles.tab,
                            ...(activeTab === tab ? styles.tabActive : {}),
                        }}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'districts' ? '🗺️ Districts' : '📍 Blocks'}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {loading && <div style={styles.loadingBar}>Loading data...</div>}

            {/* Follow-up Section */}
            {!loading && currentLow.length > 0 && (
                <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <div style={styles.sectionTitle}>⚑ Needs Follow-up ({currentLow.length})</div>
                        <div style={styles.sectionSub}>
                            Attendance below 60% — requires active intervention
                        </div>
                    </div>
                    <div style={styles.tableWrapper}>
                        {renderTable(currentLow, activeTab)}
                    </div>
                </div>
            )}

            {/* Performing Well Section */}
            {!loading && currentHigh.length > 0 && (
                <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <div style={styles.sectionTitle}>✓ Performing Well ({currentHigh.length})</div>
                        <div style={styles.sectionSub}>
                            Attendance at or above 60%
                        </div>
                    </div>
                    <div style={styles.tableWrapper}>
                        {renderTable(currentHigh, activeTab)}
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    summaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '24px',
    },
    summaryCard: {
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    summaryValue: {
        fontSize: '32px',
        fontWeight: '700',
    },
    summaryLabel: {
        fontSize: '13px',
        fontWeight: '600',
    },
    tabRow: {
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
    },
    tab: {
        padding: '8px 20px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '600',
        backgroundColor: '#f3f4f6',
        color: '#6b7280',
        border: '1.5px solid #e5e7eb',
        cursor: 'pointer',
    },
    tabActive: {
        backgroundColor: '#4f46e5',
        color: '#ffffff',
        borderColor: '#4f46e5',
    },
    section: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        marginBottom: '24px',
        overflow: 'hidden',
    },
    sectionHeader: {
        padding: '16px 20px',
        borderBottom: '1px solid #e5e7eb',
    },
    sectionTitle: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#1a1a2e',
    },
    sectionSub: {
        fontSize: '12px',
        color: '#6b7280',
        marginTop: '2px',
    },
    tableWrapper: {
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    thead: {
        backgroundColor: '#f9fafb',
    },
    th: {
        padding: '10px 16px',
        textAlign: 'left',
        fontSize: '11px',
        fontWeight: '700',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: '1px solid #e5e7eb',
        whiteSpace: 'nowrap',
    },
    tr: {
        borderBottom: '1px solid #f3f4f6',
    },
    td: {
        padding: '12px 16px',
        fontSize: '13px',
        color: '#374151',
        whiteSpace: 'nowrap',
    },
    nameCell: {
        fontWeight: '600',
        color: '#1a1a2e',
    },
    districtTag: {
        fontSize: '11px',
        color: '#6b7280',
        backgroundColor: '#f3f4f6',
        padding: '2px 8px',
        borderRadius: '4px',
        display: 'inline-block',
    },
    rateCell: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    rateBar: {
        width: '60px',
        height: '6px',
        backgroundColor: '#e5e7eb',
        borderRadius: '3px',
        overflow: 'hidden',
    },
    rateBarFill: {
        height: '100%',
        borderRadius: '3px',
        transition: 'width 0.3s ease',
    },
    flagYes: {
        color: '#ef4444',
        fontWeight: '600',
        fontSize: '12px',
    },
    flagNo: {
        color: '#10b981',
        fontWeight: '600',
        fontSize: '12px',
    },
    empty: {
        padding: '32px',
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: '13px',
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

export default DistrictBlock;