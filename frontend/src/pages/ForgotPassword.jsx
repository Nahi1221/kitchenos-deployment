import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

function ForgotPassword() {
	const [email, setEmail] = useState('');
	const [submitted, setSubmitted] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!email) return toast.error('Email is required');
		try {
			setLoading(true);
			await api.post('/auth/forgot-password/', { email });
			setSubmitted(true);
			toast.success('Check console for reset link');
		} catch (err) {
			toast.error(err.response?.data?.error || 'Failed to request reset');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
			<div className="w-full max-w-md rounded-2xl shadow-lg p-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
				<div className="text-center">
					<div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--accent)' }}>
						<span className="text-white text-2xl font-bold">K</span>
					</div>
					<h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>KitchenOS</h1>
					<p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Reset your password</p>
				</div>

				<form onSubmit={handleSubmit} className="mt-8 space-y-5">
					{submitted ? (
						<div className="p-4 rounded-lg text-sm" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
							<p>If an account exists, a reset link has been sent to {email}.</p>
							<p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>Check console for reset link (email is deferred in this demo).</p>
						</div>
					) : (
						<>
							<div>
								<label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email address</label>
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="w-full px-4 py-2.5 rounded-lg"
									style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none' }}
									placeholder="you@restaurant.com"
									required
								/>
							</div>
							<button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg font-medium" style={{ backgroundColor: 'var(--accent)', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
								{loading ? 'Sending...' : 'Send Reset Link'}
							</button>
						</>
					)}
					<p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
						<Link to="/login" style={{ color: 'var(--accent)' }}>Back to login</Link>
					</p>
				</form>
			</div>
		</div>
	);
}

export default ForgotPassword;
