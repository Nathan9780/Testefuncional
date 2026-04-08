import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { supabase } from "../services/supabase";
import { PRODUCTS } from "../data/products";
import ProductCard from "../components/ProductCard";

const Favorites = ({ navigateTo }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("user_id", user.id);

      if (error) throw error;

      const favoriteProducts = PRODUCTS.filter((p) =>
        data?.some((f) => f.product_id === p.id),
      );
      setFavorites(favoriteProducts);
    } catch (error) {
      console.error("Erro ao buscar favoritos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (productId) => {
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

      if (error) throw error;

      setFavorites((prev) => prev.filter((p) => p.id !== productId));
      showToast("✅ Removido dos favoritos!");
    } catch (error) {
      showToast("❌ Erro ao remover favorito", 3000);
    }
  };

  const handleProductClick = (productId) => {
    navigateTo("detail", productId);
  };

  if (!user) {
    navigateTo("login");
    return null;
  }

  return (
    <div className="page-favorites">
      <div className="page-header">
        <h1>❤️ Meus Favoritos</h1>
        <p>Produtos que você salvou para comprar depois</p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando favoritos...</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="favorites-empty">
          <span>❤️</span>
          <h3>Nenhum favorito ainda</h3>
          <p>Clique no coração nos produtos para adicionar aos favoritos</p>
          <button
            className="btn-primary"
            onClick={() => navigateTo("products")}
          >
            Explorar produtos
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {favorites.map((product) => (
            <div key={product.id} className="favorite-card-wrapper">
              <ProductCard
                product={product}
                onCardClick={handleProductClick}
                onAddToCart={() => {}}
              />
              <button
                className="remove-favorite-btn"
                onClick={() => handleRemoveFavorite(product.id)}
              >
                ❌ Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
