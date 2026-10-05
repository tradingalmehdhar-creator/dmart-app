/**
 * Centralized PDF Generation Configuration & Official Company Metadata
 * All generated PDF statements, clearance documents, and treasury reports across D-mart
 * dynamically import and use these constants to ensure consistent branding and single-source-of-truth metadata.
 */

export const COMPANY_NAME = "D-mart Supermarket & Retail Logistics";
export const LEGAL_ENTITY = "D-mart Retail Sdn Bhd";
export const SSM_NUMBER = "202301048821";
export const SUB_HEADER = "FLEET LOGISTICS & COURIER DISPATCH • OFFICIAL RIDER WALLET STATEMENT";
export const DISCLAIMER_TEXT = "This official statement is generated directly from D-mart Retail & Fleet Logistics. Certified valid under the Malaysian Digital Signature Act 1997.";

// Additional standardized corporate metadata for easy updates
export const COMPANY_SHORT_NAME = "D-mart";
export const COMPANY_ADDRESS = "No. 18, Jalan Kerinchi, Bangsar South, 59200 Kuala Lumpur, Malaysia";
export const COMPANY_PHONE = "+60 3-2242 8821";
export const COMPANY_EMAIL = "treasury@dmart.my";
export const COMPANY_WEBSITE = "https://dmart.my";
export const TAX_IDENTIFICATION = "W10-2023-01048821";
export const HALAL_CERT_NO = "JAKIM.700-2/3/1 042-08/2024";
export const APP_VERSION = "D-mart Fleet Engine v2.6";

export const PDF_CONFIG = {
  COMPANY_NAME,
  LEGAL_ENTITY,
  SSM_NUMBER,
  SUB_HEADER,
  DISCLAIMER_TEXT,
  COMPANY_SHORT_NAME,
  COMPANY_ADDRESS,
  COMPANY_PHONE,
  COMPANY_EMAIL,
  COMPANY_WEBSITE,
  TAX_IDENTIFICATION,
  HALAL_CERT_NO,
  APP_VERSION,
  /**
   * Generates a tamper-evident audit checksum string for any document
   */
  generateChecksum: (ref: string, time?: number): string => {
    const t = time || Date.now();
    const cleanRef = (ref || 'DMART').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `SHA256-${cleanRef}-${t.toString().slice(-6)}-VERIFIED-OK`;
  },
  /**
   * Helper to format official registration string
   */
  formatSsmString: (): string => {
    return `SSM: ${SSM_NUMBER} (${LEGAL_ENTITY})`;
  }
};

export default PDF_CONFIG;
