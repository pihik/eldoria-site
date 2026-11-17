# Eldoria website

Web page of the Eldoria castle map app in the 14 app languages (English at the root, the others in `cs/`, `sk/`, `de/`, `pl/`, `ru/`, `sl/`, `hu/`, `uk/`, `hr/`, `ro/`, `it/`, `fr/`, `es/`). Every language has a home page (`index.html`), an events page (`events.html`), a contact page (`contact.html`) and a privacy policy (`privacy.html`). `events.json` is the list of medieval events that the app downloads and the pages show.

Published with GitHub Pages: Settings > Pages > Source "GitHub Actions"; `.github/workflows/pages.yml` deploys every push to `main`.

## How the pages are made

The `.html` files, `404.html`, `sitemap.xml` and `robots.txt` are generated, do not edit them by hand. They come from `scripts/build-site.mjs` in the (private) app repository. The texts are in that repository too, in `scripts/site-text/home/<lang>.json` (the page) and `scripts/site-text/privacy/<lang>.html` (the privacy policy; English is the original and a translation must keep its structure). The script stops with a list of problems if a translation has a different structure from the English original. It also copies the icon, the feature graphic and the heading font with its licence into `assets/`, and reads the figures on the page (places, countries, share of places with a known condition) from the app's data, so run it again after every data rebuild:

```
node --no-warnings scripts/build-site.mjs
```

Written by hand and left alone by the script: `assets/site.css`, `assets/site.js`, `assets/screens/` (phone screenshots, made with `scripts/make-site-screens.ps1`), `events.json` and `.github/`.

## Rules

- The pages load nothing from other hosts (no analytics, no web fonts, no CDN scripts). Keep it that way: the privacy policy and the footer say so. The one request to another host is the message of the contact form, sent to the form service only when a visitor presses send, and only once an access key is set (see "Contact form").
- Adding analytics, a counter or any other script from another host would change the footer, the privacy policy (14 languages) and the app's Data safety answers: decide that first, do not just paste a snippet.
- Do not add the marker icons from `assets/medieval/` of the app repository. They come from an Asset Store pack whose licence forbids publishing the files.
- Look at every screenshot before it goes on the page: the site is public.
- Stylesheet and script links carry a version (`site.css?v=...`) that changes with the file, so a browser never shows a new page with an old stylesheet.
- Events are listed on the pages from `events.json`; the guide for editing it is `store/events-guide.md` in the app repository.

## Contact form

`contact.html` has a form (topic, name, email, message). It works in two ways, chosen when the site is built:

- Without an access key (the default) the button opens the visitor's own email app with the message prepared, as the app's Contact screen does. Nothing is sent from the page, and the privacy policy has no paragraph about the form.
- With an access key from [web3forms.com](https://web3forms.com/) the page sends the message to the form service, which forwards it to the mailbox. Put the key in `scripts/site-config.json` of the app repository (`"formAccessKey"`) and run the build; the privacy policy then gains a paragraph about the form (14 languages) and its date changes. The key is meant to be public, it only lets a page send mail to that one address. Send a test message after the first publish: the form has been tested against a local stand-in for the service, not against the real one.

Spam: a hidden field (honeypot) is checked, and the service filters on its side. The free plan of the service has a monthly limit on messages (250 at the time of writing, check the current terms).
