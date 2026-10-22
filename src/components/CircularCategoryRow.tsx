import React, { useRef } from 'react';
import type { Category } from '../types/index.ts';

interface CircularCategoryRowProps {
  categories: Category[];
  selectedCategory?: string;
  onSelectCategory: (slug: string) => void;
}

export const CircularCategoryRow: React.FC<CircularCategoryRowProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  // 8 canonical categories from user design screenshot
  const defaultItems = [
    {
      name: 'Necklaces',
      slug: 'necklaces',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Earrings',
      slug: 'earrings',
      image: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Bangles',
      slug: 'bangles',
      image: 'https://images.unsplash.com/photo-1611591475870-07e382d55653?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Rings',
      slug: 'rings',
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Chains',
      slug: 'chains',
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Pendants',
      slug: 'pendants',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Silver',
      slug: 'silver',
      image: 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Diamond',
      slug: 'diamond',
      image: 'https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=400&q=80',
    },
  ];

  // Merge with existing categories if available
  const items = defaultItems.map(def => {
    const found = categories.find(c => c.slug === def.slug || c.name.toLowerCase() === def.name.toLowerCase());
    return found ? { ...def, image: found.image || def.image, name: found.name } : def;
  });

  return (
    <section className="py-6 sm:py-8 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Horizontal scrollable row on mobile, 8 centered items on desktop */}
        <div className="flex items-center justify-between gap-4 sm:gap-6 overflow-x-auto scrollbar-none py-2 px-1">
          {items.map(item => {
            const isSelected = selectedCategory === item.slug;

            return (
              <button
                key={item.slug}
                onClick={() => onSelectCategory(item.slug)}
                className="group flex flex-col items-center flex-1 min-w-[72px] sm:min-w-[90px] focus:outline-none cursor-pointer transition-transform duration-200 active:scale-95"
              >
                {/* Circular Image Container with warm soft ivory/gold glow */}
                <div
                  className={`w-18 h-18 sm:w-22 sm:h-22 md:w-24 md:h-24 rounded-full p-1 transition-all duration-300 ${
                    isSelected
                      ? 'ring-2 ring-amber-500 shadow-lg scale-105'
                      : 'hover:scale-105'
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-[#FFFDF9] to-[#F7EFE3] border border-amber-200/80 shadow-xs flex items-center justify-center p-1.5 group-hover:border-amber-400 transition-colors">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Category Label */}
                <span className="mt-2.5 text-xs sm:text-sm font-serif font-medium text-stone-800 text-center tracking-wide group-hover:text-amber-800 transition-colors">
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
