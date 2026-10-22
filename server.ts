import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
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
  Collection,
  OwnerProfile,
  OwnerNotification,
  PromotionalBanner,
} from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// -------------------------------------------------------------
// Database Persistence Layer (JSON file in /data/mpr_jewellery_db.json)
// -------------------------------------------------------------
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'mpr_jewellery_db.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Password Hashing & Verification Utilities (PBKDF2 with Cryptographic Salt)
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  if (storedHash.includes(':')) {
    const [salt, key] = storedHash.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === key;
  }
  // Graceful fallback for initial legacy/plaintext seed
  return password === storedHash;
}

interface DatabaseSchema {
  ownerAccount: {
    email: string;
    passwordHash: string;
    requiresPasswordChange: boolean;
    updatedAt: string;
  };
  ownerProfile: OwnerProfile;
  brandSettings: BrandSettings;
  contactSettings: ContactSettings;
  pricingSettings: PricingSettings;
  homepageSettings: HomepageSettings;
  upiSettings: UPISettings;
  generalSettings: StoreGeneralSettings;
  categories: Category[];
  collections: Collection[];
  products: Product[];
  orders: Order[];
  customers: CustomerUser[];
  coupons: Coupon[];
  reviews: Review[];
  auditLogs: AuditLog[];
}

const defaultCategories: Category[] = [
  {
    id: 'cat-all',
    name: 'All Treasures',
    slug: 'all',
    description: 'Explore the complete royal treasury of MPR JEWELLERY masterpieces.',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80',
    itemCount: 16,
  },
  {
    id: 'cat-gold',
    name: '22K Gold',
    slug: 'gold',
    description: 'Authentic 22K (916) pure gold crafted by master karigars.',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80',
    itemCount: 8,
  },
  {
    id: 'cat-diamond',
    name: 'Diamonds',
    slug: 'diamond',
    description: 'VVS/VS clarity certified natural diamonds set in white and rose gold.',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80',
    itemCount: 5,
  },
  {
    id: 'cat-silver',
    name: '925 Silver',
    slug: 'silver',
    description: '925 sterling silver ornaments, antique payals, and fine silver.',
    image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=600&q=80',
    itemCount: 4,
  },
  {
    id: 'cat-gold-rings',
    name: 'Gold Rings',
    slug: 'gold-rings',
    description: 'Handcrafted 22K and 18K gold bands, solitaires, and cocktail rings.',
    image: 'https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=600&q=80',
    itemCount: 4,
  },
  {
    id: 'cat-silver-rings',
    name: 'Silver Rings',
    slug: 'silver-rings',
    description: 'Pure 925 sterling silver bands, zircon solitaires, and astrological rings.',
    image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=600&q=80',
    itemCount: 3,
  },
  {
    id: 'cat-necklaces',
    name: 'Necklaces & Chokers',
    slug: 'necklaces',
    description: 'Royal bridal chokers, temple kasu malas, and heritage haarams.',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
    itemCount: 6,
  },
  {
    id: 'cat-chains',
    name: 'Chains & Mangalsutras',
    slug: 'chains',
    description: '18K and 22K daily wear gold chains, Italian laser links, and diamond mangalsutras.',
    image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=600&q=80',
    itemCount: 4,
  },
  {
    id: 'cat-earrings',
    name: 'Earrings & Jhumkas',
    slug: 'earrings',
    description: 'Opulent antique nakshi jhumkas, chandelier drops, and diamond studs.',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80',
    itemCount: 5,
  },
  {
    id: 'cat-bangles',
    name: 'Bangles & Kadas',
    slug: 'bangles',
    description: 'Nizam peacocks, jaali filigree kadas, and traditional bridal valayal sets.',
    image: 'https://images.unsplash.com/photo-1611591475870-87729eead1e8?auto=format&fit=crop&w=600&q=80',
    itemCount: 5,
  },
  {
    id: 'cat-bracelets',
    name: 'Bracelets',
    slug: 'bracelets',
    description: 'Contemporary tennis diamond bracelets and flexible gold charm bracelets.',
    image: 'https://images.unsplash.com/photo-1611591475870-87729eead1e8?auto=format&fit=crop&w=600&q=80',
    itemCount: 3,
  },
  {
    id: 'cat-pendants',
    name: 'Pendants & Lockets',
    slug: 'pendants',
    description: 'Emerald and diamond halos, Ganesha deities, and celestial medallions.',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
    itemCount: 4,
  },
  {
    id: 'cat-wedding',
    name: 'Wedding Jewellery',
    slug: 'wedding',
    description: 'Grand royal vivaha trousseau, Polki kundan chokers, and bridal waistbands.',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
    itemCount: 6,
  },
  {
    id: 'cat-traditional',
    name: 'Traditional Nakshi',
    slug: 'traditional',
    description: 'Authentic Chola temple deities, Vadanam, and antique matte gold heirlooms.',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80',
    itemCount: 5,
  },
  {
    id: 'cat-puja',
    name: 'Coins & Puja Silver',
    slug: 'puja',
    description: '999 pure fine silver puja thalis, kalashams, and 24K gold investment coins.',
    image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=600&q=80',
    itemCount: 3,
  },
];

const defaultCollections: Collection[] = [
  {
    id: 'col-wedding',
    name: 'Royal Vivaha & Bridal Muhurtham',
    slug: 'wedding',
    description: 'Bespoke bridal chokers, temple haaram, and polki sets for auspicious celebrations.',
    bannerImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80',
    productCount: 8,
    featured: true,
    isActive: true,
    order: 1,
  },
  {
    id: 'col-temple',
    name: 'Antique Nakshi Temple Deities',
    slug: 'temple',
    description: 'Chola & Vijayanagara inspired handmade heirloom gold with pure ruby and emerald cabochons.',
    bannerImage: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=80',
    productCount: 6,
    featured: true,
    isActive: true,
    order: 2,
  },
  {
    id: 'col-solitaire',
    name: 'Certified Solitaire Diamond Gala',
    slug: 'solitaire',
    description: 'VVS1-VS2 clarity natural solitaires set in platinum, 18K white gold, and rose gold.',
    bannerImage: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80',
    productCount: 5,
    featured: true,
    isActive: true,
    order: 3,
  },
  {
    id: 'col-puja',
    name: 'Sacred 999 Fine Silver & Mandir Articles',
    slug: 'puja-silver',
    description: 'Assay-certified 999 fine silver puja thalis, kalashams, and pure silver jewellery.',
    bannerImage: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1200&q=80',
    productCount: 4,
    featured: true,
    isActive: true,
    order: 4,
  },
  {
    id: 'col-daily',
    name: 'Daily Luxe & Contemporary Gold',
    slug: 'daily-luxe',
    description: 'Lightweight 18K & 22K chains, studs, and delicate bracelets for effortless luxury.',
    bannerImage: 'https://images.unsplash.com/photo-1611591475870-87729eead1e8?auto=format&fit=crop&w=1200&q=80',
    productCount: 6,
    featured: false,
    isActive: true,
    order: 5,
  },
];

const defaultOwnerProfile: OwnerProfile = {
  name: 'Bhavya Madanambeti',
  email: 'bhavyakthmadanambeti@gmail.com',
  phone: '+91 94402 18999',
  designation: 'Managing Director & Chief Gemologist',
  storeName: 'MPR JEWELLERY',
  showroomAddress: 'MPR Jewellers Grand Showroom, Main Bazaar Road, Near Clock Tower, Hyderabad, Telangana 500002, India',
  panGstNumber: '36AAACM8912P1ZV',
  lastLogin: new Date().toISOString(),
};

const defaultInitialData: DatabaseSchema = {
  ownerAccount: {
    email: 'bhavyakthmadanambeti@gmail.com',
    passwordHash: 'bhavyakth',
    requiresPasswordChange: true,
    updatedAt: new Date().toISOString(),
  },
  ownerProfile: defaultOwnerProfile,
  collections: defaultCollections,
  brandSettings: {
    brandName: 'MPR JEWELLERY',
    tagline: 'Timeless Heritage, Pure Elegance & Royal Indian Craftsmanship',
    logoText: 'MPR',
    logoSubtext: 'JEWELLERY',
    primaryColor: '#23140C',
    accentColor: '#C69A39',
  },
  contactSettings: {
    phone: '+91 94402 18999',
    whatsapp: '+91 94402 18999',
    email: 'bhavyakthmadanambeti@gmail.com',
    address: 'MPR Jewellers Grand Showroom, Main Bazaar Road, Near Clock Tower',
    cityStateZip: 'Hyderabad, Telangana 500002, India',
    openingHours: 'Mon - Sun: 10:30 AM to 9:00 PM (IST)',
    supportMessage: 'Namaste! We are here to assist with gold rates, bridal jewellery customization, and order tracking.',
  },
  pricingSettings: {
    currency: 'INR',
    currencySymbol: '₹',
    deliveryCharge: 150,
    freeDeliveryThreshold: 10000,
    taxMode: 'inclusive',
    taxRatePercent: 3,
    taxLabel: 'GST (3% Included)',
    goldRate24KPerGram: 7850,
    goldRate22KPerGram: 7200,
    goldRate18KPerGram: 5950,
    silverRatePerGram: 96,
    diamondRatePerCaratBaseline: 85000,
    diamondRateDetails: 'Benchmark for VVS1-VS2 / E-G Color certified natural diamonds. Purity, cut & 4Cs determine final price.',
    ratesLastUpdated: new Date().toISOString(),
    ratesSource: 'Owner Updated',
    trends: {
      gold24k: 'up',
      gold22k: 'up',
      gold18k: 'neutral',
      silver: 'down',
      diamond: 'neutral',
      gold24kChange: 35,
      gold22kChange: 30,
      gold18kChange: 0,
      silverChange: -0.5,
    },
  },
  upiSettings: {
    enabled: true,
    upiId: 'mprjewellers@icici',
    payeeName: 'MPR JEWELLERY STORE',
    phoneNumber: '+91 94402 18999',
    merchantCode: '5944',
    maxAmountLimit: 500000,
    instructions: '1. Scan the QR code or click Open UPI App.\n2. Complete payment in PhonePe / Google Pay / Paytm.\n3. Copy the 12-digit UTR / UPI Ref ID and submit below for instant verification.',
    supportMessage: 'For UPI payment assistance or high-value RTGS transfers, WhatsApp our accounts desk at +91 94402 18999.',
  },
  generalSettings: {
    storeName: 'MPR JEWELLERY',
    isStoreOpen: true,
    maintenanceMode: false,
    allowGuestCheckout: true,
    allowCustomerRegistration: true,
    aboutUsSummary: 'Founded on four decades of unwavering trust and purity, MPR JEWELLERY creates heirloom masterpieces celebrating royal Indian craftsmanship, certified diamonds, and BIS 916 hallmarked pure gold.',
    heritageText: 'Every piece that leaves our workshop carries the sacred mark of BIS Hallmark certification, precision laser engraving, and generations of artisanal perfection.',
    termsAndConditions: 'All gold jewellery sold at MPR JEWELLERY is BIS 916 Hallmarked. Weight, purity, and certified gemstone certificates are included in the tamper-proof delivery box. Orders confirmed via verified UPI payment are dispatched within 24-48 business hours.',
    privacyPolicy: 'We respect your privacy. Customer contact details and addresses are used solely for processing orders, delivery updates, and luxury concierge support. Payment information is securely verified via standard Indian banking protocols.',
    shippingPolicy: 'Free insured pan-India delivery on orders above ₹10,000 via BlueDart / BVC Logistics with OTP-verified handover. All shipments are 100% transit insured.',
    returnPolicy: '7-day easy exchange guarantee. Lifetime buyback and gold exchange guarantee at current market rates as per BIS hallmark weight and purity inspection.',
  },
  homepageSettings: {
    hero: {
      collectionBadge: 'ROYAL HERITAGE FESTIVE COLLECTION 2026',
      smallHeading: 'Timeless Indian Luxury',
      mainHeading: 'Elegance Cast In Pure Gold & Certified Diamonds',
      subtitle: 'Experience exquisite handcrafted bridal sets, 22K temple jewellery, and modern diamond solitaires crafted for life’s grandest celebrations.',
      buttonText: 'Explore Collections',
      buttonLink: '#/shop',
      secondaryButtonText: 'Interactive 3D Lounge',
      imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1600&q=80',
      mobileImageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=80',
    },
    announcementText: '✨ Akshay Tritiya & Wedding Season Specials: 0% Making Charge on Selected 22K Gold Sets | Insured Pan-India Free Delivery on Orders Over ₹10,000',
    announcementEnabled: true,
    promotionalBanners: [
      {
        id: 'ban-001',
        title: 'Vivaha Bridal Muhurtham Showcase',
        subtitle: 'Authentic 22K BIS 916 Nakshi temple bridal sets with zero making charge on selected sets.',
        badgeText: 'FESTIVE WEDDING SPECIAL',
        imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1400&q=80',
        mobileImageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
        buttonText: 'Shop Bridal Sets',
        linkUrl: '#/category/wedding',
        isActive: true,
        order: 1,
      },
      {
        id: 'ban-002',
        title: 'Certified Solitaire Diamond Gala',
        subtitle: 'Rare VVS-VS certified natural diamonds with laser inscribed certificates and international grading.',
        badgeText: 'IGI / SGL CERTIFIED',
        imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1400&q=80',
        mobileImageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
        buttonText: 'Explore Solitaires',
        linkUrl: '#/category/diamond',
        isActive: true,
        order: 2,
      },
      {
        id: 'ban-003',
        title: 'Pure 925 Sterling Silver & Mandir Sanctum',
        subtitle: 'Handcrafted antique ghungroo payals, bridal silver accessories, and 999 fine silver puja sets.',
        badgeText: '999 FINE SILVER',
        imageUrl: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1400&q=80',
        mobileImageUrl: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80',
        buttonText: 'View Silver Articles',
        linkUrl: '#/category/silver',
        isActive: true,
        order: 3,
      },
    ],
    sections: [
      { id: 'rates_ticker', name: 'Live Gold, Silver & Diamond Bullion Rates', enabled: true, order: 1 },
      { id: 'hero', name: 'Hero Banner Showcase', enabled: true, order: 2 },
      { id: 'promotional_banners', name: 'Festive & Wedding Promotional Banners', enabled: true, order: 3 },
      { id: 'circular_categories', name: 'Circular Category Carousel', enabled: true, order: 4 },
      { id: 'threed_lounge', name: '3D Interactive Jewellery Lounge', enabled: true, order: 5 },
      { id: 'featured', name: 'Curated Masterpieces', enabled: true, order: 6 },
      { id: 'gold_special', name: '22K Hallmarked Gold Collections', enabled: true, order: 7 },
      { id: 'diamond_special', name: 'Certified Solitaires & Diamonds', enabled: true, order: 8 },
      { id: 'silver_special', name: '925 Sterling Silver & Puja Articles', enabled: true, order: 9 },
      { id: 'craftsmanship', name: 'Heritage Craftsmanship & Trust', enabled: true, order: 10 },
      { id: 'reviews', name: 'Customer Testimonials', enabled: true, order: 11 },
    ],
  },
  categories: defaultCategories,
  products: [
    {
      id: 'prod-001',
      name: 'Royal Bridal Kundan & Polki Choker Set',
      slug: 'royal-bridal-kundan-polki-choker',
      sku: 'MPR-GOLD-001',
      category: 'necklaces',
      metal: 'gold',
      purity: '22K (916 Hallmarked)',
      price: 245000,
      originalPrice: 265000,
      grossWeightGrams: 48.6,
      netWeightGrams: 42.0,
      stoneWeightCarats: 33.0,
      description: 'An ethereal heirloom bridal choker handcrafted with uncut Polki diamonds, rich ruby-emerald meenakari back detailing, and clusters of natural South Sea pearls. Includes matching chandelier jhumkas.',
      specifications: {
        dimensions: 'Choker length 18cm adjustable dori, Earrings 6.5cm',
        certificate: 'Government Certified BIS 916 Hallmark & Gemological Card',
        makingCharge: 'Special Festive 12% (Included)',
        occasion: 'Grand Wedding, Reception, Vivaha Muhurtham',
        designType: 'Rajputana & Nizam Royal Heritage',
      },
      images: [
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1611591475870-87729eead1e8?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85',
      ],
      imageDetails: [
        { url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=85', altText: 'Front royal view of 22K Kundan Choker', isPrimary: true, angle: 'front' },
        { url: 'https://images.unsplash.com/photo-1611591475870-87729eead1e8?auto=format&fit=crop&w=1200&q=85', altText: 'Chandelier Jhumka pairing detail', angle: 'side' },
        { url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85', altText: 'Uncut Polki diamond close-up', angle: 'macro' },
      ],
      videos: [
        {
          id: 'vid-001',
          url: 'https://assets.mixkit.co/videos/preview/mixkit-diamond-ring-in-a-box-41584-large.mp4',
          title: '360° Karigar Craftsmanship & Polish Video',
          thumbnailUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
        },
      ],
      stockQuantity: 4,
      isFeatured: true,
      isNewArrival: false,
      isBestSeller: true,
      isArchived: false,
      has3DModel: true,
      model3DType: 'pendant',
      tags: ['bridal', 'kundan', '22k', 'wedding', 'choker', 'necklaces', 'gold'],
      createdAt: '2026-01-10T10:00:00.000Z',
      updatedAt: '2026-02-15T10:00:00.000Z',
    },
    {
      id: 'prod-002',
      name: 'Divine Temple Lakshmi Kasu Mala',
      slug: 'divine-temple-lakshmi-kasu-mala',
      sku: 'MPR-GOLD-002',
      category: 'necklaces',
      metal: 'gold',
      purity: '22K (916 Hallmarked)',
      price: 318500,
      originalPrice: 335000,
      grossWeightGrams: 45.2,
      netWeightGrams: 45.2,
      description: 'Sacred South Indian temple antique necklace engraved with auspicious Lakshmi coins (Kasu) flanked by embossed peacock motifs and crowned with fine cabochon ruby accents.',
      specifications: {
        dimensions: 'Length 22 inches with adjustable gold links',
        certificate: 'BIS 916 Hallmarked Pure Gold with HUID',
        makingCharge: '14% Artisanal Karigar Charge (Included)',
        occasion: 'Auspicious Festivals, Muhurtham, Temple Visit',
        designType: 'Authentic Chola Temple Nakshi Art',
      },
      images: [
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=85',
      ],
      imageDetails: [
        { url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85', altText: 'Divine Lakshmi Kasu Mala Front', isPrimary: true, angle: 'front' },
        { url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=85', altText: 'Peacock motif and coin relief detail', angle: 'macro' },
      ],
      stockQuantity: 3,
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: true,
      isArchived: false,
      tags: ['temple', 'kasu-mala', 'gold', '22k', 'antique', 'necklaces', 'traditional'],
      createdAt: '2026-01-15T10:00:00.000Z',
      updatedAt: '2026-02-18T10:00:00.000Z',
    },
    {
      id: 'prod-003',
      name: 'Eternal Solitaire Diamond Ring (1.20 Carat)',
      slug: 'eternal-solitaire-diamond-ring',
      sku: 'MPR-DIA-001',
      category: 'gold-rings',
      metal: 'diamond',
      purity: '18K (750)',
      price: 185000,
      originalPrice: 205000,
      grossWeightGrams: 4.8,
      netWeightGrams: 4.56,
      stoneWeightCarats: 1.2,
      description: 'A breathtaking 1.20 carat certified round brilliant diamond of exceptional VVS1 clarity and E-color, mounted in a handcrafted six-prong platinum crown atop an 18K rose gold micro-pavé band.',
      specifications: {
        dimensions: 'Customizable Ring Size 10 to 22 (Indian Standard)',
        certificate: 'IGI Certified Diamond with Laser Inscribed Number',
        makingCharge: 'Flat ₹6,500 (Included in final price)',
        occasion: 'Engagement, Anniversary, Luxury Milestone',
        designType: 'Classic Tiffany-Inspired Six Prong Solitaire',
      },
      images: [
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=1200&q=85',
      ],
      imageDetails: [
        { url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=85', altText: '1.20 Carat VVS1 Diamond Solitaire Ring', isPrimary: true, angle: 'front' },
        { url: 'https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=1200&q=85', altText: 'Rose gold band with platinum cathedral prongs', angle: 'side' },
      ],
      videos: [
        {
          id: 'vid-002',
          url: 'https://assets.mixkit.co/videos/preview/mixkit-diamond-ring-in-a-box-41584-large.mp4',
          title: 'Diamond Refraction & Fire Demonstration',
          thumbnailUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80',
        },
      ],
      stockQuantity: 5,
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: true,
      isArchived: false,
      has3DModel: true,
      model3DType: 'ring',
      tags: ['solitaire', 'diamond', 'ring', 'engagement', '18k', 'gold-rings'],
      createdAt: '2026-01-20T10:00:00.000Z',
      updatedAt: '2026-02-20T10:00:00.000Z',
    },
    {
      id: 'prod-004',
      name: 'Heritage Nakshi Antique Jhumkas',
      slug: 'heritage-nakshi-antique-jhumkas',
      sku: 'MPR-GOLD-003',
      category: 'earrings',
      metal: 'gold',
      purity: '22K (916 Hallmarked)',
      price: 210000,
      originalPrice: 228000,
      grossWeightGrams: 28.5,
      netWeightGrams: 28.5,
      description: 'Opulent traditional South Indian dome jhumkas featuring sculpted dancing Apsara figurines, floral filigree canopy, and a cascade of miniature gold ghungroos.',
      specifications: {
        dimensions: 'Length 7.2 cm, Width 3.4 cm, Screw back with support',
        certificate: 'BIS 916 Hallmark with Unique HUID',
        makingCharge: '13% Traditional Craftsmanship',
        occasion: 'Wedding, Seemantham, Diwali Celebration',
        designType: 'Antique Nakshi Temple Gold',
      },
      images: [
        'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85',
      ],
      stockQuantity: 4,
      isFeatured: true,
      isNewArrival: false,
      isBestSeller: true,
      isArchived: false,
      tags: ['earrings', 'jhumka', 'antique', '22k', 'nakshi', 'traditional'],
      createdAt: '2026-01-25T10:00:00.000Z',
      updatedAt: '2026-02-21T10:00:00.000Z',
    },
    {
      id: 'prod-005',
      name: 'Aura Diamond Mangalsutra',
      slug: 'aura-diamond-mangalsutra',
      sku: 'MPR-DIA-002',
      category: 'chains',
      metal: 'diamond',
      purity: '18K (750)',
      price: 88000,
      originalPrice: 99000,
      grossWeightGrams: 8.2,
      netWeightGrams: 8.0,
      stoneWeightCarats: 0.65,
      description: 'A contemporary modern mangalsutra featuring certified round brilliant diamonds set in an infinity pendant suspended from a sacred dual-row black bead and gold chain.',
      specifications: {
        dimensions: 'Chain Length 18 inches with 2-inch extension',
        certificate: 'SGL Certified Natural Diamonds (VVS Clarity, G-H Color)',
        makingCharge: 'Inclusive',
        occasion: 'Daily Wear, Auspicious Gift, Modern Bride',
        designType: 'Contemporary Minimalist Mangalsutra',
      },
      images: [
        'https://images.unsplash.com/photo-1611591475870-87729eead1e8?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=85',
      ],
      stockQuantity: 6,
      isFeatured: false,
      isNewArrival: true,
      isBestSeller: true,
      isArchived: false,
      tags: ['mangalsutra', 'diamond', 'daily-wear', '18k', 'chains'],
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: '2026-02-22T10:00:00.000Z',
    },
    {
      id: 'prod-006',
      name: 'Imperial Peacock Enamel Gold Kada',
      slug: 'imperial-peacock-enamel-gold-kada',
      sku: 'MPR-GOLD-004',
      category: 'bangles',
      metal: 'gold',
      purity: '22K (916 Hallmarked)',
      price: 195000,
      originalPrice: 215000,
      grossWeightGrams: 28.2,
      netWeightGrams: 28.2,
      description: 'Stunning openable royal kada with intricately carved peacock terminals, royal blue & emerald green hot enamel work, and screw lock mechanism.',
      specifications: {
        dimensions: 'Size 2.4, 2.6, 2.8 available with secure hinge screw',
        certificate: 'BIS 916 Hallmarked Pure Gold',
        makingCharge: '12% Handcrafted Meenakari',
        occasion: 'Bridal Sangeet, Festive Pooja, Royal Parties',
        designType: 'Jaipuri Meenakari & Jaali Emboss',
      },
      images: [
        'https://images.unsplash.com/photo-1611591475870-87729eead1e8?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85',
      ],
      stockQuantity: 4,
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: false,
      isArchived: false,
      has3DModel: true,
      model3DType: 'bangle',
      tags: ['bangle', 'kada', 'gold', 'peacock', 'meenakari', 'bangles', 'traditional'],
      createdAt: '2026-02-05T10:00:00.000Z',
      updatedAt: '2026-02-23T10:00:00.000Z',
    },
    {
      id: 'prod-007',
      name: 'Celestial Emerald & Diamond Pendant Set',
      slug: 'celestial-emerald-diamond-pendant',
      sku: 'MPR-DIA-003',
      category: 'pendants',
      metal: 'diamond',
      purity: '18K (750)',
      price: 145000,
      originalPrice: 160000,
      grossWeightGrams: 10.4,
      netWeightGrams: 9.8,
      stoneWeightCarats: 1.45,
      description: 'A genuine 2.50ct natural Zambian oval emerald haloed by 1.45ct brilliant cut diamonds in an 18K white gold pendant with matching drop earrings.',
      specifications: {
        dimensions: 'Pendant 3.2cm, Studs 1.5cm',
        certificate: 'IGI Certified Diamond & Natural Gemstone Certificate',
        makingCharge: 'Included',
        occasion: 'Anniversary, Gala, Formal Evening',
        designType: 'Art Deco Royal Halo',
      },
      images: [
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=85',
      ],
      stockQuantity: 2,
      isFeatured: true,
      isNewArrival: false,
      isBestSeller: false,
      isArchived: false,
      tags: ['emerald', 'diamond', 'pendant', 'white-gold', 'pendants'],
      createdAt: '2026-02-08T10:00:00.000Z',
      updatedAt: '2026-02-24T10:00:00.000Z',
    },
    {
      id: 'prod-008',
      name: 'Shimmering 925 Sterling Silver Ghungroo Payal (Pair)',
      slug: 'sterling-silver-ghungroo-payal',
      sku: 'MPR-SLV-001',
      category: 'silver',
      metal: 'silver',
      purity: '925 Sterling Silver',
      price: 12500,
      originalPrice: 14500,
      grossWeightGrams: 64.0,
      netWeightGrams: 64.0,
      description: 'Traditional handcrafted 925 sterling silver bridal anklets with melodious musical ghungroos and antique oxidised filigree finish.',
      specifications: {
        dimensions: 'Length 10.5 inches with S-hook closure (Pair of 2)',
        certificate: '925 Silver Authenticity Stamp & Card',
        makingCharge: 'Included',
        occasion: 'Bridal Shringar, Karva Chauth, Traditional Dance',
        designType: 'Rajasthani Royal Payal',
      },
      images: [
        'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=85',
      ],
      stockQuantity: 8,
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: true,
      isArchived: false,
      tags: ['silver', 'payal', 'anklet', '925', 'bridal'],
      createdAt: '2026-02-10T10:00:00.000Z',
      updatedAt: '2026-02-25T10:00:00.000Z',
    },
    {
      id: 'prod-009',
      name: 'Devi Kamakshi Pure Silver Puja Thali Set (250g)',
      slug: 'kamakshi-pure-silver-puja-thali-set',
      sku: 'MPR-SLV-002',
      category: 'puja',
      metal: 'silver',
      purity: '999 Fine Silver',
      price: 34000,
      originalPrice: 38000,
      grossWeightGrams: 250.0,
      netWeightGrams: 250.0,
      description: 'A complete 7-piece divine puja set made in 999 pure fine silver comprising an engraved Thali, Diya, Bell (Ghanta), Panchapatra, Udharani, and Kumkum bowls.',
      specifications: {
        dimensions: 'Thali diameter 9.5 inches, weight 250 grams',
        certificate: '999 Fine Silver Purity Certificate with Assay stamp',
        makingCharge: 'Included',
        occasion: 'Griha Pravesham, Wedding Gift, Daily Mandir Puja',
        designType: 'Auspicious Kalash & Lotus Carving',
      },
      images: [
        'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85',
      ],
      stockQuantity: 5,
      isFeatured: false,
      isNewArrival: false,
      isBestSeller: true,
      isArchived: false,
      tags: ['silver', 'puja', '999-silver', 'thali', 'mandir'],
      createdAt: '2026-02-12T10:00:00.000Z',
      updatedAt: '2026-02-25T10:00:00.000Z',
    },
    {
      id: 'prod-010',
      name: 'Sparkling Princess Cut Diamond Studs',
      slug: 'sparkling-princess-cut-diamond-studs',
      sku: 'MPR-DIA-004',
      category: 'earrings',
      metal: 'diamond',
      purity: '18K (750)',
      price: 76000,
      originalPrice: 85000,
      grossWeightGrams: 3.2,
      netWeightGrams: 3.04,
      stoneWeightCarats: 0.8,
      description: 'Brilliant pair of princess cut natural diamonds (0.80ct total weight) set in 18K white gold four-prong basket with secure screw-backs.',
      specifications: {
        dimensions: '4.8mm each, 18K white gold',
        certificate: 'IGI Certified (VS1 Clarity, F-Color)',
        makingCharge: 'Included',
        occasion: 'Office, Luxury Daily Wear, Gifting',
        designType: 'Princess Cut Solitaire Studs',
      },
      images: [
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=85',
      ],
      stockQuantity: 7,
      isFeatured: false,
      isNewArrival: true,
      isBestSeller: false,
      isArchived: false,
      tags: ['diamond', 'studs', 'earrings', 'princess-cut'],
      createdAt: '2026-02-15T10:00:00.000Z',
      updatedAt: '2026-02-26T10:00:00.000Z',
    },
    {
      id: 'prod-011',
      name: 'Modern Minimalist 18K Gold Floral Chain',
      slug: 'modern-minimalist-18k-gold-floral-chain',
      sku: 'MPR-GOLD-005',
      category: 'chains',
      metal: 'gold',
      purity: '18K (750)',
      price: 84000,
      originalPrice: 92000,
      grossWeightGrams: 12.0,
      netWeightGrams: 12.0,
      description: 'Contemporary Italian-style laser-cut gold floral link chain crafted in lustrous 18K yellow gold with lobster clasp.',
      specifications: {
        dimensions: 'Length 18 inches with safety hook',
        certificate: 'BIS 750 Hallmark',
        makingCharge: '10% Lightweight Craftsmanship',
        occasion: 'Festive Everyday, Western Wear, Casual Chic',
        designType: 'Italian Textured Floral Links',
      },
      images: [
        'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=85',
      ],
      stockQuantity: 6,
      isFeatured: false,
      isNewArrival: true,
      isBestSeller: false,
      isArchived: false,
      tags: ['chain', '18k', 'gold', 'minimalist', 'chains'],
      createdAt: '2026-02-18T10:00:00.000Z',
      updatedAt: '2026-02-26T10:00:00.000Z',
    },
    {
      id: 'prod-012',
      name: 'Classic Navratna Royal Kada',
      slug: 'classic-navratna-royal-kada',
      sku: 'MPR-GOLD-006',
      category: 'bangles',
      metal: 'gold',
      purity: '22K (916 Hallmarked)',
      price: 262000,
      originalPrice: 285000,
      grossWeightGrams: 35.8,
      netWeightGrams: 32.0,
      stoneWeightCarats: 19.0,
      description: 'An auspicious Vedic Navratna bangle encrusted with Ruby, Pearl, Coral, Emerald, Yellow Sapphire, Diamond, Blue Sapphire, Hessonite, and Cat’s Eye in pure 22K hallmarked gold.',
      specifications: {
        dimensions: 'Size 2.6 openable Kada with screw lock',
        certificate: 'BIS 916 Hallmark & 9 Astrological Gemstones Certified',
        makingCharge: 'Specialist Karigar Jyotish Setting',
        occasion: 'Spiritual Milestone, Wedding, Royal Regalia',
        designType: 'Vedic Navratna Heritage',
      },
      images: [
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=85',
      ],
      stockQuantity: 2,
      isFeatured: true,
      isNewArrival: false,
      isBestSeller: true,
      isArchived: false,
      has3DModel: true,
      model3DType: 'bangle',
      tags: ['navratna', 'kada', '22k', 'gemstones', 'vedic', 'bangles', 'traditional'],
      createdAt: '2026-02-20T10:00:00.000Z',
      updatedAt: '2026-02-26T10:00:00.000Z',
    },
    {
      id: 'prod-013',
      name: 'Princess Diamond Tennis Bracelet',
      slug: 'princess-diamond-tennis-bracelet',
      sku: 'MPR-DIA-005',
      category: 'bracelets',
      metal: 'diamond',
      purity: '18K (750)',
      price: 215000,
      originalPrice: 235000,
      grossWeightGrams: 14.5,
      netWeightGrams: 13.5,
      stoneWeightCarats: 3.5,
      description: 'Continuous river of certified brilliant diamonds set in an 18K white gold flexible channel setting with double safety lock.',
      specifications: {
        dimensions: '7.2 inches length with dual box clasp',
        certificate: 'IGI Certified Diamond Bracelet',
        makingCharge: 'Included',
        occasion: 'Gala, Red Carpet, Wedding Gift',
        designType: 'Classic Royal Tennis Bracelet',
      },
      images: [
        'https://images.unsplash.com/photo-1611591475870-87729eead1e8?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=85',
      ],
      stockQuantity: 3,
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: false,
      isArchived: false,
      tags: ['bracelet', 'diamond', 'tennis-bracelet', 'bracelets'],
      createdAt: '2026-02-22T10:00:00.000Z',
      updatedAt: '2026-02-27T10:00:00.000Z',
    },
    {
      id: 'prod-014',
      name: 'Vintage 925 Silver Floral Cocktail Ring',
      slug: 'vintage-925-silver-floral-cocktail-ring',
      sku: 'MPR-SLV-003',
      category: 'silver-rings',
      metal: 'silver',
      purity: '925 Sterling Silver',
      price: 6500,
      originalPrice: 7800,
      grossWeightGrams: 9.5,
      netWeightGrams: 9.5,
      description: 'Artisanal antique oxidized 925 sterling silver cocktail ring sculpted with blooming lotus petals and center cubic zircon sparkler.',
      specifications: {
        dimensions: 'Adjustable free-size band',
        certificate: '925 Stamp Guaranteed',
        occasion: 'Festive, Party, Ethnic Chic',
        designType: 'Oxidized Tribal Lotus',
      },
      images: [
        'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1200&q=85',
      ],
      stockQuantity: 12,
      isFeatured: false,
      isNewArrival: true,
      isBestSeller: true,
      isArchived: false,
      tags: ['silver', 'ring', 'silver-rings', 'cocktail-ring'],
      createdAt: '2026-02-23T10:00:00.000Z',
      updatedAt: '2026-02-27T10:00:00.000Z',
    },
  ],
  orders: [
    {
      id: 'ord-1001',
      orderNumber: 'MPR-2026-8901',
      customerName: 'Ananya Sharma',
      customerEmail: 'ananya.sharma@example.com',
      customerPhone: '+91 98765 12345',
      shippingAddress: {
        fullName: 'Ananya Sharma',
        phone: '+91 98765 12345',
        email: 'ananya.sharma@example.com',
        addressLine1: 'B-402, Prestige Golf Towers, Outer Ring Road',
        addressLine2: 'Gachibowli',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500032',
      },
      items: [
        {
          productId: 'prod-003',
          productName: 'Eternal Solitaire Diamond Ring (1.20 Carat)',
          productSku: 'MPR-DIA-001',
          image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80',
          price: 185000,
          quantity: 1,
          metal: 'diamond',
          purity: '18K (750)',
          selectedSize: 'Size 14',
          weightGrams: 4.8,
        },
      ],
      subtotal: 185000,
      discountAmount: 5000,
      couponCode: 'ROYAL10',
      shippingFee: 0,
      taxAmount: 5400,
      totalAmount: 185400,
      paymentMethod: 'UPI',
      paymentStatus: 'verified',
      orderStatus: 'processing',
      upiPaymentDetails: {
        upiId: 'mprjewellers@icici',
        payeeName: 'MPR JEWELLERY STORE',
        utrNumber: '608923419082',
        paymentNote: 'Paid from HDFC Bank via Google Pay for engagement ring',
        submittedAt: '2026-02-25T14:30:00.000Z',
        verifiedAt: '2026-02-25T14:45:00.000Z',
      },
      trackingDetails: {
        carrier: 'BlueDart Apex Express',
        trackingNumber: 'BD948102941IN',
        trackingUrl: 'https://www.bluedart.com',
        shippedDate: '2026-02-26T10:00:00.000Z',
        estimatedDelivery: '2026-03-01',
      },
      notes: 'Sample verified order for initial dashboard demonstration.',
      createdAt: '2026-02-25T14:20:00.000Z',
      updatedAt: '2026-02-26T10:00:00.000Z',
    },
    {
      id: 'ord-1002',
      orderNumber: 'MPR-2026-8902',
      customerName: 'Vikramaditya Rao',
      customerEmail: 'vikram.rao@example.com',
      customerPhone: '+91 97012 34567',
      shippingAddress: {
        fullName: 'Vikramaditya Rao',
        phone: '+91 97012 34567',
        email: 'vikram.rao@example.com',
        addressLine1: 'Villa 12, Jubilee Hills Road No. 36',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500033',
      },
      items: [
        {
          productId: 'prod-008',
          productName: 'Shimmering 925 Sterling Silver Ghungroo Payal (Pair)',
          productSku: 'MPR-SLV-001',
          image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=600&q=80',
          price: 12500,
          quantity: 1,
          metal: 'silver',
          purity: '925 Sterling Silver',
          weightGrams: 64.0,
        },
      ],
      subtotal: 12500,
      discountAmount: 500,
      couponCode: 'WELCOME500',
      shippingFee: 0,
      taxAmount: 360,
      totalAmount: 12360,
      paymentMethod: 'UPI',
      paymentStatus: 'submitted_verification',
      orderStatus: 'pending_verification',
      upiPaymentDetails: {
        upiId: 'mprjewellers@icici',
        payeeName: 'MPR JEWELLERY STORE',
        utrNumber: '608934521099',
        paymentNote: 'Paid via PhonePe, UTR 608934521099. Kindly verify.',
        submittedAt: '2026-02-26T11:15:00.000Z',
      },
      notes: 'Sample pending UPI verification in Owner Portal queue.',
      createdAt: '2026-02-26T11:10:00.000Z',
      updatedAt: '2026-02-26T11:15:00.000Z',
    },
  ],
  customers: [
    {
      id: 'cust-001',
      fullName: 'Ananya Sharma',
      email: 'ananya.sharma@example.com',
      phone: '+91 98765 12345',
      savedAddresses: [
        {
          fullName: 'Ananya Sharma',
          phone: '+91 98765 12345',
          email: 'ananya.sharma@example.com',
          addressLine1: 'B-402, Prestige Golf Towers, Outer Ring Road',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500032',
        },
      ],
      wishlistProductIds: ['prod-001', 'prod-004'],
      createdAt: '2026-02-20T10:00:00.000Z',
    },
  ],
  coupons: [
    {
      id: 'coup-001',
      code: 'ROYAL10',
      discountType: 'percentage',
      discountValue: 10,
      minOrderValue: 20000,
      maxDiscount: 5000,
      usageCount: 14,
      usageLimit: 100,
      isActive: true,
      expiresAt: '2026-12-31',
    },
    {
      id: 'coup-002',
      code: 'WELCOME500',
      discountType: 'fixed',
      discountValue: 500,
      minOrderValue: 5000,
      usageCount: 28,
      usageLimit: 500,
      isActive: true,
      expiresAt: '2026-12-31',
    },
  ],
  reviews: [
    {
      id: 'rev-001',
      author: 'Sunita Reddy',
      city: 'Hyderabad',
      rating: 5,
      comment: 'The Royal Bridal Kundan Choker set is truly mesmerizing! The craftsmanship and South Sea pearl finishing exceeded our expectations for my daughter’s muhurtham. Fast UPI verification and insured delivery.',
      verifiedPurchase: true,
      jewelleryItem: 'Royal Bridal Kundan & Polki Choker Set',
      date: '2026-02-18',
    },
    {
      id: 'rev-002',
      author: 'Rajesh & Pooja Varma',
      city: 'Bengaluru',
      rating: 5,
      comment: 'Bought the 1.20ct Solitaire ring. Having the IGI diamond certificate and testing it at our family jeweller confirmed 100% genuine purity. The 3D interactive viewer on the website helped us examine every facet!',
      verifiedPurchase: true,
      jewelleryItem: 'Eternal Solitaire Diamond Ring (1.20 Carat)',
      date: '2026-02-22',
    },
    {
      id: 'rev-003',
      author: 'Meenakshi Sundaram',
      city: 'Chennai',
      rating: 5,
      comment: 'The Nakshi Antique Jhumkas have such royal weight and pristine 916 hallmarking. Thank you MPR Jewellers for preserving traditional Indian temple artistry.',
      verifiedPurchase: true,
      jewelleryItem: 'Heritage Nakshi Antique Jhumkas',
      date: '2026-02-24',
    },
  ],
  auditLogs: [
    {
      id: 'log-001',
      timestamp: new Date().toISOString(),
      actor: 'System Setup',
      action: 'SYSTEM_INITIALIZED',
      details: 'MPR JEWELLERY store initial database established with BIS 916 certified inventory.',
    },
  ],
};

function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseSchema = {
        ...defaultInitialData,
        ownerAccount: {
          ...defaultInitialData.ownerAccount,
          passwordHash: hashPassword('bhavyakth'),
        },
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);

    // Deep merge to ensure all new fields (pricing, promotionalBanners, categories, collections, ownerProfile) are present
    const merged: DatabaseSchema = {
      ...defaultInitialData,
      ...parsed,
      ownerProfile: parsed.ownerProfile || defaultOwnerProfile,
      collections: parsed.collections && parsed.collections.length > 0 ? parsed.collections : defaultCollections,
      pricingSettings: {
        ...defaultInitialData.pricingSettings,
        ...(parsed.pricingSettings || {}),
      },
      homepageSettings: {
        ...defaultInitialData.homepageSettings,
        ...(parsed.homepageSettings || {}),
        hero: {
          ...defaultInitialData.homepageSettings.hero,
          ...(parsed.homepageSettings?.hero || {}),
        },
        promotionalBanners:
          parsed.homepageSettings?.promotionalBanners && parsed.homepageSettings.promotionalBanners.length > 0
            ? parsed.homepageSettings.promotionalBanners
            : defaultInitialData.homepageSettings.promotionalBanners,
      },
      categories:
        parsed.categories && parsed.categories.length >= defaultCategories.length
          ? parsed.categories
          : defaultCategories,
      products:
        parsed.products && parsed.products.length > 0
          ? parsed.products
          : defaultInitialData.products,
    };

    let needsWrite = false;
    // Upgrade plaintext password if present from initial legacy seed
    if (merged.ownerAccount && merged.ownerAccount.passwordHash === 'bhavyakth') {
      merged.ownerAccount.passwordHash = hashPassword('bhavyakth');
      needsWrite = true;
    }

    if (!parsed.collections || !parsed.ownerProfile) {
      needsWrite = true;
    }

    if (needsWrite) {
      writeDb(merged);
    }

    return merged;
  } catch (err) {
    console.error('Error reading DB file, returning defaults', err);
    return defaultInitialData;
  }
}

function writeDb(data: DatabaseSchema) {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error writing DB file', err);
  }
}

readDb();

function addAuditLog(actor: string, action: string, details: string) {
  const db = readDb();
  const log: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    actor,
    action,
    details,
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 300) {
    db.auditLogs = db.auditLogs.slice(0, 300);
  }
  writeDb(db);
}

// Owner Auth Middleware
const OWNER_SESSION_SECRET = 'mpr_jewellery_owner_secret_key_2026';

function verifyOwnerToken(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Owner session token required' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [email, secret] = decoded.split(':::');
    const db = readDb();
    if (email === db.ownerAccount.email && secret === OWNER_SESSION_SECRET) {
      next();
      return;
    }
    res.status(403).json({ error: 'Forbidden: Invalid session token' });
  } catch {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
}

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// --- Owner Auth Endpoints ---
app.post('/api/owner/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const db = readDb();

  if (!email || email.trim().toLowerCase() !== db.ownerAccount.email.toLowerCase()) {
    addAuditLog('Anonymous', 'LOGIN_FAILED', `Failed login attempt for email: ${email}`);
    res.status(401).json({ error: 'Invalid owner email address' });
    return;
  }

  if (!verifyPassword(password, db.ownerAccount.passwordHash)) {
    addAuditLog(email, 'LOGIN_FAILED', 'Incorrect password entered');
    res.status(401).json({ error: 'Incorrect password' });
    return;
  }

  const token = Buffer.from(`${db.ownerAccount.email}:::${OWNER_SESSION_SECRET}:::${Date.now()}`).toString('base64');
  addAuditLog(email, 'OWNER_LOGIN_SUCCESS', 'Owner logged into administration portal');

  if (db.ownerProfile) {
    db.ownerProfile.lastLogin = new Date().toISOString();
    writeDb(db);
  }

  res.json({
    success: true,
    email: db.ownerAccount.email,
    token,
    requiresPasswordChange: db.ownerAccount.requiresPasswordChange,
    role: 'owner',
    profile: db.ownerProfile || defaultOwnerProfile,
  });
});

app.post('/api/owner/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  const db = readDb();
  if (!email || email.trim().toLowerCase() !== db.ownerAccount.email.toLowerCase()) {
    res.status(400).json({ error: 'No owner account associated with this email address' });
    return;
  }
  addAuditLog(email, 'FORGOT_PASSWORD_REQUEST', 'Owner requested password recovery details');
  res.json({
    success: true,
    message: `A password reset instruction has been logged for store owner Bhavya Madanambeti. Your initial seed password is preserved or can be securely updated via your authenticated owner session.`,
  });
});

app.post('/api/owner/logout', verifyOwnerToken, (_req: Request, res: Response) => {
  const db = readDb();
  addAuditLog(db.ownerAccount.email, 'OWNER_LOGOUT', 'Owner logged out from administration portal');
  res.json({ success: true, message: 'Owner session terminated successfully' });
});

app.post('/api/owner/change-password', verifyOwnerToken, (req: Request, res: Response) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const db = readDb();

  if (!currentPassword || !newPassword || !confirmPassword) {
    res.status(400).json({ error: 'All password fields are required' });
    return;
  }

  if (!verifyPassword(currentPassword, db.ownerAccount.passwordHash)) {
    res.status(400).json({ error: 'Current password does not match store records' });
    return;
  }

  if (newPassword !== confirmPassword) {
    res.status(400).json({ error: 'New password and confirmation do not match' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters long' });
    return;
  }

  db.ownerAccount.passwordHash = hashPassword(newPassword);
  db.ownerAccount.requiresPasswordChange = false;
  db.ownerAccount.updatedAt = new Date().toISOString();
  writeDb(db);

  addAuditLog(db.ownerAccount.email, 'PASSWORD_CHANGED', 'Owner password successfully updated');
  res.json({ success: true, message: 'Password updated successfully! First-login requirement satisfied.' });
});

app.get('/api/owner/verify-session', verifyOwnerToken, (_req: Request, res: Response) => {
  const db = readDb();
  res.json({
    valid: true,
    email: db.ownerAccount.email,
    requiresPasswordChange: db.ownerAccount.requiresPasswordChange,
    profile: db.ownerProfile || defaultOwnerProfile,
  });
});

app.get('/api/owner/profile', verifyOwnerToken, (_req: Request, res: Response) => {
  const db = readDb();
  res.json(db.ownerProfile || defaultOwnerProfile);
});

app.put('/api/owner/profile', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  db.ownerProfile = { ...(db.ownerProfile || defaultOwnerProfile), ...req.body };
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'UPDATE_OWNER_PROFILE', 'Owner profile contact and designation details updated');
  res.json({ success: true, profile: db.ownerProfile });
});

// --- Public & Storefront Settings ---
app.get('/api/settings', (_req: Request, res: Response) => {
  const db = readDb();
  res.json({
    brand: db.brandSettings,
    contact: db.contactSettings,
    pricing: db.pricingSettings,
    homepage: db.homepageSettings,
    upi: {
      enabled: db.upiSettings.enabled,
      upiId: db.upiSettings.upiId,
      payeeName: db.upiSettings.payeeName,
      phoneNumber: db.upiSettings.phoneNumber,
      merchantCode: db.upiSettings.merchantCode,
      qrCodeUrl: db.upiSettings.qrCodeUrl,
      maxAmountLimit: db.upiSettings.maxAmountLimit,
      instructions: db.upiSettings.instructions,
      supportMessage: db.upiSettings.supportMessage,
    },
    general: {
      storeName: db.generalSettings.storeName,
      isStoreOpen: db.generalSettings.isStoreOpen,
      maintenanceMode: db.generalSettings.maintenanceMode,
      allowGuestCheckout: db.generalSettings.allowGuestCheckout,
      allowCustomerRegistration: db.generalSettings.allowCustomerRegistration,
      aboutUsSummary: db.generalSettings.aboutUsSummary,
      heritageText: db.generalSettings.heritageText,
      termsAndConditions: db.generalSettings.termsAndConditions,
      privacyPolicy: db.generalSettings.privacyPolicy,
      shippingPolicy: db.generalSettings.shippingPolicy,
      returnPolicy: db.generalSettings.returnPolicy,
    },
    categories: db.categories,
  });
});

// --- Bullion & Diamond Rates ---
app.get('/api/rates', (_req: Request, res: Response) => {
  const db = readDb();
  res.json({
    goldRate24KPerGram: db.pricingSettings.goldRate24KPerGram,
    goldRate22KPerGram: db.pricingSettings.goldRate22KPerGram,
    goldRate18KPerGram: db.pricingSettings.goldRate18KPerGram || 5950,
    silverRatePerGram: db.pricingSettings.silverRatePerGram,
    diamondRatePerCaratBaseline: db.pricingSettings.diamondRatePerCaratBaseline || 85000,
    diamondRateDetails: db.pricingSettings.diamondRateDetails,
    ratesLastUpdated: db.pricingSettings.ratesLastUpdated,
    ratesSource: db.pricingSettings.ratesSource,
    trends: db.pricingSettings.trends,
  });
});

app.put('/api/owner/rates', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  db.pricingSettings = {
    ...db.pricingSettings,
    ...req.body,
    ratesLastUpdated: new Date().toISOString(),
    ratesSource: 'Owner Updated',
  };
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'UPDATE_BULLION_RATES', `Updated bullion rates (22K: ₹${db.pricingSettings.goldRate22KPerGram}, 24K: ₹${db.pricingSettings.goldRate24KPerGram}, 18K: ₹${db.pricingSettings.goldRate18KPerGram}, Silver: ₹${db.pricingSettings.silverRatePerGram})`);
  res.json({ success: true, pricing: db.pricingSettings });
});

// --- Owner Media Upload Endpoint ---
app.post('/api/owner/media/upload', verifyOwnerToken, (req: Request, res: Response) => {
  try {
    const { data, filename, mimeType } = req.body;
    if (!data) {
      res.status(400).json({ error: 'No media data provided' });
      return;
    }

    // Clean base64 data
    const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      // If it's already an external valid URL, return as-is
      if (typeof data === 'string' && data.startsWith('http')) {
        res.json({ url: data, filename: filename || 'external-media' });
        return;
      }
      res.status(400).json({ error: 'Invalid media format' });
      return;
    }

    const ext = mimeType?.split('/')[1] || filename?.split('.').pop() || 'jpg';
    const safeName = `media-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeName);

    fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64'));

    const publicUrl = `/uploads/${safeName}`;
    addAuditLog('Owner', 'MEDIA_UPLOADED', `Uploaded file: ${safeName}`);
    res.json({ success: true, url: publicUrl, filename: safeName });
  } catch (err: any) {
    console.error('Upload error', err);
    res.status(500).json({ error: 'Failed to upload media file' });
  }
});

// --- Owner Settings Updaters ---
app.put('/api/owner/settings/brand', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  db.brandSettings = { ...db.brandSettings, ...req.body };
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'UPDATE_BRAND_SETTINGS', 'Brand styling and logo settings updated');
  res.json({ success: true, brand: db.brandSettings });
});

app.put('/api/owner/settings/contact', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  db.contactSettings = { ...db.contactSettings, ...req.body };
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'UPDATE_CONTACT_SETTINGS', 'Contact and showroom details updated');
  res.json({ success: true, contact: db.contactSettings });
});

app.put('/api/owner/settings/pricing', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  db.pricingSettings = { ...db.pricingSettings, ...req.body };
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'UPDATE_PRICING_SETTINGS', 'Pricing, tax mode, gold rate, and shipping fees updated');
  res.json({ success: true, pricing: db.pricingSettings });
});

app.put('/api/owner/settings/upi', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  db.upiSettings = { ...db.upiSettings, ...req.body };
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'UPDATE_UPI_SETTINGS', `UPI settings updated (UPI ID: ${db.upiSettings.upiId})`);
  res.json({ success: true, upi: db.upiSettings });
});

app.put('/api/owner/settings/homepage', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  db.homepageSettings = { ...db.homepageSettings, ...req.body };
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'UPDATE_HOMEPAGE_SETTINGS', 'Homepage hero banner and sections reordered/updated');
  res.json({ success: true, homepage: db.homepageSettings });
});

app.put('/api/owner/homepage/banners', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  if (req.body.hero) {
    db.homepageSettings.hero = { ...db.homepageSettings.hero, ...req.body.hero };
  }
  if (req.body.promotionalBanners) {
    db.homepageSettings.promotionalBanners = req.body.promotionalBanners;
  }
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'UPDATE_HOMEPAGE_BANNERS', 'Promotional and hero banners updated');
  res.json({ success: true, homepage: db.homepageSettings });
});

app.put('/api/owner/settings/general', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  db.generalSettings = { ...db.generalSettings, ...req.body };
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'UPDATE_GENERAL_SETTINGS', 'Store availability and policies updated');
  res.json({ success: true, general: db.generalSettings });
});

// --- Categories Endpoints ---
app.get('/api/categories', (_req: Request, res: Response) => {
  const db = readDb();
  res.json(db.categories);
});

app.get('/api/categories/:slug', (req: Request, res: Response) => {
  const db = readDb();
  const slug = req.params.slug;
  const category = db.categories.find(c => c.slug === slug || c.id === slug);
  if (!category) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  const matchingProducts = slug === 'all'
    ? db.products.filter(p => !p.isArchived)
    : db.products.filter(p =>
        !p.isArchived &&
        (p.category === slug ||
          p.metal === slug ||
          p.tags.some(t => t.toLowerCase() === slug.toLowerCase()) ||
          (slug === 'wedding' && (p.category === 'bridal' || p.tags.includes('bridal') || p.tags.includes('wedding'))) ||
          (slug === 'traditional' && (p.category === 'bridal' || p.tags.includes('antique') || p.tags.includes('nakshi'))) ||
          (slug === 'gold-rings' && (p.category === 'rings' || p.tags.includes('gold-rings') || p.tags.includes('ring'))) ||
          (slug === 'silver-rings' && (p.category === 'silver-rings' || (p.metal === 'silver' && p.tags.includes('ring'))))
        )
      );

  res.json({
    category,
    products: matchingProducts,
  });
});

app.post('/api/owner/categories', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  const newCat: Category = {
    id: `cat-${Date.now()}`,
    name: req.body.name || 'New Category',
    slug: (req.body.name || 'new-category').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: req.body.description || '',
    image: req.body.image || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80',
    itemCount: 0,
    icon: req.body.icon,
  };
  db.categories.push(newCat);
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'CREATE_CATEGORY', `Created category: ${newCat.name}`);
  res.json({ success: true, category: newCat });
});

app.put('/api/owner/categories/:id', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  const idx = db.categories.findIndex(c => c.id === req.params.id || c.slug === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  db.categories[idx] = { ...db.categories[idx], ...req.body };
  writeDb(db);
  res.json({ success: true, category: db.categories[idx] });
});

app.delete('/api/owner/categories/:id', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  const idx = db.categories.findIndex(c => c.id === req.params.id || c.slug === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  const removed = db.categories.splice(idx, 1)[0];
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'DELETE_CATEGORY', `Deleted category: ${removed.name}`);
  res.json({ success: true, message: 'Category deleted' });
});

// --- Collections Endpoints ---
app.get('/api/collections', (_req: Request, res: Response) => {
  const db = readDb();
  res.json(db.collections || defaultCollections);
});

app.post('/api/owner/collections', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  if (!db.collections) db.collections = [...defaultCollections];
  const id = `col-${Date.now()}`;
  const slug = (req.body.name || 'collection').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const newCol: Collection = {
    id,
    name: req.body.name || 'New Collection',
    slug: req.body.slug || slug,
    description: req.body.description || '',
    bannerImage: req.body.bannerImage || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80',
    productCount: Number(req.body.productCount) || 0,
    featured: Boolean(req.body.featured),
    isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
    order: (db.collections.length || 0) + 1,
  };
  db.collections.push(newCol);
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'CREATE_COLLECTION', `Created collection: ${newCol.name}`);
  res.json({ success: true, collection: newCol });
});

app.put('/api/owner/collections/:id', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  if (!db.collections) db.collections = [...defaultCollections];
  const idx = db.collections.findIndex(c => c.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Collection not found' });
    return;
  }
  db.collections[idx] = { ...db.collections[idx], ...req.body };
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'UPDATE_COLLECTION', `Updated collection: ${db.collections[idx].name}`);
  res.json({ success: true, collection: db.collections[idx] });
});

app.delete('/api/owner/collections/:id', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  if (!db.collections) db.collections = [...defaultCollections];
  const idx = db.collections.findIndex(c => c.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Collection not found' });
    return;
  }
  const deleted = db.collections.splice(idx, 1)[0];
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'DELETE_COLLECTION', `Deleted collection: ${deleted.name}`);
  res.json({ success: true, message: 'Collection deleted' });
});

// --- Owner Media Gallery Endpoint ---
app.get('/api/owner/media', verifyOwnerToken, (_req: Request, res: Response) => {
  const db = readDb();
  const mediaSet = new Set<string>();

  try {
    if (fs.existsSync(UPLOADS_DIR)) {
      const files = fs.readdirSync(UPLOADS_DIR);
      files.forEach(f => mediaSet.add(`/uploads/${f}`));
    }
  } catch (e) {
    console.error(e);
  }

  db.products.forEach(p => {
    p.images?.forEach(img => mediaSet.add(img));
  });

  db.categories.forEach(c => {
    if (c.image) mediaSet.add(c.image);
  });

  if (db.homepageSettings?.hero?.imageUrl) mediaSet.add(db.homepageSettings.hero.imageUrl);
  db.homepageSettings?.promotionalBanners?.forEach(b => {
    if (b.imageUrl) mediaSet.add(b.imageUrl);
  });

  res.json({
    media: Array.from(mediaSet).map(url => ({
      url,
      filename: url.split('/').pop() || 'media',
      type: url.includes('.mp4') ? 'video' : 'image',
    })),
  });
});

app.put('/api/owner/settings/shipping', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  const { deliveryCharge, freeDeliveryThreshold, shippingPolicy } = req.body;
  if (deliveryCharge !== undefined) db.pricingSettings.deliveryCharge = Number(deliveryCharge);
  if (freeDeliveryThreshold !== undefined) db.pricingSettings.freeDeliveryThreshold = Number(freeDeliveryThreshold);
  if (shippingPolicy !== undefined) db.generalSettings.shippingPolicy = shippingPolicy;
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'UPDATE_SHIPPING_SETTINGS', `Updated delivery and shipping policies`);
  res.json({ success: true, pricing: db.pricingSettings, general: db.generalSettings });
});

// --- Products Endpoints ---
app.get('/api/products', (req: Request, res: Response) => {
  const db = readDb();
  let list = db.products.filter(p => !p.isArchived);

  const category = req.query.category as string;
  if (category && category !== 'all') {
    list = list.filter(p =>
      p.category === category ||
      p.metal === category ||
      p.tags.some(t => t.toLowerCase() === category.toLowerCase()) ||
      (category === 'wedding' && (p.category === 'bridal' || p.tags.includes('bridal') || p.tags.includes('wedding'))) ||
      (category === 'traditional' && (p.tags.includes('antique') || p.tags.includes('nakshi') || p.tags.includes('temple'))) ||
      (category === 'gold-rings' && (p.category === 'rings' || p.tags.includes('gold-rings') || (p.metal === 'gold' && p.tags.includes('ring')))) ||
      (category === 'silver-rings' && (p.category === 'silver-rings' || (p.metal === 'silver' && p.tags.includes('ring'))))
    );
  }

  const metal = req.query.metal as string;
  if (metal && metal !== 'all') {
    list = list.filter(p => p.metal === metal);
  }

  const search = req.query.search as string;
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(s) ||
      p.description.toLowerCase().includes(s) ||
      p.sku.toLowerCase().includes(s) ||
      p.purity.toLowerCase().includes(s) ||
      p.tags.some(t => t.toLowerCase().includes(s))
    );
  }

  const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : 0;
  const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : Infinity;
  list = list.filter(p => p.price >= minPrice && p.price <= maxPrice);

  const featured = req.query.featured === 'true';
  if (featured) {
    list = list.filter(p => p.isFeatured);
  }

  const sort = req.query.sort as string;
  if (sort === 'price_asc') {
    list.sort((a, b) => a.price - b.price);
  } else if (sort === 'price_desc') {
    list.sort((a, b) => b.price - a.price);
  } else if (sort === 'weight_desc') {
    list.sort((a, b) => b.grossWeightGrams - a.grossWeightGrams);
  } else {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json(list);
});

app.get('/api/products/:id', (req: Request, res: Response) => {
  const db = readDb();
  const product = db.products.find(p => p.id === req.params.id || p.slug === req.params.id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.json(product);
});

app.post('/api/owner/products', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  const id = `prod-${Date.now()}`;
  const now = new Date().toISOString();
  const slug = (req.body.name || 'product')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const newProduct: Product = {
    id,
    slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
    name: req.body.name || 'Untitled Jewellery',
    sku: req.body.sku || `MPR-${Date.now().toString().slice(-6)}`,
    category: req.body.category || 'gold',
    metal: req.body.metal || 'gold',
    purity: req.body.purity || '22K (916 Hallmarked)',
    price: Number(req.body.price) || 0,
    originalPrice: req.body.originalPrice ? Number(req.body.originalPrice) : undefined,
    grossWeightGrams: Number(req.body.grossWeightGrams) || 0,
    netWeightGrams: Number(req.body.netWeightGrams) || Number(req.body.grossWeightGrams) || 0,
    stoneWeightCarats: req.body.stoneWeightCarats ? Number(req.body.stoneWeightCarats) : undefined,
    description: req.body.description || '',
    specifications: req.body.specifications || {},
    images: Array.isArray(req.body.images) && req.body.images.length > 0
      ? req.body.images
      : ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80'],
    imageDetails: req.body.imageDetails || [],
    videos: req.body.videos || [],
    stockQuantity: Number(req.body.stockQuantity) ?? 1,
    isFeatured: Boolean(req.body.isFeatured),
    isNewArrival: Boolean(req.body.isNewArrival),
    isBestSeller: Boolean(req.body.isBestSeller),
    isArchived: false,
    has3DModel: Boolean(req.body.has3DModel),
    model3DType: req.body.model3DType || 'pendant',
    tags: Array.isArray(req.body.tags) ? req.body.tags : [],
    createdAt: now,
    updatedAt: now,
  };

  db.products.unshift(newProduct);
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'CREATE_PRODUCT', `Added jewellery: ${newProduct.name} (${newProduct.sku})`);
  res.json({ success: true, product: newProduct });
});

app.put('/api/owner/products/:id', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  const index = db.products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const updated: Product = {
    ...db.products[index],
    ...req.body,
    id: db.products[index].id,
    updatedAt: new Date().toISOString(),
  };

  db.products[index] = updated;
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'UPDATE_PRODUCT', `Updated jewellery: ${updated.name} (${updated.sku})`);
  res.json({ success: true, product: updated });
});

app.put('/api/owner/products/:id/media', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  const index = db.products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const { images, imageDetails, videos } = req.body;
  if (images) db.products[index].images = images;
  if (imageDetails) db.products[index].imageDetails = imageDetails;
  if (videos) db.products[index].videos = videos;
  db.products[index].updatedAt = new Date().toISOString();

  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'UPDATE_PRODUCT_MEDIA', `Updated images/videos for ${db.products[index].name}`);
  res.json({ success: true, product: db.products[index] });
});

app.delete('/api/owner/products/:id', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  const index = db.products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const name = db.products[index].name;
  if (req.query.permanent === 'true') {
    db.products.splice(index, 1);
    writeDb(db);
    addAuditLog(db.ownerAccount.email, 'DELETE_PRODUCT', `Permanently removed jewellery: ${name}`);
    res.json({ success: true, message: 'Product permanently deleted from catalogue' });
    return;
  }

  db.products[index].isArchived = true;
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'ARCHIVE_PRODUCT', `Archived jewellery: ${name}`);
  res.json({ success: true, message: 'Product archived successfully' });
});

// --- Orders & UPI Payment Processing ---
app.post('/api/orders', (req: Request, res: Response) => {
  const db = readDb();
  const { customerName, customerEmail, customerPhone, shippingAddress, items, couponCode } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Order must contain at least one item' });
    return;
  }

  let subtotal = 0;
  const processedItems = items.map((cartItem: any) => {
    const product = db.products.find(p => p.id === cartItem.productId);
    const price = product ? product.price : cartItem.price || 0;
    const qty = cartItem.quantity || 1;
    subtotal += price * qty;
    return {
      productId: cartItem.productId,
      productName: product ? product.name : cartItem.productName,
      productSku: product ? product.sku : 'SKU-GEN',
      image: product && product.images[0] ? product.images[0] : cartItem.image,
      price,
      quantity: qty,
      metal: product ? product.metal : 'gold',
      purity: product ? product.purity : '22K (916)',
      selectedSize: cartItem.selectedSize,
      customEngraving: cartItem.customEngraving,
      weightGrams: product ? product.grossWeightGrams : 0,
    };
  });

  let discountAmount = 0;
  if (couponCode) {
    const coupon = db.coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.isActive);
    if (coupon && subtotal >= coupon.minOrderValue) {
      if (coupon.discountType === 'percentage') {
        discountAmount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      } else {
        discountAmount = coupon.discountValue;
      }
      coupon.usageCount = (coupon.usageCount || 0) + 1;
    }
  }

  const shippingFee = subtotal >= db.pricingSettings.freeDeliveryThreshold ? 0 : db.pricingSettings.deliveryCharge;

  let taxAmount = 0;
  if (db.pricingSettings.taxMode === 'exclusive') {
    taxAmount = Math.round(((subtotal - discountAmount) * db.pricingSettings.taxRatePercent) / 100);
  } else {
    taxAmount = Math.round(((subtotal - discountAmount) * db.pricingSettings.taxRatePercent) / (100 + db.pricingSettings.taxRatePercent));
  }

  const totalAmount = db.pricingSettings.taxMode === 'exclusive'
    ? subtotal - discountAmount + shippingFee + taxAmount
    : subtotal - discountAmount + shippingFee;

  const orderNumber = `MPR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const orderId = `ord-${Date.now()}`;
  const now = new Date().toISOString();

  const payeeUPI = db.upiSettings.upiId;
  const payeeName = db.upiSettings.payeeName;
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(payeeUPI)}&pn=${encodeURIComponent(payeeName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Order ${orderNumber}`)}`;

  const newOrder: Order = {
    id: orderId,
    orderNumber,
    customerId: req.body.customerId,
    customerName: customerName || shippingAddress.fullName,
    customerEmail: customerEmail || shippingAddress.email,
    customerPhone: customerPhone || shippingAddress.phone,
    shippingAddress,
    items: processedItems,
    subtotal,
    discountAmount,
    couponCode,
    shippingFee,
    taxAmount,
    totalAmount,
    paymentMethod: 'UPI',
    paymentStatus: 'pending',
    orderStatus: 'pending_verification',
    upiPaymentDetails: {
      upiId: payeeUPI,
      payeeName,
    },
    notes: req.body.notes,
    createdAt: now,
    updatedAt: now,
  };

  db.orders.unshift(newOrder);
  writeDb(db);
  addAuditLog(customerEmail || customerName, 'CREATE_ORDER', `Created Order ${orderNumber} for ₹${totalAmount}`);

  res.json({
    success: true,
    order: newOrder,
    upi: {
      upiId: payeeUPI,
      payeeName,
      amount: totalAmount,
      deepLink: upiDeepLink,
      orderNumber,
    },
  });
});

app.post('/api/orders/:orderNumber/submit-upi', (req: Request, res: Response) => {
  const db = readDb();
  const { orderNumber } = req.params;
  const { utrNumber, paymentNote, screenshotUrl } = req.body;

  if (!utrNumber || utrNumber.trim().length < 6) {
    res.status(400).json({ error: 'Please enter a valid 12-digit UPI UTR / Transaction Reference number' });
    return;
  }

  const duplicate = db.orders.find(o =>
    o.orderNumber !== orderNumber &&
    o.upiPaymentDetails?.utrNumber === utrNumber.trim()
  );
  if (duplicate) {
    res.status(400).json({ error: `This UTR reference has already been submitted for another order (${duplicate.orderNumber}). Please verify your banking receipt.` });
    return;
  }

  const order = db.orders.find(o => o.orderNumber === orderNumber || o.id === orderNumber);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  order.upiPaymentDetails = {
    ...order.upiPaymentDetails,
    upiId: order.upiPaymentDetails?.upiId || db.upiSettings.upiId,
    payeeName: order.upiPaymentDetails?.payeeName || db.upiSettings.payeeName,
    utrNumber: utrNumber.trim(),
    paymentNote: paymentNote || '',
    screenshotUrl: screenshotUrl || '',
    submittedAt: new Date().toISOString(),
    rejectedReason: undefined,
  };
  order.paymentStatus = 'submitted_verification';
  order.orderStatus = 'pending_verification';
  order.updatedAt = new Date().toISOString();

  writeDb(db);
  addAuditLog(order.customerName, 'UPI_UTR_SUBMITTED', `Customer submitted UTR: ${utrNumber} for Order ${order.orderNumber}`);

  res.json({
    success: true,
    message: 'Payment verification submitted. The MPR accounts team will verify your UTR reference against our bank statement.',
    order,
  });
});

app.get('/api/orders/track', (req: Request, res: Response) => {
  const db = readDb();
  const query = (req.query.q as string || '').trim().toLowerCase();
  const phone = (req.query.phone as string || '').trim();

  if (!query) {
    res.status(400).json({ error: 'Order Number or Email is required' });
    return;
  }

  const match = db.orders.find(o => {
    const matchOrder = o.orderNumber.toLowerCase() === query || o.id.toLowerCase() === query;
    const matchContact = (phone && o.customerPhone.includes(phone)) || o.customerEmail.toLowerCase() === query;
    return matchOrder || matchContact;
  });

  if (!match) {
    res.status(404).json({ error: 'No order found matching your inquiry. Please check the order number or contact our WhatsApp concierge.' });
    return;
  }

  res.json(match);
});

app.get('/api/owner/orders', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  let list = [...db.orders];

  const status = req.query.status as string;
  if (status && status !== 'all') {
    list = list.filter(o => o.orderStatus === status || o.paymentStatus === status);
  }

  const search = req.query.search as string;
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(o =>
      o.orderNumber.toLowerCase().includes(s) ||
      o.customerName.toLowerCase().includes(s) ||
      o.customerPhone.includes(s) ||
      (o.upiPaymentDetails?.utrNumber && o.upiPaymentDetails.utrNumber.includes(s))
    );
  }

  res.json(list);
});

app.post('/api/owner/orders/:id/verify-upi', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  const { id } = req.params;
  const { decision, reason } = req.body;

  const order = db.orders.find(o => o.id === id || o.orderNumber === id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const now = new Date().toISOString();

  if (decision === 'approve') {
    order.paymentStatus = 'verified';
    order.orderStatus = 'confirmed';
    if (order.upiPaymentDetails) {
      order.upiPaymentDetails.verifiedAt = now;
      order.upiPaymentDetails.rejectedReason = undefined;
    }
    order.items.forEach(item => {
      const prod = db.products.find(p => p.id === item.productId);
      if (prod) {
        prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
      }
    });
    addAuditLog(db.ownerAccount.email, 'PAYMENT_VERIFIED', `Verified UPI payment of ₹${order.totalAmount} for Order ${order.orderNumber}`);
  } else if (decision === 'reject') {
    order.paymentStatus = 'rejected';
    order.orderStatus = 'cancelled';
    if (order.upiPaymentDetails) {
      order.upiPaymentDetails.rejectedReason = reason || 'Payment not credited or invalid transaction UTR reference.';
    }
    addAuditLog(db.ownerAccount.email, 'PAYMENT_REJECTED', `Rejected payment for Order ${order.orderNumber}. Reason: ${reason}`);
  } else {
    res.status(400).json({ error: 'Invalid decision. Must be approve or reject' });
    return;
  }

  order.updatedAt = now;
  writeDb(db);
  res.json({ success: true, order });
});

app.put('/api/owner/orders/:id/status', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  const order = db.orders.find(o => o.id === req.params.id || o.orderNumber === req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const { orderStatus, trackingNumber, carrier, trackingUrl } = req.body;
  if (orderStatus) {
    order.orderStatus = orderStatus;
  }
  if (trackingNumber) {
    order.trackingDetails = {
      carrier: carrier || 'BlueDart Apex Express',
      trackingNumber,
      trackingUrl: trackingUrl || 'https://www.bluedart.com',
      shippedDate: new Date().toISOString(),
      estimatedDelivery: '3 to 5 business days',
    };
  }
  order.updatedAt = new Date().toISOString();
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'UPDATE_ORDER_STATUS', `Order ${order.orderNumber} status changed to ${orderStatus}`);
  res.json({ success: true, order });
});

// --- Coupons ---
app.post('/api/coupons/apply', (req: Request, res: Response) => {
  const db = readDb();
  const { code, cartTotal } = req.body;
  if (!code) {
    res.status(400).json({ error: 'Coupon code required' });
    return;
  }

  const coupon = db.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive);
  if (!coupon) {
    res.status(404).json({ error: 'Invalid or expired coupon code' });
    return;
  }

  if (cartTotal < coupon.minOrderValue) {
    res.status(400).json({ error: `This coupon requires a minimum cart value of ₹${coupon.minOrderValue.toLocaleString('en-IN')}` });
    return;
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (cartTotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.discountValue;
  }

  res.json({
    valid: true,
    code: coupon.code,
    discountAmount: Math.round(discount),
    message: `Coupon ${coupon.code} applied! Saved ₹${Math.round(discount).toLocaleString('en-IN')}`,
  });
});

app.get('/api/owner/coupons', verifyOwnerToken, (_req: Request, res: Response) => {
  const db = readDb();
  res.json(db.coupons);
});

app.post('/api/owner/coupons', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  const newCoupon: Coupon = {
    id: `coup-${Date.now()}`,
    code: (req.body.code || '').toUpperCase().trim(),
    discountType: req.body.discountType || 'percentage',
    discountValue: Number(req.body.discountValue) || 10,
    minOrderValue: Number(req.body.minOrderValue) || 0,
    maxDiscount: req.body.maxDiscount ? Number(req.body.maxDiscount) : undefined,
    usageCount: 0,
    usageLimit: req.body.usageLimit ? Number(req.body.usageLimit) : undefined,
    expiresAt: req.body.expiresAt,
    isActive: true,
  };
  db.coupons.unshift(newCoupon);
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'CREATE_COUPON', `Created coupon ${newCoupon.code}`);
  res.json({ success: true, coupon: newCoupon });
});

app.delete('/api/owner/coupons/:id', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  const idx = db.coupons.findIndex(c => c.id === req.params.id || c.code === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Coupon not found' });
    return;
  }
  const removed = db.coupons.splice(idx, 1)[0];
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'DELETE_COUPON', `Deleted coupon ${removed.code}`);
  res.json({ success: true, message: 'Coupon removed' });
});

// --- Owner Reviews Management ---
app.post('/api/owner/reviews', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  const newRev: Review = {
    id: `rev-${Date.now()}`,
    author: req.body.author || 'Store Customer',
    city: req.body.city || 'India',
    rating: Number(req.body.rating) || 5,
    comment: req.body.comment || '',
    verifiedPurchase: req.body.verifiedPurchase !== undefined ? Boolean(req.body.verifiedPurchase) : true,
    jewelleryItem: req.body.jewelleryItem || 'Jewellery Ornament',
    date: new Date().toISOString().slice(0, 10),
  };
  db.reviews.unshift(newRev);
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'ADD_REVIEW', `Added testimonial by ${newRev.author}`);
  res.json({ success: true, review: newRev });
});

app.put('/api/owner/reviews/:id', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  const idx = db.reviews.findIndex(r => r.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }
  db.reviews[idx] = { ...db.reviews[idx], ...req.body };
  writeDb(db);
  res.json({ success: true, review: db.reviews[idx] });
});

app.delete('/api/owner/reviews/:id', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  const idx = db.reviews.findIndex(r => r.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }
  const removed = db.reviews.splice(idx, 1)[0];
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'DELETE_REVIEW', `Deleted review by ${removed.author}`);
  res.json({ success: true, message: 'Review deleted' });
});

// --- Owner Analytics & Dashboard Overview ---
app.get('/api/owner/analytics', verifyOwnerToken, (_req: Request, res: Response) => {
  const db = readDb();
  const orders = db.orders;

  const totalOrders = orders.length;
  const verifiedOrders = orders.filter(o => o.paymentStatus === 'verified' && o.orderStatus !== 'cancelled');
  const pendingVerificationOrders = orders.filter(o => o.paymentStatus === 'submitted_verification');
  const unpaidOrders = orders.filter(o => o.paymentStatus === 'pending');
  const cancelledOrders = orders.filter(o => o.orderStatus === 'cancelled');

  const totalRevenue = verifiedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingVerificationRevenue = pendingVerificationOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter(o => o.createdAt.startsWith(todayStr));
  const todaySales = todayOrders.filter(o => o.paymentStatus === 'verified' && o.orderStatus !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0);

  const lowStock = db.products.filter(p => !p.isArchived && p.stockQuantity <= 3);

  res.json({
    totalOrders,
    verifiedOrdersCount: verifiedOrders.length,
    pendingVerificationCount: pendingVerificationOrders.length,
    unpaidCount: unpaidOrders.length,
    cancelledCount: cancelledOrders.length,
    totalRevenue,
    pendingVerificationRevenue,
    todayOrdersCount: todayOrders.length,
    todaySales,
    totalProducts: db.products.filter(p => !p.isArchived).length,
    lowStockCount: lowStock.length,
    lowStockProducts: lowStock.map(p => ({ id: p.id, name: p.name, sku: p.sku, stock: p.stockQuantity })),
    recentOrders: orders.slice(0, 8),
    recentAuditLogs: db.auditLogs.slice(0, 10),
  });
});

// --- Owner Notifications ---
app.get('/api/owner/notifications', verifyOwnerToken, (_req: Request, res: Response) => {
  const db = readDb();
  const notifs: OwnerNotification[] = [];

  const pendingUpi = db.orders.filter(o => o.paymentStatus === 'submitted_verification');
  if (pendingUpi.length > 0) {
    notifs.push({
      id: 'notif-pending-upi',
      title: `${pendingUpi.length} Pending UPI Verifications`,
      message: `${pendingUpi.length} customer(s) submitted UTR transaction references. Verify against ICICI bank statement.`,
      type: 'payment',
      severity: 'urgent',
      createdAt: pendingUpi[0].upiPaymentDetails?.submittedAt || new Date().toISOString(),
      isRead: false,
      linkTab: 'payments',
    });
  }

  const lowStock = db.products.filter(p => !p.isArchived && p.stockQuantity <= 2);
  if (lowStock.length > 0) {
    notifs.push({
      id: 'notif-low-stock',
      title: `${lowStock.length} Low Stock Inventory Warnings`,
      message: `${lowStock.map(p => `${p.name} (${p.stockQuantity} remaining)`).slice(0, 3).join(', ')} require restocking.`,
      type: 'stock',
      severity: 'warning',
      createdAt: new Date().toISOString(),
      isRead: false,
      linkTab: 'products',
    });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = db.orders.filter(o => o.createdAt.startsWith(todayStr));
  if (todayOrders.length > 0) {
    notifs.push({
      id: 'notif-today-orders',
      title: `${todayOrders.length} New Orders Received Today`,
      message: `Total booking amount ₹${todayOrders.reduce((s, o) => s + o.totalAmount, 0).toLocaleString('en-IN')}`,
      type: 'order',
      severity: 'info',
      createdAt: todayOrders[0].createdAt,
      isRead: false,
      linkTab: 'orders',
    });
  }

  notifs.push({
    id: 'notif-rates-status',
    title: 'Daily Bullion Market Rates',
    message: `22K Gold: ₹${db.pricingSettings.goldRate22KPerGram}/g | 24K: ₹${db.pricingSettings.goldRate24KPerGram}/g | Silver: ₹${db.pricingSettings.silverRatePerGram}/g.`,
    type: 'system',
    severity: 'info',
    createdAt: db.pricingSettings.ratesLastUpdated,
    isRead: true,
    linkTab: 'rates',
  });

  res.json(notifs);
});

// --- Owner Reports ---
app.get('/api/owner/reports', verifyOwnerToken, (_req: Request, res: Response) => {
  const db = readDb();
  const validOrders = db.orders.filter(o => o.orderStatus !== 'cancelled');
  const verifiedOrders = db.orders.filter(o => o.paymentStatus === 'verified' && o.orderStatus !== 'cancelled');

  const metalBreakdown: Record<string, { count: number; revenue: number }> = {
    gold: { count: 0, revenue: 0 },
    diamond: { count: 0, revenue: 0 },
    silver: { count: 0, revenue: 0 },
  };

  verifiedOrders.forEach(o => {
    o.items.forEach(it => {
      const m = it.metal || 'gold';
      if (!metalBreakdown[m]) metalBreakdown[m] = { count: 0, revenue: 0 };
      metalBreakdown[m].count += it.quantity;
      metalBreakdown[m].revenue += it.price * it.quantity;
    });
  });

  const productSalesMap: Record<string, { name: string; sku: string; units: number; revenue: number }> = {};
  verifiedOrders.forEach(o => {
    o.items.forEach(it => {
      if (!productSalesMap[it.productId]) {
        productSalesMap[it.productId] = { name: it.productName, sku: it.productSku, units: 0, revenue: 0 };
      }
      productSalesMap[it.productId].units += it.quantity;
      productSalesMap[it.productId].revenue += it.price * it.quantity;
    });
  });

  const topProducts = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const totalRevenue = verifiedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingRevenue = db.orders.filter(o => o.paymentStatus === 'submitted_verification').reduce((sum, o) => sum + o.totalAmount, 0);

  res.json({
    totalRevenue,
    pendingRevenue,
    totalValidOrders: validOrders.length,
    verifiedOrdersCount: verifiedOrders.length,
    cancelledOrdersCount: db.orders.filter(o => o.orderStatus === 'cancelled').length,
    metalBreakdown,
    topProducts,
    ordersCount: db.orders.length,
  });
});

app.get('/api/owner/customers', verifyOwnerToken, (_req: Request, res: Response) => {
  const db = readDb();
  res.json(db.customers);
});

app.post('/api/owner/customers', verifyOwnerToken, (req: Request, res: Response) => {
  const db = readDb();
  const newCust: CustomerUser = {
    id: `cust-${Date.now()}`,
    fullName: req.body.fullName || 'Valued Customer',
    email: req.body.email || `customer-${Date.now()}@mpr.com`,
    phone: req.body.phone || '+91 99999 99999',
    savedAddresses: req.body.savedAddresses || [],
    wishlistProductIds: [],
    createdAt: new Date().toISOString(),
  };
  db.customers.unshift(newCust);
  writeDb(db);
  addAuditLog(db.ownerAccount.email, 'ADD_CUSTOMER', `Registered customer: ${newCust.fullName}`);
  res.json({ success: true, customer: newCust });
});

app.get('/api/reviews', (_req: Request, res: Response) => {
  const db = readDb();
  res.json(db.reviews);
});

app.get('/api/owner/audit-logs', verifyOwnerToken, (_req: Request, res: Response) => {
  const db = readDb();
  res.json(db.auditLogs);
});

app.get('/api/owner/export-orders-csv', verifyOwnerToken, (_req: Request, res: Response) => {
  const db = readDb();
  const headers = ['Order Number', 'Date', 'Customer Name', 'Phone', 'Email', 'City', 'State', 'Items Count', 'Total (INR)', 'Payment Status', 'Order Status', 'UTR Number'];
  const rows = db.orders.map(o => [
    `"${o.orderNumber}"`,
    `"${o.createdAt.slice(0, 10)}"`,
    `"${o.customerName.replace(/"/g, '""')}"`,
    `"${o.customerPhone}"`,
    `"${o.customerEmail}"`,
    `"${o.shippingAddress.city}"`,
    `"${o.shippingAddress.state}"`,
    o.items.length,
    o.totalAmount,
    o.paymentStatus,
    o.orderStatus,
    `"${o.upiPaymentDetails?.utrNumber || ''}"`,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=MPR_Jewellery_Orders_${Date.now()}.csv`);
  res.send(csv);
});

// Gemini AI Consultant
app.post('/api/ai/consultant', async (req: Request, res: Response) => {
  const { message } = req.body;
  const db = readDb();

  const apiKey = process.env.GEMINI_API_KEY;

  const systemInstruction = `
You are "Ratna Vidya" - the Royal Chief Jewellery & Gemological Consultant at MPR JEWELLERY (India's premier luxury heritage brand).
Your expertise covers:
1. Gold Purity: 24K (999), 22K (916 BIS Hallmarked bridal & temple jewellery), 18K (750 ideal for diamond setting & daily wear), 14K (585). Explain hallmark stamps, HUID, making charges, and calculate gold value based on current MPR rates: 22K @ ₹${db.pricingSettings.goldRate22KPerGram}/g, 24K @ ₹${db.pricingSettings.goldRate24KPerGram}/g, 18K @ ₹${db.pricingSettings.goldRate18KPerGram || 5950}/g.
2. Diamonds: The 4Cs (Cut, Clarity VVS/VS, Color D-F, Carat), IGI / SGL certifications, solitaire engagement advice, baseline carat pricing around ₹${(db.pricingSettings.diamondRatePerCaratBaseline || 85000).toLocaleString('en-IN')}/ct for VVS certified stones.
3. Silver: 925 Sterling Silver authenticity, 999 Fine Silver puja thali & idol sanctity.
4. Bridal Occasion Styling: Coordinating chokers, kasu mala, jhumkas, and kadas with Kanjeevaram silk sarees, lehengas, and gowns.
Tone: Courteous, cultured, welcoming (Namaste), royal Indian hospitality. Suggest relevant pieces from the MPR collection when applicable.
`;

  if (!apiKey) {
    const fallbackResponse = `Namaste! Welcome to MPR JEWELLERY. 
I am delighted to assist you with our 22K BIS 916 Hallmarked Gold, Certified VVS Diamonds, and 925 Sterling Silver collections.

• Today's Bullion Rates: 22K Gold @ ₹${db.pricingSettings.goldRate22KPerGram.toLocaleString('en-IN')}/g | 24K @ ₹${db.pricingSettings.goldRate24KPerGram.toLocaleString('en-IN')}/g | 18K @ ₹${(db.pricingSettings.goldRate18KPerGram || 5950).toLocaleString('en-IN')}/g | 999 Silver @ ₹${db.pricingSettings.silverRatePerGram}/g.
• Diamonds: Certified natural solitaires in VVS1-VS2 clarity with IGI certificate cards.
• Insured Delivery: Pan-India free express delivery with tamper-proof OTP handover.

How may I assist your jewellery selection today?`;
    res.json({ text: fallbackResponse });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const catalogSummary = db.products.slice(0, 8).map(p => `- ${p.name}: ${p.purity}, ₹${p.price.toLocaleString('en-IN')}, SKU: ${p.sku}`).join('\n');
    const promptText = `
Available MPR Store Masterpieces:
${catalogSummary}

User question: "${message}"

Please respond warmly as the MPR Royal Jewellery Consultant.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text || 'Namaste! Please let me know which piece from MPR JEWELLERY you would like to know more about.' });
  } catch (error: any) {
    console.error('Gemini Consultant Error:', error);
    res.json({
      text: `Namaste! Thank you for inquiring with MPR JEWELLERY. We specialize in 22K BIS 916 Hallmarked Gold, IGI Certified Solitaire Diamonds, and 925 Silver. For immediate assistance with gold rates or custom designs, our team is also available via WhatsApp at ${db.contactSettings.whatsapp}.`,
    });
  }
});

app.post('/api/ai/appraise-image', async (req: Request, res: Response) => {
  const { imageBase64, mimeType, prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !imageBase64) {
    res.json({
      text: 'Namaste! Based on your image, we recommend pairing with our 22K Gold Temple Kasu Mala or 18K Diamond Solitaire set for a majestic royal look. Visit our interactive 3D lounge to inspect finishes.',
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || 'image/jpeg',
            },
          },
          {
            text: prompt || 'Analyze this outfit or jewellery photo. Suggest matching Indian precious jewellery styles (22K Gold, VVS Diamonds, or 925 Sterling Silver), neckline pairing, and styling recommendations.',
          },
        ],
      },
    });

    res.json({ text: response.text });
  } catch (err) {
    console.error('Image appraisal error:', err);
    res.json({
      text: 'Namaste! Our gemologists suggest classic 22K gold temple jhumkas and a delicate choker to complement your shared style.',
    });
  }
});

// Vite Dev Integration / Production Static Serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ MPR JEWELLERY server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
