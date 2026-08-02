import React, { useState } from 'react';
import {
  Store,
  Mail,
  Lock,
  ArrowRight,
  Phone,
  AlertCircle,
  CheckCircle2,
  User,
  ShieldCheck,
  Sparkles,
  KeyRound,
  Building,
  Wrench,
  ChevronLeft,
  Camera,
  Image as ImageIcon,
  Crown
} from 'lucide-react';
import { useAuth, MockConfirmationResult } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const LoginScreen: React.FC = () => {
  const {
    loginWithEmail,
    registerCustomer,
    registerShopOwner,
    loginWithGoogle,
    sendPhoneOtp,
    confirmPhoneOtp,
    resetPassword
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'phone' | 'forgot'>('login');
  const [registerType, setRegisterType] = useState<'customer' | 'owner'>('customer');

  // Login & Customer Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Shop Owner Registration Form Fields
  const [ownerName, setOwnerName] = useState('');
  const [shopName, setShopName] = useState('');
  const [city, setCity] = useState('بغداد');
  const [category, setCategory] = useState('هواتف');
  const [address, setAddress] = useState('شارع الصناعة - مقابل الجامعة التكنولوجية');
  const [description, setDescription] = useState('مركز صيانة وتوريد قطع غيار أصلية لجميع الهواتف والأجهزة الذكية.');
  const [coverUrl, setCoverUrl] = useState('https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80');
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&q=80');

  // Phone OTP State
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<MockConfirmationResult | null>(null);

  // Alerts & Messages
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [shopSubmittedNotice, setShopSubmittedNotice] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetAlerts = () => {
    setError('');
    setMessage('');
    setShopSubmittedNotice(false);
  };

  const getFirebaseErrorMessage = (err: any): string => {
    console.error('Firebase Auth Exception Handled:', err?.code, err?.message);
    switch (err?.code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'بيانات الدخول غير صحيحة، يرجى التأكد من البريد وكلمة المرور.';
      case 'auth/email-already-in-use':
        return 'هذا البريد الإلكتروني مسجل بالفعل في حساب آخر.';
      case 'auth/weak-password':
        return 'كلمة المرور ضعيفة جداً، يرجى استخدام 6 خانات على الأقل.';
      case 'auth/invalid-email':
        return 'صيغة البريد الإلكتروني غير صحيحة.';
      case 'auth/invalid-phone-number':
        return 'رقم الهاتف غير صحيح، يرجى التأكد من إدخال رقم عراقي صحيح.';
      case 'auth/invalid-verification-code':
        return 'رمز التحقق (OTP) غير صحيح، يرجى التأكد وإعادة المحاولة.';
      case 'auth/code-expired':
        return 'انتهت صلاحية كود التحقق، يرجى طلب كود جديد.';
      case 'auth/unauthorized-domain':
        return 'عذراً! رابط الدومين الحالي غير مضاف في نطاقات Firebase المصرح بها (Authorized Domains). لإضافة الدومين: افتح Firebase Console -> Authentication -> Settings -> Authorized domains وقم بإضافة النطاق، أو سجل الدخول بالبريد وكلمة المرور.';
      case 'auth/popup-closed-by-user':
        return 'تم إغلاق نافذة تسجيل الدخول بـ Google قبل اكتمال العملية.';
      case 'auth/captcha-check-failed':
        return 'فشل التحقق من reCAPTCHA، يرجى تحديث الصفحة والمحاولة مجدداً.';
      default:
        return err?.message || 'حدث خطأ أثناء الاتصال بـ Firebase Authentication.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetAlerts();
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
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
            name: displayName || 'زبون Barham Pro',
            phone: phoneNumber || '07700000000',
          });
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
            coverUrl,
            logoUrl,
          });
          setShopSubmittedNotice(true);
          setMessage('تم تقديم الطلب بنجاح، يرجى انتظار موافقة مالك النظام قبل تفعيل الحساب.');
        }
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setMessage('تم إرسال رابط استعادة كلمة المرور إلى البريد الإلكتروني بنجاح!');
      }
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    resetAlerts();
    setLoading(true);
    try {
      const role: UserRole = registerType === 'owner' ? 'owner' : 'customer';
      await loginWithGoogle(role);
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    resetAlerts();
    if (!phoneNumber || phoneNumber.length < 9) {
      setError('يرجى إدخال رقم هاتف عراقي صحيح (مثال: 07701234567)');
      return;
    }

    setLoading(true);
    try {
      const confirmation = await sendPhoneOtp(phoneNumber, 'recaptcha-container');
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setMessage('تم إرسال رمز التحقق SMS بنجاح إلى هاتفك via Firebase Phone Auth.');
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    resetAlerts();
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
      setMessage('تم التحقق وتأكيد تسجيل الدخول بنجاح عبر Firebase Auth!');
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white" dir="rtl">
      
      {/* Invisible reCAPTCHA container for Phone Auth */}
      <div id="recaptcha-container"></div>

      {/* Background Glowing Gradients */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 my-6">
        
        {/* BRAND LOGO & HEADER */}
        <div className="text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 mx-auto flex items-center justify-center text-white mb-3 shadow-2xl shadow-blue-500/30 border border-blue-400/30">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">Barham Pro</h1>
          <p className="text-xs text-blue-400 font-bold mt-1">
            منصة صيانة الهواتف والمحلات الأولى في العراق (Firebase Auth)
          </p>
        </div>



        {/* ALERTS & MESSAGES */}
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {shopSubmittedNotice && (
          <div className="mb-4 p-4 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-200 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-black text-sm text-white">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>تم إرسال طلب الانضمام!</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              سيتم مراجعة بيانات المحل من قبل إدارة Barham Pro وتفعيل حسابك تلقائياً.
            </p>
          </div>
        )}

        {/* ACCOUNT TYPE SELECTOR IN REGISTER MODE */}
        {mode === 'register' && (
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-300 mb-2">اختر نوع الحساب المراد إنشاؤه:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setRegisterType('customer');
                  resetAlerts();
                }}
                className={`py-3 px-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  registerType === 'customer'
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <User className="w-4 h-4 text-blue-400" />
                <span>1. زبون</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRegisterType('owner');
                  resetAlerts();
                }}
                className={`py-3 px-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  registerType === 'owner'
                    ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-600/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Store className="w-4 h-4 text-purple-400" />
                <span>2. صاحب محل</span>
              </button>
            </div>
          </div>
        )}

        {/* FORM: LOGIN / REGISTER / FORGOT */}
        {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* LOGIN INPUTS */}
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

                {/* Remember & Forgot Password */}
                <div className="flex justify-between items-center text-xs pt-1">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                    />
                    <span>تذكرني</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      resetAlerts();
                    }}
                    className="text-blue-400 font-bold hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
              </>
            )}

            {/* CUSTOMER REGISTER INPUTS */}
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-bold">كلمة المرور</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-bold">تأكيد كلمة المرور</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* SHOP OWNER REGISTER INPUTS */}
            {mode === 'register' && registerType === 'owner' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-bold">اسم صاحب المحل</label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="م. برهم الجبوري"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-bold">اسم المحل</label>
                    <input
                      type="text"
                      required
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="مركز برهم للصيانة"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-bold">البريد الإلكتروني</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="shop@barhampro.iq"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 font-mono text-left dir-ltr"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-bold">التصنيف الرئيسي للمحل</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none"
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none"
                    >
                      <option value="بغداد">بغداد</option>
                      <option value="أربيل">أربيل</option>
                      <option value="البصرة">البصرة</option>
                      <option value="النجف الأشرف">النجف الأشرف</option>
                      <option value="كربلاء المقدسة">كربلاء المقدسة</option>
                      <option value="الموصل">الموصل</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-bold">العنوان التفصيلي</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="شارع الصناعة - عمارة الهواتف"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* STOREFRONT IMAGE INPUT & PRESETS */}
                <div className="space-y-2 pt-1 border-t border-slate-800/60">
                  <label className="block text-xs text-slate-300 font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-purple-300">
                      <Camera className="w-4 h-4" />
                      <span>صورة واجهة / غلاف المحل</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">اختياري</span>
                  </label>
                  
                  <div className="relative">
                    <input
                      type="url"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="أدخل رابط صورة واجهة المحل أو اختر نموذج..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 pr-10 text-xs text-white focus:outline-none focus:border-purple-500 placeholder-slate-500"
                    />
                    <ImageIcon className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => setCoverUrl('https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80')}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all shrink-0 ${
                        coverUrl === 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80'
                          ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      📷 واجهة صيانة
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverUrl('https://images.unsplash.com/photo-1556742049-0a67f2d42999?w=800&q=80')}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all shrink-0 ${
                        coverUrl === 'https://images.unsplash.com/photo-1556742049-0a67f2d42999?w=800&q=80'
                          ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      📱 معرض هواتف
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverUrl('https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80')}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all shrink-0 ${
                        coverUrl === 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'
                          ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      🛠️ ورشة تقنية
                    </button>
                  </div>

                  {/* Image Preview Thumbnail */}
                  {coverUrl && (
                    <div className="relative h-20 rounded-2xl overflow-hidden border border-slate-800 group bg-slate-950">
                      <img src={coverUrl} alt="معاينة واجهة المحل" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold text-white bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-700">معاينة واجهة المحل</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* FORGOT PASSWORD INPUT */}
            {mode === 'forgot' && (
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-bold">أدخل البريد الإلكتروني لاستعادة حسابك</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-11 pl-4 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
                </div>
              </div>
            )}

            {/* MAIN BUTTON */}
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
                    : 'جاري تنفيذ الطلب...'}
                </span>
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'تسجيل الدخول'}
                    {mode === 'register' && registerType === 'customer' && 'إنشاء حساب زبون'}
                    {mode === 'register' && registerType === 'owner' && 'تقديم طلب انضمام المحل'}
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
                <label className="block text-xs text-slate-300 mb-1 font-bold">أدخل رمز OTP المرسل عبر الرسائل القصيرة SMS (6 أرقام)</label>
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

        {/* GOOGLE & OTP SOCIAL OPTIONS */}
        {mode !== 'forgot' && (
          <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold py-3 rounded-2xl transition-all text-xs flex items-center justify-center gap-3"
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
                resetAlerts();
              }}
              className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold py-3 rounded-2xl transition-all text-xs flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>{mode === 'phone' ? 'العودة لتسجيل البريد' : 'تسجيل الدخول برقم الهاتف OTP'}</span>
            </button>
          </div>
        )}

        {/* MODE SWITCH LINKS */}
        <div className="mt-4 text-center text-xs text-slate-400">
          {mode === 'login' && (
            <p>
              ليس لديك حساب؟{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  resetAlerts();
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
                  resetAlerts();
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
                resetAlerts();
              }}
              className="text-blue-400 font-bold hover:underline"
            >
              العودة إلى صفحة تسجيل الدخول
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
