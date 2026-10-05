import React, { useState } from 'react';
import { 
  Package, 
  RotateCcw, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Store, 
  ShoppingBag, 
  Star, 
  Eye, 
  CreditCard, 
  MapPin, 
  ArrowRight,
  Check,
  MessageSquarePlus,
  MessageSquare,
  Receipt,
  Download,
} from 'lucide-react';
import { Order, Language, CustomerFeedback } from '../types';
import { translations } from '../data/translations';
import { RateOrderModal } from './RateOrderModal';
import { OrderReceiptModal } from './OrderReceiptModal';
import { generateOrderReceiptPdf } from '../utils/pdfReceiptExport';

interface OrderHistoryViewProps {
  orders: Order[];
  language: Language;
  onReorder: (order: Order) => void;
  onViewOrderTracking: (order: Order) => void;
  onGoHome: () => void;
  onRateOrder?: (orderId: string, feedback: CustomerFeedback) => void;
}

export const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({
  orders,
  language,
  onReorder,
  onViewOrderTracking,
  onGoHome,
  onRateOrder,
}) => {
  const t = translations[language];
  const [reorderedOrderId, setReorderedOrderId] = useState<string | null>(null);
  const [rateModalOrder, setRateModalOrder] = useState<Order | null>(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState<boolean>(false);
  const [receiptModalOrder, setReceiptModalOrder] = useState<Order | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat(language === 'en' ? 'en-MY' : 'ms-MY', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const handleReorderClick = (order: Order) => {
    onReorder(order);
    setReorderedOrderId(order.id);
    setTimeout(() => {
      setReorderedOrderId(null);
    }, 2500);
  };

  const handleOpenRateModal = (order: Order) => {
    setRateModalOrder(order);
    setIsRateModalOpen(true);
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.statusDelivered}</span>
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>{t.statusOutForDelivery}</span>
          </span>
        );
      case 'packing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
            <Package className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.statusPacking}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span>{t.statusSubmitted}</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-700 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-white/5 rounded-full pointer-events-none blur-2xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full text-xs font-bold text-emerald-100 backdrop-blur-xs">
              <Package className="w-3.5 h-3.5 text-emerald-200" />
              <span>{t.allPastOrders}</span>
              <span className="bg-emerald-950/40 text-amber-300 px-1.5 py-0.2 rounded-full text-[11px] font-black">
                {orders.length}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {t.orderHistory}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
              {t.orderHistorySubtitle}
            </p>
          </div>

          <button
            type="button"
            id="order-history-back-to-shop-btn"
            onClick={onGoHome}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Store className="w-4 h-4 text-emerald-700" />
            <span>{language === 'en' ? 'Back to Supermarket' : 'Kembali ke Pasaraya'}</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-gray-900">
              {t.noOrderHistoryTitle}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {t.noOrderHistoryDesc}
            </p>
          </div>
          <button
            type="button"
            onClick={onGoHome}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Store className="w-4 h-4" />
            <span>{t.startShoppingNow}</span>
          </button>
        </div>
      ) : (
        /* Orders List */
        <div className="space-y-4">
          {orders.map((order) => {
            const isReordered = reorderedOrderId === order.id;
            const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
            const isDelivered = order.status === 'delivered' || order.orderStatus === 'delivered';
            const customerFeedbackList = order.customerFeedback || [];
            const hasFeedback = customerFeedbackList.length > 0;
            const latestFeedback = hasFeedback ? customerFeedbackList[customerFeedbackList.length - 1] : null;

            return (
              <div
                key={order.id}
                id={`order-history-card-${order.id}`}
                className="bg-white rounded-2xl border border-gray-200/90 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all overflow-hidden"
              >
                {/* Order Top Bar: Number, Date, Status */}
                <div className="bg-gray-50/80 px-4 sm:px-6 py-3.5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0">
                      #
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-gray-900 tracking-tight">
                          {order.orderNumber}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span>{formatDate(order.createdAt)}</span>
                        </span>
                        <span>•</span>
                        <span>
                          {order.paymentMethod === 'COD'
                            ? 'Cash on Delivery'
                            : order.paymentMethod === 'TNG'
                            ? "Touch 'n Go eWallet"
                            : 'Online Banking (FPX)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons: Rate Order (if delivered), Track & Reorder */}
                  <div className="flex items-center flex-wrap gap-2">
                    {/* Rate Order Button - Available after delivery is marked as 'delivered' */}
                    {isDelivered && (
                      <button
                        type="button"
                        id={`rate-order-btn-${order.id}`}
                        onClick={() => handleOpenRateModal(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 hover:border-amber-400 bg-amber-50 hover:bg-amber-100/90 text-amber-950 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                        title={language === 'en' ? 'Rate this delivered order' : 'Nilai pesanan yang telah dihantar ini'}
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{language === 'en' ? 'Rate Order' : 'Nilai Pesanan'}</span>
                        {latestFeedback && (
                          <span className="bg-amber-200/90 text-amber-950 text-[10px] px-1.5 py-0.2 rounded-full font-black ml-0.5">
                            {latestFeedback.rating}★
                          </span>
                        )}
                      </button>
                    )}

                    {/* View Receipt / Invoice & PDF Button */}
                    <button
                      type="button"
                      id={`view-receipt-btn-${order.id}`}
                      onClick={() => {
                        setReceiptModalOrder(order);
                        setIsReceiptModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 hover:border-amber-400 bg-amber-50 hover:bg-amber-100/90 text-amber-950 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                      title={language === 'en' ? 'View receipt and export as PDF document' : 'Lihat resit dan eksport sebagai dokumen PDF'}
                    >
                      <Receipt className="w-3.5 h-3.5 text-amber-800" />
                      <span>{language === 'en' ? 'Receipt / PDF' : 'Resit / PDF'}</span>
                    </button>

                    <button
                      type="button"
                      id={`view-order-details-${order.id}`}
                      onClick={() => onViewOrderTracking(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/70 text-gray-700 hover:text-emerald-900 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                      title={t.viewTracking}
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{t.viewTracking}</span>
                    </button>

                    <button
                      type="button"
                      id={`reorder-btn-${order.id}`}
                      onClick={() => handleReorderClick(order)}
                      disabled={isReordered}
                      className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
                        isReordered
                          ? 'bg-emerald-700 text-white ring-2 ring-emerald-400/50'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                      }`}
                      title={t.reorderNotice}
                    >
                      {isReordered ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-200" />
                          <span>{language === 'en' ? 'Added to Cart!' : 'Ditambah ke Troli!'}</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{t.reorderAll}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Order Body: Purchased Items preview */}
                <div className="p-4 sm:p-6 space-y-4">
                  {/* Items Grid */}
                  <div className="space-y-2.5">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      {itemsCount} {t.itemsInOrder} {language === 'en' ? 'ordered' : 'dipesan'}:
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-gray-50/70 border border-gray-100 hover:border-gray-200 transition-colors"
                        >
                          <img
                            src={item.product.image}
                            alt={language === 'en' ? item.product.nameEn : item.product.nameMs}
                            className="w-12 h-12 rounded-lg object-cover bg-white shrink-0 border border-gray-100"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-gray-900 truncate">
                              {language === 'en' ? item.product.nameEn : item.product.nameMs}
                            </h4>
                            <div className="flex items-center justify-between text-[11px] text-gray-500 mt-0.5">
                              <span className="font-semibold text-gray-700">
                                {item.quantity} × RM {item.product.price.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-gray-400 truncate max-w-[80px]">
                                {language === 'en' ? item.product.amountEn : item.product.amountMs}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Location & Customer Feedback preview */}
                  <div className="pt-3 border-t border-gray-100 grid grid-cols-1 gap-3 text-xs">
                    <div className="flex items-start gap-2 text-gray-600 bg-gray-50/60 p-2.5 rounded-xl border border-gray-100">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-bold text-gray-800 block text-[11px]">
                          {order.deliveryAddress.buildingUnit ? `${order.deliveryAddress.buildingUnit}, ` : ''}
                          {order.deliveryAddress.street}
                        </span>
                        <span className="text-[10px] text-gray-500 block">
                          {order.deliveryAddress.city}, {order.deliveryAddress.postcode}
                        </span>
                      </div>
                    </div>

                    {/* Customer Feedback / Rating Section */}
                    {latestFeedback ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-50/70 via-amber-50/40 to-emerald-50/50 p-3 rounded-xl border border-amber-200/80">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3.5 h-3.5 ${
                                    s <= latestFeedback.rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-black text-amber-950 font-mono">
                              {latestFeedback.rating}.0 / 5.0
                            </span>
                            <span className="text-[10px] font-bold bg-amber-200/80 text-amber-950 px-2 py-0.2 rounded-full border border-amber-300/50">
                              {language === 'en' ? 'Customer Feedback' : 'Maklum Balas Pelanggan'}
                            </span>
                            {customerFeedbackList.length > 1 && (
                              <span className="text-[10px] text-gray-500 font-medium">
                                ({customerFeedbackList.length} {language === 'en' ? 'ratings recorded' : 'penilaian direkod'})
                              </span>
                            )}
                          </div>
                          {latestFeedback.comment && (
                            <p className="text-xs text-gray-800 italic mt-1 leading-relaxed">
                              "{latestFeedback.comment}"
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200/50">
                          <button
                            type="button"
                            onClick={() => handleOpenRateModal(order)}
                            className="text-xs font-bold text-amber-900 hover:text-amber-950 underline decoration-amber-400 cursor-pointer"
                          >
                            {language === 'en' ? 'Rate Again / Update' : 'Nilai Semula / Kemas Kini'}
                          </button>
                          <div className="text-right">
                            <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">
                              {t.totalAmount}
                            </span>
                            <span className="text-sm font-black text-emerald-800">
                              RM {order.total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : order.review ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3.5 h-3.5 ${
                                    s <= order.review!.rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-black text-emerald-950 font-mono">
                              {order.review.rating}.0 Rating
                            </span>
                          </div>
                          {order.review.comment && (
                            <p className="text-xs text-gray-700 italic">
                              "{order.review.comment}"
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenRateModal(order)}
                            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                          >
                            {language === 'en' ? 'Rate Order' : 'Nilai Pesanan'}
                          </button>
                          <div className="text-right">
                            <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">
                              {t.totalAmount}
                            </span>
                            <span className="text-sm font-black text-emerald-800">
                              RM {order.total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : isDelivered ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-amber-50/60 p-3 rounded-xl border border-dashed border-amber-200">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          </div>
                          <span className="text-xs text-amber-900 font-medium">
                            {language === 'en'
                              ? 'Delivered! Share a 5-star rating and brief comment about your delivery.'
                              : 'Telah dihantar! Kongsi penilaian 5-bintang dan ulasan ringkas anda.'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 justify-between sm:justify-end">
                          <button
                            type="button"
                            id={`rate-order-invite-btn-${order.id}`}
                            onClick={() => handleOpenRateModal(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-amber-950 text-xs font-bold rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer"
                          >
                            <Star className="w-3 h-3 fill-amber-950 text-amber-950" />
                            <span>{language === 'en' ? 'Rate Order' : 'Nilai Pesanan'}</span>
                          </button>
                          <div className="text-right">
                            <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">
                              {t.totalAmount}
                            </span>
                            <span className="text-sm font-black text-emerald-800">
                              RM {order.total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                        <div className="flex items-center gap-1.5 text-emerald-800 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {language === 'en' ? order.deliverySlot : order.deliverySlotMs}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">
                            {t.totalAmount}
                          </span>
                          <span className="text-sm font-black text-emerald-800">
                            RM {order.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5-Star Rate Order Modal */}
      <RateOrderModal
        isOpen={isRateModalOpen}
        order={rateModalOrder}
        language={language}
        onClose={() => {
          setIsRateModalOpen(false);
          setRateModalOrder(null);
        }}
        onSubmitFeedback={(orderId, feedback) => {
          if (onRateOrder) {
            onRateOrder(orderId, feedback);
          }
          if (rateModalOrder && rateModalOrder.id === orderId) {
            setRateModalOrder({
              ...rateModalOrder,
              customerFeedback: [...(rateModalOrder.customerFeedback || []), feedback],
            });
          }
        }}
      />

      {/* Order Receipt & PDF Invoice Modal */}
      <OrderReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setReceiptModalOrder(null);
        }}
        order={receiptModalOrder}
        language={language}
      />
    </div>
  );
};
