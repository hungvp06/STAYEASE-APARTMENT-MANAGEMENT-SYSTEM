"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import type { BankInfo } from "@/lib/utils/qr-code";

interface QRCodeDisplayProps {
  qrDataURL: string;
  bankInfo: BankInfo;
  amount: number;
  transferContent: string;
  onRefresh?: () => void;
}

export function QRCodeDisplay({
  qrDataURL,
  bankInfo,
  amount,
  transferContent,
  onRefresh,
}: QRCodeDisplayProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast.success(`Đã copy ${label}`);

      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast.error("Không thể copy");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* QR Code */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            <h3 className="text-lg font-semibold">Quét mã QR để thanh toán</h3>

            <div className="relative bg-white p-4 rounded-lg border-2 border-gray-200">
              {qrDataURL ? (
                <Image
                  src={qrDataURL}
                  alt="QR Code thanh toán"
                  width={400}
                  height={400}
                  className="rounded"
                />
              ) : (
                <div className="w-[400px] h-[400px] flex items-center justify-center bg-gray-100 rounded">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground text-center max-w-md">
              Sử dụng ứng dụng Banking để quét mã QR và thực hiện thanh toán
            </p>

            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tạo lại mã QR
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold mb-4">
            Hoặc chuyển khoản thủ công
          </h3>

          {/* Account Number */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Số tài khoản</p>
              <p className="font-mono font-bold text-lg">
                {bankInfo.accountNo}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                copyToClipboard(bankInfo.accountNo, "số tài khoản")
              }
            >
              {copied === "số tài khoản" ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Account Name */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Chủ tài khoản</p>
              <p className="font-semibold">{bankInfo.accountName}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                copyToClipboard(bankInfo.accountName, "tên chủ tài khoản")
              }
            >
              {copied === "tên chủ tài khoản" ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Bank Name */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Ngân hàng</p>
              <p className="font-semibold">{getBankName(bankInfo.bankId)}</p>
            </div>
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Số tiền</p>
              <p className="font-bold text-xl text-blue-600">
                {formatCurrency(amount)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(amount.toString(), "số tiền")}
            >
              {copied === "số tiền" ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Transfer Content */}
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Nội dung chuyển khoản
              </p>
              <p className="font-mono font-semibold text-amber-700">
                {transferContent}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Vui lòng nhập chính xác nội dung này
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                copyToClipboard(transferContent, "nội dung chuyển khoản")
              }
            >
              {copied === "nội dung chuyển khoản" ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to get bank name from bank ID
function getBankName(bankId: string): string {
  const bankNames: Record<string, string> = {
    VCB: "Vietcombank",
    TCB: "Techcombank",
    MB: "MBBank",
    VIB: "VIB",
    ACB: "ACB",
    VPB: "VPBank",
    TPB: "TPBank",
    STB: "Sacombank",
    HDB: "HDBank",
    SHB: "SHB",
    MSB: "MSB",
    BIDV: "BIDV",
    AGR: "Agribank",
  };

  return bankNames[bankId] || bankId;
}
