import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Product } from '../../types';
import { formatIQD } from '../../utils/pdfGenerator';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'zain_cash'>('cash');
  const [orderSuccess, setOrderSuccess] = useState(false);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.priceIQD * item.quantity, 0);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderSuccess(true);
    setTimeout(() => {
      onClearCart();
      setOrderSuccess(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
      <div className="bg-slate-900 border-r border-slate-800 w-full max-w-md h-full flex flex-col justify-between p-6 shadow-2xl text-slate-100 overflow-y-auto">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-400" />
              <h3 className="font-black text-lg text-white">سلة المشتريات</h3>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          {orderSuccess ? (
            <div className="py-12 text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
              <h4 className="text-xl font-bold text-white">تم إرسال الطلب بنجاح!</h4>
              <p className="text-xs text-slate-400">سيتم التواصل معك فوراً لتأكيد التوصيل والتسليم.</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <ShoppingBag className="w-12 h-12 mx-auto stroke-1" />
              <p className="text-sm font-bold">السلة فارغة حالياً</p>
              <p className="text-xs">تصفح المتجر وأضف منتجاتك المفضلة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Items List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-12 h-12 object-contain bg-slate-900 rounded-lg p-1"
                    />
                    <div className="flex-1">
                      <h5 className="font-bold text-white line-clamp-1">{item.product.name}</h5>
                      <span className="text-emerald-400 font-bold">{formatIQD(item.product.priceIQD)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateQty(item.product.id, -1)}
                        className="w-6 h-6 bg-slate-800 rounded text-slate-200 font-bold"
                      >
                        -
                      </button>
                      <span className="font-bold text-white text-xs">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQty(item.product.id, 1)}
                        className="w-6 h-6 bg-slate-800 rounded text-slate-200 font-bold"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleCheckout} className="pt-4 border-t border-slate-800 space-y-3 text-xs">
                <h4 className="font-bold text-slate-200">معلومات التوصيل</h4>
                <input
                  type="text"
                  required
                  placeholder="الاسم الكامل"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
                <input
                  type="tel"
                  required
                  placeholder="رقم الهاتف العراقي"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
                <input
                  type="text"
                  required
                  placeholder="العنوان التفصيلي (المدينة / الشارع)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />

                <div className="pt-2">
                  <label className="block text-slate-400 mb-1">طريقة الدفع:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-2 rounded-xl border text-center font-bold ${
                        paymentMethod === 'cash' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      الدفع عند الاستلام
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('zain_cash')}
                      className={`p-2 rounded-xl border text-center font-bold ${
                        paymentMethod === 'zain_cash' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      زين كاش Zain Cash
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-400">المجموع النهائي:</span>
                  <span className="font-black text-emerald-400 text-lg">{formatIQD(subtotal)}</span>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
                >
                  <span>تأكيد الطلب والشراء</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
