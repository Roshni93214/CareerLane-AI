
/**
 * CareerLane external resume template library.
 *
 * Reads the actual HTML, CSS and thumbnail files from the
 * downloaded MIT-licensed HTML Resume Templates repository.
 *
 * This file only loads the library. It does not change existing
 * gallery, editor, routing or storage behaviour.
 */

export type ExternalResumeTemplate = {
  id: string;
  slug: string;
  name: string;
  html: string;
  css: string;
  thumbnailUrl: string;
  sourcePath: string;
};

const htmlFiles = import.meta.glob<string>(
  '../../../external-libraries/html-resume-templates/templates/*/index.html',
  {
    eager: true,
    query: '?raw',
    import: 'default',
  },
);

const cssFiles = import.meta.glob<string>(
  '../../../external-libraries/html-resume-templates/templates/*/style.css',
  {
    eager: true,
    query: '?raw',
    import: 'default',
  },
);

const thumbnailFiles = import.meta.glob<string>(
  '../../../external-libraries/html-resume-templates/templates/*/thumbnail.png',
  {
    eager: true,
    query: '?url',
    import: 'default',
  },
);

function getSlug(path: string): string {
  const match = path.match(/templates\/([^/]+)\/index\.html$/);

  return match?.[1] ?? '';
}

function formatName(slug: string): string {
  return slug
    .replace(/^\d+-/, '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getRelatedFilePath(
  htmlPath: string,
  fileName: 'style.css' | 'thumbnail.png',
): string {
  return htmlPath.replace(/index\.html$/, fileName);
}

/**
 * Build a complete HTML document for isolated iframe previews.
 * The original CSS is embedded into the document so it doesn't
 * need a separate stylesheet URL.
 */
export function buildExternalPreviewDocument(
  template: ExternalResumeTemplate,
): string {
  let html = template.html;

  // Remove the source stylesheet link because CSS is embedded below.
  html = html.replace(
    /<link\b(?=[^>]*\bhref\s*=\s*["']style\.css["'])[^>]*>/gi,
    '',
  );

  const styleTag = `<style>\n${template.css}\n</style>`;

  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${styleTag}\n</head>`);
  }

  return `<!doctype html>
<html>
<head>
<meta charset="UTF-8">
${styleTag}
</head>
<body>
${html}
</body>
</html>`;
}

const loadedTemplates: ExternalResumeTemplate[] = Object.entries(htmlFiles)
  .map(([htmlPath, html]) => {
    const slug = getSlug(htmlPath);

    if (!slug) return null;

    const cssPath = getRelatedFilePath(htmlPath, 'style.css');
    const thumbnailPath = getRelatedFilePath(htmlPath, 'thumbnail.png');

    const css = cssFiles[cssPath];
    const thumbnailUrl = thumbnailFiles[thumbnailPath];

    if (!css || !thumbnailUrl) {
      console.warn(
        `[CareerLane] Could not load all assets for resume template: ${slug}`,
      );

      return null;
    }

    return {
      id: `external-${slug}`,
      slug,
      name: formatName(slug),
      html,
      css,
      thumbnailUrl,
      sourcePath: htmlPath,
    };
  })
  .filter(
    (template): template is ExternalResumeTemplate => template !== null,
  )
  .sort((a, b) => a.slug.localeCompare(b.slug));

export const EXTERNAL_RESUME_TEMPLATES = loadedTemplates;

export function getExternalResumeTemplate(
  id: string,
): ExternalResumeTemplate | undefined {
  return EXTERNAL_RESUME_TEMPLATES.find((template) => template.id === id);
}

export function getExternalResumeTemplateCount(): number {
  return EXTERNAL_RESUME_TEMPLATES.length;
}
