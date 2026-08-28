# ELBI Modular

A conversion-focused marketing website for ELBI Modular, a custom cabinet maker and installer. The site presents the company’s services, project portfolio, process, and craftsmanship while guiding prospective clients toward a detailed project inquiry.

## Technology

- TanStack Start and TanStack Router
- React 19 and TypeScript
- Tailwind CSS 4 with a custom responsive design system
- Lucide icons
- Netlify Forms for project inquiries
- Netlify deployment through the TanStack Start adapter

## Local development

Install dependencies and start the development server:

```bash
pnpm install
pnpm dev
```

The app runs at `http://localhost:3000` by default. Netlify Forms are registered during deployment; test real submissions on a Netlify deploy preview or production deploy.

## Key files

- `src/routes/index.tsx` — homepage content, navigation, and inquiry form behavior
- `src/styles.css` — global visual system and responsive layouts
- `public/__forms.html` — static form definition used by Netlify Forms
- `public/images/` — ELBI Modular brand and project imagery
- `netlify.toml` — deployment configuration
