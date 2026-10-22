import React, { useState } from 'react';
import { X, Heart, ShoppingBag, ShieldCheck, Box, Sparkles, Award, Scale, Check, ArrowRight } from 'lucide-react';
import type { Product } from '../types/index.ts';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, size?: string, engraving?: string) => void;
  onBuyNowUPI: (product: Product, size?: string, engraving?: string) => void;
  onOpen3D?: (modelType: 'ring' | 'pendant' | 'bangle') => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onBuyNowUPI,
  onOpen3D,
  isWishlisted = false,
  onToggleWishlist,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('Standard Size');
  const [engravingText, setEngravingText] = useState('');
  const [showEngraving, setShowEngraving] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  if (!isOpen || !product) return null;

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const sizeOptions = product.category === 'rings'
    ? ['Size 10 (Indian)', 'Size 12 (Indian)', 'Size 14 (Indian)', 'Size 16 (Indian)', 'Size 18 (Indian)']
    : product.category === 'bridal' || product.name.toLowerCase().includes('bangle') || product.name.toLowerCase().includes('kada')
    ? ['Size 2.4 (Small)', 'Size 2.6 (Medium)', 'Size 2.8 (Large)']
    : ['Standard Fit (Adjustable)'];

  const handleAddToCart = () => {
    onAddToCart(product, selectedSize, engravingText);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
  };

  const handleBuyNow = () => {
    onBuyNowUPI(product, selectedSize, engravingText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#FDFBF7] rounded-3xl shadow-2xl border border-[#C69A39]/40 overflow-hidden my-auto max-h-[92vh] flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 border border-[#C69A39]/30 text-[#23140C] flex items-center justify-center hover:bg-[#F8F3EA] transition shadow-md cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Side: Images Gallery & 3D CTA */}
        <div className="w-full md:w-1/2 p-5 sm:p-6 flex flex-col justify-between bg-white border-b md:border-b-0 md:border-r border-[#C69A39]/20">
          <div>
            {/* Main Showcase Image */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#FDFBF7] border border-[#C69A39]/20 shadow-inner">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {product.has3DModel && onOpen3D && (
                <button
                  onClick={() => {
                    onClose();
                    onOpen3D(product.model3DType || 'pendant');
                  }}
                  className="absolute bottom-3 left-3 bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-[#170B05] text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 hover:brightness-110 transition cursor-pointer"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>Inspect in 3D Lounge</span>
                </button>
              )}

              {onToggleWishlist && (
                <button
                  onClick={() => onToggleWishlist(product.id)}
                  className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 border border-[#C69A39]/30 flex items-center justify-center text-[#23140C] hover:text-rose-600 transition shadow-xs cursor-pointer"
                >
                  <Heart
                    className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600 text-rose-600' : 'text-stone-600'}`}
                  />
                </button>
              )}
            </div>

            {/* Thumbnail Strip */}
            {product.images.length > 1 && (
              <div className="flex gap-2.5 mt-3 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-[#C69A39] shadow-md scale-105'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-stone-100 text-[11px] text-[#3D2214]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#C69A39] shrink-0" />
              <span>BIS 916 Hallmark with HUID</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#C69A39] shrink-0" />
              <span>100% Transit Insured</span>
            </div>
          </div>
        </div>

        {/* Right Side: Specifications, Sizing & Actions */}
        <div className="w-full md:w-1/2 p-5 sm:p-7 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-[#23140C] text-[#E7C979] text-xs font-semibold px-2.5 py-0.5 rounded-md border border-[#C69A39]/30">
                  {product.purity}
                </span>
                <span className="text-xs text-stone-500 font-mono">
                  SKU: {product.sku}
                </span>
              </div>

              <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#23140C] leading-snug">
                {product.name}
              </h2>

              <p className="text-xs text-stone-600 font-sans mt-2 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Pricing Section */}
            <div className="bg-[#F8F3EA] p-3.5 rounded-2xl border border-[#C69A39]/25 flex items-baseline justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-serif font-extrabold text-2xl text-[#9A7420]">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-stone-400 line-through">
                      ₹{product.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-stone-600 mt-0.5">
                  Inclusive of all taxes & free insured delivery
                </div>
              </div>

              {discountPercent > 0 && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-lg">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Weight & Certificate Breakdown Table */}
            <div className="border border-[#C69A39]/20 rounded-2xl overflow-hidden text-xs">
              <div className="bg-[#23140C] text-[#E7C979] px-3.5 py-1.5 font-semibold font-serif text-[11px] tracking-wider">
                Gold & Gemological Specifications
              </div>
              <div className="divide-y divide-stone-100 bg-white">
                <div className="px-3.5 py-2 flex justify-between">
                  <span className="text-stone-500">Gross Weight</span>
                  <span className="font-semibold text-[#23140C]">{product.grossWeightGrams} Grams</span>
                </div>
                <div className="px-3.5 py-2 flex justify-between">
                  <span className="text-stone-500">Net Gold Weight</span>
                  <span className="font-semibold text-[#23140C]">{product.netWeightGrams} Grams</span>
                </div>
                {product.stoneWeightCarats && (
                  <div className="px-3.5 py-2 flex justify-between">
                    <span className="text-stone-500">Diamond / Stone Weight</span>
                    <span className="font-semibold text-[#23140C]">{product.stoneWeightCarats} Carats</span>
                  </div>
                )}
                {product.specifications.certificate && (
                  <div className="px-3.5 py-2 flex justify-between">
                    <span className="text-stone-500">Certification</span>
                    <span className="font-semibold text-emerald-800">{product.specifications.certificate}</span>
                  </div>
                )}
                {product.specifications.makingCharge && (
                  <div className="px-3.5 py-2 flex justify-between">
                    <span className="text-stone-500">Making Charges</span>
                    <span className="font-semibold text-[#23140C]">{product.specifications.makingCharge}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Size / Variant Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#23140C] mb-1.5">
                Select Size / Fit:
              </label>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map(sz => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                      selectedSize === sz
                        ? 'border-[#C69A39] bg-[#23140C] text-[#E7C979] font-semibold'
                        : 'border-stone-300 bg-white text-stone-700 hover:border-[#C69A39]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Engraving Option */}
            <div>
              <button
                type="button"
                onClick={() => setShowEngraving(!showEngraving)}
                className="text-xs text-[#9A7420] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>+ Complimentary Laser Engraving (Initials / Date)</span>
              </button>
              {showEngraving && (
                <div className="mt-2">
                  <input
                    type="text"
                    maxLength={24}
                    value={engravingText}
                    onChange={e => setEngravingText(e.target.value)}
                    placeholder="e.g. A & V 2026 or Forever"
                    className="w-full bg-white border border-[#C69A39]/40 rounded-xl px-3 py-1.5 text-xs text-[#23140C] focus:outline-none focus:border-[#C69A39]"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    Precision engraved inside the band or clasp before dispatch.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 mt-4 border-t border-[#C69A39]/20 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleAddToCart}
              className={`flex-1 py-3 px-4 rounded-xl border border-[#C69A39] font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs ${
                addedAnimation
                  ? 'bg-emerald-800 text-white border-emerald-800'
                  : 'bg-white hover:bg-[#F8F3EA] text-[#23140C]'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Bag!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-[#C69A39]" />
                  <span>Add to Bag</span>
                </>
              )}
            </button>

            <button
              onClick={handleBuyNow}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#C69A39] to-[#AA7A1E] hover:brightness-105 text-[#170B05] font-serif font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
            >
              <span>Instant UPI Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
