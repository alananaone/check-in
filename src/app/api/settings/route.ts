import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await db.getSettings();
    return NextResponse.json({
      success: true,
      settings: {
        weeklyTargetHours: settings.weeklyTargetHours,
        ipRestricted: settings.ipRestricted,
        allowedIps: settings.allowedIps,
        hasAdminPassword: !!settings.adminPasswordHash,
        updatedAt: settings.updatedAt,
        dbConnected: db.isPostgresConnected(),
      },
    });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ success: false, error: "無法取得系統設定" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      adminPassword,
      weeklyTargetHours,
      ipRestricted,
      allowedIps,
      newAdminPassword,
    } = body;

    const currentSettings = await db.getSettings();

    // Verify admin password if one exists
    if (currentSettings.adminPasswordHash) {
      const isValid = verifyPassword(adminPassword || "", currentSettings.adminPasswordHash);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "管理員密碼驗證失敗，無法修改設定" },
          { status: 401 }
        );
      }
    }

    const updates: Partial<typeof currentSettings> = {};

    if (weeklyTargetHours !== undefined) {
      const hours = parseInt(weeklyTargetHours, 10);
      if (isNaN(hours) || hours <= 0 || hours > 168) {
        return NextResponse.json(
          { success: false, error: "每週實習時數必須為 1 至 168 之間的正整數" },
          { status: 400 }
        );
      }
      updates.weeklyTargetHours = hours;
    }

    if (ipRestricted !== undefined) {
      updates.ipRestricted = Boolean(ipRestricted);
    }

    if (allowedIps !== undefined) {
      if (Array.isArray(allowedIps)) {
        updates.allowedIps = allowedIps.map((ip: string) => ip.trim()).filter(Boolean);
      } else if (typeof allowedIps === "string") {
        updates.allowedIps = allowedIps
          .split(/[\n,]+/)
          .map((ip) => ip.trim())
          .filter(Boolean);
      }
    }

    if (newAdminPassword !== undefined) {
      updates.adminPasswordHash = newAdminPassword ? hashPassword(newAdminPassword) : "";
    }

    const updated = await db.updateSettings(updates);

    return NextResponse.json({
      success: true,
      message: "系統設定更新成功",
      settings: {
        weeklyTargetHours: updated.weeklyTargetHours,
        ipRestricted: updated.ipRestricted,
        allowedIps: updated.allowedIps,
        hasAdminPassword: !!updated.adminPasswordHash,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json({ success: false, error: "更新系統設定失敗" }, { status: 500 });
  }
}
