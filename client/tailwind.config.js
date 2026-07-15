/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#EEF1F4',
        ink: '#1B2430',
        'ink-soft': '#5A6472',
        paper: '#FFFFFF',
        'paper-alt': '#FBF9F2',
        sticky: '#FFD23F',
        red: '#E63946',
        green: '#1F9D7C',
        blue: '#3A6EA5',
        purple: '#7B4EA3',
        amber: '#E9A23B',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        hand: ['Caveat', 'cursive'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      spacing: {
        '0': '0',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
      }
    },
  },
  plugins: [],
}