import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppFloatingButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({
  phoneNumber = '+91 94402 18999',
  defaultMessage = 'Namaste MPR Jewellers, I would like to inquire about your precious jewellery collections and gold rates.',
}) => {
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

  return (
    <div className="fixed bottom-6 right-6 z-30 flex items-center gap-2 group">
      <div className="hidden sm:block bg-[#23140C] text-[#E7C979] text-xs font-serif font-medium px-3.5 py-1.5 rounded-full border border-[#C69A39]/40 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        Chat with MPR Concierge
      </div>

      <a
        href={`https://wa.me/${cleanNumber}?text=${encodeURIComponent(defaultMessage)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-13 h-13 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300 border-2 border-white/80"
        title="WhatsApp Live Assistance"
      >
        <MessageCircle className="w-7 h-7 fill-white text-[#25D366]" />
      </a>
    </div>
  );
};
