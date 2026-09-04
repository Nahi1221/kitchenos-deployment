import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

function AdminSettings() {
	const [settings, setSettings] = useState({});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		fetchSettings();
	}, []);

	const fetchSettings = async () => {
		try {
			setLoading(true);
			const res = await api.get('/admin/settings/');
			setSettings(res.data || {});
		} catch (e) {
			console.error('Failed to load settings', e);
			toast.error('Failed to load settings');
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (key, value) => {
		setSettings(prev => ({ ...prev, [key]: value }));
	};

	const handleSave = async () => {
		try {
			setSaving(true);
			await api.put('/admin/settings/', settings);
			toast.success('Settings updated');
		} catch (e) {
			toast.error('Failed to update settings');
		} finally {
			setSaving(false);
		}
	};

	if (loading) return <div className="card text-center py-12">Loading settings...</div>;

	return (
		<div className="max-w-3xl">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Settings</h2>
				<button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Settings'}</button>
			</div>
			<div className="card space-y-4">
				{Object.keys(settings).length === 0 ? (
					<p style={{ color: 'var(--text-muted)' }}>No settings found</p>
				) : (
					Object.entries(settings).map(([key, value]) => (
						<div key={key}>
							<label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{key.replace(/_/g, ' ')}</label>
							{typeof value === 'boolean' ? (
								<label className="relative inline-flex items-center cursor-pointer">
									<input type="checkbox" checked={value} onChange={(e) => handleChange(key, e.target.checked)} className="sr-only peer" />
									<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
								</label>
							) : (
								<input
									type="text"
									value={value || ''}
									onChange={(e) => handleChange(key, e.target.value)}
									className="input-field"
								/>
							)}
						</div>
					))
				)}
			</div>
		</div>
	);
}

export default AdminSettings;
