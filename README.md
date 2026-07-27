# PESTO Flux Calculator

Web app to fetch Gaia BP/RP photometry for a target, estimate photon fluxes in
g, r, i, z and Hα for the PESTO instrument (1.6 m telescope, Observatoire du
Mont-Mégantic), and show its airmass curve for any night of the year.

Bilingual (French/English). Runs entirely in the browser — no backend, no API
keys, no server-side computation. Live at
**https://eartigau.github.io/pesto-etc/**.

## Features

- **Target lookup**: by Gaia DR3 source ID, or by any SIMBAD-resolvable name.
  Name lookups match the target's own Gaia DR3 identifier from its SIMBAD
  cross-identifications (not a positional crossmatch), so the correct source
  is used even in crowded fields or close pairs.
- **Target summary panel**: coordinates, G/BP-RP, parallax, distance, absolute
  magnitude (M_G), and an estimated spectral type (nearest match against the
  Pecaut & Mamajek 2013 dwarf sequence).
- **Flux table**: photon rate, PSF peak flux per pixel, and electrons/pixel/frame
  for g, r, i, z (from Gaia photometry via an approximate Gaia→SDSS transform)
  and Hα (from the r-band continuum). Magnitudes are shown to 1 decimal; every
  other value (flux, parallax, distance, Teff, …) is rounded to 2 significant
  figures.
- **Telescope parameters**: mirror diameter, efficiency, PSF FWHM, pixel scale,
  and frame time are fixed at PESTO's nominal values by default; tick
  "Override default values" to change any of them.
- **Airmass plot**: airmass curve for the target at the OMM, for tonight or any
  other night of the year (date slider), with twilight/night shading and a
  "now" marker.
- **Local cache**: resolved SIMBAD designations and their Gaia DR3 IDs (plus
  photometry) are cached in the browser for 30 days, so repeat lookups skip
  the network round-trip.

## Architecture

Both SIMBAD and Gaia DR3 lookups run directly in the browser (`static/main.js`):

- SIMBAD name → Gaia DR3 ID: [SIMBAD TAP](https://simbad.cds.unistra.fr/simbad/sim-tap/sync)
  (CDS), which allows cross-origin requests.
- Gaia DR3 photometry: the official ESA Gaia archive TAP does **not** allow
  CORS, so photometry is fetched from its [VizieR mirror](https://tapvizier.cds.unistra.fr/TAPVizieR/tap/sync)
  (catalog `I/355/gaiadr3`, also CDS, which does allow CORS) — same DR3 data.

Gaia source IDs are 19-digit integers, which exceed the 2^53 exact-integer
range of a JS `Number`; they're always carried as the exact string typed by
the user or extracted from a SIMBAD identifier, never round-tripped through
`JSON.parse` as a number.

Because there's no backend, the page is a static file: `templates/index.html`
+ `static/`. `app.py` (Flask) exists only as a local-dev convenience — it
serves the same template with `/static/...` paths and auto-reloads on edit.

## Local development

1. Create a Python environment and install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

2. Run the app:

```bash
python app.py
```

3. Open `http://127.0.0.1:5000` in your browser.

Alternatively, since the page needs no backend, serve the static build
directly (see below) with any static file server, e.g. `python3 -m http.server`.

## Usage

- Enter a Gaia source ID (left) or a SIMBAD-resolvable object name (right).
- Fluxes and the airmass plot are computed automatically as soon as the target
  is retrieved, using the default telescope parameters.
- Tick "Override default values" to change the mirror size, efficiency, FWHM,
  pixel scale, or frame time, then click "Recompute".
- Drag the airmass date slider to preview any night of the year, not just
  tonight.
- Toggle FR/EN with the buttons at the top right; the choice is remembered.

## Deployment (GitHub Pages)

The repo root `index.html` + `static/` is the deployable static site — no
build step needed at request time, just at commit time:

```bash
python3 build_static.py   # regenerates index.html from templates/index.html
git add index.html static
git commit -m "Rebuild static site"
git push
```

`build_static.py` copies `templates/index.html` to the repo root, rewriting
`/static/...` paths to the relative `static/...` (needed since a GitHub Pages
project page is served from a `/<repo>/` sub-path, not the domain root).
Whenever `templates/index.html` changes, re-run it before committing.

GitHub Pages just needs to be enabled once, serving from the repo root on the
default branch.

## Notes

- Gaia-to-gri transformations are approximate.
- Broadband (g, r, i, z) zero points are derived from real SDSS filter zero
  points and effective bandwidths (SVO Filter Profile Service). Hα is modeled
  as a 1 nm bandpass on the r-band continuum, which is why its photon rate is
  roughly two orders of magnitude below the broadband bands rather than above
  them.
- The telescope area is computed for a 1.6 m aperture (adjustable) and a 30%
  overall efficiency by default.
- The airmass plot assumes a fixed observatory (OMM, Mont-Mégantic: lat
  45.455°, lon −71.153°) and uses the standard US DST rule (2nd Sunday March
  to 1st Sunday November) to convert to local time.
