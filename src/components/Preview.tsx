import { forwardRef, ReactNode, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { slugify } from '@/types';

function remarkCallouts() {
  return (tree: any) => {
    function walk(node: any) {
      if (node.children) {
        for (const child of node.children) {
          walk(child);
        }
      }

      if (node.type === 'blockquote' && node.children?.length > 0) {
        const firstPara = node.children[0];
        if (firstPara?.type === 'paragraph' && firstPara.children?.length > 0) {
          const firstText = firstPara.children[0];
          if (firstText?.type === 'text') {
            const match = firstText.value.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i);
            if (match) {
              node.data = node.data || {};
              node.data.hProperties = node.data.hProperties || {};
              node.data.hProperties.className = `callout callout-${match[1].toLowerCase()}`;

              firstText.value = firstText.value.slice(match[0].length);

              if (!firstText.value.trim() && firstPara.children.length === 1) {
                node.children.shift();
              }
            }
          }
        }
      }
    }
    walk(tree);
  };
}

function getTextContent(children: ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(getTextContent).join('');
  if (children && typeof children === 'object' && 'props' in children) {
    return getTextContent((children as { props: { children: ReactNode } }).props.children);
  }
  return '';
}

const calloutConfig: Record<string, { icon: string; label: string }> = {
  note: { icon: 'ℹ️', label: 'Note' },
  tip: { icon: '💡', label: 'Tip' },
  important: { icon: '🔥', label: 'Important' },
  warning: { icon: '⚠️', label: 'Warning' },
  caution: { icon: '🚫', label: 'Caution' },
};

function headingComponent(Tag: string) {
  return ({ children, ...props }: any) => {
    const text = getTextContent(children);
    const id = slugify(text);
    return <Tag id={id} {...props}>{children}</Tag>;
  };
}

function CodeBlock({ children, className }: { children: ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    const text = getTextContent(children);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }, [children]);
  return (
    <div className="code-block-wrapper" style={{ position: 'relative' }}>
      <button
        className="code-copy-btn"
        onClick={handleCopy}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 10,
          padding: '4px 10px',
          fontSize: 11,
          fontWeight: 500,
          borderRadius: 6,
          border: 'none',
          cursor: 'pointer',
          opacity: 0,
          transition: 'opacity 0.2s',
          background: 'rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.7)',
          fontFamily: '-apple-system, "SF Pro", sans-serif',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre className={className}>{children}</pre>
    </div>
  );
}

interface PreviewProps {
  markdown: string;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

const Preview = forwardRef<HTMLDivElement, PreviewProps>(({ markdown, onScroll }, ref) => {
  const components: Record<string, any> = {
    h1: headingComponent('h1'),
    h2: headingComponent('h2'),
    h3: headingComponent('h3'),
    h4: headingComponent('h4'),
    h5: headingComponent('h5'),
    h6: headingComponent('h6'),
    pre: ({ children }: any) => <CodeBlock>{children}</CodeBlock>,
    blockquote: ({ children, className, ...props }: any) => {
      if (typeof className === 'string' && className.includes('callout')) {
        const typeMatch = className.match(/callout-(note|tip|important|warning|caution)/);
        const type = typeMatch?.[1] || 'note';
        const config = calloutConfig[type] || calloutConfig.note;
        return (
          <div className={`callout callout-${type}`} data-callout={type}>
            <div className="callout-header">
              <span className="callout-icon">{config.icon}</span>
              <span>{config.label}</span>
            </div>
            <div className="callout-body">{children}</div>
          </div>
        );
      }
      return <blockquote className={className} {...props}>{children}</blockquote>;
    },
  };

  return (
    <div
      ref={ref}
      className="md-preview custom-scrollbar"
      style={{
        padding: '24px 32px',
        overflowY: 'auto',
        height: '100%',
        background: 'var(--bg-preview, var(--bg-primary))',
      }}
      onScroll={onScroll}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkCallouts]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
});

Preview.displayName = 'Preview';
export default Preview;
