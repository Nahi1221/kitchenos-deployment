import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${id}/`);
      setOrder(res.data);
    } catch (e) {
      console.error('Failed to load order', e);
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const updateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      await api.patch(`/orders/${id}/status/`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchOrder();
    } catch (e) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getNextStatus = (current) => {
    const flow = ['pending', 'preparing', 'ready', 'served', 'completed'];
    const idx = flow.indexOf(current);
    if (idx >= 0 && idx < flow.length - 1) return flow[idx + 1];
    return null;
  };

  const formatCurrency = (value) => {
    const num = Number(value);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) return <div className="text-center py-8">Loading order...</div>;
  if (!order) return <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Order not found</div>;

  const nextStatus = getNextStatus(order.status);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Order #{order.order_number}</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          {nextStatus && (
            <button onClick={() => updateStatus(nextStatus)} disabled={updating} className="btn-primary">
              {updating ? 'Updating...' : `Mark as ${nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}`}
            </button>
          )}
          {order.invoice && (
            <button onClick={() => navigate(`/orders/invoice/${order.id}`)} className="btn-secondary">
              View Invoice
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Status</h3>
          <span className={`inline-block px-3 py-1 rounded-full text-sm capitalize ${
            order.status === 'completed' ? 'bg-green-100 text-green-800' :
            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
            order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
            order.status === 'ready' ? 'bg-purple-100 text-purple-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {order.status}
          </span>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Order Type</h3>
          <p className="capitalize" style={{ color: 'var(--text-primary)' }}>{order.order_type?.replace('_', ' ') || 'N/A'}</p>
          {order.table_number && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Table: {order.table_number}</p>}
        </div>
      </div>

      {(order.customer_name || order.customer_phone) && (
        <div className="card mb-4">
          <h3 className="font-semibold mb-2">Customer Info</h3>
          {order.customer_name && <p style={{ color: 'var(--text-primary)' }}>{order.customer_name}</p>}
          {order.customer_phone && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{order.customer_phone}</p>}
        </div>
      )}

      {order.notes && (
        <div className="card mb-4">
          <h3 className="font-semibold mb-2">Notes</h3>
          <p style={{ color: 'var(--text-primary)' }}>{order.notes}</p>
        </div>
      )}

      <div className="card mb-4">
        <h3 className="font-semibold mb-3">Items</h3>
        {order.items && order.items.length > 0 ? (
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start py-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <div>
                  <div className="font-medium">{item.item_name || item.item?.name || 'Unknown Item'}</div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Qty: {item.quantity}</div>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Modifiers: {item.modifiers.map(m => m.modifier_name || m.name).join(', ')}
                    </div>
                  )}
                </div>
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(item.total || (item.unit_price * item.quantity))} ETB
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No items</p>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Totals</h3>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
            <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(order.subtotal)} ETB</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>Tax</span>
            <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(order.tax)} ETB</span>
          </div>
          <div className="flex justify-between font-semibold text-base pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <span style={{ color: 'var(--text-primary)' }}>Total</span>
            <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(order.total)} ETB</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
