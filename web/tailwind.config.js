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
        toss: {
          primary: "#3b82f6",
          primaryHover: "#2563eb",
          primarySoft: "rgba(59, 130, 246, 0.15)",
          inkPrimary: "#f8fafc",      // Crisp white (slate-50) for headers and key stats
          inkSecondary: "#e2e8f0",    // Soft white (slate-200) for body and team names
          inkTertiary: "#94a3b8",     // Slate-400 for subtext and captions
          inkMuted: "#64748b",        // Slate-500 for muted metadata
          inkFaint: "#475569",        // Slate-600 for placeholders and subtle labels
          canvas: "#020617",          // Slate-950 body canvas
          surface: "#0f172a",         // Slate-900 card surface
          surfaceHover: "#1e293b",    // Slate-800 hover state
          surfaceMuted: "#1e293b",    // Slate-800 subtle background
          borderLight: "#1e293b",     // Slate-800 card border
          borderMedium: "#334155",    // Slate-700 separator border
          bullRed: "#f43f5e",         // Rose-500
          bullRedSoft: "rgba(244, 63, 94, 0.15)",
          bearBlue: "#38bdf8",        // Sky-400
          bearBlueSoft: "rgba(56, 189, 248, 0.15)",
          warningYellow: "#f59e0b",   // Amber-500
          warningYellowSoft: "rgba(245, 158, 11, 0.15)"
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
        pretendard: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
