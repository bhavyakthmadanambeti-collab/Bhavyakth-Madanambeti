import React, { useState } from 'react';
import { Crown, ArrowRight, Instagram, Facebook, Youtube, MessageCircle } from 'lucide-react';
import type { BrandSettings, ContactSettings, StoreGeneralSettings } from '../types/index.ts';

interface FooterProps {
  brand?: BrandSettings;
  contact?: ContactSettings;
  general?: StoreGeneralSettings;
  onNavigate: (page: string, category?: string) => void;
  onOpenTrackOrder: () => void;
  onOpenPolicyModal?: (policyType: 'shipping' | 'returns' | 'privacy' | 'terms') => void;
}

export const Footer: React.FC<FooterProps> = ({
  brand,
  contact,
  onNavigate,
  onOpenPolicyModal,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const brandName = brand?.brandName || 'MPR JEWELLERY';

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setEmailInput('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-[#240612] text-white pt-14 pb-8 font-sans border-t border-amber-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-12">
          {/* Logo Brand Column */}
          <div className="lg:col-span-1 space-y-3">
            <div
              onClick={() => onNavigate('home')}
              className="flex flex-col items-start cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Crown className="w-7 h-7 text-[#C69A39] fill-[#C69A39]/20 group-hover:scale-105 transition-transform" />
                <span className="font-serif font-black text-xl tracking-[0.18em] text-white group-hover:text-amber-300 transition">
                  {brandName}
                </span>
              </div>
              <span className="text-[8px] uppercase tracking-[0.25em] text-[#C69A39] mt-1 font-medium">
                Timeless Elegance
              </span>
            </div>
          </div>

          {/* Column 1: Quick Links */}
          <div className="space-y-3 text-xs">
            <h4 className="font-serif font-bold text-sm text-white tracking-wide">
              Quick Links
            </h4>
            <ul className="space-y-2 text-stone-300">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('category', 'gold')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Gold
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('category', 'silver')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Silver
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('category', 'diamond')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Diamond
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('category', 'all')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Collections
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Customer Care */}
          <div className="space-y-3 text-xs">
            <h4 className="font-serif font-bold text-sm text-white tracking-wide">
              Customer Care
            </h4>
            <ul className="space-y-2 text-stone-300">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicyModal?.('shipping')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  FAQ
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicyModal?.('terms')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicyModal?.('privacy')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Follow Us */}
          <div className="space-y-3 text-xs">
            <h4 className="font-serif font-bold text-sm text-white tracking-wide">
              Follow Us
            </h4>
            <div className="flex items-center gap-3 pt-1 text-stone-300">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#C69A39] hover:text-black flex items-center justify-center transition"
                title="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#C69A39] hover:text-black flex items-center justify-center transition"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#C69A39] hover:text-black flex items-center justify-center transition"
                title="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href={`https://wa.me/${contact?.whatsapp?.replace(/[^0-9]/g, '') || '919440218999'}`}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition"
                title="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 4: Newsletter Subscription */}
          <div className="lg:col-span-1 space-y-3 text-xs">
            <h4 className="font-serif font-bold text-sm text-white tracking-wide">
              Subscribe to our Newsletter
            </h4>
            <p className="text-stone-300 text-[11px] leading-relaxed">
              Get the latest offers and updates.
            </p>

            <form onSubmit={handleSubscribe} className="relative pt-1">
              <input
                type="email"
                required
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="Your email address"
                className="w-full bg-white text-stone-900 placeholder-stone-400 pl-3.5 pr-10 py-2 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="absolute right-1 top-2 w-7 h-7 rounded-full bg-[#E8C77B] hover:bg-[#d8b565] text-[#1c0812] flex items-center justify-center transition cursor-pointer"
                title="Subscribe"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
            {subscribed && (
              <span className="text-[11px] text-amber-300 font-medium block">
                ✓ Thank you for subscribing!
              </span>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-400 gap-2">
          <span>© 2026 MPR Jewellery. All rights reserved.</span>
          <span className="flex items-center gap-1">
            Made with <span className="text-rose-500">❤️</span> for jewellery lovers
          </span>
        </div>
      </div>
    </footer>
  );
};
