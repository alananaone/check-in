"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import LiveClock from "@/components/LiveClock";
import LocationDetector, { LocationData } from "@/components/LocationDetector";
import UserSelector, { UserStats } from "@/components/UserSelector";
import PunchPanel from "@/components/PunchPanel";
import WeeklyHoursProgress from "@/components/WeeklyHoursProgress";
import PersonalLogsTable from "@/components/PersonalLogsTable";
import PasswordModal from "@/components/PasswordModal";
import Footer from "@/components/Footer";
import { CheckInLog } from "@/lib/types";
import { Database } from "lucide-react";
import Link from "next/link";

export default function CheckInPage() {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("wang-rui-hong");
  const [currentLocation, setCurrentLocation] = useState<LocationData>({
    latitude: null,
    longitude: null,
    accuracy: null,
    address: "偵測中...",
    status: "idle",
  });
  const [userLogs, setUserLogs] = useState<CheckInLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [passwordModalUser, setPasswordModalUser] = useState<UserStats | null>(null);

  // Fetch users list and stats
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success && data.users) {
        setUsers(data.users);
        setIsDbConnected(Boolean(data.dbConnected));
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }, []);

  // Fetch logs for current selected user
  const fetchLogs = useCallback(async (userId: string) => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch(`/api/logs?userId=${userId}&limit=20`);
      const data = await res.json();
      if (data.success && data.logs) {
        setUserLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (selectedUserId) {
      fetchLogs(selectedUserId);
    }
  }, [selectedUserId, fetchLogs]);

  const handlePunchSuccess = () => {
    fetchUsers();
    if (selectedUserId) {
      fetchLogs(selectedUserId);
    }
  };

  const currentUser = users.find((u) => u.id === selectedUserId) || users[0] || {
    id: "wang-rui-hong",
    name: "王睿宏",
    hasPassword: false,
    isClockedIn: false,
    completedHours: 0,
    activeSessionHours: 0,
    totalHours: 0,
    targetHours: 16,
  };

  return (
    <div className="min-h-screen flex flex-col bg-palette-base text-palette-ink">
      {/* 1. Header with branding & navigation */}
      <Header currentPath="/" />

      {isDbConnected === false && (
        <aside
          aria-label="資料庫狀態提示"
          className="w-full border-b border-palette-line bg-palette-nude/30 px-4 sm:px-6 py-2 text-xs text-palette-ink flex flex-col sm:flex-row sm:items-center justify-between gap-1"
        >
          <div className="flex items-center space-x-2">
            <Database className="w-3.5 h-3.5 text-palette-muted flex-shrink-0" aria-hidden="true" />
            <span>
              資料庫連線提示：目前尚未綁定 Vercel Postgres / Neon 雲端資料庫（處於無狀態模式），打卡紀錄在冷啟動後可能無法持久。
            </span>
          </div>
          <Link
            href="/admini"
            className="underline font-medium text-palette-ink hover:opacity-80 whitespace-nowrap self-start sm:self-auto"
          >
            前往後台查看設定教學
          </Link>
        </aside>
      )}

      <main className="flex-1 w-full pb-16">
        {/* 2. Real-time Digital Clock */}
        <LiveClock />

        {/* 3. Active Geolocation Query & Display */}
        <LocationDetector onLocationChange={setCurrentLocation} />

        {/* 4. Intern Selector */}
        <UserSelector
          users={users}
          selectedUserId={currentUser.id}
          onSelectUser={(id) => setSelectedUserId(id)}
          onOpenPasswordModal={(u) => setPasswordModalUser(u)}
        />

        {/* 5. Punch In/Out Action Area */}
        <PunchPanel
          currentUser={currentUser}
          currentLocation={currentLocation}
          onPunchSuccess={handlePunchSuccess}
        />

        {/* 6. Weekly Hours Progress & Statistics */}
        <WeeklyHoursProgress user={currentUser} />

        {/* 7. Personal Punch History Records */}
        <PersonalLogsTable
          userName={currentUser.name}
          logs={userLogs}
          isLoading={isLoadingLogs}
        />
      </main>

      {/* Password Modal */}
      <PasswordModal
        user={passwordModalUser}
        isOpen={!!passwordModalUser}
        onClose={() => setPasswordModalUser(null)}
        onSuccess={() => {
          fetchUsers();
          setPasswordModalUser(null);
        }}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
