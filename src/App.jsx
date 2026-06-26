import React, { useState, useEffect, useMemo } from 'react';
import { products } from './data/products';
import './styles/globals.css';

function App() {
  // All your existing state remains the same
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [toast, setToast] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cvv: '',
    expiry: '',
    cardName: '',
    gcashNumber: '',
    paypalEmail: ''
  });
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);

  // All your existing functions remain the same
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filteredProducts = useMemo(() => {
    let result = filter === 'all' 
      ? products 
      : products.filter(p => p.category === filter);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }
    return result;
  }, [filter, searchQuery]);

  const getCount = (category) => {
    if (category === 'all') return products.length;
    return products.filter(p => p.category === category).length;
  };

  const generateTrackingNumber = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'WIZ-';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        setToast({ type: 'success', message: `✨ Added another ${product.name} to cart!` });
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      setToast({ type: 'success', message: `✨ ${product.name} added to cart!` });
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    const item = cart.find(i => i.id === id);
    setCart(prev => prev.filter(item => item.id !== id));
    setToast({ type: 'info', message: `🗑️ ${item?.name || 'Item'} removed` });
  };

  const updateQuantity = (id, change) => {
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      const newQuantity = item.quantity + change;
      if (newQuantity <= 0) {
        setToast({ type: 'info', message: `🗑️ ${item.name} removed` });
        return prev.filter(i => i.id !== id);
      }
      return prev.map(i => i.id === id ? { ...i, quantity: newQuantity } : i);
    });
  };

  const getTotalItems = () => cart.reduce((total, item) => total + item.quantity, 0);
  const getTotalPrice = () => cart.reduce((total, item) => {
    const price = parseFloat(item.price.replace('$', ''));
    return total + (price * item.quantity);
  }, 0);

  const clearCart = () => {
    if (window.confirm('Clear your cart?')) {
      setCart([]);
      setToast({ type: 'info', message: '🗑️ Cart cleared' });
    }
  };

  const validatePaymentDetails = () => {
    if (paymentMethod === 'card') {
      const cleanCard = paymentDetails.cardNumber.replace(/\s/g, '');
      if (!paymentDetails.cardNumber || cleanCard.length < 16) {
        setToast({ type: 'error', message: '❌ Please enter a valid card number' });
        return false;
      }
      if (!paymentDetails.cvv || paymentDetails.cvv.length < 3) {
        setToast({ type: 'error', message: '❌ Please enter a valid CVV' });
        return false;
      }
      if (!paymentDetails.expiry || paymentDetails.expiry.length < 5) {
        setToast({ type: 'error', message: '❌ Please enter expiry date (MM/YY)' });
        return false;
      }
      if (!paymentDetails.cardName) {
        setToast({ type: 'error', message: '❌ Please enter cardholder name' });
        return false;
      }
    }
    if (paymentMethod === 'gcash') {
      if (!paymentDetails.gcashNumber || paymentDetails.gcashNumber.length < 11) {
        setToast({ type: 'error', message: '❌ Please enter a valid GCash number' });
        return false;
      }
    }
    if (paymentMethod === 'paypal') {
      if (!paymentDetails.paypalEmail || !paymentDetails.paypalEmail.includes('@')) {
        setToast({ type: 'error', message: '❌ Please enter a valid PayPal email' });
        return false;
      }
    }
    return true;
  };

  const placeOrder = () => {
    if (!validatePaymentDetails()) return;
    const order = {
      id: Date.now(),
      trackingNumber: generateTrackingNumber(),
      items: [...cart],
      total: getTotalPrice(),
      paymentMethod: paymentMethod,
      paymentDetails: { ...paymentDetails },
      date: new Date().toLocaleDateString(),
      status: 'Processing'
    };
    setOrders(prev => [...prev, order]);
    setCart([]);
    setShowCheckoutModal(false);
    setPaymentDetails({ cardNumber: '', cvv: '', expiry: '', cardName: '', gcashNumber: '', paypalEmail: '' });
    setToast({ type: 'success', message: `🎉 Order placed! Tracking: ${order.trackingNumber}` });
  };

  const trackOrder = () => {
    if (!trackingNumber) {
      setToast({ type: 'info', message: 'Please enter a tracking number' });
      return;
    }
    const order = orders.find(o => o.trackingNumber === trackingNumber.toUpperCase());
    if (order) {
      setTrackedOrder(order);
      setToast({ type: 'success', message: `🔍 Order found! Status: ${order.status}` });
    } else {
      setTrackedOrder(null);
      setToast({ type: 'error', message: '❌ Order not found. Please check your tracking number.' });
    }
  };

  const updateOrderStatus = (trackingNumber) => {
    setOrders(prev => prev.map(order => {
      if (order.trackingNumber === trackingNumber) {
        const statuses = ['Processing', 'Shipped', 'In Transit', 'Delivered'];
        const currentIndex = statuses.indexOf(order.status);
        const nextStatus = statuses[Math.min(currentIndex + 1, statuses.length - 1)];
        return { ...order, status: nextStatus };
      }
      return order;
    }));
    setToast({ type: 'success', message: `📦 Order status updated!` });
  };

  const handlePaymentDetailChange = (field, value) => {
    if (field === 'cardNumber') {
      const cleaned = value.replace(/\s/g, '');
      const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
      setPaymentDetails(prev => ({ ...prev, [field]: formatted }));
      return;
    }
    if (field === 'cvv') {
      if (value.length > 4) return;
      setPaymentDetails(prev => ({ ...prev, [field]: value }));
      return;
    }
    if (field === 'expiry') {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length >= 2) {
        const formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
        setPaymentDetails(prev => ({ ...prev, [field]: formatted }));
        return;
      }
      setPaymentDetails(prev => ({ ...prev, [field]: cleaned }));
      return;
    }
    setPaymentDetails(prev => ({ ...prev, [field]: value }));
  };

  const clearSearch = () => setSearchQuery('');
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    setToast({ type: 'success', message: `✨ Thanks ${name}! We'll get back to you soon.` });
    e.target.reset();
  };

  // ====== STYLED COMPONENT RENDER ======
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      transition: 'background 0.4s ease, color 0.4s ease',
      position: 'relative'
    }}>
      {/* ====== TOAST ====== */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '90px',
          right: '24px',
          padding: '16px 24px',
          background: toast.type === 'success' ? 'linear-gradient(135deg, #00b894, #00a381)' : 
                      toast.type === 'error' ? 'linear-gradient(135deg, #ff6b6b, #e55555)' : 
                      'linear-gradient(135deg, var(--accent), var(--accent-dark))',
          color: 'white',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 9999,
          animation: 'slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          maxWidth: '420px',
          fontSize: '14px',
          fontWeight: '500',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {toast.message}
        </div>
      )}

      {/* ====== CHECKOUT MODAL ====== */}
      {showCheckoutModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(20px)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.3s ease'
        }} onClick={() => setShowCheckoutModal(false)}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '32px',
            padding: '40px',
            maxWidth: '560px',
            width: '100%',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-xl)',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto',
            animation: 'fadeInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowCheckoutModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: '18px',
                cursor: 'pointer',
                transition: '0.3s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'rotate(90deg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'rotate(0)'; }}
            >
              ✕
            </button>

            <h2 style={{
              fontSize: '32px',
              fontWeight: '800',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '36px' }}>🎉</span> Checkout
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Review your order and enter payment details
            </p>

            <div style={{
              marginBottom: '24px',
              padding: '16px',
              background: 'var(--bg-primary)',
              borderRadius: '16px',
              maxHeight: '150px',
              overflowY: 'auto',
              border: '1px solid var(--border)'
            }}>
              {cart.map(item => (
                <div key={item.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '14px'
                }}>
                  <span>{item.emoji} {item.name} × {item.quantity}</span>
                  <span style={{ fontWeight: '600' }}>${(parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Select Payment Method</h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[
                  { id: 'card', label: '💳 Card' },
                  { id: 'paypal', label: '💰 PayPal' },
                  { id: 'gcash', label: '📱 GCash' }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => {
                      setPaymentMethod(method.id);
                      setPaymentDetails({ cardNumber: '', cvv: '', expiry: '', cardName: '', gcashNumber: '', paypalEmail: '' });
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: paymentMethod === method.id ? 'var(--accent)' : 'var(--bg-primary)',
                      color: paymentMethod === method.id ? 'white' : 'var(--text-secondary)',
                      border: paymentMethod === method.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: '0.3s',
                      minWidth: '80px'
                    }}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'card' && (
              <div style={{
                marginBottom: '24px',
                padding: '20px',
                background: 'var(--bg-primary)',
                borderRadius: '16px',
                border: '1px solid var(--border)'
              }}>
                <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: 'var(--accent)' }}>
                  💳 Card Details
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Card Number"
                    value={paymentDetails.cardNumber}
                    onChange={(e) => handlePaymentDetailChange('cardNumber', e.target.value)}
                    maxLength="19"
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                      transition: '0.3s'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  />
                  <input
                    type="text"
                    placeholder="Cardholder Name"
                    value={paymentDetails.cardName}
                    onChange={(e) => handlePaymentDetailChange('cardName', e.target.value)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                      transition: '0.3s'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={paymentDetails.expiry}
                      onChange={(e) => handlePaymentDetailChange('expiry', e.target.value)}
                      maxLength="5"
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        outline: 'none',
                        transition: '0.3s'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                    />
                    <input
                      type="password"
                      placeholder="CVV"
                      value={paymentDetails.cvv}
                      onChange={(e) => handlePaymentDetailChange('cvv', e.target.value)}
                      maxLength="4"
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        outline: 'none',
                        transition: '0.3s'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'gcash' && (
              <div style={{
                marginBottom: '24px',
                padding: '20px',
                background: 'var(--bg-primary)',
                borderRadius: '16px',
                border: '1px solid var(--border)'
              }}>
                <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: 'var(--accent)' }}>
                  📱 GCash Details
                </h4>
                <input
                  type="tel"
                  placeholder="GCash Number (e.g. 09123456789)"
                  value={paymentDetails.gcashNumber}
                  onChange={(e) => handlePaymentDetailChange('gcashNumber', e.target.value)}
                  maxLength="11"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    transition: '0.3s'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  📌 You will receive a payment request via GCash
                </p>
              </div>
            )}

            {paymentMethod === 'paypal' && (
              <div style={{
                marginBottom: '24px',
                padding: '20px',
                background: 'var(--bg-primary)',
                borderRadius: '16px',
                border: '1px solid var(--border)'
              }}>
                <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: 'var(--accent)' }}>
                  💰 PayPal Details
                </h4>
                <input
                  type="email"
                  placeholder="PayPal Email Address"
                  value={paymentDetails.paypalEmail}
                  onChange={(e) => handlePaymentDetailChange('paypalEmail', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    transition: '0.3s'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  📌 You will be redirected to PayPal to complete payment
                </p>
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '16px 0',
              borderTop: '2px solid var(--border)',
              marginBottom: '16px',
              fontSize: '20px',
              fontWeight: '700'
            }}>
              <span>Total</span>
              <span style={{ color: 'var(--accent)' }}>${getTotalPrice().toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowCheckoutModal(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: '0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={placeOrder}
                style={{
                  flex: 2,
                  padding: '14px',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: '0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Place Order →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== TRACK ORDER MODAL ====== */}
      {showTrackModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(20px)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.3s ease'
        }} onClick={() => {
          setShowTrackModal(false);
          setTrackedOrder(null);
          setTrackingNumber('');
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '32px',
            padding: '40px',
            maxWidth: '520px',
            width: '100%',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-xl)',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto',
            animation: 'fadeInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setShowTrackModal(false);
                setTrackedOrder(null);
                setTrackingNumber('');
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: '18px',
                cursor: 'pointer',
                transition: '0.3s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'rotate(90deg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'rotate(0)'; }}
            >
              ✕
            </button>

            <h2 style={{
              fontSize: '32px',
              fontWeight: '800',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '36px' }}>🔍</span> Track Order
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Enter your tracking number to check order status
            </p>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <input
                type="text"
                placeholder="e.g. WIZ-ABC12345"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                style={{
                  flex: 1,
                  padding: '14px 18px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  transition: '0.3s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              />
              <button
                onClick={trackOrder}
                style={{
                  padding: '14px 28px',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                  color: 'white',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: '0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Track
              </button>
            </div>

            {trackedOrder && (
              <div style={{
                padding: '20px',
                background: 'var(--bg-primary)',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                animation: 'fadeInUp 0.4s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: '700', fontSize: '16px' }}>
                    Order #{trackedOrder.trackingNumber}
                  </span>
                  <span style={{
                    padding: '4px 16px',
                    borderRadius: '50px',
                    background: 
                      trackedOrder.status === 'Delivered' ? '#00b894' :
                      trackedOrder.status === 'In Transit' ? '#fdcb6e' :
                      trackedOrder.status === 'Shipped' ? '#74b9ff' : 'var(--accent)',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {trackedOrder.status}
                  </span>
                </div>

                <div style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <div>Date: {trackedOrder.date}</div>
                  <div>Payment: {trackedOrder.paymentMethod}</div>
                  <div style={{ fontWeight: '600', color: 'var(--accent)' }}>
                    Total: ${trackedOrder.total.toFixed(2)}
                  </div>
                </div>

                <div style={{
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border)'
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Items:</h4>
                  {trackedOrder.items.map(item => (
                    <div key={item.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      padding: '4px 0',
                      color: 'var(--text-secondary)'
                    }}>
                      <span>{item.emoji} {item.name} × {item.quantity}</span>
                      <span>${(parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {trackedOrder.status !== 'Delivered' && (
                  <button
                    onClick={() => updateOrderStatus(trackedOrder.trackingNumber)}
                    style={{
                      width: '100%',
                      marginTop: '12px',
                      padding: '12px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: '0.3s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    📦 Simulate Shipment Update
                  </button>
                )}
              </div>
            )}

            {orders.length > 0 && !trackedOrder && (
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Recent Orders:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {orders.slice(-3).reverse().map(order => (
                    <button
                      key={order.id}
                      onClick={() => {
                        setTrackingNumber(order.trackingNumber);
                        setTrackedOrder(order);
                      }}
                      style={{
                        padding: '12px 16px',
                        background: 'var(--bg-primary)',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '13px',
                        transition: '0.3s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <span>{order.trackingNumber}</span>
                      <span style={{
                        color: 
                          order.status === 'Delivered' ? '#00b894' :
                          order.status === 'In Transit' ? '#fdcb6e' :
                          order.status === 'Shipped' ? '#74b9ff' : 'var(--accent)'
                      }}>
                        {order.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== NAVBAR ====== */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '14px 24px',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        borderRadius: '0 0 20px 20px',
        transition: 'background 0.4s ease'
      }}>
        <span 
          onClick={() => scrollToSection('home')}
          style={{
            fontSize: '22px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            cursor: 'pointer',
            letterSpacing: '-0.5px'
          }}
        >
          ✦ Wizen's
        </span>

        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {['Home', 'Products', 'Track', 'Contact', 'About'].map(item => {
            const id = item.toLowerCase();
            return (
              <button
                key={item}
                onClick={() => id === 'track' ? setShowTrackModal(true) : scrollToSection(id)}
                style={{
                  color: 'var(--text-secondary)',
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  transition: '0.3s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.background = 'var(--bg-card)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {item === 'Track' ? '🔍 Track' : item}
              </button>
            );
          })}
          
          <button
            onClick={() => scrollToSection('cart-section')}
            style={{
              position: 'relative',
              padding: '8px 16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '50px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-primary)',
              transition: '0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <span style={{ fontSize: '18px' }}>🛒</span>
            {getTotalItems() > 0 && (
              <span style={{
                background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                color: 'white',
                borderRadius: '50%',
                padding: '2px 10px',
                fontSize: '12px',
                fontWeight: '700'
              }}>
                {getTotalItems()}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsDark(!isDark)}
            style={{
              padding: '8px 16px',
              borderRadius: '50px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontSize: '16px',
              cursor: 'pointer',
              transition: '0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      {/* ====== CONTENT ====== */}
      <div style={{ paddingTop: '80px' }}>
        
        {/* ====== HERO ====== */}
        <section id="home" style={{
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          alignItems: 'center',
          padding: '60px 24px',
          maxWidth: '1200px',
          margin: '0 auto',
          position: 'relative'
        }}>
          <div style={{ width: '100%' }}>
            <span style={{
              display: 'inline-block',
              padding: '6px 20px',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
              color: 'white',
              borderRadius: '50px',
              fontSize: '12px',
              fontWeight: '600',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '20px'
            }}>
              ✦ DIGITAL PRODUCTS
            </span>
            <h1 style={{
              fontSize: 'clamp(44px, 12vw, 84px)',
              fontWeight: '900',
              lineHeight: '1.05',
              marginBottom: '20px',
              letterSpacing: '-2px'
            }}>
              <span style={{
                background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Wizen's
              </span>
              <br />
              <span style={{ color: 'var(--text-primary)' }}>for the next gen</span>
            </h1>
            <p style={{
              fontSize: 'clamp(18px, 2vw, 22px)',
              color: 'var(--text-secondary)',
              maxWidth: '520px',
              marginBottom: '36px',
              lineHeight: '1.8'
            }}>
              Curated digital tools, templates & presets for creators who want to stand out.
            </p>
            <button 
              onClick={() => scrollToSection('products')}
              style={{
                padding: '16px 44px',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                color: 'white',
                borderRadius: '50px',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                transition: '0.3s',
                boxShadow: '0 8px 32px rgba(108, 92, 231, 0.3)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Explore Products →
            </button>
          </div>
        </section>

        {/* ====== PRODUCTS ====== */}
        <section id="products" style={{
          padding: '60px 24px 80px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <div>
              <h2 style={{ fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: '800', letterSpacing: '-1px' }}>
                Featured Drops ✦
              </h2>
              {searchQuery && (
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Found {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '600px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '50px',
                padding: '4px 4px 4px 18px',
                transition: '0.3s',
                flex: 1,
                minWidth: '160px'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                <span style={{ color: 'var(--text-muted)' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    padding: '10px 0',
                    width: '100%',
                    minWidth: '80px'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['all', 'templates', 'ebooks', 'presets'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '50px',
                      background: filter === cat ? 'linear-gradient(135deg, var(--accent), var(--accent-secondary))' : 'var(--bg-card)',
                      color: filter === cat ? 'white' : 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: '0.3s'
                    }}
                    onMouseEnter={(e) => {
                      if (filter !== cat) e.currentTarget.style.borderColor = 'var(--accent)';
                    }}
                    onMouseLeave={(e) => {
                      if (filter !== cat) e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    {cat === 'all' ? '✨ All' : cat}
                    <span style={{
                      marginLeft: '4px',
                      fontSize: '11px',
                      opacity: '0.7'
                    }}>
                      ({getCount(cat)})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '28px'
          }}>
            {filteredProducts.map((product, index) => {
              const inCart = cart.find(item => item.id === product.id);
              return (
                <div key={product.id} style={{
                  background: 'var(--bg-card)',
                  borderRadius: '20px',
                  padding: '24px',
                  border: '1px solid var(--glass-border)',
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  boxShadow: 'var(--shadow)',
                  animation: `fadeInUp 0.6s ease ${index * 0.05}s both`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow)';
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                }}>
                  <div style={{
                    height: '150px',
                    borderRadius: '16px',
                    background: product.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '60px',
                    marginBottom: '16px',
                    transition: '0.3s'
                  }}>
                    {product.emoji}
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>
                    {product.name}
                  </h3>
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    marginBottom: '16px',
                    lineHeight: '1.6'
                  }}>
                    {product.description}
                  </p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <span style={{
                      fontSize: '22px',
                      fontWeight: '700',
                      color: 'var(--accent)'
                    }}>
                      {product.price}
                    </span>
                    <button
                      onClick={() => addToCart(product)}
                      style={{
                        padding: '8px 20px',
                        borderRadius: '50px',
                        background: inCart ? '#00b894' : 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                        color: 'white',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: '0.3s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: inCart ? 'none' : '0 4px 16px rgba(108, 92, 231, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        if (!inCart) e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        if (!inCart) e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {inCart ? `✓ ${inCart.quantity}` : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: 'var(--text-secondary)'
            }}>
              <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>
                {searchQuery ? '🔍' : '🔮'}
              </span>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '24px', marginBottom: '8px' }}>
                {searchQuery ? 'No products found' : 'No products in this category'}
              </h3>
              <p>
                {searchQuery 
                  ? `Try a different search term`
                  : 'Try a different category'
                }
              </p>
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  style={{
                    marginTop: '20px',
                    padding: '10px 28px',
                    background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </section>

        {/* ====== CART ====== */}
        <section id="cart-section" style={{
          padding: '60px 24px 80px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 44px)',
            fontWeight: '800',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            letterSpacing: '-1px'
          }}>
            🛒 Your Cart
            {getTotalItems() > 0 && (
              <span style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                fontWeight: '400',
                letterSpacing: '0'
              }}>
                ({getTotalItems()} items)
              </span>
            )}
          </h2>

          {cart.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              background: 'var(--bg-card)',
              borderRadius: '24px',
              border: '1px solid var(--glass-border)',
              backdropFilter: 'blur(10px)'
            }}>
              <span style={{ fontSize: '72px', display: 'block', marginBottom: '16px' }}>🛍️</span>
              <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Your cart is empty</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Start adding some amazing products!</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {cart.map(item => (
                  <div key={item.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 24px',
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    flexWrap: 'wrap',
                    gap: '12px',
                    transition: '0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '36px' }}>{item.emoji}</span>
                      <div>
                        <h4 style={{ fontSize: '16px', fontWeight: '600' }}>{item.name}</h4>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{item.price}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'var(--bg-primary)',
                        borderRadius: '50px',
                        padding: '4px'
                      }}>
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          style={{
                            padding: '6px 14px',
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            borderRadius: '50px',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            fontSize: '16px',
                            fontWeight: '600',
                            transition: '0.3s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          −
                        </button>
                        <span style={{ minWidth: '28px', textAlign: 'center', fontWeight: '600' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          style={{
                            padding: '6px 14px',
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            borderRadius: '50px',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            fontSize: '16px',
                            fontWeight: '600',
                            transition: '0.3s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          +
                        </button>
                      </div>

                      <span style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: 'var(--accent)',
                        minWidth: '70px',
                        textAlign: 'right'
                      }}>
                        ${(parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2)}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={{
                          padding: '6px 14px',
                          background: 'transparent',
                          border: '1px solid #ff6b6b',
                          borderRadius: '50px',
                          color: '#ff6b6b',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: '0.3s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#ff6b6b';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#ff6b6b';
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                background: 'var(--bg-card)',
                borderRadius: '20px',
                padding: '28px 32px',
                border: '1px solid var(--glass-border)',
                backdropFilter: 'blur(10px)',
                boxShadow: 'var(--shadow)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Total:</span>
                    <span style={{
                      fontSize: '32px',
                      fontWeight: '800',
                      color: 'var(--accent)',
                      marginLeft: '12px'
                    }}>
                      ${getTotalPrice().toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={clearCart}
                      style={{
                        padding: '12px 28px',
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: '0.3s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ff6b6b'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      Clear Cart
                    </button>
                    <button
                      onClick={() => setShowCheckoutModal(true)}
                      style={{
                        padding: '12px 36px',
                        background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                        transition: '0.3s',
                        boxShadow: '0 4px 20px rgba(108, 92, 231, 0.3)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      Checkout →
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        {/* ====== CONTACT ====== */}
        <section id="contact" style={{
          padding: '80px 24px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <span style={{
              display: 'inline-block',
              padding: '6px 20px',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
              color: 'white',
              borderRadius: '50px',
              fontSize: '12px',
              fontWeight: '600',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '16px'
            }}>
              ✦ Let's Connect
            </span>
            <h2 style={{
              fontSize: 'clamp(32px, 4vw, 44px)',
              fontWeight: '800',
              marginBottom: '12px',
              letterSpacing: '-1px'
            }}>
              Get in <span className="text-gradient">touch</span> with us
            </h2>
            <p style={{
              fontSize: '18px',
              color: 'var(--text-secondary)',
              marginBottom: '32px',
              lineHeight: '1.8'
            }}>
              Have a question or want to collaborate? We'd love to hear from you.
            </p>

            <form onSubmit={handleContactSubmit} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <input
                type="text"
                name="name"
                placeholder="Your name"
                required
                style={{
                  padding: '16px 20px',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  transition: '0.3s',
                  outline: 'none',
                  backdropFilter: 'blur(10px)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              />
              <input
                type="email"
                name="email"
                placeholder="Your email"
                required
                style={{
                  padding: '16px 20px',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  transition: '0.3s',
                  outline: 'none',
                  backdropFilter: 'blur(10px)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              />
              <textarea
                name="message"
                placeholder="Your message"
                rows="4"
                required
                style={{
                  padding: '16px 20px',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  transition: '0.3s',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  backdropFilter: 'blur(10px)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              />
              <button
                type="submit"
                style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                  color: 'white',
                  borderRadius: '16px',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: '0.3s',
                  boxShadow: '0 4px 20px rgba(108, 92, 231, 0.3)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Send Message →
              </button>
            </form>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '40px',
              marginTop: '40px',
              flexWrap: 'wrap'
            }}>
              <div style={{ transition: '0.3s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ fontSize: '28px', marginBottom: '4px' }}>📧</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>hello@wizens.com</div>
              </div>
              <div style={{ transition: '0.3s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ fontSize: '28px', marginBottom: '4px' }}>🌐</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>@wizens</div>
              </div>
              <div style={{ transition: '0.3s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ fontSize: '28px', marginBottom: '4px' }}>💬</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Discord</div>
              </div>
            </div>
          </div>
        </section>

        {/* ====== ABOUT ====== */}
        <section id="about" style={{
          padding: '80px 24px',
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <span style={{
            display: 'inline-block',
            padding: '6px 20px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
            color: 'white',
            borderRadius: '50px',
            fontSize: '12px',
            fontWeight: '600',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '16px'
          }}>
            ✦ About
          </span>
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 44px)',
            fontWeight: '800',
            marginBottom: '16px',
            letterSpacing: '-1px'
          }}>
            Built for the <span className="text-gradient">next generation</span>
          </h2>
          <p style={{
            fontSize: 'clamp(16px, 1.2vw, 18px)',
            color: 'var(--text-secondary)',
            maxWidth: '640px',
            margin: '0 auto',
            lineHeight: '1.8'
          }}>
            Wizen's is a curated marketplace for digital products that help creators stand out. 
            From UI kits to presets, every product is handpicked for quality and aesthetics.
          </p>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '60px',
            flexWrap: 'wrap',
            marginTop: '48px'
          }}>
            {[
              { number: '50+', label: 'Products' },
              { number: '2K+', label: 'Creators' },
              { number: '4.9★', label: 'Rating' }
            ].map(stat => (
              <div key={stat.label} style={{
                textAlign: 'center',
                transition: '0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <div style={{
                  fontSize: '40px',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {stat.number}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ====== FOOTER ====== */}
        <footer style={{
          padding: '40px 24px',
          textAlign: 'center',
          borderTop: '1px solid var(--border)',
          color: 'var(--text-secondary)',
          fontSize: '14px',
          marginTop: '40px',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <button
              onClick={() => setShowTrackModal(true)}
              style={{
                color: 'var(--accent)',
                background: 'none',
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: '0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--accent)'}
            >
              🔍 Track Your Order
            </button>
          </div>
          <div style={{ opacity: '0.6' }}>
            © 2026 Wizen's — Built with ✦ for the next gen
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;