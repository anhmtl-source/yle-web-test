// ========= NAV GIỮA 4 PART =========
let currentPart = 1;
const totalParts = 4;

function showPart(partNumber) {
  currentPart = partNumber;

  const panels = document.querySelectorAll(".part-panel");
  panels.forEach((panel, idx) => {
    panel.classList.toggle("hidden", idx + 1 !== partNumber);
  });

  const navBtns = document.querySelectorAll(".part-nav button");
  navBtns.forEach((btn, idx) => {
    btn.classList.toggle("active", idx + 1 === partNumber);
  });

  // Ẩn / hiện nút Nộp bài tùy theo part
  const submitBtn = document.getElementById("btnSubmit");
  if (submitBtn) {
    if (partNumber === 4) {
      // Chỉ hiện ở Part 4
      submitBtn.style.display = "inline-block";
    } else {
      // Ẩn ở Part 1, 2, 3
      submitBtn.style.display = "none";
    }
  }

  // Cuộn lên đầu phần thi
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".part-nav button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = Number(btn.dataset.part);
    showPart(p);
  });
});

document.getElementById("btnPrev").addEventListener("click", () => {
  if (currentPart > 1) showPart(currentPart - 1);
});

document.getElementById("btnNext").addEventListener("click", () => {
  if (currentPart < totalParts) showPart(currentPart + 1);
});

// ========= CUSTOM AUDIO PLAYER TÍM =========
function setupAudioPlayers() {
  document.querySelectorAll(".yl-audio-player").forEach((wrap) => {
    const audioId = wrap.dataset.audio;
    const audio = document.getElementById(audioId);
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
      timeEl.textContent = `${format(audio.currentTime)} / ${format(
        audio.duration
      )}`;
      const percent = (audio.currentTime / audio.duration) * 100;
      barFill.style.width = percent ? `${percent}%` : "0%";
    }

    playBtn.addEventListener("click", () => {
      // pause tất cả audio khác
      document.querySelectorAll("audio").forEach((a) => {
        if (a !== audio) {
          a.pause();
          a.currentTime = a.currentTime;
        }
      });
      document
        .querySelectorAll(".yl-play-btn")
        .forEach((b) => b.classList.remove("paused"));

      if (audio.paused) {
        audio.play();
        playBtn.classList.add("paused");
      } else {
        audio.pause();
        playBtn.classList.remove("paused");
      }
    });

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateTime);
    audio.addEventListener("ended", () => {
      playBtn.classList.remove("paused");
      updateTime();
    });

    bar.addEventListener("click", (e) => {
      const rect = bar.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      audio.currentTime = ratio * audio.duration;
    });

    updateTime();
  });
}

// ========= DRAG & DROP – PART 1 =========
function setupPart1() {
  const namePills = document.querySelectorAll(".name-pill");
  const dropBoxes = document.querySelectorAll(".drop-box");

  namePills.forEach((pill) => {
    pill.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", pill.dataset.name);
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

// ========= CHẤM ĐIỂM =========
function gradeTest() {
  let total = 0;
  let correct = 0;

  // Part 1 – so sánh text trong drop-box với data-answer
  document.querySelectorAll("#part1 .drop-box").forEach((box) => {
    const ans = (box.dataset.answer || "").trim().toLowerCase();
    const val = (box.textContent || "").trim().toLowerCase();
    if (ans) total++;
    if (ans && ans === val) correct++;
  });

  // Part 2 – input text trong .p2-row
  document.querySelectorAll("#part2 .p2-row").forEach((row) => {
    const ans = (row.dataset.answer || "").trim().toLowerCase();
    if (!ans) return;
    const input = row.querySelector("input[type='text']");
    if (!input) return;
    total++;
    const val = (input.value || "").trim().toLowerCase();
    if (val === ans) correct++;
  });

  // Part 3 – radio A/B/C
  document.querySelectorAll("#part3 .p3-card").forEach((card) => {
    if (card.classList.contains("example")) return;
    const ans = (card.dataset.correct || "").trim().toUpperCase();
    if (!ans) return;
    total++;
    const q = card.dataset.q;
    const checked = card.querySelector(
      `input[type="radio"][name="p3_q${q}"]:checked`
    );
    if (checked && checked.value.toUpperCase() === ans) correct++;
  });

  // Part 4 – select màu
  document.querySelectorAll("#part4 .p4-row").forEach((row) => {
    if (row.classList.contains("example")) return;
    const ans = (row.dataset.answer || "").trim().toLowerCase();
    if (!ans) return;
    total++;
    const sel = row.querySelector("select");
    const val = (sel.value || "").trim().toLowerCase();
    if (val === ans) correct++;
  });

  const resultEl = document.getElementById("examResult");
  resultEl.textContent = `Điểm đúng: ${correct} / ${total}`;
  alert(`Bạn làm đúng ${correct}/${total} câu.`);
}

// ========= TIMER TOÀN BÀI =========
function startTimer(minutes) {
  let remaining = minutes * 60;
  const label = document.getElementById("globalTimer");

  function tick() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    label.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(
      2,
      "0"
    )}`;

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
  showPart(1);
  setupAudioPlayers();
  setupPart1();
  startTimer(25); // 25 phút

  document.getElementById("btnSubmit").addEventListener("click", gradeTest);
});
