import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import { apiUrl } from "../config";
import "../styles/InterviewPreparation.css";

interface ResumeAnalysisData {
  atsScore?: number | string;
  resumeStrength?: string;
  skills?: string[];
  missingSkills?: string[];
  weakAreas?: string[];
  suggestions?: string[];
  careerRecommendations?: string[];
  careerRoadmap?: {
    targetRole?: string;
    currentLevel?: string;
    estimatedTimeline?: string;
  };
}

interface InterviewRouteState {
  analysis?: ResumeAnalysisData | null;
  resumeText?: string;
}

interface InterviewFormData {
  jobTitle: string;
  jobDescription: string;
  experience: string;
  interviewType: string;
  skills: string;
}

interface PreparationRequirement {
  skill: string;
  priority: string;
  reason: string;
  candidateStatus: string;
}

interface PreparationSkillGap {
  skill: string;
  priority: string;
  currentStatus: string;
  action: string;
  estimatedHours: number;
}

interface InterviewPreparationAnalysis {
  analysisSource?: string;
  targetRole: string;
  roleSummary: string;
  requiredSkills: PreparationRequirement[];
  matchedSkills: PreparationRequirement[];
  skillGaps: PreparationSkillGap[];
  jobStrengths: string[];
  resumeStrengths: string[];
  weakAreas: string[];
  interviewFocusAreas: string[];
  jobResponsibilities: string[];
  recommendedTopics: string[];
  overallMatchPercentage: number;
}

interface InterviewOption {
  optionId: string;
  text: string;
}

interface InterviewQuestion {
  questionId: string;
  order: number;
  question: string;
  options: InterviewOption[];
  category?: string;
  topic?: string;
  difficulty?: string;
  marks?: number;
  sourceTags?: string[];
}

interface InterviewPerformance {
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  attempted: number;
  categoryWise: Array<{
    category: string;
    total: number;
    attempted: number;
    correct: number;
    incorrect: number;
    unanswered: number;
    obtainedMarks: number;
    totalMarks: number;
    percentage: number;
  }>;
  difficultyWise: Array<{
    difficulty: string;
    total: number;
    attempted: number;
    correct: number;
    incorrect: number;
    unanswered: number;
    obtainedMarks: number;
    totalMarks: number;
    percentage: number;
  }>;
  strengths: string[];
  weakAreas: string[];
  recommendations: string[];
}

interface InterviewReviewItem {
  questionId: string;
  order: number;
  question: string;
  options: InterviewOption[];
  selectedAnswer: string | null;
  selectedAnswerText: string | null;
  correctAnswer: string | null;
  correctAnswerText: string | null;
  explanation: string;
  category: string;
  topic: string;
  difficulty: string;
  marks: number;
  isAnswered: boolean;
  isCorrect: boolean;
  timeTakenSeconds: number;
}

interface InterviewFinalResult {
  performance: InterviewPerformance;
  review: InterviewReviewItem[];
}

const INTERVIEW_TOTAL_QUESTIONS = 100;

const InterviewPreparationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const routeState =
    (location.state || {}) as InterviewRouteState;

  let storedAnalysis: ResumeAnalysisData | null =
    null;

  try {
    const savedAnalysis =
      sessionStorage.getItem(
        "careerLaneResumeAnalysis"
      );

    if (savedAnalysis) {
      storedAnalysis =
        JSON.parse(savedAnalysis);
    }
  } catch (error) {
    console.error(
      "Failed to read stored resume analysis:",
      error
    );
  }

  const analysis =
    routeState.analysis ||
    storedAnalysis ||
    null;

  const resumeText =
    routeState.resumeText ||
    sessionStorage.getItem(
      "careerLaneResumeText"
    ) ||
    "";

  const detectedJobTitle =
    analysis?.careerRoadmap?.targetRole ||
    "";

  const detectedSkills =
    analysis?.skills?.join(", ") ||
    "";

  const [formData, setFormData] =
    useState<InterviewFormData>({
      jobTitle: detectedJobTitle,
      jobDescription: "",
      experience:
        analysis?.careerRoadmap?.currentLevel ||
        "Fresher",
      interviewType: "Technical + HR",
      skills: detectedSkills,
    });

  const [customExperience, setCustomExperience] =
    useState("");

  const [customInterviewType, setCustomInterviewType] =
    useState("");

  const [showResults, setShowResults] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState("overview");

  const [
    preparationAnalysis,
    setPreparationAnalysis,
  ] =
    useState<InterviewPreparationAnalysis | null>(
      null
    );

  const [attemptId, setAttemptId] =
    useState("");

  const [interviewStarted, setInterviewStarted] =
    useState(false);

  const [
    currentInterviewQuestion,
    setCurrentInterviewQuestion,
  ] =
    useState<InterviewQuestion | null>(
      null
    );

  const [
    interviewQuestionNumber,
    setInterviewQuestionNumber,
  ] =
    useState(0);

  const [
    interviewGeneratedCount,
    setInterviewGeneratedCount,
  ] =
    useState(0);

  const [
    interviewAnsweredCount,
    setInterviewAnsweredCount,
  ] =
    useState(0);

  const [
    selectedOptionId,
    setSelectedOptionId,
  ] =
    useState("");

  const [
    interviewStartLoading,
    setInterviewStartLoading,
  ] =
    useState(false);

  const [
    answerSubmitting,
    setAnswerSubmitting,
  ] =
    useState(false);

  const [
    finalInterviewSubmitting,
    setFinalInterviewSubmitting,
  ] =
    useState(false);

  const [
    questionStartedAt,
    setQuestionStartedAt,
  ] =
    useState<number | null>(null);

  const [
    finalInterviewResult,
    setFinalInterviewResult,
  ] =
    useState<InterviewFinalResult | null>(
      null
    );

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement |
        HTMLTextAreaElement |
        HTMLSelectElement
    >
  ) => {
    const {
      name,
      value,
    } = event.target;

    setErrorMessage("");

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleGenerate = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorMessage("");

    if (!formData.jobTitle.trim()) {
      setErrorMessage(
        "Please enter the target job title."
      );

      return;
    }

    if (
      !formData.jobDescription.trim()
    ) {
      setErrorMessage(
        "Please enter the job description."
      );

      return;
    }

    if (
      formData.jobDescription.length >
      15000
    ) {
      setErrorMessage(
        "Job description cannot exceed 15,000 characters."
      );

      return;
    }

    if (!resumeText.trim()) {
      setErrorMessage(
        "Your analyzed resume could not be found. Please go back to Resume Analysis and make sure your resume is loaded."
      );

      return;
    }

    if (
      formData.experience === "Custom" &&
      !customExperience.trim()
    ) {
      setErrorMessage(
        "Please enter your custom experience level."
      );

      return;
    }

    if (
      formData.interviewType === "Custom" &&
      !customInterviewType.trim()
    ) {
      setErrorMessage(
        "Please enter your custom interview type."
      );

      return;
    }

    const finalExperience =
      formData.experience === "Custom"
        ? customExperience.trim()
        : formData.experience.trim();

    const finalInterviewType =
      formData.interviewType === "Custom"
        ? customInterviewType.trim()
        : formData.interviewType.trim();

    const token =
      localStorage.getItem("token");

    if (!token) {
      setErrorMessage(
        "Please login before using Interview Preparation."
      );

      navigate("/login");

      return;
    }

    try {
      setLoading(true);

      setShowResults(false);

      setPreparationAnalysis(null);

      setAttemptId("");

      setInterviewStarted(false);

      setCurrentInterviewQuestion(null);

      setInterviewQuestionNumber(0);

      setInterviewGeneratedCount(0);

      setInterviewAnsweredCount(0);

      setSelectedOptionId("");

      setInterviewStartLoading(false);

      setAnswerSubmitting(false);

      setFinalInterviewSubmitting(false);

      setQuestionStartedAt(null);

      setFinalInterviewResult(null);

      const currentSkills =
        formData.skills
          .split(",")
          .map((skill) =>
            skill.trim()
          )
          .filter(Boolean);

      const payload = {
        jobTitle:
          formData.jobTitle.trim(),

        jobDescription:
          formData.jobDescription.trim(),

        experience:
          finalExperience,

        interviewType:
          finalInterviewType,

        skills:
          currentSkills,

        resumeText:
          resumeText.slice(
            0,
            12000
          ),

        analysis:
          analysis || null,
      };

      console.log(
        "Interview Preparation Analysis Request:",
        {
          jobTitle:
            payload.jobTitle,

          jobDescriptionLength:
            payload.jobDescription.length,

          experience:
            payload.experience,

          interviewType:
            payload.interviewType,

          skills:
            payload.skills,

          resumeCharacters:
            payload.resumeText.length,

          hasResumeAnalysis:
            Boolean(payload.analysis),
        }
      );

      const response =
        await fetch(
          apiUrl(
            "/api/resume/interview-preparation/analyze"
          ),
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify(
              payload
            ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Interview preparation analysis failed."
        );
      }

      if (
        !data?.preparationAnalysis
      ) {
        throw new Error(
          "The server did not return a valid interview preparation analysis."
        );
      }

      const generatedAttemptId =
        String(
          data.attemptId || ""
        );

      setAttemptId(
        generatedAttemptId
      );

      setPreparationAnalysis(
        data.preparationAnalysis
      );

      if (generatedAttemptId) {
        sessionStorage.setItem(
          "careerLaneInterviewAttemptId",
          generatedAttemptId
        );
      }

      sessionStorage.setItem(
        "careerLaneInterviewPreparationAnalysis",
        JSON.stringify(
          data.preparationAnalysis
        )
      );

      setShowResults(true);

      setActiveTab("overview");

      console.log(
        "Interview preparation analysis completed:",
        data
      );
    } catch (error) {
      console.error(
        "Interview preparation analysis error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to generate interview preparation analysis."
      );

      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      jobTitle: detectedJobTitle,
      jobDescription: "",
      experience:
        analysis?.careerRoadmap?.currentLevel ||
        "Fresher",
      interviewType: "Technical + HR",
      skills: detectedSkills,
    });

    setCustomExperience("");

    setCustomInterviewType("");

    setShowResults(false);

    setActiveTab("overview");

    setPreparationAnalysis(null);

    setAttemptId("");

    setErrorMessage("");

    setInterviewStarted(false);

    setCurrentInterviewQuestion(null);

    setInterviewQuestionNumber(0);

    setInterviewGeneratedCount(0);

    setInterviewAnsweredCount(0);

    setSelectedOptionId("");

    setInterviewStartLoading(false);

    setAnswerSubmitting(false);

    setFinalInterviewSubmitting(false);

    setQuestionStartedAt(null);

    setFinalInterviewResult(null);

    sessionStorage.removeItem(
      "careerLaneInterviewAttemptId"
    );

    sessionStorage.removeItem(
      "careerLaneInterviewPreparationAnalysis"
    );

    sessionStorage.removeItem(
      "careerLaneInterviewStarted"
    );

    sessionStorage.removeItem(
      "careerLaneInterviewFinalResult"
    );
  };

  const finalExperience =
    formData.experience === "Custom"
      ? customExperience
      : formData.experience;

  const finalInterviewType =
    formData.interviewType === "Custom"
      ? customInterviewType
      : formData.interviewType;

  const handleStartInterview = async () => {
    setErrorMessage("");

    if (!attemptId) {
      setErrorMessage(
        "Interview attempt could not be identified. Please generate the preparation analysis again."
      );

      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setErrorMessage(
        "Your login session has expired. Please login again."
      );

      navigate("/login");

      return;
    }

    try {
      setInterviewStartLoading(true);

      const response = await fetch(
        apiUrl(
          `/api/resume/interview-preparation/${attemptId}/start`
        ),
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to start the interview."
        );
      }

      const firstQuestion =
        data?.nextQuestion ||
        data?.firstQuestion ||
        data?.question ||
        null;

      if (!firstQuestion) {
        throw new Error(
          "Interview started, but the server did not return the first question."
        );
      }

      setInterviewStarted(true);

      setCurrentInterviewQuestion(
        firstQuestion
      );

      setInterviewQuestionNumber(
        Number(firstQuestion.order || 1)
      );

      setInterviewGeneratedCount(
        Number(
          data?.progress?.generated ??
            data?.generated ??
            1
        )
      );

      setInterviewAnsweredCount(
        Number(
          data?.progress?.attempted ??
            data?.answered ??
            0
        )
      );

      setSelectedOptionId("");

      setQuestionStartedAt(
        Date.now()
      );

      setFinalInterviewResult(null);

      setActiveTab("questions");

      sessionStorage.setItem(
        "careerLaneInterviewStarted",
        "true"
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "Start interview error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to start the interview."
      );
    } finally {
      setInterviewStartLoading(false);
    }
  };

  const handleSubmitInterviewAnswer = async () => {
    setErrorMessage("");

    if (!attemptId) {
      setErrorMessage(
        "Interview attempt is missing."
      );

      return;
    }

    if (!currentInterviewQuestion) {
      setErrorMessage(
        "Current interview question is not available."
      );

      return;
    }

    if (!selectedOptionId) {
      setErrorMessage(
        "Please select one option before continuing."
      );

      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setErrorMessage(
        "Your login session has expired. Please login again."
      );

      navigate("/login");

      return;
    }

    try {
      setAnswerSubmitting(true);

      const timeTakenSeconds =
        questionStartedAt
          ? Math.max(
              0,
              Math.floor(
                (Date.now() -
                  questionStartedAt) /
                  1000
              )
            )
          : 0;

      const response = await fetch(
        apiUrl(
          `/api/resume/interview-preparation/${attemptId}/answer`
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
            questionId:
              currentInterviewQuestion.questionId,

            optionId:
              selectedOptionId,

            timeTakenSeconds,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to save your answer."
        );
      }

      setInterviewAnsweredCount(
        Number(
          data?.progress?.attempted ??
            data?.attempted ??
            interviewAnsweredCount + 1
        )
      );

      setInterviewGeneratedCount(
        Number(
          data?.progress?.generated ??
            data?.generated ??
            interviewGeneratedCount
        )
      );

      const nextQuestion =
        data?.nextQuestion || null;

      if (nextQuestion) {
        setCurrentInterviewQuestion(
          nextQuestion
        );

        setInterviewQuestionNumber(
          Number(
            nextQuestion.order ||
              interviewQuestionNumber + 1
          )
        );

        setSelectedOptionId("");

        setQuestionStartedAt(
          Date.now()
        );

        return;
      }

      if (
        data?.interviewComplete ||
        Number(
          data?.progress?.attempted || 0
        ) >=
          INTERVIEW_TOTAL_QUESTIONS
      ) {
        setCurrentInterviewQuestion(null);

        setSelectedOptionId("");

        setQuestionStartedAt(null);

        return;
      }

      throw new Error(
        "Your answer was saved, but the next question is not ready yet. Please try again."
      );
    } catch (error) {
      console.error(
        "Interview answer error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save your answer."
      );
    } finally {
      setAnswerSubmitting(false);
    }
  };

  const handleSubmitInterview = async () => {
    setErrorMessage("");

    if (!attemptId) {
      setErrorMessage(
        "Interview attempt is missing."
      );

      return;
    }

    const attempted =
      Number(
        interviewAnsweredCount || 0
      );

    const unanswered =
      Math.max(
        0,
        INTERVIEW_TOTAL_QUESTIONS -
          attempted
      );

    if (
      attempted <
      INTERVIEW_TOTAL_QUESTIONS
    ) {
      const confirmed =
        window.confirm(
          `You have attempted ${attempted}/${INTERVIEW_TOTAL_QUESTIONS} questions.\n` +
            `${unanswered} question(s) will remain unanswered and receive 0 marks.\n` +
            "Are you sure you want to submit the interview now?"
        );

      if (!confirmed) {
        return;
      }
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      setErrorMessage(
        "Your login session has expired. Please login again."
      );

      navigate("/login");

      return;
    }

    try {
      setFinalInterviewSubmitting(true);

      const response =
        await fetch(
          apiUrl(
            `/api/resume/interview-preparation/${attemptId}/submit`
          ),
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to submit the interview."
        );
      }

      if (!data?.performance) {
        throw new Error(
          "Interview result was not returned by the server."
        );
      }

      const finalResult:
        InterviewFinalResult = {
        performance:
          data.performance,

        review:
          Array.isArray(data.review)
            ? data.review
            : [],
      };

      setFinalInterviewResult(
        finalResult
      );

      setInterviewStarted(false);

      setCurrentInterviewQuestion(
        null
      );

      setSelectedOptionId("");

      setQuestionStartedAt(null);

      setActiveTab("questions");

      sessionStorage.removeItem(
        "careerLaneInterviewStarted"
      );

      sessionStorage.setItem(
        "careerLaneInterviewFinalResult",
        JSON.stringify(
          finalResult
        )
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "Final interview submission error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit the interview."
      );
    } finally {
      setFinalInterviewSubmitting(false);
    }
  };

  const handleDownloadInterviewPdf =
    () => {
      if (!finalInterviewResult) {
        return;
      }

      const performance =
        finalInterviewResult.performance;

      const review =
        finalInterviewResult.review;

      const escapeHtml = (
        value: unknown
      ) =>
        String(value ?? "")
          .replace(
            /&/g,
            "&amp;"
          )
          .replace(
            /</g,
            "&lt;"
          )
          .replace(
            />/g,
            "&gt;"
          )
          .replace(
            /"/g,
            "&quot;"
          )
          .replace(
            /'/g,
            "&#039;"
          );

      const reviewHtml =
        review
          .map(
            (item, index) => `
          <div style="
            border:1px solid #ddd;
            padding:16px;
            margin-bottom:16px;
            border-radius:8px;
          ">
            <h3>Question ${
              index + 1
            }</h3>

            <p>
              <strong>${escapeHtml(
                item.question
              )}</strong>
            </p>

            <p>
              <strong>Your Answer:</strong>
              ${escapeHtml(
                item.selectedAnswerText ||
                  "Not answered"
              )}
            </p>

            <p>
              <strong>Correct Answer:</strong>
              ${escapeHtml(
                item.correctAnswerText ||
                  "Not available"
              )}
            </p>

            <p>
              <strong>Topic:</strong>
              ${escapeHtml(
                item.topic
              )}
            </p>

            <p>
              <strong>Difficulty:</strong>
              ${escapeHtml(
                item.difficulty
              )}
            </p>

            <p>
              <strong>Explanation:</strong>
              ${escapeHtml(
                item.explanation
              )}
            </p>
          </div>
        `
          )
          .join("");

      const categoryHtml =
        performance.categoryWise
          .map(
            (item) => `
            <tr>
              <td>${escapeHtml(
                item.category
              )}</td>

              <td>
                ${item.attempted}
              </td>

              <td>
                ${item.correct}
              </td>

              <td>
                ${item.incorrect}
              </td>

              <td>
                ${item.percentage}%
              </td>
            </tr>
          `
          )
          .join("");

      const difficultyHtml =
        performance.difficultyWise
          .map(
            (item) => `
            <tr>
              <td>${escapeHtml(
                item.difficulty
              )}</td>

              <td>
                ${item.attempted}
              </td>

              <td>
                ${item.correct}
              </td>

              <td>
                ${item.incorrect}
              </td>

              <td>
                ${item.percentage}%
              </td>
            </tr>
          `
          )
          .join("");

      const reportWindow =
        window.open(
          "",
          "_blank",
          "width=1000,height=800"
        );

      if (!reportWindow) {
        setErrorMessage(
          "Please allow pop-ups in your browser to generate the PDF report."
        );

        return;
      }

      reportWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>
            CareerLane Interview Report
          </title>

          <style>
            body {
              font-family:
                Arial,
                sans-serif;

              padding: 32px;

              color: #222;

              line-height: 1.5;
            }

            h1,
            h2,
            h3 {
              color: #123d3a;
            }

            .score {
              font-size: 42px;

              font-weight: 700;
            }

            .stats {
              display: grid;

              grid-template-columns:
                repeat(4, 1fr);

              gap: 12px;

              margin: 24px 0;
            }

            .stat {
              border:
                1px solid #ddd;

              padding: 14px;

              border-radius: 8px;
            }

            table {
              width: 100%;

              border-collapse:
                collapse;

              margin:
                16px 0 30px;
            }

            th,
            td {
              border:
                1px solid #ddd;

              padding: 8px;

              text-align:
                left;
            }

            th {
              background:
                #f4f4f4;
            }
          </style>
        </head>

        <body>
          <h1>
            CareerLane AI
          </h1>

          <h2>
            Interview Preparation Report
          </h2>

          <div class="score">
            ${
              performance.obtainedMarks
            }/100
          </div>

          <p>
            Overall Percentage:

            <strong>
              ${
                performance.percentage
              }%
            </strong>
          </p>

          <div class="stats">

            <div class="stat">
              <strong>
                Correct
              </strong>

              <br />

              ${
                performance.correct
              }
            </div>

            <div class="stat">
              <strong>
                Incorrect
              </strong>

              <br />

              ${
                performance.incorrect
              }
            </div>

            <div class="stat">
              <strong>
                Unanswered
              </strong>

              <br />

              ${
                performance.unanswered
              }
            </div>

            <div class="stat">
              <strong>
                Attempted
              </strong>

              <br />

              ${
                performance.attempted
              }
            </div>

          </div>

          <h2>
            Category Performance
          </h2>

          <table>
            <thead>
              <tr>
                <th>
                  Category
                </th>

                <th>
                  Attempted
                </th>

                <th>
                  Correct
                </th>

                <th>
                  Incorrect
                </th>

                <th>
                  Score
                </th>
              </tr>
            </thead>

            <tbody>
              ${
                categoryHtml
              }
            </tbody>
          </table>

          <h2>
            Difficulty Performance
          </h2>

          <table>
            <thead>
              <tr>
                <th>
                  Difficulty
                </th>

                <th>
                  Attempted
                </th>

                <th>
                  Correct
                </th>

                <th>
                  Incorrect
                </th>

                <th>
                  Score
                </th>
              </tr>
            </thead>

            <tbody>
              ${
                difficultyHtml
              }
            </tbody>
          </table>

          <h2>
            Strengths
          </h2>

          <ul>
            ${
              performance.strengths
                .map(
                  (item) =>
                    `<li>${escapeHtml(
                      item
                    )}</li>`
                )
                .join("") ||
              "<li>No major strengths detected.</li>"
            }
          </ul>

          <h2>
            Weak Areas
          </h2>

          <ul>
            ${
              performance.weakAreas
                .map(
                  (item) =>
                    `<li>${escapeHtml(
                      item
                    )}</li>`
                )
                .join("") ||
              "<li>No major weak areas detected.</li>"
            }
          </ul>

          <h2>
            Recommendations
          </h2>

          <ul>
            ${
              performance.recommendations
                .map(
                  (item) =>
                    `<li>${escapeHtml(
                      item
                    )}</li>`
                )
                .join("") ||
              "<li>No recommendations available.</li>"
            }
          </ul>

          <h2>
            Question-wise Review
          </h2>

          ${reviewHtml}
        </body>
      </html>
    `);

      reportWindow.document.close();

      reportWindow.focus();

      setTimeout(() => {
        reportWindow.print();
      }, 400);
    };

  const requiredSkills =
    Array.isArray(
      preparationAnalysis?.requiredSkills
    )
      ? preparationAnalysis.requiredSkills
      : [];

  const matchedSkills =
    Array.isArray(
      preparationAnalysis?.matchedSkills
    )
      ? preparationAnalysis.matchedSkills
      : [];

  const skillGaps =
    Array.isArray(
      preparationAnalysis?.skillGaps
    )
      ? preparationAnalysis.skillGaps
      : [];

  const jobStrengths =
    Array.isArray(
      preparationAnalysis?.jobStrengths
    )
      ? preparationAnalysis.jobStrengths
      : [];

  const resumeStrengths =
    Array.isArray(
      preparationAnalysis?.resumeStrengths
    )
      ? preparationAnalysis.resumeStrengths
      : [];

  const weakAreas =
    Array.isArray(
      preparationAnalysis?.weakAreas
    )
      ? preparationAnalysis.weakAreas
      : [];

  const interviewFocusAreas =
    Array.isArray(
      preparationAnalysis?.interviewFocusAreas
    )
      ? preparationAnalysis.interviewFocusAreas
      : [];

  const jobResponsibilities =
    Array.isArray(
      preparationAnalysis?.jobResponsibilities
    )
      ? preparationAnalysis.jobResponsibilities
      : [];

  const recommendedTopics =
    Array.isArray(
      preparationAnalysis?.recommendedTopics
    )
      ? preparationAnalysis.recommendedTopics
      : [];

  if (finalInterviewResult) {
    const performance =
      finalInterviewResult.performance;

    return (
      <div className="interview-page">

        <div className="interview-header">
          <div>
            <span className="interview-badge">
              INTERVIEW COMPLETED
            </span>

            <h1>
              Interview{" "}
              <span>Result</span>
            </h1>

            <p>
              Your final result is based on the answers
              saved during this interview attempt.
            </p>
          </div>
        </div>

        <div className="large-result-card">
          <div
            style={{
              textAlign:
                "center",
            }}
          >
            <div className="result-card-icon">
              🎯
            </div>

            <h3>
              Final Score
            </h3>

            <p
              style={{
                fontSize:
                  "46px",

                fontWeight:
                  700,

                margin:
                  "12px 0",
              }}
            >
              {
                performance.obtainedMarks
              }/100
            </p>

            <p>
              {
                performance.percentage
              }%
            </p>
          </div>
        </div>

        <div className="result-grid">

          <div className="result-card">
            <h3>
              Correct
            </h3>

            <p>
              {
                performance.correct
              }
            </p>
          </div>

          <div className="result-card">
            <h3>
              Incorrect
            </h3>

            <p>
              {
                performance.incorrect
              }
            </p>
          </div>

          <div className="result-card">
            <h3>
              Unanswered
            </h3>

            <p>
              {
                performance.unanswered
              }
            </p>
          </div>

          <div className="result-card">
            <h3>
              Attempted
            </h3>

            <p>
              {
                performance.attempted
              }/
              {
                INTERVIEW_TOTAL_QUESTIONS
              }
            </p>
          </div>

        </div>

        <div className="content-card">

          <h3>
            Category Performance
          </h3>

          {
            performance.categoryWise
              .length > 0 ? (
              <div className="preparation-list">

                {
                  performance.categoryWise.map(
                    (item) => (
                      <div
                        key={
                          item.category
                        }
                      >
                        <span>
                          {
                            item.percentage
                          }%
                        </span>

                        <p>
                          <strong>
                            {
                              item.category
                            }
                          </strong>

                          <br />

                          Correct:
                          {" "}
                          {
                            item.correct
                          }

                          {" | "}

                          Incorrect:
                          {" "}
                          {
                            item.incorrect
                          }

                          {" | "}

                          Attempted:
                          {" "}
                          {
                            item.attempted
                          }/
                          {
                            item.total
                          }
                        </p>
                      </div>
                    )
                  )
                }

              </div>
            ) : (
              <p>
                No category performance available.
              </p>
            )
          }

        </div>

        <div className="content-card">

          <h3>
            Difficulty Performance
          </h3>

          {
            performance.difficultyWise
              .length > 0 ? (
              <div className="preparation-list">

                {
                  performance.difficultyWise.map(
                    (item) => (
                      <div
                        key={
                          item.difficulty
                        }
                      >
                        <span>
                          {
                            item.percentage
                          }%
                        </span>

                        <p>
                          <strong>
                            {
                              item.difficulty
                            }
                          </strong>

                          <br />

                          Correct:
                          {" "}
                          {
                            item.correct
                          }

                          {" | "}

                          Incorrect:
                          {" "}
                          {
                            item.incorrect
                          }

                          {" | "}

                          Attempted:
                          {" "}
                          {
                            item.attempted
                          }/
                          {
                            item.total
                          }
                        </p>
                      </div>
                    )
                  )
                }

              </div>
            ) : (
              <p>
                No difficulty performance available.
              </p>
            )
          }

        </div>

        <div className="content-card">

          <h3>
            Strengths
          </h3>

          {
            performance.strengths.length >
            0 ? (
              <div className="preparation-list">

                {
                  performance.strengths.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={
                          `strength-${index}`
                        }
                      >
                        <span>
                          {
                            index + 1
                          }
                        </span>

                        <p>
                          {
                            item
                          }
                        </p>
                      </div>
                    )
                  )
                }

              </div>
            ) : (
              <p>
                No major strengths were detected
                in this attempt.
              </p>
            )
          }

        </div>

        <div className="content-card">

          <h3>
            Weak Areas
          </h3>

          {
            performance.weakAreas.length >
            0 ? (
              <div className="preparation-list">

                {
                  performance.weakAreas.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={
                          `weak-${index}`
                        }
                      >
                        <span>
                          {
                            index + 1
                          }
                        </span>

                        <p>
                          {
                            item
                          }
                        </p>
                      </div>
                    )
                  )
                }

              </div>
            ) : (
              <p>
                No major weak areas detected.
              </p>
            )
          }

        </div>

        <div className="content-card">

          <h3>
            Recommendations
          </h3>

          {
            performance.recommendations.length >
            0 ? (
              <div className="preparation-list">

                {
                  performance.recommendations.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={
                          `recommendation-${index}`
                        }
                      >
                        <span>
                          {
                            index + 1
                          }
                        </span>

                        <p>
                          {
                            item
                          }
                        </p>
                      </div>
                    )
                  )
                }

              </div>
            ) : (
              <p>
                No additional recommendations.
              </p>
            )
          }

        </div>

        <div className="content-card">

          <h3>
            Question-wise Review
          </h3>

          {
            finalInterviewResult.review.map(
              (item) => (
                <div
                  key={
                    item.questionId
                  }

                  style={{
                    border:
                      "1px solid #ddd",

                    borderRadius:
                      "10px",

                    padding:
                      "18px",

                    marginTop:
                      "16px",
                  }}
                >
                  <strong>
                    Question{" "}
                    {
                      item.order
                    }
                  </strong>

                  <h4
                    style={{
                      lineHeight:
                        "1.5",

                      marginTop:
                        "10px",
                    }}
                  >
                    {
                      item.question
                    }
                  </h4>

                  <p>
                    <strong>
                      Your Answer:
                    </strong>{" "}
                    {
                      item.selectedAnswerText ||
                      "Not answered"
                    }
                  </p>

                  <p>
                    <strong>
                      Correct Answer:
                    </strong>{" "}
                    {
                      item.correctAnswerText ||
                      "Not available"
                    }
                  </p>

                  <p>
                    <strong>
                      Topic:
                    </strong>{" "}
                    {
                      item.topic
                    }
                  </p>

                  <p>
                    <strong>
                      Difficulty:
                    </strong>{" "}
                    {
                      item.difficulty
                    }
                  </p>

                  <p>
                    <strong>
                      Explanation:
                    </strong>{" "}
                    {
                      item.explanation
                    }
                  </p>
                </div>
              )
            )
          }

        </div>

        {
          errorMessage && (
            <div
              className="resume-notice"
              style={{
                border:
                  "1px solid rgba(180, 70, 50, 0.3)",

                marginTop:
                  "20px",
              }}
            >
              <div className="notice-icon">
                ⚠️
              </div>

              <div>
                <strong>
                  Report Update
                </strong>

                <p>
                  {
                    errorMessage
                  }
                </p>
              </div>
            </div>
          )
        }

        <div
          className="form-actions"
          style={{
            display:
              "flex",

            gap:
              "12px",

            flexWrap:
              "wrap",
          }}
        >
          <button
            type="button"
            className="primary-button"
            onClick={
              handleDownloadInterviewPdf
            }
          >
            📄 Save Report as PDF
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setFinalInterviewResult(
                null
              );

              setActiveTab(
                "overview"
              );

              setErrorMessage(
                ""
              );
            }}
          >
            Back to Preparation
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={
              handleReset
            }
          >
            Start New Analysis
          </button>
        </div>

      </div>
    );
  }

  return (
    <div className="interview-page">
              <div
  style={{
    display: "flex",
    justifyContent: "flex-start",
    marginBottom: "20px",
  }}
>
  <button
    type="button"
    className="secondary-button"
    onClick={() =>
      navigate("/resume-analysis", {
        state: {
          analysis,
          resumeText,
        },
      })
    }
  >
    ← Back to Resume Analysis
  </button>
</div>

      <div className="interview-header">

        <div>

          <span className="interview-badge">
            AI POWERED
          </span>

          <h1>
            Interview Preparation
          </h1>

          <p>
            Prepare smarter for your next
            interview with a personalized
            preparation plan based on your
            resume and target job.
          </p>

        </div>

      </div>

      {!showResults ? (
        <div className="interview-card">


          <div className="card-heading">

            <div className="heading-icon">
              🎯
            </div>

            <div>

              <h2>
                Prepare for your target role
              </h2>

              <p>
                We've already loaded relevant
                information from your Resume
                Analysis.
              </p>

            </div>

          </div>

          {resumeText && (
            <div className="resume-notice">

              <div className="notice-icon">
                📄
              </div>

              <div>

                <strong>
                  Resume Analysis Connected
                </strong>

                <p>
                  Your exact analyzed resume has
                  been connected to Interview
                  Preparation. The fresh analysis
                  will compare this resume against
                  your current Job Description.
                </p>

              </div>

            </div>
          )}

          {!resumeText && (
            <div className="resume-notice">

              <div className="notice-icon">
                ⚠️
              </div>

              <div>

                <strong>
                  Resume Not Available
                </strong>

                <p>
                  The analyzed resume could not
                  be loaded. Please return to
                  Resume Analysis and make sure
                  your resume is available.
                </p>

              </div>

            </div>
          )}

          {errorMessage && (
            <div
              className="resume-notice"
              style={{
                border:
                  "1px solid rgba(180, 70, 50, 0.3)",
              }}
            >
              <div className="notice-icon">
                ⚠️
              </div>

              <div>

                <strong>
                  Unable to continue
                </strong>

                <p>
                  {
                    errorMessage
                  }
                </p>

              </div>

            </div>
          )}

          <form
            onSubmit={
              handleGenerate
            }
          >

            <div className="form-group">

              <label htmlFor="jobTitle">

                Target Job Title{" "}

                <span>
                  *
                </span>

              </label>

              <input
                type="text"
                id="jobTitle"
                name="jobTitle"
                value={
                  formData.jobTitle
                }
                onChange={
                  handleChange
                }
                placeholder="e.g. Full Stack Developer"
                maxLength={200}
              />

            </div>

            <div className="form-group">

              <label
                htmlFor="jobDescription"
              >

                Job Description{" "}

                <span>
                  *
                </span>

              </label>

              <textarea
                id="jobDescription"
                name="jobDescription"
                value={
                  formData.jobDescription
                }
                onChange={
                  handleChange
                }
                placeholder="Paste the complete job description here..."
                rows={8}
                maxLength={15000}
              />

              <div className="character-count">
                {
                  formData
                    .jobDescription
                    .length
                }
                /15000
              </div>

            </div>

            <div className="form-row">

              <div className="form-group">

                <label htmlFor="experience">
                  Experience Level
                </label>

                <select
                  id="experience"
                  name="experience"
                  value={
                    formData.experience
                  }
                  onChange={
                    handleChange
                  }
                >

                  <option
                    value="Fresher"
                  >
                    Fresher
                  </option>

                  <option
                    value="0-1 Years"
                  >
                    0–1 Years
                  </option>

                  <option
                    value="1-2 Years"
                  >
                    1–2 Years
                  </option>

                  <option
                    value="2-3 Years"
                  >
                    2–3 Years
                  </option>

                  <option
                    value="3+ Years"
                  >
                    3+ Years
                  </option>

                  <option
                    value="Custom"
                  >
                    Custom
                  </option>

                </select>

                {
                  formData.experience ===
                    "Custom" && (
                    <input
                      type="text"
                      value={
                        customExperience
                      }
                      onChange={(
                        event
                      ) =>
                        setCustomExperience(
                          event.target.value
                        )
                      }
                      placeholder="e.g. 4 years 6 months"
                      maxLength={100}
                      style={{
                        marginTop:
                          "10px",
                      }}
                    />
                  )
                }

              </div>

              <div className="form-group">

                <label htmlFor="interviewType">
                  Interview Type
                </label>

                <select
                  id="interviewType"
                  name="interviewType"
                  value={
                    formData.interviewType
                  }
                  onChange={
                    handleChange
                  }
                >

                  <option value="Technical">
                    Technical
                  </option>

                  <option value="HR">
                    HR
                  </option>

                  <option value="Technical + HR">
                    Technical + HR
                  </option>

                  <option value="Coding">
                    Coding
                  </option>

                  <option value="Managerial">
                    Managerial
                  </option>

                  <option value="Custom">
                    Custom
                  </option>

                </select>

                {
                  formData.interviewType ===
                    "Custom" && (
                    <input
                      type="text"
                      value={
                        customInterviewType
                      }
                      onChange={(
                        event
                      ) =>
                        setCustomInterviewType(
                          event.target.value
                        )
                      }
                      placeholder="e.g. System Design + Technical"
                      maxLength={150}
                      style={{
                        marginTop:
                          "10px",
                      }}
                    />
                  )
                }

              </div>

            </div>

            <div className="form-group">

              <label htmlFor="skills">
                Your Skills
              </label>

              <input
                type="text"
                id="skills"
                name="skills"
                value={
                  formData.skills
                }
                onChange={
                  handleChange
                }
                placeholder="e.g. JavaScript, React, Node.js, MongoDB"
                maxLength={1000}
              />

              <small>
                Skills detected from your
                resume can be edited here.
                These current skills are sent
                separately from the old Resume
                Analysis missing-skills list.
              </small>

            </div>

            {analysis && (
              <div className="resume-notice">

                <div className="notice-icon">
                  🧠
                </div>

                <div>

                  <strong>
                    Resume Analysis Available
                  </strong>

                  <p>
                    Your old Resume Analysis
                    findings remain separate.
                    Current Job-Specific Skill
                    Gaps will be calculated freshly
                    from the Job Description and
                    your current resume/skills.
                  </p>

                </div>

              </div>
            )}

            <div className="form-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={
                  handleReset
                }
                disabled={
                  loading
                }
              >
                Reset
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={
                  loading
                }
              >

                <span>
                  {
                    loading
                      ? "⏳"
                      : "✨"
                  }
                </span>

                {
                  loading
                    ? "Analyzing Job..."
                    : "Analyze Job & Resume"
                }

              </button>

            </div>

          </form>

        </div>
      ) : (
        <div className="preparation-results">

          <div className="result-top">

            <div>

              <span className="interview-badge">
                JOB ANALYSIS COMPLETE
              </span>

              <h2>
                {
                  formData.jobTitle
                }
              </h2>

              <p>
                Fresh analysis based on your
                current Job Description, current
                resume and current skills.
              </p>

            </div>

            <button
              className="secondary-button"
              onClick={
                handleReset
              }
            >
              ← Start Again
            </button>

          </div>

          {preparationAnalysis && (
            <div
              className="large-result-card"
              style={{
                textAlign:
                  "center",

                marginBottom:
                  "24px",
              }}
            >

              <div className="result-card-icon">
                🎯
              </div>

              <h3>
                Overall Job Match
              </h3>

              <p
                style={{
                  fontSize:
                    "42px",

                  fontWeight:
                    700,

                  margin:
                    "12px 0",
                }}
              >
                {
                  Number.isFinite(
                    Number(
                      preparationAnalysis
                        .overallMatchPercentage
                    )
                  )
                    ? Math.round(
                        Number(
                          preparationAnalysis
                            .overallMatchPercentage
                        )
                      )
                    : 0
                }%
              </p>

              <p>
                Current Job Description vs
                your current resume and skills.
              </p>

            </div>
          )}

          <div className="result-tabs">

            <button
              className={
                activeTab === "overview"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab(
                  "overview"
                )
              }
            >
              Overview
            </button>

            <button
              className={
                activeTab === "skills"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab(
                  "skills"
                )
              }
            >
              Skill Gaps
            </button>

            <button
              className={
                activeTab === "roadmap"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab(
                  "roadmap"
                )
              }
            >
              Preparation
            </button>

            <button
              className={
                activeTab === "questions"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab(
                  "questions"
                )
              }
            >
              Interview
            </button>

            <button
              className={
                activeTab === "checklist"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab(
                  "checklist"
                )
              }
            >
              Checklist
            </button>

          </div>

          {activeTab ===
            "overview" && (
            <div className="result-grid">

              <div className="result-card">

                <div className="result-card-icon">
                  🎯
                </div>

                <h3>
                  Target Role
                </h3>

                <p>
                  {
                    preparationAnalysis
                      ?.targetRole ||
                    formData.jobTitle
                  }
                </p>

              </div>

              <div className="result-card">

                <div className="result-card-icon">
                  💼
                </div>

                <h3>
                  Experience
                </h3>

                <p>
                  {
                    finalExperience ||
                    "Not specified"
                  }
                </p>

              </div>

              <div className="result-card">

                <div className="result-card-icon">
                  🧠
                </div>

                <h3>
                  Interview Type
                </h3>

                <p>
                  {
                    finalInterviewType ||
                    "Not specified"
                  }
                </p>

              </div>

              <div className="result-card">

                <div className="result-card-icon">
                  📄
                </div>

                <h3>
                  Resume Status
                </h3>

                <p>
                  {
                    resumeText
                      ? "Exact analyzed resume connected"
                      : "Not available"
                  }
                </p>

              </div>

              <div className="large-result-card">

                <h3>
                  Job Summary
                </h3>

                <p>
                  {
                    preparationAnalysis
                      ?.roleSummary ||
                    "No role summary was returned."
                  }
                </p>

              </div>

              <div className="large-result-card">

                <h3>
                  Job Strengths
                </h3>

                {
                  jobStrengths.length >
                  0 ? (
                    <div className="preparation-list">

                      {
                        jobStrengths.map(
                          (
                            item,
                            index
                          ) => (
                            <div
                              key={
                                `job-strength-${index}`
                              }
                            >

                              <span>
                                {
                                  index + 1
                                }
                              </span>

                              <p>
                                {
                                  item
                                }
                              </p>

                            </div>
                          )
                        )
                      }

                    </div>
                  ) : (
                    <p>
                      No specific job strengths
                      were returned.
                    </p>
                  )
                }

              </div>

              <div className="large-result-card">

                <h3>
                  Resume Strengths Relevant to This Job
                </h3>

                {
                  resumeStrengths.length >
                  0 ? (
                    <div className="preparation-list">

                      {
                        resumeStrengths.map(
                          (
                            item,
                            index
                          ) => (
                            <div
                              key={
                                `resume-strength-${index}`
                              }
                            >

                              <span>
                                {
                                  index + 1
                                }
                              </span>

                              <p>
                                {
                                  item
                                }
                              </p>

                            </div>
                          )
                        )
                      }

                    </div>
                  ) : (
                    <p>
                      No job-specific resume
                      strengths were returned.
                    </p>
                  )
                }

              </div>

              <div className="large-result-card">

                <h3>
                  Weak Areas
                </h3>

                {
                  weakAreas.length >
                  0 ? (
                    <div className="preparation-list">

                      {
                        weakAreas.map(
                          (
                            item,
                            index
                          ) => (
                            <div
                              key={
                                `weak-area-${index}`
                              }
                            >

                              <span>
                                {
                                  index + 1
                                }
                              </span>

                              <p>
                                {
                                  item
                                }
                              </p>

                            </div>
                          )
                        )
                      }

                    </div>
                  ) : (
                    <p>
                      No major weak areas were
                      identified for this job.
                    </p>
                  )
                }

              </div>

              <div className="large-result-card">

                <h3>
                  Interview Focus Areas
                </h3>

                {
                  interviewFocusAreas.length >
                  0 ? (
                    <div className="preparation-list">

                      {
                        interviewFocusAreas.map(
                          (
                            item,
                            index
                          ) => (
                            <div
                              key={
                                `focus-${index}`
                              }
                            >

                              <span>
                                {
                                  index + 1
                                }
                              </span>

                              <p>
                                {
                                  item
                                }
                              </p>

                            </div>
                          )
                        )
                      }

                    </div>
                  ) : (
                    <p>
                      No additional interview focus
                      areas were returned.
                    </p>
                  )
                }

              </div>

            </div>
          )}

          {activeTab ===
            "skills" && (
            <div className="content-card">

              <h3>
                Required Skills From Current Job Description
              </h3>

              <p className="content-description">
                These skills are taken from the
                current Job Description analyzed
                for this interview attempt.
              </p>

              {
                requiredSkills.length >
                0 ? (
                  <div className="preparation-list">

                    {
                      requiredSkills.map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={
                              `required-skill-${index}`
                            }
                          >

                            <span>
                              {
                                index + 1
                              }
                            </span>

                            <p>

                              <strong>
                                {
                                  item.skill
                                }
                              </strong>

                              {" — "}

                              {
                                item.candidateStatus
                              }

                            </p>

                          </div>
                        )
                      )
                    }

                  </div>
                ) : (
                  <p>
                    No required skills were
                    returned by the analysis.
                  </p>
                )
              }

              <h3
                style={{
                  marginTop:
                    "30px",
                }}
              >
                Matched Skills
              </h3>

              <p className="content-description">
                These current-JD skills were
                found to be supported by your
                current resume and/or current
                skills.
              </p>

              {
                matchedSkills.length >
                0 ? (
                  <div className="preparation-list">

                    {
                      matchedSkills.map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={
                              `matched-skill-${index}`
                            }
                          >

                            <span>
                              {
                                index + 1
                              }
                            </span>

                            <p>

                              <strong>
                                {
                                  item.skill
                                }
                              </strong>

                              {" — "}

                              {
                                item.candidateStatus
                              }

                            </p>

                          </div>
                        )
                      )
                    }

                  </div>
                ) : (
                  <p>
                    No matched skills were returned.
                  </p>
                )
              }

              <h3
                style={{
                  marginTop:
                    "30px",
                }}
              >
                Job-Specific Skill Gaps
              </h3>

              <p className="content-description">
                IMPORTANT: These are NOT the old
                Resume Analysis Missing Skills.
                They are freshly calculated for
                the current Job Description against
                the current resume and current skills.
              </p>

              {
                skillGaps.length >
                0 ? (
                  <div className="preparation-list">

                    {
                      skillGaps.map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={
                              `gap-${index}`
                            }

                            style={{
                              alignItems:
                                "flex-start",
                            }}
                          >

                            <span>
                              {
                                index + 1
                              }
                            </span>

                            <p>

                              <strong>
                                {
                                  item.skill
                                }
                              </strong>

                              <br />

                              <small>
                                Priority:{" "}
                                {
                                  item.priority ||
                                  "Not specified"
                                }
                              </small>

                              <br />

                              <small>
                                Current status:{" "}
                                {
                                  item.currentStatus ||
                                  "Not specified"
                                }
                              </small>

                              <br />

                              <small>
                                Action:{" "}
                                {
                                  item.action ||
                                  "No action provided."
                                }
                              </small>

                              <br />

                              <small>
                                Estimated learning time:{" "}
                                {
                                  Number.isFinite(
                                    Number(
                                      item.estimatedHours
                                    )
                                  )
                                    ? `${item.estimatedHours} hours`
                                    : "Not specified"
                                }
                              </small>

                            </p>

                          </div>
                        )
                      )
                    }

                  </div>
                ) : (
                  <div className="skill-placeholder">

                    <div>
                      ✅
                    </div>

                    <h4>
                      No job-specific skill gaps detected
                    </h4>

                    <p>
                      Your current resume and
                      current skills cover the
                      identified Job Description
                      requirements reasonably well.
                    </p>

                  </div>
                )
              }

              <h3
                style={{
                  marginTop:
                    "30px",
                }}
              >
                Resume Analysis Missing Skills
              </h3>

              <p className="content-description">
                These are the general missing
                skills from the original Resume
                Analysis. They are intentionally
                kept separate and are NOT treated
                as the current Job-Specific Skill
                Gaps.
              </p>

              {
                analysis?.missingSkills &&
                analysis.missingSkills.length >
                  0 ? (
                  <div className="preparation-list">

                    {
                      analysis.missingSkills.map(
                        (
                          skill,
                          index
                        ) => (
                          <div
                            key={
                              `resume-missing-${index}`
                            }
                          >

                            <span>
                              {
                                index + 1
                              }
                            </span>

                            <p>
                              {
                                skill
                              }
                            </p>

                          </div>
                        )
                      )
                    }

                  </div>
                ) : (
                  <div className="skill-placeholder">

                    <div>
                      ✅
                    </div>

                    <h4>
                      No general resume missing skills
                    </h4>

                    <p>
                      The original Resume Analysis
                      did not report any general
                      missing skills.
                    </p>

                  </div>
                )
              }

            </div>
          )}

          {activeTab ===
            "roadmap" && (
            <div className="content-card">

              <h3>
                Job Responsibilities
              </h3>

              <p className="content-description">
                Responsibilities extracted from
                the current Job Description.
              </p>

              {
                jobResponsibilities.length >
                0 ? (
                  <div className="preparation-list">

                    {
                      jobResponsibilities.map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={
                              `responsibility-${index}`
                            }
                          >

                            <span>
                              {
                                index + 1
                              }
                            </span>

                            <p>
                              {
                                item
                              }
                            </p>

                          </div>
                        )
                      )
                    }

                  </div>
                ) : (
                  <p>
                    No specific responsibilities
                    were returned.
                  </p>
                )
              }

              <h3
                style={{
                  marginTop:
                    "30px",
                }}
              >
                Recommended Topics
              </h3>

              <p className="content-description">
                Topics recommended specifically
                for this current role and
                interview preparation.
              </p>

              {
                recommendedTopics.length >
                0 ? (
                  <div className="preparation-list">

                    {
                      recommendedTopics.map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={
                              `topic-${index}`
                            }
                          >

                            <span>
                              {
                                index + 1
                              }
                            </span>

                            <p>
                              {
                                item
                              }
                            </p>

                          </div>
                        )
                      )
                    }

                  </div>
                ) : (
                  <p>
                    No recommended topics were
                    returned.
                  </p>
                )
              }

              <h3
                style={{
                  marginTop:
                    "30px",
                }}
              >
                Interview Focus Areas
              </h3>

              {
                interviewFocusAreas.length >
                0 ? (
                  <div className="roadmap">

                    {
                      interviewFocusAreas.map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            className="roadmap-item"
                            key={
                              `roadmap-${index}`
                            }
                          >

                            <div className="roadmap-number">
                              {
                                index + 1
                              }
                            </div>

                            <div>

                              <h4>
                                Focus Area{" "}
                                {
                                  index + 1
                                }
                              </h4>

                              <p>
                                {
                                  item
                                }
                              </p>

                            </div>

                          </div>
                        )
                      )
                    }

                  </div>
                ) : (
                  <p>
                    No additional interview focus
                    areas were returned.
                  </p>
                )
              }

            </div>
          )}

          {activeTab ===
            "questions" && (
            <div className="content-card">

              <h3>
                Interview
              </h3>

              {!attemptId ? (

                <div className="skill-placeholder">

                  <div>
                    ⚠️
                  </div>

                  <h4>
                    Interview attempt not ready
                  </h4>

                  <p>
                    Please generate the preparation
                    analysis again before starting
                    your interview.
                  </p>

                </div>

              ) : !interviewStarted ? (

                <>
                  <p className="content-description">
                    Your preparation analysis is complete.
                    AI questions will start only after you
                    explicitly click START INTERVIEW.
                  </p>

                  <div
                    className="resume-notice"
                    style={{
                      marginTop:
                        "20px",
                    }}
                  >

                    <div className="notice-icon">
                      🎯
                    </div>

                    <div>

                      <strong>
                        Ready to Start
                      </strong>

                      <p>
                        Target Role:{" "}
                        {
                          formData.jobTitle
                        }

                        <br />

                        Job-Specific Skill Gaps:{" "}
                        {
                          skillGaps.length
                        }

                        <br />

                        Total Questions: 100

                        <br />

                        Marks: 1 mark per question

                        <br />

                        Total Marks: 100
                      </p>

                    </div>

                  </div>

                  <div
                    className="form-actions"
                    style={{
                      marginTop:
                        "24px",
                    }}
                  >

                    <button
                      type="button"
                      className="primary-button"
                      onClick={
                        handleStartInterview
                      }
                      disabled={
                        interviewStartLoading
                      }
                    >

                      <span>
                        {
                          interviewStartLoading
                            ? "⏳"
                            : "▶"
                        }
                      </span>

                      {
                        interviewStartLoading
                          ? "Starting Interview..."
                          : "START INTERVIEW"
                      }

                    </button>

                  </div>

                </>

              ) : currentInterviewQuestion ? (

                <>

                  <div
                    className="resume-notice"
                    style={{
                      marginBottom:
                        "24px",
                    }}
                  >

                    <div className="notice-icon">
                      📝
                    </div>

                    <div>

                      <strong>
                        Question{" "}
                        {
                          interviewQuestionNumber
                        }
                        /100
                      </strong>

                      <p>
                        Answered:{" "}
                        {
                          interviewAnsweredCount
                        }
                        /100

                        <br />

                        Generated:{" "}
                        {
                          interviewGeneratedCount
                        }
                        /100

                        <br />

                        1 mark per question
                      </p>

                    </div>

                  </div>

                  <div
                    className="large-result-card"
                    style={{
                      marginBottom:
                        "24px",
                    }}
                  >

                    <div
                      style={{
                        display:
                          "flex",

                        justifyContent:
                          "space-between",

                        gap:
                          "12px",

                        flexWrap:
                          "wrap",

                        marginBottom:
                          "16px",
                      }}
                    >

                      <span>
                        Question{" "}
                        {
                          interviewQuestionNumber
                        }
                        /100
                      </span>

                      <span>
                        {
                          currentInterviewQuestion.difficulty ||
                          "Medium"
                        }
                      </span>

                    </div>

                    <h3
                      style={{
                        fontSize:
                          "24px",

                        lineHeight:
                          "1.5",
                      }}
                    >
                      {
                        currentInterviewQuestion.question
                      }
                    </h3>

                    <div
                      style={{
                        marginTop:
                          "20px",

                        display:
                          "grid",

                        gap:
                          "12px",
                      }}
                    >

                      {
                        currentInterviewQuestion.options.map(
                          (
                            option
                          ) => (
                            <button
                              key={
                                option.optionId
                              }

                              type="button"

                              onClick={() =>
                                setSelectedOptionId(
                                  option.optionId
                                )
                              }

                              style={{
                                width:
                                  "100%",

                                textAlign:
                                  "left",

                                padding:
                                  "16px",

                                borderRadius:
                                  "10px",

                                border:
                                  selectedOptionId ===
                                  option.optionId
                                    ? "2px solid #147a72"
                                    : "1px solid #d8d8d8",

                                background:
                                  selectedOptionId ===
                                  option.optionId
                                    ? "#eef8f6"
                                    : "#ffffff",

                                cursor:
                                  "pointer",

                                display:
                                  "flex",

                                gap:
                                  "14px",

                                alignItems:
                                  "flex-start",
                              }}
                            >

                              <strong>
                                {
                                  option.optionId
                                }
                              </strong>

                              <span>
                                {
                                  option.text
                                }
                              </span>

                            </button>
                          )
                        )
                      }

                    </div>

                  </div>

                  <div
                    className="form-actions"
                    style={{
                      display:
                        "flex",

                      justifyContent:
                        "space-between",

                      gap:
                        "12px",

                      flexWrap:
                        "wrap",
                    }}
                  >

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={
                        handleSubmitInterview
                      }
                      disabled={
                        finalInterviewSubmitting ||
                        answerSubmitting
                      }
                    >
                      SUBMIT INTERVIEW
                    </button>

                    <button
                      type="button"
                      className="primary-button"
                      onClick={
                        handleSubmitInterviewAnswer
                      }
                      disabled={
                        answerSubmitting ||
                        finalInterviewSubmitting ||
                        !selectedOptionId
                      }
                    >

                      <span>
                        {
                          answerSubmitting
                            ? "⏳"
                            : "→"
                        }
                      </span>

                      {
                        answerSubmitting
                          ? "Saving Answer..."
                          : "SUBMIT ANSWER & CONTINUE"
                      }

                    </button>

                  </div>

                  <div
                    className="question-item"
                    style={{
                      marginTop:
                        "20px",
                    }}
                  >

                    <span>
                      NO INSTANT FEEDBACK
                    </span>

                    <p>
                      Your answer is saved securely.
                      Correct answer, explanation and
                      score remain hidden until the final
                      interview submission.
                    </p>

                  </div>

                </>

              ) : (

                <>

                  <div className="skill-placeholder">

                    <div>
                      ✅
                    </div>

                    <h4>
                      All 100 Questions Answered
                    </h4>

                    <p>
                      Your answers have been saved.
                      Click SUBMIT INTERVIEW to see
                      your final score and detailed
                      report.
                    </p>

                  </div>

                  <div
                    className="form-actions"
                    style={{
                      marginTop:
                        "24px",
                    }}
                  >

                    <button
                      type="button"
                      className="primary-button"
                      onClick={
                        handleSubmitInterview
                      }
                      disabled={
                        finalInterviewSubmitting
                      }
                    >
                      {
                        finalInterviewSubmitting
                          ? "Submitting..."
                          : "SUBMIT INTERVIEW →"
                      }
                    </button>

                  </div>

                </>

              )}

              {errorMessage && (
                <div
                  className="resume-notice"
                  style={{
                    marginTop:
                      "20px",

                    border:
                      "1px solid rgba(180, 70, 50, 0.3)",
                  }}
                >

                  <div className="notice-icon">
                    ⚠️
                  </div>

                  <div>

                    <strong>
                      Interview Update
                    </strong>

                    <p>
                      {
                        errorMessage
                      }
                    </p>

                  </div>

                </div>
              )}

            </div>
          )}

          {activeTab ===
            "checklist" && (
            <div className="content-card">

              <h3>
                Final Interview Checklist
              </h3>

              <div className="checklist">

                <label>

                  <input
                    type="checkbox"
                  />

                  <span>
                    Review the current Job
                    Description carefully
                  </span>

                </label>

                <label>

                  <input
                    type="checkbox"
                  />

                  <span>
                    Revise the Job-Specific
                    Skill Gaps
                  </span>

                </label>

                <label>

                  <input
                    type="checkbox"
                  />

                  <span>
                    Review recommended
                    interview topics
                  </span>

                </label>

                <label>

                  <input
                    type="checkbox"
                  />

                  <span>
                    Prepare explanations for
                    relevant resume projects
                  </span>

                </label>

                <label>

                  <input
                    type="checkbox"
                  />

                  <span>
                    Practice role-specific
                    interview questions
                  </span>

                </label>

                <label>

                  <input
                    type="checkbox"
                  />

                  <span>
                    Complete the AI mock
                    interview
                  </span>

                </label>

              </div>

              {attemptId && (
                <div
                  className="form-actions"
                  style={{
                    marginTop:
                      "24px",
                  }}
                >

                  <button
                    type="button"
                    className="primary-button"
                    onClick={
                      handleStartInterview
                    }
                  >

                    <span>
                      ▶
                    </span>

                    START INTERVIEW

                  </button>

                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default InterviewPreparationPage;