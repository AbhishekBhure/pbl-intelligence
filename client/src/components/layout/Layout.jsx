import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
    return (
        <div style={styles.container}>
            <Sidebar />
            <div style={styles.main}>
                <Header />
                <div style={styles.content}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f0f2f5',
    },
    main: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
    },
    content: {
        flex: 1,
        padding: '24px',
        overflowY: 'auto',
    },
};

export default Layout;