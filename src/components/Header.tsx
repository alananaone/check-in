import Link from "next/link";
import { ShieldCheck, Clock, ExternalLink } from "lucide-react";

interface HeaderProps {
  currentPath?: string;
}

export default function Header({ currentPath = "/" }: HeaderProps) {
  return (
    <header className="w-full border-b border-palette-line bg-palette-base">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Organization & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 border border-palette-line-strong flex items-center justify-center bg-palette-surface text-palette-ink">
            <Clock className="w-4 h-4 text-palette-ink" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs tracking-wider uppercase text-palette-muted font-medium">
                台灣少年權益與福利促進聯盟
              </span>
              <a
                href="https://www.youthrights.org.tw/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-palette-faint hover:text-palette-ink transition-colors"
                title="前往台少盟官網"
                aria-label="台少盟官網（另開新視窗）"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <Link
              href="/"
              className="text-base sm:text-lg font-semibold tracking-tight text-palette-ink hover:opacity-80 transition-opacity"
            >
              實習生差勤打卡系統
            </Link>
          </div>
        </div>

        {/* Right: Navigation */}
        <nav className="flex items-center space-x-2 sm:space-x-4">
          <Link
            href="/"
            className={`px-3 py-1.5 text-xs sm:text-sm tracking-wide transition-colors ${
              currentPath === "/"
                ? "text-palette-ink font-semibold border-b-2 border-palette-ink"
                : "text-palette-muted hover:text-palette-ink"
            }`}
          >
            打卡主頁
          </Link>
          <Link
            href="/admini"
            className={`px-3 py-1.5 text-xs sm:text-sm tracking-wide flex items-center space-x-1.5 border border-palette-line-strong hover:bg-palette-surface transition-colors ${
              currentPath === "/admini"
                ? "bg-palette-surface text-palette-ink font-medium"
                : "text-palette-muted"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-palette-ink" aria-hidden="true" />
            <span>管理後台</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
