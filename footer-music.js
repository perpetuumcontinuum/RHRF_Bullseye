(function () {
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
      try {
        return window.localStorage;
      } catch (e) {
        return null;
      }
    }

    var store = getStore();

    function get(k) {
      try {
        return store ? store.getItem(k) : null;
      } catch (e) {
        return null;
      }
    }

    function set(k, v) {
      try {
        if (store) store.setItem(k, v);
      } catch (e) {}
    }

    function rem(k) {
      try {
        if (store) store.removeItem(k);
      } catch (e) {}
    }

    rem("rf-music-volume");
    rem("rf-music-volume-v2");

    var VOL_KEY = "rf-music-volume-v3";
    var MUTE_KEY = "rf-music-muted";
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

    function detachUnlock() {
      unlockAttached = false;
    }

    function unlockOnce() {
      if (unlockAttached) return;
      unlockAttached = true;

      var handler = function () {
        tryPlay();
        detachUnlock();
      };

      document.addEventListener("click", handler, { once: true });
      document.addEventListener("keydown", handler, { once: true });
      document.addEventListener("touchstart", handler, { once: true });
    }

    function tryPlay() {
      var promise;
      try {
        promise = audio.play();
      } catch (e) {
        setIcons(false);
        unlockOnce();
        return;
      }

      if (promise && typeof promise.then === "function") {
        promise.then(function () {
          setIcons(true);
          set(MUTE_KEY, "false");
        }).catch(function () {
          setIcons(false);
          unlockOnce();
        });
      } else {
        setIcons(!audio.paused);
        if (audio.paused) unlockOnce();
      }
    }

    var muted = get(MUTE_KEY) === "true";
    if (muted) {
      setIcons(false);
    } else {
      tryPlay();
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();

      if (audio.paused) {
        try {
          audio.play().then(function () {
            setIcons(true);
            set(MUTE_KEY, "false");
          }).catch(function () {});
        } catch (err) {}
      } else {
        audio.pause();
        setIcons(false);
        set(MUTE_KEY, "true");
      }

      detachUnlock();
    });

    slider.addEventListener("input", function (e) {
      var v = parseInt(e.target.value, 10);
      if (isNaN(v)) v = 3;
      v = Math.max(0, Math.min(100, v));

      audio.volume = v / 100;
      set(VOL_KEY, String(v));
      setIcons(!audio.paused);
    });
  });
})();
