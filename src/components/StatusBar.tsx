import { getStats, getFileFormat } from '@/types';
import { useMemo } from 'react';
import { useT } from '@/i18n';

interface StatusBarProps {
  markdown: string;
  fileName?: string | null;
}

export default function StatusBar({ markdown, fileName }: StatusBarProps) {
  const _t = useT();
  const stats = useMemo(() => getStats(markdown), [markdown]);
  const format = getFileFormat(fileName) || 'MD';

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
        <span>{stats.words} {_t('status.words')}</span>
        <span>{stats.lines} {_t('status.lines')}</span>
        <span>{stats.characters} {_t('status.chars')}</span>
      </div>
      <div className="flex items-center gap-4">
        <span>{format}</span>
        <span>📖 {stats.readTime}</span>
      </div>
    </div>
  );
}
