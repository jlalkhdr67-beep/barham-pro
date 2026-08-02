import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  Share2,
  MessageSquare,
  Star,
  Check,
  AlertCircle,
  Copy,
  CheckCircle2,
  Plus,
  Minus,
  QrCode,
  Barcode,
  Store,
  Tag
} from 'lucide-react';
import { Product } from '../../types';
import { formatIQD } from '../../utils/pdfGenerator';
import { generateBarcodeDataUrl, generateQRCodeDataUrl } from '../../utils/barcodeUtils';

interface ProductDetailModalProps {
  product: Product | null;
  shopPhone?: string;
  shopName?: string;
  onClose: () => void;
  onAddToCart?: (product: Product, quantity: number) => void;
  hideAddToCart?: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  shopPhone,
  shopName,
  onClose,
  onAddToCart,
  hideAddToCart = false,
}) => {
  const [selectedImgIndex, setSelectedImgIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [barcodeUrl, setBarcodeUrl] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [addedToCartToast, setAddedToCartToast] = useState<boolean>(false);

  useEffect(() => {
    if (product) {
      setSelectedImgIndex(0);
      setQuantity(1);
      generateCodes();
    }
  }, [product]);

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
    onAddToCart(product, quantity);
    setAddedToCartToast(true);
    setTimeout(() => {
      setAddedToCartToast(false);
    }, 2000);
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
