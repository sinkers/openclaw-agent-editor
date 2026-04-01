import { useAppStore } from '../../store/appStore';

export function ThemeToggle() {
  const { theme, toggleTheme } = useAppStore();

  return (
    <button
      onClick={toggleTheme}
      className="w-full px-3 py-2 text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded flex items-center justify-between transition-colors"
      aria-label="Toggle theme"
    >
      <span>Theme</span>
      <span className="text-lg">{theme === 'dark' ? '🌙' : '☀️'}</span>
    </button>
  );
}
