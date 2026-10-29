import "../styles/Features.css";

function Features() {
  return (
    <section id="features" className="features">

      <div className="features-content">

        <div className="section-badge">
          ✦ Everything You Need
        </div>

        <h2>
          One Platform.
          <span> Your Complete Career Journey.</span>
        </h2>

        <p className="features-subtitle">
          From analyzing your resume to preparing for interviews,
          CareerLane brings powerful AI tools together to help you
          move confidently toward your career goals.
        </p>

        <div className="features-grid">

          {/* Resume & ATS */}

          <div className="feature-card feature-large">

            <div className="feature-icon blue-icon">
              <svg viewBox="0 0 24 24">
                <path d="M6 3h9l4 4v14H6z" />
                <path d="M15 3v5h4" />
                <path d="M9 13h6" />
                <path d="M9 17h5" />
              </svg>
            </div>

            <div className="feature-content">

              <span className="feature-label">
                RESUME & ATS
              </span>

              <h3>
                Make Your Resume
                <br />
                <span>Stand Out.</span>
              </h3>

              <p>
                Understand exactly how your resume performs and
                get AI-powered recommendations to improve your
                chances of passing ATS screening.
              </p>

              <div className="feature-list">

                <span>✓ ATS Compatibility Score</span>
                <span>✓ Resume Quality Analysis</span>
                <span>✓ Keyword & Skill Gap Analysis</span>
                <span>✓ AI Resume Improvement</span>
                <span>✓ ATS-Friendly Resume Builder</span>

              </div>

            </div>

          </div>


          {/* Job & Career */}

          <div
            id="job-career"
            className="feature-card career-feature"
          >

            <div className="feature-icon purple-icon">
              <svg viewBox="0 0 24 24">
                <rect x="4" y="7" width="16" height="12" rx="2" />
                <path d="M9 7V5h6v2" />
                <path d="M4 12h16" />
                <path d="M10 12v2h4v-2" />
              </svg>
            </div>

            <div className="feature-content">

              <span className="feature-label">
                JOB & CAREER
              </span>

              <h3>
                Find Your
                <br />
                <span>Right Direction.</span>
              </h3>

              <p>
                Discover suitable job roles, compare your profile
                with job requirements and receive a personalized
                career roadmap.
              </p>

              <div className="feature-list">

                <span>✓ Job Description Analysis</span>
                <span>✓ Resume–Job Matching</span>
                <span>✓ Career Recommendations</span>
                <span>✓ Personalized Career Roadmap</span>
                <span>✓ Learning & Skill Recommendations</span>

              </div>

            </div>

          </div>


          {/* Interview */}

          <div
            id="interview-preparation"
            className="feature-card interview-feature"
          >

            <div className="feature-icon orange-icon">
              <svg viewBox="0 0 24 24">
                <rect x="9" y="3" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0" />
                <path d="M12 18v3" />
                <path d="M8 21h8" />
              </svg>
            </div>

            <div className="feature-content">

              <span className="feature-label">
                INTERVIEW PREPARATION
              </span>

              <h3>
                Prepare.
                <br />
                <span>Practice. Perform.</span>
              </h3>

              <p>
                Prepare for interviews with AI-generated questions,
                role-based preparation, mock interviews and
                personalized feedback.
              </p>

              <div className="feature-list">

                <span>✓ AI Interview Questions</span>
                <span>✓ Role-Based Preparation</span>
                <span>✓ AI Mock Interviews</span>
                <span>✓ Answer Evaluation</span>
                <span>✓ Interview Performance Score</span>

              </div>

            </div>

          </div>


          {/* Advanced AI */}

          <div className="feature-card ai-feature">

            <div className="feature-icon green-icon">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 3v2" />
                <path d="M12 19v2" />
                <path d="M3 12h2" />
                <path d="M19 12h2" />
                <path d="M5.6 5.6l1.4 1.4" />
                <path d="M17 17l1.4 1.4" />
                <path d="M18.4 5.6L17 7" />
                <path d="M7 17l-1.4 1.4" />
              </svg>
            </div>

            <div className="feature-content">

              <span className="feature-label">
                ADVANCED AI
              </span>

              <h3>
                Intelligence That
                <br />
                <span>Works For You.</span>
              </h3>

              <p>
                Get personalized AI assistance across your complete
                career journey with intelligent recommendations
                based on your profile.
              </p>

              <div className="feature-list">

                <span>✓ AI Resume Analysis</span>
                <span>✓ Semantic Resume–Job Matching</span>
                <span>✓ AI Skill Extraction</span>
                <span>✓ AI Resume Rewriting</span>
                <span>✓ Personalized AI Suggestions</span>

              </div>

            </div>

          </div>

        </div>


        {/* Know Your Score */}

        <div
          id="know-your-score"
          className="score-section"
        >

          <div className="score-section-content">

            <span className="feature-label">
              KNOW YOUR SCORE
            </span>

            <h3>
              Understand Your Resume
              <span> Before Recruiters Do.</span>
            </h3>

            <p>
              Get a complete view of your resume performance with
              ATS scoring, resume quality analysis, keyword analysis,
              skill matching and actionable AI recommendations.
            </p>

            <button className="feature-action">
              Check Your Resume →
            </button>

          </div>

          <div className="score-visual">

            <div className="score-big-circle">
              <strong>86</strong>
              <span>ATS Score</span>
            </div>

          </div>

        </div>

      </div>

    </section>
  );
}

export default Features;