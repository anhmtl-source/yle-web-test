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
    img.src = "Media/YLE/images/icons/khiên.png";
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
