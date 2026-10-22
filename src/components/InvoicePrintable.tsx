import React from 'react';
import { X, Printer, ShieldCheck } from 'lucide-react';
import type { Order, BrandSettings, ContactSettings, PricingSettings } from '../types/index.ts';

interface InvoicePrintableProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  brand?: BrandSettings;
  contact?: ContactSettings;
  pricing?: PricingSettings;
}

export const InvoicePrintable: React.FC<InvoicePrintableProps> = ({
  order,
  isOpen,
  onClose,
  brand,
  contact,
  pricing,
}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-[#C69A39]/40 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Control Bar (Hidden during print) */}
        <div className="p-4 bg-[#23140C] text-[#FDFBF7] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#E7C979] font-semibold">
              Tax Invoice Preview: {order.orderNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-[#170B05] text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md hover:brightness-110 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Tax Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#FDFBF7] flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="invoice-printable" className="p-8 sm:p-10 font-sans text-[#23140C] overflow-y-auto flex-1 bg-white">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[#C69A39] pb-6">
            <div>
              <h1 className="font-serif font-black text-2xl sm:text-3xl tracking-wider text-[#23140C]">
                {brand?.brandName || 'MPR JEWELLERY'}
              </h1>
              <p className="text-xs text-[#9A7420] font-serif font-medium mt-0.5">
                {brand?.tagline || 'Timeless Heritage & Royal Indian Craftsmanship'}
              </p>
              <p className="text-[11px] text-stone-600 mt-2 max-w-sm leading-relaxed">
                {contact?.address || 'Main Bazaar Road, Near Clock Tower'}, {contact?.cityStateZip || 'Hyderabad, Telangana 500002'}
                <br />
                Phone: {contact?.phone || '+91 94402 18999'} • Email: {contact?.email || 'mprjewellery@gmail.com'}
              </p>
              <p className="text-[10px] text-stone-500 font-mono mt-1">
                GSTIN: 36AAACM8910Q1ZS • BIS Hallmark Lic: HM/L-91684920
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block bg-[#23140C] text-[#E7C979] text-xs font-bold px-3 py-1 rounded-md uppercase tracking-widest font-serif">
                TAX INVOICE
              </span>
              <div className="mt-3 text-xs space-y-1">
                <div>
                  <span className="text-stone-500">Invoice No: </span>
                  <strong className="font-mono">{order.orderNumber}</strong>
                </div>
                <div>
                  <span className="text-stone-500">Date: </span>
                  <strong>{new Date(order.createdAt).toLocaleDateString()}</strong>
                </div>
                <div>
                  <span className="text-stone-500">Payment: </span>
                  <strong className="uppercase">{order.paymentMethod} ({order.paymentStatus})</strong>
                </div>
                {order.upiPaymentDetails?.utrNumber && (
                  <div>
                    <span className="text-stone-500">Bank UTR: </span>
                    <strong className="font-mono">{order.upiPaymentDetails.utrNumber}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Billed To & Shipped To */}
          <div className="grid grid-cols-2 gap-6 my-6 text-xs">
            <div className="p-3.5 rounded-xl bg-[#FDFBF7] border border-stone-200">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                Customer Details / Billed To:
              </span>
              <strong className="text-sm font-serif text-[#23140C] block">
                {order.customerName}
              </strong>
              <div className="text-stone-600 mt-1 space-y-0.5">
                <div>Phone: {order.customerPhone}</div>
                <div>Email: {order.customerEmail}</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FDFBF7] border border-stone-200">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                Delivery Address:
              </span>
              <div className="text-stone-700 leading-relaxed">
                {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-stone-200 rounded-xl overflow-hidden my-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#23140C] text-[#E7C979] font-serif text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-2">Purity / Metal</th>
                  <th className="py-2.5 px-2 text-right">Gross Wt.</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-stone-50">
                    <td className="py-3 px-3">
                      <strong className="text-[#23140C] block">{item.productName}</strong>
                      <span className="text-[10px] text-stone-500 font-mono">
                        SKU: {item.productSku} {item.selectedSize ? `• ${item.selectedSize}` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-medium">{item.purity}</td>
                    <td className="py-3 px-2 text-right font-mono">{item.weightGrams}g</td>
                    <td className="py-3 px-2 text-center font-mono">{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-[#23140C]">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Calculation */}
          <div className="flex justify-end my-6 text-xs">
            <div className="w-full max-w-xs space-y-1.5 border-t border-stone-200 pt-3">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span className="font-mono">₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount ({order.couponCode || 'Promo'}):</span>
                  <span className="font-mono">-₹{order.discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>Insured Express Shipping:</span>
                <span className="font-mono">
                  {order.shippingFee === 0 ? 'FREE' : `₹${order.shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between text-stone-500 text-[11px]">
                <span>GST (3% Indian Precious Metals Tax):</span>
                <span className="font-mono">₹{order.taxAmount.toLocaleString('en-IN')} (Included)</span>
              </div>
              <div className="flex justify-between text-base font-serif font-bold text-[#23140C] pt-2 border-t border-[#C69A39]/30">
                <span>Total Amount:</span>
                <span className="font-mono text-[#9A7420]">
                  ₹{order.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Hallmarking Trust Stamp & Sign-off */}
          <div className="mt-8 pt-6 border-t border-dashed border-stone-300 flex flex-wrap items-center justify-between text-[11px] text-stone-500">
            <div className="flex items-center gap-2 max-w-sm">
              <ShieldCheck className="w-6 h-6 text-[#C69A39] shrink-0" />
              <span>
                Certified BIS 916 Hallmarked Pure Gold & IGI Certified Diamonds. Handcrafted with traditional karigar integrity.
              </span>
            </div>

            <div className="text-right mt-4 sm:mt-0">
              <div className="font-serif font-bold text-xs text-[#23140C]">
                For MPR JEWELLERY
              </div>
              <div className="text-[10px] text-stone-400 mt-6 border-t border-stone-300 pt-1">
                Authorized Signatory / Accounts Desk
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
