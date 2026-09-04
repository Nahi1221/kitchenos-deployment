import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

function AdminAnalytics() {
	const [loading, setLoading] = useState(true);
	const [metrics, setMetrics] = useState({ totalTenants: 0, activeSubscriptions: 0, pendingApprovals: 0, revenue: 0 });
	const [revenueData, setRevenueData] = useState([]);
	const [topItems, setTopItems] = useState([]);
	const [topBranches, setTopBranches] = useState([]);
	const [orderStatus, setOrderStatus] = useState([]);
	const [subStatus, setSubStatus] = useState([]);
	const [auditLogs, setAuditLogs] = useState([]);

	useEffect(() => {
		fetchAnalytics();
	}, []);

	const fetchAnalytics = async () => {
		try {
			setLoading(true);
			const [statsRes, revenueRes, itemsRes, branchesRes, orderRes, subRes, logsRes] = await Promise.all([
				api.get('/admin/stats/'),
				api.get('/admin/analytics/revenue/?days=30'),
				api.get('/admin/analytics/top-items/?limit=10'),
				api.get('/admin/analytics/top-branches/?limit=10'),
				api.get('/admin/analytics/order-status/'),
				api.get('/admin/analytics/subscriptions/'),
				api.get('/admin/audit-logs/'),
			]);
			setMetrics(statsRes.data || {});
			setRevenueData(revenueRes.data || []);
			setTopItems(itemsRes.data || []);
			setTopBranches(branchesRes.data || []);
			setOrderStatus(orderRes.data || []);
			setSubStatus(subRes.data || []);
			setAuditLogs(logsRes.data || []);
		} catch (e) {
			console.error('Failed to load analytics', e);
			toast.error('Failed to load analytics');
		} finally {
			setLoading(false);
		}
	};

	const exportPaymentsCSV = async () => {
		try {
			const res = await api.get('/admin/payments/export/', { responseType: 'blob' });
			const url = window.URL.createObjectURL(new Blob([res.data]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', 'payments.csv');
			document.body.appendChild(link);
			link.click();
			link.remove();
		} catch (e) {
			toast.error('Failed to export payments');
		}
	};

	const maxRevenue = revenueData.length > 0 ? Math.max(...revenueData.map(d => d.amount)) : 1;
	const maxOrderCount = orderStatus.length > 0 ? Math.max(...orderStatus.map(d => d.count)) : 1;
	const maxSubCount = subStatus.length > 0 ? Math.max(...subStatus.map(d => d.count)) : 1;

	if (loading) return <div className="card text-center py-12">Loading analytics...</div>;

	return (
		<div>
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
				<h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Analytics Dashboard</h2>
				<button onClick={exportPaymentsCSV} className="btn-primary">Download Payments CSV</button>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
				{[
					{ name: 'Total Tenants', value: metrics.totalTenants || 0, icon: '👥' },
					{ name: 'Active Subscriptions', value: metrics.activeSubscriptions || 0, icon: '✅' },
					{ name: 'Pending Approvals', value: metrics.pendingApprovals || 0, icon: '⏳' },
					{ name: 'Total Revenue', value: `${(metrics.revenue || 0).toLocaleString()} ETB`, icon: '💰' },
				].map((m) => (
					<div key={m.name} className="card hover:translate-y-[-2px] transition-all duration-300">
						<div className="flex items-center">
							<div className="p-3 rounded-lg text-2xl" style={{ backgroundColor: 'var(--accent)', color: '#ffffff', opacity: 0.9 }}>
								{m.icon}
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{m.name}</p>
								<p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{m.value}</p>
							</div>
						</div>
					</div>
				))}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
				<div className="card">
					<h3 className="font-semibold mb-4">Revenue Trend (Last 30 Days)</h3>
					{revenueData.length === 0 ? (
						<p style={{ color: 'var(--text-muted)' }}>No revenue data available</p>
					) : (
						<div className="space-y-2 max-h-80 overflow-y-auto">
							{revenueData.map((d, i) => (
								<div key={i} className="flex items-center gap-3">
									<span className="text-xs w-24 flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>{new Date(d.date).toLocaleDateString()}</span>
									<div className="flex-1 h-6 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
										<div className="h-full rounded-full" style={{ width: `${(d.amount / maxRevenue) * 100}%`, backgroundColor: 'var(--accent)', transition: 'width 0.3s' }} />
									</div>
									<span className="text-xs font-medium w-20 text-right" style={{ color: 'var(--text-primary)' }}>{d.amount.toFixed(0)} ETB</span>
								</div>
							))}
						</div>
					)}
				</div>

				<div className="card">
					<h3 className="font-semibold mb-4">Order Status Distribution</h3>
					{orderStatus.length === 0 ? (
						<p style={{ color: 'var(--text-muted)' }}>No orders yet</p>
					) : (
						<div className="space-y-3">
							{orderStatus.map((s) => (
								<div key={s.status} className="flex items-center gap-3">
									<span className="text-xs w-28 capitalize" style={{ color: 'var(--text-secondary)' }}>{s.status.replace('_', ' ')}</span>
									<div className="flex-1 h-6 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
										<div className="h-full rounded-full" style={{ width: `${(s.count / maxOrderCount) * 100}%`, backgroundColor: 'var(--success)', transition: 'width 0.3s' }} />
									</div>
									<span className="text-xs font-medium w-12 text-right" style={{ color: 'var(--text-primary)' }}>{s.count}</span>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
				<div className="card">
					<h3 className="font-semibold mb-4">Top Selling Items</h3>
					{topItems.length === 0 ? (
						<p style={{ color: 'var(--text-muted)' }}>No sales data yet</p>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr style={{ borderBottom: '1px solid var(--border-color)' }}>
										<th className="text-left py-2 px-3" style={{ color: 'var(--text-secondary)' }}>Item</th>
										<th className="text-right py-2 px-3" style={{ color: 'var(--text-secondary)' }}>Qty</th>
										<th className="text-right py-2 px-3" style={{ color: 'var(--text-secondary)' }}>Revenue</th>
									</tr>
								</thead>
								<tbody>
									{topItems.map((item, i) => (
										<tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
											<td className="py-2 px-3" style={{ color: 'var(--text-primary)' }}>{item.menu_item__name}</td>
											<td className="py-2 px-3 text-right" style={{ color: 'var(--text-secondary)' }}>{item.total_quantity}</td>
											<td className="py-2 px-3 text-right font-medium" style={{ color: 'var(--text-primary)' }}>{parseFloat(item.total_revenue).toFixed(2)} ETB</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				<div className="card">
					<h3 className="font-semibold mb-4">Top Branches by Orders</h3>
					{topBranches.length === 0 ? (
						<p style={{ color: 'var(--text-muted)' }}>No order data yet</p>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr style={{ borderBottom: '1px solid var(--border-color)' }}>
										<th className="text-left py-2 px-3" style={{ color: 'var(--text-secondary)' }}>Branch</th>
										<th className="text-right py-2 px-3" style={{ color: 'var(--text-secondary)' }}>Orders</th>
										<th className="text-right py-2 px-3" style={{ color: 'var(--text-secondary)' }}>Revenue</th>
									</tr>
								</thead>
								<tbody>
									{topBranches.map((b, i) => (
										<tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
											<td className="py-2 px-3" style={{ color: 'var(--text-primary)' }}>{b.branch__name}</td>
											<td className="py-2 px-3 text-right" style={{ color: 'var(--text-secondary)' }}>{b.order_count}</td>
											<td className="py-2 px-3 text-right font-medium" style={{ color: 'var(--text-primary)' }}>{parseFloat(b.total_revenue).toFixed(2)} ETB</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			<div className="card mb-6">
				<h3 className="font-semibold mb-4">Subscription Status Distribution</h3>
				{subStatus.length === 0 ? (
					<p style={{ color: 'var(--text-muted)' }}>No subscriptions yet</p>
				) : (
					<div className="flex flex-wrap gap-4">
						{subStatus.map((s) => (
							<div key={s.status} className="flex items-center gap-3">
								<div className="w-32 h-6 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
									<div className="h-full rounded-full" style={{ width: `${(s.count / maxSubCount) * 100}%`, backgroundColor: 'var(--accent)', transition: 'width 0.3s' }} />
								</div>
								<span className="text-xs capitalize w-28" style={{ color: 'var(--text-secondary)' }}>{s.status}</span>
								<span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{s.count}</span>
							</div>
						))}
					</div>
				)}
			</div>

			<div className="card">
				<h3 className="font-semibold mb-4">Recent Activity</h3>
				{auditLogs.length === 0 ? (
					<p style={{ color: 'var(--text-muted)' }}>No recent activity</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr style={{ borderBottom: '1px solid var(--border-color)' }}>
									<th className="text-left py-2 px-3" style={{ color: 'var(--text-secondary)' }}>Time</th>
									<th className="text-left py-2 px-3" style={{ color: 'var(--text-secondary)' }}>Action</th>
									<th className="text-left py-2 px-3" style={{ color: 'var(--text-secondary)' }}>User</th>
									<th className="text-left py-2 px-3" style={{ color: 'var(--text-secondary)' }}>Details</th>
								</tr>
							</thead>
							<tbody>
								{auditLogs.map((log) => (
									<tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
										<td className="py-2 px-3" style={{ color: 'var(--text-muted)' }}>{new Date(log.created_at).toLocaleString()}</td>
										<td className="py-2 px-3" style={{ color: 'var(--text-primary)' }}>{log.action}</td>
										<td className="py-2 px-3" style={{ color: 'var(--text-secondary)' }}>{log.user || 'System'}</td>
										<td className="py-2 px-3" style={{ color: 'var(--text-secondary)' }}>{log.details}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}

export default AdminAnalytics;
