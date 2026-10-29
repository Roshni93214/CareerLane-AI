
/**
 * CareerLane — Editable Resume Canvas Templates
 *
 * These templates use the same canvas element structure as
 * EditResumePage.tsx, without importing that page.
 *
 * A template is made of editable text and shape elements,
 * not a flattened screenshot.
 */

export type CanvasResumeAlign = "left" | "center" | "right";

type CanvasResumeBaseElement = {
  id: string;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
};

export type CanvasResumeTextElement = CanvasResumeBaseElement & {
  type: "text";
  width: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fill: string;
  align: CanvasResumeAlign;
  lineHeight: number;
};

export type CanvasResumeRectElement = CanvasResumeBaseElement & {
  type: "rect";
  width: number;
  height: number;
  fill: string;
  cornerRadius: number;
  stroke: string;
  strokeWidth: number;
  shapeKind?: "line" | "rectangle" | "circle";
};

export type CanvasResumeElement =
  | CanvasResumeTextElement
  | CanvasResumeRectElement;

export type CanvasResumeDocument = {
  background: string;
  elements: CanvasResumeElement[];
};

export type CanvasResumeTemplate = {
  id: string;
  name: string;
  category: string;
  description: string;
  build: () => CanvasResumeDocument;
};

type TextStyle = Partial<
  Pick<
    CanvasResumeTextElement,
    | "fontSize"
    | "fontFamily"
    | "bold"
    | "italic"
    | "underline"
    | "fill"
    | "align"
    | "lineHeight"
  >
>;

const uid = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `resume-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

function text(
  x: number,
  y: number,
  width: number,
  value: string,
  style: TextStyle = {},
): CanvasResumeTextElement {
  return {
    id: uid(),
    type: "text",
    x,
    y,
    width,
    text: value,
    rotation: 0,
    opacity: 1,
    fontSize: style.fontSize ?? 11,
    fontFamily: style.fontFamily ?? "Arial",
    bold: style.bold ?? false,
    italic: style.italic ?? false,
    underline: style.underline ?? false,
    fill: style.fill ?? "#263238",
    align: style.align ?? "left",
    lineHeight: style.lineHeight ?? 1.25,
  };
}

function shape(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  options: {
    cornerRadius?: number;
    shapeKind?: "line" | "rectangle" | "circle";
  } = {},
): CanvasResumeRectElement {
  return {
    id: uid(),
    type: "rect",
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    fill,
    cornerRadius: options.cornerRadius ?? 0,
    stroke: fill,
    strokeWidth: 0,
    shapeKind: options.shapeKind ?? "rectangle",
  };
}

function rule(
  x: number,
  y: number,
  width: number,
  color: string,
  thickness = 2,
): CanvasResumeRectElement {
  return shape(x, y, width, thickness, color, {
    shapeKind: "line",
  });
}

function section(
  x: number,
  y: number,
  width: number,
  title: string,
  accent: string,
  options: {
    fontSize?: number;
    fontFamily?: string;
    fill?: string;
    ruleWidth?: number;
  } = {},
): CanvasResumeElement[] {
  return [
    text(x, y, width, title, {
      fontSize: options.fontSize ?? 12,
      fontFamily: options.fontFamily ?? "Arial",
      bold: true,
      fill: options.fill ?? accent,
    }),
    rule(
      x,
      y + 21,
      options.ruleWidth ?? width,
      accent,
      1.5,
    ),
  ];
}

const contact =
  "email@example.com  |  +91 98765 43210  |  Mumbai, India";

const summary =
  "Write a concise professional summary highlighting your skills, relevant experience and career goals.";

const experience =
  "Software Developer Intern | Company Name | 2025–2026\nDescribe your responsibilities, achievements and technologies used.";

const project =
  "Project Name — Explain the problem solved, your contribution and the technologies used.";

const skills =
  "JavaScript  •  React  •  Node.js  •  MongoDB  •  SQL  •  Git";

const education =
  "Degree / Course — College or University Name | Graduation Year";

function buildClassic(): CanvasResumeDocument {
  const accent = "#244B70";

  return {
    background: "#FFFFFF",
    elements: [
      text(54, 44, 686, "YOUR NAME", {
        fontSize: 30,
        bold: true,
        fill: "#1D2D3D",
      }),
      text(54, 84, 686, "SOFTWARE DEVELOPER", {
        fontSize: 12,
        bold: true,
        fill: accent,
      }),
      text(54, 110, 686, contact, {
        fontSize: 9,
        fill: "#596579",
      }),
      rule(54, 140, 686, accent, 3),

      ...section(54, 164, 686, "PROFESSIONAL SUMMARY", accent),
      text(54, 193, 686, summary),

      ...section(54, 253, 686, "TECHNICAL SKILLS", accent),
      text(54, 282, 686, skills),

      ...section(54, 335, 686, "EXPERIENCE", accent),
      text(54, 364, 686, experience, {
        lineHeight: 1.5,
      }),
      text(54, 423, 686, "Additional Role | Organization | Dates", {
        fontSize: 11,
        bold: true,
      }),
      text(
        54,
        444,
        686,
        "Add a second relevant work experience or internship.",
      ),

      ...section(54, 504, 686, "PROJECTS", accent),
      text(54, 533, 686, project, {
        lineHeight: 1.45,
      }),
      text(54, 582, 686, "Second Project — Add its description and tech stack."),

      ...section(54, 642, 686, "EDUCATION", accent),
      text(54, 671, 686, education),

      ...section(54, 727, 686, "CERTIFICATIONS", accent),
      text(54, 756, 686, "Certification Name | Issuing Organization | Year"),
    ],
  };
}

function buildModernSidebar(): CanvasResumeDocument {
  const navy = "#183B56";
  const blue = "#3D8BBD";

  return {
    background: "#FFFFFF",
    elements: [
      shape(0, 0, 238, 1123, navy),
      shape(0, 0, 238, 10, blue),

      text(25, 44, 185, "CONTACT", {
        fontSize: 12,
        bold: true,
        fill: "#86D4F2",
      }),
      rule(25, 66, 184, "#86D4F2", 1.5),
      text(25, 81, 185, "Email\nemail@example.com\n\nPhone\n+91 98765 43210\n\nLocation\nMumbai, India", {
        fontSize: 10,
        fill: "#FFFFFF",
        lineHeight: 1.5,
      }),

      text(25, 251, 185, "CORE SKILLS", {
        fontSize: 12,
        bold: true,
        fill: "#86D4F2",
      }),
      rule(25, 273, 184, "#86D4F2", 1.5),
      text(25, 288, 185, "JavaScript\nReact.js\nNode.js\nExpress.js\nMongoDB\nMySQL\nGit & GitHub", {
        fontSize: 10,
        fill: "#FFFFFF",
        lineHeight: 1.7,
      }),

      text(25, 450, 185, "EDUCATION", {
        fontSize: 12,
        bold: true,
        fill: "#86D4F2",
      }),
      rule(25, 472, 184, "#86D4F2", 1.5),
      text(25, 488, 185, "Degree / Course\nCollege Name\nGraduation Year", {
        fontSize: 10,
        fill: "#FFFFFF",
        lineHeight: 1.6,
      }),

      text(270, 55, 470, "YOUR NAME", {
        fontSize: 30,
        bold: true,
        fill: navy,
      }),
      text(270, 97, 470, "FULL STACK DEVELOPER", {
        fontSize: 12,
        bold: true,
        fill: blue,
      }),
      rule(270, 128, 470, blue, 3),

      ...section(270, 157, 470, "PROFILE", blue),
      text(270, 186, 470, summary, {
        lineHeight: 1.45,
      }),

      ...section(270, 250, 470, "EXPERIENCE", blue),
      text(270, 279, 470, experience, {
        lineHeight: 1.45,
      }),
      text(270, 348, 470, "SECOND ROLE | ORGANIZATION", {
        fontSize: 11,
        bold: true,
      }),
      text(270, 369, 470, "Add measurable achievements and responsibilities."),

      ...section(270, 420, 470, "SELECTED PROJECTS", blue),
      text(270, 449, 470, project, {
        lineHeight: 1.45,
      }),
      text(270, 509, 470, "Second Project — Briefly describe your contribution."),

      ...section(270, 569, 470, "CERTIFICATIONS", blue),
      text(270, 598, 470, "Certification | Issuer | Year"),
    ],
  };
}

function buildMinimal(): CanvasResumeDocument {
  const dark = "#252525";
  const muted = "#777777";

  return {
    background: "#FFFFFF",
    elements: [
      text(64, 57, 666, "Your Name", {
        fontSize: 33,
        fontFamily: "Georgia",
        fill: dark,
      }),
      text(64, 103, 666, "Professional Title", {
        fontSize: 13,
        fontFamily: "Georgia",
        italic: true,
        fill: muted,
      }),
      text(64, 137, 666, contact, {
        fontSize: 9,
        fill: muted,
      }),
      rule(64, 169, 666, "#B9B9B9", 1),

      text(64, 199, 666, "PROFILE", {
        fontSize: 10,
        bold: true,
        fill: muted,
      }),
      text(64, 222, 666, summary, {
        fontFamily: "Georgia",
        fontSize: 12,
        lineHeight: 1.45,
      }),

      text(64, 295, 666, "EXPERIENCE", {
        fontSize: 10,
        bold: true,
        fill: muted,
      }),
      rule(64, 318, 666, "#D8D8D8", 1),
      text(64, 332, 666, experience, {
        fontFamily: "Georgia",
        fontSize: 12,
        lineHeight: 1.55,
      }),

      text(64, 422, 666, "PROJECTS", {
        fontSize: 10,
        bold: true,
        fill: muted,
      }),
      rule(64, 445, 666, "#D8D8D8", 1),
      text(64, 459, 666, project, {
        fontFamily: "Georgia",
        fontSize: 12,
        lineHeight: 1.5,
      }),

      text(64, 534, 666, "EDUCATION", {
        fontSize: 10,
        bold: true,
        fill: muted,
      }),
      rule(64, 557, 666, "#D8D8D8", 1),
      text(64, 571, 666, education, {
        fontFamily: "Georgia",
        fontSize: 12,
      }),

      text(64, 626, 666, "SKILLS", {
        fontSize: 10,
        bold: true,
        fill: muted,
      }),
      rule(64, 649, 666, "#D8D8D8", 1),
      text(64, 663, 666, skills, {
        fontFamily: "Georgia",
        fontSize: 12,
      }),
    ],
  };
}

function buildExecutive(): CanvasResumeDocument {
  const navy = "#202E42";
  const gold = "#BE9855";

  return {
    background: "#FFFFFF",
    elements: [
      shape(0, 0, 794, 202, navy),

      text(55, 43, 680, "YOUR NAME", {
        fontSize: 31,
        bold: true,
        fill: "#FFFFFF",
        fontFamily: "Georgia",
      }),
      text(55, 88, 680, "BUSINESS / TECHNOLOGY PROFESSIONAL", {
        fontSize: 12,
        fill: "#E8EAF0",
      }),
      text(55, 119, 680, contact, {
        fontSize: 9,
        fill: "#FFFFFF",
      }),
      rule(55, 162, 680, gold, 4),

      ...section(55, 236, 680, "EXECUTIVE PROFILE", gold, {
        fontFamily: "Georgia",
        fontSize: 13,
      }),
      text(55, 266, 680, summary, {
        fontSize: 11,
        lineHeight: 1.45,
      }),

      ...section(55, 334, 680, "PROFESSIONAL EXPERIENCE", gold, {
        fontFamily: "Georgia",
        fontSize: 13,
      }),
      text(55, 364, 680, experience, {
        lineHeight: 1.5,
      }),
      text(55, 431, 680, "Previous Position | Organization | Dates", {
        fontSize: 11,
        bold: true,
      }),
      text(55, 454, 680, "Add responsibilities, leadership and measurable impact."),

      ...section(55, 515, 680, "EDUCATION & CREDENTIALS", gold, {
        fontFamily: "Georgia",
        fontSize: 13,
      }),
      text(55, 545, 680, education),
      text(55, 588, 680, "Certifications, awards or professional memberships"),

      ...section(55, 650, 680, "CORE COMPETENCIES", gold, {
        fontFamily: "Georgia",
        fontSize: 13,
      }),
      text(55, 680, 680, skills),
    ],
  };
}

function buildCreative(): CanvasResumeDocument {
  const purple = "#6D3CC4";
  const coral = "#F0A18B";
  const ink = "#28213A";

  return {
    background: "#FFFCFA",
    elements: [
      shape(0, 0, 17, 1123, purple),
      shape(52, 43, 690, 151, purple),

      text(78, 68, 640, "YOUR NAME", {
        fontSize: 31,
        bold: true,
        fill: "#FFFFFF",
      }),
      text(78, 111, 640, "CREATIVE / DIGITAL PROFESSIONAL", {
        fontSize: 12,
        bold: true,
        fill: "#F5EFFF",
      }),
      text(78, 145, 640, contact, {
        fontSize: 9,
        fill: "#FFFFFF",
      }),

      shape(52, 229, 10, 10, coral, {
        shapeKind: "circle",
        cornerRadius: 5,
      }),
      text(77, 223, 640, "ABOUT ME", {
        fontSize: 13,
        bold: true,
        fill: purple,
      }),
      text(77, 251, 640, summary, {
        fill: ink,
        lineHeight: 1.45,
      }),

      shape(52, 324, 10, 10, coral, {
        shapeKind: "circle",
        cornerRadius: 5,
      }),
      text(77, 318, 640, "EXPERIENCE", {
        fontSize: 13,
        bold: true,
        fill: purple,
      }),
      text(77, 346, 640, experience, {
        fill: ink,
        lineHeight: 1.5,
      }),

      shape(52, 428, 10, 10, coral, {
        shapeKind: "circle",
        cornerRadius: 5,
      }),
      text(77, 422, 640, "FEATURED PROJECTS", {
        fontSize: 13,
        bold: true,
        fill: purple,
      }),
      text(77, 450, 640, project, {
        fill: ink,
        lineHeight: 1.45,
      }),

      shape(52, 531, 10, 10, coral, {
        shapeKind: "circle",
        cornerRadius: 5,
      }),
      text(77, 525, 640, "EDUCATION", {
        fontSize: 13,
        bold: true,
        fill: purple,
      }),
      text(77, 553, 640, education, {
        fill: ink,
      }),

      shape(52, 611, 10, 10, coral, {
        shapeKind: "circle",
        cornerRadius: 5,
      }),
      text(77, 605, 640, "SKILLS & TOOLS", {
        fontSize: 13,
        bold: true,
        fill: purple,
      }),
      text(77, 633, 640, skills, {
        fill: ink,
      }),
    ],
  };
}

function buildTech(): CanvasResumeDocument {
  const navy = "#101D32";
  const blue = "#2875E2";
  const ink = "#25354B";
  const muted = "#65758B";

  return {
    background: "#FFFFFF",
    elements: [
      shape(0, 0, 794, 14, blue),
      shape(0, 14, 794, 168, navy),

      text(48, 42, 690, "YOUR NAME", {
        fontSize: 29,
        bold: true,
        fill: "#FFFFFF",
      }),
      text(48, 83, 690, "SOFTWARE / FULL STACK DEVELOPER", {
        fontSize: 12,
        bold: true,
        fill: "#77B6FF",
      }),
      text(48, 115, 690, contact, {
        fontSize: 9,
        fill: "#FFFFFF",
      }),

      text(48, 210, 320, "PROFILE", {
        fontSize: 12,
        bold: true,
        fill: blue,
      }),
      rule(48, 233, 320, blue, 2),
      text(48, 246, 320, summary, {
        fill: ink,
        lineHeight: 1.45,
      }),

      text(415, 210, 330, "TECH STACK", {
        fontSize: 12,
        bold: true,
        fill: blue,
      }),
      rule(415, 233, 330, blue, 2),
      text(415, 246, 330, skills, {
        fill: ink,
        lineHeight: 1.5,
      }),

      text(48, 345, 697, "EXPERIENCE", {
        fontSize: 12,
        bold: true,
        fill: blue,
      }),
      rule(48, 368, 697, blue, 2),
      text(48, 382, 697, experience, {
        fill: ink,
        lineHeight: 1.5,
      }),
      text(48, 450, 697, "Additional Role | Company | Dates", {
        fontSize: 11,
        bold: true,
      }),
      text(48, 473, 697, "Describe your work, tools used and outcomes achieved.", {
        fill: muted,
      }),

      text(48, 530, 320, "PROJECTS", {
        fontSize: 12,
        bold: true,
        fill: blue,
      }),
      rule(48, 553, 320, blue, 2),
      text(48, 567, 320, project, {
        fill: ink,
        lineHeight: 1.45,
      }),

      text(415, 530, 330, "EDUCATION", {
        fontSize: 12,
        bold: true,
        fill: blue,
      }),
      rule(415, 553, 330, blue, 2),
      text(415, 567, 330, education, {
        fill: ink,
        lineHeight: 1.5,
      }),

      text(48, 660, 697, "CERTIFICATIONS & ACHIEVEMENTS", {
        fontSize: 12,
        bold: true,
        fill: blue,
      }),
      rule(48, 683, 697, blue, 2),
      text(48, 697, 697, "Certification Name | Award or Achievement | Year", {
        fill: ink,
      }),
    ],
  };
}

/**
 * This catalogue will be used by the gallery in a later step.
 * Each call to build() generates fresh element IDs.
 */

export const CANVAS_RESUME_TEMPLATES: CanvasResumeTemplate[] = [
  {
    id: "classic",
    name: "ATS Classic",
    category: "ATS-Friendly",
    description: "Single-column, clean and recruiter-friendly layout.",
    build: buildClassic,
  },
  {
    id: "modern",
    name: "Modern Sidebar",
    category: "Modern",
    description: "Dark sidebar for contact, skills and education.",
    build: buildModernSidebar,
  },
  {
    id: "minimal",
    name: "Minimal",
    category: "Minimal",
    description: "Elegant typography, white space and fine dividers.",
    build: buildMinimal,
  },
  {
    id: "executive",
    name: "Executive",
    category: "Professional",
    description: "Formal header with refined gold accents.",
    build: buildExecutive,
  },
  {
    id: "creative",
    name: "Creative",
    category: "Creative",
    description: "Colourful header and distinctive section markers.",
    build: buildCreative,
  },
  {
    id: "tech",
    name: "Tech Resume",
    category: "Technology",
    description: "Modern technical resume with a two-column section.",
    build: buildTech,
  },
];

export function buildCanvasResumeTemplate(
  id: string,
): CanvasResumeDocument | null {
  const template = CANVAS_RESUME_TEMPLATES.find(
    (item) => item.id === id,
  );

  return template ? template.build() : null;
}

export function getCanvasResumeTemplate(
  id: string,
): CanvasResumeTemplate | undefined {
  return CANVAS_RESUME_TEMPLATES.find(
    (item) => item.id === id,
  );
}
