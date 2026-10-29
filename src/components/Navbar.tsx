import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);

    if (!section) {
      setMenuOpen(false);
      return;
    }

    const navbarHeight = 78;
    const startPosition = window.scrollY;

    const targetPosition =
      section.getBoundingClientRect().top +
      window.scrollY -
      navbarHeight;

    const distance = targetPosition - startPosition;
    const duration = 700;

    let startTime: number | null = null;

    const animateScroll = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const ease =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      window.scrollTo(
        0,
        startPosition + distance * ease
      );

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
    setMenuOpen(false);
  };

  const goHome = () => {
    setMenuOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* =========================
            LOGO
        ========================= */}

        <div
          className="logo"
          onClick={goHome}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              goHome();
            }
          }}
        >
          <div className="logo-icon">
            <span>✦</span>
          </div>

          <div className="logo-brand">
            <span className="logo-text">
              Career<span>Lane</span>
            </span>

            <span className="logo-tagline">
              AI Career Intelligence
            </span>
          </div>
        </div>

        {/* =========================
            DESKTOP NAVIGATION
        ========================= */}

        <div className="nav-links">

          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("features");
            }}
          >
            Features
          </a>

          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("how-it-works");
            }}
          >
            How It Works
          </a>

          <a
            href="#know-your-score"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("know-your-score");
            }}
          >
            Know Your Score
          </a>

          <a
            href="#job-career"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("job-career");
            }}
          >
            Job & Career
          </a>

          <a
            href="#interview-preparation"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("interview-preparation");
            }}
          >
            Interview Preparation
          </a>

          <a
            href="#ai-suggestions"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("ai-suggestions");
            }}
          >
            AI Suggestions
          </a>

        </div>

        {/* =========================
            ACTION BUTTONS
        ========================= */}

        <div className="nav-actions">

          <button
            className="login-btn"
            type="button"
            onClick={() => navigate("/login")}
          >
            Login
          </button>

          

        </div>

        {/* =========================
            MOBILE MENU BUTTON
        ========================= */}

        <button
          className={`menu-toggle ${
            menuOpen ? "active" : ""
          }`}
          type="button"
          aria-label="Toggle navigation menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

      </div>

      {/* =========================
          MOBILE NAVIGATION
      ========================= */}

      <div
        className={`mobile-menu ${
          menuOpen ? "mobile-menu-open" : ""
        }`}
      >

        <button onClick={goHome}>
          Home
        </button>

        <button
          onClick={() =>
            scrollToSection("features")
          }
        >
          Features
        </button>

        <button
          onClick={() =>
            scrollToSection("how-it-works")
          }
        >
          How It Works
        </button>

        <button
          onClick={() =>
            scrollToSection("know-your-score")
          }
        >
          Know Your Score
        </button>

        <button
          onClick={() =>
            scrollToSection("job-career")
          }
        >
          Job & Career
        </button>

        <button
          onClick={() =>
            scrollToSection("interview-preparation")
          }
        >
          Interview Preparation
        </button>

        <button
          onClick={() =>
            scrollToSection("ai-suggestions")
          }
        >
          AI Suggestions
        </button>

        <div className="mobile-actions">

          <button
            className="mobile-login"
            onClick={() => {
              setMenuOpen(false);
              navigate("/login");
            }}
          >
            Login
          </button>

          <button
            className="mobile-start"
            onClick={() => {
              setMenuOpen(false);
              navigate("/resume-upload");
            }}
          >
            Get Started →
          </button>

        </div>

      </div>
    </nav>
  );
}

export default Navbar;