import { type ThemeVars, type FontSet, THEMES, FONT_SETS } from "@/types";
import { useT, useLocale } from "@/i18n";

interface SettingsDialogProps {
  theme: string;
  setTheme: (t: string) => void;
  customThemes: Record<string, ThemeVars>;
  fontSet: FontSet;
  setFontSet: (fs: FontSet) => void;
  isFocusMode: boolean;
  setIsFocusMode: (v: boolean | ((prev: boolean) => boolean)) => void;
  onClose: () => void;
  onOpenCustomThemes: () => void;
  showToast: (msg: string) => void;
  onDecreaseFontSize: () => void;
  onIncreaseFontSize: () => void;
  onDecreaseLineHeight: () => void;
  onIncreaseLineHeight: () => void;
  onResetFont: () => void;
}

const THEME_LIST = ['system', 'snow', 'githubDark', 'nord', 'tokyoNight', 'solarizedLight', 'solarizedDark', 'ivory', 'navy', 'midnight', 'slate', 'ocean', 'storm', 'twilight', 'onyx', 'sepia'] as const;

export default function SettingsDialog(props: SettingsDialogProps) {
  const _t = useT();
  const { locale, setLocale } = useLocale();
  const { theme, setTheme, customThemes, fontSet, setFontSet, isFocusMode, setIsFocusMode, onClose, onOpenCustomThemes, showToast, onDecreaseFontSize, onIncreaseFontSize, onDecreaseLineHeight, onIncreaseLineHeight, onResetFont } = props;

  return (
    <div
      className="fixed z-50 settings-panel"
      style={{
        top: 50,
        right: 12,
        width: 400,
        maxHeight: 'calc(100vh - 64px)',
        overflowY: 'auto',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      }}
    >
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{_t('settings.title')}</h2>
          <button className="toolbar-btn" onClick={onClose} style={{ padding: '4px 8px' }}>✕</button>
        </div>

        {/* Theme section */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>{_t('settings.theme')}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {THEME_LIST.map((t) => {
              const effective = t === 'system' ? undefined : THEMES[t];
              const accent = effective?.['--accent'] ?? '#60a5fa';
              const bg = effective?.['--bg-primary'] ?? '#0f172a';
              const label = t.charAt(0).toUpperCase() + t.slice(1);
              const isActive = theme === t;
              return (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  title={label}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    border: isActive ? `2px solid var(--accent)` : `2px solid var(--border)`,
                    background: bg,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? '0 0 0 2px var(--accent-bg)' : 'none',
                  }}
                >
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: accent, display: 'block' }} />
                  {t === 'system' && (
                    <span style={{ position: 'absolute', bottom: -2, right: -2, fontSize: 10, background: 'var(--bg-primary)', color: 'var(--text-muted)', borderRadius: 4, padding: '0 3px', border: '1px solid var(--border)', lineHeight: '14px' }}>A</span>
                  )}
                </button>
              );
            })}
            {Object.keys(customThemes).map((name) => {
              const vars = customThemes[name];
              const accent = vars['--accent'] ?? '#60a5fa';
              const bg = vars['--bg-primary'] ?? '#0f172a';
              const isActive = theme === name;
              return (
                <button
                  key={name}
                  onClick={() => setTheme(name)}
                  title={name}
                  style={{ width: 48, height: 48, borderRadius: 10, border: isActive ? `2px solid var(--accent)` : `2px solid var(--border)`, background: bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease', boxShadow: isActive ? '0 0 0 2px var(--accent-bg)' : 'none' }}
                >
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: accent, display: 'block' }} />
                </button>
              );
            })}
          </div>
          <button className="toolbar-btn" onClick={() => { onOpenCustomThemes(); onClose(); }} style={{ marginTop: 8, fontSize: 12 }}>
            {_t('settings.custom_themes')}
          </button>
        </div>

        {/* Font section */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>{_t('settings.font')}</h3>
          <div className="space-y-2">
            {FONT_SETS.map((fs) => (
              <button
                key={fs.label}
                className="w-full text-left"
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: fontSet.label === fs.label ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: fontSet.label === fs.label ? 'white' : 'var(--text-primary)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  transition: 'all 0.15s ease',
                }}
                onClick={() => { setFontSet(fs); showToast(`${_t('app.font')}: ${fs.label}`); }}
              >
                <span style={{ fontWeight: 600 }}>{fs.label}</span>
                <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 8, fontFamily: fs.body }}>{fs.body.split(',')[0].trim()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Reading density */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>{_t('settings.density')}</h3>
          <div className="flex flex-wrap gap-2">
            <button className="toolbar-btn" onClick={onDecreaseFontSize}>{_t('settings.font_size_down')}</button>
            <button className="toolbar-btn" onClick={onIncreaseFontSize}>{_t('settings.font_size_up')}</button>
            <button className="toolbar-btn" onClick={onDecreaseLineHeight}>{_t('settings.line_height_down')}</button>
            <button className="toolbar-btn" onClick={onIncreaseLineHeight}>{_t('settings.line_height_up')}</button>
            <button className="toolbar-btn" onClick={onResetFont}>{_t('settings.font_reset')}</button>
          </div>
        </div>

        {/* Display */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>{_t('settings.display')}</h3>
          <button
            className="toolbar-btn"
            onClick={() => { setIsFocusMode(p => !p); onClose(); }}
            style={{ background: isFocusMode ? 'var(--accent-bg)' : 'transparent', color: isFocusMode ? 'var(--accent)' : 'var(--text-secondary)', borderColor: isFocusMode ? 'var(--accent)' : 'var(--border)' }}
          >
            {isFocusMode ? '✓ ' : ''}{_t('settings.focus_mode')}
          </button>
        </div>

        {/* Language */}
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Language</h3>
          <div className="flex gap-2">
            <button
              className="toolbar-btn"
              onClick={() => setLocale('en')}
              style={{
                background: locale === 'en' ? 'var(--accent)' : 'var(--bg-secondary)',
                color: locale === 'en' ? 'white' : 'var(--text-primary)',
                borderColor: locale === 'en' ? 'var(--accent)' : 'var(--border)',
              }}
            >
              English
            </button>
            <button
              className="toolbar-btn"
              onClick={() => setLocale('pl')}
              style={{
                background: locale === 'pl' ? 'var(--accent)' : 'var(--bg-secondary)',
                color: locale === 'pl' ? 'white' : 'var(--text-primary)',
                borderColor: locale === 'pl' ? 'var(--accent)' : 'var(--border)',
              }}
            >
              Polski
            </button>
          </div>
        </div>
    </div>
  );
}