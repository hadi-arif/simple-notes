import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

export const BOARD = {
  base: '#12302B',
  deep: '#0D2421',
  chalk: '#E9F0E3',
  muted: '#9FB8AE',
  line: 'rgba(233, 240, 227, 0.22)',
  sun: '#FFE08A',
  sunInk: '#3B2F0B',
  danger: '#FF9C9C',
};

const FONT_UI = "'Bricolage Grotesque', 'Segoe UI', system-ui, -apple-system, sans-serif";
const FONT_HAND = "'Caveat', 'Segoe Print', 'Bradley Hand', cursive";

export const fonts = { ui: FONT_UI, hand: FONT_HAND };

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: FONT_UI },
        body: { value: FONT_UI },
      },
    },
  },
  globalCss: {
    'html, body': {
      minHeight: '100%',
      color: BOARD.chalk,
      backgroundColor: BOARD.deep,
      backgroundImage: `radial-gradient(1100px 620px at 15% -8%, #1d4a42 0%, transparent 62%), radial-gradient(900px 600px at 105% 105%, #173b36 0%, transparent 60%)`,
      backgroundAttachment: 'fixed',
    },
    body: { fontFamily: FONT_UI, fontSize: '16px', lineHeight: '1.5' },
  },
});

export const system = createSystem(defaultConfig, config);
