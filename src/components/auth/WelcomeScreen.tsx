import React from 'react';
import { ShieldCheck, ArrowRight, Store, Wrench, Sparkles, UserPlus, LogIn, CheckCircle2 } from 'lucide-react';

interface WelcomeScreenProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onLoginClick, onRegisterClick }) => {
  return (
    <div className="min-h-[85vh] bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden" dir="rtl">
      {/* Background Lights */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-12 shadow-2xl relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center backdrop-blur-xl">
        {/* Left Column: Visual Illustration */}
        <div className="relative rounded-2xl overflow-hidden border border-blue-500/30 bg-slate-950 p-6 space-y-6 flex flex-col justify-between group">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/30 via-slate-950 to-slate-950 opacity-90"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-blue-600/20 border border-blue-500/40 px-3 py-1 rounded-full text-blue-400 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>النظام الرسمي الموثق</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
              ● متصل بـ Firebase Cloud
            </span>
          </div>

          <div className="relative z-10 text-center py-6 space-y-4">
            <img
              src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80"
              alt="Barham Pro Management"
              className="w-full h-48 object-cover rounded-xl border border-slate-800 shadow-xl group-hover:scale-105 transition-transform duration-500"
            />
            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-300 font-bold pt-2">
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 text-center">
                <Store className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <span>إدارة المحلات</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 text-center">
                <Wrench className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <span>تتبع الصيانة</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 text-center">
                <Sparkles className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <span>الفواتير الرقمية</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
            <div className="flex items-center gap-1 text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>حفظ فورياً في Firestore DB</span>
            </div>
            <span className="font-mono text-blue-400">v2.6.0</span>
          </div>
        </div>

        {/* Right Column: Welcome Text & Primary Actions */}
        <div className="space-y-6 text-right">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 font-black text-xl">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">Barham Pro</h2>
              <span className="text-[11px] text-blue-400 font-bold">منصة إدارة المحلات والصيانة</span>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              مرحباً بك في <span className="text-blue-500">Barham Pro</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
              منصة متكاملة لإدارة المحلات والمتاجر والصيانة بكل سهولة. يمكنك متابعة الأجهزة المعطلة، الفواتير المالية، العروض الترويجية وطلب قطع الغيار بضغطة زر.
            </p>
          </div>

          {/* Features Bullets */}
          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>متابعة حالة الصيانة لحظة بلحظة برقم التكت</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
              <span>متجر قطع غيار إلكترونية شامل لكافة المحافظات</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>نظام ضمان وفواتير مالية بالدينار العراقي IQD</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <button
              onClick={onLoginClick}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 px-6 rounded-2xl shadow-xl shadow-blue-600/25 transition-all text-xs sm:text-sm flex items-center justify-center gap-2 group"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول</span>
              <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onRegisterClick}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-3.5 px-6 rounded-2xl transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>إنشاء حساب جديد</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
