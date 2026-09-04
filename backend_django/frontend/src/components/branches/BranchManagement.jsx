import { useState, useEffect } from 'react';
import BranchList from './BranchList';
import BranchForm from './BranchForm';
import api from '../../services/api';
import toast from 'react-hot-toast';

function BranchManagement() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [qrBranch, setQrBranch] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrImage, setQrImage] = useState(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/branches/');
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (data) => {
    try {
      const response = await api.post('/branches/', data);
      toast.success('Branch created successfully!');
      setShowForm(false);
      fetchBranches();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create branch');
    }
  };

  const handleEdit = async (id, data) => {
    try {
      await api.put(`/branches/${id}/`, data);
      toast.success('Branch updated successfully!');
      setEditingBranch(null);
      setShowForm(false);
      fetchBranches();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update branch');
    }
  };

  const handleDelete = async (id) => {
    if (branches.length <= 1) {
      toast.error('Cannot delete the last branch');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this branch?')) return;
    try {
      await api.delete(`/branches/${id}/`);
      toast.success('Branch deleted successfully!');
      fetchBranches();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete branch');
    }
  };

  const handleViewQR = async (branch) => {
    setQrBranch(branch);
    setQrLoading(true);
    setQrImage(null);
    try {
      const res = await api.get(`/branches/${branch.id}/qr-code/`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      setQrImage(url);
    } catch (e) {
      console.error('Failed to load QR code', e);
      toast.error('Failed to load QR code');
      setQrBranch(null);
    } finally {
      setQrLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrImage) return;
    const link = document.createElement('a');
    link.href = qrImage;
    link.download = `${qrBranch.name}-qrcode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <BranchList
        branches={branches}
        onAdd={() => { setEditingBranch(null); setShowForm(true); }}
        onEdit={(branch) => { setEditingBranch(branch); setShowForm(true); }}
        onDelete={handleDelete}
        onViewQR={handleViewQR}
      />
      {showForm && (
        <BranchForm
          branch={editingBranch}
          onClose={() => { setShowForm(false); setEditingBranch(null); }}
          onSave={(data) => {
            if (editingBranch) handleEdit(editingBranch.id, data);
            else handleAdd(data);
          }}
        />
      )}
      {qrBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => { setQrBranch(null); setQrImage(null); }}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 max-w-sm w-full" style={{ border: '1px solid var(--border-color)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{qrBranch.name} QR Code</h3>
              <button onClick={() => { setQrBranch(null); setQrImage(null); }} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" style={{ color: 'var(--text-muted)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {qrLoading ? (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Loading QR code...</div>
            ) : qrImage ? (
              <div className="text-center">
                <img src={qrImage} alt="QR Code" className="mx-auto mb-4 max-w-full" style={{ maxHeight: '300px' }} />
                <div className="flex gap-2">
                  <button onClick={handleDownloadQR} className="btn-primary flex-1">Download PNG</button>
                  <button onClick={() => window.print()} className="btn-secondary flex-1">Print</button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Failed to load QR code</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BranchManagement;