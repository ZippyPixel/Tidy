const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{vue,js,ts,jsx,tsx}', './nuxt.config.js'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Roboto Flex for Latin; Bengali glyphs fall through to Noto Sans Bengali
        sans: ['"Roboto Flex"', ...defaultTheme.fontFamily.sans, '"Noto Sans Bengali"']
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        // V3 weather semantics (assets/style.css)
        'surface-raised': 'hsl(var(--surface-raised))',
        scrollbar: {
          thumb: {
            DEFAULT: 'hsl(var(--scrollbar-thumb))',
            hover: 'hsl(var(--scrollbar-thumb-hover))',
            active: 'hsl(var(--scrollbar-thumb-active))'
          },
          track: 'hsl(var(--scrollbar-track))'
        },
        tide: {
          DEFAULT: 'hsl(var(--tide) / <alpha-value>)',
          soft: 'hsl(var(--tide-soft) / <alpha-value>)'
        },
        sun: 'hsl(var(--sun))',
        rain: 'hsl(var(--rain))',
        'cloud-highlight': 'hsl(var(--cloud-highlight))',
        'cloud-shade': 'hsl(var(--cloud-shade))',
        horizon: 'hsl(var(--horizon))',
        'sun-arc': {
          DEFAULT: 'hsl(var(--sun-arc))',
          ahead: 'hsl(var(--sun-arc-ahead))'
        },
        'moon-arc': {
          DEFAULT: 'hsl(var(--moon-arc))',
          ahead: 'hsl(var(--moon-arc-ahead))'
        },
        'moon-lit': 'hsl(var(--moon-lit))',
        'moon-shadow': 'hsl(var(--moon-shadow))',
        chart: {
          line: 'hsl(var(--chart-line))',
          fill: 'hsl(var(--chart-fill))',
          grid: 'hsl(var(--chart-grid))',
          temperature: 'hsl(var(--chart-temperature))',
          feels: 'hsl(var(--chart-feels))',
          rain: 'hsl(var(--chart-rain))',
          wind: 'hsl(var(--chart-wind))',
          night: 'hsl(var(--chart-night))',
          humidity: 'hsl(var(--chart-humidity))'
        }
      },
      borderRadius: {
        xl: 'calc(var(--radius) + 4px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        // V3 card (20px) and tile (16px) radii; kept apart from lg/xl so the
        // shadcn primitives keep their meaning
        card: 'var(--radius-xl)',
        tile: 'var(--radius-lg)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--reka-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--reka-accordion-content-height)' },
          to: { height: 0 }
        },
        'collapsible-down': {
          from: { height: 0 },
          to: { height: 'var(--reka-collapsible-content-height)' }
        },
        'collapsible-up': {
          from: { height: 'var(--reka-collapsible-content-height)' },
          to: { height: 0 }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'collapsible-down': 'collapsible-down 0.2s ease-in-out',
        'collapsible-up': 'collapsible-up 0.2s ease-in-out'
      }
    }
  },
  plugins: [require('tailwind-scrollbar-hide'), require('tailwindcss-animate')]
}
