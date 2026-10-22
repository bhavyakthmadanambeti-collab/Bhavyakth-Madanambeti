import React from 'react';
import { X, ShieldCheck, Truck, RotateCcw, FileText } from 'lucide-react';
import type { StoreGeneralSettings } from '../types/index.ts';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  policyType: 'shipping' | 'returns' | 'privacy' | 'terms';
  general?: StoreGeneralSettings;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  isOpen,
  onClose,
  policyType,
  general,
}) => {
  if (!isOpen) return null;

  const getContent = () => {
    switch (policyType) {
      case 'shipping':
        return {
          title: 'Insured Shipping & Delivery Policy',
          icon: <Truck className="w-5 h-5 text-[#C69A39]" />,
          body: general?.shippingPolicy || 'Free insured pan-India delivery on orders above ₹10,000 via BlueDart / BVC Logistics with OTP-verified handover. All shipments are 100% transit insured.',
        };
      case 'returns':
        return {
          title: '7-Day Easy Exchange & Lifetime Buyback',
          icon: <RotateCcw className="w-5 h-5 text-[#C69A39]" />,
          body: general?.returnPolicy || '7-day easy exchange guarantee. Lifetime buyback and gold exchange guarantee at current market rates as per BIS hallmark weight and purity inspection.',
        };
      case 'privacy':
        return {
          title: 'Privacy & Security Policy',
          icon: <ShieldCheck className="w-5 h-5 text-[#C69A39]" />,
          body: general?.privacyPolicy || 'We respect your privacy. Customer contact details and addresses are used solely for processing orders, delivery updates, and luxury concierge support. Payment information is securely verified via standard Indian banking protocols.',
        };
      case 'terms':
        return {
          title: 'Terms of Sale & BIS Certification',
          icon: <FileText className="w-5 h-5 text-[#C69A39]" />,
          body: general?.termsAndConditions || 'All gold jewellery sold at MPR JEWELLERY is BIS 916 Hallmarked. Weight, purity, and certified gemstone certificates are included in the tamper-proof delivery box. Orders confirmed via verified UPI payment are dispatched within 24-48 business hours.',
        };
    }
  };

  const { title, icon, body } = getContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#FDFBF7] rounded-3xl shadow-2xl border border-[#C69A39]/40 overflow-hidden my-auto p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-[#C69A39]/20">
          <div className="flex items-center gap-2.5">
            {icon}
            <h3 className="font-serif font-bold text-lg text-[#23140C]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 text-[#23140C] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 text-xs text-stone-700 leading-relaxed font-sans whitespace-pre-line">
          {body}
        </div>

        <div className="mt-8 pt-4 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#23140C] text-[#E7C979] text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-[#3D2214] transition cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
