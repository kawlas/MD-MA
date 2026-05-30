export type ViewMode = 'code' | 'preview' | 'split';
export type ThemeName = 'system' | 'sepia' | 'nord' | 'solarized';
export type EffectiveTheme = 'light' | 'dark' | 'sepia' | 'nord' | 'solarized-light' | 'solarized-dark';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ThemeVars = Record<string, string>;

export const THEMES: Record<EffectiveTheme, ThemeVars> = {
  light: {
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f8fafc',
    '--bg-toolbar': '#ffffff',
    '--text-primary': '#0f172a',
    '--text-secondary': '#475569',
    '--text-muted': '#94a3b8',
    '--border': '#e2e8f0',
    '--accent': '#3b82f6',
    '--accent-hover': '#2563eb',
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
  dark: {
    '--bg-primary': '#0f172a',
    '--bg-secondary': '#1e293b',
    '--bg-toolbar': '#0f172a',
    '--text-primary': '#f1f5f9',
    '--text-secondary': '#94a3b8',
    '--text-muted': '#64748b',
    '--border': '#334155',
    '--accent': '#60a5fa',
    '--accent-hover': '#93c5fd',
    '--accent-bg': '#1e3a5f',
    '--code-bg': '#0f172a',
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
  sepia: {
    '--bg-primary': '#faf4e8',
    '--bg-secondary': '#f2ead4',
    '--bg-toolbar': '#faf4e8',
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
  nord: {
    '--bg-primary': '#2e3440',
    '--bg-secondary': '#3b4252',
    '--bg-toolbar': '#2e3440',
    '--text-primary': '#eceff4',
    '--text-secondary': '#d8dee9',
    '--text-muted': '#4c566a',
    '--border': '#434c5e',
    '--accent': '#88c0d0',
    '--accent-hover': '#8fbcbb',
    '--accent-bg': '#3b4252',
    '--code-bg': '#242933',
    '--scrollbar-track': '#3b4252',
    '--scrollbar-thumb': '#4c566a',
    '--callout-note-bg': '#333b4d',
    '--callout-note-border': '#5e81ac',
    '--callout-tip-bg': '#2f3d35',
    '--callout-tip-border': '#a3be8c',
    '--callout-important-bg': '#3a3630',
    '--callout-important-border': '#ebcb8b',
    '--callout-warning-bg': '#3d342e',
    '--callout-warning-border': '#d08770',
    '--callout-caution-bg': '#3d2e30',
    '--callout-caution-border': '#bf616a',
  },
  'solarized-light': {
    '--bg-primary': '#fdf6e3',
    '--bg-secondary': '#eee8d5',
    '--bg-toolbar': '#fdf6e3',
    '--text-primary': '#073642',
    '--text-secondary': '#586e75',
    '--text-muted': '#93a1a1',
    '--border': '#d3cbb7',
    '--accent': '#268bd2',
    '--accent-hover': '#2aa198',
    '--accent-bg': '#eee8d5',
    '--code-bg': '#002b36',
    '--scrollbar-track': '#eee8d5',
    '--scrollbar-thumb': '#b0a892',
    '--callout-note-bg': '#e4dfc8',
    '--callout-note-border': '#268bd2',
    '--callout-tip-bg': '#dce8c8',
    '--callout-tip-border': '#859900',
    '--callout-important-bg': '#f0e8c8',
    '--callout-important-border': '#b58900',
    '--callout-warning-bg': '#f0dcc8',
    '--callout-warning-border': '#cb4b16',
    '--callout-caution-bg': '#f0d0c8',
    '--callout-caution-border': '#dc322f',
  },
  'solarized-dark': {
    '--bg-primary': '#002b36',
    '--bg-secondary': '#073642',
    '--bg-toolbar': '#002b36',
    '--text-primary': '#fdf6e3',
    '--text-secondary': '#93a1a1',
    '--text-muted': '#586e75',
    '--border': '#094959',
    '--accent': '#268bd2',
    '--accent-hover': '#2aa198',
    '--accent-bg': '#073642',
    '--code-bg': '#001f27',
    '--scrollbar-track': '#073642',
    '--scrollbar-thumb': '#586e75',
    '--callout-note-bg': '#063545',
    '--callout-note-border': '#268bd2',
    '--callout-tip-bg': '#063530',
    '--callout-tip-border': '#859900',
    '--callout-important-bg': '#06353f',
    '--callout-important-border': '#b58900',
    '--callout-warning-bg': '#063535',
    '--callout-warning-border': '#cb4b16',
    '--callout-caution-bg': '#06302f',
    '--callout-caution-border': '#dc322f',
  },
};

export function getEffectiveTheme(theme: ThemeName): EffectiveTheme {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  switch (theme) {
    case 'system':
      return prefersDark ? 'dark' : 'light';
    case 'sepia':
      return 'sepia';
    case 'nord':
      return 'nord';
    case 'solarized':
      return prefersDark ? 'solarized-dark' : 'solarized-light';
  }
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

export const SAMPLE_MARKDOWN = `# Welcome to MD Editor

A beautiful Markdown editor and viewer — inspired by **ShowMeMyMD**.

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
