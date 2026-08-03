# PESTO Flux Calculator

Web app to fetch Gaia BP/RP photometry for a target, estimate photon fluxes in
g, r, i, z and Hα for the PESTO instrument (1.6 m telescope, Observatoire du
Mont-Mégantic), and show its airmass curve for any night of the year.

Bilingual (French/English). Runs entirely in the browser: no backend, no API
keys, no server-side computation. Live at
**https://eartigau.github.io/pesto-etc/**.

## Features

- **Four ways to specify a target**:
  - Gaia DR3 source ID.
  - Any SIMBAD-resolvable name (matched to its own Gaia DR3 identifier via SIMBAD
    cross-identifications, not a positional crossmatch, so the correct source is
    used even in crowded fields or close pairs).
  - Manual entry of a Gaia G magnitude and BP−RP color, for a hypothetical target
    with no catalog entry.
  - A solar-system body (Moon or any planet) — see below.
- **Target summary panel**: coordinates, G/BP-RP, parallax, distance, absolute
  magnitude (M_G), and an estimated spectral type (nearest match against the
  Pecaut & Mamajek 2013 dwarf sequence). Omits whatever a manual entry doesn't
  have (coordinates, parallax, Gaia ID).
- **Flux table**: photon rate, PSF peak flux per pixel, and electrons/pixel/frame
  for g, r, i, z (from Gaia photometry via an approximate Gaia→SDSS transform)
  and Hα (from the r-band continuum), using PESTO's real calibrated throughput
  and atmospheric extinction per band. Magnitudes are shown to 1 decimal; every
  other value (flux, parallax, distance, Teff, …) is rounded to 2 significant
  figures.
- **SNR & detector card**: a full noise budget (photon, sky, dark current, CIC,
  read noise), SNR, photometric error (mmag), peak/sky ADU, and saturation
  magnitude per band, using the detector parameters below. Ported directly from
  the nominal PESTO ETC's aperture-photometry model, not just the quick-look
  peak-pixel numbers in the flux table.
- **Telescope & detector parameters**: mirror diameter, relative efficiency, PSF
  FWHM, pixel scale, frame exposure time, total (coadded) exposure time, detector
  mode (Conventional / EM / Photon Counting, each with its own read noise, gain,
  full well, and CIC), EM gain, and CCD temperature (affects dark current) are
  fixed at PESTO's nominal values by default; tick "Override default values" to
  change any of them. Switching detector mode auto-adjusts the EM gain's valid
  range and default.
- **Solar system mode**: surface brightness (mag/arcsec²) and photon rate per
  pixel for the Moon or any planet, assuming a resolved disk (no PSF), nominal
  geometric albedo, and zero phase angle — a simplified, non-ephemeris estimate,
  not real-time positions.
- **Airmass plot**: airmass curve for the target at the OMM, for tonight or any
  other night of the year (date slider), with twilight/night shading and a
  "now" marker. Flags in red if the target never reaches a usable airmass
  (≤ 2.5) at any point during the selected night. The best (minimum) airmass
  reached during the selected night is also what the flux table's extinction
  is computed for, so dragging the date slider updates the flux table too.
  (Not shown for manual entries or solar-system bodies, which have no tracked
  position in this tool.)
- **Brightest field star (5′) & finder chart**: for Gaia-ID/SIMBAD targets, a
  cone search finds every Gaia DR3 star within 5 arcmin and computes the same
  flux table for the brightest one (which can be the target itself), flagging
  any band where the peak pixel exceeds 10 e⁻/frame, a photon-counting-mode
  coincidence-loss risk. A finder chart plots the target, that star, and the
  rest of the field over a real DSS2 archival cutout, with a coordinate
  reference grid (every 2′) and PESTO's actual, fixed field of view (1024×1024
  px at 0.46″/px, independent of whatever pixel scale is currently set).
  Click the chart to enlarge it (shared lightbox pattern with this developer's
  other tools).
- **Local cache**: resolved SIMBAD designations and their Gaia DR3 IDs (plus
  photometry) are cached in the browser for 30 days, so repeat lookups skip
  the network round-trip.

## Architecture

Both SIMBAD and Gaia DR3 lookups run directly in the browser (`static/main.js`):

- SIMBAD name → Gaia DR3 ID: [SIMBAD TAP](https://simbad.cds.unistra.fr/simbad/sim-tap/sync)
  (CDS), which allows cross-origin requests.
- Gaia DR3 photometry (including the 5′ field-star cone search): the official
  ESA Gaia archive TAP does **not** allow CORS, so it's fetched from its
  [VizieR mirror](https://tapvizier.cds.unistra.fr/TAPVizieR/tap/sync)
  (catalog `I/355/gaiadr3`, also CDS, which does allow CORS), same DR3 data.
- The finder chart's archival image comes from CDS's
  [hips2fits](https://alasky.u-strasbg.fr/hips-image-services/hips2fits)
  (DSS2 color), also CORS-enabled.

Gaia source IDs are 19-digit integers, which exceed the 2^53 exact-integer
range of a JS `Number`; they're always carried as the exact string typed by
the user or extracted from a SIMBAD identifier, never round-tripped through
`JSON.parse` as a number.

Because there's no backend, the page is a static file: `templates/index.html`
+ `static/`. `app.py` (Flask) exists only as a local-dev convenience: it
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

The repo root `index.html` + `static/` is the deployable static site: no
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
- Per-band throughput (e-/s at mag 20, airmass 1), sky brightness, and
  extinction coefficients (mag per unit airmass) are the real calibrated
  values from the nominal PESTO ETC (F.-R. Lachapelle,
  `etc_pesto_nominal/ETC_v2_181128.ipynb`), not a generic filter-curve
  estimate: g=78.0, r=67.9, i=43.9, z=11.8, Hα=0.1 e-/s; extinction
  0.4/0.15/0.1/0.1/0.15 mag/airmass; sky 22.1/21.1/20.2/18.3/21.0 mag/arcsec².
  Hα still stands in the r-band continuum magnitude, since Gaia carries no
  native Hα photometry.
- The Moffat PSF uses β=3.0 (PESTO's nominal value) and the default pixel
  scale is 0.46″/px, both matching the nominal ETC.
- Mirror diameter (default 1.6 m) and relative efficiency (default 1.0 = as
  calibrated) scale the flux from that reference throughput by aperture area
  and a multiplier; they don't change the per-band zero points themselves.
- The detector modes (Conventional/EM/Photon Counting), read noise, gain,
  full well, CIC, dark-current-vs-temperature fit, and photometric aperture
  model (Moffat β=3 flux fraction, Gaussian-equivalent peak-pixel fraction)
  are all ported directly from the nominal ETC's own formulas, verified
  against a faithful Python re-run of that notebook's default case (matches
  to 5+ significant figures on SNR, ADU, and saturation values).
- Solar-system surface brightness uses the Bowell et al. (1989) H-D-albedo
  relation (`D[km] = 1329/sqrt(albedo) * 10^(-H/5)`) plus the standard
  heliocentric brightness law, at an assumed zero phase angle and (for
  planets) `Δ = |a - 1|` AU as a nominal Earth distance — not a real
  ephemeris. Validated against real benchmarks: full Moon comes out to
  V=-12.7 / surface brightness 3.4 mag/arcsec² (real ≈ -12.7 / 3.4-3.8);
  Jupiter at opposition comes out to V=-2.7 (real ≈ -2.7).
- The airmass plot assumes a fixed observatory (OMM, Mont-Mégantic: lat
  45.455°, lon −71.153°) and uses the standard US DST rule (2nd Sunday March
  to 1st Sunday November) to convert to local time.
