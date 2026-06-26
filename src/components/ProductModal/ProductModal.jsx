import React, { useEffect } from 'react';
import styles from './ProductModal.module.css';

const ProductModal = ({ product, onClose }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        <div className={styles.content}>
          <div className={styles.imageSection} style={{ background: product.gradient }}>
            <span className={styles.bigEmoji}>{product.emoji}</span>
          </div>

          <div className={styles.details}>
            <div className={styles.header}>
              <span className={styles.category}>{product.category}</span>
              <span className={styles.price}>{product.price}</span>
            </div>

            <h2 className={styles.name}>{product.name}</h2>
            <p className={styles.description}>{product.description}</p>

            <div className={styles.features}>
              <h4>What's included ✦</h4>
              <ul>
                <li>✓ Full access to {product.name}</li>
                <li>✓ Lifetime updates</li>
                <li>✓ 24/7 support</li>
                <li>✓ Commercial license</li>
              </ul>
            </div>

            <button className={styles.purchaseBtn}>
              <span>Get {product.name}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>

            <div className={styles.guarantee}>
              <span>🔒</span>
              <p>Secure checkout · 30-day guarantee</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;