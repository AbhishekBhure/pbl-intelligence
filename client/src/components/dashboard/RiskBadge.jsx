import { getRiskColor, getRiskBgColor } from '../../utils/riskEngine';

const RiskBadge = ({ status, size = 'md' }) => {
    if (!status) return null;

    const sizes = {
        sm: { fontSize: '10px', padding: '2px 8px' },
        md: { fontSize: '12px', padding: '4px 10px' },
        lg: { fontSize: '13px', padding: '6px 14px' },
    };

    const style = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        borderRadius: '20px',
        fontWeight: '600',
        backgroundColor: getRiskBgColor(status),
        color: getRiskColor(status),
        ...sizes[size],
    };

    const dots = {
        'On Track': '●',
        'Behind': '●',
        'At Risk': '●',
        'Critical': '●',
    };

    return (
        <span style={style}>
            <span style={{ fontSize: '8px' }}>{dots[status]}</span>
            {status}
        </span>
    );
};

export default RiskBadge;