# Court Daily Management PWA

> Production architecture: use the root PWA with `proxy/worker.js` and `google-apps-script/Code.gs`. The old Apps Script-hosted HTML approach has been removed.

This project uses the supplied Google Sheet as its source of truth. The existing columns remain unchanged: `A: serial number`, `B: CASE NO`, `C: case title`, `D: Next Date`, `E: Stage`.

## Use the working deployment

Use only the `google-apps-script` folder for the application. Do not open `index.html`, `localhost`, or the static files for login.

1. Open the Google Sheet and choose `Extensions → Apps Script`.
2. Delete old duplicate functions/files in that Apps Script project.
3. Add or replace these files exactly:
   - `Code.gs` from `google-apps-script/Code.gs`
   - `Index.html` from `google-apps-script/Index.html`
   - `AppJs.html` from `google-apps-script/AppJs.html`
   - `Styles.html` from `google-apps-script/Styles.html`
4. In Apps Script, click **Deploy → New deployment**.
5. Select **Web app**.
6. Set **Execute as** to **Me**.
7. Set **Who has access** to the intended users, then deploy and authorize access.
8. Open the generated URL ending in `/exec`.

The login screen must be opened from that `/exec` URL. The frontend calls `serverApi()` with `google.script.run`, so no browser CORS request is made.

## Configure

1. Open the Sheet, then `Extensions → Apps Script`.
2. Add `google-apps-script/Code.gs`, set `SHEET_NAME` if the data is not on `Sheet1`, and deploy as a Web App. Execute as you; choose the access setting appropriate for your users.
3. Paste the Web App URL into `APP_CONFIG.apiUrl` in `app.js`. Keep credentials only in `Code.gs`.
4. Host the root folder on any static HTTPS host. HTTPS is required for installation and service workers.

The Apps Script project timezone should match the Sheet timezone. The API normalizes spreadsheet dates to `YYYY-MM-DD`.

## Local preview

Do not open `index.html` directly from `file://`; Chrome sends that request with a `null` origin and blocks the Apps Script response. Start a local server instead:

```text
python -m http.server 5500
```

Then open `http://localhost:5500`. You can also use `npx serve .`. The placeholder API URL intentionally refuses sign-in; configure the deployed Web App URL before use.

If the browser still reports CORS after using a server, this is an Apps Script platform limitation: `ContentService` does not provide the `Access-Control-Allow-Origin` header required by a browser `fetch` request. Redeploying alone will not reliably fix it. Use one of these supported deployment options:

1. Host the UI inside the Apps Script project with `HtmlService` and call the backend using `google.script.run` (same-origin, recommended for a no-proxy setup).
2. Put a small authenticated HTTPS proxy in front of the Apps Script Web App and configure `APP_CONFIG.apiUrl` to that proxy.

Do not “fix” this with `mode: "no-cors"`: the browser then hides the response and the app cannot authenticate or safely report errors. Do not switch login to JSONP because that would expose passwords in URLs and logs.

The backend validates authentication and role permissions for every mutation. The frontend never contains passwords.

## Apps Script file mapping

The Apps Script project must contain these four files:

- `Code.gs`
- `Index.html`
- `AppJs.html`
- `Styles.html`

`Code.gs` serves `Index.html` and exposes `serverApi()` to `google.script.run`. Passwords stay only in `Code.gs`; the browser receives only the username, role, and short-lived session token.
