import React, { useState } from 'react';
import { PRODUCTS } from '../data/products';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const ProductDetail = ({ productId, navigateTo }) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [selectedQty, setSelectedQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const product = PRODUCTS.find(p => p.id === productId);
  
  if (!product) {
    return (
      <div className="page-detail">
        <button className="btn-back" onClick={() => navigateTo('products')}>
          &#8592; Voltar para produtos
        </button>
        <div className="no-results">
          <span>❌</span>
          <p>Produto não encontrado</p>
        </div>
      </div>
    );
  }

  const stars = '★'.repeat(Math.round(product.rating)) + '☆'.repeat(5 - Math.round(product.rating));
  const installment = Math.ceil(product.price / 12);
  
  const formatPrice = (value) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleAddToCart = () => {
    addToCart(product, selectedQty, showToast);
  };

  return (
    <div className="page-detail">
      <button className="btn-back" onClick={() => navigateTo('products')}>
        &#8592; Voltar para produtos
      </button>
      
      <div className="product-detail">
        <div className="detail-gallery">
          <div className="gallery-main">
            <img 
              src={product.image} 
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div className="gallery-thumbs">
            {product.images?.map((img, idx) => (
              <button
                key={idx}
                className={`gallery-thumb ${idx === selectedImage ? 'selected' : ''}`}
                onClick={() => setSelectedImage(idx)}
              >
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        </div>

        <div className="detail-info">
          <div className="detail-category">{product.category}</div>
          <h1 className="detail-name">{product.name}</h1>
          <div className="detail-rating">
            <span className="stars">{stars}</span>
            {product.rating} — {product.reviews.toLocaleString('pt-BR')} avaliações
          </div>
          <div className="detail-price">{formatPrice(product.price)}</div>
          <div className="detail-installment">
            ou 12x de {formatPrice(installment)} sem juros
          </div>
          <p className="detail-desc">{product.desc}</p>

          <div className="qty-selector">
            <label>Quantidade</label>
            <div className="qty-controls">
              <button 
                className="qty-btn" 
                onClick={() => setSelectedQty(prev => Math.max(1, prev - 1))}
              >
                −
              </button>
              <span className="qty-value">{selectedQty}</span>
              <button 
                className="qty-btn" 
                onClick={() => setSelectedQty(prev => prev + 1)}
              >
                +
              </button>
            </div>
          </div>

          <button className="btn-add-cart" onClick={handleAddToCart}>
            🛒 Adicionar ao carrinho
          </button>

          <div className="detail-specs">
            <h4>Especificações técnicas</h4>
            {Object.entries(product.specs || {}).map(([key, value]) => (
              <div key={key} className="spec-row">
                <span className="spec-label">{key}</span>
                <span className="spec-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;