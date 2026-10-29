import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/ResumeAnalysis.css";

interface ResumeAnalysis {
  atsScore?: number | string;
  resumeStrength?: string;
  skills?: string[];
  missingSkills?: string[];
  weakAreas?: string[];
  suggestions?: string[];
  careerRecommendations?: string[];

  qualityAnalysis?: {
    overallScore?: number;
    completeness?: { score?: number; feedback?: string };
    contentQuality?: { score?: number; feedback?: string };
    clarity?: { score?: number; feedback?: string };
    relevance?: { score?: number; feedback?: string };
    professionalism?: { score?: number; feedback?: string };
    structure?: { score?: number; feedback?: string };
  };

  atsAnalysis?: {
    overallScore?: number;
    keywordScore?: number;
    formattingScore?: number;
    sectionScore?: number;
    skillsMatchScore?: number;
    experienceRelevanceScore?: number;
    issues?: string[];
    improvementSuggestions?: string[];
  };

  sections?: {
    personalInformation?: { present?: boolean; content?: string };
    professionalSummary?: { present?: boolean; content?: string };
    technicalSkills?: { present?: boolean; content?: string };
    workExperience?: { present?: boolean; content?: string };
    education?: { present?: boolean; content?: string };
    projects?: { present?: boolean; content?: string };
    certifications?: { present?: boolean; content?: string };
  };

  careerRoadmap?: {
    targetRole?: string;
    currentLevel?: string;
    estimatedTimeline?: string;
    phases?: {
      phaseName?: string;
      duration?: string;
      objective?: string;
      skillsToLearn?: {
        skill?: string;
        importance?: string;
        topics?: string[];
        resources?: {
          platform?: string;
          recommendation?: string;
        }[];
        practiceProjects?: string[];
      }[];
    }[];
    interviewPreparation?: string[];
    jobPreparationTips?: string[];
  };
}

type SectionKey =
  | "overview"
  | "personal"
  | "summary"
  | "skills"
  | "experience"
  | "education"
  | "projects"
  | "certifications"
  | "quality"
  | "ats"
  | "strengths"
  | "weaknesses"
  | "action"
  | "interview"
  | "job";

const scoreValue = (value?: number | string) => {
  const n = Number(value);
  return Number.isFinite(n)
    ? Math.max(0, Math.min(100, n))
    : 0;
};

function DonutChart({
  score,
  label,
}: {
  score?: number | string;
  label: string;
}) {
  const value = scoreValue(score);
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (value / 100) * circumference;

  return (
    <div className="donut-wrap">
      <svg
        className="donut-chart"
        viewBox="0 0 120 120"
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          className="donut-track"
        />

        <circle
          cx="60"
          cy="60"
          r={radius}
          className="donut-value"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      <div className="donut-center">
        <strong>{score ?? "--"}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  score,
}: {
  label: string;
  score?: number;
}) {
  const value = scoreValue(score);

  return (
    <div className="progress-row">
      <div className="progress-info">
        <span>{label}</span>
        <strong>{score ?? "--"}</strong>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function SidebarButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`analysis-nav-button ${
        active ? "active" : ""
      }`}
      onClick={onClick}
    >
      <span className="nav-indicator" />
      <span>{label}</span>
    </button>
  );
}

function NavGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="nav-group">
      <span className="nav-group-title">
        {title}
      </span>

      {children}
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="section-header">
      <span className="section-eyebrow">
        {eyebrow}
      </span>

      <h1>{title}</h1>

      <p>{description}</p>
    </header>
  );
}

function ListBlock({
  items,
}: {
  items?: string[];
}) {
  if (!items?.length) {
    return (
      <div className="empty-state">
        No information available for this section.
      </div>
    );
  }

  return (
    <div className="analysis-list">
      {items.map((item, index) => (
        <div
          className="analysis-list-item"
          key={index}
        >
          <span>
            {String(index + 1).padStart(2, "0")}
          </span>

          <p>{item}</p>
        </div>
      ))}
    </div>
  );
}

function ResumeSectionCard({
  title,
  data,
}: {
  title: string;
  data?: {
    present?: boolean;
    content?: string;
  };
}) {
  return (
    <div className="modern-card">
      <div className="card-header">
        <div>
          <span className="card-eyebrow">
            RESUME SECTION
          </span>

          <h2>{title}</h2>
        </div>

        <span
          className={`status ${
            data?.present
              ? "status-good"
              : "status-bad"
          }`}
        >
          {data?.present ? "Present" : "Missing"}
        </span>
      </div>

      <div className="detected-content">
        {data?.content ||
          "No content detected."}
      </div>
    </div>
  );
}

function Roadmap({
  title,
  steps,
}: {
  title: string;
  steps: string[];
}) {
  return (
    <div className="modern-card">
      <div className="card-header">
        <div>
          <span className="card-eyebrow">
            ROADMAP
          </span>

          <h2>{title}</h2>
        </div>
      </div>

      <div className="mini-timeline">
        {steps.map((step, index) => (
          <div
            className="mini-timeline-item"
            key={index}
          >
            <div className="timeline-dot">
              {index + 1}
            </div>

            <div>
              <strong>{step}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResumeAnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const storedAnalysis =
    sessionStorage.getItem(
      "careerLaneResumeAnalysis"
    );

  const analysis: ResumeAnalysis | null =
    location.state?.analysis ||
    (storedAnalysis
      ? JSON.parse(storedAnalysis)
      : null);

  const resumeText: string =
    location.state?.resumeText ||
    sessionStorage.getItem(
      "careerLaneResumeText"
    ) ||
    "";

  useEffect(() => {
    if (resumeText) {
      sessionStorage.setItem(
        "careerLaneResumeText",
        resumeText
      );

      sessionStorage.setItem(
        "careerLaneResumeAnalysis",
        JSON.stringify(analysis || {})
      );
    }
  }, [resumeText, analysis]);

  const [activeSection, setActiveSection] =
    useState<SectionKey>("overview");

  const [mobileNavOpen, setMobileNavOpen] =
    useState(false);

  const goToSection = (
    section: SectionKey
  ) => {
    setActiveSection(section);
    setMobileNavOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const renderContent = () => {
    if (!analysis) {
      return (
        <div className="empty-analysis">
          <h2>Analysis unavailable</h2>

          <p>
            No resume analysis data was found.
            Please upload your resume again.
          </p>
        </div>
      );
    }

    switch (activeSection) {
      case "overview":
        return (
          <>
            <SectionHeader
              eyebrow="RESUME INTELLIGENCE"
              title="Overview"
              description="A clear snapshot of your resume performance, strengths and the improvements that matter most."
            />

            <div className="overview-score-grid">
              <div className="hero-score-card">
                <div>
                  <span className="card-eyebrow">
                    ATS COMPATIBILITY
                  </span>

                  <h2>
                    How well your resume can
                    perform through automated
                    screening.
                  </h2>

                  <p>
                    Improve the areas below to
                    increase your resume's
                    compatibility with applicant
                    tracking systems.
                  </p>
                </div>

                <DonutChart
                  score={
                    analysis.atsAnalysis
                      ?.overallScore ??
                    analysis.atsScore
                  }
                  label="ATS"
                />
              </div>

              <div className="quality-score-card">
                <span className="card-eyebrow">
                  RESUME QUALITY
                </span>

                <div className="quality-number">
                  {analysis.qualityAnalysis
                    ?.overallScore ?? "--"}

                  <small>/100</small>
                </div>

                <div className="quality-meter">
                  <div
                    style={{
                      width: `${
                        scoreValue(
                          analysis
                            .qualityAnalysis
                            ?.overallScore
                        )
                      }%`,
                    }}
                  />
                </div>

                <p>
                  {analysis.resumeStrength ||
                    "Resume strength assessment"}
                </p>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="modern-card">
                <div className="card-header">
                  <div>
                    <span className="card-eyebrow">
                      ATS BREAKDOWN
                    </span>

                    <h2>
                      Screening readiness
                    </h2>
                  </div>
                </div>

                <div className="progress-list">
                  <ProgressBar
                    label="Keywords"
                    score={
                      analysis.atsAnalysis
                        ?.keywordScore
                    }
                  />

                  <ProgressBar
                    label="Formatting"
                    score={
                      analysis.atsAnalysis
                        ?.formattingScore
                    }
                  />

                  <ProgressBar
                    label="Sections"
                    score={
                      analysis.atsAnalysis
                        ?.sectionScore
                    }
                  />

                  <ProgressBar
                    label="Skills Match"
                    score={
                      analysis.atsAnalysis
                        ?.skillsMatchScore
                    }
                  />

                  <ProgressBar
                    label="Experience Relevance"
                    score={
                      analysis.atsAnalysis
                        ?.experienceRelevanceScore
                    }
                  />
                </div>
              </div>

              <div className="modern-card">
                <div className="card-header">
                  <div>
                    <span className="card-eyebrow">
                      NEXT STEPS
                    </span>

                    <h2>
                      What to improve first
                    </h2>
                  </div>
                </div>

                <div className="priority-list">
                  {analysis.suggestions
                    ?.slice(0, 4)
                    .map((item, index) => (
                      <button
                        type="button"
                        key={index}
                        onClick={() =>
                          goToSection("action")
                        }
                      >
                        <span>
                          {String(
                            index + 1
                          ).padStart(2, "0")}
                        </span>

                        <p>{item}</p>

                        <b>→</b>
                      </button>
                    ))}
                </div>
              </div>
            </div>

            <div className="modern-card">
              <div className="card-header">
                <div>
                  <span className="card-eyebrow">
                    SKILL SNAPSHOT
                  </span>

                  <h2>
                    Your current skill profile
                  </h2>
                </div>

                <button
                  className="text-button"
                  onClick={() =>
                    goToSection("skills")
                  }
                >
                  View full analysis →
                </button>
              </div>

              <div className="skill-cloud">
                {analysis.skills?.map(
                  (skill, index) => (
                    <span key={index}>
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>
          </>
        );

      case "personal":
        return (
          <>
            <SectionHeader
              eyebrow="RESUME"
              title="Personal Information"
              description="Review the contact and identity information detected from your resume."
            />

            <ResumeSectionCard
              title="Personal Information"
              data={
                analysis.sections
                  ?.personalInformation
              }
            />

            <div className="guidance-card">
              <span>BEST PRACTICE</span>

              <h3>
                Keep your professional identity
                easy to scan.
              </h3>

              <p>
                Use a professional email address
                and include relevant professional
                links such as LinkedIn or GitHub
                when applicable.
              </p>
            </div>
          </>
        );

      case "summary":
        return (
          <>
            <SectionHeader
              eyebrow="RESUME"
              title="Professional Summary"
              description="Your summary should quickly explain who you are, what you can do and what role you are targeting."
            />

            <ResumeSectionCard
              title="Current Summary"
              data={
                analysis.sections
                  ?.professionalSummary
              }
            />

            <Roadmap
              title="Summary Improvement Roadmap"
              steps={[
                "Remove generic opening statements",
                "Highlight your strongest relevant capabilities",
                "Add measurable achievements where possible",
                "Align the summary with your target role",
              ]}
            />
          </>
        );

      case "skills":
        return (
          <>
            <SectionHeader
              eyebrow="RESUME"
              title="Skills"
              description="See the skills detected in your resume, identify gaps and understand what to develop next."
            />

            <div className="modern-card">
              <div className="card-header">
                <div>
                  <span className="card-eyebrow">
                    DETECTED SKILLS
                  </span>

                  <h2>
                    Current skill profile
                  </h2>
                </div>
              </div>

              <div className="skill-cloud large">
                {analysis.skills?.map(
                  (skill, index) => (
                    <span key={index}>
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="modern-card">
                <div className="card-header">
                  <div>
                    <span className="card-eyebrow">
                      SKILL GAPS
                    </span>

                    <h2>
                      Skills to consider
                    </h2>
                  </div>
                </div>

                <ListBlock
                  items={
                    analysis.missingSkills
                  }
                />
              </div>

              <div className="modern-card">
                <div className="card-header">
                  <div>
                    <span className="card-eyebrow">
                      PRIORITY
                    </span>

                    <h2>
                      Skill development path
                    </h2>
                  </div>
                </div>

                <Roadmap
                  title="Build stronger skills"
                  steps={[
                    "Choose high-priority gaps",
                    "Learn the fundamentals",
                    "Practice consistently",
                    "Build a practical project",
                    "Demonstrate the skill on your resume",
                  ]}
                />
              </div>
            </div>
          </>
        );

      case "experience":
        return (
          <>
            <SectionHeader
              eyebrow="RESUME"
              title="Work Experience"
              description="Make your experience communicate ownership, measurable results and professional impact."
            />

            <ResumeSectionCard
              title="Experience detected"
              data={
                analysis.sections
                  ?.workExperience
              }
            />

            <div className="guidance-card">
              <span>IMPROVEMENT</span>

              <h3>
                Move from responsibilities to
                achievements.
              </h3>

              <p>
                Strong experience entries explain
                what you did, which tools you used
                and what changed because of your
                work.
              </p>
            </div>

            <Roadmap
              title="Experience Improvement Roadmap"
              steps={[
                "Identify your strongest responsibilities",
                "Convert them into achievement statements",
                "Add measurable outcomes",
                "Highlight relevant technologies",
                "Match experience to the target role",
              ]}
            />
          </>
        );

      case "education":
        return (
          <>
            <SectionHeader
              eyebrow="RESUME"
              title="Education"
              description="Review the academic information detected from your resume."
            />

            <ResumeSectionCard
              title="Education detected"
              data={
                analysis.sections
                  ?.education
              }
            />
          </>
        );

      case "projects":
        return (
          <>
            <SectionHeader
              eyebrow="RESUME"
              title="Projects"
              description="Show practical ability through relevant projects, technologies, problem-solving and measurable outcomes."
            />

            <ResumeSectionCard
              title="Projects detected"
              data={
                analysis.sections?.projects
              }
            />

            <Roadmap
              title="Project Development Roadmap"
              steps={[
                "Select a relevant real-world problem",
                "Choose a suitable technology stack",
                "Build and test the solution",
                "Document measurable results",
                "Add the strongest project to your resume",
              ]}
            />
          </>
        );

      case "certifications":
        return (
          <>
            <SectionHeader
              eyebrow="RESUME"
              title="Certifications"
              description="Review the certifications detected in your resume and their relevance to your career direction."
            />

            <ResumeSectionCard
              title="Certifications detected"
              data={
                analysis.sections
                  ?.certifications
              }
            />

            <div className="guidance-card">
              <span>GUIDANCE</span>

              <h3>
                Prioritize relevant credentials.
              </h3>

              <p>
                Certifications are most useful
                when they support your target role
                and demonstrate relevant knowledge.
              </p>
            </div>
          </>
        );

      case "quality":
        return (
          <>
            <SectionHeader
              eyebrow="RESUME HEALTH"
              title="Resume Quality"
              description="A visual breakdown of the quality dimensions that influence how your resume is perceived."
            />

            <div className="quality-dashboard">
              <div className="quality-main">
                <DonutChart
                  score={
                    analysis.qualityAnalysis
                      ?.overallScore
                  }
                  label="Quality"
                />

                <div>
                  <span className="card-eyebrow">
                    OVERALL QUALITY
                  </span>

                  <h2>
                    {analysis.resumeStrength ||
                      "Resume assessment"}
                  </h2>

                  <p>
                    Your score is based on
                    completeness, content, clarity,
                    relevance, professionalism and
                    structure.
                  </p>
                </div>
              </div>

              <div className="quality-breakdown">
                <ProgressBar
                  label="Completeness"
                  score={
                    analysis.qualityAnalysis
                      ?.completeness?.score
                      ? analysis.qualityAnalysis
                          .completeness.score * 10
                      : undefined
                  }
                />

                <ProgressBar
                  label="Content Quality"
                  score={
                    analysis.qualityAnalysis
                      ?.contentQuality?.score
                      ? analysis.qualityAnalysis
                          .contentQuality.score *
                        10
                      : undefined
                  }
                />

                <ProgressBar
                  label="Clarity"
                  score={
                    analysis.qualityAnalysis
                      ?.clarity?.score
                      ? analysis.qualityAnalysis
                          .clarity.score * 10
                      : undefined
                  }
                />

                <ProgressBar
                  label="Relevance"
                  score={
                    analysis.qualityAnalysis
                      ?.relevance?.score
                      ? analysis.qualityAnalysis
                          .relevance.score * 10
                      : undefined
                  }
                />

                <ProgressBar
                  label="Professionalism"
                  score={
                    analysis.qualityAnalysis
                      ?.professionalism?.score
                      ? analysis.qualityAnalysis
                          .professionalism
                          .score * 10
                      : undefined
                  }
                />

                <ProgressBar
                  label="Structure"
                  score={
                    analysis.qualityAnalysis
                      ?.structure?.score
                      ? analysis.qualityAnalysis
                          .structure.score * 10
                      : undefined
                  }
                />
              </div>
            </div>
          </>
        );

      case "ats":
        return (
          <>
            <SectionHeader
              eyebrow="RESUME HEALTH"
              title="ATS Analysis"
              description="Understand exactly where your resume performs well and where automated screening may filter it out."
            />

            <div className="ats-hero">
              <DonutChart
                score={
                  analysis.atsAnalysis
                    ?.overallScore ??
                  analysis.atsScore
                }
                label="ATS"
              />

              <div>
                <span className="card-eyebrow">
                  APPLICANT TRACKING SYSTEM
                </span>

                <h2>
                  ATS compatibility score
                </h2>

                <p>
                  Review keyword coverage,
                  formatting, sections, skills
                  matching and experience relevance.
                </p>
              </div>
            </div>

            <div className="modern-card">
              <div className="card-header">
                <div>
                  <span className="card-eyebrow">
                    BREAKDOWN
                  </span>

                  <h2>ATS performance</h2>
                </div>
              </div>

              <div className="progress-list">
                <ProgressBar
                  label="Keywords"
                  score={
                    analysis.atsAnalysis
                      ?.keywordScore
                  }
                />

                <ProgressBar
                  label="Formatting"
                  score={
                    analysis.atsAnalysis
                      ?.formattingScore
                  }
                />

                <ProgressBar
                  label="Sections"
                  score={
                    analysis.atsAnalysis
                      ?.sectionScore
                  }
                />

                <ProgressBar
                  label="Skills Match"
                  score={
                    analysis.atsAnalysis
                      ?.skillsMatchScore
                  }
                />

                <ProgressBar
                  label="Experience Relevance"
                  score={
                    analysis.atsAnalysis
                      ?.experienceRelevanceScore
                  }
                />
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="modern-card">
                <div className="card-header">
                  <div>
                    <span className="card-eyebrow">
                      ISSUES
                    </span>

                    <h2>ATS issues</h2>
                  </div>
                </div>

                <ListBlock
                  items={
                    analysis.atsAnalysis?.issues
                  }
                />
              </div>

              <div className="modern-card">
                <div className="card-header">
                  <div>
                    <span className="card-eyebrow">
                      RECOMMENDATIONS
                    </span>

                    <h2>How to improve</h2>
                  </div>
                </div>

                <ListBlock
                  items={
                    analysis.atsAnalysis
                      ?.improvementSuggestions
                  }
                />
              </div>
            </div>

            <Roadmap
              title="ATS Improvement Roadmap"
              steps={[
                "Fix structural and formatting issues",
                "Improve relevant keyword coverage",
                "Align skills with the target role",
                "Strengthen relevant experience",
                "Run another ATS analysis",
              ]}
            />
          </>
        );

      case "strengths":
        return (
          <>
            <SectionHeader
              eyebrow="IMPROVEMENT"
              title="Strengths"
              description="The areas of your profile that already provide a strong foundation."
            />

            <div className="modern-card">
              <div className="strength-grid">
                {analysis.skills
                  ?.slice(0, 8)
                  .map((skill, index) => (
                    <div
                      className="strength-item"
                      key={index}
                    >
                      <span>✓</span>

                      <strong>
                        {skill}
                      </strong>
                    </div>
                  ))}
              </div>
            </div>
          </>
        );

      case "weaknesses":
        return (
          <>
            <SectionHeader
              eyebrow="IMPROVEMENT"
              title="Weak Areas"
              description="Focus on these areas to make your resume more complete, relevant and competitive."
            />

            <div className="modern-card">
              <ListBlock
                items={analysis.weakAreas}
              />
            </div>
          </>
        );

      case "action":
        return (
          <>
            <SectionHeader
              eyebrow="IMPROVEMENT"
              title="Action Plan"
              description="Turn the AI recommendations into a practical sequence of resume improvements."
            />

            <div className="action-grid">
              {analysis.suggestions?.map(
                (item, index) => (
                  <div
                    className="action-card"
                    key={index}
                  >
                    <span>
                      {String(
                        index + 1
                      ).padStart(2, "0")}
                    </span>

                    <div>
                      <small>
                        PRIORITY ACTION
                      </small>

                      <p>{item}</p>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        );

      case "interview":
        return (
          <>
            <SectionHeader
              eyebrow="PREPARATION"
              title="Interview Preparation"
              description="Prepare around the skills, projects and experience represented in your resume."
            />

            <div className="modern-card">
              <ListBlock
                items={
                  analysis.careerRoadmap
                    ?.interviewPreparation
                }
              />
            </div>

            <Roadmap
              title="Interview Preparation Roadmap"
              steps={[
                "Know every detail written on your resume",
                "Prepare project explanations",
                "Revise role-specific technical concepts",
                "Practice behavioral questions",
                "Conduct mock interviews",
              ]}
            />
          </>
        );

      case "job":
        return (
          <>
            <SectionHeader
              eyebrow="PREPARATION"
              title="Job Preparation"
              description="Practical steps to turn your improved resume into a stronger job application."
            />

            <div className="modern-card">
              <ListBlock
                items={
                  analysis.careerRoadmap
                    ?.jobPreparationTips
                }
              />
            </div>

            <Roadmap
              title="Job Application Roadmap"
              steps={[
                "Finalize the resume",
                "Optimize your professional profile",
                "Prepare role-specific versions",
                "Build a focused application list",
                "Track applications and follow-ups",
              ]}
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <section className="resume-analysis-page">
      <div className="analysis-layout">
        {/* SIDEBAR */}

        <aside
          className={`analysis-sidebar ${
            mobileNavOpen
              ? "mobile-open"
              : ""
          }`}
        >
          <div className="brand">
            <div className="brand-mark">
              C
            </div>

            <div>
              <strong>
                CareerLane
              </strong>

              <span>
                AI Career Platform
              </span>
            </div>
          </div>

          <div className="sidebar-content">
            
            <NavGroup title="ANALYSIS">
              <SidebarButton
                label="Overview"
                active={
                  activeSection ===
                  "overview"
                }
                onClick={() =>
                  goToSection(
                    "overview"
                  )
                }
              />
            </NavGroup>

            <NavGroup title="RESUME">
              <SidebarButton
                label="Personal Information"
                active={
                  activeSection ===
                  "personal"
                }
                onClick={() =>
                  goToSection(
                    "personal"
                  )
                }
              />

              <SidebarButton
                label="Professional Summary"
                active={
                  activeSection ===
                  "summary"
                }
                onClick={() =>
                  goToSection(
                    "summary"
                  )
                }
              />

              <SidebarButton
                label="Skills"
                active={
                  activeSection ===
                  "skills"
                }
                onClick={() =>
                  goToSection("skills")
                }
              />

              <SidebarButton
                label="Work Experience"
                active={
                  activeSection ===
                  "experience"
                }
                onClick={() =>
                  goToSection(
                    "experience"
                  )
                }
              />

              <SidebarButton
                label="Education"
                active={
                  activeSection ===
                  "education"
                }
                onClick={() =>
                  goToSection(
                    "education"
                  )
                }
              />

              <SidebarButton
                label="Projects"
                active={
                  activeSection ===
                  "projects"
                }
                onClick={() =>
                  goToSection(
                    "projects"
                  )
                }
              />

              <SidebarButton
                label="Certifications"
                active={
                  activeSection ===
                  "certifications"
                }
                onClick={() =>
                  goToSection(
                    "certifications"
                  )
                }
              />
            </NavGroup>

            <NavGroup title="RESUME HEALTH">
              <SidebarButton
                label="Resume Quality"
                active={
                  activeSection ===
                  "quality"
                }
                onClick={() =>
                  goToSection(
                    "quality"
                  )
                }
              />

              <SidebarButton
                label="ATS Analysis"
                active={
                  activeSection === "ats"
                }
                onClick={() =>
                  goToSection("ats")
                }
              />
            </NavGroup>

            <NavGroup title="CAREER">
              <SidebarButton
                label="Career Roadmap"
                active={false}
                onClick={() =>
                  navigate("/roadmap", {
                    state: {
                      analysis,
                      resumeText,
                    },
                  })
                }
              />
            </NavGroup>

            <NavGroup title="IMPROVEMENT">
              <SidebarButton
                label="Strengths"
                active={
                  activeSection ===
                  "strengths"
                }
                onClick={() =>
                  goToSection(
                    "strengths"
                  )
                }
              />

              <SidebarButton
                label="Weak Areas"
                active={
                  activeSection ===
                  "weaknesses"
                }
                onClick={() =>
                  goToSection(
                    "weaknesses"
                  )
                }
              />

              <SidebarButton
                label="Action Plan"
                active={
                  activeSection ===
                  "action"
                }
                onClick={() =>
                  goToSection(
                    "action"
                  )
                }
              />
            </NavGroup>

            <NavGroup title="PREPARATION">
              <SidebarButton
  label="Interview Preparation"
  active={false}
  onClick={() =>
    navigate("/interview-preparation", {
      state: {
        analysis,
        resumeText,
      },
    })
  }
/>

              <SidebarButton
                label="Job Preparation"
                active={
                  activeSection ===
                  "job"
                }
               onClick={() =>
              navigate("/job-preparation", {
                state: {
                  analysis,
                  resumeText,
                },
              })
            }
              />
            </NavGroup>

            <div className="sidebar-divider" />

            <div className="build-area">
              <span>
                BUILD RESUME
              </span>

              <button
                onClick={() =>
                  navigate(
                    "/edit-resume",
                    {
                      state: {
                        analysis,
                        resumeText,
                      },
                    }
                  )
                }
              >
                <strong>
                  Edit Resume
                </strong>

                <b>→</b>
              </button>

              <button
                onClick={() =>
                  navigate(
                    "/resume-templates",
                    {
                      state: {
                        analysis,
                        resumeText,
                      },
                    }
                  )
                }
              >
                <strong>
                  Resume Templates
                </strong>

                <b>→</b>
              </button>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>
        </aside>

        {/* MAIN */}

        <main className="analysis-main">
          <header className="analysis-topbar">
            <button
              className="mobile-menu"
              onClick={() =>
                setMobileNavOpen(
                  !mobileNavOpen
                )
              }
            >
              ☰
            </button>

            <div className="topbar-title">
              <span>
                AI RESUME ANALYSIS
              </span>

              <strong>
                {activeSection ===
                "overview"
                  ? "Resume Overview"
                  : activeSection}
              </strong>
            </div>

            <button
              className="topbar-edit"
              onClick={() =>
                navigate(
                  "/edit-resume",
                  {
                    state: {
                      analysis,
                      resumeText,
                      file: {
                        originalName:
                          sessionStorage.getItem(
                            "careerLaneResumeFileName"
                          ) ||
                          "Original Resume",

                        originalFileUrl:
                          sessionStorage.getItem(
                            "careerLaneResumeFileUrl"
                          ) || "",

                        mimetype:
                          sessionStorage.getItem(
                            "careerLaneResumeFileType"
                          ) || "",
                      },
                    },
                  }
                )
              }
            >
              Edit Resume
            </button>
          </header>

          <div className="analysis-container">
            {renderContent()}
          </div>
        </main>
      </div>
    </section>
  );
}

export default ResumeAnalysisPage;