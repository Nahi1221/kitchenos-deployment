import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

function BranchForm({ onClose, onSave, branch }) {
  const [formData, setFormData] = useState({
    name: branch?.name || '',
    location: branch?.location || '',
    phone: branch?.phone || '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Branch name is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md transition-all duration-300" style={{ border: '1px solid var(--border-color)' }}>
        <div className="flex justify-between items-center p-4 sm:p-6 border-b dark:border-gray-700" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {branch ? 'Edit Branch' : 'Add New Branch'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" style={{ color: 'var(--text-muted)' }}>
            <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Branch Name *</label>
            <input
              type="text" name="name" value={formData.name} onChange={handleChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: errors.name ? '1px solid var(--error)' : '1px solid var(--border-color)',
                outline: 'none'
              }}
              placeholder="e.g., Main Branch"
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
            {errors.name && <p className="mt-1 text-xs sm:text-sm" style={{ color: 'var(--error)' }}>{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Location *</label>
            <input
              type="text" name="location" value={formData.location} onChange={handleChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: errors.location ? '1px solid var(--error)' : '1px solid var(--border-color)',
                outline: 'none'
              }}
              placeholder="e.g., Bole, Addis Ababa"
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
            {errors.location && <p className="mt-1 text-xs sm:text-sm" style={{ color: 'var(--error)' }}>{errors.location}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Phone (Optional)</label>
            <input
              type="tel" name="phone" value={formData.phone} onChange={handleChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                outline: 'none'
              }}
              placeholder="e.g., +251 9XX XXX XXX"
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary w-full sm:flex-1 text-sm sm:text-base">Cancel</button>
            <button type="submit" className="btn-primary w-full sm:flex-1 text-sm sm:text-base">{branch ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BranchForm;