import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Upload, Check, Camera, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MockDataService } from '../../services/MockDataService';
import { uploadProductImage } from '../../utils/storageUtils';
import { ProfileChangeRequest } from '../../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, updateUserProfile } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const [pendingReq, setPendingReq] = useState<ProfileChangeRequest | null>(null);

  useEffect(() => {
    if (isOpen && userProfile) {
      setDisplayName(userProfile.displayName || '');
      setPhotoURL(
        userProfile.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
      );
      setSaveSuccess('');
      setErrorMsg('');

      if (userProfile.role === 'owner') {
        const requests = MockDataService.getProfileChangeRequests();
        const found = requests.find((r) => r.userId === userProfile.uid && r.status === 'pending');
        setPendingReq(found || null);
      } else {
        setPendingReq(null);
      }
    }
  }, [isOpen, userProfile]);

  if (!isOpen || !userProfile) return null;

  const isCustomer = userProfile.role === 'customer';
  const isAdmin = userProfile.role === 'admin';
  const isOwner = userProfile.role === 'owner';

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('يرجى اختيار ملف صورة صالح (JPG, PNG, WEBP...)');
      return;
    }
    setErrorMsg('');
    setUploadingImg(true);
    try {
      const url = await uploadProductImage(file, 'avatars');
      setPhotoURL(url);
    } catch (err) {
      console.error(err);
      setErrorMsg('فشل رفع الصورة، يرجى المحاولة مرة أخرى.');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg('يرجى إدخال الاسم الكامل');
      return;
    }

    try {
      if (isCustomer || isAdmin) {
        // Direct instant update for Customer and Admin
        await updateUserProfile({
          displayName: displayName.trim(),
          photoURL,
        });
        setSaveSuccess('تم تحديث الملف الشخصي بنجاح! ✨');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else if (isOwner) {
        // Submit request to Admin for Owner
        if (pendingReq) {
          setErrorMsg('لديك طلب سابق قيد المراجعة حالياً من المالك.');
          return;
        }

        MockDataService.addProfileChangeRequest({
          userId: userProfile.uid,
          userName: userProfile.displayName,
          userEmail: userProfile.email,
          shopId: userProfile.shopId,
          requestedDisplayName: displayName.trim(),
          requestedPhotoURL: photoURL,
          currentDisplayName: userProfile.displayName,
          currentPhotoURL: userProfile.photoURL,
        });

        const newRequests = MockDataService.getProfileChangeRequests();
        const created = newRequests.find((r) => r.userId === userProfile.uid && r.status === 'pending');
        setPendingReq(created || null);

        setSaveSuccess('تم إرسال طلب تغيير الاسم والصورة لمالك المنصة بنجاح! سيتم الاعتماد عند الموافقة لمرة واحدة.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء حفظ البيانات، يرجى المحاولة لاحقاً.');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 relative text-slate-100 shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shadow-lg">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">تعديل الملف الشخصي والصورة</h3>
            <p className="text-xs text-slate-400">
              {isCustomer
                ? 'يمكنك تغيير اسمك وصورتك الشخصية بحرية في أي وقت'
                : isOwner
                ? 'أصحاب المحلات يقدمون طلب موافقة للمالك للتعديل لمرة واحدة'
                : 'إدارة وتحديث البيانات الشخصية'}
            </p>
          </div>
        </div>

        {/* Notifications Banners */}
        {saveSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-2xl font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-2xl font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Owner Pending Request Warning Banner */}
        {isOwner && pendingReq && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2 text-xs text-amber-300">
            <div className="flex items-center gap-2 font-black text-amber-400 text-sm">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>طلب التغيير قيد المراجعة لدى مالك المنصة</span>
            </div>
            <p className="text-slate-300">
              لقد قمت بتقديم طلب سابق لتحديث بياناتك وهو الآن بانتظار موافقة الآدمن.
            </p>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-amber-500/20 grid grid-cols-2 gap-2 text-[11px] text-slate-300 mt-2">
              <div>
                <span className="text-slate-500 block">الاسم المطلوب:</span>
                <span className="font-bold text-amber-300">{pendingReq.requestedDisplayName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">تاريخ الطلب:</span>
                <span>{new Date(pendingReq.createdAt).toLocaleDateString('ar-IQ')}</span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Avatar Preview & Upload Drag & Drop Section */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-bold">رفع صورة شخصية جديدة من جهازك <span className="text-blue-400">*</span></label>
            
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all flex flex-col items-center justify-center gap-3 relative bg-slate-950/60 ${
                isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-blue-500/40 overflow-hidden flex items-center justify-center text-blue-400 font-black text-3xl shadow-2xl">
                  {photoURL ? (
                    <img src={photoURL} alt="الصورة الشخصية" className="w-full h-full object-cover" />
                  ) : (
                    <span>{displayName ? displayName.charAt(0) : 'U'}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-lg shadow-md border border-slate-900">
                  <Camera className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-slate-200 text-sm">اضغط أو اسحب الصورة هنا لرفعها من جهازك</p>
                <p className="text-[11px] text-slate-500">تدعم جميع صيغ الصور (JPG, PNG, WEBP)</p>
              </div>

              <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95">
                <Upload className="w-4 h-4" />
                <span>{uploadingImg ? 'جاري معالجة ورفع الصورة...' : 'اختر صورة من الجهاز'}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingImg || (isOwner && !!pendingReq)}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </label>
            </div>
          </div>

          {/* Preset Avatars */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-bold">أو اختر صورة رمزية جاهزة:</label>
            <div className="grid grid-cols-5 gap-2">
              {[
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
                'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80',
                'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80'
              ].map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isOwner && !!pendingReq}
                  onClick={() => setPhotoURL(url)}
                  className={`h-12 rounded-xl overflow-hidden border-2 transition-all relative ${
                    photoURL === url ? 'border-blue-500 scale-105 shadow-lg shadow-blue-500/20' : 'border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`رمز ${idx + 1}`} className="w-full h-full object-cover" />
                  {photoURL === url && (
                    <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Image URL Input */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">أو ضع رابط صورة مباشرة (اختياري)</label>
            <input
              type="url"
              disabled={isOwner && !!pendingReq}
              placeholder="https://example.com/photo.jpg"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Display Name Input */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">الاسم الكامل الظاهر <span className="text-red-400">*</span></label>
            <input
              type="text"
              required
              disabled={isOwner && !!pendingReq}
              placeholder="أدخل الاسم الكامل"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-bold text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Account Details */}
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>دور الحساب:</span>
            <span className="font-bold text-blue-400">{isCustomer ? 'زبون' : isOwner ? 'صاحب محل' : 'مالك النظام'}</span>
          </div>

          {/* Submit Action */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={uploadingImg || (isOwner && !!pendingReq)}
              className={`flex-1 font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                isOwner && !!pendingReq
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-blue-600/20 active:scale-95'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {isCustomer || isAdmin
                  ? 'حفظ وتحديث الملف الشخصي'
                  : pendingReq
                  ? 'طلب التغيير قيد المراجعة'
                  : 'إرسال طلب التعديل للمالك'}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 px-5 rounded-xl transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
