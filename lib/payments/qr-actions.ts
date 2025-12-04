"use server";

import { connectDB } from "@/lib/mongodb/connection";
import { Invoice, Transaction } from "@/lib/mongodb/models";
import { getCurrentUser } from "@/lib/auth/session";
import {
  generateQRCode,
  generateTransferDescription,
  getDefaultBankInfo,
} from "@/lib/utils/qr-code";
import type { BankInfo } from "@/lib/utils/qr-code";

export interface QRPaymentData {
  qrCodeDataURL: string;
  bankInfo: BankInfo;
  amount: number;
  transferContent: string;
  transactionCode: string;
  invoiceNumber: string;
  expiresAt: string;
}

/**
 * Generate QR code for invoice payment
 */
export async function generatePaymentQRCode(
  invoiceId: string,
  transactionCode: string
): Promise<{ success: boolean; data?: QRPaymentData; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Người dùng chưa đăng nhập" };
    }

    await connectDB();

    // Get invoice details
    const invoice: any = await Invoice.findById(invoiceId)
      .populate("apartmentId", "apartmentNumber")
      .lean();

    if (!invoice) {
      return { success: false, error: "Không tìm thấy hóa đơn" };
    }

    // Check ownership
    if (invoice.userId.toString() !== user.id) {
      return {
        success: false,
        error: "Bạn không có quyền thanh toán hóa đơn này",
      };
    }

    if (invoice.status === "paid") {
      return { success: false, error: "Hóa đơn đã được thanh toán" };
    }

    // Get bank info from environment
    const bankInfo = getDefaultBankInfo();

    // Generate transfer description
    const transferContent = generateTransferDescription(
      invoice.invoiceNumber,
      invoice.amount
    );

    // Generate QR code
    const qrCodeDataURL = await generateQRCode({
      bankInfo,
      amount: invoice.amount,
      description: transferContent,
      invoiceNumber: invoice.invoiceNumber,
    });

    // Get expiration time from transaction
    const transaction = await Transaction.findOne({ transactionCode });
    const expiresAt = transaction?.paymentDate
      ? new Date(
          transaction.paymentDate.getTime() + 15 * 60 * 1000
        ).toISOString()
      : new Date(Date.now() + 15 * 60 * 1000).toISOString();

    return {
      success: true,
      data: {
        qrCodeDataURL,
        bankInfo,
        amount: invoice.amount,
        transferContent,
        transactionCode,
        invoiceNumber: invoice.invoiceNumber,
        expiresAt,
      },
    };
  } catch (error) {
    console.error("Error generating QR code:", error);
    return { success: false, error: "Lỗi khi tạo mã QR thanh toán" };
  }
}

/**
 * Check payment status by transaction code
 */
export async function checkPaymentStatus(transactionCode: string) {
  try {
    await connectDB();

    const transaction = await Transaction.findOne({ transactionCode })
      .populate("invoiceId", "status")
      .lean();

    if (!transaction) {
      return { success: false, error: "Không tìm thấy giao dịch" };
    }

    return {
      success: true,
      data: {
        status: transaction.status,
        invoiceStatus: (transaction as any).invoiceId?.status,
      },
    };
  } catch (error) {
    console.error("Error checking payment status:", error);
    return { success: false, error: "Lỗi khi kiểm tra trạng thái thanh toán" };
  }
}
