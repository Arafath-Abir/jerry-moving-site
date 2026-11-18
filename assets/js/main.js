/* Jerry Moving Company & Storage — site interactions */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Where quote requests are delivered (e.g. "https://formsubmit.co/ajax/<inbox or alias>").
     Leave empty for demo mode: the form shows the thank-you screen without sending anything. */
  const FORM_ENDPOINT = "";

  /* Announcement bar */
  const ann = $(".announce");
  if (ann) {
    try { if (sessionStorage.getItem("jm-announce") === "0") ann.classList.add("is-hidden"); } catch (e) {}
    $(".announce-close", ann)?.addEventListener("click", () => {
      ann.classList.add("is-hidden");
      try { sessionStorage.setItem("jm-announce", "0"); } catch (e) {}
    });
  }

  /* Header shadow + back-to-top */
  const header = $(".header");
  const toTop = $(".to-top");
  const onScroll = () => {
    const y = window.scrollY;
    header?.classList.toggle("is-scrolled", y > 10);
    toTop?.classList.toggle("is-visible", y > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));

  /* Mobile drawer */
  const drawer = $(".drawer");
  const openDrawer = (open) => {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    document.body.style.overflow = open ? "hidden" : "";
    $$(".drawer nav a", drawer).forEach((a, i) => (a.style.transitionDelay = open ? 80 + i * 45 + "ms" : "0ms"));
  };
  $(".burger")?.addEventListener("click", () => openDrawer(true));
  $$("[data-close-drawer]").forEach((el) => el.addEventListener("click", () => openDrawer(false)));
  document.addEventListener("keydown", (e) => e.key === "Escape" && openDrawer(false));

  /* Active nav */
  const page = document.body.dataset.page;
  $$("[data-nav]").forEach((a) => a.dataset.nav === page && a.classList.add("is-active"));

  /* Scroll reveal */
  const io = "IntersectionObserver" in window && !reduce
    ? new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        });
      }, { threshold: 0.14, rootMargin: "0px 0px -40px 0px" })
    : null;
  $$(".reveal").forEach((el) => {
    const d = el.dataset.delay;
    if (d) el.style.transitionDelay = d + "ms";
    io ? io.observe(el) : el.classList.add("is-in");
  });

  /* Counters */
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const dec = (el.dataset.count.split(".")[1] || "").length;
    if (reduce) { el.textContent = target.toFixed(dec); return; }
    const dur = 1800, t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = (target * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const countIO = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => entries.forEach((en) => {
        if (en.isIntersecting) { animateCount(en.target); countIO.unobserve(en.target); }
      }), { threshold: 0.5 })
    : null;
  $$("[data-count]").forEach((el) => (countIO ? countIO.observe(el) : animateCount(el)));

  /* Mention bars */
  const barIO = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => entries.forEach((en) => {
        if (!en.isIntersecting) return;
        $$(".mention-bar i", en.target).forEach((b, i) => setTimeout(() => (b.style.width = b.dataset.w + "%"), i * 150));
        barIO.unobserve(en.target);
      }), { threshold: 0.3 })
    : null;
  $$(".mentions").forEach((m) => barIO ? barIO.observe(m) : $$(".mention-bar i", m).forEach((b) => (b.style.width = b.dataset.w + "%")));

  /* Testimonial slider */
  $$(".testi-wrap").forEach((wrap) => {
    const track = $(".testi-track", wrap);
    const slides = $$(".testi", wrap);
    const dotsWrap = $(".testi-dots", wrap);
    let i = 0, timer;
    slides.forEach((_, n) => {
      const b = document.createElement("button");
      b.setAttribute("aria-label", "Show review " + (n + 1));
      b.addEventListener("click", () => { go(n); restart(); });
      dotsWrap.appendChild(b);
    });
    const dots = $$("button", dotsWrap);
    const go = (n) => {
      i = (n + slides.length) % slides.length;
      track.style.transform = `translateX(-${i * 100}%)`;
      dots.forEach((d, k) => d.classList.toggle("is-active", k === i));
      slides.forEach((s, k) => s.setAttribute("aria-hidden", String(k !== i)));
    };
    const restart = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => go(i + 1), 6500); };
    $("[data-prev]", wrap)?.addEventListener("click", () => { go(i - 1); restart(); });
    $("[data-next]", wrap)?.addEventListener("click", () => { go(i + 1); restart(); });
    let sx = null;
    track.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
    track.addEventListener("touchend", (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) { go(i + (dx < 0 ? 1 : -1)); restart(); }
      sx = null;
    });
    wrap.addEventListener("mouseenter", () => clearInterval(timer));
    wrap.addEventListener("mouseleave", restart);
    go(0); restart();
  });

  /* FAQ accordion */
  $$(".faq-item").forEach((item) => {
    const q = $(".faq-q", item);
    q.addEventListener("click", () => {
      const open = item.classList.toggle("is-open");
      q.setAttribute("aria-expanded", String(open));
    });
  });

  /* Hours: highlight today */
  const today = new Date().getDay();
  $$(".hours tr[data-day]").forEach((tr) => +tr.dataset.day === today && tr.classList.add("today"));

  /* Year */
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* Hero mini quote -> contact page */
  const mini = $("#mini-quote");
  mini?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(mini);
    const params = new URLSearchParams();
    for (const [k, v] of fd.entries()) if (v) params.set(k, v);
    window.location.href = "contact.html?" + params.toString() + "#quote";
  });

  /* Multi-step quote form */
  const form = $("#quote-form");
  if (form) {
    const steps = $$(".form-step", form);
    const pSteps = $$(".p-step");
    const fill = $(".progress-fill");
    let cur = 0;

    // prefill from URL
    const qp = new URLSearchParams(location.search);
    qp.forEach((v, k) => {
      const radio = form.querySelector(`input[type=radio][name="${k}"][value="${CSS.escape(v)}"]`);
      if (radio) { radio.checked = true; return; }
      const f = form.elements[k];
      if (f && "value" in f) f.value = v;
    });

    const show = (n, scroll = true) => {
      cur = n;
      steps.forEach((s, k) => s.classList.toggle("is-active", k === n));
      pSteps.forEach((p, k) => {
        p.classList.toggle("is-active", k === n);
        p.classList.toggle("is-done", k < n);
      });
      if (fill) fill.style.width = `calc(${(n / (steps.length - 1)) * 100}% - ${n === 0 ? 0 : 40 * (n / (steps.length - 1))}px)`;
      const top = form.getBoundingClientRect().top + window.scrollY - 100;
      if (scroll && window.scrollY > top) window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
    };

    const validate = (n) => {
      let ok = true;
      const step = steps[n];
      $$("[required]", step).forEach((f) => {
        if (f.type === "radio") return;
        const field = f.closest(".field");
        const valid = f.checkValidity();
        field?.classList.toggle("has-error", !valid);
        if (!valid) ok = false;
      });
      const radioReq = $("[data-radio-required]", step);
      if (radioReq) {
        const name = radioReq.dataset.radioRequired;
        const err = $(".choice-error", step);
        const checked = !!form.querySelector(`input[name="${name}"]:checked`);
        if (err) err.textContent = checked ? "" : "Please choose one option.";
        if (!checked) ok = false;
      }
      if (!ok) {
        const first = $(".has-error input, .has-error select, .has-error textarea", step);
        first?.focus();
      }
      return ok;
    };

    $$("[data-next-step]", form).forEach((b) => b.addEventListener("click", () => validate(cur) && show(cur + 1)));
    $$("[data-prev-step]", form).forEach((b) => b.addEventListener("click", () => show(cur - 1)));
    $$("input, select, textarea", form).forEach((f) => f.addEventListener("input", () => f.closest(".field")?.classList.remove("has-error")));

    const LABELS = { residential: "Home / Apartment", commercial: "Office / Business", labor: "Load / Unload Help", storage: "Storage Move", junk: "Junk Removal", specialty: "Heavy / Specialty" };
    const submitBtn = form.querySelector("button[type=submit]");
    const errBox = $(".form-error", form);
    let sending = false;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (sending || !validate(cur)) return;
      const fd = new FormData(form);
      if (fd.get("_honey")) return; // bot trap
      const v = (k) => (fd.get(k) || "").toString().trim() || "—";
      const payload = {
        "Name": v("name"),
        "Phone": v("phone"),
        "Email": v("email"),
        "Move type": LABELS[fd.get("moveType")] || v("moveType"),
        "From ZIP": v("fromZip"),
        "To ZIP": v("toZip"),
        "Move date": v("date"),
        "Size": v("size"),
        "Notes": v("notes"),
        _subject: `New moving quote request: ${v("name")} (${LABELS[fd.get("moveType")] || "move"})`,
        _template: "table",
        _captcha: "false",
      };
      if (fd.get("email")) payload._replyto = fd.get("email");

      sending = true;
      const label = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
      if (errBox) errBox.hidden = true;
      if (!FORM_ENDPOINT) { finish(); return; }
      const ctrl = "AbortController" in window ? new AbortController() : null;
      const timer = ctrl && setTimeout(() => ctrl.abort(), 20000);
      try {
        const res = await fetch(FORM_ENDPOINT, {
          signal: ctrl?.signal,
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || String(data.success) === "false") throw new Error(data.message || "Request failed");
      } catch (err) {
        clearTimeout(timer);
        sending = false;
        submitBtn.disabled = false;
        submitBtn.innerHTML = label;
        if (errBox) errBox.hidden = false;
        return;
      }
      clearTimeout(timer);
      finish();
    });

    function finish() {
      const name = (form.elements.name?.value || "").split(" ")[0];
      $("[data-success-name]") && ($("[data-success-name]").textContent = name ? ", " + name : "");
      steps.forEach((s) => s.classList.remove("is-active"));
      $(".progress")?.setAttribute("hidden", "");
      $(".success", form.parentElement)?.classList.add("is-active");
      const y = form.parentElement.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    }
    show(0, false);
  }

  /* Re-align hash targets once images/fonts settle */
  if (location.hash) {
    window.addEventListener("load", () => {
      const t = document.getElementById(location.hash.slice(1));
      if (t) t.scrollIntoView({ block: "start" });
    });
  }
})();
