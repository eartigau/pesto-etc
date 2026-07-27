"""PESTO Flux Calculator: local dev server.

All SIMBAD/Gaia lookups happen client-side (see static/main.js), so this app
only serves the page and its static assets. The same page, built via
build_static.py, runs standalone on GitHub Pages with no backend at all.
"""

import os

from flask import Flask, render_template

app = Flask(__name__, static_folder="static", template_folder="templates")
app.config["TEMPLATES_AUTO_RELOAD"] = True


@app.route("/")
def index():
    return render_template("index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
