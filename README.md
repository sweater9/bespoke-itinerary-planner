# Global Holidayz Bespoke Itinerary Builder

A complete GitHub Pages-ready itinerary planner built with vanilla HTML, CSS and JavaScript.

## Included

- 12 regional JSON databases
- 65 destination entries
- 1,300 premium attraction records
- Searchable attraction library with region, destination and category filters
- Day-by-day itinerary construction
- Morning, afternoon, evening and all-day scheduling
- Hotels, car rentals, transfers, flights, restaurants and custom notes
- Detailed operational notes, locations, durations and prices
- Drag-and-drop movement between day periods
- AED, USD, EUR and GBP quote display
- Automatic itinerary total
- Browser saving with local storage
- JSON export and print-ready output
- Responsive interface with no framework, API key or build step

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
