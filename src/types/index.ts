export type MetalType = 'gold' | 'diamond' | 'silver' | 'platinum' | 'polki';

export type MetalPurity = '24K (999)' | '22K (916 Hallmarked)' | '18K (750)' | '14K (585)' | '925 Sterling Silver' | '999 Fine Silver' | 'VVS-VS / FG Certified';

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Size 14 (Ring)", "2.4 (Bangle)", "16 inch (Chain)"
  priceModifier: number; // e.g. 0 or +2500
  weightGrams?: number;
  inStock: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  metal: MetalType;
  purity: MetalPurity;
  price: number;
  originalPrice?: number;
  grossWeightGrams: number;
  netWeightGrams: number;
  stoneWeightCarats?: number;
  description: string;
  specifications: {
    dimensions?: string;
    certificate?: string; // e.g. "BIS 916 Hallmarked", "IGI / SGL Certified"
    makingCharge?: string;
    occasion?: string;
    designType?: string;
  };
  images: string[];
  imageDetails?: {
    url: string;
    altText?: string;
    isPrimary?: boolean;
    angle?: 'front' | 'back' | 'side' | 'macro';
  }[];
  videos?: {
    id: string;
    url: string;
    title?: string;
    thumbnailUrl?: string;
  }[];
  stockQuantity: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isArchived: boolean;
  has3DModel?: boolean;
  model3DType?: 'ring' | 'pendant' | 'bangle';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  itemCount: number;
  icon?: string;
  order?: number;
  isActive?: boolean;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  bannerImage: string;
  productCount: number;
  featured: boolean;
  isActive: boolean;
  order?: number;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;
  selectedSize?: string;
  customEngraving?: string;
}

export interface Address {
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export type OrderStatus = 'pending_verification' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'submitted_verification' | 'verified' | 'rejected' | 'refunded';

export interface OrderItem {
  productId: string;
  productName: string;
  productSku: string;
  image: string;
  price: number;
  quantity: number;
  metal: MetalType;
  purity: string;
  selectedSize?: string;
  customEngraving?: string;
  weightGrams: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: Address;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: 'UPI' | 'COD_SAMPLE';
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  upiPaymentDetails?: {
    upiId: string;
    payeeName: string;
    utrNumber?: string;
    paymentNote?: string;
    screenshotUrl?: string;
    submittedAt?: string;
    verifiedAt?: string;
    rejectedReason?: string;
  };
  trackingDetails?: {
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    shippedDate?: string;
    estimatedDelivery?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UPISettings {
  enabled: boolean;
  upiId: string;
  payeeName: string;
  phoneNumber: string;
  merchantCode?: string;
  qrCodeUrl?: string;
  maxAmountLimit: number;
  instructions: string;
  supportMessage: string;
}

export interface BrandSettings {
  brandName: string;
  tagline: string;
  logoText: string;
  logoSubtext: string;
  logoImageUrl?: string;
  primaryColor: string;
  accentColor: string;
}

export interface ContactSettings {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  cityStateZip: string;
  openingHours: string;
  supportMessage: string;
}

export interface PricingSettings {
  currency: 'INR';
  currencySymbol: '₹';
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  taxMode: 'inclusive' | 'exclusive';
  taxRatePercent: number; // e.g. 3% GST on jewellery
  taxLabel: string; // e.g. "GST (3%)"
  goldRate24KPerGram: number; // live/configurable gold rate
  goldRate22KPerGram: number;
  goldRate18KPerGram: number;
  silverRatePerGram: number;
  diamondRatePerCaratBaseline: number;
  diamondRateDetails?: string;
  ratesLastUpdated: string;
  ratesSource: 'Owner Updated' | 'Market Benchmarked';
  trends?: {
    gold24k: 'up' | 'down' | 'neutral';
    gold22k: 'up' | 'down' | 'neutral';
    gold18k: 'up' | 'down' | 'neutral';
    silver: 'up' | 'down' | 'neutral';
    diamond: 'up' | 'down' | 'neutral';
    gold24kChange?: number;
    gold22kChange?: number;
    gold18kChange?: number;
    silverChange?: number;
  };
}

export interface HomepageSection {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

export interface PromotionalBanner {
  id: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  buttonText: string;
  linkUrl: string;
  isActive: boolean;
  order: number;
}

export interface HomepageSettings {
  hero: {
    collectionBadge: string;
    smallHeading: string;
    mainHeading: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
    secondaryButtonText: string;
    imageUrl: string;
    mobileImageUrl?: string;
  };
  announcementText: string;
  announcementEnabled: boolean;
  promotionalBanners?: PromotionalBanner[];
  sections: HomepageSection[];
}

export interface StoreGeneralSettings {
  storeName: string;
  isStoreOpen: boolean;
  maintenanceMode: boolean;
  allowGuestCheckout: boolean;
  allowCustomerRegistration: boolean;
  aboutUsSummary: string;
  heritageText: string;
  termsAndConditions: string;
  privacyPolicy: string;
  shippingPolicy: string;
  returnPolicy: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageCount: number;
  usageLimit?: number;
  expiresAt?: string;
  isActive: boolean;
}

export interface Review {
  id: string;
  author: string;
  city: string;
  rating: number; // 1-5
  comment: string;
  verifiedPurchase: boolean;
  jewelleryItem: string;
  date: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  ipAddress?: string;
}

export interface CustomerUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  savedAddresses: Address[];
  wishlistProductIds: string[];
  createdAt: string;
}

export interface OwnerAuthSession {
  email: string;
  token: string;
  requiresPasswordChange: boolean;
  role: 'owner';
}

export interface OwnerProfile {
  name: string;
  email: string;
  phone: string;
  designation: string;
  storeName: string;
  showroomAddress: string;
  panGstNumber?: string;
  lastLogin?: string;
}

export interface OwnerNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'stock' | 'system';
  severity: 'info' | 'warning' | 'urgent';
  createdAt: string;
  isRead: boolean;
  linkTab?: string;
}
