# Semestre a Barcelona

A personal hub for a study abroad semester in Barcelona. Dark mode, Gaudí-inspired mosaic colors, phone-first.

## What is in it

- **Home:** greeting, semester countdown, today's classes, what is due next, next trip, monthly spending, journal streak
- **Classes:** weekly timetable with rooms, professors and notes
- **Assignments:** deadlines grouped by overdue, next 7 days and later. Deadlines can be set to home time and are converted to Barcelona time
- **Content hub:** pipeline board (Idea, Shooting, Editing, Submitted, Published), deliverables list with due dates and who to send them to, and an idea bank
- **Travel:** trip cards with itinerary, packing list, budget vs. actual spending, a wishlist, and a free-weekends view
- **Places:** food spots and sights with a been/to-try toggle, ratings, map links, and a starter list of Barcelona classics
- **Budget:** log expenses in EUR or your home currency, monthly budget, category breakdown, daily chart, quick converter
- **Journal:** daily entries with mood, best moment and a new word or phrase. Turn any entry into a content idea
- **Settings:** program dates, budget, exchange rate, backup and restore, calendar export (.ics)

## Put it on GitHub Pages

1. Create a new repository on GitHub and upload all the files in this folder (keep the `css`, `js` and `icons` folders).
2. Go to **Settings, Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
3. After a minute your site is live at `https://YOUR-USERNAME.github.io/REPO-NAME/`.

To use it like an app on your phone, open the link in Safari or Chrome and choose **Add to Home Screen**.

## How your data is stored

There is no server. Everything is saved in your browser's `localStorage`, so:

- Your data stays on your device and is not uploaded anywhere.
- Your phone and laptop do not sync automatically. Use **Settings, Export backup** on one and **Import backup** on the other.
- Clearing your browser data erases the app's data. Export a backup now and then.
- A public repo only contains the code, never your entries. Still, do not type passport numbers or booking codes into the source files.

## Customize it

- Colors are CSS variables at the top of `css/style.css`.
- Starter places, journal prompts and the packing list are at the top of `js/app.js`.
- The mosaic on the home page is generated in code (`mosaic()` in `js/app.js`). Change the seed number to get a different pattern.

## Files

```
index.html       page shell
manifest.json    makes it installable
sw.js            offline support
css/style.css    all styling
js/app.js        all logic
icons/icon.svg   app icon
```
