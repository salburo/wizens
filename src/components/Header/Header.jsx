import React from 'react';
import DarkModeToggle from '../DarkModeToggle/DarkModeToggle';
import styles from './Header.module.css';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>✦</span>
          <span className={styles.logoText}>Wizen's</span>
        </div>
        
        <nav className={styles.nav}>
          <a href="#products" className={styles.navLink}>Products</a>
          <a href="#about" className={styles.navLink}>About</a>
          <a href="#contact" className={styles.navLink}>Contact</a>
        </nav>

        <div className={styles.actions}>
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;