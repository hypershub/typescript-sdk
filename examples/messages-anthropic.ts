/**
 * Anthropic Messages API
 *
 * Run:  npx tsx messages-anthropic.ts
 *
 * Covers:
 *   - Non-streaming message
 *   - Streaming (content block delta events)
 *   - Extended thinking (Claude Opus 4.7)
 *   - System prompt
 */

import 'dotenv/config'
import { HypersHub } from '@hypershub/sdk'

// API Key 从 .env 文件或环境变量读取
const client = new HypersHub()

// -------------------------------------------------------------------------
// 1. Non-streaming
// -------------------------------------------------------------------------
async function nonStreaming() {
  console.log('--- Non-streaming ---')

  const msg = await client.messages.create({
    model: 'gpt-5.4',
    max_tokens: 256,
    messages: [
      { role: 'user', content: 'Write a haiku about TypeScript.' },
    ],
  })

  for (const block of msg.content) {
    if (block.type === 'text') {
      console.log(block.text)
    }
  }
  console.log(`Stop reason: ${msg.stop_reason}\n`)
}

// -------------------------------------------------------------------------
// 2. Streaming
// -------------------------------------------------------------------------
async function streaming() {
  console.log('--- Streaming ---')

  const stream = await client.messages.create({
    model: 'gpt-5.4',
    max_tokens: 256,
    messages: [
      { role: 'user', content: 'Tell me a short story about a robot.' },
    ],
    stream: true,
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      process.stdout.write(event.delta.text)
    }
  }
  console.log('\n')
}

// -------------------------------------------------------------------------
// 3. With system prompt
// -------------------------------------------------------------------------
async function withSystemPrompt() {
  console.log('--- With system prompt ---')

  const msg = await client.messages.create({
    model: 'gpt-5.4',
    max_tokens: 1024,
    system: 'You are a math tutor. Explain step by step.',
    messages: [
      { role: 'user', content: 'Solve 3x + 7 = 22 for x.' },
    ],
  })

  for (const block of msg.content) {
    if (block.type === 'text') {
      console.log('Answer:', block.text)
    }
  }
  console.log(`Usage: ${msg.usage?.input_tokens} in / ${msg.usage?.output_tokens} out\n`)
}

// -------------------------------------------------------------------------

await nonStreaming()
await streaming()
await withSystemPrompt()
