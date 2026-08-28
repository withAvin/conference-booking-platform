module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      // Mirrors the Figma colour styles so the built UI and the
      // prototype stay in step. Change a value here and every screen
      // follows, the same way changing a Figma style does.
      colors: {
        page: '#F7F7F5',
        surface: '#FFFFFF',
        line: '#E3E3E0',
        'line-strong': '#B4B2A9',
        ink: '#1F1F1D',
        'ink-soft': '#6B6B66',
        'ink-muted': '#A3A39E',
        'error-bg': '#FCEBEB',
        'error-line': '#E24B4A',
        'error-ink': '#A32D2D',
        'success-bg': '#EAF3DE',
        'success-line': '#639922',
        'success-ink': '#3B6D11',
      },
    },
  },
  plugins: [],
};
