"use client";

import { useState } from "react";
import { X, BookOpen } from "lucide-react";

interface UsageGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UsageGuideModal({ isOpen, onClose }: UsageGuideModalProps) {
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
      <div className="w-full max-w-md bg-palette-base border border-palette-line-strong p-6 relative">
        {/* 彈窗頂部 */}
        <div className="flex items-center justify-between border-b border-palette-line pb-3 mb-4">
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

        {/* 簡潔說明內容 */}
        <div className="space-y-3.5 text-xs sm:text-sm text-palette-ink leading-relaxed">
          <div className="flex items-start space-x-2.5">
            <span className="w-5 h-5 border border-palette-line-strong flex items-center justify-center text-[11px] font-mono font-medium text-palette-ink flex-shrink-0 bg-palette-surface">
              1
            </span>
            <p>
              <strong className="font-semibold">點選身分：</strong>
              請於上方點選您的姓名（王睿宏或林沁臻）。
            </p>
          </div>

          <div className="flex items-start space-x-2.5">
            <span className="w-5 h-5 border border-palette-line-strong flex items-center justify-center text-[11px] font-mono font-medium text-palette-ink flex-shrink-0 bg-palette-surface">
              2
            </span>
            <p>
              <strong className="font-semibold">確認定位：</strong>
              系統會自動擷取當前所在位置與即時時間。
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
            提醒：若需設定個人打卡密碼，可點選姓名旁的鎖頭進行修改；本指引隨時可點擊網頁最底部的「使用指引」重新開啟。
          </div>
        </div>

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
