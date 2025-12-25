// ---------- CÀI ĐẶT CHUNG ----------
const TOTAL_PARTS = 5;
let currentPart = 1;

// ---------- ĐỒNG HỒ 3D ----------
const TEST_TIME_SECONDS = 25 * 60; // 25 phút
let remainingSeconds = TEST_TIME_SECONDS;

const timerEl = document.getElementById("rwTimer");

function formatTime(sec) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
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

  // Nút NỘP TOÀN BÀI chỉ hiện ở Part 5
  const submitRow = document.querySelector(".rw-submit-row");
  if (submitRow) {
    submitRow.style.display = currentPart === TOTAL_PARTS ? "block" : "none";
  }
}

// lần đầu
showPart(1);

// ---------- NÚT CHUYỂN TRANG ----------
const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");

if (btnPrev) {
  btnPrev.addEventListener("click", () => {
    if (currentPart > 1) showPart(currentPart - 1);
  });
}
if (btnNext) {
  btnNext.addEventListener("click", () => {
    if (currentPart < TOTAL_PARTS) showPart(currentPart + 1);
  });
}

// ---------- HÀM HỖ TRỢ CHẤM ĐIỂM ----------
function normaliseText(val) {
  return (val || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

// Chấm toàn bộ bài (5 part)
function gradeAllQuestions() {
  let totalQuestions = 0;
  let correct = 0;

  // Xoá highlight cũ
  document.querySelectorAll(".rw-correct, .rw-wrong").forEach((el) => {
    el.classList.remove("rw-correct", "rw-wrong");
  });
  document
    .querySelectorAll("input.correct, input.incorrect")
    .forEach((inp) => inp.classList.remove("correct", "incorrect"));

  // 1) Các câu có data-question + data-answer (radio hoặc text)
  const questionNodes = document.querySelectorAll("[data-question][data-answer]");

  questionNodes.forEach((node) => {
    const answers = node.dataset.answer
      .split("/")
      .map(normaliseText)
      .filter(Boolean);

    if (!answers.length) return;

    let userAnswer = "";

    // Nếu có radio trong node → lấy radio được chọn
    const radios = node.querySelectorAll('input[type="radio"]');
    if (radios.length > 0) {
      const checked = Array.from(radios).find((r) => r.checked);
      if (checked) userAnswer = normaliseText(checked.value);
    } else {
      // Nếu là input text trong node
      const textInput = node.querySelector("input[type='text']");
      if (textInput) userAnswer = normaliseText(textInput.value);
    }

    totalQuestions += 1;
    const isCorrect = userAnswer && answers.includes(userAnswer);

    if (isCorrect) {
      correct += 1;
      node.classList.add("rw-correct");
      const textInput = node.querySelector("input[type='text']");
      if (textInput) textInput.classList.add("correct");
    } else {
      node.classList.add("rw-wrong");
      const textInput = node.querySelector("input[type='text']");
      if (textInput) textInput.classList.add("incorrect");
    }
  });

  // 2) Các ô điền từ có data-answer trực tiếp trên input
  //    (ví dụ Part 4 – đọc đoạn văn và điền từ)
  const textInputs = document.querySelectorAll("input[type='text'][data-answer]");

  textInputs.forEach((input) => {
    // Nếu input nằm trong 1 node đã chấm ở trên thì bỏ qua
    if (input.closest("[data-question][data-answer]")) return;

    const answers = input.dataset.answer
      .split("/")
      .map(normaliseText)
      .filter(Boolean);
    if (!answers.length) return;

    const userAnswer = normaliseText(input.value);

    totalQuestions += 1;
    const isCorrect = userAnswer && answers.includes(userAnswer);

    input.classList.remove("correct", "incorrect");
    if (isCorrect) {
      correct += 1;
      input.classList.add("correct");
    } else {
      input.classList.add("incorrect");
    }
  });

  return { correct, totalQuestions };
}

// ---------- TÍNH KHIÊN (theo % đúng) ----------
function calculateShields(percentage) {
  if (percentage <= 20) return 1;
  if (percentage <= 40) return 2;
  if (percentage <= 60) return 3;
  if (percentage <= 80) return 4;
  return 5;
}


// ---------- SHIELD ICON (INLINE SVG - tránh lỗi mất file ảnh) ----------
const SHIELD_ICON_DATA_URI = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffd36e"/>
      <stop offset="0.55" stop-color="#ff9a2f"/>
      <stop offset="1" stop-color="#ff5a2c"/>
    </linearGradient>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <filter id="ds" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000" flood-opacity="0.25"/>
    </filter>
  </defs>
  <path filter="url(#ds)" d="M32 6c7.5 6 15.6 6.7 22 7.3v18.7C54 45.2 43.1 55.5 32 58 20.9 55.5 10 45.2 10 32V13.3C16.4 12.7 24.5 12 32 6z" fill="url(#g)" stroke="#8a3b0a" stroke-width="2" />
  <path d="M19 18c4.5-0.6 9.5-1.6 13-4 3.5 2.4 8.5 3.4 13 4v11.5c0 9-6.6 16.8-13 19.1-6.4-2.3-13-10.1-13-19.1V18z" fill="url(#s)"/>
  <path d="M32 18l3.2 6.5 7.2 1.1-5.2 5.1 1.2 7.2L32 34.9l-6.4 3.1 1.2-7.2-5.2-5.1 7.2-1.1z" fill="#fff" opacity="0.9"/>
</svg>`);
// ---------- POPUP KHIÊN KHỦNG LONG + NHẠC ----------
const shieldOverlay = document.getElementById("shieldResult");
const shieldIconsBox = document.getElementById("shieldIcons");
const shieldCountSpan = document.getElementById("shieldCount");
const shieldSound = document.getElementById("shieldSound"); // <audio>

function showShieldPopup(shieldCount) {
  if (!shieldOverlay || !shieldIconsBox || !shieldCountSpan) return;

  // Vẽ lại icon khiên
  shieldIconsBox.innerHTML = "";
  for (let i = 0; i < shieldCount; i++) {
    const img = document.createElement("img");
    img.src = SHIELD_ICON_DATA_URI;
    img.alt = "shield";
    shieldIconsBox.appendChild(img);
  }

  shieldCountSpan.textContent = shieldCount;

  // Hiện popup + blur nền
  shieldOverlay.classList.remove("hidden");
  shieldOverlay.classList.add("active");

  // Phát nhạc chúc mừng
  if (shieldSound) {
    shieldSound.currentTime = 0;
    shieldSound.play().catch(() => {
      // nếu trình duyệt chặn auto-play thì bỏ qua
    });
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

// Nút X & click ra ngoài để đóng
if (shieldOverlay) {
  const closeBtn = shieldOverlay.querySelector(".shield-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeShieldResult);
  }

  shieldOverlay.addEventListener("click", (e) => {
    if (e.target === shieldOverlay) {
      closeShieldResult();
    }
  });
}

// ---------- POPUP XÁC NHẬN NỘP BÀI ----------
const confirmOverlay = document.getElementById("confirmSubmit");
const confirmCloseBtn = confirmOverlay
  ? confirmOverlay.querySelector(".rw-confirm-close")
  : null;
const confirmSubmitBtn = confirmOverlay
  ? confirmOverlay.querySelector(".rw-confirm-submit")
  : null;

function openConfirmSubmit() {
  if (confirmOverlay) {
    confirmOverlay.classList.add("active");
  }
}

function closeConfirmSubmit() {
  if (confirmOverlay) {
    confirmOverlay.classList.remove("active");
  }
}

// Đóng popup xác nhận
if (confirmCloseBtn) {
  confirmCloseBtn.addEventListener("click", closeConfirmSubmit);
}

if (confirmOverlay) {
  confirmOverlay.addEventListener("click", (e) => {
    if (e.target === confirmOverlay) {
      closeConfirmSubmit();
    }
  });
}

// Khi bấm NỘP BÀI trong popup: chấm điểm + hiện khiên khủng long
if (confirmSubmitBtn) {
  confirmSubmitBtn.addEventListener("click", () => {
    const { correct, totalQuestions } = gradeAllQuestions();
    const percentage =
      totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;
    const shields = calculateShields(percentage);

    closeConfirmSubmit();
    showShieldPopup(shields);
  });
}

// ---------- NÚT "NỘP TOÀN BÀI" (chỉ gọi popup xác nhận) ----------
const btnSubmitRW = document.getElementById("btnSubmitRW");
if (btnSubmitRW) {
  btnSubmitRW.addEventListener("click", () => {
    openConfirmSubmit();
  });
}
