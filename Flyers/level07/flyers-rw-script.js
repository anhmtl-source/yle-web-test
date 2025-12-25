// ---------- CÀI ĐẶT CHUNG ----------
const TOTAL_PARTS = 6;
let currentPart = 1;

// ---------- ĐỒNG HỒ ----------
const TEST_TIME_SECONDS = 40 * 60; // 40 phút
let remainingSeconds = TEST_TIME_SECONDS;

const timerEl = document.getElementById("rwTimer");

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function updateTimer() {
  if (!timerEl) return;
  timerEl.textContent = formatTime(remainingSeconds);
}

updateTimer();

setInterval(() => {
  if (remainingSeconds <= 0) return;
  remainingSeconds -= 1;
  updateTimer();
}, 1000);

// ---------- HIỂN THỊ PART ----------
function showPart(n) {
  currentPart = Math.min(Math.max(n, 1), TOTAL_PARTS);

  document.querySelectorAll(".rw-part").forEach((sec) => {
    const partId = Number(sec.dataset.part);
    sec.classList.toggle("rw-part-active", partId === currentPart);
  });

  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  if (btnPrev) btnPrev.disabled = currentPart === 1;
  if (btnNext) btnNext.disabled = currentPart === TOTAL_PARTS;

  // Nút NỘP TOÀN BÀI chỉ hiện ở part cuối
  const submitRow = document.querySelector(".rw-submit-row");
  if (submitRow) submitRow.style.display = currentPart === TOTAL_PARTS ? "block" : "none";
}

showPart(1);

// ---------- NÚT CHUYỂN TRANG ----------
const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");
if (btnPrev) btnPrev.addEventListener("click", () => currentPart > 1 && showPart(currentPart - 1));
if (btnNext) btnNext.addEventListener("click", () => currentPart < TOTAL_PARTS && showPart(currentPart + 1));

// ---------- CHẤM ĐIỂM ----------
function normaliseText(val) {
  return (val || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function gradeAllQuestions() {
  let totalQuestions = 0;
  let correct = 0;

  // Clear old marks
  document.querySelectorAll("input.correct, input.incorrect").forEach((inp) => {
    inp.classList.remove("correct", "incorrect");
  });

  // Inputs with data-answer
  const textInputs = document.querySelectorAll("input[type='text'][data-answer]");
  textInputs.forEach((input) => {
    const answers = (input.dataset.answer || "")
      .split("/")
      .map((a) => a.trim())
      .filter(Boolean);

    if (!answers.length) return;

    const user = (input.value || "").trim();
    totalQuestions += 1;

    const isCorrect = user && answers.some((a) => normaliseText(a) === normaliseText(user));
    if (isCorrect) {
      correct += 1;
      input.classList.add("correct");
    } else {
      input.classList.add("incorrect");
    }
  });

  return { correct, totalQuestions };
}

function calculateShields(percentage) {
  if (percentage <= 20) return 1;
  if (percentage <= 40) return 2;
  if (percentage <= 60) return 3;
  if (percentage <= 80) return 4;
  return 5;
}

// ---------- POPUP KHIÊN + NHẠC ----------
const shieldOverlay = document.getElementById("shieldResult");
const shieldIconsBox = document.getElementById("shieldIcons");
const shieldCountSpan = document.getElementById("shieldCount");
const shieldSound = document.getElementById("shieldSound");

function showShieldPopup(shieldCount) {
  if (!shieldOverlay || !shieldIconsBox || !shieldCountSpan) return;

  shieldIconsBox.innerHTML = "";
  for (let i = 0; i < shieldCount; i++) {
    const img = document.createElement("img");
    img.src = "Media/YLE/images/icons/khiên.png";
    img.alt = "shield";
    shieldIconsBox.appendChild(img);
  }

  shieldCountSpan.textContent = String(shieldCount);

  shieldOverlay.classList.remove("hidden");
  shieldOverlay.classList.add("active");

  if (shieldSound) {
    shieldSound.currentTime = 0;
    shieldSound.play().catch(() => {});
  }
}

function closeShieldResult() {
  if (!shieldOverlay) return;

  shieldOverlay.classList.add("hidden");
  shieldOverlay.classList.remove("active");

  if (shieldSound) {
    shieldSound.pause();
    shieldSound.currentTime = 0;
  }
}

if (shieldOverlay) {
  const closeBtn = shieldOverlay.querySelector(".shield-close");
  if (closeBtn) closeBtn.addEventListener("click", closeShieldResult);

  shieldOverlay.addEventListener("click", (e) => {
    if (e.target === shieldOverlay) closeShieldResult();
  });
}

// ---------- POPUP XÁC NHẬN ----------
const confirmOverlay = document.getElementById("confirmSubmit");
const confirmCloseBtn = confirmOverlay ? confirmOverlay.querySelector(".rw-confirm-close") : null;
const confirmSubmitBtn = confirmOverlay ? confirmOverlay.querySelector(".rw-confirm-submit") : null;

function openConfirmSubmit() {
  if (confirmOverlay) confirmOverlay.classList.add("active");
}
function closeConfirmSubmit() {
  if (confirmOverlay) confirmOverlay.classList.remove("active");
}

if (confirmCloseBtn) confirmCloseBtn.addEventListener("click", closeConfirmSubmit);
if (confirmOverlay) {
  confirmOverlay.addEventListener("click", (e) => {
    if (e.target === confirmOverlay) closeConfirmSubmit();
  });
}

if (confirmSubmitBtn) {
  confirmSubmitBtn.addEventListener("click", () => {
    const { correct, totalQuestions } = gradeAllQuestions();
    const percentage = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;
    const shields = calculateShields(percentage);

    closeConfirmSubmit();
    showShieldPopup(shields);
  });
}

// ---------- NÚT NỘP ----------
const btnSubmitRW = document.getElementById("btnSubmitRW");
if (btnSubmitRW) btnSubmitRW.addEventListener("click", openConfirmSubmit);

// ---------- CLICK WORD BANK / OPTIONS -> FILL ACTIVE INPUT ----------
let activeInput = null;

document.addEventListener("focusin", (e) => {
  if (e.target && e.target.matches && e.target.matches("input.flyers-blank")) {
    activeInput = e.target;
  }
});

document.addEventListener("click", (e) => {
  if (!activeInput) return;

  const word = e.target.closest(".flyers-rw1__word");
  if (word && word.dataset.fill) {
    activeInput.value = word.dataset.fill;
    activeInput.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  const opt = e.target.closest(".flyers-rw2__opt");
  if (opt && opt.dataset.fill) {
    activeInput.value = opt.dataset.fill;
    activeInput.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  const w3 = e.target.closest(".flyers-rw3__word");
  if (w3 && w3.dataset.fill) {
    activeInput.value = w3.dataset.fill;
    activeInput.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  const opt3 = e.target.closest(".flyers-rw3__opt");
  if (opt3 && opt3.dataset.fill) {
    activeInput.value = opt3.dataset.fill;
    activeInput.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  const c4 = e.target.closest(".flyers-rw4__choice");
  if (c4 && c4.dataset.fill) {
    activeInput.value = c4.dataset.fill;
    activeInput.dispatchEvent(new Event("input", { bubbles: true }));
  }

  const w5 = e.target.closest(".flyers-rw5__word");
  if (w5 && w5.dataset.fill) {
    activeInput.value = w5.dataset.fill;
    activeInput.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  // Part 6 intentionally has no word bank (students type answers directly)
});

// ---------- RESOLVE ILLUSTRATION PATHS (NO UPLOAD ON STUDENT PAGE) ----------
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = reject;
    img.src = url;
  });
}

async function resolveIllustration(selector) {
  const imgs = Array.from(document.querySelectorAll(selector));
  if (!imgs.length) return;

  const first = imgs[0];
  const def = (first.dataset.defaultSrc || first.getAttribute("src") || "").trim();
  if (!def) return;

  // Try common folder depths + absolute path (when hosting at domain root)
  const abs = "/" + def.replace(/^\/+/, "");
  const candidates = [def, "./" + def, "../" + def, "../../" + def, abs];

  for (const c of candidates) {
    try {
      await loadImage(c);
      imgs.forEach((img) => (img.src = c));
      return;
    } catch (e) {
      // keep trying
    }
  }
}

// Init illustration resolving for Part 2 + Part 3
resolveIllustration(".js-p2-illustration");
resolveIllustration(".js-p3-illustration");
resolveIllustration(".js-p4-illustration");
resolveIllustration(".js-p5-illustration");
resolveIllustration(".js-p6-illustration");
