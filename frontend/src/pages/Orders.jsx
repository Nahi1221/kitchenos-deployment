import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useBranch } from '../contexts/BranchContext';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranchId } = useBranch();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (selectedBranchId) params.branch_id = selectedBranchId;
      const res = await api.get('/orders/', { params });
      setOrders(res.data || []);
    } catch (e) {
      console.error('Failed to load orders', e);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, selectedBranchId]);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    preparing: 'bg-blue-100 text-blue-800',
    ready: 'bg-purple-100 text-purple-800',
    served: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const formatCurrency = (value) => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) return <div className="text-center py-8">Loading orders...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Orders</h2>
        <button onClick={() => navigate('/orders/new')} className="btn-primary">
          + New Order
        </button>
      </div>

      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-full sm:w-48"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="served">Served</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {orders.length === 0 ? (
        <div className="card text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <p className="text-lg mb-2">No orders found</p>
          <p className="text-sm">Create a new order to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div key={order.id} className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>#{order.order_number}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{order.customer_name || 'Guest'}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(order.total)} ETB
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
