"use client";
import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * MathRenderer
 * Renders a string that may contain plain text plus inline/block LaTeX.
 * Supported delimiters:
 *  - Inline:  $...$   and  \( ... \)
 *  - Block:   $$...$$ and  \[ ... \]
 *
 * Notes:
 *  - We parse and replace only math segments with KaTeX HTML, leaving other text intact.
 *  - Escaped dollars (\$) are respected.
 */
export default function MathRenderer({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    try {
      ref.current.innerHTML = renderMixed(text);
    } catch {
      // If anything unexpected happens, just show raw text.
      ref.current.textContent = text;
    }
  }, [text]);

  return (
    <div
      ref={ref}
      className="prose max-w-none text-gray-900 dark:text-gray-100"
    />
  );
}

/** Render a string that may contain multiple math spans/blocks into a single HTML string */
function renderMixed(src: string): string {
  if (!src) return "";

  // We’ll scan once, honoring block delimiters first, then inline.
  // Patterns avoid greedy matches and respect escaped dollars.
  // - Block: $$...$$ or \[ ... \]
  // - Inline: $...$ or \( ... \)
  //
  // We build a combined regex that captures ANY one of the 4 math forms.
  const pattern =
    /(\$\$([\s\S]+?)\$\$)|\\\[([\s\S]+?)\\\]|(?<!\\)\$([^$\n]+?)(?<!\\)\$|\\\(([\s\S]+?)\\\)/g;

  let html = "";
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = pattern.exec(src)) !== null) {
    // Append plain text before this match (unescape \$ -> $)
    html += escapeHtml(src.slice(lastIndex, m.index)).replaceAll("\\$", "$");

    const [
      full,             // m[0]
      blockDollar,      // m[1]: $$...$$
      blockDollarBody,  // m[2]
      blockBracketBody, // m[3]: \[...\]
      inlineDollarBody, // m[4]: $...$
      inlineParenBody,  // m[5]: \(...\)
    ] = m;

    if (blockDollar) {
      html += safeKatex(blockDollarBody, /*display*/ true);
    } else if (blockBracketBody !== undefined) {
      html += safeKatex(blockBracketBody, /*display*/ true);
    } else if (inlineDollarBody !== undefined) {
      html += safeKatex(inlineDollarBody, /*display*/ false);
    } else if (inlineParenBody !== undefined) {
      html += safeKatex(inlineParenBody, /*display*/ false);
    } else {
      // Shouldn’t happen, but append raw just in case
      html += escapeHtml(full);
    }

    lastIndex = pattern.lastIndex;
  }

  // Append remaining tail
  html += escapeHtml(src.slice(lastIndex)).replaceAll("\\$", "$");

  return html;
}

function safeKatex(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      output: "html",
      strict: "ignore",
      macros: {
        // Common quality-of-life macros (optional, extend as needed)
        "\\RR": "\\mathbb{R}",
        "\\NN": "\\mathbb{N}",
        "\\ZZ": "\\mathbb{Z}",
      },
    });
  } catch {
    // If KaTeX fails, return the raw content wrapped as code so users see something useful
    const safe = escapeHtml(latex);
    return displayMode
      ? `<pre class="not-prose overflow-auto my-3 p-2 rounded bg-gray-100 text-gray-900">${safe}</pre>`
      : `<code>${safe}</code>`;
  }
}

/** Minimal HTML escape for text segments (NOT for KaTeX output) */
function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
