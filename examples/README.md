# @hypershub/sdk Examples

Run any example with `npx tsx`:

```bash
cp .env.example .env
# 然后将 API Key 写入 .env 文件

npm install
npx tsx chat-completions.ts
```

## Examples

| File | Topics |
|---|---|
| [chat-completions.ts](chat-completions.ts) | Non-streaming, streaming, multi-turn, vision |
| [chat-with-tools.ts](chat-with-tools.ts) | Tool/function calling with tool result loop |
| [messages-anthropic.ts](messages-anthropic.ts) | Anthropic Messages API, streaming, system prompt |
| [responses.ts](responses.ts) | OpenAI Responses API, non-streaming & streaming |
| [gemini.ts](gemini.ts) | Google Gemini, generateContent & streamGenerateContent |
| [models.ts](models.ts) | List and retrieve available models |
| [error-handling.ts](error-handling.ts) | HypersHubError hierarchy, type guards, status dispatch |

## Prerequisites

- Node.js >= 18
- A HypersHub API key, set in `.env` file:
  ```
  HYPERSHUB_API_KEY=sk-hy-...
  ```
