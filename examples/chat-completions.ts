/**
 * Chat Completions API — OpenAI-compatible
 *
 * Run:  npx tsx chat-completions.ts
 *
 * Covers:
 *   - Non-streaming (single response)
 *   - Streaming (real-time token by token)
 *   - Multi-turn conversation
 *   - Vision (image input)
 */

import 'dotenv/config'
import { HypersHub } from '@hypershub/sdk'

// API Key 从 .env 文件或环境变量读取
const client = new HypersHub()
// 也可指定 baseURL、timeout 等选项:
// const client = new HypersHub({ baseURL: 'https://apiclaw.cc', timeout: 60000 })

// -------------------------------------------------------------------------
// 1. Non-streaming — single response
// -------------------------------------------------------------------------
async function nonStreaming() {
  console.log('--- Non-streaming ---')

  const res = await client.chat.completions.create({
    model: 'gpt-5.4',
    messages: [
      { role: 'user', content: 'What is the capital of Japan?' },
    ],
  })

  console.log(res.choices[0].message.content)
  console.log(`Tokens: ${res.usage?.total_tokens ?? 'N/A'}\n`)
}

// -------------------------------------------------------------------------
// 2. Streaming — token by token
// -------------------------------------------------------------------------
async function streaming() {
  console.log('--- Streaming ---')

  const stream = await client.chat.completions.create({
    model: 'gpt-5.4',
    messages: [
      { role: 'user', content: 'Count from 1 to 5.' },
    ],
    stream: true,
  })

  let full = ''
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? ''
    full += delta
    process.stdout.write(delta)
  }
  console.log('\n')
}

// -------------------------------------------------------------------------
// 3. Multi-turn conversation
// -------------------------------------------------------------------------
async function multiTurn() {
  console.log('--- Multi-turn ---')

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    { role: 'user', content: 'My name is Alice.' },
    { role: 'assistant', content: 'Hello Alice! How can I help you today?' },
    { role: 'user', content: 'What is my name?' },
  ]

  const res = await client.chat.completions.create({
    model: 'gpt-5.4',
    messages,
  })

  console.log(`${res.choices[0].message.content}\n`)
}

// -------------------------------------------------------------------------
// 4. Vision — image input
// -------------------------------------------------------------------------
async function vision() {
  console.log('--- Vision ---')

  try {
    const res = await client.chat.completions.create({
      model: 'claude-haiku-4-5',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe the image in detail.' },
            {
              type: 'image_url',
              image_url: { url: 'https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png' },
            },
          ],
        },
      ],
    })

    console.log(`${res.choices[0].message.content}\n`)
  } catch (err) {
    console.log('(Vision skipped — backend cannot fetch external image URL)\n')
  }
}

// -------------------------------------------------------------------------

await nonStreaming()
await streaming()
await multiTurn()
await vision()
