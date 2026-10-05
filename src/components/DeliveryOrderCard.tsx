import React from 'react';
import {
  Bike,
  Car,
  MapPin,
  Clock,
  Banknote,
  CheckCircle2,
  Package,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { DeliveryJobOrder, Language } from '../types';

interface DeliveryOrderCardProps {
  order: DeliveryJobOrder;
  language: Language;
  onAcceptOrder: (order: DeliveryJobOrder) => void;
  onViewDetails: (order: DeliveryJobOrder) => void;
  isAcceptedByMe?: boolean;
}

export const DeliveryOrderCard: React.FC<DeliveryOrderCardProps> = ({
  order,
  language,
  onAcceptOrder,
  onViewDetails,
  isAcceptedByMe = false,
}) => {
  const isEn = language === 'en';

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 hover:border-emerald-500/70 p-3.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 group relative overflow-hidden">
      {/* Top Bar: Order ID, Urgency & Earnings Payout */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono font-black text-xs text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
            #{order.orderNumber}
          </span>
          {order.deliveryOtpVerified ? (
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
              ✓ OTP Verified
            </span>
          ) : (
            <span className="bg-amber-50 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
              🔐 OTP Required
            </span>
          )}
          {order.urgency === 'express' ? (
            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-300/60">
              <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
              <span>{isEn ? 'Express 45m' : 'Ekspres 45m'}</span>
            </span>
          ) : (
            <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
              {isEn ? '2-Hour Slot' : 'Slot 2-Jam'}
            </span>
          )}
        </div>

        {/* Driver Earning Badge */}
        <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded-lg shrink-0">
          <span className="text-[10px] text-emerald-700 font-semibold">{isEn ? 'Earning' : 'Gaji'}:</span>
          <span className="font-black text-xs text-emerald-700 font-mono">
            +RM {order.earningsPayout.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Customer & Location Details */}
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h5 className="font-bold text-xs text-gray-900 truncate">
              {order.customerName}
            </h5>
            <div className="flex items-center gap-1 text-[11px] text-gray-600 truncate mt-0.5">
              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">{order.deliveryAddress}, {order.city}</span>
            </div>
          </div>
          
          <div className="text-right shrink-0">
            <div className="text-[11px] font-bold text-gray-900 flex items-center justify-end gap-1">
              <span>{order.distanceKm} km</span>
            </div>
            <div className="text-[10px] text-gray-500 flex items-center justify-end gap-1">
              <Clock className="w-2.5 h-2.5 text-gray-400" />
              <span>~{order.estimatedTimeMin} min</span>
            </div>
          </div>
        </div>

        {/* Groceries Summary */}
        <div className="bg-gray-50 rounded-xl p-2 text-[11px] text-gray-600 flex items-center gap-2 border border-gray-100">
          <Package className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-semibold text-gray-800 shrink-0">{order.itemsCount} {isEn ? 'items' : 'brg'}:</span>
          <span className="truncate text-gray-500">{order.itemsSummary}</span>
        </div>
      </div>

      {/* Bottom Footer: Payment Type & Action Button */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100 gap-2">
        {/* Payment notice */}
        <div className="min-w-0">
          {order.paymentMethod === 'cod' ? (
            <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1 truncate">
              <Banknote className="w-3 h-3 text-amber-600 shrink-0" />
              <span>COD: RM {order.codAmountToCollect?.toFixed(2)}</span>
            </span>
          ) : (
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 truncate">
              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>{isEn ? 'Prepaid (No cash)' : 'Prabayar (Tiada tunai)'}</span>
            </span>
          )}
        </div>

        {/* Small Accept Order or View Details Button */}
        {isAcceptedByMe ? (
          <button
            type="button"
            onClick={() => onViewDetails(order)}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition-all active:scale-95 shadow-xs flex items-center gap-1 shrink-0"
          >
            <span>{isEn ? 'Active Order →' : 'Pesanan Aktif →'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAcceptOrder(order)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black transition-all shadow-xs shadow-emerald-600/20 flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>{isEn ? 'Accept Order' : 'Terima Pesanan'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
