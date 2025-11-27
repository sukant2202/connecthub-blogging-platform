# ConnectHub - Social Media Platform Design Guidelines

## Design Approach
**Hybrid Reference-Based:** Drawing inspiration from Twitter/X's clean feed interface, LinkedIn's professional profile layouts, and Instagram's content-first approach. Prioritizing content readability and efficient interaction patterns while maintaining modern visual appeal.

## Core Design Principles
1. **Content-First Architecture:** Posts and user interactions are the primary focus
2. **Scan-Friendly Hierarchy:** Clear visual distinction between different content types
3. **Interaction Clarity:** All social actions (like, comment, follow) immediately recognizable
4. **Responsive Efficiency:** Seamless experience from mobile to desktop

---

## Typography System

**Font Families:**
- Primary: Inter or System UI stack via Google Fonts
- Monospace: JetBrains Mono for usernames/handles

**Hierarchy:**
- Page Titles: text-3xl font-bold (Profile headers, page headings)
- Section Headers: text-xl font-semibold
- Post Content: text-base leading-relaxed
- Usernames: text-sm font-medium
- Metadata (timestamps, counts): text-xs text-gray-500
- Button Text: text-sm font-medium
- Form Labels: text-sm font-medium

---

## Layout System

**Spacing Scale:** Use Tailwind units of **2, 3, 4, 6, 8, 12, 16** for consistent rhythm
- Component padding: p-4 or p-6
- Section spacing: space-y-6 or space-y-8
- Card gaps: gap-3 or gap-4
- Button padding: px-4 py-2 or px-6 py-3

**Grid Structure:**
- Desktop: Three-column layout (navigation sidebar 256px fixed, main feed max-w-2xl center, suggestions sidebar 320px)
- Tablet: Two-column (collapsible nav, main feed)
- Mobile: Single column, bottom navigation bar

**Container Widths:**
- Feed content: max-w-2xl
- Profile content: max-w-4xl
- Forms: max-w-md
- Full app wrapper: max-w-7xl

---

## Component Library

### Navigation
**Top Navigation Bar:**
- Fixed height: h-16
- Logo/brand left, search center, user menu right
- Search input: w-96 max-w-full on desktop
- Desktop: horizontal with all options visible
- Mobile: Condensed with hamburger menu + bottom nav bar (h-16)

**Bottom Navigation (Mobile):**
- 4-5 primary actions: Home, Explore, Compose, Profile, Notifications
- Icons with labels on tap
- Active state: filled icon with underline indicator

### Feed & Posts

**Post Card:**
- Border: border rounded-lg
- Padding: p-4 or p-6
- Avatar: w-10 h-10 rounded-full (left aligned)
- Content area: ml-12 (leaves space for avatar)
- Image attachments: rounded-lg mt-3 max-h-96 object-cover
- Action bar: flex justify-between items-center mt-4 with like, comment, share buttons
- Spacing between posts: space-y-4

**Post Composer:**
- Prominent textarea with min-h-32
- Avatar displayed alongside input
- Image URL input field below main textarea
- Character count indicator
- Primary CTA button (Post/Publish) - px-6 py-2.5

### User Profiles

**Profile Header:**
- Cover area: h-48 (can be placeholder gradient)
- Avatar: w-24 h-24 rounded-full with border-4 positioned -mt-12
- Bio section: max-w-lg with leading-relaxed
- Stats row: flex gap-6 showing Posts/Followers/Following counts
- Action buttons: Follow/Edit Profile aligned right - px-4 py-2

**Profile Tabs:**
- Posts, Media, Likes sections as tabs
- Underline indicator for active tab
- Tab content: Grid or list of post cards

### Interactions

**Like Button:**
- Heart icon, text-base size
- Displays count next to icon
- Active state: filled heart

**Comment Section:**
- Nested layout with connecting lines for thread visualization
- Individual comment: border-l-2 pl-4 ml-8
- Reply input: Always visible at thread end

**Follow Button:**
- Two states: "Follow" (primary) and "Following" (secondary/outline)
- px-4 py-2 rounded-full
- Hover shows "Unfollow" when following

### Forms (Auth & Profile Edit)

**Login/Register Pages:**
- Centered card: max-w-md mx-auto with p-8
- Large heading: text-2xl font-bold mb-6
- Input fields: h-11 with px-3, space-y-4 between fields
- Submit button: w-full py-3 rounded-lg
- Switch link: text-sm with underline at bottom

**Input Fields:**
- Consistent height: h-11
- Border: border rounded-md
- Focus: ring-2 treatment
- Label above: text-sm font-medium mb-1.5

### Modals & Overlays

**Post Details Modal:**
- max-w-4xl with two-column layout on desktop
- Left: Full post with image
- Right: Comments thread (scrollable)
- Mobile: Single column stacked

**Confirmation Dialogs:**
- max-w-sm centered
- Clear heading, body text, action buttons
- Padding: p-6

---

## Page-Specific Layouts

**Home Feed:**
- Three-column desktop layout
- Infinite scroll with "Load More" trigger
- New posts indicator at top

**Explore Page:**
- Grid layout for discovery: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
- Larger post previews with images prominent

**Single Post Detail:**
- Centered post card with full width comments below
- Breadcrumb or back navigation at top

---

## Images

**Profile Avatars:**
- Circular crops throughout
- Sizes: 40px (posts), 48px (comments), 96px (profile headers)
- Default placeholder: User initials on gradient

**Post Images:**
- Aspect ratio: Maintain original but max-height constraint
- Treatment: rounded-lg with subtle shadow
- Placement: Below post text with mt-3

**Hero Section (Landing/Marketing - if applicable):**
- Split layout: text left (max-w-lg), illustration/screenshot right
- Height: min-h-screen on desktop, stacked on mobile
- CTA buttons with backdrop-blur-sm if overlaying imagery

**Cover Images (Profiles):**
- Aspect ratio: ~4:1 (e.g., h-48 full-width)
- Placeholder: Gradient or pattern if no custom image

---

## Responsive Breakpoints

- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (md-lg)  
- Desktop: > 1024px (xl)

**Key Adaptations:**
- Navigation: Top bar → Bottom nav on mobile
- Sidebars: Hidden on mobile, toggleable on tablet
- Grids: 3-col → 2-col → 1-col
- Post cards: Reduced padding on mobile (p-4 → p-3)

---

## Accessibility

- All interactive elements minimum 44px touch target
- Form inputs with visible labels and placeholders
- Focus states with 2px ring offset
- Alt text for all images
- Semantic HTML throughout (nav, main, article, aside)

---

## Animation (Minimal)

- Page transitions: None (instant navigation)
- Like button: Scale transform on click (scale-110 briefly)
- Modals: Fade in with slight scale (from 95% to 100%)
- Loading states: Skeleton screens matching content layout
- No scroll-triggered or continuous animations