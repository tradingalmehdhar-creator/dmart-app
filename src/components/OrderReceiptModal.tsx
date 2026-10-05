import React, { useState } from 'react';
import {
  Receipt,
  X,
  Printer,
  Copy,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Phone,
  CreditCard,
  Banknote,
  Sparkles,
  ShoppingBag,
  Package,
  HeartHandshake,
  Tag,
  ShieldCheck,
  Check,
  Download,
  FileText,
  Loader2,
} from 'lucide-react';
import { Order, Language } from '../types';
import { translations } from '../data/translations';
import { generateOrderReceiptPdf } from '../utils/pdfReceiptExport';

interface OrderReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  language: Language;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  isOpen,
  onClose,
  order,
  language,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const isEn = language === 'en';
  const t = translations[language];

  if (!isOpen || !order) return null;

  // Format date & time nicely
  const formatDate = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleDateString(isEn ? 'en-MY' : 'ms-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(isEn ? 'en-MY' : 'ms-MY', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const recipientName = order.deliveryAddress?.recipientName || order.customerName || 'Valued Customer';
  const recipientPhone = order.deliveryAddress?.phone || order.customerPhone || '012-3456789';
  const formattedAddress =
    order.deliveryAddress?.formattedAddress ||
    `${order.deliveryAddress?.street || order.deliveryAddress || 'Address not specified'}, ${order.deliveryAddress?.city || order.city || 'Kuala Lumpur'}`;

  const items = order.items && order.items.length > 0 ? order.items : [];
  const itemCount = items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);

  const subtotal = Number(order.subtotal || order.total || 0);
  const discount = Number(order.discount || 0);
  const deliveryFee = Number(order.deliveryFee !== undefined ? order.deliveryFee : 0);
  const tip = Number(order.tip || 0);
  const total = Number(order.total || subtotal + deliveryFee - discount + tip);

  const pointsRedeemed = Number(order.pointsRedeemed || 0);
  const pointsEarned = Number(order.pointsEarned || Math.round(total * 1));

  const handleCopyReceipt = () => {
    const text = `
D-MART SUPERMARKET OFFICIAL RECEIPT
-----------------------------------
Order: #${order.orderNumber}
Date: ${formatDate(order.createdAt)}
Customer: ${recipientName} (${recipientPhone})
Delivery To: ${formattedAddress}

ITEMS:
${items.map((it: any) => `- ${it.product?.name || 'Item'} x${it.quantity || 1} @ RM ${(it.product?.price || 0).toFixed(2)} = RM ${((it.product?.price || 0) * (it.quantity || 1)).toFixed(2)}`).join('\n')}

Subtotal: RM ${subtotal.toFixed(2)}
Discount: -RM ${discount.toFixed(2)}
Delivery Fee: ${deliveryFee === 0 ? 'FREE' : `RM ${deliveryFee.toFixed(2)}`}
Grand Total: RM ${total.toFixed(2)}
Payment: ${order.paymentMethod || 'COD'}
Points Earned: +${pointsEarned} PTS
-----------------------------------
Thank you for shopping at D-mart!
    `.trim();

    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    try {
      setIsExportingPdf(true);
      generateOrderReceiptPdf({ order, language });
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to export receipt PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shadow-inner text-amber-300">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg leading-tight">
                  {isEn ? 'Order Receipt & Invoice' : 'Resit & Invois Pesanan'}
                </h3>
                <span className="bg-emerald-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {order.status === 'delivered'
                    ? (isEn ? 'Delivered' : 'Selesai')
                    : (isEn ? 'Confirmed' : 'Disahkan')}
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-mono mt-0.5">
                #{order.orderNumber} • {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Header Export PDF Action */}
            <button
              type="button"
              id="header-export-pdf-btn"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title={isEn ? 'Export Order Summary as PDF document' : 'Eksport Ringkasan Pesanan sebagai dokumen PDF'}
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : pdfSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-900 stroke-[3]" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {pdfSuccess
                  ? (isEn ? 'Saved PDF' : 'PDF Disimpan')
                  : (isEn ? 'Export PDF' : 'Eksport PDF')}
              </span>
              <span className="sm:hidden">PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Store Logo & Verification Header */}
          <div className="text-center pb-3 border-b border-dashed border-gray-200">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full text-emerald-800 font-black text-xs mb-1">
              <span>🏬 PASARAYA D-MART MALAYSIA</span>
            </div>
            <p className="text-[11px] text-gray-500">
              {isEn ? 'Official Digital Grocery Tax Invoice' : 'Invois Cukai Barangan Runcit Digital'}
            </p>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">
              Ref: {order.orderNumber} • Auth: Verified
            </p>
          </div>

          {/* Customer & Delivery Summary Card */}
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900 block text-xs">
                    {recipientName}
                  </span>
                  <p className="text-gray-600 text-[11px] leading-relaxed mt-0.5">
                    {formattedAddress}
                  </p>
                  <p className="text-gray-500 text-[11px] mt-0.5">
                    📞 {recipientPhone}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 shrink-0">
                {order.deliverySlot ? (isEn ? order.deliverySlot : order.deliverySlotMs || order.deliverySlot) : (isEn ? 'Express Delivery' : 'Penghantaran Ekspres')}
              </span>
            </div>

            {/* Payment Method Details */}
            <div className="pt-2 border-t border-gray-200/70 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-gray-600">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-semibold text-gray-800">
                  {order.paymentMethod === 'COD' && `💵 ${t.cod}`}
                  {order.paymentMethod === 'FPX' && `🏦 ${t.fpx} (${order.paymentDetails?.bankName || 'Online Banking'})`}
                  {order.paymentMethod === 'TNG' && `📱 ${t.tng}`}
                  {!order.paymentMethod && '💵 Cash on Delivery'}
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {order.paymentMethod === 'COD'
                  ? (isEn ? 'Pay upon arrival' : 'Bayar waktu sampai')
                  : (isEn ? 'Payment Confirmed' : 'Bayaran Disahkan')}
              </span>
            </div>
          </div>

          {/* Itemized List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-bold text-gray-900 pb-1 border-b border-gray-200">
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
                <span>{isEn ? 'Purchased Items' : 'Senarai Barangan'} ({itemCount > 0 ? itemCount : items.length} {isEn ? 'items' : 'unit'})</span>
              </span>
              <span>{isEn ? 'Subtotal' : 'Jumlah'}</span>
            </div>

            {items.length === 0 ? (
              <div className="p-3 text-center text-gray-400 bg-gray-50 rounded-xl">
                {isEn ? 'Standard Supermarket Grocery Package' : 'Pakej Barangan Runcit Standard'}
              </div>
            ) : (
              <div className="divide-y divide-gray-100 space-y-1">
                {items.map((item: any, idx: number) => {
                  const product = item.product || {};
                  const price = Number(product.price || 0);
                  const qty = Number(item.quantity || 1);
                  const lineTotal = price * qty;

                  return (
                    <div key={product.id || idx} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name || 'item'}
                            className="w-9 h-9 rounded-lg object-cover border border-gray-200 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">
                            {isEn ? (product.nameEn || product.name || 'Item') : (product.nameMs || product.name || 'Item')}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            RM {price.toFixed(2)} × {qty} {product.unit || 'unit'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-black text-gray-900 text-xs">
                          RM {lineTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pricing Calculation Breakdown */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>{t.subtotal}</span>
              <span className="font-semibold text-gray-900">RM {subtotal.toFixed(2)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3 text-emerald-600" />
                  <span>{t.discount} {order.voucherCode ? `(${order.voucherCode})` : ''}</span>
                </span>
                <span>-RM {discount.toFixed(2)}</span>
              </div>
            )}

            {pointsRedeemed > 0 && (
              <div className="flex justify-between text-amber-700 font-semibold">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>{isEn ? 'Points Discount' : 'Diskaun Mata'} ({pointsRedeemed} pts)</span>
                </span>
                <span>-RM {(pointsRedeemed * 0.01).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-gray-600">
              <span>{t.deliveryFee}</span>
              <span className="font-semibold">
                {deliveryFee === 0 ? (
                  <span className="text-emerald-700 font-bold">{t.freeDelivery || 'FREE'}</span>
                ) : (
                  `RM ${deliveryFee.toFixed(2)}`
                )}
              </span>
            </div>

            {tip > 0 && (
              <div className="flex justify-between text-amber-800 font-semibold">
                <span className="flex items-center gap-1">
                  <HeartHandshake className="w-3 h-3 text-amber-600" />
                  <span>{t.driverGratuity}</span>
                </span>
                <span>+RM {tip.toFixed(2)}</span>
              </div>
            )}

            {/* Loyalty Points Earned Notification */}
            {pointsEarned > 0 && (
              <div className="pt-1.5 pb-0.5 border-t border-dashed border-emerald-200 flex items-center justify-between text-[11px] text-amber-900 font-bold">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500 fill-amber-300" />
                  <span>{isEn ? 'Loyalty Cashback Points Earned:' : 'Mata Ganjaran Diperolehi:'}</span>
                </span>
                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300 text-[10px]">
                  +{pointsEarned} {isEn ? 'PTS' : 'MATA'}
                </span>
              </div>
            )}

            {/* Grand Total */}
            <div className="pt-2 border-t-2 border-emerald-200 flex items-center justify-between text-sm sm:text-base font-black">
              <span className="text-gray-900">{isEn ? 'Grand Total Price' : 'Jumlah Keseluruhan'}</span>
              <span className="text-emerald-700 text-lg">RM {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Quick PDF Document Export Callout Card */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border border-emerald-200 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h5 className="font-bold text-xs text-emerald-950 leading-tight">
                  {isEn ? 'Save Order PDF for Your Records' : 'Simpan PDF Pesanan untuk Rekod Anda'}
                </h5>
                <p className="text-[10.5px] text-emerald-800 leading-snug">
                  {isEn
                    ? 'Download official tax invoice with full itemized breakdown'
                    : 'Muat turun invois rasmi dengan senarai lengkap barangan'}
                </p>
              </div>
            </div>

            <button
              type="button"
              id="card-export-pdf-btn"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all shrink-0 cursor-pointer disabled:opacity-60"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{isEn ? 'Generating...' : 'Menjana...'}</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{isEn ? 'Downloaded' : 'Dimuat Turun'}</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Save PDF' : 'Simpan PDF'}</span>
                </>
              )}
            </button>
          </div>

          {/* Footer note */}
          <p className="text-[10px] text-center text-gray-400">
            {isEn
              ? 'Thank you for choosing D-mart. Goods sold are 100% fresh and quality assured.'
              : 'Terima kasih kerana memilih D-mart. Barangan dijamin segar dan berkualiti tinggi.'}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary Download / Export PDF Button */}
            <button
              type="button"
              id="footer-export-pdf-btn"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-60"
              title={isEn ? 'Download Order Summary as PDF Document' : 'Muat Turun Ringkasan Pesanan sebagai Dokumen PDF'}
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-200" />
                  <span>{isEn ? 'Exporting PDF...' : 'Mengeksport PDF...'}</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-200 stroke-[3]" />
                  <span>{isEn ? 'PDF Saved!' : 'PDF Disimpan!'}</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-emerald-100" />
                  <span>{isEn ? 'Export as PDF' : 'Eksport sebagai PDF'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyReceipt}
              className="px-3 py-2 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span>{isEn ? 'Copied!' : 'Disalin!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-600" />
                  <span>{isEn ? 'Copy' : 'Salin'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer hidden sm:flex"
            >
              <Printer className="w-3.5 h-3.5 text-gray-600" />
              <span>{isEn ? 'Print' : 'Cetak'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            {isEn ? 'Done' : 'Selesai'}
          </button>
        </div>
      </div>
    </div>
  );
};
