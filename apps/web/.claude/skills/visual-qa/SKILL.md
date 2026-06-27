# Visual QA Skill

Automated visual quality assurance using browser preview tools. Run after UI changes to verify appearance and functionality.

## When to Use

After implementing or modifying UI components, views, or layouts. Especially important for:
- New components or views
- Layout changes
- Theme/styling updates
- Responsive design work

## Checklist

### 1. Page Load
- [ ] Page loads without console errors (`preview_console_logs level=error`)
- [ ] No failed network requests (`preview_network filter=failed`)
- [ ] All key elements render (`preview_snapshot`)

### 2. Layout & Spacing
- [ ] No content overflow or clipping
- [ ] Consistent spacing between sections
- [ ] Proper alignment of related elements
- [ ] Sidebar, inspector, and main content properly sized

### 3. Typography
- [ ] Text uses `text-body` or `text-caption` (not hardcoded px)
- [ ] Headings follow hierarchy
- [ ] No text truncation cutting off important content
- [ ] Mono font used for code/IDs/timestamps

### 4. Colors & Theme
- [ ] Uses CSS custom properties (not hardcoded hex)
- [ ] Proper contrast for readability
- [ ] Destructive actions use `--destructive` color
- [ ] Muted text uses `--muted-foreground`

### 5. Components
- [ ] Uses `@repo/design-system` components (no raw HTML)
- [ ] Loading states present (skeleton or spinner)
- [ ] Empty states present
- [ ] Error states handled

### 6. Interactive States
- [ ] Buttons respond to hover/click
- [ ] Form inputs accept input
- [ ] Modals open/close properly
- [ ] Dropdowns render in correct position

### 7. Responsive (if applicable)
- [ ] Test at mobile (375px), tablet (768px), desktop (1280px)
- [ ] No horizontal scrollbar at any viewport

## How to Run

Use preview tools to verify each category:

```
# Take screenshot for overall appearance
preview_screenshot

# Check for errors
preview_console_logs level=error
preview_network filter=failed

# Get accessibility tree for content verification
preview_snapshot

# Inspect specific element styles
preview_inspect selector=".button-primary" styles=["color", "background-color", "padding"]

# Test responsive
preview_resize preset=mobile
preview_screenshot
preview_resize preset=desktop
```
