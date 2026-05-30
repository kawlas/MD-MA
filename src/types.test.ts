import { describe, it, expect } from "vitest";
import {
  slugify,
  extractToc,
  getStats,
  parseBlocks,
  serializeBlocks,
  replaceBlockContent,
  toggleTaskInBlock,
  getLineForPreviewRatio,
  getPreviewRatioForLine,
  autoCloseBracket,
  getListContinuation,
  formatInsertion,
  getFileFormat,
  stripMarkdown,
  debounce,
  getDropFileType,
  THEMES,
  FONT_SETS,
} from "./types";

describe("slugify", () => {
  it("converts text to URL-friendly slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
    expect(slugify("Hello   World")).toBe("hello-world");
    expect(slugify("Special $#@ chars!")).toBe("special-chars");
  });
});

describe("extractToc", () => {
  it("extracts headings from markdown", () => {
    const md = "# Title\n\n## Section 1\n\n### Subsection\n\n## Section 2";
    const toc = extractToc(md);
    expect(toc).toHaveLength(4);
    expect(toc[0]).toEqual({ id: "title", level: 1, text: "Title", line: 0 });
  });

  it("skips headings inside code blocks", () => {
    const md = "# Real Title\n\n```\n# Not a heading\n```\n\n## Real Section";
    const toc = extractToc(md);
    expect(toc).toHaveLength(2);
    expect(toc[1]).toMatchObject({ text: "Real Section", line: 6 });
  });

  it("deduplicates repeated heading ids in source order", () => {
    const md = "# Intro\n\n## Intro\n\n# Intro";
    const toc = extractToc(md);
    expect(toc.map((item) => item.id)).toEqual(["intro", "intro-2", "intro-3"]);
  });
});

describe("parseBlocks", () => {
  it("splits markdown into blocks by blank lines", () => {
    const md = "# Title\n\nParagraph here.\n\n## Section\n\nSome text.";
    const blocks = parseBlocks(md);
    expect(blocks).toHaveLength(4);
    expect(blocks[0].type).toBe("heading1");
    expect(blocks[1].type).toBe("paragraph");
    expect(blocks[2].type).toBe("heading2");
    expect(blocks[3].type).toBe("paragraph");
  });

  it("groups code fences into one block", () => {
    const md = "Text\n\n```\ncode line 1\ncode line 2\n```\n\nAfter";
    const blocks = parseBlocks(md);
    expect(blocks).toHaveLength(3);
    expect(blocks[1].type).toBe("code");
    expect(blocks[1].content).toContain("code line 1");
    expect(blocks[1].content).toContain("code line 2");
  });

  it("detects blockquote blocks", () => {
    const md = "> Note\n> More note\n\nNormal";
    const blocks = parseBlocks(md);
    expect(blocks[0].type).toBe("blockquote");
    expect(blocks).toHaveLength(2);
  });

  it("detects list blocks", () => {
    const md = "- item 1\n- item 2\n- item 3\n\nAfter";
    const blocks = parseBlocks(md);
    expect(blocks[0].type).toBe("list");
  });

  it("detects table blocks", () => {
    const md = "| a | b |\n|---|---|\n| 1 | 2 |\n\nAfter";
    const blocks = parseBlocks(md);
    expect(blocks[0].type).toBe("table");
  });

  it("assigns unique ids to each block", () => {
    const blocks = parseBlocks("# A\n\n# A");
    expect(blocks[0].id).toBeTruthy();
    expect(blocks[1].id).toBeTruthy();
    expect(blocks[0].id).not.toBe(blocks[1].id);
  });

  it("assigns stable ids for the same markdown across parses", () => {
    const first = parseBlocks("# A\n\nParagraph\n\n- item");
    const second = parseBlocks("# A\n\nParagraph\n\n- item");
    expect(second.map((block) => block.id)).toEqual(first.map((block) => block.id));
  });

  it("tracks source ranges for each block", () => {
    const md = "# A\n\nParagraph\nline two\n\n```ts\nconst x = 1;\n```\n";
    const blocks = parseBlocks(md);
    expect(blocks[0]).toMatchObject({ startLine: 0, endLine: 0, startOffset: 0, endOffset: 3 });
    expect(blocks[1]).toMatchObject({ startLine: 2, endLine: 3, startOffset: 5, endOffset: 23 });
    expect(blocks[2]).toMatchObject({ startLine: 5, endLine: 7, startOffset: 25, endOffset: 47 });
  });
});

describe("serializeBlocks", () => {
  it("joins blocks back into markdown", () => {
    const blocks = parseBlocks("# Title\n\nBody text.");
    expect(serializeBlocks(blocks)).toBe("# Title\n\nBody text.");
  });

  it("preserves original markdown when source ranges are available", () => {
    const md = "# Title\n\n\nParagraph\n\n";
    expect(serializeBlocks(parseBlocks(md), md)).toBe(md);
  });
});

describe("replaceBlockContent", () => {
  it("replaces only the selected source block and preserves surrounding whitespace", () => {
    const md = "# Title\n\n\nParagraph\nline two\n\n- item\n";
    const paragraph = parseBlocks(md)[1];
    expect(replaceBlockContent(md, paragraph.id, "Changed")).toBe("# Title\n\n\nChanged\n\n- item\n");
  });
});

describe("toggleTaskInBlock", () => {
  it("toggles a task item inside one markdown block", () => {
    const md = "- [ ] first\n- [x] second\n\nParagraph";
    const list = parseBlocks(md)[0];
    expect(toggleTaskInBlock(md, list.id, 0)).toBe("- [x] first\n- [x] second\n\nParagraph");
    expect(toggleTaskInBlock(md, list.id, 1)).toBe("- [ ] first\n- [ ] second\n\nParagraph");
  });

  it("leaves markdown unchanged when the task index does not exist", () => {
    const md = "- [ ] first\n\nParagraph";
    const list = parseBlocks(md)[0];
    expect(toggleTaskInBlock(md, list.id, 2)).toBe(md);
  });
});

describe("scroll mapping", () => {
  const md = "# Title\n\nParagraph\nline two\n\n```ts\nconst x = 1;\nconst y = 2;\n```\n\nLast";

  it("maps editor lines to preview block ratios", () => {
    const blocks = parseBlocks(md);
    expect(getPreviewRatioForLine(blocks, 0)).toBe(0);
    expect(getPreviewRatioForLine(blocks, 3)).toBeCloseTo(1 / 3);
    expect(getPreviewRatioForLine(blocks, 7)).toBeCloseTo(2 / 3);
  });

  it("maps preview ratios back to source lines", () => {
    const blocks = parseBlocks(md);
    expect(getLineForPreviewRatio(blocks, 0)).toBe(0);
    expect(getLineForPreviewRatio(blocks, 0.4)).toBe(2);
    expect(getLineForPreviewRatio(blocks, 0.9)).toBe(10);
  });
});

describe("getStats", () => {
  it("returns stats for non-empty text", () => {
    const stats = getStats("hello world");
    expect(stats.words).toBe(2);
    expect(stats.lines).toBe(1);
    expect(stats.characters).toBe(11);
  });

  it("returns zero stats for empty text", () => {
    const stats = getStats("");
    expect(stats.words).toBe(0);
    expect(stats.lines).toBe(0);
    expect(stats.characters).toBe(0);
  });
});

describe("autoCloseBracket", () => {
  it("inserts closing bracket after opening", () => {
    const result = autoCloseBracket("hello ", 6, 6, "(");
    expect(result).toEqual({ newValue: "hello ()", cursor: 7 });
  });

  it("wraps selected text in brackets", () => {
    const result = autoCloseBracket("hello world", 6, 11, "(");
    expect(result?.newValue).toBe("hello (world)");
    expect(result?.cursor).toBe(13);
  });

  it("returns null for closing bracket key", () => {
    const result = autoCloseBracket("hello ()", 7, 7, ")");
    expect(result).toBeNull();
  });

  it("returns null for non-opening bracket keys", () => {
    expect(autoCloseBracket("a", 1, 1, "b")).toBeNull();
    expect(autoCloseBracket("a", 1, 1, '"')).toBeNull();
    expect(autoCloseBracket("a", 1, 1, ")")).toBeNull();
    expect(autoCloseBracket("a", 1, 1, "]")).toBeNull();
    expect(autoCloseBracket("a", 1, 1, "}")).toBeNull();
  });

  it("handles curly braces", () => {
    const result = autoCloseBracket("a", 1, 1, "{");
    expect(result?.newValue).toBe("a{}");
    expect(result?.cursor).toBe(2);
  });

  it("handles square brackets", () => {
    const result = autoCloseBracket("a", 1, 1, "[");
    expect(result?.newValue).toBe("a[]");
    expect(result?.cursor).toBe(2);
  });
});

describe("getListContinuation", () => {
  it("continues bullet list", () => {
    const result = getListContinuation("- item");
    expect(result?.prefix).toBe("- ");
  });

  it("continues task list", () => {
    const result = getListContinuation("- [ ] task");
    expect(result?.prefix).toBe("- [ ] ");
  });

  it("continues checked task list", () => {
    const result = getListContinuation("- [x] done");
    expect(result?.prefix).toBe("- [ ] ");
  });

  it("continues nested bullet list with proper indent", () => {
    const result = getListContinuation("  - item");
    expect(result?.indent).toBe("  ");
    expect(result?.prefix).toBe("- ");
  });

  it("continues ordered list with incremented number", () => {
    const result = getListContinuation("1. item");
    expect(result?.prefix).toBe("2. ");
  });

  it("removes empty bullet item on second Enter", () => {
    const result = getListContinuation("- ");
    expect(result?.prefix).toBe("\n");
  });

  it("removes empty ordered item on second Enter", () => {
    const result = getListContinuation("1. ");
    expect(result?.prefix).toBe("\n");
  });

  it("returns null for non-list lines", () => {
    expect(getListContinuation("normal text")).toBeNull();
    expect(getListContinuation("")).toBeNull();
  });
});

describe("formatInsertion", () => {
  const txt = "hello world";

  it("wraps selected text with bold markers", () => {
    const r = formatInsertion("bold", txt, 0, 5);
    expect(r.newValue).toBe("**hello** world");
    expect(r.cursorStart).toBe(9);
    expect(r.cursorEnd).toBe(9);
  });

  it("inserts empty bold markers with cursor between when no selection", () => {
    const r = formatInsertion("bold", txt, 5, 5);
    expect(r.newValue).toBe("hello**** world");
    expect(r.cursorStart).toBe(7);
    expect(r.cursorEnd).toBe(7);
  });

  it("wraps selected text with italic markers", () => {
    const r = formatInsertion("italic", txt, 6, 11);
    expect(r.newValue).toBe("hello *world*");
    expect(r.cursorStart).toBe(13);
    expect(r.cursorEnd).toBe(13);
  });

  it("inserts empty italic markers with cursor between when no selection", () => {
    const r = formatInsertion("italic", txt, 3, 3);
    expect(r.newValue).toBe("hel**lo world");
    expect(r.cursorStart).toBe(4);
    expect(r.cursorEnd).toBe(4);
  });

  it("inserts # at cursor position for heading", () => {
    const r = formatInsertion("heading", txt, 0, 0);
    expect(r.newValue).toBe("# hello world");
    expect(r.cursorStart).toBe(2);
    expect(r.cursorEnd).toBe(2);
  });

  it("wraps selected text with link syntax", () => {
    const r = formatInsertion("link", txt, 6, 11);
    expect(r.newValue).toBe("hello [world](url)");
    expect(r.cursorStart).toBe(18);
    expect(r.cursorEnd).toBe(18);
  });

  it("inserts link template with link text selected when no selection", () => {
    const r = formatInsertion("link", txt, 5, 5);
    expect(r.newValue).toBe("hello[link text](url) world");
    expect(r.cursorStart).toBe(6);
    expect(r.cursorEnd).toBe(15);
  });

  it("returns original value for unknown syntax", () => {
    const r = formatInsertion("unknown", txt, 0, 5);
    expect(r.newValue).toBe(txt);
  });
});

describe("getFileFormat", () => {
  it("detects MD format", () => {
    expect(getFileFormat("readme.md")).toBe("MD");
  });

  it("detects TXT format", () => {
    expect(getFileFormat("notes.txt")).toBe("TXT");
  });

  it("handles uppercase extensions", () => {
    expect(getFileFormat("README.TXT")).toBe("TXT");
  });

  it("returns null for null fileName", () => {
    expect(getFileFormat(null)).toBeNull();
  });
});

describe("stripMarkdown", () => {
  it("removes heading markers", () => {
    expect(stripMarkdown("# Heading 1\n## Heading 2")).toBe("Heading 1\nHeading 2");
  });

  it("removes bold and italic markers", () => {
    expect(stripMarkdown("**bold** and *italic*")).toBe("bold and italic");
  });

  it("converts links to plain text", () => {
    expect(stripMarkdown("click [here](https://example.com)")).toBe("click here");
  });

  it("converts images to alt text", () => {
    expect(stripMarkdown("![alt](img.png)")).toBe("alt");
  });

  it("removes code fences", () => {
    expect(stripMarkdown("text\n```\ncode\n```\nend")).toBe("text\nend");
  });

  it("removes inline code", () => {
    expect(stripMarkdown("use `code` here")).toBe("use code here");
  });

  it("removes blockquote markers", () => {
    expect(stripMarkdown("> quote\n> line 2")).toBe("quote\nline 2");
  });

  it("removes list markers", () => {
    expect(stripMarkdown("- item 1\n- item 2\n1. numbered")).toBe("item 1\nitem 2\nnumbered");
  });

  it("removes horizontal rules", () => {
    expect(stripMarkdown("a\n\n---\n\nb")).toBe("a\n\nb");
  });

  it("removes task markers", () => {
    expect(stripMarkdown("- [ ] todo\n- [x] done")).toBe("todo\ndone");
  });

  it("preserves plain text", () => {
    expect(stripMarkdown("Hello world")).toBe("Hello world");
  });

  it("handles empty string", () => {
    expect(stripMarkdown("")).toBe("");
  });
});

describe("visual presets", () => {
  it("includes practical developer and reader font presets", () => {
    expect(FONT_SETS.map((font) => font.label)).toEqual([
      "System",
      "Inter + JetBrains",
      "New York",
      "SF Rounded",
      "Helvetica Neue",
      "Mono",
      "Atkinson",
      "IBM Plex",
    ]);
  });

  it("includes modern universal theme presets", () => {
    expect(Object.keys(THEMES)).toEqual(expect.arrayContaining([
      "githubDark",
      "nord",
      "tokyoNight",
      "solarizedLight",
      "solarizedDark",
    ]));
  });
});

describe("debounce", () => {
  it("delays execution by the given ms", async () => {
    let count = 0;
    const fn = debounce(() => { count++; }, 50);
    fn();
    expect(count).toBe(0);
    await new Promise(r => setTimeout(r, 60));
    expect(count).toBe(1);
  });

  it("cancels pending execution on cancel()", async () => {
    let count = 0;
    const fn = debounce(() => { count++; }, 50);
    fn();
    fn.cancel();
    await new Promise(r => setTimeout(r, 60));
    expect(count).toBe(0);
  });

  it("resets timer on each call (only last fires)", async () => {
    let count = 0;
    const fn = debounce(() => { count++; }, 50);
    fn();
    await new Promise(r => setTimeout(r, 30));
    fn();
    await new Promise(r => setTimeout(r, 30));
    fn();
    await new Promise(r => setTimeout(r, 60));
    expect(count).toBe(1);
  });
});

describe("getDropFileType", () => {
  it("returns 'image' for image files by extension", () => {
    expect(getDropFileType("photo.png", "image/png")).toBe("image");
    expect(getDropFileType("photo.jpg", "image/jpeg")).toBe("image");
    expect(getDropFileType("photo.svg", "image/svg+xml")).toBe("image");
  });

  it("returns 'image' for image files by MIME type", () => {
    expect(getDropFileType("unknown.bin", "image/webp")).toBe("image");
  });

  it("returns 'text' for .md files", () => {
    expect(getDropFileType("readme.md", "text/markdown")).toBe("text");
  });

  it("returns 'text' for .txt files", () => {
    expect(getDropFileType("notes.txt", "text/plain")).toBe("text");
  });

  it("returns 'text' for .html files", () => {
    expect(getDropFileType("page.html", "text/html")).toBe("text");
  });

  it("returns 'text' for .json files", () => {
    expect(getDropFileType("data.json", "application/json")).toBe("text");
  });

  it("returns 'text' for .csv files", () => {
    expect(getDropFileType("data.csv", "text/csv")).toBe("text");
  });

  it("returns 'text' for .yml and .xml files", () => {
    expect(getDropFileType("config.yml", "text/yaml")).toBe("text");
    expect(getDropFileType("config.xml", "application/xml")).toBe("text");
  });

  it("returns null for unsupported files", () => {
    expect(getDropFileType("archive.zip", "application/zip")).toBeNull();
    expect(getDropFileType("doc.pdf", "application/pdf")).toBeNull();
  });
});
