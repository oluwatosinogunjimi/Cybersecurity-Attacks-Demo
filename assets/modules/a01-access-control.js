// A01:2025 — Broken Access Control (now includes SSRF)
import {
  html, useState,
  Card, SectionTitle, Pill, Button, InlineCode, Field, Switch,
  Banner, FlowStep, FlowArrow, DataTable, Icon, Walkthrough, useWalkthrough,
} from "../ui.js";

const CURRENT_USER = "alice";
const INVOICES = {
  1001: { owner: "alice", amount: "$42.00", note: "Lab notebook" },
  1002: { owner: "bob", amount: "$980.00", note: "Classroom projector" },
  1003: { owner: "admin", amount: "$12,400.00", note: "CONFIDENTIAL — server renewal" },
};

function IdorDemo() {
  const [id, setId] = useState("1001");
  const [enforce, setEnforce] = useState(false);

  const inv = INVOICES[id];
  const owned = inv && inv.owner === CURRENT_USER;
  const blocked = enforce && inv && !owned;
  const leaking = !enforce && inv && !owned;
  const status = !inv ? 404 : blocked ? 403 : 200;

  const steps = [
    { title: "You are alice", body: html`You're logged in as ${html`<b>alice</b>`}, viewing your own invoice ${html`<code class="code">1001</code>`}. The invoice ID travels in the URL.`,
      apply: () => { setEnforce(false); setId("1001"); } },
    { title: "Change the number", body: html`Edit the ID to ${html`<code class="code">1002</code>`} — that's bob's invoice. With no ownership check, the server hands it over. This is an ${html`<b>IDOR</b>`} (insecure direct object reference).`,
      apply: () => { setEnforce(false); setId("1002"); } },
    { title: "Reach the crown jewels", body: html`ID ${html`<code class="code">1003</code>`} is the admin's confidential invoice. Still returned. Access control that relies on users not guessing IDs isn't access control.`,
      apply: () => { setEnforce(false); setId("1003"); } },
    { title: "The fix: check ownership server-side", body: html`Enable the ownership check. The server now compares the record's owner to the session user and returns ${html`<code class="code">403</code>`} for anything that isn't yours.`,
      apply: () => { setEnforce(true); setId("1003"); } },
  ];
  const wt = useWalkthrough(steps);

  return html`
    <div class="stack">
      <${Walkthrough} wt=${wt} steps=${steps} title="Insecure Direct Object Reference"/>
      <${Card} title="Request flow" icon="route">
        <div class="flow">
          <${FlowStep} step=${1} icon="globe" title="alice's browser" status=${leaking ? "danger" : "neutral"} desc=${`GET /invoices/${id}`}/>
          <${FlowArrow}/>
          <${FlowStep} step=${2} icon="server" title="Server" status=${enforce ? "safe" : leaking ? "danger" : "neutral"} desc=${enforce ? "checks owner == session" : "looks up by ID only"}/>
          <${FlowArrow}/>
          <${FlowStep} step=${3} icon="file" title="Record" status=${leaking ? "danger" : blocked ? "safe" : "neutral"} desc=${inv ? `owner: ${inv.owner}` : "not found"}/>
        </div>
      </${Card}>
      <div class="grid grid-2">
        <${Card} title="Request" icon="globe">
          <${Field} label="Invoice ID in the URL" value=${id} onInput=${setId} mono placeholder="1001"/>
          <div class="row">
            ${Object.keys(INVOICES).map((k) => html`<${Button} sm onClick=${() => setId(k)}>${k}</${Button}>`)}
            <span class="spacer"></span>
            <${Switch} checked=${enforce} onChange=${setEnforce}>Enforce ownership</${Switch}>
          </div>
        </${Card}>
        <${Card} title=${enforce ? "Response — SAFE" : "Response — VULNERABLE"} icon="server">
          <div class="row"><${Pill} variant=${status === 200 ? (leaking ? "danger" : "success") : status === 403 ? "success" : "warning"}>HTTP ${status}</${Pill}></div>
          ${!inv && html`<${Banner} variant="warning" title="Not found">No invoice with that ID.</${Banner}>`}
          ${blocked && html`<${Banner} variant="success" title="Access denied">Invoice ${id} belongs to ${inv.owner}; alice may not view it.</${Banner}>`}
          ${inv && !blocked && html`<div class="stack-sm">
            <div class="input"><b>Invoice ${id}</b><br/>Owner: ${inv.owner}<br/>Amount: ${inv.amount}<br/>Note: ${inv.note}</div>
            ${leaking && html`<${Banner} variant="danger" title="Broken access control">alice just read ${inv.owner}'s private invoice by editing a URL.</${Banner}>`}
          </div>`}
        </${Card}>
      </div>
    </div>`;
}

/* ---------------- SSRF ---------------- */
const CLOUD_SECRET = "AKIA…EXAMPLE / session-token (cloud IAM credentials)";
function fakeFetch(url) {
  let u;
  try { u = new URL(url); } catch { return { status: 400, body: "Invalid URL", internal: false }; }
  const host = u.hostname;
  const internal = host === "169.254.169.254" || host === "localhost" || host === "127.0.0.1" || host.startsWith("10.") || host.startsWith("192.168.");
  if (host === "169.254.169.254") return { status: 200, body: CLOUD_SECRET, internal: true };
  if (internal) return { status: 200, body: "Internal admin panel (should never be reachable from user input)", internal: true };
  return { status: 200, body: `Link preview for ${host} — "Welcome to our site"`, internal: false };
}

function SsrfDemo() {
  const [url, setUrl] = useState("https://example.com/article");
  const [allowlist, setAllowlist] = useState(false);

  const res = fakeFetch(url);
  const blocked = allowlist && res.internal;
  const leaking = !allowlist && res.internal;

  const steps = [
    { title: "A link-preview feature", body: html`The server fetches a URL you give it to show a preview. Handy — and dangerous, because the ${html`<b>server</b>`} makes the request, from inside the network.`,
      apply: () => { setAllowlist(false); setUrl("https://example.com/article"); } },
    { title: "Point it inward", body: html`Give it the cloud metadata address ${html`<code class="code">169.254.169.254</code>`}. The server happily fetches it and returns IAM credentials — a classic ${html`<b>SSRF</b>`} to cloud-account takeover.`,
      apply: () => { setAllowlist(false); setUrl("http://169.254.169.254/latest/meta-data/iam/security-credentials/"); } },
    { title: "The fix: allow-list egress", body: html`Enable the allow-list. The fetcher now refuses private, loopback and link-local addresses and only reaches approved public hosts.`,
      apply: () => { setAllowlist(true); setUrl("http://169.254.169.254/latest/meta-data/iam/security-credentials/"); } },
  ];
  const wt = useWalkthrough(steps);

  return html`
    <div class="stack">
      <${Walkthrough} wt=${wt} steps=${steps} title="Server-Side Request Forgery"/>
      <${Banner} variant="info" title="SSRF joined A01 in 2025">Server-Side Request Forgery was its own category in 2021; the 2025 list folds it into Broken Access Control — the server fails to restrict where it may go.</${Banner}>
      <div class="grid grid-2">
        <${Card} title="Preview request" icon="globe">
          <${Field} label="URL to preview" value=${url} onInput=${setUrl} mono/>
          <div class="row">
            <${Button} sm onClick=${() => setUrl("https://example.com/article")}>Public URL</${Button}>
            <${Button} sm onClick=${() => setUrl("http://169.254.169.254/latest/meta-data/iam/security-credentials/")}>Metadata URL</${Button}>
            <span class="spacer"></span>
            <${Switch} checked=${allowlist} onChange=${setAllowlist}>Egress allow-list</${Switch}>
          </div>
        </${Card}>
        <${Card} title=${allowlist ? "Fetcher — SAFE" : "Fetcher — VULNERABLE"} icon="server">
          ${blocked
            ? html`<${Banner} variant="success" title="Blocked by allow-list">Host is private/link-local and not on the approved list. Request refused.</${Banner}>`
            : html`<div class="stack-sm">
                <div class="row"><${Pill} variant=${leaking ? "danger" : "success"}>HTTP ${res.status}</${Pill}></div>
                <div class="input" style="white-space:pre-wrap">${res.body}</div>
                ${leaking && html`<${Banner} variant="danger" title="SSRF succeeded">User input steered the server to an internal resource and exfiltrated it.</${Banner}>`}
              </div>`}
        </${Card}>
      </div>
    </div>`;
}

function Prevent() {
  return html`<${Card} title="How to prevent broken access control" icon="shield">
    <ul class="ticks">
      <li>Deny by default; enforce authorization on the <b>server</b> for every object and action, never by hiding IDs or UI.</li>
      <li>Check record ownership / tenant on each request; don't trust IDs from the client.</li>
      <li>For SSRF: allow-list outbound hosts, block link-local/loopback/private ranges, and require the metadata service's token (IMDSv2).</li>
      <li>Log access-control failures and alert on spikes.</li>
    </ul>
  </${Card}>`;
}

function Demo() {
  const [sub, setSub] = useState("idor");
  return html`
    <div class="stack">
      <${SectionTitle}>Broken Access Control</${SectionTitle}>
      <div class="row" role="tablist">
        <${Button} variant=${sub === "idor" ? "primary" : null} onClick=${() => setSub("idor")}>IDOR</${Button}>
        <${Button} variant=${sub === "ssrf" ? "primary" : null} onClick=${() => setSub("ssrf")}>SSRF</${Button}>
      </div>
      ${sub === "idor" ? html`<${IdorDemo}/>` : html`<${SsrfDemo}/>`}
      <${Prevent}/>
    </div>`;
}

export default {
  id: "a01", code: "A01:2025", icon: "key",
  title: "Broken Access Control",
  blurb: "Read someone else's invoice by editing a URL, and steer a server into fetching cloud secrets (SSRF) — then lock both down.",
  Component: Demo,
};
