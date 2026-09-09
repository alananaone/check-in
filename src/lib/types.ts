export type CheckInType = "CHECK_IN" | "CHECK_OUT";

export interface User {
  id: string;
  name: string;
  email?: string; // 通知或副本發送信箱
  passwordHash: string; // empty string means no password
  createdAt?: string;
  updatedAt?: string;
}

export interface CheckInLog {
  id: string;
  userId: string;
  userName: string;
  type: CheckInType;
  timestamp: string; // ISO 8601
  latitude: number | null;
  longitude: number | null;
  accuracy?: number | null;
  address: string;
  ip: string;
  note?: string;
  verificationCode?: string; // 不可竄改防偽存證代碼
  createdAt: string;
}

export interface SystemSettings {
  weeklyTargetHours: number; // e.g. 16 or 20 hours
  ipRestricted: boolean; // default false
  allowedIps: string[]; // list of allowed IPs
  adminPasswordHash: string; // empty string means no password
  updatedAt: string;
}

export interface InternWeeklySummary {
  userId: string;
  userName: string;
  totalHours: number;
  completedHours: number;
  activeSessionHours: number;
  targetHours: number;
  isClockedIn: boolean;
  lastLog?: CheckInLog;
}
