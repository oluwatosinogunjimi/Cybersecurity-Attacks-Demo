// A08:2025 — Software or Data Integrity Failures (real ECDSA via Web Crypto)
import {
  html, useState, useEffect,
  Card, SectionTitle, Pill, Button, Field, Switch, Banner, Icon, CodeBlock,
  Walkthrough, useWalkthrough,
} from "../ui.js";

const ORIGINAL = 'applyUpdate("v1.2.0"); // signed by vendor';
const enc = new TextEncoder();

function Demo() {
  const [keyPair, setKeyPair] = useState(null);
  const [sig, setSig] = useState(null);           // signature over ORIGINAL
  const [payload, setPayload] = useState(ORIGINAL);
  const [verify, setVerify] = useState(false);
  const [validSig, setValidSig] = useState(true);
  const [applied, setApplied] = useState(null);

  // Vendor generates a key and signs the genuine update once.
  useEffect(() => {
    (async () => {
      const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, false, ["sign", "verify"]);
      const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, kp.privateKey, enc.encode(ORIGINAL));
      setKeyPair(kp); setSig(signature);
    })();
  }, []);

  // Client re-verifies the signature against whatever payload is present now.
  useEffect(() => {
    (async () => {
      if (!keyPair || !sig) return;
      const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, keyPair.publicKey, sig, enc.encode(payload));
      setValidSig(ok);
    })();
  }, [payload, keyPair, sig]);

  const tampered = payload !== ORIGINAL;
  const apply = () => {
    if (verify && !validSig) { setApplied({ ok: true, ran: false, msg: "Signature check FAILED — update rejected, nothing ran." }); return; }
    setApplied({ ok: !tampered, ran: true, msg: tampered ? "Unverified update applied — attacker's code executed on every client." : "Genuine update applied." });
  };

  const steps = [
    { title: "A signed auto-update", body: html`The vendor signs each update with a private key; clients hold the public key. This update's signature is real — generated just now with ECDSA P-256 in your browser.`,
      apply: () => { setVerify(false); setPayload(ORIGINAL); setApplied(null); } },
    { title: "Tamper with it", body: html`An attacker on the update channel rewrites the payload. Edit the code box — add something malicious. The live signature check below flips to ${html`<b>invalid</b>`} immediately.`,
      apply: () => { setVerify(false); setPayload('applyUpdate("v1.2.0"); exfiltrate(localStorage); // injected'); setApplied(null); } },
    { title: "No verification = compromise", body: html`With verification ${html`<b>off</b>`}, the client applies whatever it receives. Press Apply — the tampered code runs. This is how unsigned updates and insecure deserialization lead to mass compromise.`,
      apply: () => { setVerify(false); setApplied(null); } },
    { title: "The fix: verify before trusting", body: html`Turn verification on and apply again. The signature no longer matches the tampered bytes, so the update is rejected before anything executes.`,
      apply: () => { setVerify(true); setApplied(null); } },
  ];
  const wt = useWalkthrough(steps);

  if (!keyPair) return html`<${Card}><span class="muted">Generating a signing key…</span></${Card}>`;

  return html`
    <div class="stack">
      <${SectionTitle}>Software &amp; Data Integrity Failures</${SectionTitle}>
      <${Walkthrough} wt=${wt} steps=${steps} title="Trusting an update you never verified"/>

      <div class="grid grid-2">
        <${Card} title="Update payload (attacker-editable channel)" icon="file">
          <label class="label"><span>Update code the client received</span>
            <textarea class="input mono" style="min-height:90px" onInput=${(e) => setPayload(e.target.value)}>${payload}</textarea>
          </label>
          <div class="row">
            <${Button} sm onClick=${() => setPayload(ORIGINAL)}>Restore genuine</${Button}>
            <${Button} sm onClick=${() => setPayload('applyUpdate("v1.2.0"); exfiltrate(localStorage); // injected')}>Tamper</${Button}>
            <span class="spacer"></span>
            <${Switch} checked=${verify} onChange=${setVerify}>Verify signature</${Switch}>
          </div>
          <div class="row">
            <${Pill} variant=${validSig ? "success" : "danger"}>signature ${validSig ? "valid" : "INVALID"}</${Pill}>
            ${tampered && html`<${Pill} variant="warning">payload modified</${Pill}>`}
            <span class="spacer"></span>
            <${Button} variant="primary" sm onClick=${apply}>Apply update</${Button}>
          </div>
        </${Card}>

        <${Card} title="Client" icon=${applied && !applied.ran ? "shield" : "server"}>
          ${!applied && html`<p class="muted">Press <b>Apply update</b> to see what the client does.</p>`}
          ${applied && html`<${Banner} variant=${!applied.ran ? "success" : applied.ok ? "success" : "danger"}
             title=${!applied.ran ? "Rejected" : applied.ok ? "Applied safely" : "Compromised"}>${applied.msg}</${Banner}>`}
          <div class="tiny muted">Verification uses <code class="code">crypto.subtle.verify</code> with a real ECDSA P-256 key pair — not a simulated check.</div>
        </${Card}>
      </div>

      <${Card} title="How to prevent it" icon="shield">
        <ul class="ticks">
          <li>Verify <b>digital signatures</b> on updates, packages and critical data before trusting them.</li>
          <li>Never deserialize untrusted data into live objects; use safe formats and schema validation.</li>
          <li>Protect your CI/CD pipeline and build integrity; pin and verify what you ship.</li>
          <li>Use Subresource Integrity for third-party scripts loaded in the browser.</li>
        </ul>
      </${Card}>
    </div>`;
}

export default {
  id: "a08", code: "A08:2025", icon: "file",
  title: "Software & Data Integrity Failures",
  blurb: "Tamper with a signed auto-update and watch a real ECDSA signature check catch it — once you actually verify before applying.",
  Component: Demo,
};
