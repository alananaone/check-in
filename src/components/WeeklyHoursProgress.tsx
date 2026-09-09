"use client";

import { UserStats } from "./UserSelector";
import { Timer } from "lucide-react";

interface WeeklyHoursProgressProps {
  user: UserStats;
}

export default function WeeklyHoursProgress({ user }: WeeklyHoursProgressProps) {
  const percentage = Math.min(
    100,
    user.targetHours > 0
      ? Math.round((user.totalHours / user.targetHours) * 100)
      : 0
  );

  const remainingHours = Math.max(0, Math.round((user.targetHours - user.totalHours) * 10) / 10);

  return (
    <section aria-label="本週工時進度" className="w-full border-b border-palette-line py-6 px-4 sm:px-6 bg-palette-surface/30">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-palette-ink uppercase flex items-center space-x-2">
              <Timer className="w-4 h-4 text-palette-muted" aria-hidden="true" />
              <span>本週實習時數進度（{user.name}）</span>
            </h2>
            <p className="text-xs text-palette-muted mt-0.5">
              依據週一至週日區間自動統計出勤時數
            </p>
          </div>

          <div className="flex items-baseline space-x-2 font-mono">
            <span className="text-2xl sm:text-3xl font-light text-palette-ink">
              {user.totalHours.toFixed(1)}
            </span>
            <span className="text-xs text-palette-muted">/ 目標 {user.targetHours} 小時</span>
            <span className="text-xs px-2 py-0.5 bg-palette-ivory border border-palette-line text-palette-ink font-sans">
              {percentage}% 達成
            </span>
          </div>
        </div>

        {/* Minimalist Progress Line Track */}
        <div className="w-full h-2.5 bg-palette-subtle border border-palette-line relative overflow-hidden">
          <div
            className="h-full bg-palette-blue transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="工時進度"
          />
        </div>

        {/* Breakdown details */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 border border-palette-line bg-palette-base">
            <div className="text-[11px] text-palette-faint uppercase font-mono">已完成時數</div>
            <div className="mt-1 font-mono font-medium text-sm text-palette-ink">
              {user.completedHours.toFixed(1)} 小時
            </div>
          </div>

          <div className="p-2.5 border border-palette-line bg-palette-base">
            <div className="text-[11px] text-palette-faint uppercase font-mono">當前累計中</div>
            <div className="mt-1 font-mono font-medium text-sm text-palette-ink">
              {user.isClockedIn ? `${user.activeSessionHours.toFixed(1)} 小時` : "0.0 小時"}
            </div>
          </div>

          <div className="p-2.5 border border-palette-line bg-palette-base">
            <div className="text-[11px] text-palette-faint uppercase font-mono">尚餘差額</div>
            <div className="mt-1 font-mono font-medium text-sm text-palette-ink">
              {remainingHours.toFixed(1)} 小時
            </div>
          </div>

          <div className="p-2.5 border border-palette-line bg-palette-base">
            <div className="text-[11px] text-palette-faint uppercase font-mono">出勤狀態</div>
            <div className="mt-1 font-medium text-sm text-palette-ink flex items-center space-x-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  user.isClockedIn ? "bg-palette-sage" : "bg-palette-line-strong"
                }`}
              />
              <span>{user.isClockedIn ? "進行中" : "已簽退"}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
