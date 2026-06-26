import React, { useState, useMemo } from 'react';
import ProductCard from '../ProductCard/ProductCard';
import CategoryFilter from '../CategoryFilter/CategoryFilter';
import ProductModal from '../ProductModal/ProductModal';
import styles from './ProductGrid.module.css';

const ProductGrid = ({ products }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter(p => p.category === activeCategory);
  }, [products, activeCategory]);

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    document.body.style.overflow = 'unset';
  };

  return (
    <div className={styles.gridSection}>
      <CategoryFilter 
        activeCategory={activeCategory} 
        onCategoryChange={setActiveCategory} 
      />

      <div className={styles.grid}>
        {filteredProducts.map((product, index) => (
          <div 
            key={product.id} 
            className={styles.gridItem}
            style={{ 
              animationDelay: `${index * 0.05}s`,
              opacity: 0,
              animation: `fadeInUp 0.6s ease forwards ${index * 0.05}s`
            }}
          >
            <ProductCard 
              product={product} 
              onClick={handleProductClick}
            />
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className={styles.empty}>
          <span className={styles.emptyEmoji}>🔮</span>
          <h3>No products found</h3>
          <p>Try a different category</p>
        </div>
      )}

      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
};

export default ProductGrid;