import "../styles/Hero.css";
import { useNavigate } from "react-router-dom";

function Hero() {
  const navigate = useNavigate();

  const scrollToFeatures = () => {
    document
      .getElementById("features")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <section className="hero">

      {/* =====================================================
          BACKGROUND DECORATION
      ===================================================== */}

      <div className="hero-background-glow hero-glow-one"></div>
      <div className="hero-background-glow hero-glow-two"></div>

      <div className="hero-grid-pattern"></div>

      {/* =====================================================
          LEFT CONTENT
      ===================================================== */}

      <div className="hero-content">

        <div className="hero-badge">
          <span className="hero-badge-icon">✦</span>

          <span>
            AI-Powered Career Intelligence
          </span>
        </div>

        <h1>
          Your Resume.
          <br />

          <span>
            Your Career. Your Future.
          </span>
        </h1>

        <p className="hero-description">
          CareerLane uses intelligent AI to analyze your resume,
          measure ATS compatibility, identify skill gaps,
          discover suitable career paths, and help you prepare
          for your next opportunity.
        </p>

        {/* =================================================
            BUTTONS
        ================================================= */}

        <div className="hero-buttons">

          <button
            className="primary-btn"
            type="button"
            onClick={() => navigate("/login")}
          >
            <span>Analyze My Resume</span>
            <span className="primary-btn-arrow">
              →
            </span>
          </button>

          <button
            className="secondary-btn"
            type="button"
            onClick={scrollToFeatures}
          >
            Explore CareerLane
            <span>↓</span>
          </button>

        </div>

        {/* =================================================
            TRUST POINTS
        ================================================= */}

        <div className="hero-trust">

          <div className="trust-item">
            <span className="trust-icon">
              ✓
            </span>

            <span>
              AI-Powered Analysis
            </span>
          </div>

          <div className="trust-item">
            <span className="trust-icon">
              ✓
            </span>

            <span>
              ATS Compatibility
            </span>
          </div>

          <div className="trust-item">
            <span className="trust-icon">
              ✓
            </span>

            <span>
              Personalized Guidance
            </span>
          </div>

        </div>

      </div>

      {/* =====================================================
          AI ANALYSIS PREVIEW
      ===================================================== */}

      <div className="hero-preview">

        <div className="preview-window">

          {/* TOP BAR */}

          <div className="preview-top">

            <div className="preview-brand">

              <div className="preview-logo">
                ✦
              </div>

              <span>
                CareerLane AI
              </span>

            </div>

            <div className="preview-status">
              <span></span>
              AI Analysis
            </div>

          </div>

          {/* BODY */}

          <div className="preview-body">

            {/* SCORE */}

            <div className="score-preview">

              <div className="score-circle">

                <div className="score-circle-inner">

                  <strong>
                    86
                  </strong>

                  <span>
                    /100
                  </span>

                </div>

              </div>

              <div className="score-info">

                <span className="mini-label">
                  RESUME SCORE
                </span>

                <h3>
                  ATS Compatibility
                </h3>

                <p>
                  Your resume is performing well.
                </p>

                <div className="score-positive">
                  <span>↑</span>
                  Strong profile
                </div>

              </div>

            </div>

            {/* STAT CARDS */}

            <div className="preview-grid">

              <div className="preview-card">

                <span>
                  Skills Found
                </span>

                <strong>
                  24
                </strong>

                <small>
                  Relevant skills
                </small>

              </div>

              <div className="preview-card">

                <span>
                  Skill Gaps
                </span>

                <strong>
                  06
                </strong>

                <small>
                  Areas to improve
                </small>

              </div>

              <div className="preview-card">

                <span>
                  Career Match
                </span>

                <strong>
                  92%
                </strong>

                <small>
                  Profile alignment
                </small>

              </div>

            </div>

            {/* QUALITY */}

            <div className="preview-progress">

              <div className="progress-heading">

                <div>
                  <span>
                    Resume Quality
                  </span>

                  <small>
                    Overall profile strength
                  </small>
                </div>

                <strong>
                  82%
                </strong>

              </div>

              <div className="progress-bar">

                <div className="progress-fill"></div>

              </div>

            </div>

            {/* AI INSIGHT */}

            <div className="preview-insight">

              <div className="insight-icon">
                ✦
              </div>

              <div>

                <strong>
                  CareerLane Insight
                </strong>

                <p>
                  Your profile shows strong potential
                  for technology-focused roles.
                </p>

              </div>

              <span className="insight-arrow">
                →
              </span>

            </div>

          </div>

        </div>

        {/* FLOATING ELEMENTS */}

        <div className="hero-floating-card hero-floating-score">

          <span className="floating-icon">
            ✓
          </span>

          <div>
            <strong>
              ATS Ready
            </strong>

            <small>
              Resume optimized
            </small>
          </div>

        </div>

        <div className="hero-floating-card hero-floating-match">

          <span className="floating-icon">
            ✦
          </span>

          <div>
            <strong>
              92% Match
            </strong>

            <small>
              Career compatibility
            </small>
          </div>

        </div>

      </div>

    </section>
  );
}

export default Hero;