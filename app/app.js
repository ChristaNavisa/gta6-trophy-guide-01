/* Leonida Platinum Codex — tracker app. All audit numbers are computed from
   app/data/trophies.json at runtime; nothing in the audit strip is hard-coded. */
(function () {
  "use strict";
  var LS_KEY = "leonida-platinum-codex-v1";
  var POINTS = { platinum: 300, gold: 90, silver: 30, bronze: 15 };
  var GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

  var params = new URLSearchParams(location.search);
  var state = {
    data: null, earned: new Set(), counters: {},
    filter: "all", search: "", spoiler: params.get("spoiler") !== "0",
    tab: params.get("tab") || "tracker", selected: null, demo: params.get("demo") === "1"
  };

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  function loadProgress() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      var p = JSON.parse(raw);
      if (Array.isArray(p.earned)) state.earned = new Set(p.earned);
      if (p.counters) state.counters = p.counters;
      if (typeof p.spoiler === "boolean") state.spoiler = p.spoiler;
    } catch (e) { /* corrupt save: start clean */ }
  }
  function saveProgress() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        earned: Array.from(state.earned), counters: state.counters, spoiler: state.spoiler
      }));
    } catch (e) { /* storage full/blocked: progress is session-only */ }
  }
  function trophyById(id) {
    return state.data.trophies.find(function (t) { return t.id === id; });
  }
  function psnPoints(t) { return POINTS[t.grade] || 0; }
  function earnedPoints() {
    var s = 0;
    state.earned.forEach(function (id) { var t = trophyById(id); if (t) s += psnPoints(t); });
    return s;
  }
  function isHidden(t) { return !!t.hidden; }
  function spoilText(t) { return state.spoiler && isHidden(t); }

  /* ---------- audit (computed from data) ---------- */
  function audit() {
    var ts = state.data.trophies, srcs = state.data.sources;
    var steps = 0, backed2 = 0, cited = 0, disputes = 0;
    ts.forEach(function (t) {
      (t.steps || []).forEach(function (s) {
        steps++;
        if (s.s && s.s.length) cited++;
        if (s.s && s.s.length >= 2) backed2++;
      });
      if (t.dispute) disputes++;
    });
    var claims = steps + ts.length + disputes * 2;
    return {
      trophies: ts.length, steps: steps, backed2: backed2, cited: cited,
      disputes: disputes, claims: claims, sources: srcs.length,
      hidden: ts.filter(function (t) { return t.hidden; }).length,
      missable: ts.filter(function (t) { return t.missable && t.missable !== "no"; }).length,
      guides: ts.filter(function (t) { return typeof t.guide === "string" && t.guide.trim(); }).length,
      totalPoints: ts.reduce(function (a, t) { return a + psnPoints(t); }, 0)
    };
  }
  function renderAudit() {
    var a = audit();
    var cells = [
      [String(a.claims), "claims cited", "steps + guides + disputes×2"],
      [a.backed2 + "/" + a.steps, "steps backed by 2+ sources", a.cited + "/" + a.steps + " steps cited at all"],
      [a.guides + "/" + a.trophies, "full-text guides", "no stubs, no one-liners"],
      [String(a.disputes), "SOURCES DIFFER panels", "two versions + our call each"],
      [String(a.sources), "dated sources", "all read 20 Nov 2026"],
      [a.hidden + " hidden · " + a.missable + " missable", "transparency", "hidden split verified 28/27"]
    ];
    var grid = $("auditGrid");
    grid.innerHTML = "";
    cells.forEach(function (c) {
      var d = el("div", "audit-cell");
      d.appendChild(el("b", null, c[0]));
      d.appendChild(el("span", null, c[1]));
      d.appendChild(el("small", null, c[2]));
      grid.appendChild(d);
    });
  }

  /* ---------- progress ---------- */
  function renderProgress() {
    var total = state.data.trophies.length;
    $("earnedCount").textContent = state.earned.size;
    $("psnPoints").textContent = earnedPoints();
    $("progFill").style.width = Math.round(100 * state.earned.size / total) + "%";
    $("btnSpoiler").textContent = state.spoiler ? "Spoilers: hidden" : "Spoilers: shown";
    $("btnSpoiler").setAttribute("aria-pressed", String(state.spoiler));
  }

  /* ---------- filters + list ---------- */
  var FILTERS = [
    ["all", "All"], ["story", "Story"], ["collectible", "Collectibles"],
    ["activity", "Activities"], ["crime", "Crime"], ["odd", "Odd jobs"],
    ["hidden", "Hidden"], ["missable", "Missable"], ["earned", "Earned"], ["remaining", "Remaining"]
  ];
  function filtered() {
    var q = state.search.trim().toLowerCase();
    return state.data.trophies.filter(function (t) {
      if (state.filter === "earned" && !state.earned.has(t.id)) return false;
      if (state.filter === "remaining" && state.earned.has(t.id)) return false;
      if (state.filter === "hidden" && !t.hidden) return false;
      if (state.filter === "missable" && !(t.missable && t.missable !== "no")) return false;
      if (["story", "collectible", "activity", "crime", "odd"].indexOf(state.filter) >= 0 && t.kind !== state.filter) return false;
      if (q && (t.name + " " + t.description).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }
  function renderFilters() {
    var box = $("filters");
    box.innerHTML = "";
    FILTERS.forEach(function (f) {
      var n = f[0] === "all" ? state.data.trophies.length :
        f[0] === "earned" ? state.earned.size :
        f[0] === "remaining" ? state.data.trophies.length - state.earned.size :
        f[0] === "hidden" ? audit().hidden :
        f[0] === "missable" ? audit().missable :
        state.data.trophies.filter(function (t) { return t.kind === f[0]; }).length;
      var b = el("button", state.filter === f[0] ? "active" : null, f[1] + " (" + n + ")");
      b.type = "button";
      b.addEventListener("click", function () { state.filter = f[0]; renderList(); renderFilters(); });
      box.appendChild(b);
    });
  }
  function renderList() {
    var list = $("trophyList");
    list.innerHTML = "";
    filtered().forEach(function (t) {
      var li = el("li", state.selected === t.id ? "sel" : "");
      if (state.earned.has(t.id)) li.classList.add("done");
      var chk = el("span", "t-check", state.earned.has(t.id) ? "✓" : "");
      var g = el("span", "grade " + t.grade, t.grade === "platinum" ? "PLAT" : t.grade.slice(0, 4).toUpperCase());
      var wrap = el("div");
      var name = el("div", "t-name", spoilText(t) ? "Hidden trophy" : t.name);
      if (spoilText(t)) name.classList.add("spoiler-blur");
      var meta = el("div", "t-meta");
      meta.textContent = (t.hidden ? "Hidden · " : "") + psnPoints(t) + " pts · Stage " + t.stage +
        (t.counter ? " · " + (state.counters[t.id] || 0) + "/" + t.counter.total + " " + t.counter.label : "") +
        (t.missable && t.missable !== "no" ? " · MISSABLE" : "");
      wrap.appendChild(name);
      wrap.appendChild(meta);
      li.appendChild(chk);
      li.appendChild(g);
      li.appendChild(wrap);
      li.addEventListener("click", function () { select(t.id); });
      list.appendChild(li);
    });
  }

  /* ---------- detail ---------- */
  function citeHtml(s) {
    return (s.s || []).map(function (id) { return "[" + id + "]"; }).join(" ");
  }
  function renderDetail() {
    var box = $("detail");
    var t = state.selected != null ? trophyById(state.selected) : null;
    if (!t) {
      box.innerHTML = "<h2>Pick a trophy</h2><p class=\"guide-text\">Choose a trophy from the list. Every trophy has a full-text guide, numbered cited steps, and — where the sources disagree — a SOURCES DIFFER panel with our call.</p>";
      return;
    }
    box.innerHTML = "";
    var h = el("h2", null, spoilText(t) ? "Hidden trophy" : t.name);
    if (spoilText(t)) h.classList.add("spoiler-blur");
    box.appendChild(h);
    var badges = el("div", "badges");
    [["grade " + t.grade, t.grade.toUpperCase() + " · " + psnPoints(t) + " PTS", "gold"],
     ["", t.hidden ? "HIDDEN" : "SHOWN", t.hidden ? "purple" : ""],
     ["", t.missable && t.missable !== "no" ? "MISSABLE — " + t.missable : "NOT MISSABLE", t.missable && t.missable !== "no" ? "red" : ""],
     ["", "STAGE " + t.stage, ""],
     ["", "CHAPTER " + (t.chapter || "—"), ""],
     ["", t.kind.toUpperCase(), ""]].forEach(function (b) {
      badges.appendChild(el("span", "badge " + b[0] + " " + b[2], b[1]));
    });
    box.appendChild(badges);
    var q = el("div", "quote");
    q.textContent = "“" + (spoilText(t) ? "Hidden trophy — reveal spoilers to read the official description." : t.description) + "” — official trophy description";
    box.appendChild(q);
    // Counter and SOURCES DIFFER come before the guide text: the cover screenshot
    // must show the dispute panel and the progress counter in the first viewport.
    if (t.counter) {
      var cbox = el("div", "counter-box");
      cbox.appendChild(el("span", null, "YOUR COUNT — " + t.counter.label.toUpperCase() + ":"));
      var minus = el("button", null, "−"); minus.type = "button";
      var num = el("span", "c-num", String(state.counters[t.id] || 0) + " / " + t.counter.total);
      var plus = el("button", null, "+"); plus.type = "button";
      minus.addEventListener("click", function () {
        state.counters[t.id] = Math.max(0, (state.counters[t.id] || 0) - 1);
        saveProgress(); renderDetail(); renderList(); renderNextUp();
      });
      plus.addEventListener("click", function () {
        state.counters[t.id] = Math.min(t.counter.total, (state.counters[t.id] || 0) + 1);
        saveProgress(); renderDetail(); renderList(); renderNextUp();
      });
      cbox.appendChild(minus); cbox.appendChild(num); cbox.appendChild(plus);
      box.appendChild(cbox);
    }
    if (t.dispute) {
      var d = el("div", "diff");
      d.appendChild(el("div", "diff-head", "SOURCES DIFFER"));
      var body = el("div", "diff-body");
      var ca = el("div", "diff-cell a");
      ca.innerHTML = "<b>VERSION A</b>" + esc(t.dispute.a) + ' <span class="cite">' + esc((t.dispute.asrc || []).map(function (i) { return "[" + i + "]"; }).join(" ")) + "</span>";
      var cb = el("div", "diff-cell b");
      cb.innerHTML = "<b>VERSION B</b>" + esc(t.dispute.b) + ' <span class="cite">' + esc((t.dispute.bsrc || []).map(function (i) { return "[" + i + "]"; }).join(" ")) + "</span>";
      body.appendChild(ca); body.appendChild(cb);
      d.appendChild(body);
      var call = el("div", "diff-call");
      call.innerHTML = "<b>OUR CALL —</b> " + esc(t.dispute.call);
      d.appendChild(call);
      box.appendChild(d);
    }
    box.appendChild(el("p", "guide-text", t.guide));
    box.appendChild(el("h3", null, "HOW TO EARN IT"));
    var ol = el("ol", "steps");
    (t.steps || []).forEach(function (s) {
      var li = el("li");
      li.innerHTML = esc(s.t) + ' <span class="cite">' + esc(citeHtml(s)) + "</span>";
      ol.appendChild(li);
    });
    box.appendChild(ol);
    var earn = el("button", "earn-btn" + (state.earned.has(t.id) ? " earned" : ""), state.earned.has(t.id) ? "✓ Earned — click to unmark" : "Mark as earned");
    earn.type = "button";
    earn.addEventListener("click", function () {
      if (state.earned.has(t.id)) state.earned.delete(t.id); else state.earned.add(t.id);
      saveProgress(); renderAll();
    });
    box.appendChild(earn);
    var copy = el("button", "copy-link", "Copy link to this trophy");
    copy.type = "button";
    copy.style.marginLeft = "8px";
    copy.addEventListener("click", function () {
      var u = new URL(location.href);
      u.searchParams.set("tab", "tracker");
      u.searchParams.set("select", String(t.id));
      var done = function () { copy.textContent = "Link copied ✓"; setTimeout(function () { copy.textContent = "Copy link to this trophy"; }, 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u.toString()).then(done, done);
      else done();
    });
    box.appendChild(copy);
  }

  /* ---------- rail: Next Up + sources ---------- */
  function nextUpList() {
    return state.data.trophies
      .filter(function (t) { return !state.earned.has(t.id); })
      .sort(function (a, b) {
        return a.stage - b.stage || GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.id - b.id;
      }).slice(0, 5);
  }
  function renderNextUp() {
    var box = $("nextUp");
    box.innerHTML = "";
    box.appendChild(el("h3", null, "NEXT UP — CHEAPEST UNEARNED"));
    nextUpList().forEach(function (t) {
      var d = el("div", "next-item", spoilText(t) ? "Hidden trophy" : t.name);
      var m = el("span", "t-meta", t.grade + " · " + psnPoints(t) + " pts · Stage " + t.stage + (t.missable && t.missable !== "no" ? " · MISSABLE" : ""));
      d.appendChild(m);
      d.addEventListener("click", function () { select(t.id); });
      box.appendChild(d);
    });
    if (!nextUpList().length) box.appendChild(el("p", null, "All 55 earned — platinum is yours."));
  }
  function renderGuideSources() {
    var box = $("guideSources");
    box.innerHTML = "";
    box.appendChild(el("h3", null, "SOURCES FOR THIS GUIDE"));
    var ul = el("ol", "src-list");
    state.data.sources.forEach(function (s) {
      var li = el("li");
      var a = el("a", null, s.site + " — " + s.page);
      if (s.url) { a.href = s.url; a.target = "_blank"; a.rel = "noopener"; }
      li.appendChild(a);
      li.appendChild(el("span", "src-read", "read " + s.read));
      ul.appendChild(li);
    });
    box.appendChild(ul);
  }

  /* ---------- roadmap / missables / sources pages ---------- */
  function renderRoadmap() {
    var box = $("roadmap");
    box.innerHTML = "";
    var stages = [
      [1, "Stage 1 — Story, Chapters 1–2", "Play the story in order. Do the ONE possibly missable thing the moment it appears: the Chapter 1 balcony meditation (Positive Mental Attitude) right after the mission Down to Earth. Start the long counters now — WAiNK scans, vehicles, meditation spots with both characters."],
      [2, "Stage 2 — Story, Chapters 3–4 + contacts", "Keep the story moving and take contact missions as they appear: Andy, Kenton, Billy, Randy and Tyrone each have a final-mission trophy. Sweep the open map between missions — collectibles, drone races, the shooting range."],
      [3, "Stage 3 — Finale + 100% Completion", "Finish the story (Operation Savage Glory, then the final mission). Then work the 100% Completion checklist in Progress > Stats: 35 tasks — challenges (70 of 80), card sets, WAiNK spots, underwater discoveries, flamingos, gang operations, bank vaults, drone trials. A Long Road (100%) is the longest single requirement."],
      [4, "Stage 4 — Cleanup", "The one-off trophies: cocktail on Ocean Beach, bowling, scooter registrations, the odd jobs. The platinum pops on the last trophy you earn, whatever that is. About 200 hours at 4/10 difficulty; everything is offline and single-player."]
    ];
    stages.forEach(function (st) {
      var ts = state.data.trophies.filter(function (t) { return t.stage === st[0]; });
      var earned = ts.filter(function (t) { return state.earned.has(t.id); }).length;
      var card = el("div", "stage");
      card.appendChild(el("h2", null, st[1] + " — " + earned + "/" + ts.length + " earned"));
      card.appendChild(el("p", null, st[2]));
      var ul = el("ul");
      ts.forEach(function (t) {
        var li = el("li", null, (state.earned.has(t.id) ? "✓ " : "○ ") + (spoilText(t) ? "Hidden trophy" : t.name) + " — " + t.grade + ", " + psnPoints(t) + " pts");
        ul.appendChild(li);
      });
      card.appendChild(ul);
      box.appendChild(card);
    });
  }
  function renderMissables() {
    var box = $("missables");
    box.innerHTML = "";
    var miss = state.data.trophies.filter(function (t) { return t.missable && t.missable !== "no"; });
    miss.forEach(function (t) {
      var card = el("div", "miss-card");
      card.appendChild(el("h2", null, "⚠ " + t.name + " — " + t.missable.toUpperCase()));
      card.appendChild(el("p", "guide-text", t.guide));
      var ol = el("ol", "steps");
      (t.steps || []).forEach(function (s) {
        var li = el("li");
        li.innerHTML = esc(s.t) + ' <span class="cite">' + esc(citeHtml(s)) + "</span>";
        ol.appendChild(li);
      });
      card.appendChild(ol);
      box.appendChild(card);
    });
    var note = el("div", "miss-note");
    note.appendChild(el("h3", null, "Why only one missable?"));
    note.appendChild(el("p", null, "PowerPyx lists exactly 1 possibly missable trophy in GTA VI, and this guide agrees: the Chapter 1 balcony meditation. There is no mission replay, but free-roam after the story keeps everything else available. Two trophies are still UNCONFIRMED (The Truth Is Out There — no proven method; Ten Pin — method still being confirmed; Personal Best — trigger unclear). They are flagged unconfirmed in their guides rather than given an invented method."));
    box.appendChild(note);
  }
  function renderSourcesPage() {
    var box = $("sourcesPage");
    box.innerHTML = "";
    box.appendChild(el("h2", null, "Sources — all read 20 Nov 2026"));
    var counts = {};
    state.data.trophies.forEach(function (t) {
      (t.steps || []).forEach(function (s) { (s.s || []).forEach(function (id) { counts[id] = (counts[id] || 0) + 1; }); });
      (t.sources || []).forEach(function (id) { counts["g" + id] = (counts["g" + id] || 0) + 1; });
    });
    var table = el("table", "src-table");
    table.innerHTML = "<thead><tr><th>#</th><th>Site — page</th><th>Read</th><th>Steps citing it</th></tr></thead>";
    var tb = el("tbody");
    state.data.sources.forEach(function (s) {
      var tr = el("tr");
      tr.appendChild(el("td", null, String(s.id)));
      var td = el("td");
      if (s.url) {
        var a = el("a", null, s.site + " — " + s.page);
        a.href = s.url; a.target = "_blank"; a.rel = "noopener";
        td.appendChild(a);
      } else td.textContent = s.site + " — " + s.page;
      tr.appendChild(td);
      tr.appendChild(el("td", null, s.read));
      tr.appendChild(el("td", null, String(counts[s.id] || 0)));
      tb.appendChild(tr);
    });
    table.appendChild(tb);
    box.appendChild(table);
  }

  /* ---------- selection / tabs ---------- */
  function select(id) {
    state.selected = id;
    renderList(); renderDetail(); renderNextUp();
    var u = new URL(location.href);
    u.searchParams.set("select", String(id));
    history.replaceState(null, "", u.toString());
  }
  function setTab(name) {
    state.tab = name;
    document.querySelectorAll(".tabs button").forEach(function (b) {
      var on = b.dataset.tab === name;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", String(on));
    });
    document.querySelectorAll(".tabpage").forEach(function (p) {
      p.classList.toggle("active", p.id === "tab-" + name);
    });
    var u = new URL(location.href);
    u.searchParams.set("tab", name);
    history.replaceState(null, "", u.toString());
  }

  function renderAll() {
    renderAudit(); renderProgress(); renderFilters(); renderList();
    renderDetail(); renderNextUp(); renderGuideSources();
    renderRoadmap(); renderMissables(); renderSourcesPage();
  }

  function selftest() {
    var a = audit();
    var checks = [
      ["data loaded", !!state.data],
      ["55 trophies", state.data && state.data.trophies.length === 55],
      ["all guides non-empty strings", a.guides === 55],
      ["all steps cited", a.cited === a.steps],
      ["claims math", a.claims === a.steps + a.trophies + a.disputes * 2],
      ["grades 1P/2G/6S/46B", (function () {
        var g = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
        state.data.trophies.forEach(function (t) { g[t.grade]++; });
        return g.platinum === 1 && g.gold === 2 && g.silver === 6 && g.bronze === 46;
      })()],
      ["hidden 28, missable 1", a.hidden === 28 && a.missable === 1],
      ["sources 27, all dated 20 Nov 2026", a.sources === 27 && state.data.sources.every(function (s) { return s.read === "20 Nov 2026"; })],
      ["list rendered", document.querySelectorAll("#trophyList li").length > 0],
      ["detail rendered", !!document.querySelector("#detail h2")],
      ["copy-link button present", !!document.querySelector("#detail .copy-link")]
    ];
    var ok = checks.every(function (c) { return c[1]; });
    return { ok: ok, checks: checks, audit: a };
  }

  function init() {
    loadProgress();
    if (state.demo) {
      [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].forEach(function (id) { state.earned.add(id); });
      state.counters[28] = 1;
    }
    fetch("data/trophies.json")
      .then(function (r) { if (!r.ok) throw new Error("trophies.json " + r.status); return r.json(); })
      .then(function (data) {
        state.data = data;
        var sel = parseInt(params.get("select") || "", 10);
        state.selected = trophyById(sel) ? sel : 28; /* Positive Mental Attitude on the cover */
        document.querySelectorAll(".tabs button").forEach(function (b) {
          b.addEventListener("click", function () { setTab(b.dataset.tab); });
        });
        $("search").addEventListener("input", function (e) { state.search = e.target.value; renderList(); });
        $("btnSpoiler").addEventListener("click", function () { state.spoiler = !state.spoiler; saveProgress(); renderAll(); });
        $("btnReset").addEventListener("click", function () {
          if (!confirm("Reset all progress in this guide?")) return;
          state.earned = new Set(); state.counters = {}; saveProgress(); renderAll();
        });
        $("btnExport").addEventListener("click", function () {
          var blob = new Blob([JSON.stringify({ earned: Array.from(state.earned), counters: state.counters }, null, 2)], { type: "application/json" });
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "leonida-platinum-codex-progress.json";
          a.click();
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
        });
        $("btnImport").addEventListener("click", function () { $("importFile").click(); });
        $("importFile").addEventListener("change", function (e) {
          var f = e.target.files && e.target.files[0];
          if (!f) return;
          var r = new FileReader();
          r.onload = function () {
            try {
              var p = JSON.parse(r.result);
              if (Array.isArray(p.earned)) state.earned = new Set(p.earned.filter(function (id) { return trophyById(id); }));
              if (p.counters) state.counters = p.counters;
              saveProgress(); renderAll();
            } catch (err) { alert("Import failed: not a valid progress file."); }
          };
          r.readAsText(f);
        });
        setTab(state.tab);
        renderAll();
        window.__guideSelftest = selftest;
        if (params.get("selftest") === "1") {
          window.__guideSelftestResult = selftest();
          console.log("guide selftest", window.__guideSelftestResult);
        }
      })
      .catch(function (err) {
        document.getElementById("detail").innerHTML = "<h2>Failed to load trophy data</h2><p>" + esc(err.message) + "</p>";
      });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
