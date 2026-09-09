import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await db.getSettings();
    return NextResponse.json({
      success: true,
      hasPassword: !!settings.adminPasswordHash,
    });
  } catch (error) {
    console.error("GET /api/admin-auth error:", error);
    return NextResponse.json({ success: false, error: "驗證狀態查詢失敗。" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;
    const settings = await db.getSettings();

    if (!settings.adminPasswordHash) {
      // 尚未設定密碼，直接允許授權
      return NextResponse.json({ success: true, authorized: true });
    }

    const isValid = verifyPassword(password || "", settings.adminPasswordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, authorized: false, error: "管理員密碼錯誤。" },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, authorized: true });
  } catch (error) {
    console.error("POST /api/admin-auth error:", error);
    return NextResponse.json({ success: false, error: "身分驗證失敗。" }, { status: 500 });
  }
}
