import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Header = ({ navigateTo, currentPage }) => {
  const { user, signOut, profile } = useAuth();
  const { cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleNavigate = (page) => {
    navigateTo(page);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    handleNavigate('login');
  };

  return (
    <header className="main-header">
      <nav className="navbar">
        <div className="logo" onClick={() => handleNavigate('home')}>
          NEXUS<span>.</span>
        </div>
        
        <ul className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <li>
            <a 
              href="#"
              className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleNavigate('home'); }}
            >
              Home
            </a>
          </li>
          <li>
            <a 
              href="#"
              className={`nav-link ${currentPage === 'products' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleNavigate('products'); }}
            >
              Produtos
            </a>
          </li>
          <li>
            <a 
              href="#"
              className={`nav-link ${currentPage === 'about' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleNavigate('about'); }}
            >
              Sobre
            </a>
          </li>
        </ul>

        <div className="nav-actions">
          <button className="cart-btn" onClick={() => handleNavigate('cart')} aria-label="Abrir carrinho">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span className="cart-badge">{cartCount}</span>
          </button>

          <div className="user-menu">
            <button 
              className="user-btn" 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-label="Menu do usuário"
            >
              {user ? (profile?.avatar_url || '👤') : '🔑'}
            </button>
            
            {userMenuOpen && (
              <div className="user-dropdown">
                {user ? (
                  <>
                    <div className="user-info">
                      <strong>{profile?.full_name || user.email?.split('@')[0]}</strong>
                      <div className="user-email">{user.email}</div>
                    </div>
                    <button onClick={() => handleNavigate('profile')}>👤 Meu Perfil</button>
                    <button onClick={() => handleNavigate('orders')}>📦 Meus Pedidos</button>
                    <button onClick={handleLogout}>🚪 Sair</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleNavigate('login')}>🔐 Entrar</button>
                    <button onClick={() => handleNavigate('login')}>📝 Cadastrar</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <button 
          className="hamburger" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu"
        >
          <span></span><span></span><span></span>
        </button>
      </nav>
    </header>
  );
};

export default Header;