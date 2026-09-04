import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

function PaymentHistory() {
	const [payments, setPayments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState('');
	const [methodFilter, setMethodFilter] = useState('');

	useEffect(() => {
		fetchPayments();
	}, [statusFilter, methodFilter]);

	const fetchPayments = async () => {
		try {
			setLoading(true);
			const params = {};
			if (statusFilter) params.status = statusFilter;
			if (methodFilter) params.method = methodFilter;
			const res = await api.get('/tenants/payments/', { params });
			setPayments(res.data || []);
		} catch (e) {
			console.error('Failed to load payments', e);
			toast.error('Failed to load payments');
		} finally {
			setLoading(false);
		}
	};

	const formatCurrency = (value) => {
		const num = Number(value);
		if (isNaN(num)) return '0.00';
		return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	};

	const statusColors = {
		PENDING: 'bg-yellow-100 text-yellow-800',
		APPROVED: 'bg-green-100 text-green-800',
		REJECTED: 'bg-red-100 text-red-800',
	};

	const formatDate = (dateString) => {
		if (!dateString) return '-';
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return 'Invalid date';
		return date.toLocaleDateString();
	};

	const methods = [...new Set(payments.map(p => p.method).filter(Boolean))];

	if (loading) return <div className="text-center py-8">Loading payments...</div>;

	return (
		<div>
			<h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Payment History</h2>

			<div className="flex flex-wrap gap-3 mb-4">
				<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-full sm:w-48">
					<option value="">All Statuses</option>
					<option value="PENDING">Pending</option>
					<option value="APPROVED">Approved</option>
					<option value="REJECTED">Rejected</option>
				</select>
				<select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="input-field w-full sm:w-48">
					<option value="">All Methods</option>
					{methods.map(m => <option key={m} value={m}>{m}</option>)}
				</select>
			</div>

			{payments.length === 0 ? (
				<div className="card text-center py-12" style={{ color: 'var(--text-muted)' }}>
					<p className="text-lg mb-2">No payments found</p>
					<p className="text-sm">Payment history will appear here</p>
				</div>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr style={{ borderBottom: '1px solid var(--border-color)' }}>
								<th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Transaction</th>
								<th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Date</th>
								<th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Method</th>
								<th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Reference</th>
								<th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Notes</th>
								<th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Amount</th>
								<th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Status</th>
							</tr>
						</thead>
						<tbody>
							{payments.map((payment) => (
								<tr key={payment.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
									<td className="py-3 px-4" style={{ color: 'var(--text-primary)' }}>{payment.id}</td>
									<td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{formatDate(payment.created_at)}</td>
									<td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{payment.method || 'N/A'}</td>
									<td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{payment.reference_number || '-'}</td>
									<td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{payment.notes || '-'}</td>
									<td className="py-3 px-4">
										<span className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
											{formatCurrency(payment.amount)} ETB
										</span>
									</td>
									<td className="py-3 px-4">
										<span className={`px-2 py-1 rounded-full text-xs capitalize ${statusColors[payment.status] || 'bg-gray-100 text-gray-800'}`}>
											{payment.status.toLowerCase()}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

export default PaymentHistory;
