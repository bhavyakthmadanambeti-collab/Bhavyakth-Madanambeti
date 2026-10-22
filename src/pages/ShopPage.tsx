import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, RotateCcw, Box } from 'lucide-react';
import type { Product, Category } from '../types/index.ts';
import { ProductCard } from '../components/ProductCard.tsx';

interface ShopPageProps {
  products: Product[];
  categories: Category[];
  initialCategory?: string;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onOpen3D?: (modelType: 'ring' | 'pendant' | 'bangle') => void;
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  products,
  categories,
  initialCategory = 'all',
  onSelectProduct,
  onAddToCart,
  onOpen3D,
  wishlistIds,
  onToggleWishlist,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedMetal, setSelectedMetal] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'weight_desc'>('featured');
  const [priceRange, setPriceRange] = useState<number>(350000);
  const [only3D, setOnly3D] = useState(false);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => !p.isArchived)
      .filter(p => {
        if (selectedCategory !== 'all') {
          return p.category === selectedCategory || p.metal === selectedCategory;
        }
        return true;
      })
      .filter(p => {
        if (selectedMetal !== 'all') {
          return p.metal === selectedMetal;
        }
        return true;
      })
      .filter(p => p.price <= priceRange)
      .filter(p => (only3D ? p.has3DModel : true))
      .filter(p => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.purity.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.tags.some(t => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'weight_desc') return b.grossWeightGrams - a.grossWeightGrams;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [products, selectedCategory, selectedMetal, searchQuery, sortBy, priceRange, only3D]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedMetal('all');
    setSearchQuery('');
    setSortBy('featured');
    setPriceRange(350000);
    setOnly3D(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-10 px-4 sm:px-6 max-w-7xl mx-auto font-sans">
      {/* Title Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs uppercase font-serif font-bold text-[#9A7420] tracking-[0.2em] block mb-1">
          Complete Treasury
        </span>
        <h1 className="font-cinzel font-black text-3xl sm:text-4xl text-[#23140C]">
          Fine Jewellery Collection
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-2">
          Discover BIS 916 hallmarked 22K gold temple jewellery, certified natural solitaire diamonds, and sterling silver heirlooms.
        </p>
      </div>

      {/* Category Pills Bar */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-serif font-semibold whitespace-nowrap transition cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#23140C] text-[#E7C979] shadow-md'
              : 'bg-white border border-[#C69A39]/30 text-[#23140C] hover:bg-[#F8F3EA]'
          }`}
        >
          All Jewellery ({products.length})
        </button>

        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.slug)}
            className={`px-4 py-2 rounded-xl text-xs font-serif font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === cat.slug
                ? 'bg-[#23140C] text-[#E7C979] shadow-md'
                : 'bg-white border border-[#C69A39]/30 text-[#23140C] hover:bg-[#F8F3EA]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#C69A39]/25 shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search in Shop */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#C69A39] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, SKU, 22K, diamond..."
            className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl pl-9 pr-3 py-2 text-xs text-[#23140C] focus:outline-none focus:border-[#C69A39]"
          />
        </div>

        {/* Metal Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider hidden lg:inline">
            Metal:
          </span>
          {['all', 'gold', 'diamond', 'silver'].map(metal => (
            <button
              key={metal}
              onClick={() => setSelectedMetal(metal)}
              className={`px-3 py-1.5 rounded-lg text-xs capitalize font-medium transition cursor-pointer ${
                selectedMetal === metal
                  ? 'bg-[#C69A39] text-[#170B05] font-bold'
                  : 'bg-[#F8F3EA] text-stone-700 hover:bg-[#EFE8D8]'
              }`}
            >
              {metal === 'all' ? 'All Metals' : metal}
            </button>
          ))}

          {/* 3D Filter Toggle */}
          <button
            onClick={() => setOnly3D(!only3D)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
              only3D
                ? 'bg-[#23140C] text-[#E7C979] border border-[#C69A39]'
                : 'bg-[#F8F3EA] text-stone-700 border border-stone-200'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-[#C69A39]" />
            <span>3D Ready</span>
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider hidden sm:inline">
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs font-semibold text-[#23140C] focus:outline-none cursor-pointer"
          >
            <option value="featured">Featured / Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="weight_desc">Gold Weight (Heaviest)</option>
          </select>

          <button
            onClick={handleResetFilters}
            className="p-2 text-stone-400 hover:text-[#9A7420] transition cursor-pointer"
            title="Reset All Filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#C69A39]/20 p-8 space-y-4">
          <SlidersHorizontal className="w-10 h-10 mx-auto text-[#C69A39]/60" />
          <h3 className="font-serif font-bold text-lg text-[#23140C]">
            No Jewellery Found Matching Filters
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Try adjusting your search query, metal filter, or price limit.
          </p>
          <button
            onClick={handleResetFilters}
            className="bg-[#23140C] text-[#E7C979] text-xs font-semibold px-6 py-2.5 rounded-xl border border-[#C69A39]/40 hover:bg-[#3D2214] transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={onSelectProduct}
              onAddToCart={onAddToCart}
              onOpen3D={onOpen3D}
              isWishlisted={wishlistIds.includes(product.id)}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      )}
    </div>
  );
};
