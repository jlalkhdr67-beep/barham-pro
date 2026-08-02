import React, { useState, useEffect } from 'react';
import {
  Store,
  Package,
  Wrench,
  Receipt,
  Users,
  Building2,
  Plus,
  Edit2,
  Trash2,
  Printer,
  Barcode,
  QrCode,
  TrendingUp,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Clock,
  ShieldAlert,
  LogOut,
  Camera,
  User,
  Edit3,
  Upload,
  Check,
  Sparkles,
  Tag,
  RefreshCw
} from 'lucide-react';
import { MockDataService } from '../../services/MockDataService';
import { useAuth } from '../../context/AuthContext';
import { Product, MaintenanceTicket, Invoice, Branch, Staff, MaintenanceStatus, Shop, Offer } from '../../types';
import { UserProfileModal } from '../common/UserProfileModal';
import { formatIQD, printInvoicePDF, printThermalReceipt88mm, printThermalReceipt44mm } from '../../utils/pdfGenerator';
import { generateBarcodeDataUrl, generateQRCodeDataUrl } from '../../utils/barcodeUtils';
import { uploadProductImage } from '../../utils/storageUtils';
import { ConfirmModal } from '../common/ConfirmModal';

interface OwnerDashboardProps {
  onPreviewStore?: (shop: Shop) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onPreviewStore }) => {
  const { userProfile, updateUserProfile, logout } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'products' | 'maintenance' | 'invoices' | 'branches' | 'staff' | 'offers'>('overview');

  // Profile Edit State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [uploadingProfileImg, setUploadingProfileImg] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [offersList, setOffersList] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  // Offer Modal State
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDesc, setOfferDesc] = useState('');
  const [offerDiscount, setOfferDiscount] = useState<number>(20);
  const [offerCode, setOfferCode] = useState('');
  const [offerBannerUrl, setOfferBannerUrl] = useState('https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80');

  // Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState<number>(0);
  const [prodQty, setProdQty] = useState<number>(10);
  const [prodCategory, setProdCategory] = useState('قطع غيار شاشات');
  const [prodImage, setProdImage] = useState('https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80');
  const [uploadingImg, setUploadingImg] = useState(false);

  // Maintenance Ticket Edit Modal State
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [ticketStatus, setTicketStatus] = useState<MaintenanceStatus>('inspecting');
  const [ticketProgress, setTicketProgress] = useState<number>(50);
  const [ticketCost, setTicketCost] = useState<number>(0);
  const [technicianNote, setTechnicianNote] = useState('');
  const [ticketSelectedServices, setTicketSelectedServices] = useState<string[]>([]);
  const [customServiceInput, setCustomServiceInput] = useState<string>('');

  // Invoice Modal State
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invCustomerName, setInvCustomerName] = useState('');
  const [invCustomerPhone, setInvCustomerPhone] = useState('');
  const [invItemDesc, setInvItemDesc] = useState('');
  const [invItemPrice, setInvItemPrice] = useState<number>(0);
  const [invItemQty, setInvItemQty] = useState<number>(1);
  const [invNotes, setInvNotes] = useState('');

  // Branch Modal
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [branchCity, setBranchCity] = useState('بغداد');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');

  // Staff Modal
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffTitle, setStaffTitle] = useState('فني صيانة إلكترونيات');

  // Mandatory Shop Details & Maintenance Services Setup State
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [mandatoryShopName, setMandatoryShopName] = useState('');
  const [mandatoryCity, setMandatoryCity] = useState('بغداد');
  const [mandatoryAddress, setMandatoryAddress] = useState('');
  const [mandatoryPhone, setMandatoryPhone] = useState('');
  const [mandatoryDescription, setMandatoryDescription] = useState('');
  const [mandatoryFacebook, setMandatoryFacebook] = useState('');
  const [mandatoryInstagram, setMandatoryInstagram] = useState('');
  const [mandatoryServices, setMandatoryServices] = useState<string[]>([]);
  const [newServiceInput, setNewServiceInput] = useState('');
  const [mandatoryFormError, setMandatoryFormError] = useState('');

  useEffect(() => {
    fetchData();
  }, [userProfile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const shops = MockDataService.getShops();
      const targetShop = shops.find((s) => s.ownerId === userProfile?.uid || s.id === userProfile?.shopId) || null;
      if (targetShop) {
        setCurrentShop(targetShop);
        setMandatoryShopName(targetShop.name || '');
        setMandatoryCity(targetShop.city || 'بغداد');
        setMandatoryAddress(targetShop.address || '');
        setMandatoryPhone(targetShop.phone || '');
        setMandatoryDescription(targetShop.description || '');
        setMandatoryFacebook(targetShop.socialLinks?.facebook || '');
        setMandatoryInstagram(targetShop.socialLinks?.instagram || '');
        setMandatoryServices(targetShop.services || []);
      }
      setProducts(MockDataService.getProducts());
      setTickets(MockDataService.getTickets());
      setInvoices(MockDataService.getInvoices());
      setStaffList(MockDataService.getStaff());
      setOffersList(MockDataService.getOffers());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Shop-specific filtered data & metrics
  const shopProducts = useMemo(() => {
    if (!currentShop) return [];
    return products.filter((p) => p.shopId === currentShop.id);
  }, [products, currentShop]);

  const shopTickets = useMemo(() => {
    if (!currentShop) return [];
    return tickets.filter((t) => t.shopId === currentShop.id);
  }, [tickets, currentShop]);

  const shopInvoices = useMemo(() => {
    if (!currentShop) return [];
    return invoices.filter((i) => i.shopId === currentShop.id);
  }, [invoices, currentShop]);

  const totalSalesIQD = useMemo(() => {
    return shopInvoices.reduce((sum, inv) => sum + inv.totalIQD, 0);
  }, [shopInvoices]);

  const shopCustomersCount = useMemo(() => {
    const custIds = new Set<string>();
    shopTickets.forEach((t) => { if (t.customerId) custIds.add(t.customerId); });
    shopInvoices.forEach((i) => { if (i.customerId) custIds.add(i.customerId); });
    return custIds.size;
  }, [shopTickets, shopInvoices]);

  // Save / Update Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const barcode = `BRH-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const qrCode = `QR-${barcode}`;
    const imgToUse = prodImage || 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80';

    if (editingProdId) {
      const updates = {
        name: prodName,
        priceIQD: Number(prodPrice),
        quantity: Number(prodQty),
        category: prodCategory,
        images: [imgToUse],
      };
      MockDataService.updateProduct(editingProdId, updates);
      setProducts(MockDataService.getProducts());
    } else {
      const newProd: Product = {
        id: `prod_${Date.now()}`,
        shopId: userProfile?.shopId || 'shop_barham_main',
        shopName: userProfile?.displayName ? `متجر ${userProfile.displayName}` : 'مركز برهم برو للصيانة والبرمجيات',
        name: prodName,
        description: 'منتج أو قطعة غيار معتمدة بالضمان الأصلي من المركز.',
        priceIQD: Number(prodPrice),
        quantity: Number(prodQty),
        category: prodCategory,
        images: [imgToUse],
        barcode,
        qrCode,
        createdAt: new Date().toISOString(),
      };
      MockDataService.addProduct(newProd);
      setProducts(MockDataService.getProducts());
    }

    setShowProductModal(false);
    setProdName('');
    setProdPrice(0);
    setProdQty(10);
    setProdImage('https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80');
    setEditingProdId(null);
  };

  const handleDeleteProduct = async (id: string) => {
    MockDataService.deleteProduct(id);
    setProducts(MockDataService.getProducts());
  };

  const requestDeleteProduct = (productId: string, productName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف المنتج',
      message: `هل أنت متأكد من رغبتك في حذف المنتج "${productName}" نهائياً من متجرك؟`,
      onConfirm: () => handleDeleteProduct(productId),
    });
  };

  // Accept ticket request by owner first, then allow filling services and cost
  const handleAcceptTicketRequest = (ticket: MaintenanceTicket) => {
    const updatedStages = ticket.stages.map((stg) => {
      if (stg.status === 'pending_owner_approval' || stg.status === 'received') {
        return { ...stg, completed: true, date: 'الآن' };
      }
      return stg;
    });

    MockDataService.updateTicket(ticket.id, {
      status: 'inspecting',
      updatedAt: new Date().toISOString(),
      stages: updatedStages,
    });
    setTickets(MockDataService.getTickets());

    // Open modal immediately so owner can select services, set cost & notes
    setSelectedTicket({ ...ticket, status: 'inspecting' });
    setTicketStatus('inspecting');
    setTicketProgress(30);
    setTicketCost(ticket.estimatedCostIQD || 25000);
    setTechnicianNote(ticket.technicianNote || 'تم قبول الطلب بوسطة صاحب المحل. جاري فحص الجهاز وتحديد الخدمات والتكلفة.');
    setTicketSelectedServices(ticket.selectedServices || (currentShop?.services ? [currentShop.services[0]] : []));
    setShowTicketModal(true);
  };

  const handleRejectTicketRequest = (ticket: MaintenanceTicket) => {
    const updatedStages = ticket.stages.map((stg) => {
      if (stg.status === 'pending_owner_approval') {
        return { ...stg, title: 'تم رفض الطلب من قبل صاحب المحل', completed: true, date: 'الآن' };
      }
      return stg;
    });

    MockDataService.updateTicket(ticket.id, {
      status: 'rejected',
      rejectionReason: 'اعتذار عن قبول الطلب لعدم توفر القطع الأصلية أو إمكانية الصيانة حالياً.',
      updatedAt: new Date().toISOString(),
      stages: updatedStages,
    });
    setTickets(MockDataService.getTickets());
  };

  // Update Maintenance Status and Services
  const handleUpdateTicketStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    const updatedStages = selectedTicket.stages.map((stg) => {
      if (stg.status === ticketStatus) {
        return { ...stg, completed: true, date: 'الآن' };
      }
      return stg;
    });

    const updatedTicket: Partial<MaintenanceTicket> = {
      status: ticketStatus,
      progressPercent: Number(ticketProgress),
      estimatedCostIQD: Number(ticketCost),
      finalCostIQD: Number(ticketCost),
      technicianNote,
      selectedServices: ticketSelectedServices,
      updatedAt: new Date().toISOString(),
      stages: updatedStages,
    };

    MockDataService.updateTicket(selectedTicket.id, updatedTicket);
    setTickets(MockDataService.getTickets());

    setShowTicketModal(false);
  };

  // Create Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const newInvNum = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const total = Number(invItemPrice) * Number(invItemQty);

    const newInvoice: Invoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: newInvNum,
      shopId: userProfile?.shopId || 'shop_barham_main',
      shopName: userProfile?.displayName ? `متجر ${userProfile.displayName}` : 'مركز برهم برو للصيانة والبرمجيات',
      shopAddress: 'بغداد - شارع الصناعة - مقابل الجامعة التكنولوجية',
      shopPhone: '07700001122',
      customerId: 'cust_gen',
      customerName: invCustomerName || 'زبون عام',
      customerPhone: invCustomerPhone || '07700000000',
      items: [
        {
          id: '1',
          description: invItemDesc || 'خدمة صيانة / قطعة غيار',
          quantity: Number(invItemQty) || 1,
          unitPriceIQD: Number(invItemPrice) || 0,
          totalPriceIQD: total,
        },
      ],
      subtotalIQD: total,
      taxIQD: 0,
      discountIQD: 0,
      totalIQD: total,
      paymentMethod: 'cash',
      status: 'paid',
      notes: invNotes || 'شكرًا لتعاملكم معنا. الضمان يسري لمدة 60 يوماً.',
      createdAt: new Date().toISOString(),
    };

    MockDataService.addInvoice(newInvoice);
    setInvoices(MockDataService.getInvoices());

    try {
      printInvoicePDF(newInvoice);
    } catch (err) {
      console.error('Print PDF failed:', err);
    }

    setShowInvoiceModal(false);
    setInvCustomerName('');
    setInvCustomerPhone('');
    setInvItemDesc('');
    setInvItemPrice(0);
    setInvItemQty(1);
    setInvNotes('');
  };

  // Add Branch
  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    const newBranch: Branch = {
      id: `br_${Date.now()}`,
      shopId: 'shop_barham_main',
      name: branchName,
      city: branchCity,
      address: branchAddress,
      phone: branchPhone,
      workingHours: '10:00 ص - 10:00 م',
    };
    setBranches((prev) => [...prev, newBranch]);
    setShowBranchModal(false);
  };

  // Handle Save Offer
  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const shopId = userProfile?.shopId || 'shop_barham_main';
    const shopName = userProfile?.displayName ? `متجر ${userProfile.displayName}` : 'مركز برهم برو للصيانة والبرمجيات';

    if (editingOfferId) {
      MockDataService.updateOffer(editingOfferId, {
        title: offerTitle,
        description: offerDesc,
        discountPercentage: Number(offerDiscount),
        code: offerCode || undefined,
        bannerUrl: offerBannerUrl,
      });
    } else {
      const newOffer: Offer = {
        id: `off_${Date.now()}`,
        shopId,
        shopName,
        title: offerTitle,
        description: offerDesc,
        discountPercentage: Number(offerDiscount),
        bannerUrl: offerBannerUrl,
        validUntil: '2026-12-31',
        code: offerCode || undefined,
      };
      MockDataService.addOffer(newOffer);
    }

    setOffersList(MockDataService.getOffers());
    setShowOfferModal(false);
    setEditingOfferId(null);
    setOfferTitle('');
    setOfferDesc('');
    setOfferDiscount(20);
    setOfferCode('');
  };

  const handleDeleteOffer = (id: string, title: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف العرض',
      message: `هل أنت متأكد من رغبتك في حذف العرض "${title}"؟`,
      onConfirm: () => {
        MockDataService.deleteOffer(id);
        setOffersList(MockDataService.getOffers());
      },
    });
  };
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const newStaff: Staff = {
      id: `st_${Date.now()}`,
      shopId: 'shop_barham_main',
      name: staffName,
      email: staffEmail,
      phone: staffPhone,
      roleTitle: staffTitle,
      permissions: ['maintenance', 'sales'],
      createdAt: new Date().toISOString(),
    };
    MockDataService.addStaff(newStaff);
    setStaffList(MockDataService.getStaff());
    setShowStaffModal(false);
  };

  const handleOpenProfileModal = () => {
    setProfileName(userProfile?.displayName || '');
    setProfilePhoto(
      userProfile?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
    );
    setShowProfileModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    try {
      await updateUserProfile({
        displayName: profileName.trim(),
        photoURL: profilePhoto,
      });

      if (userProfile?.shopId) {
        MockDataService.updateShop(userProfile.shopId, {
          logo: profilePhoto,
        });
      }

      setProfileSaveSuccess(true);
      setTimeout(() => {
        setProfileSaveSuccess(false);
        setShowProfileModal(false);
      }, 1000);
    } catch (err) {
      console.error(err);
    }
  };

  // Mandatory setup form removed per user request
  const isSetupMandatory = false;

  const handleAddMandatoryService = () => {
    if (!newServiceInput.trim()) return;
    if (mandatoryServices.includes(newServiceInput.trim())) {
      setMandatoryFormError('هذه الخدمة مضافة بالفعل لقائمة الخدمات!');
      return;
    }
    setMandatoryServices((prev) => [...prev, newServiceInput.trim()]);
    setNewServiceInput('');
    setMandatoryFormError('');
  };

  const handleRemoveMandatoryService = (index: number) => {
    setMandatoryServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveMandatorySetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mandatoryShopName.trim() || !mandatoryCity.trim() || !mandatoryAddress.trim() || !mandatoryPhone.trim() || !mandatoryDescription.trim()) {
      setMandatoryFormError('يرجى ملء كافة معلومات المحل الأساسية (الاسم، المدينة، العنوان، الهاتف، والوصف)!');
      return;
    }
    if (mandatoryServices.length === 0) {
      setMandatoryFormError('يجب إضافة خدمة صيانة واحدة على الأقل للاستمرار وحفظ معلومات المحل!');
      return;
    }

    if (currentShop) {
      const updates: Partial<Shop> = {
        name: mandatoryShopName.trim(),
        city: mandatoryCity.trim(),
        address: mandatoryAddress.trim(),
        phone: mandatoryPhone.trim(),
        description: mandatoryDescription.trim(),
        socialLinks: {
          facebook: mandatoryFacebook.trim(),
          instagram: mandatoryInstagram.trim(),
        },
        services: mandatoryServices,
        isDetailsCompleted: true,
      };
      MockDataService.updateShop(currentShop.id, updates);
      setCurrentShop({ ...currentShop, ...updates });
    }
    setMandatoryFormError('');
  };

  const checkApprovalStatus = async () => {
    if (!userProfile) return;
    const mockUser = MockDataService.getUserById(userProfile.uid);
    const shops = MockDataService.getShops();
    const requests = MockDataService.getShopRequests();

    const targetShop = shops.find((s) => s.ownerId === userProfile.uid || (userProfile.shopId && s.id === userProfile.shopId));
    const targetReq = requests.find((r) => r.ownerId === userProfile.uid || (r.email && r.email.toLowerCase() === userProfile.email.toLowerCase()));

    // Approved ONLY if Admin explicitly marked shop or request as approved
    const isApprovedByAdmin = (targetShop && targetShop.status === 'approved') || (targetReq && targetReq.status === 'approved');

    if (isApprovedByAdmin) {
      const activeShopId = targetShop?.id || userProfile.shopId || (targetReq ? `shop_${targetReq.id}` : `shop_${Date.now()}`);
      await updateUserProfile({
        status: 'active',
        shopId: activeShopId,
        role: 'owner'
      });
      fetchData();
    }
  };

  const isAccountPending =
    userProfile?.role === 'owner' && (
      userProfile?.status === 'pending' ||
      userProfile?.status === 'suspended' ||
      (currentShop && currentShop.status === 'pending')
    );

  useEffect(() => {
    if (isAccountPending) {
      checkApprovalStatus();
      const interval = setInterval(() => {
        checkApprovalStatus();
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isAccountPending, userProfile?.uid]);

  if (isAccountPending) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-slate-900 border border-amber-500/30 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95" dir="rtl">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-500/10">
          <Clock className="w-10 h-10 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">الحساب معلق ⏳ بانتظار موافقة المالك</h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
            تم تسجيل حساب المحل بنجاح. حسابك معلق حالياً ولا يمكنك إجراء أي عمليات أو إضافة منتجات أو فواتير حتى يتم قبول طلبك وموافقته رسمياً من قبل مالك المنصة الرئيسي (Super Admin).
          </p>
        </div>
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-amber-300 font-bold flex items-center justify-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
          <span>حالة الحساب: معلق (قيد الانتظار والمراجعة من الإدارة)</span>
        </div>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => checkApprovalStatus()}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-3 px-6 rounded-2xl transition-all shadow-lg flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>التحقق من موافقة المالك الآن</span>
          </button>
          <button
            onClick={() => logout()}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 px-6 rounded-2xl transition-all shadow-lg flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج والعودة لاحقاً</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 text-slate-100">
      {/* Mandatory Shop & Maintenance Services Setup Modal */}
      {isSetupMandatory && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Wrench className="w-7 h-7 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white">إكمال معلومات المحل وخدمات الصيانة (إجباري) ⚠️</h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  أهلاً بك! تمت الموافقة على متجرك من قبل المالك. يجب ملء معلومات المحل وخدمات الصيانة المقدمة بشكل إجباري لتفعيل المتجر والبدء بتقديم الخدمات.
                </p>
              </div>
            </div>

            {mandatoryFormError && (
              <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{mandatoryFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveMandatorySetup} className="space-y-5 text-xs">
              {/* Section 1: Basic Shop Info */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <h3 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  <span>1. معلومات المحل العامة (إجباري)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">اسم المحل *</label>
                    <input
                      type="text"
                      required
                      value={mandatoryShopName}
                      onChange={(e) => setMandatoryShopName(e.target.value)}
                      placeholder="مثال: مركز برهم للصيانة المتقدمة"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">المدينة *</label>
                    <select
                      value={mandatoryCity}
                      onChange={(e) => setMandatoryCity(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="بغداد">بغداد</option>
                      <option value="البصرة">البصرة</option>
                      <option value="أربيل">أربيل</option>
                      <option value="النجف">النجف</option>
                      <option value="كربلاء">كربلاء</option>
                      <option value="الموصل">الموصل</option>
                      <option value="كركوك">كركوك</option>
                      <option value="الحلة">الحلة</option>
                      <option value="الناصرية">الناصرية</option>
                      <option value="السليمانية">السليمانية</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">العنوان التفصيلي *</label>
                    <input
                      type="text"
                      required
                      value={mandatoryAddress}
                      onChange={(e) => setMandatoryAddress(e.target.value)}
                      placeholder="مثال: المنصور - شارع 14 رمضان"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">رقم هاتف المحل *</label>
                    <input
                      type="tel"
                      required
                      value={mandatoryPhone}
                      onChange={(e) => setMandatoryPhone(e.target.value)}
                      placeholder="07700000000"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">نبذة وشرح عن خدمات المحل *</label>
                  <textarea
                    required
                    rows={3}
                    value={mandatoryDescription}
                    onChange={(e) => setMandatoryDescription(e.target.value)}
                    placeholder="اكتب تفاصيل المحل والخدمات التي تقدمونها للزبائن..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">رابط فيسبوك (Facebook)</label>
                    <input
                      type="url"
                      value={mandatoryFacebook}
                      onChange={(e) => setMandatoryFacebook(e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">رابط انستغرام (Instagram)</label>
                    <input
                      type="url"
                      value={mandatoryInstagram}
                      onChange={(e) => setMandatoryInstagram(e.target.value)}
                      placeholder="https://instagram.com/yourpage"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Maintenance Services */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-cyan-400 text-sm flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    <span>2. خدمات الصيانة المقدمة (إجباري - إضافة خدمة واحدة على الأقل) *</span>
                  </h3>
                  <span className="text-[11px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                    المضاف: {mandatoryServices.length} خدمات
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newServiceInput}
                    onChange={(e) => setNewServiceInput(e.target.value)}
                    placeholder="اكتب اسم خدمة صيانة (مثال: تبديل شاشات أصلية)"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMandatoryService();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddMandatoryService}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 rounded-xl flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة</span>
                  </button>
                </div>

                {/* Quick suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400">اقتراحات سريعة:</span>
                  {[
                    'تبديل شاشات أصلية مع الضمان',
                    'إصلاح آيسيات الشحن والباور',
                    'فك تشفير وحسابات iCloud',
                    'صيانة اللابتوبات والأجهزة الذكية',
                    'تغيير بطاريات كفاءة 100%'
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        if (!mandatoryServices.includes(sug)) {
                          setMandatoryServices((prev) => [...prev, sug]);
                          setMandatoryFormError('');
                        }
                      }}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-lg transition-all"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>

                {/* Added services list */}
                <div className="space-y-1.5 pt-2">
                  {mandatoryServices.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                      لم تقم بإضافة أي خدمة صيانة بعد. استخدم الحقل أعلاه لإضافة خدمات متجرك.
                    </div>
                  ) : (
                    mandatoryServices.map((srv, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                        <span className="text-slate-200 font-bold">{srv}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMandatoryService(idx)}
                          className="p-1 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl text-sm transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>تأكيد وحفظ بيانات المحل وخدمات الصيانة وتفعيل المتجر</span>
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Suspended Shop Banner */}
      {userProfile?.status === 'suspended' && (
        <div className="bg-red-950/90 border-2 border-red-500/60 rounded-3xl p-6 sm:p-8 space-y-3 shadow-2xl animate-in fade-in" dir="rtl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 font-bold text-2xl shrink-0">
              <ShieldAlert className="w-8 h-8 animate-pulse text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white">حالة المحل: معلق (Suspended) 🛑</h2>
                <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-xs px-3 py-1 rounded-full font-bold">معلق حالياً</span>
              </div>
              <p className="text-xs sm:text-sm text-red-200 mt-1">
                قام مالك المنصة (Admin) بتعليق هذا المحل. متجرك معلق حالياً وتوقفت جميع العمليات حتى يتم إلغاء التعليق وإعادة التفعيل من قبل المالك العام.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-4">
          <div
            onClick={handleOpenProfileModal}
            className="relative group cursor-pointer shrink-0"
            title="انقر لتعديل الصورة والاسم"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border-2 border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-xl shadow-lg overflow-hidden transition-all group-hover:border-blue-400 group-hover:scale-105">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt={userProfile.displayName} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-8 h-8" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-blue-600 group-hover:bg-blue-500 text-white p-1 rounded-lg shadow-md border border-slate-900 transition-all">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {userProfile?.displayName || 'مالك المحل'}
              </h2>
              <button
                onClick={handleOpenProfileModal}
                className="text-slate-400 hover:text-blue-400 bg-slate-800/80 hover:bg-slate-800 p-1.5 rounded-lg border border-slate-700/60 transition-all"
                title="تعديل الاسم والصورة"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                حساب صاحب محل موثق
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">لوحة التحكم الاحترافية للمبيعات، المخزون، طلبات الصيانة والفواتير</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleOpenProfileModal}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg hover:border-blue-500/50"
          >
            <User className="w-4 h-4 text-blue-400" />
            <span>تعديل الاسم والصورة</span>
          </button>
          {onPreviewStore && (
            <button
              onClick={() => {
                const myShop: Shop = currentShop || {
                  id: userProfile?.shopId || `shop_${userProfile?.uid}`,
                  name: userProfile?.displayName ? `متجر ${userProfile.displayName}` : 'مركز صيانة وتجارة هواتف',
                  slug: 'shop',
                  ownerId: userProfile?.uid || '',
                  rating: 0,
                  reviewsCount: 0,
                  city: 'بغداد',
                  address: 'العنوان الرئيسي',
                  description: 'مركز محلي معتمد لبيع وصيانة الهواتف والقطع الأصلية',
                  coverImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
                  logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&q=80',
                  status: 'approved',
                  distanceKm: 0.8,
                  workingHours: '9:00 ص - 10:00 م',
                  category: 'هواتف',
                  phone: userProfile?.phoneNumber || '07700001122',
                  createdAt: new Date().toISOString(),
                  branches: [],
                };
                onPreviewStore(myShop);
              }}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20"
            >
              <Store className="w-4 h-4" />
              <span>معاينة متجري 🏪</span>
            </button>
          )}
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Printer className="w-4 h-4" />
            <span>إنشاء فاتورة سريعة PDF</span>
          </button>
          <button
            onClick={() => {
              setEditingProdId(null);
              setShowProductModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منتج جديد</span>
          </button>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-medium mb-1">إجمالي المنتجات</div>
          <div className="text-2xl font-black text-white">{shopProducts.length}</div>
          <span className="text-[10px] text-blue-400 mt-1 block">في المخزون الفعلي</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-medium mb-1">إجمالي المبيعات</div>
          <div className="text-2xl font-black text-emerald-400">{formatIQD(totalSalesIQD)}</div>
          <span className="text-[10px] text-emerald-500 mt-1 block">من فواتير المحل المعتمدة</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-medium mb-1">طلبات الصيانة</div>
          <div className="text-2xl font-black text-blue-400">{shopTickets.length}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">تذكرة صيانة للمحل</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-medium mb-1">عدد العملاء</div>
          <div className="text-2xl font-black text-purple-400">{shopCustomersCount}</div>
          <span className="text-[10px] text-purple-400 mt-1 block">زبون مسجل للمحل</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 col-span-2 lg:col-span-1">
          <div className="text-xs text-slate-400 font-medium mb-1">الفواتير المصدرة</div>
          <div className="text-2xl font-black text-amber-400">{shopInvoices.length}</div>
          <span className="text-[10px] text-amber-500 mt-1 block">فاتورة PDF معتمدة</span>
        </div>
      </div>

      {/* Secondary Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-2 space-x-reverse overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'نظرة عامة والمنتجات', icon: <Package className="w-4 h-4" /> },
          { id: 'maintenance', label: 'إدارة طلبات الصيانة', icon: <Wrench className="w-4 h-4" /> },
          { id: 'invoices', label: 'سجل الفواتير والـ PDF', icon: <Receipt className="w-4 h-4" /> },
          { id: 'offers', label: 'إدارة العروض والخصومات', icon: <Tag className="w-4 h-4 text-rose-400" /> },
          { id: 'branches', label: 'الفروع (Branches)', icon: <Building2 className="w-4 h-4" /> },
          { id: 'staff', label: 'الموظفون والصلاحيات', icon: <Users className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === tab.id
                ? 'border-blue-500 text-blue-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* SUBTAB 1: PRODUCTS MANAGEMENT & BARCODES */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-white">إدارة منتجات المتجر والمخزون</h3>
            <button
              onClick={() => {
                setEditingProdId(null);
                setShowProductModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>منتج جديد</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
                  <tr>
                    <th className="p-3.5">المنتج</th>
                    <th className="p-3.5">التصنيف</th>
                    <th className="p-3.5">السعر بالدينار</th>
                    <th className="p-3.5">الكمية بالمخزن</th>
                    <th className="p-3.5">الباركود & QR</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 flex items-center gap-3">
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-950 border border-slate-800"
                        />
                        <span className="font-bold text-white max-w-xs truncate">{prod.name}</span>
                      </td>
                      <td className="p-3.5 text-slate-300">{prod.category}</td>
                      <td className="p-3.5 font-black text-emerald-400">{formatIQD(prod.priceIQD)}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            prod.quantity < 5
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-emerald-500/10 text-emerald-300'
                          }`}
                        >
                          {prod.quantity} قطعة
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-blue-400">{prod.barcode}</td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingProdId(prod.id);
                              setProdName(prod.name);
                              setProdPrice(prod.priceIQD);
                              setProdQty(prod.quantity);
                              setProdCategory(prod.category);
                              setShowProductModal(true);
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg"
                            title="تعديل"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => requestDeleteProduct(prod.id, prod.name)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 rounded-lg"
                            title="حذف"
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

      {/* SUBTAB 2: MAINTENANCE TICKETS STATUS MANAGER */}
      {activeSubTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-white">إدارة طلبات الصيانة والموافقة عليها</h3>
            <span className="text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              عدد الطلبات بانتظار موافقة المالك: {tickets.filter(t => t.status === 'pending_owner_approval').length}
            </span>
          </div>

          <div className="space-y-3">
            {tickets.map((t) => {
              const isPendingApproval = t.status === 'pending_owner_approval';
              const isRejected = t.status === 'rejected';

              return (
                <div
                  key={t.id}
                  className={`bg-slate-900 border rounded-2xl p-5 flex flex-wrap justify-between items-center gap-4 transition-all ${
                    isPendingApproval
                      ? 'border-amber-500/60 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 shadow-xl shadow-amber-500/5'
                      : isRejected
                      ? 'border-red-500/30 opacity-75'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {t.deviceImage && (
                      <img
                        src={t.deviceImage}
                        alt={t.deviceType}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-700 bg-slate-950 flex-shrink-0"
                      />
                    )}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-blue-500/20 text-blue-300 font-bold px-2.5 py-0.5 rounded-full text-xs">
                          #{t.ticketNumber}
                        </span>
                        {isPendingApproval ? (
                          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[11px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                            <span>⚡ طلب جديد بانتظار موافقتك كمالك للمحل</span>
                          </span>
                        ) : isRejected ? (
                          <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[11px] font-bold px-3 py-0.5 rounded-full">
                            🛑 تم رفض الطلب
                          </span>
                        ) : (
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-3 py-0.5 rounded-full">
                            ✅ تمت الموافقة - جاري التنفيذ
                          </span>
                        )}
                        <span className="text-xs text-slate-400">الزبون: {t.customerName} ({t.customerPhone})</span>
                      </div>

                      <h4 className="text-base font-bold text-white">{t.deviceType}</h4>
                      <p className="text-xs text-slate-300">وصف المشكلة: {t.issueDescription}</p>

                      {/* Render Selected Services if filled */}
                      {t.selectedServices && t.selectedServices.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] text-amber-300 font-bold">الخدمات المعتمدة:</span>
                          {t.selectedServices.map((srv, idx) => (
                            <span key={idx} className="bg-slate-800 text-slate-200 border border-slate-700 text-[10px] px-2 py-0.5 rounded-lg">
                              {srv}
                            </span>
                          ))}
                        </div>
                      )}

                      {t.estimatedCostIQD > 0 && (
                        <div className="text-xs font-bold text-emerald-400">
                          التكلفة المحددة: {formatIQD(t.estimatedCostIQD)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isPendingApproval ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAcceptTicketRequest(t)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>قبول الطلب وتحديد الخدمات</span>
                        </button>
                        <button
                          onClick={() => handleRejectTicketRequest(t)}
                          className="bg-slate-800 hover:bg-red-900/40 text-red-400 border border-red-500/40 font-bold text-xs px-3 py-2.5 rounded-xl transition-all"
                        >
                          رفض
                        </button>
                      </div>
                    ) : isRejected ? (
                      <span className="text-xs text-slate-500 font-bold">الطلب مرفوض</span>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-slate-400">نسبة الإنجاز</div>
                          <div className="text-sm font-bold text-cyan-400">{t.progressPercent}%</div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedTicket(t);
                            setTicketStatus(t.status);
                            setTicketProgress(t.progressPercent);
                            setTicketCost(t.estimatedCostIQD || 0);
                            setTechnicianNote(t.technicianNote || '');
                            setTicketSelectedServices(t.selectedServices || []);
                            setShowTicketModal(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل الخدمات والتكلفة</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 3: INVOICES PDF */}
      {activeSubTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-white">سجل الفواتير وطباعة الـ PDF</h3>
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>فاتورة جديدة PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invoices.map((inv) => (
              <div key={inv.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="font-bold text-blue-400 text-xs">#{inv.invoiceNumber}</span>
                  <span className="text-xs text-slate-400">{new Date(inv.createdAt).toLocaleDateString('ar-IQ')}</span>
                </div>
                <div className="text-xs text-slate-300">الزبون: <strong className="text-white">{inv.customerName}</strong></div>
                <div className="text-lg font-black text-emerald-400">{formatIQD(inv.totalIQD)}</div>

                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <div className="text-[11px] text-slate-400 font-bold">خيارات الطباعة المتاحة:</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => printInvoicePDF(inv, 'A4')}
                      className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-[11px] py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1"
                      title="طباعة A4 قياسية"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>ورق A4</span>
                    </button>

                    <button
                      onClick={() => printThermalReceipt88mm(inv)}
                      className="bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1"
                      title="طباعة وصل حراري 88 ملم POS"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-400" />
                      <span>حراري 88mm</span>
                    </button>

                    <button
                      onClick={() => printThermalReceipt44mm(inv)}
                      className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-bold text-[11px] py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1"
                      title="طباعة وصل حراري مصغر 44 ملم"
                    >
                      <Printer className="w-3.5 h-3.5 text-purple-400" />
                      <span>حراري 44mm</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: BRANCHES */}
      {activeSubTab === 'branches' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-white">فروع المركز</h3>
            <button
              onClick={() => setShowBranchModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة فرع جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-blue-500/40 rounded-2xl p-5 space-y-2 relative">
              <span className="bg-blue-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full absolute top-4 left-4">الفرع الرئيسي</span>
              <h4 className="font-bold text-white text-base">فرع شارع فلسطين (الرئيسي)</h4>
              <p className="text-xs text-slate-400">بغداد - قرب ساحة الميسلون</p>
              <p className="text-xs text-emerald-400 font-mono">07701234567</p>
            </div>

            {branches.map((b) => (
              <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                <h4 className="font-bold text-white text-base">{b.name}</h4>
                <p className="text-xs text-slate-400">{b.city} - {b.address}</p>
                <p className="text-xs text-emerald-400 font-mono">{b.phone}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 5: STAFF */}
      {activeSubTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-white">إدارة الموظفين والفنيين والصلاحيات</h3>
            <button
              onClick={() => setShowStaffModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة موظف جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staffList.map((st) => (
              <div key={st.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                <h4 className="font-bold text-white text-base">{st.name}</h4>
                <div className="text-xs text-blue-400 font-semibold">{st.roleTitle}</div>
                <p className="text-xs text-slate-400">{st.email} | {st.phone}</p>
                <div className="flex gap-1.5 pt-2">
                  {st.permissions.map((p, i) => (
                    <span key={i} className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded border border-slate-700">
                      صلاحية: {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 6: OFFERS */}
      {activeSubTab === 'offers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-white">إدارة العروض الترويجية والخصومات لمتجرك</h3>
            <button
              onClick={() => {
                setEditingOfferId(null);
                setOfferTitle('');
                setOfferDesc('');
                setOfferDiscount(20);
                setOfferCode('');
                setShowOfferModal(true);
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-rose-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عرض جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offersList.map((off) => (
              <div key={off.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl">
                <div>
                  <div className="h-40 relative bg-slate-950">
                    <img src={off.bannerUrl} alt={off.title} className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-lg">
                      خصم {off.discountPercentage}%
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-white text-base">{off.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{off.description}</p>
                    {off.code && (
                      <div className="text-xs font-mono bg-slate-950 p-2 rounded-xl text-amber-400 font-bold text-center border border-slate-800">
                        كود الخصم: {off.code}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">ينتهي: {off.validUntil}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingOfferId(off.id);
                        setOfferTitle(off.title);
                        setOfferDesc(off.description);
                        setOfferDiscount(off.discountPercentage);
                        setOfferCode(off.code || '');
                        setShowOfferModal(true);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg"
                      title="تعديل"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteOffer(off.id, off.title)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 rounded-lg"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative text-slate-100">
            <button onClick={() => setShowProductModal(false)} className="absolute top-4 left-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-lg font-black text-white mb-4">{editingProdId ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}</h4>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">اسم المنتج / قطعة الغيار</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="مثال: شاشة آيفون 15 أصلية"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">السعر (د.ع)</label>
                  <input
                    type="number"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">الكمية المتاحة</label>
                  <input
                    type="number"
                    required
                    value={prodQty}
                    onChange={(e) => setProdQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">التصنيف</label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="هاتف">هاتف</option>
                  <option value="هواتف">هواتف وأجهزة ذكية</option>
                  <option value="قطع غيار شاشات">قطع غيار شاشات</option>
                  <option value="بطاريات أصلية">بطاريات أصلية</option>
                  <option value="شواحن ومحولات">شواحن ومحولات</option>
                  <option value="سماعات وإكسسوارات">سماعات وإكسسوارات</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">صورة المنتج (رفع إلى Firebase Storage)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadingImg(true);
                      try {
                        const url = await uploadProductImage(file, 'products');
                        setProdImage(url);
                      } catch (err) {
                        console.error('Error uploading product image:', err);
                      } finally {
                        setUploadingImg(false);
                      }
                    }
                  }}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                />
                {uploadingImg && <p className="text-[11px] text-blue-400 mt-1">جاري رفع الصورة إلى Firebase Storage...</p>}
                {prodImage && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={prodImage} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-slate-700" />
                    <span className="text-[10px] text-slate-400 truncate max-w-[200px]">{prodImage}</span>
                  </div>
                )}
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl mt-4">
                حفظ المنتج
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Status Edit Modal */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 relative text-slate-100 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowTicketModal(false)} className="absolute top-4 left-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-lg font-black text-white mb-1">
              تحديث خدمات وتكلفة وحالة الطلب #{selectedTicket.ticketNumber}
            </h4>
            <p className="text-xs text-slate-400 mb-4">الزبون: {selectedTicket.customerName} ({selectedTicket.deviceType})</p>

            <form onSubmit={handleUpdateTicketStatus} className="space-y-4 text-xs">
              {/* Service Selection */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-amber-300 font-bold">
                  تحديد وتخصيص الخدمات المطلوبة لهذا الجهاز:
                </label>
                <p className="text-[11px] text-slate-400">اختر الخدمات المعالجة أو أضف خدمة مخصصة:</p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(currentShop?.services || [
                    'تبديل شاشة أصلية OLED',
                    'تبديل بطارية أصلية 100%',
                    'إصلاح أيسي الشحن ic',
                    'صيانة السماعات والميكروفون',
                    'فحص وتنظيف شامل للجهاز',
                    'فورمات وبرمجة وسوفتوير'
                  ]).map((serviceName, i) => {
                    const isSelected = ticketSelectedServices.includes(serviceName);
                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => {
                          if (isSelected) {
                            setTicketSelectedServices(ticketSelectedServices.filter(s => s !== serviceName));
                          } else {
                            setTicketSelectedServices([...ticketSelectedServices, serviceName]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all text-[11px] border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '} {serviceName}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Service Input */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={customServiceInput}
                    onChange={(e) => setCustomServiceInput(e.target.value)}
                    placeholder="إضافة خدمة مخصصة أخرى..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customServiceInput.trim() && !ticketSelectedServices.includes(customServiceInput.trim())) {
                        setTicketSelectedServices([...ticketSelectedServices, customServiceInput.trim()]);
                        setCustomServiceInput('');
                      }
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-blue-400 px-3 py-1.5 rounded-xl font-bold"
                  >
                    إضافة
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">حالة الطلب والصيانة</label>
                <select
                  value={ticketStatus}
                  onChange={(e) => setTicketStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-bold"
                >
                  <option value="pending_owner_approval">بانتظار موافقة صاحب المحل</option>
                  <option value="received">تم القبول والاستلام</option>
                  <option value="inspecting">قيد الفحص وتحديد الخدمات والتكلفة</option>
                  <option value="awaiting_approval">بانتظار موافقة العميل على التكلفة</option>
                  <option value="repairing">قيد الإصلاح والتركيب</option>
                  <option value="ready">جاهز للتسليم النهائي</option>
                  <option value="delivered">تم التسليم للزبون بنجاح</option>
                  <option value="rejected">مرفوض من قِبل المالك</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">التكلفة الكلية للخدمات (د.ع)</label>
                  <input
                    type="number"
                    value={ticketCost}
                    onChange={(e) => setTicketCost(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-emerald-400 font-bold"
                    placeholder="مثال: 50000"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">نسبة الإنجاز % ({ticketProgress}%)</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={ticketProgress}
                    onChange={(e) => setTicketProgress(Number(e.target.value))}
                    className="w-full mt-3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">ملاحظات الفني وصاحب المحل للزبون</label>
                <textarea
                  rows={2}
                  value={technicianNote}
                  onChange={(e) => setTechnicianNote(e.target.value)}
                  placeholder="ملاحظات الفحص والقطع المستخدمة..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                ></textarea>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20">
                حفظ الخدمات والتكلفة والحالة
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative text-slate-100">
            <button onClick={() => setShowInvoiceModal(false)} className="absolute top-4 left-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-lg font-black text-white mb-4">إصدار فاتورة جديدة مخصصة</h4>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">اسم الزبون</label>
                <input
                  type="text"
                  required
                  value={invCustomerName}
                  onChange={(e) => setInvCustomerName(e.target.value)}
                  placeholder="أحمد علي"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">وصف المبيعات أو الصيانة</label>
                <input
                  type="text"
                  required
                  value={invItemDesc}
                  onChange={(e) => setInvItemDesc(e.target.value)}
                  placeholder="تبديل شاشة آيفون 15 أصلية"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">المبلغ (د.ع)</label>
                  <input
                    type="number"
                    required
                    value={invItemPrice}
                    onChange={(e) => setInvItemPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">الكمية</label>
                  <input
                    type="number"
                    required
                    value={invItemQty}
                    onChange={(e) => setInvItemQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl mt-4">
                تأكيد وطباعة PDF
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Branch Modal */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 relative text-slate-100">
            <button onClick={() => setShowBranchModal(false)} className="absolute top-4 left-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-lg font-black text-white mb-4">إضافة فرع جديد للمحل</h4>
            <form onSubmit={handleAddBranch} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="اسم الفرع (مثال: فرع المنصور)"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
              />
              <input
                type="text"
                required
                placeholder="العنوان التفصيلي"
                value={branchAddress}
                onChange={(e) => setBranchAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
              />
              <input
                type="text"
                required
                placeholder="رقم هاتف الفرع"
                value={branchPhone}
                onChange={(e) => setBranchPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
              />
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl">
                إضافة الفرع
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 relative text-slate-100">
            <button onClick={() => setShowStaffModal(false)} className="absolute top-4 left-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-lg font-black text-white mb-4">إضافة موظف جديد</h4>
            <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="اسم الموظف الثلاثي"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
              />
              <input
                type="email"
                required
                placeholder="البريد الإلكتروني"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
              />
              <input
                type="text"
                required
                placeholder="رقم الهاتف"
                value={staffPhone}
                onChange={(e) => setStaffPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
              />
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl">
                إضافة الموظف
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative text-slate-100">
            <button onClick={() => setShowOfferModal(false)} className="absolute top-4 left-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-lg font-black text-white mb-4">{editingOfferId ? 'تعديل العرض الترويجي' : 'إضافة عرض ترويجي جديد'}</h4>
            <form onSubmit={handleSaveOffer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">عنوان العرض</label>
                <input
                  type="text"
                  required
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  placeholder="مثال: خصم 20% على تبديل الشاشات"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">وصف العرض</label>
                <textarea
                  required
                  rows={2}
                  value={offerDesc}
                  onChange={(e) => setOfferDesc(e.target.value)}
                  placeholder="شرح شروط الخصم والقطع المشمولة..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">نسبة الخصم (%)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={99}
                    value={offerDiscount}
                    onChange={(e) => setOfferDiscount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">كود الخصم (اختياري)</label>
                  <input
                    type="text"
                    value={offerCode}
                    onChange={(e) => setOfferCode(e.target.value)}
                    placeholder="BARHAM20"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl mt-4 shadow-lg shadow-rose-600/20"
              >
                {editingOfferId ? 'حفظ التعديلات' : 'إضافة العرض الآن'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* Global Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
