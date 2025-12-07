# Homepage QA Checklist

Use this checklist to verify visual parity with the design screenshots across all devices.

## Test Environments

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Viewport Testing

### Desktop - 1440px × 900px

**Hero Section:**
- [ ] Background image covers full width
- [ ] Headline "YOUR UNIVERSITY MARKETPLACE" is centered
- [ ] Font size is large (approximately 100px)
- [ ] Subtitle "For students, by students" appears above headline
- [ ] CTA button "Browse Marketplace" is pill-shaped
- [ ] Button has dark background (gray-900)
- [ ] Smooth fade from hero to slider section

**Feature Slider:**
- [ ] Full-width slider displays correctly
- [ ] Image covers entire slider area
- [ ] Headline is centered and large
- [ ] Subtitle appears below headline
- [ ] Left/right arrow buttons are visible
- [ ] Arrows are positioned on far left/right
- [ ] Arrows are circular with dark background
- [ ] Slide indicators appear at bottom center
- [ ] Auto-play starts after page load
- [ ] Hover pauses auto-play
- [ ] Arrow click changes slides
- [ ] Smooth transitions between slides

**Category Grid:**
- [ ] "CATEGORIES" heading is centered
- [ ] Heading has wide letter-spacing
- [ ] "ALL" button is centered below heading
- [ ] ALL button has outline style (border, no fill)
- [ ] 7 icons display in single row
- [ ] Icons are evenly spaced
- [ ] Icon size is consistent (~80-100px)
- [ ] Labels appear below each icon
- [ ] Hover effect scales icons slightly
- [ ] Icons match screenshot style (simple line art)

**Newsletter:**
- [ ] "SIGN UP TO RECLAIM MAIL" heading centered
- [ ] Input and button on same row
- [ ] Input has dark border
- [ ] Button has dark background
- [ ] Button is pill-shaped
- [ ] Privacy note appears below form

**Footer:**
- [ ] Links are horizontal and centered
- [ ] Copyright text appears below links
- [ ] Border line above footer

---

### Tablet - 1024px × 768px

**Hero:**
- [ ] Headline scales down appropriately
- [ ] Still readable and centered
- [ ] CTA button remains prominent

**Slider:**
- [ ] Full-width maintained
- [ ] Arrows still visible and functional
- [ ] Touch/mouse interactions work

**Categories:**
- [ ] Icons wrap to 4 columns
- [ ] Spacing remains even
- [ ] ALL button centered

**Newsletter:**
- [ ] Form layout maintained
- [ ] Input and button on same row

---

### Tablet - 768px × 1024px

**Hero:**
- [ ] Headline size reduced but readable
- [ ] Vertical spacing adjusted

**Categories:**
- [ ] Icons display in 3 columns
- [ ] Grid wraps naturally
- [ ] Touch targets are large enough (48px minimum)

**Newsletter:**
- [ ] Input and button stack vertically
- [ ] Full-width inputs
- [ ] Proper spacing between elements

---

### Mobile - 375px × 667px

**Hero:**
- [ ] Background image visible and well-positioned
- [ ] Headline is readable (approximately 48-60px)
- [ ] Subtitle visible above headline
- [ ] CTA button spans appropriate width
- [ ] Button text is readable
- [ ] Proper padding on left/right edges

**Slider:**
- [ ] Full-width slider
- [ ] Headline and subtitle readable
- [ ] Arrows visible (smaller size OK)
- [ ] Touch swipe gestures work
- [ ] Swipe left shows next slide
- [ ] Swipe right shows previous slide

**Categories:**
- [ ] Icons display in 2 columns
- [ ] Icon size remains comfortable
- [ ] Labels wrap if needed
- [ ] Touch targets are 48px+ for accessibility
- [ ] ALL button is full-width or centered

**Newsletter:**
- [ ] Heading readable
- [ ] Input stacks above button
- [ ] Both elements are full-width
- [ ] Button is easy to tap
- [ ] Form validation works

**Footer:**
- [ ] Links wrap if needed
- [ ] Links are readable
- [ ] Adequate spacing for tapping

---

## Functional Testing

### Hero Section
- [ ] "Browse Marketplace" button navigates to `/marketplace`
- [ ] Button shows hover state
- [ ] Button shows focus ring on keyboard focus
- [ ] Button is accessible via keyboard (Tab + Enter)

### Feature Slider
- [ ] Slider auto-advances every 5 seconds
- [ ] Hovering pauses auto-play
- [ ] Mouse leaving resumes auto-play
- [ ] Left arrow shows previous slide
- [ ] Right arrow shows next slide
- [ ] Slides loop (last → first, first → last)
- [ ] Keyboard left arrow works
- [ ] Keyboard right arrow works
- [ ] Touch swipe left advances slide
- [ ] Touch swipe right goes to previous slide
- [ ] Slide indicators show current position
- [ ] Clicking indicator jumps to that slide
- [ ] Transitions are smooth (no flashing)

### Category Grid
- [ ] "ALL" button links to `/marketplace`
- [ ] "Dorm and Decor" links to `/marketplace?category=Dorm and Decor`
- [ ] "Fun and Craft" links to `/marketplace?category=Fun and Craft`
- [ ] "Transportation" links to `/marketplace?category=Transportation`
- [ ] "Tech and Gadgets" links to `/marketplace?category=Tech and Gadgets`
- [ ] "Clothing & Accessories" links to `/marketplace?category=Clothing and Accessories`
- [ ] "Giveaways" links to `/marketplace?category=Giveaways`
- [ ] "Other" links to `/marketplace?category=Other`
- [ ] All icons show hover effect
- [ ] All icons are keyboard accessible
- [ ] Focus rings are visible

### Newsletter Signup
- [ ] Empty email shows validation error
- [ ] Invalid email (no @) shows error
- [ ] Valid email shows success message
- [ ] Form clears after successful submit
- [ ] Loading state shows during submission
- [ ] Button disables during loading
- [ ] Error messages are accessible
- [ ] Success message is accessible

### Footer
- [ ] All links are clickable
- [ ] Hover states work
- [ ] Links are keyboard accessible
- [ ] Copyright year is current

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab key moves through all interactive elements
- [ ] Tab order is logical (top to bottom)
- [ ] All buttons/links show focus indicators
- [ ] Enter key activates focused element
- [ ] Arrow keys work in slider
- [ ] Escape key (if applicable) works

### Screen Reader
Run with NVDA (Windows) or VoiceOver (Mac):
- [ ] Page title announced
- [ ] Heading hierarchy is correct (H1 → H2)
- [ ] Hero headline announced as heading
- [ ] Images have descriptive alt text
- [ ] Links announce destination
- [ ] Buttons announce as buttons
- [ ] Form inputs have labels
- [ ] Error messages are announced
- [ ] Success messages are announced
- [ ] Slider region is announced

### Color Contrast
Use WebAIM Contrast Checker or browser DevTools:
- [ ] Hero headline: black on light background (passes AAA)
- [ ] Hero subtitle: dark gray on light (passes AA)
- [ ] CTA button: white on dark gray (passes AAA)
- [ ] Slider headline: dark text on image (passes AA with overlay)
- [ ] Category labels: black on white (passes AAA)
- [ ] Newsletter heading: black on gray-50 (passes AAA)
- [ ] Footer links: gray-600 on white (passes AA)

### Focus Indicators
- [ ] All interactive elements have visible focus rings
- [ ] Focus rings have sufficient contrast
- [ ] Focus rings are not obscured

---

## Performance Testing

### Page Load
- [ ] Homepage loads in < 3 seconds (3G connection)
- [ ] Images load progressively
- [ ] No layout shift when images load
- [ ] Slider doesn't auto-play before images load

### Interactions
- [ ] Button clicks are instant (< 100ms)
- [ ] Hover effects are smooth
- [ ] Slider transitions are 60fps
- [ ] No janky scrolling

### Lighthouse Scores (Chrome DevTools)
Target scores:
- [ ] Performance: 90+
- [ ] Accessibility: 95+
- [ ] Best Practices: 95+
- [ ] SEO: 90+

---

## Visual Regression

Compare to screenshots:

### Screenshot 1 (Hero)
- [ ] Layout matches exactly
- [ ] Headline positioning matches
- [ ] Subtitle positioning matches
- [ ] Button styling matches
- [ ] Background image placement similar

### Screenshot 2 (Slider)
- [ ] Layout matches exactly
- [ ] Arrow button placement matches
- [ ] Arrow button styling matches
- [ ] Headline positioning matches
- [ ] Subtitle positioning matches

### Screenshot 3 (Categories)
- [ ] "CATEGORIES" heading matches
- [ ] "ALL" button styling matches
- [ ] Icon arrangement matches (7 in a row)
- [ ] Icon size similar
- [ ] Label placement matches
- [ ] Newsletter heading matches
- [ ] Newsletter section layout matches

---

## Cross-Browser Issues

Document any browser-specific issues:

| Issue | Browser | Severity | Notes |
|-------|---------|----------|-------|
| | | | |

---

## Known Limitations

- [ ] Placeholder images need replacement
- [ ] Newsletter form doesn't connect to API yet
- [ ] No analytics tracking implemented

---

## Sign-Off

- [ ] All critical issues resolved
- [ ] Visual parity confirmed across devices
- [ ] Accessibility requirements met
- [ ] Performance targets met
- [ ] Ready for production deployment

**Tested by:** _______________
**Date:** _______________
**Notes:** _______________
