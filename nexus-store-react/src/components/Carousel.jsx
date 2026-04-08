import React, { useState, useEffect, useRef } from 'react';
import { PRODUCTS, CAROUSEL_SLIDES } from '../data/products';

const Carousel = ({ onProductClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const intervalRef = useRef(null);

  const slides = CAROUSEL_SLIDES.map(slide => ({
    ...slide,
    product: PRODUCTS.find(p => p.id === slide.productId)
  }));

  useEffect(() => {
    if (isPlaying && slides.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % slides.length);
      }, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, slides.length]);

  const goToSlide = (index) => {
    setCurrentIndex((index + slides.length) % slides.length);
    resetInterval();
  };

  const resetInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      if (isPlaying) {
        intervalRef.current = setInterval(() => {
          setCurrentIndex(prev => (prev + 1) % slides.length);
        }, 5000);
      }
    }
  };

  const formatPrice = (value) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleMouseEnter = () => setIsPlaying(false);
  const handleMouseLeave = () => setIsPlaying(true);

  if (slides.length === 0) return null;

  return (
    <div 
      className="carousel" 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label="Carrossel de produtos em destaque"
    >
      <div 
        className="carousel-track" 
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide, idx) => (
          <div 
            key={idx} 
            className="carousel-slide"
          >
            <div className="slide-bg" style={{ background: `linear-gradient(135deg, ${slide.colorA}, ${slide.colorB})` }}></div>
            <div className="slide-content-wrapper">
              <div className="slide-content">
                <div className="slide-tag">{slide.tag}</div>
                <h2>{slide.product?.name}</h2>
                <p>{slide.product?.desc.substring(0, 100)}...</p>
                <div className="slide-price">
                  <span>a partir de </span>
                  {formatPrice(slide.product?.price || 0)}
                </div>
                <button className="btn-primary" onClick={() => onProductClick(slide.productId)}>
                  Comprar Agora →
                </button>
              </div>
              <div className="slide-image">
                <img 
                  src={slide.product?.image} 
                  alt={slide.product?.name}
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/400x400/1a1a1a/e8ff00?text=' + slide.product?.emoji;
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="carousel-btn prev" onClick={() => goToSlide(currentIndex - 1)} aria-label="Slide anterior">
        ❮
      </button>
      <button className="carousel-btn next" onClick={() => goToSlide(currentIndex + 1)} aria-label="Próximo slide">
        ❯
      </button>

      <div className="carousel-dots">
        {slides.map((_, idx) => (
          <button
            key={idx}
            className={`dot ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(idx)}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;