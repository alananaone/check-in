import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateWeeklyHours, hashPassword, verifyPassword } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await db.getUsers();
    const settings = await db.getSettings();
    const allLogs = await db.getLogs();

    const result = users.map((user) => {
      const userLogs = allLogs.filter((l) => l.userId === user.id);
      const weeklyStats = calculateWeeklyHours(userLogs);
      const lastLog = userLogs[0] || null;

      return {
        id: user.id,
        name: user.name,
        hasPassword: !!user.passwordHash,
        isClockedIn: weeklyStats.isClockedIn,
        completedHours: weeklyStats.completedHours,
        activeSessionHours: weeklyStats.activeSessionHours,
        totalHours: weeklyStats.totalHours,
        targetHours: settings.weeklyTargetHours,
        lastLog,
      };
    });

    return NextResponse.json({
      success: true,
      users: result,
      dbConnected: db.isPostgresConnected(),
    });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ success: false, error: "無法取得實習生資訊。" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, currentPassword, newPassword } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "缺少使用者識別碼。" }, { status: 400 });
    }

    const user = await db.getUser(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "找不到該實習生帳號。" }, { status: 404 });
    }

    // 驗證目前密碼
    if (user.passwordHash) {
      const isValid = verifyPassword(currentPassword || "", user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ success: false, error: "目前密碼不正確。" }, { status: 401 });
      }
    }

    // 雜湊新密碼（若為空字串則清除密碼恢復免密碼模式）
    const newHash = newPassword ? hashPassword(newPassword) : "";
    await db.updateUserPassword(userId, newHash);

    return NextResponse.json({
      success: true,
      message: newPassword ? "密碼已成功更新！" : "已清除密碼（改為免密碼模式）。",
    });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ success: false, error: "更新密碼失敗。" }, { status: 500 });
  }
}
