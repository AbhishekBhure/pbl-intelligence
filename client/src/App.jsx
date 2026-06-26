import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import DistrictBlock from './pages/DistrictBlock';
import ReviewPrep from './pages/ReviewPrep';
import GrantReporting from './pages/GrantReporting';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="districts" element={<DistrictBlock />} />
          <Route path="review" element={<ReviewPrep />} />
          <Route path="grants" element={<GrantReporting />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;