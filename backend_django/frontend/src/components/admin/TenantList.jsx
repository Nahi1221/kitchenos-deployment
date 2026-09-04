import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

function TenantList() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'all' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    fetchTenants();
  }, [filters]);

  useEffect(() => {
    setSelectedIds([]);
  }, [filters]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status !== 'all') params.status = filters.status;
      const response = await api.get('/admin/tenants/', { params });
      setTenants(response.data);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(tenants.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return;
    const actionMap = {
      'suspend': '/admin/tenants/bulk-suspend/',
      'activate': '/admin/tenants/bulk-activate/',
      'delete': '/admin/tenants/bulk-delete/',
    };
    const url = actionMap[bulkAction];
    if (!url) return;
    const confirmMsg = bulkAction === 'delete'
      ? `Permanently delete ${selectedIds.length} tenant(s)? This cannot be undone.`
      : `${bulkAction} ${selectedIds.length} tenant(s)?`;
    if (!window.confirm(confirmMsg)) return;
    try {
      await api.post(url, { ids: selectedIds });
      toast.success(`Bulk ${bulkAction} completed`);
      setSelectedIds([]);
      setBulkAction('');
      fetchTenants();
    } catch (e) {
      toast.error(e.response?.data?.error || `Failed to ${bulkAction}`);
    }
  };

  const handleSuspend = async (id) => {
    if (!window.confirm('Suspend this tenant? They will not be able to access their account.')) return;
    try {
      await api.post(`/admin/tenants/suspend/${id}/`);
      toast.success('Tenant suspended');
      fetchTenants();
    } catch (e) {
      console.error('Suspend error:', e);
      toast.error(e.response?.data?.error || 'Failed to suspend');
    }
  };

  const handleActivate = async (id) => {
    try {
      await api.post(`/admin/tenants/activate/${id}/`);
      toast.success('Tenant activated');
      fetchTenants();
    } catch (e) {
      console.error('Activate error:', e);
      toast.error(e.response?.data?.error || 'Failed to activate');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tenant permanently? This cannot be undone.')) return;
    try {
      await api.post(`/admin/tenants/delete/${id}/`);
      toast.success('Tenant deleted');
      fetchTenants();
    } catch (e) {
      console.error('Delete error:', e);
      toast.error(e.response?.data?.error || 'Failed to delete');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'ACTIVE': 'var(--success)',
      'PENDING_APPROVAL': 'var(--warning)',
      'SUSPENDED': 'var(--error)',
      'REJECTED': 'var(--error)',
    };
    return colors[status] || 'var(--text-muted)';
  };

  if (loading) return <div className="card text-center py-12">Loading tenants...</div>;

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>All Tenants ({tenants.length})</h2>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-1.5 rounded-lg text-sm"
          style={{
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)'
          }}
        >
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING_APPROVAL">Pending</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>
                <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.length === tenants.length && tenants.length > 0} />
              </th>
              <th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Business</th>
              <th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Email</th>
              <th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Branches</th>
              <th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Status</th>
              <th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Registered</th>
              <th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td className="py-3 px-4">
                  <input type="checkbox" checked={selectedIds.includes(tenant.id)} onChange={() => toggleSelect(tenant.id)} />
                </td>
                <td className="py-3 px-4" style={{ color: 'var(--text-primary)' }}>{tenant.business_name}</td>
                <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{tenant.email}</td>
                <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{tenant.branches}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded-full text-xs" style={{
                    backgroundColor: getStatusColor(tenant.status),
                    color: '#ffffff'
                  }}>{tenant.status.replace('_', ' ')}</span>
                </td>
                <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    {tenant.status === 'ACTIVE' || tenant.status === 'active' ? (
                      <button onClick={() => handleSuspend(tenant.id)} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--warning)', color: '#fff' }}>Suspend</button>
                    ) : tenant.status === 'SUSPENDED' || tenant.status === 'suspended' ? (
                      <button onClick={() => handleActivate(tenant.id)} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--success)', color: '#fff' }}>Activate</button>
                    ) : null}
                    <button onClick={() => handleDelete(tenant.id)} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--error)', color: '#fff' }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedIds.length > 0 && (
        <div className="mt-4 p-3 rounded-lg flex items-center gap-3" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedIds.length} selected</span>
          <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className="px-3 py-1.5 rounded-lg text-sm" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
            <option value="">Bulk action...</option>
            <option value="suspend">Suspend</option>
            <option value="activate">Activate</option>
            <option value="delete">Delete</option>
          </select>
          <button onClick={handleBulkAction} disabled={!bulkAction} className="btn-primary text-sm disabled:opacity-50">Apply</button>
          <button onClick={() => setSelectedIds([])} className="text-sm" style={{ color: 'var(--text-muted)' }}>Clear</button>
        </div>
      )}
    </div>
  );
}

export default TenantList;
