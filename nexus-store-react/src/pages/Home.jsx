import React from 'react';
import Carousel from '../components/Carousel';
import ProductCard from '../components/ProductCard';
import { PRODUCTS } from '../data/products';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const Home = ({ navigateTo }) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  
  const featuredProducts = PRODUCTS.filter(p => p.badge).slice(0, 4);

  const handleProductClick = (productId) => {
    navigateTo('detail', productId);
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1, showToast);
  };

  const handleCategoryClick = (category) => {
    sessionStorage.setItem('preSelectedCategory', category);
    navigateTo('products');
  };

  return (
    <div className="page-home">
      <Carousel onProductClick={handleProductClick} />

      <section className="section-categories">
        <h2 className="section-title">Explore por categoria</h2>
        <div className="categories-grid">
          <div className="category-card" onClick={() => handleCategoryClick('smartphone')}>
            <div className="cat-icon">📱</div>
            <span>Smartphones</span>
          </div>
          <div className="category-card" onClick={() => handleCategoryClick('notebook')}>
            <div className="cat-icon">💻</div>
            <span>Notebooks</span>
          </div>
          <div className="category-card" onClick={() => handleCategoryClick('fone')}>
            <div className="cat-icon">🎧</div>
            <span>Fones</span>
          </div>
          <div className="category-card" onClick={() => handleCategoryClick('tablet')}>
            <div className="cat-icon">📟</div>
            <span>Tablets</span>
          </div>
          <div className="category-card" onClick={() => handleCategoryClick('acessorio')}>
            <div className="cat-icon">⌚</div>
            <span>Acessórios</span>
          </div>
        </div>
      </section>

      <section className="section-featured">
        <h2 className="section-title">Destaques da semana</h2>
        <div className="products-grid">
          {featuredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onCardClick={handleProductClick}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
        <div className="center-btn">
          <button className="btn-primary" onClick={() => navigateTo('products')}>
            Ver todos os produtos
          </button>
        </div>
      </section>

      <div className="cta-banner">
        <div className="cta-content">
          <h2>Tecnologia que transforma.</h2>
          <p>Frete grátis em compras acima de R$ 500</p>
          <button className="btn-outline" onClick={() => navigateTo('products')}>
            Comprar agora
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;