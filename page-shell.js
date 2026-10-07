(function () {
  var ID = "rf-page-fs-btn";
  var TOOLS_ID = "rf-page-tools-toggle";
  var btn = null;
  var tools = null;
  var footer = null;
  var hideT = 0;

  function isFS() {
    return document.documentElement.classList.contains("rf-fullscreen");
  }

  function findFooter() {
    return document.querySelector(".rf-site-footer");
  }

  function findFrame() {
    return document.querySelector("section.rf-game-frame")
      || document.querySelector(".rf-frame-chrome");
  }

  function icon(expand) {
    return expand
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6"/></svg>';
  }

  function toolsIconSvg() {
    return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2"></path><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H5"></path><circle cx="16.5" cy="12" r="1.3" fill="currentColor" stroke="none"></circle></svg>';
  }

  function sync() {
    if (!btn) return;
    var on = isFS();
    btn.innerHTML = icon(!on);
    btn.setAttribute("aria-label", on ? "Exit fullscreen" : "Fullscreen");
    btn.title = on ? "Exit fullscreen" : "Fullscreen";
  }

  function reveal() {
    footer = findFooter();
    if (!isFS() || !footer) return;
    footer.classList.add("rf-revealed");
    clearTimeout(hideT);
    hideT = setTimeout(function () {
      footer.classList.remove("rf-revealed");
    }, 2600);
  }

  function hideNow() {
    footer = findFooter();
    if (footer) footer.classList.remove("rf-revealed");
    clearTimeout(hideT);
  }

  function toggleFS() {
    document.documentElement.classList.toggle("rf-fullscreen");
    if (!isFS()) hideNow(); else reveal();
    sync();
  }

  function toggleTools() {
    var open = document.documentElement.classList.toggle("rf-tools-open");
    if (tools) tools.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function ensureFS() {
    footer = findFooter();
    if (!footer) return null;
    if (btn && document.body.contains(btn)) return btn;
    btn = document.getElementById(ID);
    if (!btn) {
      btn = document.createElement("button");
      btn.id = ID;
      btn.type = "button";
      btn.className = "rf-fs-btn";
      btn.addEventListener("click", toggleFS);
      footer.appendChild(btn);
    }
    sync();
    return btn;
  }

  // иконка-переключатель кошелька — в углу ИГРЫ (фрейм), не в футере
  function ensureTools() {
    var frame = findFrame();
    if (!frame) return null;
    if (tools && document.body.contains(tools)) return tools;
    tools = document.getElementById(TOOLS_ID);
    if (!tools) {
      tools = document.createElement("button");
      tools.id = TOOLS_ID;
      tools.type = "button";
      tools.className = "rf-tools-toggle";
      tools.setAttribute("aria-controls", "rfFrameToolbar");
      tools.setAttribute("aria-expanded", "false");
      tools.setAttribute("aria-label", "Friend controls");
      tools.title = "Friend controls";
      tools.innerHTML = toolsIconSvg();
      tools.addEventListener("click", toggleTools);
      frame.appendChild(tools);
    }
    return tools;
  }

  function ready() {
    if (document.body) document.body.classList.add("rf-page-body");
    ensureFS();
    ensureTools();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready);
  } else {
    ready();
  }
  window.addEventListener("load", ready);
  setTimeout(ready, 300);
  setTimeout(ready, 1200);

  window.addEventListener("mousemove", function (e) {
    if (!isFS()) return;
    if (e.clientY > window.innerHeight - 48) reveal();
  }, { passive: true });

  var touchY = 0;
  window.addEventListener("touchstart", function (e) {
    if (!isFS() || !e.touches[0]) return;
    touchY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener("touchmove", function (e) {
    if (!isFS() || !e.touches[0]) return;
    var y = e.touches[0].clientY;
    if (touchY > window.innerHeight - 70 && y < touchY - 8) reveal();
    touchY = y;
  }, { passive: true });

  document.addEventListener("focusin", function (e) {
    footer = findFooter();
    if (footer && footer.contains(e.target)) reveal();
  });

  window.addEventListener("resize", function () {
    if (!isFS()) hideNow();
  });

  window.rfSetFullscreen = function (v) {
    document.documentElement.classList.toggle("rf-fullscreen", !!v);
    if (!v) hideNow(); else reveal();
    sync();
  };
})();
