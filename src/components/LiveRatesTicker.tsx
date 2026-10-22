import React, { useState, useEffect } from 'react';
import { Crown, RefreshCw } from 'lucide-react';
import { api } from '../services/api.ts';
import type { PricingSettings } from '../types/index.ts';

interface LiveRatesTickerProps {
  initialRates?: Partial<PricingSettings>;
}

export const LiveRatesTicker: React.FC<LiveRatesTickerProps> = ({ initialRates }) => {
  const [rates, setRates] = useState<Partial<PricingSettings>>(
    initialRates || {
      goldRate24KPerGram: 6250,
      goldRate22KPerGram: 5750,
      silverRatePerGram: 78,
      diamondRatePerCaratBaseline: 56000,
      ratesLastUpdated: new Date().toISOString(),
    }
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRates = async () => {
    try {
      setIsRefreshing(true);
      const data = await api.getRates();
      if (data && data.goldRate24KPerGram) {
        setRates(data);
      }
    } catch (e) {
      console.warn('Using cached rates', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 my-6">
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-4 sm:p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 divide-y md:divide-y-0 md:divide-x divide-stone-200">
          {/* Gold Rate */}
          <div className="flex items-center gap-3.5 pr-2 pt-2 md:pt-0">
            {/* 3D Gold Bar Graphic */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300 flex items-center justify-center text-2xl shadow-xs shrink-0">
              🪙
            </div>
            <div>
              <span className="text-xs text-stone-500 font-sans block">Gold Rate</span>
              <strong className="font-serif font-extrabold text-base sm:text-lg text-[#260714]">
                ₹{(rates.goldRate24KPerGram ? Math.round(rates.goldRate24KPerGram * 10 / 11.5) : 6250).toLocaleString('en-IN')} / 10g
              </strong>
            </div>
          </div>

          {/* Silver Rate */}
          <div className="flex items-center gap-3.5 px-0 md:px-6 pt-3 md:pt-0">
            {/* 3D Silver Ingot Graphic */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 flex items-center justify-center text-2xl shadow-xs shrink-0">
              🥈
            </div>
            <div>
              <span className="text-xs text-stone-500 font-sans block">Silver Rate</span>
              <strong className="font-serif font-extrabold text-base sm:text-lg text-[#260714]">
                ₹{rates.silverRatePerGram || 78} / 1g
              </strong>
            </div>
          </div>

          {/* Diamond Rate */}
          <div className="flex items-center gap-3.5 px-0 md:px-6 pt-3 md:pt-0">
            {/* 3D Diamond Gem Graphic */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-50 via-sky-100 to-blue-200 flex items-center justify-center text-2xl shadow-xs shrink-0">
              💎
            </div>
            <div>
              <span className="text-xs text-stone-500 font-sans block">Diamond Rate</span>
              <strong className="font-serif font-extrabold text-base sm:text-lg text-[#260714]">
                ₹{(rates.diamondRatePerCaratBaseline || 56000).toLocaleString('en-IN')} / ct
              </strong>
            </div>
          </div>

          {/* Pure • Elegant • Trusted Statement */}
          <div className="flex flex-col justify-center items-start md:items-center text-left md:text-center px-0 md:px-6 pt-3 md:pt-0">
            <div className="flex items-center gap-1.5 text-[#C69A39] mb-0.5">
              <Crown className="w-4 h-4 fill-current" />
            </div>
            <h4 className="font-serif font-bold text-xs sm:text-sm text-[#260714] tracking-wide">
              Pure • Elegant • Trusted
            </h4>
            <p className="text-[11px] text-stone-500 font-sans">
              Your Happiness is Our Jewellery
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
