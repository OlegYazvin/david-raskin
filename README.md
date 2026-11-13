# David Raskin

A buildless static website: four equally sized photos, an honest message, and single-player Pong. No package installation or build step is needed. Images and fonts are served locally; the original photo files are preserved in the parent project folder and the published WebP copies omit camera metadata.

## Preview

From this directory, run `python3 -m http.server 4173` and visit http://localhost:4173.

## Play

Choose **Play Pong**. Move the mouse over the court, drag on a touchscreen, or use **W/S** or **↑/↓** with the court focused. **Space** pauses or resumes and **Escape** pauses. First to seven wins. **Reset** starts over. Switching windows pauses the game.

## Deploy

Live site: https://raskindavid.com/

Repository: https://github.com/OlegYazvin/david-raskin

GitHub Pages publishes the root of the `main` branch. Push a commit to update the page. `.nojekyll` keeps publishing buildless. The custom domain is `raskindavid.com`, configured in GitHub Pages and preserved by the tracked `CNAME` file. HTTPS enforcement is enabled; `www.raskindavid.com` redirects to the apex domain.

### Cloudflare DNS

Once the custom domain is set in GitHub Pages, add these records in the Cloudflare zone for `raskindavid.com`. Use **DNS only** (gray cloud) for the initial GitHub domain and certificate checks. Avoid conflicting apex A/AAAA or www CNAME records. Keep unrelated email and verification records.

| Type | Name | Target |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | olegyazvin.github.io |

After DNS propagates and GitHub issues the TLS certificate, enable **Enforce HTTPS** in the repository's **Settings → Pages**.

References: [GitHub custom-domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), [GitHub Pages API](https://docs.github.com/en/rest/pages/pages).

## Fonts

Barlow Condensed and DM Sans use the SIL Open Font License. License files are included in `assets/fonts/`.
