import { useState, useCallback } from "react";
import type { ReactNode } from "react";
import { slugify } from "@/types";
import { useT } from "@/i18n";

export function getTextContent(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(getTextContent).join("");
  if (children && typeof children === "object" && "props" in children) {
    return getTextContent((children as { props: { children: ReactNode } }).props.children);
  }
  return "";
}

export const calloutConfig: Record<string, { icon: string; label: string }> = {
  note: { icon: "ℹ️", label: "Note" },
  tip: { icon: "💡", label: "Tip" },
  important: { icon: "🔥", label: "Important" },
  warning: { icon: "⚠️", label: "Warning" },
  caution: { icon: "🚫", label: "Caution" },
};

export function CodeBlock({ children, className }: { children: ReactNode; className?: string }) {
  const _t = useT();
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      navigator.clipboard.writeText(getTextContent(children)).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      });
    },
    [children],
  );

  return (
    <div className="code-block-wrapper" style={{ position: "relative" }}>
      <button className="code-copy-btn" onClick={handleCopy} type="button">
        {copied ? _t("code.copied") : _t("code.copy")}
      </button>
      <pre className={className}>{children}</pre>
    </div>
  );
}

export function headingComponent(Tag: string) {
  return ({ children, ...props }: any) => {
    const text = getTextContent(children);
    const id = slugify(text);
    return (
      <Tag id={id} {...props}>
        {children}
      </Tag>
    );
  };
}

export function PreviewImage({ src, alt }: { src?: string; alt?: string }) {
  const [zoomed, setZoomed] = useState(false);
  const toggleZoom = useCallback(() => {
    if (!src) return;
    setZoomed((p) => !p);
  }, [src]);
  return (
    <>
      <img
        src={src}
        alt={alt || ""}
        loading="lazy"
        onClick={toggleZoom}
        style={{
          maxWidth: "100%",
          cursor: src ? "zoom-in" : "default",
          borderRadius: 8,
          transition: "transform 0.2s",
        }}
      />
      {zoomed && src && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.8)", cursor: "zoom-out" }}
          onClick={toggleZoom}
        >
          <img
            src={src}
            alt={alt || ""}
            style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8, boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}
          />
        </div>
      )}
    </>
  );
}

export function remarkCallouts() {
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

export const mdComponents: Record<string, any> = {
  h1: headingComponent("h1"),
  h2: headingComponent("h2"),
  h3: headingComponent("h3"),
  h4: headingComponent("h4"),
  h5: headingComponent("h5"),
  h6: headingComponent("h6"),
  pre: ({ children, className }: any) => <CodeBlock className={className}>{children}</CodeBlock>,
  img: PreviewImage,
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
    return (
      <blockquote className={className} {...props}>
        {children}
      </blockquote>
    );
  },
};
