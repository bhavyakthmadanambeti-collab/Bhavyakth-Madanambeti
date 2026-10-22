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
  Review,
  AuditLog,
  CustomerUser,
  Category,
} from '../types/index.ts';

const API_BASE = '/api';

export interface StoreSettingsResponse {
  brand: BrandSettings;
  contact: ContactSettings;
  pricing: PricingSettings;
  homepage: HomepageSettings;
  upi: UPISettings;
  general: StoreGeneralSettings;
  categories: Category[];
}

export const api = {
  // Public settings & products
  async getSettings(): Promise<StoreSettingsResponse> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to load store settings');
    return res.json();
  },

  async getProducts(params?: {
    category?: string;
    metal?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
    sort?: string;
  }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.metal) query.set('metal', params.metal);
    if (params?.search) query.set('search', params.search);
    if (params?.minPrice) query.set('minPrice', params.minPrice.toString());
    if (params?.maxPrice) query.set('maxPrice', params.maxPrice.toString());
    if (params?.featured) query.set('featured', 'true');
    if (params?.sort) query.set('sort', params.sort);

    const res = await fetch(`${API_BASE}/products?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load products');
    return res.json();
  },

  async getProductById(id: string): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (!res.ok) throw new Error('Product not found');
    return res.json();
  },

  // Orders & UPI checkout
  async createOrder(data: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: any;
    items: any[];
    couponCode?: string;
    notes?: string;
  }): Promise<{ success: boolean; order: Order; upi: any }> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create order');
    }
    return res.json();
  },

  async submitUtrNumber(orderNumber: string, utrNumber: string, paymentNote?: string, screenshotUrl?: string) {
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderNumber)}/submit-upi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ utrNumber, paymentNote, screenshotUrl }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit UTR reference');
    }
    return res.json();
  },

  async trackOrder(query: string, phone?: string): Promise<Order> {
    const q = new URLSearchParams();
    q.set('q', query);
    if (phone) q.set('phone', phone);

    const res = await fetch(`${API_BASE}/orders/track?${q.toString()}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Order not found');
    }
    return res.json();
  },

  // Coupons
  async applyCoupon(code: string, cartTotal: number): Promise<{ valid: boolean; code: string; discountAmount: number; message: string }> {
    const res = await fetch(`${API_BASE}/coupons/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, cartTotal }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Invalid coupon');
    }
    return res.json();
  },

  async getReviews(): Promise<Review[]> {
    const res = await fetch(`${API_BASE}/reviews`);
    if (!res.ok) return [];
    return res.json();
  },

  // AI Jewellery Consultant
  async askAiConsultant(message: string): Promise<string> {
    const res = await fetch(`${API_BASE}/ai/consultant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error('AI Assistant is currently unavailable');
    const data = await res.json();
    return data.text;
  },

  async appraiseImage(imageBase64: string, prompt?: string): Promise<string> {
    const res = await fetch(`${API_BASE}/ai/appraise-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, prompt }),
    });
    if (!res.ok) throw new Error('AI Image appraisal failed');
    const data = await res.json();
    return data.text;
  },

  // --- Owner Operations ---
  async ownerLogin(email: string, password: string) {
    const res = await fetch(`${API_BASE}/owner/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async ownerChangePassword(token: string, data: { currentPassword: string; newPassword: string; confirmPassword: string }) {
    const res = await fetch(`${API_BASE}/owner/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update password');
    }
    return res.json();
  },

  async ownerVerifySession(token: string) {
    const res = await fetch(`${API_BASE}/owner/verify-session`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Invalid session');
    return res.json();
  },

  async ownerGetAnalytics(token: string) {
    const res = await fetch(`${API_BASE}/owner/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load analytics');
    return res.json();
  },

  async ownerGetOrders(token: string, status?: string, search?: string): Promise<Order[]> {
    const q = new URLSearchParams();
    if (status) q.set('status', status);
    if (search) q.set('search', search);

    const res = await fetch(`${API_BASE}/owner/orders?${q.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load orders');
    return res.json();
  },

  async ownerVerifyUpiPayment(token: string, orderId: string, decision: 'approve' | 'reject', reason?: string) {
    const res = await fetch(`${API_BASE}/owner/orders/${orderId}/verify-upi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ decision, reason }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to verify UPI payment');
    }
    return res.json();
  },

  async ownerUpdateOrderStatus(token: string, orderId: string, data: { orderStatus: string; trackingNumber?: string; carrier?: string }) {
    const res = await fetch(`${API_BASE}/owner/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update order status');
    }
    return res.json();
  },

  async ownerSaveProduct(token: string, productData: Partial<Product>, isEdit: boolean, id?: string) {
    const url = isEdit ? `${API_BASE}/owner/products/${id}` : `${API_BASE}/owner/products`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save product');
    }
    return res.json();
  },

  async ownerArchiveProduct(token: string, id: string) {
    const res = await fetch(`${API_BASE}/owner/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to archive product');
    return res.json();
  },

  async ownerUpdateBrandSettings(token: string, data: BrandSettings) {
    const res = await fetch(`${API_BASE}/owner/settings/brand`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async ownerUpdateContactSettings(token: string, data: ContactSettings) {
    const res = await fetch(`${API_BASE}/owner/settings/contact`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async ownerUpdatePricingSettings(token: string, data: PricingSettings) {
    const res = await fetch(`${API_BASE}/owner/settings/pricing`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async ownerUpdateUpiSettings(token: string, data: UPISettings) {
    const res = await fetch(`${API_BASE}/owner/settings/upi`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async ownerUpdateHomepageSettings(token: string, data: HomepageSettings) {
    const res = await fetch(`${API_BASE}/owner/settings/homepage`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async ownerUpdateGeneralSettings(token: string, data: StoreGeneralSettings) {
    const res = await fetch(`${API_BASE}/owner/settings/general`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async ownerGetCoupons(token: string): Promise<Coupon[]> {
    const res = await fetch(`${API_BASE}/owner/coupons`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return res.json();
  },

  async ownerCreateCoupon(token: string, data: Partial<Coupon>) {
    const res = await fetch(`${API_BASE}/owner/coupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async ownerGetAuditLogs(token: string): Promise<AuditLog[]> {
    const res = await fetch(`${API_BASE}/owner/audit-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return res.json();
  },

  async getRates(): Promise<Partial<PricingSettings>> {
    const res = await fetch(`${API_BASE}/rates`);
    if (!res.ok) throw new Error('Failed to load bullion rates');
    return res.json();
  },

  async ownerUpdateRates(token: string, data: Partial<PricingSettings>) {
    const res = await fetch(`${API_BASE}/owner/rates`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update bullion rates');
    return res.json();
  },

  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) return [];
    return res.json();
  },

  async getCategoryBySlug(slug: string): Promise<{ category: Category; products: Product[] }> {
    const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error('Category not found');
    return res.json();
  },

  async ownerSaveCategory(token: string, catData: Partial<Category>, isEdit = false, id?: string) {
    const url = isEdit ? `${API_BASE}/owner/categories/${id}` : `${API_BASE}/owner/categories`;
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(catData),
    });
    if (!res.ok) throw new Error('Failed to save category');
    return res.json();
  },

  async ownerUploadMedia(token: string, payload: { data: string; filename?: string; mimeType?: string }): Promise<{ success: boolean; url: string; filename: string }> {
    const res = await fetch(`${API_BASE}/owner/media/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload media file');
    }
    return res.json();
  },

  async ownerUpdateProductMedia(
    token: string,
    productId: string,
    mediaData: {
      images?: string[];
      imageDetails?: { url: string; altText?: string; isPrimary?: boolean; angle?: 'front' | 'back' | 'side' | 'macro' }[];
      videos?: { id: string; url: string; title?: string; thumbnailUrl?: string }[];
    }
  ) {
    const res = await fetch(`${API_BASE}/owner/products/${productId}/media`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(mediaData),
    });
    if (!res.ok) throw new Error('Failed to update product media');
    return res.json();
  },

  async ownerUpdateHomepageBanners(token: string, data: { hero?: any; promotionalBanners?: any[] }) {
    const res = await fetch(`${API_BASE}/owner/homepage/banners`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update banners');
    return res.json();
  },

  async ownerGetCustomers(token: string): Promise<CustomerUser[]> {
    const res = await fetch(`${API_BASE}/owner/customers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return res.json();
  },
};
