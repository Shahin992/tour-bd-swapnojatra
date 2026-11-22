/* Swapnojatra — site behaviour that must work with or without the animation layer. */
(function () {
  "use strict";
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var BN = "০১২৩৪৫৬৭৮৯";
  var bn = function (s) { return String(s).replace(/\d/g, function (d) { return BN[d]; }); };
  var params = new URLSearchParams(location.search);

  /* ---------- header shadow on scroll ---------- */
  var header = $("[data-header]");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 12); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- mobile menu sheet ---------- */
  var sheet = $("[data-menu-sheet]");
  var openBtn = $("[data-menu-open]");
  if (sheet && openBtn) {
    var close = function () {
      sheet.hidden = true;
      openBtn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      openBtn.focus();
    };
    openBtn.addEventListener("click", function () {
      sheet.hidden = false;
      openBtn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      var first = $("a, button", sheet);
      if (first) first.focus();
      document.dispatchEvent(new CustomEvent("sheet:open", { detail: sheet }));
    });
    $("[data-menu-close]", sheet).addEventListener("click", close);
    sheet.addEventListener("click", function (e) { if (e.target === sheet) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !sheet.hidden) close(); });
    // the desktop navbar takes over at 1140px: never leave the menu open behind it
    matchMedia("(min-width: 1140px)").addEventListener("change", function (e) { if (e.matches && !sheet.hidden) close(); });
  }

  /* ---------- finder tabs (ARIA tabs pattern) ---------- */
  $$("[data-finder]").forEach(function (finder) {
    var tabs = $$('[role="tab"]', finder);
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
      finder.dispatchEvent(new CustomEvent("tabs:change", { detail: tab }));
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab, false); });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") next = tabs[0];
        if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });
  });

  /* ---------- horizontal rail buttons ---------- */
  $$("[data-rail]").forEach(function (rail) {
    var section = rail.closest("section");
    var prev = section && $("[data-rail-prev]", section);
    var next = section && $("[data-rail-next]", section);
    if (!prev || !next) return;
    var step = function () { var card = rail.firstElementChild; return card ? card.getBoundingClientRect().width + 18 : 300; };
    var update = function () {
      prev.disabled = rail.scrollLeft < 8;
      next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8;
    };
    prev.addEventListener("click", function () { rail.scrollBy({ left: -step(), behavior: "smooth" }); });
    next.addEventListener("click", function () { rail.scrollBy({ left: step(), behavior: "smooth" }); });
    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  /* ---------- tours listing: filter chips + ?d= / ?cat= / ?type= ---------- */
  var list = $("[data-tour-list]");
  if (list) {
    var cards = $$("[data-card]", list);
    var count = $("[data-result-count]");
    var empty = $("[data-no-results]");
    var state = { type: params.get("type") || "", cat: params.get("cat") || "", d: params.get("d") || "" };
    var apply = function () {
      var shown = 0;
      cards.forEach(function (card) {
        var ok = (!state.type || card.dataset.kind === state.type) &&
          (!state.cat || (" " + card.dataset.cats + " ").indexOf(" " + state.cat + " ") > -1) &&
          (!state.d || card.dataset.dest === state.d);
        card.hidden = !ok;
        if (ok) shown++;
      });
      if (count) count.textContent = bn(shown);
      if (empty) empty.hidden = shown > 0;
      $$("[data-filter]").forEach(function (btn) {
        var key = btn.dataset.filter, val = btn.dataset.value;
        btn.setAttribute("aria-pressed", String(state[key] === val && !(key !== "d" && state.d)));
      });
      $$("[data-dest-wrap]").forEach(function (el) { el.hidden = !state.d; });
      var dn = $("[data-dest-name]");
      if (dn && state.d) {
        var match = cards.filter(function (c) { return c.dataset.dest === state.d; })[0];
        dn.textContent = match ? match.dataset.trip : "";
      }
      list.dispatchEvent(new CustomEvent("tours:filter"));
    };
    $$("[data-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.d = "";
        state[btn.dataset.filter] = btn.dataset.value;
        var url = new URL(location.href);
        url.searchParams.delete("d");
        ["type", "cat"].forEach(function (k) { if (state[k]) url.searchParams.set(k, state[k]); else url.searchParams.delete(k); });
        history.replaceState(null, "", url);
        apply();
      });
    });
    $$("[data-clear-dest]").forEach(function (btn) {
      btn.addEventListener("click", function () { state.d = ""; history.replaceState(null, "", location.pathname); apply(); });
    });
    apply();
  }

  /* ---------- visa page: highlight ?c=country ---------- */
  var country = params.get("c");
  if (country) {
    var card = document.getElementById(country);
    if (card && card.classList.contains("visa-card")) {
      card.classList.add("is-target");
      requestAnimationFrame(function () { card.scrollIntoView({ block: "start" }); });
    }
  }

  /* ---------- enquiry form: prefill from query, send through WhatsApp ---------- */
  var form = $("[data-enquiry]");
  if (form) {
    var msg = $("[name=message]", form);
    var pkg = params.get("package");
    var service = params.get("service");
    var notes = [];
    if (pkg) {
      var opt = $('[name=package] option[value="' + pkg + '"]', form);
      if (opt) { opt.selected = true; notes.push(opt.textContent + " প্যাকেজটি নিয়ে জানতে চাই।"); }
    }
    var labels = { hotel: "হোটেল বুকিং", air: "এয়ার টিকিট", visa: "ভিসা প্রসেসিং", corporate: "কর্পোরেট ট্যুর", honeymoon: "হানিমুন প্যাকেজ", custom: "কাস্টম ট্যুর" };
    if (service && labels[service]) {
      var sOpt = $('[name=package] option[value="' + service + '"]', form);
      if (sOpt) sOpt.selected = true;
      var bits = [labels[service] + " সম্পর্কে জানতে চাই।"];
      if (params.get("city")) bits.push("গন্তব্য: " + params.get("city") + "।");
      if (params.get("from") || params.get("to")) bits.push("রুট: " + (params.get("from") || "") + " থেকে " + (params.get("to") || "") + "।");
      if (params.get("date")) bits.push("তারিখ: " + bn(params.get("date")) + "।");
      if (params.get("guests")) bits.push("অতিথি: " + params.get("guests") + "।");
      notes.push(bits.join(" "));
    }
    if (msg && notes.length && !msg.value) msg.value = notes.join(" ");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var data = new FormData(form);
      var pkgSel = $("[name=package]", form);
      var lines = [
        "আসসালামু আলাইকুম, স্বপ্নযাত্রা।",
        "নাম: " + data.get("name"),
        "মোবাইল: " + data.get("phone"),
        "যা জানতে চাই: " + (pkgSel ? pkgSel.options[pkgSel.selectedIndex].text : ""),
        "যাত্রার মাস: " + (data.get("month") || "এখনো ঠিক হয়নি"),
        "যাত্রী: " + (data.get("pax") || "-"),
      ];
      if (data.get("message")) lines.push("বিস্তারিত: " + data.get("message"));
      var url = "https://wa.me/8801174052936?text=" + encodeURIComponent(lines.join("\n"));
      var done = $("[data-form-success]", form);
      if (done) done.hidden = false;
      window.open(url, "_blank", "noopener");
    });
  }

  /* ---------- footer year in Bangla digits ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = bn(new Date().getFullYear()); });
})();
