import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AuthModal } from './components/auth/AuthModal';
import { SplashScreen } from './components/auth/SplashScreen';
import { WelcomeScreen } from './components/auth/WelcomeScreen';
import { LoginScreen } from './components/auth/LoginScreen';
import { InitialAdminSetup } from './components/auth/InitialAdminSetup';
import { ShopDetailModal } from './components/shops/ShopDetailModal';
import { CartDrawer, CartItem } from './components/cart/CartDrawer';
import { Shop, Product } from './types';

function AppContent() {
  const { activeRole, userProfile, hasAdmin } = useAuth();

  // Splash & Welcome Screen States
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [showWelcome, setShowWelcome] = useState<boolean>(false);

  // App Navigation & Modals
  const [activeTab, setActiveTab] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'register' | 'phone' | 'forgot'>('login');

  // Cart & Shop Drawers
  const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  // Cart Items State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const handleOpenAuth = (mode: 'login' | 'register' | 'phone' | 'forgot' = 'login') => {
    setAuthModalInitialMode(mode);
    setAuthModalOpen(true);
  };

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setCartDrawerOpen(true);
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // 1. Render Splash Screen on Initial Load
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // 2. Initial Admin Gate: If system has no admin (e.g. after Factory Reset), require setup
  if (hasAdmin === false) {
    return <InitialAdminSetup />;
  }

  // 3. Mandatory Authentication Gate: If not logged in, render LoginScreen
  if (!userProfile) {
    return <LoginScreen />;
  }

  // 3. Authenticated App Layout & Role Routing
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white" dir="rtl">
      {/* Header */}
      <Header
        onOpenAuth={() => handleOpenAuth('login')}
        onOpenCart={() => setCartDrawerOpen(true)}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={showWelcome ? 'welcome' : activeTab}
        setActiveTab={(tab) => {
          if (tab === 'welcome') {
            setShowWelcome(true);
          } else {
            setShowWelcome(false);
            setActiveTab(tab);
          }
        }}
      />

      {/* Main Body - Based on User Role */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showWelcome ? (
          <WelcomeScreen
            onLoginClick={() => {
              setShowWelcome(false);
              handleOpenAuth('login');
            }}
            onRegisterClick={() => {
              setShowWelcome(false);
              handleOpenAuth('register');
            }}
          />
        ) : activeRole === 'owner' ? (
          <OwnerDashboard onPreviewStore={(shop) => setSelectedShop(shop)} />
        ) : activeRole === 'admin' ? (
          <AdminDashboard onSelectShop={(shop) => setSelectedShop(shop)} />
        ) : (
          <CustomerDashboard
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onSelectShop={(shop) => setSelectedShop(shop)}
            onAddToCart={handleAddToCart}
            searchQuery={searchQuery}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Auth Modal (Switching/Managing Auth in session) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalInitialMode}
      />

      {/* Shop Detail Modal */}
      <ShopDetailModal
        shop={selectedShop}
        onClose={() => setSelectedShop(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        cartItems={cartItems}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
