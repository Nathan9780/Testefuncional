import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../services/supabase';

const Orders = ({ navigateTo }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Buscar pedidos do usuário
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Buscar itens de cada pedido
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: itemsData } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);
          
          return { ...order, items: itemsData || [] };
        })
      );

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      showToast('❌ Erro ao carregar pedidos', 3000);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: '#ff9800', text: 'Aguardando Pagamento', icon: '⏳', bg: 'rgba(255,152,0,0.1)' },
      processing: { color: '#2196f3', text: 'Processando', icon: '⚙️', bg: 'rgba(33,150,243,0.1)' },
      shipped: { color: '#00bcd4', text: 'Enviado', icon: '🚚', bg: 'rgba(0,188,212,0.1)' },
      delivered: { color: '#4caf50', text: 'Entregue', icon: '✅', bg: 'rgba(76,175,80,0.1)' },
      cancelled: { color: '#f44336', text: 'Cancelado', icon: '❌', bg: 'rgba(244,67,54,0.1)' }
    };
    return configs[status] || { color: '#888', text: status, icon: '📦', bg: 'rgba(136,136,136,0.1)' };
  };

  const formatPrice = (value) => {
    return value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
  };

  const formatDate = (date) => {
    if (!date) return 'Data não informada';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Tem certeza que deseja cancelar este pedido?')) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', orderId);

        if (error) throw error;
        showToast('✅ Pedido cancelado com sucesso!');
        fetchOrders();
      } catch (error) {
        showToast('❌ Erro ao cancelar pedido', 3000);
      }
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedProduct) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .insert([
          {
            user_id: user.id,
            product_id: selectedProduct.product_id,
            order_id: selectedOrder?.id,
            rating: reviewRating,
            comment: reviewComment
          }
        ]);

      if (error) throw error;

      // Marcar item como avaliado
      await supabase
        .from('order_items')
        .update({ reviewed: true })
        .eq('id', selectedProduct.id);

      showToast('✅ Avaliação enviada com sucesso!');
      setShowReviewModal(false);
      setReviewRating(5);
      setReviewComment('');
      setSelectedProduct(null);
      fetchOrders();
    } catch (error) {
      showToast('❌ Erro ao enviar avaliação', 3000);
    }
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  if (!user) {
    navigateTo('login');
    return null;
  }

  return (
    <div className="page-orders">
      <div className="page-header">
        <h1>📦 Meus Pedidos</h1>
        <p>Acompanhe todos os seus pedidos</p>
      </div>

      {/* Filtros */}
      <div className="orders-filters">
        <button 
          className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          Todos
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
          onClick={() => setFilterStatus('pending')}
        >
          ⏳ Pendentes
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'processing' ? 'active' : ''}`}
          onClick={() => setFilterStatus('processing')}
        >
          ⚙️ Processando
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'shipped' ? 'active' : ''}`}
          onClick={() => setFilterStatus('shipped')}
        >
          🚚 Enviados
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'delivered' ? 'active' : ''}`}
          onClick={() => setFilterStatus('delivered')}
        >
          ✅ Entregues
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando seus pedidos...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="orders-empty">
          <span>📦</span>
          <h3>Nenhum pedido encontrado</h3>
          <p>Você ainda não fez nenhuma compra.</p>
          <button className="btn-primary" onClick={() => navigateTo('products')}>
            Começar a comprar
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            return (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <span className="order-number">Pedido #{order.order_number || order.id}</span>
                    <span className="order-date">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="order-status" style={{ color: statusConfig.color, background: statusConfig.bg }}>
                    <span>{statusConfig.icon}</span>
                    <span>{statusConfig.text}</span>
                  </div>
                </div>

                <div className="order-items">
                  {order.items?.map((item) => (
                    <div key={item.id} className="order-item">
                      <div className="order-item-img">
                        <img 
                          src={item.product_image || 'https://placehold.co/80x80/1a1a1a/e8ff00?text=📦'} 
                          alt={item.product_name}
                          onError={(e) => {
                            e.target.src = 'https://placehold.co/80x80/1a1a1a/e8ff00?text=📦';
                          }}
                        />
                      </div>
                      <div className="order-item-info">
                        <h4>{item.product_name}</h4>
                        <div className="order-item-meta">
                          <span>Qtd: {item.quantity}</span>
                          <span>Preço: {formatPrice(item.price)}</span>
                          <span>Total: {formatPrice(item.total)}</span>
                        </div>
                      </div>
                      <div className="order-item-actions">
                        {order.status === 'delivered' && !item.reviewed && (
                          <button 
                            className="btn-review"
                            onClick={() => {
                              setSelectedOrder(order);
                              setSelectedProduct(item);
                              setShowReviewModal(true);
                            }}
                          >
                            ⭐ Avaliar
                          </button>
                        )}
                        {order.status === 'delivered' && item.reviewed && (
                          <span className="reviewed-badge">✓ Avaliado</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-footer">
                  <div className="order-total">
                    <span>Total do pedido:</span>
                    <strong>{formatPrice(order.total)}</strong>
                  </div>
                  <div className="order-actions">
                    {order.status === 'pending' && (
                      <button 
                        className="btn-cancel-order"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        Cancelar pedido
                      </button>
                    )}
                    {order.status === 'shipped' && order.tracking_code && (
                      <button className="btn-track">📍 Rastrear</button>
                    )}
                    <button 
                      className="btn-details"
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                      {expandedOrder === order.id ? '▲ Menos detalhes' : '▼ Mais detalhes'}
                    </button>
                  </div>
                </div>

                {expandedOrder === order.id && (
                  <div className="order-details">
                    <div className="details-section">
                      <h4>📍 Endereço de Entrega</h4>
                      {order.shipping_address ? (
                        <div className="address-info">
                          <p>{order.shipping_address.street}</p>
                          <p>{order.shipping_address.city} - {order.shipping_address.state}</p>
                          <p>CEP: {order.shipping_address.zip}</p>
                        </div>
                      ) : (
                        <p>Endereço não informado</p>
                      )}
                    </div>
                    <div className="details-section">
                      <h4>💳 Pagamento</h4>
                      <p>Método: {order.payment_method === 'credit' ? 'Cartão de Crédito' : 
                                 order.payment_method === 'debit' ? 'Cartão de Débito' :
                                 order.payment_method === 'pix' ? 'PIX' : 'Boleto Bancário'}</p>
                      <p>Subtotal: {formatPrice(order.subtotal)}</p>
                      <p>Frete: {order.shipping === 0 ? 'Grátis' : formatPrice(order.shipping)}</p>
                      {order.discount > 0 && <p>Desconto: -{formatPrice(order.discount)}</p>}
                    </div>
                    {order.tracking_code && (
                      <div className="details-section">
                        <h4>📮 Rastreamento</h4>
                        <p>Código: {order.tracking_code}</p>
                        {order.estimated_delivery && (
                          <p>Previsão: {formatDate(order.estimated_delivery)}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Avaliação */}
      {showReviewModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⭐ Avaliar Produto</h2>
              <button className="modal-close" onClick={() => setShowReviewModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="review-product">
                <img 
                  src={selectedProduct.product_image || 'https://placehold.co/60x60/1a1a1a/e8ff00?text=📦'} 
                  alt={selectedProduct.product_name}
                />
                <h4>{selectedProduct.product_name}</h4>
              </div>
              
              <div className="review-rating">
                <label>Sua nota:</label>
                <div className="stars-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className={`star-btn ${star <= reviewRating ? 'active' : ''}`}
                      onClick={() => setReviewRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="review-comment">
                <label>Comentário (opcional):</label>
                <textarea
                  rows="4"
                  placeholder="Conte sua experiência com o produto..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowReviewModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleSubmitReview}>
                Enviar Avaliação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;