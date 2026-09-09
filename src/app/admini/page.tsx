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
  Database,
} from "lucide-react";

export default function AdminPage() {
  const [hasAdminPassword, setHasAdminPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  // 系統設定
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
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  // 打卡紀錄日誌
  const [logs, setLogs] = useState<CheckInLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [selectedUserFilter, setSelectedUserFilter] = useState("ALL");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // 1. 檢查管理員是否已設密碼
  const checkAdminAuthStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin-auth");
      const data = await res.json();
      if (data.success) {
        setHasAdminPassword(data.hasPassword);
        if (!data.hasPassword) {
          // 預設無密碼，直接開放進入
          setIsAuthenticated(true);
        }
      }
    } catch (err) {
      console.error("Failed to check admin auth:", err);
    }
  }, []);

  // 2. 載入系統設定
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        setDbConnected(Boolean(data.settings.dbConnected));
        setHoursInput(data.settings.weeklyTargetHours);
        setIpRestrictedInput(data.settings.ipRestricted);
        setAllowedIpsInput(data.settings.allowedIps.join("\n"));
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  }, []);

  // 3. 載入打卡紀錄
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

  // 管理員身分驗證登入
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
        setAuthError(data.error || "管理員密碼錯誤。");
      }
    } catch {
      setAuthError("身分驗證失敗，請檢查網路連線。");
    }
  };

  // 儲存系統設定
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus(null);

    if (newAdminPassword && newAdminPassword !== confirmAdminPassword) {
      setSaveStatus({ type: "error", message: "兩次輸入的管理員新密碼不相符。" });
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
        setSaveStatus({ type: "error", message: data.error || "儲存失敗，請重試。" });
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
      setSaveStatus({ type: "error", message: "伺服器通訊異常，設定未儲存。" });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // 刪除單筆紀錄
  const handleDeleteLog = async (logId: string) => {
    try {
      const res = await fetch(`/api/logs?id=${logId}`, {
        method: "DELETE",
        headers: {
          "x-admin-password": adminPasswordInput,
          "x-clear-secret": "reset-production-2026",
        },
      });
      const data = await res.json();
      if (data.success) {
        setLogs((prev) => prev.filter((l) => l.id !== logId));
        setDeleteConfirmId(null);
      } else {
        alert(data.error || "刪除紀錄失敗。");
      }
    } catch {
      alert("網路連線異常，無法刪除紀錄。");
    }
  };

  // 清空所有測試紀錄
  const handleClearAllLogs = async () => {
    const isConfirmed = window.confirm("確定要清空所有測試出勤打卡紀錄嗎？此動作將永久清除目前所有打卡日誌。");
    if (!isConfirmed) return;

    try {
      const res = await fetch("/api/logs?clearAll=true", {
        method: "DELETE",
        headers: {
          "x-admin-password": adminPasswordInput,
          "x-clear-secret": "reset-production-2026",
        },
      });
      const data = await res.json();
      if (data.success) {
        setLogs([]);
        alert("已成功清空所有測試出勤紀錄！系統已準備就緒正式上線。");
      } else {
        alert(data.error || "清空紀錄失敗，請重試。");
      }
    } catch {
      alert("網路連線異常，無法清空紀錄。");
    }
  };

  // 匯出 CSV 報表
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
        {/* 頂部標題與狀態 */}
        <div className="border-b border-palette-line pb-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold tracking-wider uppercase text-palette-muted">
              <ShieldCheck className="w-4 h-4 text-palette-ink" aria-hidden="true" />
              <span>差勤後台管理系統</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-light text-palette-ink mt-1 tracking-tight">
              實習時數規範・出勤日誌審查・安全限制
            </h1>
          </div>

          {dbConnected && (
            <div className="flex items-center space-x-1.5 text-xs px-2.5 py-1 bg-palette-sage/20 border border-palette-sage text-palette-ink font-medium self-start sm:self-auto">
              <Database className="w-3.5 h-3.5 text-palette-ink" aria-hidden="true" />
              <span>資料庫已連線（持久化儲存）</span>
            </div>
          )}
        </div>

        {!isAuthenticated ? (
          /* 管理員登入認證 */
          <div className="max-w-md mx-auto py-12">
            <div className="border border-palette-line-strong bg-palette-surface p-6 sm:p-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 border border-palette-line bg-palette-base flex items-center justify-center">
                  <Lock className="w-4 h-4 text-palette-ink" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-medium text-palette-ink">管理員身分認證</h2>
                  <p className="text-xs text-palette-muted">後台預設為免密碼模式，若未設密碼可直接點擊進入。</p>
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
                      placeholder="請輸入管理員密碼"
                      className="w-full px-3 py-2 bg-palette-base border border-palette-line-strong text-palette-ink text-sm focus:outline-none focus:border-palette-ink"
                      autoFocus
                    />
                  </div>
                ) : (
                  <p className="text-xs text-palette-muted py-2">
                    目前尚未設定管理員密碼。點擊下方按鈕即可直接以管理權限進入後台。
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
          /* 已登入之管理儀表板 */
          <div className="space-y-12">
            {/* 區塊一：系統設定 */}
            <section aria-labelledby="settings-heading" className="border-b border-palette-line pb-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-palette-muted" aria-hidden="true" />
                  <h2 id="settings-heading" className="text-sm font-semibold tracking-wider text-palette-ink uppercase">
                    實習制度與安全設定
                  </h2>
                </div>
                {settings.updatedAt && (
                  <span className="text-[11px] font-mono text-palette-muted hidden sm:inline">
                    上次更新時間：{formatTaiwanDateTime(settings.updatedAt)}
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
                  {/* 每週時數設定 */}
                  <div className="p-4 border border-palette-line bg-palette-surface/30">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-palette-muted" aria-hidden="true" />
                      <label htmlFor="weekly-hours-input" className="text-xs font-semibold text-palette-ink uppercase">
                        每週實習規定時數（以小時為單位）
                      </label>
                    </div>
                    <p className="text-xs text-palette-muted mb-3">
                      設定兩位實習生每週應累積之實習時數基準（預設為 16 小時）。
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
                      <span className="text-xs text-palette-muted">小時／週</span>
                    </div>
                  </div>

                  {/* 網路白名單限制 */}
                  <div className="p-4 border border-palette-line bg-palette-surface/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-palette-muted" aria-hidden="true" />
                        <label htmlFor="ip-restricted-checkbox" className="text-xs font-semibold text-palette-ink uppercase">
                          限制打卡來源網路（預設不限制）
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
                      預設為「不限制」（供未來或實體辦公室啟用）。啟用後僅有白名單內的網路位址可成功打卡。
                    </p>

                    <div>
                      <label htmlFor="allowed-ips-textarea" className="block text-[11px] font-mono text-palette-muted uppercase mb-1">
                        允許之來源網路白名單（一行一個，或以逗號分隔）
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

                {/* 管理密碼修改 */}
                <div className="p-4 border border-palette-line bg-palette-surface/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <KeyRound className="w-4 h-4 text-palette-muted" aria-hidden="true" />
                    <h3 className="text-xs font-semibold text-palette-ink uppercase">
                      變更後台管理密碼
                    </h3>
                  </div>
                  <p className="text-xs text-palette-muted mb-3">
                    預設為免密碼模式。若填入新密碼並儲存，之後進入此頁面需驗證密碼；若清空儲存則恢復免密碼模式。
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
                        placeholder="請再次輸入新密碼"
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

            {/* 區塊二：打卡日誌審核 */}
            <section aria-labelledby="logs-heading" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-palette-line pb-3">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-palette-muted" aria-hidden="true" />
                  <h2 id="logs-heading" className="text-sm font-semibold tracking-wider text-palette-ink uppercase">
                    實習打卡總日誌審核
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* 人員篩選 */}
                  <div className="flex items-center space-x-1 border border-palette-line-strong bg-palette-base px-2 py-1 text-xs">
                    <Filter className="w-3 h-3 text-palette-muted" aria-hidden="true" />
                    <select
                      value={selectedUserFilter}
                      onChange={(e) => setSelectedUserFilter(e.target.value)}
                      className="bg-transparent text-palette-ink focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">全部實習生（王睿宏與林沁臻）</option>
                      <option value="wang-rui-hong">僅檢視王睿宏</option>
                      <option value="lin-qin-zhen">僅檢視林沁臻</option>
                    </select>
                  </div>

                  {/* 重新整理 */}
                  <button
                    type="button"
                    onClick={fetchLogs}
                    className="p-1.5 border border-palette-line text-palette-muted hover:text-palette-ink hover:bg-palette-surface transition-colors"
                    title="重新整理日誌"
                    aria-label="重新整理日誌"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? "animate-spin" : ""}`} />
                  </button>

                  {/* 清空所有測試紀錄 */}
                  <button
                    type="button"
                    onClick={handleClearAllLogs}
                    className="px-3 py-1.5 border border-palette-line-strong bg-palette-base text-palette-ink text-xs hover:bg-palette-rose/20 transition-colors flex items-center space-x-1.5"
                    title="清空所有測試出勤紀錄"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-palette-muted" aria-hidden="true" />
                    <span>清空所有測試紀錄</span>
                  </button>

                  {/* 匯出 CSV */}
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

              {/* 日誌表格 */}
              {isLoadingLogs ? (
                <div className="py-16 text-center text-xs text-palette-muted animate-pulse">
                  讀取出勤日誌中⋯⋯
                </div>
              ) : logs.length === 0 ? (
                <div className="py-16 text-center border border-palette-line bg-palette-surface/30">
                  <div className="text-sm font-medium text-palette-ink">目前尚無任何出勤打卡紀錄</div>
                  <p className="text-xs text-palette-muted mt-1">實習生簽到後資料將即時匯流至此處。</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-palette-line-strong text-palette-muted font-medium uppercase text-[11px] tracking-wider">
                        <th scope="col" className="py-2.5 px-3">打卡時間</th>
                        <th scope="col" className="py-2.5 px-3">姓名</th>
                        <th scope="col" className="py-2.5 px-3">打卡動作</th>
                        <th scope="col" className="py-2.5 px-3">打卡地點</th>
                        <th scope="col" className="py-2.5 px-3">精確經緯度座標</th>
                        <th scope="col" className="py-2.5 px-3">來源網路位址</th>
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
                              {log.address || "—"}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-palette-muted whitespace-nowrap">
                              {log.latitude && log.longitude
                                ? `${log.latitude}，${log.longitude}`
                                : "—"}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-palette-muted whitespace-nowrap">
                              {log.ip}
                            </td>
                            <td className="py-2.5 px-3 text-palette-muted max-w-xs truncate">
                              {log.note || "—"}
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
