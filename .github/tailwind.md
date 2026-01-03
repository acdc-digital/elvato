# Tailwind CSS

> Tailwind CSS is a utility-first CSS framework for rapidly building modern websites without ever leaving your HTML.

This project uses Tailwind CSS for styling across all Next.js applications.

## Key Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind CSS Cheat Sheet](https://nerdcave.com/tailwind-cheat-sheet)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

## Core Concepts

### Utility-First Fundamentals

- **Utility classes**: Low-level classes that do one thing (e.g., `text-center`, `flex`, `pt-4`)
- **Composition**: Build complex designs by combining utility classes
- **Responsive design**: Built-in responsive modifiers (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`)

### Class Naming Convention

```tsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  {/* Layout utilities: flex, items-center, justify-between */}
  {/* Spacing: p-4 (padding) */}
  {/* Colors: bg-white */}
  {/* Effects: rounded-lg, shadow-md */}
</div>
```

## Common Patterns

### Layout

```tsx
// Flexbox
<div className="flex flex-col items-center justify-center gap-4">

// Grid
<div className="grid grid-cols-2 md:grid-cols-4 gap-6">

// Container
<div className="container mx-auto px-4">
```

### Responsive Design

```tsx
// Mobile-first approach
<div className="text-sm md:text-base lg:text-lg">
  {/* Small text on mobile, base on tablet, large on desktop */}
</div>

// Hide/show at breakpoints
<div className="hidden md:block">
  {/* Hidden on mobile, visible on tablet and up */}
</div>
```

### Spacing Scale

- `0` = 0px
- `1` = 0.25rem (4px)
- `2` = 0.5rem (8px)
- `4` = 1rem (16px)
- `6` = 1.5rem (24px)
- `8` = 2rem (32px)
- `12` = 3rem (48px)
- `16` = 4rem (64px)

### Colors

```tsx
// Background colors
<div className="bg-gray-100 dark:bg-gray-900">

// Text colors
<p className="text-gray-800 dark:text-gray-200">

// Border colors
<div className="border-2 border-gray-300">
```

### Typography

```tsx
// Font size
<p className="text-xs">Extra small</p>
<p className="text-sm">Small</p>
<p className="text-base">Base</p>
<p className="text-lg">Large</p>
<p className="text-xl">Extra large</p>
<p className="text-2xl">2XL</p>

// Font weight
<p className="font-light">Light</p>
<p className="font-normal">Normal</p>
<p className="font-medium">Medium</p>
<p className="font-semibold">Semibold</p>
<p className="font-bold">Bold</p>
```

## Best Practices

### 1. Component Extraction

Extract repeated utility combinations into reusable components:

```tsx
// ❌ Don't repeat long class strings
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">

// ✅ Extract into component
function Button({ children }) {
  return (
    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
      {children}
    </button>
  )
}
```

### 2. Responsive Design

Use mobile-first approach:

```tsx
// ✅ Mobile-first (default → small screens → large screens)
<div className="w-full md:w-1/2 lg:w-1/3">

// ❌ Desktop-first (harder to maintain)
<div className="w-1/3 lg:w-1/2 md:w-full">
```

### 3. State Variants

```tsx
// Hover, focus, active states
<button className="bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 active:bg-blue-800">

// Group hover (parent-child relationship)
<div className="group">
  <img className="group-hover:scale-110 transition-transform" />
</div>
```

### 4. Dark Mode

```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
```

### 5. Custom Values

Use arbitrary values when needed:

```tsx
// Custom spacing
<div className="p-[13px]">

// Custom colors
<div className="bg-[#1da1f2]">

// Custom values
<div className="top-[117px]">
```

## Project-Specific Guidelines

### Consistency

- Use the project's defined spacing scale consistently
- Follow the color palette defined in `tailwind.config.ts`
- Use consistent border radius values

### Component Patterns

```tsx
// Product cards
<div className="border-2 border-black rounded-2xl overflow-hidden">

// Containers
<div className="container mx-auto px-4 small:px-6 py-8">

// Navigation
<nav className="h-24 border-b border-gray-200">
```

### Custom Breakpoints

Check `tailwind.config.ts` for project-specific breakpoints:

```typescript
// Example custom breakpoint
screens: {
  'small': '640px',
  'medium': '1024px',
  'large': '1280px',
}
```

## Performance Tips

1. **PurgeCSS**: Tailwind automatically removes unused CSS in production
2. **JIT Mode**: Tailwind uses JIT (Just-In-Time) compilation by default
3. **Avoid @apply**: Use utility classes directly instead of `@apply` in CSS files
4. **Component extraction**: Extract repeated patterns to reduce HTML bloat
