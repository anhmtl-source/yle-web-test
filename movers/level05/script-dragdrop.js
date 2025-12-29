// ===== NỘP BÀI & CHẤM ĐIỂM CHO TOÀN BỘ BÀI NGHE =====

// Khi DOM đã sẵn sàng
document.addEventListener("DOMContentLoaded", function () {
  const submitBtn = document.getElementById("btnSubmit");
  if (!submitBtn) return;

  // Bấm nút "Nộp toàn bài" -> chỉ mở popup xác nhận
  submitBtn.addEventListener("click", function () {
    const confirmOverlay = document.getElementById("lsConfirmSubmit");
    if (confirmOverlay) {
      confirmOverlay.classList.add("active");
    }
  });

  setupListeningConfirmAndShield();
});

// ===== HÀM CHẤM ĐIỂM TOÀN BỘ BÀI NGHE =====
function gradeListening() {
  let score = 0;
  let total = 0;

  // ----- PART 1: kéo tên vào hình -----
  const boxes = document.querySelectorAll("#part1 .drop-box[data-answer]");
  total += boxes.length;

  boxes.forEach((box) => {
    const correct = (box.dataset.answer || "").trim().toLowerCase();
    const user = box.textContent.trim().toLowerCase();

    box.classList.remove("correct", "wrong");

    if (!correct) return;

    if (user === correct) {
      box.classList.add("correct");
      score++;
    } else {
      box.classList.add("wrong");
    }
  });

  // ----- PART 2: điền tên / số vào ô trống -----
  const rows = document.querySelectorAll("#part2 .p2-row[data-answer]");
  total += rows.length;

  rows.forEach((row) => {
    const input = row.querySelector("input");
    if (!input) return;

    const correct = (row.dataset.answer || "").trim().toLowerCase();
    const user = (input.value || "").trim().toLowerCase();

    row.classList.remove("correct", "wrong");
    input.classList.remove("correct", "wrong");

    if (!correct) return;

    if (user === correct) {
      row.classList.add("correct");
      input.classList.add("correct");
      score++;
    } else {
      row.classList.add("wrong");
      input.classList.add("wrong");
    }
  });

  // ----- PART 3: chọn A/B/C cho mỗi câu hỏi -----
  const part3Answers = {
    1: "B", // Q1
    2: "C", // Q2
    3: "B", // Q3
    4: "B", // Q4
    5: "A", // Q5
  };

  // Mỗi .p3-card tương ứng 1 câu (data-q="1"..."5")
  const p3Cards = document.querySelectorAll("#part3 .p3-card[data-q]");
  total += p3Cards.length;

  p3Cards.forEach((card) => {
    const qId = card.dataset.q; // "1"..."5"
    const correct = (part3Answers[qId] || "").toUpperCase();

    // Thẻ input radio được chọn trong câu này
    const selected = card.querySelector('input[type="radio"]:checked');

    // Xóa trạng thái cũ
    card.classList.remove("correct", "wrong");

    if (!correct || !selected) {
      // Chưa chọn hoặc chưa có đáp án trong bảng -> không cộng điểm, không tô
      return;
    }

    if (selected.value.toUpperCase() === correct) {
      card.classList.add("correct");
      score++;
    } else {
      card.classList.add("wrong");
    }
  });

  // ----- PART 4: tô màu -----
  const part4Answers = {
    1: "orange", // door
    2: "pink", // mom dress / arm
    3: "yellow", // cake
    4: "green", // dog
    5: "lightblue", // glass
  };

  // Mỗi drop-zone có data-slot="1"..."5"
  const p4Zones = document.querySelectorAll("#part4 .p4-drop-zone");
  total += p4Zones.length;

  p4Zones.forEach((zone) => {
    const slot = zone.dataset.slot;
    const correct = part4Answers[slot];
    const user = zone.dataset.color || "";

    // xóa class cũ
    zone.classList.remove("correct", "wrong");

    if (!correct) return;

    if (user === correct) {
      zone.classList.add("correct");
      score++;
    } else {
      zone.classList.add("wrong");
    }
  });

  return { score, total };
}

// ===== SETUP POPUP XÁC NHẬN + POPUP KHIÊN + NHẠC =====
function setupListeningConfirmAndShield() {
  const confirmOverlay = document.getElementById("lsConfirmSubmit");
  if (!confirmOverlay) return;

  const closeBtn = confirmOverlay.querySelector(".rw-confirm-close");
  const confirmSubmitBtn = confirmOverlay.querySelector(".rw-confirm-submit");
  const soundEl = document.getElementById("lsShieldSound");

  // Đóng popup khi bấm X
  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      confirmOverlay.classList.remove("active");
    });
  }

  // Đóng popup khi bấm ra ngoài khung
  confirmOverlay.addEventListener("click", function (e) {
    if (e.target === confirmOverlay) {
      confirmOverlay.classList.remove("active");
    }
  });

  // Khi bấm NỘP BÀI trong popup
  if (confirmSubmitBtn) {
    confirmSubmitBtn.addEventListener("click", function () {
      const result = gradeListening();
      const score = result.score;
      const total = result.total;

      // Lưu kết quả vào LocalStorage để hệ thống khác có thể đọc
      const data = {
        score: score,
        total: total,
        timestamp: Date.now(),
      };
      try {
        localStorage.setItem("listening_result", JSON.stringify(data));
      } catch (e) {
        console.warn("Không thể lưu kết quả vào localStorage:", e);
      }

      // Đóng popup xác nhận
      confirmOverlay.classList.remove("active");

      // Hiện popup số khiên (khủng long)
      showShieldResult(score, total);

      // Phát nhạc chúc mừng
      if (soundEl) {
        try {
          soundEl.currentTime = 0;
          soundEl.play();
        } catch (err) {
          console.warn("Không thể phát âm thanh:", err);
        }
      }
    });
  }
}

// ===== LOGIC TÍNH KHIÊN =====
function getShieldCount(correct, total) {
  if (!total) return 0;
  const percent = (correct / total) * 100;

  if (percent <= 20) return 1; // 0–20%
  if (percent <= 40) return 2; // 21–40%
  if (percent <= 60) return 3; // 41–60%
  if (percent <= 80) return 4; // 61–80%
  return 5; // 81–100%
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
function showShieldResult(correct, total) {
  const count = getShieldCount(correct, total);
  const overlay = document.getElementById("shieldResult");
  const iconsWrap = document.getElementById("shieldIcons");
  const countText = document.getElementById("shieldCount");

  if (!overlay || !iconsWrap || !countText) {
    alert("Bạn đúng: " + correct + "/" + total);
    return;
  }

  // Xóa icon cũ
  iconsWrap.innerHTML = "";

  // Thêm icon khiên
  for (let i = 0; i < count; i++) {
    const img = document.createElement("img");
    img.src = SHIELD_ICON_DATA_URI; // icon khiên inline (data-uri)
    img.alt = "shield";
    iconsWrap.appendChild(img);
  }

  countText.textContent = String(count);
  overlay.classList.remove("hidden");
  overlay.classList.add("active");
}

function closeShieldResult() {
  const overlay = document.getElementById("shieldResult");
  if (overlay) {
    overlay.classList.add("hidden");
    overlay.classList.remove("active");
  }
}
