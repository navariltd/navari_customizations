document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  updateProgress();
});

function initTheme() {
  const toggleBtn = document.getElementById("theme-toggle");
  const savedTheme = localStorage.getItem("nv-theme");

  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
  } else {
    const prefersLight = window.matchMedia(
      "(prefers-color-scheme: light)",
    ).matches;
    document.documentElement.setAttribute(
      "data-theme",
      prefersLight ? "light" : "dark",
    );
  }

  toggleBtn.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("nv-theme", newTheme);
  });

  window
    .matchMedia("(prefers-color-scheme: light)")
    .addEventListener("change", (e) => {
      if (!localStorage.getItem("nv-theme")) {
        document.documentElement.setAttribute(
          "data-theme",
          e.matches ? "light" : "dark",
        );
      }
    });
}

document.addEventListener("click", (e) => {
  const pageContainer = document.querySelector(".nv-page");
  if (pageContainer && pageContainer.classList.contains("nv-readonly")) return;

  const starBtn = e.target.closest(".nv-star");
  if (!starBtn) return;

  const container = starBtn.closest(".nv-stars");
  const card = starBtn.closest(".nv-card");
  const ratingValue = parseInt(starBtn.dataset.value);

  container.dataset.value = ratingValue;

  const stars = container.querySelectorAll(".nv-star");
  stars.forEach((star, index) => {
    star.classList.toggle("lit", index < ratingValue);
  });

  const label = card.querySelector(".nv-rating-label");
  if (label) {
    label.textContent = `${ratingValue} / 5`;
  }

  card.classList.add("completed");
  updateProgress();
});

function updateProgress() {
  const totalCards = document.querySelectorAll(".nv-card").length;
  if (totalCards === 0) return;

  let ratedCount = 0;
  document.querySelectorAll(".nv-stars").forEach((container) => {
    if (parseInt(container.dataset.value) > 0) {
      ratedCount++;
    }
  });

  const countEl = document.getElementById("rated-count");
  if (countEl) {
    countEl.textContent = ratedCount;
  }

  const progressBar = document.getElementById("progress-bar");
  if (progressBar) {
    const percentage = Math.round((ratedCount / totalCards) * 100);
    progressBar.style.width = `${percentage}%`;
  }
}

function submitFeedback() {
  const pageContainer = document.querySelector(".nv-page");
  if (pageContainer && pageContainer.classList.contains("nv-readonly")) return;

  const routeId = document.getElementById("route_id").value;
  const cards = document.querySelectorAll(".nv-card");
  const payload = [];

  cards.forEach((card, index) => {
    const rating = card.querySelector(".nv-stars").dataset.value || "0";
    const feedback = card.querySelector(".nv-textarea").value || "";

    payload.push({
      parameter_index: index,
      rating: rating,
      feedback: feedback,
    });
  });

  document.getElementById("overlay").classList.remove("hidden");

  frappe.call({
    method:
      "navari_customizations.overrides.quality_feedback.submit_quality_feedback",
    args: {
      route_id: routeId,
      data: payload,
    },
    callback: () => {
      document.getElementById("overlay").classList.add("hidden");
      frappe.msgprint("Feedback submitted successfully");
      window.location.reload();
    },
    error: () => {
      document.getElementById("overlay").classList.add("hidden");
    },
  });
}
