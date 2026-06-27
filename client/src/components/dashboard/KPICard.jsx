import { getMoMStyle } from '../../utils/riskEngine';

const KPICard = ({ title, value, subtitle, mom, icon, color = '#4f46e5' }) => {
    const momStyle = mom ? getMoMStyle(mom.direction) : null;

    return (
        <div style={styles.card}>
            {/* Top row */}
            <div style={styles.topRow}>
                <div style={styles.title}>{title}</div>
                {icon && (
                    <div style={{ ...styles.iconBox, backgroundColor: `${color}15` }}>
                        <span style={{ fontSize: '18px' }}>{icon}</span>
                    </div>
                )}
            </div>

            {/* Main value */}
            <div style={{ ...styles.value, color }}>{value}</div>

            {/* Subtitle */}
            {subtitle && (
                <div style={styles.subtitle}>{subtitle}</div>
            )}

            {/* MoM movement */}
            {mom && momStyle && (
                <div style={styles.momRow}>
                    <span style={{ ...styles.momBadge, color: momStyle.color, backgroundColor: `${momStyle.color}15` }}>
                        {momStyle.arrow} {Math.abs(mom.deltaPct)}%
                    </span>
                    <span style={styles.momLabel}>vs last month</span>
                </div>
            )}
        </div>
    );
};

const styles = {
    card: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        border: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    topRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    iconBox: {
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    value: {
        fontSize: '28px',
        fontWeight: '700',
        lineHeight: 1.2,
    },
    subtitle: {
        fontSize: '12px',
        color: '#6b7280',
    },
    momRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginTop: '4px',
    },
    momBadge: {
        fontSize: '11px',
        fontWeight: '600',
        padding: '2px 8px',
        borderRadius: '20px',
    },
    momLabel: {
        fontSize: '11px',
        color: '#9ca3af',
    },
};

export default KPICard;