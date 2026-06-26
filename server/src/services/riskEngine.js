// ─── Thresholds ─────────────────────────────────────────────────────────────
export const THRESHOLDS = {
    ON_TRACK: 0.75,
    BEHIND: 0.60,
    AT_RISK: 0.35,
};

// ─── Classify a single rate (0–1) into a risk status ────────────────────────
export const classifyRisk = (rate) => {
    if (rate >= THRESHOLDS.ON_TRACK) return 'On Track';
    if (rate >= THRESHOLDS.BEHIND) return 'Behind';
    if (rate >= THRESHOLDS.AT_RISK) return 'At Risk';
    return 'Critical';
};

// ─── Explain why a rate got its classification ───────────────────────────────
export const explainRisk = (rate, metricName = 'This indicator') => {
    const status = classifyRisk(rate);
    const pct = (rate * 100).toFixed(1);

    const explanations = {
        'On Track': `${metricName} is at ${pct}% — above the 75% threshold. Performing well.`,
        'Behind': `${metricName} is at ${pct}% — between 60–75%. Needs monitoring to avoid slipping further.`,
        'At Risk': `${metricName} is at ${pct}% — between 35–60%. Requires active follow-up.`,
        'Critical': `${metricName} is at ${pct}% — below 35%. Immediate intervention needed.`,
    };

    return {
        status,
        rate,
        percentage: pct,
        explanation: explanations[status],
    };
};

// ─── Classify multiple metrics at once ──────────────────────────────────────
export const classifyMetrics = (metrics) => {
    const results = {};
    for (const [key, value] of Object.entries(metrics)) {
        results[key] = explainRisk(value, key);
    }
    return results;
};

// ─── Month over month movement ───────────────────────────────────────────────
export const calcMoM = (current, previous) => {
    if (previous === null || previous === undefined) {
        return { delta: null, direction: 'neutral', label: 'No previous data' };
    }
    const delta = current - previous;
    const deltaPct = (delta * 100).toFixed(1);
    const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral';
    const label = delta > 0
        ? `+${deltaPct}% from last month`
        : delta < 0
            ? `${deltaPct}% from last month`
            : 'No change from last month';

    return { delta, deltaPct: parseFloat(deltaPct), direction, label };
};

// ─── Summarize risk distribution across a list of statuses ──────────────────
export const summarizeRiskDistribution = (statuses) => {
    const dist = { 'On Track': 0, 'Behind': 0, 'At Risk': 0, 'Critical': 0 };
    for (const s of statuses) {
        if (dist[s] !== undefined) dist[s]++;
    }
    return dist;
};

// ─── Priority flag: should this geography be flagged for follow-up? ──────────
export const needsFollowUp = (riskStatus) => {
    return riskStatus === 'At Risk' || riskStatus === 'Critical';
};