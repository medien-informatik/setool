# SE-Tools: Mermaid-Editoren

Browser-Editoren für UML-Diagramme mit [Mermaid](https://mermaid.js.org/) – mit Syntax-Highlighting, Render-Button und „Copy to Clipboard“.

**Online:** https://medien-informatik.github.io/setool/

| Editor | Datei |
|---|---|
| Sequenzdiagramm | [`mermaid-seq.html`](mermaid-seq.html) |
| Klassendiagramm | [`mermaid-class.html`](mermaid-class.html) |
| Paketdiagramm (Flowchart mit `subgraph`) | [`mermaid-package.html`](mermaid-package.html) |

Bedienung: Code eingeben, **Render** klicken (oder `Strg+Enter`). `Tab` rückt um 4 Leerzeichen ein.

URL-Parameter `nav`: `?nav=0` blendet die Navigation oben aus (z. B. zum Einbetten per `<iframe>`), `?nav=1` oder ohne Parameter wird sie angezeigt. Beispiel: `mermaid-seq.html?nav=0`

## Lokal nutzen

Die Seiten funktionieren offline – einfach `index.html` im Browser öffnen. Mermaid liegt lokal unter `vendor/`.

Alternativ mit lokalem Webserver:

```bash
python -m http.server 8765
```

→ http://localhost:8765/

## Aufbau

```
index.html             Startseite
mermaid-*.html         Editor-Seiten (Startbeispiel steht im <textarea>)
mermaid-editor.css     gemeinsames Layout
mermaid-editor.js      Highlighting-Regeln je Diagrammtyp, Render, Copy
vendor/mermaid.min.js  Mermaid 11.4.1 (MIT, siehe vendor/mermaid.LICENSE)
```

Ein neuer Diagrammtyp braucht eine Regel-Liste in `LANGS` (`mermaid-editor.js`) und eine HTML-Seite mit `<script src="mermaid-editor.js" data-lang="…">`.

## Veröffentlichung (GitHub Pages)

Jeder Push auf `main` veröffentlicht die Seite über [`.github/workflows/pages.yml`](.github/workflows/pages.yml).

Einmalig im Repository einstellen: **Settings → Pages → Build and deployment → Source: „GitHub Actions“**.
