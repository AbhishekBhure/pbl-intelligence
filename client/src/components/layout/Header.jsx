import { useLocation } from 'react-router-dom';

const pageTitles = {
    '/dashboard': { title: 'Program Dashboard', sub: 'Monthly KPIs, participation, and risk overview' },
    '/districts': { title: 'Districts & Blocks', sub: 'Geography-level performance and follow-up flags' },
    '/review': { title: 'Review Preparation', sub: 'Structured summary for leadership review meetings' },
    '/grants': { title: 'Grant Reporting', sub: 'Finance, outcomes, milestones, and report generation' },
};

const Header = () => {
    const location = useLocation();
    const current = pageTitles[location.pathname] || { title: 'PBL Intelligence', sub: '' };

    const now = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div style={styles.header}>
            <div>
                <div style={styles.title}>{current.title}</div>
                <div style={styles.sub}>{current.sub}</div>
            </div>
            <div style={styles.right}>
                <div style={styles.date}>{now}</div>
                <div style={styles.badge}>Synthetic Data</div>
            </div>
        </div>
    );
};

const styles = {
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        flexShrink: 0,
    },
    title: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#1a1a2e',
    },
    sub: {
        fontSize: '12px',
        color: '#6b7280',
        marginTop: '2px',
    },
    right: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    date: {
        fontSize: '12px',
        color: '#6b7280',
    },
    badge: {
        backgroundColor: '#fef3c7',
        color: '#92400e',
        fontSize: '11px',
        fontWeight: '600',
        padding: '4px 10px',
        borderRadius: '20px',
    },
};

export default Header;