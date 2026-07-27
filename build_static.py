#!/usr/bin/env python3
"""
Generate a static index.html at the repository root from templates/index.html,
for GitHub Pages. Run this before committing whenever the template changes.
"""
from pathlib import Path

ROOT = Path(__file__).parent
TEMPLATE = ROOT / "templates" / "index.html"
OUT_INDEX = ROOT / "index.html"

html = TEMPLATE.read_text()

# Root-absolute /static/ paths work under Flask but break on a GitHub Pages
# project page (served from a /<repo>/ sub-path) — switch to relative paths.
html = html.replace('href="/static/', 'href="static/')
html = html.replace('src="/static/', 'src="static/')

OUT_INDEX.write_text(html)
print(f"Wrote {OUT_INDEX}")
