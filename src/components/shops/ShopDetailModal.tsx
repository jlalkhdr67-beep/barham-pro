import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  MapPin,
  Share2,
  Heart,
  Star,
  Clock,
  Wrench,
  Store,
  Tag,
  Building,
  Users,
  ShieldCheck,
  Search,
  PlusCircle,
  Plus,
  Trash2,
  Edit2,
  Edit3,
  Save,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Layers,
  ShoppingBag,
  Send,
  Image as ImageIcon,
  Check,
  Info,
  Facebook,
  Instagram,
  Video
} from 'lucide-react';
import { MockDataService } from '../../services/MockDataService';
import { useAuth } from '../../context/AuthContext';
import { Shop, Product, ShopReview, MaintenanceTicket, Branch } from '../../types';
import { formatIQD } from '../../utils/pdfGenerator';
import { ProductDetailModal } from './ProductDetailModal';

interface ShopDetailModalProps {
  shop: Shop | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity?: number) => void;
}

export const ShopDetailModal: React.FC<ShopDetailModalProps> = ({
  shop,
  onClose,
  onAddToCart,
}) => {
  const { userProfile, activeRole } = useAuth();
  const [currentShop, setCurrentShop] = useState<Shop | null>(shop);
  const [activeTab, setActiveTab] = useState<'products' | 'maintenance' | 'branches' | 'reviews' | 'info'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ShopReview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Products filtering & search
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Favorites state
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Maintenance Request Modal State
  const [showMaintenanceModal, setShowMaintenanceModal] = useState<boolean>(false);
  const [mCustomerName, setMCustomerName] = useState<string>(userProfile?.displayName || '');
  const [mCustomerPhone, setMCustomerPhone] = useState<string>(userProfile?.phoneNumber || '');
  const [mDeviceName, setMDeviceName] = useState<string>('');
  const [mDeviceType, setMDeviceType] = useState<string>('هاتف أيفون');
  const [mIssueDesc, MIssueDescSet] = useState<string>('');
  const [mBranchId, setMBranchId] = useState<string>('');
  const [mImageUrl, setMImageUrl] = useState<string>('');
  const [mSuccessTicket, setMSuccessTicket] = useState<string>('');

  useEffect(() => {
    if (userProfile?.displayName && !mCustomerName) {
      setMCustomerName(userProfile.displayName);
    }
    if (userProfile?.phoneNumber && !mCustomerPhone) {
      setMCustomerPhone(userProfile.phoneNumber);
    }
  }, [userProfile]);

  // New Review Form State
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false);

  // Editable Branches & Services State
  const [branchesList, setBranchesList] = useState<Branch[]>([]);
  const [servicesList, setServicesList] = useState<string[]>([]);

  // Edit Shop Info Modal State
  const [showEditShopModal, setShowEditShopModal] = useState<boolean>(false);
  const [editShopName, setEditShopName] = useState<string>('');
  const [editShopDesc, setEditShopDesc] = useState<string>('');
  const [editShopPhone, setEditShopPhone] = useState<string>('');
  const [editShopWhatsapp, setEditShopWhatsapp] = useState<string>('');
  const [editShopWorkingHours, setEditShopWorkingHours] = useState<string>('');
  const [editShopExpYears, setEditShopExpYears] = useState<number>(8);
  const [editShopEmpCount, setEditShopEmpCount] = useState<number>(6);
  const [editShopCity, setEditShopCity] = useState<string>('');
  const [editShopAddress, setEditShopAddress] = useState<string>('');
  const [editFacebook, setEditFacebook] = useState<string>('');
  const [editInstagram, setEditInstagram] = useState<string>('');

  // Maintenance Service Modal State
  const [showServiceModal, setShowServiceModal] = useState<boolean>(false);
  const [editingServiceIdx, setEditingServiceIdx] = useState<number | null>(null);
  const [serviceText, setServiceText] = useState<string>('');

  // Branch Add Modal State
  const [showAddBranchModal, setShowAddBranchModal] = useState<boolean>(false);
  const [branchName, setBranchName] = useState<string>('');
  const [branchCity, setBranchCity] = useState<string>('');
  const [branchAddress, setBranchAddress] = useState<string>('');
  const [branchPhone, setBranchPhone] = useState<string>('');
  const [branchWorkingHours, setBranchWorkingHours] = useState<string>('');

  useEffect(() => {
    if (shop) {
      setCurrentShop(shop);
      fetchShopData();
      
      // Init branches
      const initBranches = shop.branches && shop.branches.length > 0 ? shop.branches : [
        {
          id: 'br_1',
          shopId: shop.id,
          name: 'الفرع الرئيسي - شارع الصناعة',
          city: shop.city || 'بغداد',
          address: `${shop.city} - شارع الصناعة الإلكتروني مقابل المجمع التجاري`,
          phone: shop.phone,
          workingHours: shop.workingHours || '10:00 ص - 10:00 م',
          status: 'approved' as const,
        },
        {
          id: 'br_2',
          shopId: shop.id,
          name: 'فرع الكرادة - مجمع الهواتف',
          city: shop.city || 'بغداد',
          address: `${shop.city} - الكرادة خارج قرب ساحة الحرية`,
          phone: shop.whatsapp || shop.phone,
          workingHours: '10:00 ص - 11:00 م',
          status: 'approved' as const,
        },
      ];
      setBranchesList(initBranches);

      // Init services
      const initServices = shop.services || [
        'تبديل شاشات أصلية (OLED / LCD)',
        'تبديل بطاريات مع ضمان 6 أشهر',
        'صيانة الآيسيات والدوارس المعقدة',
        'فحص السوائل والأعطال المائية',
        'تحديث وبرمجة أنظمة iOS و Android',
        'بيع الملحقات والأجهزة المجددة المعلمة'
      ];
      setServicesList(initServices);

      // Init shop info form fields
      setEditShopName(shop.name);
      setEditShopDesc(shop.description);
      setEditShopPhone(shop.phone);
      setEditShopWhatsapp(shop.whatsapp || shop.phone);
      setEditShopWorkingHours(shop.workingHours);
      setEditShopExpYears(shop.experienceYears || 8);
      setEditShopEmpCount(shop.employeesCount || 6);
      setEditShopCity(shop.city);
      setEditShopAddress(shop.address);
      setEditFacebook(shop.socialLinks?.facebook || '');
      setEditInstagram(shop.socialLinks?.instagram || '');
    }
  }, [shop]);

  const fetchShopData = async () => {
    if (!shop) return;
    setLoading(true);
    try {
      const fetchedProds = MockDataService.getProductsByShop(shop.id);
      setProducts(fetchedProds);

      const fetchedRevs = MockDataService.getReviews().filter((r) => r.shopId === shop.id);
      setReviews(fetchedRevs);
    } catch (err) {
      console.error('Error loading shop details:', err);
      setProducts([]);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  if (!shop || !currentShop) return null;

  const categories = ['الكل', 'هواتف', 'شاشات', 'بطاريات', 'شواحن', 'إكسسوارات', 'قطع غيار'];

  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === 'الكل' || p.category.includes(selectedCategory);
    const matchSearch = p.name.includes(searchQuery) || p.description.includes(searchQuery);
    return matchCategory && matchSearch;
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    showToast(!isFavorite ? 'تم إضافة المحل إلى قائمة المفضلة' : 'تم إزالة المحل من المفضلة');
  };

  const handleShareShop = () => {
    if (navigator.share) {
      navigator.share({
        title: currentShop.name,
        text: `${currentShop.name} - ${currentShop.description}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('تم نسخ رابط المحل بنجاح');
    }
  };

  // Product Deletion
  const handleDeleteProduct = (productId: string, productName: string) => {
    MockDataService.deleteProduct(productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    showToast(`تم حذف المنتج "${productName}" بنجاح`);
  };

  // Maintenance Services CRUD
  const handleOpenAddServiceModal = () => {
    setEditingServiceIdx(null);
    setServiceText('');
    setShowServiceModal(true);
  };

  const handleOpenEditServiceModal = (idx: number, text: string) => {
    setEditingServiceIdx(idx);
    setServiceText(text);
    setShowServiceModal(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceText.trim()) return;
    if (editingServiceIdx !== null) {
      const updated = [...servicesList];
      updated[editingServiceIdx] = serviceText.trim();
      setServicesList(updated);
      showToast('تم تعديل خدمة الصيانة بنجاح ⚡');
    } else {
      setServicesList((prev) => [...prev, serviceText.trim()]);
      showToast('تم إضافة خدمة الصيانة الجديدة ⚡');
    }
    setShowServiceModal(false);
    setServiceText('');
    setEditingServiceIdx(null);
  };

  const handleDeleteService = (index: number) => {
    setServicesList((prev) => prev.filter((_, i) => i !== index));
    showToast('تم حذف خدمة الصيانة بنجاح');
  };

  // Branch CRUD & Approval Workflow
  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) return;
    const newBranch: Branch = {
      id: `br_${Date.now()}`,
      shopId: currentShop.id,
      name: branchName.trim(),
      city: branchCity.trim() || currentShop.city,
      address: branchAddress.trim(),
      phone: branchPhone.trim() || currentShop.phone,
      workingHours: branchWorkingHours.trim() || '10:00 ص - 10:00 م',
      status: 'pending_approval', // بانتظار موافقة المالك
    };
    setBranchesList((prev) => [...prev, newBranch]);
    setShowAddBranchModal(false);
    setBranchName('');
    setBranchCity('');
    setBranchAddress('');
    setBranchPhone('');
    setBranchWorkingHours('');
    showToast('تم إضافة الفرع وهو بانتظار موافقة المالك ⏳');
  };

  const handleApproveBranch = (branchId: string) => {
    setBranchesList((prev) =>
      prev.map((b) => (b.id === branchId ? { ...b, status: 'approved' } : b))
    );
    showToast('تمت موافقة المالك واعتماد الفرع بنجاح! ✅');
  };

  const handleDeleteBranch = (branchId: string) => {
    setBranchesList((prev) => prev.filter((b) => b.id !== branchId));
    showToast('تم حذف الفرع بنجاح');
  };

  // Save Shop Info Changes
  const handleSaveShopInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedShopData: Partial<Shop> = {
      name: editShopName,
      description: editShopDesc,
      phone: editShopPhone,
      whatsapp: editShopWhatsapp,
      workingHours: editShopWorkingHours,
      experienceYears: editShopExpYears,
      employeesCount: editShopEmpCount,
      city: editShopCity,
      address: editShopAddress,
      socialLinks: {
        facebook: editFacebook,
        instagram: editInstagram,
      },
    };
    const newObj = { ...currentShop, ...updatedShopData };
    setCurrentShop(newObj);
    MockDataService.updateShop(currentShop.id, updatedShopData);
    setShowEditShopModal(false);
    showToast('تم تحديث معلومات المحل بنجاح ⚡');
  };

  const handleCreateMaintenanceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ticketNum = `BRH-${Math.floor(1000 + Math.random() * 9000)}`;
      const finalCustomerName = mCustomerName.trim() || userProfile?.displayName || userProfile?.email || 'زبون التطبيق';
      const finalCustomerPhone = mCustomerPhone.trim() || userProfile?.phoneNumber || 'غير محدد';

      // Update userProfile if logged in and name/phone was updated
      if (userProfile?.uid && (mCustomerName.trim() !== userProfile.displayName || mCustomerPhone.trim() !== userProfile.phoneNumber)) {
        MockDataService.updateUser(userProfile.uid, {
          displayName: finalCustomerName,
          phoneNumber: finalCustomerPhone,
        });
      }

      const newTicket: MaintenanceTicket = {
        id: `ticket_${Date.now()}`,
        ticketNumber: ticketNum,
        customerId: userProfile?.uid || `guest_${Date.now()}`,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        shopId: currentShop.id,
        shopName: currentShop.name,
        deviceType: `${mDeviceType} - ${mDeviceName}`,
        issueDescription: mIssueDesc,
        status: 'pending_owner_approval',
        progressPercent: 0,
        estimatedCostIQD: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stages: [
          { status: 'pending_owner_approval', title: 'تم إرسال الطلب - بانتظار موافقة المالك', date: 'الآن', completed: true },
          { status: 'received', title: 'موافقة صاحب المحل واستلام الجهاز', date: '-', completed: false },
          { status: 'inspecting', title: 'قيد الفحص وتحديد الخدمات والتكلفة', date: '-', completed: false },
          { status: 'repairing', title: 'قيد الصيانة والتركيب', date: '-', completed: false },
          { status: 'ready', title: 'جاهز للتسليم', date: '-', completed: false },
          { status: 'delivered', title: 'تم التسليم النهائي', date: '-', completed: false },
        ],
      };

      MockDataService.addTicket(newTicket);
      setMSuccessTicket(ticketNum);
      showToast(`تم إرسال الطلب بنجاح برقم: ${ticketNum} (بانتظار موافقة المالك)`);
      setTimeout(() => {
        setShowMaintenanceModal(false);
        setMSuccessTicket('');
        setMDeviceName('');
        MIssueDescSet('');
      }, 3000);
    } catch (err) {
      console.error('Error creating maintenance request:', err);
      showToast('حدث خطأ أثناء حفظ الطلب، يرجى المحاولة لاحقاً');
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setReviewSubmitting(true);
    try {
      const reviewObj: ShopReview = {
        id: `rev_${Date.now()}`,
        shopId: currentShop.id,
        userId: 'user_demo_77',
        userName: 'مصطفى الكرخي',
        userPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
        rating: newRating,
        comment: newComment,
        createdAt: new Date().toISOString(),
      };

      MockDataService.addReview(reviewObj);
      setReviews((prev) => [reviewObj, ...prev]);
      setNewComment('');
      showToast('تمت إضافة تقييمك بنجاح! شكراً لمشاركتك.');
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl text-slate-100 relative my-4 sm:my-8 max-h-[92vh] flex flex-col">
        
        {/* Toast Floating Notification */}
        {toastMessage && (
          <div className="absolute top-4 right-1/2 translate-x-1/2 z-30 bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-2xl border border-blue-400 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-20 bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white p-2.5 rounded-2xl backdrop-blur-md border border-slate-800 transition-all shadow-lg"
          title="إغلاق الصفحة"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* HEADER COVER & SHOP IDENTITY */}
          <div className="relative bg-slate-950">
            {/* Cover Image */}
            <div className="h-48 sm:h-64 w-full relative bg-slate-900 overflow-hidden">
              <img
                src={shop.coverImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&q=80'}
                alt={shop.name}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
            </div>

            {/* Shop Info Header Content */}
            <div className="px-6 sm:px-8 -mt-16 sm:-mt-20 relative z-10 pb-6 border-b border-slate-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                
                {/* Logo & Main Details */}
                <div className="flex items-end gap-4">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 border-slate-900 bg-slate-950 shadow-2xl overflow-hidden shrink-0 relative">
                    <img
                      src={shop.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&q=80'}
                      alt={shop.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1 pb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">{shop.name}</h1>
                      {currentShop.status === 'suspended' ? (
                        <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold px-3 py-0.5 rounded-full inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                          <span>معلق من الإدارة 🛑</span>
                        </span>
                      ) : (
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-0.5 rounded-full inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>مفتوح الآن</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-300">
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-4 h-4 fill-amber-400" />
                        {shop.rating ? shop.rating.toFixed(1) : '0.0'} ({shop.reviewsCount || 0} تقييم)
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        {shop.city} - {shop.address}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Contact & Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {activeRole === 'owner' && (
                    <button
                      onClick={() => setShowEditShopModal(true)}
                      className="flex-1 sm:flex-initial bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
                      title="تعديل معلومات المحل"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>تعديل المحل</span>
                    </button>
                  )}

                  <a
                    href={`tel:${currentShop.phone}`}
                    className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                  >
                    <Phone className="w-4 h-4" />
                    <span>اتصال</span>
                  </a>

                  <a
                    href={`https://wa.me/${currentShop.whatsapp || currentShop.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>واتساب</span>
                  </a>

                  <button
                    onClick={handleShareShop}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700"
                    title="مشاركة المحل"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleToggleFavorite}
                    className={`p-2.5 rounded-xl transition-all border ${
                      isFavorite
                        ? 'bg-red-500/20 border-red-500/40 text-red-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                    title="إضافة للمفضلة"
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-400' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Bio & Extended Meta Bar */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-300 space-y-2">
                <p className="leading-relaxed text-slate-300">{currentShop.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    أوقات العمل: {currentShop.workingHours || '9:00 ص - 10:00 م'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    انضم للمنصة: مارس 2024
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-blue-400 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    محل معتمد وموثق في العراق
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* STATS CARDS BAR */}
          <div className="px-6 sm:px-8 py-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-slate-800 bg-slate-950/50">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-black text-white">{products.length}</div>
                <div className="text-[11px] text-slate-400">المنتجات بالمتجر</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-black text-white">{branchesList.length}</div>
                <div className="text-[11px] text-slate-400">الفروع المتاحة</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-black text-white">{servicesList.length}</div>
                <div className="text-[11px] text-slate-400">خدمات الصيانة</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-black text-white">{reviews.length}+</div>
                <div className="text-[11px] text-slate-400">تقييمات العملاء</div>
              </div>
            </div>
          </div>

          {/* MATERIAL 3 TAB NAVIGATION */}
          <div className="px-6 sm:px-8 pt-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-20">
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-3">
              {[
                { id: 'products', label: 'المتجر والمنتجات', icon: <ShoppingBag className="w-4 h-4" /> },
                { id: 'maintenance', label: 'خدمات الصيانة', icon: <Wrench className="w-4 h-4" /> },
                { id: 'branches', label: 'الفروع والعناوين', icon: <Building className="w-4 h-4" /> },
                { id: 'reviews', label: `التقييمات (${reviews.length})`, icon: <Star className="w-4 h-4" /> },
                { id: 'info', label: 'معلومات المحل', icon: <Info className="w-4 h-4" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* TAB CONTENT AREA */}
          <div className="p-6 sm:p-8">
            
            {/* TAB 1: PRODUCTS STORE */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                {/* Search & Category Filter */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ابحث في منتجات هذا المحل..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Categories Pills */}
                  <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                          selectedCategory === cat
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products Grid */}
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12 bg-slate-950 rounded-2xl border border-slate-800">
                    <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h4 className="text-base font-bold text-white mb-1">لا توجد منتجات تطابق البحث</h4>
                    <p className="text-xs text-slate-400">جرب البحث بكلمة أخرى أو تغيير التصنيف المحدد.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between transition-all group shadow-xl"
                      >
                        <div>
                          <div className="h-44 bg-slate-900 rounded-xl overflow-hidden mb-3 relative flex items-center justify-center p-2">
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                            />
                            <span className="absolute top-2 right-2 bg-blue-600/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {product.category}
                            </span>
                          </div>

                          <h4 className="font-bold text-sm text-white line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors">
                            {product.name}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                            {product.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-800/80">
                          <div className="flex items-baseline justify-between mb-3">
                            <span className="text-lg font-black text-emerald-400 font-mono">
                              {formatIQD(product.priceIQD)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {product.quantity > 0 ? `الكمية: ${product.quantity}` : 'غير متوفر'}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedProduct(product)}
                              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 rounded-xl text-xs transition-all border border-slate-700 flex items-center justify-center gap-2"
                            >
                              <Info className="w-3.5 h-3.5 text-blue-400" />
                              <span>عرض التفاصيل</span>
                            </button>
                            {activeRole === 'owner' && (
                              <button
                                onClick={() => handleDeleteProduct(product.id, product.name)}
                                className="p-2 bg-slate-900 hover:bg-red-500/20 text-red-400 border border-slate-800 hover:border-red-500/40 rounded-xl transition-all"
                                title="حذف المنتج من المحل (أصحاب المحلات فقط)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MAINTENANCE SERVICES */}
            {activeTab === 'maintenance' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 p-6 rounded-2xl border border-blue-500/30">
                  <div>
                    <h3 className="text-xl font-black text-white mb-1">مركز الصيانة والدعم الفني المعتمد</h3>
                    <p className="text-xs text-slate-300">قدم طلب صيانة للحصول على تذكرة فحص وضمان معتمد على جميع قطع الغيار.</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {activeRole === 'owner' && (
                      <button
                        onClick={handleOpenAddServiceModal}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-4 py-3 rounded-xl text-xs transition-all flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4 text-emerald-400" />
                        <span>إضافة خدمة</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowMaintenanceModal(true)}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 rounded-xl text-xs transition-all flex items-center gap-2 shadow-xl shadow-blue-600/30"
                    >
                      <PlusCircle className="w-5 h-5" />
                      <span>تقديم طلب صيانة</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white">الخدمات والأعطال التي نصلحها:</h4>
                  <span className="text-xs text-slate-400">{servicesList.length} خدمة مسجلة</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {servicesList.map((srv, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                          <Wrench className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white">{srv}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">ضمان حقيقي وفحص كمبيوتري دقيق</div>
                        </div>
                      </div>

                      {/* Edit & Delete Service Buttons (Shop Owners Only) */}
                      {activeRole === 'owner' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditServiceModal(idx, srv)}
                            className="p-2 bg-slate-900 hover:bg-blue-500/20 text-blue-400 border border-slate-800 hover:border-blue-500/40 rounded-xl transition-all"
                            title="تعديل الخدمة"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(idx)}
                            className="p-2 bg-slate-900 hover:bg-red-500/20 text-red-400 border border-slate-800 hover:border-red-500/40 rounded-xl transition-all"
                            title="حذف الخدمة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: BRANCHES */}
            {activeTab === 'branches' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-white">فروع {currentShop.name}</h3>
                    <p className="text-xs text-slate-400">إضافة الفروع تتطلب موافقة المالك لتفعيل الفروع رسميًا.</p>
                  </div>
                  <button
                    onClick={() => setShowAddBranchModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-blue-600/25 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة فرع جديد</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {branchesList.map((b) => (
                    <div key={b.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building className="w-5 h-5 text-blue-400" />
                          <h4 className="font-bold text-base text-white">{b.name}</h4>
                        </div>

                        {/* Status Badge */}
                        {b.status === 'pending_approval' ? (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                            ⏳ بانتظار موافقة المالك
                          </span>
                        ) : (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                            ✅ فرع معتمد ومفعل
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        <span>{b.address}</span>
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>ساعات العمل: {b.workingHours || currentShop.workingHours}</span>
                      </p>

                      <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                        {/* Owner Approval Button */}
                        {b.status === 'pending_approval' && (
                          <button
                            onClick={() => handleApproveBranch(b.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all flex items-center gap-1"
                            title="الموافقة على الفرع وتأكيده"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>موافقة المالك</span>
                          </button>
                        )}

                        <a
                          href={`tel:${b.phone}`}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 text-center rounded-xl text-xs transition-all"
                        >
                          اتصال بالفرع
                        </a>
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(b.address)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 text-center rounded-xl text-xs transition-all"
                        >
                          الموقع على الخريطة
                        </a>

                        <button
                          onClick={() => handleDeleteBranch(b.id)}
                          className="p-2 bg-slate-900 hover:bg-red-500/20 text-red-400 border border-slate-800 rounded-xl transition-all"
                          title="حذف الفرع"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: REVIEWS */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Submit New Review Form */}
                <form onSubmit={handleAddReview} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h4 className="font-bold text-sm text-white">إضافة تقييم ورأي عن المحل</h4>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">اختر التقييم بالنجوم:</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= newRating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <textarea
                      required
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="اكتب تجربتك مع صيانة أو خدمات هذا المحل..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>نشر التقييم</span>
                  </button>
                </form>

                {/* Reviews List */}
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={rev.userPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'}
                            alt={rev.userName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-bold text-xs text-white">{rev.userName}</div>
                            <div className="text-[10px] text-slate-500">
                              {new Date(rev.createdAt).toLocaleDateString('ar-IQ')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed pt-1">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: SHOP INFO & EDIT */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-white">نبذة تفصيلية عن المحل</h3>
                    {activeRole === 'owner' && (
                      <button
                        onClick={() => setShowEditShopModal(true)}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 shadow-md shadow-amber-600/20"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>تعديل معلومات المحل</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{currentShop.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                    <div>
                      <span className="text-xs text-slate-400 block">سنوات الخبرة:</span>
                      <span className="text-base font-bold text-white">{currentShop.experienceYears || editShopExpYears} سنوات في صيانة البرمجيات والعتاد</span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-400 block">عدد الكادر والمهندسين:</span>
                      <span className="text-base font-bold text-white">{currentShop.employeesCount || editShopEmpCount} مهندس وفني متخصص</span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-400 block">أوقات العمل اليومية:</span>
                      <span className="text-base font-bold text-white">{currentShop.workingHours || '10:00 ص - 10:00 م'}</span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-400 block">رقم الهاتف / الواتساب:</span>
                      <span className="text-base font-bold text-emerald-400 dir-ltr font-mono">{currentShop.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-3">
                  <h4 className="font-bold text-sm text-white">وسائل التواصل الاجتماعي</h4>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={editFacebook || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2"
                    >
                      <Facebook className="w-4 h-4 text-blue-500" />
                      <span>فيسبوك الرسمية</span>
                    </a>
                    <a
                      href={editInstagram || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2"
                    >
                      <Instagram className="w-4 h-4 text-pink-500" />
                      <span>انستغرام</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: EDIT SHOP INFO */}
      {showEditShopModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 relative shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowEditShopModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white mb-1">تعديل معلومات المحل</h3>
            <p className="text-xs text-slate-400 mb-6">قم بتحديث اسم المحل والوصف ووسائل التواصل وأوقات العمل.</p>

            <form onSubmit={handleSaveShopInfo} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم المحل</label>
                <input
                  type="text"
                  required
                  value={editShopName}
                  onChange={(e) => setEditShopName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">وصف المحل والخدمات</label>
                <textarea
                  required
                  rows={3}
                  value={editShopDesc}
                  onChange={(e) => setEditShopDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم الهاتف الرئيسي</label>
                  <input
                    type="text"
                    required
                    value={editShopPhone}
                    onChange={(e) => setEditShopPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم الواتساب</label>
                  <input
                    type="text"
                    value={editShopWhatsapp}
                    onChange={(e) => setEditShopWhatsapp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">المدينة</label>
                  <input
                    type="text"
                    value={editShopCity}
                    onChange={(e) => setEditShopCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">العنوان التفصيلي</label>
                  <input
                    type="text"
                    value={editShopAddress}
                    onChange={(e) => setEditShopAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">أوقات العمل</label>
                  <input
                    type="text"
                    value={editShopWorkingHours}
                    onChange={(e) => setEditShopWorkingHours(e.target.value)}
                    placeholder="10:00 ص - 10:00 م"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">سنوات الخبرة</label>
                  <input
                    type="number"
                    value={editShopExpYears}
                    onChange={(e) => setEditShopExpYears(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">روابط التواصل الاجتماعي (أصحاب المحلات فقط)</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="رابط فيسبوك"
                    value={editFacebook}
                    onChange={(e) => setEditFacebook(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 text-xs focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="رابط انستغرام"
                    value={editInstagram}
                    onChange={(e) => setEditInstagram(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-amber-600/25 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>حفظ وتحديث معلومات المحل</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT MAINTENANCE SERVICE */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 relative shadow-2xl text-slate-100">
            <button
              onClick={() => setShowServiceModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white mb-1">
              {editingServiceIdx !== null ? 'تعديل خدمة صيانة' : 'إضافة خدمة صيانة جديدة'}
            </h3>
            <p className="text-xs text-slate-400 mb-6">أدخل اسم وتفاصيل الخدمة أو نوع العطل الذي يقدمه المحل.</p>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم الخدمة / العطل</label>
                <input
                  type="text"
                  required
                  value={serviceText}
                  onChange={(e) => setServiceText(e.target.value)}
                  placeholder="مثال: تبديل شاشات أصلية مع ضمان سنة"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>حفظ الخدمة</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD BRANCH WITH OWNER APPROVAL */}
      {showAddBranchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 relative shadow-2xl text-slate-100">
            <button
              onClick={() => setShowAddBranchModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white mb-1">إضافة فرع جديد للمحل</h3>
            <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl mb-4">
              ملاحظة: إضافة الفرع الجديد تتطلب موافقة وتأكيد مالك النظام/المحل ليصبح مفككاً ومفعلاً رسمياً.
            </p>

            <form onSubmit={handleAddBranch} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم الفرع</label>
                <input
                  type="text"
                  required
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="مثال: فرع الكرادة - قرب ساحة الحرية"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">المدينة</label>
                  <input
                    type="text"
                    value={branchCity}
                    onChange={(e) => setBranchCity(e.target.value)}
                    placeholder="مثال: بغداد"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم هاتف الفرع</label>
                  <input
                    type="text"
                    value={branchPhone}
                    onChange={(e) => setBranchPhone(e.target.value)}
                    placeholder="07700000000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">العنوان التفصيلي</label>
                <input
                  type="text"
                  required
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  placeholder="مثال: حي الجامعة - الشارع العام مقابل المجمع"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">أوقات العمل في الفرع</label>
                <input
                  type="text"
                  value={branchWorkingHours}
                  onChange={(e) => setBranchWorkingHours(e.target.value)}
                  placeholder="10:00 ص - 10:00 م"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>إرسال طلب إضافة الفرع (بانتظار موافقة المالك)</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MAINTENANCE REQUEST MODAL */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 relative shadow-2xl text-slate-100">
            <button
              onClick={() => setShowMaintenanceModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white mb-1">تقديم طلب صيانة إلى {shop.name}</h3>
            <p className="text-xs text-slate-400 mb-6">أدخل تفاصيل جهازك والعطل للحصول على تذكرة فحص مباشرة.</p>

            {mSuccessTicket && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                تم تقديم طلبك بنجاح! رقم التذكرة: {mSuccessTicket}
              </div>
            )}

            <form onSubmit={handleCreateMaintenanceRequest} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">اسم الزبون الكامل</label>
                  <input
                    type="text"
                    required
                    value={mCustomerName}
                    onChange={(e) => setMCustomerName(e.target.value)}
                    placeholder="أدخل اسمك الثلاثي"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم الهاتف للتواصل</label>
                  <input
                    type="text"
                    required
                    value={mCustomerPhone}
                    onChange={(e) => setMCustomerPhone(e.target.value)}
                    placeholder="07700000000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم العطل / موديل الجهاز</label>
                <input
                  type="text"
                  required
                  value={mDeviceName}
                  onChange={(e) => setMDeviceName(e.target.value)}
                  placeholder="مثال: iPhone 15 Pro Max أو Galaxy S23 Ultra"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">نوع الجهاز</label>
                <select
                  value={mDeviceType}
                  onChange={(e) => setMDeviceType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none"
                >
                  <option value="هاتف أيفون">هاتف أيفون (iPhone)</option>
                  <option value="هاتف سامسونج">هاتف سامسونج (Samsung)</option>
                  <option value="جهاز أيباد / تابلت">جهاز أيباد / تابلت</option>
                  <option value="جهاز لابتوب">جهاز لابتوب</option>
                  <option value="أجهزة إلكترونية أخرى">أجهزة إلكترونية أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">وصف العطل بالتفصيل</label>
                <textarea
                  required
                  rows={3}
                  value={mIssueDesc}
                  onChange={(e) => MIssueDescSet(e.target.value)}
                  placeholder="مثال: الشاشة تتوقف عن الاستجابة، أو الجهاز يفرغ شحنه بسرعة..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/25"
              >
                تأكيد وإرسال طلب الصيانة
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL MODAL */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          shopPhone={shop.phone}
          shopName={shop.name}
          hideAddToCart={false}
          userProfile={userProfile}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(p, q) => onAddToCart(p, q)}
        />
      )}
    </div>
  );
};

// Initial Data Helpers (returns empty for new shops)
function getInitialProductsForShop(_shop: Shop): Product[] {
  return [];
}

function getInitialReviewsForShop(_shopId: string): ShopReview[] {
  return [];
}
