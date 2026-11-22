/* Swapnojatra — playful, springy animation layer built on Motion (the vanilla-JS edition of Framer Motion).
   Loaded as a module. With reduced motion or no JS every element is already visible and static. */
import { animate, inView, stagger, hover } from "https://cdn.jsdelivr.net/npm/motion@14.3.0/+esm";

const root = document.documentElement;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const POP = { type: "spring", bounce: 0.42, visualDuration: 0.6 };
const SOFT = { type: "spring", bounce: 0.25, visualDuration: 0.5 };
const SNAP = { type: "spring", bounce: 0.3, visualDuration: 0.38 };
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const bnNumber = (n) => Math.round(n).toLocaleString("bn-BD");

if (reduceMotion) {
  root.classList.remove("m-pending");
} else {
  root.classList.add("motion");
  intro();
  reveal();
  counters();
  segPill();
  finderTabs();
  hoverLift();
  seasonBars();
  tourFilter();
  sheet();
  faqOpen();
  floaters();
}

/* ---------- headline split into words (text stays in the DOM for SEO and screen readers) ---------- */
function splitWords(el) {
  const words = [];
  const walk = (node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 3) {
        const parts = child.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const span = document.createElement("span");
          span.className = "m-word";
          span.textContent = part;
          frag.appendChild(span);
          words.push(span);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && !child.matches("svg, br")) {
        walk(child);
      }
    });
  };
  walk(el);
  return words;
}

/* ---------- intro: bento tiles pop in, headline words bounce up ---------- */
function intro() {
  const tiles = $$("[data-m-pop]");
  const heroBits = $$("[data-m-hero]").filter((el) => !el.hasAttribute("data-m-pop"));
  const title = $("[data-m-split]");
  const words = title ? splitWords(title) : [];

  tiles.forEach((el) => { el.style.opacity = "0"; });
  heroBits.forEach((el) => { el.style.opacity = "0"; });
  words.forEach((w) => { w.style.opacity = "0"; });
  root.classList.remove("m-pending");

  animate(tiles, { opacity: [0, 1], scale: [0.9, 1], y: [28, 0] }, { ...POP, delay: stagger(0.06) });
  animate(heroBits, { opacity: [0, 1], y: [18, 0] }, { ...SOFT, delay: stagger(0.06, { startDelay: 0.1 }) });
  if (words.length) {
    animate(words, { opacity: [0, 1], y: ["0.55em", "0em"], rotate: [-4, 0] }, { ...POP, delay: stagger(0.045, { startDelay: 0.15 }) });
  }
  // Highlighter strokes: the headline's draws after its words land, the rest when they scroll into view
  $$(".hl").forEach((hl) => {
    if (hl.closest(".hero, .page-head")) setTimeout(() => hl.classList.add("is-drawn"), 650);
    else inView(hl, () => { setTimeout(() => hl.classList.add("is-drawn"), 250); }, { margin: "0px 0px -20% 0px" });
  });
  $$("[data-m-sticker]").forEach((s, i) => {
    animate(s, { rotate: [-18, -4], scale: [0.6, 1] }, { type: "spring", bounce: 0.6, visualDuration: 0.7, delay: 0.55 + i * 0.1 });
  });
}

/* ---------- scroll reveals ---------- */
function reveal() {
  const groups = [
    ["[data-reveal]", ":scope > *"],
    [".section-head", ":scope > *"],
    [".ph-grid ~ .facts, .facts", ":scope > li"],
    ["[data-reveal-one], .notice, .book-card, .form-card, .toc, .aside-card, .table-wrap, .split-media, .gallery", null],
    [".timeline", ":scope > li"],
    [".highlights, .incl-grid, .team-grid, .licence-grid, .stats, .contact-tiles, .visa-cards, .service-bento", ":scope > *"],
  ];
  const seen = new Set();
  groups.forEach(([selector, childSel]) => {
    $$(selector).forEach((group) => {
      if (group.closest(".hero, .page-head")) return;
      const items = (childSel ? $$(childSel, group) : [group]).filter((el) => !seen.has(el) && !el.hidden);
      if (!items.length) return;
      items.forEach((el) => { seen.add(el); el.style.opacity = "0"; });
      inView(group, () => {
        animate(items, { opacity: [0, 1], y: [34, 0], scale: [0.96, 1] }, { ...POP, delay: stagger(0.06) });
      }, { margin: "0px 0px -10% 0px" });
    });
  });
}

/* ---------- counters roll up in Bangla digits ---------- */
function counters() {
  $$("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    inView(el, () => {
      animate(0, target, { duration: 1.6, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => { el.textContent = bnNumber(v) + suffix; } });
    });
  });
}

/* ---------- header: the dark pill slides to the hovered link, then back to the current page ---------- */
function segPill() {
  const seg = $("[data-seg]");
  if (!seg) return;
  const links = $$("a", seg);
  const current = links.find((a) => a.getAttribute("aria-current") === "page");
  const pill = document.createElement("span");
  pill.className = "seg-pill";
  pill.setAttribute("aria-hidden", "true");
  seg.prepend(pill);
  seg.classList.add("has-pill");
  const place = (a, instant) => {
    links.forEach((l) => l.classList.toggle("is-pill", l === a));
    if (!a) { animate(pill, { opacity: 0, scale: 0.8 }, SNAP); return; }
    const box = { x: a.parentElement.offsetLeft, width: a.offsetWidth };
    if (instant) { pill.style.transform = `translateX(${box.x}px)`; pill.style.width = `${box.width}px`; pill.style.opacity = "1"; return; }
    animate(pill, { x: box.x, width: box.width, opacity: 1, scale: 1 }, SNAP);
  };
  const settle = () => place(current || null, false);
  pill.style.opacity = "0";
  if (current) requestAnimationFrame(() => place(current, false));
  if (finePointer) {
    links.forEach((a) => a.addEventListener("pointerenter", () => place(a, false)));
    seg.addEventListener("pointerleave", settle);
  }
  links.forEach((a) => { a.addEventListener("focus", () => place(a, false)); a.addEventListener("blur", settle); });
  window.addEventListener("resize", () => current && place(current, true));
  document.fonts?.ready.then(() => current && place(current, true));
}

/* ---------- finder: indicator slides between tabs, new panel springs in ---------- */
function finderTabs() {
  $$("[data-finder]").forEach((finder) => {
    const tabsEl = $(".finder-tabs", finder);
    const ind = $(".finder-ind", finder);
    if (!tabsEl || !ind) return;
    tabsEl.classList.add("has-ind");
    const move = (tab, instant) => {
      const frame = { x: tab.offsetLeft, width: tab.offsetWidth };
      if (instant) { ind.style.transform = `translateX(${frame.x}px)`; ind.style.width = `${frame.width}px`; return; }
      animate(ind, { x: frame.x, width: frame.width }, SNAP);
    };
    const selected = () => $('[aria-selected="true"]', tabsEl);
    move(selected(), true);
    finder.addEventListener("tabs:change", (e) => {
      move(e.detail, false);
      const panel = document.getElementById(e.detail.getAttribute("aria-controls"));
      animate($$(".field, .btn", panel), { opacity: [0, 1], y: [14, 0] }, { ...POP, delay: stagger(0.05) });
    });
    window.addEventListener("resize", () => move(selected(), true));
    document.fonts?.ready.then(() => move(selected(), true));
  });
}

/* ---------- cards lift on a spring ---------- */
function hoverLift() {
  if (!finePointer) return;
  hover(".tour-card, .rail-card, .guide-card, .visa-tile, .why-tile, .cat, .tile--photo, a.tile--fill, .member, .contact-tile", (el) => {
    animate(el, { y: -6, scale: 1.01 }, SNAP);
    return () => animate(el, { y: 0, scale: 1 }, SNAP);
  });
  hover(".btn--primary, .btn--whatsapp, .btn--light", (el) => {
    animate(el, { scale: 1.04 }, SNAP);
    return () => animate(el, { scale: 1 }, SNAP);
  });
}

/* ---------- best-time calendar: bars grow month by month ---------- */
function seasonBars() {
  const table = $("[data-season]");
  if (!table) return;
  const rows = $$("tbody tr", table);
  rows.forEach((tr) => $$("td", tr).forEach((td) => { td.style.transformOrigin = "left center"; td.style.transform = "scaleX(0)"; }));
  inView(table, () => {
    rows.forEach((tr, r) => {
      animate($$("td", tr), { scaleX: [0, 1] }, { ...SOFT, delay: stagger(0.035, { startDelay: r * 0.06 }) });
    });
  }, { margin: "0px 0px -15% 0px" });
}

/* ---------- tours listing: cards re-pop after a filter change ---------- */
function tourFilter() {
  const list = $("[data-tour-list]");
  if (!list) return;
  list.addEventListener("tours:filter", () => {
    const visible = $$("[data-card]", list).filter((c) => !c.hidden);
    animate(visible, { opacity: [0, 1], scale: [0.94, 1], y: [16, 0] }, { ...POP, delay: stagger(0.03) });
  });
}

/* ---------- mobile menu sheet slides up ---------- */
function sheet() {
  document.addEventListener("sheet:open", (e) => {
    const panel = $(".sheet-panel", e.detail);
    animate(e.detail, { opacity: [0, 1] }, { duration: 0.2 });
    // phones: a bottom sheet rising up; tablets and desktops: a card dropping down from the menu button
    if (matchMedia("(min-width: 768px)").matches) animate(panel, { y: [-14, 0], scale: [0.97, 1], opacity: [0, 1] }, { type: "spring", bounce: 0.18, visualDuration: 0.4 });
    else animate(panel, { y: ["100%", "0%"] }, { type: "spring", bounce: 0.18, visualDuration: 0.45 });
    animate($$(".sheet-links li", panel), { opacity: [0, 1], y: [16, 0] }, { ...POP, delay: stagger(0.035, { startDelay: 0.12 }) });
  });
}

/* ---------- FAQ answers ease open ---------- */
function faqOpen() {
  $$("details.faq, .visa-card details").forEach((d) => {
    d.addEventListener("toggle", () => {
      if (!d.open) return;
      const body = d.querySelector(".faq-a, ul");
      if (body) animate(body, { opacity: [0, 1], y: [-8, 0] }, SOFT);
    });
  });
}

/* ---------- floating WhatsApp + app tab bar arrive after the intro ---------- */
function floaters() {
  const wa = $("[data-wa-float]");
  if (wa) {
    wa.style.opacity = "0";
    animate(wa, { opacity: [0, 1], scale: [0.4, 1], rotate: [-30, 0] }, { type: "spring", bounce: 0.55, visualDuration: 0.6, delay: 1.1 });
  }
  const bar = $(".tabbar");
  if (bar && getComputedStyle(bar).display !== "none") {
    animate(bar, { y: [90, 0], opacity: [0, 1] }, { ...SOFT, delay: 0.5 });
  }
}
