# Dark Mode Implementation Guide

## Overview

Complete dark mode support has been added to ComplyEasyAI with:
- ✅ Light, Dark, and System theme modes
- ✅ localStorage persistence
- ✅ System preference detection
- ✅ Smooth transitions
- ✅ Tailwind CSS dark: variants

## Usage

### 1. Add Dark Mode Toggle to Layout

Update `components/Layout.tsx` to include the dark mode toggle:

```tsx
import { DarkModeToggleSimple } from './DarkModeToggle';

// In your header/navbar:
<div className="flex items-center gap-4">
  <DarkModeToggleSimple />
  {/* Other header items */}
</div>
```

### 2. Update Tailwind Configuration

Ensure `tailwind.config.js` has dark mode enabled:

```js
module.exports = {
  darkMode: 'class', // or 'media' for system preference only
  // ... rest of config
}
```

### 3. Add Dark Mode Classes to Components

Update your components to use dark mode variants:

**Before:**
```tsx
<div className="bg-white text-gray-900 border-gray-200">
  Content
</div>
```

**After:**
```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700">
  Content
</div>
```

## Common Dark Mode Patterns

### Backgrounds
```tsx
// Page background
className="bg-gray-50 dark:bg-gray-900"

// Card/panel background
className="bg-white dark:bg-gray-800"

// Secondary background
className="bg-gray-100 dark:bg-gray-700"
```

### Text Colors
```tsx
// Primary text
className="text-gray-900 dark:text-gray-100"

// Secondary text
className="text-gray-600 dark:text-gray-400"

// Muted text
className="text-gray-500 dark:text-gray-500"
```

### Borders
```tsx
className="border-gray-200 dark:border-gray-700"
```

### Buttons
```tsx
// Primary button
className="bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"

// Secondary button
className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
```

### Inputs
```tsx
className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
```

## Hook API

### useDarkMode()

```tsx
import { useDarkMode } from '../hooks/useDarkMode';

function MyComponent() {
  const { theme, setTheme, isDark, toggleDarkMode } = useDarkMode();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Is dark: {isDark ? 'Yes' : 'No'}</p>

      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('system')}>System</button>
      <button onClick={toggleDarkMode}>Toggle</button>
    </div>
  );
}
```

## Components

### DarkModeToggle (Full)

Three-button toggle for Light/System/Dark:

```tsx
import { DarkModeToggle } from './DarkModeToggle';

<DarkModeToggle className="my-custom-class" />
```

### DarkModeToggleSimple

Single button toggle (Sun/Moon icon):

```tsx
import { DarkModeToggleSimple } from './DarkModeToggle';

<DarkModeToggleSimple className="my-custom-class" />
```

## Updating Existing Components

### Priority Components to Update:

1. **Layout.tsx** - Add toggle, update backgrounds
2. **Dashboard.tsx** - Update cards, charts
3. **Frameworks.tsx** - Update tables, modals
4. **VendorManagement.tsx** - Update list, details
5. **PolicyManagement.tsx** - Update editor, preview
6. **Reports.tsx** - Update report preview

### Example Component Update:

**Before:**
```tsx
export const Dashboard = () => {
  return (
    <div className="p-6 bg-gray-50">
      <div className="bg-white rounded-lg p-4 shadow">
        <h2 className="text-gray-900">Compliance Score</h2>
        <p className="text-gray-600">94.2%</p>
      </div>
    </div>
  );
};
```

**After:**
```tsx
export const Dashboard = () => {
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg dark:shadow-gray-900/50">
        <h2 className="text-gray-900 dark:text-gray-100">Compliance Score</h2>
        <p className="text-gray-600 dark:text-gray-400">94.2%</p>
      </div>
    </div>
  );
};
```

## Chart Libraries (Recharts)

For charts using Recharts, update colors for dark mode:

```tsx
import { useDarkMode } from '../hooks/useDarkMode';

function MyChart() {
  const { isDark } = useDarkMode();

  return (
    <LineChart>
      <XAxis stroke={isDark ? '#9CA3AF' : '#4B5563'} />
      <YAxis stroke={isDark ? '#9CA3AF' : '#4B5563'} />
      <Line stroke={isDark ? '#60A5FA' : '#3B82F6'} />
    </LineChart>
  );
}
```

## Testing

Test dark mode in your components:

```tsx
// e2e/dark-mode.spec.ts
import { test, expect } from '@playwright/test';

test('dark mode toggle works', async ({ page }) => {
  await page.goto('/');

  // Toggle to dark mode
  await page.click('[aria-label="Switch to dark mode"]');

  // Verify dark class is added
  const html = page.locator('html');
  await expect(html).toHaveClass(/dark/);

  // Toggle back to light
  await page.click('[aria-label="Switch to light mode"]');
  await expect(html).not.toHaveClass(/dark/);
});
```

## Performance

- ✅ No FOUC (Flash of Unstyled Content) - theme is applied before render
- ✅ Smooth transitions with Tailwind's transition utilities
- ✅ localStorage caching prevents theme flicker on reload
- ✅ System preference detection respects user's OS settings

## Browser Support

Works in all modern browsers:
- ✅ Chrome/Edge 76+
- ✅ Firefox 67+
- ✅ Safari 12.1+
- ✅ Mobile browsers

## Troubleshooting

**Problem:** Theme not persisting
**Solution:** Check localStorage is enabled and not blocked

**Problem:** Flash of wrong theme on page load
**Solution:** Ensure hook is called at the top level of your app

**Problem:** Dark mode classes not applying
**Solution:** Verify `darkMode: 'class'` is set in tailwind.config.js

## Future Enhancements

Potential improvements:
- [ ] Per-component theme overrides
- [ ] Theme customization (custom colors)
- [ ] High contrast mode
- [ ] Scheduled theme switching (auto dark at night)

---

*Generated as part of ComplyEasyAI Production Readiness v2.0*
