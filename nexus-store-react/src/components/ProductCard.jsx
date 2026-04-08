import React from 'react';

const ProductCard = ({ product, onCardClick, onAddToCart }) => {
  const stars = '★'.repeat(Math.round(product.rating)) + '☆'.repeat(5 - Math.round(product.rating));
  
  const formatPrice = (value) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div 
      className="product-card" 
      data-id={product.id}
      onClick={() => onCardClick(product.id)}
      role="button"
      tabIndex="0"
      aria-label={`Ver ${product.name}`}
    >
      <div className="card-image">
        {product.badge && <div className="card-badge">{product.badge}</div>}
        <img 
          src={product.image} 
          alt={product.name}
          className="product-img"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://placehold.co/400x400/1a1a1a/e8ff00?text=' + product.emoji;
          }}
        />
      </div>
      <div className="card-body">
        <div className="card-category">{product.category === 'smartphone' ? '📱 Smartphone' : 
          product.category === 'notebook' ? '💻 Notebook' :
          product.category === 'fone' ? '🎧 Fone' :
          product.category === 'tablet' ? '📟 Tablet' : '⌚ Acessório'}</div>
        <div className="card-name">{product.name}</div>
        <div className="card-rating">
          <span className="stars">{stars}</span> {product.rating} ({product.reviews.toLocaleString()})
        </div>
        <div className="card-price">{formatPrice(product.price)}</div>
        <div className="card-footer">
          <button 
            className="card-add" 
            onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
            aria-label={`Adicionar ${product.name} ao carrinho`}
          >
            🛒 Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;