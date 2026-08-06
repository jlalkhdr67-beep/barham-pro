import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  Share2,
  MessageSquare,
  Check,
  AlertCircle,
  CheckCircle2,
  Plus,
  Minus,
  Store,
  Calendar,
  BookmarkCheck,
  Send,
  MapPin,
  Phone,
  User,
  Clock
} from 'lucide-react';
import { Product, UserProfile, ProductOrder } from '../../types';
import { formatIQD } from '../../utils/pdfGenerator';
import { generateBarcodeDataUrl, generateQRCodeDataUrl } from '../../utils/barcodeUtils';
import { MockDataService } from '../../services/MockDataService';

interface ProductDetailModalProps {
  product: Product | null;
  shopPhone?: string;
  shopName?: string;
  onClose: () => void;
  onAddToCart?: (product: Product, quantity: number) => void;
  hideAddToCart?: boolean;
  userProfile?: UserProfile | null;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  shopPhone,
  shopName,
  onClose,
  onAddToCart,
  hideAddToCart = false,
  userProfile,
}) => {
  const [selectedImgIndex, setSelectedImgIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [barcodeUrl, setBarcodeUrl] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [addedToCartToast, setAddedToCartToast] = useState<boolean>(false);

  // Reservation Form State
  const [showReservationForm, setShowReservationForm] = useState<boolean>(false);
  const [resName, setResName] = useState<string>(userProfile?.displayName || '');
  const [resPhone, setResPhone] = useState<string>(userProfile?.phoneNumber || '');
  const [resAddress, setResAddress] = useState<string>(userProfile?.address || '');
  const [resNotes, setResNotes] = useState<string>('');
  const [resError, setResError] = useState<string>('');
  const [resSuccessMessage, setResSuccessMessage] = useState<boolean>(false);

  useEffect(() => {
    if (product) {
      setSelectedImgIndex(0);
      setQuantity(1);
      setShowReservationForm(false);
      setResSuccessMessage(false);
      setResError('');
      if (userProfile) {
        setResName(userProfile.displayName || '');
        setResPhone(userProfile.phoneNumber || '');
        setResAddress(userProfile.address || '');
      }
      generateCodes();
    }
  }, [product, userProfile]);

  const generateCodes = async () => {
    if (!product) return;
    const code = product.qrCode || product.barcode || product.id;
    const bUrl = generateBarcodeDataUrl(code);
    const qUrl = await generateQRCodeDataUrl(code);
    setBarcodeUrl(bUrl);
    setQrCodeUrl(qUrl);
  };

  if (!product) return null;

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80'];

  const isOutOfStock = product.quantity <= 0;
  const isLowStock = product.quantity > 0 && product.quantity < 5;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `${product.name} بسعر ${formatIQD(product.priceIQD)} في متجر Barham Pro`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleAddToCartClick = () => {
    if (onAddToCart) {
      onAddToCart(product, quantity);
      setAddedToCartToast(true);
      setTimeout(() => {
        setAddedToCartToast(false);
      }, 2000);
    }
  };

  const handleSendReservation = (e: React.FormEvent) => {
    e.preventDefault();
    setResError('');

    if (!resName.trim() || !resPhone.trim() || !resAddress.trim()) {
      setResError('يرجى كتابة كافة الحقول الإلزامية (الاسم الكامل، رقم الهاتف، والعنوان التفصيلي).');
      return;
    }

    const newResOrder: ProductOrder = {
      id: 'ORD-' + Date.now(),
      orderNumber: 'RES-' + Math.floor(100000 + Math.random() * 900000),
      shopId: product.shopId || 'shop_demo_1',
      shopName: shopName || product.shopName || 'محل برهم للصيانة والإلكترونيات',
      customerId: userProfile?.uid || `guest_${Date.now()}`,
      customerName: resName.trim(),
      customerPhone: resPhone.trim(),
      customerAddress: resAddress.trim(),
      customerNotes: resNotes.trim() || undefined,
      items: [
        {
          productId: product.id,
          productName: product.name,
          priceIQD: product.priceIQD,
          quantity: quantity,
          image: images[0]
        }
      ],
      totalIQD: product.priceIQD * quantity,
      status: 'pending',
      paymentMethod: 'cash',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isReservation: true
    };

    MockDataService.addProductOrder(newResOrder);
    setResSuccessMessage(true);
  };

  const whatsappMessage = encodeURIComponent(
    `مرحباً، أود الاستفسار عن القطعة/المنتج: ${product.name} (السعر: ${formatIQD(product.priceIQD)}) من متجركم على Barham Pro.`
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl text-slate-100 relative my-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-20 bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white p-2.5 rounded-2xl backdrop-blur-md border border-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8">
          {/* Left Column: Image Gallery & QR/Barcode */}
          <div className="space-y-4">
            <div className="h-64 sm:h-80 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 p-4 flex items-center justify-center relative group">
              <img
                src={images[selectedImgIndex]}
                alt={product.name}
                className="max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute top-3 right-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-bold px-3 py-1 rounded-full">
                {product.category}
              </span>
            </div>

            {/* Thumbnail Selectors */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImgIndex(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-slate-950 ${
                      selectedImgIndex === idx ? 'border-blue-500 scale-95 shadow-lg shadow-blue-500/20' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* QR Code and Barcode Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="w-12 h-12 bg-white p-1 rounded-lg" />}
                <div>
                  <div className="font-bold text-slate-200">الباركود الرسمي:</div>
                  <div className="font-mono text-blue-400 text-[11px]">{product.barcode || 'BRH-882190'}</div>
                </div>
              </div>

              {barcodeUrl && (
                <div className="bg-white p-1 rounded-lg">
                  <img src={barcodeUrl} alt="Barcode" className="h-10 max-w-[100px]" />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Product Details & Buying Actions */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              {/* Shop badge if provided */}
              {(shopName || product.shopName) && (
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                  <Store className="w-3.5 h-3.5" />
                  <span>{shopName || product.shopName}</span>
                </div>
              )}

              <h2 className="text-2xl font-black text-white leading-tight">{product.name}</h2>

              {/* Stock Status Badge */}
              <div className="flex items-center gap-3">
                {isOutOfStock ? (
                  <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>غير متوفر حالياً</span>
                  </span>
                ) : isLowStock ? (
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>كمية قليلة متبقية ({product.quantity} قطع)</span>
                  </span>
                ) : (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>متوفر للطلب المباشر ({product.quantity} قطعة)</span>
                  </span>
                )}
              </div>

              {/* Price Display */}
              <div className="pt-2">
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                  {formatIQD(product.priceIQD)}
                </div>
                {product.compareAtPriceIQD && (
                  <div className="text-xs text-slate-500 line-through mt-0.5">
                    السعر السابق: {formatIQD(product.compareAtPriceIQD)}
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                {product.description || 'قطعة غيار وإكسسوار أصلي معتمد مع ضمان حقيقي وفاتورة معتمدة من منصة Barham Pro.'}
              </p>
            </div>

            {/* Quantity Selector & Main Buttons */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              {/* Toast Messages */}
              {addedToCartToast && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl flex items-center justify-between">
                  <span>تم إضافة المنتج إلى السلة بنجاح!</span>
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
              )}

              {copiedLink && (
                <div className="p-2.5 bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold rounded-xl text-center">
                  تم نسخ رابط المنتج بنجاح!
                </div>
              )}

              {/* RESERVATION BUTTON OR FORM */}
              {showReservationForm ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs sm:text-sm">
                      <BookmarkCheck className="w-4 h-4" />
                      <span>حجز المنتج والاستلام من المحل</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReservationForm(false);
                        setResSuccessMessage(false);
                      }}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      إلغاء
                    </button>
                  </div>

                  {resSuccessMessage ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>تم إرسال طلب الحجز بنجاح! 🎉</span>
                      </div>
                      <p className="leading-relaxed text-slate-300">
                        تم إرسال بيانات حجزك لـ <strong className="text-white">{product.name}</strong> إلى المحل. سيقوم صاحب المحل بمراجعة الطلب والموافقة عليه، وسيوصلك إشعار فوري بموعد وساعة استلام المنتج من المحل.
                      </p>
                      <button
                        type="button"
                        onClick={onClose}
                        className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs"
                      >
                        حسناً، فهمت
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSendReservation} className="space-y-3 text-xs">
                      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-2.5 rounded-xl text-[11px] leading-relaxed flex items-start gap-2">
                        <Store className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>تنويه هام:</strong> التسليم واستلام المنتج المحجوز يكون من مقر المحل مباشرة بعد موافقة صاحب المحل وتحديد الموعد والتاريخ.
                        </div>
                      </div>

                      {resError && (
                        <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-xl text-[11px]">
                          {resError}
                        </div>
                      )}

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">الاسم الكامل *</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={resName}
                            onChange={(e) => setResName(e.target.value)}
                            placeholder="أدخل اسمك الثلاثي..."
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl py-2 pr-8 pl-3 text-white text-xs"
                          />
                          <User className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">رقم الهاتف *</label>
                        <div className="relative">
                          <input
                            type="tel"
                            required
                            value={resPhone}
                            onChange={(e) => setResPhone(e.target.value)}
                            placeholder="0770XXXXXXX"
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl py-2 pr-8 pl-3 text-white text-xs dir-ltr text-right"
                          />
                          <Phone className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">العنوان التفصيلي (المدينة / المنطقة) *</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={resAddress}
                            onChange={(e) => setResAddress(e.target.value)}
                            placeholder="مثال: بغداد - الكرادة"
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl py-2 pr-8 pl-3 text-white text-xs"
                          />
                          <MapPin className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">ملاحظات إضافية (اختياري)</label>
                        <input
                          type="text"
                          value={resNotes}
                          onChange={(e) => setResNotes(e.target.value)}
                          placeholder="أي تفاصيل خاصة بالحجز..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white text-xs"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 text-xs"
                      >
                        <Send className="w-4 h-4" />
                        <span>إرسال الحجز للمحل الآن</span>
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowReservationForm(true)}
                  disabled={isOutOfStock}
                  className={`w-full py-3.5 px-6 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xl ${
                    isOutOfStock
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                  }`}
                >
                  <BookmarkCheck className="w-4 h-4" />
                  <span>حجز المنتج (استلام من المحل)</span>
                </button>
              )}

              {/* Quantity Counter & Add to Cart Button */}
              {!hideAddToCart && (
                <>
                  <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-300">الكمية المطلوبة:</span>
                    <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-sm text-white w-6 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(product.quantity || 99, q + 1))}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        disabled={quantity >= (product.quantity || 99)}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCartClick}
                    disabled={isOutOfStock}
                    className={`w-full py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xl ${
                      isOutOfStock
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-blue-600/25'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>إضافة إلى سلة الشراء ({formatIQD(product.priceIQD * quantity)})</span>
                  </button>
                </>
              )}

              {/* Secondary Actions (WhatsApp & Share) */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://wa.me/${shopPhone || '9647700000000'}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>التواصل مع المحل</span>
                </a>

                <button
                  type="button"
                  onClick={handleShare}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4 text-blue-400" />
                  <span>مشاركة المنتج</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
