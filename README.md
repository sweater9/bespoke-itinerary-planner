# Global Holidayz Bespoke Itinerary Builder

A complete GitHub Pages-ready itinerary planner built with vanilla HTML, CSS and JavaScript.

## Included

- 12 regional JSON databases
- 65 destination entries
- 1,300 premium attraction records
- A real Unsplash `imageUrl` on every attraction record
- Searchable attraction library with region, destination and category filters
- Day-by-day itinerary construction
- Morning, afternoon, evening and all-day scheduling
- Hotels, car rentals, transfers, flights, restaurants and custom notes
- Detailed operational notes, locations, durations and prices
- Supplier cost, client selling price, per-guest pricing, tax, service fees and estimated margin
- Client-safe PDF controls for item prices, attraction images, quotation validity and terms
- Dynamically paginated Global Holidayz PDF proposals with accurate page numbering
- Drag-and-drop movement between day periods
- AED, USD, EUR and GBP quote display
- Automatic itinerary total
- Browser saving with local storage
- JSON export and print-ready output
- Branded two-page A4 PDF proposal layout inspired by the supplied Global Holidayz format
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

## Create the client PDF

1. Complete the trip name, client, date, guests and currency.
2. Add hotel and flight items so the PDF summary and flight table populate automatically.
3. Add attractions, transfers, car rentals, restaurants and detailed day notes.
4. Enter prices on each itinerary item.
5. Select **Generate PDF** to open the proposal in a new preview tab.
6. Review every page, then select **Print / Save PDF** to open the browser print dialog and save the final PDF.
7. In the browser print window, choose **Save as PDF**, A4 paper, default margins and enable background graphics.

The generated proposal contains a branded banner, trip summary, flight details, day-by-day itinerary cards, per-person pricing and package inclusions.

The deployed asset URLs are versioned so browsers receive the current PDF preview code after each public release instead of reusing a retired cached generator.
