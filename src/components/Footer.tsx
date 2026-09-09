import { ExternalLink, HelpCircle } from "lucide-react";

interface FooterProps {
  onOpenGuide?: () => void;
}

export default function Footer({ onOpenGuide }: FooterProps) {
  return (
    <footer className="w-full border-b border-palette-line py-8 px-4 sm:px-6 bg-palette-surface/40 mt-auto">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-palette-muted">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          <span className="font-semibold text-palette-ink">
            台灣少年權益與福利促進聯盟（台少盟）
          </span>
          <span className="hidden sm:inline text-palette-line-strong">|</span>
          <a
            href="https://www.youthrights.org.tw/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-palette-ink transition-colors flex items-center space-x-1"
          >
            <span>www.youthrights.org.tw</span>
            <ExternalLink className="w-3 h-3 text-palette-faint" aria-hidden="true" />
          </a>
        </div>

        <div className="flex items-center space-x-4">
          {onOpenGuide && (
            <button
              type="button"
              onClick={onOpenGuide}
              className="text-palette-ink hover:text-palette-muted transition-colors flex items-center space-x-1 border border-palette-line-strong px-2 py-1 bg-palette-base"
              title="查看系統使用指引"
            >
              <HelpCircle className="w-3.5 h-3.5 text-palette-muted" aria-hidden="true" />
              <span>使用指引</span>
            </button>
          )}

          <div className="text-palette-faint font-mono text-[11px] text-center sm:text-right">
            實習生差勤管理系統・標準台北時間紀錄
          </div>
        </div>
      </div>
    </footer>
  );
}
