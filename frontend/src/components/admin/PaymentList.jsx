import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

function PaymentList() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') params.status = filter;
      const response = await api.get('/admin/payments/', { params });
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/admin/payments/approve/${id}/`);
      toast.success('Payment approved');
      fetchPayments();
    } catch (error) {
      toast.error('Failed to approve payment');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason:');
    if (reason === null) return;
    try {
      await api.post(`/admin/payments/reject/${id}/`, { reason });
      toast.success('Payment rejected');
      fetchPayments();
    } catch (error) {
      toast.error('Failed to reject payment');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'APPROVED': 'var(--success)',
      'PENDING': 'var(--warning)',
      'REJECTED': 'var(--error)',
    };
    return colors[status] || 'var(--text-muted)';
  };

  if (loading) return <div className="card text-center py-12">Loading payments...</div>;

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>All Payments ({payments.length})</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm"
          style={{
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)'
          }}
        >
          <option value="all">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Tenant</th>
              <th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Plan</th>
              <th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Subscription</th>
              <th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Amount</th>
              <th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Method</th>
              <th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Date</th>
              <th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Status</th>
              <th className="text-left py-3 px-4" style={{ color: 'var(--text-secondary)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td className="py-3 px-4" style={{ color: 'var(--text-primary)' }}>{payment.tenant}</td>
                <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{payment.plan_name || '-'}</td>
                <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{payment.subscription_status || '-'}</td>
                <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{payment.amount} ETB</td>
                <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{payment.method}</td>
                <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>
                  {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : '-'}
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded-full text-xs" style={{
                    backgroundColor: getStatusColor(payment.status),
                    color: '#ffffff'
                  }}>{payment.status}</span>
                </td>
                <td className="py-3 px-4">
                  {payment.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleApprove(payment.id)}
                        className="px-2 py-1 rounded text-xs mr-1"
                        style={{
                          backgroundColor: 'var(--success)',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >Approve</button>
                      <button
                        onClick={() => handleReject(payment.id)}
                        className="px-2 py-1 rounded text-xs"
                        style={{
                          backgroundColor: 'var(--error)',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PaymentList;