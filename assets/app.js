// OWASP Top 10 (2025) classroom walkthroughs — app shell & router.
import { html, render, useState, useEffect, Card, Button, Pill, Icon } from "./ui.js";
import a01 from "./modules/a01-access-control.js";
import a02 from "./modules/a02-misconfiguration.js";
import a03 from "./modules/a03-supply-chain.js";
import a04 from "./modules/a04-crypto.js";
import a05 from "./modules/a05-injection.js";
import a06 from "./modules/a06-insecure-design.js";
import a07 from "./modules/a07-auth.js";
import a08 from "./modules/a08-integrity.js";
import a09 from "./modules/a09-logging.js";
import a10 from "./modules/a10-exceptional.js";

const MODULES = [a01, a02, a03, a04, a05, a06, a07, a08, a09, a10];
const byId = Object.fromEntries(MODULES.map((m) => [m.id, m]));

function Home({ go }) {
  return html`
    <div class="stack">
      <div class="catgrid">
        ${MODULES.map((m) => html`
          <button class="catcard" onClick=${() => go(m.id)}>
            <span class="badge">${m.code.replace(":2025", "")}</span>
            <span><h3>${m.title}</h3><p>${m.blurb}</p></span>
          </button>`)}
      </div>
      <${Card} title="For instructors — how to run a session" icon="book">
        <ol class="ticks" style="list-style:decimal; padding-left:20px">
          <li>Open a category and press <b>Start guided walkthrough</b>. Project the step bar and read each step aloud.</li>
          <li>Step forward with <b>Next</b>; the demo sets itself into the state the step describes, so the class sees cause and effect.</li>
          <li>At the exploit step, pause and ask the class to predict the outcome before advancing.</li>
          <li>End each module on the <b>fix</b> step and the "How to prevent it" card — that's the takeaway.</li>
          <li>Exit the walkthrough any time to let students drive the controls themselves.</li>
        </ol>
      </${Card}>
      <${Card} title="Safety &amp; scope" icon="shield">
        <ul class="ticks">
          <li>Everything runs locally in your browser. There is no real database, server or network call at runtime.</li>
          <li>The one place untrusted input "executes" (the XSS demo) is confined to a sandboxed iframe, isolated from this page.</li>
          <li>This is for teaching defenders. Never test these techniques on systems you don't own or have written permission to assess.</li>
        </ul>
      </${Card}>
    </div>`;
}

function App() {
  const [route, setRoute] = useState((location.hash || "").replace("#", "") || "home");
  useEffect(() => {
    const onHash = () => setRoute((location.hash || "").replace("#", "") || "home");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const go = (id) => { location.hash = id; window.scrollTo({ top: 0 }); };
  const mod = byId[route];

  return html`
    <div class="wrap">
      <header class="masthead">
        <div class="eyebrow">OWASP Top 10 · 2025 edition</div>
        <h1>Web Security Walkthroughs</h1>
        <p>Ten interactive, safe-by-default demos of the most common web application risks — each with a guided, click-through walkthrough built for the classroom. SQL runs on a real in-browser SQLite engine; signatures and hashes use the real Web Crypto API; untrusted HTML is confined to a sandbox.</p>
        <div class="row">
          <${Pill}>Runs entirely in your browser</${Pill}>
          <${Pill}>No server · no network</${Pill}>
          <${Pill} variant="info">Guided walkthroughs</${Pill}>
        </div>
      </header>

      ${mod
        ? html`<nav class="crumbs"><a onClick=${() => go("home")}>All categories</a><span>›</span>
            <span>${mod.code} — ${mod.title}</span></nav>
            <main><${mod.Component}/></main>`
        : html`<nav class="topnav"></nav><main><${Home} go=${go}/></main>`}

      <footer class="foot">
        Educational material on the OWASP Top 10 (2025). Built for teaching defenders — use only on systems you are authorized to test.
      </footer>
    </div>`;
}

render(html`<${App}/>`, document.getElementById("root"));
