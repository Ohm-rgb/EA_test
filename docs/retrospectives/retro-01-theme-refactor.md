# Retrospective: Theme Refactor & Deployment

## 1. Context
- **Date**: 2026-01-21
- **Target**: State-Driven Semantic Theme System Refactor & Git Deployment

## 2. Reflection

### What Went Well?
- **Semantic System Implementation**: Successfully implemented a robust CSS variable system (`--glass-bg`, `--bg-input`) that switches seamlessly between Light (Lavender) and Dark (Glass) modes.
- **Visual Repair**: Fixed visual inconsistencies in Bot Studio and Settings pages where cards remained dark in light mode.
- **Component Refactoring**: Converted inline-styled components (`GlassCard`, `Badge`) to use semantic CSS classes, making them theme-aware.

### What Didn't Go Well?
- **Git Deployment Failure**: 
    - **Issue**: Attempted to `git push origin main` which failed.
    - **Root Cause**: Assumed the default branch was `main` without checking. The local and remote repositories were using `master`.
- **Persistent UI Bug (Dark Cards)**:
    - **Issue**: Even after updating `globals.css`, the UI cards remained dark.
    - **Root Cause**: The `GlassCard` component in `src/components/ui/index.tsx` used **inline styles** (`style={{ background: 'rgba(30,30,30,0.85)' }}`) which took precedence over the CSS classes.

### What Can We Improve?
- **Deployment Safety**: Always verify the current branch with `git branch` before attempting to push, especially in established repositories.
- **Styling Practices**: Strictly avoid inline styles for structural colors. Always use CSS variables (`var(--token)`) or Tailwind classes to ensure theme adaptability.
- **Refactoring Strategy**: When refactoring themes, inspect component source code (`.tsx`) early for hardcoded `style` attributes, not just global CSS.

## 3. Action Items
- [x] Fix Git Push (Pushed to `master`).
- [x] Remove inline styles from `src/components/ui/index.tsx`.
- [ ] Update `Development Principles` to explicitly forbid inline styles for theming (if not already present).
