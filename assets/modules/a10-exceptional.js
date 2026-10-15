// A10:2025 — Mishandling of Exceptional Conditions (new)
import {
  html, useState,
  Card, SectionTitle, Pill, Button, Switch, Banner, CodeBlock, Icon,
  Walkthrough, useWalkthrough,
} from "../ui.js";

function Demo() {
  const [failClosed, setFailClosed] = useState(false); // false = fail-open (bad)
  const [fault, setFault] = useState(false);           // entitlement service throws
  const [verbose, setVerbose] = useState(false);       // leak error details
  const [out, setOut] = useState(null);

  const request = () => {
    // The entitlement check throws when the downstream service is faulting.
    if (!fault) { setOut({ granted: true, errored: false, msg: "Entitlement confirmed; access granted to the paid feature." }); return; }
    // An exception happened. What the handler does with it is the whole point.
    if (failClosed) {
      setOut({ granted: false, errored: true, msg: "Entitlement service error — access DENIED (fail-closed)." });
    } else {
      setOut({ granted: true, errored: true, msg: "Entitlement service threw; handler caught it and continued — access GRANTED without a valid check (fail-open)." });
    }
  };

  const steps = [
    { title: "The happy path", body: html`A paid feature checks entitlement with a downstream service. When everything's healthy, legitimate users are allowed. Press ${html`<b>Request access</b>`}.`,
      apply: () => { setFault(false); setFailClosed(false); setVerbose(false); setOut(null); } },
    { title: "Now the check throws", body: html`Inject a fault so the entitlement service errors (timeout, exception, bad response). Request again — the code catches the error and ${html`<b>continues</b>`}, granting access it never verified. That's failing open.`,
      apply: () => { setFault(true); setFailClosed(false); setOut(null); } },
    { title: "Fail closed instead", body: html`Switch the handler to deny on error. Same fault, but now the exceptional path ends in a safe default: access denied. Security decisions must fail closed.`,
      apply: () => { setFault(true); setFailClosed(true); setOut(null); } },
    { title: "Don't leak the error either", body: html`Turn on verbose errors to see the other half: an unhandled exception that spills a stack trace and secrets to the user. Catch, log server-side, and return something generic.`,
      apply: () => { setFault(true); setFailClosed(true); setVerbose(true); setOut(null); } },
  ];
  const wt = useWalkthrough(steps);

  const code = failClosed
    ? `try {\n  if (!checkEntitlement(user)) deny();\n  grant();\n} catch (e) {\n  log(e);\n  deny();           // fail CLOSED\n}`
    : `try {\n  if (!checkEntitlement(user)) deny();\n  grant();\n} catch (e) {\n  // swallowed — falls through\n  grant();           // fail OPEN (bug)\n}`;

  return html`
    <div class="stack">
      <${SectionTitle}>Mishandling of Exceptional Conditions</${SectionTitle}>
      <${Walkthrough} wt=${wt} steps=${steps} title="What your code does when something breaks"/>
      <${Banner} variant="info" title="New in 2025">A10 covers improper error handling, logic errors and failing open — the security decisions a system makes when it hits an unexpected state.</${Banner}>

      <div class="grid grid-2">
        <${Card} title="Request" icon="globe">
          <div class="row"><${Switch} checked=${fault} onChange=${setFault}>Inject downstream fault</${Switch}></div>
          <div class="row"><${Switch} checked=${failClosed} onChange=${setFailClosed}>Fail closed (deny on error)</${Switch}></div>
          <div class="row"><${Switch} checked=${verbose} onChange=${setVerbose}>Verbose error to user</${Switch}></div>
          <div class="row"><${Button} variant="primary" sm onClick=${request}>Request access</${Button}></div>
          <div class="tiny muted">Handler logic:</div>
          <${CodeBlock} code=${code}/>
        </${Card}>

        <${Card} title="Result" icon="server">
          ${!out && html`<p class="muted">Press <b>Request access</b>.</p>`}
          ${out && html`<div class="stack-sm">
            <div class="row"><${Pill} variant=${out.granted ? (out.errored ? "danger" : "success") : "success"}>${out.granted ? "ACCESS GRANTED" : "ACCESS DENIED"}</${Pill}>
              ${out.errored && html`<${Pill} variant="warning">error on path</${Pill}>`}</div>
            <${Banner} variant=${out.granted && out.errored ? "danger" : "success"}
              title=${out.granted && out.errored ? "Failed open" : out.granted ? "Legitimate access" : "Safe default"}>${out.msg}</${Banner}>
            ${out.errored && verbose
              ? html`<${Banner} variant="danger" title="Information leak"><span class="mono tiny">EntitlementError: ECONNREFUSED at db://ent-svc:5432 (user=svc_ent, key=sk_live_9f…)</span></${Banner}>`
              : out.errored && html`<p class="tiny muted">Generic message returned to the user; details logged server-side.</p>`}
          </div>`}
        </${Card}>
      </div>

      <${Card} title="How to prevent it" icon="shield">
        <ul class="ticks">
          <li>Make security decisions <b>fail closed</b> — the default on any error is to deny.</li>
          <li>Handle exceptions explicitly; never swallow an error and continue past a security check.</li>
          <li>Return generic messages to users; log full detail server-side only.</li>
          <li>Test the error paths — inject faults and timeouts, and assert the safe outcome.</li>
        </ul>
      </${Card}>
    </div>`;
}

export default {
  id: "a10", code: "A10:2025", icon: "alert",
  title: "Mishandling of Exceptional Conditions",
  blurb: "Make an entitlement check throw and watch fail-open logic hand out access — then flip it to fail closed.",
  Component: Demo,
};
