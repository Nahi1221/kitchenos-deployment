import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AdminPanel from './pages/AdminPanel';
import PublicMenu from './pages/PublicMenu';
import TenantDashboard from './pages/TenantDashboard';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/admin/AdminRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { BranchProvider } from './contexts/BranchContext';
import DashboardLayout from './components/dashboard/DashboardLayout';
import Orders from './pages/Orders';
import OrderForm from './pages/OrderForm';
import OrderDetail from './pages/OrderDetail';
import Invoice from './pages/Invoice';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import PaymentHistory from './pages/PaymentHistory';
import Subscriptions from './pages/Subscriptions';
import ForgotPassword from './pages/ForgotPassword';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BranchProvider>
          <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin routes */}
            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />

            {/* Tenant dashboard routes */}
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <TenantDashboard />
                </ProtectedRoute>
              }
            />

            {/* Tenant direct routes */}
            <Route path="/orders" element={
              <ProtectedRoute><DashboardLayout><Orders /></DashboardLayout></ProtectedRoute>
            } />
            <Route path="/orders/new" element={
              <ProtectedRoute><DashboardLayout><OrderForm /></DashboardLayout></ProtectedRoute>
            } />
            <Route path="/orders/:id" element={
              <ProtectedRoute><DashboardLayout><OrderDetail /></DashboardLayout></ProtectedRoute>
            } />
            <Route path="/orders/invoice/:orderId" element={
              <ProtectedRoute><DashboardLayout><Invoice /></DashboardLayout></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><DashboardLayout><Profile /></DashboardLayout></ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>
            } />
             <Route path="/payments" element={
               <ProtectedRoute><DashboardLayout><PaymentHistory /></DashboardLayout></ProtectedRoute>
             } />
             <Route path="/subscriptions" element={
               <ProtectedRoute><DashboardLayout><Subscriptions /></DashboardLayout></ProtectedRoute>
             } />

             <Route path="/" element={<Navigate to="/login" replace />} />
             <Route path="/forgot-password" element={<ForgotPassword />} />
             <Route path="/r/:tenantSlug/:branchSlug?" element={<PublicMenu />} />
          </Routes>
        </BrowserRouter>
        </BranchProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;