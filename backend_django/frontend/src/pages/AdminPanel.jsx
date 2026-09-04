import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminStats from '../components/admin/AdminStats';
import TenantList from '../components/admin/TenantList';
import PendingApprovals from '../components/admin/PendingApprovals';
import PaymentList from '../components/admin/PaymentList';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import AdminSettings from '../components/admin/AdminSettings';
import AdminSubscriptions from '../components/admin/AdminSubscriptions';
import ThemeToggle from '../components/common/ThemeToggle';

function AdminPanel() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const admin = { name: 'Super Admin' };

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Mobile Hamburger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg shadow-md transition-colors duration-200"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:relative lg:flex lg:flex-shrink-0
      `}>
        <div className="w-64 h-full border-r" style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-color)'
        }}>
          <AdminSidebar />
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <header className="border-b" style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-color)'
        }}>
          <div className="px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">
            <h1 className="text-lg md:text-xl font-semibold ml-10 lg:ml-0" style={{ color: 'var(--text-primary)' }}>
              👑 Admin Panel
            </h1>
            <div className="flex items-center space-x-2 md:space-x-4">
              <ThemeToggle />
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold" style={{
                backgroundColor: 'var(--accent)',
                color: '#ffffff'
              }}>
                {admin.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <Routes>
            <Route path="/" element={<AdminStats />} />
            <Route path="/tenants" element={<TenantList />} />
            <Route path="/approvals" element={<PendingApprovals />} />
            <Route path="/payments" element={<PaymentList />} />
            <Route path="/analytics" element={<AdminAnalytics />} />
            <Route path="/settings" element={<AdminSettings />} />
            <Route path="/subscriptions" element={<AdminSubscriptions />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default AdminPanel;