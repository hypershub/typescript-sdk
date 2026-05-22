/**
 * Chat Completions with Tools (Function Calling)
 *
 * Run:  npx tsx chat-with-tools.ts
 *
 * Demonstrates how to define tools, have the model call them,
 * execute the function locally, and feed the result back.
 */

import 'dotenv/config'
import { HypersHub } from '@hypershub/sdk'
import type { ChatMessage, Tool } from '@hypershub/sdk'

// API Key 从 .env 文件或环境变量读取
const client = new HypersHub()

// -------------------------------------------------------------------------
// Define a tool — get_weather
// -------------------------------------------------------------------------
const tools: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather for a city',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City name, e.g. Beijing' },
          unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
        },
        required: ['city'],
      },
    },
  },
]

// -------------------------------------------------------------------------
// Mock tool implementation
// -------------------------------------------------------------------------
function getWeather(city: string, unit = 'celsius'): string {
  const temp = unit === 'celsius' ? 22 : 72
  return `The weather in ${city} is ${temp}°${unit === 'celsius' ? 'C' : 'F'}, partly cloudy.`
}

// -------------------------------------------------------------------------
// Tool call loop
// -------------------------------------------------------------------------
async function main() {
  const messages: ChatMessage[] = [
    { role: 'user', content: 'What is the weather in Tokyo and Beijing?' },
  ]

  console.log('User:', messages[0].content, '\n')

  for (let i = 0; i < 5; i++) {
    const res = await client.chat.completions.create({
      model: 'gpt-5.4',
      messages,
      tools,
    })

    const choice = res.choices[0]
    const msg = choice.message

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      // Model responded with final answer
      console.log('Assistant:', msg.content)
      break
    }

    // Handle each tool call
    messages.push({ role: 'assistant', content: msg.content, tool_calls: msg.tool_calls })

    for (const toolCall of msg.tool_calls) {
      if (toolCall.function.name === 'get_weather') {
        const args = JSON.parse(toolCall.function.arguments)
        const result = getWeather(args.city, args.unit)
        console.log(`  Tool call: get_weather(${args.city}) -> ${result}`)

        messages.push({
          role: 'tool',
          content: result,
          tool_call_id: toolCall.id,
        })
      }
    }
  }
}

await main()
