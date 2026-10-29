
import type { LayoutId } from "./themes";
import { THEMES } from "./themes";

/**
 * CareerLane native HTML adaptations of the layout styles shown
 * in the Reactive Resume template gallery.
 *
 * These return editable document HTML, not flattened screenshots.
 * Original template names are retained to identify the references.
 */

export type ResumeDesign = {
  id: string;
  name: string;
  keywords: string;
  themeId: string;
  layoutId: LayoutId;
  build: () => string;
};

type Palette = {
  primary: string;
  accent: string;
  light: string;
  sidebar: string;
  ink: string;
  muted: string;
  headingFont: string;
  bodyFont: string;
};

type LayoutKind =
  | "left-sidebar"
  | "full-width"
  | "right-sidebar"
  | "pink-banner"
  | "dark-sidebar"
  | "soft-sidebar"
  | "centered"
  | "cards"
  | "green-banner"
  | "minimal"
  | "gold-sidebar"
  | "right-header"
  | "blue-sidebar"
  | "editorial"
  | "red-header"
  | "tech-grid"
  | "creative-grid";

type Definition = ResumeDesign & {
  layout: LayoutKind;
  palette: Palette;
};

const palettes: Record<string, Palette> = {
  azurill: {
    primary: "#087E91",
    accent: "#35A9B8",
    light: "#E8F5F7",
    sidebar: "#F4FAFA",
    ink: "#263746",
    muted: "#647481",
    headingFont: "Arial",
    bodyFont: "Arial",
  },
  bronzor: {
    primary: "#374151",
    accent: "#9CA3AF",
    light: "#F3F4F6",
    sidebar: "#F9FAFB",
    ink: "#222831",
    muted: "#6B7280",
    headingFont: "Georgia",
    bodyFont: "Arial",
  },
  chikorita: {
    primary: "#167454",
    accent: "#75B59A",
    light: "#E9F5EE",
    sidebar: "#167454",
    ink: "#20362C",
    muted: "#64756A",
    headingFont: "Georgia",
    bodyFont: "Arial",
  },
  ditto: {
    primary: "#CD4596",
    accent: "#E8A6CA",
    light: "#FBEAF4",
    sidebar: "#FFF4F9",
    ink: "#342630",
    muted: "#836A79",
    headingFont: "Georgia",
    bodyFont: "Arial",
  },
  gengar: {
    primary: "#5520A7",
    accent: "#BCA3E7",
    light: "#EEE6FA",
    sidebar: "#54209A",
    ink: "#2D2339",
    muted: "#6C6280",
    headingFont: "Georgia",
    bodyFont: "Arial",
  },
  glalie: {
    primary: "#446B76",
    accent: "#A9C8CC",
    light: "#E6F0F1",
    sidebar: "#DFEAEC",
    ink: "#28393C",
    muted: "#65787B",
    headingFont: "Georgia",
    bodyFont: "Arial",
  },
  kakuna: {
    primary: "#9C7B24",
    accent: "#D7C17B",
    light: "#F9F4E5",
    sidebar: "#FFFCF3",
    ink: "#383326",
    muted: "#7C7157",
    headingFont: "Georgia",
    bodyFont: "Arial",
  },
  lapras: {
    primary: "#167EAC",
    accent: "#67BED6",
    light: "#EDF7FB",
    sidebar: "#F7FBFD",
    ink: "#253A48",
    muted: "#637A88",
    headingFont: "Arial",
    bodyFont: "Arial",
  },
  leafish: {
    primary: "#537C36",
    accent: "#A5C782",
    light: "#EEF5E6",
    sidebar: "#E0ECCC",
    ink: "#2E3C28",
    muted: "#6B7962",
    headingFont: "Arial",
    bodyFont: "Arial",
  },
  onyx: {
    primary: "#242424",
    accent: "#777777",
    light: "#F2F2F2",
    sidebar: "#FAFAFA",
    ink: "#222222",
    muted: "#666666",
    headingFont: "Georgia",
    bodyFont: "Arial",
  },
  pikachu: {
    primary: "#A98924",
    accent: "#D9C36B",
    light: "#FAF5DD",
    sidebar: "#FFFCEF",
    ink: "#373321",
    muted: "#796F4D",
    headingFont: "Georgia",
    bodyFont: "Arial",
  },
  rhyhorn: {
    primary: "#414141",
    accent: "#929292",
    light: "#F4F4F4",
    sidebar: "#FAFAFA",
    ink: "#242424",
    muted: "#707070",
    headingFont: "Georgia",
    bodyFont: "Arial",
  },
  ditgar: {
    primary: "#0786BA",
    accent: "#45B6D9",
    light: "#E1F3FA",
    sidebar: "#CDEAF5",
    ink: "#213944",
    muted: "#617983",
    headingFont: "Georgia",
    bodyFont: "Arial",
  },
  meowth: {
    primary: "#996B28",
    accent: "#D4B57B",
    light: "#F7F0E2",
    sidebar: "#FCF8EF",
    ink: "#332D24",
    muted: "#776C5B",
    headingFont: "Georgia",
    bodyFont: "Georgia",
  },
  scizor: {
    primary: "#B72C35",
    accent: "#E98D91",
    light: "#FAECEC",
    sidebar: "#FFF8F8",
    ink: "#37282A",
    muted: "#80696A",
    headingFont: "Arial",
    bodyFont: "Arial",
  },
  porygon: {
    primary: "#5146B5",
    accent: "#A7A0F2",
    light: "#EEEDFD",
    sidebar: "#F5F3FF",
    ink: "#302C4D",
    muted: "#77718F",
    headingFont: "Arial",
    bodyFont: "Arial",
  },
  smeargle: {
    primary: "#315FAD",
    accent: "#D37B45",
    light: "#F8F1E8",
    sidebar: "#F9F7F2",
    ink: "#2B3444",
    muted: "#6A7180",
    headingFont: "Arial",
    bodyFont: "Arial",
  },
};

const para = (html: string, extra = "") =>
  `<p style="font-family:Arial,sans-serif;font-size:10pt;line-height:1.4;margin:0 0 7px;${extra}">${html}</p>`;

const heading = (
  label: string,
  p: Palette,
  variant: "line" | "bar" | "left" | "plain" = "line",
) => {
  const base = `font-family:${p.headingFont};font-size:12pt;font-weight:bold;margin:13px 0 6px;color:${p.primary};`;

  if (variant === "bar") {
    return `<h2 style="${base}background-color:${p.light};padding:6px 8px;border:0">${label}</h2>`;
  }

  if (variant === "left") {
    return `<h2 style="${base}border-left:4px solid ${p.accent};padding-left:8px;border-bottom:0">${label}</h2>`;
  }

  if (variant === "plain") {
    return `<h2 style="${base}border:0">${label}</h2>`;
  }

  return `<h2 style="${base}border-bottom:1px solid ${p.accent};padding-bottom:4px">${label}</h2>`;
};

const identity = (
  p: Palette,
  align: "left" | "center" = "left",
  size = 25,
) =>
  `<h1 style="font-family:${p.headingFont};font-size:${size}pt;font-weight:bold;line-height:1.15;margin:0 0 4px;color:${p.primary};text-align:${align}">YOUR NAME</h1>` +
  `<p style="font-family:${p.bodyFont};font-size:11pt;margin:0 0 7px;color:${p.ink};text-align:${align}">Professional Title / Target Role</p>`;

const contact = (p: Palette, align: "left" | "center" = "left") =>
  para(
    "you@example.com&nbsp; | &nbsp;+91 98765 43210&nbsp; | &nbsp;City, India<br>LinkedIn URL&nbsp; | &nbsp;Portfolio / GitHub",
    `font-size:9pt;color:${p.muted};text-align:${align}`,
  );

const summary = (p: Palette, variant: "line" | "bar" | "left" | "plain" = "line") =>
  heading("PROFESSIONAL SUMMARY", p, variant) +
  para(
    "Write a concise 2–3 line summary describing your relevant experience, strongest skills and career direction.",
    `color:${p.ink}`,
  );

const skills = (p: Palette, variant: "line" | "bar" | "left" | "plain" = "line") =>
  heading("TECHNICAL SKILLS", p, variant) +
  para("<strong>Languages:</strong> Add your programming languages") +
  para("<strong>Frameworks:</strong> Add your frameworks and libraries") +
  para("<strong>Tools:</strong> Add databases, Git and development tools");

const experience = (p: Palette, variant: "line" | "bar" | "left" | "plain" = "line") =>
  heading("PROFESSIONAL EXPERIENCE", p, variant) +
  para(`<strong>Role Title — Company Name</strong><br><span style="color:${p.muted}">City · Start Year – Present</span>`, "margin-bottom:3px") +
  `<ul style="font-family:${p.bodyFont};font-size:10pt;line-height:1.35;margin:0 0 8px;padding-left:20px"><li><p>Describe a responsibility or achievement relevant to the target role.</p></li><li><p>Add a second achievement and include measurable results where possible.</p></li></ul>` +
  para(`<strong>Previous Role — Organisation Name</strong><br><span style="color:${p.muted}">City · Start Year – End Year</span>`, "margin-bottom:3px") +
  `<ul style="font-family:${p.bodyFont};font-size:10pt;line-height:1.35;margin:0 0 8px;padding-left:20px"><li><p>Describe the work you performed and tools you used.</p></li></ul>`;

const education = (p: Palette, variant: "line" | "bar" | "left" | "plain" = "line") =>
  heading("EDUCATION", p, variant) +
  para(`<strong>Degree / Course Name</strong><br>University or Institution · Graduation Year`) +
  para("Add relevant coursework, grades or academic achievements if useful.", `color:${p.muted}`);

const projects = (p: Palette, variant: "line" | "bar" | "left" | "plain" = "line") =>
  heading("PROJECTS", p, variant) +
  para("<strong>Project Name</strong> — Add a brief description of the problem solved, your contribution and the technology stack.") +
  para("<strong>Second Project</strong> — Describe a relevant project and link its source code or live demo.");

const certifications = (p: Palette, variant: "line" | "bar" | "left" | "plain" = "line") =>
  heading("CERTIFICATIONS", p, variant) +
  para("Certification Name · Issuing Organisation · Year") +
  para("Add another relevant certification or achievement.");

const additional = (p: Palette, variant: "line" | "bar" | "left" | "plain" = "line") =>
  heading("ADDITIONAL INFORMATION", p, variant) +
  para("Languages · Relevant interests · Volunteering · Awards");

const experienceCompact = (p: Palette) =>
  heading("EXPERIENCE", p) +
  para("<strong>Role Title — Company Name</strong> <span style='color:#777'>| Dates</span>") +
  para("Add two concise achievement statements related to this position.") +
  para("<strong>Previous Role — Organisation</strong> <span style='color:#777'>| Dates</span>") +
  para("Add one or two concise, relevant achievement statements.");

function cell(html: string, style = "") {
  return `<td style="vertical-align:top;padding:10px;${style}">${html}</td>`;
}

function columns(
  left: string,
  right: string,
  p: Palette,
  leftWidth = "33%",
  leftStyle = `background-color:${p.sidebar};`,
  rightStyle = "background-color:#FFFFFF;",
) {
  return `<table style="width:100%;border-collapse:collapse;table-layout:fixed"><tbody><tr>${cell(
    left,
    `width:${leftWidth};${leftStyle}`,
  )}${cell(right, `width:${100 - Number.parseFloat(leftWidth)}%;${rightStyle}`)}</tr></tbody></table>`;
}

function profileHeader(p: Palette, accentBand = false) {
  return `<table style="width:100%;border-collapse:collapse"><tbody><tr>${cell(
    identity(p),
    `width:70%;${accentBand ? `background-color:${p.primary};` : ""}`,
  )}${cell(
    para("CONTACT", `font-weight:bold;color:${accentBand ? "#FFFFFF" : p.primary}`) +
      para("you@example.com<br>+91 98765 43210<br>City, India<br>LinkedIn / Portfolio", `color:${accentBand ? "#FFFFFF" : p.muted};font-size:9pt`),
    `width:30%;${accentBand ? `background-color:${p.primary};` : ""}`,
  )}</tr></tbody></table>`;
}

function leftSidebar(p: Palette, dark = false) {
  const fg = dark ? "#FFFFFF" : p.ink;
  const side = dark ? p.sidebar : p.light;
  const sidePalette: Palette = { ...p, primary: dark ? "#FFFFFF" : p.primary, ink: fg, muted: dark ? "#F1EAF9" : p.muted };

  const sideHtml =
    identity(sidePalette, "left", 20) +
    para("CONTACT", `color:${dark ? p.accent : p.primary};font-weight:bold`) +
    para("you@example.com<br>+91 98765 43210<br>City, India<br>LinkedIn / Portfolio", `color:${fg};font-size:9pt`) +
    skills(sidePalette, "plain") +
    education(sidePalette, "plain") +
    certifications(sidePalette, "plain");

  const mainHtml =
    summary(p, "line") +
    experience(p, "line") +
    projects(p, "line") +
    additional(p, "line");

  return columns(
    sideHtml,
    mainHtml,
    p,
    "34%",
    `background-color:${side};color:${fg};`,
    "background-color:#FFFFFF;",
  );
}

function rightSidebar(p: Palette) {
  const side =
    para("CONTACT", "font-weight:bold") +
    contact(p) +
    skills(p, "plain") +
    education(p, "plain") +
    certifications(p, "plain") +
    additional(p, "plain");

  const main =
    identity(p) +
    summary(p) +
    experience(p) +
    projects(p);

  return columns(main, side, p, "66%", "background-color:#FFFFFF;", `background-color:${p.sidebar};`);
}

function centeredLayout(p: Palette, gold = false) {
  const top =
    identity(p, "center", 28) +
    contact(p, "center") +
    `<p style="text-align:center;color:${p.accent};margin:10px 0 14px">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>`;

  return top +
    summary(p, gold ? "plain" : "line") +
    heading("ONLINE PRESENCE", p, gold ? "plain" : "line") +
    para("LinkedIn URL · Portfolio · GitHub") +
    skills(p, gold ? "plain" : "line") +
    education(p, gold ? "plain" : "line") +
    experience(p, gold ? "plain" : "line") +
    projects(p, gold ? "plain" : "line") +
    certifications(p, gold ? "plain" : "line");
}

function bannerLayout(p: Palette) {
  const header =
    `<table style="width:100%;border-collapse:collapse"><tbody><tr>${cell(
      identity(p, "left", 26) + contact(p),
      `background-color:${p.primary};color:#FFFFFF;padding:18px;`,
    )}</tr></tbody></table>`;

  const sidebar =
    certifications(p, "plain") +
    skills(p, "plain") +
    education(p, "plain") +
    additional(p, "plain");

  const main =
    summary(p, "left") +
    experience(p, "left") +
    projects(p, "left");

  return header + columns(sidebar, main, p, "32%", `background-color:${p.sidebar};`, "background-color:#FFFFFF;");
}

function cardsLayout(p: Palette) {
  const card = (title: string, content: string) =>
    `<table style="width:100%;border-collapse:collapse"><tbody><tr>${cell(
      `<h2 style="font-family:${p.headingFont};font-size:12pt;color:${p.primary};margin:0 0 7px">${title}</h2>${content}`,
      `border:1px solid ${p.accent};border-radius:8px;padding:12px;background-color:#FFFFFF;`,
    )}</tr></tbody></table>`;

  return (
    `<table style="width:100%;border-collapse:collapse"><tbody><tr>${cell(
      identity(p, "left", 24) + contact(p),
      `background-color:${p.light};border:1px solid ${p.accent};padding:14px;`,
    )}</tr></tbody></table>` +
    card("PROFILE", para("Add your professional summary and career focus.")) +
    card("SKILLS", skills(p, "plain")) +
    card("EXPERIENCE", experience(p, "plain")) +
    card("PROJECTS & EDUCATION", projects(p, "plain") + education(p, "plain"))
  );
}

function minimalLayout(p: Palette) {
  return identity(p, "left", 27) +
    contact(p) +
    `<p style="border-top:1px solid ${p.accent};margin:12px 0"></p>` +
    summary(p) +
    experienceCompact(p) +
    heading("PROJECTS", p) +
    projects(p, "plain") +
    education(p) +
    skills(p) +
    certifications(p);
}

function rightHeaderLayout(p: Palette) {
  const head =
    `<table style="width:100%;border-collapse:collapse"><tbody><tr>${cell(
      identity(p) + contact(p),
      "width:75%;",
    )}${cell(
      para("PROFILE", `text-align:right;color:${p.primary};font-weight:bold`) +
        para("Professional resume<br>ATS-conscious layout<br>Editable in CareerLane", `text-align:right;color:${p.muted};font-size:9pt`),
      "width:25%;",
    )}</tr></tbody></table>`;

  return head +
    heading("ONLINE PRESENCE", p) +
    para("LinkedIn URL · GitHub · Portfolio") +
    summary(p) +
    skills(p) +
    experience(p) +
    education(p) +
    projects(p) +
    certifications(p);
}

function editorialLayout(p: Palette) {
  const left =
    heading("PROFILE", p, "plain") +
    para("Write a short professional introduction with your specialisation and career focus.", `font-family:${p.headingFont}`) +
    education(p, "plain") +
    skills(p, "plain") +
    certifications(p, "plain");

  const right =
    identity(p, "left", 28) +
    contact(p) +
    `<p style="border-top:1px solid ${p.accent};margin:10px 0"></p>` +
    experience(p, "plain") +
    projects(p, "plain") +
    additional(p, "plain");

  return columns(left, right, p, "35%", `background-color:${p.sidebar};`, "background-color:#FFFFFF;");
}

function redHeaderLayout(p: Palette) {
  const header =
    `<p style="background-color:${p.primary};padding:8px;margin:0;color:#FFFFFF">CAREERLANE · RESUME</p>` +
    identity(p, "left", 25) +
    contact(p);

  return header +
    summary(p, "bar") +
    skills(p, "line") +
    experience(p, "line") +
    projects(p, "line") +
    education(p, "line") +
    certifications(p, "line");
}

function techGridLayout(p: Palette) {
  const techSkills =
    heading("TECH STACK", p, "bar") +
    para("<strong>Frontend</strong> — React, HTML, CSS") +
    para("<strong>Backend</strong> — Node.js, Express") +
    para("<strong>Database</strong> — MongoDB, SQL") +
    para("<strong>Tools</strong> — Git, GitHub");

  const educationSkills = education(p, "bar") + certifications(p, "bar");

  const grid = `<table style="width:100%;border-collapse:collapse"><tbody><tr>${cell(
    techSkills,
    `width:50%;background-color:${p.sidebar};`,
  )}${cell(
    educationSkills,
    `width:50%;background-color:${p.light};`,
  )}</tr></tbody></table>`;

  return (
    `<p style="height:5px;background-color:${p.primary};margin:0 0 12px"></p>` +
    identity(p) +
    contact(p) +
    summary(p, "bar") +
    grid +
    experience(p, "bar") +
    projects(p, "bar")
  );
}

function creativeGridLayout(p: Palette) {
  const tag = (label: string, color: string) =>
    `<td style="padding:7px;background-color:${color};text-align:center"><p><strong>${label}</strong></p></td>`;

  const accentTags =
    `<table style="width:100%;border-collapse:collapse"><tbody><tr>${tag("PROFILE", p.light)}${tag("TECH", "#E7EFFB")}${tag("PROJECTS", "#F9EADB")}</tr></tbody></table>`;

  const left =
    skills(p, "left") +
    education(p, "left") +
    certifications(p, "left");

  const main =
    summary(p, "bar") +
    experience(p, "left") +
    projects(p, "left");

  return (
    `<p style="border-left:8px solid ${p.primary};padding-left:12px;margin:0 0 12px"></p>` +
    identity(p, "left", 27) +
    contact(p) +
    accentTags +
    columns(left, main, p, "33%", `background-color:${p.sidebar};`, "background-color:#FFFFFF;")
  );
}

function renderLayout(layout: LayoutKind, p: Palette): string {
  switch (layout) {
    case "left-sidebar":
      return leftSidebar(p);
    case "full-width":
      return identity(p, "center") + contact(p, "center") +
        summary(p) + skills(p) + experience(p) + education(p) + projects(p) + certifications(p);
    case "right-sidebar":
      return rightSidebar(p);
    case "pink-banner":
      return bannerLayout(p);
    case "dark-sidebar":
      return leftSidebar(p, true);
    case "soft-sidebar":
      return rightSidebar(p);
    case "centered":
      return centeredLayout(p, true);
    case "cards":
      return cardsLayout(p);
    case "green-banner":
      return `<p style="background-color:${p.light};padding:14px;margin:0 0 10px">${identity(p)}${contact(p)}</p>` +
        columns(
          experience(p) + projects(p),
          skills(p, "plain") + education(p, "plain") + certifications(p, "plain"),
          p,
          "65%",
          "background-color:#FFFFFF;",
          `background-color:${p.sidebar};`,
        );
    case "minimal":
      return minimalLayout(p);
    case "gold-sidebar":
      return `<p style="background-color:${p.primary};padding:12px;margin:0">${identity(p)}${contact(p)}</p>` +
        columns(
          certifications(p) + skills(p, "plain") + education(p, "plain"),
          summary(p) + experience(p) + projects(p),
          p,
          "32%",
          `background-color:${p.sidebar};`,
          "background-color:#FFFFFF;",
        );
    case "right-header":
      return rightHeaderLayout(p);
    case "blue-sidebar":
      return leftSidebar(p);
    case "editorial":
      return editorialLayout(p);
    case "red-header":
      return redHeaderLayout(p);
    case "tech-grid":
      return techGridLayout(p);
    case "creative-grid":
      return creativeGridLayout(p);
  }
}

const definitions: Omit<Definition, "build">[] = [
  { id: "azurill", name: "Azurill", keywords: "sidebar technical skills online presence teal", themeId: "teal", layoutId: "accent", layout: "left-sidebar", palette: palettes.azurill },
  { id: "bronzor", name: "Bronzor", keywords: "compact traditional horizontal single column", themeId: "slate", layoutId: "classic", layout: "full-width", palette: palettes.bronzor },
  { id: "chikorita", name: "Chikorita", keywords: "green right sidebar skills certifications", themeId: "forest", layoutId: "accent", layout: "right-sidebar", palette: palettes.chikorita },
  { id: "ditto", name: "Ditto", keywords: "pink banner split column creative", themeId: "rose", layoutId: "banner", layout: "pink-banner", palette: palettes.ditto },
  { id: "gengar", name: "Gengar", keywords: "purple dark sidebar two column", themeId: "royal", layoutId: "accent", layout: "dark-sidebar", palette: palettes.gengar },
  { id: "glalie", name: "Glalie", keywords: "pale blue gray sidebar professional", themeId: "ocean", layoutId: "classic", layout: "soft-sidebar", palette: palettes.glalie },
  { id: "kakuna", name: "Kakuna", keywords: "centered gold classic horizontal", themeId: "amber", layoutId: "classic", layout: "centered", palette: palettes.kakuna },
  { id: "lapras", name: "Lapras", keywords: "cards modern blue separated sections", themeId: "ocean", layoutId: "banner", layout: "cards", palette: palettes.lapras },
  { id: "leafish", name: "Leafish", keywords: "green banner two columns nature", themeId: "mint", layoutId: "banner", layout: "green-banner", palette: palettes.leafish },
  { id: "onyx", name: "Onyx", keywords: "monochrome black white minimalist ats", themeId: "mono", layoutId: "classic", layout: "minimal", palette: palettes.onyx },
  { id: "pikachu", name: "Pikachu", keywords: "gold sidebar bold header", themeId: "amber", layoutId: "accent", layout: "gold-sidebar", palette: palettes.pikachu },
  { id: "rhyhorn", name: "Rhyhorn", keywords: "minimal right header monochrome", themeId: "mono", layoutId: "classic", layout: "right-header", palette: palettes.rhyhorn },
  { id: "ditgar", name: "Ditgar", keywords: "blue sidebar contact skills experience", themeId: "ocean", layoutId: "accent", layout: "blue-sidebar", palette: palettes.ditgar },
  { id: "meowth", name: "Meowth", keywords: "editorial serif traditional two column", themeId: "amber", layoutId: "classic", layout: "editorial", palette: palettes.meowth },
  { id: "scizor", name: "Scizor", keywords: "red top banner clean modern", themeId: "crimson", layoutId: "banner", layout: "red-header", palette: palettes.scizor },
  { id: "porygon", name: "Porygon", keywords: "technology grid skills education blue purple", themeId: "indigo", layoutId: "accent", layout: "tech-grid", palette: palettes.porygon },
  { id: "smeargle", name: "Smeargle", keywords: "creative color tags two column portfolio", themeId: "sunset", layoutId: "accent", layout: "creative-grid", palette: palettes.smeargle },
];


type PresentationLayout = "classic" | "accent" | "banner";

function getDesignPalette(
  design: Omit<Definition, "build">,
  themeId: string,
): Palette {
  const theme = THEMES.find((item) => item.id === themeId);

  if (!theme) return design.palette;

  return {
    ...design.palette,
    primary: theme.primary,
    accent: theme.accent,
    light: theme.light,
    sidebar:
      design.layout === "dark-sidebar"
        ? theme.primary
        : theme.light,
    headingFont: theme.head,
    bodyFont: theme.body,
  };
}

/**
 * Presentation variants alter section-heading treatments and header
 * styling while preserving each base design's individual structure.
 */
function applyPresentationLayout(
  html: string,
  palette: Palette,
  layoutId: PresentationLayout,
): string {
  if (layoutId === "accent") {
    return html
      .replace(
        /border-bottom:1px solid [^;]+;padding-bottom:4px/g,
        `border-left:4px solid ${palette.accent};padding-left:8px;border-bottom:0`,
      )
      .replace(
        /background-color:[^;]+;padding:6px 8px;border:0/g,
        `background-color:${palette.light};padding:6px 8px;border-left:4px solid ${palette.accent}`,
      );
  }

  if (layoutId === "banner") {
    let result = html.replace(
      /<h1 style="/,
      `<h1 style="border-top:5px solid ${palette.primary};padding-top:8px;`,
    );

    result =
      `<p style="height:7px;background-color:${palette.primary};margin:0 0 10px"></p>` +
      result;

    return result;
  }

  return html
    .replace(
      /border-left:4px solid [^;]+;padding-left:8px;border-bottom:0/g,
      `border-bottom:1px solid ${palette.accent};padding-bottom:4px`,
    )
    .replace(
      /background-color:[^;]+;padding:6px 8px;border:0/g,
      `background-color:${palette.light};padding:6px 8px;border-bottom:1px solid ${palette.accent}`,
    );
}

export const RESUME_DESIGNS: Definition[] = definitions.map((definition) => ({
  ...definition,
  build: () => renderLayout(definition.layout, definition.palette),
}));

export function buildResumeDesignHtml(
  id: string,
  themeId = "slate",
  layoutId: PresentationLayout = "classic",
): string | null {
  const design = definitions.find((item) => item.id === id);

  if (!design) return null;

  const palette = getDesignPalette(design, themeId);
  const html = renderLayout(design.layout, palette);

  return applyPresentationLayout(html, palette, layoutId);
}