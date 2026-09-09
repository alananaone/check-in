"use client";

import { UserCheck, Lock, Unlock } from "lucide-react";

export interface UserStats {
  id: string;
  name: string;
  hasPassword: boolean;
  isClockedIn: boolean;
  completedHours: number;
  activeSessionHours: number;
  totalHours: number;
  targetHours: number;
}

interface UserSelectorProps {
  users: UserStats[];
  selectedUserId: string;
  onSelectUser: (userId: string) => void;
  onOpenPasswordModal: (user: UserStats) => void;
}

export default function UserSelector({
  users,
  selectedUserId,
  onSelectUser,
  onOpenPasswordModal,
}: UserSelectorProps) {
  return (
    <section aria-label="實習生切換" className="w-full border-b border-palette-line py-5 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-wider text-palette-muted uppercase">
            選擇打卡人員
          </div>
          <p className="text-xs text-palette-faint mt-0.5">
            請點選您的姓名以執行簽到、簽退或查閱出勤紀錄
          </p>
        </div>

        {/* Intern Tabs */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {users.map((u) => {
            const isSelected = u.id === selectedUserId;
            return (
              <div
                key={u.id}
                className={`flex items-center border transition-all ${
                  isSelected
                    ? "border-palette-ink bg-palette-base shadow-none"
                    : "border-palette-line bg-palette-surface hover:border-palette-line-strong"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectUser(u.id)}
                  className="px-4 py-2 text-sm font-medium tracking-wide flex items-center space-x-2 text-palette-ink"
                >
                  <UserCheck
                    className={`w-4 h-4 ${isSelected ? "text-palette-ink" : "text-palette-faint"}`}
                    aria-hidden="true"
                  />
                  <span>{u.name}</span>

                  {/* Status Indicator Pill */}
                  <span
                    className={`text-[10px] px-2 py-0.5 font-normal ${
                      u.isClockedIn
                        ? "bg-palette-sage text-palette-ink font-medium"
                        : "bg-palette-ivory text-palette-muted"
                    }`}
                  >
                    {u.isClockedIn ? "上班中" : "未簽到"}
                  </span>
                </button>

                {/* Password / Lock icon and setting button */}
                <button
                  type="button"
                  onClick={() => onOpenPasswordModal(u)}
                  title={u.hasPassword ? "已設定密碼（點擊修改）" : "目前無密碼（點擊設定）"}
                  aria-label={`${u.name} 密碼設定`}
                  className="px-2.5 py-2 text-palette-muted hover:text-palette-ink hover:bg-palette-subtle transition-colors bg-palette-surface/80"
                >
                  {u.hasPassword ? (
                    <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
