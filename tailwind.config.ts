/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          puma: {
            bg: '#1a0533',
            surface: '#2d0a52',
            card: '#3a0f6b',
            border: '#5a1f9a',
            accent: '#c084fc',
            accentBright: '#e879f9',
            text: '#f3e8ff',
            muted: '#a78bca',
            section: '#c084fc',
          }
        },
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
        }
      },
    },
    plugins: [],
  }