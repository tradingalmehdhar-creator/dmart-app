import { jsPDF } from 'jspdf';
import { Order, Language } from '../types';

export interface GenerateReceiptPdfOptions {
  order: Order | any;
  language: Language;
}

export function generateOrderReceiptPdf({ order, language }: GenerateReceiptPdfOptions): void {
  const isEn = language === 'en';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Format date & time
  let formattedDate = new Date().toLocaleDateString(isEn ? 'en-MY' : 'ms-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  if (order.createdAt) {
    try {
      const d = new Date(order.createdAt);
      formattedDate = d.toLocaleDateString(isEn ? 'en-MY' : 'ms-MY', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      formattedDate = String(order.createdAt);
    }
  }

  const recipientName =
    order.deliveryAddress?.recipientName || order.customerName || 'Valued Customer';
  const recipientPhone =
    order.deliveryAddress?.phone || order.customerPhone || '012-3456789';
  const formattedAddress =
    order.deliveryAddress?.formattedAddress ||
    `${order.deliveryAddress?.street || order.deliveryAddress || 'Kuala Lumpur'}, ${order.deliveryAddress?.city || order.city || 'Malaysia'}`;
  const deliverySlot =
    order.deliverySlot ? (isEn ? order.deliverySlot : order.deliverySlotMs || order.deliverySlot) : (isEn ? 'Express 2-Hour Delivery' : 'Penghantaran Ekspres 2 Jam');

  const items = order.items && order.items.length > 0 ? order.items : [];
  const subtotal = Number(order.subtotal || order.total || 0);
  const discount = Number(order.discount || 0);
  const deliveryFee = Number(order.deliveryFee !== undefined ? order.deliveryFee : 0);
  const tip = Number(order.tip || 0);
  const total = Number(order.total || subtotal + deliveryFee - discount + tip);
  const pointsRedeemed = Number(order.pointsRedeemed || 0);
  const pointsEarned = Number(order.pointsEarned || Math.round(total * 1));

  // 1. Top Header Banner (Emerald Gradient Style)
  doc.setFillColor(6, 95, 70); // #065f46
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('PASARAYA D-MART MALAYSIA', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(209, 250, 229);
  doc.text(
    isEn
      ? 'Official Grocery Tax Invoice & Delivery Summary'
      : 'Invois Cukai Barangan Runcit Rasmi & Ringkasan Penghantaran',
    margin,
    18
  );
  doc.text('Express 2-Hour Fresh Doorstep Delivery | https://d-mart.my', margin, 23);

  // Top Right Order Badge
  doc.setFillColor(4, 120, 87); // #047857
  doc.roundedRect(pageWidth - margin - 52, 6, 52, 16, 2, 2, 'F');
  doc.setTextColor(253, 230, 138); // amber-200
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`INVOICE: #${order.orderNumber}`, pageWidth - margin - 50, 12);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(formattedDate, pageWidth - margin - 50, 18);

  let currentY = 36;

  // 2. Customer & Delivery Destination Box (2 Columns)
  doc.setFillColor(249, 250, 251); // gray-50
  doc.setDrawColor(229, 231, 235); // gray-200
  doc.roundedRect(margin, currentY, contentWidth, 32, 2, 2, 'FD');

  // Left Column: Customer details
  doc.setTextColor(17, 24, 39); // gray-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(isEn ? 'DELIVERY DESTINATION:' : 'DESTINASI PENGHANTARAN:', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text(recipientName, margin + 4, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99); // gray-600
  const addressLines = doc.splitTextToSize(formattedAddress, 95);
  doc.text(addressLines, margin + 4, currentY + 17);
  doc.text(`Tel: ${recipientPhone}`, margin + 4, currentY + 28);

  // Right Column: Order Details & Payment Method
  const col2X = margin + 105;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(17, 24, 39);
  doc.text(isEn ? 'PAYMENT & FULFILLMENT:' : 'BAYARAN & STATUS:', col2X, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text(
    `${isEn ? 'Time Slot:' : 'Masa:'} ${deliverySlot}`,
    col2X,
    currentY + 12
  );

  let paymentLabel = isEn ? 'Cash on Delivery (COD)' : 'Bayar Waktu Terima (COD)';
  if (order.paymentMethod === 'FPX') {
    paymentLabel = `FPX Online Banking (${order.paymentDetails?.bankName || 'Maybank2u'})`;
  } else if (order.paymentMethod === 'TNG') {
    paymentLabel = 'Touch n Go eWallet';
  }
  doc.text(`${isEn ? 'Payment:' : 'Kaedah:'} ${paymentLabel}`, col2X, currentY + 18);

  const statusText = order.status === 'delivered' ? (isEn ? 'Completed / Delivered' : 'Selesai / Dihantar') : (isEn ? 'Order Confirmed' : 'Disahkan');
  doc.text(`${isEn ? 'Status:' : 'Status:'} ${statusText}`, col2X, currentY + 24);

  currentY += 39;

  // 3. Itemized Purchased Products Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(17, 24, 39);
  doc.text(
    isEn ? 'ITEMIZED GROCERY PURCHASE LIST' : 'SENARAI BARANGAN RUNCIT DIBELI',
    margin,
    currentY
  );

  currentY += 4;

  // Table Header Bar
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(167, 243, 208); // emerald-200
  doc.rect(margin, currentY, contentWidth, 7, 'FD');

  doc.setTextColor(6, 95, 70); // emerald-800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('#', margin + 3, currentY + 4.8);
  doc.text(isEn ? 'Item Description' : 'Keterangan Barangan', margin + 12, currentY + 4.8);
  doc.text(isEn ? 'Unit' : 'Unit', margin + 105, currentY + 4.8);
  doc.text(isEn ? 'Qty' : 'Kuantiti', margin + 128, currentY + 4.8);
  doc.text(isEn ? 'Price (RM)' : 'Harga (RM)', margin + 145, currentY + 4.8);
  doc.text(isEn ? 'Total (RM)' : 'Jumlah (RM)', pageWidth - margin - 4, currentY + 4.8, {
    align: 'right',
  });

  currentY += 7;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  if (items.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, currentY, contentWidth, 8, 'F');
    doc.setTextColor(156, 163, 175);
    doc.text(
      isEn ? 'Standard Supermarket Grocery Package' : 'Pakej Barangan Runcit Standard',
      margin + 12,
      currentY + 5.5
    );
    doc.text(`RM ${subtotal.toFixed(2)}`, pageWidth - margin - 4, currentY + 5.5, {
      align: 'right',
    });
    currentY += 8;
  } else {
    items.forEach((it: any, index: number) => {
      const product = it.product || {};
      const name = isEn
        ? product.nameEn || product.name || 'Grocery Item'
        : product.nameMs || product.name || 'Barangan Runcit';
      const unit = product.unit || 'unit';
      const price = Number(product.price || 0);
      const qty = Number(it.quantity || 1);
      const lineTotal = price * qty;

      // Alternating row background
      if (index % 2 === 1) {
        doc.setFillColor(249, 250, 251); // gray-50
        doc.rect(margin, currentY, contentWidth, 6.5, 'F');
      }

      // Check if we need to wrap or shorten long item names
      const truncatedName = name.length > 55 ? `${name.substring(0, 52)}...` : name;

      doc.setTextColor(17, 24, 39);
      doc.text(String(index + 1), margin + 3, currentY + 4.5);
      doc.text(truncatedName, margin + 12, currentY + 4.5);
      doc.setTextColor(107, 114, 128);
      doc.text(unit, margin + 105, currentY + 4.5);
      doc.setTextColor(17, 24, 39);
      doc.text(String(qty), margin + 130, currentY + 4.5);
      doc.text(price.toFixed(2), margin + 145, currentY + 4.5);
      doc.setFont('helvetica', 'bold');
      doc.text(lineTotal.toFixed(2), pageWidth - margin - 4, currentY + 4.5, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      currentY += 6.5;

      // Multi-page safety (if order has > 25 items)
      if (currentY > pageHeight - 65) {
        doc.addPage();
        currentY = 20;
      }
    });
  }

  // Border bottom for table
  doc.setDrawColor(209, 213, 219);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 6;

  // 4. Financial Breakdown & Grand Total Box
  const summaryBoxWidth = 85;
  const summaryBoxX = pageWidth - margin - summaryBoxWidth;

  // Left Note / Thank you box
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(margin, currentY, contentWidth - summaryBoxWidth - 8, 38, 2, 2, 'FD');

  doc.setTextColor(6, 95, 70);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(
    isEn ? 'CUSTOMER NOTICE & FRESH GUARANTEE' : 'JAMINAN KESEGARAN D-MART',
    margin + 4,
    currentY + 6
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(55, 65, 81);
  const guaranteeText = isEn
    ? 'All fresh fruits, farm vegetables, meats and groceries are inspected for quality before delivery. If any item fails to meet your satisfaction, contact D-mart customer care within 24 hours for instant refund or replacement.'
    : 'Semua sayur, buah dan barangan runcit diperiksa kualiti sebelum penghantaran. Jika ada barangan yang kurang memuaskan, hubungi khidmat pelanggan D-mart dalam tempoh 24 jam untuk bayaran balik atau gantian.';
  const guaranteeLines = doc.splitTextToSize(guaranteeText, contentWidth - summaryBoxWidth - 16);
  doc.text(guaranteeLines, margin + 4, currentY + 12);

  if (pointsEarned > 0) {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.roundedRect(margin + 4, currentY + 26, contentWidth - summaryBoxWidth - 16, 7, 1, 1, 'F');
    doc.setTextColor(146, 64, 14); // amber-800
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(
      isEn
        ? `LOYALTY REWARDS: +${pointsEarned} Points Earned from this order!`
        : `GANJARAN KEAHLIAN: +${pointsEarned} Mata Dikumpul daripada pesanan ini!`,
      margin + 7,
      currentY + 30.5
    );
  }

  // Right Pricing Summary
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(75, 85, 99);

  let rightY = currentY + 5;
  doc.text(isEn ? 'Subtotal:' : 'Jumlah Barangan:', summaryBoxX, rightY);
  doc.text(`RM ${subtotal.toFixed(2)}`, pageWidth - margin, rightY, { align: 'right' });

  if (discount > 0) {
    rightY += 5;
    doc.setTextColor(4, 120, 87); // emerald-700
    doc.text(isEn ? 'Voucher Discount:' : 'Diskaun Baucar:', summaryBoxX, rightY);
    doc.text(`-RM ${discount.toFixed(2)}`, pageWidth - margin, rightY, { align: 'right' });
    doc.setTextColor(75, 85, 99);
  }

  if (pointsRedeemed > 0) {
    rightY += 5;
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text(
      `${isEn ? 'Points Discount' : 'Diskaun Mata'} (${pointsRedeemed} pts):`,
      summaryBoxX,
      rightY
    );
    doc.text(`-RM ${(pointsRedeemed * 0.01).toFixed(2)}`, pageWidth - margin, rightY, {
      align: 'right',
    });
    doc.setTextColor(75, 85, 99);
  }

  rightY += 5;
  doc.text(isEn ? 'Delivery Fee:' : 'Caj Penghantaran:', summaryBoxX, rightY);
  doc.text(
    deliveryFee === 0 ? (isEn ? 'FREE' : 'PERCUMA') : `RM ${deliveryFee.toFixed(2)}`,
    pageWidth - margin,
    rightY,
    { align: 'right' }
  );

  if (tip > 0) {
    rightY += 5;
    doc.text(isEn ? 'Rider Gratuity:' : 'Sumbangan Rider:', summaryBoxX, rightY);
    doc.text(`+RM ${tip.toFixed(2)}`, pageWidth - margin, rightY, { align: 'right' });
  }

  // Grand Total Box
  rightY += 7;
  doc.setFillColor(6, 95, 70); // emerald-800
  doc.roundedRect(summaryBoxX - 2, rightY - 4.5, summaryBoxWidth + 2, 10, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(isEn ? 'GRAND TOTAL:' : 'JUMLAH KESELURUHAN:', summaryBoxX + 2, rightY + 2);
  doc.setFontSize(11);
  doc.text(`RM ${total.toFixed(2)}`, pageWidth - margin - 2, rightY + 2, { align: 'right' });

  // 5. Official Footer
  const footerY = pageHeight - 12;
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.text(
    isEn
      ? 'This is a computer-generated tax invoice. No signature is required. Thank you for shopping with D-mart Malaysia.'
      : 'Invois cukai ini dijana oleh komputer. Tandatangan tidak diperlukan. Terima kasih kerana membeli-belah di D-mart Malaysia.',
    margin,
    footerY
  );
  doc.text(
    `Page 1 of 1 • D-mart Applet ID: ${order.orderNumber}`,
    pageWidth - margin,
    footerY,
    { align: 'right' }
  );

  // Trigger Save / Download
  const filename = `D-Mart-Invoice-${order.orderNumber || 'Receipt'}.pdf`;
  doc.save(filename);
}
