import { describe, it, expect } from "vitest";
import { slugify, extractToc, getStats } from "./types";

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
