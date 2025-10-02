import type { SxProps, Theme } from '@mui/material/styles';

export const glassHeroPaperSx: SxProps<Theme> = (theme) => ({
  position: 'relative',
  overflow: 'hidden',
  isolation: 'isolate',
  p: { xs: 3, md: 4 },
  borderRadius: 5,
  background:
    theme.palette.mode === 'light'
      ? 'linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(255,244,235,0.82) 55%, rgba(236,165,118,0.28) 100%)'
      : 'linear-gradient(135deg, rgba(40,29,24,0.82) 0%, rgba(104,57,40,0.78) 65%)',
  border:
    theme.palette.mode === 'light'
      ? '1px solid rgba(236, 165, 118, 0.35)'
      : '1px solid rgba(255, 255, 255, 0.16)',
  boxShadow:
    theme.palette.mode === 'light'
      ? '0 24px 48px rgba(236, 165, 118, 0.24)'
      : '0 24px 48px rgba(0, 0, 0, 0.55)',
  backdropFilter: 'blur(20px)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -120,
    right: -100,
    width: 260,
    height: 260,
    borderRadius: '50%',
    background:
      theme.palette.mode === 'light'
        ? 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9) 0%, rgba(236,165,118,0.18) 60%, rgba(255,255,255,0) 100%)'
        : 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18) 0%, rgba(236,165,118,0.12) 55%, rgba(0,0,0,0) 100%)',
    zIndex: 0,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -140,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: '50%',
    background:
      theme.palette.mode === 'light'
        ? 'radial-gradient(circle, rgba(236,165,118,0.2) 0%, rgba(236,165,118,0.08) 45%, rgba(255,255,255,0) 100%)'
        : 'radial-gradient(circle, rgba(236,165,118,0.2) 0%, rgba(236,165,118,0.08) 45%, rgba(0,0,0,0) 100%)',
    zIndex: 0,
  },
});

export const glassHeroTabsSx: SxProps<Theme> = (theme) => ({
  mt: { xs: 3, md: 4 },
  position: 'relative',
  zIndex: 1,
  '& .MuiTab-root': {
    borderRadius: 999,
    textTransform: 'none',
    minHeight: 44,
    px: { xs: 2.5, md: 3.5 },
    color:
      theme.palette.mode === 'light'
        ? 'rgba(76, 31, 12, 0.75)'
        : theme.palette.text.secondary,
  },
  '& .Mui-selected': {
    color:
      theme.palette.mode === 'light'
        ? theme.palette.primary.main
        : theme.palette.primary.light,
  },
  '& .MuiTabs-indicator': {
    height: 3,
    borderRadius: 999,
    backgroundImage:
      theme.palette.mode === 'light'
        ? 'linear-gradient(90deg, rgba(236,165,118,0.85) 0%, rgba(255,196,155,0.95) 100%)'
        : 'linear-gradient(90deg, rgba(255,180,140,0.85) 0%, rgba(236,165,118,0.9) 100%)',
  },
});
