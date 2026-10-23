document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const loader = document.getElementById("loader");
    const navbar = document.getElementById("mainNavbar");
    const themeToggle = document.getElementById("themeToggle");
    const backToTop = document.getElementById("backToTop");
    const readingProgress = document.getElementById("readingProgress");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const navLinks = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll("main section[id]");

    /* Loader */
    window.addEventListener("load", () => {
        setTimeout(() => loader.classList.add("hide"), 450);
    });

    /* Theme */
    const savedTheme = localStorage.getItem("portfolio-theme");
    if (savedTheme === "light") body.classList.add("light-mode");

    function updateThemeIcon() {
        themeToggle.innerHTML = body.classList.contains("light-mode")
            ? '<i class="fas fa-moon"></i>'
            : '<i class="fas fa-sun"></i>';
    }
    updateThemeIcon();

    themeToggle.addEventListener("click", () => {
        body.classList.toggle("light-mode");
        localStorage.setItem(
            "portfolio-theme",
            body.classList.contains("light-mode") ? "light" : "dark"
        );
        updateThemeIcon();
    });

    /* Navbar + active section + back to top */
    function handleScroll() {
        navbar.classList.toggle("scrolled", window.scrollY > 30);
        backToTop.classList.toggle("show", window.scrollY > 450);

        const scrollableHeight =
            document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollableHeight > 0
            ? Math.min(window.scrollY / scrollableHeight, 1)
            : 0;
        readingProgress.style.transform = `scaleX(${progress})`;

        let current = "home";
        sections.forEach(section => {
            const top = section.offsetTop - 150;
            if (window.scrollY >= top) current = section.id;
        });
        navbar.dataset.section = current;

        navLinks.forEach(link => {
            link.classList.toggle(
                "active",
                link.getAttribute("href") === `#${current}`
            );
        });
    }

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    handleScroll();

    /* Smooth scrolling */
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener("click", event => {
            const targetId = link.getAttribute("href");
            if (!targetId || targetId === "#") return;

            const target = document.querySelector(targetId);
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({
                behavior: prefersReducedMotion.matches ? "auto" : "smooth"
            });

            // Tutup navbar mobile setelah klik menu.
            const navbarCollapse = document.getElementById("navbarNav");
            if (navbarCollapse.classList.contains("show")) {
                bootstrap.Collapse.getOrCreateInstance(navbarCollapse).hide();
            }
        });
    });

    backToTop.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: prefersReducedMotion.matches ? "auto" : "smooth"
        });
    });

    /* Scroll Reveal */
    const revealElements = document.querySelectorAll(".reveal");

    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    revealElements.forEach(element => revealObserver.observe(element));

    /* Contact form validation */
    const contactForm = document.getElementById("contactForm");
    const formAlert = document.getElementById("formAlert");

    function setError(input, message) {
        const error = input.parentElement.querySelector(".error-message");
        error.textContent = message;
        input.style.borderColor = "#fb7185";
    }

    function clearError(input) {
        const error = input.parentElement.querySelector(".error-message");
        error.textContent = "";
        input.style.borderColor = "";
    }

    contactForm.addEventListener("submit", async event => {
        event.preventDefault();
        formAlert.className = "form-alert";
        formAlert.textContent = "";

        const name = document.getElementById("name");
        const email = document.getElementById("email");
        const subject = document.getElementById("subject");
        const message = document.getElementById("message");

        let valid = true;

        [name, email, subject, message].forEach(clearError);

        if (name.value.trim().length < 2) {
            setError(name, "Nama minimal 2 karakter.");
            valid = false;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email.value.trim())) {
            setError(email, "Masukkan email yang valid.");
            valid = false;
        }

        if (subject.value.trim().length < 3) {
            setError(subject, "Subjek minimal 3 karakter.");
            valid = false;
        }

        if (message.value.trim().length < 10) {
            setError(message, "Pesan minimal 10 karakter.");
            valid = false;
        }

        if (!valid) {
            formAlert.classList.add("show", "error");
            formAlert.textContent = "Periksa kembali data yang Anda masukkan.";
            return;
        }

        // Saat dibuka langsung sebagai index.html, PHP tidak dapat diproses.
        // Jika dijalankan lewat XAMPP, form akan dikirim ke php/contact.php.
        if (window.location.protocol === "file:") {
            formAlert.classList.add("show", "error");
            formAlert.textContent =
                "Email belum dikirim. Buka website melalui XAMPP/Apache agar formulir dapat diproses.";
            return;
        }

        try {
            const response = await fetch(contactForm.action, {
                method: "POST",
                body: new FormData(contactForm)
            });

            const result = await response.json().catch(() => ({
                success: false,
                message: "Server memberikan respons yang tidak valid. Periksa konfigurasi PHP."
            }));

            formAlert.classList.add("show", result.success ? "success" : "error");
            formAlert.textContent = result.message || "Email tidak dapat dikirim.";

            if (result.success) contactForm.reset();
        } catch {
            formAlert.classList.add("show", "error");
            formAlert.textContent =
                "Email belum dapat dikirim. Pastikan Apache berjalan dan pengaturan SMTP sudah benar.";
        }
    });
});
