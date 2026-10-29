const mongoose = require("mongoose");

/*
 * =====================================================
 * REUSABLE SUB-SCHEMAS
 * =====================================================
 */

const interviewOptionSchema = new mongoose.Schema(
  {
    optionId: {
      type: String,
      required: true,
      trim: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const preparationRequirementSchema =
  new mongoose.Schema(
    {
      skill: {
        type: String,
        required: true,
        trim: true,
      },

      priority: {
        type: String,
        enum: [
          "HIGH",
          "MEDIUM",
          "LOW",
        ],
        default: "MEDIUM",
      },

      reason: {
        type: String,
        default: "",
        trim: true,
      },

      candidateStatus: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      _id: false,
    }
  );

const preparationSkillGapSchema =
  new mongoose.Schema(
    {
      skill: {
        type: String,
        required: true,
        trim: true,
      },

      priority: {
        type: String,
        enum: [
          "HIGH",
          "MEDIUM",
          "LOW",
        ],
        default: "MEDIUM",
      },

      currentStatus: {
        type: String,
        default: "",
        trim: true,
      },

      action: {
        type: String,
        default: "",
        trim: true,
      },

      estimatedHours: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    {
      _id: false,
    }
  );

const interviewQuestionSchema =
  new mongoose.Schema(
    {
      questionId: {
        type: String,
        required: true,
        trim: true,
      },

      order: {
        type: Number,
        required: true,
        min: 1,
      },

      question: {
        type: String,
        required: true,
        trim: true,
      },

      options: {
        type: [interviewOptionSchema],
        required: true,

        validate: {
          validator: function (value) {
            return (
              Array.isArray(value) &&
              value.length === 4
            );
          },

          message:
            "Each interview question must contain exactly 4 options.",
        },
      },

      correctOptionId: {
        type: String,
        required: true,
        trim: true,
      },

      explanation: {
        type: String,
        required: true,
        trim: true,
      },

      category: {
        type: String,
        required: true,
        trim: true,
      },

      topic: {
        type: String,
        required: true,
        trim: true,
      },

      difficulty: {
        type: String,
        enum: [
          "EASY",
          "MEDIUM",
          "HARD",
        ],
        default: "MEDIUM",
      },

      marks: {
        type: Number,
        default: 1,
        min: 0,
      },

      sourceTags: {
        type: [String],
        default: [],
      },

      questionHash: {
        type: String,
        required: true,
        trim: true,
      },

      userAnswer: {
        type: String,
        default: null,
        trim: true,
      },

      isAnswered: {
        type: Boolean,
        default: false,
      },

      isCorrect: {
        type: Boolean,
        default: null,
      },

      answeredAt: {
        type: Date,
        default: null,
      },

      timeTakenSeconds: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    {
      _id: false,
    }
  );

const categoryPerformanceSchema =
  new mongoose.Schema(
    {
      category: {
        type: String,
        required: true,
        trim: true,
      },

      total: {
        type: Number,
        default: 0,
        min: 0,
      },

      answered: {
        type: Number,
        default: 0,
        min: 0,
      },

      correct: {
        type: Number,
        default: 0,
        min: 0,
      },

      incorrect: {
        type: Number,
        default: 0,
        min: 0,
      },

      score: {
        type: Number,
        default: 0,
        min: 0,
      },

      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
    {
      _id: false,
    }
  );

const difficultyPerformanceSchema =
  new mongoose.Schema(
    {
      difficulty: {
        type: String,
        enum: [
          "EASY",
          "MEDIUM",
          "HARD",
        ],
        required: true,
      },

      total: {
        type: Number,
        default: 0,
        min: 0,
      },

      answered: {
        type: Number,
        default: 0,
        min: 0,
      },

      correct: {
        type: Number,
        default: 0,
        min: 0,
      },

      incorrect: {
        type: Number,
        default: 0,
        min: 0,
      },

      score: {
        type: Number,
        default: 0,
        min: 0,
      },

      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
    {
      _id: false,
    }
  );

const performanceSchema =
  new mongoose.Schema(
    {
      totalMarks: {
        type: Number,
        default: 0,
        min: 0,
      },

      obtainedMarks: {
        type: Number,
        default: 0,
        min: 0,
      },

      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      correctAnswers: {
        type: Number,
        default: 0,
        min: 0,
      },

      incorrectAnswers: {
        type: Number,
        default: 0,
        min: 0,
      },

      unansweredQuestions: {
        type: Number,
        default: 0,
        min: 0,
      },

      attemptedQuestions: {
        type: Number,
        default: 0,
        min: 0,
      },

      categoryWise: {
        type: [categoryPerformanceSchema],
        default: [],
      },

      difficultyWise: {
        type: [difficultyPerformanceSchema],
        default: [],
      },

      strengths: {
        type: [String],
        default: [],
      },

      weakAreas: {
        type: [String],
        default: [],
      },

      recommendations: {
        type: [String],
        default: [],
      },
    },
    {
      _id: false,
    }
  );

/*
 * IMPORTANT:
 * This is a FRESH analysis for the CURRENT job.
 *
 * It must be calculated from:
 * CURRENT JOB DESCRIPTION
 * + CURRENT RESUME
 * + CURRENT USER INPUT
 *
 * It must NOT simply copy old Resume Analysis
 * missingSkills / weakAreas.
 */

const preparationAnalysisSchema =
  new mongoose.Schema(
    {
      analysisSource: {
        type: String,
        default:
          "CURRENT_JOB_DESCRIPTION_AND_CURRENT_RESUME",
        trim: true,
      },

      targetRole: {
        type: String,
        default: "",
        trim: true,
      },

      roleSummary: {
        type: String,
        default: "",
        trim: true,
      },

      requiredSkills: {
        type: [preparationRequirementSchema],
        default: [],
      },

      matchedSkills: {
        type: [String],
        default: [],
      },

      skillGaps: {
        type: [preparationSkillGapSchema],
        default: [],
      },

      jobStrengths: {
        type: [String],
        default: [],
      },

      resumeStrengths: {
        type: [String],
        default: [],
      },

      weakAreas: {
        type: [String],
        default: [],
      },

      interviewFocusAreas: {
        type: [String],
        default: [],
      },

      jobResponsibilities: {
        type: [String],
        default: [],
      },

      recommendedTopics: {
        type: [String],
        default: [],
      },

      overallMatchPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
    {
      _id: false,
    }
  );

/*
 * =====================================================
 * MAIN INTERVIEW ATTEMPT
 * =====================================================
 */

const interviewAttemptSchema =
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      jobTitle: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },

      jobDescription: {
        type: String,
        required: true,
        trim: true,
        maxlength: 15000,
      },

      jobDescriptionHash: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      experience: {
        type: String,
        required: true,
        trim: true,
      },

      interviewType: {
        type: String,
        required: true,
        trim: true,
      },

      skills: {
        type: [String],
        default: [],
      },

      /*
       * Resume snapshot used for THIS attempt.
       */

      resumeText: {
        type: String,
        required: true,
      },

      resumeHash: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      /*
       * Previous resume analysis can be stored as
       * reference/snapshot data, but current
       * preparationAnalysis remains the source of
       * truth for THIS job.
       */

      resumeAnalysisSnapshot: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },

      preparationAnalysis: {
        type: preparationAnalysisSchema,
        default: null,
      },

      /*
       * Interview configuration
       */

      totalQuestionsTarget: {
        type: Number,
        default: 100,
        min: 1,
      },

      marksPerQuestion: {
        type: Number,
        default: 1,
        min: 0,
      },

      totalMarksTarget: {
        type: Number,
        default: 100,
        min: 1,
      },

      /*
       * Attempt state
       */

      status: {
        type: String,
        enum: [
          "ANALYZING",
          "READY",
          "IN_PROGRESS",
          "COMPLETED",
          "ABANDONED",
        ],
        default: "ANALYZING",
        index: true,
      },

      currentQuestionNumber: {
        type: Number,
        default: 0,
        min: 0,
      },

      generatedQuestionCount: {
        type: Number,
        default: 0,
        min: 0,
      },

      answeredQuestionCount: {
        type: Number,
        default: 0,
        min: 0,
      },

      skippedQuestionCount: {
        type: Number,
        default: 0,
        min: 0,
      },

      /*
       * Internal live score.
       *
       * This will NOT be sent to the frontend
       * after every question.
       */

      correctAnswerCount: {
        type: Number,
        default: 0,
        min: 0,
      },

      incorrectAnswerCount: {
        type: Number,
        default: 0,
        min: 0,
      },

      currentScore: {
        type: Number,
        default: 0,
        min: 0,
      },

      /*
       * Questions generated so far.
       *
       * We intentionally do NOT generate all
       * 100 questions upfront.
       */

      questions: {
        type: [interviewQuestionSchema],
        default: [],
      },

      usedQuestionHashes: {
        type: [String],
        default: [],
      },

      /*
       * Small ready queue.
       *
       * The server will keep only a few upcoming
       * questions ready so the next question can
       * appear immediately.
       */

      readyQuestionNumbers: {
        type: [Number],
        default: [],
      },

      queueSizeTarget: {
        type: Number,
        default: 3,
        min: 1,
        max: 10,
      },

      performance: {
        type: performanceSchema,
        default: () => ({}),
      },

      /*
       * Timing
       */

      startedAt: {
        type: Date,
        default: null,
      },

      submittedAt: {
        type: Date,
        default: null,
      },

      completedAt: {
        type: Date,
        default: null,
      },

      totalTimeTakenSeconds: {
        type: Number,
        default: 0,
        min: 0,
      },

      /*
       * Download/report metadata
       */

      reportGeneratedAt: {
        type: Date,
        default: null,
      },

      reportFileName: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      timestamps: true,
      minimize: false,
    }
  );

/*
 * =====================================================
 * INDEXES
 * =====================================================
 */

interviewAttemptSchema.index({
  userId: 1,
  createdAt: -1,
});

interviewAttemptSchema.index({
  userId: 1,
  jobDescriptionHash: 1,
  resumeHash: 1,
  jobTitle: 1,
});

interviewAttemptSchema.index({
  userId: 1,
  status: 1,
});

/*
 * =====================================================
 * MODEL
 * =====================================================
 */

const InterviewAttempt =
  mongoose.model(
    "InterviewAttempt",
    interviewAttemptSchema
  );

module.exports = InterviewAttempt;