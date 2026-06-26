import { NavLink } from 'react-router-dom';

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/districts', label: 'Districts & Blocks', icon: '🗺️' },
    { path: '/review', label: 'Review Prep', icon: '📋' },
    { path: '/grants', label: 'Grant Reporting', icon: '📄' },
];

const Sidebar = () => {
    return (
        <div style={styles.sidebar}>
            {/* Logo */}
            <div style={styles.logo}>
                <div style={styles.logoIcon}>M4C</div>
                <div style={styles.logoText}>
                    <div style={styles.logoTitle}>PBL Intelligence</div>
                    <div style={styles.logoSub}>Mantra4Change</div>
                </div>
            </div>

            {/* Nav */}
            <nav style={styles.nav}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        style={({ isActive }) => ({
                            ...styles.navItem,
                            ...(isActive ? styles.navItemActive : {}),
                        })}
                    >
                        <span style={styles.navIcon}>{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div style={styles.sidebarFooter}>
                <div style={styles.footerText}>Assessment Build</div>
                <div style={styles.footerSub}>Synthetic Data Only</div>
            </div>
        </div>
    );
};

const styles = {
    sidebar: {
        width: '240px',
        minHeight: '100vh',
        backgroundColor: '#1a1a2e',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '24px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
    },
    logoIcon: {
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        backgroundColor: '#4f46e5',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '12px',
        flexShrink: 0,
    },
    logoTitle: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: '13px',
    },
    logoSub: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: '11px',
        marginTop: '2px',
    },
    logoText: {
        display: 'flex',
        flexDirection: 'column',
    },
    nav: {
        flex: 1,
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    navItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        borderRadius: '8px',
        color: 'rgba(255,255,255,0.55)',
        fontSize: '13px',
        fontWeight: '500',
        transition: 'all 0.15s ease',
        textDecoration: 'none',
    },
    navItemActive: {
        backgroundColor: 'rgba(79,70,229,0.2)',
        color: '#a5b4fc',
    },
    navIcon: {
        fontSize: '16px',
        width: '20px',
        textAlign: 'center',
    },
    sidebarFooter: {
        padding: '16px 20px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
    },
    footerText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: '11px',
    },
    footerSub: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: '10px',
        marginTop: '2px',
    },
};

export default Sidebar;