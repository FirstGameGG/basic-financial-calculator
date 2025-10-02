import { forwardRef } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import type { BoxProps } from '@mui/material';

const WORDMARK_GRADIENT_LIGHT = 'linear-gradient(90deg, #6f3015 0%, #c66b2a 40%, #f7c89a 100%)';
const WORDMARK_GRADIENT_DARK = 'linear-gradient(90deg, #f0dcc3 0%, #f5b178 45%, #ffe5c6 100%)';
const SYMBOL_GRADIENT_LIGHT = 'linear-gradient(135deg, #fcefe6 0%, #f6caa0 55%, #de8a5c 100%)';
const SYMBOL_GRADIENT_DARK = 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(236,165,118,0.45) 55%, rgba(129,62,40,0.9) 100%)';

export type BrandWordmarkProps = BoxProps & {
  /** Pixel height for the rendered wordmark (default 32). */
  height?: number;
  /** Accessible label announced by screen readers. */
  label?: string;
};

export const BrandWordmark = forwardRef<HTMLSpanElement, BrandWordmarkProps>(function BrandWordmark(
  { height = 32, label, sx, ...rest },
  ref,
) {
  const theme = useTheme();
  const gradient = theme.palette.mode === 'light' ? WORDMARK_GRADIENT_LIGHT : WORDMARK_GRADIENT_DARK;

  return (
    <Box
      ref={ref}
      component="span"
      role={label ? 'img' : undefined}
      aria-label={label}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height,
        minWidth: height * 3,
        px: 0.5,
        borderRadius: height,
        backgroundColor:
          theme.palette.mode === 'light' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.25)',
        backdropFilter: 'blur(6px)',
        boxShadow:
          theme.palette.mode === 'light'
            ? 'inset 0 1px 0 rgba(255, 255, 255, 0.35)'
            : '0 6px 18px rgba(0, 0, 0, 0.55)',
        ...sx,
      }}
      {...rest}
    >
      <Typography
        component="span"
        sx={{
          fontFamily: "'Prompt', 'Inter', system-ui, sans-serif",
          fontWeight: 700,
          fontSize: height * 0.62,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          backgroundImage: gradient,
          backgroundClip: 'text',
          color: 'transparent',
          WebkitBackgroundClip: 'text',
          lineHeight: 1,
        }}
      >
        FinanceCalc
      </Typography>
    </Box>
  );
});

export type BrandSymbolProps = BoxProps & {
  /** Pixel size for the square symbol (default 72). */
  size?: number;
  /** Accessible label announced by screen readers. */
  label?: string;
};

export const BrandSymbol = forwardRef<HTMLSpanElement, BrandSymbolProps>(function BrandSymbol(
  { size = 72, label, sx, ...rest },
  ref,
) {
  const theme = useTheme();
  const gradient = theme.palette.mode === 'light' ? SYMBOL_GRADIENT_LIGHT : SYMBOL_GRADIENT_DARK;

  return (
    <Box
      ref={ref}
      component="span"
      role={label ? 'img' : undefined}
      aria-label={label}
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: size * 0.22,
        backgroundImage: gradient,
        boxShadow:
          theme.palette.mode === 'light'
            ? '0 18px 36px rgba(107, 61, 42, 0.25)'
            : '0 22px 42px rgba(0, 0, 0, 0.55)',
        overflow: 'hidden',
        ...sx,
      }}
      {...rest}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            theme.palette.mode === 'light'
              ? 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.75), transparent 55%)'
              : 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.2), transparent 60%)',
          opacity: 0.9,
        }}
      />
      <Typography
        component="span"
        sx={{
          position: 'relative',
          fontFamily: "'Prompt', 'Inter', system-ui, sans-serif",
          fontWeight: 700,
          fontSize: size * 0.42,
          letterSpacing: 1.2,
          color: theme.palette.mode === 'light' ? '#5b240c' : '#ffdec0',
        }}
      >
        ฿ ÷ ×
      </Typography>
    </Box>
  );
});

export const BrandLockup = forwardRef<HTMLSpanElement, BoxProps & { size?: number; label?: string }>(
  function BrandLockup({ size = 48, label, sx, ...rest }, ref) {
    const wordmarkHeight = size * 0.6;

    return (
      <Box
        ref={ref}
        component="span"
        role={label ? 'img' : undefined}
        aria-label={label}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: size * 0.25,
          ...sx,
        }}
        {...rest}
      >
        <BrandSymbol size={size} label={undefined} />
        <BrandWordmark height={wordmarkHeight} label={undefined} sx={{ backgroundColor: 'transparent', boxShadow: 'none', px: 0 }} />
        {label ? (
          <Typography component="span" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)' }}>
            {label}
          </Typography>
        ) : null}
      </Box>
    );
  },
);
