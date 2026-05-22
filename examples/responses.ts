/**
 * OpenAI Responses API
 *
 * Run:  npx tsx responses.ts
 *
 * Covers:
 *   - Non-streaming response
 *   - Streaming (response output text delta events)
 *   - Structured output items
 */

import 'dotenv/config'
import { HypersHub } from '@hypershub/sdk'

// API Key 从 .env 文件或环境变量读取
const client = new HypersHub()

// -------------------------------------------------------------------------
// 1. Non-streaming
// -------------------------------------------------------------------------
async function nonStreaming() {
  console.log('--- Responses (non-streaming) ---')

  const res = await client.responses.create({
    model: 'gpt-5.4',
    input: 'Write a one-sentence pitch for a coffee shop that also sells vinyl records.',
    max_output_tokens: 256,
  })

  for (const item of res.output) {
    if (item.type === 'message') {
      for (const content of (item as any).content) {
        if (content.type === 'output_text') {
          console.log(content.text)
        }
      }
    }
  }
  console.log()
}

// -------------------------------------------------------------------------
// 2. Streaming
// -------------------------------------------------------------------------
async function streaming() {
  console.log('--- Responses (streaming) ---')

  const stream = await client.responses.create({
    model: 'gpt-5.4',
    input: 'Explain the concept of "semantic versioning" in one paragraph.',
    stream: true,
  })

  for await (const event of stream) {
    if (event.type === 'response.output_text.delta') {
      process.stdout.write((event as any).delta)
    }
  }
  console.log('\n')
}

// -------------------------------------------------------------------------

await nonStreaming()
await streaming()
