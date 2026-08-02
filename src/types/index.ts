export type UserRole = 'customer' | 'owner' | 'admin';

export interface ShopRequest {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  city: string;
  address?: string;
  description: string;
  logoUrl?: string;
  ownerId?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ProfileChangeRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  shopId?: string;
  shopName?: string;
  requestedDisplayName: string;
  requestedPhotoURL: string;
  currentDisplayName: string;
  currentPhotoURL?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  photoURL?: string;
  role: UserRole;
  createdAt: string;
  shopId?: string; // If owner or staff
  status?: 'active' | 'suspended' | 'pending';
}

export interface Branch {
  id: string;
  shopId: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  workingHours: string;
  isMain?: boolean;
  status?: 'pending_approval' | 'approved' | 'rejected';
}

export interface Staff {
  id: string;
  shopId: string;
  name: string;
  email: string;
  phone: string;
  roleTitle: string; // e.g. "فني صيانة", "محاسب", "مدير مبيعات"
  permissions: ('maintenance' | 'sales' | 'inventory' | 'management')[];
  createdAt: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  youtube?: string;
}

export interface ShopReview {
  id: string;
  shopId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface MaintenanceServiceInfo {
  id: string;
  title: string;
  description: string;
  iconName?: string;
  estimatedHours?: string;
  warrantyPeriod?: string;
}

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  logo: string;
  coverImage: string;
  description: string;
  category: string; // e.g., "صيانة أبل وأندرويد", "إلكترونيات عامة"
  city: string;
  address: string;
  phone: string;
  whatsapp?: string;
  rating: number;
  reviewsCount: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  workingHours: string;
  isOpen?: boolean;
  branches: Branch[];
  distanceKm?: number; // Calculated or mock distance for customer nearby view
  createdAt: string;
  experienceYears?: number;
  employeesCount?: number;
  services?: string[];
  socialLinks?: SocialLinks;
  isDetailsCompleted?: boolean;
}

export interface Product {
  id: string;
  shopId: string;
  shopName?: string;
  name: string;
  description: string;
  priceIQD: number;
  compareAtPriceIQD?: number;
  quantity: number;
  category: string;
  images: string[];
  barcode: string;
  qrCode: string;
  featured?: boolean;
  createdAt: string;
}

export type MaintenanceStatus =
  | 'received'      // تم الاستلام
  | 'inspecting'    // قيد الفحص
  | 'awaiting_approval' // بانتظار الموافقة
  | 'repairing'     // قيد الإصلاح
  | 'ready'         // جاهز للتسليم
  | 'delivered';    // تم التسليم

export interface MaintenanceStage {
  status: MaintenanceStatus;
  title: string;
  date: string;
  note?: string;
  completed: boolean;
}

export interface MaintenanceTicket {
  id: string;
  ticketNumber: string; // e.g. BRH-8842
  customerId: string;
  customerName: string;
  customerPhone: string;
  shopId: string;
  shopName: string;
  deviceType: string; // e.g. "iPhone 15 Pro Max", "Samsung S24 Ultra", "MacBook Pro M3"
  deviceColor?: string;
  serialNumber?: string;
  issueDescription: string;
  deviceImage?: string;
  status: MaintenanceStatus;
  progressPercent: number; // 0 - 100
  estimatedCostIQD: number;
  finalCostIQD?: number;
  createdAt: string;
  updatedAt: string;
  stages: MaintenanceStage[];
  technicianNote?: string;
  warrantyDays?: number;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceIQD: number;
  totalPriceIQD: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-001
  shopId: string;
  shopName: string;
  shopPhone?: string;
  shopAddress?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: InvoiceItem[];
  subtotalIQD: number;
  taxIQD: number;
  discountIQD: number;
  totalIQD: number;
  paymentMethod: 'cash' | 'zain_cash' | 'card';
  status: 'paid' | 'pending' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface Warranty {
  id: string;
  ticketOrInvoiceId: string;
  customerId: string;
  shopId: string;
  shopName: string;
  deviceName: string;
  serialNumber: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  status: 'active' | 'expired';
}

export interface Offer {
  id: string;
  shopId: string;
  shopName: string;
  title: string;
  description: string;
  discountPercentage: number;
  bannerUrl: string;
  validUntil: string;
  code?: string;
}

export interface AppNotification {
  id: string;
  userId: string; // or 'all'
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'maintenance' | 'offer';
  read: boolean;
  createdAt: string;
}
