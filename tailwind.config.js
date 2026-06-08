/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#23262f',
        'ink-soft': '#5a5f6d',
        line: '#e6e1d8',
        paper: '#f5f2ec',
        card: '#fffdf9',
        cream: '#efeae1',
        navy: '#262a53',
        'navy-deep': '#1b1e3d',
        rust: '#c65a1a',
        'rust-soft': '#f3e2d4',
        green: '#3f6b4f',
        'green-soft': '#e4eee6',
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { DEFAULT: '14px', sm: '9px' },
      boxShadow: {
        card: '0 1px 2px rgba(35,38,47,.04), 0 8px 24px rgba(35,38,47,.06)',
      },
      maxWidth: { wrap: '1180px' },
    },
  },
  plugins: [],
};
