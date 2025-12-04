"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Receipt,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  FileText,
  Users,
  Building,
  Search,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import type { Invoice, CreateInvoiceRequest } from "@/lib/types/payment";
import {
  getInvoiceTypeDisplayName,
  getInvoiceStatusDisplayName,
} from "@/lib/types/payment";

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [apartments, setApartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter and search state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Form state
  const [formData, setFormData] = useState<CreateInvoiceRequest>({
    user_id: "",
    apartment_id: "",
    type: "RENT",
    amount: 0,
    due_date: "",
    description: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Apply filters and search
    let result = [...invoices];

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter(
        (inv) => inv.status?.toLowerCase() === statusFilter
      );
    }

    // Filter by type
    if (typeFilter !== "all") {
      result = result.filter((inv) => inv.type === typeFilter);
    }

    // Search by user name, apartment number, or description
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((inv) => {
        const userName = getUserName(inv.user_id, inv).toLowerCase();
        const apartmentNumber = getApartmentNumber(
          inv.apartment_id,
          inv
        ).toLowerCase();
        const description = (inv.description || "").toLowerCase();
        return (
          userName.includes(query) ||
          apartmentNumber.includes(query) ||
          description.includes(query)
        );
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.due_date).getTime();
        const dateB = new Date(b.due_date).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else {
        return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
      }
    });

    setFilteredInvoices(result);
  }, [invoices, statusFilter, typeFilter, searchQuery, sortBy, sortOrder]);

  const fetchData = async () => {
    try {
      const [invoicesResponse, usersResponse, apartmentsResponse] =
        await Promise.all([
          fetch("/api/admin/invoices"),
          fetch("/api/admin/users"),
          fetch("/api/admin/apartments"),
        ]);

      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        console.log("Invoices API Response:", invoicesData);
        // Handle response structure: { success, invoices, pagination }
        const invoicesList = Array.isArray(invoicesData)
          ? invoicesData
          : invoicesData.invoices || [];
        console.log("Invoices List:", invoicesList);
        console.log("First Invoice:", invoicesList[0]);
        setInvoices(invoicesList);
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log("Users API Response:", usersData);
        // Fix: API returns { users: [...] } structure
        const usersList = usersData?.users || usersData || [];
        console.log("Users list:", usersList);
        console.log(
          "Resident users:",
          usersList.filter((u: any) => u.role === "resident")
        );
        setUsers(usersList);
      }

      if (apartmentsResponse.ok) {
        const apartmentsData = await apartmentsResponse.json();
        console.log("Apartments API Response:", apartmentsData);
        // Fix: API returns { apartments: [...] } structure
        const apartmentsList =
          apartmentsData?.apartments || apartmentsData || [];
        console.log("Apartments list:", apartmentsList);
        setApartments(apartmentsList);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🟢 Form submitted with data:", formData);
    console.log("🟢 User ID:", formData.user_id);
    console.log("🟢 Apartment ID:", formData.apartment_id);
    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      console.log("🟣 API Response status:", response.status);
      console.log("🟣 API Response body:", result);

      if (response.ok) {
        setSuccess("Tạo hóa đơn thành công");
        setCreateDialogOpen(false);
        setFormData({
          user_id: "",
          apartment_id: "",
          type: "RENT",
          amount: 0,
          due_date: "",
          description: "",
        });
        fetchData(); // Refresh data
      } else {
        console.log("🔴 Error from API:", result.error);
        setError(result.error || "Không thể tạo hóa đơn");
      }
    } catch (error) {
      console.error("Create invoice error:", error);
      setError("Lỗi khi tạo hóa đơn");
    } finally {
      setCreating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "overdue":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case "pending":
        return "secondary";
      case "paid":
        return "default";
      case "overdue":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getUserName = (userId: string, invoice?: Invoice) => {
    // First try to get from invoice data
    if (invoice?.user_name) {
      return invoice.user_name;
    }
    // Fallback to users array
    const user = users.find((u) => u.id === userId);
    const name = user ? user.full_name : "Unknown User";
    if (name === "Unknown User") {
      console.log(
        "Could not find user:",
        userId,
        "in users:",
        users.map((u) => u.id)
      );
    }
    return name;
  };

  const getApartmentNumber = (apartmentId: string, invoice?: Invoice) => {
    // First try to get from invoice data
    if (invoice?.apartment_number) {
      return invoice.apartment_number;
    }
    // Fallback to apartments array
    const apartment = apartments.find((a) => a.id === apartmentId);
    const number = apartment ? apartment.apartment_number : "Unknown Apartment";
    if (number === "Unknown Apartment") {
      console.log(
        "Could not find apartment:",
        apartmentId,
        "in apartments:",
        apartments.map((a) => a.id)
      );
    }
    return number;
  };

  // Always calculate from original invoices array to prevent reset when filtering
  const pendingInvoices = invoices.filter(
    (inv) => inv.status?.toLowerCase() === "pending"
  );
  const paidInvoices = invoices.filter(
    (inv) => inv.status?.toLowerCase() === "paid"
  );
  const overdueInvoices = invoices.filter(
    (inv) => inv.status?.toLowerCase() === "overdue"
  );

  const totalPending = pendingInvoices.reduce(
    (sum, inv) => sum + inv.amount,
    0
  );
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalOverdue = overdueInvoices.reduce(
    (sum, inv) => sum + inv.amount,
    0
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Hóa đơn</h1>
          <p className="text-muted-foreground">
            Quản lý tất cả hóa đơn trong hệ thống
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Hóa đơn</h1>
          <p className="text-muted-foreground">
            Quản lý tất cả hóa đơn trong hệ thống
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tạo hóa đơn mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tạo hóa đơn mới</DialogTitle>
              <DialogDescription>
                Nhập thông tin để tạo hóa đơn cho cư dân
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user_id">Cư dân *</Label>
                  <Select
                    value={formData.user_id}
                    onValueChange={(value) => {
                      console.log(
                        "🔵 Select onValueChange triggered with value:",
                        value
                      );
                      console.log("🔵 Current users array:", users);
                      // Find selected user's apartment
                      const selectedUser = users.find((u) => u.id === value);
                      console.log("🔵 Selected user:", selectedUser);
                      const userApartmentId = selectedUser?.apartment_id || "";
                      console.log("🔵 User apartment ID:", userApartmentId);

                      const newFormData = {
                        ...formData,
                        user_id: value,
                        apartment_id: userApartmentId,
                      };
                      console.log("🔵 New form data:", newFormData);
                      setFormData(newFormData);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn cư dân" />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter((u) => u.role === "resident")
                        .map((user) => (
                          <SelectItem
                            key={user.id}
                            value={user.id}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col w-full pr-4">
                              <span className="font-medium truncate">
                                {user.full_name}
                              </span>
                              <span className="text-xs text-muted-foreground truncate">
                                {user.email}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apartment_id">Căn hộ *</Label>
                  <Select
                    value={formData.apartment_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, apartment_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn căn hộ" />
                    </SelectTrigger>
                    <SelectContent>
                      {apartments.map((apartment) => (
                        <SelectItem key={apartment.id} value={apartment.id}>
                          {apartment.apartment_number} - Tầng {apartment.floor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Loại hóa đơn *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RENT">Tiền thuê</SelectItem>
                      <SelectItem value="ELECTRICITY">Tiền điện</SelectItem>
                      <SelectItem value="WATER">Tiền nước</SelectItem>
                      <SelectItem value="INTERNET">Tiền internet</SelectItem>
                      <SelectItem value="SERVICE">Phí dịch vụ</SelectItem>
                      <SelectItem value="REPAIR">Phí sửa chữa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Số tiền (VNĐ) *</Label>
                  <Input
                    id="amount"
                    type="text"
                    value={
                      formData.amount > 0
                        ? formData.amount.toLocaleString("vi-VN")
                        : ""
                    }
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\./g, "")
                        .replace(/[^0-9]/g, "");
                      setFormData({
                        ...formData,
                        amount: parseInt(value) || 0,
                      });
                    }}
                    placeholder="Nhập số tiền"
                    required
                    className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Hạn thanh toán *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Nhập mô tả chi tiết..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={creating} className="flex-1">
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang tạo...
                    </>
                  ) : (
                    "Tạo hóa đơn"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className={`hover:shadow-lg transition-all cursor-pointer ${
            statusFilter === "pending"
              ? "ring-2 ring-yellow-500 shadow-lg bg-yellow-50"
              : ""
          }`}
          onClick={() => setStatusFilter("pending")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Chờ thanh toán
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingInvoices.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalPending.toLocaleString()} VNĐ
            </p>
          </CardContent>
        </Card>

        <Card
          className={`hover:shadow-lg transition-all cursor-pointer ${
            statusFilter === "paid"
              ? "ring-2 ring-green-500 shadow-lg bg-green-50"
              : ""
          }`}
          onClick={() => setStatusFilter("paid")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã thanh toán</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {paidInvoices.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalPaid.toLocaleString()} VNĐ
            </p>
          </CardContent>
        </Card>

        <Card
          className={`hover:shadow-lg transition-all cursor-pointer ${
            statusFilter === "overdue"
              ? "ring-2 ring-red-500 shadow-lg bg-red-50"
              : ""
          }`}
          onClick={() => setStatusFilter("overdue")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quá hạn</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overdueInvoices.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalOverdue.toLocaleString()} VNĐ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Tất cả hóa đơn</CardTitle>
              <CardDescription>
                {filteredInvoices.length} hóa đơn{" "}
                {statusFilter !== "all" && `(${statusFilter})`}
              </CardDescription>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm cư dân, căn hộ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="pending">Chờ thanh toán</SelectItem>
                  <SelectItem value="paid">Đã thanh toán</SelectItem>
                  <SelectItem value="overdue">Quá hạn</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Receipt className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Loại hóa đơn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="RENT">Tiền thuê</SelectItem>
                  <SelectItem value="ELECTRICITY">Tiền điện</SelectItem>
                  <SelectItem value="WATER">Tiền nước</SelectItem>
                  <SelectItem value="INTERNET">Internet</SelectItem>
                  <SelectItem value="SERVICE">Dịch vụ</SelectItem>
                  <SelectItem value="REPAIR">Sửa chữa</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [by, order] = value.split("-") as [
                    "date" | "amount",
                    "asc" | "desc"
                  ];
                  setSortBy(by);
                  setSortOrder(order);
                }}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Hạn mới nhất</SelectItem>
                  <SelectItem value="date-asc">Hạn cũ nhất</SelectItem>
                  <SelectItem value="amount-desc">Số tiền giảm dần</SelectItem>
                  <SelectItem value="amount-asc">Số tiền tăng dần</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Receipt className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {invoices.length === 0
                  ? "Chưa có hóa đơn"
                  : "Không tìm thấy hóa đơn"}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {invoices.length === 0
                  ? "Tạo hóa đơn đầu tiên để bắt đầu quản lý"
                  : "Thử thay đổi bộ lọc hoặc tìm kiếm khác"}
              </p>
              {(statusFilter !== "all" ||
                typeFilter !== "all" ||
                searchQuery) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusFilter("all");
                    setTypeFilter("all");
                    setSearchQuery("");
                  }}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => (
                <Card
                  key={invoice.id}
                  className="hover:shadow-md transition-shadow border-l-4"
                  style={{
                    borderLeftColor:
                      invoice.status?.toLowerCase() === "paid"
                        ? "#22c55e"
                        : invoice.status?.toLowerCase() === "overdue"
                        ? "#ef4444"
                        : "#eab308",
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          {getStatusIcon(invoice.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-base">
                              {getInvoiceTypeDisplayName(invoice.type)}
                            </p>
                            <Badge
                              variant={getStatusBadgeVariant(invoice.status)}
                              className="text-xs"
                            >
                              {getInvoiceStatusDisplayName(invoice.status)}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span className="truncate">
                                {getUserName(invoice.user_id, invoice)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              <span>
                                {getApartmentNumber(
                                  invoice.apartment_id,
                                  invoice
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Hạn:{" "}
                                {new Date(invoice.due_date).toLocaleDateString(
                                  "vi-VN"
                                )}
                              </span>
                            </div>
                          </div>
                          {invoice.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {invoice.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end sm:flex-col sm:items-end gap-2">
                        <div className="text-right">
                          <p className="text-xl font-bold">
                            {invoice.amount.toLocaleString()} VNĐ
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
