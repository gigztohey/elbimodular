# AGENTS.md

## Project overview

ELBI Modular is a single-page, conversion-focused marketing site for a custom cabinet maker and installer. Its primary business goal is generating qualified project inquiries through the Netlify-powered quote form.

## Architecture

- `src/routes/__root.tsx` defines document metadata and the root shell.
- `src/routes/index.tsx` contains the complete homepage, section content, mobile navigation, and form submission states.
- `src/styles.css` contains the global design system, animations, and responsive breakpoints.
- `public/images/` contains locally hosted ELBI project photography and brand assets.
- `public/__forms.html` is the build-time Netlify Forms registration file. Its form name and fields must stay synchronized with the React form.
- `src/router.tsx` configures TanStack Router and generated file-based routes.

## Coding conventions

- Use TypeScript and React function components.
- Keep page copy and repeated content in small arrays near the route component when practical.
- Use semantic HTML, accessible labels, descriptive alt text, and visible keyboard focus behavior.
- Preserve the editorial navy, warm white, and copper visual system defined through CSS custom properties.
- Prefer CSS Grid for major page composition and transform/opacity for motion.
- Keep mobile behavior in the existing `980px` and `640px` responsive breakpoints.

## Netlify Forms

The project inquiry form submits URL-encoded data to `/__forms.html` so TanStack Start does not intercept the request. When changing fields:

1. Update the React form in `src/routes/index.tsx`.
2. Add the exact same field name to `public/__forms.html`.
3. Keep `form-name` set to `project-inquiry` in both places.
4. Retain the honeypot field for basic spam protection.

## Non-obvious decisions

- Project images are hosted locally to avoid depending on the previous Wix site at runtime.
- No unverified years-in-business, client counts, ratings, or testimonials are displayed.
- The contact experience prioritizes a structured inquiry form because no confirmed public phone number or email address was available in the provided site content.
- The `pnpm` override in `package.json` pins `@netlify/ai` to the available compatible registry version required by the current Netlify Vite plugin dependency chain.
