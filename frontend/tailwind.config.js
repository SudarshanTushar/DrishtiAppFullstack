/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
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
        mono: ['JetBrains Mono', 'monospace'], // Great for logs/terminal
      },
      
      // 2. TACTICAL COLOR PALETTE
      // Use: bg-tactical-dark, text-tactical-green, border-tactical-grid
      colors: {
        tactical: {
          dark: "#020617",   // Deep Slate (Background)
          panel: "#0f172a",  // Lighter Slate (Headers/Cards)
          green: "#10b981",  // Emerald (Online/Mesh Active)
          blue: "#3b82f6",   // Blue (Bluetooth)
          red: "#ef4444",    // Red (Error/Offline)
          grid: "#1e293b",   // Grid lines
        }
      },

      // 3. SAFE AREA SPACING (Crucial for Mobile)
      // Allows classes like: pt-safe-top, pb-safe-bottom, mt-safe-top
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },

      // 4. CUSTOM ANIMATIONS
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
        },
        // CRT Scanline Effect (Matches index.css)
        scanline: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        // Critical Alert Pulse (Red Shadow)
        'critical-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)' },
          '70%': { boxShadow: '0 0 0 10px rgba(239, 68, 68, 0)' },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "scanline": "scanline 4s linear infinite",
        'marquee': 'marquee 15s linear infinite',
        'scan': 'scan 3s linear infinite',
        'critical': 'critical-pulse 2s infinite',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate")
  ],
}