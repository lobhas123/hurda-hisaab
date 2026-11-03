# Hurda Hisaab

A simple stock, sales and price book for a family hurda shop. It is a
mobile-first web app (PWA) that works offline and installs on a phone home
screen. No accounts, no subscription, no server database.

## What it does

- **Stock In** — record daily purchases by quantity and cost (per kg or total paid).
- **Sale** — sell by weight or by rupee amount (for example ₹20 of hurda).
  Stock is reduced and profit is calculated automatically.
- **Prices** — set the selling price, see cost, margin and small-packet values.
- **Products** — add more items later (kg, g, litre, piece or packet).
- **History** — daily, 7-day, 30-day and all-time records; edit or delete entries.
- **Backup** — one-tap JSON backup; restore on the same or a new phone.
- **PIN lock** — optional 4-digit privacy lock.
- **CSV export** — open entries in Excel or Google Sheets.

Orders themselves stay on WhatsApp and phone calls. This app only tracks stock,
sales and prices.

## Run it on this computer

1. Install [Node.js](https://nodejs.org) once, if it is not already installed.
2. Double-click **`start.bat`**.
3. The app opens at `http://localhost:4173`.

The console also prints a **Phone (same Wi-Fi)** address. To open the app on a
phone, keep the computer running and type that address into the phone's browser.
If Windows Firewall asks, allow Node.js on private networks.

To stop the server, close the black console window or press `Ctrl+C`.

### Manual start

```bat
node server.js
```

Use a different port if needed:

```bat
set PORT=4174
node server.js
```

## Install on a phone

The app must be opened from a web address (`http://` or `https://`), not by
double-clicking `index.html`. The service worker (offline mode) only runs over
HTTP/HTTPS.

**Android (Chrome):** open the address → menu ⋮ → *Add to Home screen*.

**iPhone (Safari):** open the address → Share → *Add to Home Screen*.

When opened from the home screen it runs full screen. The app also offers
**Settings → Install app** with device-specific instructions.

## Host it online (recommended for daily use)

The easiest free option is **Netlify Drop**:

1. Go to <https://app.netlify.com/drop>.
2. Drag the whole `hurda-hisaab` folder onto the page.
3. Netlify gives you a secure `https://…netlify.app` link.
4. Open that link on the shop phone and install it from the browser menu.

Other static hosts such as Cloudflare Pages, GitHub Pages or Vercel work the
same way. No build step is required — upload the folder as-is. The app needs no
backend.

After the first online load, the app shell is cached and works offline. Data is
stored in the browser on that one device.

## Data and backup

- All data is saved in the phone/computer browser using `localStorage`.
- Clearing browser data, uninstalling the browser, or losing the phone also
  removes the data. **Download a backup regularly.**
- **Settings → Download backup** saves a `.json` file. Send it to yourself on
  WhatsApp ("Saved messages") or keep it in Google Drive.
- **Settings → Restore from backup** replaces everything on the device with the
  backup contents and turns the PIN lock off. The app asks for confirmation
  first.
- Backups never include the PIN. The optional PIN is a convenience lock, not
  encryption. If it is forgotten, clear the app's site data in the browser,
  reopen the app, and restore your latest backup; the restored app opens
  without a PIN.

The app works best with **one shop phone/tablet**. Each device keeps its own
separate data; there is no cloud sync.

## Daily use in 30 seconds

1. Hurda arrives: **Stock In** → quantity, cost → *Add stock*.
2. Customer buys 2 kg: **Sale** → 2 → *Record sale*.
3. Customer buys ₹20: **Sale** → *By ₹ amount* → 20 → *Record sale*.
4. Price changes: **Selling price → Change**.
5. End of day: check **Today** on Home and **History**.

## Development

No build tools and no dependencies.

```bat
node --test test/store.test.js test/i18n.test.js
node --check js/store.js
node --check js/i18n.js
node --check js/app.js
node --check sw.js
node --check server.js
```

### Files

| Path | Purpose |
| --- | --- |
| `index.html` | App shell, icon sprite |
| `css/styles.css` | Mobile-first styling |
| `js/store.js` | Pure data layer (stock, cost, profit, history) |
| `js/i18n.js` | English and Marathi localization dictionary |
| `js/app.js` | Screens, sheets, forms, lock screen |
| `sw.js` | Offline cache |
| `manifest.webmanifest` | Installable app metadata |
| `server.js` | Zero-dependency local static server |
| `start.bat` | Windows one-click launcher |
| `test/store.test.js` | Data-layer tests |
| `test/i18n.test.js` | Localization and shell integration tests |

## Notes

- The transaction log is the source of truth. Editing or deleting an entry
  recalculates stock, average cost and profit from history.
- Average cost is weighted across purchases. Profit on a sale is
  `sale amount − (quantity × average cost at that point)`.
- Selling price changes apply to future sales; past sales keep their recorded
  rate and profit.
- Prices and amounts are shown in Indian rupees.
