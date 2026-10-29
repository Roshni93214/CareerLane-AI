import React from "react";
import type { ResumeTemplate } from "./registry";

export type SampleResumeData = {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;

  experience: {
    role: string;
    company: string;
    period: string;
    description: string;
  }[];

  education: {
    degree: string;
    institution: string;
    period: string;
  }[];

  skills: string[];

  projects: {
    name: string;
    description: string;
  }[];

  certifications: string[];
};

export const SAMPLE_RESUME: SampleResumeData = {
  name: "Aarav Sharma",
  title: "Full Stack Developer",

  email: "aarav.sharma@email.com",
  phone: "+91 98765 43210",
  location: "Mumbai, India",

  summary:
    "Passionate Full Stack Developer with experience building responsive web applications and scalable backend services. Skilled in modern JavaScript technologies and database-driven applications.",

  experience: [
    {
      role: "Full Stack Developer",
      company: "Tech Solutions Pvt. Ltd.",
      period: "2024 – Present",
      description:
        "Developed responsive web applications using React, Node.js and MongoDB. Built REST APIs and integrated third-party services.",
    },
    {
      role: "Web Development Intern",
      company: "Digital Labs",
      period: "2023 – 2024",
      description:
        "Worked on frontend interfaces, API integration and database management for multiple web projects.",
    },
  ],

  education: [
    {
      degree: "Bachelor of Commerce",
      institution: "Mumbai University",
      period: "2021 – 2024",
    },
    {
      degree: "Higher Secondary Education",
      institution: "Maharashtra Board",
      period: "2019 – 2021",
    },
  ],

  skills: [
    "JavaScript",
    "React.js",
    "Node.js",
    "Express.js",
    "MongoDB",
    "MySQL",
    "Git",
    "REST APIs",
  ],

  projects: [
    {
      name: "CareerLane AI",
      description:
        "AI-powered resume analyzer and career guidance platform with ATS analysis, skill gap detection and career recommendations.",
    },
    {
      name: "E-Commerce Platform",
      description:
        "Full stack e-commerce application with product management, authentication, cart and order functionality.",
    },
  ],

  certifications: [
    "Full Stack Web Development",
    "JavaScript Programming",
    "Database Management",
  ],
};

type Props = {
  template: ResumeTemplate;
  data?: SampleResumeData;
  compact?: boolean;
};

const SectionTitle = ({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent: string;
}) => (
  <h3
    style={{
      color: accent,
      fontSize: "11px",
      fontWeight: 700,
      letterSpacing: "1px",
      textTransform: "uppercase",
      margin: "0 0 8px",
      borderBottom: `1px solid ${accent}40`,
      paddingBottom: "5px",
    }}
  >
    {children}
  </h3>
);

const ClassicTemplate = ({
  data,
  accent,
}: {
  data: SampleResumeData;
  accent: string;
}) => (
  <div className="template-design template-design-classic">
    <header className="template-header">
      <h1>{data.name}</h1>
      <h2>{data.title}</h2>

      <div className="template-contact">
        <span>{data.email}</span>
        <span>{data.phone}</span>
        <span>{data.location}</span>
      </div>
    </header>

    <section>
      <SectionTitle accent={accent}>Profile</SectionTitle>
      <p>{data.summary}</p>
    </section>

    <section>
      <SectionTitle accent={accent}>Experience</SectionTitle>

      {data.experience.map((item, index) => (
        <div className="template-entry" key={index}>
          <div className="template-entry-top">
            <strong>{item.role}</strong>
            <span>{item.period}</span>
          </div>

          <div className="template-company">{item.company}</div>

          <p>{item.description}</p>
        </div>
      ))}
    </section>

    <section>
      <SectionTitle accent={accent}>Education</SectionTitle>

      {data.education.map((item, index) => (
        <div className="template-entry" key={index}>
          <div className="template-entry-top">
            <strong>{item.degree}</strong>
            <span>{item.period}</span>
          </div>

          <div className="template-company">
            {item.institution}
          </div>
        </div>
      ))}
    </section>

    <section>
      <SectionTitle accent={accent}>Skills</SectionTitle>

      <div className="template-skills">
        {data.skills.map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
    </section>

    <section>
      <SectionTitle accent={accent}>Projects</SectionTitle>

      {data.projects.map((project, index) => (
        <div className="template-entry" key={index}>
          <strong>{project.name}</strong>
          <p>{project.description}</p>
        </div>
      ))}
    </section>

    <section>
      <SectionTitle accent={accent}>Certifications</SectionTitle>

      <ul>
        {data.certifications.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  </div>
);

const ModernTemplate = ({
  data,
  accent,
}: {
  data: SampleResumeData;
  accent: string;
}) => (
  <div className="template-design template-design-modern">
    <div
      className="modern-top"
      style={{ background: accent }}
    >
      <h1>{data.name}</h1>
      <h2>{data.title}</h2>

      <div className="template-contact">
        <span>{data.email}</span>
        <span>{data.phone}</span>
        <span>{data.location}</span>
      </div>
    </div>

    <div className="modern-body">
      <main>
        <section>
          <SectionTitle accent={accent}>Profile</SectionTitle>
          <p>{data.summary}</p>
        </section>

        <section>
          <SectionTitle accent={accent}>Experience</SectionTitle>

          {data.experience.map((item, index) => (
            <div className="template-entry" key={index}>
              <div className="template-entry-top">
                <strong>{item.role}</strong>
                <span>{item.period}</span>
              </div>

              <div className="template-company">
                {item.company}
              </div>

              <p>{item.description}</p>
            </div>
          ))}
        </section>

        <section>
          <SectionTitle accent={accent}>Projects</SectionTitle>

          {data.projects.map((project, index) => (
            <div className="template-entry" key={index}>
              <strong>{project.name}</strong>
              <p>{project.description}</p>
            </div>
          ))}
        </section>
      </main>

      <aside>
        <SectionTitle accent={accent}>Skills</SectionTitle>

        <div className="modern-skills">
          {data.skills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>

        <SectionTitle accent={accent}>Education</SectionTitle>

        {data.education.map((item, index) => (
          <div className="modern-education" key={index}>
            <strong>{item.degree}</strong>
            <span>{item.institution}</span>
            <small>{item.period}</small>
          </div>
        ))}

        <SectionTitle accent={accent}>
          Certifications
        </SectionTitle>

        <ul>
          {data.certifications.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </aside>
    </div>
  </div>
);

const MinimalTemplate = ({
  data,
  accent,
}: {
  data: SampleResumeData;
  accent: string;
}) => (
  <div className="template-design template-design-minimal">
    <header>
      <h1>{data.name}</h1>
      <h2>{data.title}</h2>

      <div className="template-contact">
        <span>{data.email}</span>
        <span>{data.phone}</span>
        <span>{data.location}</span>
      </div>
    </header>

    <section>
      <SectionTitle accent={accent}>Summary</SectionTitle>
      <p>{data.summary}</p>
    </section>

    <section>
      <SectionTitle accent={accent}>Experience</SectionTitle>

      {data.experience.map((item, index) => (
        <div className="minimal-entry" key={index}>
          <div>
            <strong>{item.role}</strong>
            <span>{item.company}</span>
          </div>

          <time>{item.period}</time>

          <p>{item.description}</p>
        </div>
      ))}
    </section>

    <section>
      <SectionTitle accent={accent}>Education</SectionTitle>

      {data.education.map((item, index) => (
        <div className="minimal-entry" key={index}>
          <div>
            <strong>{item.degree}</strong>
            <span>{item.institution}</span>
          </div>

          <time>{item.period}</time>
        </div>
      ))}
    </section>

    <section>
      <SectionTitle accent={accent}>Skills</SectionTitle>

      <div className="template-skills minimal-skills">
        {data.skills.map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
    </section>

    <section>
      <SectionTitle accent={accent}>Projects</SectionTitle>

      {data.projects.map((project) => (
        <div className="minimal-project" key={project.name}>
          <strong>{project.name}</strong>
          <p>{project.description}</p>
        </div>
      ))}
    </section>
  </div>
);

const ExecutiveTemplate = ({
  data,
  accent,
}: {
  data: SampleResumeData;
  accent: string;
}) => (
  <div className="template-design template-design-executive">
    <div className="executive-header">
      <div>
        <h1>{data.name}</h1>
        <h2>{data.title}</h2>
      </div>

      <div className="executive-contact">
        <span>{data.email}</span>
        <span>{data.phone}</span>
        <span>{data.location}</span>
      </div>
    </div>

    <section>
      <SectionTitle accent={accent}>Professional Profile</SectionTitle>
      <p>{data.summary}</p>
    </section>

    <section>
      <SectionTitle accent={accent}>Professional Experience</SectionTitle>

      {data.experience.map((item, index) => (
        <div className="executive-entry" key={index}>
          <div>
            <strong>{item.role}</strong>
            <span>{item.company}</span>
          </div>

          <time>{item.period}</time>

          <p>{item.description}</p>
        </div>
      ))}
    </section>

    <div className="executive-columns">
      <div>
        <section>
          <SectionTitle accent={accent}>Education</SectionTitle>

          {data.education.map((item, index) => (
            <div className="executive-small-entry" key={index}>
              <strong>{item.degree}</strong>
              <span>{item.institution}</span>
              <small>{item.period}</small>
            </div>
          ))}
        </section>

        <section>
          <SectionTitle accent={accent}>
            Certifications
          </SectionTitle>

          <ul>
            {data.certifications.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <div>
        <section>
          <SectionTitle accent={accent}>Core Skills</SectionTitle>

          <div className="executive-skills">
            {data.skills.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
        </section>
      </div>
    </div>
  </div>
);

const CreativeTemplate = ({
  data,
  accent,
}: {
  data: SampleResumeData;
  accent: string;
}) => (
  <div className="template-design template-design-creative">
    <aside
      className="creative-sidebar"
      style={{ background: accent }}
    >
      <div className="creative-profile">
        <div className="creative-avatar">
          {data.name.charAt(0)}
        </div>

        <h1>{data.name}</h1>
        <h2>{data.title}</h2>
      </div>

      <div className="creative-contact">
        <span>{data.email}</span>
        <span>{data.phone}</span>
        <span>{data.location}</span>
      </div>

      <div className="creative-side-section">
        <h3>Skills</h3>

        {data.skills.map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>

      <div className="creative-side-section">
        <h3>Education</h3>

        {data.education.map((item, index) => (
          <div key={index}>
            <strong>{item.degree}</strong>
            <small>{item.institution}</small>
            <small>{item.period}</small>
          </div>
        ))}
      </div>
    </aside>

    <main className="creative-content">
      <section>
        <SectionTitle accent={accent}>About Me</SectionTitle>
        <p>{data.summary}</p>
      </section>

      <section>
        <SectionTitle accent={accent}>Experience</SectionTitle>

        {data.experience.map((item, index) => (
          <div className="creative-entry" key={index}>
            <div className="creative-entry-dot" />

            <div>
              <strong>{item.role}</strong>
              <span>{item.company}</span>
              <small>{item.period}</small>
              <p>{item.description}</p>
            </div>
          </div>
        ))}
      </section>

      <section>
        <SectionTitle accent={accent}>Projects</SectionTitle>

        {data.projects.map((project) => (
          <div className="creative-project" key={project.name}>
            <strong>{project.name}</strong>
            <p>{project.description}</p>
          </div>
        ))}
      </section>

      <section>
        <SectionTitle accent={accent}>
          Certifications
        </SectionTitle>

        <ul>
          {data.certifications.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  </div>
);

const TechTemplate = ({
  data,
  accent,
}: {
  data: SampleResumeData;
  accent: string;
}) => (
  <div className="template-design template-design-tech">
    <header className="tech-header">
      <div>
        <span className="tech-label">DEVELOPER</span>
        <h1>{data.name}</h1>
        <h2>{data.title}</h2>
      </div>

      <div className="tech-contact">
        <span>{data.email}</span>
        <span>{data.phone}</span>
        <span>{data.location}</span>
      </div>
    </header>

    <section>
      <SectionTitle accent={accent}>About</SectionTitle>
      <p>{data.summary}</p>
    </section>

    <section>
      <SectionTitle accent={accent}>Technical Skills</SectionTitle>

      <div className="tech-skill-grid">
        {data.skills.map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
    </section>

    <section>
      <SectionTitle accent={accent}>Experience</SectionTitle>

      {data.experience.map((item, index) => (
        <div className="tech-entry" key={index}>
          <div className="tech-entry-heading">
            <strong>{item.role}</strong>
            <span>{item.period}</span>
          </div>

          <div className="tech-company">
            {item.company}
          </div>

          <p>{item.description}</p>
        </div>
      ))}
    </section>

    <section>
      <SectionTitle accent={accent}>Projects</SectionTitle>

      {data.projects.map((project) => (
        <div className="tech-project" key={project.name}>
          <strong>{project.name}</strong>
          <p>{project.description}</p>
        </div>
      ))}
    </section>

    <div className="tech-bottom-grid">
      <section>
        <SectionTitle accent={accent}>Education</SectionTitle>

        {data.education.map((item, index) => (
          <div key={index}>
            <strong>{item.degree}</strong>
            <p>{item.institution}</p>
            <small>{item.period}</small>
          </div>
        ))}
      </section>

      <section>
        <SectionTitle accent={accent}>
          Certifications
        </SectionTitle>

        <ul>
          {data.certifications.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  </div>
);

export default function TemplateEngine({
  template,
  data = SAMPLE_RESUME,
  compact = false,
}: Props) {
  const accent = template.accent;

  let content: React.ReactNode;

  switch (template.variant) {
    case "modern":
      content = (
        <ModernTemplate
          data={data}
          accent={accent}
        />
      );
      break;

    case "minimal":
      content = (
        <MinimalTemplate
          data={data}
          accent={accent}
        />
      );
      break;

    case "executive":
      content = (
        <ExecutiveTemplate
          data={data}
          accent={accent}
        />
      );
      break;

    case "creative":
      content = (
        <CreativeTemplate
          data={data}
          accent={accent}
        />
      );
      break;

    case "tech":
      content = (
        <TechTemplate
          data={data}
          accent={accent}
        />
      );
      break;

    case "classic":
    default:
      content = (
        <ClassicTemplate
          data={data}
          accent={accent}
        />
      );
      break;
  }

  return (
    <div
      className={`template-engine ${
        compact ? "template-engine-compact" : ""
      }`}
      data-template={template.id}
    >
      {content}
    </div>
  );
}