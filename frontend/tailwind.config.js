/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Explicitly include these just to be safe
    "./components/**/*.{js,jsx}",
    "./pages/**/*.{js,jsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // 1. CUSTOM FONTS
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      // 2. SAFE AREA PADDING (For Mobile Notches)
      padding: {
        'safe': 'env(safe-area-inset-bottom)',
      },
      // 3. ANIMATION KEYFRAMES (Merged)
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Dashboard News Ticker
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        // Network Radar Scanner
        scan: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      },
      // 4. ANIMATION UTILITIES (Merged)
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "scanline": "scanline 2s linear infinite",
        'marquee': 'marquee 15s linear infinite',
        'scan': 'scan 3s linear infinite',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate") // ✅ Essential for UI components
  ],
}