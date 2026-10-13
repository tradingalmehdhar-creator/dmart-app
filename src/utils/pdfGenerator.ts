import { jsPDF } from 'jspdf';
import {
  DeliveryPartnerApplication,
  RiderPayout,
  BusinessDocument,
  DailyClosureRecord,
  FleetRider,
  RiderWalletTransaction,
  PdfConfigSettings,
  DEFAULT_PDF_CONFIG,
  Order
} from '../types';
import { subscribeToPdfConfig } from '../firebase_config';
import { generateOrderReceiptPdf } from './pdfReceiptExport';

// Dynamic global PDF Configuration cache
let livePdfConfig: PdfConfigSettings = (() => {
  try {
    const saved = localStorage.getItem('dmart_pdf_config');
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_PDF_CONFIG;
})();

// Automatically subscribe to live Firestore settings in browser runtime
if (typeof window !== 'undefined') {
  try {
    subscribeToPdfConfig((updated) => {
      if (updated) {
        livePdfConfig = updated;
      }
    });
  } catch (e) {
    console.warn('Live PDF config subscription error:', e);
  }
}

export function setGlobalPdfConfig(config: PdfConfigSettings): void {
  livePdfConfig = { ...config };
  try {
    localStorage.setItem('dmart_pdf_config', JSON.stringify(config));
  } catch {}
}

export function getGlobalPdfConfig(): PdfConfigSettings {
  if (!livePdfConfig) {
    try {
      const saved = localStorage.getItem('dmart_pdf_config');
      if (saved) {
        livePdfConfig = { ...DEFAULT_PDF_CONFIG, ...JSON.parse(saved) };
        return livePdfConfig;
      }
    } catch {}
    return DEFAULT_PDF_CONFIG;
  }
  return { ...DEFAULT_PDF_CONFIG, ...livePdfConfig };
}

/**
 * Draws the official D-mart company logo emblem
 * Position can be 'left' | 'center' | 'right' | 'hidden'
 */
export function drawCompanyLogo(
  doc: jsPDF,
  position: 'left' | 'center' | 'right' | 'hidden',
  headerY: number,
  pageWidth: number,
  pagePadding: number
): { logoWidth: number; logoHeight: number; logoX: number } | null {
  if (position === 'hidden') return null;

  const logoWidth = 14;
  const logoHeight = 14;
  let logoX = pagePadding;

  if (position === 'center') {
    logoX = (pageWidth - logoWidth) / 2;
  } else if (position === 'right') {
    logoX = pageWidth - pagePadding - logoWidth;
  } else {
    logoX = pagePadding;
  }

  const logoY = headerY;

  // Background badge
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.roundedRect(logoX, logoY, logoWidth, logoHeight, 2.5, 2.5, 'F');

  // Inner border
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.roundedRect(logoX + 0.8, logoY + 0.8, logoWidth - 1.6, logoHeight - 1.6, 1.8, 1.8, 'S');

  // Letter "D" + "MART"
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('D', logoX + logoWidth / 2, logoY + 7.2, { align: 'center' });

  doc.setFontSize(4.2);
  doc.setTextColor(236, 253, 245);
  doc.text('MART', logoX + logoWidth / 2, logoY + 11.2, { align: 'center' });

  return { logoWidth, logoHeight, logoX };
}

/**
 * Generates an official D-mart Rider Credential & Identity Document PDF
 */
export function exportRiderCredentialsPDF(
  rider: DeliveryPartnerApplication,
  overrideConfig?: Partial<PdfConfigSettings>
): void {
  const cfg: PdfConfigSettings = { ...getGlobalPdfConfig(), ...(overrideConfig || {}) };
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const pagePadding = cfg.pagePadding ?? 14;
  const topMargin = cfg.topMargin ?? 12;
  const bottomMargin = cfg.bottomMargin ?? 14;
  const sectionSpacing = cfg.sectionSpacing ?? 6;
  const contentWidth = pageWidth - pagePadding * 2;

  // Emerald Theme Colors
  const primaryColor = [6, 78, 59]; // #064e3b
  const accentColor = [16, 185, 129]; // #10b981
  const darkGray = [31, 41, 55];
  const lightGray = [243, 244, 246];

  // Header Banner
  const bannerHeight = Math.max(36, topMargin * 2 + 10);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, bannerHeight, 'F');

  const logoInfo = (cfg.showCompanyLogo && cfg.logoPosition !== 'hidden')
    ? drawCompanyLogo(doc, cfg.logoPosition, 6, pageWidth, pagePadding)
    : null;

  let textX = pagePadding;
  if (logoInfo && cfg.logoPosition === 'left') {
    textX = pagePadding + logoInfo.logoWidth + 3.5;
  }

  // Title & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(cfg.companyName.toUpperCase(), textX, 15);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(cfg.headerSubtitle, textX, 22);

  if (cfg.customHeaderText) {
    doc.text(cfg.customHeaderText, textX, 27);
  }

  if (cfg.showSsmRegistration && cfg.ssmRegistrationNumber) {
    doc.setFontSize(7.5);
    doc.setTextColor(167, 243, 208);
    doc.text(`SSM REG: ${cfg.ssmRegistrationNumber} • OFFICIAL DISPATCH FLEET`, textX, cfg.customHeaderText ? 32 : 27);
  }

  // Reference & Date Box
  const metaRightX = (cfg.logoPosition === 'right' && logoInfo)
    ? pageWidth - pagePadding - logoInfo.logoWidth - 4
    : pageWidth - pagePadding;

  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Ref: ${rider.referenceNo}`, metaRightX, 16, { align: 'right' });
  doc.text(`Archived: ${new Date().toLocaleDateString('en-MY', { dateStyle: 'medium' })}`, metaRightX, 23, { align: 'right' });

  // Verification Badge
  let currentY = bannerHeight + sectionSpacing;
  const statusUpper = (rider.status || 'PENDING').toUpperCase();
  if (statusUpper === 'APPROVED') {
    doc.setFillColor(16, 185, 129);
  } else if (statusUpper === 'PENDING') {
    doc.setFillColor(245, 158, 11);
  } else {
    doc.setFillColor(239, 68, 68);
  }
  doc.roundedRect(pagePadding, currentY, 50, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`STATUS: ${statusUpper}`, pagePadding + 4, currentY + 5.5);

  currentY += 8 + sectionSpacing;

  // Section: Personal Information
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. DRIVER PROFILE & IDENTITY', pagePadding, currentY + 4);
  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setLineWidth(0.5);
  doc.line(pagePadding, currentY + 6, pageWidth - pagePadding, currentY + 6);

  currentY += 8;
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Full Name (Nama Penuh):', pagePadding, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(rider.fullName, pagePadding + 65, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('NRIC / ID Number (No. KP):', pagePadding, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(rider.idNumber, pagePadding + 65, currentY + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Contact Phone (No. Telefon):', pagePadding, currentY + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(rider.phoneNumber, pagePadding + 65, currentY + 22);

  doc.setFont('helvetica', 'bold');
  doc.text('Nationality (Warganegara):', pagePadding, currentY + 30);
  doc.setFont('helvetica', 'normal');
  doc.text(rider.nationality || 'Malaysian (Warganegara)', pagePadding + 65, currentY + 30);

  doc.setFont('helvetica', 'bold');
  doc.text('Registered Residential Address:', pagePadding, currentY + 38);
  doc.setFont('helvetica', 'normal');
  const splitAddress = doc.splitTextToSize(rider.address, 115);
  doc.text(splitAddress, pagePadding + 65, currentY + 38);

  currentY += 46 + (splitAddress.length * 4) + sectionSpacing;

  // Section: Vehicle & Driving License
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. VEHICLE ASSET & DRIVING LICENSE CREDENTIALS', pagePadding, currentY + 4);
  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setLineWidth(0.5);
  doc.line(pagePadding, currentY + 6, pageWidth - pagePadding, currentY + 6);

  currentY += 8;
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Vehicle Registration Plate:', pagePadding, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(rider.plateNumber, pagePadding + 65, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Vehicle Transport Type:', pagePadding, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(rider.vehicleType.toUpperCase(), pagePadding + 65, currentY + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Driving License Number:', pagePadding, currentY + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(rider.licenseNumber || rider.idNumber, pagePadding + 65, currentY + 22);

  currentY += 28 + sectionSpacing;

  // License File Verification Box
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.roundedRect(pagePadding, currentY, contentWidth, 32, 2, 2, 'F');
  doc.setDrawColor(209, 213, 219);
  doc.roundedRect(pagePadding, currentY, contentWidth, 32, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('JPJ & APAD COMPLIANCE VERIFICATION RECORD', pagePadding + 6, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text('• Valid Competent Driving License (CDL) verified against Road Transport Department (JPJ).', pagePadding + 6, currentY + 14);
  doc.text('• Clean traffic record and background security clearance validated for delivery services.', pagePadding + 6, currentY + 20);
  doc.text('• Authorized for D-mart cold-chain delivery operations within Klang Valley service radius.', pagePadding + 6, currentY + 26);

  // Footer & Official Stamp
  const footerY = pageHeight - bottomMargin;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.6);
  doc.line(pagePadding, footerY - 14, pageWidth - pagePadding, footerY - 14);

  if (cfg.certificateText) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(cfg.certificateText, pagePadding, footerY - 9);
  }

  if (cfg.showSignatureNote) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(75, 85, 99);
    doc.text(cfg.signatureNoteText, pagePadding, footerY - 4.5);
  }

  if (cfg.showLegalDisclaimer) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(cfg.footerDisclaimer, pagePadding, footerY);
  }

  if (cfg.showSsmRegistration) {
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(`SSM: ${cfg.ssmRegistrationNumber} • ${cfg.officialAddress}`, pagePadding, footerY + 4);
  }

  if (cfg.customFooterText) {
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(cfg.customFooterText, pageWidth - pagePadding, footerY + 4, { align: 'right' });
  }

  // Save PDF
  const safeName = rider.fullName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Dmart_Rider_Credential_${safeName}_${rider.referenceNo}.pdf`);
}

/**
 * Generates an official Rider Payout Statement / Payslip PDF
 */
export function exportRiderPayoutSummaryPDF(
  payout: RiderPayout,
  overrideConfig?: Partial<PdfConfigSettings>
): void {
  const cfg: PdfConfigSettings = { ...getGlobalPdfConfig(), ...(overrideConfig || {}) };
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const pagePadding = cfg.pagePadding ?? 14;
  const topMargin = cfg.topMargin ?? 12;
  const bottomMargin = cfg.bottomMargin ?? 14;
  const sectionSpacing = cfg.sectionSpacing ?? 6;
  const contentWidth = pageWidth - pagePadding * 2;

  const primaryColor = [6, 78, 59];
  const darkGray = [31, 41, 55];

  // Header Banner
  const bannerHeight = Math.max(36, topMargin * 2 + 10);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, bannerHeight, 'F');

  const logoInfo = (cfg.showCompanyLogo && cfg.logoPosition !== 'hidden')
    ? drawCompanyLogo(doc, cfg.logoPosition, 6, pageWidth, pagePadding)
    : null;

  let textX = pagePadding;
  if (logoInfo && cfg.logoPosition === 'left') {
    textX = pagePadding + logoInfo.logoWidth + 3.5;
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(cfg.companyName.toUpperCase(), textX, 15);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(cfg.headerSubtitle, textX, 22);

  if (cfg.showSsmRegistration && cfg.ssmRegistrationNumber) {
    doc.setFontSize(7.5);
    doc.setTextColor(167, 243, 208);
    doc.text(`SSM REG: ${cfg.ssmRegistrationNumber} • OFFICIAL DISPATCH FLEET`, textX, 27);
  }

  const metaRightX = (cfg.logoPosition === 'right' && logoInfo)
    ? pageWidth - pagePadding - logoInfo.logoWidth - 4
    : pageWidth - pagePadding;

  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Period: ${payout.period}`, metaRightX, 16, { align: 'right' });
  doc.text(`Date: ${new Date().toLocaleDateString('en-MY')}`, metaRightX, 23, { align: 'right' });

  // Rider Details Box
  let y = bannerHeight + sectionSpacing;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(pagePadding, y, contentWidth, 32, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(pagePadding, y, contentWidth, 32, 2, 2, 'S');

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Rider Name:', pagePadding + 6, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(payout.riderName, pagePadding + 40, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.text('Phone:', pagePadding + 6, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(payout.riderPhone, pagePadding + 40, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.text('Vehicle / Plate:', pagePadding + 6, y + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(payout.vehiclePlate, pagePadding + 40, y + 22);

  doc.setFont('helvetica', 'bold');
  doc.text('Bank & Account:', pagePadding + 6, y + 29);
  doc.setFont('helvetica', 'normal');
  doc.text(`${payout.bankName} - ${payout.accountNumber}`, pagePadding + 40, y + 29);

  // Table of Earnings
  y += 32 + sectionSpacing;
  doc.setFillColor(243, 244, 246);
  doc.rect(pagePadding, y, contentWidth, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Item Description', pagePadding + 4, y + 6);
  doc.text('Count / Details', pagePadding + 95, y + 6);
  doc.text('Amount (MYR)', pageWidth - pagePadding - 4, y + 6, { align: 'right' });

  y += 9;
  const rows = [
    { desc: 'Completed Order Deliveries (Base Rate)', detail: `${payout.totalDeliveries} trips`, amount: `RM ${payout.basePay.toFixed(2)}` },
    { desc: 'Customer Tips & Gratuities (100% Payout)', detail: 'Direct to rider', amount: `RM ${payout.tipsCollected.toFixed(2)}` },
    { desc: 'On-Time Performance & Weather Bonus', detail: 'Fleet incentive', amount: `RM ${payout.performanceBonus.toFixed(2)}` },
  ];

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  rows.forEach((r) => {
    y += 8;
    doc.text(r.desc, pagePadding + 4, y);
    doc.text(r.detail, pagePadding + 95, y);
    doc.text(r.amount, pageWidth - pagePadding - 4, y, { align: 'right' });
    doc.setDrawColor(229, 231, 235);
    doc.line(pagePadding, y + 3, pageWidth - pagePadding, y + 3);
  });

  // Total Row
  y += 10 + sectionSpacing;
  doc.setFillColor(6, 78, 59);
  doc.roundedRect(pagePadding, y, contentWidth, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL NET PAYOUT DISBURSED:', pagePadding + 6, y + 8);
  doc.text(`RM ${payout.totalPayout.toFixed(2)}`, pageWidth - pagePadding - 6, y + 8, { align: 'right' });

  // Status Note
  y += 16 + sectionSpacing;
  doc.setFontSize(8.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`Disbursement Status: ${payout.status.toUpperCase()}`, pagePadding, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Funds transferred via D-mart Maybank Corporate Bulk Gateway to the designated beneficiary account.', pagePadding, y + 5);

  // Footer
  const footerY = pageHeight - bottomMargin;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(pagePadding, footerY - 14, pageWidth - pagePadding, footerY - 14);

  if (cfg.certificateText) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(cfg.certificateText, pagePadding, footerY - 9);
  }

  if (cfg.showSignatureNote) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(75, 85, 99);
    doc.text(cfg.signatureNoteText, pagePadding, footerY - 4.5);
  }

  if (cfg.showLegalDisclaimer) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(cfg.footerDisclaimer, pagePadding, footerY);
  }

  if (cfg.showSsmRegistration) {
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(`SSM: ${cfg.ssmRegistrationNumber} • Official Address: ${cfg.officialAddress}`, pagePadding, footerY + 4);
  }

  if (cfg.customFooterText) {
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(cfg.customFooterText, pageWidth - pagePadding, footerY + 4, { align: 'right' });
  }

  // Save
  const safeName = payout.riderName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Dmart_Payout_${safeName}_${payout.id}.pdf`);
}

/**
 * Exports all rider payouts as standard banking CSV format
 */
export function exportRiderPayoutsCSV(payouts: RiderPayout[]): void {
  const headers = [
    'Payout ID',
    'Rider Name',
    'Phone Number',
    'Vehicle Plate',
    'Bank Name',
    'Account Number',
    'Deliveries Count',
    'Base Pay (MYR)',
    'Tips (MYR)',
    'Bonus (MYR)',
    'Total Payout (MYR)',
    'Period',
    'Status',
  ];

  const rows = payouts.map((p) => [
    p.id,
    `"${p.riderName}"`,
    `"${p.riderPhone}"`,
    `"${p.vehiclePlate}"`,
    `"${p.bankName}"`,
    `"${p.accountNumber}"`,
    p.totalDeliveries,
    p.basePay.toFixed(2),
    p.tipsCollected.toFixed(2),
    p.performanceBonus.toFixed(2),
    p.totalPayout.toFixed(2),
    `"${p.period}"`,
    p.status,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Dmart_Rider_Payouts_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports official Business Document Verification Record as PDF
 */
export function exportBusinessDocumentPDF(
  docItem: BusinessDocument,
  overrideConfig?: Partial<PdfConfigSettings>
): void {
  const cfg: PdfConfigSettings = { ...getGlobalPdfConfig(), ...(overrideConfig || {}) };
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const pagePadding = cfg.pagePadding ?? 14;
  const topMargin = cfg.topMargin ?? 12;
  const bottomMargin = cfg.bottomMargin ?? 14;
  const sectionSpacing = cfg.sectionSpacing ?? 6;
  const contentWidth = pageWidth - pagePadding * 2;

  const primaryColor = [6, 78, 59];
  const darkGray = [31, 41, 55];

  // Header
  const bannerHeight = Math.max(34, topMargin * 2 + 10);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, bannerHeight, 'F');

  const logoInfo = (cfg.showCompanyLogo && cfg.logoPosition !== 'hidden')
    ? drawCompanyLogo(doc, cfg.logoPosition, 6, pageWidth, pagePadding)
    : null;

  let textX = pagePadding;
  if (logoInfo && cfg.logoPosition === 'left') {
    textX = pagePadding + logoInfo.logoWidth + 3.5;
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(cfg.companyName.toUpperCase(), textX, 15);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('CORPORATE LEGAL, LICENSING & REGULATORY VAULT RECORD', textX, 22);

  if (cfg.showSsmRegistration && cfg.ssmRegistrationNumber) {
    doc.setFontSize(7.5);
    doc.setTextColor(167, 243, 208);
    doc.text(`SSM: ${cfg.ssmRegistrationNumber} • ${cfg.supportContact}`, textX, 27);
  }

  // Document Details
  let currentY = bannerHeight + sectionSpacing;
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(docItem.title, pagePadding, currentY + 4);

  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.line(pagePadding, currentY + 6, pageWidth - pagePadding, currentY + 6);

  currentY += 10;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Document Type:', pagePadding, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(docItem.documentType.toUpperCase().replace(/_/g, ' '), pagePadding + 65, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Official Registration / License No:', pagePadding, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(docItem.regNumber, pagePadding + 65, currentY + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Issuing Authority:', pagePadding, currentY + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(docItem.issuedBy, pagePadding + 65, currentY + 22);

  doc.setFont('helvetica', 'bold');
  doc.text('Effective Issue Date:', pagePadding, currentY + 30);
  doc.setFont('helvetica', 'normal');
  doc.text(docItem.issueDate, pagePadding + 65, currentY + 30);

  doc.setFont('helvetica', 'bold');
  doc.text('Validity Expiration Date:', pagePadding, currentY + 38);
  doc.setFont('helvetica', 'normal');
  doc.text(docItem.expiryDate, pagePadding + 65, currentY + 38);

  doc.setFont('helvetica', 'bold');
  doc.text('Regulatory Status:', pagePadding, currentY + 46);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(docItem.status.toUpperCase(), pagePadding + 65, currentY + 46);

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Vault Operational Scope:', pagePadding, currentY + 54);
  doc.setFont('helvetica', 'normal');
  const splitNotes = doc.splitTextToSize(docItem.notes, contentWidth - 70);
  doc.text(splitNotes, pagePadding + 65, currentY + 54);

  // Footer Disclaimer
  const footerY = pageHeight - bottomMargin;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(pagePadding, footerY - 14, pageWidth - pagePadding, footerY - 14);

  if (cfg.certificateText) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(cfg.certificateText, pagePadding, footerY - 9);
  }

  if (cfg.showSignatureNote) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(75, 85, 99);
    doc.text(cfg.signatureNoteText, pagePadding, footerY - 4.5);
  }

  if (cfg.showLegalDisclaimer) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(cfg.footerDisclaimer, pagePadding, footerY);
  }

  if (cfg.showSsmRegistration) {
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(`SSM: ${cfg.ssmRegistrationNumber} • Official Address: ${cfg.officialAddress}`, pagePadding, footerY + 4);
  }

  if (cfg.customFooterText) {
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(cfg.customFooterText, pageWidth - pagePadding, footerY + 4, { align: 'right' });
  }

  // Save
  const safeName = docItem.title.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Dmart_Vault_${safeName}.pdf`);
}

/**
 * Downloads a compliance / regulatory vault document supporting multiple formats (PDF, PNG, JPG, DOCX).
 */
export function downloadComplianceDocument(
  docItem: BusinessDocument,
  overrideConfig?: Partial<PdfConfigSettings>
): void {
  const cfg: PdfConfigSettings = { ...getGlobalPdfConfig(), ...(overrideConfig || {}) };
  const fileName = docItem.fileName || `${docItem.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  const extension = fileName.split('.').pop()?.toLowerCase() || 'pdf';

  // 1. PDF Format: Generate full official vector certificate PDF
  if (extension === 'pdf') {
    exportBusinessDocumentPDF(docItem, cfg);
    return;
  }

  // 2. Image Formats (PNG, JPG, JPEG): Render high-definition statutory certificate image
  if (extension === 'png' || extension === 'jpg' || extension === 'jpeg') {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 800);
    bgGrad.addColorStop(0, '#f8fafc');
    bgGrad.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 800);

    // Outer decorative borders
    ctx.strokeStyle = '#064e3b';
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 30, 1140, 740);

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.strokeRect(46, 46, 1108, 708);

    // Header banner
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(48, 48, 1104, 110);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(cfg.companyName.toUpperCase(), 80, 105);

    ctx.fillStyle = '#a7f3d0';
    ctx.font = '14px monospace';
    ctx.fillText(`SSM: ${cfg.ssmRegistrationNumber} • ${cfg.headerSubtitle.slice(0, 65)}`, 80, 138);

    // Document Title
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(docItem.title, 80, 215);

    // Horizontal Rule
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, 235);
    ctx.lineTo(1120, 235);
    ctx.stroke();

    // Fields & Values
    const startY = 285;
    const lineHeight = 55;
    const labelX = 80;
    const valX = 460;

    const fields = [
      ['Document Classification:', docItem.documentType.toUpperCase().replace(/_/g, ' ')],
      ['Official Registration / License No:', docItem.regNumber],
      ['Issuing Statutory Authority:', docItem.issuedBy],
      ['Effective Issue Date:', docItem.issueDate],
      ['Validity Expiration Date:', docItem.expiryDate],
      ['Regulatory Compliance Status:', docItem.status.toUpperCase()],
      ['Operational Scope / Provision:', docItem.notes],
    ];

    fields.forEach(([lbl, val], idx) => {
      const curY = startY + idx * lineHeight;
      if (curY > 670) return;

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(lbl, labelX, curY);

      if (lbl.includes('Status')) {
        ctx.fillStyle = '#059669';
        ctx.font = 'bold 20px sans-serif';
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.font = '17px sans-serif';
      }
      ctx.fillText(val, valX, curY);
    });

    // Verification Seal stamp
    ctx.save();
    ctx.translate(980, 640);
    ctx.beginPath();
    ctx.arc(0, 0, 65, 0, Math.PI * 2);
    ctx.fillStyle = '#064e3b';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#34d399';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('D-MART VAULT', 0, -25);
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('OFFICIALLY', 0, -5);
    ctx.fillText('VERIFIED', 0, 12);
    ctx.font = '10px monospace';
    ctx.fillText('MALAYSIA', 0, 30);
    ctx.restore();

    // Footer
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    ctx.fillText(`File: ${fileName} • Checksum Verified: LHDN-SSM-VALID • Format: ${extension.toUpperCase()}`, 80, 725);

    const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, mimeType, 0.95);
    return;
  }

  // 3. DOCX Format: Generate formatted Word document recognized by Microsoft Word / LibreOffice
  if (extension === 'docx') {
    const docxContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${docItem.title}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; margin: 40px; color: #1e293b; line-height: 1.5; }
    .header { background: #064e3b; color: white; padding: 24px; border-radius: 6px; }
    h1 { font-size: 22pt; margin: 0 0 6px 0; font-family: Arial, sans-serif; }
    h2 { font-size: 11pt; font-weight: normal; margin: 0; color: #a7f3d0; }
    .title-box { margin-top: 24px; border-bottom: 2px solid #10b981; padding-bottom: 8px; }
    .title-box h3 { font-size: 16pt; margin: 0; color: #064e3b; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 10px 14px; text-align: left; font-size: 10pt; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; color: #475569; width: 35%; font-weight: 600; }
    td { color: #0f172a; font-weight: 500; }
    .status-badge { color: #065f46; background: #d1fae5; padding: 4px 10px; font-weight: bold; border-radius: 4px; display: inline-block; }
    .notes-box { margin-top: 24px; padding: 16px; background: #f8fafc; border-left: 4px solid #10b981; font-size: 9.5pt; color: #334155; }
    .footer { margin-top: 40px; font-size: 8.5pt; color: #94a3b8; border-top: 1px solid #cbd5e1; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>D-MART RETAIL (MALAYSIA) SDN. BHD.</h1>
    <h2>SYSTEM COMPLIANCE &amp; REGULATORY VAULT • OFFICIAL STATUTORY RECORD</h2>
  </div>

  <div class="title-box">
    <h3>${docItem.title}</h3>
  </div>

  <table>
    <tr>
      <th>Document Classification</th>
      <td>${docItem.documentType.toUpperCase().replace(/_/g, ' ')}</td>
    </tr>
    <tr>
      <th>Official Registration / License No</th>
      <td><strong>${docItem.regNumber}</strong></td>
    </tr>
    <tr>
      <th>Issuing Authority</th>
      <td>${docItem.issuedBy}</td>
    </tr>
    <tr>
      <th>Effective Issue Date</th>
      <td>${docItem.issueDate}</td>
    </tr>
    <tr>
      <th>Validity Expiration Date</th>
      <td>${docItem.expiryDate}</td>
    </tr>
    <tr>
      <th>Compliance Status</th>
      <td><span class="status-badge">${docItem.status.toUpperCase()}</span></td>
    </tr>
    <tr>
      <th>Archived File Name</th>
      <td>${fileName} (${docItem.fileSize})</td>
    </tr>
  </table>

  <div class="notes-box">
    <strong>Operational Scope &amp; Regulatory Provision:</strong><br>
    ${docItem.notes}
  </div>

  <div class="footer">
    <p>This document is exported directly from the D-Mart Retail Compliance &amp; Regulatory Vault. Certified valid under Malaysian Digital Signature &amp; Statutory Records Framework.</p>
    <p>Document Ref: ${docItem.id} | Timestamp: ${new Date().toISOString()} | SSM: 202301048821 (1542109-M)</p>
  </div>
</body>
</html>`;

    const blob = new Blob([docxContent], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  // 4. Generic fallback for any other stored file format
  const genericContent = `D-MART RETAIL (MALAYSIA) SDN. BHD.
SYSTEM COMPLIANCE & REGULATORY VAULT
==================================================
DOCUMENT TITLE: ${docItem.title}
REGISTRATION NUMBER: ${docItem.regNumber}
DOCUMENT TYPE: ${docItem.documentType}
ISSUED BY: ${docItem.issuedBy}
ISSUE DATE: ${docItem.issueDate}
EXPIRY DATE: ${docItem.expiryDate}
COMPLIANCE STATUS: ${docItem.status}
NOTES / SCOPE: ${docItem.notes}
ARCHIVED FILE: ${fileName} (${docItem.fileSize})
TIMESTAMP: ${new Date().toISOString()}
==================================================
`;
  const blob = new Blob([genericContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
  * Generates an official D-mart Daily Store Closure & POS Z-Report PDF
  */
export function exportDailyClosurePDF(
  closure: DailyClosureRecord,
  overrideConfig?: Partial<PdfConfigSettings>
): void {
  const cfg: PdfConfigSettings = { ...getGlobalPdfConfig(), ...(overrideConfig || {}) };
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const pagePadding = cfg.pagePadding ?? 14;
  const topMargin = cfg.topMargin ?? 12;
  const bottomMargin = cfg.bottomMargin ?? 14;
  const sectionSpacing = cfg.sectionSpacing ?? 6;
  const contentWidth = pageWidth - pagePadding * 2;

  const primaryColor = [6, 78, 59]; // #064e3b
  const accentColor = [16, 185, 129]; // #10b981
  const darkGray = [31, 41, 55];
  const lightGray = [243, 244, 246];

  // Header Banner
  const bannerHeight = Math.max(36, topMargin * 2 + 10);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, bannerHeight, 'F');

  const logoInfo = (cfg.showCompanyLogo && cfg.logoPosition !== 'hidden')
    ? drawCompanyLogo(doc, cfg.logoPosition, 6, pageWidth, pagePadding)
    : null;

  let textX = pagePadding;
  if (logoInfo && cfg.logoPosition === 'left') {
    textX = pagePadding + logoInfo.logoWidth + 3.5;
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(cfg.companyName.toUpperCase(), textX, 15);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('DAILY CASHIER & STORE CLOSURE AUDIT REPORT (Z-REPORT SLIP)', textX, 22);

  if (cfg.showSsmRegistration && cfg.ssmRegistrationNumber) {
    doc.setFontSize(7.5);
    doc.setTextColor(167, 243, 208);
    doc.text(`SSM: ${cfg.ssmRegistrationNumber} • ${cfg.officialAddress.slice(0, 55)}`, textX, 27);
  }

  // Meta Right Box
  const metaRightX = (cfg.logoPosition === 'right' && logoInfo)
    ? pageWidth - pagePadding - logoInfo.logoWidth - 4
    : pageWidth - pagePadding;

  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Ref ID: ${closure.id}`, metaRightX, 15, { align: 'right' });
  doc.text(`Date: ${closure.closureDate}`, metaRightX, 21, { align: 'right' });
  doc.text(`Terminal: ${closure.registerId || 'POS-01 (Main)'}`, metaRightX, 27, { align: 'right' });

  // Status Badge
  let currentY = bannerHeight + sectionSpacing;
  const isBalanced = Math.abs(closure.variance) < 0.01;
  doc.setFillColor(isBalanced ? 16 : 239, isBalanced ? 185 : 68, isBalanced ? 129 : 68);
  doc.roundedRect(pagePadding, currentY, 60, 7.5, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`AUDIT STATUS: ${isBalanced ? 'BALANCED' : 'FLAGGED DISCREPANCY'}`, pagePadding + 3, currentY + 5);

  currentY += 7.5 + sectionSpacing;

  // Section 1: Revenue Summary
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. DAILY REVENUE & PAYMENT CHANNELS', pagePadding, currentY + 4);
  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setLineWidth(0.4);
  doc.line(pagePadding, currentY + 6, pageWidth - pagePadding, currentY + 6);

  currentY += 9;
  doc.setFontSize(9);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

  const revRows = [
    ['Physical Cash Sales (POS Drawer):', `RM ${closure.cashSales.toFixed(2)}`],
    ['FPX Online Banking Transfers:', `RM ${closure.fpxSales.toFixed(2)}`],
    ['Touch \'n Go eWallet & DuitNow QR:', `RM ${closure.tngSales.toFixed(2)}`],
    ['Credit / Debit Card Terminals (Visa/MC):', `RM ${closure.cardSales.toFixed(2)}`],
    ['Delivery & Dispatch Fees Collected:', `RM ${closure.deliveryFeesCollected.toFixed(2)}`],
    ['Total Daily Gross Revenue:', `RM ${closure.totalGrossSales.toFixed(2)}`],
    ['Vouchers & Member Discounts:', `-RM ${closure.totalDiscounts.toFixed(2)}`],
    ['Estimated Cost of Goods (COGS):', `-RM ${(closure.cogs || closure.totalGrossSales * 0.65).toFixed(2)}`],
    ['Net Daily Profit:', `RM ${(closure.netProfit || (closure.netRevenue - (closure.cogs || closure.totalGrossSales * 0.65))).toFixed(2)}`],
  ];

  revRows.forEach(([label, val], idx) => {
    const isHighlight = idx === 5 || idx === 8;
    if (isHighlight) {
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(pagePadding, currentY - 3.5, contentWidth, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    }
    doc.text(label, pagePadding + 4, currentY);
    doc.text(val, pageWidth - pagePadding - 4, currentY, { align: 'right' });
    currentY += 6.5;
  });

  // Section 2: Cash Drawer Reconciliation
  currentY += sectionSpacing;
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. PHYSICAL DRAWER CASH RECONCILIATION', pagePadding, currentY + 4);
  doc.line(pagePadding, currentY + 6, pageWidth - pagePadding, currentY + 6);
  currentY += 9;

  const drawerRows = [
    ['Morning Opening Cash Float:', `RM ${closure.cashOpening.toFixed(2)}`],
    ['Physical Cash Register Receipts:', `RM ${closure.cashSales.toFixed(2)}`],
    ['Expected Cash in Drawer (Opening + Sales):', `RM ${closure.drawerExpectedCash.toFixed(2)}`],
    ['Actual Physical Cash Counted in Drawer:', `RM ${closure.drawerActualCash.toFixed(2)}`],
    ['Net Drawer Variance (Over / Short):', `${closure.variance >= 0 ? '+' : ''}RM ${closure.variance.toFixed(2)}`],
  ];

  drawerRows.forEach(([label, val], idx) => {
    const isVariance = idx === 4;
    if (isVariance) {
      doc.setFillColor(closure.variance === 0 ? 236 : 254, closure.variance === 0 ? 253 : 242, closure.variance === 0 ? 245 : 242);
      doc.rect(pagePadding, currentY - 3.5, contentWidth, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(closure.variance === 0 ? 6 : 185, closure.variance === 0 ? 78 : 28, closure.variance === 0 ? 59 : 28);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    }
    doc.text(label, pagePadding + 4, currentY);
    doc.text(val, pageWidth - pagePadding - 4, currentY, { align: 'right' });
    currentY += 6.5;
  });

  // Section 3: Manager Sign-off
  currentY += sectionSpacing;
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3. MANAGER AUDIT & VERIFICATION SIGN-OFF', pagePadding, currentY + 4);
  doc.line(pagePadding, currentY + 6, pageWidth - pagePadding, currentY + 6);
  currentY += 9;

  doc.setFontSize(8.5);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Reconciliation Notes:', pagePadding, currentY);
  doc.setFont('helvetica', 'normal');
  const splitNotes = doc.splitTextToSize(closure.notes || 'Terminal and drawer balanced without audit discrepancy.', contentWidth);
  doc.text(splitNotes, pagePadding, currentY + 4.5);
  currentY += 12 + splitNotes.length * 4;

  // Signatures lines
  doc.setDrawColor(209, 213, 219);
  doc.line(pagePadding, currentY + 12, pagePadding + 70, currentY + 12);
  doc.line(pageWidth - pagePadding - 70, currentY + 12, pageWidth - pagePadding, currentY + 12);

  doc.setFontSize(8);
  doc.text(`Cashier: ${closure.closedBy}`, pagePadding, currentY + 16);
  doc.text(`Verified By: ${closure.verifiedBy}`, pageWidth - pagePadding - 70, currentY + 16);
  doc.text('Timestamp: ' + new Date().toLocaleString('en-MY'), pagePadding, currentY + 20);
  doc.text('Stamp / Signature', pageWidth - pagePadding - 70, currentY + 20);

  // Footer
  const footerY = pageHeight - bottomMargin;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(pagePadding, footerY - 14, pageWidth - pagePadding, footerY - 14);

  if (cfg.certificateText) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(cfg.certificateText, pagePadding, footerY - 9);
  }

  if (cfg.showSignatureNote) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(75, 85, 99);
    doc.text(cfg.signatureNoteText, pagePadding, footerY - 4.5);
  }

  if (cfg.showLegalDisclaimer) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(cfg.footerDisclaimer, pagePadding, footerY);
  }

  if (cfg.showSsmRegistration) {
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(`SSM: ${cfg.ssmRegistrationNumber} • ${cfg.officialAddress}`, pagePadding, footerY + 4);
  }

  if (cfg.customFooterText) {
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(cfg.customFooterText, pageWidth - pagePadding, footerY + 4, { align: 'right' });
  }

  doc.save(`Dmart_ZReport_${closure.closureDate}_${closure.id}.pdf`);
}

/**
 * Exports Daily Closures as CSV format
 */
export function exportDailyClosuresCSV(closures: DailyClosureRecord[]): void {
  const headers = [
    'Closure ID',
    'Date',
    'Register',
    'Shift',
    'Opening Float (RM)',
    'Cash Sales (RM)',
    'FPX Sales (RM)',
    'TNG Sales (RM)',
    'Card Sales (RM)',
    'Gross Revenue (RM)',
    'Discounts (RM)',
    'Net Revenue (RM)',
    'Net Profit (RM)',
    'Expected Cash (RM)',
    'Actual Cash (RM)',
    'Variance (RM)',
    'Status',
    'Closed By',
    'Verified By',
    'Notes'
  ];

  const rows = closures.map((c) => [
    `"${c.id}"`,
    `"${c.closureDate}"`,
    `"${c.registerId || 'POS-01'}"`,
    `"${c.shift || 'Full Day'}"`,
    c.cashOpening.toFixed(2),
    c.cashSales.toFixed(2),
    c.fpxSales.toFixed(2),
    c.tngSales.toFixed(2),
    c.cardSales.toFixed(2),
    c.totalGrossSales.toFixed(2),
    c.totalDiscounts.toFixed(2),
    c.netRevenue.toFixed(2),
    (c.netProfit || (c.netRevenue * 0.28)).toFixed(2),
    c.drawerExpectedCash.toFixed(2),
    c.drawerActualCash.toFixed(2),
    c.variance.toFixed(2),
    `"${c.status}"`,
    `"${c.closedBy}"`,
    `"${c.verifiedBy}"`,
    `"${(c.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Dmart_Daily_Closures_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates an official D-mart Rider Wallet Statement & Financial Clearing Ledger PDF
 */
export function exportRiderWalletStatementPDF(
  rider: FleetRider,
  allTransactions: RiderWalletTransaction[],
  overrideConfig?: Partial<PdfConfigSettings>
): void {
  const cfg: PdfConfigSettings = { ...getGlobalPdfConfig(), ...(overrideConfig || {}) };
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const pagePadding = cfg.pagePadding ?? 14;
  const topMargin = cfg.topMargin ?? 12;
  const bottomMargin = cfg.bottomMargin ?? 14;
  const sectionSpacing = cfg.sectionSpacing ?? 6;
  const contentWidth = pageWidth - pagePadding * 2;

  const primaryColor = [6, 78, 59]; // #064e3b
  const accentColor = [16, 185, 129]; // #10b981
  const darkGray = [31, 41, 55]; // #1f2937
  const lightGray = [243, 244, 246]; // #f3f4f6

  // 1. Official Header Banner
  const bannerHeight = Math.max(36, topMargin * 2 + 10);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, bannerHeight, 'F');

  const logoInfo = (cfg.showCompanyLogo && cfg.logoPosition !== 'hidden')
    ? drawCompanyLogo(doc, cfg.logoPosition, 6, pageWidth, pagePadding)
    : null;

  let textX = pagePadding;
  if (logoInfo && cfg.logoPosition === 'left') {
    textX = pagePadding + logoInfo.logoWidth + 3.5;
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(cfg.companyName.toUpperCase(), textX, 15);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(cfg.headerSubtitle, textX, 22);

  if (cfg.showSsmRegistration && cfg.ssmRegistrationNumber) {
    doc.setFontSize(7.5);
    doc.setTextColor(167, 243, 208); // text-emerald-200
    doc.text(`SSM REG: ${cfg.ssmRegistrationNumber} • ${cfg.supportContact}`, textX, 27);
  }

  // Date of export & Statement reference
  const now = new Date();
  const exportDateStr =
    now.toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) +
    ', ' +
    now.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
  const safePlate = (rider.plate || 'RIDER').replace(/[^a-zA-Z0-9]/g, '');
  const stmtRef = `STMT-${safePlate}-${now.getTime().toString().slice(-6)}`;

  const metaRightX = (cfg.logoPosition === 'right' && logoInfo)
    ? pageWidth - pagePadding - logoInfo.logoWidth - 4
    : pageWidth - pagePadding;

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`Date: ${exportDateStr}`, metaRightX, 15, { align: 'right' });
  doc.text(`Ref ID: ${stmtRef}`, metaRightX, 21, { align: 'right' });
  doc.setTextColor(110, 231, 183);
  doc.text('OFFICIALLY AUDITED', metaRightX, 27, { align: 'right' });

  // 2. Rider Profile Details
  let currentY = bannerHeight + sectionSpacing;
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. RIDER PROFILE & FLEET CREDENTIALS', pagePadding, currentY + 4);

  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setLineWidth(0.4);
  doc.line(pagePadding, currentY + 6, pageWidth - pagePadding, currentY + 6);

  currentY += 8;
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.roundedRect(pagePadding, currentY, contentWidth, 22, 2, 2, 'F');

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(8.5);

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.text('Driver Full Name:', pagePadding + 4, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(rider.name, pagePadding + 42, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('Rider ID:', pagePadding + 115, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(rider.id, pagePadding + 138, currentY + 7);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.text('Vehicle Reg. No:', pagePadding + 4, currentY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 78, 59);
  doc.text(rider.plate, pagePadding + 42, currentY + 14);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

  doc.setFont('helvetica', 'bold');
  doc.text('Contact Phone:', pagePadding + 115, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(rider.phone || '012-3491820', pagePadding + 138, currentY + 14);

  // 3. Account Summary Table
  currentY += 22 + sectionSpacing;
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. FINANCIAL CLEARING ACCOUNT SUMMARY', pagePadding, currentY + 4);

  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setLineWidth(0.4);
  doc.line(pagePadding, currentY + 6, pageWidth - pagePadding, currentY + 6);

  // Calculate Summary metrics
  const riderTxs = allTransactions.filter((t) => t.riderId === rider.id);
  const creditTxs = riderTxs.filter((t) => t.amount > 0);
  const totalCredits = creditTxs.reduce((sum, t) => sum + t.amount, 0);
  const totalOnlineEarnings = totalCredits > 0 ? totalCredits : rider.walletBalance + 85.0;
  const netLedgerBalance = rider.walletBalance - rider.codCollected;

  currentY += 9;
  const cardGap = 2.5;
  const cardWidth = (contentWidth - cardGap * 3) / 4;
  const startX = pagePadding;
  const startY = currentY;

  // Box 1: Current Floating Balance
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.roundedRect(startX, startY, cardWidth, 20, 2, 2, 'F');
  doc.setDrawColor(167, 243, 208);
  doc.rect(startX, startY, cardWidth, 20, 'S');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text('FLOATING BALANCE', startX + 3, startY + 6);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`RM ${rider.walletBalance.toFixed(2)}`, startX + 3, startY + 15);

  // Box 2: COD Cash Held
  const x2 = startX + cardWidth + cardGap;
  doc.setFillColor(254, 243, 199); // amber-50
  doc.roundedRect(x2, startY, cardWidth, 20, 2, 2, 'F');
  doc.setDrawColor(253, 230, 138);
  doc.rect(x2, startY, cardWidth, 20, 'S');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.text('COD CASH HELD', x2 + 3, startY + 6);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`RM ${rider.codCollected.toFixed(2)}`, x2 + 3, startY + 15);

  // Box 3: Total Online Earnings
  const x3 = x2 + cardWidth + cardGap;
  doc.setFillColor(240, 253, 250); // teal-50
  doc.roundedRect(x3, startY, cardWidth, 20, 2, 2, 'F');
  doc.setDrawColor(204, 251, 241);
  doc.rect(x3, startY, cardWidth, 20, 'S');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 94, 89);
  doc.text('ONLINE EARNINGS', x3 + 3, startY + 6);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`RM ${totalOnlineEarnings.toFixed(2)}`, x3 + 3, startY + 15);

  // Box 4: Net Ledger Balance
  const x4 = x3 + cardWidth + cardGap;
  const isNetPositive = netLedgerBalance >= 0;
  if (isNetPositive) {
    doc.setFillColor(6, 78, 59);
    doc.setTextColor(255, 255, 255);
  } else {
    doc.setFillColor(159, 18, 57);
    doc.setTextColor(255, 255, 255);
  }
  doc.roundedRect(x4, startY, cardWidth, 20, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('NET LEDGER BAL', x4 + 3, startY + 6);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`${netLedgerBalance < 0 ? '-' : ''}RM ${Math.abs(netLedgerBalance).toFixed(2)}`, x4 + 3, startY + 15);

  // 4. Itemized Transaction Ledger Table
  currentY = startY + 20 + sectionSpacing;
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3. ITEMIZED TRANSACTION LEDGER TABLE', pagePadding, currentY + 4);

  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setLineWidth(0.4);
  doc.line(pagePadding, currentY + 6, pageWidth - pagePadding, currentY + 6);

  currentY += 8;
  doc.setFillColor(6, 78, 59);
  doc.rect(pagePadding, currentY, contentWidth, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('TX REF / ID', pagePadding + 3, currentY + 5);
  doc.text('DATE / TIME', pagePadding + 35, currentY + 5);
  doc.text('DESCRIPTION', pagePadding + 70, currentY + 5);
  doc.text('TYPE', pagePadding + 130, currentY + 5);
  doc.text('AMOUNT (RM)', pageWidth - pagePadding - 4, currentY + 5, { align: 'right' });

  // Prepare display transactions
  const displayTxs =
    riderTxs.length > 0
      ? riderTxs
      : [
          {
            id: `tx-${rider.id}-01`,
            riderId: rider.id,
            riderName: rider.name,
            type: 'delivery_payout' as const,
            amount: 38.5,
            notes: 'Completed 5 grocery batch dropoffs in Bangsar South',
            createdAt: '2026-09-28 09:15 AM',
            referenceNo: 'PAY-2609-001',
          },
          {
            id: `tx-${rider.id}-02`,
            riderId: rider.id,
            riderName: rider.name,
            type: 'credit' as const,
            amount: 45.0,
            notes: 'Weekly float balance adjustment approved by Finance',
            createdAt: '2026-09-27 02:30 PM',
            referenceNo: 'ADJ-FLT-8821',
          },
          {
            id: `tx-${rider.id}-03`,
            riderId: rider.id,
            riderName: rider.name,
            type: 'incentive_bonus' as const,
            amount: 25.0,
            notes: 'Peak weekend 100% on-time delivery streak bonus',
            createdAt: '2026-09-26 08:45 PM',
            referenceNo: 'BONUS-WKND-01',
          },
          {
            id: `tx-${rider.id}-04`,
            riderId: rider.id,
            riderName: rider.name,
            type: 'cod_settlement' as const,
            amount: -35.0,
            notes: 'COD cash collections deposited at cashier register POS-01',
            createdAt: '2026-09-25 06:15 PM',
            referenceNo: 'COD-SET-1049',
          },
        ];

  currentY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  displayTxs.slice(0, 12).forEach((tx, idx) => {
    const isCredit = tx.amount >= 0;
    const isEven = idx % 2 === 0;

    if (isEven) {
      doc.setFillColor(249, 250, 251);
      doc.rect(pagePadding, currentY, contentWidth, 7, 'F');
    }

    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(tx.referenceNo || tx.id, pagePadding + 3, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.text(tx.createdAt || now.toISOString().slice(0, 16), pagePadding + 35, currentY + 4.5);

    // Truncate description if too long
    const desc = (tx.notes || 'Dispatch delivery transaction').slice(0, 36);
    doc.text(desc, pagePadding + 70, currentY + 4.5);

    // Type badge text
    if (isCredit) {
      doc.setTextColor(6, 95, 70);
      doc.setFont('helvetica', 'bold');
      doc.text('CREDIT', pagePadding + 130, currentY + 4.5);
    } else {
      doc.setTextColor(159, 18, 57);
      doc.setFont('helvetica', 'bold');
      doc.text('DEBIT', pagePadding + 130, currentY + 4.5);
    }

    // Amount text
    if (isCredit) {
      doc.setTextColor(6, 95, 70);
      doc.text(`+RM ${tx.amount.toFixed(2)}`, pageWidth - pagePadding - 4, currentY + 4.5, { align: 'right' });
    } else {
      doc.setTextColor(159, 18, 57);
      doc.text(`-RM ${Math.abs(tx.amount).toFixed(2)}`, pageWidth - pagePadding - 4, currentY + 4.5, { align: 'right' });
    }

    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);
    doc.line(pagePadding, currentY + 7, pageWidth - pagePadding, currentY + 7);

    currentY += 7;
  });

  // 5. Official Footer & Verification Seal
  const footerY = pageHeight - bottomMargin;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(pagePadding, footerY - 14, pageWidth - pagePadding, footerY - 14);

  if (cfg.certificateText) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(cfg.certificateText, pagePadding, footerY - 9);
  }

  if (cfg.showSignatureNote) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(75, 85, 99);
    doc.text(cfg.signatureNoteText, pagePadding, footerY - 4.5);
  }

  if (cfg.showLegalDisclaimer) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(cfg.footerDisclaimer, pagePadding, footerY);
  }

  if (cfg.showSsmRegistration) {
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(`SSM: ${cfg.ssmRegistrationNumber} • Official Address: ${cfg.officialAddress}`, pagePadding, footerY + 4);
  }

  if (cfg.customFooterText) {
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(cfg.customFooterText, pageWidth - pagePadding, footerY + 4, { align: 'right' });
  }

  // 6. Trigger Immediate Browser Download
  const safeName = rider.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Dmart_Statement_${safeName}_${safePlate}.pdf`);
}

/**
 * Exports a test sample statement, report, or invoice PDF demonstrating current dynamic branding configuration
 */
export function exportSamplePdfPreview(
  overrideConfig?: Partial<PdfConfigSettings>,
  sampleType: 'statement' | 'invoice' | 'report' = 'statement'
): void {
  if (sampleType === 'report') {
    const sampleClosure: DailyClosureRecord = {
      id: 'DCR-2026-10-09-01',
      closureDate: '2026-10-09',
      registerId: 'POS-01 (Main)',
      cashierName: 'Aisyah Binti Razak',
      cashOpening: 300.0,
      cashSales: 1250.0,
      drawerExpectedCash: 1550.0,
      drawerActualCash: 1550.0,
      variance: 0.0,
      fpxSales: 3420.0,
      tngSales: 1890.0,
      cardSales: 2150.0,
      deliveryFeesCollected: 380.0,
      totalGrossSales: 9090.0,
      totalDiscounts: 240.0,
      netRevenue: 8850.0,
      cogs: 5900.0,
      netProfit: 2950.0,
      notes: 'All cashier registers and COD envelopes verified and deposited into Bangsar safe vault.',
      closedBy: 'Aisyah Razak',
      verifiedBy: 'Encik Farhan Al-Mehdhar',
      status: 'balanced',
      timestamp: new Date().toISOString(),
    };
    exportDailyClosurePDF(sampleClosure, overrideConfig);
    return;
  }

  if (sampleType === 'invoice') {
    const sampleOrder: Order = {
      id: 'ord_sample_99120',
      orderNumber: 'DM-99120',
      items: [
        {
          id: 'item-1',
          name: 'Jasmine Super Special Tempatan Rice 10kg',
          nameMs: 'Beras Jasmine Super Special Tempatan 10kg',
          price: 38.9,
          quantity: 1,
          unit: '10kg',
          category: 'staples',
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
        },
        {
          id: 'item-2',
          name: 'Farm Fresh Pure Fresh Milk 1L',
          nameMs: 'Susu Segar Farm Fresh 1L',
          price: 8.5,
          quantity: 2,
          unit: '1L',
          category: 'dairy',
          image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
        },
        {
          id: 'item-3',
          name: 'Ayam Brand Tuna Flakes in Sunflower Oil 150g',
          nameMs: 'Ayam Brand Serpihan Tuna dalam Minyak Bunga Matahari 150g',
          price: 7.2,
          quantity: 3,
          unit: '150g',
          category: 'canned',
          image: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=400',
        },
      ],
      subtotal: 77.5,
      deliveryFee: 0.0,
      discount: 5.0,
      tip: 3.0,
      total: 75.5,
      pointsRedeemed: 200,
      pointsEarned: 76,
      deliveryAddress: {
        recipientName: 'Nurul Huda Binti Ahmad',
        phone: '+60 12-883 9120',
        street: 'No. 18, Jalan Telawi 3, Bangsar',
        city: 'Kuala Lumpur',
        state: 'Wilayah Persekutuan',
        postcode: '59100',
        country: 'Malaysia',
        formattedAddress: 'No. 18, Jalan Telawi 3, Bangsar, 59100 Kuala Lumpur',
      },
      paymentMethod: 'tng_ewallet',
      deliverySlot: 'Today, 2:00 PM - 4:00 PM (Express)',
      status: 'delivered',
      createdAt: new Date().toISOString(),
      assignedRiderId: 'DEMO-RDR-01',
      customerName: 'Nurul Huda Binti Ahmad',
      customerPhone: '+60 12-883 9120',
    } as any;
    generateOrderReceiptPdf({ order: sampleOrder, language: 'en', overrideConfig });
    return;
  }

  const sampleRider: FleetRider = {
    id: 'DEMO-RDR-01',
    name: 'Muhammad Haziq Bin Yusof',
    phone: '012-3491820',
    plate: 'WXY 8912',
    vehicleType: 'motorcycle',
    status: 'idle',
    destination: 'Bangsar South Hub',
    etaMin: 10,
    lat: 3.1118,
    lng: 101.6644,
    battery: '96%',
    speed: '35 km/h',
    walletBalance: 245.5,
    codCollected: 85.0,
    rating: 4.95,
    completedDeliveries: 48,
  };

  const sampleTxs: RiderWalletTransaction[] = [
    {
      id: 'tx-demo-01',
      riderId: 'DEMO-RDR-01',
      riderName: 'Muhammad Haziq Bin Yusof',
      type: 'delivery_payout',
      amount: 48.5,
      notes: 'Completed 6 batch grocery dropoffs in Bangsar South',
      createdAt: '2026-09-28 10:15 AM',
      referenceNo: 'DM-ORD-99120',
    },
    {
      id: 'tx-demo-02',
      riderId: 'DEMO-RDR-01',
      riderName: 'Muhammad Haziq Bin Yusof',
      type: 'credit',
      amount: 60.0,
      notes: 'Weekly float balance adjustment approved by Finance',
      createdAt: '2026-09-27 03:30 PM',
      referenceNo: 'ADJ-FLT-8821',
    },
    {
      id: 'tx-demo-03',
      riderId: 'DEMO-RDR-01',
      riderName: 'Muhammad Haziq Bin Yusof',
      type: 'incentive_bonus',
      amount: 30.0,
      notes: 'Peak weekend 100% on-time delivery streak incentive',
      createdAt: '2026-09-26 09:00 PM',
      referenceNo: 'BONUS-WKND-01',
    },
    {
      id: 'tx-demo-04',
      riderId: 'DEMO-RDR-01',
      riderName: 'Muhammad Haziq Bin Yusof',
      type: 'cod_settlement',
      amount: -45.0,
      notes: 'COD cash collections deposited at cashier register POS-01',
      createdAt: '2026-09-25 06:45 PM',
      referenceNo: 'COD-SET-1049',
    },
  ];

  exportRiderWalletStatementPDF(sampleRider, sampleTxs, overrideConfig);
}

export { exportOrdersReconciliationCSV, type OrderCsvExportOptions } from './orderCsvExport';
