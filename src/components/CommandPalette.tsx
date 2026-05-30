import { useState, useCallback, useRef, useEffect } from 'react';
import { useT } from '@/i18n';

interface Command {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  commands: Command[];
  onClose: () => void;
}

export default function CommandPalette({ commands, onClose }: CommandPaletteProps) {
  const _t = useT();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query
    ? commands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase()) ||
        c.shortcut?.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const execute = useCallback((cmd: Command) => {
    cmd.action();
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      execute(filtered[selectedIndex]);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
  }, [filtered, selectedIndex, execute, onClose]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center modal-overlay"
      style={{ background: 'rgba(0,0,0,0.4)', paddingTop: '12vh' }}
      onClick={handleOverlayClick}
    >
      <div
        className="rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
          <input
            ref={inputRef}
            type="text"
            placeholder={_t('palette.placeholder')}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box',
            }}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <div style={{ maxHeight: 320, overflowY: 'auto', padding: '4px 0' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}>
              No matching commands
            </div>
          )}
          {filtered.map((cmd, idx) => (
            <button
              key={cmd.id}
              className="w-full text-left"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '8px 16px',
                border: 'none',
                background: idx === selectedIndex ? 'var(--accent)' : 'transparent',
                color: idx === selectedIndex ? 'white' : 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: 14,
                transition: 'background 0.1s',
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
              onClick={() => execute(cmd)}
            >
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 12, color: idx === selectedIndex ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', minWidth: 56, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  {cmd.category}
                </span>
                <span>{cmd.label}</span>
              </div>
              {cmd.shortcut && (
                <kbd style={{
                  fontSize: 11,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: idx === selectedIndex ? 'rgba(255,255,255,0.15)' : 'var(--bg-secondary)',
                  color: idx === selectedIndex ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-code)',
                  marginLeft: 12,
                }}>
                  {cmd.shortcut}
                </kbd>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
