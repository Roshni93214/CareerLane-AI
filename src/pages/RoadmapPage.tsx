import { useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import "../styles/Roadmap.css";
import { apiUrl } from "../config";

function RoadmapPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const storedAnalysis = sessionStorage.getItem(
    "careerLaneResumeAnalysis"
  );

  const analysis =
    location.state?.analysis ||
    (storedAnalysis
      ? JSON.parse(storedAnalysis)
      : null);

  const resumeText =
    location.state?.resumeText ||
    sessionStorage.getItem(
      "careerLaneResumeText"
    ) ||
    "";

  const recommendedRoles = Array.isArray(
    analysis?.careerRecommendations
  )
    ? analysis.careerRecommendations.filter(Boolean)
    : [];

  const defaultRole =
    recommendedRoles[0] || "";

  const [selectedRole, setSelectedRole] =
    useState(defaultRole);

  const [timeline, setTimeline] =
    useState("6");

  const [dailyHours, setDailyHours] =
    useState("2");

  const [skillLevel, setSkillLevel] =
    useState("Beginner");

  const [customMonths, setCustomMonths] =
    useState("");

  const [personalisedRoadmap, setPersonalisedRoadmap] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleGeneratePersonalisedRoadmap =
    async () => {
      setError("");

      const finalTimeline = customMonths.trim()
        ? Number(customMonths)
        : Number(timeline);

      const finalDailyHours =
        Number(dailyHours);

      if (!selectedRole.trim()) {
        setError(
          "Please select or enter a career role first."
        );
        return;
      }

      if (!resumeText.trim()) {
        setError(
          "Resume information is not available. Please analyze your resume again."
        );
        return;
      }

      if (
        !Number.isFinite(finalTimeline) ||
        finalTimeline < 1
      ) {
        setError(
          "Please enter a valid timeline in months."
        );
        return;
      }

      if (
        !Number.isFinite(finalDailyHours) ||
        finalDailyHours < 1
      ) {
        setError(
          "Please select valid daily study hours."
        );
        return;
      }

      const token =
        localStorage.getItem("token");

      if (!token) {
        setError(
          "Please login before generating your roadmap."
        );
        navigate("/login");
        return;
      }

      try {
        setLoading(true);

        const response = await fetch(
          apiUrl(
            "/api/resume/generate-roadmap"
          ),
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              resumeText,

              targetRole:
                selectedRole.trim(),

              timelineMonths:
                finalTimeline,

              dailyHours:
                finalDailyHours,

              currentLevel:
                skillLevel,

              existingSkills:
                Array.isArray(
                  analysis?.skills
                )
                  ? analysis.skills
                  : [],

              missingSkills:
                Array.isArray(
                  analysis?.missingSkills
                )
                  ? analysis.missingSkills
                  : [],
            }),
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data.message ||
              "Failed to generate personalized career roadmap."
          );
          return;
        }

        setPersonalisedRoadmap(
          data.roadmap
        );

        window.scrollTo({
          top: 0,
          behavior: "auto",
        });
      } catch (requestError) {
        console.error(
          "Personalized roadmap error:",
          requestError
        );

        setError(
          "Cannot connect to server. Please make sure the backend is running."
        );
      } finally {
        setLoading(false);
      }
    };

  if (!analysis) {
    return (
      <section className="roadmap-page">
        <div className="roadmap-container">
          <button
            type="button"
            className="roadmap-back"
            onClick={() =>
              navigate("/resume-analysis")
            }
          >
            ← Back to Resume Analysis
          </button>

          <div className="roadmap-empty">
            <h2>
              Resume Analysis Not Found
            </h2>

            <p>
              Please analyze your resume first
              before creating a career roadmap.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/resume-upload")
              }
            >
              Analyze Resume →
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (personalisedRoadmap) {
    return (
      <section className="roadmap-page">
        <div className="roadmap-container">
          <button
  type="button"
  className="roadmap-back"
  onClick={() => {
    setPersonalisedRoadmap(null);
    setError(""); timeline

    navigate("/roadmap", {
      replace: true,
      state: {
        analysis,
        resumeText,
      },
    });

    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }}
>
  ← Back to Roadmap Settings
</button>

          <header className="roadmap-header">
            <span className="roadmap-eyebrow">
              CAREER ROADMAP
            </span>

            <h1>
              Your{" "}
              <span>
                Personalized Roadmap
              </span>
            </h1>

            <p>
              A personalized learning plan built
              around your career goal, timeline,
              available study time and current
              skill level.
            </p>
          </header>

          <GeneratedRoadmap
            roadmap={personalisedRoadmap}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="roadmap-page">
      <div className="roadmap-container">
        <button
          type="button"
          className="roadmap-back"
          onClick={() =>
            navigate(
              "/resume-analysis",
              {
                state: {
                  analysis,
                  resumeText,
                },
              }
            )
          }
        >
          ← Back to Resume Analysis
        </button>

        <header className="roadmap-header">
          <span className="roadmap-eyebrow">
            CAREER PLANNING
          </span>

          <h1>
            Build Your{" "}
            <span>Career Roadmap</span>
          </h1>

          <p>
            Choose a career direction and
            personalize the roadmap before
            generating it.
          </p>
        </header>

        {error && (
          <div className="roadmap-error">
            {error}
          </div>
        )}

        {/* 01 AI RECOMMENDED ROLES */}

        <section className="roadmap-selection-section">
          <div className="result-section-heading">
            <span>01</span>

            <div>
              <h2>
                AI Recommended Roles
              </h2>

              <p>
                Select a career role recommended
                from your resume analysis.
              </p>
            </div>
          </div>

          <div className="recommended-role-grid">
            {recommendedRoles.length > 0 ? (
              recommendedRoles.map(
                (
                  role: string,
                  index: number
                ) => (
                  <button
                    key={`${role}-${index}`}
                    type="button"
                    className={`recommended-role-card ${
                      selectedRole === role
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => {
                      setSelectedRole(role);
                      setError("");
                    }}
                  >
                    <span className="role-index">
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <div>
                      <small>
                        AI RECOMMENDED
                      </small>

                      <strong>
                        {role}
                      </strong>
                    </div>

                    {selectedRole === role && (
                      <span className="role-check">
                        ✓
                      </span>
                    )}
                  </button>
                )
              )
            ) : (
              <div className="roadmap-empty">
                <p>
                  No career recommendations were
                  found in your resume analysis.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 02 HAVE ANOTHER CAREER GOAL */}

        <section className="roadmap-card custom-career-card">
          <div className="card-heading">
            <span className="card-number">
              02
            </span>

            <div>
              <h2>
                Have another career goal?
              </h2>

              <p>
                Enter the role you personally want
                to pursue.
              </p>
            </div>
          </div>

          <input
            type="text"
            value={selectedRole}
            onChange={(event) => {
              setSelectedRole(
                event.target.value
              );
              setError("");
            }}
            placeholder="e.g. AI Engineer"
            className="career-role-input"
          />
        </section>

        {/* GENERATE BUTTON 1 */}

        <div className="roadmap-generate-area">
          <div>
            <small>
              SELECTED CAREER
            </small>

            <strong>
              {selectedRole ||
                "No role selected"}
            </strong>
          </div>

          <button
            type="button"
            className="generate-roadmap-btn"
            onClick={
              handleGeneratePersonalisedRoadmap
            }
            disabled={
              loading ||
              !selectedRole.trim()
            }
          >
            {loading
              ? "Generating AI Roadmap..."
              : "Generate Career Roadmap"}

            <span>
              {loading ? "..." : "→"}
            </span>
          </button>
        </div>

        {/* 03 TIMELINE */}

        <section className="roadmap-card">
          <div className="card-heading">
            <span className="card-number">
              03
            </span>

            <div>
              <h2>
                Timeline / Months
              </h2>

              <p>
                Choose the amount of time you want
                CareerLane to plan for.
              </p>
            </div>
          </div>

          <div className="timeline-options">
            {[
              ["3", "3 Months"],
              ["6", "6 Months"],
              ["9", "9 Months"],
              ["12", "12 Months"],
            ].map(
              ([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={
                  Number(customMonths || timeline) ===
                  Number(value)
                    ? "selected"
                    : ""
                }
                onClick={() => {
                  setTimeline(value);
                  setCustomMonths(value);
                  setError("");
                }}
                >
                  {label}
                </button>
              )
            )}
          </div>

          <div className="personalisation-field">
            <label htmlFor="custom-months">
              Custom Months
            </label>

            <input
              id="custom-months"
              type="number"
              min="1"
              max="36"
              value={customMonths}
              onChange={(event) => {
                setCustomMonths(
                  event.target.value
                );
                setError("");
              }}
              placeholder="Enter months"
            />
          </div>
        </section>

        {/* 04 AVAILABLE STUDY TIME */}

        <section className="roadmap-card">
          <div className="card-heading">
            <span className="card-number">
              04
            </span>

            <div>
              <h2>
                Available Study Time
              </h2>

              <p>
                Tell CareerLane how many hours you
                can realistically study each day.
              </p>
            </div>
          </div>

          <div className="hours-selector">
            <button
              type="button"
              onClick={() =>
                setDailyHours(
                  String(
                    Math.max(
                      1,
                      Number(dailyHours) - 1
                    )
                  )
                )
              }
            >
              −
            </button>

            <div>
              <strong>
                {dailyHours}
              </strong>

              <span>
                hours/day
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setDailyHours(
                  String(
                    Math.min(
                      12,
                      Number(dailyHours) + 1
                    )
                  )
                )
              }
            >
              +
            </button>
          </div>
        </section>

        {/* 05 CURRENT SKILL LEVEL */}

        <section className="roadmap-card">
          <div className="card-heading">
            <span className="card-number">
              05
            </span>

            <div>
              <h2>
                Current Skill Level
              </h2>

              <p>
                Choose the level CareerLane should
                use as your starting point.
              </p>
            </div>
          </div>

          <div className="level-options">
            {[
              "Beginner",
              "Intermediate",
              "Advanced",
            ].map((level) => (
              <button
                key={level}
                type="button"
                className={
                  skillLevel === level
                    ? "selected"
                    : ""
                }
                onClick={() => {
                  setSkillLevel(level);
                  setError("");
                }}
              >
                <strong>
                  {level}
                </strong>

                <span>
                  {level === "Beginner"
                    ? "Starting from basics"
                    : level ===
                      "Intermediate"
                    ? "Know the fundamentals"
                    : "Strong foundation"}
                </span>
              </button>
            ))}
          </div>
        </section>

        <div className="roadmap-note">
          <span>✦</span>

          <p>
            Your resume, existing skills, missing
            skills, target role, timeline, daily
            study time and current level will all
            be used to create your personalized
            roadmap.
          </p>
        </div>

        {/* GENERATE BUTTON 2 */}

        <div className="roadmap-generate-area">
          <div>
            <small>
              YOUR ROADMAP SETTINGS
            </small>

            <strong>
              {selectedRole ||
                "No role selected"}
            </strong>
          </div>

          <button
            type="button"
            className="generate-roadmap-btn"
            onClick={
              handleGeneratePersonalisedRoadmap
            }
            disabled={
              loading ||
              !selectedRole.trim()
            }
          >
            {loading
              ? "Generating Your Roadmap..."
              : "Generate My Career Roadmap"}

            <span>
              {loading ? "..." : "→"}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

/* =====================================================
   GENERATED PERSONALIZED ROADMAP
===================================================== */

function GeneratedRoadmap({
  roadmap,
}: {
  roadmap: any;
}) {
  if (!roadmap) {
    return null;
  }

  const totalHours =
    roadmap.estimatedRequiredHours ||
    roadmap.estimatedTotalHours ||
    0;

  const timeline =
    roadmap.timelineMonths
      ? `${roadmap.timelineMonths} months`
      : "Personalized plan";

  return (
    <div className="generated-roadmap">
      {/* OVERVIEW */}

      <div className="roadmap-result-header">
        <div>
          <span className="roadmap-eyebrow">
            YOUR PERSONALIZED PLAN
          </span>

          <h2>
            {roadmap.targetRole ||
              "Career Roadmap"}
          </h2>

          <p>
            {roadmap.roleOverview ||
              roadmap.summary ||
              "A personalized career learning path built from your resume and selected preferences."}
          </p>
        </div>

        {roadmap.feasibility && (
          <div className="feasibility-card">
            <small>
              FEASIBILITY
            </small>

            <strong>
              {roadmap.feasibility.status}
            </strong>

            <span>
              {roadmap.feasibility.score}/100
            </span>
          </div>
        )}
      </div>

      {/* RESULT STATS */}

      <div className="roadmap-result-stats">
        <div>
          <small>
            TARGET ROLE
          </small>

          <strong>
            {roadmap.targetRole ||
              "--"}
          </strong>
        </div>

        <div>
          <small>
            TIMELINE
          </small>

          <strong>
            {timeline}
          </strong>
        </div>

        <div>
          <small>
            EST. HOURS
          </small>

          <strong>
            {totalHours || "--"} hrs
          </strong>
        </div>

        <div>
          <small>
            DAILY STUDY
          </small>

          <strong>
            {roadmap.dailyStudyHours ||
              "--"}{" "}
            hrs/day
          </strong>
        </div>
      </div>

      {/* FEASIBILITY */}

      {roadmap.feasibility
        ?.message && (
        <div className="roadmap-feasibility-message">
          <strong>
            {roadmap.feasibility.status}
          </strong>

          <p>
            {roadmap.feasibility.message}
          </p>
        </div>
      )}

      {/* PRIORITY SKILLS */}

      {roadmap.prioritySkills
        ?.length > 0 && (
        <section className="roadmap-result-section">
          <ResultHeading
            number="01"
            title="Priority Skills"
            description="Skills prioritized for the selected target role."
          />

          <div className="priority-skills-grid">
            {roadmap.prioritySkills.map(
              (
                item: any,
                index: number
              ) => (
                <div
                  className={`priority-skill priority-${String(
                    item.priority || ""
                  ).toLowerCase()}`}
                  key={index}
                >
                  <div>
                    <strong>
                      {item.skill}
                    </strong>

                    <span>
                      {item.priority}
                    </span>
                  </div>

                  <p>
                    {item.reason}
                  </p>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* PREREQUISITES */}

      {roadmap.prerequisites
        ?.length > 0 && (
        <section className="roadmap-result-section">
          <ResultHeading
            number="02"
            title="Prerequisites"
            description="Foundations that support the selected career direction."
          />

          <DetailList
            items={
              roadmap.prerequisites
            }
          />
        </section>
      )}

      {/* LEARNING PHASES */}

      {roadmap.phases?.length > 0 && (
        <section className="roadmap-result-section">
          <ResultHeading
            number="03"
            title="Learning Phases"
            description="Follow these phases progressively based on your timeline."
          />

          <div className="generated-phases">
            {roadmap.phases.map(
              (
                phase: any,
                index: number
              ) => (
                <div
                  className="generated-phase"
                  key={index}
                >
                  <div className="generated-phase-marker">
                    {String(
                      phase.phaseNumber ||
                        index + 1
                    ).padStart(2, "0")}
                  </div>

                  <div className="generated-phase-content">
                    <div className="generated-phase-header">
                      <div>
                        <small>
                          PHASE{" "}
                          {phase.phaseNumber ||
                            index + 1}
                        </small>

                        <h3>
                          {phase.phaseName ||
                            "Learning Phase"}
                        </h3>
                      </div>

                      <span>
                        {phase.duration}
                      </span>
                    </div>

                    <p className="phase-objective">
                      {phase.objective}
                    </p>

                    <div className="generated-skills">
                      {(
                        phase.skills ||
                        phase.skillsToLearn ||
                        []
                      ).map(
                        (
                          skill: any,
                          skillIndex: number
                        ) => (
                          <div
                            className="generated-skill"
                            key={skillIndex}
                          >
                            <div className="generated-skill-header">
                              <div>
                                <strong>
                                  {skill.skill}
                                </strong>

                                {skill.priority && (
                                  <span
                                    className={`skill-priority priority-${String(
                                      skill.priority
                                    ).toLowerCase()}`}
                                  >
                                    {skill.priority}
                                  </span>
                                )}
                              </div>

                              {(skill.allocatedHours ||
                                skill.estimatedHours) && (
                                <small>
                                  {skill.allocatedHours ||
                                    skill.estimatedHours}{" "}
                                  hrs
                                </small>
                              )}
                            </div>

                            {skill.currentStatus && (
                              <p className="skill-status">
                                {skill.currentStatus}
                              </p>
                            )}

                            {skill.importance && (
                              <p className="skill-status">
                                {skill.importance}
                              </p>
                            )}

                            {skill.topics?.length >
                              0 && (
                              <DetailList
                                title="Topics"
                                items={
                                  skill.topics
                                }
                              />
                            )}

                            {skill.practiceTasks
                              ?.length > 0 && (
                              <DetailList
                                title="Practice"
                                items={
                                  skill.practiceTasks
                                }
                              />
                            )}

                            {skill.projects
                              ?.length > 0 && (
                              <DetailList
                                title="Projects"
                                items={
                                  skill.projects
                                }
                              />
                            )}

                            {skill.resources
                              ?.length > 0 && (
                              <div className="roadmap-detail">
                                <h4>
                                  Resources
                                </h4>

                                {skill.resources.map(
                                  (
                                    resource: any,
                                    resourceIndex: number
                                  ) => (
                                    <div
                                      className="resource"
                                      key={
                                        resourceIndex
                                      }
                                    >
                                      <strong>
                                        {
                                          resource.platform
                                        }
                                      </strong>

                                      <p>
                                        {
                                          resource.recommendation
                                        }
                                      </p>
                                    </div>
                                  )
                                )}
                              </div>
                            )}

                            {skill.expectedOutcome && (
                              <div className="skill-outcome">
                                <strong>
                                  Expected Outcome
                                </strong>

                                <p>
                                  {
                                    skill.expectedOutcome
                                  }
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* WEEKLY STRATEGY */}

      {roadmap.weeklyStrategy
        ?.length > 0 && (
        <section className="roadmap-result-section">
          <ResultHeading
            number="04"
            title="Weekly Strategy"
            description="A practical weekly structure for consistent progress."
          />

          <div className="weekly-strategy">
            {roadmap.weeklyStrategy.map(
              (
                week: any,
                index: number
              ) => (
                <div
                  className="week-card"
                  key={index}
                >
                  <div className="week-number">
                    W{week.week}
                  </div>

                  <div>
                    <h3>
                      {week.focus}
                    </h3>

                    <span>
                      {week.estimatedHours} hrs
                    </span>

                    {week.topics?.length >
                      0 && (
                      <ul>
                        {week.topics.map(
                          (
                            topic: string,
                            topicIndex: number
                          ) => (
                            <li
                              key={topicIndex}
                            >
                              {topic}
                            </li>
                          )
                        )}
                      </ul>
                    )}

                    {week.practice?.length >
                      0 && (
                      <ul>
                        {week.practice.map(
                          (
                            item: string,
                            itemIndex: number
                          ) => (
                            <li
                              key={itemIndex}
                            >
                              {item}
                            </li>
                          )
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* INTERVIEW PREPARATION */}

      {roadmap.interviewPreparation
        ?.length > 0 && (
        <section className="roadmap-result-section">
          <ResultHeading
            number="05"
            title="Interview Preparation"
            description="Prepare for technical and practical interviews."
          />

          <DetailList
            items={
              roadmap.interviewPreparation
            }
          />
        </section>
      )}

      {/* JOB PREPARATION */}

      {roadmap.jobPreparation
        ?.length > 0 && (
        <section className="roadmap-result-section">
          <ResultHeading
            number="06"
            title="Job Preparation"
            description="Move from learning toward employment."
          />

          <DetailList
            items={roadmap.jobPreparation}
          />
        </section>
      )}

      {/* PORTFOLIO */}

      {roadmap.portfolioPlan
        ?.length > 0 && (
        <section className="roadmap-result-section">
          <ResultHeading
            number="07"
            title="Portfolio Plan"
            description="Build proof of your skills through practical work."
          />

          <DetailList
            items={
              roadmap.portfolioPlan
            }
          />
        </section>
      )}

      {/* JOB READINESS */}

      {roadmap.jobReadinessChecklist
        ?.length > 0 && (
        <section className="roadmap-result-section">
          <ResultHeading
            number="08"
            title="Job Readiness"
            description="Milestones to complete before applying."
          />

          <div className="readiness-checklist">
            {roadmap.jobReadinessChecklist.map(
              (
                item: any,
                index: number
              ) => (
                <div
                  className="readiness-item"
                  key={index}
                >
                  <span>
                    {item.completed
                      ? "✓"
                      : "○"}
                  </span>

                  <p>
                    {item.item}
                  </p>
                </div>
              )
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function ResultHeading({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="result-section-heading">
      <span>{number}</span>

      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function DetailList({
  title,
  items,
}: {
  title?: string;
  items?: string[];
}) {
  if (!items?.length) {
    return null;
  }

  return (
    <div className="roadmap-detail">
      {title && <h4>{title}</h4>}

      <ul>
        {items.map(
          (
            item,
            index
          ) => (
            <li key={index}>
              {item}
            </li>
          )
        )}
      </ul>
    </div>
  );
}

export default RoadmapPage;