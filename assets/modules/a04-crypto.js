// A04:2025 — Cryptographic Failures (real SHA-256 via Web Crypto)
import {
  html, useState, useEffect, useMemo,
  Card, SectionTitle, Pill, Button, Field, Switch, Banner, DataTable, Icon,
  Walkthrough, useWalkthrough,
} from "../ui.js";

async function sha256hex(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const COMMON = ["123456", "password", "password123", "qwerty", "letmein", "winter2024"];

function Demo() {
  const [pw, setPw] = useState("password123");
  const [scheme, setScheme] = useState("plaintext"); // plaintext | sha | salted | slow
  const [rainbow, setRainbow] = useState({});        // precomputed sha256 of common passwords

  useEffect(() => {
    (async () => {
      const t = {};
      for (const c of COMMON) t[await sha256hex(c)] = c;
      setRainbow(t);
    })();
  }, []);

  // Two users who happen to choose the SAME password, to expose the leak.
  const [stored, setStored] = useState({ alice: "", mallory: "", aliceSalt: "", malSalt: "" });
  useEffect(() => {
    (async () => {
      const aliceSaltV = "a1b2c3", malSaltV = "z9y8x7";
      setStored({
        alice:   scheme === "plaintext" ? pw : scheme === "salted" || scheme === "slow" ? await sha256hex(aliceSaltV + pw) : await sha256hex(pw),
        mallory: scheme === "plaintext" ? pw : scheme === "salted" || scheme === "slow" ? await sha256hex(malSaltV + pw)   : await sha256hex(pw),
        aliceSalt: aliceSaltV, malSalt: malSaltV,
      });
    })();
  }, [pw, scheme]);

  const unsaltedCracked = (scheme === "sha") && rainbow[stored.alice];
  const identical = (scheme === "plaintext" || scheme === "sha") && stored.alice && stored.alice === stored.mallory;

  const short = (h) => (h && h.length > 24 ? h.slice(0, 24) + "…" : h);
  const rows = [
    ["alice", scheme === "plaintext" ? stored.alice : short(stored.alice), scheme === "salted" || scheme === "slow" ? stored.aliceSalt : "—"],
    ["mallory", scheme === "plaintext" ? stored.mallory : short(stored.mallory), scheme === "salted" || scheme === "slow" ? stored.malSalt : "—"],
  ];

  const steps = [
    { title: "Plaintext: one breach, total loss", body: html`Store passwords as-is and a single database leak hands every credential to the attacker. Note alice and mallory's rows are identical because they chose the same password.`,
      apply: () => { setScheme("plaintext"); setPw("password123"); } },
    { title: "Unsalted hash isn't enough", body: html`Switch to a plain SHA-256. It looks scrambled, but it's deterministic: identical passwords still produce identical hashes, and common ones are cracked instantly from a precomputed table.`,
      apply: () => { setScheme("sha"); setPw("password123"); } },
    { title: "See it cracked", body: html`"password123" is in the attacker's lookup table, so its hash reverses in one step. Change it to something unusual and the instant-crack banner disappears — but a determined attacker still grinds offline.`,
      apply: () => { setScheme("sha"); setPw("password123"); } },
    { title: "Salt makes hashes unique", body: html`Add a unique random salt per user. Now alice and mallory's stored hashes differ even for the same password, and one precomputed table can't cover everyone.`,
      apply: () => { setScheme("salted"); setPw("password123"); } },
    { title: "Use a slow, salted KDF", body: html`The real standard: a deliberately slow, memory-hard algorithm (bcrypt, scrypt, Argon2) with a unique salt. Slowness is the feature — it throttles offline guessing to a crawl.`,
      apply: () => { setScheme("slow"); setPw("password123"); } },
  ];
  const wt = useWalkthrough(steps);

  const schemeLabel = { plaintext: "Plaintext (never)", sha: "SHA-256, unsalted (weak)", salted: "SHA-256 + per-user salt", slow: "Argon2/bcrypt-style (salted + slow)" }[scheme];

  return html`
    <div class="stack">
      <${SectionTitle}>Cryptographic Failures</${SectionTitle}>
      <${Walkthrough} wt=${wt} steps=${steps} title="How to store a password, step by step"/>

      <div class="grid grid-2">
        <${Card} title="Registration" icon="key">
          <${Field} label="Password both users choose" value=${pw} onInput=${setPw} mono/>
          <div class="label"><span>Storage scheme</span></div>
          <div class="row">
            ${[["plaintext","Plaintext"],["sha","SHA-256"],["salted","Salted"],["slow","Slow KDF"]].map(([k,l]) =>
              html`<${Button} sm variant=${scheme === k ? "primary" : null} onClick=${() => setScheme(k)}>${l}</${Button}>`)}
          </div>
          <${Pill} variant=${scheme === "slow" ? "success" : scheme === "salted" ? "warning" : "danger"}>${schemeLabel}</${Pill}>
        </${Card}>

        <${Card} title="What lands in the breach dump" icon="database">
          <${DataTable} columns=${["user", "stored value", "salt"]} rows=${rows}
            rowClass=${() => identical ? "hit-danger" : ""}/>
          ${scheme === "plaintext" && html`<${Banner} variant="danger" title="Passwords stored in the clear">Every account is compromised the moment this table leaks.</${Banner}>`}
          ${unsaltedCracked && html`<${Banner} variant="danger" title="Reversed instantly">This hash matches a precomputed entry for "${rainbow[stored.alice]}" — no cracking effort needed.</${Banner}>`}
          ${scheme === "sha" && !unsaltedCracked && html`<${Banner} variant="warning" title="Deterministic & unsalted">Identical passwords share a hash, and offline guessing is fast. Not safe for storage.</${Banner}>`}
          ${scheme === "salted" && html`<${Banner} variant="warning" title="Salt added">Hashes now differ per user, but SHA-256 is still fast to guess. Prefer a slow KDF.</${Banner}>`}
          ${scheme === "slow" && html`<${Banner} variant="success" title="Salted + slow">Unique salts plus a deliberately slow function make large-scale cracking impractical.</${Banner}>`}
        </${Card}>
      </div>

      <${Card} title="How to prevent it" icon="shield">
        <ul class="ticks">
          <li>Store passwords with a <b>slow, salted KDF</b> — Argon2id, scrypt or bcrypt. Never plaintext, MD5 or unsalted SHA.</li>
          <li>Encrypt sensitive data at rest and <b>in transit</b> (TLS everywhere); don't invent your own crypto.</li>
          <li>Use authenticated encryption (AES-GCM) and vetted libraries; avoid ECB and hard-coded keys/IVs.</li>
          <li>Classify data so you know what must be encrypted in the first place.</li>
        </ul>
      </${Card}>
    </div>`;
}

export default {
  id: "a04", code: "A04:2025", icon: "lock",
  title: "Cryptographic Failures",
  blurb: "Store the same password four ways with a real SHA-256 engine and watch a plaintext or unsalted hash fall apart.",
  Component: Demo,
};
