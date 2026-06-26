import React, { useState } from 'react';
import styles from './ProductCard.module.css';

const ProductCard = ({ product, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={styles.card}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(product)}
      style={{
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 20px 60px rgba(108, 92, 231, 0.15)' : 'var(--shadow)'
      }}
    >
      <div className={styles.imageWrapper}>
        <div className={styles.image} style={{ background: product.gradient }}>
          <span className={styles.emoji}>{product.emoji}</span>
          {product.badge && (
            <span className={styles.badge}>{product.badge}</span>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{product.name}</h3>
        <p className={styles.description}>{product.description}</p>
        
        <div className={styles.meta}>
          <span className={styles.category}>{product.category}</span>
          <span className={styles.price}>{product.price}</span>
        </div>

        <button className={styles.button}>
          <span>View Details</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;