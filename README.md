# Eldoria website

Web page of the Eldoria castle map app, in English (`index.html`), Slovak (`sk/`) and Czech (`cs/`), plus the privacy policy (`privacy.html`) and the list of medieval events (`events.json`) that the app downloads and the page shows.

Published with GitHub Pages from the root of the `main` branch.

## How the pages are made

`index.html`, `sk/index.html` and `cs/index.html` are generated, do not edit them by hand. They come from `scripts/build-site.mjs` in the (private) app repository, which also copies the icon, the feature graphic and the heading font with its licence into `assets/`. The figures on the page (places, countries, share of places with a known condition) are read from the app's data, so run the script again after every data rebuild:

```
node --no-warnings scripts/build-site.mjs
```

`assets/site.css` and `assets/site.js` are written by hand; the script does not touch them or `privacy.html` and `events.json`.

## Rules

- The page loads nothing from other hosts (no analytics, no web fonts, no CDN scripts). Keep it that way: the privacy policy and the footer say so.
- Do not add the marker icons from `assets/medieval/` of the app repository. They come from an Asset Store pack whose licence forbids publishing the files.
- Events are listed on the page from `events.json`; the guide for editing it is `store/events-guide.md` in the app repository.
