const express = require("express");
const multer = require("multer");
const protect = require("../middleware/authMiddleware");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const mammoth = require("mammoth");
const WordExtractor = require("word-extractor");
const { PDFParse } = require("pdf-parse");
const InterviewAttempt = require("../models/InterviewAttempt");
const {
  analyzeResume,
  analyzeInterviewPreparation,
  generateCareerRoadmap,
  generateStandardCareerRoadmap,
  generateJobPreparationPlan,
  generateInterviewQuestionBatch,
} = require("../services/geminiService");

const router = express.Router();

// =====================================================
// UPLOAD CONFIGURATION
// =====================================================

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// =====================================================
// ORIGINAL RESUME STORAGE
// =====================================================

// Make sure uploads folder exists
const uploadsDir = path.resolve("uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// =====================================================
// UPLOAD RESUME
// PDF + DOC + DOCX
// =====================================================

router.post(
  "/upload",
  protect,
  upload.single("resume"),
  async (req, res) => {
    try {
      // ==========================
      // Check File
      // ==========================

      if (!req.file) {
        return res.status(400).json({
          message: "Please upload a resume",
        });
      }

      // ==========================
      // Read Uploaded File
      // ==========================

      const fileBuffer = fs.readFileSync(req.file.path);

      let extractedText = "";

      // =================================================
      // PDF
      // =================================================

      if (req.file.mimetype === "application/pdf") {
        console.log("Extracting text from PDF...");

        const parser = new PDFParse({
          data: fileBuffer,
        });

        const pdfData = await parser.getText();

        extractedText = pdfData.text || "";

        await parser.destroy();
      }

      // =================================================
      // DOCX
      // =================================================

      else if (
        req.file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        console.log("Extracting text from DOCX...");

        const result = await mammoth.extractRawText({
          buffer: fileBuffer,
        });

        extractedText = result.value || "";

        if (result.messages && result.messages.length) {
          console.log("DOCX extraction messages:", result.messages);
        }
      }

      // =================================================
      // DOC
      // =================================================

      else if (req.file.mimetype === "application/msword") {
        console.log("Extracting text from DOC...");

        const extractor = new WordExtractor();

        const document = await extractor.extract(req.file.path);

        extractedText = document.getBody() || "";
      }

      // =================================================
      // UNSUPPORTED FILE
      // =================================================

      else {
        // Delete unsupported uploaded file
        try {
          fs.unlinkSync(req.file.path);
        } catch (deleteError) {
          console.error(
            "Failed to delete unsupported file:",
            deleteError.message
          );
        }

        return res.status(400).json({
          message:
            "Unsupported file type. Please upload PDF, DOC or DOCX.",
        });
      }

      // =================================================
      // Clean Extracted Text
      // =================================================

      extractedText = extractedText
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      console.log("Resume text extracted successfully.");

      console.log("File type:", req.file.mimetype);

      console.log(
        "Extracted characters:",
        extractedText.length
      );

      // =================================================
      // Check Extracted Text
      // =================================================

      if (!extractedText) {
        // Keep file for debugging/recovery only if extraction
        // failed. It can be manually cleaned later.
        return res.status(400).json({
          message:
            "Could not extract text from the resume. Please make sure the document contains selectable text.",
        });
      }

      // =================================================
      // Analyze Resume with Gemini + Groq Fallback
      // =================================================

      console.log("Analyzing resume with Gemini...");

      // Limit very large resumes before sending to AI
      // Keep the AI payload focused for faster analysis while
      // preserving the full extracted text for editing/preview.
      const optimizedResume =
        extractedText.length > 10000
          ? extractedText.slice(0, 10000)
          : extractedText;

      console.log(
        "Characters sent to Gemini:",
        optimizedResume.length
      );

      console.time("AI Resume Analysis");

      const analysis = await analyzeResume(
        optimizedResume
      );

      console.timeEnd("AI Resume Analysis");

      console.log(
        "AI Resume Analysis completed successfully."
      );

      // =================================================
      // IMPORTANT:
      // DO NOT DELETE ORIGINAL RESUME FILE
      // =================================================
      //
      // The original uploaded file is intentionally kept
      // inside /uploads so Edit Resume can later access
      // the original document.
      //
      // Existing code deleted req.file.path here.
      // That deletion has been removed.
      // =================================================

      console.log(
        "Original resume preserved:",
        req.file.filename
      );

      // =================================================
      // Original File URL
      // =================================================

      const originalFileUrl =
        `/api/resume/original/${encodeURIComponent(
          req.file.filename
        )}`;

      // =================================================
      // Send Response
      // =================================================

      return res.status(200).json({
        message: "Resume analyzed successfully",

        file: {
          originalName: req.file.originalname,

          filename: req.file.filename,

          // Keep original path field for compatibility
          // with existing frontend/backend code.
          // Do not use this path directly on the frontend.
          path: req.file.path,

          size: req.file.size,

          mimetype: req.file.mimetype,

          // New safe URL for accessing the original file
          originalFileUrl,
        },

        extractedText,

        analysis,
      });
    } catch (error) {
      console.error(
        "Resume upload error:",
        error
      );

      // =================================================
      // Cleanup ONLY when upload/processing fails
      // =================================================

      if (req.file && req.file.path) {
        try {
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);

            console.log(
              "Failed-upload temporary file deleted."
            );
          }
        } catch (cleanupError) {
          console.error(
            "Failed to cleanup uploaded file:",
            cleanupError.message
          );
        }
      }

      return res.status(500).json({
        message:
          "Resume upload or analysis failed",

        error: error.message,
      });
    }
  }
);

// =====================================================
// GET ORIGINAL RESUME
// Protected Route
// =====================================================
//
// This route allows the logged-in user to access the
// original uploaded resume.
//
// We are NOT exposing the /uploads folder publicly.
// =====================================================

router.get(
  "/original/:filename",
  protect,
  async (req, res) => {
    try {
      const filename = path.basename(
        req.params.filename
      );

      if (!filename) {
        return res.status(400).json({
          message: "Invalid file name.",
        });
      }

      const filePath = path.resolve(
        uploadsDir,
        filename
      );

      // Prevent path traversal
      if (
        !filePath.startsWith(
          uploadsDir + path.sep
        )
      ) {
        return res.status(403).json({
          message: "Access denied.",
        });
      }

      // Check file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          message: "Original resume not found.",
        });
      }

      // Send original file
      return res.sendFile(filePath);
    } catch (error) {
      console.error(
        "Original resume access error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to access original resume.",
        error: error.message,
      });
    }
  }
);

// =====================================================
// Generate Personalized Career Roadmap
// =====================================================

router.post(
  "/generate-roadmap",
  protect,
  async (req, res) => {
    try {
      const {
        resumeText,
        targetRole,
        timelineMonths,
        dailyHours,
        currentLevel,
        existingSkills,
        missingSkills,
      } = req.body;

      // ==========================
      // Validate Required Fields
      // ==========================

      if (
        !resumeText ||
        !resumeText.trim()
      ) {
        return res.status(400).json({
          message:
            "Resume information is required.",
        });
      }

      if (
        !targetRole ||
        !targetRole.trim()
      ) {
        return res.status(400).json({
          message:
            "Target career role is required.",
        });
      }

      if (!timelineMonths) {
        return res.status(400).json({
          message: "Timeline is required.",
        });
      }

      if (!dailyHours) {
        return res.status(400).json({
          message:
            "Daily study hours are required.",
        });
      }

      if (!currentLevel) {
        return res.status(400).json({
          message:
            "Current skill level is required.",
        });
      }

      // ==========================
      // Generate Roadmap
      // ==========================

      console.log(
        "Generating personalized career roadmap..."
      );

      console.log(
        "Target Role:",
        targetRole
      );

      console.log(
        "Timeline:",
        timelineMonths,
        "months"
      );

      console.log(
        "Daily Hours:",
        dailyHours
      );

      console.log(
        "Current Level:",
        currentLevel
      );

      const roadmap =
        await generateCareerRoadmap({
          resumeText,

          targetRole,

          timelineMonths:
            Number(timelineMonths),

          dailyHours:
            Number(dailyHours),

          currentLevel,

          existingSkills:
            Array.isArray(existingSkills)
              ? existingSkills
              : [],

          missingSkills:
            Array.isArray(missingSkills)
              ? missingSkills
              : [],
        });

      console.log(
        "Personalized roadmap generated successfully."
      );

      // ==========================
      // Send Response
      // ==========================

      return res.status(200).json({
        message:
          "Career roadmap generated successfully",

        roadmap,
      });
    } catch (error) {
      console.error(
        "Career roadmap generation error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to generate standard career roadmap.",

        error: error.message,
      });
    }
  }
);// =====================================================
// INTERVIEW PREPARATION - FRESH JOB + RESUME ANALYSIS
// =====================================================
//
// IMPORTANT:
//
// This endpoint:
// - DOES NOT generate interview questions
// - DOES NOT use old Resume Analysis skill gaps
//
// It performs a fresh comparison between:
//
// CURRENT JOB DESCRIPTION
// +
// CURRENT RESUME
// +
// CURRENT USER INPUT
//
// Then it creates an InterviewAttempt in MongoDB.
//
// Questions will only be generated after the user
// explicitly clicks START INTERVIEW.
// =====================================================
// =====================================================
// INTERVIEW QUESTION ENGINE CONFIG
// =====================================================

const INTERVIEW_TOTAL_QUESTIONS =
  100;

const INTERVIEW_BATCH_SIZE =
  3;

const INTERVIEW_QUEUE_REFILL_THRESHOLD =
  1;

// Prevent duplicate concurrent AI generation
// for the same attempt.
const interviewQuestionGenerationLocks =
  new Set();

// =====================================================
// NORMALIZE QUESTION
// =====================================================

function normalizeInterviewQuestionText(
  text
) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(
      /[^\p{L}\p{N}\s]/gu,
      ""
    )
    .trim();
}

// =====================================================
// QUESTION HASH
// =====================================================

function createInterviewQuestionHash(
  questionText
) {
  return crypto
    .createHash("sha256")
    .update(
      normalizeInterviewQuestionText(
        questionText
      )
    )
    .digest("hex");
}

// =====================================================
// SHUFFLE OPTIONS
// =====================================================

function shuffleInterviewOptions(
  options
) {
  const shuffled =
    Array.isArray(options)
      ? options.map((option) => ({
          optionId:
            String(
              option?.optionId || ""
            )
              .trim()
              .toUpperCase(),

          text:
            String(
              option?.text || ""
            ).trim(),
        }))
      : [];

  for (
    let i =
      shuffled.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        Math.random() *
          (i + 1)
      );

    [
      shuffled[i],
      shuffled[j],
    ] = [
      shuffled[j],
      shuffled[i],
    ];
  }

  return shuffled;
}

// =====================================================
// PUBLIC QUESTION
// IMPORTANT:
// NEVER SEND CORRECT ANSWER OR EXPLANATION
// BEFORE FINAL SUBMISSION.
// =====================================================

function toPublicInterviewQuestion(
  question
) {
  if (!question) {
    return null;
  }

  return {
    questionId:
      question.questionId,

    order:
      question.order,

    question:
      question.question,

    options:
      Array.isArray(
        question.options
      )
        ? question.options.map(
            (option) => ({
              optionId:
                option.optionId,

              text:
                option.text,
            })
          )
        : [],

    category:
      question.category,

    topic:
      question.topic,

    difficulty:
      question.difficulty,

    marks:
      question.marks || 1,
  };
}

// =====================================================
// LOAD PREVIOUSLY USED QUESTION HASHES
// SAME USER + SAME JOB CONTEXT
// =====================================================

async function getPreviousInterviewQuestionHashes(
  attempt
) {
  const previousAttempts =
    await InterviewAttempt.find(
      {
        userId:
          attempt.userId,

        jobDescriptionHash:
          attempt.jobDescriptionHash,

        resumeHash:
          attempt.resumeHash,

        jobTitle:
          attempt.jobTitle,

        experience:
          attempt.experience,

        interviewType:
          attempt.interviewType,

        _id: {
          $ne:
            attempt._id,
        },
      }
    )
      .select(
        "usedQuestionHashes"
      )
      .sort({
        createdAt: -1,
      })
      .limit(20)
      .lean();

  const hashes =
    [];

  for (
    const previousAttempt of
      previousAttempts
  ) {
    if (
      Array.isArray(
        previousAttempt.usedQuestionHashes
      )
    ) {
      hashes.push(
        ...previousAttempt.usedQuestionHashes
      );
    }
  }

  return Array.from(
    new Set(hashes)
  );
}
// =====================================================
// GENERATE + APPEND NEXT QUESTION BATCH
// =====================================================

async function refillInterviewQuestionQueue(
  attemptId
) {
  const lockKey = String(attemptId);

  // Another request may already be generating
  // questions for this interview attempt.
  //
  // Instead of returning immediately, wait for the
  // existing generation to finish. This prevents a
  // race condition where the current question is answered
  // while the next batch is still being generated.
  if (
    interviewQuestionGenerationLocks.has(
      lockKey
    )
  ) {
    const maxWaitMs = 20000;
    const pollMs = 250;
    const startedWaitingAt = Date.now();

    while (
      interviewQuestionGenerationLocks.has(
        lockKey
      ) &&
      Date.now() - startedWaitingAt <
        maxWaitMs
    ) {
      await new Promise((resolve) =>
        setTimeout(resolve, pollMs)
      );
    }

    // Generation finished, so the caller can reload
    // the attempt and continue with the generated questions.
    //
    // If generation is still running after the safety
    // timeout, do not start a duplicate AI generation.
    if (
      interviewQuestionGenerationLocks.has(
        lockKey
      )
    ) {
      return;
    }

    return;
  }

  interviewQuestionGenerationLocks.add(
    lockKey
  );

  try {
    let attempt =
      await InterviewAttempt.findById(
        attemptId
      );

    if (!attempt) {
      return;
    }

    if (
      attempt.status !==
      "IN_PROGRESS"
    ) {
      return;
    }

    if (
      attempt.generatedQuestionCount >=
      INTERVIEW_TOTAL_QUESTIONS
    ) {
      return;
    }

const remainingSlots =
  INTERVIEW_TOTAL_QUESTIONS -
  attempt.generatedQuestionCount;

// Count unanswered questions already waiting in MongoDB.
const currentlyQueuedCount =
  Array.isArray(attempt.questions)
    ? attempt.questions.filter(
        (question) => !question.isAnswered
      ).length
    : 0;

// Generate only enough questions to reach the queue target.
// Never generate another full batch when only 1 slot is missing.
const missingQueueSlots = Math.max(
  0,
  INTERVIEW_BATCH_SIZE - currentlyQueuedCount
);

const requiredBatchSize = Math.min(
  missingQueueSlots,
  remainingSlots
);

if (requiredBatchSize <= 0) {
  return;
}

    if (
      requiredBatchSize <= 0
    ) {
      return;
    }

    // =================================================
    // GET PREVIOUS ATTEMPT HASHES
    // =================================================

    const previousHashes =
      await getPreviousInterviewQuestionHashes(
        attempt
      );

    const excludedHashes =
      Array.from(
        new Set([
          ...previousHashes,

          ...(Array.isArray(
            attempt.usedQuestionHashes
          )
            ? attempt.usedQuestionHashes
            : []),
        ])
      );

    // =================================================
    // GENERATE QUESTIONS
    // =================================================

    console.log(
      "Generating interview question batch...",
      {
        attemptId:
          String(attempt._id),

        targetRole:
          attempt.jobTitle,

        currentGenerated:
          attempt.generatedQuestionCount,

        requested:
          requiredBatchSize,

        previouslyUsed:
          excludedHashes.length,
      }
    );

    const generatedQuestions =
      await generateInterviewQuestionBatch(
        {
          jobTitle:
            attempt.jobTitle,

          jobDescription:
            attempt.jobDescription,

          experience:
            attempt.experience,

          interviewType:
            attempt.interviewType,

          skills:
            Array.isArray(
              attempt.skills
            )
              ? attempt.skills
              : [],

          resumeText:
            attempt.resumeText,

          preparationAnalysis:
            attempt.preparationAnalysis,

          excludedQuestionHashes:
            excludedHashes,

          batchSize:
            requiredBatchSize,
        }
      );

    // =================================================
    // DEDUPE GENERATED QUESTIONS
    // =================================================

    const existingHashes =
      new Set(
        Array.isArray(
          attempt.usedQuestionHashes
        )
          ? attempt.usedQuestionHashes
          : []
      );

    const acceptedQuestions =
      [];

    for (
      const generatedQuestion of
        generatedQuestions
    ) {
      const questionText =
        String(
          generatedQuestion?.question ||
            ""
        ).trim();

      if (!questionText) {
        continue;
      }

      const questionHash =
        createInterviewQuestionHash(
          questionText
        );

      if (
        existingHashes.has(
          questionHash
        )
      ) {
        continue;
      }

      existingHashes.add(
        questionHash
      );

      acceptedQuestions.push({
        question:
          questionText,

        options:
          shuffleInterviewOptions(
            generatedQuestion.options
          ),

        correctOptionId:
          String(
            generatedQuestion.correctOptionId ||
              ""
          )
            .trim()
            .toUpperCase(),

        explanation:
          String(
            generatedQuestion.explanation ||
              ""
          ).trim(),

        category:
          String(
            generatedQuestion.category ||
              "Role Specific"
          ).trim(),

        topic:
          String(
            generatedQuestion.topic ||
              "General"
          ).trim(),

        difficulty:
  String(
    generatedQuestion.difficulty ||
      "MEDIUM"
  )
    .trim()
    .toUpperCase(),
        marks: 1,

        sourceTags:
          Array.isArray(
            generatedQuestion.sourceTags
          )
            ? generatedQuestion.sourceTags
                .map((tag) =>
                  String(tag)
                    .trim()
                )
                .filter(Boolean)
                .slice(0, 8)
            : [],

        questionHash,
      });

      if (
        acceptedQuestions.length >=
        requiredBatchSize
      ) {
        break;
      }
    }

    // =================================================
    // IF AI RETURNED TOO MANY DUPLICATES
    // TRY ONE SMALL SECOND GENERATION
    // =================================================

    if (
      acceptedQuestions.length <
      requiredBatchSize
    ) {
      const stillNeeded =
        requiredBatchSize -
        acceptedQuestions.length;

      const latestExcludedHashes =
        Array.from(
          existingHashes
        );

      try {
        const retryQuestions =
          await generateInterviewQuestionBatch(
            {
              jobTitle:
                attempt.jobTitle,

              jobDescription:
                attempt.jobDescription,

              experience:
                attempt.experience,

              interviewType:
                attempt.interviewType,

              skills:
                Array.isArray(
                  attempt.skills
                )
                  ? attempt.skills
                  : [],

              resumeText:
                attempt.resumeText,

              preparationAnalysis:
                attempt.preparationAnalysis,

              excludedQuestionHashes:
                latestExcludedHashes,

              batchSize:
                Math.min(
                  stillNeeded,
                  INTERVIEW_BATCH_SIZE
                ),
            }
          );

        for (
          const generatedQuestion of
            retryQuestions
        ) {
          const questionText =
            String(
              generatedQuestion?.question ||
                ""
            ).trim();

          if (!questionText) {
            continue;
          }

          const questionHash =
            createInterviewQuestionHash(
              questionText
            );

          if (
            existingHashes.has(
              questionHash
            )
          ) {
            continue;
          }

          existingHashes.add(
            questionHash
          );

          acceptedQuestions.push({
            question:
              questionText,

            options:
              shuffleInterviewOptions(
                generatedQuestion.options
              ),

            correctOptionId:
              String(
                generatedQuestion.correctOptionId ||
                  ""
              )
                .trim()
                .toUpperCase(),

            explanation:
              String(
                generatedQuestion.explanation ||
                  ""
              ).trim(),

            category:
              String(
                generatedQuestion.category ||
                  "Role Specific"
              ).trim(),

            topic:
              String(
                generatedQuestion.topic ||
                  "General"
              ).trim(),

            difficulty:
  String(
    generatedQuestion.difficulty ||
      "MEDIUM"
  )
    .trim()
    .toUpperCase(),

            marks: 1,

            sourceTags:
              Array.isArray(
                generatedQuestion.sourceTags
              )
                ? generatedQuestion.sourceTags
                    .map((tag) =>
                      String(tag)
                        .trim()
                    )
                    .filter(Boolean)
                    .slice(0, 8)
                : [],

            questionHash,
          });

          if (
            acceptedQuestions.length >=
            requiredBatchSize
          ) {
            break;
          }
        }
      } catch (retryError) {
        console.error(
          "Interview question retry batch failed:",
          retryError?.message ||
            retryError
        );
      }
    }

    // =================================================
    // SAVE ACCEPTED QUESTIONS
    // =================================================

    if (
      acceptedQuestions.length ===
      0
    ) {
      throw new Error(
        "AI did not produce any unique interview questions."
      );
    }

    // Re-load latest attempt to avoid
    // overwriting a recently saved answer.
    attempt =
      await InterviewAttempt.findById(
        attemptId
      );

    if (!attempt) {
      return;
    }
    // The user may have submitted the interview while
    // the background model request was still running.
    if (attempt.status !== "IN_PROGRESS") {
    console.log(
    "Interview is no longer active. Discarding generated question batch."
  );

  return;
}
    // Don't exceed 100.
    const actualQuestions =
      acceptedQuestions.slice(
        0,
        INTERVIEW_TOTAL_QUESTIONS -
          attempt.generatedQuestionCount
      );

    for (
      const question of
        actualQuestions
    ) {
      const nextOrder =
        attempt.questions.length +
        1;

      attempt.questions.push({
        questionId:
          crypto.randomUUID(),

        order:
          nextOrder,

        question:
          question.question,

        options:
          question.options,

        correctOptionId:
          question.correctOptionId,

        explanation:
          question.explanation,

        category:
          question.category,

        topic:
          question.topic,

        difficulty:
          question.difficulty,

        marks:
          1,

        sourceTags:
          question.sourceTags,

        questionHash:
          question.questionHash,

        userAnswer:
          null,

        isAnswered:
          false,

        isCorrect:
          false,

        answeredAt:
          null,

        timeTakenSeconds:
          0,
      });

      if (
        !Array.isArray(
          attempt.usedQuestionHashes
        )
      ) {
        attempt.usedQuestionHashes =
          [];
      }

      attempt.usedQuestionHashes.push(
        question.questionHash
      );
    }

    attempt.generatedQuestionCount =
      attempt.questions.length;

    attempt.readyQuestionNumbers =
      attempt.questions
        .filter(
          (question) =>
            !question.isAnswered
        )
        .map(
          (question) =>
            question.order
        );

    await attempt.save();

    console.log(
      "Interview question queue updated:",
      {
        attemptId:
          String(attempt._id),

        generated:
          attempt.generatedQuestionCount,

        ready:
          attempt.readyQuestionNumbers
            .length,
      }
    );
  } catch (error) {
    console.error(
      "Interview question queue refill failed:",
      error
    );
  } finally {
    interviewQuestionGenerationLocks.delete(
       lockKey
    );
  }
}
router.post(
  "/interview-preparation/analyze",
  protect,
  async (req, res) => {
    try {
      /*
       * -------------------------------------------------
       * LOGGED-IN USER
       * -------------------------------------------------
       */

      const userId = req.user.userId;

      /*
       * -------------------------------------------------
       * INPUT
       * -------------------------------------------------
       */

      const {
        jobTitle,
        jobDescription,
        experience,
        interviewType,
        skills,
        resumeText,
        analysis,
      } = req.body;

      /*
       * -------------------------------------------------
       * NORMALIZE TEXT
       * -------------------------------------------------
       */

      const safeJobTitle =
        typeof jobTitle === "string"
          ? jobTitle.trim().slice(0, 200)
          : "";

      const safeJobDescription =
        typeof jobDescription === "string"
          ? jobDescription
              .trim()
              .slice(0, 15000)
          : "";

      const safeExperience =
        typeof experience === "string"
          ? experience.trim().slice(0, 100)
          : "Fresher";

      const safeInterviewType =
        typeof interviewType === "string"
          ? interviewType.trim().slice(0, 150)
          : "Technical + HR";

      const safeResumeText =
        typeof resumeText === "string"
          ? resumeText
              .trim()
              .slice(0, 12000)
          : "";

      /*
       * -------------------------------------------------
       * SKILLS
       * -------------------------------------------------
       */

      const normalizedSkills =
        Array.isArray(skills)
          ? skills
              .map((skill) =>
                typeof skill === "string"
                  ? skill.trim()
                  : ""
              )
              .filter(Boolean)
              .slice(0, 30)
          : typeof skills === "string"
            ? skills
                .split(",")
                .map((skill) =>
                  skill.trim()
                )
                .filter(Boolean)
                .slice(0, 30)
            : [];

      /*
       * -------------------------------------------------
       * VALIDATION
       * -------------------------------------------------
       */

      if (!safeJobTitle) {
        return res.status(400).json({
          message:
            "Target job title is required.",
        });
      }

      if (!safeJobDescription) {
        return res.status(400).json({
          message:
            "Job description is required.",
        });
      }
      

      if (!safeResumeText) {
        return res.status(400).json({
          message:
            "Resume information is not available. Please analyze your resume again.",
        });
      }

      /*
       * -------------------------------------------------
       * HASH CURRENT JD + CURRENT RESUME
       * -------------------------------------------------
       *
       * These hashes help us:
       *
       * 1. Identify the exact JD/resume combination.
       * 2. Prevent unnecessary duplicate-question reuse
       *    later.
       *
       * We do NOT use the hash as a replacement for
       * actual text analysis.
       */

      const jobDescriptionHash =
        crypto
          .createHash("sha256")
          .update(
            safeJobDescription
          )
          .digest("hex");

      const resumeHash =
        crypto
          .createHash("sha256")
          .update(
            safeResumeText
          )
          .digest("hex");

      /*
       * -------------------------------------------------
       * LOGGING
       * -------------------------------------------------
       */

      console.log(
        "==============================================="
      );

      console.log(
        "Interview Preparation Analysis"
      );

      console.log(
        "User ID:",
        userId
      );

      console.log(
        "Target Job:",
        safeJobTitle
      );

      console.log(
        "Job Description Characters:",
        safeJobDescription.length
      );

      console.log(
        "Resume Characters:",
        safeResumeText.length
      );

      console.log(
        "Experience:",
        safeExperience
      );

      console.log(
        "Interview Type:",
        safeInterviewType
      );

      console.log(
        "Skills:",
        normalizedSkills
      );

      console.log(
        "==============================================="
      );

      /*
       * -------------------------------------------------
       * CURRENT JD ↔ CURRENT RESUME ANALYSIS
       * -------------------------------------------------
       *
       * IMPORTANT:
       *
       * We intentionally pass CURRENT resume text,
       * CURRENT JD and CURRENT skills.
       *
       * Old analysis.missingSkills is NOT passed
       * to the AI analysis function.
       *
       * The old analysis is stored only as a snapshot
       * for reference/history.
       */

      const preparationAnalysis =
        await analyzeInterviewPreparation({
          jobDescription:
            safeJobDescription,

          targetRole:
            safeJobTitle,

          experience:
            safeExperience,

          interviewType:
            safeInterviewType,

          skills:
            normalizedSkills,

          resumeText:
            safeResumeText,
        });

      /*
       * -------------------------------------------------
       * CREATE INTERVIEW ATTEMPT
       * -------------------------------------------------
       */

      const interviewAttempt =
        new InterviewAttempt({
          userId,

          jobTitle:
            safeJobTitle,

          jobDescription:
            safeJobDescription,

          jobDescriptionHash,

          experience:
            safeExperience,

          interviewType:
            safeInterviewType,

          skills:
            normalizedSkills,

          /*
           * Current resume snapshot.
           * This keeps the attempt historically accurate.
           */

          resumeText:
            safeResumeText,

          resumeHash,

          /*
           * Existing Resume Analysis is stored as a
           * snapshot/reference only.
           *
           * It is NOT used as the current skill-gap
           * source of truth.
           */

          resumeAnalysisSnapshot:
            analysis || null,

          /*
           * THIS is the current job-specific analysis.
           */

          preparationAnalysis,

          /*
           * Interview configuration.
           */

          totalQuestionsTarget:
            100,

          marksPerQuestion:
            1,

          totalMarksTarget:
            100,

          /*
           * No questions yet.
           */

          status:
            "READY",

          currentQuestionNumber:
            0,

          generatedQuestionCount:
            0,

          answeredQuestionCount:
            0,

          skippedQuestionCount:
            0,

          correctAnswerCount:
            0,

          incorrectAnswerCount:
            0,

          currentScore:
            0,

          questions: [],

          usedQuestionHashes: [],

          readyQuestionNumbers: [],

          queueSizeTarget: 3,

          performance: {},
        });

      await interviewAttempt.save();

      /*
       * -------------------------------------------------
       * RESPONSE
       * -------------------------------------------------
       */

      return res.status(200).json({
        success: true,

        message:
          "Interview preparation analysis completed successfully.",

        attemptId:
          interviewAttempt._id,

        status:
          interviewAttempt.status,

        preparationAnalysis:
          interviewAttempt.preparationAnalysis,

        interviewConfig: {
          totalQuestions:
            interviewAttempt.totalQuestionsTarget,

          marksPerQuestion:
            interviewAttempt.marksPerQuestion,

          totalMarks:
            interviewAttempt.totalMarksTarget,
        },

        /*
         * Explicitly indicate that question generation
         * has NOT started yet.
         */

        interviewStarted:
          false,
      });
    } catch (error) {
      console.error(
        "Interview preparation analysis error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to analyze the current job and resume for interview preparation.",

        error:
          error?.message ||
          "Unknown server error",
      });
    }
  }
);
// =====================================================
// START INTERVIEW
// IMPORTANT:
// QUESTION GENERATION STARTS ONLY HERE.
// =====================================================

router.post(
  "/interview-preparation/:attemptId/start",
  protect,
  async (req, res) => {
    try {
      const userId =
        req.user.userId;

      const attempt =
        await InterviewAttempt.findOne(
          {
            _id:
              req.params.attemptId,

            userId,
          }
        );

      if (!attempt) {
        return res.status(404).json({
          message:
            "Interview attempt not found.",
        });
      }

      // ===============================================
      // RESUME EXISTING ATTEMPT
      // ===============================================

      if (
        attempt.status ===
        "COMPLETED"
      ) {
        return res.status(400).json({
          message:
            "This interview attempt has already been completed.",
        });
      }

      // ===============================================
      // START
      // ===============================================

      if (
        attempt.status ===
          "READY" ||
        attempt.status ===
          "ANALYZING"
      ) {
        attempt.status =
          "IN_PROGRESS";

        attempt.startedAt =
          attempt.startedAt ||
          new Date();

        attempt.currentQuestionNumber =
          1;

        await attempt.save();
      }

      // ===============================================
      // FIRST QUESTION BATCH
      // ===============================================

      if (
        attempt.generatedQuestionCount ===
        0
      ) {
        await refillInterviewQuestionQueue(
          attempt._id
        );
      }

      const refreshedAttempt =
        await InterviewAttempt.findOne(
          {
            _id:
              attempt._id,

            userId,
          }
        );

      if (!refreshedAttempt) {
        return res.status(404).json({
          message:
            "Interview attempt could not be loaded.",
        });
      }

      const nextQuestion =
        refreshedAttempt.questions.find(
          (question) =>
            !question.isAnswered
        );

      if (!nextQuestion) {
        return res.status(500).json({
          message:
            "No interview question is currently available.",
        });
      }

      return res.status(200).json({
        success: true,

        message:
          "Interview started successfully.",

        attemptId:
          String(
            refreshedAttempt._id
          ),

        totalQuestions:
          INTERVIEW_TOTAL_QUESTIONS,

        generatedQuestions:
          refreshedAttempt.generatedQuestionCount,

        answeredQuestions:
          refreshedAttempt.answeredQuestionCount,

        question:
          toPublicInterviewQuestion(
            nextQuestion
          ),
      });
    } catch (error) {
      console.error(
        "Start interview error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to start interview.",

        error:
          error?.message ||
          "Unknown server error",
      });
    }
  }
);
// =====================================================
// STEP 7 - SUBMIT ANSWER FOR CURRENT QUESTION
// =====================================================

router.post(
  "/interview-preparation/:attemptId/answer",
  protect,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const { attemptId } = req.params;

      const {
        questionId,
        optionId,
        timeTakenSeconds,
      } = req.body;

      // -------------------------------------------------
      // BASIC VALIDATION
      // -------------------------------------------------

      if (!questionId) {
        return res.status(400).json({
          success: false,
          message: "Question ID is required.",
        });
      }

      if (!optionId) {
        return res.status(400).json({
          success: false,
          message: "Option ID is required.",
        });
      }

      // -------------------------------------------------
      // FIND ATTEMPT
      // -------------------------------------------------

      const attempt = await InterviewAttempt.findOne({
        _id: attemptId,
        userId,
      });

      if (!attempt) {
        return res.status(404).json({
          success: false,
          message: "Interview attempt not found.",
        });
      }

      // -------------------------------------------------
      // INTERVIEW MUST BE IN PROGRESS
      // -------------------------------------------------

      if (attempt.status !== "IN_PROGRESS") {
        return res.status(400).json({
          success: false,
          message: `Interview is not active. Current status: ${attempt.status}`,
        });
      }

      // -------------------------------------------------
      // FIND QUESTION
      // -------------------------------------------------

      const question = attempt.questions.find(
        (q) => String(q.questionId) === String(questionId)
      );

      if (!question) {
        return res.status(404).json({
          success: false,
          message: "Question not found in this interview.",
        });
      }

      // -------------------------------------------------
      // PREVENT DOUBLE SUBMISSION
      // -------------------------------------------------

      if (question.isAnswered) {
        return res.status(400).json({
          success: false,
          message: "This question has already been answered.",
        });
      }

      // -------------------------------------------------
      // VALIDATE OPTION
      // -------------------------------------------------

      const selectedOption = question.options.find(
        (option) => String(option.optionId) === String(optionId)
      );

      if (!selectedOption) {
        return res.status(400).json({
          success: false,
          message: "Invalid option selected.",
        });
      }

      // -------------------------------------------------
      // TIME TAKEN
      // -------------------------------------------------

      let safeTimeTaken = Number(timeTakenSeconds);

      if (!Number.isFinite(safeTimeTaken) || safeTimeTaken < 0) {
        safeTimeTaken = 0;
      }

      // Prevent unrealistic values from corrupting data
      safeTimeTaken = Math.min(Math.round(safeTimeTaken), 86400);

      // -------------------------------------------------
      // CHECK ANSWER
      // -------------------------------------------------

      const isCorrect =
        String(optionId) === String(question.correctOptionId);

      // -------------------------------------------------
      // SAVE ANSWER
      // -------------------------------------------------

      question.userAnswer = String(optionId);
      question.isAnswered = true;
      question.isCorrect = isCorrect;
      question.answeredAt = new Date();
      question.timeTakenSeconds = safeTimeTaken;

      // -------------------------------------------------
      // UPDATE ATTEMPT COUNTERS
      // -------------------------------------------------

      attempt.answeredQuestionCount =
        Number(attempt.answeredQuestionCount || 0) + 1;

      if (isCorrect) {
        attempt.correctAnswerCount =
          Number(attempt.correctAnswerCount || 0) + 1;

        attempt.currentScore =
          Number(attempt.currentScore || 0) + Number(question.marks || 1);
      } else {
        attempt.incorrectAnswerCount =
          Number(attempt.incorrectAnswerCount || 0) + 1;
      }

      // -------------------------------------------------
      // CURRENT QUESTION NUMBER
      // -------------------------------------------------

      attempt.currentQuestionNumber =
        Number(question.order || attempt.currentQuestionNumber || 1);

      // -------------------------------------------------
      // REFRESH READY QUESTION NUMBERS
      // Only unanswered generated questions remain ready
      // -------------------------------------------------

      attempt.readyQuestionNumbers = attempt.questions
        .filter((q) => !q.isAnswered)
        .map((q) => Number(q.order))
        .filter((n) => Number.isFinite(n))
        .sort((a, b) => a - b);

      // -------------------------------------------------
      // SAVE ANSWER IMMEDIATELY
      // -------------------------------------------------

      await attempt.save();

      // -------------------------------------------------
      // FIND NEXT AVAILABLE QUESTION
      // -------------------------------------------------

      let nextQuestion = attempt.questions
        .filter((q) => !q.isAnswered)
        .sort((a, b) => Number(a.order) - Number(b.order))[0] || null;

      // -------------------------------------------------
      // IF NO QUESTION IS AVAILABLE BUT MORE QUESTIONS
      // ARE REQUIRED, GENERATE THE NEXT BATCH NOW
      // -------------------------------------------------

      if (!nextQuestion && attempt.generatedQuestionCount < INTERVIEW_TOTAL_QUESTIONS) {
        await refillInterviewQuestionQueue(attempt._id);

        // Reload after generation
        const refreshedAttempt = await InterviewAttempt.findOne({
          _id: attempt._id,
          userId,
        });

        if (refreshedAttempt) {
          nextQuestion =
            refreshedAttempt.questions
              .filter((q) => !q.isAnswered)
              .sort((a, b) => Number(a.order) - Number(b.order))[0] || null;

          attempt = refreshedAttempt;
        }
      }

      // -------------------------------------------------
      // BACKGROUND QUEUE REFILL
      //
      // Keep a small question queue ready.
      // We do NOT generate all 100 questions upfront.
      // -------------------------------------------------

      const availableUnansweredCount = attempt.questions.filter(
        (q) => !q.isAnswered
      ).length;

      if (
        availableUnansweredCount <= INTERVIEW_QUEUE_REFILL_THRESHOLD &&
        attempt.generatedQuestionCount < INTERVIEW_TOTAL_QUESTIONS
      ) {
        // Run in background so the user does not wait.
        void refillInterviewQuestionQueue(attempt._id).catch((error) => {
          console.error(
            "Background interview question refill failed:",
            error?.message || error
          );
        });
      }

      // -------------------------------------------------
      // INTERVIEW COMPLETE CHECK
      // -------------------------------------------------

      const interviewComplete =
        attempt.generatedQuestionCount >= INTERVIEW_TOTAL_QUESTIONS &&
        attempt.answeredQuestionCount >= INTERVIEW_TOTAL_QUESTIONS;

      // -------------------------------------------------
      // IMPORTANT:
      // Do NOT send correct/incorrect/explanation/score here.
      // User should only see the next question.
      // -------------------------------------------------

      return res.json({
        success: true,

        message: interviewComplete
          ? "Answer saved. Interview is ready for final submission."
          : "Answer saved successfully.",

        answerSaved: true,

        progress: {
          attempted: attempt.answeredQuestionCount,
          total: INTERVIEW_TOTAL_QUESTIONS,
          generated: attempt.generatedQuestionCount,
          remainingGeneratedQuestions: Math.max(
            0,
            attempt.generatedQuestionCount -
              attempt.answeredQuestionCount
          ),
        },

        interviewComplete,

        nextQuestion: nextQuestion
          ? toPublicInterviewQuestion(nextQuestion)
          : null,
      });
    } catch (error) {
      console.error(
        "Interview answer submission error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to save interview answer.",
        error: error?.message || "Unknown server error",
      });
    }
  }
);
// =====================================================
// STEP 8 - FINAL SUBMIT INTERVIEW
// =====================================================

router.post(
  "/interview-preparation/:attemptId/submit",
  protect,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const { attemptId } = req.params;

      // -------------------------------------------------
      // FIND ATTEMPT
      // -------------------------------------------------

      const attempt = await InterviewAttempt.findOne({
        _id: attemptId,
        userId,
      });

      if (!attempt) {
        return res.status(404).json({
          success: false,
          message: "Interview attempt not found.",
        });
      }

      // -------------------------------------------------
      // ALREADY COMPLETED
      // -------------------------------------------------

      if (attempt.status === "COMPLETED") {
        const completedQuestions = attempt.questions
          .filter(
            (question) => question.isAnswered === true
          )
          .sort(
            (a, b) => Number(a.order) - Number(b.order)
          )
          .map((question) => {
            const selectedOption = question.options.find(
              (option) =>
                String(option.optionId) === String(question.userAnswer)
            );

            const correctOption = question.options.find(
              (option) =>
                String(option.optionId) ===
                String(question.correctOptionId)
            );

            return {
              questionId: question.questionId,
              order: question.order,
              question: question.question,
              options: question.options,
              selectedAnswer: question.userAnswer || null,
              selectedAnswerText: selectedOption?.text || null,
              correctAnswer: question.correctOptionId,
              correctAnswerText: correctOption?.text || null,
              explanation: question.explanation,
              category: question.category,
              topic: question.topic,
              difficulty: question.difficulty,
              marks: question.marks,
              isAnswered: question.isAnswered,
              isCorrect: question.isCorrect,
              timeTakenSeconds: question.timeTakenSeconds || 0,
            };
          });

        return res.json({
          success: true,
          message: "Interview was already submitted.",
          performance: attempt.performance || null,
          review: completedQuestions,
          attemptId: attempt._id,
          status: attempt.status,
        });
      }

      // -------------------------------------------------
      // ONLY ACTIVE INTERVIEW CAN BE SUBMITTED
      // -------------------------------------------------

      if (attempt.status !== "IN_PROGRESS") {
        return res.status(400).json({
          success: false,
          message: `Interview cannot be submitted from status: ${attempt.status}`,
        });
      }

      // -------------------------------------------------
      // QUESTIONS GENERATED SO FAR
      // -------------------------------------------------

      const generatedQuestions = Array.isArray(attempt.questions)
        ? attempt.questions
        : [];

      // -------------------------------------------------
      // ATTEMPTED QUESTIONS
      // -------------------------------------------------

      const attemptedQuestions = generatedQuestions.filter(
        (question) => question.isAnswered === true
      );

      // -------------------------------------------------
      // UNANSWERED
      //
      // Total interview = 100 questions.
      // Anything not answered gets 0 marks.
      // We intentionally DO NOT generate the remaining
      // questions here when the user submits early.
      // -------------------------------------------------

      const totalQuestions = Number(
        attempt.totalQuestionsTarget || INTERVIEW_TOTAL_QUESTIONS
      );

      const marksPerQuestion = Number(
        attempt.marksPerQuestion || 1
      );

      const totalMarks = Number(
        attempt.totalMarksTarget || totalQuestions * marksPerQuestion
      );

      const attemptedCount = attemptedQuestions.length;

      const unansweredCount = Math.max(
        0,
        totalQuestions - attemptedCount
      );

      // -------------------------------------------------
      // CORRECT / INCORRECT
      // -------------------------------------------------

      const correctCount = attemptedQuestions.filter(
        (question) => question.isCorrect === true
      ).length;

      const incorrectCount = attemptedQuestions.filter(
        (question) => question.isCorrect === false
      ).length;

      // -------------------------------------------------
      // SCORE
      // 1 mark per correct answer
      // -------------------------------------------------

      const obtainedMarks =
        correctCount * marksPerQuestion;

      const percentage =
        totalMarks > 0
          ? Number(((obtainedMarks / totalMarks) * 100).toFixed(2))
          : 0;

      // -------------------------------------------------
      // CATEGORY PERFORMANCE
      // -------------------------------------------------

      const categoryMap = {};

      generatedQuestions.forEach((question) => {
        const category =
          String(question.category || "General").trim() ||
          "General";

        if (!categoryMap[category]) {
          categoryMap[category] = {
            category,
            total: 0,
            attempted: 0,
            correct: 0,
            incorrect: 0,
            unanswered: 0,
            obtainedMarks: 0,
            totalMarks: 0,
          };
        }

        categoryMap[category].total += 1;
        categoryMap[category].totalMarks +=
          Number(question.marks || marksPerQuestion);

        if (question.isAnswered) {
          categoryMap[category].attempted += 1;

          if (question.isCorrect) {
            categoryMap[category].correct += 1;
            categoryMap[category].obtainedMarks +=
              Number(question.marks || marksPerQuestion);
          } else {
            categoryMap[category].incorrect += 1;
          }
        } else {
          categoryMap[category].unanswered += 1;
        }
      });

      const categoryWise = Object.values(categoryMap).map(
        (item) => ({
          ...item,
          percentage:
            item.totalMarks > 0
              ? Number(
                  (
                    (item.obtainedMarks / item.totalMarks) *
                    100
                  ).toFixed(2)
                )
              : 0,
        })
      );

      // -------------------------------------------------
      // DIFFICULTY PERFORMANCE
      // -------------------------------------------------

      const difficultyMap = {};

      generatedQuestions.forEach((question) => {
        const difficulty =
          String(question.difficulty || "Medium");

        if (!difficultyMap[difficulty]) {
          difficultyMap[difficulty] = {
            difficulty,
            total: 0,
            attempted: 0,
            correct: 0,
            incorrect: 0,
            unanswered: 0,
            obtainedMarks: 0,
            totalMarks: 0,
          };
        }

        difficultyMap[difficulty].total += 1;
        difficultyMap[difficulty].totalMarks +=
          Number(question.marks || marksPerQuestion);

        if (question.isAnswered) {
          difficultyMap[difficulty].attempted += 1;

          if (question.isCorrect) {
            difficultyMap[difficulty].correct += 1;
            difficultyMap[difficulty].obtainedMarks +=
              Number(question.marks || marksPerQuestion);
          } else {
            difficultyMap[difficulty].incorrect += 1;
          }
        } else {
          difficultyMap[difficulty].unanswered += 1;
        }
      });

      const difficultyWise = Object.values(difficultyMap).map(
        (item) => ({
          ...item,
          percentage:
            item.totalMarks > 0
              ? Number(
                  (
                    (item.obtainedMarks / item.totalMarks) *
                    100
                  ).toFixed(2)
                )
              : 0,
        })
      );

      // -------------------------------------------------
      // STRENGTHS
      //
      // Only consider categories with at least 2 attempted
      // questions so one lucky answer does not become a
      // misleading strength.
      // -------------------------------------------------

      const strengths = categoryWise
        .filter(
          (item) =>
            item.attempted >= 2 &&
            item.percentage >= 80
        )
        .sort((a, b) => b.percentage - a.percentage)
        .map(
          (item) =>
            `${item.category} (${item.percentage}%)`
        );

      // -------------------------------------------------
      // WEAK AREAS
      // -------------------------------------------------

      const weakAreas = categoryWise
        .filter((item) => {
          if (item.attempted === 0) {
            return item.unanswered > 0;
          }

          return item.percentage < 60;
        })
        .sort((a, b) => a.percentage - b.percentage)
        .map((item) => {
          if (item.attempted === 0) {
            return `${item.category} (not attempted)`;
          }

          return `${item.category} (${item.percentage}%)`;
        });

      // -------------------------------------------------
      // RECOMMENDATIONS
      // -------------------------------------------------

      const recommendations = [];

      if (percentage < 60) {
        recommendations.push(
          "Review the core concepts related to the target role before attempting another interview."
        );
      } else if (percentage < 80) {
        recommendations.push(
          "Strengthen weak topics and practice more role-specific interview questions."
        );
      } else {
        recommendations.push(
          "Maintain your preparation level and continue practicing advanced role-specific questions."
        );
      }

      if (incorrectCount > 0) {
        recommendations.push(
          `Review the ${incorrectCount} incorrectly answered question(s) and understand why the correct answers are correct.`
        );
      }

      if (unansweredCount > 0) {
        recommendations.push(
          `${unansweredCount} question(s) were unanswered and received 0 marks.`
        );
      }

      if (Array.isArray(attempt.preparationAnalysis?.skillGaps)) {
        const jobSkillGaps =
          attempt.preparationAnalysis.skillGaps
            .map((gap) => gap.skill)
            .filter(Boolean)
            .slice(0, 8);

        if (jobSkillGaps.length > 0) {
          recommendations.push(
            `Focus on the job-specific skill gaps: ${jobSkillGaps.join(", ")}.`
          );
        }
      }

      // -------------------------------------------------
      // QUESTION-WISE REVIEW
      //
      // This is intentionally returned ONLY after final
      // submission, because correct answers and explanations
      // must remain hidden during the active interview.
      // -------------------------------------------------

      const review = attemptedQuestions
        .sort((a, b) => Number(a.order) - Number(b.order))
        .map((question) => {
          const selectedOption = question.options.find(
            (option) =>
              String(option.optionId) ===
              String(question.userAnswer)
          );

          const correctOption = question.options.find(
            (option) =>
              String(option.optionId) ===
              String(question.correctOptionId)
          );

          return {
            questionId: question.questionId,
            order: question.order,
            question: question.question,

            options: question.options,

            selectedAnswer:
              question.userAnswer || null,

            selectedAnswerText:
              selectedOption?.text || null,

            correctAnswer:
              question.correctOptionId,

            correctAnswerText:
              correctOption?.text || null,

            explanation:
              question.explanation || "",

            category:
              question.category || "General",

            topic:
              question.topic || "",

            difficulty:
              question.difficulty || "Medium",

            marks:
              Number(question.marks || marksPerQuestion),

            isAnswered:
              Boolean(question.isAnswered),

            isCorrect:
              question.isAnswered
                ? Boolean(question.isCorrect)
                : false,

            timeTakenSeconds:
              Number(question.timeTakenSeconds || 0),
          };
        });

      // -------------------------------------------------
      // TOTAL TIME
      // -------------------------------------------------

      const startedAt =
        attempt.startedAt
          ? new Date(attempt.startedAt).getTime()
          : Date.now();

      const submittedAt = new Date();

      const totalTimeTakenSeconds = Math.max(
        0,
        Math.floor(
          (submittedAt.getTime() - startedAt) / 1000
        )
      );

      // -------------------------------------------------
      // PERFORMANCE OBJECT
      // -------------------------------------------------

      const performance = {
        totalMarks,
        obtainedMarks,
        percentage,

        correct:
          correctCount,

        incorrect:
          incorrectCount,

        unanswered:
          unansweredCount,

        attempted:
          attemptedCount,

        categoryWise,

        difficultyWise,

        strengths,

        weakAreas,

        recommendations,
      };

      // -------------------------------------------------
      // UPDATE ATTEMPT
      // -------------------------------------------------

      attempt.status = "COMPLETED";

      attempt.currentScore = obtainedMarks;

      attempt.correctAnswerCount = correctCount;

      attempt.incorrectAnswerCount = incorrectCount;

      attempt.answeredQuestionCount = attemptedCount;

      attempt.skippedQuestionCount = unansweredCount;

      attempt.performance = performance;

      attempt.submittedAt = submittedAt;

      attempt.completedAt = submittedAt;

      attempt.totalTimeTakenSeconds =
        totalTimeTakenSeconds;

      attempt.reportGeneratedAt = submittedAt;

      await attempt.save();

      // -------------------------------------------------
      // FINAL RESPONSE
      // -------------------------------------------------

      return res.json({
        success: true,

        message: "Interview submitted successfully.",

        attemptId: attempt._id,

        status: "COMPLETED",

        performance,

        review,
      });
    } catch (error) {
      console.error(
        "Final interview submission error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to submit interview.",
        error: error?.message || "Unknown server error",
      });
    }
  }
);
// =====================================================
// GENERATE JOB PREPARATION PLAN
// =====================================================

// =====================================================
// GENERATE JOB PREPARATION PLAN
// =====================================================

router.post(
  "/job-preparation",
  protect,
  async (req, res) => {
    try {
      const {
        jobDescription,
        targetRole,
        timelineMonths,
        dailyHours,
        resumeText,
        existingSkills,
        missingSkills,
      } = req.body;

      // =====================================================
      // NORMALIZE INPUTS
      // =====================================================

      const safeJobDescription =
        typeof jobDescription === "string"
          ? jobDescription.trim()
          : "";

      const safeTargetRole =
        typeof targetRole === "string"
          ? targetRole.trim()
          : "";

      const safeResumeText =
        typeof resumeText === "string"
          ? resumeText.trim()
          : "";

      // =====================================================
      // BASIC VALIDATION
      // =====================================================

      if (
        !safeJobDescription &&
        !safeTargetRole
      ) {
        return res.status(400).json({
          message:
            "Please provide a job description or target role.",
        });
      }

      // =====================================================
      // TIMELINE VALIDATION
      // 1–24 months
      // =====================================================

      const parsedTimeline =
        Number(timelineMonths);

      if (
        !Number.isFinite(parsedTimeline) ||
        parsedTimeline < 1 ||
        parsedTimeline > 24
      ) {
        return res.status(400).json({
          message:
            "Preparation timeline must be between 1 and 24 months.",
        });
      }

      // =====================================================
      // DAILY HOURS VALIDATION
      // 1–12 hours
      // =====================================================

      const parsedDailyHours =
        Number(dailyHours);

      if (
        !Number.isFinite(parsedDailyHours) ||
        parsedDailyHours < 1 ||
        parsedDailyHours > 12
      ) {
        return res.status(400).json({
          message:
            "Daily study hours must be between 1 and 12 hours.",
        });
      }

      // =====================================================
      // LIMIT AI INPUT SIZE
      // =====================================================

      const normalizedJobDescription =
        safeJobDescription.slice(0, 15000);

      const normalizedResumeText =
        safeResumeText.slice(0, 12000);

      const normalizedExistingSkills =
        Array.isArray(existingSkills)
          ? existingSkills
              .filter(Boolean)
              .slice(0, 30)
          : [];

      const normalizedMissingSkills =
        Array.isArray(missingSkills)
          ? missingSkills
              .filter(Boolean)
              .slice(0, 30)
          : [];

      // =====================================================
      // CALCULATED VALUES
      // =====================================================

      const finalTimeline =
        parsedTimeline;

      const finalDailyHours =
        parsedDailyHours;

      const totalAvailableHours =
        finalTimeline *
        26 *
        finalDailyHours;

      // =====================================================
      // LOGGING
      // =====================================================

      console.log(
        "Generating job preparation plan..."
      );

      console.log(
        "Target Role:",
        safeTargetRole || "Not provided"
      );

      console.log(
        "Job Description:",
        normalizedJobDescription
          ? `${normalizedJobDescription.length} characters`
          : "Not provided"
      );

      console.log(
        "Resume:",
        normalizedResumeText
          ? `${normalizedResumeText.length} characters`
          : "Not provided"
      );

      console.log(
        "Timeline:",
        finalTimeline,
        "months"
      );

      console.log(
        "Daily Hours:",
        finalDailyHours
      );

      console.log(
        "Calculated Available Hours:",
        totalAvailableHours
      );

      // =====================================================
      // GENERATE AI PLAN
      // =====================================================

      const plan =
        await generateJobPreparationPlan({
          jobDescription:
            normalizedJobDescription,

          targetRole:
            safeTargetRole,

          timelineMonths:
            finalTimeline,

          dailyHours:
            finalDailyHours,

          resumeText:
            normalizedResumeText,

          existingSkills:
            normalizedExistingSkills,

          missingSkills:
            normalizedMissingSkills,
        });

      console.log(
        "Job preparation plan generated successfully."
      );

      // =====================================================
      // SEND RESPONSE
      // =====================================================

      return res.status(200).json({
        message:
          "Job preparation plan generated successfully",

        plan,
      });
    } catch (error) {
      console.error(
        "Job preparation generation error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to generate job preparation plan.",

        error:
          error?.message ||
          "Unknown server error",
      });
    }
  }
);

// =====================================================
// Generate Standard Career Roadmap
// =====================================================

router.post(
  "/standard-roadmap",
  protect,
  async (req, res) => {
    try {
      const {
        resumeText,
        targetRole,
        existingSkills,
        missingSkills,
      } = req.body;

      // ==========================
      // Validate Required Fields
      // ==========================

      if (
        !resumeText ||
        !resumeText.trim()
      ) {
        return res.status(400).json({
          message:
            "Resume information is required.",
        });
      }

      if (
        !targetRole ||
        !targetRole.trim()
      ) {
        return res.status(400).json({
          message:
            "Target career role is required.",
        });
      }

      // ==========================
      // Generate Standard Roadmap
      // ==========================

      console.log(
        "Generating standard career roadmap..."
      );

      console.log(
        "Target Role:",
        targetRole
      );

      const roadmap =
        await generateStandardCareerRoadmap({
          resumeText,

          targetRole,

          existingSkills:
            Array.isArray(existingSkills)
              ? existingSkills
              : [],

          missingSkills:
            Array.isArray(missingSkills)
              ? missingSkills
              : [],
        });

      console.log(
        "Standard roadmap generated successfully."
      );

      // ==========================
      // Send Response
      // ==========================

      return res.status(200).json({
        message:
          "Standard career roadmap generated successfully",

        roadmap,
      });
    } catch (error) {
      console.error(
        "Standard roadmap generation error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to generate standard career roadmap.",

        error: error.message,
      });
    }
  }
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;