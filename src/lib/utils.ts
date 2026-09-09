import crypto from "crypto";
import { CheckInLog } from "./types";

/**
 * Hash password with SHA-256 and salt
 */
export function hashPassword(password: string): string {
  if (!password) return "";
  return crypto.createHash("sha256").update(`checkin-salt-${password}`).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  if (!hash) return true; // empty hash means no password needed
  if (!password) return false;
  return hashPassword(password) === hash;
}

/**
 * 產生不可竄改之防偽存證驗證碼（Verification Seal）
 */
export function generateVerificationCode(data: {
  userId: string;
  type: string;
  timestamp: string;
  ip: string;
  latitude?: number | null;
  longitude?: number | null;
}): string {
  const payload = `${data.userId}#${data.type}#${data.timestamp}#${data.ip}#${data.latitude ?? ""}#${data.longitude ?? ""}`;
  const hash = crypto.createHash("sha256").update(payload).digest("hex").toUpperCase();
  return `TK-${hash.substring(0, 8)}`;
}

/**
 * Extract client IP from Next.js request headers
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    // Return first IP if comma-separated
    return forwarded.split(",")[0].trim();
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();
  return "127.0.0.1";
}

/**
 * Check if IP is in the allowed list
 */
export function isIpAllowed(ip: string, allowedIps: string[]): boolean {
  if (!allowedIps || allowedIps.length === 0) return true;
  const cleanClientIp = ip.trim();

  return allowedIps.some((allowed) => {
    const cleanAllowed = allowed.trim();
    if (!cleanAllowed) return false;
    if (cleanAllowed === "*" || cleanAllowed === cleanClientIp) return true;
    // Localhost matches
    if (
      (cleanAllowed === "127.0.0.1" || cleanAllowed === "localhost") &&
      (cleanClientIp === "127.0.0.1" || cleanClientIp === "::1")
    ) {
      return true;
    }
    // Simple prefix match for subnet like "192.168.1."
    if (cleanAllowed.endsWith(".") && cleanClientIp.startsWith(cleanAllowed)) {
      return true;
    }
    return false;
  });
}

/**
 * Format ISO timestamp into Taiwan formatted string (YYYY/MM/DD HH:mm:ss)
 */
export function formatTaiwanDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return isoString;
  }
}

/**
 * Get the start of the current week (Monday 00:00:00) in Taipei timezone
 */
export function getStartOfWeekDate(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  // In JS, 0 is Sunday, 1 is Monday... 6 is Saturday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Calculate weekly hours for an intern from their check-in logs
 */
export function calculateWeeklyHours(
  logs: CheckInLog[],
  startOfWeek: Date = getStartOfWeekDate()
): { completedHours: number; activeSessionHours: number; totalHours: number; isClockedIn: boolean } {
  // Filter logs for this week and sort chronologically ascending
  const weekLogs = logs
    .filter((log) => new Date(log.timestamp) >= startOfWeek)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  let completedMs = 0;
  let activeSessionMs = 0;
  let currentCheckIn: CheckInLog | null = null;

  for (const log of weekLogs) {
    if (log.type === "CHECK_IN") {
      // If there was an unclosed check-in, close it or override with the new check-in
      currentCheckIn = log;
    } else if (log.type === "CHECK_OUT" && currentCheckIn) {
      const duration = new Date(log.timestamp).getTime() - new Date(currentCheckIn.timestamp).getTime();
      if (duration > 0 && duration < 24 * 60 * 60 * 1000) {
        // Discard any erroneous anomaly > 24 hours
        completedMs += duration;
      }
      currentCheckIn = null;
    }
  }

  const isClockedIn = !!currentCheckIn;
  if (currentCheckIn) {
    const currentElapsed = Date.now() - new Date(currentCheckIn.timestamp).getTime();
    if (currentElapsed > 0 && currentElapsed < 24 * 60 * 60 * 1000) {
      activeSessionMs = currentElapsed;
    }
  }

  const completedHours = Math.round((completedMs / (1000 * 60 * 60)) * 10) / 10;
  const activeSessionHours = Math.round((activeSessionMs / (1000 * 60 * 60)) * 10) / 10;
  const totalHours = Math.round(((completedMs + activeSessionMs) / (1000 * 60 * 60)) * 10) / 10;

  return {
    completedHours,
    activeSessionHours,
    totalHours,
    isClockedIn,
  };
}
