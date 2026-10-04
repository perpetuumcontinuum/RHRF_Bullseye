(function () {
  if (window.self !== window.top) {
    var c0 = document.getElementById("rf-music-container");
    if (c0 && c0.parentNode) c0.parentNode.removeChild(c0);
    var a0 = document.getElementById("rf-bg-music");
    if (a0 && a0.parentNode) a0.parentNode.removeChild(a0);
    return;
  }

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var btn = document.getElementById("rf-music-toggle");
    var audio = document.getElementById("rf-bg-music");
    var slider = document.getElementById("rf-volume-slider");
    var iconPlaying = document.getElementById("rf-icon-playing");
    var iconMuted = document.getElementById("rf-icon-muted");
    if (!btn || !audio || !slider || !iconPlaying || !iconMuted) return;

    function getStore() {
      try { return window.localStorage; } catch (e) { return null; }
    }
    var store = getStore();
    function get(k) { try { return store ? store.getItem(k) : null; } catch (e) { return null; } }
    function set(k, v) { try { if (store) store.setItem(k, v); } catch (e) {} }
    function rem(k) { try { if (store) store.removeItem(k); } catch (e) {} }

    rem("rf-music-volume");
    rem("rf-music-volume-v2");
    rem("rf-music-muted");

    var VOL_KEY = "rf-music-volume-v3";
    var vol = 3;
    var stored = get(VOL_KEY);
    if (stored !== null) {
      var parsed = parseInt(stored, 10);
      if (!isNaN(parsed)) vol = Math.max(0, Math.min(100, parsed));
    }
    audio.volume = vol / 100;
    slider.value = String(vol);
    set(VOL_KEY, String(vol));

    function setIcons(playing) {
      iconPlaying.style.display = playing ? "block" : "none";
      iconMuted.style.display = playing ? "none" : "block";
    }

    var unlockAttached = false;
    function detachUnlock() { unlockAttached = false; }
    function unlockOnce() {
      if (unlockAttached) return;
      unlockAttached = true;
      var handler = function () {
        if (!audio.paused) { detachUnlock(); return; }
        var p;
        try { p = audio.play(); } catch (e) { p = null; }
        if (p && p.catch) p.catch(function () {});
        detachUnlock();
      };
      document.addEventListener("click", handler, { once: true });
      document.addEventListener("keydown", handler, { once: true });
      document.addEventListener("touchstart", handler, { once: true });
    }

    // Иконка отражает намерение, а не статус autoplay: на входе всегда
    // динамик включён на сохранённой громкости (дефолт 3%). Если браузер
    // заблокировал autoplay — ждём первый жест без слэша на иконке.
    function start() {
      setIcons(true);
      var p;
      try { p = audio.play(); } catch (e) { unlockOnce(); return; }
      if (p && typeof p.then === "function") p.catch(function () { unlockOnce(); });
      else if (audio.paused) unlockOnce();
    }

    start();

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      e.stopImmediatePropagation();
      detachUnlock();
      if (audio.paused) {
        setIcons(true);
        var p;
        try { p = audio.play(); } catch (err) { p = null; }
        if (p && p.catch) p.catch(function () {});
      } else {
        audio.pause();
        setIcons(false);
      }
    });

    slider.addEventListener("input", function (e) {
      var v = parseInt(e.target.value, 10);
      if (isNaN(v)) v = 3;
      v = Math.max(0, Math.min(100, v));
      audio.volume = v / 100;
      set(VOL_KEY, String(v));
    });

    function syncIconColor() {
      var ref = document.querySelector(".rf-theme-switch button, .rf-theme-switch [data-set]");
      if (ref) btn.style.color = getComputedStyle(ref).color;
    }
    syncIconColor();
    try {
      var mo = new MutationObserver(syncIconColor);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
      if (document.body) mo.observe(document.body, { attributes: true, attributeFilter: ["class", "data-theme"] });
    } catch (e) {}
    document.addEventListener("click", function (ev) {
      if (ev.target && ev.target.closest && ev.target.closest(".rf-theme-switch")) {
        setTimeout(syncIconColor, 0);
      }
    }, true);
  });
})();
