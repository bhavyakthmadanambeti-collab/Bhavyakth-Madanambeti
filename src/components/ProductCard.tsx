import React from 'react';
import { Heart, ShoppingBag, Zap, Box } from 'lucide-react';
import type { Product } from '../types/index.ts';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
  onOpen3D?: (modelType: 'ring' | 'pendant' | 'bangle') => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onAddToCart,
  onBuyNow,
  onOpen3D,
  isWishlisted = false,
  onToggleWishlist,
}) => {
  return (
    <div
      onClick={() => onQuickView(product)}
      className="group relative bg-white rounded-2xl overflow-hidden border border-stone-200/90 hover:border-amber-400/80 transition-all duration-300 hover:shadow-lg flex flex-col cursor-pointer"
    >
      {/* Product Image Area */}
      <div className="relative aspect-4/3 w-full bg-[#FAF8F5] overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Wishlist Heart Icon Top Right */}
        {onToggleWishlist && (
          <button
            onClick={e => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs border border-stone-200 flex items-center justify-center text-stone-600 hover:text-rose-600 transition shadow-xs cursor-pointer z-10"
            title="Save to Wishlist"
          >
            <Heart
              className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600 text-rose-600' : 'text-stone-500'}`}
            />
          </button>
        )}

        {/* 3D Model Badge if available */}
        {product.has3DModel && (
          <span className="absolute bottom-2 left-2 bg-[#260714]/80 backdrop-blur-xs text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-500/30">
            <Box className="w-2.5 h-2.5 text-amber-400" />
            <span>3D</span>
          </span>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
        <div>
          <h3 className="font-serif font-bold text-sm sm:text-base text-[#260714] line-clamp-1 leading-snug">
            {product.name}
          </h3>

          <div className="mt-1">
            <span className="font-serif font-extrabold text-base sm:text-lg text-[#260714]">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Action Buttons: ⚡ Buy Now and 🛒 Add to Cart */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={e => {
              e.stopPropagation();
              if (onBuyNow) {
                onBuyNow(product);
              } else {
                onAddToCart(product);
              }
            }}
            className="w-full bg-[#541228] hover:bg-[#3d0b1c] text-white text-xs font-semibold py-2 px-2 rounded-xl flex items-center justify-center gap-1 transition shadow-xs cursor-pointer active:scale-98"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Buy Now</span>
          </button>

          <button
            onClick={e => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="w-full bg-white hover:bg-stone-50 text-[#541228] border border-[#541228] text-xs font-semibold py-2 px-2 rounded-xl flex items-center justify-center gap-1 transition shadow-xs cursor-pointer active:scale-98"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="truncate">Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
};
