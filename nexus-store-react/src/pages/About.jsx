import React from 'react';

const About = () => {
  return (
    <div className="page-about">
      <div className="about-wrapper">
        <div className="about-hero">
          <h1>Sobre a <span>NEXUS</span></h1>
          <p className="about-tagline">Eletrônicos do futuro, entregues hoje.</p>
        </div>

        <div className="about-grid">
          <div className="about-card">
            <div className="about-icon">🚀</div>
            <h3>Nossa Missão</h3>
            <p>Conectar pessoas à tecnologia de ponta com preço justo, atendimento excepcional e entregas rápidas para todo o Brasil.</p>
          </div>
          <div className="about-card">
            <div className="about-icon">🛡️</div>
            <h3>Garantia & Segurança</h3>
            <p>Todos os produtos possuem garantia mínima de 12 meses e são adquiridos diretamente dos fabricantes autorizados.</p>
          </div>
          <div className="about-card">
            <div className="about-icon">💡</div>
            <h3>Tecnologia de Verdade</h3>
            <p>Nosso time de especialistas testa e cura cada produto antes de ele entrar no catálogo. Só o melhor para você.</p>
          </div>
          <div className="about-card">
            <div className="about-icon">🌎</div>
            <h3>Sustentabilidade</h3>
            <p>Programas de descarte responsável e embalagens 100% recicláveis fazem parte do nosso compromisso com o planeta.</p>
          </div>
        </div>

        <div className="about-tech">
          <h2>Este site é um ambiente de testes</h2>
          <p>A <strong>NEXUS Store</strong> foi desenvolvida como plataforma de referência para testes de software. Abaixo, um resumo das funcionalidades implementadas:</p>
          <ul className="tech-list">
            <li><span className="tag">React</span> Componentes funcionais com Hooks (useState, useEffect, useContext).</li>
            <li><span className="tag">Context API</span> Gerenciamento de estado global para carrinho e notificações.</li>
            <li><span className="tag">localStorage</span> Carrinho persiste entre sessões do navegador.</li>
            <li><span className="tag">Carrossel automático</span> Avança a cada 4 segundos com pausa ao interagir.</li>
            <li><span className="tag">Filtros combinados</span> Busca + preço + categoria + ordenação funcionam juntos em tempo real.</li>
            <li><span className="tag">Paginação</span> 6 itens por página com navegação por número.</li>
            <li><span className="tag">Galeria de produto</span> Destaque visual ao selecionar miniatura.</li>
            <li><span className="tag">Toast de notificação</span> Alerta visual ao adicionar produto ao carrinho.</li>
            <li><span className="tag">Responsivo</span> Layout adaptado para mobile, tablet e desktop.</li>
            <li><span className="tag">Acessibilidade</span> ARIA labels e navegação por teclado nas interações principais.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default About;