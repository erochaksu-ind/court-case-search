# Production deployment

## 1. Apps Script backend

Use `google-apps-script/Code.gs` in the Apps Script project connected to the Sheet. The backend keeps the three passwords server-side and reads columns A–E from the existing sheet.

Deploy it as a Web App:

- Execute as: **Me**
- Who has access: **Anyone**
- Copy the deployed `/exec` URL

## 2. CORS proxy

The browser must not call Apps Script directly. Deploy `proxy/worker.js` using Cloudflare Workers or another HTTPS serverless proxy.

Set these values. For GitHub Pages, the browser origin is the domain only; do not include `/court-case-search/` in `ALLOWED_ORIGIN`:

```text
ALLOWED_ORIGIN=https://erochaksu-ind.github.io
APPS_SCRIPT_URL=https://script.google.com/macros/s/…/exec
```

For Wrangler:

```text
cd proxy
wrangler secret put APPS_SCRIPT_URL
wrangler deploy
```

Set `ALLOWED_ORIGIN` in `wrangler.toml` to the actual PWA origin.

## 3. PWA frontend

Put the deployed Worker URL into `APP_CONFIG.apiUrl` in `app.js`:

```javascript
apiUrl: "https://court-daily-proxy.YOUR-SUBDOMAIN.workers.dev"
```

Host the project root at `https://erochaksu-ind.github.io/court-case-search/` over HTTPS. Keep `manifest.json`, `service-worker.js`, and `icon.svg` beside `index.html`. The app is then installable as a PWA and can cache its shell offline. Mutations still require an online connection.

Do not put Apps Script passwords in `app.js`, the proxy, `manifest.json`, or the PWA bundle.
