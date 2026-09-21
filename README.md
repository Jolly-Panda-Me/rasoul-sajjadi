# Rasoul Sajjadi — Level Designer

A single-page static resume site. Pixel-art styling, dark neon palette, and a
3D level-blockout hero rendered with three.js.

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

    python3 -m http.server 8000

## Edit the content

All copy lives in the `DATA` object at the top of the inline `<script>`,
with `en` and `fa` side by side. Add a job by pushing an object to `jobs`
in both locales; the page re-renders from that object on every language switch.

## Languages

English is the default. The EN / فا switch in the top bar flips
`lang` and `dir` on `<html>`, swaps the font stack, and stores the choice in
`localStorage`. A browser set to Persian opens in Persian.

## Still to fill in

Projects, education, the About paragraphs, and the Production / Technology
skill categories were left blank in the content worksheet, so those sections
are not on the page yet.

---

Made by [Jolly Panda Studio](https://jollypanda.ir)
