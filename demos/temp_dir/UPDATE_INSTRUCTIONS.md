# AWR Group Website - Update Instructions

## Files Updated in temp_dir

The following files have been updated with the latest changes:

### 1. `/custom/scripts.js` (maps to temp_dir/scripts.js)
**Changes made:**
- Carousel auto-rotate interval changed from 2000ms (2 seconds) to 4000ms (4 seconds)
- **IMPROVED** touch/swipe support for mobile devices with better detection
- Added swipe left/right gesture detection with vertical scroll awareness
- Added visual swipe hint indicator for mobile users
- Added lazy loading for carousel images (only first 3 preload)

**Line 78:** Changed `setInterval(nextSlide, 2000)` to `setInterval(nextSlide, 4000)`
**Lines 109-127:** Added swipe hint creation function
**Lines 130-144:** Added lazy loading for carousel images
**Lines 147-197:** Improved touch event handlers with better swipe detection

### 2. `/custom/index.html` (maps to temp_dir/index.html)
**Changes made:**
- Added `defer` attribute to Lucide icons script for non-blocking load
- Added `defer` attribute to main scripts.js for faster page load
- **Preloaded critical images**: logo (0.JPG) and hero image (flatiron.webp)
- Only preloads above-the-fold images, carousel images load on-demand

**Lines 11-14:** Added defer and preload directives
**Line 697:** Added defer to scripts.js

### 3. `/custom/styles.css` (maps to temp_dir/styles.css)
**Changes made:**

#### Swipe Hint Indicator (Lines 744-792):
- Added animated swipe hint with left/right arrows
- Displays on mobile only (768px and below)
- Auto-fades in/out over 3 seconds
- Green background matching brand colors

#### Carousel Consolidation (to match page style):
- Portfolio section background: `var(--light-gray)` → `var(--white)`
- Carousel border-radius: `var(--radius-xl)` → `var(--radius-md)` (more subtle)
- Carousel shadow: `var(--shadow-xl)` → `var(--shadow-md)` (softer)
- Added border: `2px solid transparent` with transition
- Carousel slide background: `var(--white)` → `var(--light-gray)`
- Carousel content background: `var(--white)` → `var(--light-gray)`
- Carousel content padding: `var(--space-xl)` → `var(--space-lg)`
- Carousel h3 size: `2.5rem` → `2rem` with `font-weight: 800`
- Carousel location color: `var(--medium-gray)` → `var(--text-secondary)`
- Carousel location size: `1.1rem` → `0.95rem`

#### Mobile Enhancements (768px and below):
- Container width: 95% with reduced padding
- Hero section: auto min-height, reduced padding
- Hero typography: reduced sizes (h1, p)
- Full-width stacked CTAs (buttons at 100% width)
- Touch-friendly button sizes
- Reduced section padding across all sections
- Logo size: 66px → 50px
- Header padding reduced
- Better spacing for stats and features

#### Tablet Enhancements (1024px and below):
- Carousel height: 700px → 600px
- Adjusted carousel typography for tablets

#### Small Mobile (480px and below):
- Further reduced typography sizes
- Hero h1: 2.5rem → 2rem
- Section headers: 2rem → 1.75rem
- Reduced badge and tag sizes
- Smaller service card padding
- CTA features stack vertically
- Carousel optimizations for small screens

## Files to Upload to Your Server

When uploading to your server, you need to update these files in the `/custom/` directory:

1. **index.html** → Upload to `/custom/index.html` (or your main HTML file)
2. **scripts.js** → Upload to `/custom/scripts.js`
3. **styles.css** → Upload to `/custom/styles.css`

## Important Notes

- ✅ All file paths and references remain the same (e.g., `/custom/styles.css`, `/custom/static/0.JPG`)
- ✅ No HTML changes needed - the index.html file does not need to be updated
- ✅ All image paths and static asset references are preserved
- ✅ The changes are backward compatible and won't break existing functionality

## What Users Will See

After uploading these files:
- **Faster page load** - Critical images preload, carousel images load on-demand
- **Carousel slides change every 4 seconds** (instead of 2)
- **Visual swipe indicator** - Mobile users see animated "Swipe" hint with arrows
- **Improved swipe functionality** - Better touch detection that doesn't interfere with scrolling
- **Carousel looks integrated** - Softer shadows and backgrounds matching the rest of the page
- **Better mobile experience** - Touch-friendly buttons and responsive typography
- **Full-width CTAs on mobile** - Easier to tap on small screens
- **Deferred scripts** - JavaScript loads without blocking page render

## Testing Checklist

After uploading, test:
- [ ] Desktop: Carousel auto-advances every 4 seconds
- [ ] Desktop: Arrow buttons work
- [ ] Mobile: Swipe left/right changes slides
- [ ] Mobile: Buttons are full-width and easy to tap
- [ ] Mobile: Text is readable without zooming
- [ ] Tablet: Layout looks good at medium sizes
- [ ] All screen sizes: Carousel styling matches the rest of the page
