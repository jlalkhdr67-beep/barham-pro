import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  Shield,
  ArrowRight,
  Check,
  AlertCircle,
  Store,
  MapPin,
  FileText,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Crown
} from 'lucide-react';
import { useAuth, MockConfirmationResult } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'phone' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const {
    loginWithEmail,
    registerCustomer,
    registerShopOwner,
    loginWithGoogle,
    sendPhoneOtp,
    confirmPhoneOtp,
    resetPassword
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'phone' | 'forgot'>(initialMode);
  const [registerType, setRegisterType] = useState<'customer' | 'owner'>('customer');

  // Common Login & Customer fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Shop Owner Registration Fields
  const [ownerName, setOwnerName] = useState('');
  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('هواتف');
  const [coverUrl, setCoverUrl] = useState('https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80');
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&q=80');
  const [city, setCity] = useState('بغداد');
  const [address, setAddress] = useState('شارع الصناعة - مقابل الجامعة التكنولوجية');
  const [description, setDescription] = useState('مركز صيانة معتمد وتوريد قطع غيار أصلية لجميع أنواع الهواتف والأجهزة الذكية.');

  // Phone OTP state
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<MockConfirmationResult | null>(null);

  // Status & Notifications
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [shopSubmittedNotice, setShopSubmittedNotice] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const resetFormAlerts = () => {
    setError('');
    setMessage('');
    setShopSubmittedNotice(false);
  };

  const getFirebaseErrorMessage = (err: any): string => {
    console.error('Firebase Auth Exception (Modal):', err?.code, err?.message);
    switch (err?.code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'بيانات الدخول غير صحيحة، يرجى التأكد من البريد وكلمة المرور.';
      case 'auth/email-already-in-use':
        return 'هذا البريد الإلكتروني مسجل بالفعل في منصة Barham Pro.';
      case 'auth/weak-password':
        return 'كلمة المرور ضعيفة جداً، يرجى استخدام 6 خانات على الأقل.';
      case 'auth/invalid-phone-number':
        return 'رقم الهاتف غير صحيح، يرجى التأكد من إدخال رقم عراقي صحيح.';
      case 'auth/invalid-verification-code':
        return 'رمز التحقق (OTP) غير صحيح، يرجى التأكد وإعادة المحاولة.';
      case 'auth/code-expired':
        return 'انتهت صلاحية كود التحقق، يرجى طلب كود جديد.';
      case 'auth/unauthorized-domain':
        return 'عذراً! رابط الدومين الحالي غير مضاف في نطاقات Firebase المصرح بها (Authorized Domains). لإضافة الدومين: افتح Firebase Console -> Authentication -> Settings -> Authorized domains وقم بإضافة النطاق، أو سجل الدخول بالبريد وكلمة المرور.';
      default:
        return err?.message || 'حدث خطأ أثناء معالجة طلبك عبر Firebase Auth.';
    }
  };

  // Handle Login or Customer Registration or Password Reset
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormAlerts();
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        onClose();
      } else if (mode === 'register') {
        if (registerType === 'customer') {
          if (password !== confirmPassword) {
            setError('كلمة المرور وتأكيد كلمة المرور غير متطابقتين!');
            setLoading(false);
            return;
          }
          await registerCustomer({
            email,
            pass: password,
            name: displayName || 'زبون Barham',
            phone: phoneNumber || '07700000000',
            photoURL,
          });
          onClose();
        } else if (registerType === 'owner') {
          await registerShopOwner({
            ownerName: ownerName || 'صاحب المحل',
            shopName: shopName || 'مركز صيانة برهم',
            email,
            phone: phoneNumber || '07701234567',
            pass: password,
            city,
            address,
            description,
            category,
            logoUrl,
            coverUrl,
          });
          setShopSubmittedNotice(true);
          setMessage('تم إرسال طلبك بنجاح، سيتم مراجعة بيانات المحل من قبل إدارة Barham Pro.');
          setTimeout(() => {
            onClose();
          }, 3500);
        }
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setMessage('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح!');
      }
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    resetFormAlerts();
    setLoading(true);
    try {
      const selectedRole: UserRole = registerType === 'owner' ? 'owner' : 'customer';
      await loginWithGoogle(selectedRole);
      onClose();
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Phone OTP Flow
  const handlePhoneOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormAlerts();
    if (!phoneNumber || phoneNumber.length < 9) {
      setError('يرجى إدخال رقم هاتف عراقي صحيح (مثال: 07701234567)');
      return;
    }

    setLoading(true);
    try {
      const confirmation = await sendPhoneOtp(phoneNumber, 'recaptcha-container-modal');
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setMessage('تم إرسال رمز التحقق OTP بنجاح إلى هاتفك via Firebase Auth.');
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormAlerts();
    if (!confirmationResult) {
      setError('لم يتم العثور على طلب كود فعال، يرجى طلب كود جديد.');
      return;
    }
    if (!otpCode || otpCode.length < 6) {
      setError('يرجى إدخال كود OTP المكون من 6 أرقام');
      return;
    }

    setLoading(true);
    try {
      const targetRole: UserRole = registerType === 'owner' ? 'owner' : 'customer';
      await confirmPhoneOtp(confirmationResult, otpCode, targetRole);
      setMessage('تم التحقق بنجاح وتأكيد الحساب بواسطة Firebase Auth!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div id="recaptcha-container-modal"></div>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl text-slate-100 my-6 max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header & Logo */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 mx-auto flex items-center justify-center text-white mb-3 shadow-xl shadow-blue-500/20 font-black">
            <Store className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-black text-white tracking-wide">Barham Pro</h3>
          <p className="text-xs text-blue-400 font-bold mt-1">
            {mode === 'login' && 'أهلاً بعودتك'}
            {mode === 'register' && 'إنشاء حساب جديد في المنصة'}
            {mode === 'phone' && 'تسجيل الدخول برقم الهاتف OTP'}
            {mode === 'forgot' && 'استعادة كلمة المرور'}
          </p>
        </div>



        {/* Notifications & Success Banners */}
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{message}</span>
          </div>
        )}

        {/* Successful Shop Application Notice */}
        {shopSubmittedNotice && (
          <div className="mb-6 p-4 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-black text-sm text-white">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <span>تم إرسال طلبك بنجاح!</span>
            </div>
            <p className="leading-relaxed">
              سيتم مراجعة بيانات المحل من قبل إدارة Barham Pro والاعتماد للبدء برفع المنتجات واستلام طلبات الصيانة.
            </p>
          </div>
        )}

        {/* REGISTER MODE TYPE SELECTION (Customer vs Shop Owner) */}
        {mode === 'register' && (
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-300 mb-2">اختر نوع الحساب المراد إنشاؤه:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setRegisterType('customer');
                  resetFormAlerts();
                }}
                className={`py-3 px-4 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  registerType === 'customer'
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <User className="w-4 h-4 text-blue-400" />
                <span>1. حساب زبون</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRegisterType('owner');
                  resetFormAlerts();
                }}
                className={`py-3 px-4 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  registerType === 'owner'
                    ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-600/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Store className="w-4 h-4 text-purple-400" />
                <span>2. حساب صاحب محل</span>
              </button>
            </div>
          </div>
        )}

        {/* MAIN FORM: LOGIN OR REGISTRATION */}
        {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* LOGIN FIELDS */}
            {mode === 'login' && (
              <>
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-bold">البريد الإلكتروني</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@barhampro.iq"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-11 pl-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-bold">كلمة المرور</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-11 pl-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
                  </div>
                </div>

                {/* Remember Me & Forgot Password Options */}
                <div className="flex justify-between items-center text-xs pt-1">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                    />
                    <span>تذكرني على هذا الجهاز</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      resetFormAlerts();
                    }}
                    className="text-blue-400 font-bold hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
              </>
            )}

            {/* CUSTOMER REGISTER FIELDS */}
            {mode === 'register' && registerType === 'customer' && (
              <>
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-bold">الاسم الكامل</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="أحمد علي العراقي"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-11 pl-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <User className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-bold">البريد الإلكتروني</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="customer@example.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-11 pl-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-bold">رقم الهاتف</label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="07701234567"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-11 pl-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-left dir-ltr"
                    />
                    <Phone className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-bold">كلمة المرور</label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-11 pl-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      <Lock className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-bold">تأكيد كلمة المرور</label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-11 pl-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      <Lock className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-bold">صورة شخصية (اختيارية - رابط URL)</label>
                  <div className="relative">
                    <input
                      type="url"
                      value={photoURL}
                      onChange={(e) => setPhotoURL(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-11 pl-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <Camera className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
                  </div>
                </div>
              </>
            )}

            {/* SHOP OWNER REGISTER FIELDS */}
            {mode === 'register' && registerType === 'owner' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-bold">اسم صاحب المحل</label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="م. برهم الجبوري"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-bold">اسم المحل / المركز</label>
                    <input
                      type="text"
                      required
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="مركز برهم للصيانة المتقدمة"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-bold">البريد الإلكتروني</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="shop@barhampro.iq"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-bold">رقم الهاتف</label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="07701234567"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono text-left dir-ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-bold">كلمة المرور</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-bold">التصنيف الرئيسي للمحل</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="هواتف">هواتف (بيع وصيانة)</option>
                      <option value="صيانة وحلول الهواتف الذكية">صيانة وحلول الهواتف الذكية</option>
                      <option value="صيانة أبل وأندرويد">صيانة أبل وأندرويد</option>
                      <option value="إلكترونيات واكسسوارات">إلكترونيات واكسسوارات</option>
                      <option value="قطع غيار ومستلزمات">قطع غيار ومستلزمات</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-bold">المدينة</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="بغداد">بغداد</option>
                      <option value="أربيل">أربيل</option>
                      <option value="البصرة">البصرة</option>
                      <option value="النجف الأشرف">النجف الأشرف</option>
                      <option value="كربلاء المقدسة">كربلاء المقدسة</option>
                      <option value="الموصل">الموصل</option>
                      <option value="كركوك">كركوك</option>
                      <option value="السليمانية">السليمانية</option>
                      <option value="بابل">بابل</option>
                      <option value="الكوت">الكوت</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-bold">العنوان التفصيلي</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="الشارع العام - مجاور البريد"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-bold">وصف المحل والخدمات المقدمة</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="اكتب نبذة عن التخصص وخدمات الصيانة..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-bold">شعار المحل (رابط URL)</label>
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-bold">صورة الواجهة (رابط URL)</label>
                    <input
                      type="url"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {/* FORGOT PASSWORD FORM */}
            {mode === 'forgot' && (
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-bold">أدخل بريدك الإلكتروني لاستعادة كلمة المرور</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-11 pl-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
                </div>
              </div>
            )}

            {/* MAIN SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-bold py-3.5 rounded-2xl shadow-xl transition-all text-xs sm:text-sm flex items-center justify-center gap-2 ${
                mode === 'register' && registerType === 'owner'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/25'
                  : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-blue-600/25'
              }`}
            >
              {loading ? (
                <span>
                  {mode === 'register' && registerType === 'owner'
                    ? 'جاري إرسال طلب تسجيل المحل...'
                    : mode === 'register'
                    ? 'جاري إنشاء الحساب...'
                    : 'جاري تسجيل الدخول...'}
                </span>
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'تسجيل الدخول'}
                    {mode === 'register' && registerType === 'customer' && 'إنشاء حساب زبون'}
                    {mode === 'register' && registerType === 'owner' && 'إرسال طلب الانضمام'}
                    {mode === 'forgot' && 'إرسال رابط الاستعادة'}
                  </span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>
          </form>
        )}

        {/* PHONE OTP MODE */}
        {mode === 'phone' && (
          <form onSubmit={!otpSent ? handlePhoneOtpRequest : handleOtpVerify} className="space-y-4">
            {!otpSent ? (
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-bold">رقم الهاتف العراقي</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="07701234567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-11 pl-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-left dir-ltr"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-bold">أدخل رمز OTP المكون من 6 أرقام</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 text-center text-xl font-bold tracking-widest text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-emerald-600/25 transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              <span>{loading ? 'جاري الاتصال بـ Firebase...' : !otpSent ? 'إرسال رمز التحقق SMS' : 'تأكيد الرمز وتسجيل الدخول'}</span>
            </button>
          </form>
        )}

        {/* DIVIDER & SOCIAL / OTP OPTIONS */}
        {mode !== 'forgot' && (
          <div className="mt-6 pt-5 border-t border-slate-800 space-y-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-200 font-bold py-3 rounded-2xl transition-all text-xs flex items-center justify-center gap-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.1 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9c-.8-.8-1.4-1.8-1.6-3z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              <span>تسجيل الدخول بواسطة Google</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'phone' ? 'login' : 'phone');
                resetFormAlerts();
              }}
              className="w-full bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-300 font-bold py-3 rounded-2xl transition-all text-xs flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>{mode === 'phone' ? 'العودة للتسجيل بالبريد' : 'تسجيل الدخول برقم الهاتف OTP'}</span>
            </button>
          </div>
        )}

        {/* FOOTER SWITCHER LINK */}
        <div className="mt-5 text-center text-xs text-slate-400">
          {mode === 'login' && (
            <p>
              ليس لديك حساب؟{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  resetFormAlerts();
                }}
                className="text-blue-400 font-bold hover:underline"
              >
                إنشاء حساب جديد
              </button>
            </p>
          )}

          {mode === 'register' && (
            <p>
              لديك حساب بالفعل؟{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  resetFormAlerts();
                }}
                className="text-blue-400 font-bold hover:underline"
              >
                تسجيل الدخول
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                resetFormAlerts();
              }}
              className="text-blue-400 font-bold hover:underline"
            >
              العودة إلى صفحة تسجيل الدخول
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
