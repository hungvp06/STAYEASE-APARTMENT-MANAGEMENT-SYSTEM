"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateResident, type Resident } from "@/lib/resident-management/actions";
import { getAllApartments } from "@/lib/apartments/actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EditResidentDialogProps {
  resident: Resident;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditResidentDialog({
  resident,
  open,
  onOpenChange,
  onSuccess,
}: EditResidentDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [apartments, setApartments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    full_name: resident.full_name || "",
    phone: resident.phone || "",
    apartment_id: resident.apartment?.id || "",
    move_in_date: resident.move_in_date
      ? new Date(resident.move_in_date).toISOString().split("T")[0]
      : "",
    lease_start_date: resident.lease_start_date
      ? new Date(resident.lease_start_date).toISOString().split("T")[0]
      : "",
    lease_end_date: resident.lease_end_date
      ? new Date(resident.lease_end_date).toISOString().split("T")[0]
      : "",
    monthly_rent: resident.monthly_rent?.toString() || "",
    status: resident.status || "active",
  });
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    if (open) {
      loadApartments();
      setFormData({
        full_name: resident.full_name || "",
        phone: resident.phone || "",
        apartment_id: resident.apartment?.id || "",
        move_in_date: resident.move_in_date
          ? new Date(resident.move_in_date).toISOString().split("T")[0]
          : "",
        lease_start_date: resident.lease_start_date
          ? new Date(resident.lease_start_date).toISOString().split("T")[0]
          : "",
        lease_end_date: resident.lease_end_date
          ? new Date(resident.lease_end_date).toISOString().split("T")[0]
          : "",
        monthly_rent: resident.monthly_rent?.toString() || "",
        status: resident.status || "active",
      });
      setPhoneError("");
    }
  }, [open, resident]);

  const loadApartments = async () => {
    try {
      const apartmentsData = await getAllApartments();
      setApartments(
        apartmentsData.filter(
          (a: any) =>
            a.status === "available" || a.id === resident.apartment?.id
        )
      );
    } catch (error) {
      console.error("Failed to load apartments:", error);
    }
  };

  const validatePhone = (phone: string) => {
    // Phone is now optional
    if (!phone) {
      setPhoneError("");
      return true;
    }
    const cleanPhone = phone.replace(/[\s-]/g, "");
    if (!/^0\d{9}$/.test(cleanPhone)) {
      setPhoneError("Số điện thoại phải có 10 số và bắt đầu bằng 0");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, phone: value });
    validatePhone(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone(formData.phone)) {
      return;
    }
    setLoading(true);
    try {
      const updateData = new FormData();
      updateData.append("full_name", formData.full_name);
      updateData.append("phone", formData.phone);
      updateData.append("apartment_id", formData.apartment_id);
      updateData.append("move_in_date", formData.move_in_date);
      updateData.append("lease_start_date", formData.lease_start_date);
      updateData.append("lease_end_date", formData.lease_end_date);
      updateData.append("monthly_rent", formData.monthly_rent);
      updateData.append("status", formData.status);

      console.log(
        "Updating resident with data:",
        Object.fromEntries(updateData)
      );
      const result = await updateResident(resident.id, updateData);
      console.log("Update result:", result);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Cập nhật cư dân thành công");
        onOpenChange(false);
        console.log("Calling onSuccess to refresh data...");
        onSuccess(); // Refresh data
      }
    } catch (error) {
      console.error("Failed to update resident:", error);
      toast.error("Cập nhật thất bại, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" style={{ borderRadius: "8px" }}>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa cư dân</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin cư dân {resident.full_name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Họ và tên *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                required
                style={{ borderRadius: "8px" }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={resident.email}
                disabled
                className="bg-muted"
                style={{ borderRadius: "8px" }}
              />
              <p className="text-xs text-muted-foreground">
                Email không thể thay đổi
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="0901234567 (không bắt buộc)"
                className={phoneError ? "border-red-500" : ""}
                style={{ borderRadius: "8px" }}
              />
              {phoneError && (
                <p className="text-xs text-red-500">{phoneError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apartment_id">Căn hộ hiện tại</Label>
              <Select
                value={formData.apartment_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, apartment_id: value })
                }
              >
                <SelectTrigger style={{ borderRadius: "8px" }}>
                  <SelectValue placeholder="Chọn căn hộ" />
                </SelectTrigger>
                <SelectContent>
                  {apartments.map((apt) => (
                    <SelectItem key={apt.id} value={apt.id}>
                      {apt.apartment_number} - Tầng {apt.floor}{" "}
                      {apt.building && ` - ${apt.building}`}
                      {apt.status === "occupied" &&
                        apt.id === resident.apartment?.id &&
                        " (Hiện tại)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="move_in_date">Ngày chuyển vào</Label>
                <Input
                  id="move_in_date"
                  type="date"
                  value={formData.move_in_date}
                  onChange={(e) =>
                    setFormData({ ...formData, move_in_date: e.target.value })
                  }
                  placeholder="Chưa cập nhật"
                  style={{ borderRadius: "8px" }}
                />
                {!formData.move_in_date && (
                  <p className="text-xs text-muted-foreground">Chưa cập nhật</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_rent">Tiền thuê hàng tháng (VNĐ)</Label>
                <Input
                  id="monthly_rent"
                  type="number"
                  step="1000"
                  value={formData.monthly_rent}
                  onChange={(e) =>
                    setFormData({ ...formData, monthly_rent: e.target.value })
                  }
                  placeholder="VD: 15000000"
                  style={{ borderRadius: "8px" }}
                />
                {!formData.monthly_rent && (
                  <p className="text-xs text-muted-foreground">Chưa cập nhật</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lease_start_date">Ngày bắt đầu hợp đồng</Label>
                <Input
                  id="lease_start_date"
                  type="date"
                  value={formData.lease_start_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lease_start_date: e.target.value,
                    })
                  }
                  placeholder="Chưa cập nhật"
                  style={{ borderRadius: "8px" }}
                />
                {!formData.lease_start_date && (
                  <p className="text-xs text-muted-foreground">Chưa cập nhật</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lease_end_date">Ngày kết thúc hợp đồng</Label>
                <Input
                  id="lease_end_date"
                  type="date"
                  value={formData.lease_end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, lease_end_date: e.target.value })
                  }
                  placeholder="Chưa cập nhật"
                  style={{ borderRadius: "8px" }}
                />
                {!formData.lease_end_date && (
                  <p className="text-xs text-muted-foreground">Chưa cập nhật</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger style={{ borderRadius: "8px" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                  <SelectItem value="terminated">Đã chấm dứt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              style={{ borderRadius: "8px" }}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading || !!phoneError}
              style={{ borderRadius: "8px" }}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Cập
              nhật
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
