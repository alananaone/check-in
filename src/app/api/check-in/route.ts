import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getClientIp, isIpAllowed, verifyPassword, generateVerificationCode } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, type, password, latitude, longitude, accuracy, address, note } = body;

    if (!userId || !type) {
      return NextResponse.json(
        { success: false, error: "缺少必要打卡參數（未提供實習生身分或打卡類型）。" },
        { status: 400 }
      );
    }

    if (type !== "CHECK_IN" && type !== "CHECK_OUT") {
      return NextResponse.json(
        { success: false, error: "打卡類型不正確（必須為上班簽到或下班簽退）。" },
        { status: 400 }
      );
    }

    // 1. 驗證實習生帳號與密碼
    const user = await db.getUser(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "找不到該實習生帳號。" }, { status: 404 });
    }

    if (user.passwordHash) {
      const isPwdValid = verifyPassword(password || "", user.passwordHash);
      if (!isPwdValid) {
        return NextResponse.json(
          { success: false, error: "身分密碼驗證失敗，請輸入正確密碼。" },
          { status: 401 }
        );
      }
    }

    // 2. 檢驗 IP 安全限制
    const settings = await db.getSettings();
    const clientIp = getClientIp(req.headers);

    if (settings.ipRestricted) {
      const allowed = isIpAllowed(clientIp, settings.allowedIps);
      if (!allowed) {
        return NextResponse.json(
          {
            success: false,
            error: `IP 限制啟用中：目前來源網路（${clientIp}）不在允許之白名單內，無法打卡。請連線至指定網路。`,
            clientIp,
          },
          { status: 403 }
        );
      }
    }

    // 3. 整理地點文字與最高精度座標（過濾重複之「號」字）
    const cleanAddress = (address && typeof address === "string" && address.trim())
      ? address.trim().replace(/號+/g, "號")
      : (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null)
      ? `座標：${latitude}，${longitude}`
      : "位置資訊未提供或獲取失敗";

    // 4. 產生不可竄改之防偽存證驗證碼
    const timestamp = new Date().toISOString();
    const verificationCode = generateVerificationCode({
      userId: user.id,
      type,
      timestamp,
      ip: clientIp,
      latitude: latitude !== undefined && latitude !== null ? Number(latitude) : null,
      longitude: longitude !== undefined && longitude !== null ? Number(longitude) : null,
    });

    // 5. 寫入打卡日誌（經緯度保持浮點最高精度）
    const newLog = await db.addLog({
      userId: user.id,
      userName: user.name,
      type,
      timestamp,
      latitude: latitude !== undefined && latitude !== null ? Number(latitude) : null,
      longitude: longitude !== undefined && longitude !== null ? Number(longitude) : null,
      accuracy: accuracy !== undefined && accuracy !== null ? Number(accuracy) : null,
      address: cleanAddress,
      ip: clientIp,
      note: (note && typeof note === "string") ? note.trim() : "",
      verificationCode,
    });

    return NextResponse.json({
      success: true,
      message: type === "CHECK_IN" ? "上班簽到成功！" : "下班簽退成功！",
      log: newLog,
    });
  } catch (error) {
    console.error("POST /api/check-in error:", error);
    return NextResponse.json({ success: false, error: "系統錯誤，打卡記錄失敗。" }, { status: 500 });
  }
}
