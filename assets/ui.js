// Shared UI toolkit for the OWASP walkthroughs.
// Preact + htm (vendored). Re-exports the bits modules need plus a small set
// of presentational components, inline-SVG icons, the guided-walkthrough
// engine, and a sandboxed runner used by the XSS demo.

import { html, render, Component } from "../vendor/htm/htm-preact.module.js";
import {
  useState, useEffect, useMemo, useRef, useCallback, useReducer,
} from "../vendor/preact/hooks.module.js";

export { html, render, Component, useState, useEffect, useMemo, useRef, useCallback, useReducer };

/* ---------------- icons (inline SVG, no dependency) ---------------- */
const P = {
  globe: html`<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>`,
  server: html`<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>`,
  database: html`<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>`,
  shield: html`<path d="M12 3l7 3v5c0 4.4-3 8.3-7 10-4-1.7-7-5.6-7-10V6l7-3z"/>`,
  alert: html`<path d="M12 3l9 16H3L12 3z"/><path d="M12 10v4M12 17h.01"/>`,
  check: html`<path d="M20 6L9 17l-5-5"/>`,
  x: html`<path d="M6 6l12 12M18 6L6 18"/>`,
  arrow: html`<path d="M5 12h14M13 6l6 6-6 6"/>`,
  lock: html`<rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`,
  unlock: html`<rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.3-2.3"/>`,
  bug: html`<rect x="8" y="6" width="8" height="12" rx="4"/><path d="M12 6V4M5 9h3M16 9h3M4 14h4M16 14h4M6 19l3-2M18 19l-3-2"/>`,
  eye: html`<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>`,
  key: html`<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l2 2M14 9l2 2"/>`,
  file: html`<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v4h4"/>`,
  package: html`<path d="M12 2l9 5v10l-9 5-9-5V7l9-5z"/><path d="M3 7l9 5 9-5M12 12v10"/>`,
  bell: html`<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 0 0 4 0"/>`,
  scale: html`<path d="M12 3v18M7 21h10M5 7h14M5 7l-2 6a3 3 0 0 0 6 0L5 7zM19 7l-2 6a3 3 0 0 0 6 0l-4-6z"/>`,
  gear: html`<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>`,
  play: html`<path d="M7 4l12 8-12 8V4z"/>`,
  book: html`<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z"/><path d="M19 3v16"/>`,
  route: html`<circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h6a4 4 0 0 1 0 8H8"/>`,
  sun: html`<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>`,
  moon: html`<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>`,
  github: html`<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3-.3 6.2-1.5 6.2-6.7A5.2 5.2 0 0 0 20 4.8 4.8 4.8 0 0 0 19.9 1S18.7.6 16 2.5a13.4 13.4 0 0 0-7 0C6.3.6 5.1 1 5.1 1A4.8 4.8 0 0 0 5 4.8a5.2 5.2 0 0 0-1.4 3.6c0 5.2 3.2 6.4 6.2 6.7a3.4 3.4 0 0 0-.9 2.6V22"/>`,
};
export function Icon({ name, size = 22, cls = "" }) {
  return html`<svg class=${cls} width=${size} height=${size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.globe}</svg>`;
}

/* ---------------- presentational components ---------------- */
export const Card = ({ title, icon, children }) => html`
  <section class="card">
    ${title && html`<h3 class="card-title">${icon && html`<${Icon} name=${icon} size=${18}/>`}${title}</h3>`}
    <div class="stack">${children}</div>
  </section>`;

export const SectionTitle = ({ children }) => html`<h2 class="section-title">${children}</h2>`;

export const Pill = ({ variant, children }) =>
  html`<span class=${"pill" + (variant ? " pill--" + variant : "")}>${children}</span>`;

export const Button = ({ onClick, variant, sm, disabled, children, title }) =>
  html`<button class=${"btn" + (variant ? " btn--" + variant : "") + (sm ? " btn--sm" : "")}
    onClick=${onClick} disabled=${disabled} title=${title}>${children}</button>`;

export const InlineCode = ({ children }) => html`<code class="code">${children}</code>`;

export const CodeBlock = ({ code, htmlCode }) =>
  htmlCode
    ? html`<pre class="codeblock" dangerouslySetInnerHTML=${{ __html: htmlCode }}></pre>`
    : html`<pre class="codeblock">${code}</pre>`;

export const Field = ({ label, value, onInput, placeholder, mono, type = "text" }) => html`
  <label class="label">
    <span>${label}</span>
    <input class=${"input" + (mono ? " mono" : "")} type=${type} value=${value}
      placeholder=${placeholder} onInput=${(e) => onInput(e.target.value)} />
  </label>`;

export const Switch = ({ checked, onChange, children }) => html`
  <label class="switch">
    <input type="checkbox" checked=${checked} onChange=${(e) => onChange(e.target.checked)} />
    <span class="track"></span>
    <span>${children}</span>
  </label>`;

export const Banner = ({ variant = "info", icon, title, children }) => html`
  <div class=${"banner banner--" + variant} role="status">
    <${Icon} name=${icon || (variant === "success" ? "shield" : variant === "danger" ? "alert" : "eye")} cls="ico"/>
    <div>${title && html`<strong>${title}</strong>`}${children && html`<p>${children}</p>`}</div>
  </div>`;

export const FlowStep = ({ icon, step, title, desc, status = "neutral" }) => html`
  <div class=${"flow-step flow-step--" + status}>
    <${Icon} name=${icon} cls="ico"/>
    <div><h4>${step}. ${title}</h4><p>${status === "danger" ? "⚠ " : ""}${desc}</p></div>
  </div>`;

export const FlowArrow = () => html`<div class="flow-arrow"><${Icon} name="arrow" size=${20}/></div>`;

export const DataTable = ({ columns, rows, rowClass }) => html`
  <div class="table-wrap">
    <table class="data">
      <thead><tr>${columns.map((c) => html`<th class="mono">${c}</th>`)}</tr></thead>
      <tbody>
        ${rows.length
          ? rows.map((r, i) => html`<tr class=${rowClass ? rowClass(r, i) : ""}>
              ${r.map((cell) => html`<td class="mono">${String(cell)}</td>`)}</tr>`)
          : html`<tr><td class="muted" colspan=${columns.length || 1}>(no rows returned)</td></tr>`}
      </tbody>
    </table>
  </div>`;

/* ---------------- guided walkthrough engine ---------------- */
// steps: [{ title, body, apply? }]. apply() runs when the step becomes active,
// setting the demo into the state that illustrates the step.
export function useWalkthrough(steps) {
  const [step, setStep] = useState(0);
  const [on, setOn] = useState(true);
  const last = steps.length - 1;
  const go = useCallback((n) => setStep((s) => Math.max(0, Math.min(last, typeof n === "function" ? n(s) : n))), [last]);

  useEffect(() => {
    if (on && steps[step] && typeof steps[step].apply === "function") steps[step].apply();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, on]);

  return { step, setStep: go, on, setOn, total: steps.length, current: steps[step] };
}

export function Walkthrough({ wt, steps, title }) {
  const { step, setStep, on, setOn, total } = wt;
  if (!on) {
    return html`<div class="row"><${Button} variant="primary" sm onClick=${() => setOn(true)}>
      <span class="row" style="gap:6px"><${Icon} name="play" size=${15}/> Start guided walkthrough</span></${Button}>
      <span class="tiny muted">or explore the controls yourself</span></div>`;
  }
  const pct = Math.round(((step + 1) / total) * 100);
  return html`
    <div class="walk">
      <div class="walk-head">
        <span class="walk-title"><${Icon} name="play" size=${16}/> Walkthrough: ${title}</span>
        <${Pill} variant="info">Step ${step + 1} of ${total}</${Pill}>
        <span class="spacer"></span>
        <${Button} sm onClick=${() => setStep((s) => s - 1)} disabled=${step === 0}>‹ Prev</${Button}>
        <${Button} sm variant="primary" onClick=${() => setStep((s) => s + 1)} disabled=${step === total - 1}>Next ›</${Button}>
        <${Button} sm onClick=${() => setOn(false)}>Exit</${Button}>
      </div>
      <div class="walk-body"><b>${steps[step].title}.</b> ${steps[step].body}</div>
      <div class="progress"><div class="progress-fill" style=${"width:" + pct + "%"}></div></div>
    </div>`;
}

/* ---------------- sandboxed XSS runner ----------------
   Renders untrusted markup inside an isolated <iframe sandbox="allow-scripts">.
   Nothing it does can touch the parent page's DOM, cookies or origin. We detect
   *actual* execution (not a string match) by overriding alert/print inside the
   frame and listening for a postMessage. That is why the banner here is honest:
   it only lights up when code really ran. */
export function SandboxRunner({ markup, onFire }) {
  const ref = useRef(null);
  useEffect(() => {
    const token = "xss-" + Math.random().toString(36).slice(2);
    const onMsg = (e) => {
      if (e.data && e.data.__token === token && e.data.type === "fired" && onFire) onFire(e.data.how);
    };
    window.addEventListener("message", onMsg);
    const T = JSON.stringify(token);
    const M = JSON.stringify(String(markup == null ? "" : markup));
    const srcdoc = `<!doctype html><html><head><meta charset="utf-8">
      <style>body{font:14px system-ui,sans-serif;margin:8px;color:#0f172a}</style>
      <script>
        var T=${T};
        function fire(how){parent.postMessage({__token:T,type:"fired",how:how},"*");}
        window.alert=function(m){fire("alert("+String(m)+")");};
        window.prompt=function(){fire("prompt");return "";};
        window.confirm=function(){fire("confirm");return true;};
        window.onerror=function(){fire("script error");};
      <\/script></head><body><div id="out"></div>
      <script>
        try{document.getElementById("out").innerHTML=${M};}
        catch(e){fire("exception");}
      <\/script></body></html>`;
    if (ref.current) ref.current.srcdoc = srcdoc;
    return () => window.removeEventListener("message", onMsg);
  }, [markup]);
  return html`<iframe class="sandbox" ref=${ref} sandbox="allow-scripts"
    title="Sandboxed untrusted output" aria-label="Sandboxed rendering of untrusted input"></iframe>`;
}

/* HTML-escape helper (used by the SAFE paths that show escaping). */
export const escapeHTML = (s) =>
  String(s == null ? "" : s)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
