/*
 * Paragraph Numbers – Obsidian plugin
 *
 * Replaces line numbers with paragraph numbers in the editor gutter.
 * A "paragraph" is a contiguous block of non-blank content lines,
 * excluding YAML frontmatter, headings, code fences, and horizontal rules.
 */

const { Plugin } = require("obsidian");

// ── CodeMirror 6 imports (Obsidian re-exports them) ──────────────
const { StateField, StateEffect, RangeSet } = require("@codemirror/state");
const { gutter, GutterMarker } = require("@codemirror/view");

// ── GutterMarker that renders a paragraph number ─────────────────
class ParagraphNumberMarker extends GutterMarker {
  constructor(num) {
    super();
    this.num = num;
  }
  toDOM() {
    const span = document.createTextNode(String(this.num));
    return span;
  }
  eq(other) {
    return this.num === other.num;
  }
}

// ── Classify a line ──────────────────────────────────────────────
// Returns: "blank" | "frontmatter" | "heading" | "codefence" | "hr" | "content"
function classifyLine(text, inFrontmatter, inCodeFence) {
  const trimmed = text.trim();

  if (inCodeFence) {
    // Only a closing fence ends the code block
    if (/^(`{3,}|~{3,})/.test(trimmed)) return "codefence";
    return "codefence-inner";
  }

  if (inFrontmatter) {
    if (trimmed === "---") return "frontmatter-end";
    return "frontmatter";
  }

  if (trimmed === "") return "blank";
  if (/^(`{3,}|~{3,})/.test(trimmed)) return "codefence";
  if (/^#{1,6}\s/.test(trimmed)) return "heading";
  if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) return "hr";

  return "content";
}

// ── Build paragraph map from document ────────────────────────────
// Returns Map<lineIndex, paragraphNumber> where lineIndex is 0-based
// Only the FIRST content line of each paragraph gets a number.
function buildParagraphMap(doc) {
  const map = new Map();
  let paraNum = 0;
  let inFrontmatter = false;
  let inCodeFence = false;
  let inParagraph = false;

  for (let i = 0; i < doc.lines; i++) {
    const lineObj = doc.line(i + 1); // CM lines are 1-based
    const text = lineObj.text;
    const kind = classifyLine(text, inFrontmatter, inCodeFence);

    // Track state transitions
    if (i === 0 && text.trim() === "---") {
      inFrontmatter = true;
      continue;
    }
    if (kind === "frontmatter-end") {
      inFrontmatter = false;
      continue;
    }
    if (kind === "frontmatter") continue;

    if (kind === "codefence") {
      inCodeFence = !inCodeFence;
      inParagraph = false;
      continue;
    }
    if (kind === "codefence-inner") {
      inParagraph = false;
      continue;
    }

    if (kind === "blank" || kind === "heading" || kind === "hr") {
      inParagraph = false;
      continue;
    }

    // kind === "content"
    if (!inParagraph) {
      paraNum++;
      map.set(i, paraNum);
      inParagraph = true;
    }
    // Continuation lines within the same paragraph get no number
  }

  return map;
}

// ── StateField: recompute paragraph map on doc changes ───────────
const paragraphMapField = StateField.define({
  create(state) {
    return buildParagraphMap(state.doc);
  },
  update(value, tr) {
    if (tr.docChanged) {
      return buildParagraphMap(tr.state.doc);
    }
    return value;
  },
});

// ── Gutter extension ─────────────────────────────────────────────
const paragraphGutter = gutter({
  class: "cm-paragraph-number",
  lineMarker(view, line) {
    const map = view.state.field(paragraphMapField);
    const lineIndex = view.state.doc.lineAt(line.from).number - 1; // 0-based
    const num = map.get(lineIndex);
    if (num !== undefined) {
      return new ParagraphNumberMarker(num);
    }
    return null;
  },
});

// ── Plugin class ─────────────────────────────────────────────────
const DEFAULT_SETTINGS = { enabled: true };

class ParagraphNumbersPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.registerEditorExtension([paragraphMapField, paragraphGutter]);
    this.applyEnabledClass();

    this.addCommand({
      id: "toggle-paragraph-numbers",
      name: "Toggle paragraph numbers",
      callback: async () => {
        this.settings.enabled = !this.settings.enabled;
        await this.saveSettings();
        this.applyEnabledClass();
      },
    });
  }

  onunload() {
    document.body.classList.remove("paragraph-numbers-hidden");
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  applyEnabledClass() {
    document.body.classList.toggle(
      "paragraph-numbers-hidden",
      !this.settings.enabled,
    );
  }
}

module.exports = ParagraphNumbersPlugin;
