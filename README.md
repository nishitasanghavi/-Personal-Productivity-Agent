# AI Calendar Management System (EventFlow)

## Overview

EventFlow is an AI-powered calendar and productivity system that organizes your schedule into a Kanban-style board. It helps users automatically:

- Generate tasks from events  
- Draft professional emails  
- Create daily & weekly plans  
- Identify free time slots  
- Spot backlog or “needs-action” items  

The application uses **Groq’s ultra-fast Llama 3 models** to turn event data into actionable insights — instant, structured, and reliable.

---

## User Preferences

> Preferred communication style: Simple, everyday language.  
(Used only for AI tone selection in summaries and emails.)

---

# System Architecture

## 🚀 Frontend Architecture

- **Framework:** React 18 + TypeScript  
- **Routing:** Wouter  
- **State Management:** TanStack Query (React Query)  
- **UI Components:** shadcn/ui (Radix UI powered)  
- **Styling:** Tailwind CSS + custom theme tokens  
- **Drag & Drop:** react-dnd (HTML5 backend)  
- **Design Style:** Linear/Notion-inspired modern productivity UI  

### Frontend Features

- Kanban-style event board  
- Event creation, editing, and categorization  
- Task lists linked to individual events  
- Weekly planner + daily planner  
- Backlog and Needs-Action detection  
- Sidebars, drawers, modals, tooltips  
- AI actions built directly into event details  

---

## 🧠 Backend Architecture

- **Runtime:** Node.js  
- **Framework:** Express  
- **Language:** TypeScript (ESM modules)  
- **API Style:** REST (`/api/*`)  
- **Environment Handling:** dotenv  
- **Dev Tooling:** tsx for development  

---

# 🗄️ Data Storage

- **Database:** SQLite  
- **ORM:** Drizzle ORM  
- **Migrations:** drizzle-kit  

### Event Schema (Simplified)

```txt
id, title, description
startTime, endTime
location, category
status, needsAction
