/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'dark-1': '#0a0a1a',
        'dark-2': '#12122a',
        'dark-3': '#1a1a3a',
        'primary': '#4f46e5',
        'primary-light': '#818cf8',
        'accent': '#06b6d4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
