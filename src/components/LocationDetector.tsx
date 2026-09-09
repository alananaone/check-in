"use client";

import { useState, useEffect, useCallback } from "react";
import { MapPin, RotateCw, AlertCircle, CheckCircle2 } from "lucide-react";

export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  address: string;
  status: "idle" | "requesting" | "success" | "denied" | "error";
  errorMessage?: string;
}

interface LocationDetectorProps {
  onLocationChange: (loc: LocationData) => void;
}

export default function LocationDetector({ onLocationChange }: LocationDetectorProps) {
  const [location, setLocation] = useState<LocationData>({
    latitude: null,
    longitude: null,
    accuracy: null,
    address: "",
    status: "idle",
  });

  const fetchAddress = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(`/api/reverse-geo?lat=${lat}&lng=${lng}`);
      const json = await res.json();
      if (json.success && json.address) {
        return json.address;
      }
    } catch {
      // 忽略錯誤，回傳座標
    }
    return `座標：${lat}，${lng}`;
  };

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      const errLoc: LocationData = {
        latitude: null,
        longitude: null,
        accuracy: null,
        address: "瀏覽器不支援定位功能",
        status: "error",
        errorMessage: "您的裝置或瀏覽器不支援定位功能",
      };
      setLocation(errLoc);
      onLocationChange(errLoc);
      return;
    }

    const requestingLoc: LocationData = {
      latitude: null,
      longitude: null,
      accuracy: null,
      address: "正在偵測目前所在位置⋯⋯",
      status: "requesting",
    };
    setLocation(requestingLoc);
    onLocationChange(requestingLoc);

    // 以最高精度請求地理位置（強制即時定位，不使用快取）
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const resolvedAddress = await fetchAddress(latitude, longitude);

        const successLoc: LocationData = {
          latitude,
          longitude,
          accuracy: accuracy ? Math.round(accuracy) : null,
          address: resolvedAddress,
          status: "success",
        };
        setLocation(successLoc);
        onLocationChange(successLoc);
      },
      (error) => {
        let msg = "無法取得位置資訊";
        let status: LocationData["status"] = "error";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "已拒絕位置授權，請開啟瀏覽器定位權限以記錄出勤地點。";
          status = "denied";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "無法獲取定位訊號，請至開闊處或檢查網路。";
        } else if (error.code === error.TIMEOUT) {
          msg = "定位請求逾時，請點擊右側按鈕重新整理。";
        }

        const failLoc: LocationData = {
          latitude: null,
          longitude: null,
          accuracy: null,
          address: msg,
          status,
          errorMessage: msg,
        };
        setLocation(failLoc);
        onLocationChange(failLoc);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  }, [onLocationChange]);

  // 元件載入時立即主動請求最高精度定位
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return (
    <div className="w-full py-4 border-b border-palette-line bg-palette-surface/50 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* 左側：定位狀態與地址資訊 */}
        <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
          <div className="mt-0.5 sm:mt-0 flex-shrink-0 w-7 h-7 border border-palette-line flex items-center justify-center bg-palette-base text-palette-ink">
            {location.status === "requesting" && (
              <RotateCw className="w-3.5 h-3.5 animate-spin text-palette-muted" aria-hidden="true" />
            )}
            {location.status === "success" && (
              <CheckCircle2 className="w-3.5 h-3.5 text-palette-sage" aria-hidden="true" />
            )}
            {(location.status === "error" || location.status === "denied") && (
              <AlertCircle className="w-3.5 h-3.5 text-palette-rose" aria-hidden="true" />
            )}
            {location.status === "idle" && (
              <MapPin className="w-3.5 h-3.5 text-palette-muted" aria-hidden="true" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold tracking-wider text-palette-muted uppercase">
                目前所在位置
              </span>
              {location.status === "success" && (
                <span className="text-[11px] px-1.5 py-0.5 bg-palette-sage/20 text-palette-ink border border-palette-sage/40 font-mono">
                  已取得精確定位（誤差範圍：±{location.accuracy}公尺）
                </span>
              )}
              {location.status === "requesting" && (
                <span className="text-[11px] px-1.5 py-0.5 bg-palette-ivory text-palette-muted border border-palette-line">
                  定位中⋯⋯
                </span>
              )}
              {(location.status === "denied" || location.status === "error") && (
                <span className="text-[11px] px-1.5 py-0.5 bg-palette-rose/20 text-palette-ink border border-palette-rose/40">
                  定位未授權
                </span>
              )}
            </div>

            <div className="mt-0.5 text-xs sm:text-sm text-palette-ink font-medium truncate">
              {location.address || "尚未取得位置資訊"}
            </div>
          </div>
        </div>

        {/* 右側：重新定位按鈕 */}
        <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={requestLocation}
            disabled={location.status === "requesting"}
            aria-label="重新偵測位置"
            className="px-3 py-1.5 text-xs tracking-wider border border-palette-line-strong bg-palette-base text-palette-ink hover:bg-palette-surface transition-colors flex items-center space-x-1.5 disabled:opacity-50"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${location.status === "requesting" ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            <span>重新定位</span>
          </button>
        </div>
      </div>
    </div>
  );
}
