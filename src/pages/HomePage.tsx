import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  RotateCcw,
  Headphones,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type {
  Product,
  Category,
  HomepageSettings,
  PricingSettings,
  Review,
  BrandSettings,
} from '../types/index.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { LiveRatesTicker } from '../components/LiveRatesTicker.tsx';
import { CircularCategoryRow } from '../components/CircularCategoryRow.tsx';

interface HomePageProps {
  homepage: HomepageSettings;
  pricing: PricingSettings;
  brand: BrandSettings;
  categories: Category[];
  products: Product[];
  reviews: Review[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
  onOpen3D: (modelType?: 'ring' | 'pendant' | 'bangle') => void;
  onOpenAI: () => void;
  onNavigateToCategory: (category: string) => void;
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  homepage,
  pricing,
  categories,
  products,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  onNavigateToCategory,
  wishlistIds,
  onToggleWishlist,
}) => {
  const [activeSlide, setActiveSlide] = useState(0);

  // Hero carousel slides
  const heroSlides = [
    {
      smallBadge: 'WELCOME TO MPR JEWELLERY',
      titleLine1: 'Crafted with Love',
      titleLine2: 'Shine for a Lifetime',
      subtitle: 'Premium Gold • Silver • Diamond Jewellery',
      buttonText: 'Shop Now →',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&q=80',
    },
    {
      smallBadge: 'ROYAL BRIDAL COLLECTION',
      titleLine1: 'Heritage 22K BIS Hallmarked',
      titleLine2: 'Adorned for Generations',
      subtitle: 'Handcrafted Antique Chokers & Nakshi Bangles',
      buttonText: 'Explore Bridal →',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1600&q=80',
    },
  ];

  const currentSlide = heroSlides[activeSlide % heroSlides.length];

  // Best Sellers: 4 featured products from screenshot (Temple Necklace, Diamond Ring, Gold Bangles, Silver Earrings)
  const bestSellers = products.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#23140C] font-sans">
      {/* 1. Hero Carousel Banner matching screenshot */}
      <section className="relative overflow-hidden bg-[#1a050d] text-white">
        {/* Background Image with candlelight/rose ambiance */}
        <div className="relative min-h-[440px] sm:min-h-[500px] lg:min-h-[560px] flex items-center">
          <img
            src={currentSlide.image}
            alt="MPR Royal Jewellery"
            className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-700"
          />
          {/* Dark luxury radial gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25" />

          {/* Carousel Left & Right Arrow Buttons */}
          <button
            onClick={() => setActiveSlide(prev => (prev === 0 ? heroSlides.length - 1 : prev - 1))}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center backdrop-blur-xs transition z-20 cursor-pointer"
            title="Previous Banner"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveSlide(prev => (prev + 1) % heroSlides.length)}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center backdrop-blur-xs transition z-20 cursor-pointer"
            title="Next Banner"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Hero Content on Left */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 w-full py-16">
            <div className="max-w-xl space-y-4 text-left">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-[#E8C77B] block font-sans">
                {currentSlide.smallBadge}
              </span>

              <h1 className="font-serif font-medium text-3xl sm:text-5xl lg:text-6xl text-white leading-tight tracking-tight">
                {currentSlide.titleLine1} <br />
                <span className="font-serif font-bold text-[#FFF5E6]">{currentSlide.titleLine2}</span>
              </h1>

              <p className="text-xs sm:text-sm text-stone-200 font-sans tracking-wide">
                {currentSlide.subtitle}
              </p>

              <div className="pt-2">
                <button
                  onClick={() => onNavigateToCategory('all')}
                  className="bg-[#E8C77B] hover:bg-[#d8b565] text-[#1c0812] font-serif font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-lg transition-transform hover:scale-105 cursor-pointer inline-flex items-center gap-2"
                >
                  <span>{currentSlide.buttonText}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Carousel Indicator Dots at bottom center */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  i === activeSlide ? 'w-5 bg-white' : 'w-2 bg-white/40'
                }`}
                title={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. Live Rates Ticker (White segmented card bar) */}
      <LiveRatesTicker initialRates={pricing} />

      {/* 3. Circular Category Icons Row */}
      <CircularCategoryRow
        categories={categories}
        onSelectCategory={onNavigateToCategory}
      />

      {/* 4. Featured Collection — "Our Best Sellers" Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8 pb-2">
          {/* Decorative Centered Header */}
          <div className="flex-1 flex flex-col items-center">
            <div className="flex items-center gap-3">
              <span className="w-12 sm:w-16 h-px bg-[#C69A39]/60" />
              <span className="text-[10px] sm:text-xs uppercase font-sans font-bold tracking-[0.2em] text-[#C69A39]">
                FEATURED COLLECTION
              </span>
              <span className="w-12 sm:w-16 h-px bg-[#C69A39]/60" />
            </div>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#260714] mt-1 tracking-tight">
              Our Best Sellers
            </h2>
          </div>

          {/* View All Button on Right */}
          <button
            onClick={() => onNavigateToCategory('all')}
            className="bg-[#541228] hover:bg-[#3d0b1c] text-white text-xs font-semibold px-4 py-2 rounded-full transition shadow-xs cursor-pointer inline-flex items-center gap-1.5 shrink-0"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4-Item Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {bestSellers.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={onSelectProduct}
              onAddToCart={onAddToCart}
              onBuyNow={onBuyNow}
              isWishlisted={wishlistIds.includes(product.id)}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      </section>

      {/* 5. Full-Width Middle Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 my-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#200511] via-[#33081b] to-[#1a040e] border border-amber-900/30 text-white min-h-[220px] sm:min-h-[260px] flex items-center p-6 sm:p-12 shadow-md">
          {/* Left Model Image */}
          <div className="absolute left-0 inset-y-0 w-1/3 sm:w-1/4 overflow-hidden pointer-events-none opacity-85">
            <img
              src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80"
              alt="Model with gold jewellery"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#200511]/70 to-[#200511]" />
          </div>

          {/* Right Mandala Gold Vector background */}
          <div className="absolute right-0 inset-y-0 w-1/3 flex items-center justify-end pr-6 opacity-20 pointer-events-none text-[#C69A39]">
            <svg viewBox="0 0 200 200" className="w-64 h-64 fill-current">
              <path d="M100 0 C110 50 150 90 200 100 C150 110 110 150 100 200 C90 150 50 110 0 100 C50 90 90 50 100 0 Z" />
            </svg>
          </div>

          {/* Center Content */}
          <div className="relative z-10 max-w-xl mx-auto text-center space-y-3">
            <span className="text-[11px] uppercase tracking-widest text-[#E8C77B] font-medium font-sans">
              Traditional &nbsp;|&nbsp; Modern &nbsp;|&nbsp; Diamond
            </span>

            <h3 className="font-serif font-bold text-2xl sm:text-4xl text-white tracking-tight">
              For Every Special Moment
            </h3>

            <div className="pt-2">
              <button
                onClick={() => onNavigateToCategory('wedding')}
                className="bg-[#E8C77B] hover:bg-[#d8b565] text-[#1c0812] font-serif font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-md transition-transform hover:scale-105 cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Explore Collections</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Four-Item Trust & Guarantees Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {/* Trust 1: 100% Certified Jewellery */}
          <div className="flex items-center gap-3 p-3 sm:p-4 bg-white rounded-2xl border border-stone-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-xs sm:text-sm font-serif font-bold text-[#260714] block">
                100% Certified
              </strong>
              <span className="text-[11px] text-stone-500 font-sans">Jewellery</span>
            </div>
          </div>

          {/* Trust 2: Safe & Secure Shopping */}
          <div className="flex items-center gap-3 p-3 sm:p-4 bg-white rounded-2xl border border-stone-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-xs sm:text-sm font-serif font-bold text-[#260714] block">
                Safe & Secure
              </strong>
              <span className="text-[11px] text-stone-500 font-sans">Shopping</span>
            </div>
          </div>

          {/* Trust 3: Easy Returns (7 Days) */}
          <div className="flex items-center gap-3 p-3 sm:p-4 bg-white rounded-2xl border border-stone-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-xs sm:text-sm font-serif font-bold text-[#260714] block">
                Easy Returns
              </strong>
              <span className="text-[11px] text-stone-500 font-sans">(7 Days)</span>
            </div>
          </div>

          {/* Trust 4: Customer Support 24/7 */}
          <div className="flex items-center gap-3 p-3 sm:p-4 bg-white rounded-2xl border border-stone-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-xs sm:text-sm font-serif font-bold text-[#260714] block">
                Customer Support
              </strong>
              <span className="text-[11px] text-stone-500 font-sans">24/7</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
