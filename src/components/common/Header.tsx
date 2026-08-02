import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Wrench,
  Search,
  Bell,
  ShoppingCart,
  User,
  ShieldAlert,
  Store,
  LogOut,
  ChevronDown,
  Sparkles,
  Menu,
  X,
  Phone,
  Settings,
  CheckCheck,
  Trash2,
  Tag,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, AppNotification } from '../../types';
import { MockDataService } from '../../services/MockDataService';
import { UserProfileModal } from './UserProfileModal';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenCart: () => void;
  cartCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onOpenCart,
  cartCount,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
}) => {
  const { userProfile, currentUser, activeRole, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const refreshNotifications = () => {
    const allNotifs = MockDataService.getNotifications();
    const userNotifs = allNotifs.filter((n) => {
      if (n.userId === 'all') return true;
      if (n.userId === activeRole) return true;
      if (userProfile && (n.userId === userProfile.uid || n.userId === userProfile.role)) return true;
      return false;
    });
    setNotifications(userNotifs);
  };

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 2500);
    return () => clearInterval(interval);
  }, [userProfile, activeRole]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    MockDataService.markAllNotificationsAsRead();
    refreshNotifications();
  };

  const handleDeleteNotif = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    MockDataService.deleteNotification(id);
    refreshNotifications();
  };

  const handleMarkRead = (id: string) => {
    MockDataService.markNotificationAsRead(id);
    refreshNotifications();
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diff < 60) return 'الآن';
      if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
      if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
      return `منذ ${Math.floor(diff / 86400)} يوم`;
    } catch {
      return 'مؤخراً';
    }
  };

  const roleLabels: Record<UserRole, { label: string; color: string; icon: React.ReactNode }> = {
    customer: { label: 'زبون', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: <User className="w-3.5 h-3.5" /> },
    owner: { label: 'صاحب محل', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: <Store className="w-3.5 h-3.5" /> },
    admin: { label: 'مالك النظام', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  };

  const navItems = [
    { id: 'home', label: 'الرئيسية' },
    { id: 'shops', label: 'المحلات' },
    { id: 'marketplace', label: 'المتجر الإلكتروني' },
    { id: 'maintenance', label: 'متابعة الصيانة' },
    { id: 'offers', label: 'العروض' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-2xl">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <div className="relative">
                  <Smartphone className="w-6 h-6 text-blue-400" />
                  <Wrench className="w-3.5 h-3.5 text-cyan-300 absolute -bottom-1 -right-1" />
                </div>
              </div>
            </div>
            <div>
              <div className="text-xl font-black tracking-tight text-white flex items-center gap-1">
                BARHAM<span className="text-blue-500 font-extrabold">PRO</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">منصة إدارة الصيانة والمحلات</p>
            </div>
          </div>

          {/* Search Box */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن محل، جهاز، قطع غيار، أو صيانة..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-2.5 pr-10 pl-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          </div>

          {/* Navigation Links - Only visible in customer view */}
          {activeRole === 'customer' && (
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === item.id
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white hover:border-slate-700 transition-all"
              title="سلة المشتريات"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950 shadow-md animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white hover:border-slate-700 transition-all relative"
                title="الإشعارات"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping"></span>
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                      {unreadCount}
                    </span>
                  </>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute left-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 text-slate-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-400" /> الإشعارات والتنبيهات
                    </h4>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20"
                        >
                          <CheckCheck className="w-3 h-3" /> قراءة الكل
                        </button>
                      )}
                      <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold">
                        {notifications.length}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 font-bold text-xs">
                        لا توجد إشعارات حالياً
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkRead(n.id)}
                          className={`p-3 rounded-xl border transition-all relative group cursor-pointer ${
                            !n.read
                              ? 'bg-slate-800/90 border-blue-500/40 shadow-sm'
                              : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {n.type === 'offer' ? (
                                <Tag className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : n.type === 'maintenance' ? (
                                <Wrench className="w-4 h-4 text-blue-400 shrink-0" />
                              ) : n.type === 'warning' ? (
                                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                              ) : (
                                <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
                              )}
                              <span className={`font-bold ${!n.read ? 'text-slate-100' : 'text-slate-300'}`}>
                                {n.title}
                              </span>
                            </div>

                            <button
                              onClick={(e) => handleDeleteNotif(n.id, e)}
                              className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                              title="حذف الإشعار"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <p className="text-slate-300 mt-1 text-[11px] leading-relaxed pl-4">
                            {n.message}
                          </p>

                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/50 text-[10px] text-slate-500">
                            <span>{formatRelativeTime(n.createdAt)}</span>
                            {!n.read && (
                              <span className="text-blue-400 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> غير مقروء
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Auth Profile Menu / Button */}
            <div className="relative">
              {userProfile ? (
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 p-1.5 pl-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-sm overflow-hidden">
                    {userProfile.photoURL ? (
                      <img src={userProfile.photoURL} alt={userProfile.displayName} className="w-full h-full object-cover" />
                    ) : (
                      userProfile.displayName ? userProfile.displayName.charAt(0) : 'U'
                    )}
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-slate-200 truncate max-w-[120px]">
                      {userProfile.displayName}
                    </div>
                    <div className={`text-[10px] px-1.5 py-0.5 rounded border inline-flex items-center gap-1 mt-0.5 ${roleLabels[activeRole].color}`}>
                      {roleLabels[activeRole].icon}
                      {roleLabels[activeRole].label}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  تسجيل الدخول
                </button>
              )}

              {/* User Menu Dropdown */}
              {showUserMenu && userProfile && (
                <div className="absolute left-0 mt-3 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 text-slate-200">
                  <div className="p-3 border-b border-slate-800 mb-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold overflow-hidden shrink-0">
                      {userProfile.photoURL ? (
                        <img src={userProfile.photoURL} alt={userProfile.displayName} className="w-full h-full object-cover" />
                      ) : (
                        userProfile.displayName?.charAt(0) || 'U'
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-bold text-sm text-white truncate">{userProfile.displayName}</div>
                      <div className="text-xs text-slate-400 truncate">{userProfile.email}</div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    {activeRole !== 'customer' && (
                      <button
                        onClick={() => {
                          setActiveTab('dashboard');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex items-center justify-between"
                      >
                        <span>لوحة التحكم ({roleLabels[activeRole].label})</span>
                        <Settings className="w-4 h-4 text-blue-400" />
                      </button>
                    )}

                    {userProfile.role === 'customer' && activeRole === 'customer' && (
                      <button
                        onClick={() => {
                          setShowProfileModal(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex items-center justify-between font-bold"
                      >
                        <span>تعديل الاسم والصورة الشخصية</span>
                        <User className="w-4 h-4 text-emerald-400" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-right px-3 py-2 rounded-xl hover:bg-red-500/10 text-red-400 flex items-center justify-between border-t border-slate-800 mt-2"
                    >
                      <span>تسجيل الخروج</span>
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle - Removed as requested */}
          </div>
        </div>

        {/* Mobile Navigation Drawer - Hidden for customer view */}
        {mobileMenuOpen && activeRole !== 'customer' && (
          <div className="lg:hidden border-t border-slate-800 py-4 space-y-3 pb-6">
            <div className="relative mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن محلات، منتجات، صيانة..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pr-10 pl-4 text-sm text-slate-200 placeholder-slate-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            </div>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-right px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* User Profile Edit Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </header>
  );
};
