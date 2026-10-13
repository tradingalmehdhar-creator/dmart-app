import { Order } from '../types';

export interface OrderCsvExportOptions {
  statusFilter?: string;
  paymentFilter?: string;
  dateFilter?: string;
  searchQuery?: string;
}

/**
 * Helper to escape CSV cell according to RFC 4180
 */
function escapeCsvCell(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) {
    return '""';
  }
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exports currently filtered orders into a RFC-4180 compliant CSV file
 * specifically designed for corporate accounting and financial reconciliation.
 */
export function exportOrdersReconciliationCSV(
  orders: Order[],
  options?: OrderCsvExportOptions
): { count: number; totalAmount: number; filename: string } {
  const timestamp = new Date().toISOString();
  const dateStr = timestamp.slice(0, 10);
  const timeStr = timestamp.slice(11, 19).replace(/:/g, '-');

  const headers = [
    'Order Ref',
    'Internal Order ID',
    'Transaction Date',
    'Transaction Time',
    'Customer Name',
    'Customer Phone',
    'Delivery Address',
    'City',
    'Postal Code',
    'Delivery Slot',
    'Order Status',
    'Payment Method',
    'Payment Reference / Bank',
    'Total Items (Units)',
    'Items Summary & Breakdown',
    'Gross Subtotal (MYR)',
    'Delivery Fee (MYR)',
    'Discount / Voucher (MYR)',
    'Rider Tip (MYR)',
    'Net Reconciled Total (MYR)',
    'Financial Settlement Status',
    'Audit Export Timestamp'
  ];

  const rows = orders.map((order) => {
    // Parse order date
    let orderDate = dateStr;
    let orderTime = '00:00:00';
    if (order.createdAt) {
      try {
        const d = new Date(order.createdAt);
        if (!isNaN(d.getTime())) {
          orderDate = d.toISOString().slice(0, 10);
          orderTime = d.toTimeString().slice(0, 8);
        }
      } catch {
        // Fallback to order.createdAt string
        orderDate = String(order.createdAt).slice(0, 10);
      }
    }

    // Items summary
    const totalUnits = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const itemsSummary = order.items
      .map((item) => {
        const name = item.product?.nameEn || item.product?.nameMs || 'Item';
        const qty = item.quantity || 1;
        const price = (item.product?.price || 0).toFixed(2);
        return `${qty}x ${name} (@RM${price})`;
      })
      .join('; ');

    // Settlement status determination for financial auditing
    let settlementStatus = 'Pending Fulfillment';
    const status = (order.status || '').toLowerCase();
    if (status === 'delivered' || status === 'completed') {
      settlementStatus = 'Settled (Completed)';
    } else if (status === 'out_for_delivery') {
      settlementStatus = 'In Transit (Escrow)';
    } else if (status === 'cancelled') {
      settlementStatus = 'Void / Cancelled';
    } else if (status === 'packing' || status === 'preparing') {
      settlementStatus = 'Processing';
    } else if (status === 'submitted' || status === 'received') {
      settlementStatus = 'Authorized / Queued';
    }

    // Payment details formatting
    let paymentRef = order.paymentMethod || 'FPX';
    if (order.paymentDetails?.bankName) {
      paymentRef += ` (${order.paymentDetails.bankName})`;
    } else if (order.paymentDetails?.tngRef) {
      paymentRef += ` (Ref: ${order.paymentDetails.tngRef})`;
    }

    return [
      escapeCsvCell(order.orderNumber || order.id),
      escapeCsvCell(order.id),
      escapeCsvCell(orderDate),
      escapeCsvCell(orderTime),
      escapeCsvCell(order.deliveryAddress?.recipientName || 'Customer'),
      escapeCsvCell(order.deliveryAddress?.phone || '—'),
      escapeCsvCell(order.deliveryAddress?.street || '—'),
      escapeCsvCell(order.deliveryAddress?.city || 'Kuala Lumpur'),
      escapeCsvCell(order.deliveryAddress?.postcode || '—'),
      escapeCsvCell(order.deliverySlot || 'Standard Delivery'),
      escapeCsvCell(order.status || 'unknown'),
      escapeCsvCell(order.paymentMethod || 'COD'),
      escapeCsvCell(paymentRef),
      escapeCsvCell(totalUnits),
      escapeCsvCell(itemsSummary),
      escapeCsvCell(order.subtotal ? order.subtotal.toFixed(2) : '0.00'),
      escapeCsvCell(order.deliveryFee ? order.deliveryFee.toFixed(2) : '0.00'),
      escapeCsvCell(order.discount ? order.discount.toFixed(2) : '0.00'),
      escapeCsvCell(order.tip ? order.tip.toFixed(2) : '0.00'),
      escapeCsvCell(order.total ? order.total.toFixed(2) : '0.00'),
      escapeCsvCell(settlementStatus),
      escapeCsvCell(timestamp)
    ];
  });

  // Calculate reconciliation total amount
  const totalAmount = orders.reduce((acc, o) => acc + (o.total || 0), 0);

  // Construct CSV content with UTF-8 BOM so Excel opens Malaysian special characters smoothly
  const csvBody = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const bom = '\uFEFF';
  const csvContent = bom + csvBody;

  // File naming with optional filter slug
  let filterSlug = 'all';
  if (options?.statusFilter && options.statusFilter !== 'all') {
    filterSlug = options.statusFilter;
  }
  if (options?.paymentFilter && options.paymentFilter !== 'all') {
    filterSlug += `_${options.paymentFilter}`;
  }
  const filename = `Dmart_Orders_Reconciliation_${filterSlug}_${dateStr}_${timeStr}.csv`;

  // Trigger browser download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    count: orders.length,
    totalAmount,
    filename
  };
}
