import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import About from "./pages/About";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import Favorites from "./pages/Favorites";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import "./App.css";

// Componente de loading
function LoadingScreen() {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Carregando NEXUS Store...</p>
    </div>
  );
}

// Componente principal de rotas
function AppRoutes() {
  const [currentPage, setCurrentPage] = useState("login");
  const [currentProductId, setCurrentProductId] = useState(null);
  const [timeout, setTimeoutState] = useState(false);
  const { user, loading } = useAuth();
  const { showToast } = useToast();

  // Timeout de segurança - força saída do loading após 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.log("Timeout: Forçando saída do loading");
        setTimeoutState(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Redirecionar após login
  useEffect(() => {
    if (!loading || timeout) {
      if (user && currentPage === "login") {
        setCurrentPage("home");
        if (showToast) showToast("✅ Bem-vindo!");
      }
    }
  }, [user, loading, timeout]);

  const navigateTo = (page, productId = null) => {
    const protectedPages = ["profile", "cart", "orders", "favorites"];

    if (protectedPages.includes(page) && !user) {
      setCurrentPage("login");
      if (showToast) showToast("🔒 Faça login para acessar esta página", 3000);
      return;
    }

    setCurrentPage(page);
    if (productId) setCurrentProductId(productId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <Home navigateTo={navigateTo} />;
      case "products":
        return <Products navigateTo={navigateTo} />;
      case "detail":
        return (
          <ProductDetail productId={currentProductId} navigateTo={navigateTo} />
        );
      case "cart":
        return <Cart navigateTo={navigateTo} />;
      case "about":
        return <About />;
      case "login":
        return <Login navigateTo={navigateTo} />;
      case "profile":
        return <Profile navigateTo={navigateTo} />;
      case "orders":
        return <Orders navigateTo={navigateTo} />;
      case "favorites":
        return <Favorites navigateTo={navigateTo} />;
      default:
        return <Login navigateTo={navigateTo} />;
    }
  };

  // Mostrar loading apenas se estiver carregando E não passou do timeout
  if (loading && !timeout) {
    return <LoadingScreen />;
  }

  return (
    <>
      {currentPage !== "login" && (
        <Header navigateTo={navigateTo} currentPage={currentPage} />
      )}
      <main className="app-main">{renderPage()}</main>
      {currentPage !== "login" && <Footer navigateTo={navigateTo} />}
    </>
  );
}

// App principal
function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
