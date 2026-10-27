/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        // KBO Official Theme Reference (koreabaseball.com):
        // Deep Royal Navy (#002063), KBO Blue (#005BAC), KBO Emblem Red (#ED1C24), KBO Cyan (#00BECE), KBO Gold (#C5A059)
        kbo: {
          navy: "#002063",            // KBO Official Deep Royal Navy
          midnight: "#051124",        // Midnight Stadium background canvas
          dark: "#081832",            // Dark Navy intermediate layer
          surface: "#0c1d38",         // Primary elevated card surface
          surfaceHover: "#132b4f",    // Card hover state
          surfaceMuted: "#102342",    // Subtle nested section background
          border: "#1c3b68",          // Navy divider line
          borderLight: "#163156",     // Subtle card border
          borderMedium: "#254e86",    // Active/Focused border
          blue: "#005bac",            // KBO Official Signature Blue
          blueHover: "#00478a",
          blueSoft: "rgba(0, 91, 172, 0.18)",
          red: "#ed1c24",             // KBO Official Emblem Red (LIVE tag, strike, high alert)
          redHover: "#c8102e",
          redSoft: "rgba(237, 28, 36, 0.18)",
          cyan: "#00bece",            // KBO Official Cyan (Accent & technical tags)
          cyanSoft: "rgba(0, 190, 206, 0.15)",
          gold: "#c5a059",            // KBO Trophy Gold (FA qualified, ranking badges)
          goldSoft: "rgba(197, 160, 89, 0.18)",
          textPrimary: "#f8fafc",     // Crisp white
          textSecondary: "#cbd5e1",   // Cool silver slate
          textTertiary: "#8fa6bd",    // Ice navy text
          textMuted: "#556e8a",       // Muted stadium blue-gray
        },
        // Backwards compatibility mapping for existing components
        toss: {
          primary: "#005bac",         // KBO Signature Blue
          primaryHover: "#00478a",
          primarySoft: "rgba(0, 91, 172, 0.18)",
          inkPrimary: "#f8fafc",      // Crisp white
          inkSecondary: "#cbd5e1",    // Cool silver
          inkTertiary: "#8fa6bd",     // Ice navy text
          inkMuted: "#556e8a",        // Muted navy
          inkFaint: "#3b516b",        // Deep muted navy
          canvas: "#051124",          // Midnight Stadium canvas
          surface: "#0c1d38",         // KBO card surface
          surfaceHover: "#132b4f",    // Hover surface
          surfaceMuted: "#102342",    // Subtle section background
          borderLight: "#163156",     // Navy border
          borderMedium: "#254e86",    // Navy medium border
          bullRed: "#ed1c24",         // KBO Emblem Red
          bullRedSoft: "rgba(237, 28, 36, 0.18)",
          bearBlue: "#00bece",        // KBO Cyan
          bearBlueSoft: "rgba(0, 190, 206, 0.15)",
          warningYellow: "#c5a059",   // KBO Gold
          warningYellowSoft: "rgba(197, 160, 89, 0.18)",
        }
      },
      borderRadius: {
        'toss-xs': '4px',
        'toss-sm': '8px',
        'toss-md': '14px',
        'toss-lg': '20px',
        'toss-xl': '24px',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        display: ['"Plus Jakarta Sans"', 'Pretendard', 'sans-serif'],
        stats: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        pretendard: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
