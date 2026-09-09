"use client";

import { useState } from "react";
import { CheckInType } from "@/lib/types";
import { LocationData } from "./LocationDetector";
import { UserStats } from "./UserSelector";
import { LogIn, LogOut, Loader2, Check, AlertTriangle, Key } from "lucide-react";

interface PunchPanelProps {
  currentUser: UserStats;
  currentLocation: LocationData;
  onPunchSuccess: () => void;
}

export default function PunchPanel({
  currentUser,
  currentLocation,
  onPunchSuccess,
}: PunchPanelProps) {
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handlePunch = async (type: CheckInType) => {
    // Basic verification
    if (currentUser.hasPassword && !password.trim()) {
      setAlert({
        type: "error",
        message: `請先輸入 ${currentUser.name} 的個人密碼以完成身分驗證`,
      });
      return;
    }

    setIsSubmitting(true);
    setAlert(null);

    try {
      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          type,
          password: password.trim(),
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          address: currentLocation.address || "未取得詳細地址",
          note: note.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setAlert({
          type: "error",
          message: data.error || "打卡失敗，請稍後再試",
        });
        setIsSubmitting(false);
        return;
      }

      setAlert({
        type: "success",
        message: `${data.message}！打卡時間已成功寫入系統紀錄。`,
      });
      setPassword("");
      setNote("");
      onPunchSuccess();
    } catch (err) {
      console.error("Punch error:", err);
      setAlert({
        type: "error",
        message: "連線異常，無法送出打卡請求，請檢查網路連線",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section aria-label="打卡操作區域" className="w-full border-b border-palette-line py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Status notification banner */}
        {alert && (
          <div
            role="alert"
            className={`mb-6 p-3.5 border text-sm flex items-start space-x-2.5 transition-all ${
              alert.type === "success"
                ? "bg-palette-sage/20 border-palette-sage text-palette-ink"
                : "bg-palette-rose/20 border-palette-rose text-palette-ink"
            }`}
          >
            {alert.type === "success" ? (
              <Check className="w-4 h-4 text-palette-ink flex-shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-palette-ink flex-shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <span className="leading-relaxed">{alert.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          {/* Left inputs: password if required, and note */}
          <div className="md:col-span-6 space-y-4">
            {currentUser.hasPassword ? (
              <div>
                <label
                  htmlFor="user-password-input"
                  className="block text-xs font-semibold text-palette-muted tracking-wider uppercase mb-1.5"
                >
                  輸入打卡密碼 ({currentUser.name})
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-palette-faint">
                    <Key className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <input
                    id="user-password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="請輸入您的個人打卡密碼"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-palette-base border border-palette-line-strong text-palette-ink focus:outline-none focus:border-palette-ink"
                    autoComplete="current-password"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-palette-surface/60 border border-palette-line text-xs text-palette-muted flex items-center justify-between">
                <span>目前帳號預設為免密碼模式</span>
                <span className="text-[11px] text-palette-faint font-mono">
                  可隨時透過姓名旁鎖頭設定密碼
                </span>
              </div>
            )}

            <div>
              <label
                htmlFor="punch-note-input"
                className="block text-xs font-semibold text-palette-muted tracking-wider uppercase mb-1.5"
              >
                出勤工作備註 (選填)
              </label>
              <input
                id="punch-note-input"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="例如：台少盟辦公室、居家實習、外部培訓或公務會議"
                className="w-full px-3 py-2 text-sm bg-palette-base border border-palette-line-strong text-palette-ink focus:outline-none focus:border-palette-ink placeholder:text-palette-faint"
              />
            </div>
          </div>

          {/* Right: Big punch action buttons */}
          <div className="md:col-span-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Check In Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handlePunch("CHECK_IN")}
              className={`flex-1 py-3.5 px-5 border flex items-center justify-center space-x-2.5 transition-all text-palette-ink font-semibold tracking-wide ${
                currentUser.isClockedIn
                  ? "bg-palette-surface border-palette-line hover:bg-palette-subtle"
                  : "bg-palette-sage border-palette-line-strong hover:bg-palette-sage-hover"
              } disabled:opacity-50`}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <LogIn className="w-4 h-4" aria-hidden="true" />
              )}
              <span className="text-sm sm:text-base">
                {currentUser.isClockedIn ? "再次簽到 (上班)" : "上班簽到"}
              </span>
            </button>

            {/* Check Out Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handlePunch("CHECK_OUT")}
              className={`flex-1 py-3.5 px-5 border flex items-center justify-center space-x-2.5 transition-all text-palette-ink font-semibold tracking-wide ${
                currentUser.isClockedIn
                  ? "bg-palette-rose border-palette-line-strong hover:bg-palette-rose-hover"
                  : "bg-palette-surface border-palette-line hover:bg-palette-subtle"
              } disabled:opacity-50`}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="w-4 h-4" aria-hidden="true" />
              )}
              <span className="text-sm sm:text-base">下班簽退</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
