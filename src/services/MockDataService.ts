import {
  Shop,
  ShopRequest,
  ProfileChangeRequest,
  UserProfile,
  Product,
  MaintenanceTicket,
  Invoice,
  Offer,
  Warranty,
  Staff,
  ShopReview,
  AppNotification
} from '../types';

const STORAGE_KEYS = {
  USERS: 'barham_mock_users',
  SHOPS: 'barham_mock_shops',
  SHOP_REQUESTS: 'barham_mock_shop_requests',
  PROFILE_CHANGE_REQUESTS: 'barham_mock_profile_change_requests',
  PRODUCTS: 'barham_mock_products',
  TICKETS: 'barham_mock_tickets',
  INVOICES: 'barham_mock_invoices',
  OFFERS: 'barham_mock_offers',
  WARRANTIES: 'barham_mock_warranties',
  STAFF: 'barham_mock_staff',
  REVIEWS: 'barham_mock_reviews',
  NOTIFICATIONS: 'barham_mock_notifications'
};

// Storage Version to force reset when system demo data is wiped
const STORAGE_VERSION_KEY = 'barham_storage_version';
const CURRENT_VERSION = 'v2026_clean_zero_system';

function ensureCleanSystemStorage(): void {
  try {
    const version = localStorage.getItem(STORAGE_VERSION_KEY);
    if (version !== CURRENT_VERSION) {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
    }
  } catch (e) {
    console.warn('Error clearing legacy storage:', e);
  }
}

// Initial System Seed Data (Zeroed System - System Owner Only)
const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'admin-main',
    email: 'brhmyrwhy39@gmail.com',
    displayName: 'مالك المنصة الرئيسي (برهام)',
    phoneNumber: '07700000000',
    role: 'admin',
    createdAt: new Date().toISOString(),
    status: 'active'
  }
];

const INITIAL_SHOPS: Shop[] = [];
const INITIAL_SHOP_REQUESTS: ShopRequest[] = [];
const INITIAL_PRODUCTS: Product[] = [];
const INITIAL_TICKETS: MaintenanceTicket[] = [];
const INITIAL_INVOICES: Invoice[] = [];
const INITIAL_OFFERS: Offer[] = [];
const INITIAL_WARRANTIES: Warranty[] = [];
const INITIAL_STAFF: Staff[] = [];
const INITIAL_REVIEWS: ShopReview[] = [];
const INITIAL_NOTIFICATIONS: AppNotification[] = [];

// Helper to initialize LocalStorage if empty
function loadCollection<T>(key: string, defaultData: T[]): T[] {
  try {
    ensureCleanSystemStorage();
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(data);
  } catch (e) {
    console.warn(`Error reading ${key} from localStorage:`, e);
    return defaultData;
  }
}

function saveCollection<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error saving ${key} to localStorage:`, e);
  }
}

export class MockDataService {
  // Users
  static getUsers(): UserProfile[] {
    return loadCollection<UserProfile>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  static saveUsers(users: UserProfile[]): void {
    saveCollection(STORAGE_KEYS.USERS, users);
  }

  static getUserById(uid: string): UserProfile | null {
    const users = this.getUsers();
    return users.find((u) => u.uid === uid) || null;
  }

  static getUserByEmail(email: string): UserProfile | null {
    const users = this.getUsers();
    const cleanEmail = email.toLowerCase().trim();
    return users.find((u) => u.email.toLowerCase().trim() === cleanEmail) || null;
  }

  static addUser(user: UserProfile): UserProfile {
    const users = this.getUsers();
    const existingIndex = users.findIndex((u) => u.uid === user.uid || u.email === user.email);
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...user };
    } else {
      users.push(user);
    }
    this.saveUsers(users);
    return user;
  }

  static updateUser(uid: string, updates: Partial<UserProfile>): void {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.uid === uid);
    if (index >= 0) {
      users[index] = { ...users[index], ...updates };
      this.saveUsers(users);
    }
  }

  static deleteUser(uid: string): void {
    const users = this.getUsers().filter((u) => u.uid !== uid);
    this.saveUsers(users);
  }

  // Shops
  static getShops(): Shop[] {
    return loadCollection<Shop>(STORAGE_KEYS.SHOPS, INITIAL_SHOPS);
  }

  static saveShops(shops: Shop[]): void {
    saveCollection(STORAGE_KEYS.SHOPS, shops);
  }

  static getShopById(id: string): Shop | null {
    return this.getShops().find((s) => s.id === id) || null;
  }

  static addShop(shop: Shop): Shop {
    const shops = this.getShops();
    shops.push(shop);
    this.saveShops(shops);
    return shop;
  }

  static updateShop(id: string, updates: Partial<Shop>): void {
    const shops = this.getShops();
    const index = shops.findIndex((s) => s.id === id);
    if (index >= 0) {
      shops[index] = { ...shops[index], ...updates };
      this.saveShops(shops);
    }
  }

  static deleteShop(id: string): void {
    const shops = this.getShops().filter((s) => s.id !== id);
    this.saveShops(shops);
  }

  // Shop Requests
  static getShopRequests(): ShopRequest[] {
    return loadCollection<ShopRequest>(STORAGE_KEYS.SHOP_REQUESTS, INITIAL_SHOP_REQUESTS);
  }

  static saveShopRequests(requests: ShopRequest[]): void {
    saveCollection(STORAGE_KEYS.SHOP_REQUESTS, requests);
  }

  static addShopRequest(req: ShopRequest): ShopRequest {
    const list = this.getShopRequests();
    list.push(req);
    this.saveShopRequests(list);
    return req;
  }

  static updateShopRequest(id: string, updates: Partial<ShopRequest>): void {
    const list = this.getShopRequests();
    const idx = list.findIndex((r) => r.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      this.saveShopRequests(list);
    }
  }

  // Profile Change Requests (Owners request name/photo change -> Admin approves)
  static getProfileChangeRequests(): ProfileChangeRequest[] {
    return loadCollection<ProfileChangeRequest>(STORAGE_KEYS.PROFILE_CHANGE_REQUESTS, []);
  }

  static saveProfileChangeRequests(requests: ProfileChangeRequest[]): void {
    saveCollection(STORAGE_KEYS.PROFILE_CHANGE_REQUESTS, requests);
  }

  static addProfileChangeRequest(req: Omit<ProfileChangeRequest, 'id' | 'createdAt' | 'status'>): ProfileChangeRequest {
    const list = this.getProfileChangeRequests();
    const newReq: ProfileChangeRequest = {
      ...req,
      id: `p_req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    list.unshift(newReq);
    this.saveProfileChangeRequests(list);

    // Notify Admin about new request
    this.addNotification({
      userId: 'admin',
      title: 'طلب جديد لتغيير اسم وصورة صاحب محل',
      message: `قدم صاحب المحل (${req.userName}) طلباً لتغيير اسمه ورسمه الشخصي.`,
      type: 'info',
      read: false
    });

    return newReq;
  }

  static approveProfileChangeRequest(requestId: string): void {
    const requests = this.getProfileChangeRequests();
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx < 0) return;

    const req = requests[idx];
    req.status = 'approved';
    this.saveProfileChangeRequests(requests);

    // Update user profile in database
    this.updateUser(req.userId, {
      displayName: req.requestedDisplayName,
      photoURL: req.requestedPhotoURL
    });

    // If user has a shop, update shop details (logo / ownerName)
    if (req.shopId) {
      this.updateShop(req.shopId, {
        logo: req.requestedPhotoURL
      });
    }

    // Send notification to the user
    this.addNotification({
      userId: req.userId,
      title: 'تمت الموافقة على طلب تغيير اسمك وصورتك! 🎉',
      message: `وافق المالك على اعتماد اسمك الجديد (${req.requestedDisplayName}) وتحديث الصورة الشخصية لمرة واحدة.`,
      type: 'success',
      read: false
    });
  }

  static rejectProfileChangeRequest(requestId: string): void {
    const requests = this.getProfileChangeRequests();
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx < 0) return;

    const req = requests[idx];
    req.status = 'rejected';
    this.saveProfileChangeRequests(requests);

    // Send notification to the user
    this.addNotification({
      userId: req.userId,
      title: 'تم رفض طلب تغيير الاسم والصورة',
      message: 'تم رفض طلب التحديث المقدم من قبلك بعد مراجعة مالك المنصة.',
      type: 'warning',
      read: false
    });
  }

  // Products
  static getProducts(): Product[] {
    return loadCollection<Product>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }

  static saveProducts(products: Product[]): void {
    saveCollection(STORAGE_KEYS.PRODUCTS, products);
  }

  static getProductsByShop(shopId: string): Product[] {
    return this.getProducts().filter((p) => p.shopId === shopId);
  }

  static addProduct(prod: Product): Product {
    const list = this.getProducts();
    list.push(prod);
    this.saveProducts(list);
    return prod;
  }

  static updateProduct(id: string, updates: Partial<Product>): void {
    const list = this.getProducts();
    const idx = list.findIndex((p) => p.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      this.saveProducts(list);
    }
  }

  static deleteProduct(id: string): void {
    const list = this.getProducts().filter((p) => p.id !== id);
    this.saveProducts(list);
  }

  // Maintenance Tickets
  static getTickets(): MaintenanceTicket[] {
    return loadCollection<MaintenanceTicket>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
  }

  static saveTickets(tickets: MaintenanceTicket[]): void {
    saveCollection(STORAGE_KEYS.TICKETS, tickets);
  }

  static addTicket(ticket: MaintenanceTicket): MaintenanceTicket {
    const list = this.getTickets();
    list.push(ticket);
    this.saveTickets(list);
    return ticket;
  }

  static updateTicket(id: string, updates: Partial<MaintenanceTicket>): void {
    const list = this.getTickets();
    const idx = list.findIndex((t) => t.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      this.saveTickets(list);
    }
  }

  static deleteTicket(id: string): void {
    const list = this.getTickets().filter((t) => t.id !== id);
    this.saveTickets(list);
  }

  // Invoices
  static getInvoices(): Invoice[] {
    return loadCollection<Invoice>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
  }

  static saveInvoices(invoices: Invoice[]): void {
    saveCollection(STORAGE_KEYS.INVOICES, invoices);
  }

  static addInvoice(inv: Invoice): Invoice {
    const list = this.getInvoices();
    list.push(inv);
    this.saveInvoices(list);
    return inv;
  }

  static deleteInvoice(id: string): void {
    const list = this.getInvoices().filter((i) => i.id !== id);
    this.saveInvoices(list);
  }

  // Offers
  static getOffers(): Offer[] {
    return loadCollection<Offer>(STORAGE_KEYS.OFFERS, INITIAL_OFFERS);
  }

  static saveOffers(offers: Offer[]): void {
    saveCollection(STORAGE_KEYS.OFFERS, offers);
  }

  static addOffer(offer: Offer): Offer {
    const list = this.getOffers();
    list.push(offer);
    this.saveOffers(list);
    return offer;
  }

  static updateOffer(id: string, updates: Partial<Offer>): void {
    const list = this.getOffers();
    const idx = list.findIndex((o) => o.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      this.saveOffers(list);
    }
  }

  static deleteOffer(id: string): void {
    const list = this.getOffers().filter((o) => o.id !== id);
    this.saveOffers(list);
  }

  // Warranties
  static getWarranties(): Warranty[] {
    return loadCollection<Warranty>(STORAGE_KEYS.WARRANTIES, INITIAL_WARRANTIES);
  }

  // Staff
  static getStaff(): Staff[] {
    return loadCollection<Staff>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
  }

  static addStaff(st: Staff): Staff {
    const list = this.getStaff();
    list.push(st);
    saveCollection(STORAGE_KEYS.STAFF, list);
    return st;
  }

  // Reviews
  static getReviews(): ShopReview[] {
    return loadCollection<ShopReview>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
  }

  static addReview(review: ShopReview): ShopReview {
    const list = this.getReviews();
    list.push(review);
    saveCollection(STORAGE_KEYS.REVIEWS, list);
    return review;
  }

  // Notifications
  static getNotifications(): AppNotification[] {
    return loadCollection<AppNotification>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }

  static saveNotifications(notifications: AppNotification[]): void {
    saveCollection(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }

  static addNotification(notif: Omit<AppNotification, 'id' | 'createdAt'>): AppNotification {
    const list = this.getNotifications();
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString()
    };
    list.unshift(newNotif);
    this.saveNotifications(list);
    return newNotif;
  }

  static broadcastNotification(
    target: 'all' | 'owner' | 'customer',
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'maintenance' | 'offer' = 'info'
  ): AppNotification {
    return this.addNotification({
      userId: target,
      title,
      message,
      type,
      read: false
    });
  }

  static markNotificationAsRead(id: string): void {
    const list = this.getNotifications();
    const index = list.findIndex((n) => n.id === id);
    if (index >= 0) {
      list[index].read = true;
      this.saveNotifications(list);
    }
  }

  static markAllNotificationsAsRead(): void {
    const list = this.getNotifications();
    list.forEach((n) => {
      n.read = true;
    });
    this.saveNotifications(list);
  }

  static deleteNotification(id: string): void {
    const list = this.getNotifications().filter((n) => n.id !== id);
    this.saveNotifications(list);
  }

  // Full Reset
  static resetAllData(): void {
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ LocalStorage and SessionStorage cleared completely.');
    } catch (e) {
      console.warn('Error clearing storage:', e);
    }
  }
}
