import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Heart,
  ShoppingBag,
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  Search,
  Plus,
  Minus,
  Maximize2,
  Box,
  Scale,
  Award,
} from 'lucide-react';
import type { Product, Category } from '../types/index.ts';
import { FullScreenImageViewer } from '../components/FullScreenImageViewer.tsx';

interface ProductDetailPageProps {
  productId: string;
  allProducts: Product[];
  categories: Category[];
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, size?: string, engraving?: string) => void;
  onBuyNowUPI: (product: Product, size?: string, engraving?: string) => void;
  onOpen3D?: (modelType: 'ring' | 'pendant' | 'bangle') => void;
  wishlistIds?: string[];
  onToggleWishlist?: (productId: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  allProducts,
  onBack,
  onAddToCart,
  onBuyNowUPI,
  onOpen3D,
  wishlistIds = [],
  onToggleWishlist,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Accordion state
  const [openAccordion, setOpenAccordion] = useState<'details' | 'shipping' | 'returns' | null>('details');

  const product = allProducts.find(p => p.id === productId || p.slug === productId) || allProducts[0];

  useEffect(() => {
    setActiveImageIndex(0);
    setQuantity(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [productId]);

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-serif font-bold text-[#260714]">Ornament Not Found</h2>
        <button
          onClick={onBack}
          className="mt-4 px-6 py-2.5 rounded-full bg-[#541228] text-white text-xs font-semibold"
        >
          Return to Jewellery Collection
        </button>
      </div>
    );
  }

  const isWishlisted = wishlistIds.includes(product.id);
  const originalPrice = product.originalPrice || Math.round(product.price * 1.15);
  const discountPercent = Math.round(((originalPrice - product.price) / originalPrice) * 100);

  // 5 photography angle images matching screenshot
  const galleryImages = [
    product.images[0] || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80',
    product.images[1] || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=80',
    product.images[2] || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80',
    product.images[3] || 'https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=1000&q=80',
    product.images[4] || 'https://images.unsplash.com/photo-1611591475870-07e382d55653?auto=format&fit=crop&w=1000&q=80',
  ];

  const handleBuyNow = () => {
    onBuyNowUPI(product, 'Standard Size');
  };

  const handleAdd = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product, 'Standard Size');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#260714] pb-24 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-black text-white hover:bg-[#541228] transition flex items-center justify-center shadow-sm cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Product Details Main Section matching Top Right Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Vertical Thumbnails + Main Dark Showcase Image */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
            {/* 5 Vertical Thumbnails Strip */}
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto scrollbar-none shrink-0 py-1">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-black shrink-0 ${
                    activeImageIndex === idx
                      ? 'border-[#C69A39] shadow-md scale-102'
                      : 'border-stone-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main Image on Dark Velvet Background */}
            <div className="relative flex-1 aspect-4/5 rounded-3xl overflow-hidden bg-[#18050e] border border-amber-900/30 shadow-xl group">
              <img
                src={galleryImages[activeImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104 cursor-zoom-in"
                onClick={() => setViewerOpen(true)}
              />

              {/* Click to zoom badge bottom right */}
              <button
                onClick={() => setViewerOpen(true)}
                className="absolute bottom-4 right-4 bg-black/70 hover:bg-black text-white text-[11px] font-sans px-3 py-1.5 rounded-full backdrop-blur-xs flex items-center gap-1.5 transition border border-white/20 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-amber-400" />
                <span>Click to zoom</span>
              </button>

              {/* 3D Lounge CTA badge */}
              {product.has3DModel && onOpen3D && (
                <button
                  onClick={() => onOpen3D(product.model3DType || 'pendant')}
                  className="absolute bottom-4 left-4 bg-[#C69A39] text-[#1c0812] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md hover:brightness-110 transition cursor-pointer"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>3D Lounge</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Title, Rating, Price, Specs, Quantities & Buttons */}
          <div className="lg:col-span-5 space-y-5">
            {/* Title & Reviews */}
            <div>
              <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#260714] leading-tight">
                {product.name}
              </h1>

              {/* 5-Star Rating */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-amber-400">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <span className="text-xs font-bold text-stone-800">4.8</span>
                <span className="text-xs text-stone-500">(124 reviews)</span>
              </div>
            </div>

            {/* Price Row with Discount Pill */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="font-serif font-black text-2xl sm:text-3xl text-[#260714]">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              <span className="text-sm sm:text-base text-stone-400 line-through">
                ₹{originalPrice.toLocaleString('en-IN')}
              </span>
              <span className="bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                {discountPercent}% OFF
              </span>
            </div>

            {/* Description Paragraph */}
            <p className="text-xs sm:text-sm text-stone-600 font-sans leading-relaxed">
              {product.description ||
                'Traditional temple design with intricate workmanship. A perfect blend of heritage and elegance.'}
            </p>

            {/* 3 Specification Badges (Gold, Weight, Purity) */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {/* Gold Metal */}
              <div className="bg-white p-2.5 rounded-xl border border-stone-200 text-center shadow-xs">
                <span className="text-amber-500 text-base block mb-0.5">🪙</span>
                <span className="text-[10px] text-stone-400 block font-sans">Gold</span>
                <strong className="text-xs font-serif font-bold text-[#260714] block">
                  {product.purity.includes('22K') ? '22K (916)' : product.purity}
                </strong>
              </div>

              {/* Weight */}
              <div className="bg-white p-2.5 rounded-xl border border-stone-200 text-center shadow-xs">
                <span className="text-stone-500 text-base block mb-0.5">⚖️</span>
                <span className="text-[10px] text-stone-400 block font-sans">Weight</span>
                <strong className="text-xs font-serif font-bold text-[#260714] block">
                  {product.grossWeightGrams || 38.5} g
                </strong>
              </div>

              {/* Purity */}
              <div className="bg-white p-2.5 rounded-xl border border-stone-200 text-center shadow-xs">
                <span className="text-amber-600 text-base block mb-0.5">🛡️</span>
                <span className="text-[10px] text-stone-400 block font-sans">Purity</span>
                <strong className="text-xs font-serif font-bold text-[#260714] block">
                  916 BIS
                </strong>
              </div>
            </div>

            {/* Quantity Selector + Wishlist Heart */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden shadow-xs">
                <button
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="px-3.5 py-2 text-stone-600 hover:bg-stone-100 transition cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 py-2 font-mono font-bold text-xs text-[#260714] min-w-[36px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="px-3.5 py-2 text-stone-600 hover:bg-stone-100 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {onToggleWishlist && (
                <button
                  onClick={() => onToggleWishlist(product.id)}
                  className="p-2.5 rounded-xl border border-stone-300 bg-white hover:border-rose-400 text-stone-600 hover:text-rose-600 transition shadow-xs cursor-pointer"
                  title="Wishlist"
                >
                  <Heart
                    className={`w-5 h-5 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`}
                  />
                </button>
              )}
            </div>

            {/* Action Buttons: ⚡ Buy Now (Plum Solid) and 🛒 Add to Cart (Outlined) */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleBuyNow}
                className="w-full bg-[#541228] hover:bg-[#3d0b1c] text-white font-serif font-bold text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition active:scale-98 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Buy Now</span>
              </button>

              <button
                onClick={handleAdd}
                className="w-full bg-white hover:bg-stone-50 text-[#541228] border border-[#541228] font-serif font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition active:scale-98 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
            </div>

            {/* Free Shipping, Easy Returns, Certified Badges */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-stone-200 text-center text-[10px] text-stone-600">
              <div className="flex flex-col items-center">
                <Truck className="w-4 h-4 text-amber-700 mb-1" />
                <span className="font-semibold text-stone-800">Free Shipping</span>
                <span>Above ₹2,000</span>
              </div>
              <div className="flex flex-col items-center">
                <RotateCcw className="w-4 h-4 text-amber-700 mb-1" />
                <span className="font-semibold text-stone-800">7 Days</span>
                <span>Easy Returns</span>
              </div>
              <div className="flex flex-col items-center">
                <ShieldCheck className="w-4 h-4 text-amber-700 mb-1" />
                <span className="font-semibold text-stone-800">Certified</span>
                <span>Jewellery</span>
              </div>
            </div>

            {/* Collapsible Accordions: Product Details, Shipping & Delivery, Return Policy */}
            <div className="border-t border-stone-200 divide-y divide-stone-200 pt-2 text-xs">
              {/* 1. Product Details */}
              <div className="py-3">
                <button
                  onClick={() => setOpenAccordion(openAccordion === 'details' ? null : 'details')}
                  className="w-full flex items-center justify-between font-serif font-bold text-stone-800 cursor-pointer"
                >
                  <span>Product Details</span>
                  <span className="text-base">{openAccordion === 'details' ? '−' : '+'}</span>
                </button>
                {openAccordion === 'details' && (
                  <div className="mt-2 text-stone-600 space-y-1.5 font-sans leading-relaxed">
                    <p>• <strong>BIS Hallmark:</strong> 916 pure yellow gold stamped with certified HUID identifier.</p>
                    <p>• <strong>Dimensions & Fit:</strong> Standard royal Indian fit with adjustable gold dori/chain.</p>
                    <p>• <strong>Craftsmanship:</strong> Temple nakshi work handcrafted by master artisans in South India.</p>
                  </div>
                )}
              </div>

              {/* 2. Shipping & Delivery */}
              <div className="py-3">
                <button
                  onClick={() => setOpenAccordion(openAccordion === 'shipping' ? null : 'shipping')}
                  className="w-full flex items-center justify-between font-serif font-bold text-stone-800 cursor-pointer"
                >
                  <span>Shipping & Delivery</span>
                  <span className="text-base">{openAccordion === 'shipping' ? '−' : '+'}</span>
                </button>
                {openAccordion === 'shipping' && (
                  <div className="mt-2 text-stone-600 font-sans leading-relaxed">
                    All jewellery orders are dispatched in tamper-proof insured steel vault boxes via BlueDart Apex Air Express. Delivery within 3–5 business days with OTP verification at handover.
                  </div>
                )}
              </div>

              {/* 3. Return Policy */}
              <div className="py-3">
                <button
                  onClick={() => setOpenAccordion(openAccordion === 'returns' ? null : 'returns')}
                  className="w-full flex items-center justify-between font-serif font-bold text-stone-800 cursor-pointer"
                >
                  <span>Return Policy</span>
                  <span className="text-base">{openAccordion === 'returns' ? '−' : '+'}</span>
                </button>
                {openAccordion === 'returns' && (
                  <div className="mt-2 text-stone-600 font-sans leading-relaxed">
                    Enjoy our hassle-free 7-day exchange and 100% lifetime buyback guarantee based on prevailing gold bullion rates.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Gallery Viewer */}
      <FullScreenImageViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        images={galleryImages}
        initialIndex={activeImageIndex}
        productName={product.name}
      />
    </div>
  );
};
