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
          primary: "#3182f6",
          primaryHover: "#1b64da",
          primarySoft: "#e8f3ff",
          inkPrimary: "#191f28",
          inkSecondary: "#333d4b",
          inkTertiary: "#4e5968",
          inkMuted: "#8b95a1",
          inkFaint: "#b0b8c1",
          canvas: "#f2f4f6",
          surface: "#ffffff",
          surfaceHover: "#fafbfc",
          surfaceMuted: "#f9fafb",
          borderLight: "#e5e8eb",
          borderMedium: "#d1d6db",
          bullRed: "#f04452",
          bullRedSoft: "#feebee",
          bearBlue: "#3182f6",
          bearBlueSoft: "#e8f3ff",
          warningYellow: "#ffad12",
          warningYellowSoft: "#fff7e6"
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
