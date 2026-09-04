import { useTheme } from '../../contexts/ThemeContext';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300"
      style={{
        backgroundColor: isDark ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
        color: isDark ? 'var(--text-primary)' : 'var(--text-secondary)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: '500'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Icon */}
      <span style={{ fontSize: '1.1rem' }}>
        {isDark ? '🌙' : '☀️'}
      </span>
      
      {/* Label */}
      <span>{isDark ? 'Dark' : 'Light'}</span>
      
      {/* Small indicator dot */}
      <span 
        className="w-2 h-2 rounded-full transition-all duration-300"
        style={{
          backgroundColor: isDark ? 'var(--accent)' : 'var(--success)',
          boxShadow: isDark ? '0 0 8px var(--accent)' : '0 0 8px var(--success)'
        }}
      />
    </button>
  );
}

export default ThemeToggle;