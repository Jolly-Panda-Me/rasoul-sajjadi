# Rasoul Sajjadi — Level Designer

Personal one-page résumé site for Rasoul Sajjadi, Level Designer.
Static HTML, CSS and JavaScript — no build step, no framework.

**Live:** https://me.jollypanda.ir/bio/rasoul-sajjadi/

## What's here

- Bilingual: English by default, Persian with full RTL support, switchable in the top bar
- Pixel-art styling over a dark neon palette
- 3D hero: a rotating level blockout rendered with three.js, with a graceful fallback
- Every string and image comes from `data/site.json` and `data/projects.json`, so the
  content can be edited without touching the code
- Responsive from small phones up, respects reduced-motion, has a print stylesheet
- SEO: per-language titles and descriptions, canonical and hreflang links, Open Graph
  and Twitter cards, Person JSON-LD, `sitemap.xml` and `robots.txt`

## Editing content

Change the JSON in `data/`. Fields left empty are skipped, and a section with nothing
in it stays hidden — filling in a blank field is all it takes to make that part of the
page appear. Images are referenced by path in the same files; the current portrait and
project covers are placeholders in `assets/img/`.

## Credits

Built by [Jolly Panda Studio](https://jollypanda.ir).
Code is MIT licensed; the résumé content and artwork are not — see [LICENSE](LICENSE).
