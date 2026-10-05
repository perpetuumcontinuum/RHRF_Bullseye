    (function () {
      var el = document.getElementById("rfMaintenance");
      if (!el) return;

      var DEFAULT = false;
      var KEY = "rf_maintenance";
      var tape = el.querySelector(".rf-tape");

      function read() {
        try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; }
      }

      function layout() {
        if (!tape) return;
        var w = window.innerWidth, h = window.innerHeight;
        var a = Math.atan2(h, w) * 180 / Math.PI;
        tape.style.setProperty("--tape-a", (-a) + "deg");
        tape.style.setProperty("--tape-w", Math.ceil(Math.hypot(w, h)) + "px");
      }

      function set(v) {
        el.hidden = !v;
        if (v) layout();
        try {
          if (v) localStorage.setItem(KEY, "1");
          else localStorage.removeItem(KEY);
        } catch (e) {}
      }

      var q = new URLSearchParams(location.search);
      if (q.has("maintenance")) {
        var val = q.get("maintenance");
        set(val === "" || val === "1" || val === "true");
      } else if (!DEFAULT) {
        set(false);
      } else {
        set(read());
      }

      addEventListener("resize", layout);
      addEventListener("orientationchange", layout);

      window.rfMaint = {
        on: function () { set(true); },
        off: function () { set(false); },
        toggle: function () { set(el.hidden); },
        get state() { return !el.hidden; }
      };
    })();
  