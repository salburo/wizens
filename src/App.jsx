import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import ProductGrid from './components/ProductGrid/ProductGrid';
import { products } from './data/products';
import './styles/globals.css';

function App() {
  return (
    <ThemeProvider>
      <div className="app">
        <Header />
        
        <main>
          {/* Hero Section */}
          <section style={heroStyles.section}>
            <div style={heroStyles.container}>
              <div style={heroStyles.badge}>✦ DIGITAL PRODUCTS</div>
              <h1 style={heroStyles.title}>
                <span style={heroStyles.gradient}>Wizen's</span>
                <br />
                <span style={heroStyles.subtitle}>for the next gen</span>
              </h1>
              <p style={heroStyles.description}>
                Curated digital tools, templates & presets — designed for creators who want to stand out.
              </p>
              <div style={heroStyles.buttons}>
                <button 
                  style={heroStyles.primaryBtn}
                  onClick={() => document.getElementById('products').scrollIntoView({ behavior: 'smooth' })}
                >
                  Explore Products →
                </button>
                <button style={heroStyles.secondaryBtn}>Learn More</button>
              </div>
            </div>
          </section>

          {/* Products Section */}
          <section id="products" style={gridWrapperStyles.section}>
            <div style={gridWrapperStyles.container}>
              <h2 style={gridWrapperStyles.heading}>
                Featured Drops ✦
                <span style={gridWrapperStyles.subheading}>Curated just for you</span>
              </h2>
              <ProductGrid products={products} />
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </ThemeProvider>
  );
}

// Styles remain the same as before
const heroStyles = {
  section: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    padding: '120px 24px 80px',
    background: 'var(--bg-primary)',
    transition: 'background 0.3s ease'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%'
  },
  badge: {
    display: 'inline-block',
    padding: '6px 16px',
    background: 'var(--accent)',
    color: 'white',
    borderRadius: '50px',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginBottom: '24px'
  },
  title: {
    fontSize: 'clamp(48px, 10vw, 96px)',
    fontWeight: '800',
    lineHeight: '1.05',
    letterSpacing: '-2px',
    marginBottom: '16px'
  },
  gradient: {
    background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  subtitle: {
    color: 'var(--text-primary)',
    fontSize: 'clamp(32px, 6vw, 64px)',
    fontWeight: '700',
    WebkitTextFillColor: 'var(--text-primary)'
  },
  description: {
    fontSize: 'clamp(16px, 2vw, 20px)',
    color: 'var(--text-secondary)',
    maxWidth: '560px',
    marginBottom: '40px',
    lineHeight: '1.7'
  },
  buttons: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap'
  },
  primaryBtn: {
    padding: '14px 36px',
    background: 'var(--accent)',
    color: 'white',
    borderRadius: '50px',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    border: 'none',
    cursor: 'pointer'
  },
  secondaryBtn: {
    padding: '14px 36px',
    background: 'transparent',
    color: 'var(--text-primary)',
    borderRadius: '50px',
    fontSize: '16px',
    fontWeight: '600',
    border: '1px solid var(--border)',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  }
};

const gridWrapperStyles = {
  section: {
    padding: '40px 24px 80px',
    background: 'var(--bg-primary)',
    transition: 'background 0.3s ease'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  heading: {
    fontSize: 'clamp(32px, 4vw, 48px)',
    fontWeight: '700',
    marginBottom: '8px',
    color: 'var(--text-primary)',
    letterSpacing: '-1px',
    display: 'flex',
    flexDirection: 'column'
  },
  subheading: {
    fontSize: 'clamp(14px, 1.2vw, 18px)',
    fontWeight: '400',
    color: 'var(--text-muted)',
    letterSpacing: '0px',
    marginTop: '4px'
  }
};

export default App;