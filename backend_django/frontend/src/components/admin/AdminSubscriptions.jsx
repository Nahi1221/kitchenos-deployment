import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

function AdminSubscriptions() {
	const [subscriptions, setSubscriptions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState('all');
	const [selectedIds, setSelectedIds] = useState([]);
	const [bulkAction, setBulkAction] = useState('');
	const [extendModal, setExtendModal] = useState({ open: false, sub: null, endDate: '' });
	const [suspendModal, setSuspendModal] = useState({ open: false, sub: null, reason: '' });

	useEffect(() => {
		fetchSubscriptions();
	}, [filter]);

	useEffect(() => {
		setSelectedIds([]);
	}, [filter]);

	const fetchSubscriptions = async () => {
		try {
			setLoading(true);
			const params = {};
			if (filter !== 'all') params.status = filter;
			const res = await api.get('/admin/subscriptions/', { params });
			setSubscriptions(res.data || []);
		} catch (e) {
			console.error('Failed to load subscriptions', e);
			toast.error('Failed to load subscriptions');
		} finally {
			setLoading(false);
		}
	};

	const toggleSelectAll = (e) => {
		if (e.target.checked) {
			setSelectedIds(subscriptions.map(s => s.id));
		} else {
			setSelectedIds([]);
		}
	};

	const toggleSelect = (id) => {
		setSelectedIds(prev =>
			prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
		);
	};

	const handleBulkAction = async () => {
		if (!bulkAction || selectedIds.length === 0) return;
		const actionMap = {
			'extend': '/admin/subscriptions/bulk-extend/',
			'suspend': '/admin/subscriptions/bulk-suspend/',
			'cancel': '/admin/subscriptions/bulk-cancel/',
		};
		const url = actionMap[bulkAction];
		if (!url) return;
		const confirmMsg = bulkAction === 'cancel'
			? `Cancel ${selectedIds.length} subscription(s)?`
			: `${bulkAction} ${selectedIds.length} subscription(s)?`;
		if (!window.confirm(confirmMsg)) return;
		try {
			const payload = { ids: selectedIds };
			if (bulkAction === 'extend') payload.months = 1;
			await api.post(url, payload);
			toast.success(`Bulk ${bulkAction} completed`);
			setSelectedIds([]);
			setBulkAction('');
			fetchSubscriptions();
		} catch (e) {
			toast.error(e.response?.data?.error || `Failed to ${bulkAction}`);
		}
	};

	const handleExtend = async () => {
		if (!extendModal.sub) return;
		try {
			const payload = {};
			if (extendModal.endDate) {
				payload.end_date = extendModal.endDate;
			} else {
				payload.months = 1;
			}
			await api.post(`/admin/subscriptions/extend/${extendModal.sub.id}/`, payload);
			toast.success('Subscription extended');
			setExtendModal({ open: false, sub: null, endDate: '' });
			fetchSubscriptions();
		} catch (e) {
			toast.error(e.response?.data?.error || 'Failed to extend');
		}
	};

	const handleSuspend = async () => {
		if (!suspendModal.sub) return;
		try {
			await api.post(`/admin/subscriptions/suspend/${suspendModal.sub.id}/`, { reason: suspendModal.reason });
			toast.success('Subscription suspended');
			setSuspendModal({ open: false, sub: null, reason: '' });
			fetchSubscriptions();
		} catch (e) {
			toast.error('Failed to suspend');
		}
	};

	const handleCancel = async (sub) => {
		if (!window.confirm('Cancel this subscription?')) return;
		try {
			await api.post(`/admin/subscriptions/cancel/${sub.id}/`);
			toast.success('Subscription cancelled');
			fetchSubscriptions();
		} catch (e) {
			toast.error(e.response?.data?.error || 'Failed to cancel');
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case 'active': return 'bg-green-100 text-green-800';
			case 'expired': return 'bg-red-100 text-red-800';
			case 'pending': return 'bg-yellow-100 text-yellow-800';
			case 'suspended': return 'bg-gray-100 text-gray-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	};

	if (loading) return <div className="card text-center py-12">Loading subscriptions...</div>;

	return (
		<div>
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
				<h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Subscriptions</h2>
				<select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field w-full sm:w-48">
					<option value="all">All Status</option>
					<option value="active">Active</option>
					<option value="expired">Expired</option>
					<option value="pending">Pending</option>
					<option value="suspended">Suspended</option>
				</select>
			</div>
			{subscriptions.length === 0 ? (
				<div className="card text-center py-12" style={{ color: 'var(--text-muted)' }}>No subscriptions found</div>
			) : (
				<>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr style={{ borderBottom: '1px solid var(--border-color)' }}>
									<th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>
										<input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.length === subscriptions.length && subscriptions.length > 0} />
									</th>
									<th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Tenant</th>
									<th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Plan</th>
									<th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Status</th>
									<th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Start</th>
									<th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>End</th>
									<th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Actions</th>
								</tr>
							</thead>
							<tbody>
								{subscriptions.map((sub) => (
									<tr key={sub.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
										<td className="py-3 px-4">
											<input type="checkbox" checked={selectedIds.includes(sub.id)} onChange={() => toggleSelect(sub.id)} />
										</td>
										<td className="py-3 px-4" style={{ color: 'var(--text-primary)' }}>{sub.tenant_name || sub.tenant}</td>
										<td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{sub.plan_name}</td>
										<td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(sub.status)}`}>{sub.status}</span></td>
										<td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{new Date(sub.start_date).toLocaleDateString()}</td>
										<td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{new Date(sub.end_date).toLocaleDateString()}</td>
										<td className="py-3 px-4">
											<div className="flex gap-2">
												<button onClick={() => setExtendModal({ open: true, sub, endDate: sub.end_date })} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>Extend</button>
												<button onClick={() => setSuspendModal({ open: true, sub, reason: '' })} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--warning)', color: '#fff' }}>Suspend</button>
												<button onClick={() => handleCancel(sub)} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--error)', color: '#fff' }}>Cancel</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{selectedIds.length > 0 && (
						<div className="mt-4 p-3 rounded-lg flex items-center gap-3" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
							<span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedIds.length} selected</span>
							<select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className="px-3 py-1.5 rounded-lg text-sm" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
								<option value="">Bulk action...</option>
								<option value="extend">Extend (1 month)</option>
								<option value="suspend">Suspend</option>
								<option value="cancel">Cancel</option>
							</select>
							<button onClick={handleBulkAction} disabled={!bulkAction} className="btn-primary text-sm disabled:opacity-50">Apply</button>
							<button onClick={() => setSelectedIds([])} className="text-sm" style={{ color: 'var(--text-muted)' }}>Clear</button>
						</div>
					)}
				</>
			)}

			{extendModal.open && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setExtendModal({ open: false, sub: null, endDate: '' })}>
					<div className="card max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
						<h3 className="text-lg font-semibold mb-4">Extend Subscription</h3>
						<div className="mb-4">
							<label className="block text-sm font-medium mb-1">New End Date</label>
							<input type="date" value={extendModal.endDate} onChange={(e) => setExtendModal({ ...extendModal, endDate: e.target.value })} className="input-field" />
						</div>
						<div className="flex gap-3">
							<button onClick={() => setExtendModal({ open: false, sub: null, endDate: '' })} className="btn-secondary flex-1">Cancel</button>
							<button onClick={handleExtend} className="btn-primary flex-1">Extend</button>
						</div>
					</div>
				</div>
			)}

			{suspendModal.open && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSuspendModal({ open: false, sub: null, reason: '' })}>
					<div className="card max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
						<h3 className="text-lg font-semibold mb-4">Suspend Subscription</h3>
						<div className="mb-4">
							<label className="block text-sm font-medium mb-1">Reason</label>
							<textarea value={suspendModal.reason} onChange={(e) => setSuspendModal({ ...suspendModal, reason: e.target.value })} className="input-field" rows="3" />
						</div>
						<div className="flex gap-3">
							<button onClick={() => setSuspendModal({ open: false, sub: null, reason: '' })} className="btn-secondary flex-1">Cancel</button>
							<button onClick={handleSuspend} className="btn-primary flex-1">Suspend</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default AdminSubscriptions;
