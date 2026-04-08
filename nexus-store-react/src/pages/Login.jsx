import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login = ({ navigateTo }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (user) {
      navigateTo('home');
    }
  }, [user, navigateTo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        showToast(`❌ Erro ao fazer login: ${error.message}`, 4000);
      } else {
        showToast('✅ Login realizado com sucesso!');
      }
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        showToast(`❌ Erro ao cadastrar: ${error.message}`, 4000);
      } else {
        showToast('✅ Cadastro realizado! Faça login para continuar.', 5000);
        setIsLogin(true);
        setEmail('');
        setPassword('');
        setFullName('');
      }
    }
    setLoading(false);
  };

  return (
    <div className="page-login">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">NEXUS<span>.</span></div>
            <h2>{isLogin ? 'Bem-vindo de volta' : 'Criar conta'}</h2>
            <p>{isLogin ? 'Faça login para continuar' : 'Cadastre-se para começar a comprar'}</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="fullName">Nome completo</label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Digite seu nome completo"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="btn-primary login-btn" disabled={loading}>
              {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
            </button>
          </form>

          <div className="login-footer">
            <button 
              className="switch-auth-btn"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
            </button>
          </div>

          <div className="login-demo">
            <p>🔐 Conta de demonstração:</p>
            <p>Email: demo@nexus.com</p>
            <p>Senha: demo123456</p>
            <p style={{ fontSize: '0.7rem', marginTop: '0.5rem' }}>
              * Para testar, crie uma conta ou use a demonstração
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;