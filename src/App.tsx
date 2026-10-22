import React, { useState, useEffect } from 'react';
import type {
  Product,
  CartItem,
  BrandSettings,
  ContactSettings,
  PricingSettings,
  HomepageSettings,
  UPISettings,
  StoreGeneralSettings,
  Category,
  Review,
  Order,
} from './types/index.ts';
import { api, StoreSettingsResponse } from './services/api.ts';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { Jewellery3DViewer } from './components/Jewellery3DViewer.tsx';
import { AIAssistantModal } from './components/AIAssistantModal.tsx';
import { TrackOrderModal } from './components/TrackOrderModal.tsx';
import { SearchModal } from './components/SearchModal.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { InvoicePrintable } from './components/InvoicePrintable.tsx';
import { PolicyModal } from './components/PolicyModal.tsx';
import { WhatsAppFloatingButton } from './components/WhatsAppFloatingButton.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ShopPage } from './pages/ShopPage.tsx';
import { CategoryPage } from './pages/CategoryPage.tsx';
import { ProductDetailPage } from './pages/ProductDetailPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { OwnerPortal } from './pages/OwnerPortal.tsx';

export default function App() {
  // Page Routing State
  type PageType = 'home' | 'shop' | 'category' | 'product' | 'checkout' | 'owner';

  const parseHash = (): { page: PageType; categorySlug?: string; productId?: string } => {
    const hash = window.location.hash;
    if (hash === '#owner' || hash === '#owner-portal') {
      return { page: 'owner' };
    }
    if (hash === '#checkout') {
      return { page: 'checkout' };
    }
    if (hash === '#shop') {
      return { page: 'shop' };
    }
    if (hash.startsWith('#/category/')) {
      const slug = hash.replace('#/category/', '').trim();
      return { page: 'category', categorySlug: slug || 'all' };
    }
    if (hash.startsWith('#/product/')) {
      const id = hash.replace('#/product/', '').trim();
      return { page: 'product', productId: id };
    }
    return { page: 'home' };
  };

  const initialRoute = parseHash();
  const [currentPage, setCurrentPage] = useState<PageType>(initialRoute.page);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>(initialRoute.categorySlug || 'gold');
  const [activeProductId, setActiveProductId] = useState<string>(initialRoute.productId || '');
  const [shopCategory, setShopCategory] = useState<string>('all');

  // Application Data State
  const [settings, setSettings] = useState<StoreSettingsResponse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cart & Wishlist State with LocalStorage Persistence
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('mpr_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mpr_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);

  // Modals State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [is3DViewerOpen, setIs3DViewerOpen] = useState(false);
  const [selected3DModelType, setSelected3DModelType] = useState<'ring' | 'pendant' | 'bangle'>('ring');
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);
  const [printableOrder, setPrintableOrder] = useState<Order | null>(null);
  const [policyModalType, setPolicyModalType] = useState<'shipping' | 'returns' | 'privacy' | 'terms' | null>(null);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem('mpr_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  // Persist wishlist
  useEffect(() => {
    try {
      localStorage.setItem('mpr_wishlist', JSON.stringify(wishlistIds));
    } catch (e) {
      console.error(e);
    }
  }, [wishlistIds]);

  // Sync hash routing on hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const route = parseHash();
      setCurrentPage(route.page);
      if (route.categorySlug) setActiveCategorySlug(route.categorySlug);
      if (route.productId) setActiveProductId(route.productId);
      if (window.location.hash === '#3d') setIs3DViewerOpen(true);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Load Initial Store Data
  const loadStoreData = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, productsRes, reviewsRes] = await Promise.all([
        api.getSettings(),
        api.getProducts(),
        api.getReviews(),
      ]);
      setSettings(settingsRes);
      setProducts(productsRes);
      setReviews(reviewsRes);
    } catch (err) {
      console.error('Failed to load store data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStoreData();
  }, []);

  // Cart Operations
  const handleAddToCart = (product: Product, selectedSize?: string, customEngraving?: string) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.productId === product.id && item.selectedSize === selectedSize);
      if (existingIndex > -1) {
        const copy = [...prev];
        copy[existingIndex].quantity += 1;
        return copy;
      }
      return [
        ...prev,
        {
          productId: product.id,
          product,
          quantity: 1,
          selectedSize: selectedSize || 'Standard Size',
          customEngraving,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item => (item.productId === productId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlistIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  // Instant UPI Buy Now
  const handleBuyNowUPI = (product: Product, selectedSize?: string, customEngraving?: string) => {
    handleAddToCart(product, selectedSize, customEngraving);
    setQuickProduct(null);
    window.location.hash = '#checkout';
    setCurrentPage('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 3D Lounge Launch
  const handleOpen3D = (modelType?: 'ring' | 'pendant' | 'bangle') => {
    setSelected3DModelType(modelType || 'ring');
    setIs3DViewerOpen(true);
  };

  // Navigation Helpers
  const handleNavigate = (page: string, category?: string) => {
    if (page === 'owner') {
      window.location.hash = '#owner';
      setCurrentPage('owner');
    } else if (page === 'shop') {
      if (category && category !== 'all') {
        window.location.hash = `#/category/${category}`;
        setActiveCategorySlug(category);
        setCurrentPage('category');
      } else {
        setShopCategory('all');
        setCurrentPage('shop');
        window.location.hash = '#shop';
      }
    } else if (page === 'category' && category) {
      window.location.hash = `#/category/${category}`;
      setActiveCategorySlug(category);
      setCurrentPage('category');
    } else {
      setCurrentPage('home');
      window.location.hash = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToCategory = (slug: string) => {
    window.location.hash = `#/category/${slug}`;
    setActiveCategorySlug(slug);
    setCurrentPage('category');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    window.location.hash = `#/product/${product.id}`;
    setActiveProductId(product.id);
    setCurrentPage('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-[#23140C] text-[#FDFBF7] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D23] flex items-center justify-center text-[#170B05] shadow-2xl animate-pulse">
          <span className="font-cinzel font-black text-2xl">MPR</span>
        </div>
        <div className="text-center space-y-1">
          <h2 className="font-cinzel font-bold text-xl text-[#FDFBF7] tracking-wider">
            MPR JEWELLERY
          </h2>
          <p className="text-xs text-[#E7C979] tracking-widest uppercase font-mono">
            Loading Heritage Vault & Live Bullion Ledger...
          </p>
        </div>
      </div>
    );
  }

  // ==============================================================
  // RENDER: OWNER PORTAL ROUTE
  // ==============================================================
  if (currentPage === 'owner') {
    return (
      <OwnerPortal
        onBackToStore={() => handleNavigate('home')}
        onPrintInvoice={order => setPrintableOrder(order)}
      />
    );
  }

  // ==============================================================
  // RENDER: CUSTOMER STOREFRONT
  // ==============================================================
  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#23140C] selection:bg-[#C69A39] selection:text-white">
      {/* Global Luxury Header */}
      <Header
        brand={settings.brand}
        homepage={settings.homepage}
        pricing={settings.pricing}
        cartCount={cartItems.reduce((s, i) => s + i.quantity, 0)}
        wishlistCount={wishlistIds.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onOpen3D={() => handleOpen3D('ring')}
        onOpenAI={() => setIsAIOpen(true)}
        onNavigate={handleNavigate}
        currentPage={currentPage}
      />

      {/* Main Page Routing */}
      <main className="flex-1">
        {/* 1. Home Page */}
        {currentPage === 'home' && (
          <HomePage
            homepage={settings.homepage}
            pricing={settings.pricing}
            brand={settings.brand}
            categories={settings.categories}
            products={products}
            reviews={reviews}
            onSelectProduct={handleSelectProduct}
            onAddToCart={prod => handleAddToCart(prod)}
            onOpen3D={handleOpen3D}
            onOpenAI={() => setIsAIOpen(true)}
            onNavigateToCategory={handleNavigateToCategory}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {/* 2. Full-Page Dedicated Category Page */}
        {currentPage === 'category' && (
          <CategoryPage
            categorySlug={activeCategorySlug}
            categories={settings.categories}
            products={products}
            onSelectProduct={handleSelectProduct}
            onAddToCart={prod => handleAddToCart(prod)}
            onBuyNow={(prod, size) => handleBuyNowUPI(prod, size)}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateCategory={handleNavigateToCategory}
            onOpen3D={handleOpen3D}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {/* 3. Full-Page Dedicated Product Detail Page */}
        {currentPage === 'product' && (
          <ProductDetailPage
            productId={activeProductId}
            allProducts={products}
            categories={settings.categories}
            onBack={() => {
              if (activeCategorySlug) {
                handleNavigateToCategory(activeCategorySlug);
              } else {
                handleNavigate('home');
              }
            }}
            onSelectProduct={handleSelectProduct}
            onAddToCart={(prod, size, engraving) => handleAddToCart(prod, size, engraving)}
            onBuyNowUPI={(prod, size, engraving) => handleBuyNowUPI(prod, size, engraving)}
            onOpen3D={handleOpen3D}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {/* 4. Traditional Shop Page */}
        {currentPage === 'shop' && (
          <ShopPage
            products={products}
            categories={settings.categories}
            initialCategory={shopCategory}
            onSelectProduct={handleSelectProduct}
            onAddToCart={prod => handleAddToCart(prod)}
            onOpen3D={handleOpen3D}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {/* 5. Checkout & UPI Payment Page */}
        {currentPage === 'checkout' && (
          <CheckoutPage
            items={cartItems}
            appliedCoupon={appliedCoupon}
            pricing={settings.pricing}
            upiSettings={settings.upi}
            onOrderCompleted={order => {
              setCartItems([]);
              setAppliedCoupon(null);
            }}
            onBackToShop={() => handleNavigate('shop')}
            onPrintInvoice={order => setPrintableOrder(order)}
            whatsappNumber={settings.contact.whatsapp}
          />
        )}
      </main>

      {/* Global Footer */}
      <Footer
        brand={settings.brand}
        contact={settings.contact}
        general={settings.general}
        onNavigate={handleNavigate}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onOpenPolicyModal={policy => setPolicyModalType(policy)}
      />

      {/* Floating Showroom WhatsApp Button */}
      <WhatsAppFloatingButton
        phoneNumber={settings.contact.whatsapp}
        defaultMessage="Namaste MPR Jewellers, I am browsing your online jewellery collections and would like assistance."
      />

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          window.location.hash = '#checkout';
          setCurrentPage('checkout');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={c => setAppliedCoupon(c)}
        freeShippingThreshold={settings.pricing.freeDeliveryThreshold}
        deliveryCharge={settings.pricing.deliveryCharge}
      />

      {/* 3D Interactive Jewellery Lounge Modal */}
      {is3DViewerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-5xl">
            <Jewellery3DViewer
              initialModel={selected3DModelType}
              onClose={() => setIs3DViewerOpen(false)}
              onSelectProduct={title => {
                setIs3DViewerOpen(false);
                handleNavigate('shop');
              }}
            />
          </div>
        </div>
      )}

      {/* AI Ratna Consultant Modal */}
      <AIAssistantModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        onNavigateToShop={cat => handleNavigate('shop', cat)}
      />

      {/* Order Tracking Modal */}
      <TrackOrderModal
        isOpen={isTrackOrderOpen}
        onClose={() => setIsTrackOrderOpen(false)}
        whatsappNumber={settings.contact.whatsapp}
      />

      {/* Search Catalogue Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        onSelectProduct={prod => {
          setIsSearchOpen(false);
          handleSelectProduct(prod);
        }}
        onNavigateToCategory={cat => {
          setIsSearchOpen(false);
          handleNavigateToCategory(cat);
        }}
      />

      {/* Optional Quick Detail Modal */}
      <ProductDetailModal
        product={quickProduct}
        isOpen={!!quickProduct}
        onClose={() => setQuickProduct(null)}
        onAddToCart={(prod, size, engraving) => handleAddToCart(prod, size, engraving)}
        onBuyNowUPI={(prod, size, engraving) => handleBuyNowUPI(prod, size, engraving)}
        onOpen3D={handleOpen3D}
        isWishlisted={quickProduct ? wishlistIds.includes(quickProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* Printable GST Compliant Invoice */}
      <InvoicePrintable
        isOpen={!!printableOrder}
        order={printableOrder}
        brand={settings.brand}
        contact={settings.contact}
        pricing={settings.pricing}
        onClose={() => setPrintableOrder(null)}
      />

      {/* Store Policies Modal */}
      {policyModalType && (
        <PolicyModal
          isOpen={!!policyModalType}
          policyType={policyModalType}
          onClose={() => setPolicyModalType(null)}
          general={settings.general}
        />
      )}
    </div>
  );
}
