"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeDisplay } from "@/components/payments/qr-code-display";
import { CountdownTimer } from "@/components/payments/countdown-timer";
import type { QRPaymentData } from "@/lib/payments/qr-actions";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = params.id as string;
  const transactionCode = searchParams.get("txn");
  const returnUrl = searchParams.get("returnUrl");

  const [invoice, setInvoice] = useState<any>(null);
  const [qrData, setQrData] = useState<QRPaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoiceAndGenerateQR();
  }, [invoiceId, transactionCode]);

  const fetchInvoiceAndGenerateQR = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch invoice details
      const invoiceResponse = await fetch(`/api/invoices/${invoiceId}`);
      if (!invoiceResponse.ok) {
        throw new Error("Không tìm thấy hóa đơn");
      }

      const invoiceData = await invoiceResponse.json();
      setInvoice(invoiceData);

      // Generate QR code if we have transaction code
      if (transactionCode) {
        await generateQRCode();
      }
    } catch (err: any) {
      console.error("Error fetching invoice:", err);
      setError(err.message || "Lỗi khi tải thông tin hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    if (!transactionCode) {
      setError("Thiếu mã giao dịch");
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const response = await fetch(`/api/invoices/${invoiceId}/generate-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_code: transactionCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Không thể tạo mã QR");
      }

      const data = await response.json();
      setQrData(data);
      toast.success("Mã QR đã được tạo");
    } catch (err: any) {
      console.error("Error generating QR:", err);
      setError(err.message || "Lỗi khi tạo mã QR");
      toast.error("Không thể tạo mã QR");
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirmPayment = async () => {
    try {
      setConfirming(true);
      setError(null);

      const response = await fetch(
        `/api/invoices/${invoiceId}/confirm-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment_gateway: "bank_transfer",
            transaction_code: transactionCode,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Không thể xác nhận thanh toán");
      }

      toast.success("Xác nhận đã gửi! Admin sẽ kiểm tra và duyệt thanh toán.");

      // Redirect back after short delay
      setTimeout(() => {
        router.push(returnUrl || "/resident/invoices?payment=pending");
      }, 2000);
    } catch (err: any) {
      console.error("Error confirming payment:", err);
      setError(err.message || "Lỗi khi xác nhận thanh toán");
      toast.error("Không thể xác nhận thanh toán");
    } finally {
      setConfirming(false);
    }
  };

  const handleQRExpired = () => {
    toast.error("Mã QR đã hết hạn");
    setError("Mã QR đã hết hạn. Vui lòng quay lại và tạo thanh toán mới.");
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Không tìm thấy hóa đơn</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(returnUrl || "/resident/invoices")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Thanh toán hóa đơn</h1>
          <p className="text-muted-foreground">
            Quét mã QR hoặc chuyển khoản thủ công
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Invoice Info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Thông tin hóa đơn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Mã hóa đơn</p>
                <p className="font-mono font-semibold">
                  {invoice.invoice_number || `#${invoiceId.slice(-8)}`}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">Loại hóa đơn</p>
                <p className="font-medium capitalize">{invoice.type}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">Số tiền</p>
                <p className="text-2xl font-bold text-primary">
                  {invoice.amount?.toLocaleString("vi-VN")} VNĐ
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">Trạng thái</p>
                <Badge variant="secondary" className="mt-1">
                  {invoice.status === "paid"
                    ? "Đã thanh toán"
                    : "Chờ thanh toán"}
                </Badge>
              </div>

              {invoice.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Mô tả</p>
                    <p className="text-sm mt-1">{invoice.description}</p>
                  </div>
                </>
              )}

              {transactionCode && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Mã giao dịch
                    </p>
                    <p className="font-mono text-sm font-medium break-all">
                      {transactionCode}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Timer */}
          {qrData?.expiresAt && (
            <CountdownTimer
              expiresAt={qrData.expiresAt}
              onExpired={handleQRExpired}
            />
          )}
        </div>

        {/* Right: QR Code & Payment */}
        <div className="lg:col-span-2 space-y-4">
          {!qrData && !generating ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">
                  Chưa có mã QR thanh toán
                </p>
                <p className="text-muted-foreground mb-6">
                  Vui lòng quay lại trang hóa đơn và chọn phương thức thanh toán
                </p>
                <Button
                  onClick={() => router.push(returnUrl || "/resident/invoices")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại
                </Button>
              </CardContent>
            </Card>
          ) : generating ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-lg font-medium">Đang tạo mã QR...</p>
              </CardContent>
            </Card>
          ) : qrData ? (
            <>
              {/* QR Code Display */}
              <QRCodeDisplay
                qrDataURL={qrData.qrCodeDataURL}
                bankInfo={qrData.bankInfo}
                amount={qrData.amount}
                transferContent={qrData.transferContent}
                onRefresh={generateQRCode}
              />

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>Hướng dẫn thanh toán</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <p className="text-sm">
                      Mở ứng dụng Banking trên điện thoại (Vietcombank,
                      Techcombank, MBBank, v.v.)
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <p className="text-sm">
                      Chọn "Quét mã QR" hoặc "Chuyển khoản"
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <p className="text-sm">
                      Quét mã QR phía trên hoặc nhập thông tin chuyển khoản thủ
                      công
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <p className="text-sm">
                      <strong className="text-amber-600">Quan trọng:</strong>{" "}
                      Kiểm tra kỹ nội dung chuyển khoản trước khi xác nhận
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      5
                    </div>
                    <p className="text-sm">
                      Sau khi chuyển khoản thành công, nhấn nút "Tôi đã thanh
                      toán" bên dưới
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Confirm Button */}
              <Button
                size="lg"
                className="w-full"
                onClick={handleConfirmPayment}
                disabled={confirming || invoice.status === "paid"}
              >
                {confirming ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Đang xác nhận...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Tôi đã thanh toán
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Admin sẽ kiểm tra và xác nhận thanh toán của bạn trong thời gian
                sớm nhất
              </p>
            </>
          ) : null}

          {/* Security Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">
                    Giao dịch an toàn & bảo mật
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Thông tin thanh toán được mã hóa và bảo vệ. Chúng tôi không
                    lưu trữ thông tin tài khoản ngân hàng của bạn.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
