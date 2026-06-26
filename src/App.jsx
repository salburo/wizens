import React, { useState, useEffect, useMemo } from 'react';
import { products } from './data/products';
import './styles/globals.css';

function App() {
  // Dark mode
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Filter state
  const [filter, setFilter] = useState('all');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart state
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Orders state
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('orders');
    return saved ? JSON.parse(saved) : [];
  });

  // Toast state
  const [toast, setToast] = useState(null);

  // Checkout modal state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  
  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  // Payment details state
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cvv: '',
    expiry: '',
    cardName: '',
    gcashNumber: '',
    paypalEmail: ''
  });

  // Track order modal state
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);

  // Mobile filter menu state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Save orders to localStorage
  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Filter and search products
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

  // Count products by category
  const getCount = (category) => {
    if (category === 'all') return products.length;
    return products.filter(p => p.category === category).length;
  };

  // Get search result count
  const getSearchCount = () => {
    return filteredProducts.length;
  };

  // Generate tracking number
  const generateTrackingNumber = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'WIZ-';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Cart functions
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        setToast({
          type: 'success',
          message: `✨ Added another ${product.name} to cart!`
        });
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      setToast({
        type: 'success',
        message: `✨ ${product.name} added to cart!`
      });
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    const item = cart.find(i => i.id === id);
    setCart(prev => prev.filter(item => item.id !== id));
    setToast({
      type: 'info',
      message: `🗑️ ${item?.name || 'Item'} removed from cart`
    });
  };

  const updateQuantity = (id, change) => {
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      
      const newQuantity = item.quantity + change;
      if (newQuantity <= 0) {
        setToast({
          type: 'info',
          message: `🗑️ ${item.name} removed from cart`
        });
        return prev.filter(i => i.id !== id);
      }
      return prev.map(i =>
        i.id === id ? { ...i, quantity: newQuantity } : i
      );
    });
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.price.replace('$', ''));
      return total + (price * item.quantity);
    }, 0);
  };

  const clearCart = () => {
    if (window.confirm('Clear your cart?')) {
      setCart([]);
      setToast({
        type: 'info',
        message: '🗑️ Cart cleared'
      });
    }
  };

  // Validate payment details
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

  // Place order
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
    
    setPaymentDetails({
      cardNumber: '',
      cvv: '',
      expiry: '',
      cardName: '',
      gcashNumber: '',
      paypalEmail: ''
    });
    
    setToast({
      type: 'success',
      message: `🎉 Order placed! Tracking: ${order.trackingNumber}`
    });
  };

  // Track order
  const trackOrder = () => {
    if (!trackingNumber) {
      setToast({
        type: 'info',
        message: 'Please enter a tracking number'
      });
      return;
    }
    
    const order = orders.find(o => o.trackingNumber === trackingNumber.toUpperCase());
    if (order) {
      setTrackedOrder(order);
      setToast({
        type: 'success',
        message: `🔍 Order found! Status: ${order.status}`
      });
    } else {
      setTrackedOrder(null);
      setToast({
        type: 'error',
        message: '❌ Order not found. Please check your tracking number.'
      });
    }
  };

  // Update order status
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
    setToast({
      type: 'success',
      message: `📦 Order status updated!`
    });
  };

  // Handle payment detail changes
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

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };

  // Smooth scroll function
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  // Handle contact form
  const handleContactSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    
    setToast({
      type: 'success',
      message: `✨ Thanks ${name}! We'll get back to you soon.`
    });
    e.target.reset();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      transition: 'background 0.3s ease, color 0.3s ease',
      position: 'relative'
    }}>
      {/* ====== TOAST NOTIFICATION ====== */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '90px',
          right: '20px',
          padding: '14px 24px',
          background: toast.type === 'success' ? '#00b894' : 
                      toast.type === 'error' ? '#ff6b6b' : '#6c5ce7',
          color: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          zIndex: 9999,
          animation: 'slideIn 0.3s ease',
          maxWidth: '400px',
          fontSize: '14px'
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
          backdropFilter: 'blur(8px)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={() => setShowCheckoutModal(false)}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '550px',
            width: '100%',
            border: '1px solid var(--border)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowCheckoutModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                color: 'var(--text)',
                fontSize: '18px'
              }}
            >
              ✕
            </button>

            <h2 style={{
              fontSize: '28px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              🎉 Checkout
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Review your order and enter payment details
            </p>

            <div style={{
              marginBottom: '24px',
              padding: '16px',
              background: 'var(--bg)',
              borderRadius: '12px',
              maxHeight: '150px',
              overflowY: 'auto'
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
                  <span>${(parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Payment Methods */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', marginBottom: '12px' }}>Select Payment Method</h4>
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
                      setPaymentDetails({
                        cardNumber: '',
                        cvv: '',
                        expiry: '',
                        cardName: '',
                        gcashNumber: '',
                        paypalEmail: ''
                      });
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      background: paymentMethod === method.id ? 'var(--accent)' : 'var(--bg)',
                      color: paymentMethod === method.id ? 'white' : 'var(--text)',
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

            {/* Payment Details Forms */}
            {paymentMethod === 'card' && (
              <div style={{
                marginBottom: '24px',
                padding: '20px',
                background: 'var(--bg)',
                borderRadius: '12px',
                border: '1px solid var(--border)'
              }}>
                <h4 style={{ fontSize: '15px', marginBottom: '16px', color: 'var(--accent)' }}>
                  💳 Card Details
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Card Number (e.g. 1234 5678 9012 3456)"
                    value={paymentDetails.cardNumber}
                    onChange={(e) => handlePaymentDetailChange('cardNumber', e.target.value)}
                    maxLength="19"
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      color: 'var(--text)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Cardholder Name"
                    value={paymentDetails.cardName}
                    onChange={(e) => handlePaymentDetailChange('cardName', e.target.value)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      color: 'var(--text)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
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
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                        color: 'var(--text)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
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
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                        color: 'var(--text)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'gcash' && (
              <div style={{
                marginBottom: '24px',
                padding: '20px',
                background: 'var(--bg)',
                borderRadius: '12px',
                border: '1px solid var(--border)'
              }}>
                <h4 style={{ fontSize: '15px', marginBottom: '16px', color: 'var(--accent)' }}>
                  📱 GCash Details
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="tel"
                    placeholder="GCash Number (e.g. 09123456789)"
                    value={paymentDetails.gcashNumber}
                    onChange={(e) => handlePaymentDetailChange('gcashNumber', e.target.value)}
                    maxLength="11"
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      color: 'var(--text)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <p style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    marginTop: '4px'
                  }}>
                    📌 You will receive a payment request via GCash
                  </p>
                </div>
              </div>
            )}

            {paymentMethod === 'paypal' && (
              <div style={{
                marginBottom: '24px',
                padding: '20px',
                background: 'var(--bg)',
                borderRadius: '12px',
                border: '1px solid var(--border)'
              }}>
                <h4 style={{ fontSize: '15px', marginBottom: '16px', color: 'var(--accent)' }}>
                  💰 PayPal Details
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="email"
                    placeholder="PayPal Email Address"
                    value={paymentDetails.paypalEmail}
                    onChange={(e) => handlePaymentDetailChange('paypalEmail', e.target.value)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      color: 'var(--text)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <p style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    marginTop: '4px'
                  }}>
                    📌 You will be redirected to PayPal to complete payment
                  </p>
                </div>
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '16px 0',
              borderTop: '2px solid var(--border)',
              marginBottom: '16px',
              fontSize: '20px',
              fontWeight: '700',
              color: 'var(--accent)'
            }}>
              <span>Total</span>
              <span>${getTotalPrice().toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowCheckoutModal(false);
                  setPaymentDetails({
                    cardNumber: '',
                    cvv: '',
                    expiry: '',
                    cardName: '',
                    gcashNumber: '',
                    paypalEmail: ''
                  });
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={placeOrder}
                style={{
                  flex: 2,
                  padding: '12px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
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
          backdropFilter: 'blur(8px)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={() => {
          setShowTrackModal(false);
          setTrackedOrder(null);
          setTrackingNumber('');
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '500px',
            width: '100%',
            border: '1px solid var(--border)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
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
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                color: 'var(--text)',
                fontSize: '18px'
              }}
            >
              ✕
            </button>

            <h2 style={{
              fontSize: '28px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              🔍 Track Order
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
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                onClick={trackOrder}
                style={{
                  padding: '12px 24px',
                  background: 'var(--accent)',
                  color: 'white',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Track
              </button>
            </div>

            {trackedOrder && (
              <div style={{
                padding: '16px',
                background: 'var(--bg)',
                borderRadius: '12px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: '700', color: 'var(--text)' }}>
                    Order #{trackedOrder.trackingNumber}
                  </span>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '50px',
                    background: 
                      trackedOrder.status === 'Delivered' ? '#00b894' :
                      trackedOrder.status === 'In Transit' ? '#fdcb6e' :
                      trackedOrder.status === 'Shipped' ? '#74b9ff' : '#6c5ce7',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {trackedOrder.status}
                  </span>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Date: {trackedOrder.date}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Payment: {trackedOrder.paymentMethod}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Total: ${trackedOrder.total.toFixed(2)}
                  </div>
                </div>

                <div style={{
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border)'
                }}>
                  <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Items:</h4>
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
                      padding: '10px',
                      background: 'var(--accent)',
                      color: 'white',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    📦 Simulate Shipment Update
                  </button>
                )}
              </div>
            )}

            {orders.length > 0 && !trackedOrder && (
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
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
                        padding: '10px',
                        background: 'var(--bg)',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '13px',
                        color: 'var(--text)'
                      }}
                    >
                      <span>{order.trackingNumber}</span>
                      <span style={{
                        color: 
                          order.status === 'Delivered' ? '#00b894' :
                          order.status === 'In Transit' ? '#fdcb6e' :
                          order.status === 'Shipped' ? '#74b9ff' : '#6c5ce7'
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
        padding: '12px 20px',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        borderRadius: '0 0 16px 16px',
        transition: 'background 0.3s ease',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <span 
          onClick={() => scrollToSection('home')}
          style={{
            fontSize: '20px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, var(--accent), #00cec9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            cursor: 'pointer'
          }}
        >
          ✦ Wizen's
        </span>

        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <button onClick={() => scrollToSection('home')} style={{ color: 'var(--text)', background: 'none', border: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer', padding: '4px 8px' }}>Home</button>
          <button onClick={() => scrollToSection('products')} style={{ color: 'var(--text)', background: 'none', border: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer', padding: '4px 8px' }}>Products</button>
          <button onClick={() => setShowTrackModal(true)} style={{ color: 'var(--text)', background: 'none', border: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer', padding: '4px 8px' }}>🔍 Track</button>
          <button onClick={() => scrollToSection('contact')} style={{ color: 'var(--text)', background: 'none', border: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer', padding: '4px 8px' }}>Contact</button>
          <button onClick={() => scrollToSection('about')} style={{ color: 'var(--text)', background: 'none', border: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer', padding: '4px 8px' }}>About</button>
          
          <button
            onClick={() => scrollToSection('cart-section')}
            style={{
              position: 'relative',
              padding: '6px 12px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '50px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text)'
            }}
          >
            🛒
            {getTotalItems() > 0 && (
              <span style={{
                background: 'var(--accent)',
                color: 'white',
                borderRadius: '50%',
                padding: '2px 8px',
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
              padding: '6px 14px',
              borderRadius: '50px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: '14px',
              cursor: 'pointer',
              transition: '0.3s'
            }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      {/* ====== CONTENT ====== */}
      <div style={{ paddingTop: '76px' }}>
        
        {/* ====== HERO SECTION ====== */}
        <section id="home" style={{
          minHeight: 'calc(100vh - 76px)',
          display: 'flex',
          alignItems: 'center',
          padding: '40px 24px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{ width: '100%' }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 16px',
              background: 'var(--accent)',
              color: 'white',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              ✦ DIGITAL PRODUCTS
            </span>
            <h1 style={{
              fontSize: 'clamp(40px, 10vw, 76px)',
              fontWeight: '800',
              lineHeight: '1.05',
              marginBottom: '16px'
            }}>
              <span style={{
                background: 'linear-gradient(135deg, var(--accent), #00cec9)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Wizen's
              </span>
              <br />
              <span style={{ color: 'var(--text)' }}>for the next gen</span>
            </h1>
            <p style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              color: 'var(--text-secondary)',
              maxWidth: '500px',
              marginBottom: '32px',
              lineHeight: '1.7'
            }}>
              Curated digital tools, templates & presets for creators who want to stand out.
            </p>
            <button 
              onClick={() => scrollToSection('products')}
              style={{
                padding: '14px 36px',
                background: 'var(--accent)',
                color: 'white',
                borderRadius: '50px',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                transition: '0.3s'
              }}
            >
              Explore Products →
            </button>
          </div>
        </section>

        {/* ====== PRODUCTS SECTION ====== */}
        <section id="products" style={{
          padding: '60px 24px 80px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Product Nav - Filters + Search */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
                Featured Drops ✦
              </h2>
              {searchQuery && (
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  marginTop: '4px'
                }}>
                  Found {getSearchCount()} result{getSearchCount() !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
              )}
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              {/* Search Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '50px',
                padding: '4px 4px 4px 16px',
                transition: '0.3s'
              }}>
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
                    color: 'var(--text)',
                    fontSize: '14px',
                    padding: '8px 0',
                    minWidth: '150px',
                    width: '100%'
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
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    display: 'none'
                  }}
                >
                  Filters
                </button>
              </div>

              {/* Filter Buttons - Desktop */}
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                {['all', 'templates', 'ebooks', 'presets'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '50px',
                      background: filter === cat ? 'var(--accent)' : 'var(--bg-card)',
                      color: filter === cat ? 'white' : 'var(--text)',
                      border: '1px solid var(--border)',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: '0.3s'
                    }}
                  >
                    {cat === 'all' ? '✨ All' : cat}
                    <span style={{
                      marginLeft: '6px',
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

          {/* Mobile Filter Menu */}
          {showMobileFilters && (
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '24px',
              padding: '16px',
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border)'
            }}>
              {['all', 'templates', 'ebooks', 'presets'].map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setFilter(cat);
                    setShowMobileFilters(false);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '50px',
                    background: filter === cat ? 'var(--accent)' : 'var(--bg)',
                    color: filter === cat ? 'white' : 'var(--text)',
                    border: '1px solid var(--border)',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    flex: '1'
                  }}
                >
                  {cat === 'all' ? '✨ All' : cat}
                </button>
              ))}
            </div>
          )}

          {/* Products Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {filteredProducts.map(product => {
              const inCart = cart.find(item => item.id === product.id);
              return (
                <div key={product.id} style={{
                  background: 'var(--bg-card)',
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1px solid var(--border)',
                  transition: '0.3s'
                }}>
                  <div style={{
                    height: '140px',
                    borderRadius: '12px',
                    background: product.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '56px',
                    marginBottom: '16px'
                  }}>
                    {product.emoji}
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                    {product.name}
                  </h3>
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    marginBottom: '12px',
                    lineHeight: '1.5'
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
                      fontSize: '20px',
                      fontWeight: '700',
                      color: 'var(--accent)'
                    }}>
                      {product.price}
                    </span>
                    <button
                      onClick={() => addToCart(product)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: inCart ? '#00b894' : 'var(--accent)',
                        color: 'white',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: '0.3s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {inCart ? `✓ ${inCart.quantity}` : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {filteredProducts.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-secondary)'
            }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>
                {searchQuery ? '🔍' : '🔮'}
              </span>
              <h3 style={{ color: 'var(--text)' }}>
                {searchQuery ? 'No products found' : 'No products in this category'}
              </h3>
              <p>
                {searchQuery 
                  ? `Try a different search term or clear the search`
                  : 'Try a different category'
                }
              </p>
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  style={{
                    marginTop: '16px',
                    padding: '8px 24px',
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </section>

        {/* ====== CART SECTION ====== */}
        <section id="cart-section" style={{
          padding: '60px 24px 80px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            🛒 Your Cart
            {getTotalItems() > 0 && (
              <span style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                fontWeight: '400'
              }}>
                ({getTotalItems()} items)
              </span>
            )}
          </h2>

          {cart.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--border)'
            }}>
              <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>🛍️</span>
              <h3 style={{ color: 'var(--text)', marginBottom: '8px' }}>Your cart is empty</h3>
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
                    padding: '16px 20px',
                    background: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '32px' }}>{item.emoji}</span>
                      <div>
                        <h4 style={{ fontSize: '16px' }}>{item.name}</h4>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{item.price}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'var(--bg)',
                        borderRadius: '8px',
                        padding: '4px'
                      }}>
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          style={{
                            padding: '4px 10px',
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: 'var(--text)',
                            fontSize: '16px'
                          }}
                        >
                          −
                        </button>
                        <span style={{ minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          style={{
                            padding: '4px 10px',
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: 'var(--text)',
                            fontSize: '16px'
                          }}
                        >
                          +
                        </button>
                      </div>

                      <span style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: 'var(--accent)',
                        minWidth: '60px',
                        textAlign: 'right'
                      }}>
                        ${(parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2)}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={{
                          padding: '4px 10px',
                          background: 'transparent',
                          border: '1px solid #ff6b6b',
                          borderRadius: '6px',
                          color: '#ff6b6b',
                          cursor: 'pointer',
                          fontSize: '14px'
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
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid var(--border)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Total:</span>
                    <span style={{
                      fontSize: '28px',
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
                        padding: '10px 24px',
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Clear Cart
                    </button>
                    <button
                      onClick={() => setShowCheckoutModal(true)}
                      style={{
                        padding: '10px 32px',
                        background: 'var(--accent)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}
                    >
                      Checkout →
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        {/* ====== CONTACT SECTION ====== */}
        <section id="contact" style={{
          padding: '60px 24px 80px',
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
              padding: '4px 16px',
              background: 'var(--accent)',
              color: 'white',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              ✦ Let's Connect
            </span>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              marginBottom: '12px'
            }}>
              Get in <span style={{
                background: 'linear-gradient(135deg, var(--accent), #00cec9)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>touch</span> with us
            </h2>
            <p style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
              marginBottom: '32px',
              lineHeight: '1.7'
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
                  padding: '14px 20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text)',
                  fontSize: '16px',
                  transition: '0.3s',
                  outline: 'none'
                }}
              />
              <input
                type="email"
                name="email"
                placeholder="Your email"
                required
                style={{
                  padding: '14px 20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text)',
                  fontSize: '16px',
                  transition: '0.3s',
                  outline: 'none'
                }}
              />
              <textarea
                name="message"
                placeholder="Your message"
                rows="4"
                required
                style={{
                  padding: '14px 20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text)',
                  fontSize: '16px',
                  transition: '0.3s',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '14px',
                  background: 'var(--accent)',
                  color: 'white',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: '0.3s'
                }}
              >
                Send Message →
              </button>
            </form>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '32px',
              marginTop: '32px',
              flexWrap: 'wrap'
            }}>
              <div>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>📧</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>hello@wizens.com</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>🌐</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>@wizens</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>💬</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Discord</div>
              </div>
            </div>
          </div>
        </section>

        {/* ====== ABOUT SECTION ====== */}
        <section id="about" style={{
          padding: '60px 24px',
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <span style={{
            display: 'inline-block',
            padding: '4px 16px',
            background: 'var(--accent)',
            color: 'white',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '16px'
          }}>
            ✦ About
          </span>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            marginBottom: '16px'
          }}>
            Built for the <span style={{
              background: 'linear-gradient(135deg, var(--accent), #00cec9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>next generation</span>
          </h2>
          <p style={{
            fontSize: 'clamp(16px, 1.2vw, 18px)',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.8'
          }}>
            Wizen's is a curated marketplace for digital products that help creators stand out. 
            From UI kits to presets, every product is handpicked for quality and aesthetics.
          </p>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '48px',
            flexWrap: 'wrap',
            marginTop: '40px'
          }}>
            <div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text)' }}>50+</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Products</div>
            </div>
            <div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text)' }}>2K+</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Creators</div>
            </div>
            <div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text)' }}>4.9★</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Rating</div>
            </div>
          </div>
        </section>

        {/* ====== FOOTER ====== */}
        <footer style={{
          padding: '32px 24px',
          textAlign: 'center',
          borderTop: '1px solid var(--border)',
          color: 'var(--text-secondary)',
          fontSize: '14px',
          marginTop: '20px'
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
                fontWeight: '500'
              }}
            >
              🔍 Track Your Order
            </button>
          </div>
          © 2026 Wizen's — Built with ✦ for the next gen
        </footer>
      </div>

      {/* ====== RESPONSIVE STYLES ====== */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (max-width: 768px) {
          /* Hide desktop filter buttons on mobile */
          .desktop-filters {
            display: none !important;
          }
          
          /* Show mobile filter button */
          .mobile-filter-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}

export default App;