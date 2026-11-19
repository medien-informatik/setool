/*
 * Gemeinsamer Mermaid-Editor (Syntax-Highlighting, Render, Copy).
 * Einbinden nach vendor/mermaid.min.js:
 *   <script src="mermaid-editor.js" data-lang="sequence|class|package"></script>
 * Der Startinhalt steht direkt in <textarea id="input">.
 */
(function () {
  "use strict";

  const lang = document.currentScript.dataset.lang;

  // ---------- Sprachregeln ----------
  // Je Sprache: Liste [Klasse, RegExp]. Wird an jeder Position der Reihe nach probiert;
  // passt nichts, wird ein Wort/Zeichen als Bezeichner (t-id) ausgegeben.
  const kw = words => new RegExp(`\\b(?:${words.join("|")})\\b`, "y");
  const COMMENT = ["cmt", /%%.*/y];
  const STRING = ["str", /"[^"]*"?/y];
  const NUMBER = ["num", /\b\d+(?:\.\d+)?\b/y];

  const LANGS = {
    sequence: [
      COMMENT,
      ["str", /:.*/y], // Nachrichtentext
      ["kw", kw(["sequenceDiagram", "participant", "actor", "as", "autonumber", "activate", "deactivate",
        "loop", "alt", "else", "opt", "par", "and", "critical", "option", "break", "rect", "end", "box",
        "create", "destroy", "title", "links?", "[Nn]ote", "left of", "right of", "over"])],
      ["arrow", /(?:<<-->>|<<->>|-->>|->>|-->|->|--x|-x|--\)|-\))[+-]?/y],
      NUMBER,
      ["punct", /[,]/y],
    ],

    class: [
      COMMENT,
      STRING,
      ["num", /<<[^>]*>>/y], // Annotationen wie <<interface>>
      ["str", /:.*/y],       // Member-/Beziehungslabel nach ':'
      ["kw", kw(["classDiagram(?:-v2)?", "class", "namespace", "direction", "TB", "BT", "LR", "RL",
        "note for", "note", "link", "click", "callback", "cssClass", "classDef", "style",
        "abstract", "static"])],
      ["arrow", /<\|--|<\|\.\.|--\|>|\.\.\|>|\*--|--\*|o--|--o|<--|-->|<\.\.|\.\.>|--|\.\./y],
      ["punct", /[{}()[\],~$*+#\-]/y],
    ],

    // Paketdiagramm als Flowchart: Pakete = subgraph, Abhängigkeiten = Kanten
    package: [
      COMMENT,
      STRING,
      ["str", /\|[^|]*\|?/y],                // Kantenlabel |...|
      ["str", /\[\[?[^\]]*\]?\]?/y],          // Knotentext [..] / [[..]]
      ["str", /\(\(?[^)]*\)?\)?/y],           // Knotentext (..)
      ["str", /\{[^}]*\}?/y],                 // Knotentext {..}
      ["kw", kw(["flowchart", "graph", "subgraph", "end", "direction", "TB", "TD", "BT", "RL", "LR",
        "classDef", "class", "style", "linkStyle", "click"])],
      ["arrow", /<?(?:-\.+-|={2,}|-{2,})(?:>|[xo](?=\s|$))?/y],
      ["punct", /[&:;,]/y],
    ],
  };

  const rules = LANGS[lang];
  if (!rules) throw new Error(`mermaid-editor.js: unbekannte Sprache "${lang}"`);

  // ---------- Highlighting ----------
  const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const span = (cls, s) => `<span class="t-${cls}">${esc(s)}</span>`;
  const FALLBACK = /\s+|\w+|./y;

  function highlightLine(line) {
    let i = 0, out = "";
    outer: while (i < line.length) {
      for (const [cls, re] of rules) {
        re.lastIndex = i;
        const m = re.exec(line);
        if (m && m[0].length) { out += span(cls, m[0]); i += m[0].length; continue outer; }
      }
      FALLBACK.lastIndex = i;
      const m = FALLBACK.exec(line);
      out += /^\s+$/.test(m[0]) ? m[0] : span("id", m[0]);
      i += m[0].length;
    }
    return out;
  }

  // ---------- DOM ----------
  const input = document.getElementById("input");
  const hl = document.getElementById("highlight");
  const gutter = document.getElementById("gutter");
  const output = document.getElementById("output");
  const status = document.getElementById("status");

  function updateHighlight() {
    const lines = input.value.split("\n");
    hl.innerHTML = lines.map(highlightLine).join("\n") + "\n"; // trailing newline sichtbar halten
    gutter.textContent = lines.map((_, i) => i + 1).join("\n");
    syncScroll();
  }

  function syncScroll() {
    hl.scrollTop = input.scrollTop;
    hl.scrollLeft = input.scrollLeft;
    gutter.scrollTop = input.scrollTop;
  }

  // ---------- Render ----------
  mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "strict" });
  let renderCount = 0;

  async function render() {
    const code = input.value.trim();
    if (!code) { output.innerHTML = ""; return; }
    const id = `mmd-${++renderCount}`;
    try {
      await mermaid.parse(code);
      const { svg } = await mermaid.render(id, code);
      output.innerHTML = svg;
      flash("Gerendert");
    } catch (e) {
      output.innerHTML = "";
      const div = document.createElement("div");
      div.className = "error";
      div.textContent = "Fehler:\n" + (e?.message || String(e));
      output.appendChild(div);
      document.getElementById("d" + id)?.remove(); // von Mermaid hinterlassenes Fehler-Element
    }
  }

  // ---------- Copy ----------
  async function copy() {
    try {
      await navigator.clipboard.writeText(input.value);
    } catch {
      input.select();
      document.execCommand("copy");
      input.setSelectionRange(input.value.length, input.value.length);
    }
    flash("In Zwischenablage kopiert");
  }

  let flashTimer;
  function flash(msg) {
    status.textContent = msg;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => (status.textContent = ""), 2000);
  }

  // ---------- Events ----------
  input.addEventListener("input", updateHighlight);
  input.addEventListener("scroll", syncScroll);
  input.addEventListener("keydown", e => {
    if (e.key === "Tab") {
      e.preventDefault();
      input.setRangeText("    ", input.selectionStart, input.selectionEnd, "end");
      updateHighlight();
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      render();
    }
  });
  document.getElementById("renderBtn").addEventListener("click", render);
  document.getElementById("copyBtn").addEventListener("click", copy);

  updateHighlight();
  render();
})();
