# Eldoria website

Web page of the Eldoria castle map app in the 14 app languages (English at the root, the others in `cs/`, `sk/`, `de/`, `pl/`, `ru/`, `sl/`, `hu/`, `uk/`, `hr/`, `ro/`, `it/`, `fr/`, `es/`). Every language has a home page (`index.html`) and a privacy policy (`privacy.html`). `events.json` is the list of medieval events that the app downloads and the home pages show.

Published with GitHub Pages: Settings > Pages > Source "GitHub Actions"; `.github/workflows/pages.yml` deploys every push to `main`.

## How the pages are made

The `.html` files, `404.html`, `sitemap.xml` and `robots.txt` are generated, do not edit them by hand. They come from `scripts/build-site.mjs` in the (private) app repository. The texts are in that repository too, in `scripts/site-text/home/<lang>.json` (the page) and `scripts/site-text/privacy/<lang>.html` (the privacy policy; English is the original and a translation must keep its structure). The script stops with a list of problems if a translation has a different structure from the English original. It also copies the icon, the feature graphic and the heading font with its licence into `assets/`, and reads the figures on the page (places, countries, share of places with a known condition) from the app's data, so run it again after every data rebuild:

```
node --no-warnings scripts/build-site.mjs
```

Written by hand and left alone by the script: `assets/site.css`, `assets/site.js`, `assets/screens/` (phone screenshots, made with `scripts/make-site-screens.ps1`), `events.json` and `.github/`.

## Rules

- The pages load nothing from other hosts (no analytics, no web fonts, no CDN scripts). Keep it that way: the privacy policy and the footer say so.
- Do not add the marker icons from `assets/medieval/` of the app repository. They come from an Asset Store pack whose licence forbids publishing the files.
- Look at every screenshot before it goes on the page: the site is public.
- Stylesheet and script links carry a version (`site.css?v=...`) that changes with the file, so a browser never shows a new page with an old stylesheet.
- Events are listed on the pages from `events.json`; the guide for editing it is `store/events-guide.md` in the app repository.
