import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Store,
  Users,
  Package,
  Wrench,
  Receipt,
  CheckCircle,
  XCircle,
  AlertOctagon,
  Trash2,
  Bell,
  Search,
  Send,
  BarChart2,
  Check,
  X,
  Plus,
  Edit3,
  Eye,
  Settings,
  Percent,
  Tag,
  Building2,
  UserCheck,
  Smartphone,
  Calendar,
  Filter,
  Download,
  Printer,
  Sparkles,
  TrendingUp,
  MapPin,
  Phone,
  Clock,
  Layers,
  Lock,
  RefreshCw,
  Sliders,
  DollarSign,
  Briefcase,
  Camera,
  User
} from 'lucide-react';
import { MockDataService } from '../../services/MockDataService';
import { UserProfileModal } from '../common/UserProfileModal';
import {
  Shop,
  ShopRequest,
  ProfileChangeRequest,
  UserProfile,
  Product,
  MaintenanceTicket,
  Invoice,
  Offer,
  Staff,
  Branch,
  MaintenanceStatus
} from '../../types';
import { formatIQD, printInvoicePDF, printThermalReceipt88mm, printThermalReceipt44mm } from '../../utils/pdfGenerator';
import { ShopDetailModal } from '../shops/ShopDetailModal';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  updateUserProfile as updateFirestoreUserProfile,
  setShopInFirestore,
  getAllShopsFromFirestore,
  getAllShopRequestsFromFirestore,
  getAllUsersFromFirestore,
  updateShopRequestInFirestore,
  deleteShopFromFirestore,
  deleteAllShopsFromFirestore,
  subscribeToShopRequestsFromFirestore,
  subscribeToShopsFromFirestore,
  subscribeToUsersFromFirestore
} from '../../services/firebase';

interface AdminDashboardProps {
  onSelectShop?: (shop: Shop) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectShop }) => {
  const { userProfile, performFactoryReset } = useAuth();
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetting, setResetting] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    danger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'تأكيد',
    danger: true,
    onConfirm: () => {},
  });

  const [activeTab, setActiveTab] = useState<
    'pending_shops' | 'shops' | 'users' | 'products' | 'maintenance' | 'invoices' | 'reports' | 'notifications'
  >('pending_shops');

  // Firebase Real States
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopRequests, setShopRequests] = useState<ShopRequest[]>([]);
  const [profileRequests, setProfileRequests] = useState<ProfileChangeRequest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters and Search States
  const [shopFilterStatus, setShopFilterStatus] = useState<string>('all');
  const [shopSearch, setShopSearch] = useState<string>('');

  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userSearch, setUserSearch] = useState<string>('');

  const [productSearch, setProductSearch] = useState<string>('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');

  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('all');
  const [ticketSearch, setTicketSearch] = useState<string>('');

  const [invoiceSearch, setInvoiceSearch] = useState<string>('');

  // Modals & Selected Objects
  const [viewShopModal, setViewShopModal] = useState<Shop | null>(null);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Offer Creation/Edit Modal
  const [offerModalOpen, setOfferModalOpen] = useState<boolean>(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [offerForm, setOfferForm] = useState({
    title: '',
    shopId: '',
    shopName: '',
    description: '',
    discountPercentage: 15,
    bannerUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
    validUntil: '2026-12-31',
    code: 'BARHAM2026',
  });

  // Broadcast Notification Form
  const [notifTarget, setNotifTarget] = useState<'all' | 'owner' | 'customer'>('all');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [notifType, setNotifType] = useState<'info' | 'success' | 'warning' | 'maintenance' | 'offer'>('info');
  const [notifSuccess, setNotifSuccess] = useState('');

  // Settings state
  const [platformCommission, setPlatformCommission] = useState<number>(2.5);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [systemNotice, setSystemNotice] = useState<string>('النظام يعمل بكفاءة عالية على سيرفرات Firebase Cloud.');
  const [settingsSavedMessage, setSettingsSavedMessage] = useState<string>('');

  useEffect(() => {
    fetchAdminData();

    const unsubRequests = subscribeToShopRequestsFromFirestore((reqs) => {
      if (reqs && reqs.length > 0) {
        setShopRequests((prev) => {
          const map = new Map<string, ShopRequest>();
          prev.forEach((r) => map.set(r.id, r));
          reqs.forEach((r) => map.set(r.id, r));
          const list = Array.from(map.values());
          MockDataService.saveShopRequests(list);
          return list;
        });
      }
    });

    const unsubShops = subscribeToShopsFromFirestore((shps) => {
      if (shps && shps.length > 0) {
        setShops((prev) => {
          const map = new Map<string, Shop>();
          prev.forEach((s) => map.set(s.id, s));
          shps.forEach((s) => map.set(s.id, s));
          const list = Array.from(map.values());
          MockDataService.saveShops(list);
          return list;
        });
      }
    });

    const unsubUsers = subscribeToUsersFromFirestore((usrs) => {
      if (usrs && usrs.length > 0) {
        setUsers((prev) => {
          const map = new Map<string, UserProfile>();
          prev.forEach((u) => map.set(u.uid, u));
          usrs.forEach((u) => map.set(u.uid, u));
          const list = Array.from(map.values());
          MockDataService.saveUsers(list);
          return list;
        });
      }
    });

    return () => {
      unsubRequests();
      unsubShops();
      unsubUsers();
    };
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [fsShops, fsRequests, fsUsers] = await Promise.all([
        getAllShopsFromFirestore(),
        getAllShopRequestsFromFirestore(),
        getAllUsersFromFirestore()
      ]);

      const mockShops = MockDataService.getShops();
      const mockRequests = MockDataService.getShopRequests();
      const mockUsers = MockDataService.getUsers();

      // Merge shops
      const shopMap = new Map<string, Shop>();
      mockShops.forEach((s) => shopMap.set(s.id, s));
      fsShops.forEach((s) => shopMap.set(s.id, s));
      const combinedShops = Array.from(shopMap.values());

      // Merge requests
      const requestMap = new Map<string, ShopRequest>();
      mockRequests.forEach((r) => requestMap.set(r.id, r));
      fsRequests.forEach((r) => requestMap.set(r.id, r));
      const combinedRequests = Array.from(requestMap.values());

      // Merge users
      const userMap = new Map<string, UserProfile>();
      mockUsers.forEach((u) => userMap.set(u.uid, u));
      fsUsers.forEach((u) => userMap.set(u.uid, u));
      const combinedUsers = Array.from(userMap.values());

      MockDataService.saveShops(combinedShops);
      MockDataService.saveShopRequests(combinedRequests);
      MockDataService.saveUsers(combinedUsers);

      setShops(combinedShops);
      setShopRequests(combinedRequests);
      setUsers(combinedUsers);
      setProfileRequests(MockDataService.getProfileChangeRequests());
      setProducts(MockDataService.getProducts());
      setTickets(MockDataService.getTickets());
      setInvoices(MockDataService.getInvoices());
      setOffers(MockDataService.getOffers());
      setStaffList(MockDataService.getStaff());
    } catch (err) {
      console.error('Error loading Admin Data from Firestore:', err);
      setShops(MockDataService.getShops());
      setShopRequests(MockDataService.getShopRequests());
      setUsers(MockDataService.getUsers());
    } finally {
      setLoading(false);
    }
  };

  // Handlers for Profile Change Requests (Owner requested name/photo change)
  const handleApproveProfileChangeRequest = (requestId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد الموافقة على طلب تغيير الاسم والصورة',
      message: 'هل أنت متأكد من الموافقة على اعتماد الاسم والصورة الجديدة لصاحب المحل؟ سيتم تحديث بيانات حسابه لمرة واحدة فقط.',
      confirmText: 'تأكيد وموافقة',
      danger: false,
      onConfirm: () => {
        MockDataService.approveProfileChangeRequest(requestId);
        fetchAdminData();
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      }
    });
  };

  const handleRejectProfileChangeRequest = (requestId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد رفض طلب تغيير الاسم والصورة',
      message: 'هل أنت متأكد من رفض طلب تغيير الاسم والصورة المقدم من صاحب المحل؟',
      confirmText: 'تأكيد الرفض',
      danger: true,
      onConfirm: () => {
        MockDataService.rejectProfileChangeRequest(requestId);
        fetchAdminData();
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      }
    });
  };

  // Handlers for Shop Requests
  const handleApproveShopRequest = async (request: ShopRequest) => {
    try {
      let targetOwnerId = request.ownerId;
      if (!targetOwnerId) {
        const foundUser = users.find(
          (u) => u.email?.toLowerCase() === request.email?.toLowerCase() || (request.phone && u.phoneNumber === request.phone)
        );
        if (foundUser) {
          targetOwnerId = foundUser.uid;
        }
      }

      const newShopId = `shop_${Date.now()}`;
      const newShopDoc: Shop = {
        id: newShopId,
        ownerId: targetOwnerId || '',
        name: request.shopName,
        slug: request.shopName.toLowerCase().replace(/\s+/g, '-'),
        logo: request.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&q=80',
        coverImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
        description: request.description,
        category: request.category || 'هواتف',
        city: request.city,
        address: request.address || 'العنوان الرئيسي',
        phone: request.phone,
        rating: 0,
        reviewsCount: 0,
        status: 'approved',
        isDetailsCompleted: true,
        workingHours: '09:00 ص - 10:00 م',
        isOpen: true,
        branches: [
          {
            id: `br_${Date.now()}`,
            shopId: newShopId,
            name: 'الفرع الرئيسي',
            city: request.city,
            address: request.address || 'العنوان الرئيسي',
            phone: request.phone,
            workingHours: '09:00 ص - 10:00 م',
            isMain: true,
          }
        ],
        createdAt: new Date().toISOString()
      };

      MockDataService.addShop(newShopDoc);
      MockDataService.updateShopRequest(request.id, { status: 'approved' });
      try {
        await setShopInFirestore(newShopDoc);
        await updateShopRequestInFirestore(request.id, { status: 'approved' });
      } catch (e) {
        console.warn('Firestore setShop / updateShopRequest error:', e);
      }

      if (targetOwnerId) {
        MockDataService.updateUser(targetOwnerId, { status: 'active', shopId: newShopId, role: 'owner' });
        try {
          await updateFirestoreUserProfile(targetOwnerId, { status: 'active', shopId: newShopId, role: 'owner' });
        } catch (e) {
          console.warn('Firestore updateUserProfile error:', e);
        }
      } else if (request.email) {
        const allUsers = MockDataService.getUsers();
        const matchedUser = allUsers.find(u => u.email?.toLowerCase() === request.email?.toLowerCase());
        if (matchedUser) {
          MockDataService.updateUser(matchedUser.uid, { status: 'active', shopId: newShopId, role: 'owner' });
          try {
            await updateFirestoreUserProfile(matchedUser.uid, { status: 'active', shopId: newShopId, role: 'owner' });
          } catch (e) {
            console.warn('Firestore updateUserProfile error:', e);
          }
        }
      }

      await fetchAdminData();
    } catch (err) {
      console.error('Error approving shop request:', err);
    }
  };

  const handleRejectShopRequest = async (requestId: string, ownerId?: string) => {
    try {
      MockDataService.updateShopRequest(requestId, { status: 'rejected' });
      try {
        await updateShopRequestInFirestore(requestId, { status: 'rejected' });
      } catch (e) {}

      if (ownerId) {
        MockDataService.updateUser(ownerId, { status: 'suspended' });
        try {
          await updateFirestoreUserProfile(ownerId, { status: 'suspended' });
        } catch (e) {}
      }
      await fetchAdminData();
    } catch (err) {
      console.error('Error rejecting shop request:', err);
    }
  };

  // Handlers for Shops
  const handleUpdateShopStatus = async (shopId: string, status: 'approved' | 'rejected' | 'suspended') => {
    try {
      MockDataService.updateShop(shopId, { status });
      try {
        await setShopInFirestore({ id: shopId, status } as any);
      } catch (e) {}
      const targetShop = shops.find((s) => s.id === shopId);
      if (targetShop && targetShop.ownerId) {
        const newStatus = status === 'approved' ? 'active' : 'suspended';
        MockDataService.updateUser(targetShop.ownerId, {
          status: newStatus
        });
        try {
          await updateFirestoreUserProfile(targetShop.ownerId, { status: newStatus });
        } catch (e) {}
      }
      setShops(MockDataService.getShops());
      setUsers(MockDataService.getUsers());
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteShop = async (shopId: string) => {
    try {
      const targetShop = shops.find((s) => s.id === shopId);
      MockDataService.deleteShop(shopId);
      await deleteShopFromFirestore(shopId);
      if (targetShop && targetShop.ownerId) {
        MockDataService.deleteUser(targetShop.ownerId);
      }
      setShops((prev) => prev.filter((s) => s.id !== shopId));
      setUsers(MockDataService.getUsers());
    } catch (err) {
      console.error(err);
    }
  };

  const handlePurgeAllShops = async () => {
    try {
      MockDataService.saveShops([]);
      await deleteAllShopsFromFirestore();
      setShops([]);
    } catch (err) {
      console.error('Error purging all shops:', err);
    }
  };

  const requestPurgeAllShops = () => {
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد تصفير وحذف جميع المحلات',
      message: `هل أنت متأكد من رغبتك في حذف وتصفير جميع المحلات (${shops.length} محل) نهائياً من قاعدة البيانات والسيرفر؟`,
      onConfirm: () => handlePurgeAllShops(),
    });
  };

  const requestDeleteShop = (shopId: string, shopName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف المحل',
      message: `هل أنت متأكد من رغبتك في حذف محل "${shopName}" نهائياً مع كافة البيانات والحسابات التابعة له؟`,
      onConfirm: () => handleDeleteShop(shopId),
    });
  };

  const handleSaveShopEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop) return;
    try {
      MockDataService.updateShop(editingShop.id, {
        name: editingShop.name,
        category: editingShop.category,
        city: editingShop.city,
        address: editingShop.address,
        phone: editingShop.phone,
        status: editingShop.status,
      });
      setShops(MockDataService.getShops());
      setEditingShop(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Users
  const handleToggleUserStatus = async (userId: string, currentStatus?: 'active' | 'suspended') => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      MockDataService.updateUser(userId, { status: nextStatus });
      setUsers(MockDataService.getUsers());
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      MockDataService.deleteUser(userId);
      setUsers(MockDataService.getUsers());
    } catch (err) {
      console.error(err);
    }
  };

  const requestDeleteUser = (userId: string, userName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف المستخدم',
      message: `هل أنت متأكد من حذف حساب المستخدم "${userName}" نهائياً من المنصة؟`,
      onConfirm: () => handleDeleteUser(userId),
    });
  };

  const handlePurgeNonOwnerUsers = () => {
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد مسح كافة البريدات المسجلة',
      message: 'هل أنت متأكد من مسح وحذف كل البريدات والحسابات المسجلة بالمنصة نهائياً والاحتفاظ فقط بحساب المالك الرئيسي (برهم)؟',
      confirmText: 'تأكيد مسح البريدات',
      danger: true,
      onConfirm: () => {
        const remaining = MockDataService.purgeNonOwnerUsers();
        setUsers(remaining);
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      }
    });
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      MockDataService.updateUser(editingUser.uid, {
        displayName: editingUser.displayName,
        phoneNumber: editingUser.phoneNumber || '',
        role: editingUser.role,
        status: editingUser.status || 'active',
      });
      setUsers(MockDataService.getUsers());
      setEditingUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Products
  const handleDeleteProduct = async (productId: string) => {
    try {
      MockDataService.deleteProduct(productId);
      setProducts(MockDataService.getProducts());
    } catch (err) {
      console.error(err);
    }
  };

  const requestDeleteProduct = (productId: string, productName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف المنتج',
      message: `هل أنت متأكد من حذف المنتج "${productName}" نهائياً من قائمة المنتجات؟`,
      onConfirm: () => handleDeleteProduct(productId),
    });
  };

  // Handlers for Maintenance Tickets
  const handleUpdateTicketStatus = async (ticketId: string, newStatus: MaintenanceStatus) => {
    try {
      const progressMap: Record<MaintenanceStatus, number> = {
        pending_owner_approval: 0,
        received: 15,
        inspecting: 35,
        awaiting_approval: 50,
        repairing: 75,
        ready: 95,
        delivered: 100,
        rejected: 0,
      };

      MockDataService.updateTicket(ticketId, {
        status: newStatus,
        progressPercent: progressMap[newStatus],
        updatedAt: new Date().toISOString(),
      });
      setTickets(MockDataService.getTickets());
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      MockDataService.deleteTicket(ticketId);
      setTickets(MockDataService.getTickets());
    } catch (err) {
      console.error(err);
    }
  };

  const requestDeleteTicket = (ticketId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف طلب الصيانة',
      message: `هل أنت متأكد من مسح طلب الصيانة رقم (${ticketId})؟`,
      onConfirm: () => handleDeleteTicket(ticketId),
    });
  };

  // Handlers for Invoices
  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      MockDataService.deleteInvoice(invoiceId);
      setInvoices(MockDataService.getInvoices());
    } catch (err) {
      console.error(err);
    }
  };

  const requestDeleteInvoice = (invoiceId: string, invoiceNumber: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف الفاتورة',
      message: `هل أنت متأكد من حذف الفاتورة رقم (${invoiceNumber}) نهائياً؟`,
      onConfirm: () => handleDeleteInvoice(invoiceId),
    });
  };

  // Handlers for Notifications
  const handleSendBroadcastNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMsg) return;

    try {
      MockDataService.broadcastNotification(notifTarget, notifTitle, notifMsg, notifType);
      setNotifSuccess(`تم إرسال الإشعار بنجاح إلى (${notifTarget === 'all' ? 'جميع المستخدمين' : notifTarget === 'owner' ? 'أصحاب المحلات' : 'الزبائن'})`);
      setNotifTitle('');
      setNotifMsg('');
      setTimeout(() => setNotifSuccess(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Offers
  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedShopObj = shops.find((s) => s.id === offerForm.shopId);
      const shopName = selectedShopObj ? selectedShopObj.name : offerForm.shopName || 'مركز برهم العام';

      if (editingOffer) {
        MockDataService.updateOffer(editingOffer.id, {
          title: offerForm.title,
          shopId: offerForm.shopId,
          shopName,
          description: offerForm.description,
          discountPercentage: offerForm.discountPercentage,
          bannerUrl: offerForm.bannerUrl,
          validUntil: offerForm.validUntil,
          code: offerForm.code,
        });
      } else {
        const newOfferId = `OFFER-${Date.now()}`;
        const newOffer: Offer = {
          id: newOfferId,
          shopId: offerForm.shopId || (shops[0]?.id || 'shop-1'),
          shopName,
          title: offerForm.title,
          description: offerForm.description,
          discountPercentage: offerForm.discountPercentage,
          bannerUrl: offerForm.bannerUrl,
          validUntil: offerForm.validUntil,
          code: offerForm.code,
        };
        MockDataService.addOffer(newOffer);
      }

      setOffers(MockDataService.getOffers());
      setOfferModalOpen(false);
      setEditingOffer(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    try {
      MockDataService.deleteOffer(offerId);
      setOffers(MockDataService.getOffers());
    } catch (err) {
      console.error(err);
    }
  };

  const requestDeleteOffer = (offerId: string, offerTitle: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف العرض',
      message: `هل أنت متأكد من حذف العرض الترويجي "${offerTitle}"؟`,
      onConfirm: () => handleDeleteOffer(offerId),
    });
  };

  // Calculations for Stats
  const pendingShopRequestsList = shopRequests.filter((r) => r.status === 'pending');
  const pendingShopsList = shops.filter(
    (s) =>
      s.status === 'pending' &&
      !pendingShopRequestsList.some(
        (req) => req.ownerId === s.ownerId || req.shopName === s.name
      )
  );
  const pendingProfileRequests = profileRequests.filter((r) => r.status === 'pending');
  const totalPendingCount = pendingShopRequestsList.length + pendingShopsList.length + pendingProfileRequests.length;

  const shopOwnersCount = users.filter((u) => u.role === 'owner').length;
  const customersCount = users.filter((u) => u.role === 'customer').length;
  const totalBranchesCount = shops.reduce((acc, s) => acc + (s.branches ? s.branches.length : 1), 0);
  const totalStaffCount = staffList.length;
  const totalPlatformVolumeIQD = invoices.reduce((sum, inv) => sum + inv.totalIQD, 0);

  // Filtered Lists
  const filteredShops = shops.filter((s) => {
    const matchesStatus = shopFilterStatus === 'all' || s.status === shopFilterStatus;
    const matchesSearch = s.name.includes(shopSearch) || s.city.includes(shopSearch) || s.phone.includes(shopSearch);
    return matchesStatus && matchesSearch;
  });

  const filteredUsers = users.filter((u) => {
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesSearch =
      u.displayName.includes(userSearch) || u.email.includes(userSearch) || (u.phoneNumber && u.phoneNumber.includes(userSearch));
    return matchesRole && matchesSearch;
  });

  const filteredProducts = products.filter((p) => {
    const matchesCat = productCategoryFilter === 'all' || p.category === productCategoryFilter;
    const matchesSearch = p.name.includes(productSearch) || (p.shopName && p.shopName.includes(productSearch));
    return matchesCat && matchesSearch;
  });

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = ticketStatusFilter === 'all' || t.status === ticketStatusFilter;
    const matchesSearch =
      t.customerName.includes(ticketSearch) ||
      t.ticketNumber.includes(ticketSearch) ||
      t.deviceType.includes(ticketSearch) ||
      t.shopName.includes(ticketSearch);
    return matchesStatus && matchesSearch;
  });

  const filteredInvoices = invoices.filter((i) => {
    return (
      i.invoiceNumber.includes(invoiceSearch) ||
      i.customerName.includes(invoiceSearch) ||
      i.shopName.includes(invoiceSearch)
    );
  });

  return (
    <div className="space-y-8 pb-20 text-slate-100 font-sans selection:bg-blue-600 selection:text-white" dir="rtl">
      {/* 1. TOP HEADER - ADMIN PROFILE & LOGO */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-blue-900/50 rounded-3xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Logo & Brand Info */}
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border-2 border-blue-500/40 flex items-center justify-center text-blue-400 font-black text-2xl shadow-xl shadow-blue-600/20">
            <ShieldAlert className="w-9 h-9" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                Barham Pro <span className="text-blue-500">Admin</span>
              </h1>
              <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs px-3 py-0.5 rounded-full font-bold">
                مالك المنصة
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              لوحة التحكم الشاملة لإدارة جميع المحلات، الزبائن، العروض والرقابة المالية في العراق
            </p>
          </div>
        </div>

        {/* Profile & Quick Control Buttons */}
        <div className="flex items-center gap-3 flex-wrap relative z-10">
          <div
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-3 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-blue-500/50 p-2.5 px-4 rounded-2xl backdrop-blur-md cursor-pointer transition-all group shadow-lg"
            title="انقر لتعديل الاسم والصورة الشخصية"
          >
            <div className="relative">
              <img
                src={
                  userProfile?.photoURL ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'
                }
                alt={userProfile?.displayName || 'المالك'}
                className="w-10 h-10 rounded-xl object-cover border border-blue-500/50 group-hover:scale-105 transition-transform"
              />
              <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-0.5 rounded-md shadow-md">
                <Camera className="w-2.5 h-2.5" />
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{userProfile?.displayName || 'أ. برهم الجبوري'}</span>
                <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400" />
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">المالك العام - Super Admin</div>
            </div>
          </div>

          <button
            onClick={() => setShowProfileModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold px-3 py-2.5 rounded-2xl transition-all flex items-center gap-1.5 shadow-lg hover:border-blue-500/40"
            title="تعديل اسم وصورة المالك"
          >
            <User className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">تعديل الاسم والصورة</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className="relative bg-slate-900 hover:bg-slate-800 text-slate-300 p-3 rounded-2xl border border-slate-800 transition-all"
            title="الإشعارات العامة"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full animate-ping"></span>
            <span className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS (8 LARGE KPI CARDS) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        {/* Stat 1: Shops */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 transition-all hover:border-blue-500/50 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Store className="w-5 h-5 text-blue-400" />
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">0%</span>
          </div>
          <div className="text-2xl font-black text-white">{shops.length}</div>
          <div className="text-[11px] font-bold text-slate-400 mt-1">المحلات الكلية</div>
        </div>

        {/* Stat 2: Shop Owners */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 transition-all hover:border-blue-500/50 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <UserCheck className="w-5 h-5 text-purple-400" />
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">0</span>
          </div>
          <div className="text-2xl font-black text-white">{shopOwnersCount}</div>
          <div className="text-[11px] font-bold text-slate-400 mt-1">أصحاب المحلات</div>
        </div>

        {/* Stat 3: Customers */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 transition-all hover:border-blue-500/50 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">0%</span>
          </div>
          <div className="text-2xl font-black text-white">{customersCount}</div>
          <div className="text-[11px] font-bold text-slate-400 mt-1">الزبائن المسجلون</div>
        </div>

        {/* Stat 4: Products */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 transition-all hover:border-blue-500/50 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-amber-400" />
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">0 جديدة</span>
          </div>
          <div className="text-2xl font-black text-white">{products.length}</div>
          <div className="text-[11px] font-bold text-slate-400 mt-1">المنتجات بالمتجر</div>
        </div>

        {/* Stat 5: Maintenance Tickets */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 transition-all hover:border-blue-500/50 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">0% نجاح</span>
          </div>
          <div className="text-2xl font-black text-white">{tickets.length}</div>
          <div className="text-[11px] font-bold text-slate-400 mt-1">طلبات الصيانة</div>
        </div>

        {/* Stat 6: Invoices */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 transition-all hover:border-blue-500/50 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Receipt className="w-5 h-5 text-indigo-400" />
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">0</span>
          </div>
          <div className="text-2xl font-black text-white">{invoices.length}</div>
          <div className="text-[11px] font-bold text-slate-400 mt-1">الفواتير الكلية</div>
        </div>

        {/* Stat 7: Branches */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 transition-all hover:border-blue-500/50 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Building2 className="w-5 h-5 text-rose-400" />
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">0</span>
          </div>
          <div className="text-2xl font-black text-white">{totalBranchesCount}</div>
          <div className="text-[11px] font-bold text-slate-400 mt-1">الفروع النشطة</div>
        </div>

        {/* Stat 8: Staff */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 transition-all hover:border-blue-500/50 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Briefcase className="w-5 h-5 text-teal-400" />
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">0</span>
          </div>
          <div className="text-2xl font-black text-white">{totalStaffCount}</div>
          <div className="text-[11px] font-bold text-slate-400 mt-1">الموظفون والفنيون</div>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2 flex space-x-1 space-x-reverse overflow-x-auto shadow-xl">
        {[
          { id: 'pending_shops', label: `طلبات الموافقات (${totalPendingCount})`, icon: <AlertOctagon className="w-4 h-4 text-amber-400" /> },
          { id: 'shops', label: 'إدارة المحلات', icon: <Store className="w-4 h-4 text-blue-400" /> },
          { id: 'users', label: 'إدارة المستخدمين', icon: <Users className="w-4 h-4 text-purple-400" /> },
          { id: 'products', label: 'إدارة المنتجات', icon: <Package className="w-4 h-4 text-emerald-400" /> },
          { id: 'maintenance', label: 'إدارة الصيانة', icon: <Wrench className="w-4 h-4 text-cyan-400" /> },
          { id: 'invoices', label: 'إدارة الفواتير', icon: <Receipt className="w-4 h-4 text-indigo-400" /> },
          { id: 'notifications', label: 'بث الإشعارات', icon: <Bell className="w-4 h-4 text-yellow-400" /> },
          { id: 'reports', label: 'التقارير المالية', icon: <BarChart2 className="w-4 h-4 text-teal-400" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: PENDING SHOPS APPROVAL */}
      {/* ========================================================================= */}
      {activeTab === 'pending_shops' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <AlertOctagon className="w-6 h-6 text-amber-400" />
                <span>المحلات بانتظار الموافقة والاعتماد الرسمية</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                قم بمراجعة بيانات أصحاب المحلات والاعتماد للبدء برفع المنتجات واستلام طلبات الصيانة
              </p>
            </div>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-3 py-1 rounded-full font-bold">
              {totalPendingCount} طلب معلق
            </span>
          </div>

          {totalPendingCount === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">لا توجد طلبات تسجيل جديدة معلقة حالياً</h3>
              <p className="text-xs text-slate-400">كافة المحلات المتقدمة تمت مراجعتها واكتمال الموافقة عليها.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Requests from shop_requests collection */}
              {pendingShopRequestsList.map((req) => (
                <div
                  key={req.id}
                  className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 space-y-4 shadow-xl relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {req.logoUrl ? (
                        <img
                          src={req.logoUrl}
                          alt={req.shopName}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-800"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xl">
                          {req.shopName.slice(0, 1)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-bold text-white">{req.shopName}</h3>
                        <span className="text-xs text-blue-400 font-bold">المالك: {req.ownerName}</span>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{req.city} {req.address ? `- ${req.address}` : ''}</span>
                        </div>
                      </div>
                    </div>
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      طلب تسجيل معلق
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 line-clamp-2">
                    {req.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 block">الهاتف / البريد:</span>
                      <span className="font-bold text-emerald-400 font-mono">{req.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">تاريخ الطلب:</span>
                      <span className="font-bold text-slate-300">{new Date(req.createdAt).toLocaleDateString('ar-IQ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleApproveShopRequest(req)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
                    >
                      <Check className="w-4 h-4" />
                      <span>موافقة وإنشاء المحل</span>
                    </button>

                    <button
                      onClick={() => handleRejectShopRequest(req.id, req.ownerId)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs px-4 py-3 rounded-xl transition-all flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      <span>رفض الطلب</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* 2. Legacy pending shops from shops collection */}
              {pendingShopsList.map((shop) => (
                <div
                  key={shop.id}
                  className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 space-y-4 shadow-xl relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={shop.logo}
                        alt={shop.name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-800"
                      />
                      <div>
                        <h3 className="text-lg font-bold text-white">{shop.name}</h3>
                        <span className="text-xs text-blue-400 font-bold">{shop.category}</span>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{shop.city} - {shop.address}</span>
                        </div>
                      </div>
                    </div>
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      قيد المراجعة
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 line-clamp-2">
                    {shop.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 block">رقم الهاتف:</span>
                      <span className="font-bold text-emerald-400 font-mono">{shop.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">تاريخ التسجيل:</span>
                      <span className="font-bold text-slate-300">{new Date(shop.createdAt).toLocaleDateString('ar-IQ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleUpdateShopStatus(shop.id, 'approved')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
                    >
                      <Check className="w-4 h-4" />
                      <span>اعتماد والموافقة</span>
                    </button>

                    <button
                      onClick={() => handleUpdateShopStatus(shop.id, 'rejected')}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs px-4 py-3 rounded-xl transition-all flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      <span>رفض</span>
                    </button>

                    <button
                      onClick={() => setViewShopModal(shop)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3.5 py-3 rounded-xl transition-all"
                      title="عرض المتجر والتفاصيل"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* 3. Pending Profile Change Requests from Shop Owners */}
              {pendingProfileRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-slate-900 border border-blue-500/40 rounded-3xl p-6 space-y-4 shadow-xl relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">طلب تغيير اسم وصورة صاحب محل</h3>
                        <span className="text-xs text-slate-400">{req.userEmail}</span>
                      </div>
                    </div>
                    <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      طلب تعديل ملف
                    </span>
                  </div>

                  {/* Visual Comparison: Current vs Requested */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    {/* Current */}
                    <div className="space-y-2 text-center border-l border-slate-800 pl-2">
                      <span className="text-[11px] font-bold text-slate-500 block">البيانات الحالية:</span>
                      <div className="w-14 h-14 rounded-2xl mx-auto overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-400">
                        {req.currentPhotoURL ? (
                          <img src={req.currentPhotoURL} alt="الأن" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold">{req.currentDisplayName.charAt(0)}</span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-300 truncate">{req.currentDisplayName}</div>
                    </div>

                    {/* Requested */}
                    <div className="space-y-2 text-center">
                      <span className="text-[11px] font-bold text-emerald-400 block">المطلوب اعتماده:</span>
                      <div className="w-14 h-14 rounded-2xl mx-auto overflow-hidden border-2 border-emerald-500/50 bg-slate-800 flex items-center justify-center text-emerald-400 shadow-md">
                        {req.requestedPhotoURL ? (
                          <img src={req.requestedPhotoURL} alt="جديد" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold">{req.requestedDisplayName.charAt(0)}</span>
                        )}
                      </div>
                      <div className="text-xs font-black text-emerald-400 truncate">{req.requestedDisplayName}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/40 p-2.5 px-3 rounded-xl border border-slate-800">
                    <span>تاريخ تقديم الطلب:</span>
                    <span className="font-mono text-slate-300">{new Date(req.createdAt).toLocaleDateString('ar-IQ')}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleApproveProfileChangeRequest(req.id)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
                    >
                      <Check className="w-4 h-4" />
                      <span>موافقة واعتماد التعديل (مرة واحدة)</span>
                    </button>

                    <button
                      onClick={() => handleRejectProfileChangeRequest(req.id)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs px-4 py-3 rounded-xl transition-all flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      <span>رفض الطلب</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: SHOPS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'shops' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Store className="w-6 h-6 text-blue-400" />
                  <span>إدارة المحلات والمراكز المسجلة ({shops.length})</span>
                </h2>
                {shops.length > 0 && (
                  <button
                    onClick={requestPurgeAllShops}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                    title="تصفير ومسح جميع المحلات من قاعدة البيانات"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>تصفير المحلات ({shops.length})</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">التحكم الكامل بكافة المراكز، التعديل، التعليق، أو الحذف النهائي</p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'approved', label: 'المقبولة' },
                { id: 'pending', label: 'المعلقة' },
                { id: 'suspended', label: 'الموقوفة' },
                { id: 'rejected', label: 'المرفوضة' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setShopFilterStatus(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    shopFilterStatus === f.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
            <input
              type="text"
              placeholder="ابحث عن اسم المحل، المدينة، أو رقم الهاتف..."
              value={shopSearch}
              onChange={(e) => setShopSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-11 pl-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Shops Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredShops.map((s) => (
              <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <img src={s.logo} alt={s.name} className="w-14 h-14 rounded-xl object-cover border border-slate-800 bg-slate-950" />
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        s.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : s.status === 'suspended'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : s.status === 'pending'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}
                    >
                      {s.status === 'approved' ? 'نشط ومقبول' : s.status === 'suspended' ? 'معلق مؤقتاً' : s.status === 'pending' ? 'قيد المراجعة' : 'مرفوض'}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base">{s.name}</h3>
                  <div className="text-xs text-blue-400 font-medium">{s.category}</div>

                  <div className="text-xs text-slate-400 mt-2 space-y-1">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{s.city} - {s.address}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-emerald-400">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{s.phone}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <div>الفروع: <span className="font-bold text-white">{s.branches ? s.branches.length : 1}</span></div>
                    <div>التقييم: <span className="font-bold text-amber-400">⭐ {s.rating}</span></div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => (onSelectShop ? onSelectShop(s) : setViewShopModal(s))}
                    className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
                    title="معاينة متجر المحل"
                  >
                    <Eye className="w-4 h-4" />
                    <span>معاينة المتجر</span>
                  </button>

                  <button
                    onClick={() => requestDeleteShop(s.id, s.name)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 p-2 rounded-xl transition-all"
                    title="حذف المحل"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: USERS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-400" />
                <span>إدارة حسابات مستخدمي النظام</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">التحكم بكافة الحسابات (الزبائن، أصحاب المحلات، والمدراء)</p>
            </div>

            {/* Role Filter & Purge Button */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={handlePurgeNonOwnerUsers}
                className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                title="حذف جميع البريدات المسجلة ماعدا المالك"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف البريدات (عدا المالك)</span>
              </button>
              {[
                { id: 'all', label: 'جميع الحسابات' },
                { id: 'customer', label: 'الزبائن' },
                { id: 'owner', label: 'أصحاب المحلات' },
                { id: 'admin', label: 'مالك Admin' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setUserRoleFilter(r.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    userRoleFilter === r.id
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
            <input
              type="text"
              placeholder="ابحث بالاسم، البريد الإلكتروني، أو رقم الهاتف..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-11 pl-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
                  <tr>
                    <th className="p-4">المستخدم</th>
                    <th className="p-4">البريد الإلكتروني</th>
                    <th className="p-4">الهاتف</th>
                    <th className="p-4">نوع الحساب</th>
                    <th className="p-4">تاريخ التسجيل</th>
                    <th className="p-4 text-center">الحالة</th>
                    <th className="p-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-800/40 transition-all">
                      <td className="p-4 font-bold text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold">
                          {u.displayName.charAt(0)}
                        </div>
                        <span>{u.displayName}</span>
                      </td>
                      <td className="p-4 text-slate-300 dir-ltr text-right">{u.email}</td>
                      <td className="p-4 text-emerald-400 font-mono">{u.phoneNumber || 'غير مسجل'}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            u.role === 'admin'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : u.role === 'owner'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {u.role === 'admin' ? 'مالك النظام' : u.role === 'owner' ? 'صاحب محل' : 'زبون'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{new Date(u.createdAt).toLocaleDateString('ar-IQ')}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`font-bold ${
                            u.status === 'suspended' ? 'text-red-400' : 'text-emerald-400'
                          }`}
                        >
                          {u.status === 'suspended' ? 'معطل' : 'نشط (Active)'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingUser(u)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                            title="تعديل الحساب"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(u.uid, u.status)}
                            className={`p-2 rounded-xl border ${
                              u.status === 'suspended'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}
                            title={u.status === 'suspended' ? 'تفعيل الحساب' : 'تعطيل الحساب'}
                          >
                            <AlertOctagon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => requestDeleteUser(u.uid, u.displayName || u.email || 'المستخدم')}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl"
                            title="حذف المستخدم"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: PRODUCTS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Package className="w-6 h-6 text-emerald-400" />
                <span>إدارة جميع المنتجات على منصة Barham Pro</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">البحث، الرقابة، الفلترة، وحذف أية قطع غيار أو إكسسوارات مخلفة للشروط</p>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
              <input
                type="text"
                placeholder="ابحث باسم المنتج، المحل، أو المواصفات..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-11 pl-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={productCategoryFilter}
              onChange={(e) => setProductCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">كافة الأقسام والتصنيفات</option>
              <option value="شاشات أيفون">شاشات أيفون</option>
              <option value="بطاريات أندرويد">بطاريات أندرويد</option>
              <option value="كاميرات وقطع غيار">كاميرات وقطع غيار</option>
              <option value="إكسسوارات و حماية">إكسسوارات وحماية</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((p) => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="h-36 bg-slate-950 rounded-xl overflow-hidden mb-3 p-2 flex items-center justify-center border border-slate-800">
                    <img src={p.images[0]} alt={p.name} className="max-h-full object-contain" />
                  </div>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold">{p.category}</span>
                  <h4 className="font-bold text-white text-sm line-clamp-1 mt-1">{p.name}</h4>
                  <div className="text-xs text-slate-400 mt-0.5">المحل: <span className="text-slate-200 font-bold">{p.shopName || 'مركز برهم'}</span></div>
                  <div className="text-sm font-black text-emerald-400 mt-2">{formatIQD(p.priceIQD)}</div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">{p.barcode}</span>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    عرض فقط (الحذف لأصحاب المحلات)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: MAINTENANCE MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Wrench className="w-6 h-6 text-cyan-400" />
                <span>إدارة وشبكة طلبات الصيانة العامة</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">متابعة الأجهزة التي يتم إصلاحها في كافة المحلات بالعراق</p>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'received', label: 'تم الاستلام' },
                { id: 'inspecting', label: 'قيد الفحص' },
                { id: 'repairing', label: 'قيد الإصلاح' },
                { id: 'ready', label: 'جاهز للتسليم' },
                { id: 'delivered', label: 'تم التسليم' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setTicketStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    ticketStatusFilter === st.id
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
            <input
              type="text"
              placeholder="ابحث برقم التذكرة (BRH-...)، اسم الزبون، المحل، أو الجهاز..."
              value={ticketSearch}
              onChange={(e) => setTicketSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-11 pl-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-3">
            {filteredTickets.map((t) => (
              <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 hover:border-slate-700 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-cyan-400 text-sm">#{t.ticketNumber}</span>
                    <span className="font-bold text-white text-base">{t.deviceType}</span>
                    <span className="bg-slate-800 text-slate-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                      {t.shopName}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    الزبون: <span className="text-slate-200 font-bold">{t.customerName}</span> ({t.customerPhone})
                  </div>
                  <div className="text-xs text-slate-300">المشكلة: {t.issueDescription}</div>
                </div>

                <div className="w-full sm:w-48 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-cyan-400">{t.progressPercent}%</span>
                    <span className="text-slate-400">{t.status}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all" style={{ width: `${t.progressPercent}%` }}></div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={t.status}
                    onChange={(e) => handleUpdateTicketStatus(t.id, e.target.value as MaintenanceStatus)}
                    className="bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="received">تم الاستلام</option>
                    <option value="inspecting">قيد الفحص</option>
                    <option value="awaiting_approval">بانتظار الموافقة</option>
                    <option value="repairing">قيد الإصلاح</option>
                    <option value="ready">جاهز للتسليم</option>
                    <option value="delivered">تم التسليم</option>
                  </select>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-800/50 px-3 py-1.5 rounded-xl">
                      متابعة الفحص
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6: INVOICES MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Receipt className="w-6 h-6 text-indigo-400" />
                <span>السجل المالي والفواتير المصدرة</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">معاينة وطباعة أي فاتورة صيانة أو مبيعات باللغة العربية بأسلوب رسمي</p>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
            <input
              type="text"
              placeholder="ابحث برقم الفاتورة (INV-...)، اسم الزبون، أو المحل..."
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-11 pl-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-4">رقم الفاتورة</th>
                  <th className="p-4">المحل المصدر</th>
                  <th className="p-4">اسم الزبون</th>
                  <th className="p-4">طريقة الدفع</th>
                  <th className="p-4">المبلغ الكلي</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4 text-center">الخيارات والطباعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40">
                    <td className="p-4 font-mono font-bold text-indigo-400">{inv.invoiceNumber}</td>
                    <td className="p-4 font-bold text-white">{inv.shopName}</td>
                    <td className="p-4 text-slate-300">{inv.customerName}</td>
                    <td className="p-4">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">
                        {inv.paymentMethod === 'zain_cash' ? 'زين كاش' : 'نقداً'}
                      </span>
                    </td>
                    <td className="p-4 font-black text-emerald-400">{formatIQD(inv.totalIQD)}</td>
                    <td className="p-4 text-slate-400">{new Date(inv.createdAt).toLocaleDateString('ar-IQ')}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-[11px] text-slate-400 font-bold bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl inline-block">
                          الطباعة لأصحاب المحلات فقط 🖨️
                        </span>
                        <button
                          onClick={() => requestDeleteInvoice(inv.id, inv.invoiceNumber)}
                          className="bg-red-600/20 hover:bg-red-600/30 text-red-400 p-2 rounded-xl border border-red-500/30 transition-all flex items-center justify-center gap-1"
                          title="حذف الفاتورة نهائياً (خاص بالمالك)"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 7: BROADCAST NOTIFICATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Bell className="w-6 h-6 text-yellow-400" />
              <span>إرسال إشعار موجه أو عام للتثبيت</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">بث تنبيهات فورية للمستخدمين عبر نظام الإشعارات الداخلي</p>
          </div>

          {notifSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-2xl font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>{notifSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSendBroadcastNotification} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">الجهة المستهدفة بالإشعار</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all', label: 'جميع المستخدمين' },
                  { id: 'owner', label: 'أصحاب المحلات فقط' },
                  { id: 'customer', label: 'الزبائن فقط' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setNotifTarget(t.id as any)}
                    className={`py-2.5 rounded-xl border text-center font-bold transition-all ${
                      notifTarget === t.id
                        ? 'bg-yellow-500 text-slate-950 border-yellow-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">نوع الإشعار</label>
              <select
                value={notifType}
                onChange={(e) => setNotifType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-bold"
              >
                <option value="info">إشعار عام (Info)</option>
                <option value="offer">عرض ترويجي (Offer)</option>
                <option value="maintenance">تحديث نظام الصيانة (Maintenance)</option>
                <option value="warning">تنبيه حماية (Warning)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">عنوان الإشعار</label>
              <input
                type="text"
                required
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="تحديث مهم في تطبيق Barham Pro"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">نص الرسالة</label>
              <textarea
                required
                rows={4}
                value={notifMsg}
                onChange={(e) => setNotifMsg(e.target.value)}
                placeholder="يسرنا إعلامكم بإطلاق ميزة الضمان الرقمي المباشر لجميع الأجهزة المصلحة..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black py-3.5 rounded-xl transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>بث الإشعار الفوري الآن</span>
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 8: OFFERS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'offers' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Tag className="w-6 h-6 text-rose-400" />
                <span>إدارة العروض الترويجية والتخفيضات</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">إضافة، تعديل، أو حذف بنرات العروض المعروضة على الصفحة الرئيسية للزبائن</p>
            </div>

            <button
              onClick={() => {
                setEditingOffer(null);
                setOfferForm({
                  title: '',
                  shopId: shops[0]?.id || 'shop-1',
                  shopName: shops[0]?.name || 'مركز برهم',
                  description: '',
                  discountPercentage: 20,
                  bannerUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
                  validUntil: '2026-12-31',
                  code: 'BARHAM2026',
                });
                setOfferModalOpen(true);
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عرض جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((off) => (
              <div key={off.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col justify-between shadow-xl">
                <div>
                  <div className="h-44 relative bg-slate-950">
                    <img src={off.bannerUrl} alt={off.title} className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-lg">
                      خصم {off.discountPercentage}%
                    </span>
                  </div>

                  <div className="p-5 space-y-2">
                    <span className="text-[10px] text-blue-400 font-bold">{off.shopName}</span>
                    <h3 className="font-bold text-white text-base">{off.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{off.description}</p>
                    {off.code && (
                      <div className="mt-2 text-xs font-mono bg-slate-950 p-2 rounded-xl text-amber-400 font-bold text-center border border-slate-800">
                        كود الخصم: {off.code}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500">ينتهي: {off.validUntil}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingOffer(off);
                        setOfferForm({
                          title: off.title,
                          shopId: off.shopId,
                          shopName: off.shopName,
                          description: off.description,
                          discountPercentage: off.discountPercentage,
                          bannerUrl: off.bannerUrl,
                          validUntil: off.validUntil,
                          code: off.code || '',
                        });
                        setOfferModalOpen(true);
                      }}
                      className="p-2 bg-slate-800 text-slate-300 rounded-xl"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => requestDeleteOffer(off.id, off.title)}
                      className="p-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 9: REPORTS & ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-teal-400" />
              <span>التقارير المالية والنمو الإحصائي</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">حجم المعاملات المالية الموثقة وإحصائيات المنصة</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
              <span className="text-xs font-bold text-slate-400">إجمالي التعاملات المباشرة</span>
              <div className="text-3xl font-black text-emerald-400">{formatIQD(0)}</div>
              <p className="text-xs text-slate-500">تراكم الفواتير الصادرة عبر التطبيق</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
              <span className="text-xs font-bold text-slate-400">معدل نجاح الصيانة</span>
              <div className="text-3xl font-black text-blue-400">0%</div>
              <p className="text-xs text-slate-500">نسبة تذاكر الصيانة المسلمة بنجاح للزبائن</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
              <span className="text-xs font-bold text-slate-400">توزيع المحلات بالمحافظات</span>
              <div className="text-3xl font-black text-purple-400">0 محافظة</div>
              <p className="text-xs text-slate-500">بغداد، أربيل، البصرة، النجف، والموصل...</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 10: SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-2xl">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Settings className="w-6 h-6 text-slate-400" />
              <span>إعدادات النظام والتراخيص</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">تحديد عمولة المنصة والشروط العامة لـ Barham Pro</p>
          </div>

          {settingsSavedMessage && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-2xl font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>{settingsSavedMessage}</span>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">نسبة عمولة المنصة (%)</label>
              <input
                type="number"
                step="0.1"
                value={platformCommission}
                onChange={(e) => setPlatformCommission(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">نسبة الضريبة (إن وجدت)</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">إعلان الشريط العلوي العام للمستخدمين</label>
              <textarea
                rows={3}
                value={systemNotice}
                onChange={(e) => setSystemNotice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
              ></textarea>
            </div>

            <button
              onClick={() => {
                setSettingsSavedMessage('تم حفظ إعدادات النظام بنجاح!');
                setTimeout(() => setSettingsSavedMessage(''), 3000);
              }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/25"
            >
              حفظ وتطبيق الإعدادات
            </button>
          </div>

          {/* DANGER ZONE - FACTORY RESET */}
          <div className="bg-red-950/20 border border-red-500/30 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/30">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-red-400">منطقة العمليات الحساسة: إعادة ضبط المصنع (Factory Reset)</h3>
                <p className="text-xs text-slate-400">تصفير النظام بالكامل، مسح Firestore وقواعد البيانات، وحذف الحسابات والمحلات وتجهيز التطبيق لإنشاء حساب مالك جديد.</p>
              </div>
            </div>

            <button
              onClick={() => setShowResetModal(true)}
              className="w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold py-3.5 rounded-2xl transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>تصفير النظام بالكامل (Perform Full Factory Reset)</span>
            </button>
          </div>
        </div>
      )}

      {/* FACTORY RESET CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl w-full max-w-md p-6 space-y-5 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto border border-red-500/40">
              <AlertOctagon className="w-10 h-10 animate-pulse" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">تأكيد إعادة ضبط المصنع الشاملة؟</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                تحذير نهائي! سيتم مسح كافة البيانات بشكل دائم من Firestore (المستخدمون، المحلات، المنتجات، الصيانة، الفواتير، التقارير) وتسجيل الخروج. 
                عند إعادة تشغيل التطبيق سيُطلب إنشاء حساب المالك الرئيسي من جديد.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                disabled={resetting}
                onClick={async () => {
                  setResetting(true);
                  try {
                    await performFactoryReset();
                  } catch (err) {
                    alert('حدث خطأ أثناء إجراء عملية التصفير');
                  } finally {
                    setResetting(false);
                    setShowResetModal(false);
                  }
                }}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-red-600/30 transition-all text-xs flex items-center justify-center gap-2"
              >
                {resetting ? (
                  <span>جاري تصفير ومسح بيانات النظام...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>نعم، أنفذ تصفير النظام كاملاً الآن</span>
                  </>
                )}
              </button>

              <button
                disabled={resetting}
                onClick={() => setShowResetModal(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-2xl text-xs"
              >
                إلغاء العملية والرجوع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS SECTION */}
      {/* ========================================================================= */}

      {/* SHOP VIEW MODAL */}
      {viewShopModal && (
        <ShopDetailModal
          shop={viewShopModal}
          onClose={() => setViewShopModal(null)}
          onAddToCart={() => {}}
        />
      )}

      {/* EDIT SHOP MODAL */}
      {editingShop && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 text-xs text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">تعديل بيانات المحل: {editingShop.name}</h3>
              <button onClick={() => setEditingShop(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShopEdit} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">اسم المحل</label>
                <input
                  type="text"
                  value={editingShop.name}
                  onChange={(e) => setEditingShop({ ...editingShop, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">التصنيف</label>
                <input
                  type="text"
                  value={editingShop.category}
                  onChange={(e) => setEditingShop({ ...editingShop, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">المدينة</label>
                <input
                  type="text"
                  value={editingShop.city}
                  onChange={(e) => setEditingShop({ ...editingShop, city: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">العنوان التفصيلي</label>
                <input
                  type="text"
                  value={editingShop.address}
                  onChange={(e) => setEditingShop({ ...editingShop, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={editingShop.phone}
                  onChange={(e) => setEditingShop({ ...editingShop, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">حالة الاعتماد</label>
                <select
                  value={editingShop.status}
                  onChange={(e) => setEditingShop({ ...editingShop, status: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                >
                  <option value="approved">مقبول (Approved)</option>
                  <option value="pending">قيد المراجعة (Pending)</option>
                  <option value="suspended">معلق مؤقتاً (Suspended)</option>
                  <option value="rejected">مرفوض (Rejected)</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all"
                >
                  حفظ التغيرات
                </button>
                <button
                  type="button"
                  onClick={() => setEditingShop(null)}
                  className="bg-slate-800 text-slate-300 font-bold px-4 py-3 rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 text-xs text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">تعديل بيانات الحساب: {editingUser.displayName}</h3>
              <button onClick={() => setEditingUser(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  value={editingUser.displayName}
                  onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={editingUser.phoneNumber || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phoneNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">نوع الحساب / الصلاحية</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                >
                  <option value="customer">زبون (Customer)</option>
                  <option value="owner">صاحب محل (Shop Owner)</option>
                  <option value="admin">مالك Admin</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all"
                >
                  حفظ البيانات
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="bg-slate-800 text-slate-300 font-bold px-4 py-3 rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT OFFER MODAL */}
      {offerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 text-xs text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">
                {editingOffer ? 'تعديل العرض الترويجي' : 'إضافة عرض ترويجي جديد'}
              </h3>
              <button onClick={() => setOfferModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">عنوان العرض</label>
                <input
                  type="text"
                  required
                  placeholder="خصم 25% على تبديل شاشات الأيفون"
                  value={offerForm.title}
                  onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">المحل صاحب العرض</label>
                <select
                  value={offerForm.shopId}
                  onChange={(e) => setOfferForm({ ...offerForm, shopId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                >
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">نسبة الخصم (%)</label>
                <input
                  type="number"
                  required
                  value={offerForm.discountPercentage}
                  onChange={(e) => setOfferForm({ ...offerForm, discountPercentage: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">الوصف التفصيلي</label>
                <textarea
                  rows={2}
                  value={offerForm.description}
                  onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                  placeholder="يشمل تبديل الشاشات الأصلية مع الضمان الرقمي لمدة 90 يوماً..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">رابط صورة البنر (Banner URL)</label>
                <input
                  type="url"
                  required
                  value={offerForm.bannerUrl}
                  onChange={(e) => setOfferForm({ ...offerForm, bannerUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">صالح لغاية</label>
                  <input
                    type="date"
                    value={offerForm.validUntil}
                    onChange={(e) => setOfferForm({ ...offerForm, validUntil: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">كود الخصم (اختياري)</label>
                  <input
                    type="text"
                    value={offerForm.code}
                    onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value })}
                    placeholder="BARHAM2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition-all"
                >
                  حفظ ونشر العرض
                </button>
                <button
                  type="button"
                  onClick={() => setOfferModalOpen(false)}
                  className="bg-slate-800 text-slate-300 font-bold px-4 py-3 rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal for System Owner / Admin */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* Global Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText || 'تأكيد'}
        danger={confirmModal.danger !== undefined ? confirmModal.danger : true}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
