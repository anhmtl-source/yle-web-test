// ========= YLE Listening NAV (Part 1 → Part N) =========
(function () {
  let partOrder = []; // [{num, el}]
  let currentIdx = 0;

  function scanParts() {
    const panels = Array.from(document.querySelectorAll(".part-panel"));
    partOrder = panels
      .map((el) => {
        const m = (el.id || "").match(/^part(\d+)$/i);
        return m ? { num: Number(m[1]), el } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.num - b.num);

    // fallback nếu không match id
    if (!partOrder.length && panels.length) {
      partOrder = panels.map((el, i) => ({ num: i + 1, el }));
    }
  }

  function setActiveNav(partNum) {
    const navBtns = document.querySelectorAll(".part-nav button");
    navBtns.forEach((btn) => {
      const n = Number(btn.dataset.part);
      btn.classList.toggle("active", n === partNum);
    });
  }

  function updateArrows() {
    const btnPrev = document.getElementById("btnPrev");
    const btnNext = document.getElementById("btnNext");
    if (btnPrev) btnPrev.disabled = currentIdx <= 0;
    if (btnNext) btnNext.disabled = currentIdx >= partOrder.length - 1;
  }

  function updateSubmit(partNum) {
    const submitBtn = document.getElementById("btnSubmit");
    const submitRow = document.querySelector(".submit-row");
    const lastNum = partOrder.length ? partOrder[partOrder.length - 1].num : 1;
    const show = partNum === lastNum;
    if (submitBtn) submitBtn.style.display = show ? "inline-block" : "none";
    if (submitRow) submitRow.style.display = show ? "block" : "none";
  }

  function showPart(partNum, opts = { scroll: true }) {
    const idx = partOrder.findIndex((p) => p.num === partNum);
    if (idx === -1) return;

    currentIdx = idx;

    partOrder.forEach((p) => p.el.classList.add("hidden"));
    partOrder[currentIdx].el.classList.remove("hidden");

    setActiveNav(partNum);
    updateArrows();
    updateSubmit(partNum);

    if (opts.scroll) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // expose for inline handlers (nếu HTML còn onclick)
  window.goPrevPart = function () {
    if (currentIdx > 0) showPart(partOrder[currentIdx - 1].num);
  };
  window.goNextPart = function () {
    if (currentIdx < partOrder.length - 1) showPart(partOrder[currentIdx + 1].num);
  };

  function bindNav() {
    // Part buttons
    document.querySelectorAll(".part-nav button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = Number(btn.dataset.part);
        showPart(p);
      });
    });

    // Arrow buttons
    const btnPrev = document.getElementById("btnPrev");
    const btnNext = document.getElementById("btnNext");

    if (btnPrev) {
      // chống double-call do onclick inline
      btnPrev.removeAttribute("onclick");
      btnPrev.onclick = null;
      btnPrev.addEventListener("click", window.goPrevPart);
    }
    if (btnNext) {
      btnNext.removeAttribute("onclick");
      btnNext.onclick = null;
      btnNext.addEventListener("click", window.goNextPart);
    }
  }

  // ========= CUSTOM AUDIO PLAYER =========
  function setupAudioPlayers() {
    document.querySelectorAll(".yl-audio-player").forEach((wrap) => {
      const audioId = wrap.dataset.audio;
      const audio = document.getElementById(audioId);
      if (!audio) return;

      const playBtn = wrap.querySelector(".yl-play-btn");
      const timeEl = wrap.querySelector(".yl-time");
      const bar = wrap.querySelector(".yl-bar");
      const barFill = wrap.querySelector(".yl-bar-fill");

      function format(sec) {
        if (!isFinite(sec)) return "00:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      }

      function updateTime() {
        if (!timeEl || !barFill) return;
        timeEl.textContent = `${format(audio.currentTime)} / ${format(audio.duration)}`;
        const percent = (audio.currentTime / audio.duration) * 100;
        barFill.style.width = percent ? `${percent}%` : "0%";
      }

      if (playBtn) {
        playBtn.addEventListener("click", () => {
          // pause tất cả audio khác
          document.querySelectorAll("audio").forEach((a) => {
            if (a !== audio) a.pause();
          });
          document.querySelectorAll(".yl-play-btn").forEach((b) => b.classList.remove("paused"));

          if (audio.paused) {
            audio.play();
            playBtn.classList.add("paused");
          } else {
            audio.pause();
            playBtn.classList.remove("paused");
          }
        });
      }

      audio.addEventListener("timeupdate", updateTime);
      audio.addEventListener("loadedmetadata", updateTime);
      audio.addEventListener("ended", () => {
        if (playBtn) playBtn.classList.remove("paused");
        updateTime();
      });

      if (bar) {
        bar.addEventListener("click", (e) => {
          const rect = bar.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          audio.currentTime = ratio * audio.duration;
        });
      }

      updateTime();
    });
  }

  // ========= DRAG & DROP – PART 1 =========
  function setupPart1() {
    const namePills = document.querySelectorAll("#part1 .name-pill");
    const dropBoxes = document.querySelectorAll("#part1 .drop-box");

    namePills.forEach((pill) => {
      pill.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", pill.dataset.name || "");
      });
    });

    dropBoxes.forEach((box) => {
      box.addEventListener("dragover", (e) => e.preventDefault());
      box.addEventListener("drop", (e) => {
        e.preventDefault();
        const name = e.dataTransfer.getData("text/plain");
        box.textContent = name;
      });
    });
  }

  // ========= CHẤM ĐIỂM (5 PART) =========
  function gradeTest() {
    let total = 0;
    let correct = 0;

    // Part 1
    document.querySelectorAll("#part1 .drop-box").forEach((box) => {
      const ans = (box.dataset.answer || "").trim().toLowerCase();
      if (!ans) return;
      total++;
      const val = (box.textContent || "").trim().toLowerCase();
      if (val === ans) correct++;
    });

    // Part 2
    document.querySelectorAll("#part2 .p2-row").forEach((row) => {
      const ans = (row.dataset.answer || "").trim().toLowerCase();
      if (!ans) return;
      const input = row.querySelector("input[type='text']");
      if (!input) return;
      total++;
      const val = (input.value || "").trim().toLowerCase();
      if (val === ans) correct++;
    });

    // Part 3 (Movers: viết chữ A–H)
    document.querySelectorAll("#part3 .m3-row[data-answer]").forEach((row) => {
      if (row.classList.contains("example")) return;
      const ans = (row.dataset.answer || "").trim().toUpperCase();
      if (!ans) return;
      const input = row.querySelector("input.m3-answer");
      if (!input) return;
      total++;
      const val = (input.value || "").trim().toUpperCase();
      if (val === ans) correct++;
    });

    // Part 4 (tick A/B/C) – dùng data-answer + name="p4_qX"
    document.querySelectorAll("#part4 .p3-card[data-answer]").forEach((card) => {
      const ans = (card.dataset.answer || "").trim().toUpperCase();
      const q = card.dataset.q;
      if (!ans || !q) return;
      total++;
      const checked = card.querySelector(`input[type="radio"][name="p4_q${q}"]:checked`);
      if (checked && (checked.value || "").toUpperCase() === ans) correct++;
    });

    // Part 5 (colour) – so dataset.color so với data-answer
    document.querySelectorAll("#part5 .p4-drop-zone[data-answer]").forEach((zone) => {
      const ans = (zone.dataset.answer || "").trim().toLowerCase();
      if (!ans) return;
      total++;
      const val = (zone.dataset.color || "").trim().toLowerCase();
      if (val === ans) correct++;
    });

    alert(`Bạn làm đúng ${correct}/${total} câu.`);
  }

  // ========= TIMER TOÀN BÀI =========
  function startTimer(minutes) {
    let remaining = minutes * 60;
    const label = document.getElementById("globalTimer");
    if (!label) return;

    function tick() {
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      label.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

      if (remaining > 0) {
        remaining--;
        setTimeout(tick, 1000);
      } else {
        alert("Hết giờ! Hệ thống sẽ chấm bài.");
        gradeTest();
      }
    }

    tick();
  }

  // ========= INIT =========
  window.addEventListener("DOMContentLoaded", () => {
    scanParts();
    bindNav();

    // default show part 1 (hoặc part nhỏ nhất)
    const first = partOrder.length ? partOrder[0].num : 1;
    showPart(first, { scroll: false });

    setupAudioPlayers();
    setupPart1();
    startTimer(25);

    const submitBtn = document.getElementById("btnSubmit");
    if (submitBtn) submitBtn.addEventListener("click", gradeTest);
  });
})();
