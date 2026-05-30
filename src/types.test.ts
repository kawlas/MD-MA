import { describe, it, expect } from "vitest";
import { slugify, extractToc, getStats, parseBlocks, serializeBlocks } from "./types";

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
    expect(toc[0]).toEqual({ id: "title", level: 1, text: "Title" });
  });

  it("skips headings inside code blocks", () => {
    const md = "# Real Title\n\n```\n# Not a heading\n```\n\n## Real Section";
    const toc = extractToc(md);
    expect(toc).toHaveLength(2);
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
});

describe("serializeBlocks", () => {
  it("joins blocks back into markdown", () => {
    const blocks = [
      { id: "1", type: "heading1" as const, content: "# Title" },
      { id: "2", type: "paragraph" as const, content: "Body text." },
    ];
    expect(serializeBlocks(blocks)).toBe("# Title\n\nBody text.");
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
