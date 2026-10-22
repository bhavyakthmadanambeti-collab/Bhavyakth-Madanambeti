import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import type { CartItem } from '../types/index.ts';
import { api } from '../services/api.ts';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
  appliedCoupon: { code: string; discountAmount: number } | null;
  onApplyCoupon: (coupon: { code: string; discountAmount: number } | null) => void;
  freeShippingThreshold?: number;
  deliveryCharge?: number;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  appliedCoupon,
  onApplyCoupon,
  freeShippingThreshold = 10000,
  deliveryCharge = 150,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const isFreeDelivery = subtotal >= freeShippingThreshold;
  const shippingFee = items.length === 0 ? 0 : isFreeDelivery ? 0 : deliveryCharge;
  const total = Math.max(0, subtotal - discount + shippingFee);

  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsApplying(true);
    setCouponError('');
    setCouponSuccess('');
    try {
      const res = await api.applyCoupon(couponInput.trim(), subtotal);
      onApplyCoupon({ code: res.code, discountAmount: res.discountAmount });
      setCouponSuccess(res.message);
      setCouponInput('');
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon code');
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    onApplyCoupon(null);
    setCouponSuccess('');
    setCouponError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-[#FDFBF7] h-full shadow-2xl flex flex-col border-l border-[#C69A39]/30">
        {/* Header */}
        <div className="p-5 bg-[#23140C] text-[#FDFBF7] flex items-center justify-between border-b border-[#C69A39]/30">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#E7C979]" />
            <h3 className="font-serif font-bold text-lg tracking-wider text-[#FDFBF7]">
              Your Jewellery Bag ({items.reduce((s, i) => s + i.quantity, 0)})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#FDFBF7] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Free Shipping Progress */}
        <div className="bg-[#F8F3EA] px-5 py-3 border-b border-[#C69A39]/20 text-xs">
          <div className="flex justify-between font-medium text-[#23140C] mb-1.5">
            {isFreeDelivery ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                ✨ Insured Free Pan-India Delivery unlocked!
              </span>
            ) : (
              <span>
                Add{' '}
                <strong className="text-[#9A7420]">
                  ₹{amountNeededForFreeShipping.toLocaleString('en-IN')}
                </strong>{' '}
                more for FREE Insured Delivery
              </span>
            )}
            <span className="font-mono text-stone-500">
              ₹{subtotal.toLocaleString('en-IN')} / ₹{freeShippingThreshold.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#E6DEC8] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] transition-all duration-300"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-stone-500">
              <div className="w-16 h-16 rounded-full bg-[#F4EFE6] flex items-center justify-center text-[#C69A39]">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-[#23140C] text-lg">Your Bag is Empty</h4>
                <p className="text-xs text-stone-600 mt-1">
                  Discover handcrafted 22K Gold, VVS Diamonds, and 925 Silver pieces.
                </p>
              </div>
              <button
                onClick={onClose}
                className="bg-[#23140C] hover:bg-[#3D2214] text-[#E7C979] text-xs font-semibold px-6 py-2.5 rounded-xl border border-[#C69A39]/50 transition cursor-pointer"
              >
                Explore Collections
              </button>
            </div>
          ) : (
            items.map(item => (
              <div
                key={item.productId}
                className="flex gap-3.5 p-3 rounded-2xl bg-white border border-[#C69A39]/20 shadow-xs"
              >
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-20 h-20 object-cover rounded-xl border border-[#C69A39]/20 shrink-0"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-serif font-semibold text-xs text-[#23140C] line-clamp-1">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(item.productId)}
                        className="text-stone-400 hover:text-rose-600 transition p-1 shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] bg-[#F8F3EA] text-[#9A7420] border border-[#C69A39]/30 px-1.5 py-0.2 rounded font-medium">
                        {item.product.purity}
                      </span>
                      {item.selectedSize && (
                        <span className="text-[10px] text-stone-500 font-medium">
                          • {item.selectedSize}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                    <span className="font-serif font-bold text-xs text-[#23140C]">
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </span>

                    <div className="flex items-center border border-[#C69A39]/30 rounded-lg overflow-hidden bg-[#FDFBF7]">
                      <button
                        onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-xs text-[#23140C] hover:bg-[#F4EFE6] transition cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-7 text-center font-mono text-xs font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-xs text-[#23140C] hover:bg-[#F4EFE6] transition cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer & Checkout Breakdown */}
        {items.length > 0 && (
          <div className="p-5 bg-[#F8F3EA] border-t border-[#C69A39]/30 space-y-3.5">
            {/* Coupon Code Box */}
            <div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-2 text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      Coupon <strong>{appliedCoupon.code}</strong> applied (-₹{appliedCoupon.discountAmount.toLocaleString('en-IN')})
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-stone-500 hover:text-red-700 font-semibold text-xs ml-2"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter Coupon (e.g. ROYAL10)"
                    className="flex-1 bg-white border border-[#C69A39]/40 rounded-xl px-3 py-2 text-xs uppercase placeholder:normal-case font-mono focus:outline-none focus:border-[#C69A39]"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isApplying || !couponInput.trim()}
                    className="bg-[#23140C] text-[#E7C979] hover:bg-[#3D2214] text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {isApplying ? 'Checking...' : 'Apply'}
                  </button>
                </div>
              )}

              {couponError && <p className="text-[11px] text-rose-600 mt-1">{couponError}</p>}
              {couponSuccess && <p className="text-[11px] text-emerald-700 mt-1">{couponSuccess}</p>}
            </div>

            {/* Price Calculations */}
            <div className="space-y-1.5 text-xs text-[#23140C]">
              <div className="flex justify-between">
                <span className="text-stone-600">Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount</span>
                  <span>-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-stone-600">Insured Delivery</span>
                <span>
                  {shippingFee === 0 ? (
                    <strong className="text-emerald-700">FREE</strong>
                  ) : (
                    `₹${shippingFee}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-stone-500">
                <span>Applicable GST (3%)</span>
                <span>Included in price</span>
              </div>

              <div className="pt-2 border-t border-[#C69A39]/30 flex justify-between items-baseline">
                <span className="font-serif font-bold text-sm text-[#23140C]">Total Payable</span>
                <span className="font-serif font-extrabold text-lg text-[#9A7420]">
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Direct UPI Checkout Button */}
            <button
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
              className="w-full bg-gradient-to-r from-[#D4AF37] via-[#C69A39] to-[#AA7A1E] text-[#170B05] font-serif font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:brightness-105 transition cursor-pointer"
            >
              <span>Pay via UPI & Complete Order</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Insured Delivery • BIS 916 Hallmark Guaranteed</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
