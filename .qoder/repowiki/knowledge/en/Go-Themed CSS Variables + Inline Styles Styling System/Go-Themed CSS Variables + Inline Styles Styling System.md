---
kind: frontend_style
name: Go-Themed CSS Variables + Inline Styles Styling System
category: frontend_style
scope:
    - '**'
source_files:
    - frontend/src/index.css
    - frontend/vite.config.ts
    - frontend/package.json
    - frontend/src/components/Navbar.tsx
    - frontend/src/pages/SearchPage.tsx
---

The GoNow frontend uses a hybrid styling approach combining global CSS custom properties (design tokens) with per-component inline style objects. There is no CSS-in-JS library, Tailwind, Sass/SCSS, or PostCSS pipeline — only plain CSS and React `style={{}}` props.

**Design tokens and theme**
- All visual tokens live in `frontend/src/index.css` under `:root` as CSS custom properties: wood tones (`--wood-light`, `--wood`, `--wood-dark`), slate/dark UI colors (`--slate`, `--slate-light`), stone black/white for Go pieces (`--stone-black`, `--stone-white`), accent gold (`--accent`), text hierarchy (`--text`, `--text-light`), background (`--bg`, `--card-bg`, `--border`).
- A Go-board grid background pattern is provided via the `.go-grid-bg` class.
- Shared component-level classes exist in the same file: `.search-input`, `.search-wrapper`, `.stone-badge`, `.stone-black`, `.stone-white`, `.player-card`, plus reusable keyframe animations (`spin`, `pulse`, `fadeIn`, `stoneDrop`) and a thin scrollbar style.
- The file also contains a second, unrelated Vite template theme block (purple accent, dark-mode `prefers-color-scheme` overrides) that coexists alongside the Go theme; it appears to be leftover scaffolding.

**Component styling convention**
- Each page/component defines its own `const styles: Record<string, React.CSSProperties>` object at the bottom of the file and applies it via `style={styles.xxx}` on JSX elements. Examples: `Navbar.tsx`, `SearchPage.tsx`, `ChatWidget.tsx`.
- Global shared classes from `index.css` are still used where appropriate (e.g., `className="search-input"`, `className="player-card"`, `className="stone-badge stone-black"`), but layout, spacing, color, and typography decisions are made inline rather than through BEM/utility classes.
- Active navigation state is styled by spreading the base style object and conditionally merging an `activeLink` override using `NavLink`'s function-style `style` prop.

**Responsive strategy**
- Layouts use CSS Grid with `repeat(auto-fill, minmax(280px, 1fr))` for player cards and flexbox throughout; no media-query breakpoints are defined in component styles.
- The global stylesheet includes a single breakpoint at `1024px` inside the Vite-template theme block (font-size adjustments); the Go-themed sections do not define responsive rules beyond the grid auto-fill behavior.

**Build tooling**
- `vite.config.ts` registers only the default `@vitejs/plugin-react`; there is no PostCSS, Sass, CSS Modules, or Tailwind configuration. Styles are plain CSS processed by Vite's built-in CSS loader.
- Linting is handled by oxlint (`package.json` scripts `lint: "oxlint"`), which targets JS/TS, not CSS.

**Rules developers should follow**
- Put new design tokens as CSS variables in `:root` of `src/index.css`; reference them via `var(--name)` in inline styles instead of hard-coding hex values.
- Keep small, local style objects typed as `Record<string, React.CSSProperties>` at the bottom of each component file; avoid importing external CSS files into components.
- Reuse existing global classes (`.search-input`, `.stone-badge`, `.player-card`, `.go-grid-bg`) rather than creating ad-hoc equivalents.
- Prefer CSS animations defined once in `index.css` (`spin`, `fadeIn`, etc.) over inline `animation:` strings.
- Do not add Tailwind, SCSS, or CSS-in-JS libraries without updating `vite.config.ts` and `package.json`; the current setup intentionally stays minimal.