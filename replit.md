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

## Brand Design System

### Color Palette
- **Bright Cyan**: #00D4E8 (HSL: 186 100% 45%) - highlights, hover states, accents
- **Primary Cyan**: #00B4C4 (HSL: 185 100% 38%) - primary buttons, links
- **Deep Cyan**: #0099A8 (HSL: 184 100% 33%) - shadows, button hover states
- **Midnight**: #1A1A2E (HSL: 240 28% 14%) - dark backgrounds, headlines
- **Light Gray**: #F8F9FA (HSL: 210 17% 98%) - subtle backgrounds
- **Soft Cyan Tint**: #F0FDFF (HSL: 186 100% 97%) - chat background
- **Success Green**: #10B981 (HSL: 160 84% 39%) - success states

### Typography
- Headlines: Outfit font, Bold (700), tight letter-spacing
- Body: Inter font, Regular (400), line-height 1.6

### Page Layouts
- **Landing Page**: Midnight hero → White value props → Light gray "How It Works" → Midnight footer
- **Chat Page**: Midnight header with progress bar → Soft cyan chat area → White input footer
- **Admin Pages**: Midnight headers, Light gray backgrounds, branded status badges

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
The Claude system prompt (v3.0.0, 2026-02-03) implements:

**Hard Structural Constraints:**
- 20 Staq message budget (wraps up at message 17 regardless of progress)
- Mandatory Phase 4 (sales motion) BEFORE any tool questions
- NEVER asks seat counts, costs, contract details, or integration specifics during intake
- Tool questions limited to: identify → satisfaction 1-5 → ONE tease layer follow-up → move on
- No scheduling questions (Calendly on completion screen)

**Conversation Flow:**
1. Phase 1-2: Welcome + Contact Info (3 messages)
2. Phase 3: Company Context (2-3 messages) with URL extraction
3. Phase 4: Sales Motion (3-4 messages) - determines tool-fit analysis
4. Phase 5: Tool Inventory (6-8 messages) - CRM → Gong → Sales Engagement → Sales Navigator → Data/Enrichment → Other
5. Phase 6: Pain Points + Closing (2-3 messages)

**Tool Intelligence Features:**
- STAQ Knowledge Base embedded in prompt with all 9 tools
- Satisfaction probes with tool-specific failure modes
- Overlap detection for redundant tools
- Fit logic based on sales motion (e.g., Gong fit depends on call-heavy vs email)

**URL Extraction:**
- Real-time website parsing for company context
- Fallback to Claude training knowledge for well-known companies
- Only asks user for genuinely obscure companies

**Completion Summary:**
- New JSON structure with sales_motion, tool_fit_signals, potential_mismatches
- Preliminary analysis includes flags for screen share prep
- Version tracking logged at server startup

### URL Extraction System
- **Location**: server/url-extractor.ts
- **Dependencies**: axios (HTTP requests), cheerio (HTML parsing)
- **Functionality**: Fetches company websites and extracts title, meta description, headings, and main content
- **Security**: SSRF protections (blocks private IPs, localhost, only HTTP/HTTPS), 5MB content limit
- **Context gating**: Only extracts URLs early in conversation or when explicitly asked for company URL
- **Fallback**: If fetch fails AND company is unrecognized, prompts user for company description (never guesses)

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