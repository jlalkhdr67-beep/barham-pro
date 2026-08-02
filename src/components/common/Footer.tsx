import React from 'react';
import { Smartphone, Wrench, Phone, MapPin, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">BARHAM <span className="text-blue-500">PRO</span></span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              المنصة المتكاملة الأولى لإدارة محلات صيانة وبيع الهواتف والأجهزة الإلكترونية مع متجر إلكتروني موحد ونظام تتبع صيانة فوري بالفواتير والباركود.
            </p>
            <div className="flex items-center gap-2 text-xs text-blue-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>مربوط بقواعد بيانات Firebase السحابية المشفرة 100%</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-base mb-4 border-r-2 border-blue-500 pr-2">روابط سريعة</h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#shops" className="hover:text-blue-400 transition-colors">دليل المحلات المعتمدة</a></li>
              <li><a href="#marketplace" className="hover:text-blue-400 transition-colors">المتجر الإلكتروني العراقي</a></li>
              <li><a href="#maintenance" className="hover:text-blue-400 transition-colors">طلب صيانة جهاز جديد</a></li>
              <li><a href="#tracking" className="hover:text-blue-400 transition-colors">تتبع حالة الصيانة برقم التذكرة</a></li>
              <li><a href="#offers" className="hover:text-blue-400 transition-colors">العروض والتخفيضات اليومية</a></li>
            </ul>
          </div>

          {/* For Shop Owners */}
          <div>
            <h4 className="text-white font-bold text-base mb-4 border-r-2 border-blue-500 pr-2">لأصحاب المحلات</h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#join" className="hover:text-blue-400 transition-colors">تسجيل محل جديد في المنصة</a></li>
              <li><a href="#pos" className="hover:text-blue-400 transition-colors">نظام الكاشير والفواتير PDF</a></li>
              <li><a href="#barcode" className="hover:text-blue-400 transition-colors">مولد الباركود والـ QR Code</a></li>
              <li><a href="#branches" className="hover:text-blue-400 transition-colors">إدارة الفروع والموظفين والصلاحيات</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold text-base mb-4 border-r-2 border-blue-500 pr-2">الدعم والتواصل</h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <span>العراق - بغداد</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span dir="ltr">07755387770</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© 2026 Barham Pro. جميع الحقوق محفوظة لجمهورية العراق.</p>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>تم التطوير بكل شغف بوساطة</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 mx-0.5" />
            <span className="text-white font-black tracking-widest text-sm bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent px-1">GRG</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
