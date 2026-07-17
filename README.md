# Gemini API Gateway

A developer proxy gateway for secure, custom token authorization with Gemini models. Create and manage custom API keys with full analytics, playground, and multi-model proxy access using Gemini 3.5 Flash.

## Features
- 🔑 Custom API key creation and management
- 📊 Request analytics, success rate, latency tracking
- 🧪 Built-in playground for testing
- 📝 Request logs with model distribution
- 🔒 Model-level permissions per key
- 🚀 Express + Vite + React

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` or `.env` and set your keys:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key
   APP_URL=http://localhost:3000
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## Build for Production

```bash
npm run build
npm start
```

## API Gateway

Once running, forward your SDK and REST traffic through:

```
{APP_URL}/api/v1beta/models/{model}:{method}
```

Example:
- `POST /api/v1beta/models/gemini-3.5-flash:generateContent`
- `POST /api/v1beta/models/gemini-2.5-flash:generateContent`

Provide your custom gateway key via `x-goog-api-key` header, `Authorization: Bearer <key>`, or `?key=` query param.

## Project Structure

- `server.ts` - Express server with Vite middleware and Gemini proxy logic
- `src/` - React frontend (dashboard, keys table, playground, logs)
- `src/lib/db.ts` - In-memory DB for keys/logs (replace with persistent DB for prod)
