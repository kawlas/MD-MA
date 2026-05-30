import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import EditablePreview from "./EditablePreview";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function renderPreview(markdown: string, onChange: (markdown: string) => void) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  let root: Root;
  act(() => {
    root = createRoot(container);
    root.render(<EditablePreview markdown={markdown} onChange={onChange} />);
  });

  return {
    container,
    clickText(text: string) {
      const el = Array.from(container.querySelectorAll(".editable-block")).find((node) => node.textContent?.includes(text));
      if (!(el instanceof HTMLElement)) throw new Error(`Text not found: ${text}`);
      act(() => {
        el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
    },
    textarea(value: string) {
      const el = Array.from(container.querySelectorAll("textarea")).find((node) => node.value === value);
      if (!(el instanceof HTMLTextAreaElement)) throw new Error(`Textarea not found: ${value}`);
      return el;
    },
    change(el: HTMLTextAreaElement, value: string) {
      act(() => {
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
        setter?.call(el, value);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });
    },
    blur(el: HTMLTextAreaElement) {
      act(() => {
        el.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
      });
    },
    keyDown(el: HTMLTextAreaElement, key: string) {
      act(() => {
        el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
      });
    },
    cleanup() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe("EditablePreview", () => {
  it("saves only the edited block while preserving surrounding whitespace", () => {
    const onChange = vi.fn();
    const markdown = "# Title\n\n\nParagraph\nline two\n\n- item\n";

    const view = renderPreview(markdown, onChange);

    view.clickText("Paragraph");
    const editor = view.textarea("Paragraph\nline two");
    view.change(editor, "Changed");
    view.blur(editor);

    expect(onChange).toHaveBeenCalledWith("# Title\n\n\nChanged\n\n- item\n");
    view.cleanup();
  });

  it("cancels editing with Escape without saving on blur", () => {
    const onChange = vi.fn();
    const markdown = "# Title\n\nParagraph\n\nAfter";

    const view = renderPreview(markdown, onChange);

    view.clickText("Paragraph");
    const editor = view.textarea("Paragraph");
    view.change(editor, "Changed");
    view.keyDown(editor, "Escape");
    view.blur(editor);

    expect(onChange).not.toHaveBeenCalled();
    view.cleanup();
  });
});
