"use client";

import { useState } from "react";
import { UserStats } from "./UserSelector";
import { X, KeyRound, Check, AlertCircle, Loader2 } from "lucide-react";

interface PasswordModalProps {
  user: UserStats | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PasswordModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: PasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg("兩次輸入的新密碼不相符。");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "密碼修改失敗。");
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(data.message || "密碼已更新！");
      setTimeout(() => {
        onSuccess();
        onClose();
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccessMsg("");
      }, 1200);
    } catch {
      setErrorMsg("網路連線失敗，請稍後重試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="password-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-palette-ink/40 backdrop-blur-sm"
    >
      <div className="w-full max-w-md bg-palette-base border border-palette-line-strong p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-palette-line pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-palette-ink" aria-hidden="true" />
            <h3 id="password-modal-title" className="text-sm font-semibold tracking-wider text-palette-ink uppercase">
              設定個人密碼（{user.name}）
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉視窗"
            className="p-1 text-palette-muted hover:text-palette-ink hover:bg-palette-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback notices */}
        {errorMsg && (
          <div role="alert" className="mb-4 p-3 bg-palette-rose/20 border border-palette-rose text-xs text-palette-ink flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div role="status" className="mb-4 p-3 bg-palette-sage/20 border border-palette-sage text-xs text-palette-ink flex items-center space-x-2">
            <Check className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {user.hasPassword && (
            <div>
              <label htmlFor="current-pwd" className="block font-medium text-palette-muted uppercase text-[11px] mb-1">
                目前密碼
              </label>
              <input
                id="current-pwd"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="請輸入現有密碼"
                className="w-full px-3 py-2 bg-palette-base border border-palette-line-strong text-palette-ink focus:outline-none focus:border-palette-ink"
                autoComplete="current-password"
              />
            </div>
          )}

          <div>
            <label htmlFor="new-pwd" className="block font-medium text-palette-muted uppercase text-[11px] mb-1">
              新密碼（若欲改回免密碼，請直接留空）
            </label>
            <input
              id="new-pwd"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="留空代表免密碼登入"
              className="w-full px-3 py-2 bg-palette-base border border-palette-line-strong text-palette-ink focus:outline-none focus:border-palette-ink"
              autoComplete="new-password"
            />
          </div>

          {newPassword && (
            <div>
              <label htmlFor="confirm-pwd" className="block font-medium text-palette-muted uppercase text-[11px] mb-1">
                確認新密碼
              </label>
              <input
                id="confirm-pwd"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="請再次輸入新密碼"
                className="w-full px-3 py-2 bg-palette-base border border-palette-line-strong text-palette-ink focus:outline-none focus:border-palette-ink"
                autoComplete="new-password"
              />
            </div>
          )}

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs border border-palette-line bg-palette-surface text-palette-muted hover:text-palette-ink transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs bg-palette-ink text-palette-base hover:opacity-90 transition-opacity flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
              <span>確認送出</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
