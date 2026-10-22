import { forwardRef, useCallback, useRef, useEffect, useState } from 'react';
import { autoCloseBracket, getListContinuation } from '@/types';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onScroll?: (e: React.UIEvent<HTMLTextAreaElement>) => void;
  onImagePaste?: (dataUrl: string) => void;
}

const CodeEditor = forwardRef<HTMLTextAreaElement, CodeEditorProps>(({ value, onChange, onScroll, onImagePaste }, ref) => {
  const [lineCount, setLineCount] = useState(1);
  const gutterRef = useRef<HTMLDivElement>(null);
  const syncScrollRef = useRef(false);

  useEffect(() => {
    const count = value.split('\n').length;
    setLineCount(count);
  }, [value]);

  const handleGutterScroll = useCallback(() => {
    if (syncScrollRef.current || !ref || !('current' in ref) || !ref.current || !gutterRef.current) return;
    syncScrollRef.current = true;
    gutterRef.current.scrollTop = ref.current.scrollTop;
    syncScrollRef.current = false;
  }, [ref]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;

    // Auto-close brackets
    if (autoCloseBracket(value, start, end, e.key)) {
      e.preventDefault();
      const result = autoCloseBracket(value, start, end, e.key)!;
      onChange(result.newValue);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = result.cursor;
      });
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        let newVal = value;
        let offset = 0;
        const selStartLine = value.substring(0, start).split('\n').length - 1;
        const selEndLine = value.substring(0, end).split('\n').length - 1;
        for (let lineNum = selStartLine; lineNum <= selEndLine; lineNum++) {
          const lineIdx = value.split('\n').slice(0, lineNum).join('\n').length + (lineNum > 0 ? 1 : 0);
          if (value[lineIdx] === ' ') {
            newVal = newVal.substring(0, lineIdx) + newVal.substring(lineIdx + 1);
            if (lineNum === selStartLine && start > lineIdx) offset = -1;
          }
          if (value[lineIdx] === ' ') {
            newVal = newVal.substring(0, lineIdx) + newVal.substring(lineIdx + 1);
            if (lineNum === selStartLine && start > lineIdx) offset = -1;
          }
        }
        onChange(newVal);
        requestAnimationFrame(() => {
          ta.selectionStart = start + offset;
          ta.selectionEnd = Math.max(start + offset, end + offset);
        });
      } else {
        const newValue = value.substring(0, start) + '  ' + value.substring(end);
        onChange(newValue);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 2;
        });
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const line = value.slice(lineStart, start);
      const indent = line.match(/^(\s*)/)?.[1] || '';

      // Try list continuation
      const listCont = getListContinuation(line);
      if (listCont) {
        if (listCont.prefix === '\n') {
          // Remove empty list item
          const lineStartPos = value.lastIndexOf('\n', start - 1) + 1;
          const lineEndPos = value.indexOf('\n', start);
          const replacement = lineEndPos >= 0 ? '\n' : '';
          const newValue = value.slice(0, lineStartPos) + replacement + (lineEndPos >= 0 ? value.slice(lineEndPos + 1) : '');
          const cursorPos = lineStartPos + replacement.length;
          onChange(newValue);
          requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = cursorPos;
          });
        } else {
          const insertion = '\n' + listCont.indent + listCont.prefix;
          const newValue = value.substring(0, start) + insertion + value.substring(end);
          const cursorPos = start + insertion.length;
          onChange(newValue);
          requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = cursorPos;
          });
        }
        return;
      }

      // Default auto-indent
      const newValue = value.substring(0, start) + '\n' + indent + value.substring(end);
      const cursorPos = start + 1 + indent.length;
      onChange(newValue);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = cursorPos;
      });
      return;
    }
  }, [value, onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          onImagePaste?.(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  }, [onImagePaste]);

  const handleTextareaScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
    onScroll?.(e);
  }, [onScroll]);

  const gutterWidth = Math.max(32, String(lineCount).length * 10 + 20);

  return (
    <div className="flex h-full" style={{ background: 'var(--bg-secondary)' }}>
      {/* Line number gutter */}
      <div
        ref={gutterRef}
        className="flex flex-col items-end flex-shrink-0 select-none overflow-hidden pt-[24px] pr-2 text-xs leading-[var(--line-height-code)]"
        style={{
          width: gutterWidth,
          color: 'var(--text-muted)',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
          fontFamily: 'var(--font-code)',
          fontSize: 'var(--font-size-code)',
          lineHeight: 'var(--line-height-code)',
          opacity: 0.5,
        }}
        onScroll={handleGutterScroll}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <span key={i} className="leading-[var(--line-height-code)] block px-1" style={{ lineHeight: 'var(--line-height-code)' }}>
            {i + 1}
          </span>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        ref={ref}
        className="editor-textarea custom-scrollbar flex-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onScroll={handleTextareaScroll}
        placeholder="Start writing Markdown here... or drag & drop a .md / .txt file"
        spellCheck={true}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
});

CodeEditor.displayName = 'CodeEditor';
export default CodeEditor;
