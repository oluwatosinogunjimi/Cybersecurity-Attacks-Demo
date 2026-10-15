// A09:2025 — Security Logging & Alerting Failures
import {
  html, useState, useMemo,
  Card, SectionTitle, Pill, Button, Switch, Banner, DataTable, Icon,
  Walkthrough, useWalkthrough,
} from "../ui.js";

const ATTACK_IP = "203.0.113.9";
const THRESHOLD = 5;

function Demo() {
  const [logging, setLogging] = useState(false);
  const [logs, setLogs] = useState([]);       // recorded entries (only when logging on)
  const [occurred, setOccurred] = useState(0); // events that actually happened
  let clock = useMemo(() => ({ t: 9 * 3600 }), []); // not reactive; just for timestamps

  const stamp = () => {
    clock.t += 7;
    const h = Math.floor(clock.t / 3600), m = Math.floor((clock.t % 3600) / 60), s = clock.t % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };
  function pad(n) { return String(n).padStart(2, "0"); }

  const fail = (n = 1, ip = ATTACK_IP, user = "admin") => {
    setOccurred((c) => c + n);
    if (logging) {
      setLogs((L) => {
        const add = [];
        for (let i = 0; i < n; i++) add.push([stamp(), ip, user, "FAIL"]);
        return [...L, ...add].slice(-40);
      });
    }
  };
  const success = () => {
    setOccurred((c) => c + 1);
    if (logging) setLogs((L) => [...L, [stamp(), "198.51.100.4", "alice", "OK"]].slice(-40));
  };
  const clear = () => { setLogs([]); setOccurred(0); };

  const failByIp = useMemo(() => {
    const m = {};
    for (const [, ip, , outcome] of logs) if (outcome === "FAIL") m[ip] = (m[ip] || 0) + 1;
    return m;
  }, [logs]);
  const alertIp = Object.keys(failByIp).find((ip) => failByIp[ip] >= THRESHOLD);
  const blind = !logging && occurred > 0;

  const steps = [
    { title: "An attack with the lights off", body: html`Logging is disabled. Launch a burst of 20 failed logins from one IP. The counter of events that ${html`<b>happened</b>`} climbs — but the log table stays empty.`,
      apply: () => { setLogging(false); clear(); } },
    { title: "You can't see what you don't record", body: html`20 auth failures occurred and left no trace. There's nothing for an analyst to triage and nothing to alert on. This is the failure: not the breach, but the silence around it.`,
      apply: () => { setLogging(false); } },
    { title: "Turn on structured logging", body: html`Enable logging and run the burst again. Now every attempt is recorded with a timestamp, source IP, user and outcome — the raw material a SOC needs.`,
      apply: () => { setLogging(true); clear(); } },
    { title: "Alert, don't just log", body: html`Logs alone aren't enough — someone has to notice. Once failures from one IP cross ${THRESHOLD}, an alert fires and the SOC is paged. Logging plus alerting closes the gap.`,
      apply: () => { setLogging(true); } },
  ];
  const wt = useWalkthrough(steps);

  return html`
    <div class="stack">
      <${SectionTitle}>Security Logging &amp; Alerting Failures</${SectionTitle}>
      <${Walkthrough} wt=${wt} steps=${steps} title="From silent breach to a paged analyst"/>
      <${Banner} variant="info" title="Renamed for 2025">The category was "Logging &amp; Monitoring"; 2025 stresses <b>alerting</b> — detecting and responding in time, not just writing logs nobody reads.</${Banner}>

      <div class="grid grid-2">
        <${Card} title="Traffic generator" icon="globe">
          <div class="row"><${Switch} checked=${logging} onChange=${setLogging}>Security logging enabled</${Switch}></div>
          <div class="row">
            <${Button} sm onClick=${() => fail(1)}>1 failed login</${Button}>
            <${Button} sm onClick=${() => fail(20)}>Burst: 20 failures</${Button}>
            <${Button} sm onClick=${success}>Successful login</${Button}>
            <${Button} sm onClick=${clear}>Clear</${Button}>
          </div>
          <div class="row">
            <${Pill} variant=${blind ? "danger" : "info"}>${occurred} events occurred</${Pill}>
            <${Pill} variant=${logs.length ? "success" : "warning"}>${logs.length} recorded</${Pill}>
          </div>
          ${blind && html`<${Banner} variant="danger" title="Blind spot">${occurred} security events happened and none were recorded. An analyst has nothing to investigate.</${Banner}>`}
        </${Card}>

        <${Card} title="SOC console" icon="bell">
          ${alertIp
            ? html`<${Banner} variant="danger" title="ALERT — possible brute force">${failByIp[alertIp]} failed logins from ${alertIp} (threshold ${THRESHOLD}). Analyst paged for triage.</${Banner}>`
            : logging
              ? html`<${Banner} variant="success" title="Monitoring">Events are being recorded; no threshold breached yet.</${Banner}>`
              : html`<${Banner} variant="warning" title="No telemetry">Logging is off — the console sees nothing.</${Banner}>`}
          <${DataTable} columns=${["time", "src ip", "user", "result"]} rows=${logs.slice(-8).reverse()}
            rowClass=${(r) => r[3] === "FAIL" ? "hit-danger" : "hit-safe"}/>
        </${Card}>
      </div>

      <${Card} title="How to prevent it" icon="shield">
        <ul class="ticks">
          <li>Log authentication, access-control and server-side input failures with enough context to act on.</li>
          <li>Ship logs to a tamper-resistant store (SIEM) and <b>alert</b> on meaningful thresholds and anomalies.</li>
          <li>Define and rehearse an incident-response path so alerts reach a human quickly.</li>
          <li>Never log secrets or full credentials; protect log integrity and retention.</li>
        </ul>
      </${Card}>
    </div>`;
}

export default {
  id: "a09", code: "A09:2025", icon: "bell",
  title: "Security Logging & Alerting Failures",
  blurb: "Run an attack with logging off and see it leave no trace, then enable logging and alerting until the SOC gets paged.",
  Component: Demo,
};
