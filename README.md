# Global Holidayz Itinerary Planner

A standalone, browser-based itinerary builder for creating branded client
quotes in AED or USD.

## Features

- Multi-destination itinerary planning
- Hotels, activities, flights, transfers, car rentals and documents
- Morning, afternoon, evening, full-day and overnight scheduling
- Automatic subtotal, markup, tax and grand-total calculations
- AED and USD display
- Drag-and-drop itinerary ordering
- Local client-session saving
- JSON backup and restore
- Print-friendly itinerary and PDF export

## Run locally

No installation or build process is required.

1. Download or clone this repository.
2. Open `index.html` in a modern browser.

The application uses browser `localStorage`, so saved sessions remain on the
same browser and device. Use **Backup DB** to create a portable JSON backup.

## Deploy with GitHub Pages

1. Create a new GitHub repository.
2. Upload all files from this package to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select the `main` branch and `/ (root)` folder, then save.

GitHub will provide the public website address after deployment.

## Technical notes

The application is a static single-page site. It uses CDN-hosted Tailwind CSS,
Lucide icons and SortableJS, so an internet connection is required for styling,
icons and drag-and-drop functionality.

## Customisation

Edit the following defaults inside `index.html`:

- Agency name: `Global Holidayz`
- Default currency: `AED`
- AED/USD conversion rate
- Markup and tax percentages
- Initial itinerary services and descriptions

