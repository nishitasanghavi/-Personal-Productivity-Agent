# AI Calendar Management System

## Overview

This is an AI-powered calendar management application that organizes events in a Kanban-style board with intelligent task generation and scheduling assistance. The system allows users to view, manage, and organize calendar events across different time-based columns (Today, This Week, Upcoming, Backlog, Needs Action), with AI features powered by Google's Gemini for generating tasks, summaries, and email drafts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state with caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **Drag and Drop**: react-dnd with HTML5 backend for Kanban board and calendar interactions
- **Design System**: Linear/Notion-inspired productivity design with Inter font, clean typography, and information-dense layouts

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints under `/api` prefix
- **Build Tool**: Vite for frontend, esbuild for server bundling

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema**: Two main tables - `events` (calendar events) and `tasks` (AI-generated tasks linked to events)
- **Migrations**: Managed via drizzle-kit with push command

### AI Integration
- **Provider**: Google Gemini API (`@google/genai`)
- **Features**: 
  - Task generation from events
  - Weekly summaries
  - Daily planning
  - Email draft generation
  - Free slot detection

### Key Design Patterns
- **Monorepo Structure**: Client code in `/client`, server in `/server`, shared types in `/shared`
- **Path Aliases**: `@/` for client sources, `@shared/` for shared code
- **API Client**: Centralized `apiRequest` function with TanStack Query integration
- **Theme System**: Light/dark mode with CSS custom properties and ThemeProvider context

## External Dependencies

### Third-Party Services
- **Google Gemini API**: AI features for task generation, summaries, and content creation (requires `GEMINI_API_KEY` environment variable)

### Database
- **PostgreSQL**: Primary data store (requires `DATABASE_URL` environment variable)
- **connect-pg-simple**: Session storage in PostgreSQL

### Key Libraries
- **Radix UI**: Accessible component primitives (dialog, dropdown, popover, tabs, etc.)
- **date-fns**: Date manipulation and formatting
- **Zod**: Schema validation for API requests and responses
- **react-day-picker**: Calendar date picker component
- **vaul**: Drawer component for mobile interfaces