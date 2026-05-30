import { getStats } from '@/types';
import { useMemo } from 'react';

interface StatusBarProps {
  markdown: string;
}

export default function StatusBar({ markdown }: StatusBarProps) {
  const stats = useMemo(() => getStats(markdown), [markdown]);

  return (
    <div
      className="status-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 16px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-toolbar)',
        minHeight: 28,
        fontSize: 12,
        color: 'var(--text-muted)',
        userSelect: 'none' as const,
      }}
    >
      <div className="flex items-center gap-4">
        <span>{stats.words} words</span>
        <span>{stats.lines} lines</span>
        <span>{stats.characters} chars</span>
      </div>
      <div>
        <span>📖 {stats.readTime}</span>
      </div>
    </div>
  );
}
