import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Wrench, Loader2, CheckCircle2 } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onFinishRef.current();
          }, 400);
          return 100;
        }
        return prev + 2;
      });
    }, 35);

    return () => clearInterval(timer);
  }, []);

  const getStatusText = (prog: number) => {
    if (prog < 30) return 'جاري تهيئة التطبيق والنظام...';
    if (prog < 60) return 'جاري الاتصال بالسيرفر السحابي...';
    if (prog < 90) return 'جاري مزامنة بيانات المحلات والصيانة...';
    if (prog < 100) return 'إعداد واجهة المستخدم...';
    return 'تم التحميل بنجاح!';
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden select-none"
      dir="rtl"
    >
      {/* Background Animated Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/25 rounded-full blur-[110px] pointer-events-none animate-pulse"></div>
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-cyan-500/15 rounded-full blur-[90px] pointer-events-none"></div>

      {/* Center Logo with Blue Glow & Rotating Ring */}
      <div className="relative mb-8 group cursor-pointer" onClick={onFinish}>
        {/* Animated Rotating Outer Glow Ring */}
        <div className="absolute -inset-5 rounded-full border-2 border-dashed border-blue-500/40 animate-[spin_10s_linear_infinite] pointer-events-none"></div>

        <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl blur-2xl opacity-75 animate-tilt group-hover:opacity-100 transition-all duration-1000"></div>
        <div className="relative w-28 h-28 rounded-3xl bg-slate-900 border-2 border-blue-500/60 flex items-center justify-center shadow-[0_0_60px_rgba(37,99,235,0.7)]">
          <Wrench className="w-14 h-14 text-blue-400 animate-bounce" />
          <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-2 py-0.5 rounded-xl text-xs font-black shadow-lg">
            Pro
          </div>
        </div>
      </div>

      {/* App Name & Slogan */}
      <div className="text-center space-y-3 z-10 max-w-sm">
        <div className="inline-flex items-center gap-2 bg-blue-600/15 border border-blue-500/40 px-3 py-1 rounded-full text-blue-400 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>الإصدار المطور 2026</span>
        </div>

        <h1 className="text-4xl font-black tracking-tight text-white">
          Barham <span className="text-blue-500">Pro</span>
        </h1>

        <p className="text-sm font-bold text-slate-300 leading-relaxed">
          منصة إدارة المحلات والصيانة الذكية
        </p>
      </div>

      {/* Prominent Progress Bar & Spinning Loader */}
      <div className="mt-10 w-72 sm:w-80 space-y-3 z-10 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-blue-500/30 shadow-2xl">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
          <div className="flex items-center gap-2">
            {progress < 100 ? (
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span className={progress === 100 ? 'text-emerald-400 font-extrabold' : 'text-slate-200'}>
              {getStatusText(progress)}
            </span>
          </div>
          <span className="text-blue-400 font-mono font-extrabold text-sm">{progress}%</span>
        </div>

        {/* Outer Track */}
        <div className="h-3.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-700 p-0.5 shadow-inner relative">
          {/* Inner Glowing Progress Bar */}
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-400 rounded-full transition-all duration-150 ease-out shadow-[0_0_16px_rgba(59,130,246,0.9)] relative"
            style={{ width: `${progress}%` }}
          >
            {/* Light shimmer line effect */}
            <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

