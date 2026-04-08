import React, { useState, useEffect } from "react";
import { PRODUCTS } from "../data/products";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase";

const ProductDetail = ({ productId, navigateTo }) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [selectedQty, setSelectedQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  // Estados para favorito
  const [isFavorite, setIsFavorite] = useState(false);

  const product = PRODUCTS.find((p) => p.id === productId);

  // Buscar avaliações do produto
  useEffect(() => {
    fetchReviews();
  }, [productId]);

  // Verificar favorito e se pode avaliar
  useEffect(() => {
    if (user) {
      checkIfFavorite();
      checkIfCanReview();
    }
  }, [user, productId]);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from("product_reviews")
        .select(
          `
          *,
          user_profiles (full_name, email)
        `,
        )
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReviews(data || []);

      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(avg);
        setTotalReviews(data.length);
      }

      if (user && data) {
        const userExistingReview = data.find((r) => r.user_id === user.id);
        setUserReview(userExistingReview);
      }
    } catch (error) {
      console.error("Erro ao buscar avaliações:", error);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Função para verificar se o produto está nos favoritos
  const checkIfFavorite = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (!error && data) {
        setIsFavorite(true);
      } else {
        setIsFavorite(false);
      }
    } catch (error) {
      console.error("Erro ao verificar favorito:", error);
      setIsFavorite(false);
    }
  };

  // Função para favoritar/desfavoritar
  const toggleFavorite = async () => {
    if (!user) {
      showToast("🔒 Faça login para favoritar produtos", 3000);
      navigateTo("login");
      return;
    }

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);

        if (error) throw error;
        setIsFavorite(false);
        showToast("❤️ Removido dos favoritos");
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert([{ user_id: user.id, product_id: productId }]);

        if (error) throw error;
        setIsFavorite(true);
        showToast("❤️ Adicionado aos favoritos!");
      }
    } catch (error) {
      console.error("Erro ao favoritar:", error);
      showToast("❌ Erro ao favoritar produto", 3000);
    }
  };

  // Função para verificar se pode avaliar (comprou e recebeu)
  const checkIfCanReview = async () => {
    if (!user) {
      setCanReview(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("order_items")
        .select(
          `
          order_id,
          orders!inner (status, user_id)
        `,
        )
        .eq("product_id", productId)
        .eq("orders.user_id", user.id)
        .eq("orders.status", "delivered");

      if (error) throw error;

      setCanReview(data && data.length > 0);
    } catch (error) {
      console.error("Erro ao verificar compra:", error);
      setCanReview(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      showToast("🔒 Faça login para avaliar este produto", 3000);
      navigateTo("login");
      return;
    }

    if (!canReview) {
      showToast(
        "⚠️ Você só pode avaliar produtos que comprou e recebeu!",
        4000,
      );
      return;
    }

    try {
      const { data: orderData } = await supabase
        .from("order_items")
        .select("order_id")
        .eq("product_id", productId)
        .eq("orders.user_id", user.id)
        .eq("orders.status", "delivered")
        .limit(1);

      const orderId = orderData?.[0]?.order_id;

      const { error } = await supabase.from("product_reviews").insert([
        {
          product_id: productId,
          user_id: user.id,
          order_id: orderId,
          rating: reviewRating,
          comment: reviewComment,
          verified_purchase: true,
        },
      ]);

      if (error) throw error;

      showToast("✅ Avaliação enviada com sucesso!");
      setShowReviewForm(false);
      setReviewRating(5);
      setReviewComment("");
      fetchReviews();
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error);
      showToast("❌ Erro ao enviar avaliação", 3000);
    }
  };

  const handleEditReview = async () => {
    if (!userReview) return;

    try {
      const { error } = await supabase
        .from("product_reviews")
        .update({
          rating: reviewRating,
          comment: reviewComment,
          updated_at: new Date(),
        })
        .eq("id", userReview.id);

      if (error) throw error;

      showToast("✅ Avaliação atualizada com sucesso!");
      setShowReviewForm(false);
      setUserReview({
        ...userReview,
        rating: reviewRating,
        comment: reviewComment,
      });
      fetchReviews();
    } catch (error) {
      console.error("Erro ao atualizar avaliação:", error);
      showToast("❌ Erro ao atualizar avaliação", 3000);
    }
  };

  if (!product) {
    return (
      <div className="page-detail">
        <button className="btn-back" onClick={() => navigateTo("products")}>
          &#8592; Voltar para produtos
        </button>
        <div className="no-results">
          <span>❌</span>
          <p>Produto não encontrado</p>
        </div>
      </div>
    );
  }

  const stars =
    "★".repeat(Math.round(product.rating)) +
    "☆".repeat(5 - Math.round(product.rating));
  const installment = Math.ceil(product.price / 12);

  const formatPrice = (value) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleAddToCart = () => {
    addToCart(product, selectedQty, showToast);
  };

  const renderStars = (rating) => {
    return "★".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating));
  };

  return (
    <div className="page-detail">
      <button className="btn-back" onClick={() => navigateTo("products")}>
        &#8592; Voltar para produtos
      </button>

      <div className="product-detail">
        <div className="detail-gallery">
          <div className="gallery-main">
            <img
              src={product.image}
              alt={product.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div className="gallery-thumbs">
            {product.images?.map((img, idx) => (
              <button
                key={idx}
                className={`gallery-thumb ${idx === selectedImage ? "selected" : ""}`}
                onClick={() => setSelectedImage(idx)}
              >
                <img
                  src={img}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="detail-info">
          <div className="detail-category">{product.category}</div>
          <div className="detail-header">
            <h1 className="detail-name">{product.name}</h1>
            <button
              className={`favorite-btn ${isFavorite ? "active" : ""}`}
              onClick={toggleFavorite}
              aria-label={
                isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
              }
            >
              {isFavorite ? "❤️" : "🤍"}
            </button>
          </div>
          <div className="detail-rating">
            <span className="stars">{stars}</span>
            {product.rating} — {product.reviews.toLocaleString("pt-BR")}{" "}
            avaliações
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
                onClick={() => setSelectedQty((prev) => Math.max(1, prev - 1))}
              >
                −
              </button>
              <span className="qty-value">{selectedQty}</span>
              <button
                className="qty-btn"
                onClick={() => setSelectedQty((prev) => prev + 1)}
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

      {/* Seção de Avaliações */}
      <div className="reviews-section">
        <div className="reviews-header">
          <h2>Avaliações dos Clientes</h2>
          <div className="reviews-summary">
            <div className="average-rating">
              <span className="big-rating">
                {averageRating.toFixed(1) || product.rating}
              </span>
              <div className="stars">
                {renderStars(averageRating || product.rating)}
              </div>
              <span className="total-reviews">
                {totalReviews || product.reviews} avaliações
              </span>
            </div>
          </div>
        </div>

        {canReview && !userReview && (
          <div className="review-cta">
            <p>Você comprou este produto? Compartilhe sua experiência!</p>
            <button
              className="btn-review-product"
              onClick={() => setShowReviewForm(true)}
            >
              ⭐ Avaliar este produto
            </button>
          </div>
        )}

        {userReview && (
          <div className="user-review">
            <h3>Sua avaliação</h3>
            <div className="review-card user">
              <div className="review-header">
                <div className="reviewer-info">
                  <strong>Você</strong>
                  <span className="verified-badge">✓ Compra verificada</span>
                </div>
                <div className="review-rating">
                  {renderStars(userReview.rating)}
                </div>
              </div>
              <p className="review-comment">
                {userReview.comment || "Sem comentário"}
              </p>
              <button
                className="btn-edit-review"
                onClick={() => {
                  setReviewRating(userReview.rating);
                  setReviewComment(userReview.comment || "");
                  setShowReviewForm(true);
                }}
              >
                Editar avaliação
              </button>
            </div>
          </div>
        )}

        {showReviewForm && (
          <div className="review-form-modal">
            <div className="review-form">
              <h3>{userReview ? "Editar avaliação" : "Avaliar produto"}</h3>
              <div className="rating-input">
                <label>Sua nota:</label>
                <div className="stars-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className={`star-btn ${star <= reviewRating ? "active" : ""}`}
                      onClick={() => setReviewRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="comment-input">
                <label>Comentário:</label>
                <textarea
                  rows="4"
                  placeholder="Conte sua experiência com o produto..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>
              <div className="form-actions">
                <button
                  className="btn-outline"
                  onClick={() => setShowReviewForm(false)}
                >
                  Cancelar
                </button>
                <button
                  className="btn-primary"
                  onClick={userReview ? handleEditReview : handleSubmitReview}
                >
                  {userReview ? "Atualizar" : "Enviar avaliação"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="reviews-list">
          <h3>Todas as avaliações</h3>
          {loadingReviews ? (
            <div className="loading-reviews">Carregando avaliações...</div>
          ) : reviews.length === 0 ? (
            <div className="no-reviews">
              <span>📝</span>
              <p>Seja o primeiro a avaliar este produto!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <div className="reviewer-info">
                    <strong>
                      {review.user_profiles?.full_name || "Usuário"}
                    </strong>
                    {review.verified_purchase && (
                      <span className="verified-badge">
                        ✓ Compra verificada
                      </span>
                    )}
                  </div>
                  <div className="review-rating">
                    {renderStars(review.rating)}
                  </div>
                </div>
                <p className="review-comment">
                  {review.comment || "Sem comentário"}
                </p>
                <span className="review-date">
                  {new Date(review.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
