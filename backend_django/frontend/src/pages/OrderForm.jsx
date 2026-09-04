import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

function OrderForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [orderType, setOrderType] = useState('dine_in');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [itemsRes, branchesRes] = await Promise.all([
          api.get('/menu/items/', { params: { branch_id: branchId || undefined } }),
          api.get('/branches/')
        ]);
        setMenuItems(itemsRes.data || []);
        setBranches(branchesRes.data || []);
        if (branchesRes.data && branchesRes.data.length > 0 && !branchId) {
          setBranchId(branchesRes.data[0].id);
        }
      } catch (e) {
        console.error('Failed to load data', e);
        toast.error('Failed to load menu data');
      }
    }
    fetchData();
  }, []);

  const filteredItems = menuItems.filter(item => {
    if (!searchQuery.trim()) return true;
    return item.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const addToCart = (item) => {
    const existing = cart.find(c => c.item_id === item.id);
    if (existing) {
      setCart(cart.map(c => c.item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, {
        item_id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: 1,
        modifiers: [],
        available_modifiers: item.modifiers || []
      }]);
    }
  };

  const updateQuantity = (itemId, delta) => {
    setCart(cart.map(c => {
      if (c.item_id === itemId) {
        const newQty = c.quantity + delta;
        return newQty <= 0 ? null : { ...c, quantity: newQty };
      }
      return c;
    }).filter(Boolean));
  };

  const toggleModifier = (cartItem, modifier) => {
    setCart(cart.map(c => {
      if (c.item_id === cartItem.item_id) {
        const hasMod = c.modifiers.find(m => m.id === modifier.id);
        if (hasMod) {
          return { ...c, modifiers: c.modifiers.filter(m => m.id !== modifier.id) };
        } else {
          return { ...c, modifiers: [...c.modifiers, { id: modifier.id, name: modifier.name, price_adjustment: Number(modifier.price_adjustment) }] };
        }
      }
      return c;
    }));
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(c => c.item_id !== itemId));
  };

  const subtotal = cart.reduce((sum, c) => sum + (c.price * c.quantity), 0);
  const modifiersTotal = cart.reduce((sum, c) => sum + c.modifiers.reduce((mSum, m) => mSum + Number(m.price_adjustment) * c.quantity, 0), 0);
  const tax = (subtotal + modifiersTotal) * 0.15;
  const total = subtotal + modifiersTotal + tax;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!branchId) return toast.error('Please select a branch');
    if (cart.length === 0) return toast.error('Please add at least one item');

    try {
      setLoading(true);
      const orderData = {
        branch_id: branchId,
        order_type: orderType,
        table_number: tableNumber || null,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        notes: notes || null,
        items: cart.map(c => ({
          item_id: c.item_id,
          quantity: c.quantity,
          modifiers: c.modifiers.map(m => m.id)
        }))
      };

      const res = await api.post('/orders/', orderData);
      toast.success('Order created successfully!');
      navigate(`/orders/${res.data.id}`);
    } catch (e) {
      console.error('Failed to create order', e);
      toast.error(e.response?.data?.error || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    const num = Number(value);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>New Order</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Order Details + Menu */}
          <div className="lg:col-span-2 space-y-4">
            {/* Branch Selection */}
            <div className="card">
              <h3 className="font-semibold mb-3">Branch</h3>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select branch</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Order Type & Customer Info */}
            <div className="card">
              <h3 className="font-semibold mb-3">Order Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Order Type</label>
                  <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="input-field">
                    <option value="dine_in">Dine In</option>
                    <option value="takeaway">Takeaway</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>
                {orderType === 'dine_in' && (
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Table Number</label>
                    <input type="text" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} className="input-field" placeholder="Table #" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Customer Name</label>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="input-field" placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Customer Phone</label>
                  <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="input-field" placeholder="Optional" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" rows="2" placeholder="Any special instructions..." />
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="card">
              <h3 className="font-semibold mb-3">Menu Items</h3>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="input-field mb-3"
              />
              {filteredItems.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>No items match your search</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {filteredItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 rounded-lg border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                      <div>
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {Number(item.price).toFixed(2)} ETB
                          {!item.is_available && <span className="ml-2 text-red-500">Unavailable</span>}
                        </div>
                      </div>
                      <button type="button" onClick={() => item.is_available && addToCart(item)} disabled={!item.is_available} className="btn-primary text-xs px-2 py-1 disabled:opacity-50">
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Cart Summary */}
          <div className="lg:col-span-1">
            <div className="card sticky top-4">
              <h3 className="font-semibold mb-3">Order Summary</h3>
              {cart.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>No items added</p>
              ) : (
                <div className="space-y-3">
                  {cart.map(cartItem => (
                    <div key={cartItem.item_id} className="border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{cartItem.name}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatCurrency(cartItem.price)} ETB each</div>
                        </div>
                        <button type="button" onClick={() => removeFromCart(cartItem.item_id)} className="text-xs" style={{ color: 'var(--error)' }}>Remove</button>
                      </div>

                      {/* Modifiers */}
                      {cartItem.available_modifiers && cartItem.available_modifiers.length > 0 && (
                        <div className="mt-2 ml-2">
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Modifiers:</p>
                          <div className="flex flex-wrap gap-1">
                            {cartItem.available_modifiers.map(mod => {
                              const selected = cartItem.modifiers.find(m => m.id === mod.id);
                              return (
                                <button
                                  key={mod.id}
                                  type="button"
                                  onClick={() => toggleModifier(cartItem, mod)}
                                  className={`text-xs px-2 py-1 rounded border ${selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                  style={{ borderColor: selected ? 'var(--accent)' : 'var(--border-color)', color: selected ? 'var(--accent)' : 'var(--text-secondary)' }}
                                >
                                  {mod.name} ({Number(mod.price_adjustment).toFixed(2)})
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Selected Modifiers Summary */}
                      {cartItem.modifiers.length > 0 && (
                        <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                          + {cartItem.modifiers.map(m => m.name).join(', ')}
                        </div>
                      )}

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <button type="button" onClick={() => updateQuantity(cartItem.item_id, -1)} className="w-6 h-6 rounded border flex items-center justify-center" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>-</button>
                          <span className="text-sm font-medium w-6 text-center">{cartItem.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(cartItem.item_id, 1)} className="w-6 h-6 rounded border flex items-center justify-center" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>+</button>
                        </div>
                        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {formatCurrency((cartItem.price + cartItem.modifiers.reduce((s, m) => s + Number(m.price_adjustment), 0)) * cartItem.quantity)} ETB
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <div className="border-t mt-4 pt-3 space-y-1" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                    <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(subtotal + modifiersTotal)} ETB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>Tax (15%)</span>
                    <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(tax)} ETB</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-1 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <span style={{ color: 'var(--text-primary)' }}>Total</span>
                    <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(total)} ETB</span>
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading || cart.length === 0} className="btn-primary w-full mt-4 disabled:opacity-50">
                {loading ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default OrderForm;
