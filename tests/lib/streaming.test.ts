import { describe, it, expect } from 'vitest'
import { parseSSE } from '../../src/lib/streaming.js'

function makeSSEResponse(lines: string[]): Response {
  const body = lines.join('\n') + '\n'
  return new Response(body)
}

async function collectAll<T>(gen: AsyncGenerator<T>): Promise<T[]> {
  const results: T[] = []
  for await (const item of gen) results.push(item)
  return results
}

describe('parseSSE', () => {
  it('yields parsed JSON objects from data lines', async () => {
    const response = makeSSEResponse([
      'data: {"id":"1","delta":"hello"}',
      'data: {"id":"2","delta":"world"}',
      'data: [DONE]',
    ])
    const gen = parseSSE<{ id: string; delta: string }>(response)
    const results = await collectAll(gen)
    expect(results).toEqual([
      { id: '1', delta: 'hello' },
      { id: '2', delta: 'world' },
    ])
  })

  it('stops at [DONE] sentinel', async () => {
    const response = makeSSEResponse([
      'data: {"id":"1"}',
      'data: [DONE]',
      'data: {"id":"2"}',
    ])
    const results = await collectAll(parseSSE<{ id: string }>(response))
    expect(results).toHaveLength(1)
    expect(results[0]).toEqual({ id: '1' })
  })

  it('skips non-data lines', async () => {
    const response = makeSSEResponse([
      ': keep-alive',
      'event: ping',
      'data: {"id":"1"}',
      'data: [DONE]',
    ])
    const results = await collectAll(parseSSE<{ id: string }>(response))
    expect(results).toEqual([{ id: '1' }])
  })

  it('skips malformed JSON lines', async () => {
    const response = makeSSEResponse([
      'data: not-valid-json',
      'data: {"id":"1"}',
      'data: [DONE]',
    ])
    const results = await collectAll(parseSSE<{ id: string }>(response))
    expect(results).toEqual([{ id: '1' }])
  })

  it('throws when response body is null', async () => {
    const response = new Response(null)
    await expect(async () => {
      for await (const _ of parseSSE(response)) { /* drain */ }
    }).rejects.toThrow('Response body is null')
  })

  it('handles empty stream', async () => {
    const response = makeSSEResponse([])
    const results = await collectAll(parseSSE(response))
    expect(results).toEqual([])
  })

  it('cancels reader when generator is broken early', async () => {
    const response = makeSSEResponse([
      'data: {"id":"1"}',
      'data: {"id":"2"}',
      'data: {"id":"3"}',
    ])
    const gen = parseSSE<{ id: string }>(response)
    const results: Array<{ id: string }> = []
    for await (const item of gen) {
      results.push(item)
      if (item.id === '1') break
    }
    expect(results).toEqual([{ id: '1' }])
    // Reader should have been cancelled; reading the response body should fail
    await expect(response.text()).rejects.toThrow()
  })

  it('logs a warning on malformed JSON lines', async () => {
    const warns: unknown[] = []
    const origWarn = console.warn
    console.warn = (...args) => { warns.push(args[0]) }

    try {
      const response = makeSSEResponse([
        'data: not-valid-json',
        'data: {"ok":true}',
        'data: [DONE]',
      ])
      const results = await collectAll(parseSSE<{ ok: boolean }>(response))
      expect(results).toEqual([{ ok: true }])
      expect(warns.length).toBeGreaterThan(0)
      expect(warns[0]).toContain('Failed to parse SSE chunk')
    } finally {
      console.warn = origWarn
    }
  })
})
