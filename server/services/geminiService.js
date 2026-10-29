const { GoogleGenAI } = require("@google/genai");
const Groq = require("groq-sdk");
const { Mistral } = require("@mistralai/mistralai");
const OpenAI = require("openai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStatus(error) {
  return (
    error?.status ||
    error?.statusCode ||
    error?.response?.status
  );
}

function isQuotaOrRateLimit(error) {
  const status = getStatus(error);
  const message = String(
    error?.message || ""
  ).toLowerCase();

  return (
    status === 429 ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("resource_exhausted")
  );
}

async function generateContentStreamWithRetry(
  request,
  maxRetries = 1
) {
  let lastError;

  for (
    let attempt = 0;
    attempt <= maxRetries;
    attempt++
  ) {
    try {
      return await ai.models.generateContentStream(
        request
      );
    } catch (error) {
      lastError = error;

      if (isQuotaOrRateLimit(error)) {
        throw error;
      }

      const status = getStatus(error);

      if (
        status === 503 &&
        attempt < maxRetries
      ) {
        await sleep(
          1500 * Math.pow(2, attempt)
        );
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

async function generateContentWithRetry(
  request,
  maxRetries = 1
) {
  let lastError;

  for (
    let attempt = 0;
    attempt <= maxRetries;
    attempt++
  ) {
    try {
      return await ai.models.generateContent(
        request
      );
    } catch (error) {
      lastError = error;

      if (isQuotaOrRateLimit(error)) {
        throw error;
      }

      const status = getStatus(error);

      if (
        status === 503 &&
        attempt < maxRetries
      ) {
        await sleep(
          1500 * Math.pow(2, attempt)
        );
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

const strictObject = (properties) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

const stringArray = {
  type: "array",
  items: {
    type: "string",
  },
};

const resumeAnalysisSchema = strictObject({
  atsScore: {
    type: "number",
  },

  resumeStrength: {
    type: "string",
  },

  skills: stringArray,

  missingSkills: stringArray,

  weakAreas: stringArray,

  suggestions: stringArray,

  careerRecommendations: stringArray,

  sections: strictObject({
    personalInformation: strictObject({
      present: {
        type: "boolean",
      },

      content: {
        type: "string",
      },
    }),

    professionalSummary: strictObject({
      present: {
        type: "boolean",
      },

      content: {
        type: "string",
      },
    }),

    technicalSkills: strictObject({
      present: {
        type: "boolean",
      },

      content: {
        type: "string",
      },
    }),

    workExperience: strictObject({
      present: {
        type: "boolean",
      },

      content: {
        type: "string",
      },
    }),

    education: strictObject({
      present: {
        type: "boolean",
      },

      content: {
        type: "string",
      },
    }),

    projects: strictObject({
      present: {
        type: "boolean",
      },

      content: {
        type: "string",
      },
    }),

    certifications: strictObject({
      present: {
        type: "boolean",
      },

      content: {
        type: "string",
      },
    }),
  }),

  qualityAnalysis: strictObject({
    overallScore: {
      type: "number",
    },

    completeness: strictObject({
      score: {
        type: "number",
      },

      feedback: {
        type: "string",
      },
    }),

    contentQuality: strictObject({
      score: {
        type: "number",
      },

      feedback: {
        type: "string",
      },
    }),

    clarity: strictObject({
      score: {
        type: "number",
      },

      feedback: {
        type: "string",
      },
    }),

    relevance: strictObject({
      score: {
        type: "number",
      },

      feedback: {
        type: "string",
      },
    }),

    professionalism: strictObject({
      score: {
        type: "number",
      },

      feedback: {
        type: "string",
      },
    }),

    structure: strictObject({
      score: {
        type: "number",
      },

      feedback: {
        type: "string",
      },
    }),
  }),

  atsAnalysis: strictObject({
    overallScore: {
      type: "number",
    },

    keywordScore: {
      type: "number",
    },

    formattingScore: {
      type: "number",
    },

    sectionScore: {
      type: "number",
    },

    skillsMatchScore: {
      type: "number",
    },

    experienceRelevanceScore: {
      type: "number",
    },

    issues: stringArray,

    improvementSuggestions: stringArray,
  }),
});

const roadmapSkillSchema = strictObject({
  skill: {
    type: "string",
  },

  priority: {
    type: "string",
  },

  estimatedHours: {
    type: "number",
  },

  topics: stringArray,

  practiceTasks: stringArray,

  projects: stringArray,

  resources: {
    type: "array",
    items: strictObject({
      platform: {
        type: "string",
      },

      recommendation: {
        type: "string",
      },
    }),
  },

  expectedOutcome: {
    type: "string",
  },
});

const standardRoadmapSchema = strictObject({
  targetRole: {
    type: "string",
  },

  roleOverview: {
    type: "string",
  },

  estimatedTotalHours: {
    type: "number",
  },

  prioritySkills: {
    type: "array",
    items: strictObject({
      skill: {
        type: "string",
      },

      priority: {
        type: "string",
      },

      reason: {
        type: "string",
      },
    }),
  },

  prerequisites: stringArray,

  phases: {
    type: "array",
    items: strictObject({
      phaseNumber: {
        type: "number",
      },

      phaseName: {
        type: "string",
      },

      duration: {
        type: "string",
      },

      objective: {
        type: "string",
      },

      skills: {
        type: "array",
        items: roadmapSkillSchema,
      },
    }),
  },

  interviewPreparation: stringArray,

  jobPreparation: stringArray,

  portfolioPlan: stringArray,

  jobReadinessChecklist: {
    type: "array",
    items: strictObject({
      item: {
        type: "string",
      },

      completed: {
        type: "boolean",
      },
    }),
  },
});

const personalizedSkillSchema = strictObject({
  skill: {
    type: "string",
  },

  priority: {
    type: "string",
  },

  currentStatus: {
    type: "string",
  },

  estimatedHours: {
    type: "number",
  },

  allocatedHours: {
    type: "number",
  },

  topics: stringArray,

  practiceTasks: stringArray,

  projects: stringArray,

  resources: {
    type: "array",
    items: strictObject({
      platform: {
        type: "string",
      },

      recommendation: {
        type: "string",
      },
    }),
  },

  expectedOutcome: {
    type: "string",
  },
});

const personalizedRoadmapSchema =
  strictObject({
    targetRole: {
      type: "string",
    },

    currentLevel: {
      type: "string",
    },

    timelineMonths: {
      type: "number",
    },

    dailyStudyHours: {
      type: "number",
    },

    totalAvailableHours: {
      type: "number",
    },

    estimatedRequiredHours: {
      type: "number",
    },

    feasibility: strictObject({
      status: {
        type: "string",
      },

      score: {
        type: "number",
      },

      message: {
        type: "string",
      },
    }),

    summary: {
      type: "string",
    },

    prioritySkills: {
      type: "array",
      items: strictObject({
        skill: {
          type: "string",
        },

        priority: {
          type: "string",
        },

        reason: {
          type: "string",
        },
      }),
    },

    phases: {
      type: "array",
      items: strictObject({
        phaseNumber: {
          type: "number",
        },

        phaseName: {
          type: "string",
        },

        duration: {
          type: "string",
        },

        objective: {
          type: "string",
        },

        skills: {
          type: "array",
          items: personalizedSkillSchema,
        },
      }),
    },

    weeklyStrategy: {
      type: "array",
      items: strictObject({
        week: {
          type: "number",
        },

        focus: {
          type: "string",
        },

        topics: stringArray,

        practice: stringArray,

        estimatedHours: {
          type: "number",
        },
      }),
    },

    interviewPreparation: stringArray,

    jobPreparation: stringArray,

    portfolioPlan: stringArray,

    jobReadinessChecklist: {
      type: "array",
      items: strictObject({
        item: {
          type: "string",
        },

        completed: {
          type: "boolean",
        },
      }),
    },
  });

function parseProviderJSON(
  raw,
  providerName
) {
  if (
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw)
  ) {
    return raw;
  }

  let text = String(raw || "").trim();

  if (!text) {
    throw new Error(
      `${providerName} returned an empty response.`
    );
  }

  if (text.startsWith("```")) {
    text = text
      .replace(
        /^```(?:json)?\s*/i,
        ""
      )
      .replace(/\s*```$/i, "")
      .trim();
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(
      `${providerName} returned invalid JSON: ${error.message}`
    );
  }
}
// =====================================================
// INTERVIEW PREPARATION ANALYSIS SCHEMA
// =====================================================
//
// IMPORTANT:
// This analysis is ONLY for the CURRENT interview setup.
//
// Source of truth:
// 1. Current Job Description
// 2. Current Resume
// 3. Current Job Title
// 4. Current Experience
// 5. Current Interview Type
// 6. Current User Skills
//
// Do NOT copy old Resume Analysis missingSkills.
// =====================================================

const interviewPreparationAnalysisSchema =
  strictObject({
    targetRole: {
      type: "string",
    },

    roleSummary: {
      type: "string",
    },

    requiredSkills: {
      type: "array",

      items: strictObject({
        skill: {
          type: "string",
        },

        priority: {
          type: "string",
        },

        reason: {
          type: "string",
        },

        candidateStatus: {
          type: "string",
        },
      }),
    },

    matchedSkills: stringArray,

    skillGaps: {
      type: "array",

      items: strictObject({
        skill: {
          type: "string",
        },

        priority: {
          type: "string",
        },

        currentStatus: {
          type: "string",
        },

        action: {
          type: "string",
        },

        estimatedHours: {
          type: "number",
        },
      }),
    },

    jobStrengths: stringArray,

    resumeStrengths: stringArray,

    weakAreas: stringArray,

    interviewFocusAreas: stringArray,

    jobResponsibilities: stringArray,

    recommendedTopics: stringArray,

    overallMatchPercentage: {
      type: "number",
    },
  });


// =====================================================
// VALIDATE INTERVIEW PREPARATION ANALYSIS
// =====================================================

function validateInterviewPreparationAnalysis(
  result
) {
  if (
    !result ||
    typeof result !== "object" ||
    Array.isArray(result)
  ) {
    throw new Error(
      "Interview preparation analysis must be a JSON object."
    );
  }

  if (
    typeof result.targetRole !==
    "string"
  ) {
    throw new Error(
      "targetRole must be a string."
    );
  }

  if (
    !Array.isArray(
      result.requiredSkills
    )
  ) {
    throw new Error(
      "requiredSkills must be an array."
    );
  }

  if (
    !Array.isArray(
      result.matchedSkills
    )
  ) {
    throw new Error(
      "matchedSkills must be an array."
    );
  }

  if (
    !Array.isArray(
      result.skillGaps
    )
  ) {
    throw new Error(
      "skillGaps must be an array."
    );
  }

  if (
    !Array.isArray(
      result.jobStrengths
    )
  ) {
    throw new Error(
      "jobStrengths must be an array."
    );
  }

  if (
    !Array.isArray(
      result.resumeStrengths
    )
  ) {
    throw new Error(
      "resumeStrengths must be an array."
    );
  }

  if (
    !Array.isArray(
      result.weakAreas
    )
  ) {
    throw new Error(
      "weakAreas must be an array."
    );
  }

  if (
    !Array.isArray(
      result.interviewFocusAreas
    )
  ) {
    throw new Error(
      "interviewFocusAreas must be an array."
    );
  }

  if (
    !Array.isArray(
      result.jobResponsibilities
    )
  ) {
    throw new Error(
      "jobResponsibilities must be an array."
    );
  }

  if (
    !Array.isArray(
      result.recommendedTopics
    )
  ) {
    throw new Error(
      "recommendedTopics must be an array."
    );
  }

  const matchPercentage = Number(
    result.overallMatchPercentage
  );

  if (
    !Number.isFinite(
      matchPercentage
    ) ||
    matchPercentage < 0 ||
    matchPercentage > 100
  ) {
    throw new Error(
      "overallMatchPercentage must be between 0 and 100."
    );
  }

  return result;
}
// =====================================================
// JOB PREPARATION PLAN SCHEMA
// =====================================================

const jobPreparationSchema = strictObject({
  targetRole: {
    type: "string",
  },

  roleSummary: {
    type: "string",
  },

  timelineMonths: {
    type: "number",
  },

  dailyStudyHours: {
    type: "number",
  },

  totalAvailableHours: {
    type: "number",
  },

  estimatedRequiredHours: {
    type: "number",
  },

  feasibility: strictObject({
    status: {
      type: "string",
    },

    score: {
      type: "number",
    },

    message: {
      type: "string",
    },
  }),

  jobRequirements: {
    type: "array",

    items: strictObject({
      skill: {
        type: "string",
      },

      priority: {
        type: "string",
      },

      reason: {
        type: "string",
      },

      candidateStatus: {
        type: "string",
      },
    }),
  },

  skillGaps: {
    type: "array",

    items: strictObject({
      skill: {
        type: "string",
      },

      priority: {
        type: "string",
      },

      currentStatus: {
        type: "string",
      },

      action: {
        type: "string",
      },

      estimatedHours: {
        type: "number",
      },
    }),
  },

  monthlyPlan: {
    type: "array",

    items: strictObject({
      month: {
        type: "number",
      },

      focus: {
        type: "string",
      },

      skills: stringArray,

      outcomes: stringArray,
    }),
  },

  weeklyPlan: {
    type: "array",

    items: strictObject({
      week: {
        type: "number",
      },

      focus: {
        type: "string",
      },

      tasks: stringArray,

      estimatedHours: {
        type: "number",
      },
    }),
  },

  interviewPreparation: stringArray,

  jobPreparation: stringArray,

  recommendedProjects: stringArray,

  finalChecklist: stringArray,
});
// =====================================================
// VALIDATE JOB PREPARATION PLAN
// =====================================================

function validateJobPreparationPlan(plan) {
  if (
    !plan ||
    typeof plan !== "object" ||
    Array.isArray(plan)
  ) {
    return "Response must be an object.";
  }

  const errors = [];

  // =====================================================
  // REQUIRED STRING FIELDS
  // =====================================================

  if (
    typeof plan.targetRole !== "string" ||
    !plan.targetRole.trim()
  ) {
    errors.push(
      "targetRole must be a non-empty string"
    );
  }

  if (
    typeof plan.roleSummary !== "string"
  ) {
    errors.push(
      "roleSummary must be a string"
    );
  }

  // =====================================================
  // REQUIRED NUMBER FIELDS
  // =====================================================

  const numberFields = [
    "timelineMonths",
    "dailyStudyHours",
    "totalAvailableHours",
    "estimatedRequiredHours",
  ];

  for (const field of numberFields) {
    if (
      typeof plan[field] !== "number" ||
      !Number.isFinite(plan[field])
    ) {
      errors.push(
        `${field} must be a valid number`
      );
    }
  }

  // =====================================================
  // FEASIBILITY
  // =====================================================

  if (
    !plan.feasibility ||
    typeof plan.feasibility !== "object" ||
    Array.isArray(plan.feasibility)
  ) {
    errors.push(
      "feasibility must be an object"
    );
  } else {
    if (
      typeof plan.feasibility.status !==
      "string"
    ) {
      errors.push(
        "feasibility.status must be a string"
      );
    }

    if (
      typeof plan.feasibility.score !==
        "number" ||
      !Number.isFinite(
        plan.feasibility.score
      ) ||
      plan.feasibility.score < 0 ||
      plan.feasibility.score > 100
    ) {
      errors.push(
        "feasibility.score must be between 0 and 100"
      );
    }

    if (
      typeof plan.feasibility.message !==
      "string"
    ) {
      errors.push(
        "feasibility.message must be a string"
      );
    }
  }

  // =====================================================
  // ARRAY HELPER
  // =====================================================

  const requireStringArray = (
    field
  ) => {
    if (!Array.isArray(plan[field])) {
      errors.push(
        `${field} must be an array`
      );

      return;
    }

    if (
      !plan[field].every(
        (item) =>
          typeof item === "string"
      )
    ) {
      errors.push(
        `${field} must contain only strings`
      );
    }
  };

  // =====================================================
  // SIMPLE STRING ARRAYS
  // =====================================================

  requireStringArray(
    "interviewPreparation"
  );

  requireStringArray(
    "jobPreparation"
  );

  requireStringArray(
    "recommendedProjects"
  );

  requireStringArray(
    "finalChecklist"
  );

  // =====================================================
  // JOB REQUIREMENTS
  // =====================================================

  if (!Array.isArray(plan.jobRequirements)) {
    errors.push(
      "jobRequirements must be an array"
    );
  } else {
    plan.jobRequirements.forEach(
      (item, index) => {
        if (
          !item ||
          typeof item !== "object" ||
          Array.isArray(item)
        ) {
          errors.push(
            `jobRequirements[${index}] must be an object`
          );

          return;
        }

        if (
          typeof item.skill !== "string"
        ) {
          errors.push(
            `jobRequirements[${index}].skill must be a string`
          );
        }

        if (
          typeof item.priority !== "string"
        ) {
          errors.push(
            `jobRequirements[${index}].priority must be a string`
          );
        }

        if (
          typeof item.reason !== "string"
        ) {
          errors.push(
            `jobRequirements[${index}].reason must be a string`
          );
        }

        if (
          typeof item.candidateStatus !==
          "string"
        ) {
          errors.push(
            `jobRequirements[${index}].candidateStatus must be a string`
          );
        }
      }
    );
  }

  // =====================================================
  // SKILL GAPS
  // =====================================================

  if (!Array.isArray(plan.skillGaps)) {
    errors.push(
      "skillGaps must be an array"
    );
  } else {
    plan.skillGaps.forEach(
      (item, index) => {
        if (
          !item ||
          typeof item !== "object" ||
          Array.isArray(item)
        ) {
          errors.push(
            `skillGaps[${index}] must be an object`
          );

          return;
        }

        if (
          typeof item.skill !== "string"
        ) {
          errors.push(
            `skillGaps[${index}].skill must be a string`
          );
        }

        if (
          typeof item.priority !== "string"
        ) {
          errors.push(
            `skillGaps[${index}].priority must be a string`
          );
        }

        if (
          typeof item.currentStatus !==
          "string"
        ) {
          errors.push(
            `skillGaps[${index}].currentStatus must be a string`
          );
        }

        if (
          typeof item.action !== "string"
        ) {
          errors.push(
            `skillGaps[${index}].action must be a string`
          );
        }

        if (
          typeof item.estimatedHours !==
            "number" ||
          !Number.isFinite(
            item.estimatedHours
          ) ||
          item.estimatedHours < 0
        ) {
          errors.push(
            `skillGaps[${index}].estimatedHours must be a valid non-negative number`
          );
        }
      }
    );
  }

  // =====================================================
  // MONTHLY PLAN
  // =====================================================

  if (!Array.isArray(plan.monthlyPlan)) {
    errors.push(
      "monthlyPlan must be an array"
    );
  } else {
    plan.monthlyPlan.forEach(
      (item, index) => {
        if (
          !item ||
          typeof item !== "object" ||
          Array.isArray(item)
        ) {
          errors.push(
            `monthlyPlan[${index}] must be an object`
          );

          return;
        }

        if (
          typeof item.month !== "number" ||
          !Number.isFinite(item.month)
        ) {
          errors.push(
            `monthlyPlan[${index}].month must be a number`
          );
        }

        if (
          typeof item.focus !== "string"
        ) {
          errors.push(
            `monthlyPlan[${index}].focus must be a string`
          );
        }

        if (
          !Array.isArray(item.skills) ||
          !item.skills.every(
            (value) =>
              typeof value === "string"
          )
        ) {
          errors.push(
            `monthlyPlan[${index}].skills must be a string array`
          );
        }

        if (
          !Array.isArray(item.outcomes) ||
          !item.outcomes.every(
            (value) =>
              typeof value === "string"
          )
        ) {
          errors.push(
            `monthlyPlan[${index}].outcomes must be a string array`
          );
        }
      }
    );
  }

  // =====================================================
  // WEEKLY PLAN
  // =====================================================

  if (!Array.isArray(plan.weeklyPlan)) {
    errors.push(
      "weeklyPlan must be an array"
    );
  } else {
    plan.weeklyPlan.forEach(
      (item, index) => {
        if (
          !item ||
          typeof item !== "object" ||
          Array.isArray(item)
        ) {
          errors.push(
            `weeklyPlan[${index}] must be an object`
          );

          return;
        }

        if (
          typeof item.week !== "number" ||
          !Number.isFinite(item.week)
        ) {
          errors.push(
            `weeklyPlan[${index}].week must be a number`
          );
        }

        if (
          typeof item.focus !== "string"
        ) {
          errors.push(
            `weeklyPlan[${index}].focus must be a string`
          );
        }

        if (
          !Array.isArray(item.tasks) ||
          !item.tasks.every(
            (value) =>
              typeof value === "string"
          )
        ) {
          errors.push(
            `weeklyPlan[${index}].tasks must be a string array`
          );
        }

        if (
          typeof item.estimatedHours !==
            "number" ||
          !Number.isFinite(
            item.estimatedHours
          ) ||
          item.estimatedHours < 0
        ) {
          errors.push(
            `weeklyPlan[${index}].estimatedHours must be a valid non-negative number`
          );
        }
      }
    );
  }

  return errors.length
    ? errors.join("; ")
    : null;
}

async function generateGroqJSON(
  prompt,
  schema,
  options = {}
) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not configured."
    );
  }

  console.log("Using Groq fallback...");

  const content = `${prompt}

IMPORTANT:
Return ONLY valid JSON.

The response MUST be syntactically valid JSON.
Use double quotes around every JSON key and every string value.
Never leave a string value unquoted.
Escape double quotes inside string values.
Do not use markdown.
Do not use code fences.
Do not add comments.
Do not add trailing commas.
Do not add explanations outside JSON.
Do not add extra keys.
Follow the requested structure exactly.
Keep every text field concise so the complete JSON fits in the response limit.`;

  const completion =
    await groq.chat.completions.create({
      model:
        process.env.GROQ_MODEL ||
        "openai/gpt-oss-120b",

      messages: [
        {
          role: "user",
          content,
        },
      ],

response_format: {
  type: "json_object",
},

      max_completion_tokens:
        options.maxTokens || 5000,

      reasoning_effort:
        options.reasoningEffort || "low",
    });

  const choice =
    completion.choices?.[0];

  if (choice?.finish_reason === "length") {
    throw new Error(
      "Groq response was truncated before completion."
    );
  }

  return parseProviderJSON(
    choice?.message?.content,
    "Groq"
  );
}

async function generateMistralJSON(
  prompt,
  schema,
  options = {}
) {
  if (!process.env.MISTRAL_API_KEY) {
    throw new Error(
      "MISTRAL_API_KEY is not configured."
    );
  }

  console.log(
    "Using Mistral fallback..."
  );

  const response =
    await mistral.chat.complete({
      model:
        process.env.MISTRAL_MODEL ||
        "mistral-small-2603",

      messages: [
        {
          role: "user",

          content: `${prompt}

IMPORTANT:
Return only valid JSON.
Follow the requested JSON structure exactly.
Do not use markdown or code fences.
Do not add explanations or extra keys.
Keep all text concise.`,
        },
      ],

      responseFormat: {
        type: "json_object",
      },

      maxTokens:
        options.maxTokens || 4500,

      temperature: 0.2,
    });

  return parseProviderJSON(
    response?.choices?.[0]?.message?.content,
    "Mistral"
  );
}

async function generateOpenAIJSON(
  prompt,
  schema,
  options = {}
) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not configured."
    );
  }

  console.log(
    "Using OpenAI fallback..."
  );

  const response =
    await openai.chat.completions.create({
      model:
        process.env.OPENAI_MODEL ||
        "gpt-5.4-mini",

      messages: [
        {
          role: "user",

          content: `${prompt}

IMPORTANT:
Return only valid JSON.
Follow the requested JSON structure exactly.
Do not use markdown or code fences.
Do not add explanations or extra keys.
Keep all text concise.`,
        },
      ],

      response_format: {
        type: "json_object",
      },

      max_completion_tokens:
        options.maxTokens || 4500,
    });

  return parseProviderJSON(
    response?.choices?.[0]?.message?.content,
    "OpenAI"
  );
}

async function generateJSONWithFallback(
  prompt,
  schema,
  options = {}
) {
  let groqError;
  let mistralError;

  const validateResult = options?.validateResult;

  const validate = (result, providerName) => {
    if (typeof validateResult !== "function") {
      return result;
    }

    try {
      validateResult(result);
      return result;
    } catch (validationError) {
      throw new Error(
        `${providerName} returned invalid structured JSON: ${
          validationError?.message ||
          "validation failed"
        }`
      );
    }
  };

  try {
    const result = await generateGroqJSON(
      prompt,
      schema,
      options
    );

    return validate(result, "Groq");
  } catch (error) {
    groqError = error;

    console.error(
      "Groq JSON failed. Switching to Mistral...",
      error?.message || error
    );
  }

  try {
    const result = await generateMistralJSON(
      prompt,
      schema,
      options
    );

    return validate(result, "Mistral");
  } catch (error) {
    mistralError = error;

    console.error(
      "Mistral JSON failed. Switching to OpenAI...",
      error?.message || error
    );
  }

  try {
    const result = await generateOpenAIJSON(
      prompt,
      schema,
      options
    );

    return validate(result, "OpenAI");
  } catch (openAIError) {
    console.error(
      "OpenAI JSON fallback failed.",
      openAIError?.message || openAIError
    );

    throw new Error(
      `All fallback AI providers failed. Groq: ${
        groqError?.message || "unavailable"
      }; Mistral: ${
        mistralError?.message || "unavailable"
      }; OpenAI: ${
        openAIError?.message || "unavailable"
      }`
    );
  }
}

function createTextStreamFromAsyncIterable(
  source,
  extractor
) {
  return (async function* () {
    for await (const chunk of source) {
      const text = extractor(chunk);

      if (!text) {
        continue;
      }

      yield {
        text: () => text,
      };
    }
  })();
}

async function generateGroqStream(
  prompt
) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not configured."
    );
  }

  console.log(
    "Using Groq streaming fallback..."
  );

  const stream =
    await groq.chat.completions.create({
      model:
        process.env.GROQ_MODEL ||
        "openai/gpt-oss-120b",

      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],

      stream: true,
    });

  return createTextStreamFromAsyncIterable(
    stream,

    (chunk) =>
      chunk?.choices?.[0]?.delta?.content ||
      ""
  );
}

async function generateMistralStream(
  prompt
) {
  if (!process.env.MISTRAL_API_KEY) {
    throw new Error(
      "MISTRAL_API_KEY is not configured."
    );
  }

  console.log(
    "Using Mistral streaming fallback..."
  );

  const stream =
    await mistral.chat.stream({
      model:
        process.env.MISTRAL_MODEL ||
        "mistral-small-2603",

      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

  return createTextStreamFromAsyncIterable(
    stream,

    (event) => {
      const data =
        event?.data || event;

      const content =
        data?.choices?.[0]?.delta?.content;

      if (typeof content === "string") {
        return content;
      }

      if (Array.isArray(content)) {
        return content
          .map(
            (item) =>
              item?.text || ""
          )
          .join("");
      }

      return "";
    }
  );
}

async function generateOpenAIStream(
  prompt
) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not configured."
    );
  }

  console.log(
    "Using OpenAI streaming fallback..."
  );

  const stream =
    await openai.chat.completions.create({
      model:
        process.env.OPENAI_MODEL ||
        "gpt-5.4-mini",

      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],

      stream: true,
    });

  return createTextStreamFromAsyncIterable(
    stream,

    (chunk) =>
      chunk?.choices?.[0]?.delta?.content ||
      ""
  );
}

async function generateChatStreamWithFallback(
  prompt
) {
  let groqError;
  let mistralError;

  try {
    return await generateGroqStream(
      prompt
    );
  } catch (error) {
    groqError = error;

    console.error(
      "Groq chat failed. Switching to Mistral...",
      error?.message || error
    );
  }

  try {
    return await generateMistralStream(
      prompt
    );
  } catch (error) {
    mistralError = error;

    console.error(
      "Mistral chat failed. Switching to OpenAI...",
      error?.message || error
    );
  }

  try {
    return await generateOpenAIStream(
      prompt
    );
  } catch (openAIError) {
    throw new Error(
      `All chat fallback providers failed. Groq: ${
        groqError?.message || "unavailable"
      }; Mistral: ${
        mistralError?.message || "unavailable"
      }; OpenAI: ${
        openAIError?.message || "unavailable"
      }`
    );
  }
}

// =====================================================
// RESUME ANALYSIS
// =====================================================

async function analyzeResume(
  resumeText
) {
      const prompt = `
    You are an expert resume analyst and career advisor.

    Analyze the following resume and return a professional resume assessment.

    RESUME TEXT:

    ${resumeText}

    Analyze these areas:

    1. ATS Score — give a score out of 100.
    2. Resume Strength — rate the overall resume.
    3. Skills — identify technical and soft skills found in the resume.
    4. Missing Skills — suggest important skills that appear to be missing based on the candidate's career direction.
    5. Weak Areas — identify weaknesses in the resume.
    6. Suggestions — provide practical improvements.
    7. Career Recommendations — suggest suitable career roles based on the resume.
    8. Resume Section Detection — identify the important sections present in the resume.
    9. Resume Quality Analysis — evaluate the overall quality, completeness, clarity, relevance, professionalism, and structure of the resume.
    10. ATS Compatibility Analysis — evaluate how compatible the resume is with Applicant Tracking Systems (ATS).

    For Resume Section Detection, analyze these sections:

    - Personal Information
    - Professional Summary
    - Technical Skills
    - Work Experience
    - Education
    - Projects
    - Certifications

    For Resume Quality Analysis, evaluate:

    - Completeness
    - Content Quality
    - Clarity
    - Relevance
    - Professionalism
    - Structure

    Give each quality category a score out of 10 and provide a short explanation.

    For ATS Compatibility Analysis, evaluate:

    - Keyword optimization
    - Resume formatting
    - Section completeness
    - Skills matching
    - Experience relevance
    - ATS readability

    Return the result as valid JSON with exactly these fields:

    {
      "atsScore": number,
      "resumeStrength": "string",
      "skills": ["string"],
      "missingSkills": ["string"],
      "weakAreas": ["string"],
      "suggestions": ["string"],
      "careerRecommendations": ["string"],

      "sections": {
        "personalInformation": {
          "present": boolean,
          "content": "string"
        },

        "professionalSummary": {
          "present": boolean,
          "content": "string"
        },

        "technicalSkills": {
          "present": boolean,
          "content": "string"
        },

        "workExperience": {
          "present": boolean,
          "content": "string"
        },

        "education": {
          "present": boolean,
          "content": "string"
        },

        "projects": {
          "present": boolean,
          "content": "string"
        },

        "certifications": {
          "present": boolean,
          "content": "string"
        }
      },

      "qualityAnalysis": {
        "overallScore": number,

        "completeness": {
          "score": number,
          "feedback": "string"
        },

        "contentQuality": {
          "score": number,
          "feedback": "string"
        },

        "clarity": {
          "score": number,
          "feedback": "string"
        },

        "relevance": {
          "score": number,
          "feedback": "string"
        },

        "professionalism": {
          "score": number,
          "feedback": "string"
        },

        "structure": {
          "score": number,
          "feedback": "string"
        }
      },

      "atsAnalysis": {
        "overallScore": number,
        "keywordScore": number,
        "formattingScore": number,
        "sectionScore": number,
        "skillsMatchScore": number,
        "experienceRelevanceScore": number,
        "issues": ["string"],
        "improvementSuggestions": ["string"]
      }
    }

    Rules:

    - All quality scores must be between 0 and 10.
    - overallScore must be between 0 and 100.
    - All ATS scores must be between 0 and 100.
    - "present" must be true only when the section actually exists in the provided resume.
    - If a section is missing, set "present" to false and "content" to an empty string.
    - Do not invent information that is not present in the resume.
    - Base the quality analysis and ATS analysis only on the provided resume.
    - Keep feedback short, specific, and useful.
    - Do not include markdown.
    - Do not include explanations outside the JSON.
    `;

        try {
        console.log(
          "Analyzing resume with Gemini..."
        );

        const response =
          await generateContentWithRetry(
            {
              model:
                "gemini-3.6-flash",

              contents:
                prompt,

              config: {
                responseMimeType:
                  "application/json",
              },
            },
            0
          );

        const result =
          parseProviderJSON(
            response?.text,
            "Gemini"
          );

        console.log(
          "Gemini resume analysis completed successfully."
        );

        return result;
      } catch (error) {
        console.error(
          "Gemini resume analysis failed. Switching to Groq fallback...",
          error?.message || error
        );

        const fallbackResult =
          await generateJSONWithFallback(
            prompt,
            resumeAnalysisSchema,
            {
              name:
                "resume_analysis",

              maxTokens:
                5000,

              reasoningEffort:
                "low",
            }
          );

        console.log(
          "Resume analysis completed using fallback provider."
        );

        return fallbackResult;
      }

      // =====================================================
    // NORMALIZE JOB PREPARATION PLAN
    // =====================================================

    function normalizeJobPreparationPlan(
      plan,
      finalTimeline,
      finalDailyHours,
      totalAvailableHours,
      safeTargetRole
    ) {
      const normalized = {
        ...plan,
      };

      /*
      * These values come from the user's request,
      * so do not trust the AI to calculate them.
      */

      normalized.timelineMonths =
        finalTimeline;

      normalized.dailyStudyHours =
        finalDailyHours;

      normalized.totalAvailableHours =
        totalAvailableHours;

      /*
      * JD-only requests may have no role supplied.
      * The AI should infer one. This fallback prevents
      * the UI from becoming empty in the unlikely case
      * the provider omits it.
      */

      normalized.targetRole =
        String(
          normalized.targetRole ||
            safeTargetRole ||
            "Target Job"
        ).trim();

      /*
      * Make sure arrays always exist after validation.
      */

      normalized.jobRequirements =
        Array.isArray(
          normalized.jobRequirements
        )
          ? normalized.jobRequirements
          : [];

      normalized.skillGaps =
        Array.isArray(
          normalized.skillGaps
        )
          ? normalized.skillGaps
          : [];

      normalized.monthlyPlan =
        Array.isArray(
          normalized.monthlyPlan
        )
          ? normalized.monthlyPlan
          : [];

      normalized.weeklyPlan =
        Array.isArray(
          normalized.weeklyPlan
        )
          ? normalized.weeklyPlan
          : [];

      normalized.interviewPreparation =
        Array.isArray(
          normalized.interviewPreparation
        )
          ? normalized.interviewPreparation
          : [];

      normalized.jobPreparation =
        Array.isArray(
          normalized.jobPreparation
        )
          ? normalized.jobPreparation
          : [];

      normalized.recommendedProjects =
        Array.isArray(
          normalized.recommendedProjects
        )
          ? normalized.recommendedProjects
          : [];

      normalized.finalChecklist =
        Array.isArray(
          normalized.finalChecklist
        )
          ? normalized.finalChecklist
          : [];

      return normalized;
    }
}

// =====================================================
// PERSONALIZED CAREER ROADMAP
// =====================================================

async function generateCareerRoadmap({
  resumeText,
  targetRole,
  timelineMonths,
  dailyHours,
  currentLevel,
  existingSkills = [],
  missingSkills = [],
}) {
  const safeTimeline =
    Number(timelineMonths);

  const safeDailyHours =
    Number(dailyHours);

  if (
    !resumeText ||
    !String(resumeText).trim()
  ) {
    throw new Error(
      "Resume information is required."
    );
  }

  if (
    !targetRole ||
    !String(targetRole).trim()
  ) {
    throw new Error(
      "Target career role is required."
    );
  }

  if (
    !Number.isFinite(
      safeTimeline
    ) ||
    safeTimeline <= 0
  ) {
    throw new Error(
      "Timeline must be a valid positive number."
    );
  }

  if (
    !Number.isFinite(
      safeDailyHours
    ) ||
    safeDailyHours <= 0
  ) {
    throw new Error(
      "Daily study hours must be a valid positive number."
    );
  }

  const normalizedLevel =
    String(
      currentLevel || "Beginner"
    ).trim() || "Beginner";

  const normalizedExistingSkills =
    Array.isArray(existingSkills)
      ? existingSkills.slice(0, 30)
      : [];

  const normalizedMissingSkills =
    Array.isArray(missingSkills)
      ? missingSkills.slice(0, 30)
      : [];

  const totalAvailableHours =
    Math.round(
      safeTimeline *
        26 *
        safeDailyHours
    );

  const prompt = `
You are an expert career strategist, technical mentor, and learning-plan designer.

Create a highly personalized career roadmap for the candidate.

Base the roadmap on:
1. Candidate resume
2. Existing skills
3. Missing skills
4. Selected target role
5. Requested timeline
6. Daily study time
7. Current skill level

Do not invent experience, projects, skills, certifications, education, or job history.

=====================================================
USER ROADMAP PREFERENCES
=====================================================

TARGET ROLE:
${String(targetRole).trim()}

TIMELINE:
${safeTimeline} months

DAILY STUDY TIME:
${safeDailyHours} hours/day

CURRENT SKILL LEVEL:
${normalizedLevel}

CALCULATED AVAILABLE STUDY TIME:
${totalAvailableHours} hours

=====================================================
EXISTING SKILLS
=====================================================

${JSON.stringify(
  normalizedExistingSkills
)}

=====================================================
MISSING SKILLS
=====================================================

${JSON.stringify(
  normalizedMissingSkills
)}

=====================================================
RESUME
=====================================================

${String(resumeText)}

=====================================================
ROADMAP RULES
=====================================================

Create a realistic, job-focused roadmap that the candidate can actually follow.

Use approximately 26 study days per month.

If the requested timeline is short:
- Prioritize HIGH-priority job skills.
- Use existing skills to avoid repeating unnecessary beginner material.
- Reduce optional and advanced topics.
- Increase practical work and interview preparation.
- Clearly mark the timeline as ambitious when appropriate.

If the requested timeline is longer:
- Allow stronger fundamentals.
- Add deeper practical application.
- Add more portfolio-quality work.
- Include interview and job preparation before the timeline ends.

Every important skill must include:
- priority
- current status
- estimated learning hours
- allocated learning hours
- topics
- practice tasks
- projects
- resources
- expected outcome

Priority values must be exactly HIGH, MEDIUM, or LOW.

Feasibility status must be exactly:
Achievable, Ambitious, or Extended.

Do not falsely claim an unrealistic goal is easy.

=====================================================
OUTPUT
=====================================================

Return ONLY valid JSON.

Return exactly this structure:

{
  "targetRole": "string",
  "currentLevel": "string",
  "timelineMonths": number,
  "dailyStudyHours": number,
  "totalAvailableHours": number,
  "estimatedRequiredHours": number,

  "feasibility": {
    "status": "Achievable | Ambitious | Extended",
    "score": number,
    "message": "string"
  },

  "summary": "string",

  "prioritySkills": [
    {
      "skill": "string",
      "priority": "HIGH | MEDIUM | LOW",
      "reason": "string"
    }
  ],

  "phases": [
    {
      "phaseNumber": number,
      "phaseName": "string",
      "duration": "string",
      "objective": "string",

      "skills": [
        {
          "skill": "string",
          "priority": "HIGH | MEDIUM | LOW",
          "currentStatus": "string",
          "estimatedHours": number,
          "allocatedHours": number,

          "topics": ["string"],

          "practiceTasks": ["string"],

          "projects": ["string"],

          "resources": [
            {
              "platform": "string",
              "recommendation": "string"
            }
          ],

          "expectedOutcome": "string"
        }
      ]
    }
  ],

  "weeklyStrategy": [
    {
      "week": number,
      "focus": "string",
      "topics": ["string"],
      "practice": ["string"],
      "estimatedHours": number
    }
  ],

  "interviewPreparation": [
    "string"
  ],

  "jobPreparation": [
    "string"
  ],

  "portfolioPlan": [
    "string"
  ],

  "jobReadinessChecklist": [
    {
      "item": "string",
      "completed": false
    }
  ]
}

OUTPUT SIZE RULES:

- Maximum 5 phases.
- Maximum 3 skills per phase.
- Maximum 6 topics per skill.
- Maximum 3 practice tasks per skill.
- Maximum 2 projects per skill.
- Maximum 2 resources per skill.
- Maximum 8 weekly strategy entries.
- Maximum 5 interview preparation items.
- Maximum 5 job preparation items.
- Maximum 5 portfolio plan items.
- Maximum 8 job-readiness checklist items.
- Keep every text field concise.
- Never omit required fields.
- Do not include markdown.
- Do not include explanations outside JSON.
`;

  try {
    const response =
      await generateContentWithRetry(
        {
          model:
            "gemini-3.6-flash",

          contents: prompt,

          config: {
            responseMimeType:
              "application/json",
          },
        },
        0
      );

    return parseProviderJSON(
      response?.text,
      "Gemini"
    );
  } catch (error) {
    console.error(
      "Gemini personalized roadmap failed. Switching to Groq fallback...",
      error?.message || error
    );

    return await generateJSONWithFallback(
      prompt,
      personalizedRoadmapSchema,
      {
        name: "personalized_roadmap",
        maxTokens: 6000,
        reasoningEffort: "low",
      }
    );
  }
}
// =====================================================
// INTERVIEW PREPARATION ANALYSIS
// =====================================================
//
// This function performs a FRESH comparison between:
//
// CURRENT JOB DESCRIPTION
// +
// CURRENT RESUME
// +
// CURRENT USER INPUT
//
// It is intentionally separate from analyzeResume().
//
// No interview questions are generated here.
//
// This function only prepares the analysis that the user
// reviews before clicking START INTERVIEW.
// =====================================================

// =====================================================
// NORMALIZE INTERVIEW PREPARATION ANALYSIS
// =====================================================


function normalizeInterviewPreparationAnalysis(
  result,
  fallbackTargetRole = ""
) {
  const normalized = {
    ...(result &&
    typeof result === "object" &&
    !Array.isArray(result)
      ? result
      : {}),
  };

  // The backend already knows the selected job title.
  // Use it if the AI omits or incorrectly formats targetRole.
  const generatedRole =
    typeof normalized.targetRole === "string"
      ? normalized.targetRole.trim()
      : "";

  normalized.targetRole =
    generatedRole ||
    String(fallbackTargetRole || "").trim() ||
    "Target Job";

  normalized.requiredSkills =
    Array.isArray(normalized.requiredSkills)
      ? normalized.requiredSkills.map((item) => ({
          ...item,
          priority: String(
            item?.priority || "MEDIUM"
          )
            .trim()
            .toUpperCase(),
        }))
      : [];

  normalized.skillGaps =
    Array.isArray(normalized.skillGaps)
      ? normalized.skillGaps.map((item) => ({
          ...item,
          priority: String(
            item?.priority || "MEDIUM"
          )
            .trim()
            .toUpperCase(),
        }))
      : [];

        
  // Normalize matchedSkills into a flat array of skill names.
  // Handles strings, objects and nested/stringified arrays.

  const extractMatchedSkillNames = (value) => {
    if (Array.isArray(value)) {
      return value.flatMap(extractMatchedSkillNames);
    }

    if (value && typeof value === "object") {
      const skillName =
        value.skill ??
        value.name ??
        value.value ??
        value.text;

      return typeof skillName === "string" &&
        skillName.trim()
        ? [skillName.trim()]
        : [];
    }

    if (typeof value !== "string") {
      return [];
    }

    const text = value.trim();

    if (!text) {
      return [];
    }

    // Handle a JSON array/object encoded as a string.
    try {
      const parsed = JSON.parse(text);

      if (
        Array.isArray(parsed) ||
        (parsed && typeof parsed === "object")
      ) {
        return extractMatchedSkillNames(parsed);
      }
    } catch {
      // Continue with the fallback below.
    }

    // Handle object-like text such as:
    // { skill: 'Java', evidence: 'Found in resume' }
    const extractedSkills = [
      ...text.matchAll(
        /["']?skill["']?\s*:\s*["']([^"']+)["']/gi
      ),
    ].map((match) => match[1].trim());

    if (extractedSkills.length > 0) {
      return extractedSkills.filter(Boolean);
    }

    // Never save a raw array/object representation as a skill.
    if (text.includes("[") || text.includes("{")) {
      return [];
    }

    // Handle an ordinary comma-separated string.
    return text.includes(",")
      ? text.split(",").map((skill) => skill.trim()).filter(Boolean)
      : [text];
  };

  const extractedMatchedSkills =
    extractMatchedSkillNames(normalized.matchedSkills);

  // Remove duplicate skills without changing their displayed spelling.
  const seenMatchedSkills = new Set();

  normalized.matchedSkills =
    extractedMatchedSkills.filter((skill) => {
      const key = skill.toLowerCase();

      if (!key || seenMatchedSkills.has(key)) {
        return false;
      }

      seenMatchedSkills.add(key);
      return true;
    });

  // Normalize the AI-generated job match percentage.
  const rawMatchPercentage =
    normalized.overallMatchPercentage;

  const parsedMatchPercentage =
    typeof rawMatchPercentage === "number"
      ? rawMatchPercentage
      : Number.parseFloat(
          String(rawMatchPercentage ?? "")
            .replace("%", "")
            .trim()
        );

  if (
    Number.isFinite(parsedMatchPercentage) &&
    parsedMatchPercentage >= 0 &&
    parsedMatchPercentage <= 100
  ) {
    normalized.overallMatchPercentage =
      Math.round(parsedMatchPercentage);
  } else {
    console.warn(
      "Invalid AI match percentage. Deriving a fallback from matched skills."
    );

    const requiredSkillCount =
      Array.isArray(normalized.requiredSkills)
        ? normalized.requiredSkills.length
        : 0;

    const matchedSkillCount =
      Array.isArray(normalized.matchedSkills)
        ? normalized.matchedSkills.length
        : 0;

    normalized.overallMatchPercentage =
      requiredSkillCount > 0
        ? Math.round(
            (Math.min(
              matchedSkillCount,
              requiredSkillCount
            ) /
              requiredSkillCount) *
              100
          )
        : 0;
  }

  return normalized;
}


async function analyzeInterviewPreparation({
  jobDescription = "",
  targetRole = "",
  experience = "Fresher",
  interviewType = "Technical + HR",
  skills = [],
  resumeText = "",
}) {
  const safeJobDescription =
    String(
      jobDescription || ""
    )
      .trim()
      .slice(0, 15000);

  const safeTargetRole =
    String(
      targetRole || ""
    )
      .trim()
      .slice(0, 200);

  const safeExperience =
    String(
      experience || "Fresher"
    )
      .trim()
      .slice(0, 100);

  const safeInterviewType =
    String(
      interviewType ||
        "Technical + HR"
    )
      .trim()
      .slice(0, 150);

  const safeResumeText =
    String(
      resumeText || ""
    )
      .trim()
      .slice(0, 12000);

  const safeSkills = Array.isArray(
    skills
  )
    ? skills
        .map((skill) =>
          String(skill || "").trim()
        )
        .filter(Boolean)
        .slice(0, 30)
    : [];

  /*
   * ---------------------------------------------------
   * BASIC INPUT VALIDATION
   * ---------------------------------------------------
   */

  if (!safeJobDescription) {
    throw new Error(
      "Job description is required for interview preparation analysis."
    );
  }

  if (!safeResumeText) {
    throw new Error(
      "Resume information is required for interview preparation analysis."
    );
  }

  /*
   * ---------------------------------------------------
   * PROMPT
   * ---------------------------------------------------
   */

  const prompt = `
You are CareerLane's expert interview preparation analyst.

Your task is to perform a FRESH, JOB-SPECIFIC comparison between the candidate's CURRENT RESUME and the CURRENT JOB DESCRIPTION.

This is NOT the old resume analysis.

This is NOT a generic career analysis.

This is NOT a generic interview plan.

The result will be shown to the user before the interview starts.

=====================================================
CURRENT JOB TITLE
=====================================================

${safeTargetRole || "Infer from the job description."}

=====================================================
CURRENT JOB DESCRIPTION
=====================================================

${safeJobDescription}

=====================================================
CURRENT EXPERIENCE LEVEL
=====================================================

${safeExperience}

=====================================================
CURRENT INTERVIEW TYPE
=====================================================

${safeInterviewType}

=====================================================
CURRENT USER-PROVIDED SKILLS
=====================================================

${JSON.stringify(
  safeSkills
)}

=====================================================
CURRENT RESUME
=====================================================

${safeResumeText}

=====================================================
CORE ANALYSIS RULE
=====================================================

The CURRENT JOB DESCRIPTION is the primary source of truth for determining what this interview requires.

Compare the CURRENT JOB DESCRIPTION against the CURRENT RESUME and CURRENT USER-PROVIDED SKILLS.

Do NOT copy or reuse old Resume Analysis missingSkills.

Do NOT assume that a skill is a gap merely because it was missing in a previous analysis.

A skill is a CURRENT GAP only when it is relevant to the CURRENT JOB DESCRIPTION and there is insufficient evidence of that skill in the CURRENT RESUME or CURRENT USER-PROVIDED SKILLS.

=====================================================
REQUIRED SKILLS
=====================================================

Extract the important technical, functional and relevant soft skills that are explicitly required or strongly implied by the CURRENT JOB DESCRIPTION.

Do not invent unrelated technologies.

Every required skill must be relevant to the CURRENT JOB DESCRIPTION.

For each skill provide:

- skill
- priority
- reason
- candidateStatus

candidateStatus must describe the candidate's CURRENT evidence from the CURRENT RESUME and CURRENT SKILLS.

=====================================================
MATCHED SKILLS
=====================================================

List only the skills that:

1. Are relevant to the CURRENT JOB DESCRIPTION
2. Are supported by evidence in the CURRENT RESUME or CURRENT USER SKILLS

Do not list unrelated resume skills.
The matchedSkills field must contain a flat JSON array of strings only.

Example:
["Java", "Spring Boot", "REST APIs"]

Never return objects, nested arrays, or evidence fields inside matchedSkills.

=====================================================
CURRENT SKILL GAPS
=====================================================

Identify only CURRENT JOB-RELEVANT gaps.

For every gap provide:

- skill
- priority
- currentStatus
- action
- estimatedHours

Do not create gaps from old Resume Analysis data.

=====================================================
JOB STRENGTHS
=====================================================

Identify what makes this candidate a strong match for THIS CURRENT JOB.

Base this only on:

- Current Resume
- Current User Skills
- Current Job Description

Do not give generic praise.

=====================================================
RESUME STRENGTHS
=====================================================

Identify resume evidence that is directly useful for the CURRENT JOB.

Focus on:

- relevant technologies
- relevant projects
- relevant work experience
- relevant achievements
- relevant responsibilities
- relevant domain exposure

=====================================================
WEAK AREAS
=====================================================

Identify weak areas that could affect the candidate in THIS specific interview.

These must be relevant to the CURRENT JOB DESCRIPTION.

=====================================================
INTERVIEW FOCUS AREAS
=====================================================

Identify the exact areas the interview should focus on.

Prioritize:

1. Explicit job requirements
2. Important matching skills
3. Current skill gaps
4. Relevant resume projects
5. Relevant work experience
6. Experience level
7. Interview type

=====================================================
JOB RESPONSIBILITIES
=====================================================

Extract the most important responsibilities from the CURRENT JOB DESCRIPTION.

Do not invent responsibilities.

=====================================================
RECOMMENDED TOPICS
=====================================================

List specific preparation topics for THIS CURRENT JOB.

Each topic must be relevant to:

- Current Job Description
- Current Resume
- Current Skill Gaps
- Current Interview Type

Do not recommend unrelated technologies.

=====================================================
MATCH PERCENTAGE
=====================================================

Calculate an approximate overall job match percentage from 0 to 100.

The percentage must be based on the CURRENT JOB DESCRIPTION compared against the CURRENT RESUME and CURRENT USER SKILLS.

Do not use the old Resume Analysis ATS score.

=====================================================
IMPORTANT INTERVIEW QUESTION RULE
=====================================================

Although this step does NOT generate questions yet, all analysis must be suitable for the next stage where interview questions will be generated.

Future questions must be strictly based on:

- CURRENT JOB DESCRIPTION
- CURRENT RESUME
- CURRENT SKILL GAPS
- CURRENT INTERVIEW TYPE
- CURRENT EXPERIENCE

No unrelated questions.

=====================================================
OUTPUT RULES
=====================================================

Return ONLY valid JSON.

Do not return markdown.

Do not return code fences.

Do not return explanations outside JSON.

Do not add extra keys.

Keep every text field concise but useful.

Maximum limits:

- requiredSkills: 20
- matchedSkills: 20
- skillGaps: 15
- jobStrengths: 10
- resumeStrengths: 10
- weakAreas: 10
- interviewFocusAreas: 10
- jobResponsibilities: 10
- recommendedTopics: 15
`;

  /*
   * ---------------------------------------------------
   * GEMINI FIRST
   * ---------------------------------------------------
   */

  try {
    console.log(
      "Analyzing current Job Description + Resume for Interview Preparation with Gemini..."
    );

    const response =
      await generateContentWithRetry(
        {
          model:
            "gemini-3.6-flash",

          contents: prompt,

          config: {
            responseMimeType:
              "application/json",
          },
        },
        0
      );

    const result =
      parseProviderJSON(
        response?.text,
        "Gemini"
      );

    return validateInterviewPreparationAnalysis(
    normalizeInterviewPreparationAnalysis(
    result,
    safeTargetRole
    )
  );
  } catch (error) {
    console.error(
      "Gemini interview preparation analysis failed. Switching to Groq fallback...",
      error?.message || error
    );

    /*
     * -------------------------------------------------
     * GROQ → MISTRAL → OPENAI
     * Existing fallback helper is reused.
     * -------------------------------------------------
     */

        const fallbackResult =
          await generateJSONWithFallback(
        prompt,
        interviewPreparationAnalysisSchema,
        {
          name:
            "interview_preparation_analysis",

          maxTokens: 4500,

          reasoningEffort:
            "low",

          validateResult: (result) =>
          validateInterviewPreparationAnalysis(
          normalizeInterviewPreparationAnalysis(
          result,
          safeTargetRole
          )
          ),
        }
      );

    return validateInterviewPreparationAnalysis(
  normalizeInterviewPreparationAnalysis(
    fallbackResult,
    safeTargetRole
  )
);
  }
}
// =====================================================
// JOB PREPARATION PLAN
// =====================================================

async function generateJobPreparationPlan({
  jobDescription = "",
  targetRole = "",
  timelineMonths = 3,
  dailyHours = 2,
  resumeText = "",
  existingSkills = [],
  missingSkills = [],
}) {
  const finalTimeline = Number(timelineMonths) || 3;

  const finalDailyHours = Number(dailyHours) || 2;

  const totalAvailableHours =
    finalTimeline * 26 * finalDailyHours;

  const safeJobDescription =
    String(jobDescription || "").trim();

  const safeTargetRole =
    String(targetRole || "").trim();

  const prompt = `
You are an expert hiring strategist, technical mentor,
career coach and interview preparation specialist.

Create a highly practical JOB PREPARATION PLAN for a candidate.

This feature is NOT a generic career roadmap.

Its purpose is to prepare the candidate specifically for:
1. The supplied job description, when available.
2. The selected target role, when available.
3. The candidate's resume and current skills.
4. The user's available preparation timeline.
5. The user's daily study time.

=====================================================
INPUT RULE
=====================================================

At least one of these may be provided:

JOB DESCRIPTION:
${safeJobDescription || "Not provided"}

TARGET ROLE:
${safeTargetRole || "Not provided"}

IMPORTANT:

- If a job description is provided, analyse it carefully.
- If a target role is provided, use it.
- If only the job description is provided, infer the most likely target role.
- If only the target role is provided, create a role-specific preparation plan.
- If both are provided, combine both sources.
- Do not require both inputs.
- Never invent candidate experience.

=====================================================
CANDIDATE RESUME
=====================================================

${resumeText || "Resume not available."}

=====================================================
EXISTING SKILLS
=====================================================

${JSON.stringify(existingSkills)}

=====================================================
MISSING SKILLS
=====================================================

${JSON.stringify(missingSkills)}

=====================================================
TIME AVAILABLE
=====================================================

Timeline:
${finalTimeline} months

Daily study time:
${finalDailyHours} hours/day

Total available study hours:
${totalAvailableHours} hours

Use approximately 26 study days per month.

=====================================================
JOB ANALYSIS
=====================================================

Identify:

- Core technical skills
- Frameworks and libraries
- Programming languages
- Databases
- Tools
- Platforms
- Soft skills
- Important responsibilities
- Interview-relevant knowledge
- Important job keywords

For every important requirement determine:

- Priority: HIGH, MEDIUM or LOW
- Reason
- Whether the candidate already has evidence of it
- What the candidate should do next

=====================================================
SKILL GAP ANALYSIS
=====================================================

Compare the job requirements with the candidate's resume.

For each important gap provide:

- Skill
- Priority
- Current status
- Exact action required
- Realistic estimated learning hours

Do not claim the candidate knows something unless supported
by the resume or existing skill data.

=====================================================
REALISTIC TIME PLANNING
=====================================================

Calculate whether the requested timeline is:

Achievable
Ambitious
Extended

Do not falsely claim that an unrealistic timeline is easy.

Prioritize:

1. Job-critical skills
2. Interview-critical concepts
3. Practical projects
4. Resume/application readiness
5. Lower-priority skills

=====================================================
MONTHLY PLAN
=====================================================

Create a realistic month-by-month plan.

Each month must contain:

- Focus
- Skills
- Expected outcomes

Do not overload the candidate.

=====================================================
WEEKLY PLAN
=====================================================

Create a practical week-by-week plan.

Each week must contain:

- Focus
- Tasks
- Estimated hours

The weekly hours should fit within the user's available study time.

=====================================================
INTERVIEW PREPARATION
=====================================================

Include:

- Technical topics
- Role-specific interview topics
- Resume-based questions
- Project questions
- Behavioural preparation
- Mock interview practice

=====================================================
JOB PREPARATION
=====================================================

Include:

- Resume keyword alignment
- ATS improvements
- LinkedIn/profile readiness
- GitHub/portfolio readiness
- Application strategy
- Job application tracking
- Recruiter communication preparation

=====================================================
PROJECTS
=====================================================

Recommend practical projects that directly support the target job.

Projects should help demonstrate the most important missing skills.

=====================================================
FINAL CHECKLIST
=====================================================

Create a concise checklist of everything that should be completed
before applying/interviewing for this role.

=====================================================
OUTPUT RULES
=====================================================

Return ONLY valid JSON.

Do not return markdown.

Do not return code fences.

Do not add explanations outside JSON.

Keep text concise enough to fit the response limit.

The requested timeline must exactly match:
${finalTimeline}

The requested daily hours must exactly match:
${finalDailyHours}
`;

  try {
    console.log(
      "Generating job preparation plan with Gemini..."
    );

    const response =
      await generateContentWithRetry(
        {
          model: "gemini-3.6-flash",

          contents: prompt,

          config: {
            responseMimeType: "application/json",
          },
        },
        0
      );

    return JSON.parse(response.text);
  } catch (error) {
    console.error(
      "Gemini job preparation failed. Switching to fallback...",
      error?.message || error
    );

    return await generateJSONWithFallback(
      prompt,
      jobPreparationSchema,
      {
        name: "job_preparation_plan",
        maxTokens: 5000,
        reasoningEffort: "low",
      }
    );
  }
}

// =====================================================
// STANDARD CAREER ROADMAP
// =====================================================

async function generateStandardCareerRoadmap({
  resumeText,
  targetRole,
  existingSkills = [],
  missingSkills = [],
}) {
  const prompt = `
You are an expert career strategist, technical mentor, and professional learning-path designer.

Create a detailed STANDARD career roadmap for the selected target job role.

This is NOT the user's personalized time-constrained roadmap.

The purpose of this roadmap is to show the complete professional learning path required to become job-ready for the selected role.

=====================================================
SELECTED TARGET ROLE
=====================================================

${targetRole}

=====================================================
CANDIDATE INFORMATION
=====================================================

Existing Skills:

${JSON.stringify(existingSkills)}

Missing Skills:

${JSON.stringify(missingSkills)}

Resume:

${resumeText}

=====================================================
ROADMAP REQUIREMENTS
=====================================================

Create a complete industry-oriented roadmap for the selected role.

The roadmap must cover the normal learning sequence from the candidate's current background toward job readiness.

Include:

1. Role overview
2. Skills required for the role
3. Skill priority
4. Prerequisites
5. Learning sequence
6. Estimated learning hours for each important skill
7. Topics under every skill
8. Practice tasks
9. Real-world projects
10. Recommended learning resources
11. Expected outcome of every skill
12. Interview preparation
13. Job preparation
14. Portfolio requirements
15. Final job-readiness checklist

=====================================================
SKILL PRIORITY
=====================================================

Every skill must have exactly one priority:

HIGH
MEDIUM
LOW

HIGH:
Essential skills required for entry-level jobs.

MEDIUM:
Important supporting skills that improve employability.

LOW:
Advanced, optional, or specialization-oriented skills.

=====================================================
EXISTING SKILLS
=====================================================

If the candidate already has a skill supported by the resume:

- Do not assume they are an expert.
- Do not remove the skill from the roadmap.
- Explain how they should strengthen it.
- Focus on practical application, projects and interview preparation.

Never invent skills or experience that are not supported by the resume.

=====================================================
LEARNING HOURS
=====================================================

Give realistic estimated learning hours.

Learning hours should represent approximate time required for a beginner/intermediate learner to understand and practically apply the skill.

Do not make unrealistic estimates.

=====================================================
ROADMAP PHASES
=====================================================

Organize the roadmap into logical phases.

Example structure:

Phase 1 — Foundations
Phase 2 — Core Skills
Phase 3 — Advanced/Professional Skills
Phase 4 — Projects
Phase 5 — Interview Preparation
Phase 6 — Job Readiness

However, change the phases when another structure is more appropriate for the selected role.

Every phase must contain:

- phase number
- phase name
- duration
- objective
- skills
- topics
- practice
- projects
- resources
- expected outcomes

=====================================================
RESOURCES
=====================================================

Recommend useful resources such as:

- Documentation
- Official learning platforms
- Courses
- YouTube
- Practice platforms
- Project-based resources

Do not fabricate URLs.

If you cannot confidently provide a URL, provide only the platform/resource name and recommendation.

=====================================================
PROJECTS
=====================================================

Projects must become progressively more difficult.

Include:

- Beginner projects
- Intermediate projects
- Role-specific projects
- One strong portfolio project

Projects should directly demonstrate skills required for the selected role.

=====================================================
INTERVIEW PREPARATION
=====================================================

Include:

- Technical interview topics
- Common interview areas
- Practical interview preparation
- Project discussion preparation
- Behavioral preparation

=====================================================
JOB PREPARATION
=====================================================

Include:

- Resume preparation
- LinkedIn/profile preparation
- Portfolio preparation
- Job application strategy
- Skill-gap preparation
- Mock interviews

=====================================================
OUTPUT
=====================================================

Return ONLY valid JSON.

Return exactly this structure:

{
  "targetRole": "string",
  "roleOverview": "string",
  "estimatedTotalHours": number,

  "prioritySkills": [
    {
      "skill": "string",
      "priority": "HIGH | MEDIUM | LOW",
      "reason": "string"
    }
  ],

  "prerequisites": [
    "string"
  ],

  "phases": [
    {
      "phaseNumber": number,
      "phaseName": "string",
      "duration": "string",
      "objective": "string",

      "skills": [
        {
          "skill": "string",
          "priority": "HIGH | MEDIUM | LOW",
          "estimatedHours": number,

          "topics": [
            "string"
          ],

          "practiceTasks": [
            "string"
          ],

          "projects": [
            "string"
          ],

          "resources": [
            {
              "platform": "string",
              "recommendation": "string"
            }
          ],

          "expectedOutcome": "string"
        }
      ]
    }
  ],

  "interviewPreparation": [
    "string"
  ],

  "jobPreparation": [
    "string"
  ],

  "portfolioPlan": [
    "string"
  ],

  "jobReadinessChecklist": [
    {
      "item": "string",
      "completed": false
    }
  ]
}

=====================================================
OUTPUT SIZE RULES
=====================================================

- Keep the roadmap complete but concise.
- Maximum 5 phases.
- Maximum 2 skills per phase.
- Maximum 6 topics per skill.
- Maximum 3 practiceTasks per skill.
- Maximum 2 projects per skill.
- Maximum 2 resources per skill.
- Keep each expectedOutcome to one short sentence.
- Keep interviewPreparation to maximum 5 items.
- Keep jobPreparation to maximum 5 items.
- Keep portfolioPlan to maximum 5 items.
- Keep jobReadinessChecklist to maximum 8 items.
- Never omit a required top-level field.

FINAL RULES:

- This is a STANDARD roadmap for the selected role.
- Do not apply a custom timeline or daily study limit.
- Do not invent candidate experience.
- Do not invent candidate skills.
- Use the resume only to understand the candidate's starting context.
- The roadmap must represent the complete learning path for the selected role.
- Estimated hours must be realistic.
- Include practical projects.
- Include resources.
- Include interview preparation.
- Include job preparation.
- Include portfolio preparation.
- Make the roadmap detailed enough that the user knows what to learn next.
- Do not include markdown.
- Do not include explanations outside JSON.
`;

  try {
    const response =
      await generateContentWithRetry(
        {
          model:
            "gemini-3.6-flash",

          contents: prompt,

          config: {
            responseMimeType:
              "application/json",
          },
        },
        0
      );

    return JSON.parse(
      response.text
    );
  } catch (error) {
    console.error(
      "Gemini standard roadmap failed. Switching to fallback providers..."
    );

    return await generateJSONWithFallback(
      prompt,
      standardRoadmapSchema,
      {
        name: "standard_roadmap",
        maxTokens: 5000,
        reasoningEffort: "low",
      }
    );
  }
}
// =====================================================
// INTERVIEW QUESTION BATCH SCHEMA
// =====================================================

const interviewQuestionBatchSchema =
  strictObject({
    questions: {
      type: "array",

      items: strictObject({
        question: {
          type: "string",
        },

        options: {
          type: "array",

          items: strictObject({
            optionId: {
              type: "string",
            },

            text: {
              type: "string",
            },
          }),
        },

        correctOptionId: {
          type: "string",
        },

        explanation: {
          type: "string",
        },

        category: {
          type: "string",
        },

        topic: {
          type: "string",
        },

        difficulty: {
          type: "string",
        },

        marks: {
          type: "number",
        },

        sourceTags: {
          type: "array",

          items: {
            type: "string",
          },
        },
      }),
    },
  });

// =====================================================
// VALIDATE INTERVIEW QUESTION BATCH
// =====================================================

function validateInterviewQuestionBatch(
  result,
  expectedCount
) {
  if (
    !result ||
    typeof result !== "object" ||
    Array.isArray(result)
  ) {
    return "Response must be an object.";
  }

  if (
    !Array.isArray(
      result.questions
    )
  ) {
    return "questions must be an array.";
  }

  if (
    result.questions.length !==
    expectedCount
  ) {
    return `Exactly ${expectedCount} questions are required. Received ${result.questions.length}.`;
  }

  const questionTexts =
    new Set();

  for (
    let index = 0;
    index < result.questions.length;
    index++
  ) {
    const question =
      result.questions[index];

    if (
      !question ||
      typeof question !==
        "object"
    ) {
      return `Question ${index + 1} is invalid.`;
    }

    if (
      typeof question.question !==
        "string" ||
      !question.question.trim()
    ) {
      return `Question ${index + 1} must contain valid question text.`;
    }

    const normalizedQuestion =
      question.question
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    if (
      questionTexts.has(
        normalizedQuestion
      )
    ) {
      return `Duplicate question detected at position ${index + 1}.`;
    }

    questionTexts.add(
      normalizedQuestion
    );

    // ===============================================
    // EXACTLY 4 OPTIONS
    // ===============================================

    if (
      !Array.isArray(
        question.options
      ) ||
      question.options.length !== 4
    ) {
      return `Question ${index + 1} must have exactly 4 options.`;
    }

    const optionIds =
      question.options.map(
        (option) =>
          String(
            option?.optionId || ""
          )
            .trim()
            .toUpperCase()
      );

    const uniqueOptionIds =
      new Set(optionIds);

    if (
      uniqueOptionIds.size !== 4
    ) {
      return `Question ${index + 1} must have 4 unique option IDs.`;
    }

    for (
      const option of question.options
    ) {
      if (
        !option ||
        typeof option.text !==
          "string" ||
        !option.text.trim()
      ) {
        return `Question ${index + 1} contains an invalid option.`;
      }
    }

    // ===============================================
    // CORRECT OPTION
    // ===============================================

    const correctOptionId =
      String(
        question.correctOptionId ||
          ""
      )
        .trim()
        .toUpperCase();

    if (
      !uniqueOptionIds.has(
        correctOptionId
      )
    ) {
      return `Question ${index + 1} has an invalid correctOptionId.`;
    }

    // ===============================================
    // EXPLANATION
    // ===============================================

    if (
      typeof question.explanation !==
        "string" ||
      !question.explanation.trim()
    ) {
      return `Question ${index + 1} must contain an explanation.`;
    }

    // ===============================================
    // CATEGORY
    // ===============================================

    if (
      typeof question.category !==
        "string" ||
      !question.category.trim()
    ) {
      return `Question ${index + 1} must contain a category.`;
    }

    // ===============================================
    // TOPIC
    // ===============================================

    if (
      typeof question.topic !==
        "string" ||
      !question.topic.trim()
    ) {
      return `Question ${index + 1} must contain a topic.`;
    }

    // ===============================================
    // DIFFICULTY
    // ===============================================

    const difficulty =
      String(
        question.difficulty || ""
      )
        .trim()
        .toLowerCase();

    if (
      ![
        "easy",
        "medium",
        "hard",
      ].includes(difficulty)
    ) {
      return `Question ${index + 1} difficulty must be Easy, Medium or Hard.`;
    }

    // ===============================================
    // MARKS
    // ===============================================

    if (
      Number(question.marks) !== 1
    ) {
      return `Question ${index + 1} must be worth exactly 1 mark.`;
    }

    // ===============================================
    // SOURCE TAGS
    // ===============================================

    if (
      !Array.isArray(
        question.sourceTags
      )
    ) {
      return `Question ${index + 1} must contain sourceTags.`;
    }
  }

  return null;
}

// =====================================================
// GENERATE INTERVIEW QUESTION BATCH
// =====================================================

async function generateInterviewQuestionBatch({
  jobTitle = "",
  jobDescription = "",
  experience = "",
  interviewType = "",
  skills = [],
  resumeText = "",
  preparationAnalysis = null,
  excludedQuestionHashes = [],
  batchSize = 5,
}) {
  const safeBatchSize =
    Math.min(
      Math.max(
        Number(batchSize) || 5,
        1
      ),
      5
    );

  const safeJobTitle =
    String(jobTitle || "")
      .trim()
      .slice(0, 200);

  const safeJobDescription =
    String(jobDescription || "")
      .trim()
      .slice(0, 15000);

  const safeExperience =
    String(experience || "")
      .trim()
      .slice(0, 150);

  const safeInterviewType =
    String(interviewType || "")
      .trim()
      .slice(0, 150);

  const safeSkills =
    Array.isArray(skills)
      ? skills
          .filter(Boolean)
          .map((skill) =>
            String(skill)
              .trim()
          )
          .filter(Boolean)
          .slice(0, 30)
      : [];

  const safeResumeText =
    String(resumeText || "")
      .trim()
      .slice(0, 8000);

  const analysis =
    preparationAnalysis || {};

  const requiredSkills =
    Array.isArray(
      analysis.requiredSkills
    )
      ? analysis.requiredSkills
          .slice(0, 20)
          .map((item) => ({
            skill:
              String(
                item?.skill || ""
              ).trim(),

            priority:
              String(
                item?.priority || ""
              ).trim(),

            candidateStatus:
              String(
                item?.candidateStatus ||
                  ""
              ).trim(),
          }))
      : [];

  const matchedSkills =
  Array.isArray(
    analysis.matchedSkills
  )
    ? analysis.matchedSkills
        .slice(0, 20)
        .map((item) => {
          // Interview preparation analysis returns
          // matchedSkills as a simple string array.
          // Keep backward compatibility with older
          // object-shaped data as well.
          if (typeof item === "string") {
            return item.trim();
          }

          return String(
            item?.skill ||
              ""
          ).trim();
        })
        .filter(Boolean)
    : [];

  const skillGaps =
    Array.isArray(
      analysis.skillGaps
    )
      ? analysis.skillGaps
          .slice(0, 20)
          .map((item) => ({
            skill:
              String(
                item?.skill || ""
              ).trim(),

            priority:
              String(
                item?.priority || ""
              ).trim(),

            currentStatus:
              String(
                item?.currentStatus ||
                  ""
              ).trim(),

            action:
              String(
                item?.action || ""
              ).trim(),
          }))
      : [];

  const jobStrengths =
    Array.isArray(
      analysis.jobStrengths
    )
      ? analysis.jobStrengths
          .slice(0, 10)
      : [];

  const resumeStrengths =
    Array.isArray(
      analysis.resumeStrengths
    )
      ? analysis.resumeStrengths
          .slice(0, 10)
      : [];

  const weakAreas =
    Array.isArray(
      analysis.weakAreas
    )
      ? analysis.weakAreas
          .slice(0, 10)
      : [];

  const interviewFocusAreas =
    Array.isArray(
      analysis.interviewFocusAreas
    )
      ? analysis.interviewFocusAreas
          .slice(0, 12)
      : [];

  const recommendedTopics =
    Array.isArray(
      analysis.recommendedTopics
    )
      ? analysis.recommendedTopics
          .slice(0, 15)
      : [];

  const jobResponsibilities =
    Array.isArray(
      analysis.jobResponsibilities
    )
      ? analysis.jobResponsibilities
          .slice(0, 12)
      : [];

  const excludedHashes =
    Array.isArray(
      excludedQuestionHashes
    )
      ? excludedQuestionHashes
          .filter(Boolean)
          .slice(-80)
      : [];

  // Random variation seed.
  //
  // This is important because the same JD + resume +
  // role can be attempted again and should produce
  // a fresh set of questions.
  const variationSeed =
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;

  const prompt = `
You are CareerLane AI's interview question generation engine.

Generate a fresh batch of exactly ${safeBatchSize} multiple-choice interview questions.

The questions are for ONE specific candidate and ONE specific current job.

=====================================================
CURRENT JOB
=====================================================

Target Job Title:
${safeJobTitle}

Interview Type:
${safeInterviewType}

Experience Level:
${safeExperience}

Current Job Description:
${safeJobDescription}

=====================================================
CURRENT CANDIDATE SKILLS
=====================================================

${JSON.stringify(
  safeSkills
)}

=====================================================
CURRENT RESUME
=====================================================

${safeResumeText}

=====================================================
FRESH JOB-SPECIFIC PREPARATION ANALYSIS
=====================================================

Required Skills From Current JD:
${JSON.stringify(
  requiredSkills
)}

Matched Skills:
${JSON.stringify(
  matchedSkills
)}

Job-Specific Skill Gaps:
${JSON.stringify(
  skillGaps
)}

Job Strengths:
${JSON.stringify(
  jobStrengths
)}

Resume Strengths:
${JSON.stringify(
  resumeStrengths
)}

Weak Areas:
${JSON.stringify(
  weakAreas
)}

Interview Focus Areas:
${JSON.stringify(
  interviewFocusAreas
)}

Job Responsibilities:
${JSON.stringify(
  jobResponsibilities
)}

Recommended Topics:
${JSON.stringify(
  recommendedTopics
)}

=====================================================
IMPORTANT QUESTION RULES
=====================================================

1. The CURRENT JOB DESCRIPTION is the primary source of truth.

2. Questions MUST be directly relevant to the current job.

3. Questions MUST use the current resume when creating resume/project-based questions.

4. Questions MUST use the CURRENT job-specific skill gaps when appropriate.

5. Do NOT use the old/general Resume Analysis missingSkills list.

6. Do NOT invent technologies that are unrelated to:
   - the current Job Description
   - current resume
   - current candidate skills
   - current job-specific skill gaps
   - current interview type

7. Questions must match the candidate's selected experience level.

8. Interview type must influence question style.

9. If interview type is HR or includes HR:
   include relevant behavioral/communication questions where appropriate.

10. If interview type is Technical:
    prioritize technical questions directly connected to the JD.

11. If interview type is Coding:
    prefer programming/problem-solving questions relevant to the JD.

12. If interview type is Managerial:
    include decision-making, leadership and scenario-based questions
    relevant to the role.

13. Project/resume questions are allowed only when the resume actually
    contains relevant projects, technologies or experience.

14. Do not ask generic random questions that cannot be connected
    to the current job.

15. Questions must be useful for actual interview preparation,
    not trivia.

16. Avoid duplicate questions.

17. Avoid rephrasing a previously used question.

18. Each question must have exactly 4 options.

19. Only one option can be correct.

20. Every question is worth exactly 1 mark.

21. Difficulty must be Easy, Medium or Hard.

22. Explanations must briefly explain why the correct answer is correct.

23. sourceTags should describe the question source, for example:
    "JD"
    "RESUME"
    "SKILL_GAP"
    "INTERVIEW_TYPE"
    "PROJECT"
    "RESPONSIBILITY"
    "TOPIC"

24. Return only JSON.

=====================================================
PREVIOUSLY USED QUESTION HASHES
=====================================================

Do NOT generate questions matching these hashes:

${JSON.stringify(
  excludedHashes
)}

=====================================================
FRESH VARIATION SEED
=====================================================

${variationSeed}

Use this seed internally to vary the content,
scenario framing and question selection.

=====================================================
REQUIRED JSON STRUCTURE
=====================================================

{
  "questions": [
    {
      "question": "string",
      "options": [
        {
          "optionId": "A",
          "text": "string"
        },
        {
          "optionId": "B",
          "text": "string"
        },
        {
          "optionId": "C",
          "text": "string"
        },
        {
          "optionId": "D",
          "text": "string"
        }
      ],
      "correctOptionId": "A",
      "explanation": "string",
      "category": "Technical | Coding | Resume | Project | Behavioral | Role Specific | Problem Solving",
      "topic": "string",
      "difficulty": "Easy | Medium | Hard",
      "marks": 1,
      "sourceTags": ["JD"]
    }
  ]
}

=====================================================
FINAL RULE
=====================================================

Return EXACTLY ${safeBatchSize} questions.

No markdown.
No code fences.
No extra text.
`;

  try {
    console.log(
      "Generating interview question batch with Gemini..."
    );

    const response =
      await generateContentWithRetry(
        {
          model:
            "gemini-3.6-flash",

          contents:
            prompt,

          config: {
            responseMimeType:
              "application/json",
          },
        },
        0
      );

    const parsed =
      parseProviderJSON(
        response?.text,
        "Gemini"
      );

    const validationError =
      validateInterviewQuestionBatch(
        parsed,
        safeBatchSize
      );

    if (validationError) {
      throw new Error(
        `Gemini returned invalid interview questions: ${validationError}`
      );
    }

    return parsed.questions;
  } catch (error) {
    console.error(
      "Gemini interview question generation failed. Switching to fallback...",
      error?.message || error
    );

    const fallbackResult =
      await generateJSONWithFallback(
        prompt,
        interviewQuestionBatchSchema,
        {
          name:
            "interview_question_batch",

          maxTokens:
            5000,

          reasoningEffort:
            "low",

          validateResult:
            (result) => {
              const validationError =
                validateInterviewQuestionBatch(
                  result,
                  safeBatchSize
                );

              if (
                validationError
              ) {
                throw new Error(
                  validationError
                );
              }
            },
        }
      );

    return fallbackResult.questions;
  }
}

// =====================================================
// CAREERLANE AI CHATBOT
// =====================================================

async function askCareerLaneAI({
  message,
  resumeText = "",
  analysis = null,
  currentHistory = [],
  memoryMessages = [],
  attachment = null,
}) {
  const limitedCurrentHistory =
    Array.isArray(currentHistory)
      ? currentHistory.slice(-8)
      : [];

  const limitedMemoryMessages =
    Array.isArray(memoryMessages)
      ? memoryMessages.slice(-4)
      : [];

  const compactResumeText =
    String(resumeText || "").slice(
      0,
      10000
    );

  const compactAnalysis = analysis
    ? {
        atsScore:
          analysis.atsScore,

        resumeStrength:
          analysis.resumeStrength,

        skills:
          Array.isArray(
            analysis.skills
          )
            ? analysis.skills.slice(
                0,
                20
              )
            : [],

        missingSkills:
          Array.isArray(
            analysis.missingSkills
          )
            ? analysis.missingSkills.slice(
                0,
                20
              )
            : [],

        weakAreas:
          Array.isArray(
            analysis.weakAreas
          )
            ? analysis.weakAreas.slice(
                0,
                10
              )
            : [],

        suggestions:
          Array.isArray(
            analysis.suggestions
          )
            ? analysis.suggestions.slice(
                0,
                10
              )
            : [],

        careerRecommendations:
          Array.isArray(
            analysis.careerRecommendations
          )
            ? analysis.careerRecommendations.slice(
                0,
                10
              )
            : [],
      }
    : null;

  const currentConversationText =
    limitedCurrentHistory.length > 0
      ? limitedCurrentHistory
          .map((item) => {
            const role =
              item.role === "user"
                ? "User"
                : "CareerLane AI";

            return `${role}: ${item.content}`;
          })
          .join("\n\n")
      : "No previous messages in this conversation.";

  const memoryText =
    limitedMemoryMessages.length > 0
      ? limitedMemoryMessages
          .map((item) => {
            const role =
              item.role === "user"
                ? "User"
                : "CareerLane AI";

            return `${role}: ${item.content}`;
          })
          .join("\n\n")
      : "No previous saved conversation memory is available.";

  const attachmentParts = [];

  if (
    attachment?.base64 &&
    attachment?.mimeType
  ) {
    attachmentParts.push({
      inlineData: {
        mimeType:
          attachment.mimeType,

        data:
          attachment.base64,
      },
    });
  }

  const prompt = `
You are CareerLane AI, an intelligent, helpful and capable AI assistant.

Your primary purpose is to help the user with whatever they ask.

Career and professional guidance are your core strengths, but you are NOT limited to career-related questions.

You can help users with:

- General questions
- Career guidance
- Job roles and career options
- Skills and learning paths
- Study plans
- Interview preparation
- Resume improvement
- Career decisions
- Coding questions
- Programming errors
- Debugging
- Technical concepts
- Project ideas
- Software development
- Business and startup ideas
- Education
- Problem solving
- Everyday questions
- Questions about attached images and files
- Any other safe and answerable question

=====================================================
IMPORTANT MEMORY RULE
=====================================================

CareerLane AI has conversation memory.

Use the supplied saved conversation memory when it is relevant to the current question.

Memory can contain information from previous conversations with this user.

Use previous memory to understand:

- Previously discussed topics
- Previously discussed goals
- Previously discussed projects
- Previously discussed learning plans
- Previous questions
- Previous technical problems
- Previous decisions
- Relevant preferences explicitly mentioned by the user

However:

- Do NOT assume old information is still correct if the user contradicts it.
- Do NOT mention memory unnecessarily.
- Do NOT say "I remember you" unless it naturally helps.
- Do NOT invent information that does not appear in the supplied memory.
- Use memory only when relevant to the current question.

=====================================================
CURRENT CONVERSATION HISTORY
=====================================================

${currentConversationText}

=====================================================
PREVIOUS SAVED CONVERSATION MEMORY
=====================================================

${memoryText}

=====================================================
CURRENT USER QUESTION
=====================================================

${
  message ||
  "The user has attached a file/image and wants help with it."
}

=====================================================
RESUME CONTEXT
=====================================================

${
  compactResumeText ||
  "No resume has been provided."
}

=====================================================
RESUME ANALYSIS CONTEXT
=====================================================

${
  compactAnalysis
    ? JSON.stringify(
        compactAnalysis
      )
    : "No resume analysis is currently available."
}

=====================================================
ATTACHMENT
=====================================================

${
  attachment
    ? `The user attached a file named "${attachment.name}".

Analyze the attachment when relevant to the user's question.`
    : "No attachment was provided."
}

=====================================================
RESPONSE RULES
=====================================================

1. Answer the user's actual question directly.

2. If the question is career-related, provide practical, realistic and actionable advice.

3. If the user asks what skill they should learn, consider:

   - Current skills
   - Missing skills
   - Career goal
   - Resume
   - Previous relevant conversations
   - Available learning time when provided

4. If resume information is available, personalize the answer when relevant.

5. Never invent information about the user's resume.

6. Use previous conversation memory only when it is relevant.

7. If the user asks a follow-up question, use the current conversation history to understand what "this", "that", "it", "same", etc. refers to.

8. If the user asks about a programming error:

   - Explain what the error means.
   - Identify the likely cause.
   - Explain how to fix it.
   - Provide corrected code when enough information is available.
   - If code is incomplete, clearly explain what is missing.

9. If the user provides code:

   - Understand the existing code first.
   - Preserve the existing logic where possible.
   - Do not unnecessarily rewrite unrelated parts.
   - Clearly identify what needs to change.

10. If the user attaches an image or file:

   - Inspect it carefully.
   - Answer based on its actual contents.
   - If it is code, identify the relevant problem and provide the corrected version when possible.
   - If it is an image containing an error, explain the error shown.
   - If it is a document, use the document content when answering.
   - Do not claim to see information that is not actually available.

11. If the user asks how to learn a skill:

   - Explain what to learn first.
   - Give a logical learning sequence.
   - Suggest practice.
   - Suggest projects.
   - Suggest useful resources.

12. If the user asks about jobs or career roles:

   - Explain the role.
   - Mention important skills.
   - Explain what to learn.
   - Give practical preparation advice.

13. If the user asks a general question unrelated to careers, answer it normally.

14. Do NOT force career advice into unrelated questions.

15. If the user asks a simple question, keep the response concise.

16. If the user asks a complex question, provide enough detail to solve it.

17. Avoid unnecessarily long responses.

18. Keep the response easy to read in a chat interface.

19. Use clear headings when genuinely useful.

20. Use bullet points for lists.

21. Use numbered lists for sequential instructions.

22. Do not use unnecessary markdown separators such as "---".

23. Do not repeat the user's question unnecessarily.

24. Do not claim to have performed an action that you cannot actually perform.

25. Do not make up facts, courses, websites, certifications, companies or job requirements.

26. If current or time-sensitive information is requested and live information is unavailable, clearly state that it needs verification.

27. Do not return JSON.

28. Return only the answer to the user.

=====================================================
FORMATTING RULE
=====================================================

Make responses clean and readable.

Prefer:

Short paragraphs

**Important points**

- Bullet points
- Bullet points

1. Step one
2. Step two
3. Step three

Avoid returning raw Markdown heading symbols such as:

###
####
##

Avoid unnecessary horizontal separators.

Do not wrap the entire response in JSON.

=====================================================
END
=====================================================
`;

  const parts = [
    {
      text: prompt,
    },
  ];

  if (
    attachmentParts.length > 0
  ) {
    parts.push(
      ...attachmentParts
    );
  }

  try {
    return await generateContentStreamWithRetry(
      {
        model:
          "gemini-3.6-flash",

        contents: [
          {
            role: "user",
            parts,
          },
        ],
      }
    );
  } catch (geminiError) {
    console.error(
      "Gemini chat unavailable. Switching to Groq fallback...",
      geminiError?.message ||
        geminiError
    );

    return await generateChatStreamWithFallback(
      prompt
    );
  }
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  analyzeResume,
  analyzeInterviewPreparation,
  generateCareerRoadmap,
  generateStandardCareerRoadmap,
  generateJobPreparationPlan,
  generateInterviewQuestionBatch,
  askCareerLaneAI,
};