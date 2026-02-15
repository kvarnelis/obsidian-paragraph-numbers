# Paragraph Numbers for Obsidian

Adds paragraph numbers to the editor gutter, replacing line numbers with something more useful for long-form prose writing.

## What it does

A **paragraph** is a contiguous block of non-blank content lines. The plugin numbers each paragraph sequentially in the gutter, skipping:

- YAML frontmatter
- Headings (`# ...`)
- Code fences (``` or ~~~)
- Horizontal rules (`---`, `***`, `___`)
- Blank lines

Only the first line of each paragraph shows a number. Continuation lines within the same paragraph are left blank.

## Installation

### With BRAT

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) if you haven't already
2. Open BRAT settings → **Add Beta Plugin**
3. Enter: `kvarnelis/obsidian-paragraph-numbers`

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/kvarnelis/obsidian-paragraph-numbers/releases/latest)
2. Create a folder: `.obsidian/plugins/paragraph-numbers/`
3. Place the three files inside it
4. Restart Obsidian and enable the plugin in Settings → Community Plugins

## Recommended settings

For the cleanest writing view, go to **Settings → Editor** and:

- Turn off **Line numbers** (the built-in line numbers are redundant with paragraph numbers)
- Set **Properties in document** to "Hidden" (removes the YAML frontmatter panel)

## How it works

Uses CodeMirror 6's gutter API (`StateField` + custom `gutter` + `GutterMarker`). No build step — the plugin is a single plain JavaScript file.

## License

MIT
