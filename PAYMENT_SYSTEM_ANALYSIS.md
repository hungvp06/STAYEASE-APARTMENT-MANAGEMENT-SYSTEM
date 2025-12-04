## FLOW THANH TOÁN

### **Flow 1: Admin tạo hóa đơn**

```mermaid
graph TD
    A[Admin vào trang Quản lý hóa đơn] --> B[Bấm "Tạo hóa đơn mới"]
    B --> C[Chọn Cư dân resident]
    C --> D[Tự động điền Căn hộ của cư dân]
    D --> E[Chọn loại hóa đơn: RENT/ELECTRICITY/WATER/etc]
    E --> F[Nhập số tiền]
    F --> G[Chọn hạn thanh toán]
    G --> H[Nhập mô tả optional]
    H --> I[Submit form]
    I --> J{Validate}
    J -->|Valid| K[Tạo Invoice trong DB]
    J -->|Invalid| L[Hiện lỗi]
    K --> M[Invoice status = 'pending']
    M --> N[Hiện thông báo thành công]
```

### **Flow 2: Resident xem và thanh toán hóa đơn**

```mermaid
graph TD
    A[Resident vào trang Hóa đơn] --> B[Load danh sách hóa đơn của mình]
    B --> C[Hiển thị tabs: Chờ thanh toán / Đã thanh toán / Quá hạn]
    C --> D[Resident chọn hóa đơn cần thanh toán]
    D --> E[Bấm "Thanh toán ngay"]
    E --> F[Chọn phương thức: VNPay/MoMo/Bank Transfer]
    F --> G{Phương thức nào?}
    G -->|VNPay/MoMo| H[Redirect đến gateway không khả dụng]
    G -->|Bank Transfer| I[Tạo Transaction pending]
    I --> J[Tạo mã giao dịch duy nhất]
    J --> K[Redirect đến trang Payment QR]
    K --> L[Generate QR Code với bank info]
    L --> M[Hiện QR Code + Thông tin chuyển khoản]
    M --> N[Resident quét QR bằng banking app]
    N --> O[Resident chuyển khoản thực tế]
    O --> P[Resident bấm "Tôi đã thanh toán"]
    P --> Q[Gửi xác nhận đến Admin]
    Q --> R[Transaction status = 'pending']
    R --> S[Chờ Admin xác nhận]
```

### **Flow 3: Admin xác nhận thanh toán**

```mermaid
graph TD
    A[Admin nhận thông báo có thanh toán pending] --> B[Vào trang Quản lý hóa đơn]
    B --> C[Xem hóa đơn có transaction pending]
    C --> D[Kiểm tra trong banking app]
    D --> E{Đã nhận tiền?}
    E -->|Có| F[Bấm "Xác nhận thanh toán"]
    E -->|Không| G[Bấm "Từ chối"]
    F --> H[Transaction status = 'completed']
    H --> I[Invoice status = 'paid']
    I --> J[Invoice paidDate = now]
    J --> K[Gửi thông báo đến Resident]
    G --> L[Transaction status = 'failed']
    L --> M[Gửi thông báo yêu cầu thanh toán lại]
```

---

##  API ENDPOINTS

### **Admin APIs**

#### 1. GET `/api/admin/invoices`
**Lấy danh sách tất cả hóa đơn**

**Response:**
```json
{
  "success": true,
  "invoices": [
    {
      "id": "65abc123...",
      "invoice_number": "INV-1737635200-1",
      "user_id": "65xyz789...",
      "user_name": "Nguyễn Văn A",
      "user_email": "resident@example.com",
      "apartment_id": "65apt456...",
      "apartment_number": "A-101",
      "building": "Tòa A",
      "amount": 5000000,
      "status": "pending",
      "due_date": "2025-02-01T00:00:00Z",
      "created_at": "2025-01-23T10:00:00Z",
      "description": "Tiền thuê tháng 2/2025"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "total_pages": 2
  }
}
```

#### 2. POST `/api/admin/invoices`
**Tạo hóa đơn mới**

**Request:**
```json
{
  "user_id": "65xyz789...",
  "apartment_id": "65apt456...",
  "type": "RENT",
  "amount": 5000000,
  "due_date": "2025-02-01",
  "description": "Tiền thuê tháng 2/2025"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tạo hóa đơn thành công",
  "data": {
    "id": "65abc123...",
    "invoice_number": "INV-1737635200-1",
    "user_id": "65xyz789...",
    "apartment_id": "65apt456...",
    "type": "rent",
    "amount": 5000000,
    "status": "pending",
    "due_date": "2025-02-01T00:00:00Z",
    "created_at": "2025-01-23T10:00:00Z"
  }
}
```

#### 3. POST `/api/invoices/[id]/confirm-payment`
**Admin xác nhận thanh toán**

**Request:**
```json
{
  "transaction_code": "STAY-20250123-A5F3G2",
  "payment_gateway": "bank_transfer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Xác nhận thanh toán thành công"
}
```

### **Resident APIs**

#### 4. GET `/api/me/invoices`
**Lấy hóa đơn của cư dân hiện tại**

**Response:** Tương tự GET `/api/admin/invoices`

#### 5. GET `/api/me/transactions`
**Lấy lịch sử giao dịch**

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "65txn123...",
      "invoice_id": "65inv456...",
      "payment_gateway": "BANK_TRANSFER",
      "transaction_code": "STAY-20250123-A5F3G2",
      "amount_paid": 5000000,
      "payment_date": "2025-01-23T14:30:00Z",
      "status": "SUCCESS",
      "created_at": "2025-01-23T14:30:00Z"
    }
  ]
}
```

### **Payment APIs**

#### 6. POST `/api/invoices/[id]/create-payment-url`
**Tạo URL thanh toán**

**Request:**
```json
{
  "payment_gateway": "BANK_TRANSFER",
  "return_url": "http://localhost:3000/resident/invoices"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment_url": "/payment/65abc123?gateway=BANK_TRANSFER&returnUrl=...&txn=STAY-20250123-A5F3G2",
    "transaction_code": "STAY-20250123-A5F3G2",
    "expires_at": "2025-01-23T15:00:00Z"
  }
}
```

#### 7. POST `/api/invoices/[id]/generate-qr`
**Tạo QR Code thanh toán**

**Request:**
```json
{
  "transaction_code": "STAY-20250123-A5F3G2"
}
```

**Response:**
```json
{
  "qrCodeDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "bankInfo": {
    "bankId": "VCB",
    "accountNo": "1234567890",
    "accountName": "CONG TY STAYEASE"
  },
  "amount": 5000000,
  "transferContent": "STAYEASE INV-1737635200-1 5000000",
  "transactionCode": "STAY-20250123-A5F3G2",
  "invoiceNumber": "INV-1737635200-1",
  "expiresAt": "2025-01-23T15:00:00Z"
}
```


## NOTES & LIMITATIONS

### **Hiện tại**

✅ **Đã implement:**
- Tạo hóa đơn từ admin
- Xem hóa đơn từ resident
- QR Code generation (VietQR standard)
- Payment page UI
- Transaction tracking
- Basic validation

⚠️ **Limitations:**
- QR Code là "ảo" (không kết nối banking API thực)
- Cần admin confirm thủ công
- Chưa có automated payment verification
- Chưa có email/SMS notifications



## TESTING CHECKLIST

### **Admin Flow**
- [ ] Tạo hóa đơn với đầy đủ thông tin
- [ ] Tạo hóa đơn thiếu thông tin (validation)
- [ ] Xem danh sách hóa đơn với filters
- [ ] Search hóa đơn theo cư dân/căn hộ
- [ ] Sort hóa đơn theo ngày/số tiền
- [ ] Xác nhận payment từ resident

### **Resident Flow**
- [ ] Xem danh sách hóa đơn của mình
- [ ] Filter theo status (pending/paid/overdue)
- [ ] Click thanh toán và chọn Bank Transfer
- [ ] Xem QR Code và thông tin chuyển khoản
- [ ] Click "Tôi đã thanh toán"
- [ ] Xem lịch sử giao dịch

### **Payment Flow**
- [ ] QR Code hiển thị đúng
- [ ] Countdown timer hoạt động
- [ ] Copy thông tin chuyển khoản
- [ ] Transaction code unique
- [ ] Expiration time 15 minutes
- [ ] Return URL đúng sau payment

---

**Environment Variables:**
```env
# Bank Configuration (for QR Code)
BANK_ID=VCB
BANK_ACCOUNT_NO=1234567890
BANK_ACCOUNT_NAME=CONG TY STAYEASE
```