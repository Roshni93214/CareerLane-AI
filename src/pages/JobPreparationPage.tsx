import { useState } from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import "../styles/JobPreparation.css";

import { apiUrl } from "../config";

interface JobRequirement {
  skill: string;
  priority: string;
  reason: string;
  candidateStatus: string;
}

interface SkillGap {
  skill: string;
  priority: string;
  currentStatus: string;
  action: string;
  estimatedHours: number;
}

interface MonthlyPlan {
  month: number;
  focus: string;
  skills: string[];
  outcomes: string[];
}

interface WeeklyPlan {
  week: number;
  focus: string;
  tasks: string[];
  estimatedHours: number;
}

interface Feasibility {
  status: string;
  score: number;
  message: string;
}

interface JobPreparationPlan {
  targetRole: string;
  roleSummary: string;

  timelineMonths: number;
  dailyStudyHours: number;
  totalAvailableHours: number;
  estimatedRequiredHours: number;

  feasibility: Feasibility;

  jobRequirements: JobRequirement[];

  skillGaps: SkillGap[];

  monthlyPlan: MonthlyPlan[];

  weeklyPlan: WeeklyPlan[];

  interviewPreparation: string[];

  jobPreparation: string[];

  recommendedProjects: string[];

  finalChecklist: string[];
}

function JobPreparationPage() {
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

  const [generatedPlan, setGeneratedPlan] =
    useState<JobPreparationPlan | null>(null);

  const [jobDescription, setJobDescription] =
    useState("");

  const [selectedRole, setSelectedRole] =
    useState(
      analysis?.careerRoadmap?.targetRole ||
        ""
    );

  const [customRole, setCustomRole] =
    useState("");

  const [timelineMonths, setTimelineMonths] =
    useState("3");

  const [dailyHours, setDailyHours] =
    useState("2");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const roles = [
    "Java Developer",
    "Full Stack Developer",
    "Frontend Developer",
    "Backend Developer",
    "React Developer",
    "Node.js Developer",
    "Python Developer",
    "Software Engineer",
    "Data Analyst",
    "AI/ML Engineer",
    "QA Engineer",
    "Cybersecurity Analyst",
    "Custom Role",
  ];

  const finalRole =
    selectedRole === "Custom Role"
      ? customRole.trim()
      : selectedRole.trim();

  const handleGenerate = async () => {
    setError("");

    /*
     * Either JD or Role is enough.
     * Both are not required.
     */

    if (
      !jobDescription.trim() &&
      !finalRole
    ) {
      setError(
        "Please enter a job description or select a target role."
      );

      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      setError(
        "Please login before generating your job preparation plan."
      );

      navigate("/login");

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        apiUrl(
          "/api/resume/job-preparation"
        ),
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            jobDescription:
              jobDescription.trim(),

            targetRole:
              finalRole,

            timelineMonths:
              Number(timelineMonths),

            dailyHours:
              Number(dailyHours),

            resumeText,

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

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Failed to generate job preparation plan."
        );

        return;
      }

      if (!data.plan) {
        setError(
          "The AI response did not contain a preparation plan."
        );

        return;
      }

      console.log(
        "Job Preparation Plan:",
        data.plan
      );

      setGeneratedPlan(data.plan);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (requestError) {
      console.error(
        "Job preparation generation error:",
        requestError
      );

      setError(
        "Cannot connect to server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToForm = () => {
    setGeneratedPlan(null);

    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * =====================================================
   * GENERATED RESULT
   * =====================================================
   */

  if (generatedPlan) {
    return (
      <GeneratedJobPreparationPlan
        plan={generatedPlan}
        onBack={handleBackToForm}
      />
    );
  }

  /*
   * =====================================================
   * INPUT PAGE
   * =====================================================
   */

  return (
    <section className="job-preparation-page">
      <div className="job-preparation-container">

        <button
          type="button"
          className="job-preparation-back"
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

        <header className="job-preparation-header">
          <span className="job-preparation-eyebrow">
            JOB PREPARATION
          </span>

          <h1>
            Prepare for Your{" "}
            <span>Target Job</span>
          </h1>

          <p>
            Give CareerLane a job description,
            a target role, or both. It will
            identify what matters for the job
            and create a realistic preparation
            plan around your available time.
          </p>
        </header>

        {error && (
          <div className="job-preparation-error">
            {error}
          </div>
        )}

        <section className="job-preparation-card">

          {/* JOB DESCRIPTION */}

          <div className="job-field">
            <label htmlFor="job-description">
              Job Description
              <span>OPTIONAL</span>
            </label>

            <textarea
              id="job-description"
              value={jobDescription}
              onChange={(event) =>
                setJobDescription(
                  event.target.value
                )
              }
              placeholder="Enter your job description"
              rows={10}
            />

            <small>
              Paste the complete job description
              for a more specific preparation plan.
            </small>
          </div>

          {/* OR */}

          <div className="job-or-divider">
            <span>OR</span>
          </div>

          {/* ROLE */}

          <div className="job-field">
            <label htmlFor="target-role">
              Target Role / Designation
              <span>OPTIONAL</span>
            </label>

            <select
              id="target-role"
              value={selectedRole}
              onChange={(event) => {
                const value =
                  event.target.value;

                setSelectedRole(value);

                if (
                  value !== "Custom Role"
                ) {
                  setCustomRole("");
                }
              }}
            >
              <option value="">
                Select a role
              </option>

              {roles.map((role) => (
                <option
                  key={role}
                  value={role}
                >
                  {role}
                </option>
              ))}
            </select>

            {selectedRole ===
              "Custom Role" && (
              <input
                type="text"
                className="custom-role-input"
                value={customRole}
                onChange={(event) =>
                  setCustomRole(
                    event.target.value
                  )
                }
                placeholder="Enter your designation"
              />
            )}
          </div>

          {/* SETTINGS */}

          <div className="job-settings-grid">

            <div className="job-field">
              <label htmlFor="timeline">
                Preparation Timeline
              </label>

              <select
                id="timeline"
                value={timelineMonths}
                onChange={(event) =>
                  setTimelineMonths(
                    event.target.value
                  )
                }
              >
                <option value="1">
                  1 Month
                </option>

                <option value="2">
                  2 Months
                </option>

                <option value="3">
                  3 Months
                </option>

                <option value="4">
                  4 Months
                </option>

                <option value="6">
                  6 Months
                </option>

                <option value="9">
                  9 Months
                </option>

                <option value="12">
                  12 Months
                </option>
              </select>
            </div>

            <div className="job-field">
              <label htmlFor="daily-hours">
                Daily Study Hours
              </label>

              <select
                id="daily-hours"
                value={dailyHours}
                onChange={(event) =>
                  setDailyHours(
                    event.target.value
                  )
                }
              >
                <option value="1">
                  1 Hour / Day
                </option>

                <option value="2">
                  2 Hours / Day
                </option>

                <option value="3">
                  3 Hours / Day
                </option>

                <option value="4">
                  4 Hours / Day
                </option>

                <option value="5">
                  5 Hours / Day
                </option>

                <option value="6">
                  6 Hours / Day
                </option>

                <option value="8">
                  8+ Hours / Day
                </option>
              </select>
            </div>

          </div>

          {/* INFORMATION */}

          <div className="job-preparation-note">
            <div className="job-note-mark">
              ✦
            </div>

            <div>
              <strong>
                Better input = more specific preparation
              </strong>

              <p>
                A job description gives CareerLane
                detailed requirements. A role alone
                is also enough to create a role-based
                preparation strategy.
              </p>
            </div>
          </div>

          {/* GENERATE */}

          <button
            type="button"
            className="job-preparation-generate"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="job-preparation-spinner" />
                Analysing Job Requirements...
              </>
            ) : (
              <>
                Generate Preparation Plan
                <span>→</span>
              </>
            )}
          </button>

        </section>

        {/* INFORMATION CARDS */}

        <section className="job-preparation-info">

          <div className="job-info-card">
            <span>01</span>

            <div>
              <small>
                REQUIREMENTS
              </small>

              <h3>
                Job Requirement Analysis
              </h3>

              <p>
                Identify the important skills,
                technologies, tools and
                responsibilities required
                for the target job.
              </p>
            </div>
          </div>

          <div className="job-info-card">
            <span>02</span>

            <div>
              <small>
                SKILL GAP
              </small>

              <h3>
                Resume vs Job Comparison
              </h3>

              <p>
                Compare your existing skills
                with what the target job expects.
              </p>
            </div>
          </div>

          <div className="job-info-card">
            <span>03</span>

            <div>
              <small>
                PREPARATION
              </small>

              <h3>
                Realistic Learning Plan
              </h3>

              <p>
                Build a practical timeline based
                on your selected months and daily
                study hours.
              </p>
            </div>
          </div>

          <div className="job-info-card">
            <span>04</span>

            <div>
              <small>
                JOB READY
              </small>

              <h3>
                Interview & Application Preparation
              </h3>

              <p>
                Prepare projects, interview topics,
                resume keywords and application
                strategy.
              </p>
            </div>
          </div>

        </section>

      </div>
    </section>
  );
}


/*
 * =====================================================
 * GENERATED PLAN COMPONENT
 * =====================================================
 */

function GeneratedJobPreparationPlan({
  plan,
  onBack,
}: {
  plan: JobPreparationPlan;
  onBack: () => void;
}) {
  return (
    <section className="job-preparation-page">
      <div className="job-preparation-container">

        <button
          type="button"
          className="job-preparation-back"
          onClick={onBack}
        >
          ← Back to Job Preparation
        </button>

        <header className="job-preparation-header">
          <span className="job-preparation-eyebrow">
            AI JOB PREPARATION
          </span>

          <h1>
            {plan.targetRole ||
              "Your Target Job"}
          </h1>

          <p>
            {plan.roleSummary ||
              "Your personalised preparation plan."}
          </p>
        </header>

        {/* STATS */}

        <section className="job-result-stats">

          <div className="job-result-stat">
            <small>
              TIMELINE
            </small>

            <strong>
              {plan.timelineMonths} months
            </strong>
          </div>

          <div className="job-result-stat">
            <small>
              DAILY STUDY
            </small>

            <strong>
              {plan.dailyStudyHours} hrs/day
            </strong>
          </div>

          <div className="job-result-stat">
            <small>
              AVAILABLE TIME
            </small>

            <strong>
              {plan.totalAvailableHours} hrs
            </strong>
          </div>

          <div className="job-result-stat">
            <small>
              FEASIBILITY
            </small>

            <strong>
              {plan.feasibility?.status ||
                "Not available"}
            </strong>
          </div>

        </section>

        {/* FEASIBILITY */}

        <section className="job-result-card">

          <div className="job-result-heading">
            <span>01</span>

            <div>
              <small>
                FEASIBILITY
              </small>

              <h2>
                Is Your Plan Realistic?
              </h2>
            </div>
          </div>

          <div className="feasibility-layout">

            <div>
              <strong>
                {plan.feasibility?.status ||
                  "Not available"}
              </strong>

              <p>
                {plan.feasibility?.message ||
                  "No feasibility explanation available."}
              </p>
            </div>

            <div className="feasibility-score">
              <span>
                {plan.feasibility?.score || 0}
              </span>

              <small>
                SCORE
              </small>
            </div>

          </div>
        </section>

        {/* JOB REQUIREMENTS */}

        <section className="job-result-card">

          <div className="job-result-heading">
            <span>02</span>

            <div>
              <small>
                JOB ANALYSIS
              </small>

              <h2>
                Job Requirements
              </h2>
            </div>
          </div>

          <div className="job-result-list">
            {plan.jobRequirements?.map(
              (item, index) => (
                <div
                  className="job-result-list-item"
                  key={`${item.skill}-${index}`}
                >
                  <div>

                    <strong>
                      {item.skill}
                    </strong>

                    <p>
                      {item.reason}
                    </p>

                    <small>
                      Candidate status:{" "}
                      {item.candidateStatus}
                    </small>

                  </div>

                  <span
                    className={`priority-${item.priority
                      ?.toLowerCase()
                      .replace(
                        /\s+/g,
                        "-"
                      )}`}
                  >
                    {item.priority}
                  </span>
                </div>
              )
            )}
          </div>
        </section>

        {/* SKILL GAPS */}

        <section className="job-result-card">

          <div className="job-result-heading">
            <span>03</span>

            <div>
              <small>
                SKILL GAP
              </small>

              <h2>
                What You Need to Improve
              </h2>
            </div>
          </div>

          <div className="job-result-list">

            {plan.skillGaps?.map(
              (item, index) => (
                <div
                  className="job-result-list-item"
                  key={`${item.skill}-${index}`}
                >

                  <div>
                    <strong>
                      {item.skill}
                    </strong>

                    <p>
                      {item.action}
                    </p>

                    <small>
                      {item.currentStatus}
                      {" · "}
                      {item.estimatedHours} hrs
                    </small>
                  </div>

                  <span
                    className={`priority-${item.priority
                      ?.toLowerCase()
                      .replace(
                        /\s+/g,
                        "-"
                      )}`}
                  >
                    {item.priority}
                  </span>

                </div>
              )
            )}

          </div>
        </section>

        {/* MONTHLY PLAN */}

        <section className="job-result-card">

          <div className="job-result-heading">
            <span>04</span>

            <div>
              <small>
                ROADMAP
              </small>

              <h2>
                Monthly Preparation Plan
              </h2>
            </div>
          </div>

          <div className="job-month-grid">

            {plan.monthlyPlan?.map(
              (month) => (
                <article
                  className="job-month-card"
                  key={month.month}
                >
                  <span>
                    MONTH {month.month}
                  </span>

                  <h3>
                    {month.focus}
                  </h3>

                  <div className="job-month-section">
                    <small>
                      SKILLS
                    </small>

                    {month.skills?.map(
                      (
                        skill,
                        index
                      ) => (
                        <p
                          key={index}
                        >
                          • {skill}
                        </p>
                      )
                    )}
                  </div>

                  <div className="job-month-section">
                    <small>
                      OUTCOME
                    </small>

                    {month.outcomes?.map(
                      (
                        outcome,
                        index
                      ) => (
                        <p
                          key={index}
                        >
                          • {outcome}
                        </p>
                      )
                    )}
                  </div>
                </article>
              )
            )}

          </div>
        </section>

        {/* WEEKLY PLAN */}

        <section className="job-result-card">

          <div className="job-result-heading">
            <span>05</span>

            <div>
              <small>
                EXECUTION
              </small>

              <h2>
                Weekly Preparation Plan
              </h2>
            </div>
          </div>

          <div className="job-week-list">

            {plan.weeklyPlan?.map(
              (week) => (
                <div
                  className="job-week-item"
                  key={week.week}
                >

                  <strong>
                    Week {week.week}
                  </strong>

                  <div>
                    <h3>
                      {week.focus}
                    </h3>

                    {week.tasks?.map(
                      (
                        task,
                        index
                      ) => (
                        <p
                          key={index}
                        >
                          • {task}
                        </p>
                      )
                    )}
                  </div>

                  <span>
                    {week.estimatedHours} hrs
                  </span>

                </div>
              )
            )}

          </div>
        </section>

        {/* INTERVIEW */}

        <section className="job-result-card">

          <div className="job-result-heading">
            <span>06</span>

            <div>
              <small>
                INTERVIEW
              </small>

              <h2>
                Interview Preparation
              </h2>
            </div>
          </div>

          <ResultBulletList
            items={
              plan.interviewPreparation
            }
          />
        </section>

        {/* JOB PREPARATION */}

        <section className="job-result-card">

          <div className="job-result-heading">
            <span>07</span>

            <div>
              <small>
                APPLICATION
              </small>

              <h2>
                Job Preparation
              </h2>
            </div>
          </div>

          <ResultBulletList
            items={plan.jobPreparation}
          />
        </section>

        {/* PROJECTS */}

        <section className="job-result-card">

          <div className="job-result-heading">
            <span>08</span>

            <div>
              <small>
                PRACTICAL WORK
              </small>

              <h2>
                Recommended Projects
              </h2>
            </div>
          </div>

          <ResultBulletList
            items={
              plan.recommendedProjects
            }
          />
        </section>

        {/* FINAL CHECKLIST */}

        <section className="job-result-card">

          <div className="job-result-heading">
            <span>09</span>

            <div>
              <small>
                FINAL CHECK
              </small>

              <h2>
                Job-Ready Checklist
              </h2>
            </div>
          </div>

          <div className="job-checklist">

            {plan.finalChecklist?.map(
              (
                item,
                index
              ) => (
                <div
                  key={index}
                >
                  <span>✓</span>

                  <p>
                    {item}
                  </p>
                </div>
              )
            )}

          </div>
        </section>

      </div>
    </section>
  );
}


/*
 * =====================================================
 * REUSABLE BULLET LIST
 * =====================================================
 */

function ResultBulletList({
  items,
}: {
  items: string[];
}) {
  return (
    <div className="job-bullet-list">
      {items?.map(
        (item, index) => (
          <div key={index}>

            <span>
              {String(index + 1).padStart(
                2,
                "0"
              )}
            </span>

            <p>
              {item}
            </p>

          </div>
        )
      )}
    </div>
  );
}

export default JobPreparationPage;