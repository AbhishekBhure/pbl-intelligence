// ─── Thresholds ───────────────────────────────────────────────────────────────
export const THRESHOLDS = {
    ON_TRACK: 0.75,
    BEHIND: 0.60,
    AT_RISK: 0.35,
};

// ─── Classify a rate into a risk status ──────────────────────────────────────
export const classifyRisk = (rate) => {
    if (rate >= THRESHOLDS.ON_TRACK) return 'On Track';
    if (rate >= THRESHOLDS.BEHIND) return 'Behind';
    if (rate >= THRESHOLDS.AT_RISK) return 'At Risk';
    return 'Critical';
};

// ─── Get color for a risk status ─────────────────────────────────────────────
export const getRiskColor = (status) => {
    const colors = {
        'On Track': '#10b981',
        'Behind': '#f59e0b',
        'At Risk': '#f97316',
        'Critical': '#ef4444',
    };
    return colors[status] || '#6b7280';
};

// ─── Get background color (light) for a risk status ──────────────────────────
export const getRiskBgColor = (status) => {
    const colors = {
        'On Track': '#d1fae5',
        'Behind': '#fef3c7',
        'At Risk': '#ffedd5',
        'Critical': '#fee2e2',
    };
    return colors[status] || '#f3f4f6';
};

// ─── Format a rate (0–1) as a percentage string ───────────────────────────────
export const formatPct = (rate) => {
    if (rate === null || rate === undefined) return '—';
    return `${(rate * 100).toFixed(1)}%`;
};

// ─── Format large numbers with commas ────────────────────────────────────────
export const formatNumber = (num) => {
    if (num === null || num === undefined) return '—';
    return num.toLocaleString('en-IN');
};

// ─── MoM direction arrow and color ───────────────────────────────────────────
export const getMoMStyle = (direction) => {
    if (direction === 'up') return { arrow: '↑', color: '#10b981' };
    if (direction === 'down') return { arrow: '↓', color: '#ef4444' };
    return { arrow: '→', color: '#6b7280' };
};

// ─── Cap attendance rate at 100% for display ─────────────────────────────────
export const safeAttendanceRate = (rate) => {
    if (!rate) return 0;
    return Math.min(rate, 1);
};