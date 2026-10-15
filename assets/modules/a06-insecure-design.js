// A06:2025 — Insecure Design (business-logic flaws)
import {
  html, useState, useMemo,
  Card, SectionTitle, Pill, Button, Field, Switch, Banner, DataTable, Icon,
  Walkthrough, useWalkthrough,
} from "../ui.js";

const UNIT_PRICE = 20; // $ per item

function Demo() {
  const [qty, setQty] = useState("1");
  const [coupons, setCoupons] = useState(1);     // how many times SAVE50 is stacked
  const [validate, setValidate] = useState(false);

  const q = parseInt(qty, 10);
  const nQty = Number.isNaN(q) ? 0 : q;

  const calc = useMemo(() => {
    let quantity = nQty;
    let stack = coupons;
    const violations = [];
    if (validate) {
      if (quantity < 1) { violations.push("quantity must be ≥ 1"); quantity = Math.max(1, quantity); }
      if (stack > 1) { violations.push("only one coupon may be applied"); stack = 1; }
    }
    const subtotal = quantity * UNIT_PRICE;
    const discount = Math.min(subtotal, stack * 0.5 * (quantity * UNIT_PRICE)); // 50% each, stacked
    let total = subtotal - discount;
    if (validate && total < 0) { violations.push("total clamped to 0"); total = 0; }
    const accepted = !validate || (nQty >= 1 && coupons <= 1 && total >= 0);
    return { quantity, subtotal, discount, total, violations, accepted };
  }, [nQty, coupons, validate]);

  const exploited = !validate && calc.total < UNIT_PRICE; // store loses money

  const steps = [
    { title: "A normal order", body: html`One item at $${UNIT_PRICE}, one coupon. The maths is ordinary. The flaw isn't a bug in the code — it's a missing rule in the ${html`<b>design</b>`}.`,
      apply: () => { setValidate(false); setQty("1"); setCoupons(1); } },
    { title: "Order a negative quantity", body: html`Set quantity to ${html`<code class="code">-5</code>`}. Nothing stops it, so the subtotal goes negative and the store would ${html`<b>refund</b>`} the "buyer". The code works perfectly; the design never forbade it.`,
      apply: () => { setValidate(false); setQty("-5"); setCoupons(1); } },
    { title: "Stack the coupon", body: html`Apply ${html`<code class="code">SAVE50</code>`} several times. Each takes another 50% — stack enough and the total hits zero or below. Classic coupon-stacking logic flaw.`,
      apply: () => { setValidate(false); setQty("3"); setCoupons(4); } },
    { title: "Design in the invariants", body: html`Enable server-side validation of the business rules: quantity ≥ 1, one coupon, total ≥ 0. The exploit inputs are now rejected or clamped — enforced where the client can't bypass them.`,
      apply: () => { setValidate(true); setQty("-5"); setCoupons(4); } },
  ];
  const wt = useWalkthrough(steps);

  return html`
    <div class="stack">
      <${SectionTitle}>Insecure Design</${SectionTitle}>
      <${Walkthrough} wt=${wt} steps=${steps} title="A checkout with no business rules"/>
      <${Banner} variant="info" title="Design, not implementation">These flaws can't be patched by fixing a line of code — the system was designed without the rule. Threat-model the logic, then enforce invariants server-side.</${Banner}>

      <div class="grid grid-2">
        <${Card} title="Shopping cart" icon="file">
          <${Field} label=${`Quantity (unit price $${UNIT_PRICE})`} value=${qty} onInput=${setQty} mono type="text"/>
          <div class="row">
            <span class="tiny muted">Coupon SAVE50 applied ${coupons}×</span>
            <${Button} sm onClick=${() => setCoupons((c) => c + 1)}>Apply coupon again</${Button}>
            <${Button} sm onClick=${() => setCoupons(1)}>Reset coupons</${Button}>
          </div>
          <div class="row">
            <${Switch} checked=${validate} onChange=${setValidate}>Server-side validation</${Switch}>
          </div>
        </${Card}>

        <${Card} title=${validate ? "Checkout — validated" : "Checkout — no rules"} icon="server">
          <${DataTable} columns=${["line", "value"]} rows=${[
            ["quantity", calc.quantity],
            ["subtotal", "$" + calc.subtotal.toFixed(2)],
            ["discount", "-$" + calc.discount.toFixed(2)],
            ["total", "$" + calc.total.toFixed(2)],
          ]}/>
          ${calc.violations.length > 0 && html`<${Banner} variant="success" title="Invariants enforced">${calc.violations.join("; ")}.</${Banner}>`}
          ${exploited && html`<${Banner} variant="danger" title="Logic abused">The order total is below a single item's price — the business loses money, and the code did exactly what it was told.</${Banner}>`}
          <div class="row"><${Pill} variant=${calc.accepted && !exploited ? "success" : "danger"}>${calc.accepted ? (exploited ? "Order accepted (abusive)" : "Order accepted") : "Order rejected"}</${Pill}></div>
        </${Card}>
      </div>

      <${Card} title="How to prevent it" icon="shield">
        <ul class="ticks">
          <li>Threat-model features during design; write down the business rules and abuse cases.</li>
          <li>Enforce invariants (quantity ≥ 1, one coupon, total ≥ 0) on the <b>server</b>, not just the UI.</li>
          <li>Use known-good design patterns and reference architectures; add negative/abuse test cases.</li>
          <li>Apply limits and sanity checks to every value that affects money, access or state.</li>
        </ul>
      </${Card}>
    </div>`;
}

export default {
  id: "a06", code: "A06:2025", icon: "scale",
  title: "Insecure Design",
  blurb: "Checkout with a negative quantity and a stacked coupon to drive the total below zero — a flaw no code patch fixes, only a design rule.",
  Component: Demo,
};
