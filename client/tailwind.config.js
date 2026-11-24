/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic dynamic WhatsApp tokens that adapt to theme via CSS variables
        wa: {
          bg: 'var(--wa-bg)',
          panel: 'var(--wa-panel)',
          surface: 'var(--wa-surface)',
          subtle: 'var(--wa-subtle)',
          hover: 'var(--wa-hover)',
          active: 'var(--wa-active)',
          border: 'var(--wa-border)',
          input: 'var(--wa-input)',
          primary: 'var(--wa-primary)',
          secondary: 'var(--wa-secondary)',
          incoming: 'var(--wa-incoming)',
          outgoing: 'var(--wa-outgoing)',
          dropdown: 'var(--wa-dropdown)',
          // Brand & Accent constants
          green: {
            DEFAULT: '#00a884',
            light: '#25d366',
            dark: '#008069',
            badge: '#25d366',
          },
          teal: {
            DEFAULT: '#128c7e',
            dark: '#075e54',
          },
          tick: {
            blue: '#53bdeb',
            grey: '#8696a0',
          },
          // WhatsApp Web Dark Theme Palette (legacy explicit tokens)
          dark: {
            bg: '#111b21',
            panel: '#202c33',
            surface: '#111b21',
            subtle: '#182229',
            hover: '#202c33',
            active: '#2a3942',
            border: '#222d34',
            input: '#2a3942',
            primary: '#e9edef',
            secondary: '#8696a0',
            incoming: '#202c33',
            outgoing: '#005c4b',
            outgoingHover: '#025143',
            dropdown: '#233138',
          },
          // WhatsApp Web Light Theme Palette (legacy explicit tokens)
          light: {
            bg: '#efeae2',
            panel: '#f0f2f5',
            surface: '#ffffff',
            subtle: '#f7f8fa',
            hover: '#f5f6f6',
            active: '#ebebeb',
            border: '#e9edef',
            input: '#f0f2f5',
            primary: '#111b21',
            secondary: '#667781',
            incoming: '#ffffff',
            outgoing: '#d9fdd3',
            outgoingHover: '#c7f4bf',
            dropdown: '#ffffff',
          }
        }
      },
      fontFamily: {
        sans: [
          'Segoe UI',
          'Helvetica Neue',
          'Helvetica',
          'Lucida Grande',
          'Arial',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'sans-serif',
        ],
      },
      boxShadow: {
        'wa-dropdown': '0 2px 5px 0 rgba(11,20,26,.26),0 2px 10px 0 rgba(11,20,26,.16)',
        'wa-bubble': '0 1px .5px rgba(11,20,26,.13)',
      }
    },
  },
  plugins: [],
}
