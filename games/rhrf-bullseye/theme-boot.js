(function () {
  var KEY = "rhrf_theme";
  var OK = { light: 1, dark: 1, cyber: 1 };
  var root = document.documentElement;

  function resolve() {
    var t = null;
    try { t = localStorage.getItem(KEY); } catch (e) {}
    if (!OK[t]) t = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    return t;
  }

  // применяется синхронно, до парсинга <body> -> без FOUC
  root.dataset.theme = resolve();

  function paint() {
    var t = root.dataset.theme;
    document.querySelectorAll(".rf-theme-switch button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.set === t));
    });
  }

  function fitFrame() {
    var f = document.querySelector(".rf-game-frame");
    if (!f) return;

    var ar = getComputedStyle(f).aspectRatio || "auto";
    var ratio = 1.5;
    if (ar !== "auto") {
      var parts = ar.split("/").map(parseFloat);
      if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) ratio = parts[0] / parts[1];
    }
    root.style.setProperty("--rf-ar", String(ratio));

    // вертикальный резерв: переключатель сверху + подвал снизу, меряем по DOM
    var GAP = 8;
    var sw = document.querySelector(".rf-theme-switch");
    var ft = document.querySelector(".rf-site-footer");
    var top = sw ? sw.getBoundingClientRect().bottom : 52;
    var bot = ft ? innerHeight - ft.getBoundingClientRect().top : 39;
    root.style.setProperty("--rf-reserve", Math.ceil(top + bot + GAP) + "px");
  }

  var WALLET = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2"/><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H5"/><circle cx="16.5" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg>';

  function setTools(open) {
    root.classList.toggle("rf-tools-open", open);
    var b = document.getElementById("rfToolsToggle");
    if (b) b.setAttribute("aria-expanded", String(open));
  }

  function mountToggle() {
    var tb = document.querySelector(".rf-frame-toolbar");
    if (!tb || document.getElementById("rfToolsToggle")) return;

    tb.id = tb.id || "rfFrameToolbar";

    var b = document.createElement("button");
    b.type = "button";
    b.id = "rfToolsToggle";
    b.className = "rf-tools-toggle";
    b.setAttribute("aria-controls", tb.id);
    b.setAttribute("aria-expanded", "false");
    b.setAttribute("aria-label", "Friend controls");
    b.innerHTML = WALLET;
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      setTools(!root.classList.contains("rf-tools-open"));
    });

    (tb.parentNode || document.body).appendChild(b);

  }

  document.addEventListener("DOMContentLoaded", function () {
    paint();
    fitFrame();
    mountToggle();
    document.addEventListener("click", function (e) {
      if (!root.classList.contains("rf-tools-open")) return;
      var bar = document.querySelector(".rf-frame-toolbar");
      var btn = document.getElementById("rfToolsToggle");
      if ((bar && bar.contains(e.target)) || (btn && btn.contains(e.target))) return;
      setTools(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setTools(false);
    });

    document.querySelectorAll(".rf-theme-switch button").forEach(function (b) {
      b.addEventListener("click", function () {
        root.dataset.theme = b.dataset.set;
        try { localStorage.setItem(KEY, b.dataset.set); } catch (e) {}
        paint();
      });
    });

    addEventListener("resize", fitFrame);
    addEventListener("orientationchange", fitFrame);
    addEventListener("load", fitFrame);

    // runtime.js может перерисовать рамку -> возвращаем кнопку
    new MutationObserver(function () {
      if (!document.getElementById("rfToolsToggle")) mountToggle();
    }).observe(document.documentElement, { childList: true, subtree: true });
  });

  // вторая вкладка переключила -> первая подтянула
  addEventListener("storage", function (e) {
    if (e.key === "rhrf_theme" && OK[e.newValue]) { root.dataset.theme = e.newValue; paint(); }
  });
})();
