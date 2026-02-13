import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import Members from './pages/Members';
import Vouchers from './pages/Vouchers';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import MembershipSettings from './pages/MembershipSettings';
import AdminSettings from './pages/AdminSettings';
import MerchantBrands from './pages/MerchantBrands';
import Outlets from './pages/Outlets';
import Staff from './pages/Staff';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="members" element={<Members />} />
            <Route path="vouchers" element={<Vouchers />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings/membership" element={<MembershipSettings />} />
            <Route path="settings/admin" element={<AdminSettings />} />
            <Route path="merchant-brands" element={<MerchantBrands />} />
            <Route path="outlets" element={<Outlets />} />
            <Route path="staff" element={<Staff />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
