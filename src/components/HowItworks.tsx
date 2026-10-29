import "../styles/HowItWorks.css";

function HowItWorks() {
  return (
    <section id="how-it-works" className="how-it-works">

      <div className="how-it-works-content">

        <div className="section-badge">
          ✦ Simple. Smart. Personalized.
        </div>

        <h2>
          How <span>CareerLane</span> Works
        </h2>

        <p className="how-it-works-subtitle">
          Your complete career journey, powered by AI and simplified
          into a few easy steps.
        </p>


        <div className="steps-grid">

          {/* STEP 01 */}

          <div className="step-card">

            <div className="step-number">
              01
            </div>

            <div className="step-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="16" y2="17" />
              </svg>
            </div>

            <h3>
              Upload Your Resume
            </h3>

            <p>
              Upload your resume and CareerLane securely analyzes
              the information inside it, including your skills,
              education, projects and experience.
            </p>

            <span className="step-tag">
              Resume Parsing
            </span>

          </div>


          {/* STEP 02 */}

          <div className="step-card">

            <div className="step-number">
              02
            </div>

            <div className="step-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="4" y="7" width="16" height="12" rx="4" />
                <line x1="8" y1="11" x2="8" y2="11" />
                <line x1="16" y1="11" x2="16" y2="11" />
                <path d="M9 15h6" />
                <path d="M12 7V4" />
                <circle cx="12" cy="3" r="1" />
                <line x1="4" y1="11" x2="2" y2="11" />
                <line x1="22" y1="11" x2="20" y2="11" />
              </svg>
            </div>

            <h3>
              AI Analyzes Your Profile
            </h3>

            <p>
              Our AI evaluates your resume, calculates your ATS
              score, detects missing skills, identifies weak areas
              and analyzes overall resume quality.
            </p>

            <span className="step-tag">
              AI Analysis
            </span>

          </div>


          {/* STEP 03 */}

          <div className="step-card">

            <div className="step-number">
              03
            </div>

            <div className="step-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="12" cy="12" r="1" />
                <path d="M16 8l5-5" />
                <path d="M17 3h4v4" />
              </svg>
            </div>

            <h3>
              Discover Your Career Direction
            </h3>

            <p>
              Based on your skills and profile, CareerLane recommends
              suitable career roles and identifies the skills you
              need to develop.
            </p>

            <span className="step-tag">
              Career Guidance
            </span>

          </div>


          {/* STEP 04 */}

          <div className="step-card">

            <div className="step-number">
              04
            </div>

            <div className="step-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
                <line x1="9" y1="3" x2="9" y2="18" />
                <line x1="15" y1="6" x2="15" y2="21" />
              </svg>
            </div>

            <h3>
              Follow Your Career Roadmap
            </h3>

            <p>
              Get a detailed learning roadmap with the technologies,
              concepts and skills you should learn to move toward
              your selected career role.
            </p>

            <span className="step-tag">
              Personalized Roadmap
            </span>

          </div>


          {/* STEP 05 */}

          <div className="step-card">

            <div className="step-number">
              05
            </div>

            <div className="step-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="7" width="18" height="13" rx="2" />
                <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="10" y1="12" x2="10" y2="14" />
                <line x1="14" y1="12" x2="14" y2="14" />
              </svg>
            </div>

            <h3>
              Match With Opportunities
            </h3>

            <p>
              Analyze job descriptions, compare them with your
              resume and understand how well your profile matches
              the requirements.
            </p>

            <span className="step-tag">
              Job Matching
            </span>

          </div>


          {/* STEP 06 */}

          <div className="step-card">

            <div className="step-number">
              06
            </div>

            <div className="step-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="8" y="3" width="8" height="13" rx="4" />
                <path d="M5 11a7 7 0 0 0 14 0" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="8" y1="22" x2="16" y2="22" />
              </svg>
            </div>

            <h3>
              Prepare For Interviews
            </h3>

            <p>
              Practice role-based questions, participate in AI
              mock interviews and receive feedback to improve
              your interview performance.
            </p>

            <span className="step-tag">
              Interview Preparation
            </span>

          </div>

        </div>


        <div className="how-it-works-bottom">

          <h3>
            From Resume to Career,
            <span> CareerLane Guides You.</span>
          </h3>

          <p>
            Analyze. Improve. Learn. Apply. Prepare.
            Move closer to your career goals with one intelligent platform.
          </p>

        </div>

      </div>

    </section>
  );
}

export default HowItWorks;