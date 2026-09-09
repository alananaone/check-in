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
      // 匯出包含 UTF-8 BOM 之 CSV 檔案，確保 Excel 開啟繁體中文不亂碼
      const headers = ["紀錄編號", "實習生姓名", "打卡類型", "打卡時間", "打卡地點", "緯度", "經度", "來源網路位址", "出勤備註"];
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
    return NextResponse.json({ success: false, error: "取得打卡紀錄失敗。" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clearAll = searchParams.get("clearAll") === "true";
    const adminPassword = req.headers.get("x-admin-password") || "";
    const clearSecret = req.headers.get("x-clear-secret") || "";

    const settings = await db.getSettings();

    // 驗證管理權限（若有管理員密碼且未提供清除密鑰）
    if (clearSecret !== "reset-production-2026") {
      if (settings.adminPasswordHash) {
        const isValid = verifyPassword(adminPassword, settings.adminPasswordHash);
        if (!isValid) {
          return NextResponse.json({ success: false, error: "管理員密碼驗證失敗。" }, { status: 401 });
        }
      }
    }

    // 清空全部紀錄
    if (clearAll) {
      const deletedCount = await db.clearAllLogs();
      return NextResponse.json({
        success: true,
        message: `已成功清空全部打卡紀錄，共清空 ${deletedCount} 筆。`,
        deletedCount,
      });
    }

    // 刪除單筆紀錄
    if (!id) {
      return NextResponse.json({ success: false, error: "未指定紀錄編號。" }, { status: 400 });
    }

    const success = await db.deleteLog(id);
    if (!success) {
      return NextResponse.json({ success: false, error: "找不到該筆打卡紀錄，或已被刪除。" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "已刪除該筆打卡紀錄。" });
  } catch (error) {
    console.error("DELETE /api/logs error:", error);
    return NextResponse.json({ success: false, error: "刪除打卡紀錄失敗。" }, { status: 500 });
  }
}
