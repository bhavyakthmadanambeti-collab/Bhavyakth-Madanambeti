import React, { useState, useEffect } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import type { Product } from '../types/index.ts';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onNavigateToCategory: (category: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  onNavigateToCategory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredProducts = searchTerm.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.purity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  const popularSearches = ['Kundan Choker', 'Solitaire Ring', '22K Kasu Mala', 'Antique Jhumkas', 'Silver Payal', 'Puja Thali'];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#FDFBF7] rounded-3xl shadow-2xl border border-[#C69A39]/40 overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#C69A39]/20 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#C69A39] shrink-0" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search 22K gold, certified diamonds, solitaire rings, bridal sets..."
            className="flex-1 text-sm sm:text-base font-sans text-[#23140C] placeholder:text-stone-400 bg-transparent focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-stone-400 hover:text-stone-600 text-xs p-1"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-[#23140C] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results or Suggestions */}
        <div className="p-5 sm:p-6 max-h-[60vh] overflow-y-auto">
          {searchTerm.trim() ? (
            <div>
              <div className="text-xs font-semibold text-stone-500 mb-3 uppercase tracking-wider">
                Matching Jewellery ({filteredProducts.length})
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  <p className="text-sm">No items found matching "{searchTerm}"</p>
                  <p className="text-xs text-stone-400 mt-1">
                    Try searching for "gold", "diamond", "ring", or "choker".
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100 space-y-2">
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      onClick={() => {
                        onClose();
                        onSelectProduct(product);
                      }}
                      className="pt-2 flex items-center gap-3.5 hover:bg-[#F8F3EA] p-2.5 rounded-xl transition cursor-pointer group"
                    >
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-14 h-14 object-cover rounded-xl border border-[#C69A39]/20 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-[#F8F3EA] text-[#9A7420] border border-[#C69A39]/30 px-1.5 py-0.2 rounded font-semibold">
                            {product.purity}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {product.grossWeightGrams}g
                          </span>
                        </div>
                        <h4 className="font-serif font-semibold text-xs text-[#23140C] group-hover:text-[#9A7420] transition truncate mt-0.5">
                          {product.name}
                        </h4>
                        <div className="font-serif font-bold text-xs text-[#23140C]">
                          ₹{product.price.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#C69A39] transition" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">
                Popular Searches
              </div>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term, i) => (
                  <button
                    key={i}
                    onClick={() => setSearchTerm(term)}
                    className="text-xs bg-white hover:bg-[#F8F3EA] text-[#23140C] border border-[#C69A39]/30 px-3 py-1.5 rounded-full transition shadow-2xs cursor-pointer"
                  >
                    {term}
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-stone-200">
                <div className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">
                  Browse by Metal & Collection
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToCategory('gold');
                    }}
                    className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-left hover:bg-amber-100/50 transition cursor-pointer"
                  >
                    <span className="font-serif font-bold text-xs text-[#23140C] block">
                      22K Gold
                    </span>
                    <span className="text-[10px] text-stone-500">Temple & Antique</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToCategory('diamond');
                    }}
                    className="p-3 rounded-xl bg-cyan-50/50 border border-cyan-200 text-left hover:bg-cyan-100/50 transition cursor-pointer"
                  >
                    <span className="font-serif font-bold text-xs text-[#23140C] block">
                      Diamonds
                    </span>
                    <span className="text-[10px] text-stone-500">Certified VVS/VS</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToCategory('silver');
                    }}
                    className="p-3 rounded-xl bg-stone-100/70 border border-stone-300 text-left hover:bg-stone-200/50 transition cursor-pointer"
                  >
                    <span className="font-serif font-bold text-xs text-[#23140C] block">
                      925 Silver
                    </span>
                    <span className="text-[10px] text-stone-500">Payals & Mandir Puja</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToCategory('bridal');
                    }}
                    className="p-3 rounded-xl bg-rose-50/50 border border-rose-200 text-left hover:bg-rose-100/50 transition cursor-pointer"
                  >
                    <span className="font-serif font-bold text-xs text-[#23140C] block">
                      Bridal Sets
                    </span>
                    <span className="text-[10px] text-stone-500">Regal Chokers</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
