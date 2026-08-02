import React, { useState } from 'react';
import {
  ShieldCheck,
  Store,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  KeyRound,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const InitialAdminSetup: React.FC = () => {
  const { registerFirstAdmin } = useAuth();

  const [name, setName] = useState('مالك النظام الرئيسي');
  const [email, setEmail] = useState('example@gmail.com');
  const [phone, setPhone] = useState('07700000000');
  const [password, setPassword] = useState('qazwsxedc');
  const [confirmPassword, setConfirmPassword] = useState('qazwsxedc');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('كلمة المرور وتأكيد كلمة المرور غير متطابقتين!');
      return;
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 خانات على الأقل.');
      return;
    }

    setLoading(true);

    try {
      await registerFirstAdmin({
        email: email.trim(),
        pass: password,
        name: name.trim() || 'مالك النظام الرئيسي',
        phone: phone.trim() || '07700000000'
      });
      setSuccess(true);
    } catch (err: any) {
      console.error('Failed to setup initial admin:', err);
      if (err?.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة جداً (يجب أن تكون 6 خانات على الأقل).');
      } else {
        setError(err?.message || 'حدث خطأ أثناء إنشاء حساب المالك الرئيسي.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white" dir="rtl">
      
      {/* Background Lights */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Setup Card */}
      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 my-6">
        
        {/* Header Badge */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 mx-auto flex items-center justify-center text-white mb-3 shadow-2xl shadow-amber-500/30 border border-amber-400/30">
            <ShieldCheck className="w-9 h-9" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>إعداد مسؤول المنظومة الأول (Initial System Setup)</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
            إنشاء حساب المالك الرئيسي للنظام
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed max-w-sm mx-auto">
            لا يوجد مسؤول (Admin) مسجل في Firestore حالياً. يرجى إدخال بيانات المالك الرئيسي لاعتماده كمسؤول أول للسيستم.
          </p>
        </div>

        {/* Info Box explaining Auth vs Firestore */}
        <div className="mb-5 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-blue-400">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>ملاحظة مهمة حول بريد تسجيل الدخول:</span>
          </div>
          <p className="text-[11px] text-blue-200/90 leading-relaxed">
            تظل بيانات الاعتماد محفوظة في Firebase Authentication حتى بعد تصفير مجموعات Firestore. إذا استخدمت بريداً مسجلاً سابقاً، أدخل كلمة المرور الصحيحة الخاصة به لتسجيل الدخول واكتسابه صلاحية المالك، أو اختر بريداً جديداً.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>فشل إكمال إعداد المسؤول:</span>
            </div>
            <p className="text-[11px] text-red-300 whitespace-pre-line leading-relaxed pr-6">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>تم إنشاء وتفعيل حساب المالك بنجاح! جاري الانتقال إلى لوحة التحكم...</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-300 mb-1 font-bold">اسم المالك الرئيسي / المدير العام</label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="المهندس برهام (المدير العام)"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-11 pl-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <User className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs text-slate-300 font-bold">البريد الإلكتروني الخاص بالمالك</label>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span>مقترحات:</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('example@gmail.com');
                    setPassword('qazwsxedc');
                    setConfirmPassword('qazwsxedc');
                  }}
                  className="hover:text-amber-400 underline font-mono"
                >
                  example@gmail.com
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@system.com');
                    setPassword('qazwsxedc');
                    setConfirmPassword('qazwsxedc');
                  }}
                  className="hover:text-amber-400 underline font-mono"
                >
                  admin@system.com
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@system.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-11 pl-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07701234567"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-11 pl-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono text-left dir-ltr"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-11 pl-4 text-xs text-white focus:outline-none focus:border-amber-500"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-11 pl-4 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-amber-500/20 transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>جاري إنشاء وتجهيز حساب المالك الرئيسي...</span>
            ) : (
              <>
                <span>تأكيد وإنشاء حساب المالك الرئيسي</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-[11px] text-slate-500 border-t border-slate-800/80 pt-4">
          🔒 هذا الحساب يمنح التحكم الأقصى بالنظام والمصادقة وتفعيل صيانة المحلات.
        </div>
      </div>
    </div>
  );
};
