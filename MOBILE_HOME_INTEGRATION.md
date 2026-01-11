# Mobile Home Integration Guide

## Quick Integration

Add the `MobileHome` component to your homepage. It will **only** show on mobile devices (hidden on `md` breakpoint and above).

### Step 1: Import the component

In your `app/page.tsx` (or wherever your homepage lives):

```tsx
import MobileHome from '@/components/MobileHome'

export default function Home() {
  return (
    <>
      {/* Mobile-only homepage - hidden on desktop */}
      <MobileHome />

      {/* Your existing desktop homepage - unchanged */}
      {/* ... existing desktop content ... */}
    </>
  )
}
```

### Step 2: Add placeholder images (optional)

Create placeholder images or update the paths in `MobileHome.tsx`:

- `/hero-mobile.jpg` - Hero section background (480x384px recommended)
- `/placeholder-laptop.jpg` - Verified listing card (256x192px)
- `/placeholder-chair.jpg` - Verified listing card (256x192px)
- `/placeholder-books.jpg` - Verified listing card (256x192px)

Or update the `src` attributes to use your actual image paths.

### Step 3: Test on mobile

1. Open your site in Chrome DevTools
2. Toggle device emulation (Cmd/Ctrl + Shift + M)
3. Select a mobile device (iPhone, Pixel, etc.)
4. Verify:
   - ✅ Fixed compact header visible
   - ✅ Hamburger menu opens drawer
   - ✅ Categories scroll horizontally
   - ✅ All tap targets are easily clickable
   - ✅ Desktop view is unchanged

## Component Features

### Header
- **Logo**: UME (left)
- **Icons**: Search, Cart, Menu (right)
- **Drawer**: Slides from right with Profile, Messages, Create, Marketplace

### Sections (in order)
1. Hero with image + CTA
2. Verified listings (horizontal scroll)
3. Categories (horizontal scroll with "ALL" chip)
4. Email signup strip
5. Fixed footer

### Accessibility
- Minimum 44×44px tap targets
- Focus trap in drawer
- ESC key closes drawer
- aria-labels on all icon buttons
- Keyboard navigation support

## Customization

### Change drawer slide direction
In `MobileHome.tsx`, line ~185, the drawer slides from **right**. To slide from **bottom**:

```tsx
// Change classes from:
className="fixed top-0 right-0 bottom-0 w-64..."

// To:
className="fixed left-0 right-0 bottom-0 h-96..."
```

### Add scroll-snap to categories
In the categories section (line ~372), add:

```tsx
<div className="overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-2">
  <div className="flex gap-4 min-w-max">
    {categories.map((cat) => (
      <Link className="... snap-center">
```

### Swap emoji icons for SVGs
Replace `cat.emoji` in the categories map with actual SVG icons:

```tsx
{categories.map((cat) => (
  <Link key={cat.name} href={cat.href}>
    <div className="...">
      {cat.icon} {/* Pass SVG component instead of emoji */}
    </div>
```

## PR Checklist

Before merging:

- [ ] Mobile-only (md:hidden) verified - desktop unchanged
- [ ] All tap targets >=44px
- [ ] Drawer accessible & dismissible (ESC, click outside)
- [ ] Images lazy-loaded (loading="lazy")
- [ ] Test on real device (iOS + Android)
- [ ] Categories scroll smoothly with partial next item visible
- [ ] Footer stays at bottom on short content

## Notes

- No desktop styles affected (all changes wrapped in `md:hidden`)
- Drawer uses simple React state (no external libraries)
- Categories use native overflow scroll (can upgrade to Embla/Swiper later)
- Emojis as placeholder icons (swap for production SVGs)
- Compact typography: `text-sm` base, `text-base` for headings
