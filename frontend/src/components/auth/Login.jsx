import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

function Login() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { login, adminLogin } = useAuth();
  const isDark = theme === 'dark';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      const isAdmin = email.trim().toLowerCase() === 'admin@kitchenos.com';
      
      let result;
      if (isAdmin) {
        result = await adminLogin(email, password);
      } else {
        result = await login(email, password);
      }
      
      if (result.success) {
        const userType = result.user?.type;
        if (userType === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotMessage('');
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/forgot-password/', { email: forgotEmail });
      setForgotMessage(res.data?.message || 'If an account exists, a new password has been sent.');
      setForgotEmail('');
    } catch (err) {
      setForgotMessage(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      <div 
        className="w-full max-w-md rounded-2xl shadow-lg p-8 transition-all duration-300"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              backgroundColor: isDark ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
              color: isDark ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer'
            }}
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        <div className="text-center">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <span className="text-white text-2xl font-bold">K</span>
          </div>
          <h1 
            className="text-3xl font-bold transition-colors duration-300"
            style={{ color: 'var(--text-primary)' }}
          >
            KitchenOS
          </h1>
          <p 
            className="mt-2 text-sm transition-colors duration-300"
            style={{ color: 'var(--text-secondary)' }}
          >
            Restaurant Management System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div 
              className="p-3 rounded-lg text-sm"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--error)',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}
            >
              {error}
            </div>
          )}
          
          <div>
            <label 
              className="block text-sm font-medium mb-1.5 transition-colors duration-300"
              style={{ color: 'var(--text-secondary)' }}
            >
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                outline: 'none'
              }}
              placeholder="you@restaurant.com"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-1.5 transition-colors duration-300"
              style={{ color: 'var(--text-secondary)' }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                outline: 'none'
              }}
              placeholder="••••••••"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg font-medium transition-all duration-200"
            style={{
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="flex items-center justify-between">
            <p 
              className="text-sm transition-colors duration-300"
              style={{ color: 'var(--text-secondary)' }}
            >
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="font-medium transition-colors duration-200"
                style={{ color: 'var(--accent)' }}
              >
                Create one
              </Link>
            </p>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: 'var(--accent)' }}
            >
              Forgot Password?
            </button>
          </div>

          <div 
            className="mt-4 p-3 rounded-lg text-center text-xs"
            style={{
              backgroundColor: isDark ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-color)'
            }}
          >
            Demo: admin@kitchenos.com / admin123
          </div>
        </form>

        {showForgotPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowForgotPassword(false)}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 max-w-sm w-full" style={{ border: '1px solid var(--border-color)' }} onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Forgot Password</h3>
                <button onClick={() => setShowForgotPassword(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" style={{ color: 'var(--text-muted)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Email address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg text-sm"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      outline: 'none'
                    }}
                    placeholder="you@restaurant.com"
                    required
                  />
                </div>
                <button type="submit" disabled={forgotLoading} className="w-full py-2.5 rounded-lg font-medium text-sm" style={{ backgroundColor: 'var(--accent)', color: '#fff', border: 'none', cursor: forgotLoading ? 'not-allowed' : 'pointer', opacity: forgotLoading ? 0.7 : 1 }}>
                  {forgotLoading ? 'Sending...' : 'Send New Password'}
                </button>
                {forgotMessage && (
                  <p className="text-xs text-center mt-2" style={{ color: forgotMessage.includes('sent') || forgotMessage.includes('account exists') ? 'var(--success)' : 'var(--error)' }}>
                    {forgotMessage}
                  </p>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;