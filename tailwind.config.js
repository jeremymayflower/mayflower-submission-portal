/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1B2A4A',
          50: '#F0F2F7',
          100: '#D8DCE8',
          200: '#B1B9D1',
          300: '#8A96BA',
          400: '#5468A3',
          500: '#1B2A4A',
          600: '#172342',
          700: '#131D39',
          800: '#0F1630',
          900: '#0B1027',
        },
        gold: {
          DEFAULT: '#C8956C',
          50: '#FDF8F4',
          100: '#F9EDE3',
          200: '#F0D6C0',
          300: '#E4BB96',
          400: '#C8956C',
          500: '#B07D58',
          600: '#966644',
          700: '#7A5037',
          800: '#5E3C2A',
          900: '#42291D',
        },
        cream: '#F8F7F4',
        success: '#2D7D46',
        warning: '#D4A030',
        muted: '#94A3B8',
        'text-secondary': '#64748B',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
