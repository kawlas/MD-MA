import { forwardRef, useState, useCallback, useRef, useEffect, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { parseBlocks, replaceBlockContent, toggleTaskInBlock, type Block } from "@/types";
import { mdComponents, remarkCallouts } from "./PreviewComponents";
import { useT } from "@/i18n";

interface EditablePreviewProps {
  markdown: string;
  onChange: (markdown: string) => void;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

const EditablePreview = memo(forwardRef<HTMLDivElement, EditablePreviewProps>(({ markdown, onChange, onScroll }, ref) => {
  const _t = useT();
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
        padding: "24px 24px",
        overflowY: "auto",
        height: "100%",
        position: "relative",
        background: "var(--bg-preview, var(--bg-primary))",
      }}
      onScroll={onScroll}
    >
      {blocks.length === 0 && (
        <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: 40, fontSize: 15 }}>
          {_t('preview.empty')}
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
                <kbd>Esc</kbd> {_t('preview.edit_hint_cancel')} · <kbd>Enter</kbd> {_t('preview.edit_hint_save')}{block.type === "code" ? " · " : ""}
                {block.type === "code" ? <><kbd>Shift+Enter</kbd> {_t('preview.edit_hint_newline')}</> : ""}
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
            title={_t('preview.click_to_edit')}
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