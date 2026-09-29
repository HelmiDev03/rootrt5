// In-place editing of a doc.html shown in the room's iframe (same origin, so the room can reach its DOM).
// The page's own scripts change its DOM (code highlighting, diagrams, copy buttons…), so saving starts
// from the original file and only takes the edited content from the page.

const EDIT_ID = "data-edit-id";

const EDITING_STYLE = `
  [data-editing]:focus { outline: none; }
  [data-editing] :is(p, li, h1, h2, h3, td, th, figcaption, pre, summary):hover {
    outline: 1px dashed rgba(99, 102, 241, 0.6);
    outline-offset: 4px;
    border-radius: 2px;
  }
  [data-editing] pre.mermaid:hover { outline: none; }
`;

/** The editable part of a doc: its <main> (the sidebar stays usable for navigation), otherwise <body>. */
function contentRoot(doc: Document): HTMLElement {
  return doc.querySelector("main") ?? doc.body;
}

/** Numbers the diagrams, so each one gets its own source back when saving. */
export function markDiagrams(page: Document) {
  contentRoot(page)
    .querySelectorAll("pre.mermaid")
    .forEach((pre, i) => pre.setAttribute(EDIT_ID, String(i)));
}

function isInCode(doc: Document): boolean {
  const node = doc.getSelection()?.anchorNode;
  const element = node?.nodeType === Node.ELEMENT_NODE ? (node as Element) : node?.parentElement;
  return Boolean(element?.closest("pre"));
}

/** Makes the page editable where it is displayed. Returns a function that turns editing off. */
export function startEditing(page: Document, handlers: { onInput: () => void; onSave: () => void }) {
  const root = contentRoot(page);
  root.contentEditable = "true";
  root.setAttribute("data-editing", "");
  page.execCommand("defaultParagraphSeparator", false, "p");
  // Diagrams and buttons are drawn by the page's scripts: they stay as they are.
  root.querySelectorAll("pre.mermaid, button").forEach((el) => el.setAttribute("contenteditable", "false"));
  markDiagrams(page);

  const style = page.createElement("style");
  style.textContent = EDITING_STYLE;
  page.head.append(style);

  const onKeyDown = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      handlers.onSave();
    } else if (isInCode(page) && event.key === "Enter") {
      // In code blocks, Enter adds a line instead of a new block, and Tab indents.
      event.preventDefault();
      page.execCommand("insertLineBreak");
    } else if (isInCode(page) && event.key === "Tab") {
      event.preventDefault();
      page.execCommand("insertText", false, "    ");
    }
  };
  // Paste as plain text, so no styles from other pages come in.
  const onPaste = (event: ClipboardEvent) => {
    event.preventDefault();
    page.execCommand("insertText", false, event.clipboardData?.getData("text/plain") ?? "");
  };

  page.addEventListener("keydown", onKeyDown);
  root.addEventListener("input", handlers.onInput);
  root.addEventListener("paste", onPaste);

  return () => {
    page.removeEventListener("keydown", onKeyDown);
    root.removeEventListener("input", handlers.onInput);
    root.removeEventListener("paste", onPaste);
    root.removeAttribute("contenteditable");
    root.removeAttribute("data-editing");
    style.remove();
  };
}

/** New content of doc.html: the original file, with the page's edited content in place of its own. */
export function buildDocHtml(page: Document, original: Document): string {
  const pageRoot = contentRoot(page);
  const root = pageRoot.cloneNode(true) as HTMLElement;

  // Code blocks go back to plain text: the page highlights them when it loads.
  const pageCodes = pageRoot.querySelectorAll<HTMLElement>("pre code");
  root.querySelectorAll("pre code").forEach((code, i) => {
    code.textContent = pageCodes[i].innerText;
    code.classList.remove("hljs");
    code.removeAttribute("data-highlighted");
  });

  // Diagrams go back to their source: the page draws them when it loads.
  const sources = contentRoot(original).querySelectorAll("pre.mermaid");
  root.querySelectorAll(`pre.mermaid[${EDIT_ID}]`).forEach((pre) => {
    pre.innerHTML = sources[Number(pre.getAttribute(EDIT_ID))]?.innerHTML ?? pre.innerHTML;
  });

  // Remove what the page's scripts and the browser's editing added.
  root.querySelectorAll(".code > button.copy").forEach((button) => button.remove());
  root.querySelectorAll("span[style]:not([class]), font").forEach((el) => el.replaceWith(...el.childNodes));
  root.querySelectorAll("details[open]").forEach((details) => details.removeAttribute("open"));
  for (const el of [root, ...root.querySelectorAll("*")]) {
    for (const name of ["contenteditable", "data-editing", EDIT_ID, "data-processed"]) el.removeAttribute(name);
    el.classList.remove("active");
    if (el.getAttribute("class") === "") el.removeAttribute("class");
  }

  const doc = original.cloneNode(true) as Document;
  contentRoot(doc).replaceWith(doc.importNode(root, true));
  const html = doc.documentElement.outerHTML
    // Keep the file's layout: the parser moves the line breaks around <head> and </body>,
    // and writes SVG shapes as <path></path> instead of <path/>.
    .replace(/^(<html[^>]*>)<head>/, "$1\n<head>")
    .replace(/\s*<\/body><\/html>$/, "\n</body>\n</html>")
    .replace(/<(path|circle|rect|line|polyline|polygon|ellipse)([^>]*)><\/\1>/g, "<$1$2/>");
  return `<!doctype html>\n${html}\n`;
}
