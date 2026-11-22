/** Full HTML document wrapper for legal content previews (About / Privacy / Terms). */
export function renderLegalHtmlPage(opts: {
  title: string;
  bodyHtml: string;
  updatedLabel?: string;
}) {
  const { title, bodyHtml, updatedLabel = "Task Manager" } = opts;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="frame-ancestors *" />
  <title>${title} · ${updatedLabel}</title>
  <style>
    :root {
      --ink: #101418;
      --mist: #f3f1ec;
      --paper: #fffcf7;
      --muted: #5c6570;
      --accent: #c8f542;
      --line: rgba(16, 20, 24, 0.12);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      background: linear-gradient(180deg, #e8e4dc 0%, var(--mist) 40%, #ebe7df 100%);
      color: var(--ink);
      line-height: 1.65;
    }
    .wrap {
      max-width: 760px;
      margin: 0 auto;
      padding: 32px 16px 64px;
    }
    .card {
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: 20px;
      padding: 28px 24px 36px;
      box-shadow: 0 18px 50px rgba(16, 20, 24, 0.08);
    }
    .eyebrow {
      margin: 0 0 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .content h1 {
      margin: 0 0 12px;
      font-size: clamp(1.75rem, 4vw, 2.25rem);
      line-height: 1.15;
      letter-spacing: -0.02em;
    }
    .content h2 {
      margin: 28px 0 10px;
      font-size: 1.25rem;
    }
    .content h3 { margin: 20px 0 8px; font-size: 1.05rem; }
    .content p { margin: 0 0 12px; color: #24303a; }
    .content ul, .content ol { margin: 0 0 16px; padding-left: 1.25rem; }
    .content li { margin-bottom: 8px; }
    .content a { color: #3d6b00; font-weight: 600; }
    .content img {
      display: block;
      width: 100%;
      max-width: 100%;
      height: auto;
      border-radius: 14px;
      margin: 18px 0;
      border: 1px solid var(--line);
      background: #ddd;
    }
    .content p[style*="display:none"] { display: none !important; }
    footer {
      margin-top: 28px;
      text-align: center;
      font-size: 0.85rem;
      color: var(--muted);
    }
  </style>
</head>
<body>
  <div class="wrap">
    <p class="eyebrow">${updatedLabel}</p>
    <article class="card content">
      ${bodyHtml}
    </article>
    <footer>
      <p>© ${new Date().getFullYear()} ${updatedLabel}. Free forever product.</p>
    </footer>
  </div>
</body>
</html>`;
}
