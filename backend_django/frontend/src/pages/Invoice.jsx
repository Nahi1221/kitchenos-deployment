import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

function Invoice() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await api.get(`/orders/invoice/${orderId}/`);
        setInvoice(res.data);
      } catch (e) {
        console.error('Failed to load invoice', e);
        toast.error('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (value) => {
    const num = Number(value);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) return <div className="text-center py-8">Loading invoice...</div>;
  if (!invoice) return <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Invoice not found</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="no-print flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Invoice</h2>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/orders/${orderId}`)} className="btn-secondary">Back to Order</button>
          <button onClick={handlePrint} className="btn-primary">Print</button>
        </div>
      </div>

      <div className="card" id="invoice-content">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>KitchenOS</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Invoice Receipt</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Invoice #</p>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{invoice.invoice_number}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Order #</p>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>#{invoice.order_number}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Date</p>
            <p style={{ color: 'var(--text-primary)' }}>{new Date(invoice.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Payment Method</p>
            <p className="capitalize" style={{ color: 'var(--text-primary)' }}>{invoice.payment_method || 'N/A'}</p>
          </div>
        </div>

        <div className="border-t border-b py-4 mb-4" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-semibold mb-3">Items</h3>
          {invoice.items && invoice.items.length > 0 ? (
            <div className="space-y-2">
              {invoice.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <div>
                    <span style={{ color: 'var(--text-primary)' }}>{item.item_name || 'Item'} x{item.quantity}</span>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>({item.modifiers.map(m => m.modifier_name || m.name).join(', ')})</span>
                    )}
                  </div>
                  <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(item.total || (item.unit_price * item.quantity))} ETB</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No items</p>
          )}
        </div>

        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
            <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(invoice.subtotal)} ETB</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>Tax</span>
            <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(invoice.tax)} ETB</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <span style={{ color: 'var(--text-primary)' }}>Total</span>
            <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(invoice.total)} ETB</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>Amount Paid</span>
            <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(invoice.amount_paid)} ETB</span>
          </div>
          {Number(invoice.change) > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Change</span>
              <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(invoice.change)} ETB</span>
            </div>
          )}
        </div>

        <div className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          <p>Thank you for your business!</p>
          <p>KitchenOS - {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}

export default Invoice;
