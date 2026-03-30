# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DePaul Mentor Center is a university business department AI mentoring platform. Students log in and chat with 2 AI mentor employees (Jordan/Mentor Therapist, Kathia/Mentor Program Manager). Each mentor has a unique personality, skills, and can search the web via SerpAPI.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **UI**: shadcn/ui (new-york style), Tailwind CSS v4, Lucide icons
- **Animations**: GSAP with custom hooks (useGsapFadeIn, useGsapStagger, useGsapIconHover)
- **Database**: Supabase (auth + PostgreSQL + RLS)
- **AI**: Anthropic Claude API (claude-haiku-4-5-20251001) with tool-calling loop
- **Search**: SerpAPI for web searches
- **Data Fetching**: SWR with server actions
- **Automation**: n8n webhook integration

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run lint     # ESLint
npx tsc --noEmit # Type check
```

## Architecture

### Data Flow (Chat)
```
ChatInput → handleSend() → useConversation().send() → sendMessage() server action
→ buildSystemPrompt() + callLLMWithTools() → Response stored in Supabase
→ Client polls via browser Supabase client (bypasses server action queue)
```

### Key Pattern: Polling During Generation
The client polls via **browser Supabase client** (not server actions) every 2s while `isSending=true`. This bypasses Next.js server action serialization. See `src/lib/hooks/use-chat.ts`.

### Key Pattern: Tool-Calling Loop
`callLLMWithTools()` in `src/lib/ai/anthropic.ts` implements a max-10-round agentic loop. On each `tool_use` stop, it executes tools in parallel via `Promise.all()`, appends results, and continues. After max rounds, a final call without tools is made.

### Route Structure
- `/` — Auth redirect
- `/login`, `/signup` — Auth pages
- `/dashboard` — Mentor card grid (main page)
- `/mentor/[id]/chat` — Chat interface with a specific mentor

### Key Directories
- `src/lib/ai/` — Anthropic integration, tool definitions, system prompt builder
- `src/lib/actions/` — Server actions (chat.ts for message orchestration, mentors.ts for data)
- `src/lib/hooks/` — SWR hooks (use-chat.ts with polling pattern, use-mentors.ts)
- `src/lib/animations/` — GSAP provider, presets, and hooks
- `src/lib/supabase/` — Browser client, server client, middleware
- `src/components/chat/` — Chat page, message list, input, conversation list
- `supabase/` — schema.sql and seed.sql for database setup

### Database Tables
`profiles`, `mentors`, `mentor_skills`, `conversations`, `messages` — all with RLS policies. Schema in `supabase/schema.sql`, seed data in `supabase/seed.sql`.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
ANTHROPIC_API_KEY
SERPAPI_API_KEY
N8N_WEBHOOK_BASE_URL
```
