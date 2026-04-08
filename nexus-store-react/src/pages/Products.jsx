import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { PRODUCTS } from '../data/products';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const Products = ({ navigateTo }) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  
  const [filters, setFilters] = useState({
    search: '',
    priceMin: '',
    priceMax: '',
    category: '',
    sort: 'default'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const preSelectedCategory = sessionStorage.getItem('preSelectedCategory');
    if (preSelectedCategory) {
      setFilters(prev => ({ ...prev, category: preSelectedCategory }));
      sessionStorage.removeItem('preSelectedCategory');
    }
  }, []);

  const getFilteredProducts = () => {
    let result = [...PRODUCTS];
    const { search, priceMin, priceMax, category, sort } = filters;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
      );
    }
    if (priceMin !== '' && !isNaN(parseFloat(priceMin))) {
      result = result.filter(p => p.price >= parseFloat(priceMin));
    }
    if (priceMax !== '' && !isNaN(parseFloat(priceMax))) {
      result = result.filter(p => p.price <= parseFloat(priceMax));
    }
    if (category) result = result.filter(p => p.category === category);

    switch (sort) {
      case 'price-asc': result.sort((a, b) => a.price - b.price); break;
      case 'price-desc': result.sort((a, b) => b.price - a.price); break;
      case 'name-asc': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: break;
    }

    return result;
  };

  const filteredProducts = getFilteredProducts();
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentProducts = filteredProducts.slice(startIdx, startIdx + itemsPerPage);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', priceMin: '', priceMax: '', category: '', sort: 'default' });
    setCurrentPage(1);
  };

  const handleProductClick = (productId) => {
    navigateTo('detail', productId);
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1, showToast);
  };

  return (
    <div className="page-products">
      <div className="page-header">
        <h1>Catálogo de Produtos</h1>
        <p>Encontre o seu próximo dispositivo favorito</p>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <label htmlFor="search-input">Buscar</label>
          <input 
            id="search-input"
            type="text" 
            placeholder="Ex: iPhone, Pixel..." 
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="price-min">Preço mín. (R$)</label>
          <input 
            id="price-min"
            type="number" 
            placeholder="0" 
            value={filters.priceMin}
            onChange={(e) => handleFilterChange('priceMin', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="price-max">Preço máx. (R$)</label>
          <input 
            id="price-max"
            type="number" 
            placeholder="99999" 
            value={filters.priceMax}
            onChange={(e) => handleFilterChange('priceMax', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="category-filter">Categoria</label>
          <select 
            id="category-filter"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">Todas</option>
            <option value="smartphone">Smartphones</option>
            <option value="notebook">Notebooks</option>
            <option value="fone">Fones</option>
            <option value="tablet">Tablets</option>
            <option value="acessorio">Acessórios</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="sort-select">Ordenar por</label>
          <select 
            id="sort-select"
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
          >
            <option value="default">Padrão</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="name-asc">A → Z</option>
          </select>
        </div>
        <button className="btn-clear" onClick={clearFilters}>Limpar filtros</button>
      </div>

      <div className="results-info">
        Exibindo {currentProducts.length} de {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''}
      </div>

      <div className="products-grid">
        {currentProducts.length === 0 ? (
          <div className="no-results">
            <span>🔍</span>
            <p>Nenhum produto encontrado com esses filtros.</p>
            <button className="btn-outline" onClick={clearFilters}>Limpar filtros</button>
          </div>
        ) : (
          currentProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onCardClick={handleProductClick}
              onAddToCart={handleAddToCart}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="page-btn" 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            &#8592;
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button 
            className="page-btn" 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            &#8594;
          </button>
        </div>
      )}
    </div>
  );
};

export default Products;