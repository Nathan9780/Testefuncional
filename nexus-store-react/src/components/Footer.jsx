import React from 'react';

const Footer = ({ navigateTo }) => {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-logo">
          NEXUS<span>.</span>
        </div>
        <p>© 2025 NEXUS Store — Site fictício para fins de teste de software.</p>
        <div className="footer-links">
          <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); }}>Home</a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('products'); }}>Produtos</a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('about'); }}>Sobre</a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('cart'); }}>Carrinho</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;