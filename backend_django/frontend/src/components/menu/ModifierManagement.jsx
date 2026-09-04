import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

function ModifierManagement({ itemId, itemName, onClose }) {
  const [modifiers, setModifiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingModifier, setEditingModifier] = useState(null);
  const [formData, setFormData] = useState({ name: '', price_adjustment: '' });
  const [errors, setErrors] = useState({});

  const fetchModifiers = async () => {
    if (!itemId) return;
    try {
      setLoading(true);
      const res = await api.get('/menu/modifiers/', { params: { item: itemId } });
      setModifiers(res.data || []);
    } catch (e) {
      console.error('Failed to load modifiers', e);
      toast.error('Failed to load modifiers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModifiers();
  }, [itemId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (formData.price_adjustment === '' || isNaN(Number(formData.price_adjustment))) newErrors.price_adjustment = 'Valid price adjustment required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (editingModifier) {
        await api.put(`/menu/modifiers/${editingModifier.id}/`, { ...formData, item: itemId });
        toast.success('Modifier updated');
      } else {
        await api.post('/menu/modifiers/', { ...formData, item: itemId });
        toast.success('Modifier added');
      }
      setFormData({ name: '', price_adjustment: '' });
      setShowForm(false);
      setEditingModifier(null);
      fetchModifiers();
    } catch (e) {
      toast.error(editingModifier ? 'Failed to update modifier' : 'Failed to add modifier');
    }
  };

  const handleEdit = (modifier) => {
    setEditingModifier(modifier);
    setFormData({ name: modifier.name, price_adjustment: modifier.price_adjustment });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this modifier?')) return;
    try {
      await api.delete(`/menu/modifiers/${id}/`);
      toast.success('Modifier deleted');
      fetchModifiers();
    } catch (e) {
      toast.error('Failed to delete modifier');
    }
  };

  if (!itemId) return null;

  return (
    <div className="card mt-3">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold">Modifiers for {itemName}</h4>
        <button onClick={() => { setShowForm(!showForm); setEditingModifier(null); setFormData({ name: '', price_adjustment: '' }); }} className="btn-primary text-sm">
          {showForm ? 'Cancel' : 'Add Modifier'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field text-sm"
                placeholder="e.g., Extra Cheese"
              />
              {errors.name && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Price Adjustment</label>
              <input
                type="number"
                name="price_adjustment"
                value={formData.price_adjustment}
                onChange={handleChange}
                className="input-field text-sm"
                placeholder="0.00"
                step="0.01"
              />
              {errors.price_adjustment && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.price_adjustment}</p>}
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button type="submit" className="btn-primary text-sm">{editingModifier ? 'Update' : 'Save'}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-4 text-sm" style={{ color: 'var(--text-muted)' }}>Loading modifiers...</div>
      ) : modifiers.length === 0 ? (
        <div className="text-center py-4 text-sm" style={{ color: 'var(--text-muted)' }}>No modifiers yet</div>
      ) : (
        <div className="space-y-2">
          {modifiers.map(m => (
            <div key={m.id} className="flex justify-between items-center py-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <div className="font-medium text-sm">{m.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Adjustment: {Number(m.price_adjustment).toFixed(2)} ETB</div>
              </div>
              <div className="flex space-x-1">
                <button onClick={() => handleEdit(m)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" style={{ color: 'var(--accent)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                </button>
                <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" style={{ color: 'var(--error)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.061-.94-1.75-1.816-1.816L17.25 3.75M6.75 21V3.75" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ModifierManagement;
