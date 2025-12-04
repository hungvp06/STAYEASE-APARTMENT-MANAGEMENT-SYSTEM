"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle, Loader2 } from "lucide-react";

interface ConfirmPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    invoice_number?: string;
    amount: number;
  };
  onSuccess?: () => void;
}

export function ConfirmPaymentDialog({
  open,
  onOpenChange,
  invoice,
  onSuccess,
}: ConfirmPaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    transaction_code: "",
    payment_gateway: "bank_transfer",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.transaction_code.trim()) {
      toast.error("Vui lòng nhập mã giao dịch");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/invoices/${invoice.id}/confirm-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payment_gateway: formData.payment_gateway,
            transaction_code: formData.transaction_code,
            notes: formData.notes,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Không thể xác nhận thanh toán");
      }

      toast.success("Xác nhận thanh toán thành công!");

      // Reset form
      setFormData({
        transaction_code: "",
        payment_gateway: "bank_transfer",
        notes: "",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      toast.error(error.message || "Lỗi khi xác nhận thanh toán");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Xác nhận thanh toán</DialogTitle>
            <DialogDescription>
              Xác nhận đã nhận thanh toán cho hóa đơn{" "}
              <span className="font-mono font-semibold">
                {invoice.invoice_number || `#${invoice.id.slice(-8)}`}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Amount Display */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-600 font-medium mb-1">Số tiền</p>
              <p className="text-2xl font-bold text-blue-700">
                {invoice.amount?.toLocaleString("vi-VN")} VNĐ
              </p>
            </div>

            {/* Transaction Code */}
            <div className="space-y-2">
              <Label htmlFor="transaction_code">
                Mã giao dịch <span className="text-red-500">*</span>
              </Label>
              <Input
                id="transaction_code"
                placeholder="VD: STAY-20250120-ABC123"
                value={formData.transaction_code}
                onChange={(e) =>
                  setFormData({ ...formData, transaction_code: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Nhập mã giao dịch từ thông tin chuyển khoản
              </p>
            </div>

            {/* Payment Gateway */}
            <div className="space-y-2">
              <Label htmlFor="payment_gateway">Phương thức thanh toán</Label>
              <Select
                value={formData.payment_gateway}
                onValueChange={(value) =>
                  setFormData({ ...formData, payment_gateway: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">
                    Chuyển khoản ngân hàng
                  </SelectItem>
                  <SelectItem value="cash">Tiền mặt</SelectItem>
                  <SelectItem value="vnpay">VNPay</SelectItem>
                  <SelectItem value="momo">MoMo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                placeholder="Thêm ghi chú (tùy chọn)"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Xác nhận thanh toán
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
