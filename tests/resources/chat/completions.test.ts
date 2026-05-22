import { describe, it, expect, vi, afterEach } from 'vitest'
import { Completions } from '../../../src/resources/chat/completions.js'
import type { HypersHubClient } from '../../../src/hypershub.js'
import type { ChatCompletion, ChatCompletionChunk } from '../../../src/types/chat.js'

afterEach(() => vi.restoreAllMocks())

function makeClient(responseBody: unknown, status = 200): HypersHubClient {
  return {
    _request: vi.fn().mockResolvedValue(
      new Response(JSON.stringify(responseBody), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  }
}

function makeSSEClient(lines: string[]): HypersHubClient {
  const body = lines.join('\n') + '\n'
  return {
    _request: vi.fn().mockResolvedValue(new Response(body)),
  }
}

const baseChatCompletion: ChatCompletion = {
  id: 'chatcmpl-1',
  object: 'chat.completion',
  created: 1714000000,
  model: 'gpt-4o',
  choices: [
    {
      index: 0,
      message: { role: 'assistant', content: 'Hello!' },
      finish_reason: 'stop',
    },
  ],
  usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
}

describe('Completions.create (non-streaming)', () => {
  it('POSTs to /v1/chat/completions and returns parsed response', async () => {
    const client = makeClient(baseChatCompletion)
    const completions = new Completions(client)
    const result = await completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hi' }],
    })
    expect(client._request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', path: '/v1/chat/completions' }),
    )
    expect(result).toEqual(baseChatCompletion)
  })

  it('passes AbortSignal to client._request', async () => {
    const client = makeClient(baseChatCompletion)
    const completions = new Completions(client)
    const controller = new AbortController()
    await completions.create(
      { model: 'gpt-4o', messages: [{ role: 'user', content: 'Hi' }] },
      controller.signal,
    )
    expect(client._request).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    )
  })
})

describe('Completions.create (streaming)', () => {
  it('returns an AsyncGenerator of chunks', async () => {
    const chunk: ChatCompletionChunk = {
      id: 'chatcmpl-1',
      object: 'chat.completion.chunk',
      created: 1714000000,
      model: 'gpt-4o',
      choices: [{ index: 0, delta: { role: 'assistant', content: 'Hi' }, finish_reason: null }],
    }
    const client = makeSSEClient([
      `data: ${JSON.stringify(chunk)}`,
      'data: [DONE]',
    ])
    const completions = new Completions(client)
    const gen = await completions.create({ model: 'gpt-4o', messages: [], stream: true })

    const results: ChatCompletionChunk[] = []
    for await (const c of gen) results.push(c)

    expect(results).toHaveLength(1)
    expect(results[0]).toEqual(chunk)
  })
})

it('passes request body through unchanged for non-streaming calls', async () => {
  const client = makeClient(baseChatCompletion)
  const completions = new Completions(client)
  const params = {
    model: 'gpt-5.4',
    messages: [{ role: 'user' as const, content: 'Return JSON' }],
    tools: [
      {
        type: 'function' as const,
        function: {
          name: 'lookup',
          parameters: { type: 'object', properties: { id: { type: 'string' } } },
        },
      },
    ],
    tool_choice: 'auto' as const,
    response_format: { type: 'json_object' as const },
    max_completion_tokens: 128,
    reasoning_effort: 'low' as const,
  }

  await completions.create(params)

  const call = (client._request as ReturnType<typeof vi.fn>).mock.calls[0][0]
  expect(call.body).toEqual(params)
})

it('POSTs stream: true chat requests with stream preserved in the request body', async () => {
  const chunk: ChatCompletionChunk = {
    id: 'chatcmpl-1',
    object: 'chat.completion.chunk',
    created: 1714000000,
    model: 'gpt-5.4',
    choices: [{ index: 0, delta: { content: 'Hi' }, finish_reason: null }],
  }
  const client = makeSSEClient([`data: ${JSON.stringify(chunk)}`, 'data: [DONE]'])
  const completions = new Completions(client)

  await completions.create({ model: 'gpt-5.4', messages: [], stream: true })

  expect(client._request).toHaveBeenCalledWith(
    expect.objectContaining({
      method: 'POST',
      path: '/v1/chat/completions',
      body: { model: 'gpt-5.4', messages: [], stream: true },
    }),
  )
})
