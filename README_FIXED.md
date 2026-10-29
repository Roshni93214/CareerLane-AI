# CareerLane AI — Fixed Build

This build keeps the existing CareerLane functionality and visual direction while fixing the requested reliability, theme, scrolling, authentication, chatbot and resume-template workflows.

## Main fixes
- Gemini → Groq fallback for resume analysis and roadmap JSON generation.
- Groq Structured Outputs (`strict: true`) for JSON responses to prevent malformed JSON fallback failures.
- Faster AI fallback path with no unnecessary Gemini retry before switching provider.
- Central API URL configuration through `src/config.ts`.
- Forgot-password and reset-password backend routes with expiring reset tokens.
- SMTP support for password-reset emails; local development can use the returned reset URL when SMTP is not configured.
- Forgot/reset pages are centered and use the same CareerLane cream/deep-green/warm-gold visual language.
- Global scroll behavior avoids queued smooth scrolling and heavy continuous animations.
- Resume analysis/roadmap data survives refresh through sessionStorage.
- Chatbot introduction appears immediately when the chatbot opens; refresh/new-chat still resets to the same introduction.
- ATS template gallery with in-app editable layouts plus a link to Canva's large official resume-template library.

## Setup
1. Keep your own `server/.env` outside the ZIP or copy it from `server/.env.example`.
2. Run `npm install` in the project root.
3. Run `npm install` inside `server` if needed.
4. Start backend: `cd server && npm run dev`
5. Start frontend: from root, `npm run dev`

Never commit real API keys, database passwords or SMTP passwords.
