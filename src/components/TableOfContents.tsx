import { extractToc } from '@/types';
import { useMemo } from 'react';

interface TableOfContentsProps {
  markdown: string;
  activeId?: string;
}

export default function TableOfContents({ markdown, activeId }: TableOfContentsProps) {
  const items = useMemo(() => extractToc(markdown), [markdown]);

  if (items.length === 0) {
    return (
      <div
        className="toc-sidebar custom-scrollbar"
        style={{
          width: 240,
          minWidth: 240,
          borderRight: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          padding: '16px',
          overflowY: 'auto',
          height: '100%',
        }}
      >
        <div style={{
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.5px',
          color: 'var(--text-muted)',
          marginBottom: 12,
        }}>
          Table of Contents
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          No headings found. Add headings with # to see them here.
        </p>
      </div>
    );
  }

  const handleClick = (line: number, id: string) => {
    const el = document.querySelector<HTMLElement>(`[data-source-start-line="${line}"]`) ?? document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const minLevel = Math.min(...items.map(i => i.level));

  return (
    <div
      className="toc-sidebar custom-scrollbar"
      style={{
        width: 240,
        minWidth: 240,
        borderRight: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        padding: '16px',
        overflowY: 'auto',
        height: '100%',
      }}
    >
      <div style={{
        fontSize: 12,
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        color: 'var(--text-muted)',
        marginBottom: 12,
      }}>
        Table of Contents
      </div>
      <nav>
        {items.map((item) => {
          const indent = (item.level - minLevel) * 12;
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.line, item.id)}
              className={`toc-item ${isActive ? 'toc-item-active' : ''}`}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left' as const,
                padding: `4px 8px 4px ${8 + indent}px`,
                margin: 0,
                border: 'none',
                background: 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 13,
                lineHeight: 1.4,
                cursor: 'pointer',
                borderRadius: 4,
                transition: 'all 0.15s ease',
                fontWeight: isActive ? 600 : 400,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap' as const,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-primary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
              title={item.text}
            >
              {item.text}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
