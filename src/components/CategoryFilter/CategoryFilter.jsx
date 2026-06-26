import React from 'react';
import styles from './CategoryFilter.module.css';

const categories = [
  { id: 'all', label: '✨ All', icon: 'all' },
  { id: 'templates', label: '📐 Templates', icon: 'template' },
  { id: 'ebooks', label: '📖 Ebooks', icon: 'book' },
  { id: 'presets', label: '🎨 Presets', icon: 'preset' }
];

const CategoryFilter = ({ activeCategory, onCategoryChange }) => {
  return (
    <div className={styles.filter}>
      <div className={styles.tabs}>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`${styles.tab} ${activeCategory === cat.id ? styles.active : ''}`}
            onClick={() => onCategoryChange(cat.id)}
          >
            <span className={styles.tabLabel}>{cat.label}</span>
            {activeCategory === cat.id && (
              <span className={styles.activeIndicator} />
            )}
          </button>
        ))}
      </div>
      
      <div className={styles.count}>
        <span className={styles.countNumber}>
          {activeCategory === 'all' ? 'All' : activeCategory}
        </span>
        <span className={styles.countLabel}>products</span>
      </div>
    </div>
  );
};

export default CategoryFilter;