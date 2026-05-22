import { describe, it, expect, vi, afterEach } from 'vitest'
import { Responses } from '../../src/resources/responses.js'
import type { HypersHubClient } from '../../src/hypershub.js'
import type { ModelResponse, ResponseStreamEvent } from '../../src/types/responses.js'

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
  const body = `${lines.join('\n')}\n`
  return { _request: vi.fn().mockResolvedValue(new Response(body)) }
}

const baseResponse: ModelResponse = {
  id: 'resp_123',
  object: 'response',
  created_at: 1_714_000_000,
  status: 'completed',
  model: 'gpt-5.4',
  output: [
    {
      id: 'msg_123',
      type: 'message',
      role: 'assistant',
      status: 'completed',
      content: [{ type: 'output_text', text: 'Hello!', annotations: [] }],
    },
  ],
  usage: { input_tokens: 8, output_tokens: 3, total_tokens: 11 },
}

describe('Responses.create (non-streaming)', () => {
  it('POSTs to /v1/responses and returns parsed response', async () => {
    const client = makeClient(baseResponse)
    const responses = new Responses(client)

    const result = await responses.create({
      model: 'gpt-5.4',
      input: 'Hello',
      max_output_tokens: 256,
    })

    expect(client._request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/v1/responses',
        body: { model: 'gpt-5.4', input: 'Hello', max_output_tokens: 256 },
      }),
    )
    expect(result).toEqual(baseResponse)
  })

  it('passes rich response parameters through unchanged', async () => {
    const client = makeClient(baseResponse)
    const responses = new Responses(client)
    const params = {
      model: 'claude-sonnet-4-6',
      input: [{ role: 'user', content: 'Return JSON' }],
      instructions: 'Only return valid JSON.',
      reasoning_effort: 'medium' as const,
      temperature: 0.2,
      tools: [{ type: 'function', function: { name: 'lookup', parameters: { type: 'object' } } }],
      text: { format: { type: 'json_object' as const } },
      previous_response_id: 'resp_prev',
    }

    await responses.create(params)

    const call = (client._request as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.body).toEqual(params)
  })

  it('passes AbortSignal', async () => {
    const client = makeClient(baseResponse)
    const responses = new Responses(client)
    const controller = new AbortController()

    await responses.create({ model: 'gpt-5.4', input: 'Hello' }, controller.signal)

    expect(client._request).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    )
  })
})

describe('Responses.create (streaming)', () => {
  it('returns an AsyncGenerator of response stream events', async () => {
    const delta: ResponseStreamEvent = {
      type: 'response.output_text.delta',
      output_index: 0,
      content_index: 0,
      delta: 'Hello',
    }
    const completed: ResponseStreamEvent = {
      type: 'response.completed',
      response: baseResponse,
    }
    const client = makeSSEClient([
      `data: ${JSON.stringify(delta)}`,
      `data: ${JSON.stringify(completed)}`,
      'data: [DONE]',
    ])
    const responses = new Responses(client)

    const gen = await responses.create({ model: 'gpt-5.4', input: 'Hello', stream: true })

    expect(client._request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/v1/responses',
        body: { model: 'gpt-5.4', input: 'Hello', stream: true },
      }),
    )

    const results: ResponseStreamEvent[] = []
    for await (const event of gen) results.push(event)
    expect(results).toEqual([delta, completed])
  })
})
