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
    2: "A", // Q2
    3: "B", // Q3
    4: "A", // Q4
    5: "C", // Q5
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
    img.src = "Media/YLE/images/icons/khiên.png"; // Đường dẫn icon khiên
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
