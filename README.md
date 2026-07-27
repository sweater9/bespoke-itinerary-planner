# Global Holidayz Premium Attraction Library

A GitHub Pages-ready attraction browser built with vanilla HTML, CSS and JavaScript.

## Included

- 12 regional JSON databases
- 65 destination entries
- 1,300 premium attraction records
- Region and destination selection
- Category filtering, keyword search and full reset
- Responsive interface
- No framework, package manager, API key or build step

## Run locally

The site uses `fetch()`, so serve it over HTTP:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Upload to GitHub

1. Extract the ZIP file.
2. Create a GitHub repository.
3. Upload everything inside the extracted folder to the repository root.
4. Commit the files.
5. Open **Settings → Pages**.
6. Select **Deploy from a branch**, `main`, and `/ (root)`.

## Add another regional database

1. Put the JSON file in `data/destinations/`.
2. Add its display name and filename to `data/regions.json`.
3. Keep the same nested structure: `destinations → categories → attractions`.

The interface discovers destinations and categories automatically.
