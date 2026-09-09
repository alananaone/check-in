"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CheckInLog, SystemSettings } from "@/lib/types";
import { formatTaiwanDateTime } from "@/lib/utils";
import {
  ShieldCheck,
  Settings,
  FileSpreadsheet,
  Trash2,
  Lock,
  KeyRound,
  Filter,
  RefreshCw,
  Clock,
  Globe,
  AlertTriangle,
  Check,
  Loader2,
} from "lucide-react";

export default function AdminPage() {
  const [hasAdminPassword, setHasAdminPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  // Settings
  const [settings, setSettings] = useState<SystemSettings>({
    weeklyTargetHours: 16,
    ipRestricted: false,
    allowedIps: [],
    adminPasswordHash: "",
    updatedAt: new Date().toISOString(),
  });
  const [hoursInput, setHoursInput] = useState(16);
  const [ipRestrictedInput, setIpRestrictedInput] = useState(false);
  const [allowedIpsInput, setAllowedIpsInput] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [confirmAdminPassword, setConfirmAdminPassword] = useState("");
  const [saveStatus, setSaveStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Logs
  const [logs, setLogs] = useState<CheckInLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [selectedUserFilter, setSelectedUserFilter] = useState("ALL");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // 1. Check if admin requires password
  const checkAdminAuthStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin-auth");
      const data = await res.json();
      if (data.success) {
        setHasAdminPassword(data.hasPassword);
        if (!data.hasPassword) {
          // Default no password, grant access directly
          setIsAuthenticated(true);
        }
      }
    } catch (err) {
      console.error("Failed to check admin auth:", err);
    }
  }, []);

  // 2. Fetch system settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        setHoursInput(data.settings.weeklyTargetHours);
        setIpRestrictedInput(data.settings.ipRestricted);
        setAllowedIpsInput(data.settings.allowedIps.join("\n"));
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  }, []);

  // 3. Fetch check-in logs
  const fetchLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const url =
        selectedUserFilter === "ALL"
          ? "/api/logs?limit=100"
          : `/api/logs?userId=${selectedUserFilter}&limit=100`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to load admin logs:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [selectedUserFilter]);

  useEffect(() => {
    checkAdminAuthStatus();
  }, [checkAdminAuthStatus]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
      fetchLogs();
    }
  }, [isAuthenticated, fetchSettings, fetchLogs]);

  // Handle Admin Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPasswordInput }),
      });
      const data = await res.json();
      if (data.success && data.authorized) {
        setIsAuthenticated(true);
      } else {
        setAuthError(data.error || "管理員密碼錯誤");
      }
    } catch {
      setAuthError("身分驗證失敗，請檢查網路連線");
    }
  };

  // Handle Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus(null);

    if (newAdminPassword && newAdminPassword !== confirmAdminPassword) {
      setSaveStatus({ type: "error", message: "兩次輸入的管理員新密碼不相符" });
      return;
    }

    setIsSavingSettings(true);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminPassword: adminPasswordInput,
          weeklyTargetHours: hoursInput,
          ipRestricted: ipRestrictedInput,
          allowedIps: allowedIpsInput,
          newAdminPassword: newAdminPassword !== undefined ? newAdminPassword : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSaveStatus({ type: "error", message: data.error || "儲存失敗" });
        setIsSavingSettings(false);
        return;
      }

      setSaveStatus({ type: "success", message: "設定已成功儲存！" });
      setSettings(data.settings);
      setHasAdminPassword(data.settings.hasAdminPassword);
      if (newAdminPassword) {
        setAdminPasswordInput(newAdminPassword);
      }
      setNewAdminPassword("");
      setConfirmAdminPassword("");
    } catch {
      setSaveStatus({ type: "error", message: "伺服器通訊錯誤，設定未儲存" });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handle Delete Log
  const handleDeleteLog = async (logId: string) => {
    try {
      const res = await fetch(`/api/logs?id=${logId}`, {
        method: "DELETE",
        headers: {
          "x-admin-password": adminPasswordInput,
        },
      });
      const data = await res.json();
      if (data.success) {
        setLogs((prev) => prev.filter((l) => l.id !== logId));
        setDeleteConfirmId(null);
      } else {
        alert(data.error || "刪除紀錄失敗");
      }
    } catch {
      alert("網路異常，無法刪除紀錄");
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const url =
      selectedUserFilter === "ALL"
        ? "/api/logs?format=csv"
        : `/api/logs?userId=${selectedUserFilter}&format=csv`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex flex-col bg-palette-base text-palette-ink">
      <Header currentPath="/admini" />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Page Banner */}
        <div className="border-b border-palette-line pb-4 mb-8">
          <div className="flex items-center space-x-2 text-xs font-semibold tracking-wider uppercase text-palette-muted">
            <ShieldCheck className="w-4 h-4 text-palette-ink" aria-hidden="true" />
            <span>差勤後台管理系統</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-light text-palette-ink mt-1 tracking-tight">
            實習時數規範・出勤日誌審查・安全限制
          </h1>
        </div>

        {!isAuthenticated ? (
          /* Authentication Form */
          <div className="max-w-md mx-auto py-12">
            <div className="border border-palette-line-strong bg-palette-surface p-6 sm:p-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 border border-palette-line bg-palette-base flex items-center justify-center">
                  <Lock className="w-4 h-4 text-palette-ink" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-medium text-palette-ink">管理員身分認證</h2>
                  <p className="text-xs text-palette-muted">後台預設免密碼，若未設密碼可直接點擊進入</p>
                </div>
              </div>

              {authError && (
                <div role="alert" className="mb-4 p-3 bg-palette-rose/20 border border-palette-rose text-xs text-palette-ink flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {hasAdminPassword ? (
                  <div>
                    <label htmlFor="admin-pwd-login" className="block text-xs font-medium text-palette-muted uppercase mb-1">
                      請輸入後台管理密碼
                    </label>
                    <input
                      id="admin-pwd-login"
                      type="password"
                      value={adminPasswordInput}
                      onChange={(e) => setAdminPasswordInput(e.target.value)}
                      placeholder="管理員密碼"
                      className="w-full px-3 py-2 bg-palette-base border border-palette-line-strong text-palette-ink text-sm focus:outline-none focus:border-palette-ink"
                      autoFocus
                    />
                  </div>
                ) : (
                  <p className="text-xs text-palette-muted py-2">
                    系統偵測目前尚未設定管理員密碼。點擊下方按鈕即可直接以管理權限登入。
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-palette-ink text-palette-base text-xs tracking-wider uppercase font-medium hover:opacity-90 transition-opacity"
                >
                  {hasAdminPassword ? "驗證並登入後台" : "直接進入後台"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <div className="space-y-12">
            {/* Section 1: System Settings */}
            <section aria-labelledby="settings-heading" className="border-b border-palette-line pb-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-palette-muted" aria-hidden="true" />
                  <h2 id="settings-heading" className="text-sm font-semibold tracking-wider text-palette-ink uppercase">
                    實習制度與安全設定 (System Settings)
                  </h2>
                </div>
                {settings.updatedAt && (
                  <span className="text-[11px] font-mono text-palette-muted hidden sm:inline">
                    上次更新：{formatTaiwanDateTime(settings.updatedAt)}
                  </span>
                )}
              </div>

              {saveStatus && (
                <div
                  role="status"
                  className={`mb-6 p-3.5 border text-xs flex items-center space-x-2 ${
                    saveStatus.type === "success"
                      ? "bg-palette-sage/20 border-palette-sage text-palette-ink"
                      : "bg-palette-rose/20 border-palette-rose text-palette-ink"
                  }`}
                >
                  {saveStatus.type === "success" ? (
                    <Check className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  )}
                  <span>{saveStatus.message}</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Weekly target hours */}
                  <div className="p-4 border border-palette-line bg-palette-surface/30">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-palette-muted" aria-hidden="true" />
                      <label htmlFor="weekly-hours-input" className="text-xs font-semibold text-palette-ink uppercase">
                        每週實習規定時數 (以小時為單位)
                      </label>
                    </div>
                    <p className="text-xs text-palette-muted mb-3">
                      設定兩位實習生每週應累積之實習時數基準（預設為 16 小時）
                    </p>
                    <div className="flex items-center space-x-2">
                      <input
                        id="weekly-hours-input"
                        type="number"
                        min="1"
                        max="168"
                        required
                        value={hoursInput}
                        onChange={(e) => setHoursInput(parseInt(e.target.value, 10) || 0)}
                        className="w-32 px-3 py-2 bg-palette-base border border-palette-line-strong text-sm font-mono text-palette-ink focus:outline-none focus:border-palette-ink"
                      />
                      <span className="text-xs text-palette-muted">小時 / 週</span>
                    </div>
                  </div>

                  {/* IP Restriction toggle & whitelist */}
                  <div className="p-4 border border-palette-line bg-palette-surface/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-palette-muted" aria-hidden="true" />
                        <label htmlFor="ip-restricted-checkbox" className="text-xs font-semibold text-palette-ink uppercase">
                          限制打卡 IP 地址 (預設不限制)
                        </label>
                      </div>
                      <input
                        id="ip-restricted-checkbox"
                        type="checkbox"
                        checked={ipRestrictedInput}
                        onChange={(e) => setIpRestrictedInput(e.target.checked)}
                        className="w-4 h-4 accent-palette-ink"
                      />
                    </div>
                    <p className="text-xs text-palette-muted mb-3">
                      預設為「不限制」（供未來或實體辦公室啟用）。勾選後僅有白名單內的 IP 可成功打卡。
                    </p>

                    <div>
                      <label htmlFor="allowed-ips-textarea" className="block text-[11px] font-mono text-palette-muted uppercase mb-1">
                        允許之 IP 白名單 (一行一個，或以逗點分隔)
                      </label>
                      <textarea
                        id="allowed-ips-textarea"
                        rows={3}
                        disabled={!ipRestrictedInput}
                        value={allowedIpsInput}
                        onChange={(e) => setAllowedIpsInput(e.target.value)}
                        placeholder="例如：&#10;140.112.1.1&#10;61.220.10.25"
                        className="w-full px-3 py-2 bg-palette-base border border-palette-line-strong text-xs font-mono text-palette-ink focus:outline-none focus:border-palette-ink disabled:opacity-40"
                      />
                    </div>
                  </div>
                </div>

                {/* Admin Password Change */}
                <div className="p-4 border border-palette-line bg-palette-surface/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <KeyRound className="w-4 h-4 text-palette-muted" aria-hidden="true" />
                    <h3 className="text-xs font-semibold text-palette-ink uppercase">
                      變更後台管理密碼
                    </h3>
                  </div>
                  <p className="text-xs text-palette-muted mb-3">
                    預設為免密碼模式。若填入新密碼並儲存，之後存取 `/admini` 需驗證密碼；若清空儲存則恢復免密碼。
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                    <div>
                      <label htmlFor="new-admin-pwd" className="block text-[11px] font-medium text-palette-muted uppercase mb-1">
                        新管理員密碼
                      </label>
                      <input
                        id="new-admin-pwd"
                        type="password"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        placeholder="留空代表免密碼"
                        className="w-full px-3 py-2 bg-palette-base border border-palette-line-strong text-xs text-palette-ink focus:outline-none focus:border-palette-ink"
                        autoComplete="new-password"
                      />
                    </div>
                    <div>
                      <label htmlFor="confirm-admin-pwd" className="block text-[11px] font-medium text-palette-muted uppercase mb-1">
                        確認新管理員密碼
                      </label>
                      <input
                        id="confirm-admin-pwd"
                        type="password"
                        value={confirmAdminPassword}
                        onChange={(e) => setConfirmAdminPassword(e.target.value)}
                        placeholder="再次輸入新密碼"
                        className="w-full px-3 py-2 bg-palette-base border border-palette-line-strong text-xs text-palette-ink focus:outline-none focus:border-palette-ink"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-6 py-2.5 bg-palette-ink text-palette-base text-xs tracking-wider uppercase font-medium hover:opacity-90 transition-opacity flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isSavingSettings && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                    <span>儲存所有系統設定</span>
                  </button>
                </div>
              </form>
            </section>

            {/* Section 2: Attendance Logs Audit */}
            <section aria-labelledby="logs-heading" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-palette-line pb-3">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-palette-muted" aria-hidden="true" />
                  <h2 id="logs-heading" className="text-sm font-semibold tracking-wider text-palette-ink uppercase">
                    實習打卡總日誌審核 (Check-In Logs)
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Filter by Intern */}
                  <div className="flex items-center space-x-1 border border-palette-line-strong bg-palette-base px-2 py-1 text-xs">
                    <Filter className="w-3 h-3 text-palette-muted" aria-hidden="true" />
                    <select
                      value={selectedUserFilter}
                      onChange={(e) => setSelectedUserFilter(e.target.value)}
                      className="bg-transparent text-palette-ink focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">全部實習生 (王睿宏 & 林沁臻)</option>
                      <option value="wang-rui-hong">僅看 王睿宏</option>
                      <option value="lin-qin-zhen">僅看 林沁臻</option>
                    </select>
                  </div>

                  {/* Refresh */}
                  <button
                    type="button"
                    onClick={fetchLogs}
                    className="p-1.5 border border-palette-line text-palette-muted hover:text-palette-ink hover:bg-palette-surface transition-colors"
                    title="重新整理日誌"
                    aria-label="重新整理日誌"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? "animate-spin" : ""}`} />
                  </button>

                  {/* Export CSV */}
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="px-3 py-1.5 border border-palette-line-strong bg-palette-surface text-palette-ink text-xs hover:bg-palette-subtle transition-colors flex items-center space-x-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-palette-ink" aria-hidden="true" />
                    <span>匯出 CSV 報表</span>
                  </button>
                </div>
              </div>

              {/* Logs Table */}
              {isLoadingLogs ? (
                <div className="py-16 text-center text-xs text-palette-muted animate-pulse">
                  讀取差勤記錄中...
                </div>
              ) : logs.length === 0 ? (
                <div className="py-16 text-center border border-palette-line bg-palette-surface/30">
                  <div className="text-sm font-medium text-palette-ink">目前尚無任何打卡紀錄</div>
                  <p className="text-xs text-palette-muted mt-1">實習生簽到後資料將即時匯流至此處</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-palette-line-strong text-palette-muted font-medium uppercase text-[11px] tracking-wider">
                        <th scope="col" className="py-2.5 px-3">時間</th>
                        <th scope="col" className="py-2.5 px-3">姓名</th>
                        <th scope="col" className="py-2.5 px-3">動作</th>
                        <th scope="col" className="py-2.5 px-3">打卡地點</th>
                        <th scope="col" className="py-2.5 px-3">經緯度</th>
                        <th scope="col" className="py-2.5 px-3">來源 IP</th>
                        <th scope="col" className="py-2.5 px-3">備註</th>
                        <th scope="col" className="py-2.5 px-3 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-palette-line text-palette-ink">
                      {logs.map((log) => {
                        const isCheckIn = log.type === "CHECK_IN";
                        return (
                          <tr key={log.id} className="hover:bg-palette-surface/60 transition-colors">
                            <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                              {formatTaiwanDateTime(log.timestamp)}
                            </td>
                            <td className="py-2.5 px-3 font-medium whitespace-nowrap">
                              {log.userName}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`inline-block text-[11px] px-2 py-0.5 font-medium border ${
                                  isCheckIn
                                    ? "bg-palette-sage/30 border-palette-sage text-palette-ink"
                                    : "bg-palette-rose/30 border-palette-rose text-palette-ink"
                                }`}
                              >
                                {isCheckIn ? "上班簽到" : "下班簽退"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 max-w-xs truncate" title={log.address}>
                              {log.address || "-"}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-palette-muted whitespace-nowrap">
                              {log.latitude && log.longitude
                                ? `${log.latitude.toFixed(4)}, ${log.longitude.toFixed(4)}`
                                : "-"}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-palette-muted whitespace-nowrap">
                              {log.ip}
                            </td>
                            <td className="py-2.5 px-3 text-palette-muted max-w-xs truncate">
                              {log.note || "-"}
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              {deleteConfirmId === log.id ? (
                                <div className="inline-flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="px-2 py-0.5 text-[10px] bg-palette-rose text-palette-ink border border-palette-line-strong hover:opacity-90 font-medium"
                                  >
                                    確定刪除
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-2 py-0.5 text-[10px] border border-palette-line text-palette-muted hover:text-palette-ink"
                                  >
                                    取消
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(log.id)}
                                  className="text-palette-faint hover:text-palette-rose transition-colors p-1"
                                  title="刪除此筆異常紀錄"
                                  aria-label="刪除紀錄"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
