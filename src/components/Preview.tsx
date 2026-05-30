import { forwardRef, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { mdComponents, remarkCallouts } from "./PreviewComponents";
import { useT } from "@/i18n";

interface PreviewProps {
  markdown: string;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

const Preview = memo(forwardRef<HTMLDivElement, PreviewProps>(({ markdown, onScroll }, ref) => {
  const _t = useT();

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
      {markdown.trim().length === 0 && (
        <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: 40, fontSize: 15 }}>
          {_t('preview.empty')}
        </p>
      )}
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkCallouts]}
        rehypePlugins={[rehypeHighlight]}
        components={mdComponents}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}));

Preview.displayName = "Preview";
export default Preview;