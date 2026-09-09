"use client";

import { useState } from "react";
import { X, BookOpen, UserCheck, ShieldCheck } from "lucide-react";

interface UsageGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UsageGuideModal({ isOpen, onClose }: UsageGuideModalProps) {
  const [activeTab, setActiveTab] = useState<"intern" | "admin">("intern");
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem("hide_intern_guide", "true");
      } catch {
        // 忽略 localStorage 異常
      }
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-palette-ink/40 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg bg-palette-base border border-palette-line-strong p-6 relative">
        {/* 彈窗頂部 */}
        <div className="flex items-center justify-between border-b border-palette-line pb-3 mb-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-palette-ink" aria-hidden="true" />
            <h3 id="guide-modal-title" className="text-sm font-semibold tracking-wider text-palette-ink uppercase">
              系統使用說明
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="關閉使用說明視窗"
            className="p-1 text-palette-muted hover:text-palette-ink hover:bg-palette-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 角色分頁切換 */}
        <div className="flex border-b border-palette-line mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("intern")}
            className={`flex-1 py-2 text-xs font-medium tracking-wider flex items-center justify-center space-x-1.5 transition-colors border-b-2 ${
              activeTab === "intern"
                ? "border-palette-ink text-palette-ink font-semibold"
                : "border-transparent text-palette-muted hover:text-palette-ink"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>實習生出勤指引</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("admin")}
            className={`flex-1 py-2 text-xs font-medium tracking-wider flex items-center justify-center space-x-1.5 transition-colors border-b-2 ${
              activeTab === "admin"
                ? "border-palette-ink text-palette-ink font-semibold"
                : "border-transparent text-palette-muted hover:text-palette-ink"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>督導與主管指引</span>
          </button>
        </div>

        {/* 分頁一：實習生出勤指引 */}
        {activeTab === "intern" && (
          <div className="space-y-3.5 text-xs sm:text-sm text-palette-ink leading-relaxed">
            <div className="flex items-start space-x-2.5">
              <span className="w-5 h-5 border border-palette-line-strong flex items-center justify-center text-[11px] font-mono font-medium text-palette-ink flex-shrink-0 bg-palette-surface">
                1
              </span>
              <p>
                <strong className="font-semibold">點選身分：</strong>
                請於打卡頁面上方點選您的姓名以切換個人狀態。
              </p>
            </div>

            <div className="flex items-start space-x-2.5">
              <span className="w-5 h-5 border border-palette-line-strong flex items-center justify-center text-[11px] font-mono font-medium text-palette-ink flex-shrink-0 bg-palette-surface">
                2
              </span>
              <p>
                <strong className="font-semibold">確認定位：</strong>
                系統將自動擷取當前所在位置與即時時間。
              </p>
            </div>

            <div className="flex items-start space-x-2.5">
              <span className="w-5 h-5 border border-palette-line-strong flex items-center justify-center text-[11px] font-mono font-medium text-palette-ink flex-shrink-0 bg-palette-surface">
                3
              </span>
              <p>
                <strong className="font-semibold">送出打卡：</strong>
                點擊「上班簽到」或「下班簽退」，即完成出勤記錄。
              </p>
            </div>

            <div className="p-3 bg-palette-surface/60 border border-palette-line text-xs text-palette-muted leading-relaxed">
              提醒：可點選姓名旁的鎖頭自訂個人打卡密碼；所有出勤記錄皆具備防偽代碼且無法任意竄改，確保紀錄客觀公正。
            </div>
          </div>
        )}

        {/* 分頁二：督導與主管指引 */}
        {activeTab === "admin" && (
          <div className="space-y-3 text-xs sm:text-sm text-palette-ink leading-relaxed">
            <div className="flex items-start space-x-2.5">
              <span className="w-5 h-5 border border-palette-line-strong flex items-center justify-center text-[11px] font-mono font-medium text-palette-ink flex-shrink-0 bg-palette-surface">
                1
              </span>
              <p>
                <strong className="font-semibold">進入後台：</strong>
                點選右上角「管理後台」或前往後台專屬路徑。
              </p>
            </div>

            <div className="flex items-start space-x-2.5">
              <span className="w-5 h-5 border border-palette-line-strong flex items-center justify-center text-[11px] font-mono font-medium text-palette-ink flex-shrink-0 bg-palette-surface">
                2
              </span>
              <p>
                <strong className="font-semibold">權限移交與保管：</strong>
                建議主管設定一組專屬管理密碼並自行持有，實習生即無法任意變更後台配置。
              </p>
            </div>

            <div className="flex items-start space-x-2.5">
              <span className="w-5 h-5 border border-palette-line-strong flex items-center justify-center text-[11px] font-mono font-medium text-palette-ink flex-shrink-0 bg-palette-surface">
                3
              </span>
              <p>
                <strong className="font-semibold">出勤規範與安全限制：</strong>
                可設定每週目標時數，亦可開啟辦公室網路限制（填入機構網路位址，限現場簽到）。
              </p>
            </div>

            <div className="flex items-start space-x-2.5">
              <span className="w-5 h-5 border border-palette-line-strong flex items-center justify-center text-[11px] font-mono font-medium text-palette-ink flex-shrink-0 bg-palette-surface">
                4
              </span>
              <p>
                <strong className="font-semibold">名冊維護與存證查核：</strong>
                可隨時新增或移除實習生；系統全面啟用唯讀流水帳協議（無法刪改紀錄），並可隨時匯出包含防偽代碼之出勤報表。
              </p>
            </div>

            <div className="p-3 bg-palette-surface/60 border border-palette-line text-xs text-palette-muted leading-relaxed">
              備註：若需定期存證，建議主管每週至後台匯出 CSV 出勤報表存檔備查。
            </div>
          </div>
        )}

        {/* 底部選項與確認按鈕 */}
        <div className="mt-5 pt-3 border-b border-palette-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
          <label className="flex items-center space-x-2 cursor-pointer text-xs text-palette-muted select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 accent-palette-ink"
            />
            <span>下次進入不再自動跳出</span>
          </label>

          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2 text-xs bg-palette-ink text-palette-base hover:opacity-90 transition-opacity font-medium tracking-wider uppercase text-center"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}
