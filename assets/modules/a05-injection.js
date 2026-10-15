// A05:2025 — Injection (SQL injection, with a real SQLite engine)
import {
  html, useState, useEffect, useMemo,
  Card, SectionTitle, Pill, Button, InlineCode, CodeBlock, Field, Switch,
  Banner, FlowStep, FlowArrow, DataTable, Icon, Walkthrough, useWalkthrough, escapeHTML,
} from "../ui.js";
import { SandboxRunner } from "../ui.js";
import { freshUsersDb, runSql } from "../db.js";

// Run a parameterized (safe) query with real bound parameters.
function runParam(db, sql, params) {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    let columns = [];
    while (stmt.step()) {
      columns = stmt.getColumnNames();
      rows.push(stmt.get());
    }
    stmt.free();
    return { columns, rows, error: null };
  } catch (e) {
    return { columns: [], rows: [], error: String(e.message || e) };
  }
}

function highlight(sql) {
  let s = escapeHTML(sql);
  s = s.replace(/\b(SELECT|FROM|WHERE|AND|OR|INSERT|INTO|VALUES|UPDATE|SET|DELETE|UNION|LIMIT)\b/gi,
    (m) => `<span class="kw">${m}</span>`);
  s = s.replace(/(--.*$)/gm, (m) => `<span class="inj">${m}</span>`);
  s = s.replace(/(\bOR\b\s+1\s*=\s*1)/gi, (m) => `<span class="inj">${m}</span>`);
  return s;
}

function SqliDemo() {
  const [db, setDb] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usePrepared, setUsePrepared] = useState(false);

  useEffect(() => { freshUsersDb().then(setDb); }, []);

  const naiveSQL = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}';`;
  const preparedSQL = `SELECT * FROM users WHERE username = ? AND password = ?;`;

  const result = useMemo(() => {
    if (!db) return null;
    return usePrepared
      ? runParam(db, preparedSQL, [username, password])
      : runSql(db, naiveSQL);
  }, [db, username, password, usePrepared]);

  const authed = !!(result && !result.error && result.rows.length > 0);
  const errored = !!(result && result.error);
  const httpStatus = errored ? 500 : authed ? 200 : 401;
  const isAttack = !usePrepared && authed && username !== "alice" && username !== "" &&
    /('|--|\bOR\b)/i.test(username + password);

  const steps = [
    { title: "The setup", body: html`A login form builds a SQL query from your input. On the vulnerable path the input is pasted straight into the query string. Watch the ${html`<b>Query sent to the database</b>`} panel change as you type.`,
      apply: () => { setUsePrepared(false); setUsername(""); setPassword(""); } },
    { title: "A normal login", body: html`Legit credentials — ${html`<code class="code">alice / password123</code>`} — return exactly one row. Nothing unusual yet.`,
      apply: () => { setUsePrepared(false); setUsername("alice"); setPassword("password123"); } },
    { title: "Why the textbook payload fails", body: html`The classic ${html`<code class="code">' OR '1'='1</code>`} in the username does ${html`<b>not</b>`} log you in here, because ${html`<code class="code">AND</code>`} binds tighter than ${html`<code class="code">OR</code>`}. Real databases follow precedence — a string-matching "simulator" would get this wrong.`,
      apply: () => { setUsePrepared(false); setUsername("' OR '1'='1"); setPassword("anything"); } },
    { title: "A payload that really works", body: html`Comment out the rest of the query with ${html`<code class="code">--</code>`}: the password check is discarded and every row returns. You are now logged in as the first user.`,
      apply: () => { setUsePrepared(false); setUsername("' OR 1=1 --"); setPassword("x"); } },
    { title: "Error-based leakage", body: html`A lone quote breaks the syntax. The raw engine error you see is exactly what a misconfigured server might leak to an attacker — a reconnaissance gift.`,
      apply: () => { setUsePrepared(false); setUsername("'"); setPassword("x"); } },
    { title: "The fix: bound parameters", body: html`Turn on prepared statements and retry the same payload. The input is sent to the engine as ${html`<b>data</b>`}, never parsed as SQL, so the attack collapses to a failed login. This is the real fix — not input blacklisting.`,
      apply: () => { setUsePrepared(true); setUsername("' OR 1=1 --"); setPassword("x"); } },
  ];
  const wt = useWalkthrough(steps);

  if (!db) return html`<${Card}><div class="row"><${Icon} name="database"/><span class="muted">Loading the in-browser SQLite engine…</span></div></${Card}>`;

  return html`
    <div class="stack">
      <${SectionTitle}>SQL Injection — live SQLite engine</${SectionTitle}>
      <${Walkthrough} wt=${wt} steps=${steps} title="From a working exploit to the real fix"/>

      <${Card} title="Request flow" icon="route">
        <div class="flow">
          <${FlowStep} step=${1} icon="globe" title="Input" status=${isAttack ? "danger" : "neutral"}
            desc=${username || password ? `user: ${username || "∅"}` : "waiting for input…"}/>
          <${FlowArrow}/>
          <${FlowStep} step=${2} icon="server" title="Server" status=${usePrepared ? "safe" : isAttack ? "danger" : "neutral"}
            desc=${usePrepared ? "binds parameters" : "concatenates a string"}/>
          <${FlowArrow}/>
          <${FlowStep} step=${3} icon="database" title="SQLite" status=${isAttack ? "danger" : authed ? "safe" : "neutral"}
            desc=${errored ? "syntax error" : authed ? `${result.rows.length} row(s)` : "no match"}/>
        </div>
        ${isAttack && html`<${Banner} variant="danger" title="Authentication bypassed by injection">The payload changed the query's logic, so the database returned rows it never should have.</${Banner}>`}
        ${usePrepared && (username || password) && html`<${Banner} variant="success" title="Parameterized query">Your input is bound as data. Even injection payloads are treated as a literal username.</${Banner}>`}
      </${Card}>

      <div class="grid grid-2">
        <${Card} title="Login form" icon="globe">
          <${Field} label="Username" value=${username} onInput=${setUsername} mono placeholder="alice  or  ' OR 1=1 --"/>
          <${Field} label="Password" value=${password} onInput=${setPassword} mono placeholder="password123 or anything"/>
          <div class="row">
            <${Button} sm onClick=${() => { setUsername("alice"); setPassword("password123"); }}>Prefill valid</${Button}>
            <${Button} sm onClick=${() => { setUsername("' OR 1=1 --"); setPassword("x"); }}>Prefill injection</${Button}>
            <${Button} sm onClick=${() => { setUsername(""); setPassword(""); }}>Reset</${Button}>
            <span class="spacer"></span>
            <${Switch} checked=${usePrepared} onChange=${setUsePrepared}>Prepared statements</${Switch}>
          </div>
        </${Card}>

        <${Card} title=${usePrepared ? "Server — SAFE (parameterized)" : "Server — VULNERABLE (concatenated)"} icon="server">
          ${usePrepared
            ? html`<div class="stack-sm">
                <div class="muted tiny">Query template (input never inlined):</div>
                <${CodeBlock} code=${preparedSQL + "\nparams: " + JSON.stringify([username, password])}/>
              </div>`
            : html`<div class="stack-sm">
                <div class="muted tiny">Query string actually sent:</div>
                <${CodeBlock} htmlCode=${highlight(naiveSQL)}/>
              </div>`}
          <div class="row">
            <${Pill} variant=${httpStatus === 200 ? (isAttack ? "danger" : "success") : httpStatus === 401 ? "warning" : "danger"}>HTTP ${httpStatus}</${Pill}>
            <span class="tiny">${errored ? result.error : authed ? "Authenticated" : "Invalid credentials"}</span>
          </div>
        </${Card}>
      </div>

      <${Card} title="Rows the database returned" icon="database">
        ${result && result.error
          ? html`<${Banner} variant="warning" title="Engine error leaked to the client">${result.error}</${Banner}>`
          : html`<${DataTable} columns=${result.columns} rows=${result.rows}
              rowClass=${(r) => r[3] === "admin" && isAttack ? "hit-danger" : ""}/>`}
        <p class="tiny muted">This is a real SQLite query result, not a scripted guess. Passwords are shown in the clear only because this is a teaching sandbox — see the Cryptographic Failures module for why you would never store them this way.</p>
      </${Card}>

      <${Card} title="How to prevent it" icon="shield">
        <ul class="ticks">
          <li><b>Parameterized queries / prepared statements</b> everywhere user input meets a query. This is the primary control.</li>
          <li>Use an ORM's safe query builder, or stored procedures that don't build dynamic SQL from input.</li>
          <li>Least-privilege DB accounts, and never return raw engine errors to users.</li>
          <li>Input validation and allow-lists are defense-in-depth, <em>not</em> a substitute for parameterization.</li>
        </ul>
      </${Card}>
    </div>`;
}

/* ---------------- Cross-site scripting (DOM-based) ---------------- */
function XssDemo() {
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [runUntrusted, setRunUntrusted] = useState(false);
  const [fired, setFired] = useState(null);

  // Any change to input or mode invalidates a previous "fired" observation.
  useEffect(() => { setFired(null); }, [name, comment, runUntrusted]);

  const markup = `<b>${name || "(no name)"}</b>: ${comment || "(no comment)"}`;
  const safeText = `${name || "(no name)"}: ${comment || "(no comment)"}`;

  const steps = [
    { title: "Escaping vs. executing", body: html`A comment box echoes your input back onto the page. The question is whether the browser treats it as ${html`<b>text</b>`} or as ${html`<b>markup</b>`}. Start on the SAFE renderer.`,
      apply: () => { setRunUntrusted(false); setName(""); setComment(""); } },
    { title: "Friendly input", body: html`Ordinary text renders fine on the safe path. Output encoding turns characters like ${html`<code class="code">&lt;</code>`} into harmless entities.`,
      apply: () => { setRunUntrusted(false); setName("Charlie"); setComment("Great lesson, thanks!"); } },
    { title: "A payload, still safe", body: html`Load an ${html`<code class="code">&lt;img onerror&gt;</code>`} payload. On the SAFE renderer it shows as literal text — the banner stays quiet because nothing executed.`,
      apply: () => { setRunUntrusted(false); setName("<b>Visitor</b>"); setComment("<img src=x onerror=alert('XSS')>"); } },
    { title: "Now let it run", body: html`Flip to the VULNERABLE renderer. The same payload executes — but only inside a ${html`<b>sandboxed iframe</b>`}, isolated from this page. The banner lights up only because code genuinely ran.`,
      apply: () => { setRunUntrusted(true); setName("<b>Visitor</b>"); setComment("<img src=x onerror=alert('XSS')>"); } },
    { title: "Defense in depth", body: html`Encode on output by context; if rich text is required, sanitize with a vetted library (DOMPurify); and add a Content-Security-Policy so an injected script still can't run.`,
      apply: () => { setRunUntrusted(false); setName("<b>Visitor</b>"); setComment("<img src=x onerror=alert('XSS')>"); } },
  ];
  const wt = useWalkthrough(steps);

  return html`
    <div class="stack">
      <${Walkthrough} wt=${wt} steps=${steps} title="DOM-based XSS, demonstrated safely"/>
      <${Banner} variant="info" title="This is DOM-based XSS">Input reaches an <code class="code">innerHTML</code> sink in the browser with no server round-trip. The unsafe output runs in an isolated sandbox, so your real page is never at risk.</${Banner}>

      <div class="grid grid-2">
        <${Card} title="Comment form" icon="globe">
          <${Field} label="Display name" value=${name} onInput=${setName} mono placeholder="Alex  or  <b>Alex</b>"/>
          <${Field} label="Comment" value=${comment} onInput=${setComment} mono placeholder="a message, or an HTML tag"/>
          <div class="row">
            <${Button} sm onClick=${() => { setName("Charlie"); setComment("Great lesson, thanks!"); }}>Prefill friendly</${Button}>
            <${Button} sm onClick=${() => { setName("<b>Visitor</b>"); setComment("<img src=x onerror=alert('XSS')>"); }}>Prefill payload</${Button}>
            <${Button} sm onClick=${() => { setName(""); setComment(""); }}>Reset</${Button}>
            <span class="spacer"></span>
            <${Switch} checked=${runUntrusted} onChange=${setRunUntrusted}>Run untrusted HTML</${Switch}>
          </div>
        </${Card}>

        <${Card} title=${runUntrusted ? "Renderer — VULNERABLE (innerHTML)" : "Renderer — SAFE (text)"} icon=${runUntrusted ? "unlock" : "lock"}>
          ${runUntrusted
            ? html`<div class="stack-sm">
                <div class="tiny muted">Rendered via <code class="code">innerHTML</code> inside a sandboxed iframe:</div>
                <${SandboxRunner} markup=${markup} onFire=${(how) => setFired(how)}/>
                ${fired
                  ? html`<${Banner} variant="danger" title="Script executed">A handler ran in the sandbox: <code class="code">${fired}</code>. In a real app without the sandbox, this would run in the victim's session.</${Banner}>`
                  : html`<${Banner} variant="warning" title="Rendered as live HTML">Nothing has executed yet. Load a payload with an event handler (e.g. <code class="code">onerror</code>) to trigger it.</${Banner}>`}
              </div>`
            : html`<div class="stack-sm">
                <div class="tiny muted">Rendered as escaped text:</div>
                <div class="input" style="min-height:90px; white-space:pre-wrap">${safeText}</div>
                <${Banner} variant="success" title="Inert">Markup is shown as literal characters; no script can run.</${Banner}>
              </div>`}
        </${Card}>
      </div>

      <${Card} title="How to prevent it" icon="shield">
        <ul class="ticks">
          <li><b>Context-aware output encoding</b> — the framework default. In React/Preact, render <code class="code">{value}</code> instead of <code class="code">dangerouslySetInnerHTML</code>.</li>
          <li>If HTML is genuinely needed, sanitize with a maintained library such as DOMPurify.</li>
          <li>Add a <b>Content-Security-Policy</b> to blunt the impact of anything that slips through.</li>
        </ul>
      </${Card}>
    </div>`;
}

/* ---------------- wrapper: SQLi + XSS live under Injection ---------------- */
function Demo() {
  const [sub, setSub] = useState("sqli");
  return html`
    <div class="stack">
      <div class="row" role="tablist" aria-label="Injection sub-demos">
        <${Button} variant=${sub === "sqli" ? "primary" : null} onClick=${() => setSub("sqli")}>SQL injection</${Button}>
        <${Button} variant=${sub === "xss" ? "primary" : null} onClick=${() => setSub("xss")}>Cross-site scripting</${Button}>
      </div>
      ${sub === "sqli" ? html`<${SqliDemo}/>` : html`<${XssDemo}/>`}
    </div>`;
}

export default {
  id: "a05", code: "A05:2025", icon: "bug",
  title: "Injection",
  blurb: "Bypass a login against a real SQLite engine, then fire a sandboxed XSS payload — and fix both. XSS now sits under Injection in the 2025 list.",
  Component: Demo,
};
