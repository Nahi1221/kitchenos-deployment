import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useBranch } from '../../contexts/BranchContext';

function DashboardStats() {
  const [stats, setStats] = useState({
    branches: 0,
    menuItems: 0,
    revenue: 0,
    customers: 0
  });
  const { selectedBranchId } = useBranch();

  useEffect(() => {
    async function fetchStats() {
      try {
        const params = {};
        if (selectedBranchId) params.branch_id = selectedBranchId;
        const res = await api.get('/branches/stats/', { params });
        setStats(res.data);
      } catch (e) {
        console.error('Failed to load stats', e);
      }
    }
    fetchStats();
  }, [selectedBranchId]);

  const formatCurrency = (value) => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(num)) return '0 ETB';
    return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`;
  };

  const formatNumber = (value) => {
    const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US');
  };

  const items = [
    { name: 'Branches', value: formatNumber(stats.branches), icon: '🏪', color: 'var(--accent)' },
    { name: 'Menu Items', value: formatNumber(stats.menuItems), icon: '🍽️', color: 'var(--success)' },
    { name: 'Revenue (Monthly)', value: formatCurrency(stats.revenue), icon: '💰', color: 'var(--warning)' },
    { name: 'Total Customers', value: formatNumber(stats.customers), icon: '👥', color: 'var(--info)' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((stat) => (
        <div key={stat.name} className="card hover:translate-y-[-2px] transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 rounded-lg text-2xl" style={{ backgroundColor: stat.color, color: '#ffffff', opacity: 0.9 }}>
              {stat.icon}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{stat.name}</p>
              <p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default DashboardStats;