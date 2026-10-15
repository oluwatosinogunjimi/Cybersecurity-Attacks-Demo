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
const REPO = "https://github.com/oluwatosinogunjimi/Cybersecurity-Attacks-Demo";

/* ---------------- theme ---------------- */
const THEME_KEY = "owasp-demo-theme";
function applyTheme(t) {
  if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  else document.documentElement.removeAttribute("data-theme");
}
function isDark() {
  const a = document.documentElement.getAttribute("data-theme");
  if (a) return a === "dark";
  return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

function TopBar({ go, onToggleTheme, dark }) {
  return html`
    <header class="appbar">
      <button class="brand" onClick=${() => go("home")} title="Home">
        <${Icon} name="shield" cls="brand-mark"/> Web Security Walkthroughs
      </button>
      <span class="spacer"></span>
      <a class="bar-link" href=${REPO} target="_blank" rel="noopener">
        <${Icon} name="github"/><span class="lbl">GitHub</span>
      </a>
      <button class="theme-btn" onClick=${onToggleTheme}
        aria-label=${dark ? "Switch to light mode" : "Switch to dark mode"}
        title=${dark ? "Light mode" : "Dark mode"}>
        <${Icon} name=${dark ? "sun" : "moon"}/>
      </button>
    </header>`;
}

function Home({ go }) {
  return html`
    <div class="wrap stack">
      <div class="catgrid">
        ${MODULES.map((m) => html`
          <button class="catcard" onClick=${() => go(m.id)}>
            <span class="badge">${m.code.replace(":2025", "")}</span>
            <h3>${m.title}</h3>
            <p>${m.blurb}</p>
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
      <${Card} title="Safety & scope" icon="shield">
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
  const [dark, setDark] = useState(isDark());
  useEffect(() => {
    const onHash = () => setRoute((location.hash || "").replace("#", "") || "home");
    window.addEventListener("hashchange", onHash);
    const mq = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    const onSys = () => { if (!document.documentElement.getAttribute("data-theme")) setDark(isDark()); };
    if (mq && mq.addEventListener) mq.addEventListener("change", onSys);
    return () => { window.removeEventListener("hashchange", onHash); if (mq && mq.removeEventListener) mq.removeEventListener("change", onSys); };
  }, []);
  const go = (id) => { location.hash = id; window.scrollTo({ top: 0 }); };
  const toggleTheme = () => {
    const next = isDark() ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    setDark(next === "dark");
  };
  const mod = byId[route];

  return html`
    <${TopBar} go=${go} onToggleTheme=${toggleTheme} dark=${dark}/>
    ${mod
      ? html`<div class="wrap">
          <nav class="crumbs"><a onClick=${() => go("home")}>All categories</a><span>›</span>
            <span>${mod.code} — ${mod.title}</span></nav>
          <main><${mod.Component}/></main>
        </div>`
      : html`<div class="hero-band"><div class="hero">
          <div class="eyebrow">OWASP Top 10 · 2025 edition · ${MODULES.length} modules</div>
          <h1>Web Security <em>Walkthroughs</em></h1>
          <p class="lead">Ten interactive, safe-by-default demos of the most common web application risks — each a guided, click-through walkthrough for the classroom. SQL runs on a real in-browser SQLite engine; signatures and hashes use real Web Crypto; untrusted HTML is confined to a sandbox.</p>
          <div class="row">
            <${Pill}>Runs entirely in your browser</${Pill}>
            <${Pill}>No server · no network</${Pill}>
            <${Pill} variant="info">Guided walkthroughs</${Pill}>
          </div>
        </div></div>
        <main><${Home} go=${go}/></main>`}

    <footer class="foot">
      <span>OWASP Top 10 (2025) walkthroughs by </span>
      <a href="https://www.linkedin.com/in/oluwatosin-ogunjimi/" target="_blank" rel="noopener">Oluwatosin Ogunjimi</a>
      <span> · </span><a href=${REPO} target="_blank" rel="noopener">GitHub</a>
      <span> · for teaching defenders — use only on systems you are authorized to test · nothing leaves your browser</span>
    </footer>`;
}

render(html`<${App}/>`, document.getElementById("root"));
