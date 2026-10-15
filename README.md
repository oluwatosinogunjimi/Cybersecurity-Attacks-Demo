# OWASP Top 10 (2025) — Classroom Walkthroughs

Ten interactive, **safe-by-default** demonstrations of the most common web
application security risks, each with a guided, click-through walkthrough built
for teaching. Everything runs in the browser — no server, no database, no
network calls at runtime.

**Live demo:** https://oluwatosinogunjimi.github.io/Cybersecurity-Attacks-Demo/

> For educators and defenders. Never use these techniques against systems you do
> not own or have explicit written permission to test.

## What's inside

Each module pairs a **vulnerable** path with its **fixed** path and a step-by-step
walkthrough that drives the demo so a class can see cause and effect.

| # | Category (2025) | Demo |
|---|---|---|
| A01 | Broken Access Control | Read another user's invoice by editing a URL (IDOR); steer a server into fetching cloud metadata (SSRF) |
| A02 | Security Misconfiguration | Toggle the convenience flags a default install leaves on and watch each expose secrets |
| A03 | Software Supply Chain Failures | A floating dependency range pulls a hijacked build; pinning, integrity hashes and typosquat awareness stop it |
| A04 | Cryptographic Failures | Store one password four ways (plaintext → unsalted → salted → slow KDF) with real SHA-256 |
| A05 | Injection | **SQL injection against a real in-browser SQLite engine**, plus a sandboxed DOM-XSS demo |
| A06 | Insecure Design | A checkout with no business rules: negative quantity and stacked coupons drive the total below zero |
| A07 | Authentication Failures | A 4-digit PIN falls to brute force in under a second; account lockout stops it |
| A08 | Software & Data Integrity Failures | Tamper with a signed auto-update and watch a real ECDSA signature check catch it |
| A09 | Security Logging & Alerting Failures | Run an attack with logging off (invisible), then enable logging and alerting until the SOC is paged |
| A10 | Mishandling of Exceptional Conditions | Make an entitlement check throw and watch fail-open logic grant access; flip it to fail closed |

The list follows the [OWASP Top 10:2025](https://owasp.org/Top10/2025/). XSS now
sits under **Injection**, and SSRF under **Broken Access Control**, so those
appear as sub-demos within A05 and A01.

## Why this is safe to run in a classroom

- No real database, server or outbound request is ever made.
- The one place untrusted input genuinely executes — the XSS demo — runs inside a
  sandboxed `<iframe sandbox="allow-scripts">`, isolated from the page's origin.
  The "script executed" banner only lights up when code *actually* runs (detected
  via `postMessage`), not when a string looks suspicious.
- SQL runs on real SQLite (compiled to WebAssembly), and signatures/hashes use the
  browser's Web Crypto API — so the behaviour is accurate, not a scripted guess.

## Running it

It's a static site. No build step, no toolchain.

**Locally** (a server is required so the browser can load the `.wasm` file —
opening `index.html` from the filesystem will not work):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

**On GitHub Pages:** Settings → Pages → *Deploy from a branch* → `main` / `/ (root)`.
The repo serves as-is; the included `.nojekyll` keeps the `vendor/` folder intact.

## How it's built

- [Preact](https://preactjs.com/) + [htm](https://github.com/developit/htm) for
  components with no JSX build step, loaded as ES modules via an import map.
- [sql.js](https://sql.js.org/) (SQLite/WASM) for the injection demo.
- Plain CSS, light/dark aware. No Tailwind or Babel at runtime.
- **All dependencies are vendored** under [`/vendor`](./vendor) — nothing loads
  from a CDN when the page runs.

```
index.html              import map + app entry
assets/
  app.js                router + category grid
  ui.js                 shared components, icons, walkthrough engine, XSS sandbox
  db.js                 sql.js loader
  styles.css            design system
  modules/a01…a10.js    one file per OWASP category
vendor/                 preact, htm, sql.js (+ licenses)
```

## License

MIT — see [LICENSE](./LICENSE). Vendored libraries retain their own licenses
under `vendor/`.
