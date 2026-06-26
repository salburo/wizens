import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p className={styles.text}>
          © 2026 <span className={styles.brand}>Wizen's</span> — built with ✦ for the next gen
        </p>
        <div className={styles.socials}>
          <a href="#" className={styles.socialLink}>𝕏</a>
          <a href="#" className={styles.socialLink}>IG</a>
          <a href="#" className={styles.socialLink}>GH</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;