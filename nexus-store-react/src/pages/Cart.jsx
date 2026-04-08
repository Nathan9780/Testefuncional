import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { supabase } from "../services/supabase";

const Cart = ({ navigateTo }) => {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal } =
    useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState({ number: "", expiry: "", cvv: "" });

  const formatPrice = (value) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const subtotal = getCartTotal();
  const frete = subtotal >= 500 ? 0 : 29.9;
  const total = subtotal + frete - discount;

  const applyCoupon = async () => {
    if (!couponCode) {
      showToast("❌ Digite um código de cupom", 3000);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("active", true)
        .single();

      if (error || !data) {
        showToast("❌ Cupom inválido ou expirado", 3000);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        showToast("❌ Cupom expirado", 3000);
        return;
      }

      if (subtotal < data.min_purchase) {
        showToast(
          `❌ Mínimo de compra: ${formatPrice(data.min_purchase)}`,
          3000,
        );
        return;
      }

      let discountAmount = 0;
      if (data.discount_type === "percentage") {
        discountAmount = (subtotal * data.discount_value) / 100;
        if (data.max_discount && discountAmount > data.max_discount) {
          discountAmount = data.max_discount;
        }
      } else {
        discountAmount = data.discount_value;
      }

      setDiscount(discountAmount);
      setCouponApplied(data);
      showToast(
        `✅ Cupom aplicado! Desconto de ${formatPrice(discountAmount)}`,
        3000,
      );
    } catch (error) {
      showToast("❌ Erro ao aplicar cupom", 3000);
    }
  };

  const generatePixQRCode = () => {
    const pixKey = "nexus.store@email.com";
    const amount = total.toFixed(2);
    const merchant = "NEXUS Store";
    const city = "Sao Paulo";

    // Gerar payload PIX simplificado
    const payload = `00020126580014BR.GOV.BCB.PIX0136${pixKey}5204000053039865404${amount}5802BR5913${merchant}6008${city}62070503***6304`;
    setQrCode(payload);
  };

  const validateCard = () => {
    if (cardData.number.length < 16) {
      showToast("❌ Número do cartão inválido", 3000);
      return false;
    }
    if (cardData.expiry.length < 5) {
      showToast("❌ Data de validade inválida", 3000);
      return false;
    }
    if (cardData.cvv.length < 3) {
      showToast("❌ CVV inválido", 3000);
      return false;
    }
    return true;
  };

  const handleCheckout = () => {
    if (!user) {
      showToast("🔒 Faça login para finalizar a compra", 3000);
      navigateTo("login");
      return;
    }

    if (!paymentMethod) {
      showToast("❌ Selecione uma forma de pagamento", 3000);
      return;
    }

    if (paymentMethod === "pix") {
      generatePixQRCode();
      setShowModal(true);
    } else if (paymentMethod === "debit" || paymentMethod === "credit") {
      if (validateCard()) {
        setShowModal(true);
      }
    }
  };

  const confirmCheckout = async () => {
    setLoading(true);

    try {
      const orderNumber = `NEXUS-${Date.now()}`;
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

      // Criar o pedido
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            user_id: user.id,
            order_number: orderNumber,
            status: paymentMethod === "pix" ? "pending_payment" : "processing",
            status_text:
              paymentMethod === "pix"
                ? "Aguardando pagamento PIX"
                : "Processando pagamento",
            subtotal: subtotal,
            shipping: frete,
            discount_amount: discount,
            total: total,
            coupon_code: couponApplied?.code,
            payment_method: paymentMethod,
            estimated_delivery_date: estimatedDelivery,
            tracking_updates: [
              {
                status: "order_placed",
                date: new Date(),
                message: "Pedido realizado com sucesso",
              },
            ],
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Adicionar itens do pedido
      for (const item of cart) {
        const { error: itemError } = await supabase.from("order_items").insert([
          {
            order_id: order.id,
            product_id: item.id,
            product_name: item.name,
            product_image: item.image,
            quantity: item.qty,
            price: item.price,
            total: item.price * item.qty,
          },
        ]);

        if (itemError) throw itemError;
      }

      // Limpar carrinho
      clearCart();
      setShowModal(false);
      setLoading(false);

      showToast("✅ Pedido realizado com sucesso!");
      navigateTo("orders");
    } catch (error) {
      console.error("Erro ao finalizar compra:", error);
      showToast("❌ Erro ao finalizar compra", 3000);
      setLoading(false);
    }
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
          <button
            className="btn-primary"
            onClick={() => navigateTo("products")}
          >
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
          {cart.map((item) => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-img">
                <img
                  src={item.image}
                  alt={item.name}
                  onError={(e) =>
                    (e.target.src =
                      "https://placehold.co/80x80/1a1a1a/e8ff00?text=📦")
                  }
                />
              </div>
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
                  <button onClick={() => updateQuantity(item.id, -1)}>−</button>
                  <span>{item.qty}</span>
                  <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                </div>
                <button
                  className="cart-remove"
                  onClick={() => removeFromCart(item.id)}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h3>Resumo do pedido</h3>

          <div className="coupon-section">
            <input
              type="text"
              placeholder="Código do cupom"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <button onClick={applyCoupon}>Aplicar</button>
          </div>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Frete</span>
            <span>{frete === 0 ? "Grátis" : formatPrice(frete)}</span>
          </div>
          {discount > 0 && (
            <div className="summary-row">
              <span>Desconto</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          <div className="payment-methods">
            <h4>Forma de pagamento</h4>
            <label className="payment-option">
              <input
                type="radio"
                name="payment"
                value="pix"
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>💰 PIX (Pagamento instantâneo)</span>
            </label>
            <label className="payment-option">
              <input
                type="radio"
                name="payment"
                value="debit"
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>💳 Débito</span>
            </label>
            <label className="payment-option">
              <input
                type="radio"
                name="payment"
                value="credit"
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>💳 Crédito</span>
            </label>
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
            <h2>Finalizar compra</h2>

            {paymentMethod === "pix" && qrCode && (
              <div className="pix-section">
                <p>Escaneie o QR Code abaixo para pagar:</p>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`}
                  alt="QR Code PIX"
                  style={{ margin: "1rem auto", display: "block" }}
                />
                <p className="pix-code">Valor: {formatPrice(total)}</p>
                <button
                  className="btn-outline"
                  onClick={() => navigator.clipboard.writeText(qrCode)}
                  style={{ marginTop: "0.5rem" }}
                >
                  Copiar código PIX
                </button>
              </div>
            )}

            {(paymentMethod === "debit" || paymentMethod === "credit") && (
              <div className="card-section">
                <p>
                  Pagamento com cartão de{" "}
                  {paymentMethod === "debit" ? "débito" : "crédito"}
                </p>
                <div className="form-group">
                  <label>Número do cartão</label>
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    maxLength="16"
                    value={cardData.number}
                    onChange={(e) =>
                      setCardData({
                        ...cardData,
                        number: e.target.value.replace(/\D/g, ""),
                      })
                    }
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Validade</label>
                    <input
                      type="text"
                      placeholder="MM/AA"
                      maxLength="5"
                      value={cardData.expiry}
                      onChange={(e) =>
                        setCardData({ ...cardData, expiry: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input
                      type="password"
                      placeholder="123"
                      maxLength="4"
                      value={cardData.cvv}
                      onChange={(e) =>
                        setCardData({
                          ...cardData,
                          cvv: e.target.value.replace(/\D/g, ""),
                        })
                      }
                    />
                  </div>
                </div>
                <p className="test-info">
                  💳 Teste: use qualquer número (16 dígitos)
                </p>
              </div>
            )}

            <div className="form-actions" style={{ marginTop: "1.5rem" }}>
              <button
                className="btn-outline"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={confirmCheckout}
                disabled={loading}
              >
                {loading
                  ? "Processando..."
                  : `Confirmar pagamento de ${formatPrice(total)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
