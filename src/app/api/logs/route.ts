import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formatTaiwanDateTime } from "@/lib/utils";

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
      const headers = ["紀錄編號", "防偽驗證碼", "實習生姓名", "打卡類型", "打卡時間", "打卡地點", "緯度", "經度", "來源網路位址", "出勤備註"];
      const rows = logs.map((log) => [
        `"${log.id}"`,
        `"${log.verificationCode || ""}"`,
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

export async function DELETE() {
  // 嚴格遵循「唯讀流水帳（Append-only Log）」原則，拔除日誌刪改功能
  return NextResponse.json(
    {
      success: false,
      error: "系統已實施唯讀出勤流水帳公正協議（Append-only），出勤日誌嚴禁刪除或修改以保全存證效力。",
    },
    { status: 405 }
  );
}
