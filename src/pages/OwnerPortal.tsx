import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  LogOut,
  LayoutDashboard,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  ShoppingBag,
  Sliders,
  DollarSign,
  QrCode,
  FileText,
  Users,
  Settings,
  Key,
  Download,
  Plus,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  AlertTriangle,
  Printer,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Layers,
  ArrowUpDown,
  Save,
} from 'lucide-react';
import { api } from '../services/api.ts';
import type {
  Product,
  Order,
  BrandSettings,
  ContactSettings,
  PricingSettings,
  HomepageSettings,
  UPISettings,
  StoreGeneralSettings,
  Coupon,
  AuditLog,
  CustomerUser,
} from '../types/index.ts';

interface OwnerPortalProps {
  onBackToStore: () => void;
  onPrintInvoice: (order: Order) => void;
}

export const OwnerPortal: React.FC<OwnerPortalProps> = ({
  onBackToStore,
  onPrintInvoice,
}) => {
  // Auth State
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('mpr_owner_token'));
  const [requiresPasswordChange, setRequiresPasswordChange] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState('bhavyakthmadanambeti@gmail.com');
  const [passwordInput, setPasswordInput] = useState('bhavyakth');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Password Change State
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Active Tab
  type TabKey =
    | 'dashboard'
    | 'upi_queue'
    | 'products'
    | 'orders'
    | 'homepage_editor'
    | 'brand'
    | 'contact'
    | 'pricing'
    | 'upi_config'
    | 'coupons'
    | 'customers'
    | 'general_settings'
    | 'change_password'
    | 'audit_logs';

  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  // Loaded Data
  const [analytics, setAnalytics] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [customers, setCustomers] = useState<CustomerUser[]>([]);

  // Settings State
  const [brandForm, setBrandForm] = useState<BrandSettings | null>(null);
  const [contactForm, setContactForm] = useState<ContactSettings | null>(null);
  const [pricingForm, setPricingForm] = useState<PricingSettings | null>(null);
  const [upiForm, setUpiForm] = useState<UPISettings | null>(null);
  const [homepageForm, setHomepageForm] = useState<HomepageSettings | null>(null);
  const [generalForm, setGeneralForm] = useState<StoreGeneralSettings | null>(null);

  // UI notifications
  const [saveStatus, setSaveStatus] = useState<{ text: string; isError: boolean } | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Product Edit Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Order Detail Modal for UPI review
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Shipping Tracking Modal
  const [trackingModalOrder, setTrackingModalOrder] = useState<Order | null>(null);
  const [carrierInput, setCarrierInput] = useState('BlueDart Apex Express');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');

  // New Coupon Form
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponVal, setNewCouponVal] = useState(10);
  const [newCouponMin, setNewCouponMin] = useState(10000);

  // Initial session verification
  useEffect(() => {
    if (token) {
      api.ownerVerifySession(token)
        .then(res => {
          setRequiresPasswordChange(res.requiresPasswordChange);
          loadDashboardData(token);
        })
        .catch(() => {
          localStorage.removeItem('mpr_owner_token');
          setToken(null);
        });
    }
  }, [token]);

  const loadDashboardData = async (tok: string) => {
    setIsLoadingData(true);
    try {
      const [analyticsData, ordersData, productsData, settingsData, couponsData, logsData, customersData] = await Promise.all([
        api.ownerGetAnalytics(tok),
        api.ownerGetOrders(tok),
        api.getProducts(),
        api.getSettings(),
        api.ownerGetCoupons(tok),
        api.ownerGetAuditLogs(tok),
        api.ownerGetCustomers(tok),
      ]);

      setAnalytics(analyticsData);
      setOrders(ordersData);
      setProducts(productsData);
      setBrandForm(settingsData.brand);
      setContactForm(settingsData.contact);
      setPricingForm(settingsData.pricing);
      setUpiForm(settingsData.upi);
      setHomepageForm(settingsData.homepage);
      setGeneralForm(settingsData.general);
      setCoupons(couponsData);
      setAuditLogs(logsData);
      setCustomers(customersData);
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const showNotification = (text: string, isError = false) => {
    setSaveStatus({ text, isError });
    setTimeout(() => setSaveStatus(null), 3500);
  };

  // Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await api.ownerLogin(emailInput.trim(), passwordInput);
      localStorage.setItem('mpr_owner_token', res.token);
      setToken(res.token);
      setRequiresPasswordChange(res.requiresPasswordChange);
      loadDashboardData(res.token);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Check credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('mpr_owner_token');
    setToken(null);
    setRequiresPasswordChange(false);
  };

  // Password Change Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setPwdMsg(null);

    if (pwdNew !== pwdConfirm) {
      setPwdMsg({ text: 'New password and confirmation do not match', isError: true });
      return;
    }

    try {
      const res = await api.ownerChangePassword(token, {
        currentPassword: pwdCurrent,
        newPassword: pwdNew,
        confirmPassword: pwdConfirm,
      });
      setRequiresPasswordChange(false);
      setPwdMsg({ text: res.message || 'Password changed successfully!', isError: false });
      setPwdCurrent('');
      setPwdNew('');
      setPwdConfirm('');
      showNotification('Owner credentials secured! First-login requirement cleared.');
    } catch (err: any) {
      setPwdMsg({ text: err.message || 'Failed to update password', isError: true });
    }
  };

  // UPI Verification Handler
  const handleVerifyUpi = async (orderId: string, decision: 'approve' | 'reject') => {
    if (!token) return;
    try {
      await api.ownerVerifyUpiPayment(token, orderId, decision, rejectionReason);
      setInspectingOrder(null);
      setRejectionReason('');
      showNotification(
        decision === 'approve'
          ? 'Payment marked VERIFIED! Order confirmed and inventory deducted.'
          : 'Payment marked REJECTED. Customer notified.'
      );
      loadDashboardData(token);
    } catch (err: any) {
      showNotification(err.message || 'Failed to update payment status', true);
    }
  };

  // Update Order Status Handler
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!token) return;
    try {
      await api.ownerUpdateOrderStatus(token, orderId, { orderStatus: newStatus });
      showNotification(`Order status updated to ${newStatus}`);
      loadDashboardData(token);
    } catch (err: any) {
      showNotification(err.message || 'Failed to update status', true);
    }
  };

  // Add Tracking Details
  const handleAddTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !trackingModalOrder) return;
    try {
      await api.ownerUpdateOrderStatus(token, trackingModalOrder.id, {
        orderStatus: 'shipped',
        carrier: carrierInput,
        trackingNumber: trackingNumberInput,
      });
      setTrackingModalOrder(null);
      setTrackingNumberInput('');
      showNotification('Shipment tracking saved and order marked as SHIPPED!');
      loadDashboardData(token);
    } catch (err: any) {
      showNotification(err.message || 'Failed to save tracking', true);
    }
  };

  // Save Settings Handlers
  const handleSaveBrand = async () => {
    if (!token || !brandForm) return;
    try {
      await api.ownerUpdateBrandSettings(token, brandForm);
      showNotification('Brand styling and logo settings saved!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to save', true);
    }
  };

  const handleSaveContact = async () => {
    if (!token || !contactForm) return;
    try {
      await api.ownerUpdateContactSettings(token, contactForm);
      showNotification('Contact and showroom information saved!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to save', true);
    }
  };

  const handleSavePricing = async () => {
    if (!token || !pricingForm) return;
    try {
      await api.ownerUpdatePricingSettings(token, pricingForm);
      showNotification('Live bullion rates and GST pricing rules saved!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to save', true);
    }
  };

  const handleSaveUpi = async () => {
    if (!token || !upiForm) return;
    try {
      await api.ownerUpdateUpiSettings(token, upiForm);
      showNotification('Direct UPI credentials and instructions saved!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to save', true);
    }
  };

  const handleSaveHomepage = async () => {
    if (!token || !homepageForm) return;
    try {
      await api.ownerUpdateHomepageSettings(token, homepageForm);
      showNotification('Homepage hero banners and section configuration saved!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to save', true);
    }
  };

  const handleSaveGeneral = async () => {
    if (!token || !generalForm) return;
    try {
      await api.ownerUpdateGeneralSettings(token, generalForm);
      showNotification('General store policies and availability saved!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to save', true);
    }
  };

  // Section Ordering Toggle
  const toggleSectionEnabled = (sectionId: string) => {
    if (!homepageForm) return;
    const updated = homepageForm.sections.map(s =>
      s.id === sectionId ? { ...s, enabled: !s.enabled } : s
    );
    setHomepageForm({ ...homepageForm, sections: updated });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (!homepageForm) return;
    const newSections = [...homepageForm.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    // re-assign order numbers
    newSections.forEach((s, idx) => {
      s.order = idx + 1;
    });

    setHomepageForm({ ...homepageForm, sections: newSections });
  };

  // Product Save & Archive
  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingProduct) return;
    try {
      await api.ownerSaveProduct(token, editingProduct, Boolean(editingProduct.id), editingProduct.id);
      setIsProductModalOpen(false);
      setEditingProduct(null);
      showNotification('Product information saved successfully!');
      loadDashboardData(token);
    } catch (err: any) {
      showNotification(err.message || 'Failed to save product', true);
    }
  };

  const handleArchiveProduct = async (id: string) => {
    if (!token || !confirm('Are you sure you want to archive this jewellery piece?')) return;
    try {
      await api.ownerArchiveProduct(token, id);
      showNotification('Product archived');
      loadDashboardData(token);
    } catch (err: any) {
      showNotification(err.message || 'Failed to archive', true);
    }
  };

  // Coupon Create
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newCouponCode.trim()) return;
    try {
      await api.ownerCreateCoupon(token, {
        code: newCouponCode.trim().toUpperCase(),
        discountType: 'percentage',
        discountValue: Number(newCouponVal),
        minOrderValue: Number(newCouponMin),
        isActive: true,
      });
      setNewCouponCode('');
      showNotification('New discount coupon created!');
      loadDashboardData(token);
    } catch (err: any) {
      showNotification(err.message || 'Failed to create coupon', true);
    }
  };

  // ==============================================================
  // VIEW: OWNER LOGIN SCREEN (If not authenticated)
  // ==============================================================
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#170B05] via-[#23140C] to-[#170B05] text-[#FDFBF7] flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-[#23140C]/90 p-8 rounded-3xl border-2 border-[#C69A39]/50 shadow-2xl backdrop-blur-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D23] text-[#170B05] flex items-center justify-center mx-auto shadow-lg border border-[#E7C979]">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="font-cinzel font-black text-2xl tracking-wider text-[#FDFBF7]">
              MPR JEWELLERY
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-[#E7C979] font-medium">
              Owner Administration Portal
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                Owner Email Address:
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="bhavyakthmadanambeti@gmail.com"
                className="w-full bg-[#170B05] border border-[#C69A39]/40 rounded-xl px-4 py-3 text-sm text-[#FDFBF7] focus:outline-none focus:border-[#C69A39]"
              />
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                Owner Password:
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="Initial password: bhavyakth"
                className="w-full bg-[#170B05] border border-[#C69A39]/40 rounded-xl px-4 py-3 text-sm text-[#FDFBF7] focus:outline-none focus:border-[#C69A39]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-[#D4AF37] via-[#C69A39] to-[#AA7A1E] text-[#170B05] font-serif font-bold text-sm py-3.5 rounded-xl shadow-lg hover:brightness-110 transition cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? 'Authenticating...' : 'Secure Owner Sign In →'}
            </button>
          </form>

          <div className="pt-2 border-t border-[#C69A39]/20 text-center">
            <button
              onClick={onBackToStore}
              className="text-xs text-stone-400 hover:text-[#E7C979] transition cursor-pointer"
            >
              ← Return to Customer Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // VIEW: MANDATORY FIRST-LOGIN PASSWORD CHANGE MODAL
  // ==============================================================
  if (requiresPasswordChange) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#170B05] via-[#23140C] to-[#170B05] text-[#FDFBF7] flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-lg bg-[#23140C] p-8 rounded-3xl border-2 border-[#C69A39] shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400 text-amber-300 flex items-center justify-center mx-auto">
              <Key className="w-6 h-6" />
            </div>
            <h2 className="font-cinzel font-bold text-2xl text-[#FDFBF7]">
              First Login Security Setup
            </h2>
            <p className="text-xs text-stone-300 max-w-sm mx-auto">
              As required for store security, you must update the initial password (<code className="text-[#E7C979]">bhavyakth</code>) before accessing the dashboard.
            </p>
          </div>

          {pwdMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                pwdMsg.isError
                  ? 'bg-rose-950/80 border border-rose-600 text-rose-200'
                  : 'bg-emerald-950/80 border border-emerald-600 text-emerald-200'
              }`}
            >
              <span>{pwdMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                Current Password *
              </label>
              <input
                type="password"
                required
                value={pwdCurrent}
                onChange={e => setPwdCurrent(e.target.value)}
                placeholder="Enter current password (bhavyakth)"
                className="w-full bg-[#170B05] border border-[#C69A39]/40 rounded-xl px-4 py-3 text-sm text-[#FDFBF7] focus:outline-none focus:border-[#C69A39]"
              />
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                New Confidential Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={pwdNew}
                onChange={e => setPwdNew(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-[#170B05] border border-[#C69A39]/40 rounded-xl px-4 py-3 text-sm text-[#FDFBF7] focus:outline-none focus:border-[#C69A39]"
              />
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                value={pwdConfirm}
                onChange={e => setPwdConfirm(e.target.value)}
                placeholder="Confirm new password"
                className="w-full bg-[#170B05] border border-[#C69A39]/40 rounded-xl px-4 py-3 text-sm text-[#FDFBF7] focus:outline-none focus:border-[#C69A39]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-[#170B05] font-serif font-bold text-sm py-3.5 rounded-xl shadow-lg hover:brightness-110 transition cursor-pointer"
            >
              Update Password & Unlock Dashboard →
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={handleLogout}
              className="text-xs text-stone-400 hover:text-stone-200 transition"
            >
              Cancel & Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // VIEW: FULL OWNER DASHBOARD
  // ==============================================================
  const pendingUpiOrders = orders.filter(o => o.paymentStatus === 'submitted_verification');

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#23140C] font-sans flex flex-col">
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-40 bg-[#23140C] text-[#FDFBF7] border-b border-[#C69A39]/40 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D23] text-[#170B05] flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-cinzel font-bold text-base text-[#FDFBF7] tracking-wider">
                MPR JEWELLERY OWNER PORTAL
              </h2>
              <span className="text-[10px] bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 px-2 py-0.2 rounded-full font-semibold uppercase">
                Active Admin
              </span>
            </div>
            <p className="text-[10px] text-[#E7C979] font-mono">
              Signed in as: bhavyakthmadanambeti@gmail.com
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadDashboardData(token)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#E7C979] transition cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onBackToStore}
            className="hidden sm:flex items-center gap-1.5 text-xs text-[#E7C979] hover:underline cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </button>

          <button
            onClick={handleLogout}
            className="bg-rose-900/80 hover:bg-rose-900 text-rose-200 text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-rose-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </header>

      {/* Floating Save / Error Toast */}
      {saveStatus && (
        <div
          className={`fixed top-18 right-6 z-50 p-4 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-2 animate-fadeIn ${
            saveStatus.isError
              ? 'bg-rose-900 text-white border-rose-500'
              : 'bg-emerald-900 text-white border-emerald-400'
          }`}
        >
          {saveStatus.isError ? <AlertTriangle className="w-4 h-4 text-rose-300" /> : <CheckCircle className="w-4 h-4 text-emerald-300" />}
          <span>{saveStatus.text}</span>
        </div>
      )}

      {/* Main Admin Workspace (Sidebar + Content) */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-[#1F1209] text-stone-300 p-4 border-r border-[#C69A39]/30 shrink-0 space-y-6">
          <nav className="space-y-1 text-xs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between font-medium transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#C69A39] text-[#170B05] font-bold shadow-sm'
                  : 'hover:bg-[#2A180E] text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard Overview</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('upi_queue')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between font-medium transition cursor-pointer ${
                activeTab === 'upi_queue'
                  ? 'bg-[#C69A39] text-[#170B05] font-bold shadow-sm'
                  : 'hover:bg-[#2A180E] text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <QrCode className="w-4 h-4" />
                <span>UPI Verification</span>
              </div>
              {pendingUpiOrders.length > 0 && (
                <span className="bg-amber-500 text-black text-[10px] font-extrabold px-2 py-0.2 rounded-full">
                  {pendingUpiOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 font-medium transition cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#C69A39] text-[#170B05] font-bold shadow-sm'
                  : 'hover:bg-[#2A180E] text-stone-300'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Orders & Invoices</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 font-medium transition cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-[#C69A39] text-[#170B05] font-bold shadow-sm'
                  : 'hover:bg-[#2A180E] text-stone-300'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Products Treasury</span>
            </button>

            <div className="pt-3 pb-1 border-t border-[#C69A39]/20">
              <span className="text-[10px] uppercase font-bold text-[#E7C979] tracking-wider px-3.5 block mb-1">
                Storefront & Brand
              </span>
            </div>

            <button
              onClick={() => setActiveTab('homepage_editor')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 font-medium transition cursor-pointer ${
                activeTab === 'homepage_editor'
                  ? 'bg-[#C69A39] text-[#170B05] font-bold shadow-sm'
                  : 'hover:bg-[#2A180E] text-stone-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Homepage Editor</span>
            </button>

            <button
              onClick={() => setActiveTab('brand')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 font-medium transition cursor-pointer ${
                activeTab === 'brand'
                  ? 'bg-[#C69A39] text-[#170B05] font-bold shadow-sm'
                  : 'hover:bg-[#2A180E] text-stone-300'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Brand Identity</span>
            </button>

            <button
              onClick={() => setActiveTab('contact')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 font-medium transition cursor-pointer ${
                activeTab === 'contact'
                  ? 'bg-[#C69A39] text-[#170B05] font-bold shadow-sm'
                  : 'hover:bg-[#2A180E] text-stone-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Contact & Showroom</span>
            </button>

            <button
              onClick={() => setActiveTab('pricing')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 font-medium transition cursor-pointer ${
                activeTab === 'pricing'
                  ? 'bg-[#C69A39] text-[#170B05] font-bold shadow-sm'
                  : 'hover:bg-[#2A180E] text-stone-300'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Pricing & Bullion</span>
            </button>

            <button
              onClick={() => setActiveTab('upi_config')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 font-medium transition cursor-pointer ${
                activeTab === 'upi_config'
                  ? 'bg-[#C69A39] text-[#170B05] font-bold shadow-sm'
                  : 'hover:bg-[#2A180E] text-stone-300'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>UPI Payment Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('coupons')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 font-medium transition cursor-pointer ${
                activeTab === 'coupons'
                  ? 'bg-[#C69A39] text-[#170B05] font-bold shadow-sm'
                  : 'hover:bg-[#2A180E] text-stone-300'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Coupons & Offers</span>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 font-medium transition cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-[#C69A39] text-[#170B05] font-bold shadow-sm'
                  : 'hover:bg-[#2A180E] text-stone-300'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customers Directory</span>
            </button>

            <div className="pt-3 pb-1 border-t border-[#C69A39]/20">
              <span className="text-[10px] uppercase font-bold text-[#E7C979] tracking-wider px-3.5 block mb-1">
                Security & System
              </span>
            </div>

            <button
              onClick={() => setActiveTab('general_settings')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 font-medium transition cursor-pointer ${
                activeTab === 'general_settings'
                  ? 'bg-[#C69A39] text-[#170B05] font-bold shadow-sm'
                  : 'hover:bg-[#2A180E] text-stone-300'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>General & Policies</span>
            </button>

            <button
              onClick={() => setActiveTab('change_password')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 font-medium transition cursor-pointer ${
                activeTab === 'change_password'
                  ? 'bg-[#C69A39] text-[#170B05] font-bold shadow-sm'
                  : 'hover:bg-[#2A180E] text-stone-300'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Change Password</span>
            </button>

            <button
              onClick={() => setActiveTab('audit_logs')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 font-medium transition cursor-pointer ${
                activeTab === 'audit_logs'
                  ? 'bg-[#C69A39] text-[#170B05] font-bold shadow-sm'
                  : 'hover:bg-[#2A180E] text-stone-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Audit History</span>
            </button>
          </nav>
        </aside>

        {/* Right Main Body */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {/* ============================================================== */}
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {/* ============================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#C69A39]/30 shadow-xs">
                <div>
                  <h2 className="font-cinzel font-bold text-2xl text-[#23140C]">
                    Sales & Operations Overview
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Live metrics for MPR JEWELLERY online store orders, verified UPI payments, and inventory.
                  </p>
                </div>

                <a
                  href="/api/owner/export-orders-csv"
                  download
                  className="bg-[#23140C] text-[#E7C979] text-xs font-semibold px-4 py-2.5 rounded-xl border border-[#C69A39]/40 flex items-center gap-2 hover:bg-[#3D2214] transition cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Orders CSV</span>
                </a>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-[#C69A39]/25 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>Verified Paid Revenue</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="font-serif font-extrabold text-2xl text-[#23140C]">
                    ₹{(analytics?.totalRevenue || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium">
                    ✓ From {analytics?.verifiedOrdersCount || 0} confirmed orders
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#C69A39]/25 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>Awaiting UPI Verification</span>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="font-serif font-extrabold text-2xl text-amber-700">
                    ₹{(analytics?.pendingVerificationRevenue || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-amber-800 font-medium">
                    {pendingUpiOrders.length} payments pending review
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#C69A39]/25 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>Total Orders Placed</span>
                    <ShoppingBag className="w-4 h-4 text-[#C69A39]" />
                  </div>
                  <div className="font-serif font-extrabold text-2xl text-[#23140C]">
                    {analytics?.totalOrders || 0}
                  </div>
                  <div className="text-[11px] text-stone-500 font-medium">
                    Today: {analytics?.todayOrdersCount || 0} orders
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#C69A39]/25 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>Vault Inventory</span>
                    <Package className="w-4 h-4 text-[#C69A39]" />
                  </div>
                  <div className="font-serif font-extrabold text-2xl text-[#23140C]">
                    {analytics?.totalProducts || 0} Pieces
                  </div>
                  <div className="text-[11px] text-stone-500 font-medium">
                    {analytics?.lowStockCount || 0} items low in stock
                  </div>
                </div>
              </div>

              {/* Pending UPI Verification Alert Banner */}
              {pendingUpiOrders.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-sm text-[#23140C]">
                        {pendingUpiOrders.length} Payments Awaiting Owner Verification
                      </h4>
                      <p className="text-xs text-stone-600">
                        Customers have submitted bank UTR references. Verify in your bank statement and confirm.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('upi_queue')}
                    className="bg-[#23140C] text-[#E7C979] text-xs font-semibold px-5 py-2.5 rounded-xl border border-[#C69A39]/40 hover:bg-[#3D2214] transition cursor-pointer shrink-0"
                  >
                    Open Verification Queue →
                  </button>
                </div>
              )}

              {/* Recent Orders Table */}
              <div className="bg-white p-6 rounded-3xl border border-[#C69A39]/25 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-base text-[#23140C]">
                    Recent Storefront Orders
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-[#9A7420] hover:underline font-semibold"
                  >
                    View All ({orders.length}) →
                  </button>
                </div>

                <div className="border border-stone-200 rounded-2xl overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#23140C] text-[#E7C979] font-serif text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Order #</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Payment</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-700">
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.id} className="hover:bg-stone-50">
                          <td className="py-3 px-4 font-mono font-bold text-[#23140C]">
                            {o.orderNumber}
                          </td>
                          <td className="py-3 px-4">
                            <strong>{o.customerName}</strong>
                            <div className="text-[10px] text-stone-400">{o.customerPhone}</div>
                          </td>
                          <td className="py-3 px-4 font-serif font-bold text-[#9A7420]">
                            ₹{o.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                                o.paymentStatus === 'verified'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : o.paymentStatus === 'submitted_verification'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {o.paymentStatus.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 capitalize font-medium">{o.orderStatus}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setInspectingOrder(o)}
                              className="text-xs text-[#9A7420] hover:underline font-semibold cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: UPI VERIFICATION QUEUE (DIRECT BANK UPI) */}
          {/* ============================================================== */}
          {activeTab === 'upi_queue' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-[#C69A39]/30 shadow-xs">
                <h2 className="font-cinzel font-bold text-2xl text-[#23140C]">
                  UPI Payment Verification Queue
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Inspect submitted UTR references against your bank credits. Only verify orders once funds are confirmed in your bank account.
                </p>
              </div>

              {pendingUpiOrders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 space-y-2">
                  <CheckCircle className="w-10 h-10 mx-auto text-emerald-600" />
                  <h3 className="font-serif font-bold text-base text-[#23140C]">
                    Verification Queue Clean
                  </h3>
                  <p className="text-xs text-stone-500">
                    No pending UPI payments awaiting review right now.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {pendingUpiOrders.map(order => (
                    <div
                      key={order.id}
                      className="bg-white p-5 rounded-2xl border-2 border-amber-300 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#23140C]">
                            {order.orderNumber}
                          </span>
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                            Submitted: {new Date(order.upiPaymentDetails?.submittedAt || order.updatedAt).toLocaleTimeString()}
                          </span>
                        </div>

                        <div className="text-xs space-y-0.5">
                          <div>
                            Customer: <strong>{order.customerName}</strong> ({order.customerPhone})
                          </div>
                          <div>
                            Submitted UTR / Ref:{' '}
                            <strong className="font-mono text-base text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              {order.upiPaymentDetails?.utrNumber || 'N/A'}
                            </strong>
                          </div>
                          {order.upiPaymentDetails?.paymentNote && (
                            <div className="text-stone-500 text-[11px] italic">
                              Note: "{order.upiPaymentDetails.paymentNote}"
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex flex-col md:items-end gap-2 w-full md:w-auto">
                        <div className="font-serif font-bold text-xl text-[#9A7420]">
                          ₹{order.totalAmount.toLocaleString('en-IN')}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVerifyUpi(order.id, 'approve')}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Verify & Confirm</span>
                          </button>

                          <button
                            onClick={() => {
                              setInspectingOrder(order);
                            }}
                            className="bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold px-3 py-2 rounded-xl border border-rose-300 transition cursor-pointer"
                          >
                            Reject
                          </button>

                          <button
                            onClick={() => onPrintInvoice(order)}
                            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#23140C]"
                            title="Print Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: PRODUCTS MANAGEMENT */}
          {/* ============================================================== */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#C69A39]/30 shadow-xs">
                <div>
                  <h2 className="font-cinzel font-bold text-2xl text-[#23140C]">
                    Jewellery Products Treasury ({products.length})
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Manage 22K Gold, VVS Diamonds, and 925 Silver pieces with weights, making charges, and stock.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingProduct({
                      id: '',
                      name: '',
                      slug: '',
                      sku: `MPR-${Date.now().toString().slice(-4)}`,
                      category: 'gold',
                      metal: 'gold',
                      purity: '22K (916 Hallmarked)',
                      price: 150000,
                      grossWeightGrams: 22.5,
                      netWeightGrams: 22.5,
                      description: 'Handcrafted luxury jewellery with BIS hallmark certification.',
                      specifications: {
                        certificate: 'BIS 916 Hallmarked Pure Gold with HUID',
                        makingCharge: '12% Artisanal Karigar',
                      },
                      images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80'],
                      stockQuantity: 5,
                      isFeatured: true,
                      isNewArrival: true,
                      isBestSeller: false,
                      isArchived: false,
                      has3DModel: true,
                      model3DType: 'ring',
                      tags: ['gold', '22k'],
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    });
                    setIsProductModalOpen(true);
                  }}
                  className="bg-[#23140C] text-[#E7C979] text-xs font-semibold px-4 py-2.5 rounded-xl border border-[#C69A39]/40 flex items-center gap-2 hover:bg-[#3D2214] transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Jewellery Piece</span>
                </button>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-3xl border border-[#C69A39]/25 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#23140C] text-[#E7C979] font-serif text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Piece</th>
                      <th className="py-3.5 px-3">Purity & Metal</th>
                      <th className="py-3.5 px-3">Gross Wt.</th>
                      <th className="py-3.5 px-3">Price</th>
                      <th className="py-3.5 px-3">Stock</th>
                      <th className="py-3.5 px-3">3D</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {products.map(prod => (
                      <tr key={prod.id} className="hover:bg-stone-50">
                        <td className="py-3 px-4 flex items-center gap-3">
                          <img
                            src={prod.images[0]}
                            alt={prod.name}
                            className="w-12 h-12 object-cover rounded-xl border border-[#C69A39]/20 shrink-0"
                          />
                          <div>
                            <strong className="text-[#23140C] font-serif block text-xs line-clamp-1">
                              {prod.name}
                            </strong>
                            <span className="text-[10px] text-stone-400 font-mono">
                              SKU: {prod.sku}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="bg-[#F8F3EA] text-[#9A7420] border border-[#C69A39]/30 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {prod.purity}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono">{prod.grossWeightGrams}g</td>
                        <td className="py-3 px-3 font-serif font-bold text-[#23140C]">
                          ₹{prod.price.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`font-mono font-bold ${
                              prod.stockQuantity <= 2 ? 'text-rose-600' : 'text-stone-700'
                            }`}
                          >
                            {prod.stockQuantity}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {prod.has3DModel ? (
                            <span className="text-emerald-700 font-bold text-[10px]">3D Yes</span>
                          ) : (
                            <span className="text-stone-400 text-[10px]">No</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingProduct(prod);
                              setIsProductModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-stone-600 hover:text-[#9A7420] transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleArchiveProduct(prod.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 transition"
                            title="Archive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: ORDERS & INVOICES MANAGEMENT */}
          {/* ============================================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#C69A39]/30 shadow-xs">
                <div>
                  <h2 className="font-cinzel font-bold text-2xl text-[#23140C]">
                    Orders & Shipments Directory ({orders.length})
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Manage customer orders, update tracking numbers, and print compliant tax invoices.
                  </p>
                </div>

                <a
                  href="/api/owner/export-orders-csv"
                  download
                  className="bg-[#23140C] text-[#E7C979] text-xs font-semibold px-4 py-2.5 rounded-xl border border-[#C69A39]/40 flex items-center gap-2 hover:bg-[#3D2214] transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Full CSV</span>
                </a>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-3xl border border-[#C69A39]/25 shadow-xs overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#23140C] text-[#E7C979] font-serif text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-stone-50">
                        <td className="py-3 px-4 font-mono font-bold text-[#23140C]">
                          {order.orderNumber}
                        </td>
                        <td className="py-3 px-4">
                          <strong>{order.customerName}</strong>
                          <div className="text-[10px] text-stone-400">{order.customerPhone}</div>
                        </td>
                        <td className="py-3 px-4">{order.items.length} pcs</td>
                        <td className="py-3 px-4 font-serif font-bold text-[#9A7420]">
                          ₹{order.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                              order.paymentStatus === 'verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.paymentStatus === 'submitted_verification'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {order.paymentStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={order.orderStatus}
                            onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                            className="bg-[#F8F3EA] border border-[#C69A39]/30 rounded-lg px-2 py-1 text-xs text-[#23140C] font-medium cursor-pointer"
                          >
                            <option value="pending_verification">Pending Verification</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing / Assay</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => onPrintInvoice(order)}
                            className="p-1.5 rounded-lg text-stone-600 hover:text-[#9A7420] transition"
                            title="Print Tax Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setTrackingModalOrder(order);
                              setTrackingNumberInput(order.trackingDetails?.trackingNumber || '');
                            }}
                            className="p-1.5 rounded-lg text-stone-600 hover:text-[#9A7420] transition"
                            title="Add Tracking AWB"
                          >
                            <Package className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: HOMEPAGE EDITOR (HERO & SECTIONS REORDER) */}
          {/* ============================================================== */}
          {activeTab === 'homepage_editor' && homepageForm && (
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-3xl border border-[#C69A39]/30 shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="font-cinzel font-bold text-2xl text-[#23140C]">
                    Homepage Section Editor
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Toggle homepage components on/off and reorder them with instant preview updates.
                  </p>
                </div>

                <button
                  onClick={handleSaveHomepage}
                  className="bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-[#170B05] font-serif font-bold text-xs px-5 py-2.5 rounded-xl shadow-md hover:brightness-110 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Homepage Settings</span>
                </button>
              </div>

              {/* Hero Banner Controls */}
              <div className="bg-white p-6 rounded-3xl border border-[#C69A39]/25 shadow-xs space-y-4">
                <h3 className="font-serif font-bold text-base text-[#23140C] pb-2 border-b border-stone-100">
                  Hero Showcase Banner
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">
                      Hero Collection Badge
                    </label>
                    <input
                      type="text"
                      value={homepageForm.hero.collectionBadge}
                      onChange={e =>
                        setHomepageForm({
                          ...homepageForm,
                          hero: { ...homepageForm.hero, collectionBadge: e.target.value },
                        })
                      }
                      className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-[#23140C] focus:outline-none focus:border-[#C69A39]"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">
                      Hero Small Heading
                    </label>
                    <input
                      type="text"
                      value={homepageForm.hero.smallHeading}
                      onChange={e =>
                        setHomepageForm({
                          ...homepageForm,
                          hero: { ...homepageForm.hero, smallHeading: e.target.value },
                        })
                      }
                      className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-[#23140C] focus:outline-none focus:border-[#C69A39]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-stone-600 font-semibold mb-1">
                      Hero Main Title
                    </label>
                    <input
                      type="text"
                      value={homepageForm.hero.mainHeading}
                      onChange={e =>
                        setHomepageForm({
                          ...homepageForm,
                          hero: { ...homepageForm.hero, mainHeading: e.target.value },
                        })
                      }
                      className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-[#23140C] font-serif font-bold text-sm focus:outline-none focus:border-[#C69A39]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-stone-600 font-semibold mb-1">
                      Hero Subtitle / Description
                    </label>
                    <textarea
                      rows={2}
                      value={homepageForm.hero.subtitle}
                      onChange={e =>
                        setHomepageForm({
                          ...homepageForm,
                          hero: { ...homepageForm.hero, subtitle: e.target.value },
                        })
                      }
                      className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-[#23140C] focus:outline-none focus:border-[#C69A39]"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">
                      Hero Image URL
                    </label>
                    <input
                      type="url"
                      value={homepageForm.hero.imageUrl}
                      onChange={e =>
                        setHomepageForm({
                          ...homepageForm,
                          hero: { ...homepageForm.hero, imageUrl: e.target.value },
                        })
                      }
                      className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-[#23140C] focus:outline-none focus:border-[#C69A39]"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">
                      Announcement Bar Notice
                    </label>
                    <input
                      type="text"
                      value={homepageForm.announcementText}
                      onChange={e =>
                        setHomepageForm({
                          ...homepageForm,
                          announcementText: e.target.value,
                        })
                      }
                      className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-[#23140C] focus:outline-none focus:border-[#C69A39]"
                    />
                  </div>
                </div>
              </div>

              {/* Promotional Banners Management Card */}
              <div className="bg-white p-6 rounded-3xl border border-[#C69A39]/25 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#23140C]">
                      Promotional Front-Page Banners
                    </h3>
                    <p className="text-xs text-stone-500">
                      Configure high-impact wedding and seasonal jewellery promotional displays.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newBanner = {
                        id: `promo-${Date.now()}`,
                        title: 'New Royal Campaign',
                        subtitle: 'Exclusive handcrafted masterpieces',
                        badgeText: 'Limited Edition',
                        imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80',
                        buttonText: 'Explore Now',
                        linkUrl: '#/category/wedding',
                        isActive: true,
                        order: (homepageForm.promotionalBanners?.length || 0) + 1,
                      };
                      setHomepageForm({
                        ...homepageForm,
                        promotionalBanners: [...(homepageForm.promotionalBanners || []), newBanner],
                      });
                    }}
                    className="bg-[#23140C] text-[#E7C979] text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#C69A39]/40 hover:bg-[#3D2214] transition"
                  >
                    + Add Promotional Banner
                  </button>
                </div>

                <div className="space-y-4">
                  {(homepageForm.promotionalBanners || []).map((banner, bIdx) => (
                    <div key={banner.id} className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#C69A39]/20 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#23140C] font-serif">Banner #{bIdx + 1}: {banner.title}</span>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer text-stone-700">
                            <input
                              type="checkbox"
                              checked={banner.isActive}
                              onChange={e => {
                                const copy = [...(homepageForm.promotionalBanners || [])];
                                copy[bIdx].isActive = e.target.checked;
                                setHomepageForm({ ...homepageForm, promotionalBanners: copy });
                              }}
                              className="accent-amber-600"
                            />
                            <span>Active</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const copy = (homepageForm.promotionalBanners || []).filter((_, idx) => idx !== bIdx);
                              setHomepageForm({ ...homepageForm, promotionalBanners: copy });
                            }}
                            className="text-stone-400 hover:text-rose-600 p-1"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-stone-600 font-semibold mb-1">Headline</label>
                          <input
                            type="text"
                            value={banner.title}
                            onChange={e => {
                              const copy = [...(homepageForm.promotionalBanners || [])];
                              copy[bIdx].title = e.target.value;
                              setHomepageForm({ ...homepageForm, promotionalBanners: copy });
                            }}
                            className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-stone-600 font-semibold mb-1">Badge Text</label>
                          <input
                            type="text"
                            value={banner.badgeText || ''}
                            onChange={e => {
                              const copy = [...(homepageForm.promotionalBanners || [])];
                              copy[bIdx].badgeText = e.target.value;
                              setHomepageForm({ ...homepageForm, promotionalBanners: copy });
                            }}
                            className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-stone-600 font-semibold mb-1">Banner Image URL</label>
                          <input
                            type="url"
                            value={banner.imageUrl}
                            onChange={e => {
                              const copy = [...(homepageForm.promotionalBanners || [])];
                              copy[bIdx].imageUrl = e.target.value;
                              setHomepageForm({ ...homepageForm, promotionalBanners: copy });
                            }}
                            className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-stone-600 font-semibold mb-1">Target Link URL</label>
                          <input
                            type="text"
                            value={banner.linkUrl}
                            onChange={e => {
                              const copy = [...(homepageForm.promotionalBanners || [])];
                              copy[bIdx].linkUrl = e.target.value;
                              setHomepageForm({ ...homepageForm, promotionalBanners: copy });
                            }}
                            className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-stone-600 font-semibold mb-1">Button Text</label>
                          <input
                            type="text"
                            value={banner.buttonText}
                            onChange={e => {
                              const copy = [...(homepageForm.promotionalBanners || [])];
                              copy[bIdx].buttonText = e.target.value;
                              setHomepageForm({ ...homepageForm, promotionalBanners: copy });
                            }}
                            className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sections Reordering Card */}
              <div className="bg-white p-6 rounded-3xl border border-[#C69A39]/25 shadow-xs space-y-4">
                <h3 className="font-serif font-bold text-base text-[#23140C] pb-2 border-b border-stone-100">
                  Homepage Section Controls & Layout Order
                </h3>

                <div className="space-y-2">
                  {homepageForm.sections.map((section, idx) => (
                    <div
                      key={section.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FDFBF7] border border-[#C69A39]/25 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#23140C] text-[#E7C979] flex items-center justify-center font-mono font-bold text-[10px]">
                          {section.order}
                        </span>
                        <strong className="text-[#23140C] font-serif">{section.name}</strong>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSectionEnabled(section.id)}
                          className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                            section.enabled
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {section.enabled ? 'Enabled' : 'Disabled'}
                        </button>

                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveSection(idx, 'up')}
                          className="p-1 rounded bg-stone-100 hover:bg-stone-200 disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          disabled={idx === homepageForm.sections.length - 1}
                          onClick={() => moveSection(idx, 'down')}
                          className="p-1 rounded bg-stone-100 hover:bg-stone-200 disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 6: BRAND IDENTITY SETTINGS */}
          {/* ============================================================== */}
          {activeTab === 'brand' && brandForm && (
            <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-[#C69A39]/30 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h2 className="font-cinzel font-bold text-2xl text-[#23140C]">Brand Identity</h2>
                  <p className="text-xs text-stone-500">Configure logo text, brand name, and colors.</p>
                </div>
                <button
                  onClick={handleSaveBrand}
                  className="bg-[#23140C] text-[#E7C979] text-xs font-semibold px-4 py-2 rounded-xl border border-[#C69A39]/40 hover:bg-[#3D2214] transition cursor-pointer"
                >
                  Save Brand
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Brand Name *</label>
                  <input
                    type="text"
                    value={brandForm.brandName}
                    onChange={e => setBrandForm({ ...brandForm, brandName: e.target.value })}
                    className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-sm font-serif font-bold text-[#23140C]"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Tagline</label>
                  <input
                    type="text"
                    value={brandForm.tagline}
                    onChange={e => setBrandForm({ ...brandForm, tagline: e.target.value })}
                    className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs text-[#23140C]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Primary Color</label>
                    <input
                      type="text"
                      value={brandForm.primaryColor}
                      onChange={e => setBrandForm({ ...brandForm, primaryColor: e.target.value })}
                      className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Gold Accent Color</label>
                    <input
                      type="text"
                      value={brandForm.accentColor}
                      onChange={e => setBrandForm({ ...brandForm, accentColor: e.target.value })}
                      className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 7: CONTACT & SHOWROOM */}
          {/* ============================================================== */}
          {activeTab === 'contact' && contactForm && (
            <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-[#C69A39]/30 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h2 className="font-cinzel font-bold text-2xl text-[#23140C]">Showroom & Contact Details</h2>
                  <p className="text-xs text-stone-500">Update phone, WhatsApp concierge, and store address.</p>
                </div>
                <button
                  onClick={handleSaveContact}
                  className="bg-[#23140C] text-[#E7C979] text-xs font-semibold px-4 py-2 rounded-xl border border-[#C69A39]/40 hover:bg-[#3D2214] transition cursor-pointer"
                >
                  Save Contact
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={contactForm.phone}
                      onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">WhatsApp Number</label>
                    <input
                      type="text"
                      value={contactForm.whatsapp}
                      onChange={e => setContactForm({ ...contactForm, whatsapp: e.target.value })}
                      className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Grand Showroom Address</label>
                  <input
                    type="text"
                    value={contactForm.address}
                    onChange={e => setContactForm({ ...contactForm, address: e.target.value })}
                    className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-semibold mb-1">City, State & Pincode</label>
                  <input
                    type="text"
                    value={contactForm.cityStateZip}
                    onChange={e => setContactForm({ ...contactForm, cityStateZip: e.target.value })}
                    className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Opening Hours</label>
                  <input
                    type="text"
                    value={contactForm.openingHours}
                    onChange={e => setContactForm({ ...contactForm, openingHours: e.target.value })}
                    className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 8: PRICING, BULLION & TAX RULES */}
          {/* ============================================================== */}
          {activeTab === 'pricing' && pricingForm && (
            <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-[#C69A39]/30 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h2 className="font-cinzel font-bold text-2xl text-[#23140C]">Pricing & Bullion Rates</h2>
                  <p className="text-xs text-stone-500">Configure Indian GST (3%), shipping threshold, and live gold rate.</p>
                </div>
                <button
                  onClick={handleSavePricing}
                  className="bg-[#23140C] text-[#E7C979] text-xs font-semibold px-4 py-2 rounded-xl border border-[#C69A39]/40 hover:bg-[#3D2214] transition cursor-pointer"
                >
                  Save Pricing
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">24K Gold Rate (₹/g)</label>
                    <input
                      type="number"
                      value={pricingForm.goldRate24KPerGram}
                      onChange={e => setPricingForm({ ...pricingForm, goldRate24KPerGram: Number(e.target.value) })}
                      className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">22K Gold (916) Rate (₹/g)</label>
                    <input
                      type="number"
                      value={pricingForm.goldRate22KPerGram}
                      onChange={e => setPricingForm({ ...pricingForm, goldRate22KPerGram: Number(e.target.value) })}
                      className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">18K Gold (750) Rate (₹/g)</label>
                    <input
                      type="number"
                      value={pricingForm.goldRate18KPerGram || 6560}
                      onChange={e => setPricingForm({ ...pricingForm, goldRate18KPerGram: Number(e.target.value) })}
                      className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">999 Silver Rate (₹/g)</label>
                    <input
                      type="number"
                      value={pricingForm.silverRatePerGram}
                      onChange={e => setPricingForm({ ...pricingForm, silverRatePerGram: Number(e.target.value) })}
                      className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Diamond Benchmark (₹/ct)</label>
                    <input
                      type="number"
                      value={pricingForm.diamondRatePerCaratBaseline || 95000}
                      onChange={e => setPricingForm({ ...pricingForm, diamondRatePerCaratBaseline: Number(e.target.value) })}
                      className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Diamond Quality Details</label>
                    <input
                      type="text"
                      value={pricingForm.diamondRateDetails || 'VVS-EF Natural Solitaire'}
                      onChange={e => setPricingForm({ ...pricingForm, diamondRateDetails: e.target.value })}
                      className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Free Delivery Threshold (₹)</label>
                    <input
                      type="number"
                      value={pricingForm.freeDeliveryThreshold}
                      onChange={e => setPricingForm({ ...pricingForm, freeDeliveryThreshold: Number(e.target.value) })}
                      className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Delivery Charge (₹)</label>
                    <input
                      type="number"
                      value={pricingForm.deliveryCharge}
                      onChange={e => setPricingForm({ ...pricingForm, deliveryCharge: Number(e.target.value) })}
                      className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Tax Mode</label>
                    <select
                      value={pricingForm.taxMode}
                      onChange={e => setPricingForm({ ...pricingForm, taxMode: e.target.value as any })}
                      className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs cursor-pointer"
                    >
                      <option value="inclusive">Inclusive in Price (Indian Standard)</option>
                      <option value="exclusive">Exclusive (Added at checkout)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Tax Rate (%)</label>
                    <input
                      type="number"
                      value={pricingForm.taxRatePercent}
                      onChange={e => setPricingForm({ ...pricingForm, taxRatePercent: Number(e.target.value) })}
                      className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 9: UPI PAYMENT SETTINGS */}
          {/* ============================================================== */}
          {activeTab === 'upi_config' && upiForm && (
            <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-[#C69A39]/30 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h2 className="font-cinzel font-bold text-2xl text-[#23140C]">Direct UPI Payment Settings</h2>
                  <p className="text-xs text-stone-500">Configure bank UPI VPA, payee name, and checkout instructions.</p>
                </div>
                <button
                  onClick={handleSaveUpi}
                  className="bg-[#23140C] text-[#E7C979] text-xs font-semibold px-4 py-2 rounded-xl border border-[#C69A39]/40 hover:bg-[#3D2214] transition cursor-pointer"
                >
                  Save UPI Config
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">UPI ID (VPA) *</label>
                  <input
                    type="text"
                    required
                    value={upiForm.upiId}
                    onChange={e => setUpiForm({ ...upiForm, upiId: e.target.value })}
                    placeholder="e.g. mprjewellers@icici"
                    className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-sm font-mono font-bold text-[#23140C]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Payee Display Name *</label>
                    <input
                      type="text"
                      value={upiForm.payeeName}
                      onChange={e => setUpiForm({ ...upiForm, payeeName: e.target.value })}
                      placeholder="e.g. MPR JEWELLERY"
                      className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs font-serif font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">UPI Registered Phone</label>
                    <input
                      type="text"
                      value={upiForm.phoneNumber}
                      onChange={e => setUpiForm({ ...upiForm, phoneNumber: e.target.value })}
                      className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Checkout Payment Instructions</label>
                  <textarea
                    rows={3}
                    value={upiForm.instructions}
                    onChange={e => setUpiForm({ ...upiForm, instructions: e.target.value })}
                    className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 10: COUPONS */}
          {/* ============================================================== */}
          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-[#C69A39]/30 shadow-xs">
                <h2 className="font-cinzel font-bold text-2xl text-[#23140C]">Discount Coupons</h2>
                <p className="text-xs text-stone-500 mt-1">Create promotional discount codes for wedding season.</p>

                <form onSubmit={handleCreateCoupon} className="mt-4 flex flex-wrap gap-3 items-end">
                  <div>
                    <label className="block text-[11px] text-stone-600 font-semibold mb-1">Coupon Code</label>
                    <input
                      type="text"
                      required
                      value={newCouponCode}
                      onChange={e => setNewCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. GOLD10"
                      className="bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-stone-600 font-semibold mb-1">Discount %</label>
                    <input
                      type="number"
                      required
                      value={newCouponVal}
                      onChange={e => setNewCouponVal(Number(e.target.value))}
                      className="w-20 bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-stone-600 font-semibold mb-1">Min Order (₹)</label>
                    <input
                      type="number"
                      required
                      value={newCouponMin}
                      onChange={e => setNewCouponMin(Number(e.target.value))}
                      className="w-28 bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-[#23140C] text-[#E7C979] text-xs font-semibold px-4 py-2 rounded-xl border border-[#C69A39]/40 hover:bg-[#3D2214] transition cursor-pointer"
                  >
                    + Create Coupon
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {coupons.map(coup => (
                  <div key={coup.id} className="bg-white p-5 rounded-2xl border border-[#C69A39]/30 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="font-mono text-sm text-[#23140C] bg-[#F8F3EA] px-2.5 py-1 rounded-md border border-[#C69A39]/30">
                        {coup.code}
                      </strong>
                      <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>
                    <div className="text-xs text-stone-600">
                      {coup.discountType === 'percentage' ? `${coup.discountValue}% OFF` : `₹${coup.discountValue} OFF`}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Min Order: ₹{coup.minOrderValue.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 11: CUSTOMERS DIRECTORY */}
          {/* ============================================================== */}
          {activeTab === 'customers' && (
            <div className="bg-white p-6 rounded-3xl border border-[#C69A39]/30 shadow-xs space-y-4">
              <h2 className="font-cinzel font-bold text-2xl text-[#23140C]">Registered Customer Directory</h2>
              <div className="border border-stone-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#23140C] text-[#E7C979] font-serif text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">City</th>
                      <th className="py-3 px-4">Wishlist Items</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {customers.map(c => (
                      <tr key={c.id}>
                        <td className="py-3 px-4 font-semibold text-[#23140C]">{c.fullName}</td>
                        <td className="py-3 px-4">
                          <div>{c.phone}</div>
                          <div className="text-[10px] text-stone-400">{c.email}</div>
                        </td>
                        <td className="py-3 px-4">{c.savedAddresses[0]?.city || 'Hyderabad'}</td>
                        <td className="py-3 px-4">{c.wishlistProductIds.length} saved</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 12: GENERAL SETTINGS & POLICIES */}
          {/* ============================================================== */}
          {activeTab === 'general_settings' && generalForm && (
            <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-[#C69A39]/30 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h2 className="font-cinzel font-bold text-2xl text-[#23140C]">Store Availability & Policies</h2>
                  <p className="text-xs text-stone-500">Configure return policies, terms, and maintenance mode.</p>
                </div>
                <button
                  onClick={handleSaveGeneral}
                  className="bg-[#23140C] text-[#E7C979] text-xs font-semibold px-4 py-2 rounded-xl border border-[#C69A39]/40 hover:bg-[#3D2214] transition cursor-pointer"
                >
                  Save Policies
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">About Us Summary</label>
                  <textarea
                    rows={3}
                    value={generalForm.aboutUsSummary}
                    onChange={e => setGeneralForm({ ...generalForm, aboutUsSummary: e.target.value })}
                    className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Shipping & Transit Policy</label>
                  <textarea
                    rows={3}
                    value={generalForm.shippingPolicy}
                    onChange={e => setGeneralForm({ ...generalForm, shippingPolicy: e.target.value })}
                    className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Exchange & Lifetime Buyback Policy</label>
                  <textarea
                    rows={3}
                    value={generalForm.returnPolicy}
                    onChange={e => setGeneralForm({ ...generalForm, returnPolicy: e.target.value })}
                    className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 13: CHANGE PASSWORD */}
          {/* ============================================================== */}
          {activeTab === 'change_password' && (
            <div className="max-w-md bg-white p-6 sm:p-8 rounded-3xl border border-[#C69A39]/30 shadow-xs space-y-6">
              <div>
                <h2 className="font-cinzel font-bold text-2xl text-[#23140C]">Change Owner Password</h2>
                <p className="text-xs text-stone-500 mt-1">Keep your administration access secure.</p>
              </div>

              {pwdMsg && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                    pwdMsg.isError
                      ? 'bg-rose-50 border border-rose-200 text-rose-700'
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  }`}
                >
                  <span>{pwdMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Current Password *</label>
                  <input
                    type="password"
                    required
                    value={pwdCurrent}
                    onChange={e => setPwdCurrent(e.target.value)}
                    className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-semibold mb-1">New Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={pwdNew}
                    onChange={e => setPwdNew(e.target.value)}
                    className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    value={pwdConfirm}
                    onChange={e => setPwdConfirm(e.target.value)}
                    className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#23140C] text-[#E7C979] text-xs font-semibold py-3 rounded-xl border border-[#C69A39]/40 hover:bg-[#3D2214] transition cursor-pointer"
                >
                  Update Owner Password
                </button>
              </form>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 14: AUDIT LOGS */}
          {/* ============================================================== */}
          {activeTab === 'audit_logs' && (
            <div className="bg-white p-6 rounded-3xl border border-[#C69A39]/30 shadow-xs space-y-4">
              <h2 className="font-cinzel font-bold text-2xl text-[#23140C]">Administrative Audit Ledger</h2>
              <p className="text-xs text-stone-500">Immutable record of logins, settings adjustments, and payment verifications.</p>

              <div className="border border-stone-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#23140C] text-[#E7C979] font-serif text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {auditLogs.map(log => (
                      <tr key={log.id}>
                        <td className="py-2.5 px-4 font-mono text-[10px] text-stone-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-[#23140C]">{log.actor}</td>
                        <td className="py-2.5 px-4">
                          <span className="font-mono text-[10px] bg-[#F8F3EA] text-[#9A7420] px-2 py-0.5 rounded border border-[#C69A39]/30">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-stone-600">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Edit / Add Product Modal */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#C69A39]/40 p-6 sm:p-8 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif font-bold text-lg text-[#23140C]">
                {editingProduct.id ? 'Edit Jewellery Piece' : 'Add New Jewellery Piece'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku}
                    onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price}
                    onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Gross Wt (Grams) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.grossWeightGrams}
                    onChange={e => setEditingProduct({ ...editingProduct, grossWeightGrams: Number(e.target.value) })}
                    className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stockQuantity}
                    onChange={e => setEditingProduct({ ...editingProduct, stockQuantity: Number(e.target.value) })}
                    className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Metal Purity *</label>
                  <select
                    value={editingProduct.purity}
                    onChange={e => setEditingProduct({ ...editingProduct, purity: e.target.value as any })}
                    className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs cursor-pointer"
                  >
                    <option value="22K (916 Hallmarked)">22K (916 Hallmarked)</option>
                    <option value="18K (750)">18K (750)</option>
                    <option value="14K (585)">14K (585)</option>
                    <option value="925 Sterling Silver">925 Sterling Silver</option>
                    <option value="999 Fine Silver">999 Fine Silver</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={editingProduct.category}
                    onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs cursor-pointer"
                  >
                    <option value="gold">Gold Jewellery</option>
                    <option value="diamond">Diamonds</option>
                    <option value="silver">Silver & Puja</option>
                    <option value="bridal">Bridal & Wedding</option>
                    <option value="rings">Rings & Solitaires</option>
                  </select>
                </div>
              </div>

              {/* Multi-Image Media Management */}
              <div className="space-y-2 border border-stone-200 rounded-2xl p-3 bg-stone-50">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-stone-800 text-xs">
                    Jewellery Photography & Angles
                  </label>
                  <label className="text-[11px] text-amber-700 font-semibold cursor-pointer hover:underline flex items-center gap-1">
                    <span>+ Upload File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (file && token) {
                          const reader = new FileReader();
                          reader.onload = async () => {
                            try {
                              const res = await api.ownerUploadMedia(token, {
                                data: reader.result as string,
                                filename: file.name,
                                mimeType: file.type,
                              });
                              if (res.url) {
                                setEditingProduct({
                                  ...editingProduct,
                                  images: [...editingProduct.images, res.url],
                                });
                                showNotification('Image uploaded successfully!');
                              }
                            } catch (err: any) {
                              showNotification(err.message || 'Upload failed', true);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {editingProduct.images.map((imgUrl, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <img src={imgUrl} alt="Preview" className="w-9 h-9 object-cover rounded-lg border border-stone-300 shrink-0" />
                    <input
                      type="url"
                      value={imgUrl}
                      onChange={e => {
                        const newImages = [...editingProduct.images];
                        newImages[i] = e.target.value;
                        setEditingProduct({ ...editingProduct, images: newImages });
                      }}
                      placeholder="Image URL"
                      className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs"
                    />
                    <select
                      value={editingProduct.imageDetails?.[i]?.angle || (i === 0 ? 'front' : i === 1 ? 'side' : i === 2 ? 'back' : 'macro')}
                      onChange={e => {
                        const newDetails = [...(editingProduct.imageDetails || [])];
                        newDetails[i] = {
                          url: imgUrl,
                          angle: e.target.value as any,
                          isPrimary: i === 0,
                        };
                        setEditingProduct({ ...editingProduct, imageDetails: newDetails });
                      }}
                      className="bg-white border border-stone-300 rounded-xl px-2 py-1.5 text-[11px]"
                    >
                      <option value="front">Front Angle</option>
                      <option value="side">Side Angle</option>
                      <option value="back">Back Angle</option>
                      <option value="macro">Macro Zoom</option>
                    </select>
                    {editingProduct.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newImages = editingProduct.images.filter((_, idx) => idx !== i);
                          setEditingProduct({ ...editingProduct, images: newImages });
                        }}
                        className="text-stone-400 hover:text-rose-600 p-1"
                        title="Remove Image"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct({
                      ...editingProduct,
                      images: [...editingProduct.images, ''],
                    });
                  }}
                  className="text-[11px] text-[#9A7420] font-semibold hover:underline"
                >
                  + Add Another Image Angle URL
                </button>
              </div>

              {/* Video URL */}
              <div>
                <label className="block font-semibold mb-1">Craftsmanship Video URL (YouTube or MP4)</label>
                <input
                  type="url"
                  value={editingProduct.videos?.[0]?.url || ''}
                  onChange={e => {
                    const url = e.target.value;
                    setEditingProduct({
                      ...editingProduct,
                      videos: url ? [{ id: 'vid-1', url, title: `${editingProduct.name} Video` }] : [],
                    });
                  }}
                  placeholder="https://www.youtube.com/watch?v=... or .mp4 link"
                  className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.has3DModel}
                    onChange={e => setEditingProduct({ ...editingProduct, has3DModel: e.target.checked })}
                    className="accent-[#C69A39]"
                  />
                  <span>Enable 3D Viewer Lounge</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isFeatured}
                    onChange={e => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                    className="accent-[#C69A39]"
                  />
                  <span>Featured on Homepage</span>
                </label>
              </div>

              <div className="pt-4 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#23140C] text-[#E7C979] font-serif font-bold px-6 py-2 rounded-xl border border-[#C69A39]/40 hover:bg-[#3D2214]"
                >
                  Save Piece
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Order & UPI Verification Modal */}
      {inspectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#C69A39]/40 p-6 sm:p-8 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif font-bold text-lg text-[#23140C]">
                Inspect Order {inspectingOrder.orderNumber}
              </h3>
              <button
                onClick={() => setInspectingOrder(null)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#F8F3EA] p-4 rounded-2xl border border-[#C69A39]/20 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Customer:</span>
                <strong>{inspectingOrder.customerName} ({inspectingOrder.customerPhone})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Total Payable:</span>
                <strong className="font-serif text-base text-[#9A7420]">
                  ₹{inspectingOrder.totalAmount.toLocaleString('en-IN')}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Submitted Bank UTR:</span>
                <strong className="font-mono text-purple-900 bg-purple-50 px-2 py-0.5 rounded">
                  {inspectingOrder.upiPaymentDetails?.utrNumber || 'No UTR submitted yet'}
                </strong>
              </div>
              {inspectingOrder.upiPaymentDetails?.paymentNote && (
                <div className="text-stone-600">
                  Customer Note: "{inspectingOrder.upiPaymentDetails.paymentNote}"
                </div>
              )}
            </div>

            {inspectingOrder.paymentStatus === 'submitted_verification' && (
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-[#23140C]">
                  Rejection Reason (If funds not credited):
                </label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="e.g. UTR not matching statement or incorrect amount"
                  className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs"
                />

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleVerifyUpi(inspectingOrder.id, 'approve')}
                    className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-serif font-bold text-xs py-3 rounded-xl transition cursor-pointer"
                  >
                    Approve & Mark Paid
                  </button>
                  <button
                    onClick={() => handleVerifyUpi(inspectingOrder.id, 'reject')}
                    className="flex-1 bg-rose-700 hover:bg-rose-800 text-white font-serif font-bold text-xs py-3 rounded-xl transition cursor-pointer"
                  >
                    Reject Payment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shipment Tracking Modal */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#C69A39]/40 p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-serif font-bold text-base text-[#23140C]">
                Add Shipment Tracking ({trackingModalOrder.orderNumber})
              </h3>
              <button
                onClick={() => setTrackingModalOrder(null)}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTracking} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Carrier Name</label>
                <input
                  type="text"
                  value={carrierInput}
                  onChange={e => setCarrierInput(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Air Waybill (AWB) Tracking Number *</label>
                <input
                  type="text"
                  required
                  value={trackingNumberInput}
                  onChange={e => setTrackingNumberInput(e.target.value)}
                  placeholder="e.g. BD948102941IN"
                  className="w-full bg-[#FDFBF7] border border-[#C69A39]/30 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#23140C] text-[#E7C979] font-serif font-bold py-2.5 rounded-xl border border-[#C69A39]/40 hover:bg-[#3D2214] transition cursor-pointer"
              >
                Save & Mark as Shipped
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
