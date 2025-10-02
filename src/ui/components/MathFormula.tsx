import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { MathJax } from 'better-react-mathjax';

interface MathFormulaProps {
  /**
   * LaTeX formula string to render
   */
  formula: string;
  /**
   * Display mode: 'inline' for inline formulas, 'block' for centered display formulas
   * @default 'block'
   */
  display?: 'inline' | 'block';
  /**
   * Additional sx props for styling
   */
  sx?: SxProps<Theme>;
}

/**
 * Component to render mathematical formulas using MathJax
 * Accepts LaTeX syntax and renders it beautifully
 */
export const MathFormula = ({ formula, display = 'block', sx }: MathFormulaProps) => {
  // Wrap formula with appropriate delimiters
  const formattedFormula = display === 'inline' ? `\\(${formula}\\)` : `\\[${formula}\\]`;

  return (
    <Box
      sx={{
        py: display === 'block' ? 2 : 0,
        px: display === 'block' ? 2 : 0,
        backgroundColor: display === 'block' ? 'action.hover' : 'transparent',
        borderRadius: 1,
        overflowX: 'auto',
        '& .MathJax': {
          fontSize: display === 'block' ? '1.1em' : '1em',
        },
        ...sx,
      }}
    >
      <MathJax dynamic hideUntilTypeset="first">
        {formattedFormula}
      </MathJax>
    </Box>
  );
};

export default MathFormula;
