// A03:2025 — Software Supply Chain Failures (new, #3)
import {
  html, useState, useMemo,
  Card, SectionTitle, Pill, Button, Switch, Field, Banner, DataTable, Icon,
  Walkthrough, useWalkthrough,
} from "../ui.js";

// A tiny dependency graph. "left-pad-ish" util is the compromised transitive dep.
const TREE = [
  { name: "app", version: "1.0.0", depth: 0, bad: false },
  { name: "chart-lib", version: "^2.4.0", depth: 1, bad: false },
  { name: "color-parse", version: "^1.2.0", depth: 2, bad: true }, // the one that gets hijacked
];
const GOOD = "1.2.3";
const COMPROMISED = "1.2.4"; // registry publishes this with a malicious postinstall

function Demo() {
  const [pinned, setPinned] = useState(false);
  const [integrity, setIntegrity] = useState(false);
  const [pkg, setPkg] = useState("color-parse");
  const [log, setLog] = useState(null);

  // What version resolves depends on pinning; integrity catches a swapped artifact.
  const resolved = pinned ? GOOD : COMPROMISED;
  const typosquat = pkg.trim().toLowerCase() === "color-pars" || pkg.trim().toLowerCase() === "colorparse";

  const install = () => {
    if (typosquat) {
      setLog({ ok: false, kind: "typosquat", msg: `Installed "${pkg}" — a typosquat of "color-parse". Its postinstall script ran and exfiltrated environment variables.` });
      return;
    }
    if (pinned && integrity) {
      setLog({ ok: true, kind: "safe", msg: `Resolved color-parse@${GOOD}. Integrity hash matched the lockfile. Build is reproducible.` });
    } else if (pinned && !integrity) {
      setLog({ ok: true, kind: "pin", msg: `Resolved color-parse@${GOOD} by version, but without an integrity hash a swapped artifact on the registry would go unnoticed.` });
    } else if (!pinned && integrity) {
      setLog({ ok: false, kind: "range", msg: `Range "^1.2.0" pulled the newly published color-parse@${COMPROMISED}; its hash didn't match any pin — but with no lockfile entry there was nothing to compare against. Malicious build installed.` });
    } else {
      setLog({ ok: false, kind: "range", msg: `Range "^1.2.0" silently upgraded to color-parse@${COMPROMISED}. Its postinstall script ran at install time with your developer's privileges.` });
    }
  };

  const steps = [
    { title: "Your lockfile, two ways", body: html`Your app depends on ${html`<code class="code">color-parse</code>`} transitively, via a range ${html`<code class="code">^1.2.0</code>`}. Ranges float; today that means ${html`<code class="code">${GOOD}</code>`}. Click ${html`<b>npm install</b>`}.`,
      apply: () => { setPinned(false); setIntegrity(false); setPkg("color-parse"); setLog(null); } },
    { title: "The maintainer account is hijacked", body: html`An attacker publishes ${html`<code class="code">color-parse@${COMPROMISED}</code>`} with a malicious ${html`<code class="code">postinstall</code>`} script. Install again — your floating range pulls it automatically.`,
      apply: () => { setPinned(false); setIntegrity(false); setPkg("color-parse"); setLog(null); } },
    { title: "Pin the version", body: html`Switch on exact pinning. Install resolves to ${html`<code class="code">${GOOD}</code>`} again — the compromised build is no longer pulled just because it's newer.`,
      apply: () => { setPinned(true); setIntegrity(false); setPkg("color-parse"); setLog(null); } },
    { title: "Add integrity hashes", body: html`Turn on integrity (subresource/lockfile hashes). Now even a swapped artifact at the same version number is rejected. Pinning + integrity = a reproducible, verifiable build.`,
      apply: () => { setPinned(true); setIntegrity(true); setPkg("color-parse"); setLog(null); } },
    { title: "Watch for typosquats too", body: html`Supply-chain risk isn't only version drift. Change the package name to ${html`<code class="code">color-pars</code>`} and install — one missing letter installs an attacker's package outright.`,
      apply: () => { setPinned(true); setIntegrity(true); setPkg("color-pars"); setLog(null); } },
  ];
  const wt = useWalkthrough(steps);

  return html`
    <div class="stack">
      <${SectionTitle}>Software Supply Chain Failures</${SectionTitle}>
      <${Walkthrough} wt=${wt} steps=${steps} title="How a trusted dependency turns hostile"/>
      <${Banner} variant="info" title="New and high in 2025">The 2025 list promotes this to #3, widening 2021's "Vulnerable & Outdated Components" to the whole chain — dependencies, build systems and distribution.</${Banner}>

      <div class="grid grid-2">
        <${Card} title="Install configuration" icon="package">
          <${Field} label="Package to install" value=${pkg} onInput=${setPkg} mono/>
          <div class="row">
            <${Switch} checked=${pinned} onChange=${setPinned}>Pin exact versions</${Switch}>
          </div>
          <div class="row">
            <${Switch} checked=${integrity} onChange=${setIntegrity}>Verify integrity hashes</${Switch}>
            <span class="spacer"></span>
            <${Button} variant="primary" sm onClick=${install}>npm install</${Button}>
          </div>
          <div class="table-wrap">
            <table class="data"><thead><tr><th>dependency</th><th class="mono">version</th></tr></thead>
            <tbody>${TREE.map((d) => html`<tr class=${d.bad && !pinned ? "hit-danger" : ""}>
              <td>${"— ".repeat(d.depth)}${d.name}</td>
              <td class="mono">${d.bad ? (pinned ? GOOD : "^1.2.0 → " + COMPROMISED) : d.version}</td></tr>`)}</tbody></table>
          </div>
        </${Card}>

        <${Card} title="Install result" icon=${log && log.ok ? "shield" : "bug"}>
          ${!log && html`<p class="muted">Configure the install and press <b>npm install</b>.</p>`}
          ${log && html`<${Banner} variant=${log.ok ? "success" : "danger"} title=${log.ok ? "Clean install" : (log.kind === "typosquat" ? "Typosquat installed" : "Compromised build installed")}>${log.msg}</${Banner}>`}
        </${Card}>
      </div>

      <${Card} title="How to prevent it" icon="shield">
        <ul class="ticks">
          <li>Commit a <b>lockfile</b> and install with <code class="code">npm ci</code> (or equivalent) for reproducible, pinned builds.</li>
          <li>Verify <b>integrity hashes</b>; enable signature/provenance checks where the registry supports them.</li>
          <li>Generate an <b>SBOM</b> and scan dependencies continuously for known-vulnerable and yanked versions.</li>
          <li>Run installs with least privilege; be wary of install-time scripts and near-miss package names.</li>
        </ul>
      </${Card}>
    </div>`;
}

export default {
  id: "a03", code: "A03:2025", icon: "package",
  title: "Software Supply Chain Failures",
  blurb: "Let a floating dependency range pull a hijacked build, then stop it with pinning, integrity hashes and typosquat awareness.",
  Component: Demo,
};
