export type ResumeTemplate = {
  id: string;
  name: string;
  category: string;
  description: string;
  variant: string;
  accent: string;
};

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: "classic",
    name: "Classic Professional",
    category: "Professional",
    description: "Clean and traditional resume layout.",
    variant: "classic",
    accent: "#173f5f",
  },

  {
    id: "modern",
    name: "Modern Professional",
    category: "Modern",
    description: "Modern layout with strong visual hierarchy.",
    variant: "modern",
    accent: "#0b5552",
  },

  {
    id: "minimal",
    name: "Minimal",
    category: "Minimal",
    description: "Simple, clean and distraction-free design.",
    variant: "minimal",
    accent: "#333333",
  },

  {
    id: "executive",
    name: "Executive",
    category: "Professional",
    description: "Elegant design for experienced professionals.",
    variant: "executive",
    accent: "#6b4f2a",
  },

  {
    id: "creative",
    name: "Creative",
    category: "Creative",
    description: "Stylish resume with a distinctive layout.",
    variant: "creative",
    accent: "#7b3f98",
  },

  {
    id: "tech",
    name: "Tech Resume",
    category: "Technology",
    description: "Structured design for technical professionals.",
    variant: "tech",
    accent: "#2563eb",
  },
];

export const getResumeTemplate = (
  id: string
): ResumeTemplate | undefined => {
  return RESUME_TEMPLATES.find(
    (template) => template.id === id
  );
};