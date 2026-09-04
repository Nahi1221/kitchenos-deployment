import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import MenuManagement from '../components/menu/MenuManagement';
import DashboardStats from '../components/dashboard/DashboardStats';
import RecentActivity from '../components/dashboard/RecentActivity';
import BranchManagement from '../components/branches/BranchManagement';
import Orders from './Orders';
import OrderForm from './OrderForm';
import OrderDetail from './OrderDetail';
import Invoice from './Invoice';
import Profile from './Profile';
import Settings from './Settings';
import PaymentHistory from './PaymentHistory';
import Subscriptions from './Subscriptions';
import QRManagement from '../components/dashboard/QRManagement';

function TenantDashboard() {
  const { user } = useAuth();
  const displayName = user?.name || user?.full_name || 'Tenant';

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={
          <div className="space-y-4 md:space-y-6">
            <DashboardStats />
            <RecentActivity />
          </div>
        } />
        <Route path="/branches" element={<BranchManagement />} />
        <Route path="/menu" element={<div className="p-4"><MenuManagement/></div>} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/new" element={<OrderForm />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/orders/invoice/:orderId" element={<Invoice />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/payments" element={<PaymentHistory />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/qr" element={<QRManagement />} />
        <Route path="/analytics" element={
          <div className="card text-center py-12" style={{ color: 'var(--text-muted)' }}>Analytics coming soon...</div>
        } />
      </Routes>
    </DashboardLayout>
  );
}

export default TenantDashboard;
