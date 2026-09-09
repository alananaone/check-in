"use client";

import { CheckInLog } from "@/lib/types";
import { formatTaiwanDateTime } from "@/lib/utils";
import { FileText, MapPin, Network, Inbox } from "lucide-react";

interface PersonalLogsTableProps {
  userName: string;
  logs: CheckInLog[];
  isLoading: boolean;
}

export default function PersonalLogsTable({
  userName,
  logs,
  isLoading,
}: PersonalLogsTableProps) {
  return (
    <section aria-label="個人出勤紀錄" className="w-full py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-baseline justify-between mb-4 border-b border-palette-line pb-2">
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-palette-ink uppercase flex items-center space-x-2">
              <FileText className="w-4 h-4 text-palette-muted" aria-hidden="true" />
              <span>個人出勤歷史流水帳（{userName}）</span>
            </h2>
            <p className="text-xs text-palette-muted mt-0.5">
              顯示最近的簽到與簽退明細
            </p>
          </div>
          <span className="text-xs font-mono text-palette-muted">
            共 {logs.length} 筆紀錄
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-palette-muted animate-pulse">
            載入打卡紀錄中⋯⋯
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center border border-palette-line bg-palette-surface/30">
            <Inbox className="w-8 h-8 text-palette-faint mx-auto mb-2" aria-hidden="true" />
            <div className="text-sm font-medium text-palette-ink">尚無打卡紀錄</div>
            <p className="text-xs text-palette-muted mt-1">
              請點擊上方「上班簽到」以建立第一筆實習出勤紀錄。
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-palette-line-strong text-palette-muted font-medium uppercase text-[11px] tracking-wider">
                  <th scope="col" className="py-2.5 px-3">
                    打卡時間
                  </th>
                  <th scope="col" className="py-2.5 px-3">
                    出勤類型
                  </th>
                  <th scope="col" className="py-2.5 px-3">
                    打卡地點與精確座標
                  </th>
                  <th scope="col" className="py-2.5 px-3 hidden md:table-cell">
                    來源網路位址
                  </th>
                  <th scope="col" className="py-2.5 px-3">
                    出勤備註
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-palette-line text-palette-ink">
                {logs.map((log) => {
                  const isCheckIn = log.type === "CHECK_IN";
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-palette-surface/60 transition-colors"
                    >
                      {/* 打卡時間 */}
                      <td className="py-3 px-3 font-mono text-xs whitespace-nowrap">
                        {formatTaiwanDateTime(log.timestamp)}
                      </td>

                      {/* 類型標籤 */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block text-xs px-2 py-0.5 font-medium border ${
                            isCheckIn
                              ? "bg-palette-sage/30 border-palette-sage text-palette-ink"
                              : "bg-palette-rose/30 border-palette-rose text-palette-ink"
                          }`}
                        >
                          {isCheckIn ? "上班簽到" : "下班簽退"}
                        </span>
                      </td>

                      {/* 地點與最高精度 GPS 座標 */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col max-w-xs sm:max-w-md">
                          <div className="flex items-start space-x-1.5">
                            <MapPin
                              className="w-3.5 h-3.5 text-palette-faint flex-shrink-0 mt-0.5"
                              aria-hidden="true"
                            />
                            <span className="truncate text-xs font-medium" title={log.address}>
                              {log.address || "未記錄地點"}
                            </span>
                          </div>
                          {log.latitude && log.longitude && (
                            <span className="text-[10px] font-mono text-palette-faint pl-5">
                              座標：{log.latitude}，{log.longitude}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 來源 IP */}
                      <td className="py-3 px-3 font-mono text-xs text-palette-muted hidden md:table-cell whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Network className="w-3 h-3 text-palette-faint" aria-hidden="true" />
                          <span>{log.ip}</span>
                        </div>
                      </td>

                      {/* 備註 */}
                      <td className="py-3 px-3 text-xs text-palette-muted max-w-xs truncate">
                        {log.note || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
