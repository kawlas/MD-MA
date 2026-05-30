import { forwardRef, useState, useCallback, useRef, useEffect, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { slugify, parseBlocks, replaceBlockContent, toggleTaskInBlock, type Block } from "@/types";
import type { ReactNode } from "react";

function getTextContent(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(getTextContent).join("");
  if (children && typeof children === "object" && "props" in children) {
    return getTextContent((children as { props: { children: ReactNode } }).props.children);
  }
  return "";
}

const calloutConfig: Record<string, { icon: string; label: string }> = {
  note: { icon: "ℹ️", label: "Note" },
  tip: { icon: "💡", label: "Tip" },
  important: { icon: "🔥", label: "Important" },
  warning: { icon: "⚠️", label: "Warning" },
  caution: { icon: "🚫", label: "Caution" },
};

function CodeBlock({ children, className }: { children: ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    navigator.clipboard.writeText(getTextContent(children)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }, [children]);

  return (
    <div className="code-block-wrapper" style={{ position: "relative" }}>
      <button className="code-copy-btn" onClick={handleCopy} type="button">
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className={className}>{children}</pre>
    </div>
  );
}

function headingComponent(Tag: string) {
  return ({ children, ...props }: any) => {
    const text = getTextContent(children);
    const id = slugify(text);
    return <Tag id={id} {...props}>{children}</Tag>;
  };
}

function remarkCallouts() {
  return (tree: any) => {
    function walk(node: any) {
      if (node.children) {
        for (const child of node.children) {
          walk(child);
        }
      }
      if (node.type === "blockquote" && node.children?.length > 0) {
        const firstPara = node.children[0];
        if (firstPara?.type === "paragraph" && firstPara.children?.length > 0) {
          const firstText = firstPara.children[0];
          if (firstText?.type === "text") {
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

const mdComponents: Record<string, any> = {
  h1: headingComponent("h1"),
  h2: headingComponent("h2"),
  h3: headingComponent("h3"),
  h4: headingComponent("h4"),
  h5: headingComponent("h5"),
  h6: headingComponent("h6"),
  pre: ({ children, className }: any) => <CodeBlock className={className}>{children}</CodeBlock>,
  blockquote: ({ children, className, ...props }: any) => {
    if (typeof className === "string" && className.includes("callout")) {
      const typeMatch = className.match(/callout-(note|tip|important|warning|caution)/);
      const type = typeMatch?.[1] || "note";
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

interface EditablePreviewProps {
  markdown: string;
  onChange: (markdown: string) => void;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

const EditablePreview = memo(forwardRef<HTMLDivElement, EditablePreviewProps>(({ markdown, onChange, onScroll }, ref) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const blocks = parseBlocks(markdown);

  useEffect(() => {
    if (editingId && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
    }
  }, [editingId]);

  const handleBlockClick = useCallback((block: Block) => {
    setEditingId(block.id);
    setEditValue(block.content);
  }, []);

  const handleBlockMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, block: Block) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") return;
    e.preventDefault();
    e.stopPropagation();

    const blockEl = e.currentTarget;
    const taskIndex = Array.from(blockEl.querySelectorAll('input[type="checkbox"]')).indexOf(target);
    onChange(toggleTaskInBlock(markdown, block.id, taskIndex));
  }, [markdown, onChange]);

  const handleSave = useCallback(() => {
    if (editingId === null) return;
    onChange(replaceBlockContent(markdown, editingId, editValue));
    setEditingId(null);
    setEditValue("");
  }, [editingId, editValue, markdown, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, block: Block) => {
      if (e.key === "Escape") {
        setEditingId(null);
        setEditValue("");
        return;
      }
      if (e.key === "Enter" && !e.shiftKey && block.type === "paragraph") {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave],
  );

  return (
    <div
      ref={ref}
      className="md-preview custom-scrollbar"
      style={{
        padding: "24px 32px",
        overflowY: "auto",
        height: "100%",
        position: "relative",
        background: "var(--bg-preview, var(--bg-primary))",
      }}
      onScroll={onScroll}
    >
      {blocks.length === 0 && (
        <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: 40, fontSize: 15 }}>
          Start writing or drop a .md file to begin...
        </p>
      )}
      {blocks.map((block) => {
        const isEditing = editingId === block.id;

        if (isEditing) {
          return (
            <div
              className="editable-block-editor"
              key={block.id}
              data-block-id={block.id}
              data-source-start-line={block.startLine}
              data-source-end-line={block.endLine}
              style={{ margin: "0.5em 0" }}
            >
              <textarea
                ref={textareaRef}
                className="editor-textarea"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => handleKeyDown(e, block)}
                style={{
                  minHeight: block.type === "code" ? 120 : 40,
                  borderRadius: 8,
                  border: "2px solid var(--accent)",
                  padding: 12,
                  fontSize: 14,
                  lineHeight: 1.6,
                  fontFamily: "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace",
                  width: "100%",
                  resize: "vertical",
                  outline: "none",
                }}
                autoComplete="off"
                autoCorrect="off"
              />
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                <kbd>Esc</kbd> cancel · <kbd>Enter</kbd> save{block.type === "code" ? " · " : ""}
                {block.type === "code" ? <kbd>Shift+Enter</kbd> + " newline" : ""}
              </div>
            </div>
          );
        }

        return (
          <div
            key={block.id}
            data-block-id={block.id}
            data-source-start-line={block.startLine}
            data-source-end-line={block.endLine}
            onMouseDown={(e) => handleBlockMouseDown(e, block)}
            onClick={(e) => {
              const target = e.target;
              if (target instanceof HTMLInputElement && target.type === "checkbox") return;
              if (target instanceof HTMLElement && target.closest("a, button")) return;
              handleBlockClick(block);
            }}
            className="editable-block"
            style={{
              cursor: "pointer",
              borderRadius: 4,
              transition: "background 0.15s",
              position: "relative",
            }}
            title="Click to edit"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkCallouts]}
              rehypePlugins={[rehypeHighlight]}
              components={mdComponents}
            >
              {block.content}
            </ReactMarkdown>
          </div>
        );
      })}
    </div>
  );
}));

EditablePreview.displayName = "EditablePreview";
export default EditablePreview;
