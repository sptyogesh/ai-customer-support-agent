# Spur – Founding Full-Stack Engineer Take-Home

A production-ready AI customer support chat application built for the Spur take-home assignment. This project features a React frontend, a NestJS backend, MongoDB for data persistence, and Google Gemini as the LLM provider.

## Features

- **Live Chat UI:** Modern interface with user/AI message distinction, timestamps, auto-scroll, and loading states.
- **Session Persistence:** Conversations are persisted in MongoDB and restored on reload using `localStorage`.
- **Gemini AI Integration:** Agent is seeded with domain knowledge (store policies) and generates contextual responses.
- **Robustness:** Input validation (truncation, empty checks) and graceful error handling for API failures.

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- MongoDB (local instance or MongoDB Atlas cluster)
- Google Gemini API Key

### 1. Database Setup

Ensure you have a MongoDB connection string ready.

### 2. Backend Setup

```bash
cd Backend
cp .env.example .env
```

Edit `Backend/.env` with your variables:
```env
DATABASE_URL="mongodb+srv://..."
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
CORS_ORIGIN="http://localhost:5173"
```

Install dependencies and sync the database schema:
```bash
npm install
npx prisma db push
npm run start:dev
```
The API will run at `http://localhost:3000`.

### 3. Frontend Setup

```bash
cd Frontend
cp .env.example .env
```

Edit `Frontend/.env` (default settings should work):
```env
VITE_API_BASE_URL="http://localhost:3000"
```

Install dependencies and start the app:
```bash
npm install
npm run dev
```
The chat UI will be accessible at `http://localhost:5173`.

## Architecture Overview

This project uses a monorepo structure separating the **Backend (NestJS)** and **Frontend (React + Vite)**.

### Backend Architecture
The backend follows a modular, layered architecture to separate concerns:
- **Controllers:** Handle HTTP requests and input validation (`ChatController`).
- **Services:** Contain business logic (`ChatService`, `GeminiService`).
- **Data Access:** Prisma ORM for type-safe database interactions (`PrismaModule`).

**Design Decisions:**
- **NestJS:** Chosen for its opinionated structure, dependency injection, and excellent TypeScript support.
- **MongoDB + Prisma:** Used for schema-less flexibility with Prisma providing strong type safety.
- **Stateless API:** Sessions are managed by the frontend passing a `sessionId`, allowing the backend to retrieve conversation history from the DB per request.

### Frontend Architecture
- **React + Vite:** For a fast, modern development experience.
- **Component-Based:** Separated into `ChatWindow`, `ChatInput`, and `MessageBubble` for reusability.
- **State Management:** React hooks manage conversation state and loading indicators. `localStorage` is used to persist the `sessionId`.

## LLM Notes

**Provider:** Google Gemini (`gemini-2.5-flash`).
*Chosen for its speed, generous free tier, and strong reasoning capabilities.*

**Prompting Strategy:**
The AI is instructed using a System Prompt to act as a helpful customer support agent.
Domain knowledge (Shipping, Returns, Refunds, Support Hours) is injected directly into the system prompt to seed the agent with "facts".
Conversation history (previous user and AI messages) is retrieved from the database and passed to the LLM to maintain context.

## Trade-offs & "If I had more time..."

**Trade-offs Made:**
- **Database:** MongoDB was used instead of Postgres. While Postgres is standard, MongoDB allowed faster iteration for simple document storage without dealing with complex migrations.
- **Auth:** Left out to keep the focus on the core chat functionality. Sessions are purely client-side UUIDs.
- **Knowledge Base:** Hardcoded domain knowledge in the prompt instead of setting up a RAG (Retrieval-Augmented Generation) pipeline with vector embeddings due to the 8-12 hour time constraint.

**If I had more time, I would:**
1. **Implement RAG:** Move domain knowledge into a vector database (like Pinecone or pgvector) and retrieve relevant context based on user queries, instead of stuffing the prompt.
2. **Add Redis Caching:** Cache recent conversation histories and frequently asked questions to reduce DB hits and LLM latency.
3. **Enhance UI/UX:** Add markdown rendering for AI responses, typing indicators, and a more polished design system (e.g., Tailwind CSS + shadcn/ui).
4. **Testing:** Add comprehensive unit tests (Jest) and end-to-end testing (Cypress/Playwright).
5. **Streaming:** Implement Server-Sent Events (SSE) to stream the LLM response chunk-by-chunk for a snappier user experience.

