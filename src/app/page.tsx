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
import UsageGuideModal from "@/components/UsageGuideModal";
import Footer from "@/components/Footer";
import { CheckInLog } from "@/lib/types";

export default function CheckInPage() {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("wang-rui-hong");
  const [currentLocation, setCurrentLocation] = useState<LocationData>({
    latitude: null,
    longitude: null,
    accuracy: null,
    address: "偵測中⋯⋯",
    status: "idle",
  });
  const [userLogs, setUserLogs] = useState<CheckInLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [passwordModalUser, setPasswordModalUser] = useState<UserStats | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // 取得實習生清單與累積時數
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success && data.users) {
        setUsers(data.users);
        if (data.users.length > 0) {
          setSelectedUserId((prev) => {
            const exists = data.users.some((u: UserStats) => u.id === prev);
            return exists ? prev : data.users[0].id;
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }, []);

  // 取得指定實習生的出勤紀錄
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

  // 初次造訪時檢查是否需要跳出使用說明彈窗
  useEffect(() => {
    try {
      const hideGuide = localStorage.getItem("hide_intern_guide");
      if (!hideGuide) {
        setIsGuideOpen(true);
      }
    } catch {
      // 忽略 localStorage 存取異常
    }
  }, []);

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
      {/* 頂部導航與機構資訊 */}
      <Header currentPath="/" />

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

      {/* Usage Guide Modal */}
      <UsageGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Footer */}
      <Footer onOpenGuide={() => setIsGuideOpen(true)} />
    </div>
  );
}
