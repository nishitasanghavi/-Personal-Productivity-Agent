# Design Guidelines: AI Calendar Management System

## Design Approach
**Selected System**: Linear/Notion-inspired productivity design system
**Justification**: Information-dense productivity tool requiring clarity, efficiency, and sophisticated data visualization. Emphasizes content over decoration, with clean typography and purposeful spacing.

## Typography
**Font Stack**: Inter (primary), SF Mono (code/data)
- Headings: font-semibold, leading-tight
- H1: text-2xl (dashboard titles, page headers)
- H2: text-xl (section headers, modal titles)
- H3: text-lg (card headers, event titles)
- Body: text-sm, leading-relaxed (event descriptions, task lists)
- Small: text-xs (metadata, timestamps, labels)
- Mono: text-xs font-mono (JSON preview, technical data)

## Layout System
**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12
- Component padding: p-4, p-6
- Section spacing: space-y-6, gap-4
- Card margins: m-2, m-4
- Tight groupings: gap-2
- Generous sections: p-8, p-12

**Grid Structure**:
- Main layout: Sidebar (w-64) + Main content (flex-1)
- Kanban columns: grid-cols-5 with equal widths
- Calendar grid: 7-column grid for days
- Responsive: Stack sidebar below on mobile, single column Kanban

## Core Components

### Navigation Sidebar
- Fixed left sidebar (w-64, h-screen)
- Logo/branding at top (p-6)
- Navigation items: p-3, rounded-lg, gap-3 with icons
- Active state: distinct background treatment
- Bottom section: User profile, settings (p-4)

### Kanban Board
- 5 equal-width columns: Today, This Week, Upcoming, Backlog, Needs Action
- Column headers: sticky top-0, p-4, border-b
- Event cards: rounded-lg, p-4, shadow-sm, space-y-2
  - Event title (font-semibold, text-sm)
  - Time badge (text-xs, px-2, py-1, rounded)
  - Description preview (text-xs, line-clamp-2)
  - Drag handle icon (top-right)
- Drag states: opacity-50 while dragging, border-2 on drop target
- Empty state: centered text with icon

### Traditional Calendar View
- Month header: text-xl font-semibold, navigation arrows
- Day grid: 7 columns, equal height rows
- Day cells: p-2, min-h-24
  - Day number (text-xs, top-left)
  - Event pills: text-xs, px-2, py-1, rounded, truncate
  - Max 3 events shown, "+N more" indicator
- Current day: border-2 treatment
- Hover states: subtle background on cells

### Event Detail Modal
- Overlay: fixed inset-0, backdrop-blur
- Modal: max-w-2xl, rounded-xl, p-6
- Header: Event title (text-xl), close button
- Tabs: Details, AI Tasks, Draft Email (text-sm, border-b)
- Content sections: space-y-4
  - Time/location with icons
  - Description (text-sm)
  - AI-generated content (p-4, rounded-lg, border)
- Actions: flex gap-2, justify-end

### AI Features Panel
- Collapsible right panel (w-80)
- Section cards: rounded-lg, p-4, space-y-3
  - Week Summary (AI-generated overview)
  - Daily Plan (chronological task list)
  - Free Slots (time blocks with "Schedule" button)
- Action buttons: w-full, justify-between
- Loading states: skeleton placeholders

### Upload Interface
- Dropzone: border-2 border-dashed, rounded-xl, p-12, text-center
- Upload icon (w-12, h-12)
- Instructions: text-sm
- File preview: rounded-lg, p-4, flex items-center, gap-3
  - File icon, name, size
  - Remove button (text-xs)

### Task List Component
- Checkbox input (w-4, h-4, rounded)
- Task text: text-sm, flex-1
- Priority badge: text-xs, px-2, rounded-full
- Due date: text-xs, tabular-nums
- Row spacing: py-2, border-b last:border-0

## Icons
**Library**: Heroicons (outline for most, solid for active states)
- Calendar, clock, drag handle, plus, chevrons, x-mark, check, sparkles (AI), inbox, list

## Component Patterns
- Cards: rounded-lg, shadow-sm, border, hover:shadow-md transition
- Buttons: px-4, py-2, rounded-lg, font-medium, text-sm
  - Primary: solid background
  - Secondary: border treatment
  - Ghost: hover background only
- Inputs: p-2.5, rounded-lg, border, text-sm
- Badges: px-2, py-1, rounded, text-xs, font-medium
- Dividers: border-t, my-4

## Animations
**Minimal, purposeful only**:
- Drag-and-drop: smooth transform, 200ms
- Modal entry: fade + scale, 150ms
- Hover states: background transition, 100ms
- No scroll-triggered or decorative animations

## Accessibility
- Focus rings on all interactive elements (ring-2, ring-offset-2)
- Sufficient contrast ratios for all text
- Keyboard navigation for drag-and-drop (arrow keys + enter)
- ARIA labels for calendar grids and event cards
- Screen reader announcements for AI operations

## Responsive Behavior
- Desktop (lg): Full sidebar + Kanban columns + AI panel
- Tablet (md): Collapsible sidebar, 3 Kanban columns
- Mobile: Bottom nav, single column Kanban, full-width calendar
- Touch targets: min-h-11 for all buttons and interactive elements