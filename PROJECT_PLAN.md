# Birthday Memory Scrapbook - Project Plan

**Project Owner:** Christy  
**Project Name:** Secret Project (Birthday Website)  
**Deadline:** July 3, 2026  
**Status:** 🟡 In Progress (Days 3-4 of 14)  
**Updated:** 2026-06-19

---

## 📋 Executive Summary

A private, authenticated memory scrapbook web application for birthday celebrations. Users can create, edit, and view personal memories with optional image attachments. Phase 1 MVP focuses on core CRUD functionality. Phase 2 (post-launch) adds interactive features.

**Delivery Strategy:** Ship MVP by July 3 → Extend with Phase 2 features

---

## 🎯 MVP Scope (Phase 1)

### Core Features (Non-Negotiable)

| #   | Feature                                 | Status         | Owner | Est. Days |
| --- | --------------------------------------- | -------------- | ----- | --------- |
| 1   | Authentication (Email/Password)         | ✅ Complete    | Team  | 2         |
| 2   | Database Schema & RLS                   | ✅ Complete    | Team  | 1         |
| 3   | Memory CRUD (Create/Read/Update/Delete) | 🟡 In Progress | Team  | 3-4       |
| 4   | Image Upload & Storage                  | ⏳ Pending     | Team  | 2-3       |
| 5   | Responsive UI (Mobile/Desktop)          | 🟡 In Progress | Team  | 2         |
| 6   | User Data Isolation (RLS)               | ✅ Complete    | Team  | -         |
| 7   | Deploy to Production                    | ⏳ Pending     | Team  | 1         |
| 8   | Testing & Bug Fixes                     | ⏳ Pending     | Team  | 2-3       |

**MVP Total Estimated Time:** 14 days  
**Buffer:** 0 days (tight deadline)

---

## 🏗️ Technical Stack

| Component     | Technology            | Version |
| ------------- | --------------------- | ------- |
| Framework     | Next.js App Router    | 16.2.9  |
| Language      | TypeScript            | Latest  |
| Database      | Supabase PostgreSQL   | -       |
| Auth          | Supabase Auth         | -       |
| Storage       | Supabase Storage      | -       |
| Styling       | Tailwind CSS          | Latest  |
| UI Components | Custom + Lucide Icons | -       |
| Notifications | Sonner                | Latest  |
| Form State    | React Hook Form       | Latest  |
| Date Handling | date-fns              | Latest  |

---

## 📅 Day-by-Day Breakdown

### ✅ Days 1-2: Foundation (COMPLETE)

- [x] Project scaffold (Next.js + TypeScript + Tailwind)
- [x] Supabase project creation & configuration
- [x] Database schema design
  - [x] `memories` table with RLS policies
  - [x] User isolation via `user_id` foreign key
- [x] Authentication system
  - [x] Login page (`/login`)
  - [x] Session management
  - [x] Protected routes
  - [x] Logout functionality
- [x] Environment configuration (`.env.local`)
- [x] Verification: Build passes, no TypeScript errors

---

### 🟡 Days 3-4: Core Memory CRUD (IN PROGRESS)

**Objective:** Users can create, view, edit, and delete memories.

#### Day 3: Memory List & Detail View

- [x] Create `lib/utils/types.ts`
  - [x] `Memory` interface
  - [x] `MemoryFormValues` interface
- [x] Create `app/memories/page.tsx` (list container)
- [x] Create `app/memories/components/MemoryList.tsx` (card grid)
  - [x] Fetch user's memories with filtering
  - [x] Display title, date, preview text
  - [x] Loading/error/empty states
  - [x] Link to detail pages
- [x] Create `app/memories/[id]/page.tsx` (detail view)
  - [x] Fetch single memory by ID
  - [x] Display full content
  - [x] User ownership validation
- [x] Responsive grid layout (Tailwind mobile/desktop)
- [x] Verification: List page shows memories, detail page loads correctly

#### Day 4: Memory Create & Edit Forms

- [x] Create `app/memories/components/MemoryForm.tsx` (create/edit form)
  - [x] Title & content inputs
  - [x] Character count display
  - [x] Form validation (required fields, max length)
  - [x] Submit/cancel buttons
  - [x] Loading state
  - [x] Error handling & display
- [x] Create `app/memories/new/page.tsx` (create page)
  - [x] Route to MemoryForm
  - [x] Redirect to `/memories` on success
- [x] Create `app/memories/components/MemoryEditForm.tsx` (edit form)
  - [x] Pre-populate with existing memory
  - [x] Update form submission
  - [x] Reload on success
- [x] Add edit/delete buttons to detail page
  - [x] Edit modal/page flow
  - [x] Delete with confirmation
- [x] Type safety enforcement throughout
- [x] Verification: Create → Read → Update → Delete workflows tested

**Status:** ✅ All core CRUD done; awaiting image upload phase

---

### ⏳ Days 5-6: Image Upload (PENDING)

**Objective:** Users can upload images to memories; images display in gallery.

#### Day 5: Image Upload Infrastructure

- [ ] Create `lib/utils/imageCompression.ts`
  - [ ] Image size validation (max 5MB)
  - [ ] Client-side compression (width: 1200px, quality: 75%)
  - [ ] Dimension validation
- [ ] Update `MemoryForm.tsx`
  - [ ] Add file input field
  - [ ] Show image previews before upload
  - [ ] Display upload progress
  - [ ] Multiple image selection support
- [ ] Create Server Action `uploadImages()`
  - [ ] Upload to Supabase Storage bucket "memories"
  - [ ] Generate public URLs
  - [ ] Store URLs in `memory.image_urls` JSON array
  - [ ] Error handling & cleanup on failure
- [ ] Update database schema
  - [ ] Add `image_urls` (JSON array) column to `memories` table
  - [ ] Add migration script
- [ ] Verification: Upload image, see in Supabase Storage, URL persists

#### Day 6: Image Display & Gallery

- [ ] Create `app/memories/components/ImageGallery.tsx`
  - [ ] Display multiple images in grid layout
  - [ ] Lazy loading with placeholders
  - [ ] Error fallback (broken image icon)
  - [ ] Responsive sizing (mobile/tablet/desktop)
- [ ] Add lightbox/modal for full-size viewing
  - [ ] Next/prev navigation
  - [ ] Close on escape/backdrop click
  - [ ] Mobile-friendly touch gestures
- [ ] Update memory detail page
  - [ ] Integrate ImageGallery component
  - [ ] Show image count badge
- [ ] Optimize image loading
  - [ ] Use Next.js Image component where applicable
  - [ ] Add blur placeholder
- [ ] Verification: Create memory → Upload images → View gallery → Lightbox works

---

### ⏳ Days 7-9: Styling & UX Polish (PENDING)

**Objective:** Professional, cohesive design with smooth interactions.

#### Day 7: Design System & Color Palette

- [ ] Define Tailwind color theme
  - [ ] Primary: Romantic pink palette
  - [ ] Accents: Warm purples, gold
  - [ ] Neutrals: Cream, light gray
- [ ] Create reusable component library
  - [ ] Button variants (primary, secondary, danger)
  - [ ] Card components (memory card, image card)
  - [ ] Form inputs with consistent styling
  - [ ] Loading spinners & skeletons
- [ ] Update `tailwind.config.ts` with custom theme
- [ ] Apply to all existing pages
- [ ] Verification: Consistent styling across app

#### Day 8: Responsive Layout

- [ ] Mobile-first breakpoints review
  - [ ] sm: 640px
  - [ ] md: 768px
  - [ ] lg: 1024px
- [ ] Test all pages on device breakpoints
  - [ ] Memory list (card grid)
  - [ ] Memory detail (content layout)
  - [ ] Forms (input sizing)
  - [ ] Images (gallery responsiveness)
- [ ] Optimize touch targets for mobile
- [ ] Fix any overflow/layout issues
- [ ] Verification: App usable on mobile/tablet/desktop

#### Day 9: Interactions & Animations

- [ ] Add loading states
  - [ ] Skeleton screens for list
  - [ ] Spinners for form submissions
  - [ ] Image loading spinners
- [ ] Add success/error notifications (Sonner)
  - [ ] "Memory created!"
  - [ ] "Error uploading image"
  - [ ] etc.
- [ ] Smooth page transitions
  - [ ] Fade-in animations
  - [ ] Stagger effects for lists
- [ ] Hover effects on interactive elements
- [ ] Verification: Polished, professional feel

---

### ⏳ Days 10-11: Testing & Quality Assurance (PENDING)

**Objective:** Catch bugs, edge cases, and performance issues.

#### Day 10: Functional Testing

- [ ] Test all CRUD workflows end-to-end
  - [ ] Create memory (text only, with images)
  - [ ] View memory list & detail
  - [ ] Edit memory (text, add/remove images)
  - [ ] Delete memory (confirmation flow)
- [ ] Test edge cases
  - [ ] Very long text (character limits)
  - [ ] Large images (compression & upload)
  - [ ] Multiple images per memory
  - [ ] Empty list state
  - [ ] Network errors (simulate offline)
- [ ] Test authentication
  - [ ] Login/logout
  - [ ] Session persistence on page refresh
  - [ ] Redirect to login when not authenticated
- [ ] Test user isolation (RLS)
  - [ ] User A cannot see User B's memories
  - [ ] User A cannot delete User B's memories
- [ ] Verification: All workflows work correctly, no critical bugs

#### Day 11: Performance & Security

- [ ] Lighthouse audit
  - [ ] Performance > 80
  - [ ] Accessibility > 90
  - [ ] Best Practices > 90
  - [ ] SEO > 90
- [ ] Security review
  - [ ] Environment variables not exposed
  - [ ] RLS policies enforced correctly
  - [ ] No sensitive data in logs
  - [ ] CORS configured properly
- [ ] Image optimization review
  - [ ] Compression working
  - [ ] Load times acceptable
  - [ ] CDN/caching optimal
- [ ] Database query optimization
  - [ ] Check for N+1 queries
  - [ ] Review slow queries
- [ ] Verification: App meets performance & security standards

---

### ⏳ Days 12-13: Deployment (PENDING)

**Objective:** Live, accessible app at custom domain.

#### Day 12: Deploy to Production

- [ ] Choose hosting (Vercel recommended for Next.js)
- [ ] Set up deployment pipeline
  - [ ] Connect GitHub repo
  - [ ] Configure environment variables in production
  - [ ] Set up CI/CD (auto-deploy on push)
- [ ] Test production build locally
  - [ ] `npm run build` passes
  - [ ] `npm run start` runs without errors
- [ ] Deploy to staging environment
  - [ ] Test all workflows on staging
  - [ ] Verify database connections
  - [ ] Check error logging
- [ ] Deploy to production
  - [ ] Smoke test main workflows
  - [ ] Monitor error logs
  - [ ] Check Lighthouse scores in production
- [ ] Verification: App live at production URL

#### Day 13: Post-Launch Validation

- [ ] Manual testing on production
- [ ] Monitor error logs for 24 hours
- [ ] Check performance metrics
- [ ] User testing (if applicable)
- [ ] Document any issues for Phase 2
- [ ] Verification: Stable, no critical issues

---

### 🟤 Days 14-17: Buffer & Phase 2 Planning (OPTIONAL)

**Objective:** Reserve capacity for surprises; plan Phase 2 features.

#### Day 14: Bug Fixes & Refinements

- [ ] Address any production issues
- [ ] Optimize based on real user feedback
- [ ] Minor UX improvements

#### Days 15-17: Phase 2 Planning (No Work, Just Planning)

- [ ] Gather Phase 2 feature requirements
  - [ ] Interactive calendar room
  - [ ] Collaborative features
  - [ ] Advanced search/filters
  - [ ] etc.
- [ ] Design Phase 2 architecture
- [ ] Create Phase 2 project plan

---

## 📊 Progress Tracking

### Completed Milestones

| Milestone          | Date       | Status |
| ------------------ | ---------- | ------ |
| Project Setup      | 2026-06-18 | ✅     |
| Auth System        | 2026-06-18 | ✅     |
| Database Schema    | 2026-06-18 | ✅     |
| Memory CRUD        | 2026-06-19 | ✅     |
| Build Verification | 2026-06-19 | ✅     |

### Current Focus

- **Phase:** Days 3-4: Core Memory CRUD
- **Task:** Complete all CRUD workflows (create, read, update, delete)
- **Blocker:** None
- **Next:** Image upload infrastructure (Day 5)

---

## 🔗 Key Files Reference

### Configuration & Setup

- `.env.local` - Supabase credentials (NOT COMMITTED)
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind theme

### Core Authentication

- `app/login/page.tsx` - Login page
- `app/dashboard/page.tsx` - Post-login dashboard
- `app/supabase/client.ts` - Browser Supabase client
- `app/supabase/server.ts` - Server Supabase client

### Memory Management

- `lib/utils/types.ts` - TypeScript interfaces
- `app/memories/page.tsx` - Memory list page
- `app/memories/[id]/page.tsx` - Memory detail page
- `app/memories/new/page.tsx` - Create memory page
- `app/memories/components/MemoryForm.tsx` - Create/edit form component
- `app/memories/components/MemoryEditForm.tsx` - Edit form component
- `app/memories/components/MemoryList.tsx` - Memory list display component

### Styling

- `globals.css` - Global styles
- `tailwind.config.ts` - Tailwind configuration

---

## ⚠️ Known Issues & Resolutions

| Issue                                   | Status   | Resolution                                          |
| --------------------------------------- | -------- | --------------------------------------------------- |
| Dashboard email type error              | ✅ Fixed | Used nullish coalescing operator                    |
| Supabase server client wrong import     | ✅ Fixed | Imported `createServerClient` from correct package  |
| Supabase server client wrong parameters | ✅ Fixed | Changed to positional parameters with async wrapper |
| Memory detail invalid useEffect return  | ✅ Fixed | Moved rendering logic to component body             |

---

## 🚀 Launch Checklist (Pre-July 3)

### Week 1 (June 18-22)

- [x] Foundation (Days 1-2)
- [x] Core CRUD (Days 3-4)
- [ ] Image upload (Days 5-6)

### Week 2 (June 23-29)

- [ ] Styling & UX (Days 7-9)
- [ ] Testing (Days 10-11)

### Week 3 (June 30 - July 3)

- [ ] Deployment (Days 12-13)
- [ ] Buffer (Days 14-17)

---

## 📝 Notes

- **Availability:** 1-2 hours/day (tight timeline, prioritize ruthlessly)
- **Scope Lock:** MVP only, no scope creep
- **Phase 2 Deferred:** Interactive room, advanced features → post-launch
- **Communication:** Update this document daily with progress

---

## 👤 Team

| Role      | Name           | Responsibility         |
| --------- | -------------- | ---------------------- |
| Developer | Christy        | Implementation         |
| Architect | GitHub Copilot | Planning & Code Review |

---

**Last Updated:** 2026-06-19 by GitHub Copilot  
**Next Review:** Daily checkin for progress updates
