import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formatTaiwanDateTime, verifyPassword } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const format = searchParams.get("format");

    const logs = await db.getLogs({ userId, limit });

    if (format === "csv") {
      // Generate CSV with BOM for UTF-8 Excel support
      const headers = ["紀錄ID", "實習生姓名", "類型", "時間", "打卡地址", "緯度", "經度", "IP位址", "備註"];
      const rows = logs.map((log) => [
        `"${log.id}"`,
        `"${log.userName}"`,
        `"${log.type === "CHECK_IN" ? "上班簽到" : "下班簽退"}"`,
        `"${formatTaiwanDateTime(log.timestamp)}"`,
        `"${(log.address || "").replace(/"/g, '""')}"`,
        `"${log.latitude ?? ""}"`,
        `"${log.longitude ?? ""}"`,
        `"${log.ip}"`,
        `"${(log.note || "").replace(/"/g, '""')}"`,
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="check-in-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error("GET /api/logs error:", error);
    return NextResponse.json({ success: false, error: "取得打卡紀錄失敗" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const adminPassword = req.headers.get("x-admin-password") || "";

    if (!id) {
      return NextResponse.json({ success: false, error: "未指定紀錄 ID" }, { status: 400 });
    }

    // Verify admin credentials
    const settings = await db.getSettings();
    if (settings.adminPasswordHash) {
      const isValid = verifyPassword(adminPassword, settings.adminPasswordHash);
      if (!isValid) {
        return NextResponse.json({ success: false, error: "管理員密碼驗證失敗" }, { status: 401 });
      }
    }

    const success = await db.deleteLog(id);
    if (!success) {
      return NextResponse.json({ success: false, error: "找不到該筆打卡紀錄或已被刪除" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "已刪除打卡紀錄" });
  } catch (error) {
    console.error("DELETE /api/logs error:", error);
    return NextResponse.json({ success: false, error: "刪除打卡紀錄失敗" }, { status: 500 });
  }
}
