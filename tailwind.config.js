/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        page:    'var(--bg-page)',
        sidebar: 'var(--bg-sidebar)',
        card:    'var(--bg-card)',
        soft:    'var(--border-soft)',
        ink:     'var(--text-primary)',
        body:    'var(--text-body)',
        muted:   'var(--text-muted)',
        accent:  'var(--accent)',
        'accent-strong': 'var(--accent-strong)',
        success: 'var(--success)',
        danger:  'var(--danger)'
      },
      fontFamily: {
        sans: ['Inter', 'HarmonyOS Sans SC', 'Microsoft YaHei', 'sans-serif'],
        serif: ['Georgia', 'KaiTi', 'serif']
      },
      borderRadius: {
        card: '12px',
        pill: '999px'
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.04)',
        lift: '0 4px 12px rgba(251,146,60,0.15)'
      }
    }
  },
  plugins: []
}
