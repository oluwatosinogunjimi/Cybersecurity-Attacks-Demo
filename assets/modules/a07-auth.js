// A07:2025 — Authentication Failures
import {
  html, useState, useEffect, useRef,
  Card, SectionTitle, Pill, Button, Switch, Banner, Icon,
  Walkthrough, useWalkthrough,
} from "../ui.js";

const SECRET_INDEX = 42;            // secret PIN is "0042"
const pad = (n) => String(n).padStart(4, "0");

function Demo() {
  const [lockout, setLockout] = useState(false);
  const [maxAttempts] = useState(5);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | running | cracked | locked
  const timer = useRef(null);

  const stop = () => { if (timer.current) { clearInterval(timer.current); timer.current = null; } };
  useEffect(() => stop, []);

  const run = () => {
    stop();
    setAttempt(0);
    setStatus("running");
    let a = 0;
    timer.current = setInterval(() => {
      a += 1;
      if (lockout && a > maxAttempts) { setAttempt(maxAttempts); setStatus("locked"); stop(); return; }
      setAttempt(a);
      if (a - 1 === SECRET_INDEX) { setStatus("cracked"); stop(); }
    }, 22);
  };
  const reset = () => { stop(); setAttempt(0); setStatus("idle"); };

  const steps = [
    { title: "A 4-digit PIN login", body: html`The login accepts a 4-digit PIN — 10,000 possibilities. With no limit on tries, that's not a secret, it's a short wait. Make sure lockout is ${html`<b>off</b>`} and run the attack.`,
      apply: () => { setLockout(false); reset(); } },
    { title: "Brute-forced", body: html`The attacker walks ${html`<code class="code">0000, 0001, 0002…</code>`} until one works. No throttle, no lockout — the PIN falls in a fraction of a second. Credential stuffing works the same way with leaked passwords.`,
      apply: () => { setLockout(false); reset(); } },
    { title: "Add lockout", body: html`Turn on account lockout (max ${maxAttempts} attempts) and run again. The attack stalls almost immediately — the account locks long before the attacker reaches the real PIN.`,
      apply: () => { setLockout(true); reset(); } },
    { title: "Beyond lockout", body: html`Lockout is one layer. Also require strong, rate-limited credentials, check passwords against breach lists, and offer MFA — and make session tokens unguessable (next card).`,
      apply: () => { setLockout(true); reset(); } },
  ];
  const wt = useWalkthrough(steps);

  const tried = status === "idle" ? 0 : attempt;

  return html`
    <div class="stack">
      <${SectionTitle}>Authentication Failures</${SectionTitle}>
      <${Walkthrough} wt=${wt} steps=${steps} title="Why a 4-digit PIN needs a lockout"/>

      <div class="grid grid-2">
        <${Card} title="Brute-force attacker" icon="bug">
          <div class="row">
            <${Switch} checked=${lockout} onChange=${(v) => { setLockout(v); reset(); }}>Account lockout (max ${maxAttempts})</${Switch}>
          </div>
          <div class="row">
            <${Button} variant="primary" sm onClick=${run} disabled=${status === "running"}>${status === "running" ? "Attacking…" : "Run attack"}</${Button}>
            <${Button} sm onClick=${reset}>Reset</${Button}>
          </div>
          <div class="input center mono" style="font-size:1.6rem; letter-spacing:.3em">${pad(Math.max(0, tried - 1))}</div>
          <div class="center tiny muted">${tried} attempt${tried === 1 ? "" : "s"} made</div>
        </${Card}>

        <${Card} title="Login server" icon="server">
          ${status === "idle" && html`<${Banner} variant="info" title="Idle">Press <b>Run attack</b> to watch the attempts climb.</${Banner}>`}
          ${status === "running" && html`<${Banner} variant="warning" title="Under attack">Guesses are streaming in with no friction.</${Banner}>`}
          ${status === "cracked" && html`<${Banner} variant="danger" title="PIN cracked">Recovered the PIN in ${attempt} attempts. With no lockout, a 4-digit space is trivial.</${Banner}>`}
          ${status === "locked" && html`<${Banner} variant="success" title="Account locked">Locked after ${maxAttempts} failed attempts — the attacker never reached the real PIN.</${Banner}>`}
          <div class="row">
            <${Pill} variant=${status === "cracked" ? "danger" : status === "locked" ? "success" : "info"}>${status === "cracked" ? "Compromised" : status === "locked" ? "Protected" : "Monitoring"}</${Pill}>
          </div>
        </${Card}>
      </div>

      <${Card} title="Bonus: are your session tokens guessable?" icon="key">
        <div class="grid grid-2">
          <div class="banner banner--danger"><${Icon} name="unlock" cls="ico"/><div><strong>Predictable</strong><p class="mono tiny">session=user-1042-0007<br/>next → user-1042-0008</p><p>Sequential IDs let an attacker ride other users' sessions.</p></div></div>
          <div class="banner banner--success"><${Icon} name="lock" cls="ico"/><div><strong>Random (128-bit)</strong><p class="mono tiny">session=${"k7Qf2…"}${Math.random().toString(36).slice(2, 10)}</p><p>Unpredictable tokens can't be guessed or enumerated.</p></div></div>
        </div>
      </${Card}>

      <${Card} title="How to prevent it" icon="shield">
        <ul class="ticks">
          <li>Rate-limit and lock out after repeated failures; add exponential backoff and CAPTCHA on abuse.</li>
          <li>Offer and encourage <b>MFA</b>; check new passwords against known-breached lists.</li>
          <li>Generate long, random session tokens; rotate on login; set <code class="code">HttpOnly</code>/<code class="code">Secure</code> cookies.</li>
          <li>Don't ship default or shared accounts; expire sessions and support revocation.</li>
        </ul>
      </${Card}>
    </div>`;
}

export default {
  id: "a07", code: "A07:2025", icon: "unlock",
  title: "Authentication Failures",
  blurb: "Watch a 4-digit PIN fall to brute force in under a second, then stop the attack cold with account lockout.",
  Component: Demo,
};
