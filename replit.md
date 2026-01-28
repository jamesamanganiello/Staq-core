# Staq GTM Tech Stack Health Check

## Overview

Staq is an AI-powered conversational intake application for GTM (Go-To-Market) tech stack health checks. The application uses Claude AI to conduct structured intake conversations with sales professionals, gathering information about their tools, processes, and pain points before a screen share consultation call.

The conversation follows a guided flow collecting:
- Contact information (name, email, role)
- Company details (extracted from URL)
- Sales team composition and size
- Sales motion characteristics (inbound/outbound ratio, deal velocity, etc.)
- Current tool stack (CRM, conversation intelligence, sales engagement, data providers)
- Primary goals for the consultation

Upon completion, the system:
1. Saves a preliminary analysis (red flags, focus areas, questions) for admin use only - NOT shown to customer
2. Displays a friendly completion screen prompting the user to schedule their screen share call
3. Opens Calendly in a modal for scheduling

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Animations**: Framer Motion for chat bubble transitions
- **Build Tool**: Vite with path aliases (@/, @shared/, @assets/)

The frontend consists of three main pages:
1. Landing page - introduces the service and starts new conversations
2. Chat page - displays the AI conversation interface with typing indicators
3. Completion screen - shows extracted data summary and Calendly scheduling

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful endpoints defined in shared/routes.ts with Zod validation
- **AI Integration**: Anthropic Claude API for conversational AI
- **Session Management**: UUID-based session IDs for conversation tracking

Key endpoints:
- `POST /api/chat/start` - Initialize new conversation
- `POST /api/chat/:sessionId/message` - Send user message and get AI response
- `GET /api/chat/:sessionId` - Retrieve conversation history

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: shared/schema.ts
- **Tables**:
  - `customers` - Customer records (id, company_name, contact_name, contact_email, created_at)
  - `conversation_logs` - Intake sessions (id, customer_id FK, session_id, full_transcript, extracted_data, preliminary_analysis, status, started_at, completed_at)
  - `messages` - Individual chat messages (id, conversation_log_id FK, role, content, created_at)
- **Views**:
  - `admin_intake_summary` - Admin dashboard view joining customers with conversation data

### Admin Panel
- **Route**: `/admin` (login page), `/admin/dashboard` (sessions list), `/admin/sessions/:id` (detail view)
- **Authentication**: Password-protected via `ADMIN_PASSWORD` environment variable, session-based (24-hour cookie)
- **Features**:
  - Sessions list with status filtering (completed/in-progress/abandoned)
  - Session detail with 4 tabs: Transcript, Extracted Data, Preliminary Analysis, Admin Notes
  - Auto-saving notes with timestamp
  - Export transcript as text file

### AI Conversation Design
The Claude system prompt (v2.0.0, 2026-01-28) implements:
- Natural conversation flow covering: company context → CRM → tool inventory → integrations → pain points → attribution → logistics
- Skip logic based on previous answers (e.g., don't ask about Salesforce if they use HubSpot)
- Collects seat counts and costs for each tool when known
- Generates estimated health score (0-100) in preliminary analysis
- JSON summary with company_context, crm, tools[], integrations, pain_points, attribution_readiness, logistics
- Version tracking logged at server startup

### Shared Code Structure
The `shared/` directory contains code used by both frontend and backend:
- `schema.ts` - Drizzle table definitions and Zod schemas
- `routes.ts` - API route definitions with type-safe request/response schemas

## External Dependencies

### AI Services
- **Anthropic Claude API** - Powers the conversational intake via `@anthropic-ai/sdk`
- Environment variables: `AI_INTEGRATIONS_ANTHROPIC_API_KEY`, `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`

### Database
- **PostgreSQL** - Primary data store
- Environment variable: `DATABASE_URL`
- Uses `connect-pg-simple` for session storage capability

### Scheduling Integration
- **Calendly** - For booking follow-up calls
- Environment variable: `VITE_CALENDLY_URL` (client-side)

### UI Component Libraries
- **shadcn/ui** - Pre-built accessible components (new-york style)
- **Radix UI** - Underlying primitive components
- **Lucide React** - Icon library

### Build & Development
- **Vite** - Frontend build tool with HMR
- **esbuild** - Server bundling for production
- **Drizzle Kit** - Database migrations (`npm run db:push`)