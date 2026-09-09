"use client";

import { useState, useEffect } from "react";

export default function LiveClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return (
      <div className="w-full py-8 border-b border-palette-line flex flex-col items-center justify-center animate-pulse">
        <div className="h-4 w-36 bg-palette-subtle mb-3"></div>
        <div className="h-12 w-64 bg-palette-subtle"></div>
      </div>
    );
  }

  // Formatting in Taiwan Timezone
  const dateString = time.toLocaleDateString("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const weekdayString = time.toLocaleDateString("zh-TW", {
    timeZone: "Asia/Taipei",
    weekday: "long",
  });

  const hours = String(time.getHours()).padStart(2, "0");
  const minutes = String(time.getMinutes()).padStart(2, "0");
  const seconds = String(time.getSeconds()).padStart(2, "0");

  return (
    <section
      aria-label="即時時間"
      className="w-full py-6 sm:py-8 border-b border-palette-line text-center bg-palette-base"
    >
      <div className="flex items-center justify-center space-x-3 text-xs sm:text-sm text-palette-muted tracking-widest uppercase font-medium">
        <span>{dateString}</span>
        <span className="w-1 h-1 bg-palette-line-strong rounded-full" aria-hidden="true" />
        <span>{weekdayString}</span>
      </div>

      <div className="mt-2 text-4xl sm:text-6xl font-light tracking-tight font-mono text-palette-ink">
        <span>{hours}</span>
        <span className="animate-pulse text-palette-rose">:</span>
        <span>{minutes}</span>
        <span className="animate-pulse text-palette-rose">:</span>
        <span className="text-3xl sm:text-5xl text-palette-muted">{seconds}</span>
      </div>

      <div className="mt-2 text-xs text-palette-faint tracking-wider">
        標準台北時間
      </div>
    </section>
  );
}
