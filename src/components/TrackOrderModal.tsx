import React, { useState } from 'react';
import { X, Search, CheckCircle, Clock, Truck, Package, AlertCircle, FileText, MessageCircle } from 'lucide-react';
import { api } from '../services/api.ts';
import type { Order } from '../types/index.ts';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrintInvoice?: (order: Order) => void;
  initialOrderNumber?: string;
  whatsappNumber?: string;
}

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({
  isOpen,
  onClose,
  onPrintInvoice,
  initialOrderNumber = '',
  whatsappNumber = '+91 94402 18999',
}) => {
  const [query, setQuery] = useState(initialOrderNumber);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [utrInput, setUtrInput] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [utrSuccess, setUtrSuccess] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (searchVal?: string) => {
    const q = searchVal || query.trim();
    if (!q) return;
    setIsLoading(true);
    setError('');
    setUtrSuccess('');
    try {
      const res = await api.trackOrder(q);
      setOrder(res);
    } catch (err: any) {
      setError(err.message || 'No order found matching your search. Please check the order number or contact WhatsApp support.');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitUtr = async () => {
    if (!order || !utrInput.trim()) return;
    setIsSubmittingUtr(true);
    try {
      const res = await api.submitUtrNumber(order.orderNumber, utrInput.trim());
      setOrder(res.order);
      setUtrSuccess('UTR reference submitted successfully. Our accounts team will verify your payment shortly.');
      setUtrInput('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit UTR');
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  const getStepStatus = (stepIndex: number) => {
    if (!order) return 'upcoming';

    if (order.orderStatus === 'cancelled') return 'cancelled';

    // Step 0: Order Placed
    if (stepIndex === 0) return 'completed';

    // Step 1: UPI Payment Verification
    if (stepIndex === 1) {
      if (order.paymentStatus === 'verified') return 'completed';
      if (order.paymentStatus === 'submitted_verification') return 'current';
      return 'pending';
    }

    // Step 2: Quality Inspection & Hallmarking
    if (stepIndex === 2) {
      if (['processing', 'shipped', 'delivered'].includes(order.orderStatus)) return 'completed';
      if (order.orderStatus === 'confirmed') return 'current';
      return 'upcoming';
    }

    // Step 3: Insured Dispatch
    if (stepIndex === 3) {
      if (['shipped', 'delivered'].includes(order.orderStatus)) return 'completed';
      if (order.orderStatus === 'processing') return 'current';
      return 'upcoming';
    }

    // Step 4: Delivered
    if (stepIndex === 4) {
      if (order.orderStatus === 'delivered') return 'completed';
      return 'upcoming';
    }

    return 'upcoming';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#FDFBF7] rounded-3xl shadow-2xl border border-[#C69A39]/40 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#23140C] text-[#FDFBF7] p-5 flex items-center justify-between border-b border-[#C69A39]/30">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#FDFBF7] tracking-wider">
              Track Your MPR Order
            </h3>
            <p className="text-xs text-[#E7C979]">
              Live status, UPI payment verification & courier tracking
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#FDFBF7] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-5 bg-white border-b border-[#C69A39]/20">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Enter Order Number (e.g. MPR-2026-8901) or Phone..."
              className="flex-1 bg-[#FDFBF7] border border-[#C69A39]/40 rounded-xl px-4 py-2.5 text-sm font-mono text-[#23140C] focus:outline-none focus:border-[#C69A39]"
            />
            <button
              onClick={() => handleSearch()}
              disabled={isLoading || !query.trim()}
              className="bg-[#23140C] hover:bg-[#3D2214] text-[#E7C979] text-xs font-semibold px-5 py-2.5 rounded-xl border border-[#C69A39]/40 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>Track</span>
            </button>
          </div>

          {error && (
            <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Order Details Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {order ? (
            <>
              {/* Order Overview Card */}
              <div className="bg-white p-4 rounded-2xl border border-[#C69A39]/25 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase font-mono tracking-wider">
                      Order Reference
                    </span>
                    <h4 className="font-serif font-bold text-base text-[#23140C]">
                      {order.orderNumber}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${
                        order.paymentStatus === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.paymentStatus === 'submitted_verification'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      Payment: {order.paymentStatus.replace('_', ' ')}
                    </span>
                    <span className="text-xs bg-[#23140C] text-[#E7C979] px-2.5 py-1 rounded-full font-semibold capitalize">
                      {order.orderStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-stone-500 text-[10px] block">Customer</span>
                    <strong className="text-[#23140C]">{order.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[10px] block">Placed On</span>
                    <strong className="text-[#23140C]">{new Date(order.createdAt).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[10px] block">Total Amount</span>
                    <strong className="text-[#9A7420] font-serif font-bold">
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[10px] block">City, State</span>
                    <strong className="text-[#23140C]">
                      {order.shippingAddress.city}, {order.shippingAddress.state}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Progress Milestones Tracker */}
              <div className="bg-white p-5 rounded-2xl border border-[#C69A39]/25 shadow-xs">
                <h5 className="font-serif font-bold text-sm text-[#23140C] mb-4">
                  Order Fulfillment Status
                </h5>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#C69A39]/30">
                  {/* Step 1: Placed */}
                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h6 className="font-semibold text-xs text-[#23140C]">1. Order Registered</h6>
                      <p className="text-[11px] text-stone-500">
                        Items reserved from MPR vault inventory.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: UPI Payment */}
                  <div className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        order.paymentStatus === 'verified'
                          ? 'bg-emerald-600 text-white'
                          : order.paymentStatus === 'submitted_verification'
                          ? 'bg-amber-500 text-white'
                          : 'bg-stone-300 text-stone-600'
                      }`}
                    >
                      {order.paymentStatus === 'verified' ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                    </div>
                    <div>
                      <h6 className="font-semibold text-xs text-[#23140C]">
                        2. UPI Payment Verification
                      </h6>
                      <p className="text-[11px] text-stone-500">
                        {order.paymentStatus === 'verified' ? (
                          <span className="text-emerald-700 font-medium">
                            ✓ Verified by accounts desk (UTR: {order.upiPaymentDetails?.utrNumber})
                          </span>
                        ) : order.paymentStatus === 'submitted_verification' ? (
                          <span className="text-amber-700 font-medium">
                            Awaiting bank ledger verification for UTR {order.upiPaymentDetails?.utrNumber}
                          </span>
                        ) : (
                          <span className="text-rose-700">
                            Payment pending. Please submit your 12-digit UTR below.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Hallmarking & Packaging */}
                  <div className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.orderStatus)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-300 text-stone-600'
                      }`}
                    >
                      <Package className="w-3 h-3" />
                    </div>
                    <div>
                      <h6 className="font-semibold text-xs text-[#23140C]">
                        3. BIS 916 Quality Assay & Tamper-Proof Packaging
                      </h6>
                      <p className="text-[11px] text-stone-500">
                        Precision laser hallmarking inspection and transit seal packaging.
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Dispatched */}
                  <div className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        ['shipped', 'delivered'].includes(order.orderStatus)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-300 text-stone-600'
                      }`}
                    >
                      <Truck className="w-3 h-3" />
                    </div>
                    <div>
                      <h6 className="font-semibold text-xs text-[#23140C]">
                        4. Insured Pan-India Transit
                      </h6>
                      {order.trackingDetails?.trackingNumber ? (
                        <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                          Carrier: {order.trackingDetails.carrier || 'BlueDart Express'} • AWB: {order.trackingDetails.trackingNumber}
                        </p>
                      ) : (
                        <p className="text-[11px] text-stone-500">
                          Dispatched within 24 hours after payment verification.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* UTR Submission Box if payment is pending */}
              {order.paymentStatus === 'pending' && (
                <div className="bg-[#F8F3EA] p-4 rounded-2xl border border-[#C69A39]/40 space-y-3">
                  <div>
                    <h5 className="font-serif font-bold text-xs text-[#23140C]">
                      Have you completed your UPI payment?
                    </h5>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      Enter the 12-digit UTR / UPI Transaction Reference from PhonePe / GPay / Paytm:
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={utrInput}
                      onChange={e => setUtrInput(e.target.value)}
                      placeholder="12-digit UTR (e.g. 608934521099)"
                      className="flex-1 bg-white border border-[#C69A39]/40 rounded-xl px-3 py-2 text-xs font-mono text-[#23140C] focus:outline-none focus:border-[#C69A39]"
                    />
                    <button
                      onClick={handleSubmitUtr}
                      disabled={isSubmittingUtr || !utrInput.trim()}
                      className="bg-[#23140C] text-[#E7C979] text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingUtr ? 'Submitting...' : 'Submit UTR'}
                    </button>
                  </div>

                  {utrSuccess && (
                    <p className="text-[11px] text-emerald-700 font-medium">{utrSuccess}</p>
                  )}
                </div>
              )}

              {/* Action Buttons: Invoice & WhatsApp Support */}
              <div className="flex flex-wrap gap-2 pt-2">
                {onPrintInvoice && (
                  <button
                    onClick={() => onPrintInvoice(order)}
                    className="flex-1 bg-white hover:bg-[#F8F3EA] text-[#23140C] text-xs font-semibold py-2.5 px-3 rounded-xl border border-[#C69A39]/40 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#C69A39]" />
                    <span>View / Print Invoice</span>
                  </button>
                )}

                <a
                  href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Namaste MPR Jewellers, I am inquiring about my Order: ${order.orderNumber}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#23140C] hover:bg-[#3D2214] text-[#E7C979] text-xs font-semibold py-2.5 px-3 rounded-xl border border-[#C69A39]/40 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp Concierge</span>
                </a>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-stone-500 space-y-2">
              <Search className="w-8 h-8 mx-auto text-[#C69A39]/60" />
              <p className="text-xs">
                Enter your Order Number above to track status and submit UPI UTR.
              </p>
              <p className="text-[11px] text-stone-400">
                Sample Order: <code className="text-[#23140C] font-bold">MPR-2026-8901</code> or <code className="text-[#23140C] font-bold">MPR-2026-8902</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
