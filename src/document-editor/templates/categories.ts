import type { LayoutId, Theme } from './themes';

export type C = { t: Theme; l: LayoutId };

/* ------------------------------------------------------------------ */
/* Small HTML helpers (all styling is inline so the editor keeps it)    */
/* ------------------------------------------------------------------ */

const ff = (c: C) => `font-family:${c.t.body}`;
const b = (s: string) => `<strong>${s}</strong>`;
const muted = (s: string) => `<span style="color:#6b7280">${s}</span>`;

const P = (c: C, html: string, extra = '') => `<p style="${ff(c)};${extra}">${html}</p>`;
const SP = '<p></p>';
const UL = (c: C, items: string[]) =>
  `<ul style="${ff(c)}">${items.map((i) => `<li><p>${i}</p></li>`).join('')}</ul>`;
const OL = (c: C, items: string[]) =>
  `<ol style="${ff(c)}">${items.map((i) => `<li><p>${i}</p></li>`).join('')}</ol>`;

const TITLE = (c: C, title: string, sub = '', kicker = '') => {
  const { t, l } = c;
  if (l === 'banner') {
    return (
      `<p style="background-color:${t.primary};padding:26px 24px 4px;margin:0"><span style="color:#ffffff;font-family:${t.head};font-size:30px"><strong>${title}</strong></span></p>` +
      `<p style="background-color:${t.primary};padding:0 24px 22px;margin:0 0 18px"><span style="color:${t.accent};font-family:${t.body};font-size:14px">${sub || '&nbsp;'}</span></p>`
    );
  }
  if (l === 'classic') {
    return (
      `<h1 style="text-align:center;border-bottom:3px solid ${t.primary};padding-bottom:8px;margin:0 0 6px"><span style="color:${t.primary};font-family:${t.head};font-size:30px">${title}</span></h1>` +
      `<p style="text-align:center;margin:0 0 18px"><span style="color:#6b7280;font-family:${t.body};font-size:13px">${sub}</span></p>`
    );
  }
  return (
    `<p style="margin:0 0 4px"><span style="color:${t.accent};font-family:${t.body};font-size:12px"><strong>${(kicker || sub || title).toUpperCase()}</strong></span></p>` +
    `<h1 style="border-left:8px solid ${t.primary};padding-left:14px;margin:0 0 18px"><span style="color:${t.primary};font-family:${t.head};font-size:30px">${title}</span></h1>`
  );
};

const H = (c: C, text: string) => {
  const { t, l } = c;
  const span = `<span style="color:${t.primary};font-family:${t.head};font-size:17px">${text}</span>`;
  if (l === 'accent')
    return `<h2 style="border-left:4px solid ${t.accent};padding-left:10px;margin:18px 0 8px">${span}</h2>`;
  if (l === 'banner')
    return `<h2 style="background-color:${t.light};padding:6px 10px;margin:18px 0 8px">${span}</h2>`;
  return `<h2 style="border-bottom:1.5px solid ${t.accent};padding-bottom:3px;margin:18px 0 8px">${span}</h2>`;
};

const cellHtml = (
  c: C,
  tag: 'th' | 'td',
  txt: string,
  bg: string,
  right: boolean,
  headColor?: string,
) =>
  `<${tag} style="background-color:${bg};padding:8px 10px"><p style="${ff(c)};${right ? 'text-align:right;' : ''}">${
    headColor ? `<span style="color:${headColor}"><strong>${txt}</strong></span>` : txt
  }</p></${tag}>`;

const TBL = (c: C, head: string[], rows: string[][], right: number[] = []) => {
  const hr = `<tr>${head.map((h, i) => cellHtml(c, 'th', h, c.t.primary, right.includes(i), '#ffffff')).join('')}</tr>`;
  const body = rows
    .map(
      (r, ri) =>
        `<tr>${r.map((x, i) => cellHtml(c, 'td', x, ri % 2 ? c.t.light : '#ffffff', right.includes(i))).join('')}</tr>`,
    )
    .join('');
  return `<table style="width:100%"><tbody>${hr}${body}</tbody></table>`;
};

const KV = (c: C, pairs: [string, string][]) =>
  `<table style="width:100%"><tbody>${pairs
    .map(
      ([k, v]) =>
        `<tr>${cellHtml(c, 'td', b(k), c.t.light, false)}${cellHtml(c, 'td', v, '#ffffff', false)}</tr>`,
    )
    .join('')}</tbody></table>`;

const centered = (c: C, html: string, size = 14, color = '#374151') =>
  `<p style="text-align:center"><span style="font-family:${c.t.body};font-size:${size}px;color:${color}">${html}</span></p>`;

const sign = (c: C, name = 'Your Name') => P(c, 'Sincerely,') + SP + P(c, b(name));

/* ------------------------------------------------------------------ */
/* Document types                                                      */
/* ------------------------------------------------------------------ */

type Cat = { id: string; name: string; keywords: string; build: (c: C) => string };

export const CATEGORIES: Cat[] = [
  {
    id: 'resume',
    name: 'Resume',
    keywords: 'cv job career curriculum vitae',
    build: (c) =>
      TITLE(c, 'Your Name', 'Software Developer · you@email.com · +91 98765 43210 · Mumbai, India', 'Curriculum Vitae') +
      H(c, 'Profile') +
      P(c, 'Motivated professional with a strong foundation in web technologies. Passionate about building clean, fast and user-friendly products. Replace this with a 2–3 line summary of your strengths and goals.') +
      H(c, 'Experience') +
      P(c, b('Job Title') + ' — Company Name, City', 'margin-bottom:0') +
      P(c, muted('Jan 2024 – Present'), 'margin-bottom:4px') +
      UL(c, ['Built and shipped features used by 10,000+ users', 'Improved page load time by 40% through code splitting', 'Collaborated with designers and backend engineers']) +
      P(c, b('Previous Role') + ' — Company Name, City', 'margin-bottom:0') +
      P(c, muted('Jun 2022 – Dec 2023'), 'margin-bottom:4px') +
      UL(c, ['Describe an achievement with a number', 'Describe another achievement']) +
      H(c, 'Education') +
      P(c, b('B.Com — Computer Systems & Applications'), 'margin-bottom:0') +
      P(c, muted('University of Mumbai · 2023 – 2026')) +
      H(c, 'Skills') +
      TBL(c, ['Frontend', 'Backend', 'Tools'], [['React, TypeScript, HTML, CSS', 'Node.js, Express, MongoDB', 'Git, GitHub, VS Code']]),
  },
  {
    id: 'cover-letter',
    name: 'Cover Letter',
    keywords: 'job application letter hiring',
    build: (c) =>
      TITLE(c, 'Your Name', 'you@email.com · +91 98765 43210', 'Cover Letter') +
      P(c, 'October 10, 2026') +
      P(c, 'Hiring Manager<br>Company Name<br>City, State') +
      P(c, b('Re: Application for [Job Title]')) +
      P(c, 'Dear Hiring Manager,') +
      P(c, 'I am excited to apply for the [Job Title] position at [Company]. With experience in [skill] and a passion for [industry], I am confident I can contribute to your team from day one.') +
      P(c, 'In my previous role, I [achievement with a number]. I also [second achievement], which taught me [lesson]. I would welcome the opportunity to bring the same energy to [Company].') +
      P(c, 'Thank you for your time and consideration. I look forward to discussing how I can help your team succeed.') +
      sign(c),
  },
  {
    id: 'invoice',
    name: 'Invoice',
    keywords: 'bill payment business billing gst',
    build: (c) =>
      TITLE(c, 'INVOICE', 'Invoice No. 0001 · Issued 10 Oct 2026 · Due 25 Oct 2026', 'Tax Invoice') +
      TBL(c, ['From', 'Bill To'], [['Your Company<br>Address line, City<br>GSTIN: 00AAAAA0000A1Z5', 'Client Name<br>Client address, City<br>client@email.com']]) +
      SP +
      TBL(
        c,
        ['Description', 'Qty', 'Rate', 'Amount'],
        [
          ['Website design', '1', '₹25,000', '₹25,000'],
          ['Development (hours)', '40', '₹800', '₹32,000'],
          ['Hosting (1 year)', '1', '₹6,000', '₹6,000'],
          ['Maintenance', '3', '₹2,000', '₹6,000'],
        ],
        [1, 2, 3],
      ) +
      P(c, b('Subtotal: ₹69,000') + '<br>GST (18%): ₹12,420<br>' + b('Total due: ₹81,420'), 'text-align:right;margin-top:12px') +
      H(c, 'Payment details') +
      P(c, 'Bank: Bank Name · A/C: XXXXXXXXXX · IFSC: XXXX0000000 · UPI: yourname@upi') +
      P(c, muted('Thank you for your business. Payment is due within 15 days.')),
  },
  {
    id: 'business-letter',
    name: 'Business Letter',
    keywords: 'formal letter official company',
    build: (c) =>
      TITLE(c, 'Company Name', '123 Business Street, City · info@company.com · +91 00000 00000', 'Letterhead') +
      P(c, 'October 10, 2026') +
      P(c, 'Recipient Name<br>Designation<br>Organisation<br>Address') +
      P(c, b('Subject: Brief subject of the letter')) +
      P(c, 'Dear Sir/Madam,') +
      P(c, 'Write the opening paragraph here, stating the purpose of the letter clearly and politely.') +
      P(c, 'Use the second paragraph to give supporting details, dates, figures or background that the reader needs.') +
      P(c, 'Close with the action you expect and a courteous note of thanks.') +
      P(c, 'Yours faithfully,') + SP + P(c, b('Authorised Signatory') + '<br>Company Name'),
  },
  {
    id: 'report',
    name: 'Report',
    keywords: 'business report analysis findings summary',
    build: (c) =>
      TITLE(c, 'Quarterly Report', 'Prepared by Your Name · Q3 2026', 'Report') +
      H(c, 'Executive Summary') +
      P(c, 'Summarise the key findings and recommendations in 3–4 sentences so a busy reader can stop here and still know what matters.') +
      H(c, 'Introduction') +
      P(c, 'Explain the purpose of this report, the period it covers and how the data was collected.') +
      H(c, 'Key Findings') +
      TBL(c, ['Metric', 'Q2', 'Q3', 'Change'], [['Revenue', '₹12.0L', '₹14.4L', '+20%'], ['New customers', '320', '410', '+28%'], ['Churn', '4.1%', '3.2%', '−0.9 pt']], [1, 2, 3]) +
      UL(c, ['Finding one with a supporting number', 'Finding two with a supporting number', 'Finding three with a supporting number']) +
      H(c, 'Recommendations') +
      OL(c, ['Invest further in the best-performing channel', 'Reduce cost in the lowest-performing area', 'Review progress again next quarter']) +
      H(c, 'Conclusion') +
      P(c, 'Close with a short statement of what happens next.'),
  },
  {
    id: 'proposal',
    name: 'Project Proposal',
    keywords: 'pitch client scope budget timeline',
    build: (c) =>
      TITLE(c, 'Project Proposal', 'Prepared for Client Name · by Your Company', 'Proposal') +
      H(c, 'Overview') +
      P(c, 'Describe the problem the client faces and how your solution addresses it, in plain language.') +
      H(c, 'Objectives') +
      UL(c, ['Objective one — measurable outcome', 'Objective two — measurable outcome', 'Objective three — measurable outcome']) +
      H(c, 'Scope of Work') +
      P(c, 'List what is included and, just as importantly, what is not included.') +
      H(c, 'Timeline') +
      TBL(c, ['Phase', 'Deliverable', 'Duration'], [['Discovery', 'Requirements document', '1 week'], ['Design', 'Mock-ups and approval', '2 weeks'], ['Build', 'Working product', '4 weeks'], ['Launch', 'Go-live and handover', '1 week']]) +
      H(c, 'Budget') +
      TBL(c, ['Item', 'Cost'], [['Design', '₹40,000'], ['Development', '₹1,20,000'], ['Total', '₹1,60,000']], [1]) +
      H(c, 'Terms') +
      P(c, '50% advance, 50% on delivery. This proposal is valid for 30 days.'),
  },
  {
    id: 'meeting-minutes',
    name: 'Meeting Minutes',
    keywords: 'meeting notes agenda actions team',
    build: (c) =>
      TITLE(c, 'Meeting Minutes', 'Team Sync · 10 Oct 2026', 'Minutes') +
      KV(c, [['Date & time', '10 Oct 2026, 10:00 AM'], ['Location', 'Conference Room / Online'], ['Chair', 'Name'], ['Minute taker', 'Name']]) +
      H(c, 'Attendees') +
      UL(c, ['Name — Role', 'Name — Role', 'Name — Role']) +
      H(c, 'Discussion') +
      TBL(c, ['Topic', 'Notes', 'Decision'], [['Topic 1', 'Summary of discussion', 'Decision made'], ['Topic 2', 'Summary of discussion', 'Decision made']]) +
      H(c, 'Action Items') +
      TBL(c, ['Task', 'Owner', 'Due'], [['Task description', 'Name', '17 Oct'], ['Task description', 'Name', '24 Oct']]) +
      P(c, muted('Next meeting: 17 Oct 2026, 10:00 AM'), 'margin-top:12px'),
  },
  {
    id: 'resignation',
    name: 'Resignation Letter',
    keywords: 'quit job notice leaving employment',
    build: (c) =>
      TITLE(c, 'Resignation Letter', 'Formal notice of resignation', 'Notice') +
      P(c, 'October 10, 2026') +
      P(c, 'Manager Name<br>Designation<br>Company Name') +
      P(c, b('Subject: Resignation from the position of [Job Title]')) +
      P(c, 'Dear [Manager Name],') +
      P(c, 'Please accept this letter as formal notice of my resignation from the position of [Job Title] at [Company], effective [last working date], in line with my notice period.') +
      P(c, 'I am grateful for the opportunities and support I have received during my time here. I will do everything possible to ensure a smooth handover of my responsibilities.') +
      P(c, 'Thank you for everything. I wish the team continued success.') +
      sign(c),
  },
  {
    id: 'certificate',
    name: 'Certificate',
    keywords: 'award achievement completion appreciation',
    build: (c) =>
      `<table style="width:100%"><tbody><tr><td style="border:8px double ${c.t.primary};padding:60px 40px;background-color:#ffffff">` +
      `<p style="text-align:center;margin:0"><span style="color:${c.t.accent};font-family:${c.t.body};font-size:14px"><strong>CERTIFICATE OF</strong></span></p>` +
      `<h1 style="text-align:center;margin:0 0 16px"><span style="color:${c.t.primary};font-family:${c.t.head};font-size:44px">Achievement</span></h1>` +
      centered(c, 'This certificate is proudly presented to') +
      `<h2 style="text-align:center;margin:12px 0"><span style="color:${c.t.primary};font-family:${c.t.head};font-size:30px"><em>Recipient Name</em></span></h2>` +
      centered(c, 'in recognition of outstanding performance and dedication,<br>awarded on 10 October 2026') +
      SP + SP +
      centered(c, '______________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;______________________<br>Signature&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Date', 12, '#6b7280') +
      `</td></tr></tbody></table>`,
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    keywords: 'news bulletin company update email magazine',
    build: (c) =>
      TITLE(c, 'The Monthly Digest', 'Issue 12 · October 2026', 'Newsletter') +
      H(c, 'Lead story: A headline that grabs attention') +
      P(c, 'Open with the most important news in two or three sentences. Keep paragraphs short and write for skimmers. Add an image above with Insert → Image.') +
      H(c, 'In this issue') +
      TBL(c, ['Team update', 'Customer story'], [['Short summary of what the team shipped this month and what comes next.', 'A short quote or result from a customer, with a link to the full story.']]) +
      H(c, 'Upcoming events') +
      UL(c, ['<strong>15 Oct</strong> — Webinar: Topic name', '<strong>22 Oct</strong> — Community meetup', '<strong>30 Oct</strong> — Product release']) +
      P(c, muted('You are receiving this because you subscribed. Unsubscribe any time.'), 'margin-top:14px'),
  },
  {
    id: 'memo',
    name: 'Memo',
    keywords: 'memorandum internal office notice',
    build: (c) =>
      TITLE(c, 'MEMORANDUM', 'Internal communication', 'Memo') +
      KV(c, [['To', 'All Staff'], ['From', 'Name, Designation'], ['Date', '10 October 2026'], ['Subject', 'Subject of the memo']]) +
      H(c, 'Purpose') +
      P(c, 'State clearly why you are writing and what the reader needs to know or do.') +
      H(c, 'Details') +
      P(c, 'Provide the supporting information: dates, locations, policies or figures.') +
      H(c, 'Action required') +
      UL(c, ['Action one — by date', 'Action two — by date']) +
      P(c, 'For questions, contact Name at extension 000.'),
  },
  {
    id: 'press-release',
    name: 'Press Release',
    keywords: 'media announcement news launch pr',
    build: (c) =>
      P(c, b('FOR IMMEDIATE RELEASE'), 'margin-bottom:2px') +
      TITLE(c, 'Company Launches New Product to Transform Industry', 'City, 10 October 2026', 'Press Release') +
      P(c, '<strong>CITY, Date —</strong> Company Name today announced the launch of Product Name, a new solution that helps customers achieve [benefit]. The product is available starting today.') +
      P(c, 'Add a second paragraph with the key details: what it does, who it is for, and why it matters now.') +
      `<blockquote style="border-left:4px solid ${c.t.accent};padding-left:14px"><p style="${ff(c)}"><em>“Add a short, quotable statement from a company leader explaining the vision.”</em><br>— Name, Title</p></blockquote>` +
      H(c, 'About Company Name') +
      P(c, 'One short paragraph describing the company, founded year, mission and website.') +
      H(c, 'Media contact') +
      P(c, 'Name · press@company.com · +91 00000 00000') +
      centered(c, '###', 12, '#6b7280'),
  },
  {
    id: 'business-plan',
    name: 'Business Plan',
    keywords: 'startup strategy market financial plan',
    build: (c) =>
      TITLE(c, 'Business Plan', 'Company Name · 2026–2028', 'Confidential') +
      H(c, 'Executive Summary') +
      P(c, 'Briefly describe the business, the problem it solves, your target customers and your goals.') +
      H(c, 'Company Description') +
      P(c, 'Legal structure, location, founders and the mission of the company.') +
      H(c, 'Market Analysis') +
      UL(c, ['Target market and size', 'Main competitors and how you differ', 'Trends that help you']) +
      H(c, 'Marketing & Sales Strategy') +
      P(c, 'Explain how you will reach customers, your pricing and your sales channels.') +
      H(c, 'Operations') +
      P(c, 'Describe suppliers, logistics, technology and the team you need.') +
      H(c, 'Financial Plan') +
      TBL(c, ['', 'Year 1', 'Year 2', 'Year 3'], [['Revenue', '₹12L', '₹30L', '₹65L'], ['Expenses', '₹10L', '₹22L', '₹45L'], ['Profit', '₹2L', '₹8L', '₹20L']], [1, 2, 3]),
  },
  {
    id: 'lesson-plan',
    name: 'Lesson Plan',
    keywords: 'teacher school education class curriculum',
    build: (c) =>
      TITLE(c, 'Lesson Plan', 'Subject · Grade · 45 minutes', 'Education') +
      KV(c, [['Subject', 'Subject name'], ['Grade / Class', 'Grade'], ['Date', '10 Oct 2026'], ['Duration', '45 minutes']]) +
      H(c, 'Learning Objectives') +
      UL(c, ['Students will be able to …', 'Students will understand …']) +
      H(c, 'Materials') +
      UL(c, ['Textbook, whiteboard, markers', 'Worksheet (printed)']) +
      H(c, 'Procedure') +
      TBL(c, ['Time', 'Activity', 'Notes'], [['0–5 min', 'Warm-up question', 'Recap last lesson'], ['5–25 min', 'Main teaching', 'Use examples'], ['25–40 min', 'Group activity', 'Circulate and help'], ['40–45 min', 'Wrap-up', 'Exit ticket']]) +
      H(c, 'Assessment') +
      P(c, 'How will you check that students met the objectives?') +
      H(c, 'Homework') +
      P(c, 'Describe the take-home task.'),
  },
  {
    id: 'quotation',
    name: 'Quotation',
    keywords: 'quote estimate price offer',
    build: (c) =>
      TITLE(c, 'QUOTATION', 'Quote No. Q-0001 · Valid until 31 Oct 2026', 'Price quote') +
      TBL(c, ['Prepared by', 'Prepared for'], [['Your Company<br>Address, City<br>you@company.com', 'Client Name<br>Address, City<br>client@email.com']]) +
      SP +
      TBL(c, ['Item', 'Qty', 'Unit price', 'Total'], [['Product or service A', '2', '₹10,000', '₹20,000'], ['Product or service B', '5', '₹3,000', '₹15,000'], ['Installation', '1', '₹5,000', '₹5,000']], [1, 2, 3]) +
      P(c, b('Total estimate: ₹40,000') + '<br>Taxes extra as applicable', 'text-align:right;margin-top:12px') +
      H(c, 'Terms & conditions') +
      OL(c, ['Prices are valid until the date above.', '50% advance required to start work.', 'Delivery within 10 working days of confirmation.']) +
      P(c, 'To accept this quotation, sign below and return a copy.') +
      P(c, 'Client signature: ______________________ &nbsp; Date: ____________'),
  },
  {
    id: 'agenda',
    name: 'Meeting Agenda',
    keywords: 'schedule meeting plan conference',
    build: (c) =>
      TITLE(c, 'Meeting Agenda', 'Project Kick-off · 10 Oct 2026', 'Agenda') +
      KV(c, [['Time', '10:00 AM – 11:00 AM'], ['Location', 'Room / video link'], ['Facilitator', 'Name']]) +
      H(c, 'Schedule') +
      TBL(c, ['Time', 'Topic', 'Lead'], [['10:00', 'Welcome and introductions', 'Name'], ['10:10', 'Project goals', 'Name'], ['10:30', 'Roles and timeline', 'Name'], ['10:50', 'Questions and next steps', 'All']]) +
      H(c, 'Please prepare') +
      UL(c, ['Read the project brief', 'Bring questions about scope']),
  },
  {
    id: 'agreement',
    name: 'Service Agreement',
    keywords: 'contract legal nda terms freelance',
    build: (c) =>
      TITLE(c, 'Service Agreement', 'Between Party A and Party B', 'Agreement') +
      P(c, 'This Agreement is made on <strong>10 October 2026</strong> between <strong>Party A</strong> (“Provider”) and <strong>Party B</strong> (“Client”).') +
      H(c, 'Terms') +
      OL(c, [
        '<strong>Services.</strong> The Provider will deliver the services described in Schedule A.',
        '<strong>Payment.</strong> The Client will pay the fees set out in Schedule A within 15 days of invoice.',
        '<strong>Confidentiality.</strong> Both parties agree to keep confidential information private.',
        '<strong>Term.</strong> This Agreement begins on the date above and continues until the services are complete.',
        '<strong>Termination.</strong> Either party may terminate with 15 days’ written notice.',
        '<strong>Governing law.</strong> This Agreement is governed by the laws of India.',
      ]) +
      P(c, muted('This template is a starting point only and is not legal advice. Have a lawyer review it before use.'), 'margin-top:10px') +
      TBL(c, ['Party A', 'Party B'], [['Signature: ____________________<br>Name:<br>Date:', 'Signature: ____________________<br>Name:<br>Date:']]),
  },
  {
    id: 'project-plan',
    name: 'Project Plan',
    keywords: 'milestones risks team schedule management',
    build: (c) =>
      TITLE(c, 'Project Plan', 'Project name · Version 1.0', 'Plan') +
      H(c, 'Goal') +
      P(c, 'One sentence describing what success looks like and by when.') +
      H(c, 'Milestones') +
      TBL(c, ['Milestone', 'Owner', 'Date', 'Status'], [['Kick-off', 'Name', '12 Oct', 'Done'], ['Design complete', 'Name', '26 Oct', 'In progress'], ['Beta release', 'Name', '16 Nov', 'Planned'], ['Launch', 'Name', '30 Nov', 'Planned']]) +
      H(c, 'Risks') +
      TBL(c, ['Risk', 'Impact', 'Mitigation'], [['Scope grows', 'High', 'Weekly scope review'], ['Key person unavailable', 'Medium', 'Document and cross-train']]) +
      H(c, 'Team') +
      UL(c, ['Name — Project lead', 'Name — Developer', 'Name — Designer']),
  },
  {
    id: 'event-flyer',
    name: 'Event Flyer',
    keywords: 'poster invitation party workshop announcement',
    build: (c) =>
      `<p style="background-color:${c.t.primary};padding:60px 24px 10px;margin:0;text-align:center"><span style="color:${c.t.accent};font-family:${c.t.body};font-size:16px"><strong>YOU ARE INVITED</strong></span></p>` +
      `<p style="background-color:${c.t.primary};padding:0 24px 60px;margin:0 0 18px;text-align:center"><span style="color:#ffffff;font-family:${c.t.head};font-size:48px"><strong>Event Name</strong></span></p>` +
      centered(c, '<strong>Saturday, 25 October 2026 · 6:00 PM</strong>', 20, c.t.primary) +
      centered(c, 'Venue name, Street address, City', 15) +
      SP +
      centered(c, 'Write two or three exciting lines about the event: what will happen, who should come and why they will love it.', 15) +
      H(c, 'Programme') +
      UL(c, ['6:00 PM — Welcome and registration', '6:30 PM — Main session', '8:00 PM — Dinner and networking']) +
      centered(c, 'RSVP: you@email.com · +91 98765 43210', 14, c.t.primary),
  },
  {
    id: 'weekly-planner',
    name: 'Weekly Planner',
    keywords: 'schedule calendar tasks week timetable organiser',
    build: (c) =>
      TITLE(c, 'Weekly Planner', 'Week of 12 October 2026', 'Plan your week') +
      TBL(c, ['Day', 'Morning', 'Afternoon', 'Evening'], ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => [b(d), '', '', ''])) +
      H(c, 'Top 3 goals') +
      OL(c, ['Goal one', 'Goal two', 'Goal three']) +
      H(c, 'Notes') +
      P(c, ''),
  },
];
