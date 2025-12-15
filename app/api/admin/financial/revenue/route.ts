import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getRevenueSummary } from "@/lib/payments/actions";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Thiếu thông tin ngày bắt đầu và kết thúc" },
        { status: 400 }
      );
    }

    const result = await getRevenueSummary({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Transform to match frontend expectations
    const revenueSummary = {
      total_revenue: result.revenue?.total || 0,
      rent_revenue: result.revenue?.rent || 0,
      utility_revenue: result.revenue?.utility || 0,
      service_revenue: result.revenue?.service || 0,
      monthly_revenue: result.revenue?.monthly || [],
    };

    return NextResponse.json(revenueSummary);
  } catch (error) {
    console.error("Error in GET /api/admin/financial/revenue:", error);
    return NextResponse.json(
      { error: "Lỗi server khi lấy thống kê doanh thu" },
      { status: 500 }
    );
  }
}
