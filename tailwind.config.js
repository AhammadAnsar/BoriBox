/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Strictly Noto Serif Bengali for all Bengali UI text
        sans: ['"Noto Serif Bengali"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif Bengali"', 'Georgia', 'serif'],
        bangla: ['"Noto Serif Bengali"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        boribox: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          mint: '#10b981',
          mintDark: '#059669',
        },
      },
    },
  },
  plugins: [],
};
