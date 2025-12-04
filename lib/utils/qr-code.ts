/**
 * QR Code Generation Utility for VietQR Standard
 * Generates QR codes for bank transfers compatible with Vietnamese banking apps
 */

import QRCode from "qrcode";

export interface BankInfo {
  bankId: string; // Bank ID (VCB, TCB, MB, etc.)
  accountNo: string; // Bank account number
  accountName: string; // Account holder name
}

export interface VietQRData {
  bankInfo: BankInfo;
  amount: number;
  description: string; // Transfer description/content
  invoiceNumber?: string;
}

/**
 * Generate VietQR data string following Vietnamese banking standard
 * Format: bankId|accountNo|accountName|amount|description
 */
export function generateVietQRString(data: VietQRData): string {
  const { bankInfo, amount, description } = data;

  // VietQR format: follows banking standard for automatic parsing
  // Most Vietnamese banking apps can parse this format
  const qrContent = {
    bankId: bankInfo.bankId,
    accountNo: bankInfo.accountNo,
    accountName: bankInfo.accountName,
    amount: amount.toString(),
    addInfo: description,
  };

  // Alternative simple format that works with most banks
  const simpleFormat = `${bankInfo.bankId}|${bankInfo.accountNo}|${bankInfo.accountName}|${amount}|${description}`;

  return simpleFormat;
}

/**
 * Generate QR code data URL from VietQR data
 * Returns a data URL that can be used directly in <img> src
 */
export async function generateQRCode(data: VietQRData): Promise<string> {
  try {
    const qrString = generateVietQRString(data);

    // Generate QR code as data URL
    const qrDataURL = await QRCode.toDataURL(qrString, {
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    });

    return qrDataURL;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Generate payment transaction code
 * Format: STAY-YYYYMMDD-RANDOM
 */
export function generateTransactionCode(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `STAY-${year}${month}${day}-${random}`;
}

/**
 * Generate transfer description/content for invoice payment
 * Format: "STAYEASE [InvoiceNumber] [Amount]"
 */
export function generateTransferDescription(
  invoiceNumber: string,
  amount: number
): string {
  return `STAYEASE ${invoiceNumber} ${amount}`;
}

/**
 * Get default bank info from environment
 * This should be configured in .env file
 */
export function getDefaultBankInfo(): BankInfo {
  return {
    bankId: process.env.BANK_ID || "VCB",
    accountNo: process.env.BANK_ACCOUNT_NO || "1234567890",
    accountName: process.env.BANK_ACCOUNT_NAME || "CONG TY STAYEASE",
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}
