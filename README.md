# AI Customer Support Chat Widget

A production-ready AI customer support chat application with a React frontend, NestJS backend, MongoDB database, and Google Gemini integration.

## Project Structure

```
Frontend/                 # React + Vite frontend
Backend/         # NestJS API server
```

## Features

- Modern chat UI with user/AI message bubbles, timestamps, and auto-scroll
- Session persistence via `localStorage` (survives page refresh)
- Conversation history stored in MongoDB
- Gemini-powered responses with seeded store knowledge (shipping, returns, refunds, support hours)
- Input validation (empty messages, 2000 char limit)
- Graceful error handling for API failures, rate limits, and timeouts

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key

## Quick Start

### 1. Database

Start MongoDB locally or use a MongoDB Atlas connection string.

### 2. Backend

```bash
cd Backend
cp .env.example .env
# Edit .env with your DATABASE_URL and GEMINI_API_KEY

npm install
npx prisma db push    # Apply schema to MongoDB
npm run start:dev
```

The API runs at `http://localhost:3000`.

### 3. Frontend

```bash
cd ai-widget
cp .env.example .env
npm install
npm run dev
```

The chat UI runs at `http://localhost:5173`.

## Environment Variables

### Backend (`Backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MongoDB connection string |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GEMINI_MODEL` | Gemini model name (default: `gemini-2.5-flash`) |
| `PORT` | Server port (default: 3000) |
| `CORS_ORIGIN` | Frontend URL for CORS (default: http://localhost:5173) |

### Frontend (`Frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API URL (default: http://localhost:3000) |

## API Reference

### POST `/chat/message`

Send a message and receive an AI reply.

**Request:**
```json
{
  "message": "What is your return policy?",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "reply": "Returns are accepted within 30 days of delivery. The product must be unused.",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### GET `/chat/history?sessionId={uuid}`

Retrieve all messages for a conversation.

**Response:**
```json
[
  {
    "id": "...",
    "conversationId": "...",
    "sender": "USER",
    "text": "What is your return policy?",
    "createdAt": "2026-06-09T12:00:00.000Z"
  }
]
```

## Database Schema

- **Conversation** — `id` (UUID), `createdAt`
- **Message** — `id` (UUID), `conversationId`, `sender` (USER | AI), `text`, `createdAt`

Prisma schema lives at `Backend/prisma/schema.prisma`.

```bash
# Regenerate Prisma client after schema changes
npm run prisma:generate

# Push schema changes to MongoDB
npm run prisma:push
```

## Production Build

```bash
# Backend
cd Backend
npm run build
npm run start:prod

# Frontend
cd Frontend
npm run build
npm run preview
```

Serve the frontend `dist/` folder via any static host (Nginx, Vercel, S3, etc.) and point `VITE_API_BASE_URL` to your deployed API.

## Architecture

### Backend

```
src/
├── chat/
│   ├── chat.controller.ts
│   ├── chat.service.ts
│   ├── dto/
│   └── entities/
├── gemini/
│   └── gemini.service.ts
├── prisma/
├── common/filters/
└── main.ts
```

### Frontend

```
src/
├── components/
│   ├── ChatWindow.tsx
│   ├── ChatInput.tsx
│   └── MessageBubble.tsx
├── services/
│   └── chatApi.ts
├── pages/
│   └── ChatPage.tsx
└── App.tsx
```

## License

UNLICENSED — private project.
# ai-customer-support-agent
