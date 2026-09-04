import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

function Subscriptions() {
	const [subscription, setSubscription] = useState(null);
	const [history, setHistory] = useState([]);
	const [plans, setPlans] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showRenewModal, setShowRenewModal] = useState(false);
	const [showUpgradeModal, setShowUpgradeModal] = useState(false);
	const [renewForm, setRenewForm] = useState({ duration_months: 1, payment_method: 'Bank Transfer', reference_number: '', notes: '', screenshot: null });
	const [upgradeForm, setUpgradeForm] = useState({ plan_id: '', payment_method: 'Bank Transfer', reference_number: '', notes: '', screenshot: null });
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		try {
			setLoading(true);
			const [subRes, histRes, plansRes] = await Promise.all([
				api.get('/tenants/subscriptions/current/').catch(() => ({ data: null })),
				api.get('/tenants/subscriptions/history/').catch(() => ({ data: [] })),
				api.get('/tenants/plans/').catch(() => ({ data: [] })),
			]);
			setSubscription(subRes.data);
			setHistory(histRes.data || []);
			setPlans(plansRes.data || []);
		} catch (e) {
			console.error('Failed to load subscription', e);
			toast.error('Failed to load subscription');
		} finally {
			setLoading(false);
		}
	};

	const handleRenew = async (e) => {
		e.preventDefault();
		if (!subscription) return;
		try {
			setSubmitting(true);
			const fd = new FormData();
			fd.append('duration_months', renewForm.duration_months);
			fd.append('payment_method', renewForm.payment_method);
			fd.append('reference_number', renewForm.reference_number);
			fd.append('notes', renewForm.notes);
			if (renewForm.screenshot) fd.append('screenshot', renewForm.screenshot);
			await api.post(`/tenants/subscriptions/${subscription.id}/renew/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
			toast.success('Renewal request submitted');
			setShowRenewModal(false);
			fetchData();
		} catch (e) {
			toast.error(e.response?.data?.error || 'Failed to submit renewal');
		} finally {
			setSubmitting(false);
		}
	};

	const handleUpgrade = async (e) => {
		e.preventDefault();
		if (!subscription || !upgradeForm.plan_id) return;
		try {
			setSubmitting(true);
			const fd = new FormData();
			fd.append('plan_id', upgradeForm.plan_id);
			fd.append('payment_method', upgradeForm.payment_method);
			fd.append('reference_number', upgradeForm.reference_number);
			fd.append('notes', upgradeForm.notes);
			if (upgradeForm.screenshot) fd.append('screenshot', upgradeForm.screenshot);
			await api.post(`/tenants/subscriptions/${subscription.id}/change_plan/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
			toast.success('Plan change request submitted');
			setShowUpgradeModal(false);
			fetchData();
		} catch (e) {
			toast.error(e.response?.data?.error || 'Failed to change plan');
		} finally {
			setSubmitting(false);
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case 'active': return 'bg-green-100 text-green-800';
			case 'expired': return 'bg-red-100 text-red-800';
			case 'pending': return 'bg-yellow-100 text-yellow-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	};

	const availablePlans = plans.filter(p => !subscription || p.id !== subscription.plan);

	if (loading) return <div className="text-center py-8">Loading subscription...</div>;

	return (
		<div className="max-w-4xl mx-auto">
			<h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Subscription</h2>

			{subscription && (
				<div className="card mb-6">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
					<div>
						<h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{subscription.tenant_name || 'My Business'}</h3>
						<p className="text-sm" style={{ color: 'var(--text-muted)' }}>
							{subscription.plan_price} ETB/month · Expires {new Date(subscription.end_date).toLocaleDateString()}
						</p>
						<p className="text-xs" style={{ color: 'var(--text-muted)' }}>{subscription.tenant_email}</p>
					</div>
					<span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(subscription.status)}`}>{subscription.status}</span>
				</div>
					<div className="grid grid-cols-2 gap-4 mb-4">
						<div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
							<p className="text-xs" style={{ color: 'var(--text-muted)' }}>Branches</p>
							<p className="font-semibold">{subscription.branches_used || 0} / {subscription.branches_limit || '-'}</p>
						</div>
						<div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
							<p className="text-xs" style={{ color: 'var(--text-muted)' }}>Menu Items</p>
							<p className="font-semibold">{subscription.items_used || 0} / {subscription.items_limit || '-'}</p>
						</div>
					</div>
					<div className="flex flex-wrap gap-2">
						<button onClick={() => setShowRenewModal(true)} className="btn-primary">Renew Subscription</button>
						{availablePlans.length > 0 && (
							<button onClick={() => setShowUpgradeModal(true)} className="btn-secondary">Change Plan</button>
						)}
					</div>
				</div>
			)}

			<h3 className="text-lg font-semibold mb-3">Available Plans</h3>
			{plans.length === 0 ? (
				<div className="card text-center py-8" style={{ color: 'var(--text-muted)' }}>No plans available</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
					{plans.map((plan) => (
						<div key={plan.id} className={`card ${subscription && subscription.plan === plan.id ? 'ring-2 ring-blue-500' : ''}`}>
							<h4 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{plan.name}</h4>
							<p className="text-2xl font-bold mt-1" style={{ color: 'var(--accent)' }}>{plan.price_monthly} ETB</p>
							<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>/month</p>
							<ul className="mt-3 space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
								<li>• {plan.max_branches} Branch{plan.max_branches !== 1 ? 'es' : ''}</li>
								<li>• {plan.max_items === 999999 ? 'Unlimited' : plan.max_items} Items</li>
							</ul>
							{subscription && subscription.plan === plan.id && (
								<span className="inline-block mt-3 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">Current Plan</span>
							)}
						</div>
					))}
				</div>
			)}

			<h3 className="text-lg font-semibold mb-3">Subscription History</h3>
			{history.length === 0 ? (
				<div className="card text-center py-8" style={{ color: 'var(--text-muted)' }}>No history yet</div>
			) : (
				<div className="space-y-3">
					{history.map((h) => (
						<div key={h.id} className="card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
							<div>
								<p className="font-medium" style={{ color: 'var(--text-primary)' }}>{h.plan_name || 'Plan'}</p>
								<p className="text-sm" style={{ color: 'var(--text-muted)' }}>
									{new Date(h.start_date).toLocaleDateString()} - {new Date(h.end_date).toLocaleDateString()}
								</p>
							</div>
							<span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(h.status)}`}>{h.status}</span>
						</div>
					))}
				</div>
			)}

			{showRenewModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowRenewModal(false)}>
					<div className="card max-w-md w-full" onClick={(e) => e.stopPropagation()}>
						<h3 className="text-lg font-semibold mb-4">Renew Subscription</h3>
						<form onSubmit={handleRenew} className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-1">Duration</label>
								<select value={renewForm.duration_months} onChange={(e) => setRenewForm({ ...renewForm, duration_months: Number(e.target.value) })} className="input-field">
									<option value="1">1 Month</option>
									<option value="3">3 Months</option>
									<option value="6">6 Months</option>
									<option value="12">12 Months</option>
								</select>
							</div>
							<div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
								<p className="text-sm" style={{ color: 'var(--text-muted)' }}>Amount to pay</p>
								<p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{subscription.plan_price} ETB</p>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Payment Method</label>
								<select value={renewForm.payment_method} onChange={(e) => setRenewForm({ ...renewForm, payment_method: e.target.value })} className="input-field">
									<option>Bank Transfer</option>
									<option>Telelebirr</option>
									<option>Cash</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Reference Number</label>
								<input value={renewForm.reference_number} onChange={(e) => setRenewForm({ ...renewForm, reference_number: e.target.value })} className="input-field" />
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Notes</label>
								<textarea value={renewForm.notes} onChange={(e) => setRenewForm({ ...renewForm, notes: e.target.value })} className="input-field" rows="3" />
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Screenshot</label>
								<input type="file" accept="image/*" onChange={(e) => setRenewForm({ ...renewForm, screenshot: e.target.files[0] })} />
							</div>
							<div className="flex gap-3">
								<button type="button" onClick={() => setShowRenewModal(false)} className="btn-secondary flex-1">Cancel</button>
								<button type="submit" disabled={submitting} className="btn-primary flex-1">{submitting ? 'Submitting...' : 'Submit'}</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{showUpgradeModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowUpgradeModal(false)}>
					<div className="card max-w-md w-full" onClick={(e) => e.stopPropagation()}>
						<h3 className="text-lg font-semibold mb-4">Change Plan</h3>
						<form onSubmit={handleUpgrade} className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-1">Select New Plan</label>
								<select value={upgradeForm.plan_id} onChange={(e) => setUpgradeForm({ ...upgradeForm, plan_id: e.target.value })} className="input-field">
									<option value="">Select a plan</option>
									{availablePlans.map((plan) => (
										<option key={plan.id} value={plan.id}>{plan.name} - {plan.price_monthly} ETB/month</option>
									))}
								</select>
							</div>
							{upgradeForm.plan_id && (
								<div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
									<p className="text-sm" style={{ color: 'var(--text-muted)' }}>Amount to pay</p>
									<p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
										{plans.find(p => p.id === upgradeForm.plan_id)?.price_monthly || 0} ETB
									</p>
								</div>
							)}
							<div>
								<label className="block text-sm font-medium mb-1">Payment Method</label>
								<select value={upgradeForm.payment_method} onChange={(e) => setUpgradeForm({ ...upgradeForm, payment_method: e.target.value })} className="input-field">
									<option>Bank Transfer</option>
									<option>Telelebirr</option>
									<option>Cash</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Reference Number</label>
								<input value={upgradeForm.reference_number} onChange={(e) => setUpgradeForm({ ...upgradeForm, reference_number: e.target.value })} className="input-field" />
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Notes</label>
								<textarea value={upgradeForm.notes} onChange={(e) => setUpgradeForm({ ...upgradeForm, notes: e.target.value })} className="input-field" rows="3" />
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Screenshot</label>
								<input type="file" accept="image/*" onChange={(e) => setUpgradeForm({ ...upgradeForm, screenshot: e.target.files[0] })} />
							</div>
							<div className="flex gap-3">
								<button type="button" onClick={() => setShowUpgradeModal(false)} className="btn-secondary flex-1">Cancel</button>
								<button type="submit" disabled={submitting || !upgradeForm.plan_id} className="btn-primary flex-1">{submitting ? 'Submitting...' : 'Submit'}</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}

export default Subscriptions;
