export const zalTheme = {
  colors: {
    // Background layers
    bg: {
      primary: '#0a0a0f',
      secondary: '#12121a',
      tertiary: '#1a1a24',
      overlay: 'rgba(10, 10, 15, 0.95)',
    },
    // Accent colors
    accent: {
      primary: '#8b5cf6',    // Purple
      secondary: '#ec4899',  // Pink
      tertiary: '#06b6d4',   // Cyan
      success: '#10b981',    // Green
      warning: '#f59e0b',    // Amber
      error: '#ef4444',      // Red
    },
    // Text colors
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      muted: '#64748b',
      disabled: '#475569',
    },
    // Border colors
    border: {
      subtle: 'rgba(139, 92, 246, 0.1)',
      default: 'rgba(139, 92, 246, 0.2)',
      strong: 'rgba(139, 92, 246, 0.3)',
    },
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
    secondary: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
    accent: 'linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)',
    glow: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
  },
  
  shadows: {
    sm: '0 2px 8px rgba(139, 92, 246, 0.1)',
    md: '0 4px 16px rgba(139, 92, 246, 0.15)',
    lg: '0 8px 32px rgba(139, 92, 246, 0.2)',
    xl: '0 16px 48px rgba(139, 92, 246, 0.25)',
    glow: '0 0 32px rgba(139, 92, 246, 0.4)',
  },
  
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },
};

export type ZalTheme = typeof zalTheme;
