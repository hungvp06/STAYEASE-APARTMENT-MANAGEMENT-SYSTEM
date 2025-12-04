import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { generatePaymentQRCode } from "@/lib/payments/qr-actions";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Người dùng chưa đăng nhập" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { transaction_code } = body;

    if (!transaction_code) {
      return NextResponse.json(
        { error: "Thiếu mã giao dịch" },
        { status: 400 }
      );
    }

    const result = await generatePaymentQRCode(params.id, transaction_code);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in POST /api/invoices/[id]/generate-qr:", error);
    return NextResponse.json(
      { error: "Lỗi server khi tạo mã QR" },
      { status: 500 }
    );
  }
}
