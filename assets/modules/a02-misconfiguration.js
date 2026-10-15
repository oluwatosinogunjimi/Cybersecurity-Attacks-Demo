// A02:2025 — Security Misconfiguration
import {
  html, useState, useMemo,
  Card, SectionTitle, Pill, Button, Switch, Banner, Icon, Walkthrough, useWalkthrough,
} from "../ui.js";

const FLAGS = [
  { key: "dirListing", label: "Directory listing enabled",
    expos:  "GET /  →  200: lists .env, backup.sql, .git/  (source & secrets browsable)",
    safe:   "GET /  →  403 Forbidden  (no autoindex)" },
  { key: "verboseErrors", label: "Verbose stack traces to users",
    expos:  "500 error returns a full stack trace incl. DB host, username and query",
    safe:   "500 error returns a generic message; details go to server logs only" },
  { key: "defaultCreds", label: "Default admin credentials left in place",
    expos:  "login admin / admin  →  200 authenticated as administrator",
    safe:   "default account removed; admin login requires a provisioned credential" },
  { key: "debugMode", label: "Debug mode on in production",
    expos:  "/__debug__ exposes config, SECRET_KEY and an interactive console",
    safe:   "debug endpoints disabled; SECRET_KEY read from the environment" },
  { key: "corsWildcard", label: "CORS: Access-Control-Allow-Origin: *",
    expos:  "any website can read authenticated API responses in a victim's browser",
    safe:   "CORS limited to the app's own trusted origins" },
];

function Demo() {
  const [on, setOn] = useState({ dirListing: true, verboseErrors: true, defaultCreds: true, debugMode: true, corsWildcard: true });
  const set = (k, v) => setOn((s) => ({ ...s, [k]: v }));
  const allOff = () => setOn({ dirListing: false, verboseErrors: false, defaultCreds: false, debugMode: false, corsWildcard: false });
  const allOn = () => setOn({ dirListing: true, verboseErrors: true, defaultCreds: true, debugMode: true, corsWildcard: true });

  const openCount = useMemo(() => FLAGS.filter((f) => on[f.key]).length, [on]);
  const score = Math.round(((FLAGS.length - openCount) / FLAGS.length) * 100);

  const steps = [
    { title: "A fresh install, untouched", body: html`This server ships with every convenience flag left on — the default state of far too many deployments. Five findings are open.`,
      apply: allOn },
    { title: "Read what the attacker reads", body: html`Each open flag has a concrete consequence on the right. Directory listing alone exposes ${html`<code class="code">.env</code>`} and ${html`<code class="code">.git</code>`}.`,
      apply: allOn },
    { title: "Harden one layer", body: html`Turn off verbose errors and default credentials. The hardening score climbs; two doors close.`,
      apply: () => setOn({ dirListing: true, verboseErrors: false, defaultCreds: false, debugMode: true, corsWildcard: true }) },
    { title: "Secure baseline", body: html`Turn everything off. This is the posture a hardening checklist (and CIS benchmarks) should enforce automatically in your build pipeline, not by hand.`,
      apply: allOff },
  ];
  const wt = useWalkthrough(steps);

  return html`
    <div class="stack">
      <${SectionTitle}>Security Misconfiguration</${SectionTitle}>
      <${Walkthrough} wt=${wt} steps=${steps} title="From default install to hardened baseline"/>

      <${Card} title="Server configuration" icon="gear">
        <div class="row"><${Pill} variant=${score === 100 ? "success" : score >= 60 ? "warning" : "danger"}>Hardening score: ${score}%</${Pill}>
          <${Pill} variant=${openCount ? "danger" : "success"}>${openCount} open finding${openCount === 1 ? "" : "s"}</${Pill}>
          <span class="spacer"></span>
          <${Button} sm onClick=${allOff}>Harden all</${Button}>
          <${Button} sm onClick=${allOn}>Reset to defaults</${Button}>
        </div>
        <div class="stack-sm">
          ${FLAGS.map((f) => html`<div class="row"><${Switch} checked=${on[f.key]} onChange=${(v) => set(f.key, v)}>${f.label}</${Switch}></div>`)}
        </div>
      </${Card}>

      <${Card} title="What this exposes right now" icon="eye">
        <div class="stack-sm">
          ${FLAGS.map((f) => html`
            <div class=${"banner " + (on[f.key] ? "banner--danger" : "banner--success")}>
              <${Icon} name=${on[f.key] ? "alert" : "check"} cls="ico"/>
              <div><strong>${f.label}</strong><p>${on[f.key] ? f.expos : f.safe}</p></div>
            </div>`)}
        </div>
      </${Card}>

      <${Card} title="How to prevent it" icon="shield">
        <ul class="ticks">
          <li>Automate a hardened baseline; treat configuration as code and test it in CI.</li>
          <li>Remove or disable unused features, default accounts, sample apps and debug endpoints.</li>
          <li>Return generic errors to users; keep stack traces in server-side logs.</li>
          <li>Set security headers and a least-permissive CORS policy; review them per environment.</li>
        </ul>
      </${Card}>
    </div>`;
}

export default {
  id: "a02", code: "A02:2025", icon: "gear",
  title: "Security Misconfiguration",
  blurb: "Flip the convenience flags a default install leaves on and watch each one expose secrets — then harden to a clean baseline.",
  Component: Demo,
};
