# LEO Workspace Design Standard

This is the reusable visual standard for LEO dashboard workspaces, based on the working People & Access and Careers components.

## Core brand colours

```css
--leo-primary: #6E5084;
--leo-primary-hover: #624676;
--leo-primary-soft: #F0E7F5;
--leo-background-soft: #FAF7FC;
--leo-background-panel: #FFFFFF;
--leo-background-jade: #F5FFF9;

--leo-text: #2F2635;
--leo-text-strong: #34293A;
--leo-text-muted: #716777;
--leo-text-soft: #817584;

--leo-border: #E6DDEA;
--leo-border-strong: #D9CB E2;
--leo-input-border: #D9CFDD;

--leo-success-background: #EEF9F3;
--leo-success-border: #CFE9DA;
--leo-success-text: #246B46;

--leo-warning-background: #FFF3DC;
--leo-warning-text: #8B5A13;

--leo-error-background: #FFF3F5;
--leo-error-border: #F1D0D6;
--leo-error-text: #963746;
```

Correct the spacing typo above when used in code:

```css
--leo-border-strong: #D9CBE2;
```

## Workspace wrapper

```tsx
<section className="workspace feature-name-workspace">
  ...
  <style>{styles}</style>
</section>
```

Use `<style>{styles}</style>`, not `<style jsx>{styles}</style>`, for these self-contained workspace components.

```css
.feature-name-workspace {
  display: grid;
  gap: 24px;
  color: #2f2635;
}

.feature-name-workspace *,
.feature-name-workspace *::before,
.feature-name-workspace *::after {
  box-sizing: border-box;
}
```

## Workspace heading

```tsx
<header className="workspace-heading">
  <div>
    <p className="eyebrow">Section label</p>
    <h2>Workspace title</h2>
    <p>Clear explanation of what the workspace controls.</p>
  </div>

  <div className="heading-actions">
    <button className="secondary" type="button">
      Secondary action
    </button>
    <button className="primary" type="button">
      Primary action
    </button>
  </div>
</header>
```

```css
.workspace-heading,
.panel-heading {
  display: flex;
  justify-content: space-between;
  gap: 28px;
  align-items: flex-start;
}

.workspace-heading {
  padding: 4px 2px 0;
}

.workspace-heading h2,
.panel-heading h3 {
  margin: 0;
  color: #2f2635;
  letter-spacing: -0.025em;
}

.workspace-heading h2 {
  font-size: clamp(1.65rem, 2vw, 2rem);
  line-height: 1.15;
}

.panel-heading h3 {
  font-size: 1.1rem;
  line-height: 1.3;
}

.workspace-heading p:not(.eyebrow),
.panel-heading p:not(.eyebrow) {
  margin: 9px 0 0;
  max-width: 760px;
  color: #716777;
  line-height: 1.65;
}

.eyebrow {
  margin: 0 0 8px;
  color: #6e5084;
  font-size: 0.74rem;
  font-weight: 850;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}
```

## Panels

```tsx
<section className="panel">
  <div className="panel-heading">
    <div>
      <p className="eyebrow">Section label</p>
      <h3>Panel title</h3>
      <p>Panel description.</p>
    </div>
  </div>

  {/* panel content */}
</section>
```

```css
.panel {
  padding: 22px;
  border: 1px solid #e6ddea;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 12px 34px rgba(75, 55, 84, 0.055);
}
```

Use a soft highlighted panel for the most important control:

```css
.highlight-panel {
  border-color: #ddcfe6;
  background:
    linear-gradient(
      135deg,
      rgba(247, 241, 252, 0.9),
      rgba(255, 255, 255, 0.98)
    );
}
```

## Summary cards

Use four cards on desktop where the data is useful.

```tsx
<div className="summary-grid">
  <article>
    <span>Metric label</span>
    <strong>Value</strong>
    <small>Supporting description</small>
  </article>
</div>
```

```css
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.summary-grid article {
  position: relative;
  min-height: 128px;
  overflow: hidden;
  padding: 20px;
  border: 1px solid #e6ddea;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 10px 28px rgba(75, 55, 84, 0.055);
}

.summary-grid article::after {
  position: absolute;
  top: -34px;
  right: -34px;
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: #f5eef9;
  content: "";
}

.summary-grid span,
.summary-grid small {
  position: relative;
  z-index: 1;
  display: block;
  color: #716777;
}

.summary-grid span {
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.035em;
  text-transform: uppercase;
}

.summary-grid strong {
  position: relative;
  z-index: 1;
  display: block;
  margin: 9px 0 5px;
  color: #34293a;
  font-size: 1.9rem;
  line-height: 1;
}

.summary-grid small {
  font-size: 0.84rem;
  line-height: 1.45;
}
```

## Buttons

```css
.primary,
.secondary {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 17px;
  border-radius: 12px;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.primary {
  border: 1px solid #6e5084;
  background: #6e5084;
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(110, 80, 132, 0.16);
}

.primary:hover:not(:disabled) {
  background: #624676;
  border-color: #624676;
  box-shadow: 0 10px 22px rgba(110, 80, 132, 0.22);
  transform: translateY(-1px);
}

.secondary {
  border: 1px solid #d9cbe2;
  background: #ffffff;
  color: #6e5084;
}

.secondary:hover:not(:disabled) {
  border-color: #bca2cd;
  background: #faf7fc;
  transform: translateY(-1px);
}

.primary:disabled,
.secondary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}
```

## Forms

```tsx
<div className="form-grid two-column">
  <label className="field">
    <span>Field label</span>
    <input />
  </label>

  <label className="field full-width">
    <span>Long field</span>
    <textarea rows={5} />
    <small>Supporting text or character count</small>
  </label>
</div>
```

```css
.form-grid {
  display: grid;
  gap: 17px;
  margin-top: 20px;
}

.form-grid.two-column {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field {
  display: grid;
  gap: 8px;
}

.field.full-width {
  grid-column: 1 / -1;
}

.field > span {
  color: #4b3f50;
  font-size: 0.84rem;
  font-weight: 800;
}

.field input,
.field textarea,
.field select {
  width: 100%;
  border: 1px solid #d9cfdd;
  border-radius: 12px;
  background: #ffffff;
  padding: 12px 13px;
  color: #332a37;
  font: inherit;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;
}

.field input,
.field select {
  min-height: 44px;
}

.field textarea {
  resize: vertical;
  line-height: 1.55;
}

.field input:hover:not(:disabled),
.field textarea:hover:not(:disabled),
.field select:hover:not(:disabled) {
  border-color: #c5b4ce;
}

.field input:focus,
.field textarea:focus,
.field select:focus {
  border-color: #8a6b9f;
  box-shadow: 0 0 0 3px rgba(110, 80, 132, 0.1);
  outline: none;
}

.field input:disabled,
.field textarea:disabled,
.field select:disabled {
  background: #f7f4f8;
  color: #837a86;
}

.field small {
  color: #817584;
  font-size: 0.78rem;
  line-height: 1.4;
}
```

## Switches

```tsx
<label className="setting-row">
  <div>
    <strong>Setting name</strong>
    <span>Explanation of what the setting controls.</span>
  </div>

  <span className="switch-control">
    <input type="checkbox" />
    <span className="switch" aria-hidden="true" />
    <span className="switch-label">Enabled</span>
  </span>
</label>
```

```css
.setting-row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  padding: 17px;
  border: 1px solid #e6ddea;
  border-radius: 16px;
  background: #ffffff;
  cursor: pointer;
}

.switch-control {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: 0 0 auto;
}

.switch-control input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.switch {
  position: relative;
  width: 48px;
  height: 26px;
  border-radius: 999px;
  background: #d8d0dc;
  transition: 0.2s ease;
}

.switch::after {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 2px 7px rgba(50, 35, 59, 0.2);
  transition: 0.2s ease;
  content: "";
}

.switch-control input:checked + .switch {
  background: #6e5084;
}

.switch-control input:checked + .switch::after {
  transform: translateX(22px);
}

.switch-label {
  min-width: 62px;
  color: #5f5364;
  font-size: 0.8rem;
  font-weight: 800;
}
```

## Notices

```css
.notice {
  padding: 14px 16px;
  border: 1px solid transparent;
  border-radius: 14px;
  font-weight: 750;
  line-height: 1.5;
}

.notice.success {
  border-color: #cfe9da;
  background: #eef9f3;
  color: #246b46;
}

.notice.error {
  border-color: #f1d0d6;
  background: #fff3f5;
  color: #963746;
}
```

## Empty and error states

```tsx
<div className="state">
  <span aria-hidden="true">✦</span>
  <h3>No records found</h3>
  <p>Explain what the user can do next.</p>
</div>
```

```css
.state {
  padding: 48px 26px;
  border: 1px dashed #d9cfdd;
  border-radius: 20px;
  background: #fcfafc;
  text-align: center;
}

.state > span {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin: 0 auto 14px;
  border-radius: 50%;
  background: #f0e7f5;
  color: #6e5084;
  font-weight: 900;
}

.state h2,
.state h3 {
  margin: 0 0 8px;
}

.state p {
  margin: 0 auto 20px;
  max-width: 650px;
  color: #746a78;
  line-height: 1.6;
}

.state.error > span {
  background: #fff0f2;
  color: #9d3645;
}
```

## Loading skeletons

```css
.skeleton {
  border-radius: 16px;
  background: linear-gradient(
    90deg,
    #f3eef5 25%,
    #faf8fb 50%,
    #f3eef5 75%
  );
  background-size: 200% 100%;
  animation: leoWorkspacePulse 1.4s infinite;
}

@keyframes leoWorkspacePulse {
  to {
    background-position: -200% 0;
  }
}
```

## Responsive breakpoints

```css
@media (max-width: 980px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .workspace-heading,
  .panel-heading {
    display: grid;
  }

  .heading-actions {
    justify-content: flex-start;
  }

  .form-grid.two-column {
    grid-template-columns: 1fr;
  }

  .field.full-width {
    grid-column: auto;
  }
}

@media (max-width: 560px) {
  .feature-name-workspace {
    gap: 18px;
  }

  .panel {
    padding: 18px;
    border-radius: 17px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .heading-actions,
  .form-actions,
  .primary,
  .secondary {
    width: 100%;
  }
}
```

## Design rules

1. Every workspace begins with a workspace heading.
2. Use summary cards only for useful, live information.
3. Group related controls inside white panel cards.
4. Use a highlighted soft-purple panel for the primary status or action area.
5. Keep 24px between major workspace sections.
6. Use 20–22px panel padding on desktop and 18px on mobile.
7. Use 12px radius for buttons and inputs.
8. Use 18–20px radius for panels and summary cards.
9. Avoid red/amber/green dashboard tiles. Use status colours only inside pills, notices and states.
10. Every workspace must include loading, empty, error and success states where relevant.
11. Keep database and workflow logic separate from design-only changes.
12. Scope every selector beneath the workspace class to prevent style collisions.
13. Use complete replacement components rather than fragmented style patches.
14. Use `<style>{styles}</style>` for these existing LEO workspace components.
15. Desktop forms may use two columns; mobile forms must collapse to one column.
