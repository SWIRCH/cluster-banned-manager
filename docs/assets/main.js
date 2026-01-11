async function fetchVersionFromGitHub() {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/SWIRCH/cluster-banned-manager/main/src-tauri/tauri.conf.json"
    );

    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }

    const data = await response.json();

    const version = data?.package?.version || data?.version || "1.0.0";

    document.querySelectorAll(".git_v").forEach((element) => {
      element.textContent = version;
    });
  } catch (error) {
    console.error("Ошибка при загрузке версии:", error);

    try {
      const localResponse = await fetch("version.json");
      const localData = await localResponse.json();
      document.querySelectorAll(".git_v").forEach((element) => {
        element.textContent = localData.version;
      });
    } catch {
      document.querySelectorAll(".git_v").forEach((element) => {
        element.textContent = "1.0.0";
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.querySelector(".menu-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const header = document.querySelector(".origin-header");

  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active");
      menuToggle.innerHTML = navMenu.classList.contains("active")
        ? '<i class="fas fa-times"></i>'
        : '<i class="fas fa-bars"></i>';
    });
  }

  fetchVersionFromGitHub();

  window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
      header.classList.add("bg");
    } else {
      header.classList.remove("bg");
    }
  });

  document.querySelectorAll(".nav-menu a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
      menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    });
  });

  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");

      tabBtns.forEach((b) => b.classList.remove("active"));
      tabPanes.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(tabId).classList.add("active");
    });
  });

  const faqQuestions = document.querySelectorAll(".faq-question");

  faqQuestions.forEach((question) => {
    question.addEventListener("click", () => {
      const faqItem = question.parentElement;
      faqItem.classList.toggle("active");

      // Закрываем другие открытые вопросы
      faqQuestions.forEach((q) => {
        if (q !== question && q.parentElement.classList.contains("active")) {
          q.parentElement.classList.remove("active");
        }
      });
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: "smooth",
        });
      }
    });
  });

  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  document
    .querySelectorAll(".feature-card, .download-card, .faq-item")
    .forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      observer.observe(el);
    });

  setTimeout(() => {
    if (faqQuestions.length > 0) {
      faqQuestions[0].click();
    }
  }, 1000);
});
