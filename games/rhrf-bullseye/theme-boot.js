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

  document.addEventListener("DOMContentLoaded", function () {
    paint();
    document.querySelectorAll(".rf-theme-switch button").forEach(function (b) {
      b.addEventListener("click", function () {
        root.dataset.theme = b.dataset.set;
        try { localStorage.setItem(KEY, b.dataset.set); } catch (e) {}
        paint();
      });
    });
  });

  // вторая вкладка переключила -> первая подтянула
  addEventListener("storage", function (e) {
    if (e.key === "rhrf_theme" && OK[e.newValue]) { root.dataset.theme = e.newValue; paint(); }
  });
})();
