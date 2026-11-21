# The site

Leto's presentation site, in French, for https://leto.re. Plain HTML and CSS,
no build step: open `index.html` in a browser to see it. A push to `main`
that touches this folder publishes it with GitHub Pages
(`.github/workflows/pages.yml`).

- The logo files and the favicons are copies of those in `assets/brand/`, and
  `style.css` repeats the brand colours. Change them together.
- Screenshots are in `img/`, as WebP. They come from the stand-in host: say
  so in their caption.
- The download section is filled by `telecharger.js` from
  `telechargements/version.json`, which `.github/workflows/pages.yml` writes
  next to the files of the latest release. Nothing in `site/` holds them.
- "Où en est Leto" only calls something tried on a real PC once it has been.
  Keep it in step with `docs/roadmap.md`.
