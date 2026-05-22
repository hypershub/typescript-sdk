/**
 * Google Gemini API
 *
 * Run:  npx tsx gemini.ts
 *
 * Covers:
 *   - Non-streaming generateContent
 *   - Streaming via generateContent (stream: true)
 *   - Streaming via streamGenerateContent (explicit method)
 */

import 'dotenv/config'
import { HypersHub } from '@hypershub/sdk'

// API Key 从 .env 文件或环境变量读取
const client = new HypersHub()

// -------------------------------------------------------------------------
// 1. Non-streaming
// -------------------------------------------------------------------------
async function nonStreaming() {
  console.log('--- Gemini (non-streaming) ---')

  const res = await client.gemini.generateContent({
    model: 'claude-haiku-4-5',
    contents: [
      {
        role: 'user',
        parts: [{ text: 'What is the speed of light in km/s?' }],
      },
    ],
  })

  const text = (res.candidates?.[0]?.content?.parts?.[0] as any)?.text
  console.log(text ?? 'No response')
  console.log()
}

// -------------------------------------------------------------------------
// 2. Streaming (stream: true in generateContent)
// -------------------------------------------------------------------------
async function streaming() {
  console.log('--- Gemini (streaming) ---')

  const stream = await client.gemini.generateContent({
    model: 'claude-haiku-4-5',
    contents: [
      {
        role: 'user',
        parts: [{ text: 'Write a short poem about programming.' }],
      },
    ],
    stream: true,
  })

  for await (const chunk of stream) {
    const part = chunk.candidates?.[0]?.content?.parts?.[0] as any
    if (part?.text) process.stdout.write(part.text)
  }
  console.log('\n')
}

// -------------------------------------------------------------------------
// 3. streamGenerateContent (explicit method)
// -------------------------------------------------------------------------
async function explicitStream() {
  console.log('--- Gemini (explicit streamGenerateContent) ---')

  const stream = await client.gemini.streamGenerateContent({
    model: 'claude-haiku-4-5',
    contents: [
      {
        role: 'user',
        parts: [{ text: 'List three fun facts about space.' }],
      },
    ],
  })

  for await (const chunk of stream) {
    const part = chunk.candidates?.[0]?.content?.parts?.[0] as any
    if (part?.text) process.stdout.write(part.text)
  }
  console.log('\n')
}

// -------------------------------------------------------------------------

await nonStreaming()
await streaming()
await explicitStream()
