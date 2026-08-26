# inmufa.com

Personal site for Inoyatullo Musayev — Python backend engineer.
Static, no build step, served from GitHub Pages at the repository root.

```
index.html        one page, semantic sections
styles/main.css   tokens first, then components
scripts/main.js   five small init functions, no dependencies
assets/           favicon, OG image, CV
CNAME             inmufa.com
```

## Local preview

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploying

Pushing to `main` publishes. Pages must be set to deploy from the `main`
branch, root folder, with the custom domain `inmufa.com` and HTTPS enforced.

## Still to add

- `assets/inoyatullo-musayev-cv.pdf` — linked from the contact list
- `assets/og.png` — 1200×630, referenced by the Open Graph tags
