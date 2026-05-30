export type ViewMode = 'code' | 'preview' | 'split';
export type ThemeName = 'system' | 'snow' | 'ivory' | 'navy' | 'midnight' | 'slate' | 'ocean' | 'storm' | 'twilight' | 'onyx' | 'sepia';
export type EffectiveTheme = 'snow' | 'ivory' | 'navy' | 'midnight' | 'slate' | 'ocean' | 'storm' | 'twilight' | 'onyx' | 'sepia';

export interface TocItem {
  id: string;
  level: number;
  text: string;
}

export interface TextStats {
  words: number;
  lines: number;
  characters: number;
  readTime: string;
}

export type ThemeVars = Record<string, string>;

export const THEMES: Record<EffectiveTheme, ThemeVars> = {
  snow: {
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f8fafc',
    '--bg-toolbar': 'rgba(255,255,255,0.85)',
    '--text-primary': '#0f172a',
    '--text-secondary': '#475569',
    '--text-muted': '#94a3b8',
    '--border': '#e2e8f0',
    '--accent': '#2563eb',
    '--accent-hover': '#1d4ed8',
    '--accent-bg': '#eff6ff',
    '--code-bg': '#1e1e2e',
    '--scrollbar-track': '#f1f5f9',
    '--scrollbar-thumb': '#cbd5e1',
    '--callout-note-bg': '#dbeafe',
    '--callout-note-border': '#3b82f6',
    '--callout-tip-bg': '#dcfce7',
    '--callout-tip-border': '#22c55e',
    '--callout-important-bg': '#fef9c3',
    '--callout-important-border': '#eab308',
    '--callout-warning-bg': '#ffedd5',
    '--callout-warning-border': '#f97316',
    '--callout-caution-bg': '#fee2e2',
    '--callout-caution-border': '#ef4444',
  },
  ivory: {
    '--bg-primary': '#faf8f5',
    '--bg-secondary': '#f5f0eb',
    '--bg-toolbar': 'rgba(250,248,245,0.85)',
    '--text-primary': '#2d2a24',
    '--text-secondary': '#6b5c47',
    '--text-muted': '#a89a83',
    '--border': '#e3dcd0',
    '--accent': '#b45309',
    '--accent-hover': '#9a3e06',
    '--accent-bg': '#fef3e7',
    '--code-bg': '#2b2520',
    '--scrollbar-track': '#efe3c8',
    '--scrollbar-thumb': '#c9b98a',
    '--callout-note-bg': '#e8e0d0',
    '--callout-note-border': '#8b7d65',
    '--callout-tip-bg': '#dce8cc',
    '--callout-tip-border': '#7a9a5a',
    '--callout-important-bg': '#f0e8cc',
    '--callout-important-border': '#c4a832',
    '--callout-warning-bg': '#f0dccc',
    '--callout-warning-border': '#d4883a',
    '--callout-caution-bg': '#f0ccc0',
    '--callout-caution-border': '#c85a4a',
  },
  navy: {
    '--bg-primary': '#0f172a',
    '--bg-secondary': '#1e293b',
    '--bg-toolbar': 'rgba(15,23,42,0.92)',
    '--text-primary': '#e2e8f0',
    '--text-secondary': '#94a3b8',
    '--text-muted': '#64748b',
    '--border': '#334155',
    '--accent': '#60a5fa',
    '--accent-hover': '#93c5fd',
    '--accent-bg': '#1e3a5f',
    '--code-bg': '#0a0f1e',
    '--scrollbar-track': '#1e293b',
    '--scrollbar-thumb': '#475569',
    '--callout-note-bg': '#172554',
    '--callout-note-border': '#3b82f6',
    '--callout-tip-bg': '#14532d',
    '--callout-tip-border': '#22c55e',
    '--callout-important-bg': '#422006',
    '--callout-important-border': '#eab308',
    '--callout-warning-bg': '#431407',
    '--callout-warning-border': '#f97316',
    '--callout-caution-bg': '#450a0a',
    '--callout-caution-border': '#ef4444',
  },
  midnight: {
    '--bg-primary': '#0a0e1a',
    '--bg-secondary': '#131827',
    '--bg-toolbar': 'rgba(10,14,26,0.92)',
    '--text-primary': '#c8d0dc',
    '--text-secondary': '#7b8ba3',
    '--text-muted': '#525e73',
    '--border': '#1f2a3d',
    '--accent': '#818cf8',
    '--accent-hover': '#a5b4fc',
    '--accent-bg': '#1e1b4b',
    '--code-bg': '#060912',
    '--scrollbar-track': '#131827',
    '--scrollbar-thumb': '#2a3448',
    '--callout-note-bg': '#1a1b3e',
    '--callout-note-border': '#6366f1',
    '--callout-tip-bg': '#14302a',
    '--callout-tip-border': '#34d399',
    '--callout-important-bg': '#3a2e10',
    '--callout-important-border': '#eab308',
    '--callout-warning-bg': '#3a1f0e',
    '--callout-warning-border': '#f97316',
    '--callout-caution-bg': '#3a0e0e',
    '--callout-caution-border': '#ef4444',
  },
  slate: {
    '--bg-primary': '#111827',
    '--bg-secondary': '#1f2937',
    '--bg-toolbar': 'rgba(17,24,39,0.92)',
    '--text-primary': '#d1d5db',
    '--text-secondary': '#9ca3af',
    '--text-muted': '#6b7280',
    '--border': '#374151',
    '--accent': '#14b8a6',
    '--accent-hover': '#2dd4bf',
    '--accent-bg': '#134e4a',
    '--code-bg': '#0d1520',
    '--scrollbar-track': '#1f2937',
    '--scrollbar-thumb': '#4b5563',
    '--callout-note-bg': '#172554',
    '--callout-note-border': '#3b82f6',
    '--callout-tip-bg': '#0f3d30',
    '--callout-tip-border': '#14b8a6',
    '--callout-important-bg': '#3a2e10',
    '--callout-important-border': '#eab308',
    '--callout-warning-bg': '#3a1f0e',
    '--callout-warning-border': '#f97316',
    '--callout-caution-bg': '#3a0e0e',
    '--callout-caution-border': '#ef4444',
  },
  ocean: {
    '--bg-primary': '#0c1929',
    '--bg-secondary': '#0f2035',
    '--bg-toolbar': 'rgba(12,25,41,0.92)',
    '--text-primary': '#c5d5e6',
    '--text-secondary': '#7a9bbf',
    '--text-muted': '#4d6a8a',
    '--border': '#1a3050',
    '--accent': '#38bdf8',
    '--accent-hover': '#7dd3fc',
    '--accent-bg': '#0c4a6e',
    '--code-bg': '#081420',
    '--scrollbar-track': '#0f2035',
    '--scrollbar-thumb': '#1e3a5f',
    '--callout-note-bg': '#0c2d4a',
    '--callout-note-border': '#38bdf8',
    '--callout-tip-bg': '#0a3328',
    '--callout-tip-border': '#22c55e',
    '--callout-important-bg': '#332a10',
    '--callout-important-border': '#eab308',
    '--callout-warning-bg': '#331a0e',
    '--callout-warning-border': '#f97316',
    '--callout-caution-bg': '#330e0e',
    '--callout-caution-border': '#ef4444',
  },
  storm: {
    '--bg-primary': '#121820',
    '--bg-secondary': '#1a222c',
    '--bg-toolbar': 'rgba(18,24,32,0.92)',
    '--text-primary': '#cbd5e1',
    '--text-secondary': '#8899aa',
    '--text-muted': '#5a6a7a',
    '--border': '#2a3440',
    '--accent': '#34d399',
    '--accent-hover': '#6ee7b7',
    '--accent-bg': '#0d3a2a',
    '--code-bg': '#0d131c',
    '--scrollbar-track': '#1a222c',
    '--scrollbar-thumb': '#334155',
    '--callout-note-bg': '#1a2540',
    '--callout-note-border': '#3b82f6',
    '--callout-tip-bg': '#0d3022',
    '--callout-tip-border': '#34d399',
    '--callout-important-bg': '#332a10',
    '--callout-important-border': '#eab308',
    '--callout-warning-bg': '#331f0e',
    '--callout-warning-border': '#f97316',
    '--callout-caution-bg': '#330e0e',
    '--callout-caution-border': '#ef4444',
  },
  twilight: {
    '--bg-primary': '#0f0f1a',
    '--bg-secondary': '#191928',
    '--bg-toolbar': 'rgba(15,15,26,0.92)',
    '--text-primary': '#d4cde8',
    '--text-secondary': '#8b80a8',
    '--text-muted': '#5a5070',
    '--border': '#2a2640',
    '--accent': '#a78bfa',
    '--accent-hover': '#c4b5fd',
    '--accent-bg': '#2e1065',
    '--code-bg': '#0a0a14',
    '--scrollbar-track': '#191928',
    '--scrollbar-thumb': '#353050',
    '--callout-note-bg': '#1e1a40',
    '--callout-note-border': '#6366f1',
    '--callout-tip-bg': '#142820',
    '--callout-tip-border': '#34d399',
    '--callout-important-bg': '#332810',
    '--callout-important-border': '#eab308',
    '--callout-warning-bg': '#331c0e',
    '--callout-warning-border': '#f97316',
    '--callout-caution-bg': '#330e0e',
    '--callout-caution-border': '#ef4444',
  },
  onyx: {
    '--bg-primary': '#0d0d0d',
    '--bg-secondary': '#1a1a1a',
    '--bg-toolbar': 'rgba(13,13,13,0.92)',
    '--text-primary': '#d4d4d4',
    '--text-secondary': '#888888',
    '--text-muted': '#555555',
    '--border': '#2a2a2a',
    '--accent': '#e879f9',
    '--accent-hover': '#f0abfc',
    '--accent-bg': '#4a1d55',
    '--code-bg': '#080808',
    '--scrollbar-track': '#1a1a1a',
    '--scrollbar-thumb': '#333333',
    '--callout-note-bg': '#1a1a3a',
    '--callout-note-border': '#818cf8',
    '--callout-tip-bg': '#142818',
    '--callout-tip-border': '#22c55e',
    '--callout-important-bg': '#332810',
    '--callout-important-border': '#eab308',
    '--callout-warning-bg': '#331c0e',
    '--callout-warning-border': '#f97316',
    '--callout-caution-bg': '#330e0e',
    '--callout-caution-border': '#ef4444',
  },
  sepia: {
    '--bg-primary': '#faf4e8',
    '--bg-secondary': '#f2ead4',
    '--bg-toolbar': 'rgba(250,244,232,0.85)',
    '--text-primary': '#433422',
    '--text-secondary': '#6b5c47',
    '--text-muted': '#a89a83',
    '--border': '#ddd0b8',
    '--accent': '#b8860b',
    '--accent-hover': '#9a7209',
    '--accent-bg': '#f0e4c4',
    '--code-bg': '#2b2520',
    '--scrollbar-track': '#efe3c8',
    '--scrollbar-thumb': '#c9b98a',
    '--callout-note-bg': '#e0dcc4',
    '--callout-note-border': '#8b7d65',
    '--callout-tip-bg': '#d8e8c0',
    '--callout-tip-border': '#7a9a5a',
    '--callout-important-bg': '#f2ecc0',
    '--callout-important-border': '#c4a832',
    '--callout-warning-bg': '#f2dcc0',
    '--callout-warning-border': '#d4883a',
    '--callout-caution-bg': '#f2ccc0',
    '--callout-caution-border': '#c85a4a',
  },
};

export function getEffectiveTheme(theme: ThemeName): EffectiveTheme {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'navy' : 'snow';
  }
  return theme as EffectiveTheme;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function extractToc(markdown: string): TocItem[] {
  const headings: TocItem[] = [];
  const lines = markdown.split('\n');
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2]
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[*_`~]/g, '')
        .trim();
      headings.push({ id: slugify(text), level, text });
    }
  }

  return headings;
}

export function getStats(markdown: string): TextStats {
  const text = markdown.trim();
  if (!text) return { words: 0, lines: 0, characters: 0, readTime: '< 1 min' };
  const words = text.split(/\s+/).filter(Boolean).length;
  const lines = text.split('\n').length;
  const characters = text.length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  const readTime = minutes <= 1 ? '< 1 min' : `~${minutes} min`;
  return { words, lines, characters, readTime };
}

export type BlockType = 'heading1' | 'heading2' | 'heading3' | 'heading4' | 'heading5' | 'heading6' | 'paragraph' | 'code' | 'list' | 'blockquote' | 'table' | 'thematicBreak';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
}

let blockIdCounter = 0;
function nextBlockId(): string {
  return `b${++blockIdCounter}`;
}

export function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.split('\n');
  const current: string[] = [];
  let inCodeBlock = false;

  function makeBlock(content: string): Block {
    const trimmed = content.trimStart();
    const firstLine = trimmed.split('\n')[0];

    if (inCodeBlock || trimmed.startsWith('```')) {
      return { id: nextBlockId(), type: 'code', content };
    }

    const headingMatch = firstLine.match(/^(#{1,6})\s/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      return { id: nextBlockId(), type: `heading${level}` as BlockType, content };
    }

    if (firstLine.startsWith('|')) {
      return { id: nextBlockId(), type: 'table', content };
    }

    if (firstLine.startsWith('>')) {
      return { id: nextBlockId(), type: 'blockquote', content };
    }

    if (/^[-*+]\s/.test(firstLine) || /^\d+[.)]\s/.test(firstLine)) {
      return { id: nextBlockId(), type: 'list', content };
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(firstLine.trim())) {
      return { id: nextBlockId(), type: 'thematicBreak', content };
    }

    return { id: nextBlockId(), type: 'paragraph', content };
  }

  function flush() {
    if (current.length === 0) return;
    blocks.push(makeBlock(current.join('\n')));
    current.length = 0;
  }

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      current.push(line);
      if (inCodeBlock) {
        inCodeBlock = false;
        flush();
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      current.push(line);
      continue;
    }

    if (line.trim() === '') {
      flush();
      continue;
    }

    current.push(line);
  }
  flush();

  return blocks;
}

export function serializeBlocks(blocks: Block[]): string {
  return blocks.map(b => b.content).join('\n\n');
}

export const SAMPLE_MARKDOWN = `# Welcome to MD MA

A beautiful Markdown editor and viewer.

## ✨ Features

### Three View Modes

Switch between **Code**, **Preview**, and **Split** view modes using the toolbar.

- **Code** — write and edit raw Markdown
- **Preview** — see your document rendered with rich formatting
- **Split** — code on the left, live preview on the right, scroll-synced

### Syntax Highlighting

Code blocks with syntax highlighting for 20+ languages:

\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55
\`\`\`

\`\`\`python
class MarkdownParser:
    def __init__(self, content: str):
        self.content = content

    def render(self) -> str:
        """Parse markdown content to HTML."""
        return self._parse(self.content)
\`\`\`

\`\`\`css
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.2s ease;
}
\`\`\`

### Tables

| Feature | Status | Description |
|---------|--------|-------------|
| Code Mode | ✅ | Raw markdown editing |
| Preview Mode | ✅ | Rendered output |
| Split View | ✅ | Side by side with scroll sync |
| Themes | ✅ | 4 themes available |
| Syntax Highlighting | ✅ | 20+ languages |
| Copy Rendered | ✅ | Rich text clipboard |

### Task Lists

- [x] Drag & drop file support
- [x] Syntax highlighting
- [x] Copy rendered markdown
- [x] Table of Contents
- [x] 4 beautiful themes
- [ ] PDF export
- [ ] Custom themes

### GitHub Callouts

> [!NOTE]
> This is a GitHub-style callout note. Great for highlighting important information.

> [!TIP]
> Drag and drop any \`.md\` or \`.txt\` file onto the editor to open it instantly!

> [!IMPORTANT]
> Key information that users should be aware of when using this editor.

> [!WARNING]
> Make sure to save your work before closing the browser tab.

> [!CAUTION]
> Be careful — destructive actions cannot be undone!

### Text Formatting

**Bold text**, *italic text*, ~~strikethrough~~, and \`inline code\`.

> Regular blockquotes work too — perfect for quoting documentation or other sources.

---

### Links & Images

Visit [GitHub](https://github.com) for more markdown resources.

### Ordered List

1. First item
2. Second item
3. Third item
   1. Nested item
   2. Another nested item

---

*Start editing or drop a file to begin!*
`;
