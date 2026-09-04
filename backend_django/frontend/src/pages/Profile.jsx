import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

function Profile() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    business_name: '',
    business_location: ''
  });
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get('/auth/profile/');
        setProfile({
          name: res.data.name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          business_name: res.data.business_name || '',
          business_location: res.data.business_location || ''
        });
      } catch (e) {
        console.error('Failed to load profile', e);
        toast.error('Failed to load profile');
      }
    }
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!profile.name.trim()) newErrors.name = 'Name is required';
    if (!profile.email.trim()) newErrors.email = 'Email is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const res = await api.put('/auth/profile/', profile);
      setUser(res.data);
      toast.success('Profile updated successfully');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!passwordData.old_password) newErrors.old_password = 'Old password is required';
    if (!passwordData.new_password) newErrors.new_password = 'New password is required';
    if (passwordData.new_password.length < 8) newErrors.new_password = 'Password must be at least 8 characters';
    if (passwordData.new_password !== passwordData.confirm_password) newErrors.confirm_password = 'Passwords do not match';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/change-password/', {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password
      });
      toast.success('Password changed successfully');
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
      setShowPasswordForm(false);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Profile</h2>

      <div className="card mb-6">
        <h3 className="font-semibold mb-4">Profile Information</h3>
        <form onSubmit={handleProfileSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
            <input type="text" name="name" value={profile.name} onChange={handleChange} className="input-field" />
            {errors.name && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Email</label>
            <input type="email" name="email" value={profile.email} onChange={handleChange} className="input-field" />
            {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Phone</label>
            <input type="tel" name="phone" value={profile.phone} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Business Name</label>
            <input type="text" name="business_name" value={profile.business_name} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Business Location</label>
            <input type="text" name="business_location" value={profile.business_location} onChange={handleChange} className="input-field" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Change Password</h3>
          {!showPasswordForm && (
            <button onClick={() => setShowPasswordForm(true)} className="btn-secondary text-sm">Change Password</button>
          )}
        </div>
        {showPasswordForm && (
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Old Password</label>
              <input type="password" name="old_password" value={passwordData.old_password} onChange={handlePasswordChange} className="input-field" />
              {errors.old_password && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.old_password}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>New Password</label>
              <input type="password" name="new_password" value={passwordData.new_password} onChange={handlePasswordChange} className="input-field" />
              {errors.new_password && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.new_password}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Confirm New Password</label>
              <input type="password" name="confirm_password" value={passwordData.confirm_password} onChange={handlePasswordChange} className="input-field" />
              {errors.confirm_password && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.confirm_password}</p>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowPasswordForm(false); setPasswordData({ old_password: '', new_password: '', confirm_password: '' }); }} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Profile;
