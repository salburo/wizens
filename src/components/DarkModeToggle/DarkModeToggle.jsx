import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import styles from './DarkModeToggle.module.css';

const DarkModeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button 
      className={styles.toggle} 
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <div className={styles.track}>
        <span className={`${styles.thumb} ${isDark ? styles.dark : styles.light}`}>
          {isDark ? '🌙' : '☀️'}
        </span>
      </div>
    </button>
  );
};

export default DarkModeToggle;