# @hypershub/sdk

[![CI](https://github.com/simonguo/typescript-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/simonguo/typescript-sdk/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@hypershub/sdk.svg)](https://www.npmjs.com/package/@hypershub/sdk)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Official TypeScript SDK for [HypersHub](https://hypershub.com) — access Claude, GPT, Gemini and more through endpoint-aligned client resources.

## Repository

- GitHub: <https://github.com/simonguo/typescript-sdk>
- npm: <https://www.npmjs.com/package/@hypershub/sdk>
- Issues: <https://github.com/simonguo/typescript-sdk/issues>

## Installation

```bash
npm install @hypershub/sdk
```

## Quick Start

```typescript
import { HypersHub } from '@hypershub/sdk'

const client = new HypersHub({ apiKey: process.env.HYPERSHUB_API_KEY })

// Create a chat completion: POST /v1/chat/completions
const res = await client.chat.completions.create({
  model: 'claude-sonnet-4-6',
  messages: [{ role: 'user', content: 'Hello!' }],
})
console.log(res.choices[0].message.content)
```

## Responses

```typescript
// Create a response: POST /v1/responses
const response = await client.responses.create({
  model: 'gpt-5.4',
  input: 'Write a one-sentence product description.',
  max_output_tokens: 256,
})
console.log(response.output)

// Streaming
const stream = await client.responses.create({
  model: 'gpt-5.4',
  input: 'Explain edge computing in three bullets.',
  stream: true,
})
for await (const event of stream) {
  if (event.type === 'response.output_text.delta') {
    process.stdout.write(event.delta)
  }
}
```

## Chat Completions

```typescript
const stream = await client.chat.completions.create({
  model: 'claude-sonnet-4-6',
  messages: [{ role: 'user', content: 'Tell me a story.' }],
  stream: true,
})
for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0].delta.content ?? '')
}
```

## Anthropic Messages

```typescript
// Create a message: POST /v1/messages
const msg = await client.messages.create({
  model: 'claude-opus-4-7',
  messages: [{ role: 'user', content: 'What is 2 + 2?' }],
  max_tokens: 256,
})
console.log(msg.content[0])

// Streaming
const stream = await client.messages.create({
  model: 'claude-opus-4-7',
  messages: [{ role: 'user', content: 'Write a poem.' }],
  max_tokens: 1024,
  stream: true,
})
for await (const event of stream) {
  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
    process.stdout.write(event.delta.text)
  }
}
```

## Gemini

```typescript
// Generate content: POST /v1beta/models/{model}:generateContent
const res = await client.gemini.generateContent({
  model: 'gemini-3.1-pro-preview',
  contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
})
console.log(res.candidates[0]?.content.parts[0])

// Stream generate content: POST /v1beta/models/{model}:streamGenerateContent
const stream = await client.gemini.streamGenerateContent({
  model: 'gemini-3.1-pro-preview',
  contents: [{ role: 'user', parts: [{ text: 'Explain quantum computing.' }] }],
})
for await (const chunk of stream) {
  console.log(chunk.candidates[0]?.content.parts[0])
}
```

## Models

```typescript
// List models: GET /v1/models
const models = await client.models.list()
console.log(models.data.map((model) => model.id))

// Retrieve model: GET /v1/models/{model}
const model = await client.models.retrieve('claude-sonnet-4-6')
console.log(model.id)
```

## Resource Mapping

| SDK method | API endpoint |
| --- | --- |
| `client.chat.completions.create()` | `POST /v1/chat/completions` |
| `client.responses.create()` | `POST /v1/responses` |
| `client.messages.create()` | `POST /v1/messages` |
| `client.gemini.generateContent()` | `POST /v1beta/models/{model}:generateContent` |
| `client.gemini.streamGenerateContent()` | `POST /v1beta/models/{model}:streamGenerateContent` |
| `client.models.list()` | `GET /v1/models` |
| `client.models.retrieve(model)` | `GET /v1/models/{model}` |

## Error Handling

```typescript
import { HypersHubError, HypersHubAuthError, HypersHubRateLimitError } from '@hypershub/sdk'

try {
  await client.chat.completions.create({ ... })
} catch (err) {
  if (err instanceof HypersHubAuthError) {
    console.error('Invalid API key — check your HYPERSHUB_API_KEY')
  } else if (err instanceof HypersHubRateLimitError) {
    console.error('Rate limit hit, retry after a delay')
  } else if (HypersHubError.isHypersHubError(err)) {
    console.error(`API error ${err.status}: ${err.message}`)
  } else {
    throw err
  }
}
```

## Configuration

```typescript
const client = new HypersHub({
  apiKey: 'sk-hy-...',             // or set HYPERSHUB_API_KEY env var
  baseURL: 'https://hypershub.com',   // default
  defaultHeaders: {
    'X-Custom-Header': 'value',
  },
})
```

## Environment Variables

| Variable | Description |
| --- | --- |
| `HYPERSHUB_API_KEY` | Your HypersHub API key |

## Requirements

- Node.js ≥ 20 (native `fetch` required)

## License

MIT

## Development

```bash
git clone git@github.com:simonguo/typescript-sdk.git
cd typescript-sdk
npm install
npm run typecheck
npm test
npm run build
```

See also:

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [CHANGELOG.md](CHANGELOG.md)
- [SECURITY.md](SECURITY.md)

Publish beta:

```bash
npm publish --access public --tag beta
```

Publish stable via GitHub Trusted Publisher:

1. Bump `package.json` version and update `CHANGELOG.md`.
2. Commit and push to `main`.
3. Create and push a tag, for example `v0.3.0`.
4. Publish a GitHub Release for that tag, or run the `Publish` workflow manually.
