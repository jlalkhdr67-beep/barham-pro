import React, { useState, useEffect, useMemo } from 'react';
import {
  Smartphone,
  Wrench,
  Store,
  Receipt,
  ShieldCheck,
  Tag,
  Heart,
  Search,
  MapPin,
  Star,
  Clock,
  Phone,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  X,
  Camera,
  Upload,
  Image as ImageIcon,
  ShoppingBag
} from 'lucide-react';
import { MockDataService } from '../../services/MockDataService';
import { Shop, Product, MaintenanceTicket, Invoice, Warranty, Offer } from '../../types';
import { formatIQD } from '../../utils/pdfGenerator';
import { printInvoicePDF } from '../../utils/pdfGenerator';
import { generateBarcodeDataUrl, generateQRCodeDataUrl } from '../../utils/barcodeUtils';

interface CustomerDashboardProps {
  onSelectShop: (shop: Shop) => void;
  onAddToCart: (product: Product) => void;
  searchQuery: string;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  onSelectShop,
  onAddToCart,
  searchQuery,
  activeTab: externalActiveTab,
  setActiveTab: externalSetActiveTab,
}) => {
  const [localActiveTab, setLocalActiveTab] = useState<'home' | 'marketplace' | 'maintenance' | 'invoices' | 'warranties' | 'offers' | 'favorites'>('home');

  const activeTab = useMemo(() => {
    if (!externalActiveTab) return localActiveTab;
    if (externalActiveTab === 'shops') return 'home';
    if (['home', 'marketplace', 'maintenance', 'invoices', 'warranties', 'offers', 'favorites'].includes(externalActiveTab)) {
      return externalActiveTab as any;
    }
    return 'home';
  }, [externalActiveTab, localActiveTab]);

  const handleTabChange = (tab: string) => {
    setLocalActiveTab(tab as any);
    if (externalSetActiveTab) {
      externalSetActiveTab(tab);
    }
  };

  useEffect(() => {
    if (externalActiveTab === 'shops') {
      const el = document.getElementById('shops-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (externalActiveTab === 'marketplace') {
      const el = document.getElementById('products-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [externalActiveTab]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Maintenance Ticket Form Modal State
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [deviceColor, setDeviceColor] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [deviceImage, setDeviceImage] = useState('');
  const [ticketSuccessMsg, setTicketSuccessMsg] = useState('');

  // Ticket Tracking Search State
  const [trackTicketNumber, setTrackTicketNumber] = useState('');
  const [foundTicket, setFoundTicket] = useState<MaintenanceTicket | null>(null);

  // Marketplace shop selection states
  const [selectedMarketShop, setSelectedMarketShop] = useState<Shop | null>(null);
  const [marketSearch, setMarketSearch] = useState<string>('');
  const [selectedMarketCategory, setSelectedMarketCategory] = useState<string>('الكل');
  const [marketProductSearch, setMarketProductSearch] = useState<string>('');

  // Barcode / QR Preview Modal
  const [qrModalData, setQrModalData] = useState<{ title: string; qrUrl: string; barcodeUrl: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      setShops(MockDataService.getShops());
      setProducts(MockDataService.getProducts());
      setMaintenanceTickets(MockDataService.getTickets());
      setInvoices(MockDataService.getInvoices());
      setWarranties(MockDataService.getWarranties());
      setOffers(MockDataService.getOffers());
    } catch (err) {
      console.error('Error loading local customer data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDeviceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateMaintenanceTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedShop = shops.find((s) => s.id === selectedShopId) || shops[0];
      const newTicketNumber = `BRH-${Math.floor(1000 + Math.random() * 9000)}`;

      const newTicket: MaintenanceTicket = {
        id: `ticket_${Date.now()}`,
        ticketNumber: newTicketNumber,
        customerId: 'customer_demo_1',
        customerName: 'أحمد علي العراقي',
        customerPhone: '07712345678',
        shopId: selectedShop.id,
        shopName: selectedShop.name,
        deviceType,
        deviceColor,
        serialNumber,
        issueDescription,
        deviceImage: deviceImage || undefined,
        status: 'pending_owner_approval',
        progressPercent: 0,
        estimatedCostIQD: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stages: [
          { status: 'pending_owner_approval', title: 'تم إرسال الطلب - بانتظار موافقة صاحب المحل', date: 'الآن', completed: true },
          { status: 'received', title: 'تمت موافقة المالك واستلام الطلب', date: '-', completed: false },
          { status: 'inspecting', title: 'قيد الفحص وتحديد الخدمات والتكلفة', date: '-', completed: false },
          { status: 'repairing', title: 'قيد الإصلاح وتبديل القطع', date: '-', completed: false },
          { status: 'ready', title: 'جاهز للتسليم', date: '-', completed: false },
          { status: 'delivered', title: 'تم التسليم بنجاح', date: '-', completed: false },
        ],
      };

      MockDataService.addTicket(newTicket);
      setMaintenanceTickets(MockDataService.getTickets());
      setTicketSuccessMsg(`تم تقديم طلب الصيانة بنجاح! رقم التذكرة الخـاص بك هو: ${newTicketNumber}`);
      setTimeout(() => {
        setShowNewTicketModal(false);
        setTicketSuccessMsg('');
        setDeviceType('');
        setDeviceColor('');
        setSerialNumber('');
        setIssueDescription('');
        setDeviceImage('');
      }, 2500);
    } catch (err) {
      console.error('Error creating maintenance ticket:', err);
    }
  };

  const handleSearchTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackTicketNumber.trim()) return;
    const match = maintenanceTickets.find(
      (t) => t.ticketNumber.toLowerCase() === trackTicketNumber.trim().toLowerCase()
    );
    setFoundTicket(match || null);
  };

  const handleShowCodeModal = async (title: string, code: string) => {
    const barcodeUrl = generateBarcodeDataUrl(code);
    const qrUrl = await generateQRCodeDataUrl(code);
    setQrModalData({ title, barcodeUrl, qrUrl });
  };

  const filteredShops = shops.filter(
    (s) =>
      s.name.includes(searchQuery) ||
      s.city.includes(searchQuery) ||
      s.description.includes(searchQuery)
  );

  const filteredProducts = products.filter(
    (p) =>
      p.name.includes(searchQuery) ||
      p.category.includes(searchQuery) ||
      p.shopName?.includes(searchQuery)
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Banner Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 p-8 md:p-12 shadow-2xl">
        <div className="absolute -left-10 -top-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-4">
            <Wrench className="w-4 h-4" />
            <span>نظام الصيانة والمتجر الإلكتروني رقم #1 في العراق</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight mb-4">
            إدارة صيانة أجهزتك الإلكترونية بضمان حقيقي وفواتير معتمدة
          </h1>
          <p className="text-slate-300 text-sm md:text-base mb-8 leading-relaxed">
            ابحث عن أقرب المحلات المعتمدة، تتبع حالة إصلاح هاتفك خطوة بخطوة، واشترِ قطع الغيار والإكسسوارات الأصلية بالدينار العراقي مع نظام Barham Pro الشامل.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setShowNewTicketModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl shadow-blue-600/30 transition-all text-sm flex items-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              <span>طلب صيانة جهاز جديد</span>
            </button>
            <button
              onClick={() => handleTabChange('maintenance')}
              className="bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold px-6 py-3.5 rounded-2xl transition-all text-sm flex items-center gap-2"
            >
              <Search className="w-5 h-5 text-blue-400" />
              <span>تتبع حالة الصيانة برقم التذكرة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => handleTabChange('maintenance')}
          className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 cursor-pointer rounded-2xl p-4 flex items-center gap-4 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{maintenanceTickets.length}</div>
            <div className="text-xs text-slate-400 font-medium">طلبات الصيانة الخاصة بي</div>
          </div>
        </div>

        <div
          onClick={() => handleTabChange('maintenance')}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 cursor-pointer rounded-2xl p-4 flex items-center gap-4 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{maintenanceTickets.length}</div>
            <div className="text-xs text-slate-400 font-medium">أجهزتي المسجلة</div>
          </div>
        </div>

        <div
          onClick={() => handleTabChange('warranties')}
          className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 cursor-pointer rounded-2xl p-4 flex items-center gap-4 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{warranties.length}</div>
            <div className="text-xs text-slate-400 font-medium">الضمانات الفعالة</div>
          </div>
        </div>

        <div
          onClick={() => handleTabChange('invoices')}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 cursor-pointer rounded-2xl p-4 flex items-center gap-4 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{invoices.length}</div>
            <div className="text-xs text-slate-400 font-medium">الفواتير الإلكترونية</div>
          </div>
        </div>
      </div>

      {/* Service Cards Grid / Navigation Tabs */}
      <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-none border-b border-slate-800">
        {[
          { id: 'home', label: 'المحلات المعتمدة', icon: <Store className="w-4 h-4" /> },
          { id: 'marketplace', label: 'المتجر الإلكتروني', icon: <ShoppingBag className="w-4 h-4" /> },
          { id: 'maintenance', label: 'تتبع الصيانة', icon: <Wrench className="w-4 h-4" /> },
          { id: 'invoices', label: 'فواتيري والطباعة', icon: <Receipt className="w-4 h-4" /> },
          { id: 'warranties', label: 'سجل الضمان', icon: <ShieldCheck className="w-4 h-4" /> },
          { id: 'offers', label: 'العروض والتخفيضات', icon: <Tag className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: HOME & NEARBY SHOPS */}
      {activeTab === 'home' && (
        <div className="space-y-8">
          {/* Section: Nearby Approved Shops */}
          <div id="shops-section">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-black text-white">المحلات المعتمدة القريبة منك</h3>
                <p className="text-xs text-slate-400">أفضل مراكز الصيانة والمحلات الموثوقة في العراق</p>
              </div>
              <span className="text-xs text-blue-400 font-bold flex items-center gap-1">
                <span>إجمالي المحلات: ({shops.length})</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredShops.map((shop) => (
                <div
                  key={shop.id}
                  className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl overflow-hidden transition-all group shadow-xl flex flex-col justify-between"
                >
                  <div>
                    {/* Cover & Logo */}
                    <div className="h-32 relative bg-slate-800 overflow-hidden">
                      <img
                        src={shop.coverImage}
                        alt={shop.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                      <div className="absolute bottom-3 right-3 flex items-center gap-2">
                        <img
                          src={shop.logo}
                          alt={shop.name}
                          className="w-12 h-12 rounded-xl border-2 border-slate-900 object-cover shadow-lg"
                        />
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          مفتوح الآن
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                          {shop.name}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1 text-amber-400 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            {shop.rating} ({shop.reviewsCount})
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-blue-400" />
                            {shop.city} ({shop.distanceKm} كم)
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {shop.description}
                      </p>

                      <div className="text-[11px] text-slate-500 bg-slate-950 p-2 rounded-xl flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          {shop.workingHours}
                        </span>
                        <span className="text-slate-400 font-medium">{shop.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 pt-0 flex items-center gap-2">
                    <button
                      onClick={() => onSelectShop(shop)}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all text-center shadow-lg shadow-blue-600/20"
                    >
                      زيارة متجر المحل
                    </button>
                    <a
                      href={`tel:${shop.phone}`}
                      className="p-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl transition-all"
                      title="اتصال مباشر"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Featured Shops for Marketplace */}
          <div id="products-section">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-black text-white">المتاجر الإلكترونية للمحلات المعتمدة</h3>
                <p className="text-xs text-slate-400">اختر المحل الذي ترغب بتصفح متجره ومنتجاته الخاصة بأسعارها الحقيقية</p>
              </div>
              <button
                onClick={() => handleTabChange('marketplace')}
                className="text-xs text-blue-400 hover:underline font-bold flex items-center gap-1"
              >
                <span>عرض كافـة المتاجر 🛍️</span>
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredShops.map((shop) => (
                <div
                  key={shop.id}
                  className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl overflow-hidden transition-all group shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="h-28 relative bg-slate-800 overflow-hidden">
                      <img
                        src={shop.coverImage}
                        alt={shop.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                      <div className="absolute bottom-2 right-3 flex items-center gap-2">
                        <img
                          src={shop.logo}
                          alt={shop.name}
                          className="w-10 h-10 rounded-xl border-2 border-slate-900 object-cover shadow-lg"
                        />
                        <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          متجر إلكتروني
                        </span>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <h4 className="font-black text-base text-white group-hover:text-blue-400 transition-colors">{shop.name}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2">{shop.description}</p>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <button
                      onClick={() => {
                        setSelectedMarketShop(shop);
                        handleTabChange('marketplace');
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>دخول المتجر الإلكتروني للمحل</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: E-COMMERCE MARKETPLACE BY SHOP */}
      {activeTab === 'marketplace' && (
        <div className="space-y-6">
          {!selectedMarketShop ? (
            /* Step 1: Shop Selection for Marketplace */
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden">
                <div className="relative z-10 space-y-2">
                  <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold px-3 py-1 rounded-full">
                    <ShoppingBag className="w-4 h-4" />
                    <span>المتاجر الإلكترونية للمحلات المعتمدة</span>
                  </div>
                  <h3 className="text-2xl font-black text-white">اختر المحل لتصفح متجره الإلكتروني</h3>
                  <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                    لكل محل معتمد متجره الإلكتروني الخاص به لعرض الأجهزة الذكية، الشاشات، البطاريات، قطع الغيار الأصلية والإكسسوارات بأسعارها الحقيقية.
                  </p>
                </div>
              </div>

              {/* Search for Shops in Marketplace */}
              <div className="relative">
                <input
                  type="text"
                  value={marketSearch}
                  onChange={(e) => setMarketSearch(e.target.value)}
                  placeholder="ابحث عن محل بالاسم أو المدينة لتصفح متجره..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl py-3 pr-10 pl-4 text-sm text-slate-200 placeholder-slate-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>

              {/* Shop Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {shops
                  .filter(s => s.name.includes(marketSearch) || s.city.includes(marketSearch))
                  .map((shop) => {
                    const shopProductsCount = products.filter(p => p.shopId === shop.id).length || 6;
                    return (
                      <div
                        key={shop.id}
                        className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl overflow-hidden transition-all group shadow-xl flex flex-col justify-between"
                      >
                        <div>
                          <div className="h-32 relative bg-slate-800 overflow-hidden">
                            <img
                              src={shop.coverImage}
                              alt={shop.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                              <img
                                src={shop.logo}
                                alt={shop.name}
                                className="w-12 h-12 rounded-xl border-2 border-slate-900 object-cover shadow-lg"
                              />
                            </div>
                          </div>
                          <div className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-base text-white group-hover:text-blue-400 transition-colors">{shop.name}</h4>
                              <div className="flex items-center gap-1 text-amber-400 text-xs font-bold bg-amber-400/10 px-2 py-0.5 rounded-md">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                <span>{shop.rating}</span>
                              </div>
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-blue-400" />
                              <span>{shop.city} - {shop.address}</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>{shopProductsCount} منتج متوفر بالمتجر</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 pt-0">
                          <button
                            onClick={() => setSelectedMarketShop(shop)}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            <span>دخول متجر المحل وتصفح منتجاته</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            /* Step 2: Selected Shop's Dedicated Store */
            <div className="space-y-6">
              {/* Shop Header Bar */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap justify-between items-center gap-4 shadow-xl">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedMarketShop.logo}
                    alt={selectedMarketShop.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/30 shadow-lg"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30">
                        متجر إلكتروني حصري
                      </span>
                      <span className="text-xs text-slate-400">{selectedMarketShop.city}</span>
                    </div>
                    <h3 className="text-xl font-black text-white mt-1">{selectedMarketShop.name}</h3>
                    <p className="text-xs text-slate-400">{selectedMarketShop.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onSelectShop(selectedMarketShop)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center gap-2"
                  >
                    <Store className="w-4 h-4 text-blue-400" />
                    <span>تفاصيل المحل الكاملة</span>
                  </button>

                  <button
                    onClick={() => setSelectedMarketShop(null)}
                    className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-bold px-4 py-2.5 rounded-xl border border-blue-500/30 transition-all flex items-center gap-2"
                  >
                    <span>← اختيار محل آخر</span>
                  </button>
                </div>
              </div>

              {/* Category Filter & Search for Selected Shop */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex overflow-x-auto gap-2 w-full sm:w-auto pb-1 scrollbar-none">
                  {['الكل', 'هواتف', 'شاشات', 'بطاريات', 'شواحن', 'إكسسوارات', 'قطع غيار'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedMarketCategory(cat)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        selectedMarketCategory === cat
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={marketProductSearch}
                    onChange={(e) => setMarketProductSearch(e.target.value)}
                    placeholder="ابحث في منتجات هذا المحل..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl py-2.5 pr-9 pl-3 text-xs text-slate-200 placeholder-slate-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>

              {/* Products Grid for selectedMarketShop */}
              {(() => {
                const shopProducts = products.filter((p) => {
                  const isShop = p.shopId === selectedMarketShop.id;
                  const matchCat = selectedMarketCategory === 'الكل' || p.category.includes(selectedMarketCategory);
                  const matchQuery = p.name.includes(marketProductSearch) || p.description.includes(marketProductSearch);
                  return isShop && matchCat && matchQuery;
                });

                if (shopProducts.length === 0) {
                  return (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
                      <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
                      <h4 className="text-base font-bold text-white">لا توجد منتجات مطابقة في متجر هذا المحل</h4>
                      <p className="text-xs text-slate-500">جرب تصفح تصنيف مختلف أو إزالة كلمة البحث</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {shopProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-3 flex flex-col justify-between transition-all group shadow-lg"
                      >
                        <div>
                          <div className="h-40 bg-slate-950 rounded-xl overflow-hidden mb-3 relative flex items-center justify-center p-2">
                            <img
                              src={prod.images[0]}
                              alt={prod.name}
                              className="max-h-full object-contain group-hover:scale-105 transition-transform"
                            />
                            <span className="absolute top-2 right-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {prod.category}
                            </span>
                          </div>

                          <div className="text-[10px] text-blue-400 font-semibold mb-1">{selectedMarketShop.name}</div>
                          <h5 className="font-bold text-sm text-white line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors">
                            {prod.name}
                          </h5>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-800/80">
                          <div className="flex items-baseline justify-between mb-3">
                            <div>
                              <span className="text-base font-black text-emerald-400">{formatIQD(prod.priceIQD)}</span>
                              {prod.compareAtPriceIQD && (
                                <span className="text-xs text-slate-500 line-through mr-1.5">
                                  {formatIQD(prod.compareAtPriceIQD)}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">الكمية: {prod.quantity}</span>
                          </div>

                          <button
                            onClick={() => onAddToCart(prod)}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            <span>إضافة إلى السلة</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MAINTENANCE TRACKING */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-xl font-black text-white mb-2">تتبع حالة صيانة جهازك برقم التذكرة</h3>
            <p className="text-xs text-slate-400 mb-6">أدخل رقم التذكرة الخـاص بك (مثال: BRH-8842) للتحقق الفوري من مرحلة الإصلاح نسبة الإنجاز.</p>

            <form onSubmit={handleSearchTicket} className="flex gap-2 max-w-lg mb-6">
              <input
                type="text"
                value={trackTicketNumber}
                onChange={(e) => setTrackTicketNumber(e.target.value)}
                placeholder="أدخل رقم التذكرة (BRH-8842)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl text-xs transition-all flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>بحث</span>
              </button>
            </form>

            {foundTicket && (
              <div className="p-5 rounded-2xl bg-slate-950 border border-blue-500/40 text-slate-200 space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-start gap-3">
                    {foundTicket.deviceImage && (
                      <img
                        src={foundTicket.deviceImage}
                        alt="صورة الجهاز"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-700 bg-slate-900"
                      />
                    )}
                    <div>
                      <span className="text-xs text-blue-400 font-bold">تذكرة رقم: #{foundTicket.ticketNumber}</span>
                      <h4 className="text-lg font-black text-white mt-0.5">{foundTicket.deviceType}</h4>
                      <p className="text-xs text-slate-400">المركز: {foundTicket.shopName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">التكلفة التقديرية</div>
                    <div className="text-lg font-bold text-emerald-400">{formatIQD(foundTicket.estimatedCostIQD)}</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-300">نسبة تقدم الإصلاح</span>
                    <span className="text-blue-400">{foundTicket.progressPercent}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-700"
                      style={{ width: `${foundTicket.progressPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stages Steps */}
                <div className="space-y-3 pt-2">
                  <h5 className="text-xs font-bold text-slate-300">مراحل الصيانة:</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {foundTicket.stages.map((stage, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border ${
                          stage.completed
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold mb-1">
                          <CheckCircle2 className={`w-4 h-4 ${stage.completed ? 'text-emerald-400' : 'text-slate-600'}`} />
                          <span>{stage.title}</span>
                        </div>
                        <span className="text-[10px] block opacity-80">{stage.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* List of All Customer Maintenance Tickets */}
          <div>
            <h4 className="text-lg font-black text-white mb-4">طلبات الصيانة وتتبع الحالة</h4>
            <div className="space-y-4">
              {maintenanceTickets.map((ticket) => {
                const isPending = ticket.status === 'pending_owner_approval';
                const isRejected = ticket.status === 'rejected';

                return (
                  <div
                    key={ticket.id}
                    className={`bg-slate-900 border rounded-2xl p-5 shadow-lg space-y-3 ${
                      isPending
                        ? 'border-amber-500/50 bg-slate-900/90'
                        : isRejected
                        ? 'border-red-500/40 opacity-80'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {ticket.deviceImage && (
                          <img
                            src={ticket.deviceImage}
                            alt="صورة الجهاز"
                            className="w-16 h-16 rounded-xl object-cover border border-slate-700 bg-slate-950 flex-shrink-0"
                          />
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-full font-bold">
                              #{ticket.ticketNumber}
                            </span>
                            {isPending ? (
                              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-0.5 rounded-full font-bold animate-pulse">
                                ⏳ بانتظار موافقة صاحب المحل أولاً
                              </span>
                            ) : isRejected ? (
                              <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/40 px-3 py-0.5 rounded-full font-bold">
                                🛑 تم رفض الطلب
                              </span>
                            ) : (
                              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-0.5 rounded-full font-bold">
                                ✅ تمت موافقة المالك - قيد الصيانة
                              </span>
                            )}
                            <span className="text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleDateString('ar-IQ')}</span>
                          </div>

                          <h4 className="text-base font-bold text-white">{ticket.deviceType}</h4>
                          <p className="text-xs text-slate-300">وصف العطل: {ticket.issueDescription}</p>

                          {/* Selected Services by Owner */}
                          {ticket.selectedServices && ticket.selectedServices.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-[11px] text-amber-300 font-bold">الخدمات المحددة من المحل:</span>
                              {ticket.selectedServices.map((srv, idx) => (
                                <span key={idx} className="bg-slate-800 text-slate-200 border border-slate-700 text-[10px] px-2 py-0.5 rounded-lg">
                                  {srv}
                                </span>
                              ))}
                            </div>
                          )}

                          {isPending && (
                            <div className="bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs p-2.5 rounded-xl mt-2">
                              💡 تم إرسال طلبك بنجاح. سيقوم صاحب المحل بمراجعة الطلب والموافقة عليه أولاً، ثم ملء الخدمات المعتمدة والتكلفة النهائية.
                            </div>
                          )}

                          {isRejected && (
                            <div className="bg-red-950/30 border border-red-500/30 text-red-300 text-xs p-2.5 rounded-xl mt-2">
                              🛑 {ticket.rejectionReason || 'اعتذر صاحب المحل عن قبول الطلب لعدم توفر قطع الغيار أو إمكانية الصيانة حالياً.'}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        {ticket.estimatedCostIQD > 0 ? (
                          <div className="text-base font-black text-emerald-400">{formatIQD(ticket.estimatedCostIQD)}</div>
                        ) : (
                          <div className="text-xs text-slate-400">التكلفة: قيد التحديد من المالك</div>
                        )}
                        <button
                          onClick={() => handleShowCodeModal(`تذكرة صيانة ${ticket.ticketNumber}`, ticket.ticketNumber)}
                          className="mt-2 text-xs text-blue-400 hover:underline flex items-center gap-1 justify-end"
                        >
                          <span>عرض كود التذكرة QR</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INVOICES & PRINTING */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <h3 className="text-xl font-black text-white">فواتير الشراء والصيانة</h3>
          <p className="text-xs text-slate-400">استعرض كافة فواتير الشراء والصيانة الخاصة بك.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invoices.map((inv) => (
              <div key={inv.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs text-blue-400 font-bold"># {inv.invoiceNumber}</span>
                    <h4 className="text-base font-bold text-white">{inv.shopName}</h4>
                    <span className="text-[11px] text-slate-400">{new Date(inv.createdAt).toLocaleDateString('ar-IQ')}</span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-2.5 py-1 rounded-full">
                    مدفوعة (Paid)
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-300">
                  {inv.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-slate-950">
                      <span>{item.description} (x{item.quantity})</span>
                      <span className="font-bold text-white">{formatIQD(item.totalPriceIQD)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div>
                    <span className="text-xs text-slate-400">المجموع الكلي:</span>
                    <div className="text-lg font-black text-emerald-400">{formatIQD(inv.totalIQD)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: WARRANTIES */}
      {activeTab === 'warranties' && (
        <div className="space-y-4">
          <h3 className="text-xl font-black text-white">سجل الضمانات الفعالة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warranties.map((war) => (
              <div key={war.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 bg-emerald-500 text-slate-950 font-black text-[10px] px-3 py-1 rounded-br-xl">
                  ضمان أصلـي
                </div>

                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-white">{war.deviceName}</h4>
                  <p className="text-xs text-slate-400">الرقم التسلسلي: <span className="font-mono text-slate-200">{war.serialNumber}</span></p>
                  <p className="text-xs text-blue-400 font-semibold">{war.shopName}</p>

                  <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-slate-400">الأيام المتبقية:</span>
                      <span className="text-emerald-400 font-black mr-1 text-sm">{war.daysRemaining} يوماً</span>
                    </div>
                    <span className="text-slate-400">ينتهي في: {war.endDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: OFFERS */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          <h3 className="text-xl font-black text-white">العروض والتخفيضات اليومية</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offers.map((off) => (
              <div key={off.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="h-40 bg-slate-800 relative">
                  <img src={off.bannerUrl} alt={off.title} className="w-full h-full object-cover" />
                  <span className="absolute top-3 right-3 bg-red-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-lg">
                    خصم {off.discountPercentage}%
                  </span>
                </div>
                <div className="p-5 space-y-2">
                  <span className="text-xs text-blue-400 font-bold">{off.shopName}</span>
                  <h4 className="text-lg font-bold text-white">{off.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{off.description}</p>
                  {off.code && (
                    <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-xs text-slate-400">كود الخصم:</span>
                      <span className="bg-slate-950 border border-blue-500/40 text-blue-400 font-mono font-bold text-xs px-3 py-1 rounded-lg">
                        {off.code}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Maintenance Request Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 relative shadow-2xl text-slate-100">
            <button
              onClick={() => setShowNewTicketModal(false)}
              className="absolute top-5 left-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white mb-1">تقديم طلب صيانة جديد</h3>
            <p className="text-xs text-slate-400 mb-6">اختر المحل وأدخل تفاصيل العطل في جهازك للحصول على تذكرة فحص فورية.</p>

            {ticketSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                {ticketSuccessMsg}
              </div>
            )}

            <form onSubmit={handleCreateMaintenanceTicket} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اختر مركز الصيانة المطلوب</label>
                <select
                  value={selectedShopId}
                  onChange={(e) => setSelectedShopId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">نوع الجهاز وموديله</label>
                <input
                  type="text"
                  required
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value)}
                  placeholder="مثال: iPhone 15 Pro Max أو Samsung S24"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">لون الجهاز</label>
                  <input
                    type="text"
                    value={deviceColor}
                    onChange={(e) => setDeviceColor(e.target.value)}
                    placeholder="أسود / أزرق"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">السيريال IMEI (اختياري)</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="358291..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">وصف العطل أو الشكوى بالتفصيل</label>
                <textarea
                  required
                  rows={3}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="مثال: الشاشة مكسورة، البطارية تنتهي بسرعة، الشاحن لا يعمل..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رفع صورة للجهاز أو مكان العطل (اختياري)</label>
                {deviceImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={deviceImage} alt="صورة الجهاز" className="w-14 h-14 object-cover rounded-xl border border-slate-800" />
                      <div>
                        <span className="text-xs text-emerald-400 font-bold block flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          تم إرفاق صورة الجهاز
                        </span>
                        <span className="text-[10px] text-slate-400">ستصل الصورة للفني لمساعدته في تشخيص العطل</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeviceImage('')}
                      className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-xl transition-all font-bold"
                    >
                      حذف
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 text-center bg-slate-950 transition-all cursor-pointer relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    <div className="flex flex-col items-center justify-center space-y-1.5">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-300">اضغط هنا لرفع صورة للجهاز أو العطل</span>
                      <span className="text-[10px] text-slate-500">تدعم رفع الصور مباشرة من الهاتف أو الكاميرا</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/25"
              >
                تأكيد وإصدار تذكرة الصيانة
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR / Barcode Preview Modal */}
      {qrModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center max-w-sm w-full relative">
            <button
              onClick={() => setQrModalData(null)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 className="font-bold text-base text-white mb-4">{qrModalData.title}</h4>

            <div className="bg-white p-4 rounded-2xl mb-4 inline-block">
              {qrModalData.qrUrl && <img src={qrModalData.qrUrl} alt="QR Code" className="w-48 h-48 mx-auto" />}
            </div>

            <div className="bg-white p-3 rounded-2xl">
              {qrModalData.barcodeUrl && <img src={qrModalData.barcodeUrl} alt="Barcode" className="max-w-full mx-auto" />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
