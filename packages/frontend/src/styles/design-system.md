# UI Design System

This document outlines the design system for the Leadership Training platform.

## Color Palette

### Primary Colors
- **Indigo**: `#4F46E5` (indigo-600) - Primary actions, links
- **Dark Indigo**: `#3730A3` (indigo-700) - Hover states
- **Light Indigo**: `#6366F1` (indigo-500) - Backgrounds

### Secondary Colors
- **Gray Scale**:
  - `#F9FAFB` (gray-50) - Page backgrounds
  - `#F3F4F6` (gray-100) - Card backgrounds
  - `#E5E7EB` (gray-200) - Borders
  - `#9CA3AF` (gray-400) - Placeholders
  - `#6B7280` (gray-500) - Secondary text
  - `#374151` (gray-700) - Primary text
  - `#111827` (gray-900) - Headings

### Status Colors
- **Success**: `#10B981` (emerald-500)
- **Warning**: `#F59E0B` (amber-500)
- **Error**: `#EF4444` (red-500)
- **Info**: `#3B82F6` (blue-500)

## Typography

### Font Family
- Primary: `Inter, ui-sans-serif, system-ui, sans-serif`

### Font Sizes
- **Text XS**: `12px` / `16px` line height
- **Text SM**: `14px` / `20px` line height
- **Text Base**: `16px` / `24px` line height
- **Text LG**: `18px` / `28px` line height
- **Text XL**: `20px` / `28px` line height
- **Text 2XL**: `24px` / `32px` line height
- **Text 3XL**: `30px` / `36px` line height

### Font Weights
- **Normal**: `400`
- **Medium**: `500`
- **Semibold**: `600`
- **Bold**: `700`

## Spacing

### Scale (Tailwind)
- `0.5` = `2px`
- `1` = `4px`
- `2` = `8px`
- `3` = `12px`
- `4` = `16px`
- `6` = `24px`
- `8` = `32px`
- `12` = `48px`
- `16` = `64px`
- `20` = `80px`

## Components

### Buttons

#### Primary Button
```tsx
className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
```

#### Secondary Button
```tsx
className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
```

#### Danger Button
```tsx
className="bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
```

### Form Elements

#### Input Field
```tsx
className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
```

#### Select Dropdown
```tsx
className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
```

#### Textarea
```tsx
className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 resize-none"
```

### Cards

#### Basic Card
```tsx
className="bg-white rounded-lg shadow border border-gray-200 p-6"
```

#### Interactive Card
```tsx
className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
```

### Status Indicators

#### Success Badge
```tsx
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
```

#### Warning Badge
```tsx
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
```

#### Error Badge
```tsx
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
```

## Layout

### Container Widths
- **Max Width**: `max-w-7xl` (1280px)
- **Container Padding**: `px-4 sm:px-6 lg:px-8`

### Grid System
- **Responsive Grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **Gap**: `gap-4` or `gap-6` for larger layouts

## Responsive Breakpoints

- **SM**: `640px` and up
- **MD**: `768px` and up
- **LG**: `1024px` and up
- **XL**: `1280px` and up
- **2XL**: `1536px` and up

## Accessibility

### Focus States
All interactive elements must have visible focus indicators:
```tsx
focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
```

### Color Contrast
- Minimum contrast ratio: 4.5:1 for normal text
- Minimum contrast ratio: 3:1 for large text (18px+)

### ARIA Labels
Use appropriate ARIA labels for screen readers:
```tsx
aria-label="Description of action"
aria-describedby="error-message-id"
```

## Performance Guidelines

### Image Optimization
- Use WebP format when possible
- Implement lazy loading for images below the fold
- Provide appropriate alt text for accessibility

### Bundle Size
- Keep individual chunks under 1MB
- Use code splitting for route-based chunks
- Implement tree shaking for unused code

### Component Performance
- Use React.memo for expensive re-renders
- Implement useCallback for event handlers
- Use useMemo for expensive calculations
- Virtual scrolling for large lists (500+ items)

## Usage Examples

### Page Layout
```tsx
<div className="min-h-screen bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 className="text-3xl font-bold text-gray-900 mb-8">Page Title</h1>
    {/* Page content */}
  </div>
</div>
```

### Form Section
```tsx
<div className="bg-white rounded-lg shadow p-6">
  <h2 className="text-lg font-medium text-gray-900 mb-4">Form Title</h2>
  <form className="space-y-4">
    {/* Form fields */}
  </form>
</div>
```

This design system ensures consistency across the application while maintaining performance and accessibility standards.