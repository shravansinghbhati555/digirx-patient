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
        // DigiRx brand red. `rx-600` carries white text on buttons (4.5:1);
        // `rx` is for accents, flowers, dots and logo moments.
        rx: { DEFAULT: '#EE2B2B', 600: '#D92323', 300: '#FF8F8F' },
        pink: '#FF8F8F',
        peach: '#FFC2A8',
        flower: '#EE2B2B',
        blush: '#FFD3CB',
        lavender: { DEFAULT: '#C9B2FF', deep: '#B48CF5', soft: '#ECE3FF' },
        sky: { DEFAULT: '#9CC9FF', soft: '#DCEBFF' },
        coral: '#FF8F8F',
        amber: '#FFC27A',
        tint: '#F7EFEE',
        divider: '#F2E7E5',
        field: '#F0E4E1',
        knob: '#E5D9D7',
        slotline: '#DBCAC6',
        unread: '#EE2B2B',
        text: {
          body: '#3F3939',
          muted: '#4F4848',
          caption: '#5E5757',
          nav: '#6B6464',
          faint: '#8F8786',
        },
        // Warm fills used behind record/notification icons
        wash: { pink: '#FFE2E0', peach: '#FFE8DF', rose: '#FFF0EE' },
        ok: { bg: '#DDF3E4', fg: '#1E6B3A' },
        warn: { bg: '#FFF1D6', fg: '#7A4B00' },
        bad: { bg: '#FFE1E1', fg: '#9A1C1C' },
        info: { bg: '#DCEBFF', fg: '#1D4E89' },
        danger: '#B42323',
      },
      backgroundImage: {
        screen: 'linear-gradient(180deg, #FFE4E1 0%, #FFF1EF 38%, #FAF8F7 100%)',
        'screen-wide': 'linear-gradient(150deg, #FFE4E1 0%, #FFF1EF 40%, #FAF8F7 100%)',
        hero: 'linear-gradient(120deg, #F04848 0%, #FF8A6B 100%)',
        'hero-soft': 'linear-gradient(120deg, rgba(238,43,43,.16), rgba(255,138,107,.22))',
        welcome: 'linear-gradient(180deg, #FF8A6B 0%, #F04848 45%, #F35A5A 66%, #FFD9D2 100%)',
        login: 'linear-gradient(180deg, #FFA48C 0%, #FF8F8F 34%, #FFE9E7 62%, #FAF8F7 100%)',
        celebrate: 'linear-gradient(180deg, #FF8A6B 0%, #F04848 45%, #FFB3AA 72%, #FFEDEA 100%)',
        'clinic-a': 'linear-gradient(135deg, #FF8A6B, #F04848)',
        'clinic-b': 'linear-gradient(135deg, #9CC9FF, #C9B2FF)',
        'clinic-c': 'linear-gradient(135deg, #C9B2FF, #FF8F8F)',
        'family-tree': 'linear-gradient(160deg, rgba(255,138,107,.35), rgba(238,43,43,.22) 60%, rgba(255,214,206,.6))',
      },
      borderRadius: {
        icon: '12px',
        btn: '14px',
        input: '18px',
        card: '24px',
        sheet: '32px',
      },
      boxShadow: {
        // Shadows are red-tinted, soft and low — never grey on cards.
        card: '0 12px 30px -16px rgba(205,60,50,.35)',
        panel: '0 14px 34px -20px rgba(205,60,50,.45)',
        bar: '0 -10px 30px -14px rgba(205,60,50,.4)',
        dialog: '0 30px 60px -20px rgba(0,0,0,.4)',
        paper: '0 20px 40px -22px rgba(120,40,30,.4)',
        seg: '0 4px 12px -6px rgba(205,60,50,.5)',
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
