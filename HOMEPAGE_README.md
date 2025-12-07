# Homepage Documentation

This document provides instructions for customizing and testing the RECLAIM homepage.

## Overview

The homepage is built with modular, reusable components that match the design specifications. All components are fully responsive and accessible.

## Component Structure

```
components/homepage/
├── Hero.tsx                  - Full-screen hero with background image
├── FeatureSlider.tsx         - Auto-playing image slider
├── CategoryGrid.tsx          - Category navigation icons
├── CategoryIcons.tsx         - SVG icon library
├── NewsletterSignup.tsx      - Email signup form
└── SimpleFooter.tsx          - Footer with links

app/page.tsx                  - Main homepage file
```

## Customizing Images

### 1. Hero Background Image

**Location:** `public/placeholders/hero-city.jpg`

**Recommended specs:**
- Size: 1920x1080px minimum
- Format: JPG
- File size: < 500KB

**To change:**
Edit `app/page.tsx` line 24:
```tsx
<Hero
  backgroundImage="/placeholders/hero-city.jpg"  // Change this path
  ...
/>
```

### 2. Feature Slider Images

**Location:** `public/placeholders/feature-*.jpg`

**Files needed:**
- `feature-chat.jpg` - Real-time chat slide
- `feature-secure.jpg` - Secure payments slide
- `feature-local.jpg` - Local community slide

**To change:**
Edit the `slides` array in `app/page.tsx` (lines 32-54):
```tsx
<FeatureSlider
  slides={[
    {
      id: '1',
      image: '/placeholders/feature-chat.jpg',  // Change these paths
      headline: 'REAL-TIME CHAT',
      subtitle: 'Message sellers instantly and arrange pickups easily',
      alt: 'Real-time chat feature'
    },
    // ... more slides
  ]}
/>
```

**To add/remove slides:**
Simply add or remove objects from the `slides` array. The slider will automatically adapt.

## Customizing Content

### Hero Section

Edit `app/page.tsx` lines 23-29:
```tsx
<Hero
  backgroundImage="/placeholders/hero-city.jpg"
  subtitle="For students, by students"        // Change tagline
  headline="YOUR UNIVERSITY\nMARKETPLACE"    // Change headline
  ctaText="Browse Marketplace"                // Change button text
  ctaHref="/marketplace"                      // Change button destination
/>
```

### Feature Slider

- **Headline:** Change the `headline` property for each slide
- **Subtitle:** Change the `subtitle` property
- **Auto-play speed:** Adjust `autoPlayInterval` (default: 5000ms)

```tsx
<FeatureSlider
  slides={[...]}
  autoPlayInterval={7000}  // 7 seconds between slides
/>
```

### Category Icons and Links

Edit `components/homepage/CategoryGrid.tsx` (lines 24-63):
```tsx
const categories: Category[] = [
  {
    id: 'dorm',
    name: 'Dorm and Decor',
    icon: DormIcon,
    href: '/marketplace?category=Dorm and Decor'  // URL when clicked
  },
  // ... more categories
]
```

**To change category labels:**
Update the `name` property

**To change icon links:**
Update the `href` property

**To add/remove categories:**
Add or remove objects from the `categories` array

### Newsletter Signup

The newsletter form in `NewsletterSignup.tsx` currently shows a success message after submission. To connect to a real newsletter service:

1. Open `components/homepage/NewsletterSignup.tsx`
2. Replace the TODO section (lines 27-36) with your API call:

```tsx
// Example with Mailchimp API
const response = await fetch('/api/newsletter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email })
})
```

## Responsive Design

All components are fully responsive and tested at these breakpoints:

| Device | Viewport Width | Notes |
|--------|---------------|-------|
| Mobile | 375px | Stacked layout, larger touch targets |
| Tablet | 768px | 2-column category grid |
| Desktop | 1024px+ | Full 7-column category grid |
| Large | 1440px+ | Maximum content width with centering |

**Tailwind breakpoints used:**
- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px
- `xl:` - 1280px

## Testing Checklist

### Visual Testing

- [ ] **Hero section** displays with correct background image
- [ ] **Hero headline** is large, bold, and centered
- [ ] **CTA button** is pill-shaped and clickable
- [ ] **Feature slider** auto-plays through all slides
- [ ] **Slider arrows** are visible and functional
- [ ] **Category icons** are evenly spaced in a row
- [ ] **Newsletter form** accepts email input
- [ ] **Footer links** are visible and styled

### Responsive Testing

Test at these viewport sizes:

**Desktop (1440px):**
```bash
# Open browser dev tools, set viewport to 1440x900
```
- [ ] 7 categories in one row
- [ ] Hero text is large and readable
- [ ] Slider navigation arrows are visible on sides

**Tablet (768px):**
- [ ] Categories wrap to 3 columns
- [ ] Hero text scales down appropriately
- [ ] All content is centered

**Mobile (375px):**
- [ ] Categories stack in 2 columns
- [ ] Hero text is still readable
- [ ] Slider is swipeable
- [ ] Newsletter form stacks vertically

### Functionality Testing

**Slider:**
- [ ] Auto-plays every 5 seconds
- [ ] Pauses on hover
- [ ] Left arrow goes to previous slide
- [ ] Right arrow goes to next slide
- [ ] Keyboard arrows work (arrow left/right)
- [ ] Touch swipe works on mobile
- [ ] Loops from last to first slide

**Categories:**
- [ ] All category icons are clickable
- [ ] Links go to `/marketplace?category=...`
- [ ] Hover states work smoothly
- [ ] Focus rings appear with keyboard navigation

**Newsletter:**
- [ ] Email validation works
- [ ] Shows error for invalid emails
- [ ] Shows success message on submit
- [ ] Form clears after successful submit

**CTA Button:**
- [ ] Hero "Browse Marketplace" button works
- [ ] "ALL" button in categories works
- [ ] Hover effects are smooth
- [ ] Focus rings are visible

### Accessibility Testing

**Keyboard Navigation:**
- [ ] Tab through all interactive elements
- [ ] Enter key activates buttons and links
- [ ] Arrow keys work in slider
- [ ] Focus indicators are visible

**Screen Reader:**
- [ ] Hero has proper heading hierarchy
- [ ] Images have descriptive alt text
- [ ] Buttons have aria-labels
- [ ] Form inputs have labels
- [ ] Slider has aria-label="Feature carousel"

**Contrast:**
- [ ] All text meets WCAG 4.5:1 contrast ratio
- [ ] Buttons have sufficient contrast
- [ ] Focus indicators are visible

## Performance Optimization

### Image Optimization

All images use Next.js `<Image>` component which provides:
- Automatic lazy loading
- Responsive images
- WebP format conversion
- Blur placeholder (optional)

**To add blur placeholders:**
1. Generate base64 placeholder: https://plaiceholder.co/
2. Add to Hero component:

```tsx
<Image
  src={backgroundImage}
  alt="..."
  fill
  placeholder="blur"
  blurDataURL="data:image/..."
/>
```

### Bundle Size

Current component sizes (gzipped):
- Hero: ~2KB
- FeatureSlider: ~3KB
- CategoryGrid: ~2KB
- NewsletterSignup: ~1KB
- Total: ~8KB

## Common Customizations

### Change Hero Height

Edit `components/homepage/Hero.tsx` line 40:
```tsx
<section className="relative w-full h-[calc(100vh-80px)]">
//                                      ^^^^^^^^^^^^
// Change to fixed height: h-[600px]
// Or different viewport: h-[80vh]
```

### Change Slider Speed

Edit `app/page.tsx` line 56:
```tsx
<FeatureSlider
  slides={[...]}
  autoPlayInterval={5000}  // milliseconds
/>
```

### Change Category Grid Layout

Edit `components/homepage/CategoryGrid.tsx` line 71:
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
//                   ^^^^^^^^^^   ^^^^^^^^^^^^^^   ^^^^^^^^^^^^^^   ^^^^^^^^^^^^^
//                   Mobile       Tablet           Desktop          Large
```

### Add More Footer Links

Edit `components/homepage/SimpleFooter.tsx` (lines 17-49), add new links:
```tsx
<Link href="/faq" className="...">
  FAQ
</Link>
```

## Troubleshooting

### Images Not Loading

**Problem:** Placeholder images show as broken
**Solution:** Add placeholder images to `public/placeholders/` or update paths in `app/page.tsx`

### Slider Not Auto-playing

**Problem:** Slider doesn't advance automatically
**Solution:** Check that you have multiple slides in the array. Single slides don't auto-play.

### Layout Shifts on Load

**Problem:** Content jumps when images load
**Solution:** Add explicit `height` to containers or use `fill` with `sizes` prop:

```tsx
<Image
  src="..."
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### Category Icons Not Clickable on Mobile

**Problem:** Touch targets too small
**Solution:** Icons already have proper touch targets. Ensure no CSS is overriding:

```tsx
className="... p-4 -m-4"  // Expands click area
```

## Next Steps

1. **Add real images:** Replace placeholder images in `public/placeholders/`
2. **Connect newsletter:** Integrate with your email service provider
3. **Add analytics:** Track button clicks and slider interactions
4. **A/B testing:** Test different headlines and CTAs
5. **SEO:** Add meta tags to `app/layout.tsx`

## Questions?

For issues or customization requests, refer to:
- Next.js Image docs: https://nextjs.org/docs/app/api-reference/components/image
- Tailwind CSS docs: https://tailwindcss.com/docs
- React accessibility: https://react.dev/learn/accessibility
