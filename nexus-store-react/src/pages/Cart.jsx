import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

const Cart = ({ navigateTo }) => {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
  const [showModal, setShowModal] = useState(false);

  const formatPrice = (value) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const subtotal = getCartTotal();
  const frete = subtotal >= 500 ? 0 : 29.9;
  const total = subtotal + frete;

  const handleCheckout = () => {
    setShowModal(true);
  };

  const confirmCheckout = () => {
    clearCart();
    setShowModal(false);
    navigateTo('home');
  };

  if (cart.length === 0) {
    return (
      <div className="page-cart">
        <div className="page-header">
          <h1>Meu Carrinho</h1>
        </div>
        <div className="cart-empty">
          <span>🛒</span>
          <h3>Seu carrinho está vazio</h3>
          <p>Adicione produtos e eles aparecerão aqui.</p>
          <button className="btn-primary" onClick={() => navigateTo('products')}>
            Explorar produtos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-cart">
      <div className="page-header">
        <h1>Meu Carrinho</h1>
      </div>
      
      <div className="cart-container">
        <div className="cart-items">
          {cart.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-emoji">{item.emoji}</div>
              <div className="cart-item-info">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-price">
                  {formatPrice(item.price)} / un.
                </div>
                <div className="cart-item-total">
                  {formatPrice(item.price * item.qty)}
                </div>
              </div>
              <div className="cart-item-controls">
                <div className="cart-qty-controls">
                  <button 
                    className="cart-qty-btn" 
                    onClick={() => updateQuantity(item.id, -1)}
                    aria-label="Diminuir quantidade"
                  >
                    −
                  </button>
                  <span className="cart-qty-value">{item.qty}</span>
                  <button 
                    className="cart-qty-btn" 
                    onClick={() => updateQuantity(item.id, 1)}
                    aria-label="Aumentar quantidade"
                  >
                    +
                  </button>
                </div>
                <button className="cart-remove" onClick={() => removeFromCart(item.id)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h3>Resumo do pedido</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <span className="val">{formatPrice(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Frete</span>
            <span className="val">{frete === 0 ? '🎉 Grátis' : formatPrice(frete)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span className="val">{formatPrice(total)}</span>
          </div>
          <button className="btn-checkout" onClick={handleCheckout}>
            Finalizar Compra
          </button>
          <button className="btn-clear-cart" onClick={clearCart}>
            Limpar carrinho
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">🎉</div>
            <h2>Compra realizada!</h2>
            <p>
              Seu pedido de <strong>{formatPrice(total)}</strong> foi processado com sucesso.<br /><br />
              <em>(Este é um ambiente de testes — nenhuma compra real foi efetuada.)</em>
            </p>
            <button className="btn-primary" onClick={confirmCheckout}>
              Voltar à loja
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;