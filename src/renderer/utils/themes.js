const THEMES = {
  'amethyst-gold': {
    label: 'Amethyst Gold',
    accent: '#d946ef',
    border: '#b8860b',
    vars: { '--bg':'#0c0514','--surface':'#150a20','--surface2':'#1c0f2c','--border':'#b8860b','--accent':'#d946ef','--accent2':'#c026d3','--text':'#ffffff','--text-muted':'#7a4a8a','--success':'#50fa7b','--danger':'#ff5555' },
  },
  'original': {
    label: 'Original',
    accent: '#e8b84b',
    border: '#2a2a38',
    vars: { '--bg':'#06030b','--surface':'#000000','--surface2':'#000000','--border':'#2a2a38','--accent':'#e8b84b','--accent2':'#c49a30','--text':'#e8e8f0','--text-muted':'#7a7a9a','--success':'#4ade80','--danger':'#f87171' },
  },
  'darcula': {
    label: 'Darcula',
    accent: '#e8b84b',
    border: '#3d3f41',
    vars: { '--bg':'#1e1f22','--surface':'#2b2d30','--surface2':'#27282c','--border':'#3d3f41','--accent':'#e8b84b','--accent2':'#c49a30','--text':'#a9b7c6','--text-muted':'#808080','--success':'#4ade80','--danger':'#f87171' },
  },
  'midnight': {
    label: 'Midnight Blue',
    accent: '#3b82f6',
    border: '#1e4d8c',
    vars: { '--bg':'#010b18','--surface':'#021428','--surface2':'#031d38','--border':'#1e4d8c','--accent':'#3b82f6','--accent2':'#2563eb','--text':'#e2e8f0','--text-muted':'#4a7090','--success':'#4ade80','--danger':'#f87171' },
  },
  'crimson': {
    label: 'Crimson Dark',
    accent: '#ef4444',
    border: '#7f1d1d',
    vars: { '--bg':'#0f0205','--surface':'#1a0508','--surface2':'#220709','--border':'#7f1d1d','--accent':'#ef4444','--accent2':'#dc2626','--text':'#fff1f2','--text-muted':'#7f3333','--success':'#4ade80','--danger':'#fca5a5' },
  },
};

function applyTheme(id) {
  const theme = THEMES[id] || THEMES['amethyst-gold'];
  const root = document.documentElement;
  for (const [prop, val] of Object.entries(theme.vars)) {
    root.style.setProperty(prop, val);
  }
}
