
import { CATEGORIES } from './categories';
import { LAYOUTS, THEMES, type LayoutId } from './themes';
import {
  RESUME_DESIGNS,
  buildResumeDesignHtml,
} from './resume-designs';

export type Template = {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  themeId: string;
  layoutId: LayoutId;
  search: string;
  resumeDesignId?: string;
};

/**
 * Generate resume variations from:
 * 17 base resume layouts × 12 themes × 3 presentation styles.
 *
 * The base layouts remain different. Themes and presentation styles
 * create additional selectable variations of each base layout.
 */
const RESUME_TEMPLATES: Template[] = LAYOUTS.flatMap((layout) =>
  THEMES.flatMap((theme) =>
    RESUME_DESIGNS.map((design) => ({
      id: `resume-${design.id}-${theme.id}-${layout.id}`,
      name: `${design.name} · ${theme.name} ${layout.name}`,
      category: 'Resume',
      categoryId: 'resume',
      themeId: theme.id,
      layoutId: layout.id,
      resumeDesignId: design.id,
      search: [
        'resume',
        'cv',
        'curriculum vitae',
        design.name,
        design.keywords,
        theme.name,
        layout.name,
      ]
        .join(' ')
        .toLowerCase(),
    })),
  ),
);

/**
 * Preserve the existing template generator for every other document type.
 * Resume templates use their own custom HTML layouts above.
 */
const OTHER_TEMPLATES: Template[] = THEMES.flatMap((theme) =>
  LAYOUTS.flatMap((layout) =>
    CATEGORIES.filter((cat) => cat.id !== 'resume').map((cat) => ({
      id: `${cat.id}-${theme.id}-${layout.id}`,
      name: `${cat.name} · ${theme.name} ${layout.name}`,
      category: cat.name,
      categoryId: cat.id,
      themeId: theme.id,
      layoutId: layout.id,
      search: [
        cat.name,
        cat.keywords,
        theme.name,
        layout.name,
      ]
        .join(' ')
        .toLowerCase(),
    })),
  ),
);

/**
 * Resume designs appear first so the existing default Resume category
 * shows the new layouts immediately.
 */
export const TEMPLATES: Template[] = [
  ...RESUME_TEMPLATES,
  ...OTHER_TEMPLATES,
];

const cache = new Map<string, string>();

/**
 * Generate and cache the HTML used by both template previews
 * and the existing document editor.
 */
export function buildTemplateHtml(template: Template): string {
  const cached = cache.get(template.id);

  if (cached !== undefined) {
    return cached;
  }

  // Custom resume design: apply its selected theme and presentation style.
  if (template.resumeDesignId) {
    const html = buildResumeDesignHtml(
      template.resumeDesignId,
      template.themeId,
      template.layoutId,
    );

    if (html !== null) {
      cache.set(template.id, html);
      return html;
    }

    // Avoid silently generating the wrong document if a design ID is invalid.
    return '<p>Resume template could not be loaded.</p>';
  }

  // Original generator for invoices, letters, reports and other documents.
  const category = CATEGORIES.find(
    (item) => item.id === template.categoryId,
  );

  const theme = THEMES.find(
    (item) => item.id === template.themeId,
  );

  if (!category || !theme) {
    return '<p></p>';
  }

  const html = category.build({
    t: theme,
    l: template.layoutId,
  });

  cache.set(template.id, html);

  return html;
}

export { CATEGORIES, THEMES, LAYOUTS };
