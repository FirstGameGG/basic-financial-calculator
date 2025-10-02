import type { PaletteMode, ThemeOptions } from '@mui/material/styles';
import { alpha, responsiveFontSizes, createTheme } from '@mui/material/styles';

const BASE_HTML_FONT_SIZE = 16;

const getDesignTokens = (mode: PaletteMode, textScale: number): ThemeOptions => ({
  palette: {
    mode,
    primary:
      mode === 'light'
        ? {
            main: '#ECA576',
            light: '#FFD8C2',
            dark: '#B8673F',
            contrastText: '#2D160B',
          }
        : {
            main: '#FFBE8A',
            light: '#FFD9B8',
            dark: '#E28C55',
            contrastText: '#1B0D06',
          },
    secondary:
      mode === 'light'
        ? {
            main: '#5A3B2E',
            light: '#8C6654',
            dark: '#3A241D',
            contrastText: '#FFFFFF',
          }
        : {
            main: '#D7BBA6',
            light: '#EAD4C4',
            dark: '#A48973',
            contrastText: '#22130C',
          },
    background:
      mode === 'light'
        ? {
            default: '#FCF5F0',
            paper: '#FFFFFF',
          }
        : {
            default: '#1A1511',
            paper: '#241B16',
          },
    text:
      mode === 'light'
        ? {
            primary: '#2D160B',
            secondary: '#705950',
          }
        : {
            primary: '#FCEDE3',
            secondary: '#D9C4B8',
          },
    divider: mode === 'light' ? alpha('#8C6654', 0.2) : alpha('#D7BBA6', 0.2),
  },
  typography: {
    htmlFontSize: BASE_HTML_FONT_SIZE * textScale,
    fontFamily: '"Inter", "Prompt", "Segoe UI", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.015em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { letterSpacing: 0.4, fontWeight: 600 },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            mode === 'light'
              ? 'linear-gradient(180deg, rgba(236,165,118,0.08) 0%, rgba(253,238,228,0.45) 35%, rgba(252,245,240,1) 100%)'
              : 'radial-gradient(circle at 20% 20%, rgba(255,190,138,0.15) 0%, rgba(26,21,17,1) 55%)',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 999,
        },
        containedPrimary: {
          backgroundImage: 'linear-gradient(135deg, #ECA576 0%, #F48F68 100%)',
          boxShadow: '0 10px 24px rgba(236, 165, 118, 0.35)',
          '&:hover': {
            backgroundImage: 'linear-gradient(135deg, #E28C56 0%, #F07954 100%)',
            boxShadow: '0 14px 32px rgba(236, 165, 118, 0.4)',
          },
        },
        outlinedPrimary: {
          borderColor: alpha('#ECA576', 0.6),
          color: '#E3753A',
          backgroundColor: alpha('#ECA576', 0.08),
          '&:hover': {
            borderColor: '#ECA576',
            backgroundColor: alpha('#ECA576', 0.16),
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage:
            mode === 'light'
              ? 'linear-gradient(135deg, rgba(236,165,118,0.92) 0%, rgba(222,138,92,0.92) 100%)'
              : 'linear-gradient(135deg, rgba(55,33,25,0.94) 0%, rgba(104,57,40,0.94) 100%)',
          color: mode === 'light' ? '#FFFFFF' : '#FCEDE3',
          border: 'none',
          boxShadow: mode === 'light'
            ? '0 10px 30px rgba(236, 165, 118, 0.35)'
            : '0 10px 30px rgba(0, 0, 0, 0.45)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${mode === 'light' ? alpha('#ECA576', 0.25) : alpha('#FFBE8A', 0.2)}`,
          backgroundImage:
            mode === 'light'
              ? 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(252,245,240,0.9) 100%)'
              : 'linear-gradient(180deg, rgba(36,27,22,0.95) 0%, rgba(28,21,17,0.9) 100%)',
          boxShadow:
            mode === 'light'
              ? '0 12px 24px -12px rgba(236, 165, 118, 0.45)'
              : '0 12px 24px -12px rgba(0, 0, 0, 0.6)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          padding: '4px',
          background: mode === 'light' ? '#FDF5EF' : '#201712',
          border: 'none',
          boxShadow:
            mode === 'light'
              ? '0 18px 35px rgba(236, 165, 118, 0.25)'
              : '0 18px 35px rgba(0, 0, 0, 0.55)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: "''",
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            padding: '1px',
            background: mode === 'light'
              ? 'linear-gradient(135deg, rgba(236,165,118,0.6), rgba(255,209,178,0.4))'
              : 'linear-gradient(135deg, rgba(255,190,138,0.4), rgba(161,110,83,0.2))',
            WebkitMask:
              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          position: 'relative',
          zIndex: 1,
          background: mode === 'light' ? '#FFFFFF' : alpha('#1A1511', 0.8),
          borderRadius: 14,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 16,
          padding: theme.spacing(2),
          alignItems: 'flex-start',
          gap: theme.spacing(1),
          boxShadow:
            theme.palette.mode === 'light'
              ? '0 8px 24px rgba(236, 165, 118, 0.12)'
              : '0 8px 24px rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(8px)',
        }),
        icon: ({ theme }) => ({
          marginTop: theme.spacing(0.5),
          color:
            theme.palette.mode === 'light'
              ? theme.palette.primary.main
              : theme.palette.primary.light,
        }),
        message: {
          width: '100%',
          padding: 0,
        },
        outlinedInfo: ({ theme }) => ({
          borderColor: alpha(theme.palette.primary.main, 0.5),
          backgroundColor: alpha(
            theme.palette.primary.light,
            theme.palette.mode === 'light' ? 0.16 : 0.22,
          ),
        }),
        standardInfo: ({ theme }) => ({
          backgroundColor: alpha(
            theme.palette.primary.main,
            theme.palette.mode === 'light' ? 0.12 : 0.18,
          ),
          color: theme.palette.mode === 'light' ? theme.palette.primary.dark : theme.palette.primary.contrastText,
        }),
      },
    },
  },
});

export const buildTheme = (mode: PaletteMode, textScale: number) =>
  responsiveFontSizes(createTheme(getDesignTokens(mode, textScale)));
