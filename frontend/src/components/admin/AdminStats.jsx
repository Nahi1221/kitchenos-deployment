import { useState, useEffect } from 'react';
import api from '../../services/api';

function AdminStats() {
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeSubscriptions: 0,
    pendingApprovals: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
        const response = await api.get('/admin/stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statItems = [
    { name: 'Total Tenants', value: stats.totalTenants, icon: '🏪', color: 'var(--accent)' },
    { name: 'Active Subscriptions', value: stats.activeSubscriptions, icon: '✅', color: 'var(--success)' },
    { name: 'Pending Approvals', value: stats.pendingApprovals, icon: '⏳', color: 'var(--warning)' },
    { name: 'Revenue (Monthly)', value: `${stats.revenue} ETB`, icon: '💰', color: 'var(--info)' },
  ];

  if (loading) {
    return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">Loading stats...</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((stat) => (
        <div key={stat.name} className="card hover:translate-y-[-2px] transition-all duration-300">
          <div className="flex items-center">
            <div
              className="p-3 rounded-lg text-2xl"
              style={{
                backgroundColor: stat.color,
                color: '#ffffff',
                opacity: 0.9
              }}
            >
              {stat.icon}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {stat.name}
              </p>
              <p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminStats;