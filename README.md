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

## Shared cloud sync (both parents, same data)

The app now has **real-time shared sync** built into `server.js`. When two
phones connect to the same running server, they see the same data within
5 seconds of each other.

### How it works

- Every time you record a sale or stock entry, your phone pushes the change
  to the server immediately.
- Every 5 seconds each phone checks for new data from the server.
- If Mom records a sale while Dad is offline, her entry is waiting on the
  server when Dad's phone comes back online.
- A small dot at the bottom-right corner shows the sync status:
  - 🟢 green = synced
  - 🟡 yellow (pulsing) = syncing
  - 🔴 red = error (will retry)

### Run the server at home (same Wi-Fi)

1. Double-click **`start.bat`** on your computer.
2. The console shows a **Phone (same Wi-Fi)** address like `http://192.168.1.10:4173`.
3. Open that address on **both phones** and install the app from the browser menu.
4. Keep the computer running. Both phones now share data in real time.

> **Keep the computer on** while the shop is running. When the computer is off
> both phones still work (using their local copy from the last sync), but
> changes won't reach each other until the server is back up.

### Host on a server for always-on sync

For the app to stay in sync without keeping your computer on, you need a server
that runs 24/7. Options (all free for small traffic):

**Railway** (easiest, Node.js supported):
1. Sign up at <https://railway.app>.
2. Connect your GitHub repo (or upload the folder).
3. Railway auto-runs `node server.js` and gives you a `https://…railway.app` link.
4. Open that link on both phones and install.

**Render**:
1. Sign up at <https://render.com>.
2. New → Web Service → connect repo → start command: `node server.js`.
3. Free plan works fine.

**Fly.io** or **Heroku** also work the same way.

> ⚠️ **Data lives on the server** — when the server restarts on a free host,
> `data/state.json` may be deleted (ephemeral storage). Download a backup from
> Settings regularly, or upgrade to a paid plan with persistent disks.

## Host it online — static only (one device, no sync)

The easiest free option is **Netlify Drop**:

1. Go to <https://app.netlify.com/drop>.
2. Drag the whole `hurda-hisaab` folder onto the page.
3. Netlify gives you a secure `https://…netlify.app` link.
4. Open that link on the shop phone and install it from the browser menu.

> On static hosts (Netlify, GitHub Pages, Cloudflare Pages) the `/api/sync`
> endpoint is not available, so each device keeps its own separate data.
> Use Backup → Restore to move data between devices manually.

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

The app works best with **one shop phone/tablet** per server. Each device
shares the same data via the server in real time.

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
| `server.js` | Local static server + shared sync API (`/api/sync`) |
| `data/state.json` | Shared state file (created automatically on first use) |
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
