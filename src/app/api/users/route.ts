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
        email: user.email || "",
        hasPassword: !!user.passwordHash,
        isClockedIn: weeklyStats.isClockedIn,
        completedHours: weeklyStats.completedHours,
        activeSessionHours: weeklyStats.activeSessionHours,
        totalHours: weeklyStats.totalHours,
        targetHours: settings.weeklyTargetHours,
        createdAt: user.createdAt,
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
    return NextResponse.json({ success: false, error: "無法取得實習生名冊資訊。" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, name, email, userId, currentPassword, newPassword } = body;
    const adminPassword = req.headers.get("x-admin-password") || body.adminPassword || "";

    // 1. 新增實習生人員
    if (action === "create" || (name && !userId)) {
      if (!name || typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ success: false, error: "請提供實習生姓名。" }, { status: 400 });
      }

      // 檢查管理員權限（若有設定管理員密碼）
      const settings = await db.getSettings();
      if (settings.adminPasswordHash) {
        const isValid = verifyPassword(adminPassword, settings.adminPasswordHash);
        if (!isValid) {
          return NextResponse.json({ success: false, error: "管理員身分驗證失敗，無法新增人員。" }, { status: 401 });
        }
      }

      const newUser = await db.addUser(name.trim(), typeof email === "string" ? email.trim() : "");
      return NextResponse.json({
        success: true,
        message: `已成功將「${newUser.name}」加入實習生名冊！`,
        user: newUser,
      });
    }

    // 2. 實習生個人變更或清除密碼
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
    return NextResponse.json({ success: false, error: "操作失敗，請檢查輸入。" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || searchParams.get("id");
    const adminPassword = req.headers.get("x-admin-password") || "";

    if (!userId) {
      return NextResponse.json({ success: false, error: "未指定欲移除之實習生識別碼。" }, { status: 400 });
    }

    // 驗證管理權限
    const settings = await db.getSettings();
    if (settings.adminPasswordHash) {
      const isValid = verifyPassword(adminPassword, settings.adminPasswordHash);
      if (!isValid) {
        return NextResponse.json({ success: false, error: "管理員身分驗證失敗，無法移除人員。" }, { status: 401 });
      }
    }

    const success = await db.deleteUser(userId);
    if (!success) {
      return NextResponse.json({ success: false, error: "找不到該實習生或已被移除。" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "已成功從名冊中移除該實習生。",
    });
  } catch (error) {
    console.error("DELETE /api/users error:", error);
    return NextResponse.json({ success: false, error: "移除實習生失敗。" }, { status: 500 });
  }
}
