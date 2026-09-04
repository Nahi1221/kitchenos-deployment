import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

function Settings() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Settings</h2>

      <div className="card mb-6">
        <h3 className="font-semibold mb-4">Appearance</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Theme</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Switch between light and dark mode</p>
          </div>
          <button onClick={toggleTheme} className="btn-primary">
            {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="font-semibold mb-4">Account</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Profile</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Edit your personal and business information</p>
            </div>
            <button onClick={() => navigate('/profile')} className="btn-secondary">Edit Profile</button>
          </div>
          <div className="border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Password</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Change your account password</p>
              </div>
              <button onClick={() => navigate('/profile')} className="btn-secondary">Change Password</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4 text-red-600">Danger Zone</h3>
        <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Log out of your account on this device.</p>
        <button onClick={logout} className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--error)', color: '#fff' }}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Settings;
