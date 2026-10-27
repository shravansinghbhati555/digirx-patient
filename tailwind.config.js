/**
 * DigiRx Patient design tokens — mirrors the "Design system" artboard.
 * Prefer these names over raw hex in components.
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./client/index.html', './client/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        // Phone is the default. Tablet swaps the bottom nav for a 96px rail;
        // desktop swaps the rail for a 240px sidebar.
        tablet: '768px',
        desktop: '1280px',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'Menlo', 'monospace'],
      },
      colors: {
        ink: '#181818',
        surface: '#FDFCFB',
        pink: '#FFA7DC',
        peach: '#FFB690',
        flower: '#F0679F',
        lavender: { DEFAULT: '#C9B2FF', deep: '#B48CF5', soft: '#ECE3FF' },
        sky: { DEFAULT: '#9CC9FF', soft: '#DCEBFF' },
        coral: '#FF8E8E',
        amber: '#FFC27A',
        tint: '#F6EEF3',
        divider: '#F1E6EC',
        field: '#EFE3EA',
        knob: '#E3D6DE',
        slotline: '#D9C8D3',
        unread: '#F2559B',
        text: {
          body: '#3F3944',
          muted: '#4F4855',
          caption: '#5F5866',
          nav: '#6B6470',
          faint: '#8F8590',
        },
        // Pastel fills used behind record/notification icons
        wash: { pink: '#FFE0F2', peach: '#FFE6D8', rose: '#FFF0F7' },
        ok: { bg: '#DDF3E4', fg: '#1E6B3A' },
        warn: { bg: '#FFF1D6', fg: '#7A4B00' },
        bad: { bg: '#FFE1E1', fg: '#9A1C1C' },
        info: { bg: '#DCEBFF', fg: '#1D4E89' },
        danger: '#B42323',
      },
      backgroundImage: {
        screen: 'linear-gradient(180deg, #FCE1DA 0%, #FAE3EC 38%, #F3E8F6 100%)',
        'screen-wide': 'linear-gradient(150deg, #FCE1DA 0%, #FAE3EC 40%, #F3E8F6 100%)',
        hero: 'linear-gradient(120deg, #FFA7DC 0%, #FFB690 100%)',
        'hero-soft': 'linear-gradient(120deg, rgba(255,167,220,.55), rgba(255,182,144,.55))',
        welcome: 'linear-gradient(180deg, #FFB690 0%, #FFA7DC 42%, #F4A9E0 62%, #D8B4F5 100%)',
        login: 'linear-gradient(180deg, #FFC3A6 0%, #FFB3D9 34%, #FAE3EF 62%, #F3E8F6 100%)',
        celebrate: 'linear-gradient(180deg, #FFB690 0%, #FFA7DC 45%, #F4C3EA 70%, #EADCF8 100%)',
        'clinic-a': 'linear-gradient(135deg, #FFB690, #FFA7DC)',
        'clinic-b': 'linear-gradient(135deg, #9CC9FF, #C9B2FF)',
        'clinic-c': 'linear-gradient(135deg, #C9B2FF, #FFA7DC)',
        'family-tree': 'linear-gradient(160deg, rgba(255,182,144,.5), rgba(255,167,220,.45) 60%, rgba(201,178,255,.45))',
      },
      borderRadius: {
        icon: '12px',
        btn: '14px',
        input: '18px',
        card: '24px',
        sheet: '32px',
      },
      boxShadow: {
        card: '0 12px 30px -16px rgba(214,110,170,.35)',
        panel: '0 14px 34px -18px rgba(214,110,170,.4)',
        bar: '0 -10px 30px -14px rgba(214,110,170,.4)',
        dialog: '0 30px 60px -20px rgba(0,0,0,.4)',
        paper: '0 20px 40px -20px rgba(120,60,100,.35)',
        seg: '0 4px 12px -6px rgba(214,110,170,.5)',
        knob: '0 2px 6px rgba(0,0,0,.18)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-300px 0' },
          '100%': { backgroundPosition: '300px 0' },
        },
        'sheet-up': {
          '0%': { transform: 'translateY(24px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      },
      animation: {
        shimmer: 'shimmer 1.4s linear infinite',
        'sheet-up': 'sheet-up .25s ease-out both',
        'fade-in': 'fade-in .2s ease-out both',
      },
    },
  },
  plugins: [],
};
