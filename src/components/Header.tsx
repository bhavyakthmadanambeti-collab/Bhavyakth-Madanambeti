import React, { useState } from 'react';
import {
  Search,
  ShoppingBag,
  Heart,
  Truck,
  User,
  Crown,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import type { BrandSettings, HomepageSettings, PricingSettings } from '../types/index.ts';

interface HeaderProps {
  brand?: BrandSettings;
  homepage?: HomepageSettings;
  pricing?: PricingSettings;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenSearch: () => void;
  onOpenTrackOrder: () => void;
  onOpen3D: () => void;
  onOpenAI: () => void;
  onNavigate: (page: string, category?: string) => void;
  currentPage: string;
}

export const Header: React.FC<HeaderProps> = ({
  brand,
  pricing,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenSearch,
  onNavigate,
  currentPage,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const brandName = brand?.brandName || 'MPR JEWELLERY';

  const navLinks = [
    { label: 'Home', page: 'home' },
    { label: 'Gold', page: 'category', category: 'gold' },
    { label: 'Silver', page: 'category', category: 'silver' },
    { label: 'Diamond', page: 'category', category: 'diamond' },
    { label: 'Collections', page: 'category', category: 'all' },
    { label: 'About Us', page: 'home', hash: 'about' },
    { label: 'Contact', page: 'home', hash: 'contact' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('shop');
    }
  };

  const goldRateText = pricing?.goldRate22KPerGram
    ? `₹${Math.round(pricing.goldRate22KPerGram * 10 / 11.5).toLocaleString('en-IN')} / 10g`
    : '₹6,250 / 10g';
  const silverRateText = pricing?.silverRatePerGram
    ? `₹${pricing.silverRatePerGram} / 1g`
    : '₹78 / 1g';
  const diamondRateText = pricing?.diamondRatePerCaratBaseline
    ? `₹${(pricing.diamondRatePerCaratBaseline).toLocaleString('en-IN')} / ct`
    : '₹56,000 / ct';

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-xs">
      {/* Top Deep Wine / Plum Announcement Bar */}
      <div className="bg-[#260714] text-white text-[11px] sm:text-xs py-2 px-3 sm:px-6 border-b border-amber-900/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          {/* Left Rates Ticker */}
          <div className="flex items-center gap-3 sm:gap-5 whitespace-nowrap text-stone-200">
            {/* Gold */}
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400 text-sm">🪙</span>
              <span>Gold Rate</span>
              <strong className="text-amber-300 font-semibold">{goldRateText}</strong>
            </div>

            <span className="text-white/20 hidden sm:inline">|</span>

            {/* Silver */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-300 text-sm">🥈</span>
              <span>Silver Rate</span>
              <strong className="text-slate-100 font-semibold">{silverRateText}</strong>
            </div>

            <span className="text-white/20 hidden md:inline">|</span>

            {/* Diamond */}
            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-cyan-300 text-sm">💎</span>
              <span>Diamond Rate</span>
              <strong className="text-cyan-200 font-semibold">{diamondRateText}</strong>
            </div>
          </div>

          {/* Right Action Icons & Perks */}
          <div className="flex items-center gap-3 sm:gap-5 whitespace-nowrap text-stone-200 shrink-0">
            <div className="hidden lg:flex items-center gap-1.5 text-stone-300">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>Free Shipping Above ₹2,000</span>
            </div>

            <span className="text-white/20 hidden lg:inline">|</span>

            {/* Owner / Account Login */}
            <button
              onClick={() => onNavigate('owner')}
              className="flex items-center gap-1.5 hover:text-amber-300 transition cursor-pointer"
              title="Owner & Customer Login"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Login / Sign Up</span>
            </button>

            {/* Wishlist */}
            <button
              onClick={() => onNavigate('shop')}
              className="relative p-1 hover:text-rose-400 transition cursor-pointer"
              title="Wishlist"
            >
              <Heart className="w-4 h-4" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-rose-600 text-white font-mono text-[9px] font-bold flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Shopping Cart with Badge */}
            <button
              onClick={onOpenCart}
              className="relative p-1 hover:text-amber-300 transition cursor-pointer flex items-center"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-black font-mono text-[9px] font-extrabold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main White Luxury Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-1.5 text-[#260714] hover:text-amber-700 transition cursor-pointer"
          aria-label="Toggle navigation"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Brand Logo & Monogram */}
        <div
          onClick={() => onNavigate('home')}
          className="flex flex-col items-center sm:items-start cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-[#C69A39] fill-[#C69A39]/20 group-hover:scale-105 transition-transform" />
            <div className="flex flex-col items-center sm:items-start">
              <span className="font-serif font-black text-xl sm:text-2xl tracking-[0.2em] text-[#260714] leading-none group-hover:text-amber-800 transition">
                {brandName}
              </span>
              <span className="text-[8px] sm:text-[9px] tracking-[0.22em] text-[#8C6D23] uppercase font-sans font-medium mt-1">
                Timeless Elegance • Forever Yours
              </span>
            </div>
          </div>
        </div>

        {/* Center Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          {navLinks.map((link, idx) => {
            const isActive =
              (link.page === 'home' && currentPage === 'home' && !link.category) ||
              (link.page === 'category' && currentPage === 'category');

            return (
              <button
                key={idx}
                onClick={() => {
                  if (link.category) {
                    onNavigate('category', link.category);
                  } else {
                    onNavigate(link.page);
                  }
                }}
                className={`text-xs font-serif font-medium tracking-wide transition cursor-pointer relative py-1 ${
                  link.label === 'Home'
                    ? 'text-[#C69A39] font-bold after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#C69A39]'
                    : 'text-[#260714] hover:text-[#C69A39]'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right Search Bar */}
        <div className="relative w-44 sm:w-60 md:w-64">
          <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search jewellery..."
              className="w-full pl-3 pr-8 py-1.5 bg-[#FAF8F5] border border-stone-200 rounded-full text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="submit"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-amber-700"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-stone-200 p-4 space-y-3 animate-fadeIn">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (link.category) {
                    onNavigate('category', link.category);
                  } else {
                    onNavigate(link.page);
                  }
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-xs font-serif font-semibold tracking-wider p-2 rounded-xl bg-stone-50 text-[#260714] hover:bg-amber-50"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
