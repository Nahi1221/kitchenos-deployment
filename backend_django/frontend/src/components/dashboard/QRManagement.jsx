import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

function QRManagement() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrBranch, setQrBranch] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrImage, setQrImage] = useState(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await api.get('/branches/');
      setBranches(res.data || []);
    } catch (e) {
      console.error('Failed to load branches', e);
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
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

  if (loading) return <div className="card text-center py-12">Loading branches...</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>QR Codes</h2>
      {branches.length === 0 ? (
        <div className="card text-center py-12" style={{ color: 'var(--text-muted)' }}>No branches found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <div key={branch.id} className="card hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{branch.name}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{branch.location}</p>
                </div>
                <span className="px-2 py-1 rounded-full text-xs" style={{
                  backgroundColor: branch.is_active ? 'var(--success)' : 'var(--error)',
                  color: '#ffffff'
                }}>{branch.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <button
                onClick={() => handleViewQR(branch)}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-1.036.84-1.875 1.875-1.875h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 013.75 9.375v-4.5zM3.75 14.625c0-1.036.84-1.875 1.875-1.875h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5a1.875 1.875 0 01-1.875-1.875v-4.5zM13.5 4.875c0-1.036.84-1.875 1.875-1.875h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 0113.5 9.375v-4.5z" />
                </svg>
                View QR Code
              </button>
            </div>
          ))}
        </div>
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

export default QRManagement;
