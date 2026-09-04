import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

function PendingApprovals() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [previewScreenshot, setPreviewScreenshot] = useState(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/approvals/');
      setPending(response.data);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setProcessing(id);
      const response = await api.post(`/admin/approve/${id}/`);
      toast.success(`✅ Tenant approved! Credentials sent to ${response.data.tenant?.email || 'tenant email'}.`, { duration: 5000 });
      fetchPending();
    } catch (error) {
      console.error('Error approving:', error);
      toast.error('Failed to approve tenant');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.confirm('Reject this tenant? Click OK to reject.') ? 'Rejected by admin' : null;
    if (reason === null) return;
    try {
      setProcessing(id);
      await api.post(`/admin/reject/${id}/`, { reason });
      toast.success('❌ Tenant rejected');
      fetchPending();
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error(error.response?.data?.error || 'Failed to reject tenant');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="card text-center py-12">Loading pending approvals...</div>;
  if (pending.length === 0) return <div className="card text-center py-12">✅ No pending approvals!</div>;

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Pending Approvals ({pending.length})</h2>
      <div className="space-y-4">
        {pending.map((item) => (
          <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="flex-1">
              <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.business_name || item.name}</h4>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.email} · {item.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Registered: {new Date(item.date).toLocaleDateString()}
                {item.amount > 0 && ` · Amount: ${item.amount} ETB`}
                {item.method && ` · Method: ${item.method}`}
              </p>
              {item.reference_number && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ref: {item.reference_number}</p>}
              {item.notes && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Notes: {item.notes}</p>}
            </div>
            <div className="flex flex-col items-end gap-2">
              {item.screenshot && (
                <button onClick={() => setPreviewScreenshot(item.screenshot)} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
                  📷 View Receipt
                </button>
              )}
              <div className="flex gap-2">
                <button onClick={() => handleApprove(item.id)} disabled={processing === item.id} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--success)', color: '#fff', opacity: processing === item.id ? 0.6 : 1 }}>{processing === item.id ? 'Processing...' : '✅ Approve'}</button>
                <button onClick={() => handleReject(item.id)} disabled={processing === item.id} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--error)', color: '#fff', opacity: processing === item.id ? 0.6 : 1 }}>❌ Reject</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {previewScreenshot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setPreviewScreenshot(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-4 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Payment Receipt</h3>
              <button onClick={() => setPreviewScreenshot(null)} className="p-1 rounded-lg hover:bg-gray-100" style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>
            <img src={previewScreenshot} alt="Payment receipt" className="w-full rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}

export default PendingApprovals;