import { describe, it, expect, vi, afterEach } from 'vitest'
import { Messages } from '../../src/resources/messages.js'
import type { HypersHubClient } from '../../src/hypershub.js'
import type { Message, MessageStreamEvent } from '../../src/types/messages.js'

afterEach(() => vi.restoreAllMocks())

function makeClient(responseBody: unknown): HypersHubClient {
  return {
    _request: vi.fn().mockResolvedValue(
      new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  }
}

function makeSSEClient(lines: string[]): HypersHubClient {
  const body = lines.join('\n') + '\n'
  return { _request: vi.fn().mockResolvedValue(new Response(body)) }
}

const baseMessage: Message = {
  id: 'msg_01',
  type: 'message',
  role: 'assistant',
  content: [{ type: 'text', text: 'Hello!' }],
  model: 'claude-3-5-sonnet',
  stop_reason: 'end_turn',
  stop_sequence: null,
  usage: { input_tokens: 10, output_tokens: 5 },
}

describe('Messages.create (non-streaming)', () => {
  it('POSTs to /v1/messages with anthropic-version header', async () => {
    const client = makeClient(baseMessage)
    const messages = new Messages(client)
    const result = await messages.create({
      model: 'claude-3-5-sonnet',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 1024,
    })
    expect(client._request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/v1/messages',
        headers: { 'anthropic-version': '2023-06-01' },
      }),
    )
    expect(result).toEqual(baseMessage)
  })

  it('passes AbortSignal', async () => {
    const client = makeClient(baseMessage)
    const messages = new Messages(client)
    const controller = new AbortController()
    await messages.create(
      { model: 'claude-3-5-sonnet', messages: [], max_tokens: 100 },
      controller.signal,
    )
    expect(client._request).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    )
  })
})

describe('Messages.create (streaming)', () => {
  it('returns an AsyncGenerator of events', async () => {
    const event: MessageStreamEvent = {
      type: 'message_start',
      message: {
        id: 'msg_01',
        type: 'message',
        role: 'assistant',
        content: [],
        model: 'claude-3-5-sonnet',
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 0 },
      },
    }
    const client = makeSSEClient([`data: ${JSON.stringify(event)}`, 'data: [DONE]'])
    const messages = new Messages(client)
    const gen = await messages.create({
      model: 'claude-3-5-sonnet',
      messages: [],
      max_tokens: 100,
      stream: true,
    })

    const results: MessageStreamEvent[] = []
    for await (const e of gen) results.push(e)
    expect(results).toHaveLength(1)
    expect(results[0]).toEqual(event)
  })
})

it('passes rich Anthropic Messages parameters through unchanged', async () => {
  const client = makeClient(baseMessage)
  const messages = new Messages(client)
  const params = {
    model: 'claude-opus-4-7',
    messages: [{ role: 'user' as const, content: 'Solve it carefully' }],
    max_tokens: 16000,
    system: 'Be concise.',
    thinking: { type: 'enabled' as const, budget_tokens: 10000 },
    tools: [{ name: 'lookup', input_schema: { type: 'object' } }],
    tool_choice: { type: 'auto' as const },
    metadata: { user_id: 'user_123' },
  }

  await messages.create(params)

  const call = (client._request as ReturnType<typeof vi.fn>).mock.calls[0][0]
  expect(call.body).toEqual(params)
  expect(call.headers).toEqual({ 'anthropic-version': '2023-06-01' })
})

it('POSTs streaming Anthropic Messages requests with stream preserved in the body', async () => {
  const event: MessageStreamEvent = {
    type: 'message_stop',
  }
  const client = makeSSEClient([`data: ${JSON.stringify(event)}`, 'data: [DONE]'])
  const messages = new Messages(client)

  await messages.create({
    model: 'claude-sonnet-4-6',
    messages: [],
    max_tokens: 100,
    stream: true,
  })

  expect(client._request).toHaveBeenCalledWith(
    expect.objectContaining({
      method: 'POST',
      path: '/v1/messages',
      body: { model: 'claude-sonnet-4-6', messages: [], max_tokens: 100, stream: true },
      headers: { 'anthropic-version': '2023-06-01' },
    }),
  )
})
