const statusEl = document.getElementById('status');
const starInfoEl = document.getElementById('starInfo');
const fluxTable = document.getElementById('fluxTable');
const fluxBody = fluxTable.querySelector('tbody');
const airmassCard = document.getElementById('airmassCard');
const airmassCanvas = document.getElementById('airmassChart');
const dateSlider = document.getElementById('airmassDate');
const dateLabelEl = document.getElementById('airmassDateLabel');
const snrCard = document.getElementById('snrCard');
const snrTable = document.getElementById('snrTable');
const snrBody = snrTable.querySelector('tbody');
const solarInfoEl = document.getElementById('solarInfo');
const solarTable = document.getElementById('solarTable');
const solarBodyEl = solarTable.querySelector('tbody');

let lastSource = null;
let lastGaiaData = null;
let lastSimbadInfo = null;
let lastMode = null; // 'gaia' | 'simbad' | 'manual' | 'solar'
let lastSolarBody = null;

// ── i18n ─────────────────────────────────────────────────────────────────
const STRINGS = {
  fr: {
    tagline: "Calculateur de flux pour PESTO (OMM, miroir de 1,6 m)",
    searchTitle: "Rechercher une étoile",
    gaiaIdLabel: "ID Gaia",
    fetchBtn: "Récupérer",
    simbadNameLabel: "Nom SIMBAD",
    resolveBtn: "Résoudre",
    statusDefault: "Entrez un identifiant ou un nom pour commencer.",
    telescopeTitle: "Paramètres du télescope",
    overrideLabel: "Modifier les valeurs par défaut",
    mirrorLabel: "Diamètre miroir (m)",
    efficiencyLabel: "Efficacité relative (1 = nominal)",
    fwhmLabel: "FWHM PSF (arcsec)",
    pixscaleLabel: "Pixel scale (arcsec/pix)",
    frameTimeLabel: "Temps de pose (s/frame)",
    recomputeBtn: "Recalculer",
    airmassDateLabel: "Date (airmass)",
    resultsTitle: "Résultats",
    airmassTitle: "Airmass - Mont-Mégantic (OMM)",
    thBand: "Bande",
    thMag: "Mag",
    thFlux: "Flux (ph/s)",
    thPeak: "Pic PSF (ph/s/pix)",
    thElectrons: "e⁻/pix/frame",
    fluxAirmassNote: (am) => `Extinction calculée pour une masse d'air de ${am} (meilleur moment de la nuit sélectionnée).`,
    statName: "Nom",
    statParallax: "Parallaxe",
    statDistance: "Distance",
    statSpectral: "Type spectral (estimé)",
    legendTarget: "Airmass de la cible",
    legendTwilight: "Crépuscule",
    legendNight: "Nuit astronomique",
    legendNow: "Maintenant",
    nightCaption: (d0, d1) => `Nuit du ${d0} au ${d1} (heure locale OMM), fenêtre 15h–9h.`,
    warnNeverHorizon: "Cible jamais visible cette nuit-là : toujours sous l'horizon.",
    warnNeverAirmass: "Cible jamais visible cette nuit-là : masse d'air toujours > 2,5 (trop basse sur l'horizon).",
    msgLoading: "Chargement...",
    msgFetched: "Photométrie récupérée.",
    msgCacheHit: "Photométrie récupérée (cache local).",
    msgNetworkError: (msg) => `Erreur réseau : ${msg}`,
    msgEnterGaiaId: "Entrez un ID Gaia.",
    msgEnterName: "Entrez un nom SIMBAD.",
    msgNoDataYet: "Aucune photométrie à calculer. Faites d’abord une recherche.",
    errGaiaNotFound: (id) => `Source Gaia ${id} introuvable.`,
    errSimbadNotFound: (name) => `Aucun identifiant Gaia DR3 trouvé sur SIMBAD pour « ${name} ».`,
    errGaiaFromSimbadNotFound: (id) => `Source Gaia ${id} (via SIMBAD) introuvable.`,
    dateLocale: 'fr-CA',
    modeGaia: "ID Gaia",
    modeSimbad: "Nom SIMBAD",
    modeManual: "Manuel (G, BP−RP)",
    modeSolar: "Système solaire",
    manualGLabel: "Magnitude G",
    manualBpRpLabel: "Couleur BP − RP",
    computeBtn: "Calculer",
    solarBodyLabel: "Corps",
    bodyMoon: "Lune", bodyMercury: "Mercure", bodyVenus: "Vénus", bodyMars: "Mars",
    bodyJupiter: "Jupiter", bodySaturn: "Saturne", bodyUranus: "Uranus", bodyNeptune: "Neptune",
    ttotLabel: "Temps total (s)",
    detModeLabel: "Mode détecteur",
    modeConvOpt: "Conventionnel",
    modeEmOpt: "EM",
    modePcOpt: "Comptage de photons",
    emGainLabel: "Gain EM",
    ccdTempLabel: "Température CCD (°C)",
    snrTitle: "SNR & détecteur",
    thSnr: "SNR",
    thPhotErr: "Erreur phot. (mmag)",
    thAduPeak: "ADU pic",
    thAduSky: "ADU ciel",
    thSatMag: "Sat. (mag)",
    thMagArcsec2: "Mag/arcsec²",
    thFluxPerPixel: "Flux (ph/s/pix)",
    snrNote: (mode, nRead, ttot) => `Mode ${mode}, ${nRead} trames coadditionnées sur ${ttot} s.`,
    msgManualInvalid: "Entrez une magnitude G et une couleur BP − RP valides.",
    msgComputed: "Calculé.",
    manualEntryName: "Entrée manuelle",
    statAppMag: "Magnitude apparente (nominale)",
    statAngDiam: "Diamètre apparent",
    statSurfaceBrightness: "Brillance de surface (nominale)",
    solarNote: "Corps résolu : flux par pixel (pas de PSF), albédo géométrique nominal, phase nulle supposée. Approximation, pas une éphéméride en temps réel.",
  },
  en: {
    tagline: "Flux calculator for PESTO (OMM, 1.6 m mirror)",
    searchTitle: "Find a star",
    gaiaIdLabel: "Gaia ID",
    fetchBtn: "Fetch",
    simbadNameLabel: "SIMBAD name",
    resolveBtn: "Resolve",
    statusDefault: "Enter an ID or a name to get started.",
    telescopeTitle: "Telescope parameters",
    overrideLabel: "Override default values",
    mirrorLabel: "Mirror diameter (m)",
    efficiencyLabel: "Relative efficiency (1 = nominal)",
    fwhmLabel: "PSF FWHM (arcsec)",
    pixscaleLabel: "Pixel scale (arcsec/pix)",
    frameTimeLabel: "Frame time (s/frame)",
    recomputeBtn: "Recompute",
    airmassDateLabel: "Airmass date",
    resultsTitle: "Results",
    airmassTitle: "Airmass - Mont-Mégantic (OMM)",
    thBand: "Band",
    thMag: "Mag",
    thFlux: "Flux (ph/s)",
    thPeak: "PSF peak (ph/s/pix)",
    thElectrons: "e⁻/pix/frame",
    fluxAirmassNote: (am) => `Extinction computed for an airmass of ${am} (best moment of the selected night).`,
    statName: "Name",
    statParallax: "Parallax",
    statDistance: "Distance",
    statSpectral: "Estimated spectral type",
    legendTarget: "Target airmass",
    legendTwilight: "Twilight",
    legendNight: "Astronomical night",
    legendNow: "Now",
    nightCaption: (d0, d1) => `Night of ${d0} to ${d1} (OMM local time), 15:00–09:00 window.`,
    warnNeverHorizon: "Target never visible that night: always below the horizon.",
    warnNeverAirmass: "Target never visible that night: airmass always > 2.5 (too low in the sky).",
    msgLoading: "Loading...",
    msgFetched: "Photometry retrieved.",
    msgCacheHit: "Photometry retrieved (local cache).",
    msgNetworkError: (msg) => `Network error: ${msg}`,
    msgEnterGaiaId: "Enter a Gaia ID.",
    msgEnterName: "Enter a SIMBAD name.",
    msgNoDataYet: "No photometry to compute yet. Search for a target first.",
    errGaiaNotFound: (id) => `Gaia source ${id} not found.`,
    errSimbadNotFound: (name) => `No Gaia DR3 identifier found on SIMBAD for '${name}'.`,
    errGaiaFromSimbadNotFound: (id) => `Gaia source ${id} (from SIMBAD) not found.`,
    dateLocale: 'en-CA',
    modeGaia: "Gaia ID",
    modeSimbad: "SIMBAD name",
    modeManual: "Manual (G, BP−RP)",
    modeSolar: "Solar system",
    manualGLabel: "G magnitude",
    manualBpRpLabel: "BP − RP color",
    computeBtn: "Compute",
    solarBodyLabel: "Body",
    bodyMoon: "Moon", bodyMercury: "Mercury", bodyVenus: "Venus", bodyMars: "Mars",
    bodyJupiter: "Jupiter", bodySaturn: "Saturn", bodyUranus: "Uranus", bodyNeptune: "Neptune",
    ttotLabel: "Total exposure (s)",
    detModeLabel: "Detector mode",
    modeConvOpt: "Conventional",
    modeEmOpt: "EM",
    modePcOpt: "Photon counting",
    emGainLabel: "EM gain",
    ccdTempLabel: "CCD temperature (C)",
    snrTitle: "SNR & detector",
    thSnr: "SNR",
    thPhotErr: "Phot. error (mmag)",
    thAduPeak: "Peak ADU",
    thAduSky: "Sky ADU",
    thSatMag: "Sat. (mag)",
    thMagArcsec2: "Mag/arcsec²",
    thFluxPerPixel: "Flux (ph/s/pix)",
    snrNote: (mode, nRead, ttot) => `${mode} mode, ${nRead} coadded frames over ${ttot} s.`,
    msgManualInvalid: "Enter a valid G magnitude and BP − RP color.",
    msgComputed: "Computed.",
    manualEntryName: "Manual entry",
    statAppMag: "Apparent magnitude (nominal)",
    statAngDiam: "Apparent diameter",
    statSurfaceBrightness: "Surface brightness (nominal)",
    solarNote: "Resolved body: flux per pixel (no PSF), nominal geometric albedo, zero phase angle assumed. An approximation, not a real-time ephemeris.",
  },
};

function detectLang() {
  const saved = localStorage.getItem('pesto_etc_lang');
  if (saved === 'fr' || saved === 'en') return saved;
  const nav = (navigator.language || 'en').toLowerCase();
  return nav.startsWith('fr') ? 'fr' : 'en';
}

let LANG = detectLang();

function t(key, ...args) {
  const entry = STRINGS[LANG][key];
  return typeof entry === 'function' ? entry(...args) : entry;
}

function applyLang() {
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.getElementById('btnFr').classList.toggle('active', LANG === 'fr');
  document.getElementById('btnEn').classList.toggle('active', LANG === 'en');
  updateDateLabel();
  if (lastMode === 'solar' && lastSolarBody) {
    renderSolarResults(lastSolarBody);
    setStatus(t('msgComputed'), false);
  } else if (lastGaiaData) {
    renderResults(lastSource, lastGaiaData, lastSimbadInfo);
    setStatus(t('msgFetched'), false);
  } else {
    setStatus(t('statusDefault'), false);
  }
}

function setLang(l) {
  LANG = l;
  localStorage.setItem('pesto_etc_lang', l);
  applyLang();
}

function setStatus(message, error = false) {
  statusEl.textContent = message;
  statusEl.className = error ? 'status error' : 'status';
}

// Dwarf (V) sequence: SpT, Teff (K), Gaia DR2/EDR3 Bp-Rp, from Pecaut & Mamajek (2013,
// http://www.pas.rochester.edu/~emamajek/EEM_dwarf_UBVIJHK_colors_Teff.txt), whole subtypes only.
const SPT_TABLE = [
  {spt: "B9V", teff: 10700, bprp: -0.120}, {spt: "A0V", teff: 9700, bprp: -0.037},
  {spt: "A1V", teff: 9300, bprp: 0.005}, {spt: "A2V", teff: 8800, bprp: 0.068},
  {spt: "A3V", teff: 8600, bprp: 0.110}, {spt: "A4V", teff: 8250, bprp: 0.166},
  {spt: "A5V", teff: 8100, bprp: 0.194}, {spt: "A6V", teff: 7910, bprp: 0.222},
  {spt: "A7V", teff: 7760, bprp: 0.263}, {spt: "A8V", teff: 7590, bprp: 0.320},
  {spt: "A9V", teff: 7400, bprp: 0.327}, {spt: "F0V", teff: 7220, bprp: 0.377},
  {spt: "F1V", teff: 7020, bprp: 0.434}, {spt: "F2V", teff: 6820, bprp: 0.490},
  {spt: "F3V", teff: 6750, bprp: 0.518}, {spt: "F4V", teff: 6670, bprp: 0.546},
  {spt: "F5V", teff: 6550, bprp: 0.587}, {spt: "F6V", teff: 6350, bprp: 0.640},
  {spt: "F7V", teff: 6280, bprp: 0.670}, {spt: "F8V", teff: 6180, bprp: 0.694},
  {spt: "F9V", teff: 6050, bprp: 0.719}, {spt: "G0V", teff: 5930, bprp: 0.784},
  {spt: "G1V", teff: 5860, bprp: 0.803}, {spt: "G2V", teff: 5770, bprp: 0.823},
  {spt: "G3V", teff: 5720, bprp: 0.832}, {spt: "G4V", teff: 5680, bprp: 0.841},
  {spt: "G5V", teff: 5660, bprp: 0.850}, {spt: "G6V", teff: 5600, bprp: 0.869},
  {spt: "G7V", teff: 5550, bprp: 0.880}, {spt: "G8V", teff: 5480, bprp: 0.900},
  {spt: "G9V", teff: 5380, bprp: 0.950}, {spt: "K0V", teff: 5270, bprp: 0.983},
  {spt: "K1V", teff: 5170, bprp: 1.010}, {spt: "K2V", teff: 5100, bprp: 1.100},
  {spt: "K3V", teff: 4830, bprp: 1.210}, {spt: "K4V", teff: 4600, bprp: 1.340},
  {spt: "K5V", teff: 4440, bprp: 1.430}, {spt: "K6V", teff: 4300, bprp: 1.530},
  {spt: "K7V", teff: 4100, bprp: 1.700}, {spt: "K8V", teff: 3990, bprp: 1.730},
  {spt: "K9V", teff: 3930, bprp: 1.790}, {spt: "M0V", teff: 3850, bprp: 1.840},
  {spt: "M1V", teff: 3660, bprp: 2.090}, {spt: "M2V", teff: 3560, bprp: 2.230},
  {spt: "M3V", teff: 3430, bprp: 2.500}, {spt: "M4V", teff: 3210, bprp: 2.940},
  {spt: "M5V", teff: 3060, bprp: 3.350}, {spt: "M6V", teff: 2810, bprp: 4.160},
  {spt: "M7V", teff: 2680, bprp: 4.650}, {spt: "M8V", teff: 2570, bprp: 4.860},
];

function estimateSpectralType(bpRp) {
  if (Number.isNaN(bpRp)) return null;
  let closest = SPT_TABLE[0];
  let bestDiff = Infinity;
  SPT_TABLE.forEach((row) => {
    const diff = Math.abs(row.bprp - bpRp);
    if (diff < bestDiff) {
      bestDiff = diff;
      closest = row;
    }
  });
  return closest;
}

function gaiaToGri(bp, rp, g) {
  const bp_rp = bp - rp;
  const g_r = -0.0975 + 0.577 * bp_rp;
  const r_i = 0.0182 + 0.184 * bp_rp;
  const i_z = 0.122 - 0.148 * bp_rp;
  return {
    g: g,
    r: g - g_r,
    i: g - g_r - r_i,
    z: g - g_r - r_i - i_z,
  };
}

// Real calibrated PESTO throughput per band: n20 = e-/s at mag 20, airmass 1 (measured
// on the as-built 1.6 m system), am_coef = extinction (mag per unit airmass). From the
// nominal PESTO ETC (F.-R. Lachapelle, ETC_v2_181128.ipynb), which is the reference for
// this instrument; supersedes an earlier generic SDSS-zero-point-based estimate that
// diverged from the real system by up to ~4x in z and Halpha.
const PESTO_BANDS = {
  g: {n20: 78.0, amCoef: 0.4},
  r: {n20: 67.9, amCoef: 0.15},
  i: {n20: 43.9, amCoef: 0.1},
  z: {n20: 11.8, amCoef: 0.1},
  Halpha: {n20: 0.1, amCoef: 0.15},
};
const REF_MIRROR_M = 1.6; // aperture the n20 values above were calibrated at

// Photon rate (e-/s) for a star of the given magnitude, extinguished for airmass, then
// scaled by how the chosen mirror area / relative efficiency compares to the reference
// PESTO system the n20 values were measured on.
function bandPhotons(mag, band, airmass, areaRatio) {
  const {n20, amCoef} = PESTO_BANDS[band];
  const magObs = mag + amCoef * (airmass - 1);
  return n20 * Math.pow(10, (20 - magObs) / 2.5) * areaRatio;
}

function moffatPeakFlux(totalPhotons, fwhm, beta = 3.0) {
  const fwhmRad = fwhm;
  const alpha = fwhmRad / (2 * Math.sqrt(Math.pow(2, 1 / beta) - 1));
  const peak = (beta - 1) / (Math.PI * alpha * alpha);
  return totalPhotons * peak;
}

// ── Full SNR / noise-budget engine, ported from the nominal PESTO ETC ──────
// (F.-R. Lachapelle, etc_pesto_nominal/ETC_v2_181128.ipynb), preserving its exact
// detector modes, aperture photometry, and noise terms. Verified against a faithful
// Python re-run of that notebook's own default case (mag=10, i-band, Conv, -85C,
// texp=1069ms, ttot=60s, am=1.5): SNR, ADU, and saturation all match to 5+ figures.

// Abramowitz & Stegun 7.1.26 erf approximation (|error| <~ 1.5e-7), since JS has no
// built-in erf. Used for the notebook's Gaussian-equivalent peak-pixel fraction.
function erf(x) {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const tt = 1 / (1 + p * x);
  const y = 1 - (((((a5 * tt + a4) * tt) + a3) * tt + a2) * tt + a1) * tt * Math.exp(-x * x);
  return sign * y;
}

// Sky brightness (mag/arcsec^2) per band, from the nominal ETC.
const PESTO_SKY_MAG = {g: 22.1, r: 21.1, i: 20.2, z: 18.3, Halpha: 21.0};

// Detector readout modes, from the nominal ETC.
const DETECTOR_MODES = {
  Conv: {tfullMs: 1069.290095, rn: 13.25, fullWell: 81232, kGain: 5.259, cic: 0.0106600, emGainFixed: 1},
  EM: {tfullMs: 115.109341, rn: 81.98, fullWell: 80629, kGain: 13.522, cic: 0.0014514, emGainMin: 10, emGainMax: 1000, emGainDefault: 100},
  PC: {tfullMs: 115.109341, rn: 81.98, fullWell: 80629, kGain: 13.522, cic: 0.0018862, emGainMin: 3000, emGainMax: 5000, emGainDefault: 5000},
};
const ADU_CLAMP = 300; // [adu] bias pedestal
const NLINES = 1024;
const DARK_MM = 0.063223437503356419;
const DARK_CC = 1.6032048755213368;

// Dark current [e-/px/s] vs CCD temperature [C], from a fit to measured PESTO data.
function darkCurrent(tempC) {
  return Math.pow(10, DARK_MM * Math.round(tempC) + DARK_CC);
}

// Full per-band SNR / noise-budget / saturation calculation for a point source with
// aperture photometry (as opposed to computeFluxes' simple peak-pixel quick-look).
// texpS/ttotS in seconds; tempC in C; areaRatio as in bandPhotons.
function computeSnrDetail(mag, band, airmass, opts) {
  const {n20, amCoef} = PESTO_BANDS[band];
  const skyMag = PESTO_SKY_MAG[band];
  const {fwhm, pixscale, texpS, ttotS, mode, emGainInput, tempC, areaRatio} = opts;

  const texp = Math.max(texpS, 0.005);
  let nRead = Math.floor(ttotS / texp);
  if (nRead === 0) nRead = 1;

  const dm = DETECTOR_MODES[mode];
  let emGain = mode === 'Conv' ? 1 : emGainInput;
  if (mode === 'EM') emGain = Math.min(dm.emGainMax, Math.max(dm.emGainMin, emGain));
  if (mode === 'PC') emGain = Math.min(dm.emGainMax, Math.max(dm.emGainMin, emGain));
  const rn = mode === 'PC' ? 0 : dm.rn;
  const cic = dm.cic;
  const kGain = dm.kGain;
  const fullWell = dm.fullWell;
  const dark = darkCurrent(tempC);

  // Photometric aperture (Moffat beta=3, notebook's own simplified alpha) and the
  // Gaussian-equivalent max flux fraction landing in the single brightest pixel.
  const aper = Math.max(9, 1.4 * Math.pow(fwhm / pixscale, 2));
  const rAper = Math.sqrt(aper / Math.PI);
  const alpha = 0.5 * fwhm / pixscale;
  const beta = 3.0;
  const faper = 1 - Math.pow(1 + Math.pow(rAper / alpha, 2), 1 - beta);
  const f1px = Math.pow(erf(0.5 * 1.662 * pixscale / fwhm), 2);
  const nLine = Math.min(NLINES, Math.round(texp / ((dm.tfullMs / 1000) / NLINES)));

  const magObs = mag + amCoef * (airmass - 1);
  const nn = n20 * Math.pow(10, (20 - magObs) / 2.5) * areaRatio;
  const flux = nn * texp * faper;
  const fluxTot = flux * nRead;
  const sky = n20 * Math.pow(pixscale, 2) * Math.pow(10, (20 - skyMag) / 2.5) * areaRatio * texp;

  const photNoise = Math.sqrt(fluxTot) * emGain;
  const skyNoise = Math.sqrt(sky * aper * nRead) * emGain;
  const cicNoise = mode === 'PC' ? 0 : Math.sqrt(cic * aper * nRead) * emGain;
  const darkNoise = mode === 'PC' ? 0 : Math.sqrt(dark * aper * nRead * texp) * emGain;
  const effRn = Math.sqrt(rn * rn + Math.pow(kGain / 2, 2));
  const rNoise = Math.sqrt(effRn * effRn * aper * nRead);

  const signal = fluxTot * emGain;
  const noiseTot = Math.sqrt(photNoise ** 2 + skyNoise ** 2 + rNoise ** 2 + cicNoise ** 2 + darkNoise ** 2);
  const snr = signal / noiseTot;
  const photErrMmag = 2.5 * Math.log10(1 + 1 / snr) * 1000;

  const expAdu = (flux * emGain) / kGain;
  const totAdu = expAdu * nRead;
  const pxMax = flux * f1px * emGain;
  const maxAdu = ADU_CLAMP + pxMax / kGain;
  const skyAdu = ADU_CLAMP + (sky * emGain) / kGain;

  const satAdu = mode === 'PC' ? emGain / kGain + ADU_CLAMP : fullWell / kGain + ADU_CLAMP;
  const satFlux = ((satAdu - ADU_CLAMP) / texp) * (kGain / emGain) / f1px;
  const satTimeS = (satFlux / nn) * texp;
  const satMag = 20 - 2.5 * Math.log10(satFlux / n20) - amCoef * (airmass - 1);

  return {
    nRead, nLine, aper, faper, f1px, flux, fluxTot, sky,
    photNoise, skyNoise, cicNoise, darkNoise, rNoise,
    signal, noiseTot, snr, photErrMmag,
    expAdu, totAdu, maxAdu, skyAdu, satAdu, satTimeS, satMag,
  };
}

// ── Solar system surface brightness (resolved disk, no PSF) ───────────────
// H (absolute magnitude) via the Bowell et al. (1989) H-D-albedo relation, then the
// standard heliocentric brightness law at an assumed full-phase/zero-phase-angle
// "nominal" geometry (not real-time ephemeris), converted to mag/arcsec^2 using the
// body's own angular size. Radius/albedo/semi-major-axis are nominal textbook values
// (NASA Planetary Fact Sheet-class constants). Validated against real benchmarks: full
// Moon comes out to V=-12.7 / SB=3.4 mag/arcsec^2 (real ~-12.7 / ~3.4-3.8); Jupiter at
// opposition comes out to V=-2.7 (real ~-2.7).
const AU_KM = 149597870.7;
const ARCSEC_PER_RAD = 206264.80625;

const SOLAR_SYSTEM_BODIES = {
  Mercury: {radiusKm: 2439.7, albedo: 0.106, aAu: 0.387},
  Venus: {radiusKm: 6051.8, albedo: 0.65, aAu: 0.723},
  Mars: {radiusKm: 3389.5, albedo: 0.150, aAu: 1.524},
  Jupiter: {radiusKm: 69911, albedo: 0.538, aAu: 5.203},
  Saturn: {radiusKm: 58232, albedo: 0.499, aAu: 9.537},
  Uranus: {radiusKm: 25362, albedo: 0.488, aAu: 19.191},
  Neptune: {radiusKm: 24622, albedo: 0.442, aAu: 30.069},
  Moon: {radiusKm: 1737.4, albedo: 0.12, aAu: 1.0, deltaKm: 384400},
};

// Returns {absMag, appMag, angRadiusArcsec, surfaceBrightness (mag/arcsec^2)}.
function solarSystemSurfaceBrightness(bodyKey) {
  const b = SOLAR_SYSTEM_BODIES[bodyKey];
  const dKm = 2 * b.radiusKm;
  const absMag = 5 * Math.log10(1329.0 / dKm) - 2.5 * Math.log10(b.albedo);
  const rH = b.aAu;
  const deltaAu = b.deltaKm ? b.deltaKm / AU_KM : Math.abs(b.aAu - 1.0);
  const appMag = absMag + 5 * Math.log10(rH * deltaAu);
  const deltaKm = deltaAu * AU_KM;
  const angRadiusArcsec = (b.radiusKm / deltaKm) * ARCSEC_PER_RAD;
  const surfaceBrightness = appMag + 2.5 * Math.log10(Math.PI * angRadiusArcsec ** 2);
  return {absMag, appMag, angRadiusArcsec, surfaceBrightness};
}

// Photons/s/pixel for a resolved, uniformly-bright surface: no PSF, no aperture
// fraction, just surface brightness (assumed spectrally neutral/solar-colored, the
// "nominal albedo" simplification) through the same per-band zero point and pixel
// area used for point sources.
function solarSystemBandPhotonsPerPixel(surfaceBrightnessMagArcsec2, band, airmass, areaRatio, pixscale) {
  const photonsPerArcsec2 = bandPhotons(surfaceBrightnessMagArcsec2, band, airmass, areaRatio);
  return photonsPerArcsec2 * Math.pow(pixscale, 2);
}

function formatNumber(value, digits = 2) {
  return Number(value).toLocaleString(undefined, {maximumFractionDigits: digits});
}

// Magnitudes: fixed at one decimal place (e.g. 13.6, not 13.598).
function formatMag(value) {
  return Number(value).toFixed(1);
}

// Everything else (fluxes, parallax, distance, Teff, …): two significant figures
// (e.g. 280 and 3.7, not 281.34 and 3.707). toPrecision can emit exponential
// notation for values needing more integer digits than the requested precision
// (e.g. "2.8e+2"); routing it back through Number() collapses that to a plain 280.
function formatSig(value, sig = 2) {
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) return num.toString();
  const rounded = Number(num.toPrecision(sig));
  const digitsAfterPoint = Math.max(0, sig - 1 - Math.floor(Math.log10(Math.abs(rounded))));
  return rounded.toLocaleString(undefined, {maximumFractionDigits: digitsAfterPoint});
}

// Reads every telescope/detector parameter from the DOM in one place.
function getTelescopeParams() {
  return {
    mirrorSize: parseFloat(document.getElementById('mirrorSize').value),
    eff: parseFloat(document.getElementById('efficiency').value),
    fwhm: parseFloat(document.getElementById('fwhm').value),
    pixscale: parseFloat(document.getElementById('pixscale').value),
    frameTime: parseFloat(document.getElementById('frameTime').value),
    ttot: parseFloat(document.getElementById('ttot').value),
    mode: document.getElementById('detMode').value,
    emGain: parseFloat(document.getElementById('emGain').value),
    tempC: parseFloat(document.getElementById('ccdTemp').value),
  };
}

function computeFluxes(data, airmass) {
  const p = getTelescopeParams();
  const g = parseFloat(data.phot_g_mean_mag);
  const bp = parseFloat(data.phot_bp_mean_mag);
  const rp = parseFloat(data.phot_rp_mean_mag);
  const mags = gaiaToGri(bp, rp, g);
  const bands = ['g', 'r', 'i', 'z'];
  const rows = [];
  // n20 above is calibrated at REF_MIRROR_M with the as-built system's efficiency, so
  // "efficiency" here is a relative multiplier on that baseline (default 1.0 = as-built),
  // not an absolute throughput fraction.
  const areaRatio = Math.pow(p.mirrorSize / REF_MIRROR_M, 2) * p.eff;
  const snrOpts = {
    fwhm: p.fwhm, pixscale: p.pixscale, texpS: p.frameTime, ttotS: p.ttot,
    mode: p.mode, emGainInput: p.emGain, tempC: p.tempC, areaRatio,
  };

  bands.forEach((band) => {
    const photons = bandPhotons(mags[band], band, airmass, areaRatio);
    const peak = moffatPeakFlux(photons, p.fwhm);
    const pixPeak = peak * Math.pow(p.pixscale, 2);
    const electronsPerFrame = pixPeak * p.frameTime;
    const snr = computeSnrDetail(mags[band], band, airmass, snrOpts);
    rows.push({band, mag: mags[band], photons, peak, pixPeak, electronsPerFrame, snr});
  });

  // Gaia carries no native Halpha photometry: the r-band continuum magnitude stands in
  // for it (same simplifying assumption as before), now scaled by PESTO's real Halpha
  // filter throughput (n20, amCoef) instead of an assumed 1 nm generic bandpass.
  const halpha = mags.r;
  const halphaPhotons = bandPhotons(halpha, 'Halpha', airmass, areaRatio);
  const halphaPeak = moffatPeakFlux(halphaPhotons, p.fwhm);
  const halphaPix = halphaPeak * Math.pow(p.pixscale, 2);
  const halphaElectronsPerFrame = halphaPix * p.frameTime;
  const halphaSnr = computeSnrDetail(halpha, 'Halpha', airmass, snrOpts);
  rows.push({
    band: 'Halpha', mag: halpha, photons: halphaPhotons, peak: halphaPeak,
    pixPeak: halphaPix, electronsPerFrame: halphaElectronsPerFrame, snr: halphaSnr,
  });

  return rows;
}

function renderStarPanel(source, data, simbad) {
  const isManual = source === 'manual';
  const name = isManual ? t('manualEntryName')
    : (simbad && simbad.main_id) ? simbad.main_id : `Gaia DR3 ${data.source_id}`;
  const g = parseFloat(data.phot_g_mean_mag);
  const bp = parseFloat(data.phot_bp_mean_mag);
  const rp = parseFloat(data.phot_rp_mean_mag);
  const bpRp = bp - rp;
  const plx = parseFloat(data.parallax);
  const hasPlx = !Number.isNaN(plx) && plx > 0;
  const distPc = hasPlx ? 1000 / plx : NaN;
  const mG = hasPlx ? g - 5 * Math.log10(distPc) + 5 : NaN;
  const spt = estimateSpectralType(bpRp);

  const stats = [[t('statName'), name]];
  if (!isManual) {
    stats.push(['Gaia DR3', data.source_id]);
    stats.push(['RA', `${formatNumber(data.ra, 5)}°`]);
    stats.push(['Dec', `${formatNumber(data.dec, 5)}°`]);
  }
  stats.push(['G', formatMag(g)]);
  stats.push(['BP − RP', formatMag(bpRp)]);
  stats.push([t('statParallax'), hasPlx ? `${formatSig(plx)} mas` : '-']);
  stats.push([t('statDistance'), hasPlx ? `${formatSig(distPc)} pc` : '-']);
  stats.push(['M_G', hasPlx ? formatMag(mG) : '-']);
  stats.push([t('statSpectral'), spt ? `~${spt.spt} (Teff ≈ ${formatSig(spt.teff)} K)` : '-']);

  starInfoEl.innerHTML = stats.map(([label, value]) => `
    <div class="stat-item">
      <span class="stat-label">${label}</span>
      <span class="stat-value">${value}</span>
    </div>
  `).join('');
}

function renderSnrTable(rows) {
  snrBody.innerHTML = rows.map((row) => `
    <tr>
      <td>${row.band}</td>
      <td>${formatSig(row.snr.snr)}</td>
      <td>${formatSig(row.snr.photErrMmag)}</td>
      <td>${formatSig(row.snr.maxAdu)}</td>
      <td>${formatSig(row.snr.skyAdu)}</td>
      <td>${formatMag(row.snr.satMag)}</td>
    </tr>
  `).join('');
  snrTable.classList.remove('hidden');
  snrCard.classList.remove('hidden');
  const p = getTelescopeParams();
  document.getElementById('snrNote').textContent = t('snrNote', p.mode, rows[0].snr.nRead, formatSig(p.ttot));
}

// Extinction needs a single representative airmass, not a whole-night curve: use the
// best (minimum) airmass reached during the selected night, since that's when PESTO
// would actually observe the target. Falls back to the notebook's own default (1.5)
// if the target never rises at all (the "never visible" warning already covers that),
// or if there's no position at all (manual entry has no RA/Dec to build a night from).
function referenceAirmass(series) {
  if (!series) return 1.5;
  const valid = series.points.map((p) => p.airmass).filter((a) => !Number.isNaN(a));
  return valid.length ? Math.min(...valid) : 1.5;
}

function showPointSourceResults() {
  solarInfoEl.classList.add('hidden');
  solarTable.classList.add('hidden');
}

function showSolarResults() {
  starInfoEl.innerHTML = '';
  fluxTable.classList.add('hidden');
  document.getElementById('fluxAirmassNote').textContent = '';
  snrCard.classList.add('hidden');
  airmassCard.classList.add('hidden');
}

function renderResults(source, data, simbad) {
  showPointSourceResults();
  renderStarPanel(source, data, simbad);
  const series = renderAirmassChart(parseFloat(data.ra), parseFloat(data.dec));
  const airmassForFlux = referenceAirmass(series);
  const rows = computeFluxes(data, airmassForFlux);
  fluxBody.innerHTML = rows.map((row) => `
    <tr>
      <td>${row.band}</td>
      <td>${formatMag(row.mag)}</td>
      <td>${formatSig(row.photons)}</td>
      <td>${formatSig(row.pixPeak)}</td>
      <td>${formatSig(row.electronsPerFrame)}</td>
    </tr>
  `).join('');
  fluxTable.classList.remove('hidden');
  document.getElementById('fluxAirmassNote').textContent = t('fluxAirmassNote', formatSig(airmassForFlux));
  renderSnrTable(rows);
}

// Resolved solar-system body: uniform surface brightness -> straight flux/pixel, no
// PSF/aperture (there's no point-source peak to speak of on an extended disk).
function renderSolarResults(bodyKey) {
  showSolarResults();
  const p = getTelescopeParams();
  const areaRatio = Math.pow(p.mirrorSize / REF_MIRROR_M, 2) * p.eff;
  const {appMag, angRadiusArcsec, surfaceBrightness} = solarSystemSurfaceBrightness(bodyKey);
  const airmass = 1.0; // no live ephemeris/position tracking for solar-system bodies here

  const bands = ['g', 'r', 'i', 'z', 'Halpha'];
  const rows = bands.map((band) => {
    const photonsPerPixel = solarSystemBandPhotonsPerPixel(surfaceBrightness, band, airmass, areaRatio, p.pixscale);
    const electronsPerFrame = photonsPerPixel * p.frameTime;
    return {band, photonsPerPixel, electronsPerFrame};
  });

  const stats = [
    [t('statName'), t(`body${bodyKey}`)],
    [t('statAppMag'), formatMag(appMag)],
    [t('statAngDiam'), `${formatSig(angRadiusArcsec * 2)}″`],
    [t('statSurfaceBrightness'), `${formatMag(surfaceBrightness)} mag/arcsec²`],
  ];
  solarInfoEl.innerHTML = stats.map(([label, value]) => `
    <div class="stat-item">
      <span class="stat-label">${label}</span>
      <span class="stat-value">${value}</span>
    </div>
  `).join('') + `<div class="stat-item stat-note-item"><span class="stat-value stat-note">${t('solarNote')}</span></div>`;
  solarInfoEl.classList.remove('hidden');

  solarBodyEl.innerHTML = rows.map((row) => `
    <tr>
      <td>${row.band}</td>
      <td>${formatMag(surfaceBrightness)}</td>
      <td>${formatSig(row.photonsPerPixel)}</td>
      <td>${formatSig(row.electronsPerFrame)}</td>
    </tr>
  `).join('');
  solarTable.classList.remove('hidden');
}

// Redraws whichever result set is currently on screen (used by the override toggle's
// Recompute button, the date slider, and language switches).
function recomputeCurrent() {
  if (lastMode === 'solar') {
    if (lastSolarBody) renderSolarResults(lastSolarBody);
  } else if (lastGaiaData) {
    renderResults(lastSource, lastGaiaData, lastSimbadInfo);
  }
}

// ── Airmass tonight at the Observatoire du Mont-Mégantic (OMM) ─────────────
const OMM_LAT = 45.455;
const OMM_LON = -71.153;
const MAX_USABLE_AIRMASS = 2.5;

function getNthWeekdayOfMonth(year, month, weekday, n) {
  const first = new Date(Date.UTC(year, month, 1));
  const firstWeekday = first.getUTCDay();
  const offset = (weekday - firstWeekday + 7) % 7;
  const day = 1 + offset + (n - 1) * 7;
  return Date.UTC(year, month, day);
}

// US rule: 2nd Sunday March to 1st Sunday November (matches Quebec/Eastern time DST).
function ommUtcOffsetHours(utcDate) {
  const y = utcDate.getUTCFullYear();
  const start = getNthWeekdayOfMonth(y, 2, 0, 2);
  const end = getNthWeekdayOfMonth(y, 10, 0, 1);
  const t = utcDate.getTime();
  const isDst = t >= start && t < end;
  return isDst ? -4 : -5;
}

function julianDate(utcDate) {
  return utcDate.getTime() / 86400000 + 2440587.5;
}

function gmstDeg(jd) {
  return ((280.46061837 + 360.98564736629 * (jd - 2451545.0)) % 360 + 360) % 360;
}

function sunEquatorial(jd) {
  const n = jd - 2451545.0;
  const g = ((357.528 + 0.9856003 * n) % 360) * Math.PI / 180;
  const lam = (((280.46 + 0.9856474 * n + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) % 360) + 360) % 360 * Math.PI / 180;
  const eps = 23.4393 * Math.PI / 180;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)) * 180 / Math.PI;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lam)) * 180 / Math.PI;
  return {ra: (ra + 360) % 360, dec};
}

function altitudeDeg(raDeg, decDeg, jd, lat = OMM_LAT, lon = OMM_LON) {
  const lst = gmstDeg(jd) + lon;
  const ha = (lst - raDeg) * Math.PI / 180;
  const decR = decDeg * Math.PI / 180;
  const latR = lat * Math.PI / 180;
  const sinAlt = Math.sin(decR) * Math.sin(latR) + Math.cos(decR) * Math.cos(latR) * Math.cos(ha);
  return Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180 / Math.PI;
}

function airmassFromAlt(altDeg) {
  if (altDeg <= 0.5) return NaN;
  return 1 / Math.sin(Math.max(altDeg, 0.5) * Math.PI / 180);
}

// `referenceDate` picks which night to plot (defaults to tonight); the "now" marker
// is always based on the real current instant, so it only shows up when that
// instant actually falls inside the plotted window.
function buildAirmassSeries(raDeg, decDeg, referenceDate) {
  const now = new Date();
  const ref = referenceDate || now;
  const offset = ommUtcOffsetHours(ref);
  const localMs = ref.getTime() + offset * 3600000;
  const local = new Date(localMs);
  const localHour = local.getUTCHours() + local.getUTCMinutes() / 60;
  // "Tonight" = the 15h→09h window straddling the reference local time.
  const dayShift = localHour < 12 ? -1 : 0;
  const startLocalUtcMs = Date.UTC(
    local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + dayShift, 15, 0, 0
  );
  const startUtcMs = startLocalUtcMs - offset * 3600000;
  const durationMs = 18 * 3600000;
  const stepMs = 10 * 60000;
  const nSteps = Math.floor(durationMs / stepMs) + 1;

  const points = [];
  for (let i = 0; i < nSteps; i++) {
    const tUtcMs = startUtcMs + i * stepMs;
    const jd = julianDate(new Date(tUtcMs));
    const sun = sunEquatorial(jd);
    const sunAlt = altitudeDeg(sun.ra, sun.dec, jd);
    const targetAlt = altitudeDeg(raDeg, decDeg, jd);
    const localLabelMs = tUtcMs + offset * 3600000;
    const localLabel = new Date(localLabelMs);
    points.push({
      hour: localLabel.getUTCHours() + localLabel.getUTCMinutes() / 60,
      sunAlt,
      airmass: airmassFromAlt(targetAlt),
    });
  }

  const nowFraction = (now.getTime() - startUtcMs) / durationMs;

  // Most targets rise and set within any given night, so a normal gap in the curve
  // isn't noteworthy: it's already visible on the plot. What's worth calling out
  // explicitly is a target that never reaches a usable airmass (<= 2.5) at any point
  // during the night, which a quick glance at a mostly-empty curve can easily miss.
  // Distinguish *why* it's never usable: strictly below the horizon the whole night,
  // vs. rising but staying too low in the sky (airmass always above the threshold).
  const nightPoints = points.filter((p) => p.sunAlt <= 0);
  const everAboveHorizon = nightPoints.some((p) => !Number.isNaN(p.airmass));
  const neverUp = nightPoints.length > 0
    && nightPoints.every((p) => Number.isNaN(p.airmass) || p.airmass > MAX_USABLE_AIRMASS);
  const neverUpReason = neverUp ? (everAboveHorizon ? 'airmass' : 'horizon') : null;

  return {points, nowFraction, startLocal: new Date(startLocalUtcMs), neverUp, neverUpReason};
}

function drawAirmassChart(canvas, series) {
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth || canvas.width;
  canvas.width = cssWidth * dpr;
  canvas.height = 260 * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = cssWidth;
  const H = 260;
  ctx.clearRect(0, 0, W, H);

  const marginLeft = 34;
  const marginRight = 10;
  const marginTop = 10;
  const marginBottom = 26;
  const plotW = W - marginLeft - marginRight;
  const plotH = H - marginTop - marginBottom;

  const yMin = 1.0;
  const yMax = 3.0;
  const n = series.points.length;
  const xForIndex = (i) => marginLeft + (i / (n - 1)) * plotW;
  const yForAirmass = (am) => marginTop + ((am - yMin) / (yMax - yMin)) * plotH;

  // Twilight / night shading, one vertical slice per sample.
  const sliceW = plotW / (n - 1);
  series.points.forEach((p, i) => {
    let color = null;
    if (p.sunAlt <= -18) color = '#aeb3bd';
    else if (p.sunAlt <= 0) color = '#d8dbe2';
    if (color) {
      ctx.fillStyle = color;
      ctx.fillRect(xForIndex(i) - sliceW / 2, marginTop, sliceW + 1, plotH);
    }
  });

  // Gridlines + y-axis labels.
  ctx.strokeStyle = '#e1e0d9';
  ctx.fillStyle = '#898781';
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let am = yMin; am <= yMax + 0.001; am += 0.5) {
    const y = yForAirmass(am);
    ctx.beginPath();
    ctx.moveTo(marginLeft, y);
    ctx.lineTo(W - marginRight, y);
    ctx.stroke();
    ctx.fillText(am.toFixed(1), marginLeft - 6, y);
  }

  // X-axis hour labels, every 2 hours. Samples land exactly on the hour every 6 steps
  // (10 min/step) starting from local 15h, so even hours fall at i % 12 === 6: an
  // index-based check, since comparing accumulated floating-point hours to a threshold
  // caused some labels (e.g. 2h, 8h) to double up from adjacent samples both matching.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  series.points.forEach((p, i) => {
    if (i % 12 === 6) {
      const x = xForIndex(i);
      ctx.fillText(`${Math.round(p.hour) % 24}h`, x, H - marginBottom + 6);
    }
  });

  // Airmass curve.
  ctx.strokeStyle = '#2a78d6';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  let drawing = false;
  series.points.forEach((p, i) => {
    const x = xForIndex(i);
    if (Number.isNaN(p.airmass) || p.airmass > yMax) {
      drawing = false;
      return;
    }
    const y = yForAirmass(p.airmass);
    if (!drawing) {
      ctx.moveTo(x, y);
      drawing = true;
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  // "Now" marker.
  if (series.nowFraction >= 0 && series.nowFraction <= 1) {
    const x = marginLeft + series.nowFraction * plotW;
    ctx.strokeStyle = '#e34948';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, marginTop);
    ctx.lineTo(x, marginTop + plotH);
    ctx.stroke();
  }

  // Axis baseline.
  ctx.strokeStyle = '#c3c2b7';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(marginLeft, marginTop + plotH);
  ctx.lineTo(W - marginRight, marginTop + plotH);
  ctx.stroke();
}

function dayOfYearToDate(dayOfYear) {
  const year = new Date().getUTCFullYear();
  return new Date(Date.UTC(year, 0, dayOfYear, 12, 0, 0));
}

function currentDayOfYear() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const startOfYear = Date.UTC(year, 0, 1);
  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((startOfToday - startOfYear) / 86400000) + 1;
}

function daysInYear(year) {
  return Math.round((Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000);
}

function updateDateLabel() {
  dateLabelEl.textContent = dayOfYearToDate(parseInt(dateSlider.value, 10))
    .toLocaleDateString(t('dateLocale'), {day: 'numeric', month: 'short', timeZone: 'UTC'});
}

// Returns the built series (used by renderResults to derive the flux-table's reference
// airmass), or null if there's no valid target position to plot.
function renderAirmassChart(raDeg, decDeg) {
  if (Number.isNaN(raDeg) || Number.isNaN(decDeg)) {
    airmassCard.classList.add('hidden');
    return null;
  }
  airmassCard.classList.remove('hidden');
  const refDate = dayOfYearToDate(parseInt(dateSlider.value, 10));
  const series = buildAirmassSeries(raDeg, decDeg, refDate);
  drawAirmassChart(airmassCanvas, series);

  const d0 = series.startLocal;
  const d1 = new Date(d0.getTime() + 86400000);
  const fmt = (d) => d.toLocaleDateString(t('dateLocale'), {day: 'numeric', month: 'long', timeZone: 'UTC'});
  document.getElementById('airmassCaption').textContent = t('nightCaption', fmt(d0), fmt(d1));

  const warningEl = document.getElementById('airmassWarning');
  if (series.neverUp) {
    warningEl.textContent = t(series.neverUpReason === 'horizon' ? 'warnNeverHorizon' : 'warnNeverAirmass');
    warningEl.classList.remove('hidden');
  } else {
    warningEl.classList.add('hidden');
  }
  return series;
}

// ── SIMBAD + Gaia DR3, resolved directly in the browser (no backend) ──────
// SIMBAD TAP (CDS) allows cross-origin requests. The official Gaia archive TAP
// (ESA) does not, so Gaia photometry is fetched from its VizieR mirror at CDS
// (catalog I/355/gaiadr3), which does allow CORS and carries the same DR3 data.
const SIMBAD_TAP_URL = 'https://simbad.cds.unistra.fr/simbad/sim-tap/sync';
const VIZIER_TAP_URL = 'https://tapvizier.cds.unistra.fr/TAPVizieR/tap/sync';

class TargetError extends Error {}

function tapQuery(baseUrl, adql) {
  const params = new URLSearchParams({request: 'doQuery', lang: 'adql', format: 'json', query: adql});
  return fetch(`${baseUrl}?${params.toString()}`).then((resp) => {
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  });
}

// `sourceIdStr` is always carried as the exact decimal string typed by the user or
// extracted from a SIMBAD identifier, never round-tripped through JSON.parse as a
// number, since 19-digit Gaia IDs exceed float64's 2^53 exact-integer range.
function gaiaBySourceId(sourceIdStr) {
  const adql = `SELECT RA_ICRS, DE_ICRS, Gmag, BPmag, RPmag, Plx FROM "I/355/gaiadr3" WHERE Source=${sourceIdStr}`;
  return tapQuery(VIZIER_TAP_URL, adql).then((data) => {
    const rows = data.data || [];
    if (!rows.length) return null;
    const [ra, dec, g, bp, rp, plx] = rows[0];
    return {
      source_id: sourceIdStr,
      ra, dec,
      phot_g_mean_mag: g,
      phot_bp_mean_mag: bp,
      phot_rp_mean_mag: rp,
      parallax: plx,
    };
  });
}

function simbadResolveGaiaId(name) {
  const safeName = name.replace(/'/g, "''");
  const adql = `SELECT b.main_id, id2.id AS gaia_id FROM ident AS id1 `
    + `JOIN basic AS b ON b.oid = id1.oidref `
    + `JOIN ident AS id2 ON id2.oidref = id1.oidref AND id2.id LIKE 'Gaia DR3 %' `
    + `WHERE id1.id = '${safeName}'`;
  return tapQuery(SIMBAD_TAP_URL, adql).then((data) => {
    const rows = data.data || [];
    if (!rows.length) return null;
    const [mainId, gaiaIdText] = rows[0];
    return {main_id: mainId, source_id: gaiaIdText.replace('Gaia DR3', '').trim()};
  });
}

function resolveTarget(params) {
  if (params.gaia_id) {
    const idStr = params.gaia_id.trim();
    return gaiaBySourceId(idStr).then((gaia) => {
      if (!gaia) throw new TargetError(t('errGaiaNotFound', idStr));
      return {source: 'gaia', gaia};
    });
  }
  const name = params.name.trim();
  return simbadResolveGaiaId(name).then((simbad) => {
    if (!simbad) throw new TargetError(t('errSimbadNotFound', name));
    return gaiaBySourceId(simbad.source_id).then((gaia) => {
      if (!gaia) throw new TargetError(t('errGaiaFromSimbadNotFound', simbad.source_id));
      return {source: 'simbad', simbad, gaia};
    });
  });
}

// Local cache of resolved targets (SIMBAD designation + its Gaia DR3 ID, plus the
// photometry), so repeat lookups skip SIMBAD/Gaia network round-trips entirely.
const CACHE_PREFIX = 'pesto_etc_cache_v1_';
const CACHE_TTL_MS = 30 * 24 * 3600 * 1000;

function cacheKeyFor(params) {
  if (params.gaia_id) return `${CACHE_PREFIX}gaia_${params.gaia_id}`;
  return `${CACHE_PREFIX}name_${params.name.trim().toLowerCase()}`;
}

function getCachedQuery(params) {
  try {
    const raw = localStorage.getItem(cacheKeyFor(params));
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.savedAt > CACHE_TTL_MS) return null;
    return entry.body;
  } catch (e) {
    return null;
  }
}

function setCachedQuery(params, body) {
  try {
    localStorage.setItem(cacheKeyFor(params), JSON.stringify({savedAt: Date.now(), body}));
  } catch (e) {
    // localStorage unavailable/full: caching is a speedup, not a requirement.
  }
}

function applyQueryResult(body) {
  lastSource = body.source;
  lastMode = body.source; // 'gaia' | 'simbad'
  lastGaiaData = body.gaia;
  lastSimbadInfo = body.simbad || null;
  renderResults(lastSource, lastGaiaData, lastSimbadInfo);
}

function fetchPhotometry(params) {
  const cached = getCachedQuery(params);
  if (cached) {
    setStatus(t('msgCacheHit'), false);
    applyQueryResult(cached);
    return;
  }
  setStatus(t('msgLoading'), false);
  resolveTarget(params)
    .then((body) => {
      setCachedQuery(params, body);
      applyQueryResult(body);
      setStatus(t('msgFetched'), false);
    })
    .catch((error) => {
      setStatus(error instanceof TargetError ? error.message : t('msgNetworkError', error.message), true);
      showPointSourceResults();
      fluxTable.classList.add('hidden');
      snrCard.classList.add('hidden');
      airmassCard.classList.add('hidden');
      starInfoEl.innerHTML = '';
    });
}

function init() {
  // Set the slider's default (today) before applyLang() renders its label, otherwise
  // the label briefly shows "Jan 1" (the HTML default) instead of today's date.
  const year = new Date().getUTCFullYear();
  dateSlider.max = daysInYear(year);
  dateSlider.value = currentDayOfYear();

  applyLang();

  document.getElementById('btnFr').addEventListener('click', () => setLang('fr'));
  document.getElementById('btnEn').addEventListener('click', () => setLang('en'));

  document.getElementById('fetchGaia').addEventListener('click', () => {
    const gaiaId = document.getElementById('gaiaId').value.trim();
    if (!gaiaId) {
      setStatus(t('msgEnterGaiaId'), true);
      return;
    }
    fetchPhotometry({gaia_id: gaiaId});
  });

  document.getElementById('resolveName').addEventListener('click', () => {
    const name = document.getElementById('simbadName').value.trim();
    if (!name) {
      setStatus(t('msgEnterName'), true);
      return;
    }
    fetchPhotometry({name});
  });

  document.getElementById('computeManual').addEventListener('click', () => {
    const g = parseFloat(document.getElementById('manualG').value);
    const bpRp = parseFloat(document.getElementById('manualBpRp').value);
    if (Number.isNaN(g) || Number.isNaN(bpRp)) {
      setStatus(t('msgManualInvalid'), true);
      return;
    }
    const data = {
      source_id: null, ra: NaN, dec: NaN,
      phot_g_mean_mag: g, phot_bp_mean_mag: g + bpRp / 2, phot_rp_mean_mag: g - bpRp / 2,
      parallax: NaN,
    };
    lastSource = 'manual';
    lastMode = 'manual';
    lastGaiaData = data;
    lastSimbadInfo = null;
    renderResults(lastSource, lastGaiaData, lastSimbadInfo);
    setStatus(t('msgComputed'), false);
  });

  document.getElementById('computeSolar').addEventListener('click', () => {
    const bodyKey = document.getElementById('solarBody').value;
    lastMode = 'solar';
    lastSolarBody = bodyKey;
    renderSolarResults(bodyKey);
    setStatus(t('msgComputed'), false);
  });

  document.querySelectorAll('.mode-tab').forEach((tabBtn) => {
    tabBtn.addEventListener('click', () => {
      const mode = tabBtn.dataset.mode;
      document.querySelectorAll('.mode-tab').forEach((b) => b.classList.toggle('active', b === tabBtn));
      document.querySelectorAll('.mode-panel').forEach((panel) => {
        panel.classList.toggle('hidden', panel.dataset.panel !== mode);
      });
    });
  });

  document.getElementById('computeFlux').addEventListener('click', () => {
    if (lastMode !== 'solar' && !lastGaiaData) {
      setStatus(t('msgNoDataYet'), true);
      return;
    }
    recomputeCurrent();
  });

  function updateEmGainAvailability() {
    const mode = document.getElementById('detMode').value;
    const emGainInput = document.getElementById('emGain');
    const overrideChecked = document.getElementById('overrideParams').checked;
    if (mode === 'Conv') {
      emGainInput.min = 1;
      emGainInput.max = 1;
      emGainInput.value = 1;
      emGainInput.disabled = true;
    } else {
      const dm = DETECTOR_MODES[mode];
      emGainInput.min = dm.emGainMin;
      emGainInput.max = dm.emGainMax;
      const current = Number(emGainInput.value);
      if (current < dm.emGainMin || current > dm.emGainMax) emGainInput.value = dm.emGainDefault;
      emGainInput.disabled = !overrideChecked;
    }
  }
  document.getElementById('detMode').addEventListener('change', updateEmGainAvailability);
  updateEmGainAvailability();

  document.getElementById('overrideParams').addEventListener('change', (event) => {
    const disabled = !event.target.checked;
    ['mirrorSize', 'efficiency', 'fwhm', 'pixscale', 'frameTime', 'ttot', 'detMode', 'ccdTemp'].forEach((id) => {
      document.getElementById(id).disabled = disabled;
    });
    updateEmGainAvailability();
  });

  dateSlider.addEventListener('input', () => {
    updateDateLabel();
    // Full re-render, not just the chart: extinction (and so the flux table) depends
    // on the airmass reached during whichever night is now selected.
    if (lastMode !== 'solar' && lastGaiaData) renderResults(lastSource, lastGaiaData, lastSimbadInfo);
  });
}

init();
