/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        // Semantic surfaces
        background: 'hsl(var(--background))',
        'surface-1': 'hsl(var(--surface-1))',
        'surface-2': 'hsl(var(--surface-2))',

        // Foreground hierarchy
        foreground: 'hsl(var(--foreground))',
        'foreground-muted': 'hsl(var(--foreground-muted))',
        'foreground-subtle': 'hsl(var(--foreground-subtle))',
        'foreground-faint': 'hsl(var(--foreground-faint))',

        // Lines + focus
        border: 'hsl(var(--border))',
        'border-strong': 'hsl(var(--border-strong))',
        ring: 'hsl(var(--ring))',

        // Status. Use sparingly — one icon, never a fill.
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        danger: 'hsl(var(--danger))',
      },
    },
  },
  plugins: [],
};
