import React, { useState, useEffect, useMemo, useRef } from 'react';
import { products } from './data/products';
import './styles/globals.css';

function App() {
  // ====== EXISTING STATE ======
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
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [isClearingCart, setIsClearingCart] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // ====== NEW: Reviews State ======
  const [reviews, setReviews] = useState(() => {
    const saved = localStorage.getItem('reviews');
    return saved ? JSON.parse(saved) : {};
  });

  // ====== NEW: Order History View ======
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  // ====== NEW: Active Section for Navbar ======
  const [activeSection, setActiveSection] = useState('home');

  // ====== NEW: Particle Animation ======
  const canvasRef = useRef(null);

  // ====== EFFECTS ======
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
    localStorage.setItem('reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ====== NEW: Scroll Spy for Navbar ======
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'products', 'reviews', 'orders', 'contact', 'about'];
      const scrollPosition = window.scrollY + 120;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ====== NEW: Particle Animation ======
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      const count = 50;
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.5 + 0.1
        });
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, i) => {
        p.x += p.speedX;
        p.y += p.speedY;
        
        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
        gradient.addColorStop(0, `rgba(108, 92, 231, ${p.opacity})`);
        gradient.addColorStop(1, `rgba(108, 92, 231, 0)`);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw lines between nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x;
          const dy = p.y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(108, 92, 231, ${0.05 * (1 - distance / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animationId = requestAnimationFrame(drawParticles);
    };

    resizeCanvas();
    createParticles();
    drawParticles();

    window.addEventListener('resize', () => {
      resizeCanvas();
      createParticles();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // ====== EXISTING FUNCTIONS ======
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

  const handleClearCart = () => setShowClearConfirm(true);
  const confirmClearCart = () => {
    setIsClearingCart(true);
    setShowClearConfirm(false);
    setTimeout(() => {
      setCart([]);
      setIsClearingCart(false);
      setToast({ type: 'info', message: '🗑️ Cart cleared' });
    }, 400);
  };
  const cancelClearCart = () => setShowClearConfirm(false);

  const openQuickView = (product) => {
    setSelectedProduct(product);
    setShowQuickView(true);
    document.body.style.overflow = 'hidden';
  };

  const closeQuickView = () => {
    setShowQuickView(false);
    setSelectedProduct(null);
    document.body.style.overflow = 'unset';
  };

  // ====== NEW: Review Functions ======
  const addReview = (productId, rating, comment, name) => {
    const newReview = {
      id: Date.now(),
      productId,
      rating,
      comment,
      name: name || 'Anonymous',
      date: new Date().toLocaleDateString(),
      verified: true
    };

    setReviews(prev => {
      const productReviews = prev[productId] || [];
      return {
        ...prev,
        [productId]: [newReview, ...productReviews]
      };
    });

    setToast({ type: 'success', message: '⭐ Review added! Thanks for your feedback.' });
  };

  const getProductReviews = (productId) => {
    return reviews[productId] || [];
  };

  const getAverageRating = (productId) => {
    const productReviews = getProductReviews(productId);
    if (productReviews.length === 0) return 0;
    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / productReviews.length;
  };

  const getRatingDistribution = (productId) => {
    const productReviews = getProductReviews(productId);
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    productReviews.forEach(r => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    });
    return distribution;
  };

  // ====== NEW: Order History Functions ======
  const getOrderHistory = () => {
    return [...orders].reverse();
  };

  const reorder = (order) => {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.id);
      if (product) {
        addToCart(product);
      }
    });
    setToast({ type: 'success', message: `🔄 Reordered ${order.items.length} items!` });
  };

  // ====== VALIDATION ======
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
    closeQuickView();
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

  // ====== RENDER STARS ======
  const renderStars = (rating, interactive = false, onRating = null) => {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => interactive && onRating && onRating(star)}
            style={{
              background: 'none',
              border: 'none',
              cursor: interactive ? 'pointer' : 'default',
              fontSize: interactive ? '28px' : '20px',
              color: star <= rating ? '#fdcb6e' : 'var(--border)',
              transition: '0.2s',
              transform: interactive && star <= rating ? 'scale(1.1)' : 'scale(1)'
            }}
            onMouseEnter={(e) => {
              if (interactive) {
                e.currentTarget.style.transform = 'scale(1.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (interactive) {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  // ====== GET RELATED PRODUCTS ======
  const getRelatedProducts = (product) => {
    return products
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 3);
  };

  // ====== RENDER ======
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      transition: 'background 0.4s ease, color 0.4s ease',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* ====== BACKGROUND PARTICLES ====== */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.6
        }}
      />

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
          {[
            { id: 'home', label: 'Home' },
            { id: 'products', label: 'Products' },
            { id: 'reviews', label: '⭐ Reviews' },
            { id: 'orders', label: '📦 Orders' },
            { id: 'contact', label: 'Contact' },
            { id: 'about', label: 'About' }
          ].map(item => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => item.id === 'orders' ? setShowOrderHistory(true) : scrollToSection(item.id)}
                style={{
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: isActive ? '600' : '500',
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
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {item.id === 'orders' ? '📦 Orders' : item.label}
                {/* Active Indicator */}
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    bottom: '-4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '20px',
                    height: '3px',
                    borderRadius: '2px',
                    background: 'linear-gradient(90deg, var(--accent), var(--accent-secondary))',
                    animation: 'pulse 2s ease-in-out infinite'
                  }} />
                )}
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

      {/* ====== ORDER HISTORY MODAL ====== */}
      {showOrderHistory && (
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
        }} onClick={() => setShowOrderHistory(false)}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '32px',
            padding: '40px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-xl)',
            animation: 'fadeInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowOrderHistory(false)}
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
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              📦 Order History
              <span style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                fontWeight: '400'
              }}>
                ({orders.length} orders)
              </span>
            </h2>

            {orders.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'var(--text-secondary)'
              }}>
                <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>📭</span>
                <h3 style={{ color: 'var(--text-primary)' }}>No orders yet</h3>
                <p>Start shopping to see your orders here!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {getOrderHistory().map(order => (
                  <div key={order.id} style={{
                    padding: '20px',
                    background: 'var(--bg-primary)',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    transition: '0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '16px' }}>
                          #{order.trackingNumber}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {order.date} · {order.items.length} items
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          padding: '4px 14px',
                          borderRadius: '50px',
                          background: 
                            order.status === 'Delivered' ? '#00b894' :
                            order.status === 'In Transit' ? '#fdcb6e' :
                            order.status === 'Shipped' ? '#74b9ff' : 'var(--accent)',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {order.status}
                        </span>
                        <span style={{
                          fontSize: '18px',
                          fontWeight: '700',
                          color: 'var(--accent)'
                        }}>
                          ${order.total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border)'
                    }}>
                      {order.items.slice(0, 4).map(item => (
                        <span key={item.id} style={{
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-card)',
                          padding: '4px 12px',
                          borderRadius: '50px',
                          border: '1px solid var(--border)'
                        }}>
                          {item.emoji} {item.name} × {item.quantity}
                        </span>
                      ))}
                      {order.items.length > 4 && (
                        <span style={{
                          fontSize: '13px',
                          color: 'var(--text-muted)'
                        }}>
                          +{order.items.length - 4} more
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => reorder(order)}
                      style={{
                        marginTop: '12px',
                        padding: '8px 20px',
                        background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: '0.3s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      🔄 Reorder
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== QUICK VIEW MODAL ====== */}
      {showQuickView && selectedProduct && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(20px)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.3s ease'
        }} onClick={closeQuickView}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '32px',
            padding: '40px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-xl)',
            animation: 'fadeInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            
            <button
              onClick={closeQuickView}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: '20px',
                cursor: 'pointer',
                transition: '0.3s',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'rotate(90deg)';
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'rotate(0)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              ✕
            </button>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '32px',
              alignItems: 'start'
            }}>
              <div>
                <div style={{
                  height: '400px',
                  borderRadius: '20px',
                  background: selectedProduct.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '120px',
                  marginBottom: '16px',
                  transition: '0.3s'
                }}>
                  {selectedProduct.emoji}
                </div>
                
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 16px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '50px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    textTransform: 'capitalize'
                  }}>
                    {selectedProduct.category}
                  </span>
                  
                  {/* Rating Display */}
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 16px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '50px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {renderStars(Math.round(getAverageRating(selectedProduct.id)))}
                    <span style={{ marginLeft: '4px' }}>
                      ({getProductReviews(selectedProduct.id).length})
                    </span>
                  </span>
                </div>
              </div>

              <div>
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: '800',
                  marginBottom: '8px',
                  letterSpacing: '-0.5px'
                }}>
                  {selectedProduct.name}
                </h2>
                
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: 'var(--accent)',
                  marginBottom: '16px'
                }}>
                  {selectedProduct.price}
                </div>

                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '16px',
                  lineHeight: '1.8',
                  marginBottom: '24px'
                }}>
                  {selectedProduct.description}
                </p>

                <div style={{
                  marginBottom: '24px',
                  padding: '16px',
                  background: 'var(--bg-primary)',
                  borderRadius: '16px',
                  border: '1px solid var(--border)'
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    What's included ✦
                  </h4>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <li style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      ✓ Full access to {selectedProduct.name}
                    </li>
                    <li style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      ✓ Lifetime updates
                    </li>
                    <li style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      ✓ 24/7 support
                    </li>
                    <li style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      ✓ Commercial license
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => {
                    addToCart(selectedProduct);
                    closeQuickView();
                  }}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                    color: 'white',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: '0.3s',
                    boxShadow: '0 4px 20px rgba(108, 92, 231, 0.3)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Add to Cart →
                </button>

                {getRelatedProducts(selectedProduct).length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      marginBottom: '12px',
                      color: 'var(--text-secondary)'
                    }}>
                      Related Products
                    </h4>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '12px'
                    }}>
                      {getRelatedProducts(selectedProduct).map(related => (
                        <div
                          key={related.id}
                          onClick={() => {
                            setSelectedProduct(related);
                          }}
                          style={{
                            padding: '12px',
                            background: 'var(--bg-primary)',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: '0.3s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent)';
                            e.currentTarget.style.transform = 'translateY(-4px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <div style={{ fontSize: '32px' }}>{related.emoji}</div>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            marginTop: '4px',
                            color: 'var(--text-primary)'
                          }}>
                            {related.name}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: 'var(--accent)',
                            fontWeight: '600'
                          }}>
                            {related.price}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== CLEAR CART CONFIRMATION ====== */}
      {showClearConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)',
          zIndex: 9997,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.3s ease'
        }} onClick={cancelClearCart}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '24px',
            padding: '32px',
            maxWidth: '420px',
            width: '100%',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-xl)',
            animation: 'fadeInUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            textAlign: 'center'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{
              fontSize: '22px',
              fontWeight: '700',
              marginBottom: '8px'
            }}>
              Clear Your Cart?
            </h3>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '15px',
              marginBottom: '24px'
            }}>
              This will remove all {getTotalItems()} items from your cart. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={cancelClearCart}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: '0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
              >
                Cancel
              </button>
              <button
                onClick={confirmClearCart}
                style={{
                  flex: 2,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #ff6b6b, #e55555)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: '0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Yes, Clear All
              </button>
            </div>
          </div>
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

      {/* ====== CONTENT ====== */}
      <div style={{ paddingTop: '80px', position: 'relative', zIndex: 1 }}>
        
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
              const avgRating = getAverageRating(product.id);
              const reviewCount = getProductReviews(product.id).length;
              
              return (
                <div key={product.id} style={{
                  background: 'var(--bg-card)',
                  borderRadius: '20px',
                  padding: '24px',
                  border: '1px solid var(--glass-border)',
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  boxShadow: 'var(--shadow)',
                  animation: `fadeInUp 0.6s ease ${index * 0.05}s both`,
                  cursor: 'pointer'
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
                }}
                onClick={() => openQuickView(product)}>
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
                  
                  {/* Rating Display */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    {renderStars(Math.round(avgRating))}
                    <span style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)'
                    }}>
                      ({reviewCount})
                    </span>
                  </div>
                  
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
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
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
                        e.stopPropagation();
                        if (!inCart) e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.stopPropagation();
                        if (!inCart) e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {inCart ? `✓ ${inCart.quantity}` : 'Add to Cart'}
                    </button>
                  </div>
                  <div style={{
                    marginTop: '12px',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '4px'
                  }}>
                    <span>👆 Click to view details</span>
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

        {/* ====== REVIEWS & RATINGS SECTION ====== */}
        <section id="reviews" style={{
          padding: '80px 24px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
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
              ⭐ Community Reviews
            </span>
            <h2 style={{
              fontSize: 'clamp(32px, 4vw, 44px)',
              fontWeight: '800',
              letterSpacing: '-1px'
            }}>
              What our <span className="text-gradient">community</span> says
            </h2>
            <p style={{
              fontSize: '18px',
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              margin: '12px auto 0'
            }}>
              Real reviews from real creators who use our products
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {/* Show all reviews from all products */}
            {Object.values(reviews).flat().slice(0, 6).map(review => {
              const product = products.find(p => p.id === review.productId);
              return (
                <div key={review.id} style={{
                  background: 'var(--bg-card)',
                  borderRadius: '20px',
                  padding: '24px',
                  border: '1px solid var(--glass-border)',
                  transition: '0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      color: 'white',
                      fontWeight: '700'
                    }}>
                      {review.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600' }}>{review.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {review.date}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '8px' }}>
                    {renderStars(review.rating)}
                  </div>
                  
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    lineHeight: '1.7'
                  }}>
                    {review.comment}
                  </p>
                  
                  {product && (
                    <div style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border)',
                      fontSize: '13px',
                      color: 'var(--text-muted)'
                    }}>
                      Reviewed on: {product.emoji} {product.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {Object.values(reviews).flat().length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-secondary)'
            }}>
              <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>💬</span>
              <h3 style={{ color: 'var(--text-primary)' }}>No reviews yet</h3>
              <p>Be the first to review a product!</p>
            </div>
          )}
        </section>

        {/* ====== ORDER HISTORY BUTTON SECTION ====== */}
        <section id="orders" style={{
          padding: '60px 24px 80px',
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
            📦 Your Orders
          </span>
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 44px)',
            fontWeight: '800',
            marginBottom: '16px',
            letterSpacing: '-1px'
          }}>
            Track your <span className="text-gradient">purchase history</span>
          </h2>
          <p style={{
            fontSize: '18px',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto 32px'
          }}>
            View all your past orders, track status, and reorder with one click.
          </p>
          <button
            onClick={() => setShowOrderHistory(true)}
            style={{
              padding: '16px 48px',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: '0.3s',
              boxShadow: '0 8px 32px rgba(108, 92, 231, 0.3)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            View Order History →
          </button>
          
          {orders.length > 0 && (
            <div style={{
              marginTop: '24px',
              fontSize: '14px',
              color: 'var(--text-secondary)'
            }}>
              You have {orders.length} order{orders.length !== 1 ? 's' : ''} total
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
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                marginBottom: '24px',
                transition: 'all 0.4s ease',
                opacity: isClearingCart ? 0 : 1,
                transform: isClearingCart ? 'translateX(100px)' : 'translateX(0)'
              }}>
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
                    transition: '0.3s',
                    animation: isClearingCart ? `fadeOutRight 0.4s ease ${cart.indexOf(item) * 0.05}s both` : 'none'
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
                      onClick={handleClearCart}
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
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', marginBottom: '12px' }}>
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
              🔍 Track Order
            </button>
            <button
              onClick={() => setShowOrderHistory(true)}
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
              📦 Order History
            </button>
          </div>
          <div style={{ opacity: '0.6' }}>
            © 2026 Wizen's — Built with ✦ for the next gen
          </div>
        </footer>
      </div>

      {/* ====== CSS ANIMATIONS ====== */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

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

        @keyframes fadeOutRight {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: translateX(-50%) scaleX(1);
            opacity: 1;
          }
          50% {
            transform: translateX(-50%) scaleX(0.5);
            opacity: 0.5;
          }
        }

        .text-gradient {
          background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </div>
  );
}

export default App;