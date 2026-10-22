import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Filter,
  SlidersHorizontal,
  Search,
  Sparkles,
  ShoppingBag,
  Eye,
  Heart,
  Maximize2,
  Box,
  ChevronDown,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import type { Product, Category, MetalType } from '../types/index.ts';
import { FullScreenImageViewer } from '../components/FullScreenImageViewer.tsx';

interface CategoryPageProps {
  categorySlug: string;
  categories: Category[];
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, size?: string) => void;
  onBuyNow: (product: Product, size?: string) => void;
  onNavigateHome: () => void;
  onNavigateCategory: (slug: string) => void;
  onOpen3D?: (modelType: 'ring' | 'pendant' | 'bangle') => void;
  wishlistIds?: string[];
  onToggleWishlist?: (productId: string) => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  categorySlug,
  categories,
  products,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  onNavigateHome,
  onNavigateCategory,
  onOpen3D,
  wishlistIds = [],
  onToggleWishlist,
}) => {
  // State for search, filters & sort
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMetal, setSelectedMetal] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  // Full-screen image viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerDetails, setViewerDetails] = useState<any[]>([]);
  const [viewerTitle, setViewerTitle] = useState('');
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

  // Find active category
  const currentCategory = useMemo(() => {
    return (
      categories.find(c => c.slug === categorySlug) || {
        id: 'cat-custom',
        name: categorySlug
          .split('-')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        slug: categorySlug,
        description: 'Handcrafted royal Indian jewellery masterpieces certified for authenticity and purity.',
        image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80',
        itemCount: 0,
      }
    );
  }, [categorySlug, categories]);

  // Reset pagination on category change
  useEffect(() => {
    setVisibleCount(12);
    setSearchQuery('');
    setSelectedMetal('all');
    setSelectedPriceRange('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [categorySlug]);

  // Filter products belonging to this category
  const filteredProducts = useMemo(() => {
    let list = products.filter(p => !p.isArchived);

    // Filter by category slug
    if (categorySlug !== 'all') {
      const slugLower = categorySlug.toLowerCase();
      list = list.filter(p => {
        const cat = p.category?.toLowerCase() || '';
        const metal = p.metal?.toLowerCase() || '';
        const tags = (p.tags || []).map(t => t.toLowerCase());

        if (slugLower === 'gold') return metal === 'gold' || cat === 'gold';
        if (slugLower === 'diamond') return metal === 'diamond' || cat === 'diamond';
        if (slugLower === 'silver') return metal === 'silver' || cat === 'silver';
        if (slugLower === 'gold-rings') {
          return (cat === 'rings' || tags.includes('ring')) && (metal === 'gold' || p.purity.includes('22K') || p.purity.includes('18K'));
        }
        if (slugLower === 'silver-rings') {
          return (cat === 'silver-rings' || tags.includes('silver-rings') || (metal === 'silver' && (cat === 'rings' || tags.includes('ring'))));
        }
        if (slugLower === 'rings') return cat === 'rings' || tags.includes('ring') || tags.includes('rings');
        if (slugLower === 'necklaces') return cat === 'necklaces' || tags.includes('necklace') || tags.includes('choker') || tags.includes('mala');
        if (slugLower === 'chains') return cat === 'chains' || tags.includes('chain') || tags.includes('chains');
        if (slugLower === 'earrings') return cat === 'earrings' || tags.includes('earring') || tags.includes('jhumka') || tags.includes('tops');
        if (slugLower === 'bangles') return cat === 'bangles' || tags.includes('bangle') || tags.includes('kada') || tags.includes('kangan');
        if (slugLower === 'bracelets') return cat === 'bracelets' || tags.includes('bracelet');
        if (slugLower === 'pendants') return cat === 'pendants' || tags.includes('pendant') || tags.includes('locket');
        if (slugLower === 'wedding') return cat === 'bridal' || tags.includes('bridal') || tags.includes('wedding');
        if (slugLower === 'traditional') return tags.includes('antique') || tags.includes('nakshi') || tags.includes('temple') || tags.includes('polki');
        if (slugLower === 'puja') return tags.includes('puja') || tags.includes('idol') || tags.includes('diya') || tags.includes('thali');

        return cat === slugLower || tags.includes(slugLower);
      });
    }

    // Secondary filters
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.purity.toLowerCase().includes(q)
      );
    }

    if (selectedMetal !== 'all') {
      list = list.filter(p => p.metal === selectedMetal);
    }

    if (selectedPriceRange !== 'all') {
      if (selectedPriceRange === 'under-25k') list = list.filter(p => p.price < 25000);
      else if (selectedPriceRange === '25k-50k') list = list.filter(p => p.price >= 25000 && p.price <= 50000);
      else if (selectedPriceRange === '50k-100k') list = list.filter(p => p.price > 50000 && p.price <= 100000);
      else if (selectedPriceRange === 'above-100k') list = list.filter(p => p.price > 100000);
    }

    if (inStockOnly) {
      list = list.filter(p => p.stockQuantity > 0);
    }

    // Sorting
    if (sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'weight-high') {
      list.sort((a, b) => b.grossWeightGrams - a.grossWeightGrams);
    } else {
      // Default: newest
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [products, categorySlug, searchQuery, selectedMetal, selectedPriceRange, inStockOnly, sortBy]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);

  const openImageViewer = (e: React.MouseEvent, product: Product, index = 0) => {
    e.stopPropagation();
    setViewerImages(product.images || []);
    setViewerDetails(product.imageDetails || []);
    setViewerTitle(`${product.name} (${product.purity})`);
    setViewerInitialIndex(index);
    setViewerOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#23140C] pb-20">
      {/* Category Hero Banner */}
      <div className="relative bg-[#1a0f0a] text-white py-12 md:py-16 px-4 sm:px-6 lg:px-8 border-b border-amber-900/30 overflow-hidden shadow-lg">
        {/* Decorative background image with luxury gradient */}
        <div className="absolute inset-0 z-0 opacity-25">
          <img
            src={currentCategory.image}
            alt={currentCategory.name}
            className="w-full h-full object-cover object-center filter blur-xs"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#170B05] via-[#23140C]/90 to-[#170B05] z-0" />

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-amber-200/70 mb-4 font-sans">
            <button
              onClick={onNavigateHome}
              className="hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <span className="text-amber-500/50">/</span>
            <span className="text-stone-400">Collections</span>
            <span className="text-amber-500/50">/</span>
            <span className="text-amber-400 font-semibold">{currentCategory.name}</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Authentic MPR Royal Collection</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-amber-100 tracking-tight leading-tight">
              {currentCategory.name}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-stone-300 font-light leading-relaxed">
              {currentCategory.description}
            </p>
          </div>

          {/* Quick Sub-Category Pill Carousel */}
          <div className="mt-6 pt-4 border-t border-amber-900/40 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            <span className="text-xs uppercase font-bold text-amber-400/80 mr-2 shrink-0">
              Categories:
            </span>
            {categories.map(cat => (
              <button
                key={cat.id || cat.slug}
                onClick={() => onNavigateCategory(cat.slug)}
                className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                  cat.slug === categorySlug
                    ? 'bg-amber-500 text-black font-bold shadow-md'
                    : 'bg-stone-900/70 hover:bg-stone-800 text-stone-300 border border-stone-800 hover:border-amber-600/50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Controls Toolbar: Search, Filters & Sorters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-900/15 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search bar inside category */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search ${currentCategory.name.toLowerCase()}...`}
              className="w-full pl-10 pr-4 py-2 bg-[#FDFBF7] border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Desktop Filter Pills */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Price Filter */}
            <select
              value={selectedPriceRange}
              onChange={e => setSelectedPriceRange(e.target.value)}
              className="bg-[#FDFBF7] border border-stone-200 rounded-xl px-3 py-2 text-xs text-[#23140C] font-medium focus:outline-none focus:border-amber-600"
            >
              <option value="all">All Prices</option>
              <option value="under-25k">Under ₹25,000</option>
              <option value="25k-50k">₹25,000 - ₹50,000</option>
              <option value="50k-100k">₹50,000 - ₹1,00,000</option>
              <option value="above-100k">Above ₹1,00,000</option>
            </select>

            {/* Metal Filter */}
            <select
              value={selectedMetal}
              onChange={e => setSelectedMetal(e.target.value)}
              className="bg-[#FDFBF7] border border-stone-200 rounded-xl px-3 py-2 text-xs text-[#23140C] font-medium focus:outline-none focus:border-amber-600"
            >
              <option value="all">All Precious Metals</option>
              <option value="gold">22K / 24K Gold</option>
              <option value="diamond">Natural Diamond</option>
              <option value="silver">925 / 999 Silver</option>
            </select>

            {/* In stock toggle */}
            <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={e => setInStockOnly(e.target.checked)}
                className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
              />
              <span>In Stock Only</span>
            </label>
          </div>

          {/* Sorting & Mobile Filter Trigger */}
          <div className="flex items-center justify-between w-full md:w-auto gap-3">
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-[#FDFBF7] text-xs font-semibold text-[#23140C]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
              <span>Filters</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 whitespace-nowrap">Sort by:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-[#FDFBF7] border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-[#23140C] focus:outline-none focus:border-amber-600"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="weight-high">Weight: Heavy to Light</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Filter Drawer / Expansion */}
        {mobileFilterOpen && (
          <div className="lg:hidden bg-white p-4 rounded-2xl shadow-sm border border-amber-900/15 mb-6 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="font-serif font-bold text-sm text-[#23140C]">Refine Ornaments</span>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-stone-500 block mb-1">Price Range</label>
              <select
                value={selectedPriceRange}
                onChange={e => setSelectedPriceRange(e.target.value)}
                className="w-full bg-[#FDFBF7] border border-stone-200 rounded-xl p-2 text-xs"
              >
                <option value="all">All Prices</option>
                <option value="under-25k">Under ₹25,000</option>
                <option value="25k-50k">₹25,000 - ₹50,000</option>
                <option value="50k-100k">₹50,000 - ₹1,00,000</option>
                <option value="above-100k">Above ₹1,00,000</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-stone-500 block mb-1">Metal</label>
              <select
                value={selectedMetal}
                onChange={e => setSelectedMetal(e.target.value)}
                className="w-full bg-[#FDFBF7] border border-stone-200 rounded-xl p-2 text-xs"
              >
                <option value="all">All Metals</option>
                <option value="gold">Gold (22K/24K)</option>
                <option value="diamond">Diamonds</option>
                <option value="silver">Silver</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs text-stone-700 py-1">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={e => setInStockOnly(e.target.checked)}
                className="rounded border-stone-300 text-amber-600"
              />
              <span>In Stock Only</span>
            </label>
          </div>
        )}

        {/* Results Count & Badges */}
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-xs sm:text-sm text-stone-600">
            Showing <strong className="text-[#23140C]">{displayedProducts.length}</strong> of{' '}
            <strong className="text-[#23140C]">{filteredProducts.length}</strong> ornaments in{' '}
            <span className="font-serif italic text-amber-900 font-semibold">{currentCategory.name}</span>
          </p>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-amber-900/15 my-6">
            <Sparkles className="w-12 h-12 text-amber-500/40 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-lg text-[#23140C]">
              No ornaments found matching your criteria
            </h3>
            <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-md mx-auto">
              Try adjusting your price or metal filter, or explore our full collection of royal treasures.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedMetal('all');
                setSelectedPriceRange('all');
                setInStockOnly(false);
              }}
              className="mt-4 px-5 py-2 rounded-xl bg-[#23140C] text-[#E7C979] text-xs font-semibold hover:bg-[#3D2214] transition cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {displayedProducts.map(product => {
              const isWishlisted = wishlistIds.includes(product.id);
              const discountPercent = product.originalPrice
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;

              return (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="group relative bg-white rounded-2xl overflow-hidden border border-amber-900/15 hover:border-amber-600/60 hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
                >
                  {/* Top Badges & Wishlist */}
                  <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
                    <div className="flex flex-col gap-1">
                      {product.isBestSeller && (
                        <span className="bg-[#23140C] text-[#E7C979] text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-500/30 uppercase tracking-wider shadow-xs">
                          Best Seller
                        </span>
                      )}
                      {product.isNewArrival && !product.isBestSeller && (
                        <span className="bg-[#9A7420] text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                          New Arrival
                        </span>
                      )}
                      {product.has3DModel && (
                        <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs flex items-center gap-1">
                          <Box className="w-2.5 h-2.5" /> 3D
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 pointer-events-auto">
                      {/* Fullscreen Zoom Trigger */}
                      <button
                        onClick={e => openImageViewer(e, product, 0)}
                        className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs border border-stone-200 hover:border-amber-500 flex items-center justify-center text-stone-700 hover:text-amber-700 transition shadow-xs cursor-pointer"
                        title="Inspect in Full-Screen Zoom"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>

                      {onToggleWishlist && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onToggleWishlist(product.id);
                          }}
                          className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs border border-stone-200 flex items-center justify-center text-[#23140C] hover:text-rose-600 transition shadow-xs cursor-pointer"
                          title="Wishlist"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              isWishlisted ? 'fill-rose-600 text-rose-600' : 'text-stone-500'
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Product Image */}
                  <div className="relative aspect-square w-full bg-[#FDFBF7] overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                      loading="lazy"
                    />

                    {/* Quick Image Gallery Preview Dots */}
                    {product.images.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/40 backdrop-blur-xs px-2 py-1 rounded-full">
                        {product.images.slice(0, 4).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              i === 0 ? 'bg-amber-400' : 'bg-white/60'
                            }`}
                          />
                        ))}
                        {product.images.length > 4 && (
                          <span className="text-[9px] text-white">+{product.images.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Content Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
                    <div>
                      {/* Purity & Weight */}
                      <div className="flex items-center gap-2 text-[11px] mb-1.5 flex-wrap">
                        <span className="font-semibold text-amber-800 bg-[#F8F3EA] border border-amber-900/20 px-2 py-0.5 rounded">
                          {product.purity}
                        </span>
                        {product.grossWeightGrams > 0 && (
                          <span className="text-stone-500 font-mono text-[11px]">
                            {product.grossWeightGrams}g
                          </span>
                        )}
                        {product.stoneWeightCarats ? (
                          <span className="text-stone-500 font-mono text-[11px]">
                            • {product.stoneWeightCarats}ct
                          </span>
                        ) : null}
                      </div>

                      {/* Product Name */}
                      <h3 className="font-serif font-bold text-sm text-[#23140C] group-hover:text-amber-800 transition line-clamp-2 leading-snug">
                        {product.name}
                      </h3>

                      <p className="text-stone-500 text-xs line-clamp-1 mt-1 font-sans">
                        {product.specifications.occasion || product.description}
                      </p>
                    </div>

                    {/* Price & Action Buttons */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-serif font-bold text-base text-[#23140C]">
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>
                          {product.originalPrice && (
                            <span className="text-xs text-stone-400 line-through">
                              ₹{product.originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        {discountPercent > 0 && (
                          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                            Save {discountPercent}%
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onAddToCart(product);
                          }}
                          className="bg-[#23140C] hover:bg-[#3D2214] text-[#E7C979] text-xs font-semibold px-3 py-2 rounded-xl border border-amber-500/30 flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                          title="Add to Cart"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Add</span>
                        </button>

                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onBuyNow(product);
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold px-3 py-2 rounded-xl transition shadow-xs cursor-pointer active:scale-95"
                          title="Instant UPI Buy Now"
                        >
                          Buy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {visibleCount < filteredProducts.length && (
          <div className="text-center mt-10">
            <button
              onClick={() => setVisibleCount(prev => prev + 12)}
              className="px-8 py-3 rounded-2xl bg-white border-2 border-amber-900/30 text-[#23140C] font-serif font-bold text-sm hover:border-amber-600 hover:bg-amber-50 transition shadow-sm cursor-pointer"
            >
              Load More {currentCategory.name} Ornaments ({filteredProducts.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>

      {/* Full-Screen Image Viewer Component */}
      <FullScreenImageViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        images={viewerImages}
        initialIndex={viewerInitialIndex}
        productName={viewerTitle}
        imageDetails={viewerDetails}
      />
    </div>
  );
};
