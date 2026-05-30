import { forwardRef, useCallback } from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onScroll?: (e: React.UIEvent<HTMLTextAreaElement>) => void;
}

const CodeEditor = forwardRef<HTMLTextAreaElement, CodeEditorProps>(({ value, onChange, onScroll }, ref) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }
  }, [value, onChange]);

  return (
    <textarea
      ref={ref}
      className="editor-textarea custom-scrollbar"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onScroll={onScroll}
      placeholder="Start writing Markdown here... or drag & drop a .md / .txt file"
      spellCheck={false}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
    />
  );
});

CodeEditor.displayName = 'CodeEditor';
export default CodeEditor;
