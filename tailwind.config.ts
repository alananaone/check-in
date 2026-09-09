import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        palette: {
          ivory: "#E1DAD3",
          nude: "#E4C9B6",
          rose: "#D7A49A",
          "rose-hover": "#C19288",
          "rose-subtle": "rgba(215, 164, 154, 0.18)",
          sage: "#9FA893",
          "sage-hover": "#8E9682",
          "sage-subtle": "rgba(159, 168, 147, 0.18)",
          blue: "#A4B1BA",
          "blue-hover": "#93A0A9",
          "blue-subtle": "rgba(164, 177, 186, 0.18)",
          base: "#FAF8F5",
          surface: "#F4EFEA",
          subtle: "#ECE5DE",
          ink: "#1F2526",
          muted: "#68625B",
          faint: "#9C958C",
          line: "#E2DDD6",
          "line-strong": "#C5BEB4",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Noto Sans TC"',
          '"PingFang TC"',
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
