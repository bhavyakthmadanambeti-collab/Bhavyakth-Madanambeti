import React, { useState } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Clock,
  Smartphone,
  AlertCircle,
  FileText,
  MessageCircle,
  Info,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import type { CartItem, Address, UPISettings, PricingSettings, Order } from '../types/index.ts';
import { api } from '../services/api.ts';

interface CheckoutPageProps {
  items: CartItem[];
  appliedCoupon: { code: string; discountAmount: number } | null;
  pricing: PricingSettings;
  upiSettings: UPISettings;
  onOrderCompleted: (order: Order) => void;
  onBackToShop: () => void;
  onPrintInvoice: (order: Order) => void;
  whatsappNumber?: string;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  items,
  appliedCoupon,
  pricing,
  upiSettings,
  onOrderCompleted,
  onBackToShop,
  onPrintInvoice,
  whatsappNumber = '+91 94402 18999',
}) => {
  // Step: 1 = Shipping, 2 = Payment, 3 = Confirm
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Customer Form
  const [addressForm, setAddressForm] = useState<Address>({
    fullName: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Telangana',
    pincode: '',
    landmark: '',
  });

  const [formError, setFormError] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // UPI State
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [utrError, setUtrError] = useState('');

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const isFreeDelivery = subtotal >= pricing.freeDeliveryThreshold;
  const shippingFee = items.length === 0 ? 0 : isFreeDelivery ? 0 : pricing.deliveryCharge;
  const totalAmount = Math.max(0, subtotal - discount + shippingFee);

  const indianStates = [
    'Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Maharashtra',
    'Delhi', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'West Bengal',
    'Kerala', 'Madhya Pradesh', 'Punjab', 'Haryana', 'Odisha', 'Bihar',
  ];

  const payeeUPI = upiSettings.upiId || 'mprjewellery@okicici';
  const payeeName = upiSettings.payeeName || 'MPR JEWELLERY';
  const orderNumber = createdOrder?.orderNumber || 'MPR-ORDER';

  // Standard UPI URI format
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(payeeUPI)}&pn=${encodeURIComponent(payeeName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Order ${orderNumber}`)}`;
  const phonePeLink = `phonepe://pay?pa=${encodeURIComponent(payeeUPI)}&pn=${encodeURIComponent(payeeName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Order ${orderNumber}`)}`;
  const gPayLink = `gpay://upi/pay?pa=${encodeURIComponent(payeeUPI)}&pn=${encodeURIComponent(payeeName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Order ${orderNumber}`)}`;
  const paytmLink = `paytmmp://pay?pa=${encodeURIComponent(payeeUPI)}&pn=${encodeURIComponent(payeeName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Order ${orderNumber}`)}`;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(payeeUPI);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(totalAmount.toString());
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!addressForm.fullName.trim() || !addressForm.phone.trim() || !addressForm.addressLine1.trim() || !addressForm.pincode.trim()) {
      setFormError('Please fill in your name, contact phone number, street address, and 6-digit postal pincode.');
      return;
    }

    if (addressForm.phone.replace(/[^0-9]/g, '').length < 10) {
      setFormError('Please enter a valid 10-digit Indian phone number for delivery verification.');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const res = await api.createOrder({
        customerName: addressForm.fullName,
        customerEmail: addressForm.email || `${addressForm.phone}@customer.mpr`,
        customerPhone: addressForm.phone,
        shippingAddress: addressForm,
        items,
        couponCode: appliedCoupon?.code,
      });

      setCreatedOrder(res.order);
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setFormError(err.message || 'Failed to initialize order');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleSubmitUtrVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdOrder) return;
    setUtrError('');

    if (!utrNumber.trim() || utrNumber.trim().length < 6) {
      setUtrError('Please enter the 12-digit UPI UTR / Transaction Reference number from your banking receipt.');
      return;
    }

    setIsSubmittingUtr(true);
    try {
      const res = await api.submitUtrNumber(
        createdOrder.orderNumber,
        utrNumber.trim(),
        paymentNote.trim(),
        screenshotUrl.trim()
      );
      setCreatedOrder(res.order);
      setCurrentStep(3);
      onOrderCompleted(res.order);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setUtrError(err.message || 'Error submitting UTR reference');
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 sm:py-12 px-4 sm:px-6 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Top Header & Breadcrumb */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-stone-200">
          <button
            onClick={onBackToShop}
            className="text-xs font-semibold text-[#541228] hover:text-[#781B3C] flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Lock className="w-3.5 h-3.5 text-stone-400" />
            <span>256-Bit SSL Encrypted Checkout</span>
          </div>
        </div>

        {/* 3-Step Stepper (Aligned with Reference Layout) */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="flex items-center justify-between relative">
            {/* Step 1: Shipping */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition shadow-xs ${
                  currentStep >= 1
                    ? 'bg-[#541228] text-white ring-4 ring-[#541228]/15'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span
                className={`mt-2 text-xs font-semibold tracking-wide ${
                  currentStep >= 1 ? 'text-[#541228]' : 'text-stone-400'
                }`}
              >
                Shipping
              </span>
            </div>

            {/* Connecting Line 1 */}
            <div
              className={`flex-1 h-0.5 mx-2 -mt-5 transition-colors ${
                currentStep >= 2 ? 'bg-[#541228]' : 'bg-stone-200'
              }`}
            />

            {/* Step 2: Payment */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition shadow-xs ${
                  currentStep >= 2
                    ? 'bg-[#541228] text-white ring-4 ring-[#541228]/15'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <span
                className={`mt-2 text-xs font-semibold tracking-wide ${
                  currentStep >= 2 ? 'text-[#541228]' : 'text-stone-400'
                }`}
              >
                Payment
              </span>
            </div>

            {/* Connecting Line 2 */}
            <div
              className={`flex-1 h-0.5 mx-2 -mt-5 transition-colors ${
                currentStep >= 3 ? 'bg-[#541228]' : 'bg-stone-200'
              }`}
            />

            {/* Step 3: Confirm */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition shadow-xs ${
                  currentStep === 3
                    ? 'bg-[#541228] text-white ring-4 ring-[#541228]/15'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                3
              </div>
              <span
                className={`mt-2 text-xs font-semibold tracking-wide ${
                  currentStep === 3 ? 'text-[#541228]' : 'text-stone-400'
                }`}
              >
                Confirm
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* STEP 1: SHIPPING & ADDRESS */}
        {/* ============================================================== */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Form */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
              <div>
                <span className="text-[11px] uppercase font-bold text-[#C69A39] tracking-wider block mb-1">
                  Step 1 of 3
                </span>
                <h2 className="font-serif font-bold text-2xl text-[#240612]">
                  Shipping Address
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  All jewellery packages are shipped with insured logistics and OTP signature on delivery.
                </p>
              </div>

              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleProceedToPayment} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={addressForm.fullName}
                      onChange={e => setAddressForm({ ...addressForm, fullName: e.target.value })}
                      placeholder="e.g. Priya Sharma"
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-[#541228] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">
                      Mobile Number (OTP Delivery) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={addressForm.phone}
                      onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })}
                      placeholder="e.g. 98765 43210"
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-[#541228] focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Email Address (For Tax Invoice & Tracking)
                  </label>
                  <input
                    type="email"
                    value={addressForm.email}
                    onChange={e => setAddressForm({ ...addressForm, email: e.target.value })}
                    placeholder="e.g. priya.sharma@example.com"
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-[#541228] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Address Line 1 (Flat, House No., Building) *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.addressLine1}
                    onChange={e => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                    placeholder="e.g. Flat 302, Sri Krishna Heights"
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-[#541228] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Address Line 2 (Street, Area, Landmark)
                  </label>
                  <input
                    type="text"
                    value={addressForm.addressLine2}
                    onChange={e => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                    placeholder="e.g. Near Jubilee Hills Checkpost"
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-[#541228] focus:bg-white transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">
                      City / Town *
                    </label>
                    <input
                      type="text"
                      required
                      value={addressForm.city}
                      onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                      placeholder="e.g. Hyderabad"
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-[#541228] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">
                      State *
                    </label>
                    <select
                      value={addressForm.state}
                      onChange={e => setAddressForm({ ...addressForm, state: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-[#541228] focus:bg-white cursor-pointer"
                    >
                      {indianStates.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={addressForm.pincode}
                      onChange={e => setAddressForm({ ...addressForm, pincode: e.target.value })}
                      placeholder="e.g. 500033"
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-stone-900 focus:outline-none focus:border-[#541228] focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmittingOrder || items.length === 0}
                    className="w-full bg-[#541228] hover:bg-[#3D0A1C] text-white font-medium text-sm py-3.5 rounded-full shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingOrder ? 'Preparing Order...' : 'Proceed to Payment →'}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Summary Card */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-base text-[#240612] pb-3 border-b border-stone-100">
                Order Summary ({items.reduce((s, i) => s + i.quantity, 0)} Items)
              </h3>

              <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto pr-1 space-y-3">
                {items.map(item => (
                  <div key={item.productId} className="pt-3 flex gap-3">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-14 h-14 object-cover rounded-xl border border-stone-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif font-semibold text-xs text-stone-900 truncate">
                        {item.product.name}
                      </h4>
                      <div className="text-[10px] text-stone-500">
                        {item.product.purity} • Qty: {item.quantity}
                      </div>
                      <div className="font-serif font-bold text-xs text-[#541228] mt-0.5">
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-stone-200 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span>-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Shipping</span>
                  <span>
                    {shippingFee === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-stone-500">
                  <span>Taxes (GST 3%)</span>
                  <span>Included</span>
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline font-serif font-bold">
                  <span className="text-sm text-[#240612]">Total Amount</span>
                  <span className="text-xl text-[#541228]">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-stone-200 text-[11px] text-stone-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C69A39] shrink-0" />
                <span>100% Insured Delivery with Hallmark Guarantee.</span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 2: PAYMENT METHOD (MATCHES EXACT REFERENCE BOTTOM-RIGHT) */}
        {/* ============================================================== */}
        {currentStep === 2 && createdOrder && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Payment Method & Details */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
              <div>
                <h2 className="font-serif font-bold text-2xl text-[#240612]">
                  Payment Method
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Order Reference: <strong className="font-mono text-[#541228]">{createdOrder.orderNumber}</strong>
                </p>
              </div>

              {/* UPI Option Radio Card (Active Selected) */}
              <div className="rounded-2xl border-2 border-[#541228] bg-[#FDF8F9] p-4.5 sm:p-5 flex items-start justify-between relative shadow-xs">
                <div className="flex items-start gap-3.5">
                  {/* Selected Radio Dot */}
                  <div className="w-5 h-5 rounded-full border-2 border-[#541228] flex items-center justify-center mt-0.5 shrink-0 bg-white">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#541228]" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-[#240612]">
                      UPI (Manual Payment)
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Pay using any UPI app (GPay, PhonePe, Paytm, etc.)
                    </p>
                  </div>
                </div>

                {/* UPI Badge */}
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-stone-200 shadow-xs shrink-0">
                  <span className="font-mono font-black text-xs tracking-wider text-[#541228]">UPI</span>
                </div>
              </div>

              {/* Blue Alert / Guidance Box */}
              <div className="rounded-xl bg-[#EBF5FB] border border-[#BEE3F8] p-3.5 text-xs text-[#1A4971] flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#2B6CB0] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  After payment, please click &apos;Verify Payment&apos; to confirm your order.
                </p>
              </div>

              {/* Copyable UPI ID Box */}
              <div className="rounded-xl bg-[#FAF8F5] border border-stone-200 p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                    Merchant UPI ID
                  </span>
                  <div className="font-mono font-bold text-sm text-stone-900 mt-0.5">
                    UPI ID: <span className="text-[#541228]">{payeeUPI}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUPI}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* QR Code & Mobile Launch Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 items-center">
                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-stone-200 flex flex-col items-center text-center">
                  <div className="w-36 h-36 bg-white p-2 rounded-xl shadow-xs border border-stone-200 flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        upiDeepLink
                      )}`}
                      alt="UPI Payment QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-stone-700 mt-2">
                    Scan with any UPI app
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-stone-700 block mb-1">
                    Direct App Launch (Mobile):
                  </span>
                  <a
                    href={gPayLink}
                    className="w-full p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-center text-xs font-semibold text-blue-900 transition flex items-center justify-center gap-1.5"
                  >
                    <span>Google Pay</span>
                  </a>
                  <a
                    href={phonePeLink}
                    className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-center text-xs font-semibold text-purple-900 transition flex items-center justify-center gap-1.5"
                  >
                    <span>PhonePe</span>
                  </a>
                  <a
                    href={paytmLink}
                    className="w-full p-2.5 rounded-xl border border-cyan-200 bg-cyan-50/70 hover:bg-cyan-100 text-center text-xs font-semibold text-cyan-900 transition flex items-center justify-center gap-1.5"
                  >
                    <span>Paytm</span>
                  </a>
                </div>
              </div>

              {/* UTR Verification Form */}
              <form onSubmit={handleSubmitUtrVerification} className="pt-2 border-t border-stone-100 space-y-4">
                {utrError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{utrError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-stone-800 font-semibold text-xs mb-1">
                    12-Digit UPI Transaction / UTR Reference Number *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={18}
                    value={utrNumber}
                    onChange={e => setUtrNumber(e.target.value.replace(/[^0-9A-Za-z]/g, ''))}
                    placeholder="e.g. 608934521099"
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-4 py-3 text-base font-mono font-bold text-stone-900 tracking-wider focus:outline-none focus:border-[#541228] focus:bg-white transition"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    You will receive this reference in your UPI app receipt immediately after payment.
                  </p>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSubmittingUtr || !utrNumber.trim()}
                    className="w-full bg-[#541228] hover:bg-[#3D0A1C] text-white font-medium text-sm py-3.5 rounded-full shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingUtr ? 'Verifying Reference...' : 'Proceed to Payment →'}
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Summary in Payment Step */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-base text-[#240612] pb-3 border-b border-stone-100">
                Payment Summary
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Order Number</span>
                  <span className="font-mono font-bold text-stone-900">{createdOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Customer</span>
                  <span>{createdOrder.customerName}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Phone</span>
                  <span>{createdOrder.customerPhone}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Deliver To</span>
                  <span className="text-right max-w-[200px] truncate">{createdOrder.shippingAddress.city}, {createdOrder.shippingAddress.state}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span>-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Shipping</span>
                  <span>{shippingFee === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${shippingFee}`}</span>
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline font-serif font-bold">
                  <span className="text-sm text-[#240612]">Amount Due</span>
                  <span className="text-xl text-[#541228]">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-stone-200 text-[11px] text-stone-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C69A39] shrink-0" />
                <span>Zero gateway convenience fee on direct UPI transfers.</span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 3: ORDER CONFIRMATION */}
        {/* ============================================================== */}
        {currentStep === 3 && createdOrder && (
          <div className="max-w-2xl mx-auto bg-white p-6 sm:p-10 rounded-2xl border border-stone-200 shadow-md text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] uppercase font-bold text-emerald-700 tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Payment Received & Registered
              </span>
              <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#240612] mt-2">
                Thank You for Your Order!
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-md mx-auto">
                Order <strong className="font-mono text-[#541228]">{createdOrder.orderNumber}</strong> has been received with UPI Reference <strong className="font-mono text-stone-900">{createdOrder.upiPaymentDetails?.utrNumber}</strong>.
              </p>
            </div>

            {/* Order Details Summary */}
            <div className="bg-[#FAF8F5] p-5 rounded-xl border border-stone-200 text-left text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-stone-500">Order Number:</span>
                <strong className="font-mono text-stone-900">{createdOrder.orderNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Amount Paid:</span>
                <strong className="font-serif font-bold text-[#541228]">
                  ₹{createdOrder.totalAmount.toLocaleString('en-IN')}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Recipient:</span>
                <span>{createdOrder.customerName} ({createdOrder.customerPhone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Shipping Address:</span>
                <span className="text-right max-w-xs">{createdOrder.shippingAddress.addressLine1}, {createdOrder.shippingAddress.city} - {createdOrder.shippingAddress.pincode}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => onPrintInvoice(createdOrder)}
                className="flex-1 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold py-3 px-4 rounded-full border border-stone-300 flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <FileText className="w-4 h-4 text-[#541228]" />
                <span>Print Invoice</span>
              </button>

              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Namaste MPR JEWELLERY, I have placed Order ${createdOrder.orderNumber} (UPI UTR: ${createdOrder.upiPaymentDetails?.utrNumber}). Kindly confirm dispatch status.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-semibold py-3 px-4 rounded-full flex items-center justify-center gap-2 transition shadow-xs"
              >
                <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                <span>WhatsApp Confirmation</span>
              </a>
            </div>

            <div className="pt-4 border-t border-stone-100 text-xs text-stone-500">
              <button
                onClick={onBackToShop}
                className="text-[#541228] font-semibold hover:underline cursor-pointer"
              >
                Return to Storefront
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
